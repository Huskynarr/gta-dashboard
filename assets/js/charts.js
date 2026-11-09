const NS = 'http://www.w3.org/2000/svg';
let uidCounter = 0;
const uid = (prefix) => `${prefix}-${++uidCounter}`;

function el(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value != null) node.setAttribute(key, String(value));
  }
  return node;
}

function toTime(value) {
  if (typeof value === 'number') return value;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function extent(values, fallback = [0, 1]) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return fallback;
  return [Math.min(...clean), Math.max(...clean)];
}

function smoothPath(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function niceNumber(value) {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

export function createLineChart(container, series, opts = {}) {
  if (!container) return;
  container.innerHTML = '';

  const width = Math.max(320, Math.min(1000, Math.round(container.clientWidth || 1000)));
  const height = opts.height || 320;
  const narrow = width < 600;
  const pad = {
    top: 24,
    right: narrow ? 18 : 26,
    bottom: 34,
    left: narrow ? 44 : 58,
  };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const normalized = series
    .map((entry) => ({
      ...entry,
      points: (entry.data || [])
        .map((point) => ({
          x: toTime(point.x),
          y: Number(point.y),
        }))
        .filter((point) => Number.isFinite(point.y) && point.x)
        .sort((a, b) => a.x - b.x),
    }))
    .filter((entry) => entry.points.length);

  if (!normalized.length) {
    container.innerHTML = '<p class="chart__empty">Keine Daten verfügbar.</p>';
    return;
  }

  const allPoints = normalized.flatMap((entry) => entry.points);
  const [xMin, xMax] = extent(allPoints.map((point) => point.x), [0, 1]);
  let [yMin, yMax] = extent(
    allPoints.map((point) => point.y),
    [0, 1],
  );
  if (opts.min != null) yMin = opts.min;
  if (opts.max != null) yMax = opts.max;
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  const yPad = (yMax - yMin) * 0.1;
  if (opts.min == null) yMin -= yPad;
  if (opts.max == null) yMax += yPad;

  const xScale = (value) =>
    pad.left + ((value - xMin) / Math.max(xMax - xMin, 1)) * innerW;
  const yScale = (value) =>
    pad.top + (1 - (value - yMin) / Math.max(yMax - yMin, 1e-9)) * innerH;

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': opts.ariaLabel || 'Liniendiagramm',
  });

  const defs = el('defs');
  svg.appendChild(defs);

  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (innerH / 4) * i;
    svg.appendChild(
      el('line', {
        x1: pad.left,
        x2: width - pad.right,
        y1: y,
        y2: y,
        stroke: 'rgba(255,255,255,0.075)',
        'stroke-width': 1,
      }),
    );

    const value = yMax - ((yMax - yMin) / 4) * i;
    const label = el('text', {
      x: pad.left - 10,
      y: y + 4,
      'text-anchor': 'end',
      fill: 'rgba(153,150,163,0.9)',
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 10,
    });
    label.textContent = opts.yFormat ? opts.yFormat(value) : niceNumber(value);
    svg.appendChild(label);
  }

  const xTickCount = opts.xTicks || (narrow ? 3 : 5);
  for (let i = 0; i < xTickCount; i += 1) {
    const ratio = i / (xTickCount - 1);
    const x = pad.left + innerW * ratio;
    const time = xMin + (xMax - xMin) * ratio;
    const label = el('text', {
      x,
      y: height - 10,
      'text-anchor': i === 0 ? 'start' : i === xTickCount - 1 ? 'end' : 'middle',
      fill: 'rgba(153,150,163,0.9)',
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 10,
    });
    label.textContent = opts.xFormat
      ? opts.xFormat(time)
      : new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short' }).format(new Date(time));
    svg.appendChild(label);
  }

  normalized.forEach((entry, index) => {
    const points = entry.points.map((point) => ({
      x: xScale(point.x),
      y: yScale(point.y),
    }));
    const line = smoothPath(points);
    const color = entry.color || '#ff2e88';

    if (opts.area && index === 0) {
      const gradientId = uid('area');
      const gradient = el('linearGradient', {
        id: gradientId,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 1,
      });
      gradient.appendChild(
        el('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': 0.28 }),
      );
      gradient.appendChild(
        el('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': 0 }),
      );
      defs.appendChild(gradient);

      const area = `${line} L ${points.at(-1).x.toFixed(2)} ${pad.top + innerH} L ${points[0].x.toFixed(2)} ${pad.top + innerH} Z`;
      svg.appendChild(
        el('path', {
          d: area,
          fill: `url(#${gradientId})`,
          stroke: 'none',
        }),
      );
    }

    svg.appendChild(
      el('path', {
        d: line,
        fill: 'none',
        stroke: color,
        'stroke-width': entry.width || 2,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'vector-effect': 'non-scaling-stroke',
        opacity: entry.opacity ?? 1,
      }),
    );
  });

  for (const reference of opts.referenceLines || []) {
    const y = yScale(reference.value);
    svg.appendChild(
      el('line', {
        x1: pad.left,
        x2: width - pad.right,
        y1: y,
        y2: y,
        stroke: reference.color || 'rgba(255,200,87,0.55)',
        'stroke-width': 1,
        'stroke-dasharray': '5 5',
      }),
    );
    const label = el('text', {
      x: width - pad.right,
      y: y - 6,
      'text-anchor': 'end',
      fill: reference.color || 'rgba(255,200,87,0.85)',
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 9,
      'letter-spacing': '0.08em',
    });
    label.textContent = reference.label || '';
    svg.appendChild(label);
  }

  const crosshair = el('line', {
    x1: 0,
    x2: 0,
    y1: pad.top,
    y2: pad.top + innerH,
    stroke: 'rgba(255,255,255,0.28)',
    'stroke-width': 1,
    'stroke-dasharray': '3 4',
    opacity: 0,
  });
  svg.appendChild(crosshair);

  const hoverDots = normalized.map((entry) => {
    const dot = el('circle', {
      r: 4,
      fill: entry.color || '#ff2e88',
      stroke: '#07070a',
      'stroke-width': 2,
      opacity: 0,
    });
    svg.appendChild(dot);
    return dot;
  });

  const overlay = el('rect', {
    x: pad.left,
    y: pad.top,
    width: innerW,
    height: innerH,
    fill: 'transparent',
    style: 'cursor: crosshair',
  });
  svg.appendChild(overlay);
  container.appendChild(svg);

  const tooltip = document.createElement('div');
  tooltip.className = 'chart__tooltip';
  container.appendChild(tooltip);

  const hide = () => {
    tooltip.classList.remove('is-visible');
    crosshair.setAttribute('opacity', '0');
    hoverDots.forEach((dot) => dot.setAttribute('opacity', '0'));
  };

  overlay.addEventListener('pointermove', (event) => {
    const rect = svg.getBoundingClientRect();
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(svg.getScreenCTM().inverse());
    const ratio = Math.min(Math.max((local.x - pad.left) / innerW, 0), 1);
    const targetTime = xMin + (xMax - xMin) * ratio;

    let nearestIndex = 0;
    let nearestDistance = Infinity;
    normalized[0].points.forEach((point, index) => {
      const distance = Math.abs(point.x - targetTime);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const anchor = normalized[0].points[nearestIndex];
    const anchorX = xScale(anchor.x);
    crosshair.setAttribute('x1', anchorX);
    crosshair.setAttribute('x2', anchorX);
    crosshair.setAttribute('opacity', '1');

    normalized.forEach((entry, index) => {
      const match = entry.points.find((point) => point.x === anchor.x);
      const dot = hoverDots[index];
      if (match) {
        dot.setAttribute('cx', xScale(match.x));
        dot.setAttribute('cy', yScale(match.y));
        dot.setAttribute('opacity', '1');
      } else {
        dot.setAttribute('opacity', '0');
      }
    });

    const dateLabel = opts.xFormat
      ? opts.xFormat(anchor.x)
      : new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(anchor.x));
    const rows = normalized
      .map((entry) => {
        const match = entry.points.find((point) => point.x === anchor.x);
        if (!match) return '';
        const value = opts.valueFormat ? opts.valueFormat(match.y) : niceNumber(match.y);
        return `<div class="chart__tooltip-row"><span>${entry.label}</span><strong style="color:${entry.color || '#fff'}">${value}</strong></div>`;
      })
      .join('');

    tooltip.innerHTML = `<span class="chart__tooltip-title">${dateLabel}</span>${rows}`;
    tooltip.classList.add('is-visible');

    const containerRect = container.getBoundingClientRect();
    let left = event.clientX - containerRect.left + 14;
    let top = event.clientY - containerRect.top - 14;
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    if (left + tooltipWidth > containerRect.width - 6) {
      left = event.clientX - containerRect.left - tooltipWidth - 14;
    }
    if (top + tooltipHeight > containerRect.height - 6) {
      top = event.clientY - containerRect.top - tooltipHeight - 14;
    }
    tooltip.style.left = `${Math.max(6, left)}px`;
    tooltip.style.top = `${Math.max(6, top)}px`;
  });

  overlay.addEventListener('pointerleave', hide);
  overlay.addEventListener('pointercancel', hide);
}

