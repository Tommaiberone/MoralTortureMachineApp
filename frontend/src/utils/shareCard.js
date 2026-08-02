// Client-side moral archetype share card generator (TASK-31).
//
// Renders two fixed formats — Stories (1080x1920, 9:16) and square
// (1080x1080, 1:1) — onto an offscreen canvas and returns a PNG data URL.
// No AI, no server round trip, no paid rendering service: this is exactly
// the "generate social cards client-side or from cached deterministic
// templates" cost rule in CLAUDE.md. Percentile is intentionally omitted
// until TASK-28 (MoralProfiles) gives a real population to rank against;
// fabricating one here would violate the "archetypes are deterministic and
// testable" product rule.

const FONT_FAMILY = "'Courier New', Courier, monospace";
const DEEP_LINK_LABEL = 'moraltorturemachine.com';

const FORMATS = {
  stories: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
};

// Shrinks the font size until the text fits within maxLines at maxWidth, so
// the longer Italian strings never overflow the card (AC2) while staying
// legible at a sane minimum size (AC3).
const fitText = (ctx, text, { maxWidth, maxLines, startSize, minSize, weight = 'normal' }) => {
  let fontSize = startSize;
  let lines = [];
  while (fontSize >= minSize) {
    ctx.font = `${weight} ${fontSize}px ${FONT_FAMILY}`;
    lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { fontSize, lines };
    fontSize -= 4;
  }
  ctx.font = `${weight} ${fontSize}px ${FONT_FAMILY}`;
  return { fontSize, lines: lines.slice(0, maxLines) };
};

/**
 * @param {{name: string, sharePhrase: string, visual: {emoji: string, color: string}}} archetype
 * @param {'stories'|'square'} format
 * @returns {string} PNG data URL
 */
export const generateShareCardDataUrl = (archetype, format = 'stories') => {
  const { width, height } = FORMATS[format] || FORMATS.stories;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const margin = width * 0.1;
  const maxWidth = width - margin * 2;
  const accent = archetype.visual?.color || '#8B0000';

  // Background: dark base with a subtle vertical tint toward the archetype's
  // own accent color, matching the site's horror-themed palette.
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0a0a0a');
  gradient.addColorStop(0.5, '#151515');
  gradient.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = width * 0.012;
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#888888';
  ctx.font = `${width * 0.024}px ${FONT_FAMILY}`;
  ctx.fillText('MORAL TORTURE MACHINE', width / 2, height * 0.1);

  ctx.font = `${width * 0.13}px ${FONT_FAMILY}`;
  ctx.fillText(archetype.visual?.emoji || '', width / 2, height * 0.28);

  const name = fitText(ctx, archetype.name, {
    maxWidth,
    maxLines: 2,
    startSize: width * 0.07,
    minSize: width * 0.04,
    weight: 'bold',
  });
  ctx.fillStyle = '#f2f2f2';
  let y = height * 0.38;
  const nameLineHeight = name.fontSize * 1.2;
  for (const line of name.lines) {
    ctx.font = `bold ${name.fontSize}px ${FONT_FAMILY}`;
    ctx.fillText(line, width / 2, y);
    y += nameLineHeight;
  }

  const phrase = fitText(ctx, `"${archetype.sharePhrase}"`, {
    maxWidth,
    maxLines: 4,
    startSize: width * 0.038,
    minSize: width * 0.024,
  });
  ctx.fillStyle = '#cccccc';
  y += height * 0.04;
  const phraseLineHeight = phrase.fontSize * 1.4;
  for (const line of phrase.lines) {
    ctx.font = `${phrase.fontSize}px ${FONT_FAMILY}`;
    ctx.fillText(line, width / 2, y);
    y += phraseLineHeight;
  }

  ctx.fillStyle = accent;
  ctx.font = `${width * 0.03}px ${FONT_FAMILY}`;
  ctx.fillText(DEEP_LINK_LABEL, width / 2, height * 0.94);

  return canvas.toDataURL('image/png');
};

export const downloadShareCard = (archetype, format = 'stories') => {
  const dataUrl = generateShareCardDataUrl(archetype, format);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `moral-torture-machine-${format}.png`;
  link.click();
};

const dataUrlToFile = async (dataUrl, filename) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};

/**
 * TASK-32: `<a download>` does not reliably save a file inside the Android
 * WebView the Capacitor app runs in - there is no Downloads-folder handler
 * by default, so a tap can silently do nothing. This tries the Web Share
 * API's file-sharing (navigator.share({files})), which the WebView's
 * underlying Chrome engine supports without any new Capacitor plugin/native
 * project change (so it needs no Android rebuild), opening the native share
 * sheet directly; only when that is unavailable (most desktop browsers) does
 * it fall back to a plain download link. Returns the method actually used,
 * for instrumentation.
 */
