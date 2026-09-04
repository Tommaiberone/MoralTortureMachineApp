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

// Draws left-aligned horizontal bars for each dimension inside maxWidth,
// starting at startY, and returns the y position right after the block.
// Bar length is normalized against the tallest dimension (defensively
// floored at 0, matching the non-negative domain the results radar chart
// already assumes) so a single dominant dimension doesn't clip.
const drawDimensionBars = (ctx, dimensions, { startY, width, maxWidth, margin, accent }) => {
  if (!dimensions || dimensions.length === 0) return startY;
  const maxValue = Math.max(0.01, ...dimensions.map((entry) => Math.max(0, Number(entry.value) || 0)));
  const rowHeight = width * 0.052;
  const labelWidth = maxWidth * 0.32;
  const barMaxWidth = maxWidth - labelWidth;
  const fontSize = width * 0.024;
  let y = startY;

  for (const entry of dimensions) {
    const ratio = Math.max(0, Number(entry.value) || 0) / maxValue;
    const barWidth = Math.max(width * 0.01, barMaxWidth * ratio);
    const barY = y - fontSize * 0.4;
    const barHeight = fontSize * 0.8;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#cccccc';
    ctx.font = `${fontSize}px ${FONT_FAMILY}`;
    ctx.fillText(entry.subject, margin, y);

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(margin + labelWidth, barY, barMaxWidth, barHeight);
    ctx.fillStyle = accent;
    ctx.fillRect(margin + labelWidth, barY, barWidth, barHeight);

    y += rowHeight;
  }
  ctx.textAlign = 'center';
  return y;
};

/**
 * @param {{name: string, sharePhrase: string, strength?: string, blindSpot?: string, visual: {emoji: string, color: string}}} archetype
 * @param {'stories'|'square'} format
 * @param {{subject: string, value: number}[]} [dimensions] Per-dimension averages
 *   (same shape as the results radar chart's `data`), rendered as a mini bar
 *   chart. Omitted entirely (no empty block) when not provided.
 * @returns {string} PNG data URL
 */