export function sparkline(data, color = '#ff2e88', options = {}) {
  const width = 140;
  const height = options.height || 44;
  const values = data.map((point) => Number(typeof point === 'object' ? point.y : point));
  const clean = values.filter((value) => Number.isFinite(value));
  if (clean.length < 2) return '';

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;
  const points = clean.map((value, index) => ({
    x: (index / (clean.length - 1)) * width,
    y: 3 + (1 - (value - min) / span) * (height - 6),
  }));
  const line = smoothPath(points);
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const id = uid('spark');

  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity=".24"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#${id})"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

function polar(cx, cy, radius, angleDeg) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function arcPath(cx, cy, radius, startAngle, endAngle) {
  const start = polar(cx, cy, radius, startAngle);
  const end = polar(cx, cy, radius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

export function createGauge(container, value, opts = {}) {
  if (!container) return;
  container.innerHTML = '';

  const width = 300;
  const height = 190;
  const cx = 150;
  const cy = 158;
  const radius = 112;
  const clamped = Math.min(Math.max(Number(value) || 0, 0), 100);
  const startAngle = -90;
  const endAngle = 90;
  const valueAngle = startAngle + ((endAngle - startAngle) * clamped) / 100;
  const color = opts.color || (clamped >= 70 ? '#ff2e88' : clamped >= 40 ? '#ffc857' : '#21e6c1');

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': `${opts.label || 'Gauge'}: ${Math.round(clamped)} von 100`,
  });

  svg.appendChild(
    el('path', {
      d: arcPath(cx, cy, radius, startAngle, endAngle),
      fill: 'none',
      stroke: 'rgba(255,255,255,0.08)',
      'stroke-width': 14,
      'stroke-linecap': 'round',
    }),
  );

  svg.appendChild(
    el('path', {
      d: arcPath(cx, cy, radius, startAngle, valueAngle),
      fill: 'none',
      stroke: color,
      'stroke-width': 14,
      'stroke-linecap': 'round',
      style: `filter: drop-shadow(0 0 10px ${color}55)`,
    }),
  );

  for (let i = 0; i <= 4; i += 1) {
    const angle = startAngle + ((endAngle - startAngle) * i) / 4;
    const outer = polar(cx, cy, radius + 15, angle);
    const inner = polar(cx, cy, radius + 21, angle);
    svg.appendChild(
      el('line', {
        x1: inner.x,
        y1: inner.y,
        x2: outer.x,
        y2: outer.y,
        stroke: 'rgba(255,255,255,0.18)',
        'stroke-width': 1,
      }),
    );
    const label = polar(cx, cy, radius + 25, angle);
    const text = el('text', {
      x: label.x,
      y: label.y + 3,
      'text-anchor': 'middle',
      fill: 'rgba(153,150,163,0.8)',
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 9,
    });
    text.textContent = String(i * 25);
    svg.appendChild(text);
  }

  const needle = polar(cx, cy, radius - 24, valueAngle);
  svg.appendChild(
    el('line', {
      x1: cx,
      y1: cy,
      x2: needle.x,
      y2: needle.y,
      stroke: '#f4efe6',
      'stroke-width': 2,
      'stroke-linecap': 'round',
    }),
  );
  svg.appendChild(el('circle', { cx, cy, r: 5, fill: '#f4efe6', stroke: '#07070a', 'stroke-width': 2 }));

  const valueText = el('text', {
    x: cx,
    y: cy - 30,
    'text-anchor': 'middle',
    fill: '#f4efe6',
    'font-family': 'JetBrains Mono, monospace',
    'font-size': 40,
    'font-weight': 700,
  });
  valueText.textContent = Math.round(clamped);
  svg.appendChild(valueText);

  const labelText = el('text', {
    x: cx,
    y: cy + 25,
    'text-anchor': 'middle',
    fill: 'rgba(153,150,163,0.95)',
    'font-family': 'Barlow Condensed, sans-serif',
    'font-size': 11,
    'letter-spacing': '0.18em',
  });
  labelText.textContent = (opts.label || 'SIGNAL').toUpperCase();
  svg.appendChild(labelText);

  container.appendChild(svg);
}

export function createBarChart(container, data, opts = {}) {
  if (!container) return;
  container.innerHTML = '';

  const width = Math.max(320, Math.min(1000, Math.round(container.clientWidth || 1000)));
  const height = opts.height || 260;
  const narrow = width < 600;
  const pad = { top: 22, right: narrow ? 12 : 20, bottom: 32, left: narrow ? 40 : 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const values = data.map((point) => Number(point.count ?? point.y ?? 0));
  const min = opts.min ?? 0;
  const max = opts.max ?? Math.max(...values, 1);
  const span = Math.max(max - min, 1);
  const barGap = narrow ? 4 : 8;
  const barWidth = Math.max((innerW - barGap * (data.length - 1)) / Math.max(data.length, 1), 2);

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': opts.ariaLabel || 'Balkendiagramm',
  });

  for (let i = 0; i <= 3; i += 1) {
    const y = pad.top + (innerH / 3) * i;
    svg.appendChild(
      el('line', {
        x1: pad.left,
        x2: width - pad.right,
        y1: y,
        y2: y,
        stroke: 'rgba(255,255,255,0.07)',
      }),
    );
    const value = max - (span / 3) * i;
    const label = el('text', {
      x: pad.left - 8,
      y: y + 4,
      'text-anchor': 'end',
      fill: 'rgba(153,150,163,0.85)',
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 9,
    });
    label.textContent = opts.yFormat ? opts.yFormat(value) : niceNumber(value);
    svg.appendChild(label);
  }

  data.forEach((point, index) => {
    const value = Number(point.count ?? point.y ?? 0);
    const barHeight = ((value - min) / span) * innerH;
    const x = pad.left + index * (barWidth + barGap);
    const y = pad.top + innerH - barHeight;

    const bar = el('rect', {
      x,
      y,
      width: barWidth,
      height: Math.max(barHeight, 2),
      fill: opts.color || '#ff2e88',
      opacity: 0.72,
      rx: 1,
    });
    const title = el('title');
    title.textContent = `${opts.xFormat ? opts.xFormat(point.date) : point.date}: ${value}`;
    bar.appendChild(title);
    svg.appendChild(bar);

    const label = el('text', {
      x: x + barWidth / 2,
      y: height - 10,
      'text-anchor': 'middle',
      fill: 'rgba(153,150,163,0.85)',
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 9,
    });
    label.textContent = opts.xFormat
      ? opts.xFormat(point.date)
      : new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(new Date(point.date));
    svg.appendChild(label);
  });

  container.appendChild(svg);
}
