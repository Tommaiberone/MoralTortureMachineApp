// Client-side moral archetype share card generator (TASK-31).
//
// TASK-233: "dossier" redesign - the flat gradient + thin border + a
// monospace font everywhere the cards used to be was judged too plain/
// wireframe-y. Direction approved 2026-09-05 via an HTML/CSS mockup
// published as the "Verdict Cards" Artifact: a case-file look with the 14
// existing per-archetype colors doing real work as a radial glow instead of
// a hairline border, procedural film grain, corner registration ticks, and
// a rotated "stamped" headline treatment. TASK-238 then replaced the
// mockup's original typewriter/monospace pairing (Special Elite + JetBrains
// Mono) with IBM Plex Sans - the same readable font now used app-wide - kept
// as one family at two weights (700 bold for stamps/headlines, 400 for
// body/data) rather than two separate typefaces. Still renders to an
// offscreen canvas and returns a PNG data URL - no AI, no server round trip,
// no paid rendering service, matching the "generate social cards client-side
// or from cached deterministic templates" cost rule in CLAUDE.md. Percentile
// is intentionally omitted until TASK-28 (MoralProfiles) gives a real
// population to rank against; fabricating one here would violate the
// "archetypes are deterministic and testable" product rule.

const FONT_FAMILY = "'IBM Plex Sans', 'Segoe UI', Arial, sans-serif";
const DEEP_LINK_LABEL = 'moraltorturemachine.com';
const DEFAULT_ACCENT = '#8B0000';
const STAMP_ROTATION = -0.02;

// Warm near-black "case file" palette (not pure grey/black - see the
// Verdict Cards mockup rationale for why a picked neutral reads better than
// a default one).
const VOID = '#0a0705';
const VOID_2 = '#120d09';
const RULE = '#3a2c20';
const RULE_SOFT = '#2a1f17';
const BONE = '#eee6d6';
const DIM = '#93866f';
const DIM_2 = '#5c5140';