export const generateShareCardDataUrl = (archetype, format = 'stories', dimensions = []) => {
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
  ctx.fillText('MORAL TORTURE MACHINE', width / 2, height * 0.08);

  // Emoji is smaller than the original single-fact card (TASK-133): the
  // freed vertical space goes to the dimension bars and strength/blind spot,
  // which is the actual content that makes the card worth sharing.
  ctx.font = `${width * 0.09}px ${FONT_FAMILY}`;
  ctx.fillText(archetype.visual?.emoji || '', width / 2, height * 0.15);

  const name = fitText(ctx, archetype.name, {
    maxWidth,
    maxLines: 2,
    startSize: width * 0.062,
    minSize: width * 0.038,
    weight: 'bold',
  });
  ctx.fillStyle = '#f2f2f2';
  let y = height * 0.22;
  const nameLineHeight = name.fontSize * 1.2;
  for (const line of name.lines) {
    ctx.font = `bold ${name.fontSize}px ${FONT_FAMILY}`;
    ctx.fillText(line, width / 2, y);
    y += nameLineHeight;
  }

  const phrase = fitText(ctx, `"${archetype.sharePhrase}"`, {
    maxWidth,
    maxLines: 2,
    startSize: width * 0.032,
    minSize: width * 0.022,
  });
  ctx.fillStyle = '#cccccc';
  y += height * 0.025;
  const phraseLineHeight = phrase.fontSize * 1.4;
  for (const line of phrase.lines) {
    ctx.font = `${phrase.fontSize}px ${FONT_FAMILY}`;
    ctx.fillText(line, width / 2, y);
    y += phraseLineHeight;
  }

  y += height * 0.03;
  y = drawDimensionBars(ctx, dimensions, { startY: y, width, maxWidth, margin, accent });

  const traitBlocks = [
    { label: 'STRENGTH', text: archetype.strength },
    { label: 'BLIND SPOT', text: archetype.blindSpot },
  ].filter((block) => Boolean(block.text));

  if (traitBlocks.length > 0) y += height * 0.02;
  for (const block of traitBlocks) {
    ctx.textAlign = 'left';
    ctx.fillStyle = accent;
    ctx.font = `bold ${width * 0.022}px ${FONT_FAMILY}`;
    ctx.fillText(block.label, margin, y);
    y += width * 0.032;

    const fitted = fitText(ctx, block.text, {
      maxWidth,
      maxLines: 2,
      startSize: width * 0.026,
      minSize: width * 0.02,
    });
    ctx.fillStyle = '#dddddd';
    for (const line of fitted.lines) {
      ctx.font = `${fitted.fontSize}px ${FONT_FAMILY}`;
      ctx.fillText(line, margin, y);
      y += fitted.fontSize * 1.35;
    }
    y += width * 0.018;
  }
  ctx.textAlign = 'center';

  ctx.fillStyle = accent;
  ctx.font = `${width * 0.03}px ${FONT_FAMILY}`;
  ctx.fillText(DEEP_LINK_LABEL, width / 2, height * 0.96);

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

export const shareOrDownloadCard = async (archetype, format, shareText, dimensions = []) => {
  const dataUrl = generateShareCardDataUrl(archetype, format, dimensions);
  return shareOrDownloadDataUrl(dataUrl, `moral-torture-machine-${format}.png`, shareText);
};

/**
 * TASK-134: Moral Duel comparison card - the highest-tension moment of the
 * product (two archetypes + how compatible they are) had no shareable image
 * at all, only a raw WhatsApp link for the rematch. Same canvas approach as
 * the other cards: no AI, no server round trip. Only renders data already
 * returned by GET /challenges/{token}/compare (archetypes, overall
 * agreement, most aligned/divergent dimension) - never raw per-dilemma
 * answers, per TASK-39's explicit decision not to expose those.
 * @param {{creator: {archetype: object}, invitee: {archetype: object}, compatibility: {overallAgreementPct: number, mostAlignedDimension: string, mostDivergentDimension: string}}} comparison
 */
export const generateDuelCardDataUrl = (comparison) => {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const margin = width * 0.1;
  const maxWidth = width - margin * 2;
  const accent = '#8B0000';
  const { creator, invitee, compatibility } = comparison;

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
  ctx.font = `bold ${width * 0.05}px ${FONT_FAMILY}`;
  ctx.fillText('MORAL DUEL', width / 2, height * 0.14);

  // Two archetype columns side by side, "VS" between them.
  const columnWidth = maxWidth * 0.42;
  const leftCenterX = margin + columnWidth / 2;
  const rightCenterX = width - margin - columnWidth / 2;
  const archetypeY = height * 0.24;

  const drawArchetypeColumn = (centerX, archetype) => {
    ctx.textAlign = 'center';
    ctx.font = `${width * 0.11}px ${FONT_FAMILY}`;
    ctx.fillStyle = '#f2f2f2';
    ctx.fillText(archetype?.visual?.emoji || '', centerX, archetypeY);

    const nameText = fitText(ctx, archetype?.name || '', {
      maxWidth: columnWidth,
      maxLines: 2,
      startSize: width * 0.032,
      minSize: width * 0.02,
      weight: 'bold',
    });
    ctx.fillStyle = archetype?.visual?.color || accent;
    let nameY = archetypeY + width * 0.06;
    for (const line of nameText.lines) {
      ctx.font = `bold ${nameText.fontSize}px ${FONT_FAMILY}`;
      ctx.fillText(line, centerX, nameY);
      nameY += nameText.fontSize * 1.25;
    }
  };

  drawArchetypeColumn(leftCenterX, creator?.archetype);
  drawArchetypeColumn(rightCenterX, invitee?.archetype);

  ctx.fillStyle = accent;
  ctx.font = `bold ${width * 0.045}px ${FONT_FAMILY}`;
  ctx.fillText('VS', width / 2, archetypeY + width * 0.02);

  // Overall compatibility, the headline number.
  const pctY = height * 0.5;
  ctx.fillStyle = '#888888';
  ctx.font = `${width * 0.026}px ${FONT_FAMILY}`;
  ctx.fillText('COMPATIBILITY', width / 2, pctY);
  ctx.fillStyle = '#f2f2f2';
  ctx.font = `bold ${width * 0.14}px ${FONT_FAMILY}`;
  ctx.fillText(`${compatibility?.overallAgreementPct ?? '--'}%`, width / 2, pctY + width * 0.13);

  // Most aligned / most divergent dimension as the curiosity hook.
  let y = pctY + width * 0.24;
  const highlightRows = [
    { label: 'MOST ALIGNED', value: compatibility?.mostAlignedDimension },
    { label: 'MOST DIVERGENT', value: compatibility?.mostDivergentDimension },
  ].filter((row) => Boolean(row.value));

  for (const row of highlightRows) {
    ctx.fillStyle = '#888888';
    ctx.font = `${width * 0.024}px ${FONT_FAMILY}`;
    ctx.fillText(row.label, width / 2, y);
    y += width * 0.045;
    ctx.fillStyle = '#f2f2f2';
    ctx.font = `bold ${width * 0.036}px ${FONT_FAMILY}`;
    ctx.fillText(row.value, width / 2, y);
    y += width * 0.09;
  }

  ctx.fillStyle = accent;
  ctx.font = `${width * 0.03}px ${FONT_FAMILY}`;
  ctx.fillText(DEEP_LINK_LABEL, width / 2, height * 0.96);

  return canvas.toDataURL('image/png');
};

export const shareDuelCard = async (comparison, shareText) => {
  const dataUrl = generateDuelCardDataUrl(comparison);
  return shareOrDownloadDataUrl(dataUrl, 'moral-torture-machine-duel.png', shareText);
};

/**
 * TASK-225: Daily Moral Crime share card - the one game mode with a real,
 * already-computed population comparison (today's global aggregate vote
 * split) that previously had no shareable card at all, only a text-only
 * native share. Leads with "chose like you" as the headline - the same
 * you-vs-the-real-crowd hook the Duel compatibility card and Party's Moral
 * Minority award already use. Never a fabricated number: `results` is the
 * exact aggregate already shown on screen after voting.
 * @param {{dilemma: string, firstAnswer: string, secondAnswer: string}} dilemma
 * @param {'first'|'second'} choice
 * @param {{firstPct: number, secondPct: number, totalVotes: number}} results
 */
export const generateDailyCardDataUrl = (dilemma, choice, results) => {
  const width = 1080;
  const height = 1920;
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
  ctx.font = `bold ${width * 0.045}px ${FONT_FAMILY}`;
  ctx.fillText('DAILY MORAL CRIME', width / 2, height * 0.14);

  const question = fitText(ctx, dilemma.dilemma, {
    maxWidth, maxLines: 4, startSize: width * 0.03, minSize: width * 0.02,
  });
  ctx.fillStyle = '#cccccc';
  let y = height * 0.2;
  const questionLineHeight = question.fontSize * 1.4;
  for (const line of question.lines) {
    ctx.font = `${question.fontSize}px ${FONT_FAMILY}`;
    ctx.fillText(line, width / 2, y);
    y += questionLineHeight;
  }

  // Headline: the real share of voters who chose the same option as the
  // viewer - the entire reason this card is worth posting.
  const agreementPct = choice === 'first' ? results.firstPct : results.secondPct;
  const headlineY = Math.max(y + width * 0.05, height * 0.42);
  ctx.fillStyle = '#888888';
  ctx.font = `${width * 0.026}px ${FONT_FAMILY}`;
  ctx.fillText('CHOSE LIKE YOU', width / 2, headlineY);
  ctx.fillStyle = accent;
  ctx.font = `bold ${width * 0.16}px ${FONT_FAMILY}`;
  ctx.fillText(`${agreementPct}%`, width / 2, headlineY + width * 0.15);

  // Full breakdown, both options - same visual language (colors) as the
  // on-screen result bars (--choice-a/--choice-b in horrorTheme.css).
  const rows = [
    { text: dilemma.firstAnswer, pct: results.firstPct, color: '#2f3f4f' },
    { text: dilemma.secondAnswer, pct: results.secondPct, color: '#4a3a26' },
  ];
  const barWidth = maxWidth;
  const barHeight = width * 0.045;
  let rowY = headlineY + width * 0.24;
  for (const row of rows) {
    const label = fitText(ctx, row.text, {
      maxWidth, maxLines: 1, startSize: width * 0.026, minSize: width * 0.02,
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cccccc';
    ctx.font = `${label.fontSize}px ${FONT_FAMILY}`;
    ctx.fillText(label.lines[0] || '', margin, rowY);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f2f2f2';
    ctx.font = `bold ${width * 0.03}px ${FONT_FAMILY}`;
    ctx.fillText(`${row.pct}%`, margin + barWidth, rowY);

    const barY = rowY + width * 0.018;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(margin, barY, barWidth, barHeight);
    ctx.fillStyle = row.color;
    ctx.fillRect(margin, barY, Math.max(width * 0.01, barWidth * (row.pct / 100)), barHeight);

    rowY += width * 0.11;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#888888';
  ctx.font = `${width * 0.024}px ${FONT_FAMILY}`;
  ctx.fillText(`${results.totalVotes} VOTES TODAY`, width / 2, rowY + width * 0.02);

  ctx.fillStyle = accent;
  ctx.font = `${width * 0.03}px ${FONT_FAMILY}`;
  ctx.fillText(DEEP_LINK_LABEL, width / 2, height * 0.96);

  return canvas.toDataURL('image/png');
};

export const shareDailyCard = async (dilemma, choice, results, shareText) => {
  const dataUrl = generateDailyCardDataUrl(dilemma, choice, results);
  return shareOrDownloadDataUrl(dataUrl, 'moral-torture-machine-daily.png', shareText);
};

/**
 * TASK-48: Party Room recap card - closest pair, moral minority (when the
 * group is big enough to have one) and the most-divided dilemma, all
 * computed deterministically server-side (party_awards.py); this only
 * renders them. Same canvas approach as generateShareCardDataUrl: no AI, no
 * server round trip.
 * @param {{closestPair: object|null, moralMinority: object|null, mostControversialDilemma: object|null}} awards
 * @param {{displayName: string}[]} participants
 * @param {{name: string, visual: {emoji: string, color: string}}|null} [groupArchetype]
 *   TASK-210: the room's own archetype (mean of every participant's averages
 *   through the same deterministic assign_archetype() used per individual) -
 *   its visual identity leads the card and sets the accent color, same as the
 *   solo share card does with an individual archetype.
 */
export const generatePartyRecapCardDataUrl = (awards, participants, groupArchetype = null) => {
  const width = 1080;
  // TASK-123: up to 5 award sections now (was 3) - taller canvas so a big
  // group with every award computed still has room to breathe. TASK-210:
  // +80 for the group archetype block below the title.
  const height = 1780;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const margin = width * 0.1;
  const maxWidth = width - margin * 2;
  const accent = groupArchetype?.visual?.color || '#8B0000';

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
  ctx.fillText('PARTY RESULTS', width / 2, height * 0.13);

  let y = height * 0.13;
  if (groupArchetype) {
    y += width * 0.1;
    ctx.font = `${width * 0.065}px ${FONT_FAMILY}`;
    ctx.fillText(groupArchetype.visual?.emoji || '', width / 2, y);

    y += width * 0.06;
    const groupName = fitText(ctx, groupArchetype.name, {
      maxWidth, maxLines: 1, startSize: width * 0.038, minSize: width * 0.024, weight: 'bold',
    });
    ctx.fillStyle = accent;
    ctx.font = `bold ${groupName.fontSize}px ${FONT_FAMILY}`;
    ctx.fillText(groupName.lines[0] || groupArchetype.name, width / 2, y);
    y += groupName.fontSize * 1.3;
  } else {
    y += width * 0.06;
  }

  ctx.fillStyle = '#888888';
  ctx.font = `${width * 0.028}px ${FONT_FAMILY}`;
  ctx.fillText(`${participants.length} PLAYERS JUDGED`, width / 2, y);
  y += height * 0.09;
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

export const sharePartyRecapCard = async (awards, participants, shareText, groupArchetype = null) => {
  const dataUrl = generatePartyRecapCardDataUrl(awards, participants, groupArchetype);
  return shareOrDownloadDataUrl(dataUrl, 'moral-torture-machine-party-recap.png', shareText);
};