const shareOrDownloadDataUrl = async (dataUrl, filename, shareText) => {
  try {
    const file = await dataUrlToFile(dataUrl, filename);
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: shareText });
      return 'native_share';
    }
  } catch (error) {
    // AbortError means the user dismissed the share sheet - not a failure,
    // don't fall back to also triggering a download in that case.
    if (error?.name === 'AbortError') return 'native_share_cancelled';
    console.warn('Native share of card failed, falling back to download:', error);
  }

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
  return 'download';
};

export const shareOrDownloadCard = async (archetype, format, shareText) => {
  const dataUrl = generateShareCardDataUrl(archetype, format);
  return shareOrDownloadDataUrl(dataUrl, `moral-torture-machine-${format}.png`, shareText);
};

/**
 * TASK-48: Party Room recap card - closest pair, moral minority (when the
 * group is big enough to have one) and the most-divided dilemma, all
 * computed deterministically server-side (party_awards.py); this only
 * renders them. Same canvas approach as generateShareCardDataUrl: no AI, no
 * server round trip.
 * @param {{closestPair: object|null, moralMinority: object|null, mostControversialDilemma: object|null}} awards
 * @param {{displayName: string}[]} participants
 */
export const generatePartyRecapCardDataUrl = (awards, participants) => {
  const width = 1080;
  // TASK-123: up to 5 award sections now (was 3) - taller canvas so a big
  // group with every award computed still has room to breathe.
  const height = 1700;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const margin = width * 0.1;
  const maxWidth = width - margin * 2;
  const accent = '#8B0000';

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0a0a0a');
  gradient.addColorStop(0.5, '#151515');
  gradient.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = width * 0.012;
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#888888';
  ctx.font = `${width * 0.024}px ${FONT_FAMILY}`;
  ctx.fillText('MORAL TORTURE MACHINE', width / 2, height * 0.08);

  ctx.fillStyle = '#f2f2f2';
  ctx.font = `bold ${width * 0.06}px ${FONT_FAMILY}`;
  ctx.fillText('PARTY RESULTS', width / 2, height * 0.15);

  ctx.fillStyle = '#888888';
  ctx.font = `${width * 0.028}px ${FONT_FAMILY}`;
  ctx.fillText(`${participants.length} PLAYERS JUDGED`, width / 2, height * 0.19);

  let y = height * 0.28;
  const nameOf = (index) => participants[index]?.displayName || '?';

  const drawSection = (label, lines) => {
    ctx.fillStyle = accent;
    ctx.font = `bold ${width * 0.032}px ${FONT_FAMILY}`;
    ctx.fillText(label, width / 2, y);
    y += width * 0.05;
    ctx.fillStyle = '#f2f2f2';
    for (const rawLine of lines) {
      const fitted = fitText(ctx, rawLine, {
        maxWidth, maxLines: 2, startSize: width * 0.036, minSize: width * 0.022,
      });
      for (const line of fitted.lines) {
        ctx.font = `${fitted.fontSize}px ${FONT_FAMILY}`;
        ctx.fillText(line, width / 2, y);
        y += fitted.fontSize * 1.35;
      }
    }
    y += width * 0.05;
  };

  if (awards.closestPair) {
    const [a, b] = awards.closestPair.participantKeys;
    drawSection('CLOSEST PAIR', [
      `${nameOf(a)} & ${nameOf(b)}`,
      `${awards.closestPair.agreementPct}% aligned`,
    ]);
  }

  if (awards.moralMinority) {
    drawSection('MORAL MINORITY', [nameOf(awards.moralMinority.participantKey)]);
  }

  if (awards.mostAlignedWithGroup) {
    drawSection("THE MACHINE'S FAVORITE", [nameOf(awards.mostAlignedWithGroup.participantKey)]);
  }

  if (awards.contrarian) {
    drawSection('THE CONTRARIAN', [nameOf(awards.contrarian.participantKey)]);
  }

  if (awards.mostControversialDilemma) {
    const { dilemma, firstVotes, secondVotes } = awards.mostControversialDilemma;
    drawSection('MOST DIVIDED ON', [dilemma, `${firstVotes} vs ${secondVotes}`]);
  }

  ctx.fillStyle = accent;
  ctx.font = `${width * 0.03}px ${FONT_FAMILY}`;
  ctx.fillText(DEEP_LINK_LABEL, width / 2, height * 0.96);

  return canvas.toDataURL('image/png');
};

export const sharePartyRecapCard = async (awards, participants, shareText) => {
  const dataUrl = generatePartyRecapCardDataUrl(awards, participants);
  return shareOrDownloadDataUrl(dataUrl, 'moral-torture-machine-party-recap.png', shareText);
};
