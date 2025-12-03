/**
 * Polaroid-style photo filters
 * Each filter has:
 * - id: unique identifier
 * - name: display name
 * - css: CSS filter string for live video preview
 * - previewColor: color indicator for UI
 * - apply: canvas manipulation function for capture
 */

export const FILTERS = [
  {
    id: 'original',
    name: 'Original',
    css: 'none',
    previewColor: 'linear-gradient(135deg, #FFE4B5 0%, #DEB887 100%)',
    apply: (ctx, width, height) => {
      // Apply warm vintage tone (existing effect)
      applyWarmVintage(ctx, width, height);
    }
  },
  {
    id: 'sepia',
    name: 'Sepia',
    css: 'sepia(0.6) saturate(1.2) contrast(1.05)',
    previewColor: 'linear-gradient(135deg, #D4A574 0%, #8B6914 100%)',
    apply: (ctx, width, height) => {
      applySepia(ctx, width, height);
    }
  },
  {
    id: 'noir',
    name: 'Noir',
    css: 'grayscale(1) contrast(1.3) brightness(0.95)',
    previewColor: 'linear-gradient(135deg, #4A4A4A 0%, #1A1A1A 100%)',
    apply: (ctx, width, height) => {
      applyNoir(ctx, width, height);
    }
  },
  {
    id: 'faded',
    name: 'Faded',
    css: 'contrast(0.85) saturate(0.8) brightness(1.1)',
    previewColor: 'linear-gradient(135deg, #E8DDD4 0%, #C4B8A8 100%)',
    apply: (ctx, width, height) => {
      applyFaded(ctx, width, height);
    }
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    css: 'saturate(1.4) contrast(1.15) brightness(1.05)',
    previewColor: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
    apply: (ctx, width, height) => {
      applyVibrant(ctx, width, height);
    }
  },
  {
    id: 'arctic',
    name: 'Arctic',
    css: 'saturate(0.9) brightness(1.05) hue-rotate(-15deg)',
    previewColor: 'linear-gradient(135deg, #A8D8EA 0%, #5B9BD5 100%)',
    apply: (ctx, width, height) => {
      applyArctic(ctx, width, height);
    }
  }
];

/**
 * Get a filter by its ID
 */
export function getFilterById(id) {
  return FILTERS.find(f => f.id === id) || FILTERS[0];
}

/**
 * Apply the warm vintage effect (original/default)
 */
function applyWarmVintage(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Warm vintage color adjustment
    data[i] = Math.min(255, data[i] * 1.1);       // Red +10%
    data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Green +5%
    data[i + 2] = Math.min(255, data[i + 2] * 0.9);  // Blue -10%

    // Slight grain
    const noise = (Math.random() - 0.5) * 15;
    data[i] = clamp(data[i] + noise);
    data[i + 1] = clamp(data[i + 1] + noise);
    data[i + 2] = clamp(data[i + 2] + noise);
  }

  ctx.putImageData(imageData, 0, 0);
  applyVignette(ctx, width, height, 0.4);
}

/**
 * Apply sepia tone effect
 */
function applySepia(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Sepia formula
    data[i] = clamp(r * 0.393 + g * 0.769 + b * 0.189);
    data[i + 1] = clamp(r * 0.349 + g * 0.686 + b * 0.168);
    data[i + 2] = clamp(r * 0.272 + g * 0.534 + b * 0.131);

    // Light grain
    const noise = (Math.random() - 0.5) * 12;
    data[i] = clamp(data[i] + noise);
    data[i + 1] = clamp(data[i + 1] + noise);
    data[i + 2] = clamp(data[i + 2] + noise);
  }

  ctx.putImageData(imageData, 0, 0);
  applyVignette(ctx, width, height, 0.5);
}

/**
 * Apply noir (B&W high contrast) effect
 */
function applyNoir(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Luminosity grayscale (more natural looking)
    let gray = r * 0.299 + g * 0.587 + b * 0.114;
    
    // Apply contrast boost
    gray = clamp((gray - 128) * 1.3 + 128);

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;

    // Subtle grain for film look
    const noise = (Math.random() - 0.5) * 18;
    data[i] = clamp(data[i] + noise);
    data[i + 1] = clamp(data[i + 1] + noise);
    data[i + 2] = clamp(data[i + 2] + noise);
  }

  ctx.putImageData(imageData, 0, 0);
  applyVignette(ctx, width, height, 0.55);
}

/**
 * Apply faded film effect
 */
function applyFaded(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Reduce contrast (move toward middle)
    r = clamp((r - 128) * 0.85 + 128 + 15);
    g = clamp((g - 128) * 0.85 + 128 + 12);
    b = clamp((b - 128) * 0.85 + 128 + 10);

    // Slightly desaturate
    const avg = (r + g + b) / 3;
    r = clamp(r * 0.8 + avg * 0.2);
    g = clamp(g * 0.8 + avg * 0.2);
    b = clamp(b * 0.8 + avg * 0.2);

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;

    // Light grain
    const noise = (Math.random() - 0.5) * 10;
    data[i] = clamp(data[i] + noise);
    data[i + 1] = clamp(data[i + 1] + noise);
    data[i + 2] = clamp(data[i + 2] + noise);
  }

  ctx.putImageData(imageData, 0, 0);
  applyVignette(ctx, width, height, 0.3);
}

/**
 * Apply vibrant modern effect
 */
function applyVibrant(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Boost saturation
    const avg = (r + g + b) / 3;
    r = clamp(avg + (r - avg) * 1.4);
    g = clamp(avg + (g - avg) * 1.4);
    b = clamp(avg + (b - avg) * 1.4);

    // Increase contrast
    r = clamp((r - 128) * 1.15 + 128);
    g = clamp((g - 128) * 1.15 + 128);
    b = clamp((b - 128) * 1.15 + 128);

    // Slight brightness boost
    r = clamp(r + 8);
    g = clamp(g + 8);
    b = clamp(b + 8);

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;

    // Minimal grain for clean modern look
    const noise = (Math.random() - 0.5) * 6;
    data[i] = clamp(data[i] + noise);
    data[i + 1] = clamp(data[i + 1] + noise);
    data[i + 2] = clamp(data[i + 2] + noise);
  }

  ctx.putImageData(imageData, 0, 0);
  applyVignette(ctx, width, height, 0.25);
}

/**
 * Apply arctic cool tone effect
 */
function applyArctic(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Cool color shift (reduce red, boost blue)
    r = clamp(r * 0.9);
    g = clamp(g * 1.02);
    b = clamp(b * 1.15);

    // Slight brightness boost
    r = clamp(r + 5);
    g = clamp(g + 8);
    b = clamp(b + 12);

    // Subtle desaturation for icy feel
    const avg = (r + g + b) / 3;
    r = clamp(r * 0.9 + avg * 0.1);
    g = clamp(g * 0.9 + avg * 0.1);
    b = clamp(b * 0.9 + avg * 0.1);

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;

    // Light grain
    const noise = (Math.random() - 0.5) * 10;
    data[i] = clamp(data[i] + noise);
    data[i + 1] = clamp(data[i + 1] + noise);
    data[i + 2] = clamp(data[i + 2] + noise);
  }

  ctx.putImageData(imageData, 0, 0);
  applyVignette(ctx, width, height, 0.35);
}

/**
 * Apply vignette effect
 */
function applyVignette(ctx, width, height, intensity = 0.4) {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, width * 0.7
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Clamp value between 0 and 255
 */
function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

