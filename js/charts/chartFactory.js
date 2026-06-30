// ============================================================
//  chartFactory — Chart.js grafiklari (theme-aware, dark mos).
//  CDN'dan ESM sifatida yuklanadi.
// ============================================================
import Chart from 'https://esm.sh/chart.js@4/auto';

Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
Chart.defaults.font.weight = 500;

const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

export function chartTheme() {
  return {
    primary: css('--primary') || '#4f46e5',
    accent:  css('--accent')  || '#38bdf8',
    success: css('--success') || '#22c55e',
    warning: css('--warning') || '#f59e0b',
    danger:  css('--danger')  || '#ef4444',
    text:    css('--text-muted') || '#6b7194',
    grid:    css('--border') || 'rgba(0,0,0,0.08)',
  };
}

function hexA(hex, a) {
  hex = (hex || '#4f46e5').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function base(t) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { labels: { color: t.text, usePointStyle: true, pointStyle: 'circle', padding: 16, font: { weight: 600 } } },
      tooltip: { padding: 12, cornerRadius: 12, titleFont: { weight: 700 }, displayColors: false },
    },
    scales: {
      x: { ticks: { color: t.text, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { display: false } },
      y: { ticks: { color: t.text, precision: 0 }, grid: { color: t.grid }, beginAtZero: true, border: { display: false } },
    },
    animation: { duration: 650, easing: 'easeOutQuart' },
  };
}

export function lineChart(canvas, { labels, data, label = "O'quvchilar" }) {
  const t = chartTheme();
  const g = canvas.getContext('2d').createLinearGradient(0, 0, 0, 280);
  g.addColorStop(0, hexA(t.primary, 0.30));
  g.addColorStop(1, hexA(t.primary, 0));
  return new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: [{
      label, data, borderColor: t.primary, backgroundColor: g, fill: true,
      tension: 0.35, borderWidth: 3, pointRadius: 0, pointHoverRadius: 6, pointBackgroundColor: t.primary,
    }] },
    options: base(t),
  });
}

export function barChart(canvas, { labels, data, label = 'Jami' }) {
  const t = chartTheme();
  const palette = [t.primary, t.accent, t.warning, t.success, t.danger];
  return new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: [{
      label, data, backgroundColor: labels.map((_, i) => palette[i % palette.length]),
      borderRadius: 10, borderSkipped: false, maxBarThickness: 54,
    }] },
    options: { ...base(t), plugins: { ...base(t).plugins, legend: { display: false } } },
  });
}

export function doughnutChart(canvas, { labels, data }) {
  const t = chartTheme();
  return new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: [t.primary, t.accent, t.success], borderWidth: 0, hoverOffset: 8 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '66%',
      plugins: { legend: { position: 'bottom', labels: { color: t.text, usePointStyle: true, pointStyle: 'circle', padding: 14, font: { weight: 600 } } },
        tooltip: { padding: 12, cornerRadius: 12, displayColors: false } },
      animation: { duration: 650 },
    },
  });
}