// The Solo Archetype card keeps the exact native Instagram/WhatsApp Stories
// canvas (1080x1920) even though its content ends well above the bottom -
// unlike the other 3 cards below (which got a shorter, content-fitted
// height instead), this is the one posted to an actual Stories placement,
// where landing on the exact native resolution avoids any letterboxing.
const FORMATS = {
  stories: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

// ---------------------------------------------------------------------
// Fonts: IBM Plex Sans is already linked app-wide in index.html (TASK-238),
// so unlike the original TASK-233 version this never injects its own
// stylesheet - it just waits for the weights this file actually draws with,
// raced against a hard 1.5s timeout. Sharing must never depend on an
// external network call succeeding - if the font is slow or still loading,
// every ctx.font string below still resolves to its own system fallback.
// ---------------------------------------------------------------------

let dossierFontsReadyPromise = null;
const ensureDossierFontsReady = () => {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  if (!dossierFontsReadyPromise) {
    dossierFontsReadyPromise = Promise.race([
      Promise.all([
        document.fonts.load(`400 100px ${FONT_FAMILY}`),
        document.fonts.load(`700 100px ${FONT_FAMILY}`),
        document.fonts.load(`italic 400 100px ${FONT_FAMILY}`),
      ]).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  }
  return dossierFontsReadyPromise;
};

// ---------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------

const hexToRgb = (hex) => {
  const clean = (hex || DEFAULT_ACCENT).replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
};

const hexToRgba = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Many archetype colors are deliberately dark/muted (e.g. #1A1A1A) so they
// read as their own accent border - too dark to use as text/fill against a
// near-black card. Lightened toward white for anything that needs to stay
// legible while keeping the archetype's own hue.
const brighten = (hex, amount = 0.5) => {
  const { r, g, b } = hexToRgb(hex);
  const mix = (channel) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

// ---------------------------------------------------------------------
// Text layout
// ---------------------------------------------------------------------

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
// the longer Italian strings never overflow the card while staying legible
// at a sane minimum size.
const fitText = (ctx, text, { maxWidth, maxLines, startSize, minSize, weight = 'normal', font = FONT_FAMILY }) => {
  let fontSize = startSize;
  let lines = [];
  while (fontSize >= minSize) {
    ctx.font = `${weight} ${fontSize}px ${font}`;
    lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { fontSize, lines };
    fontSize -= 4;
  }
  ctx.font = `${weight} ${fontSize}px ${font}`;
  return { fontSize, lines: lines.slice(0, maxLines) };
};

// ---------------------------------------------------------------------
// Shared "dossier" drawing kit - one visual system reused by all 4 cards
// instead of each one duplicating its own background/border/header/footer.
// ---------------------------------------------------------------------

let grainSourceCanvas = null;
const getGrainSource = () => {
  if (grainSourceCanvas) return grainSourceCanvas;
  const size = 128;
  const source = document.createElement('canvas');
  source.width = size;
  source.height = size;
  const sctx = source.getContext('2d');
  const imageData = sctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const shade = Math.random() * 255;
    imageData.data[i] = shade;
    imageData.data[i + 1] = shade;
    imageData.data[i + 2] = shade;
    imageData.data[i + 3] = Math.random() * 24;
  }
  sctx.putImageData(imageData, 0, 0);
  grainSourceCanvas = source;
  return grainSourceCanvas;
};

// Procedural analog film grain (no image asset) - the cheapest single
// change that stops a flat gradient from reading as a UI wireframe.
const drawGrain = (ctx, width, height) => {
  const pattern = ctx.createPattern(getGrainSource(), 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};

// Background gradient + a soft top-of-card accent wash + hairline frame +
// corner registration ticks (like an official document) + grain.
const drawDossierFrame = (ctx, width, height, accent) => {
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, VOID_2);
  bgGradient.addColorStop(0.4, VOID);
  bgGradient.addColorStop(0.6, VOID);
  bgGradient.addColorStop(1, VOID_2);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  const wash = ctx.createRadialGradient(width / 2, height * 0.1, 0, width / 2, height * 0.1, width * 0.85);
  wash.addColorStop(0, hexToRgba(accent, 0.16));
  wash.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = RULE;
  ctx.lineWidth = Math.max(1, width * 0.0009);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);

  const marginTick = width * 0.034;
  const tick = width * 0.016;
  ctx.beginPath();
  ctx.moveTo(marginTick, marginTick + tick); ctx.lineTo(marginTick, marginTick); ctx.lineTo(marginTick + tick, marginTick);
  ctx.moveTo(width - marginTick - tick, marginTick); ctx.lineTo(width - marginTick, marginTick); ctx.lineTo(width - marginTick, marginTick + tick);
  ctx.moveTo(marginTick, height - marginTick - tick); ctx.lineTo(marginTick, height - marginTick); ctx.lineTo(marginTick + tick, height - marginTick);
  ctx.moveTo(width - marginTick - tick, height - marginTick); ctx.lineTo(width - marginTick, height - marginTick); ctx.lineTo(width - marginTick, height - marginTick - tick);
  ctx.stroke();

  drawGrain(ctx, width, height);
};

// Wordmark left, short case-metadata right, hairline rule beneath. Returns
// the y position content should start at.
const drawDossierHeader = (ctx, { width, margin, startY, wordmark, meta }) => {
  ctx.textAlign = 'left';
  ctx.fillStyle = DIM;
  ctx.font = `${width * 0.021}px ${FONT_FAMILY}`;
  ctx.fillText(wordmark.toUpperCase(), margin, startY);
  if (meta) {
    ctx.textAlign = 'right';
    ctx.fillStyle = DIM_2;
    ctx.font = `${width * 0.018}px ${FONT_FAMILY}`;
    ctx.fillText(meta, width - margin, startY);
  }

  const ruleY = startY + width * 0.02;
  ctx.strokeStyle = RULE_SOFT;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin, ruleY);
  ctx.lineTo(width - margin, ruleY);
  ctx.stroke();

  ctx.textAlign = 'center';
  return ruleY + width * 0.045;
};

const drawRule = (ctx, { width, margin, y }) => {
  ctx.strokeStyle = RULE_SOFT;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(width - margin, y);
  ctx.stroke();
};

// A short "ink stamp" line + the domain, both near the bottom edge.
const drawFooterSeal = (ctx, { width, height, margin, sealText, accentBright }) => {
  const ruleY = height - height * 0.07;
  drawRule(ctx, { width, margin, y: ruleY });

  ctx.save();
  ctx.translate(width / 2, ruleY + width * 0.032);
  ctx.rotate(STAMP_ROTATION);
  ctx.textAlign = 'center';
  ctx.fillStyle = accentBright;
  ctx.font = `700 ${width * 0.022}px ${FONT_FAMILY}`;
  ctx.fillText(sealText.toUpperCase(), 0, 0);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = DIM_2;
  ctx.font = `${width * 0.017}px ${FONT_FAMILY}`;
  ctx.fillText(DEEP_LINK_LABEL, width / 2, ruleY + width * 0.062);
};

// Soft radial glow, meant to sit behind an emoji/hero element.
const drawGlow = (ctx, cx, cy, radius, color) => {
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
};

// Rotated bold headline with a faint double-strike offset, like a
// rubber-stamped verdict. `lines`/`fontSize` come from fitText(..., {
// weight: '700' }) so the measurement matches this always-bold render -
// callers control wrapping/shrink-to-fit themselves. Returns the y position
// right after the block.
const drawStamp = (ctx, lines, fontSize, { cx, startY, color = BONE, glowColor }) => {
  const lineHeight = fontSize * 1.16;
  const offset = fontSize * 0.035;
  ctx.save();
  ctx.translate(cx, startY);
  ctx.rotate(STAMP_ROTATION);
  ctx.textAlign = 'center';
  ctx.font = `700 ${fontSize}px ${FONT_FAMILY}`;
  lines.forEach((line, i) => {
    const ly = i * lineHeight;
    ctx.fillStyle = glowColor;
    ctx.fillText(line, offset, ly + offset * 0.8);
    ctx.fillStyle = color;
    ctx.fillText(line, 0, ly);
  });
  ctx.restore();
  ctx.textAlign = 'center';
  return startY + (lines.length - 1) * lineHeight + fontSize * 1.3;
};

// Label(+wrapped up to 2 lines)/value on top, a filled track underneath.
// The label and the bar can never overlap - the track is always positioned
// after measuring how tall the (possibly wrapped) label actually rendered,
// unlike a label|track|value grid row where a long label and a fixed-width
// column can collide.
const drawStatBar = (ctx, {
  x, y, width: barWidth, cardWidth, label, valueText, ratio,
  accentBright, labelColor = DIM, valueColor = BONE, uppercase = true,
}) => {
  const labelSize = cardWidth * 0.02;
  const trackHeight = Math.max(2, cardWidth * 0.011);
  const displayLabel = uppercase ? label.toUpperCase() : label;

  ctx.font = `${labelSize}px ${FONT_FAMILY}`;
  const valueWidth = ctx.measureText(valueText).width;
  const labelMaxWidth = Math.max(barWidth * 0.3, barWidth - valueWidth - cardWidth * 0.025);
  const wrapped = wrapText(ctx, displayLabel, labelMaxWidth).slice(0, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = labelColor;
  wrapped.forEach((line, i) => {
    ctx.fillText(line, x, y + i * labelSize * 1.3);
  });

  ctx.textAlign = 'right';
  ctx.fillStyle = valueColor;
  ctx.font = `700 ${labelSize}px ${FONT_FAMILY}`;
  ctx.fillText(valueText, x + barWidth, y);

  const labelBlockHeight = (wrapped.length - 1) * labelSize * 1.3;
  const trackY = y + labelBlockHeight + cardWidth * 0.015;
  ctx.fillStyle = RULE_SOFT;
  ctx.fillRect(x, trackY, barWidth, trackHeight);
  ctx.fillStyle = accentBright;
  const fillRatio = Math.max(0, Math.min(1, ratio));
  ctx.fillRect(x, trackY, Math.max(cardWidth * 0.006, barWidth * fillRatio), trackHeight);

  ctx.textAlign = 'center';
  return trackY + trackHeight + cardWidth * 0.03;
};

// ---------------------------------------------------------------------
// Card 1: Solo Archetype
// ---------------------------------------------------------------------

/**
 * @param {{name: string, archetypeId?: string, sharePhrase: string, strength?: string, blindSpot?: string, visual: {emoji: string, color: string}}} archetype
 * @param {'stories'|'square'} format
 * @param {{subject: string, value: number}[]} [dimensions] Per-dimension averages
 *   (same shape as the results radar chart's `data`, each already in the
 *   product's fixed [0, 1] domain - TASK-105), rendered as stat bars.
 *   Omitted entirely (no empty block) when not provided.
 * @returns {Promise<string>} PNG data URL
 */
export const generateShareCardDataUrl = async (archetype, format = 'stories', dimensions = []) => {
  await ensureDossierFontsReady();

  const { width, height } = FORMATS[format] || FORMATS.stories;
  const compact = format === 'square';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const margin = width * 0.085;
  const maxWidth = width - margin * 2;
  const accent = archetype.visual?.color || DEFAULT_ACCENT;
  const accentBright = brighten(accent);
  const glow = hexToRgba(accent, 0.5);

  drawDossierFrame(ctx, width, height, accent);
  let y = drawDossierHeader(ctx, {
    width, margin, startY: height * 0.048,
    wordmark: 'Moral Torture Machine',
    meta: archetype.archetypeId ? `Archetype file · ${archetype.archetypeId}` : 'Archetype file',
  });

  drawGlow(ctx, width / 2, y + width * 0.1, width * 0.34, glow);

  ctx.textAlign = 'center';
  ctx.font = `${width * 0.13}px ${FONT_FAMILY}`;
  ctx.fillText(archetype.visual?.emoji || '', width / 2, y + width * 0.1);
  y += width * 0.15;

  if (!compact) {
    ctx.fillStyle = accentBright;
    ctx.font = `${width * 0.015}px ${FONT_FAMILY}`;
    ctx.fillText('VERDICT', width / 2, y);
    y += width * 0.03;
  }

  const nameFit = fitText(ctx, archetype.name, {
    maxWidth, maxLines: 2, startSize: width * 0.062, minSize: width * 0.038, weight: '700', font: FONT_FAMILY,
  });
  y = drawStamp(ctx, nameFit.lines, nameFit.fontSize, { width, cx: width / 2, startY: y, glowColor: glow });

  if (archetype.sharePhrase) {
    const phrase = fitText(ctx, `“${archetype.sharePhrase}”`, {
      maxWidth: maxWidth * 0.88, maxLines: compact ? 1 : 2, startSize: width * 0.024, minSize: width * 0.018,
    });
    ctx.fillStyle = DIM;
    y += width * 0.012;
    for (const line of phrase.lines) {
      ctx.font = `italic ${phrase.fontSize}px ${FONT_FAMILY}`;
      ctx.fillText(line, width / 2, y);
      y += phrase.fontSize * 1.45;
    }
  }

  y += width * 0.015;
  drawRule(ctx, { width, margin, y });
  y += width * 0.045;

  if (dimensions && dimensions.length > 0) {
    for (const entry of dimensions) {
      const value = Math.max(0, Number(entry.value) || 0);
      y = drawStatBar(ctx, {
        x: margin, y, width: maxWidth, cardWidth: width,
        label: entry.subject || '',
        valueText: value.toFixed(2),
        ratio: value,
        accentBright,
      });
    }
    y += width * 0.015;
    drawRule(ctx, { width, margin, y });
    y += width * 0.045;
  }

  if (!compact) {
    const traitBlocks = [
      { label: 'Strength', text: archetype.strength },
      { label: 'Blind spot', text: archetype.blindSpot },
    ].filter((block) => Boolean(block.text));

    for (const block of traitBlocks) {
      ctx.textAlign = 'left';
      ctx.fillStyle = accentBright;
      ctx.font = `700 ${width * 0.017}px ${FONT_FAMILY}`;
      ctx.fillText(block.label.toUpperCase(), margin, y);
      y += width * 0.028;

      const fitted = fitText(ctx, block.text, { maxWidth, maxLines: 2, startSize: width * 0.021, minSize: width * 0.017 });
      ctx.fillStyle = BONE;
      for (const line of fitted.lines) {
        ctx.font = `${fitted.fontSize}px ${FONT_FAMILY}`;
        ctx.fillText(line, margin, y);
        y += fitted.fontSize * 1.45;
      }
      y += width * 0.022;
    }
  }
  ctx.textAlign = 'center';

  drawFooterSeal(ctx, { width, height, margin, sealText: 'case closed', accentBright });

  return canvas.toDataURL('image/png');
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
  const dataUrl = await generateShareCardDataUrl(archetype, format, dimensions);
  return shareOrDownloadDataUrl(dataUrl, `moral-torture-machine-${format}.png`, shareText);
};

// ---------------------------------------------------------------------
// Card 2: Moral Duel
// ---------------------------------------------------------------------

/**
 * TASK-134: Moral Duel comparison card - the highest-tension moment of the
 * product (two archetypes + how compatible they are) had no shareable image
 * at all, only a raw WhatsApp link for the rematch. Same canvas approach as
 * the other cards: no AI, no server round trip. Only renders data already
 * returned by GET /challenges/{token}/compare (archetypes, overall
 * agreement, most aligned/divergent dimension) - never raw per-dilemma
 * answers, per TASK-39's explicit decision not to expose those. No
 * participant display names either - the API never returns them here, so
 * neither does this card.
 * @param {{creator: {archetype: object}, invitee: {archetype: object}, compatibility: {overallAgreementPct: number, mostAlignedDimension: string, mostDivergentDimension: string}}} comparison
 */
export const generateDuelCardDataUrl = async (comparison) => {
  await ensureDossierFontsReady();

  const width = 1080;
  // Shorter than the old 1920 stories canvas: this card's content (two
  // columns, one big percentage, two highlight rows) reliably ends around
  // y=1050 - the full 1920 left a large empty gap above the footer.
  const height = 1500;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const margin = width * 0.09;
  const { creator, invitee, compatibility } = comparison;
  const leftAccent = creator?.archetype?.visual?.color || DEFAULT_ACCENT;
  const rightAccent = invitee?.archetype?.visual?.color || DEFAULT_ACCENT;
  const chromeAccent = DEFAULT_ACCENT;
  const chromeAccentBright = brighten(chromeAccent);

  drawDossierFrame(ctx, width, height, chromeAccent);
  let y = drawDossierHeader(ctx, {
    width, margin, startY: height * 0.048,
    wordmark: 'Moral Duel', meta: 'Compatibility review',
  });

  y += width * 0.03;
  const columnWidth = (width - margin * 2) * 0.42;
  const leftCenterX = margin + columnWidth / 2;
  const rightCenterX = width - margin - columnWidth / 2;

  const drawColumn = (centerX, who, archetype, accent) => {
    // Glow drawn first so it sits behind every text element in the column,
    // not painted back over the "You"/"Them" label after it's already drawn.
    drawGlow(ctx, centerX, y + width * 0.09, width * 0.2, hexToRgba(accent, 0.45));

    ctx.textAlign = 'center';
    ctx.fillStyle = DIM;
    ctx.font = `${width * 0.017}px ${FONT_FAMILY}`;
    ctx.fillText(who, centerX, y);

    ctx.font = `${width * 0.1}px ${FONT_FAMILY}`;
    ctx.fillText(archetype?.visual?.emoji || '', centerX, y + width * 0.1);

    const nameFit = fitText(ctx, archetype?.name || '', {
      maxWidth: columnWidth, maxLines: 2, startSize: width * 0.03, minSize: width * 0.019, weight: '700', font: FONT_FAMILY,
    });
    drawStamp(ctx, nameFit.lines, nameFit.fontSize, {
      width, cx: centerX, startY: y + width * 0.155, color: BONE, glowColor: hexToRgba(accent, 0.5),
    });
  };

  drawColumn(leftCenterX, 'You', creator?.archetype, leftAccent);
  drawColumn(rightCenterX, 'Them', invitee?.archetype, rightAccent);

  ctx.save();
  ctx.translate(width / 2, y + width * 0.075);
  ctx.rotate(0.09);
  ctx.fillStyle = DIM_2;
  ctx.font = `${width * 0.032}px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText('vs', 0, 0);
  ctx.restore();
  ctx.textAlign = 'center';

  y += width * 0.35;
  drawRule(ctx, { width, margin, y });
  y += width * 0.06;

  ctx.fillStyle = DIM;
  ctx.font = `${width * 0.019}px ${FONT_FAMILY}`;
  ctx.fillText('COMPATIBILITY', width / 2, y);

  const pctFit = fitText(ctx, `${compatibility?.overallAgreementPct ?? '--'}%`, {
    maxWidth: width - margin * 2, maxLines: 1, startSize: width * 0.14, minSize: width * 0.1, weight: '700', font: FONT_FAMILY,
  });
  y = drawStamp(ctx, pctFit.lines, pctFit.fontSize, {
    width, cx: width / 2, startY: y + width * 0.14, color: chromeAccentBright, glowColor: hexToRgba(chromeAccent, 0.6),
  });

  y += width * 0.03;
  const highlightRows = [
    { label: 'Most aligned', value: compatibility?.mostAlignedDimension },
    { label: 'Most divergent', value: compatibility?.mostDivergentDimension },
  ].filter((row) => Boolean(row.value));

  const colWidth = (width - margin * 2) / Math.max(1, highlightRows.length);
  highlightRows.forEach((row, index) => {
    const cx = margin + colWidth * index + colWidth / 2;
    ctx.fillStyle = DIM;
    ctx.font = `${width * 0.016}px ${FONT_FAMILY}`;
    ctx.fillText(row.label.toUpperCase(), cx, y);
    ctx.fillStyle = BONE;
    ctx.font = `700 ${width * 0.021}px ${FONT_FAMILY}`;
    ctx.fillText(row.value, cx, y + width * 0.032);
  });

  drawFooterSeal(ctx, { width, height, margin, sealText: 'verdict filed', accentBright: chromeAccentBright });

  return canvas.toDataURL('image/png');
};

export const shareDuelCard = async (comparison, shareText) => {
  const dataUrl = await generateDuelCardDataUrl(comparison);
  return shareOrDownloadDataUrl(dataUrl, 'moral-torture-machine-duel.png', shareText);
};

// ---------------------------------------------------------------------
// Card 3: Daily Moral Crime
// ---------------------------------------------------------------------

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
export const generateDailyCardDataUrl = async (dilemma, choice, results) => {
  await ensureDossierFontsReady();

  const width = 1080;
  // Shorter than the old 1920 stories canvas: the dilemma text (up to 4
  // lines), headline percentage and two breakdown bars reliably end well
  // before that, leaving the full height mostly empty above the footer.
  const height = 1550;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const margin = width * 0.09;
  const maxWidth = width - margin * 2;
  const accent = '#8a5a1f';
  const accentBright = brighten(accent);
  const todayStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  drawDossierFrame(ctx, width, height, accent);
  let y = drawDossierHeader(ctx, {
    width, margin, startY: height * 0.048,
    wordmark: 'Daily Moral Crime', meta: `Today's case · ${todayStamp}`,
  });

  y += width * 0.02;
  const question = fitText(ctx, dilemma.dilemma, { maxWidth, maxLines: 4, startSize: width * 0.028, minSize: width * 0.02 });
  ctx.fillStyle = BONE;
  for (const line of question.lines) {
    ctx.font = `${question.fontSize}px ${FONT_FAMILY}`;
    ctx.fillText(line, width / 2, y);
    y += question.fontSize * 1.5;
  }

  const agreementPct = choice === 'first' ? results.firstPct : results.secondPct;
  y += width * 0.04;
  drawGlow(ctx, width / 2, y + width * 0.08, width * 0.4, hexToRgba(accent, 0.4));
  ctx.fillStyle = DIM;
  ctx.font = `${width * 0.02}px ${FONT_FAMILY}`;
  ctx.fillText('CHOSE LIKE YOU', width / 2, y);

  const pctFit = fitText(ctx, `${agreementPct}%`, {
    maxWidth, maxLines: 1, startSize: width * 0.16, minSize: width * 0.11, weight: '700', font: FONT_FAMILY,
  });
  y = drawStamp(ctx, pctFit.lines, pctFit.fontSize, {
    width, cx: width / 2, startY: y + width * 0.16, color: accentBright, glowColor: hexToRgba(accent, 0.6),
  });

  y += width * 0.04;
  drawRule(ctx, { width, margin, y });
  y += width * 0.05;

  const rows = [
    { text: dilemma.firstAnswer, pct: results.firstPct },
    { text: dilemma.secondAnswer, pct: results.secondPct },
  ];
  for (const row of rows) {
    y = drawStatBar(ctx, {
      x: margin, y, width: maxWidth, cardWidth: width,
      label: row.text, valueText: `${row.pct}%`, ratio: row.pct / 100,
      accentBright, labelColor: BONE, uppercase: false,
    });
  }

  y += width * 0.01;
  ctx.fillStyle = DIM_2;
  ctx.font = `${width * 0.018}px ${FONT_FAMILY}`;
  ctx.fillText(`${results.totalVotes} votes today`, width / 2, y);

  drawFooterSeal(ctx, { width, height, margin, sealText: 'case filed', accentBright });

  return canvas.toDataURL('image/png');
};

export const shareDailyCard = async (dilemma, choice, results, shareText) => {
  const dataUrl = await generateDailyCardDataUrl(dilemma, choice, results);
  return shareOrDownloadDataUrl(dataUrl, 'moral-torture-machine-daily.png', shareText);
};

// ---------------------------------------------------------------------
// Card 4: Party Room recap
// ---------------------------------------------------------------------

/**
 * TASK-48/210: Party Room recap card - the room's own archetype (mean of
 * every participant's dimension averages, TASK-210) leads the card and sets
 * its accent, followed by the awards computed deterministically server-side
 * (party_awards.py). Same canvas approach as the other cards: no AI, no
 * server round trip.
 * @param {{closestPair: object|null, moralMinority: object|null, mostAlignedWithGroup: object|null, contrarian: object|null, mostControversialDilemma: object|null}} awards
 * @param {{displayName: string}[]} participants
 * @param {{name: string, visual: {emoji: string, color: string}}|null} [groupArchetype]
 */
export const generatePartyRecapCardDataUrl = async (awards, participants, groupArchetype = null) => {
  await ensureDossierFontsReady();

  const width = 1080;
  const nameOf = (index) => participants[index]?.displayName || '?';

  // Room recaps have wildly different content depending on group size (a
  // group archetype block, and anywhere from 0 to 5 awards) - a fixed
  // canvas height either overflows a big room or leaves a sparse one mostly
  // empty. Both the docket rows and whether the hero block renders are
  // known up front, so the canvas is sized to its own content instead.
  const docketRows = [];
  if (awards.closestPair) {
    const [a, b] = awards.closestPair.participantKeys;
    docketRows.push(['Closest pair', `${nameOf(a)} & ${nameOf(b)} · ${awards.closestPair.agreementPct}%`]);
  }
  if (awards.moralMinority) docketRows.push(['Moral minority', nameOf(awards.moralMinority.participantKey)]);
  if (awards.mostAlignedWithGroup) docketRows.push(["Machine's favorite", nameOf(awards.mostAlignedWithGroup.participantKey)]);
  if (awards.contrarian) docketRows.push(['The contrarian', nameOf(awards.contrarian.participantKey)]);
  if (awards.mostControversialDilemma) {
    const { firstVotes, secondVotes } = awards.mostControversialDilemma;
    docketRows.push(['Most divided', `${firstVotes} vs ${secondVotes}`]);
  }

  const headerBlock = 0.107;
  const heroBlock = groupArchetype ? 0.2274 : 0.02;
  const ruleGap = 0.045;
  const docketRowHeight = 0.088;
  const footerReserve = 0.16;
  const height = Math.round(Math.max(
    1050,
    width * (headerBlock + heroBlock + ruleGap + docketRows.length * docketRowHeight + footerReserve),
  ));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const margin = width * 0.09;
  const maxWidth = width - margin * 2;
  const accent = groupArchetype?.visual?.color || DEFAULT_ACCENT;
  const accentBright = brighten(accent);
  const glow = hexToRgba(accent, 0.5);

  drawDossierFrame(ctx, width, height, accent);
  // Width-relative (not height-relative like the fixed-height cards above) -
  // this card's height is itself derived from content position, so every
  // vertical offset in this function is a fraction of width for consistency.
  let y = drawDossierHeader(ctx, {
    width, margin, startY: width * 0.042,
    wordmark: 'Party Results', meta: `Room file · ${participants.length} judged`,
  });

  if (groupArchetype) {
    drawGlow(ctx, width / 2, y + width * 0.08, width * 0.3, glow);
    ctx.textAlign = 'center';
    ctx.font = `${width * 0.1}px ${FONT_FAMILY}`;
    ctx.fillText(groupArchetype.visual?.emoji || '', width / 2, y + width * 0.08);
    y += width * 0.12;

    ctx.fillStyle = accentBright;
    ctx.font = `${width * 0.015}px ${FONT_FAMILY}`;
    ctx.fillText('TOGETHER, YOU ARE', width / 2, y);
    y += width * 0.025;

    const nameFit = fitText(ctx, groupArchetype.name, {
      maxWidth, maxLines: 1, startSize: width * 0.048, minSize: width * 0.03, weight: '700', font: FONT_FAMILY,
    });
    y = drawStamp(ctx, nameFit.lines, nameFit.fontSize, { width, cx: width / 2, startY: y, glowColor: glow });
    y += width * 0.02;
  } else {
    y += width * 0.02;
  }

  drawRule(ctx, { width, margin, y });
  y += width * 0.045;

  const rowHeight = width * docketRowHeight;
  for (const [label, value] of docketRows) {
    ctx.textAlign = 'left';
    ctx.fillStyle = accentBright;
    ctx.font = `700 ${width * 0.017}px ${FONT_FAMILY}`;
    ctx.fillText(label.toUpperCase(), margin, y);

    ctx.textAlign = 'right';
    const valueFit = fitText(ctx, value, { maxWidth: maxWidth * 0.55, maxLines: 1, startSize: width * 0.021, minSize: width * 0.016 });
    ctx.fillStyle = BONE;
    ctx.font = `${valueFit.fontSize}px ${FONT_FAMILY}`;
    ctx.fillText(valueFit.lines[0] || value, width - margin, y);

    const dividerY = y + width * 0.028;
    drawRule(ctx, { width, margin, y: dividerY });
    y += rowHeight;
  }

  drawFooterSeal(ctx, { width, height, margin, sealText: 'room adjourned', accentBright });

  return canvas.toDataURL('image/png');
};

export const sharePartyRecapCard = async (awards, participants, shareText, groupArchetype = null) => {
  const dataUrl = await generatePartyRecapCardDataUrl(awards, participants, groupArchetype);
  return shareOrDownloadDataUrl(dataUrl, 'moral-torture-machine-party-recap.png', shareText);
};
