/* =========================================================
   SPOS – Charts & Analytics (Canvas-based, no dependencies)
   ========================================================= */

'use strict';

const SPOSCharts = {

  // ── Color Palette ────────────────────────────────────────
  colors: {
    primary:   '#6C63FF',
    secondary: '#4ECDC4',
    success:   '#2ECC71',
    warning:   '#F39C12',
    danger:    '#E74C3C',
    info:      '#3498DB',
    purple:    '#9B59B6',
    grad: ['#6C63FF','#4ECDC4','#2ECC71','#F39C12','#E74C3C','#3498DB','#9B59B6'],
  },

  _rgba(hex, alpha) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  },

  // ── Line / Area Chart ────────────────────────────────────
  drawLine(canvasId, { labels, datasets, yLabel = 'LKR' }) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const W    = canvas.width  = canvas.offsetWidth || 600;
    const H    = canvas.height = canvas.offsetHeight || 200;
    const PAD  = { t: 20, r: 20, b: 40, l: 70 };
    const cW   = W - PAD.l - PAD.r;
    const cH   = H - PAD.t - PAD.b;

    ctx.clearRect(0, 0, W, H);

    const allVals = datasets.flatMap(d => d.data);
    const maxVal  = Math.max(...allVals) * 1.15 || 100;
    const minVal  = 0;

    const xStep = cW / Math.max(labels.length - 1, 1);
    const yScale = v => PAD.t + cH - ((v - minVal) / (maxVal - minVal)) * cH;
    const xScale = i => PAD.l + i * xStep;

    // Grid lines
    const gridLines = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
      const y = PAD.t + (cH / gridLines) * i;
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + cW, y); ctx.stroke();
      const val = maxVal - (maxVal / gridLines) * i;
      ctx.fillStyle = 'rgba(240,240,255,0.4)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val >= 1000 ? (val/1000).toFixed(0)+'K' : val.toFixed(0), PAD.l - 8, y + 4);
    }

    // X labels
    ctx.fillStyle = 'rgba(240,240,255,0.45)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((lbl, i) => ctx.fillText(lbl, xScale(i), H - PAD.b + 18));

    // Datasets
    datasets.forEach((ds, di) => {
      const color = ds.color || this.colors.grad[di % this.colors.grad.length];
      const pts   = ds.data.map((v, i) => ({ x: xScale(i), y: yScale(v) }));

      // Area fill
      ctx.beginPath();
      ctx.moveTo(pts[0].x, yScale(0));
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length-1].x, yScale(0));
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, PAD.t, 0, PAD.t + cH);
      grad.addColorStop(0, this._rgba(color, 0.3));
      grad.addColorStop(1, this._rgba(color, 0.0));
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Dots
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = '#07071A'; ctx.lineWidth = 2; ctx.stroke();
      });
    });
  },

  // ── Bar Chart ────────────────────────────────────────────
  drawBar(canvasId, { labels, datasets }) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const W    = canvas.width  = canvas.offsetWidth || 600;
    const H    = canvas.height = canvas.offsetHeight || 200;
    const PAD  = { t: 20, r: 20, b: 40, l: 70 };
    const cW   = W - PAD.l - PAD.r;
    const cH   = H - PAD.t - PAD.b;

    ctx.clearRect(0, 0, W, H);

    const allVals = datasets.flatMap(d => d.data);
    const maxVal  = Math.max(...allVals) * 1.15 || 100;

    const groupW = cW / labels.length;
    const barW   = Math.min(groupW * 0.6 / datasets.length, 40);
    const yScale = v => PAD.t + cH - (v / maxVal) * cH;

    // Grid
    const gridLines = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
      const y = PAD.t + (cH / gridLines) * i;
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + cW, y); ctx.stroke();
      const val = maxVal - (maxVal / gridLines) * i;
      ctx.fillStyle = 'rgba(240,240,255,0.4)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val >= 1000 ? (val/1000).toFixed(0)+'K' : val.toFixed(0), PAD.l - 8, y + 4);
    }

    // Bars
    labels.forEach((lbl, gi) => {
      const gx = PAD.l + gi * groupW + groupW / 2 - (barW * datasets.length) / 2;

      datasets.forEach((ds, di) => {
        const color = ds.color || this.colors.grad[di % this.colors.grad.length];
        const val   = ds.data[gi] || 0;
        const bh    = (val / maxVal) * cH;
        const bx    = gx + di * (barW + 2);
        const by    = yScale(val);

        const grad = ctx.createLinearGradient(0, by, 0, PAD.t + cH);
        grad.addColorStop(0, color);
        grad.addColorStop(1, this._rgba(color, 0.4));

        ctx.beginPath();
        ctx.roundRect?.(bx, by, barW, bh, [4, 4, 0, 0]);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // X label
      ctx.fillStyle = 'rgba(240,240,255,0.45)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lbl, PAD.l + gi * groupW + groupW / 2, H - PAD.b + 18);
    });
  },

  // ── Doughnut Chart ───────────────────────────────────────
  drawDoughnut(canvasId, { labels, values, colors }) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx   = canvas.getContext('2d');
    const W     = canvas.width  = canvas.offsetWidth || 200;
    const H     = canvas.height = canvas.offsetHeight || 200;
    const cx    = W / 2, cy = H / 2;
    const r     = Math.min(W, H) * 0.38;
    const inner = r * 0.6;
    const total = values.reduce((a, b) => a + b, 0) || 1;

    ctx.clearRect(0, 0, W, H);

    let angle = -Math.PI / 2;
    values.forEach((val, i) => {
      const slice = (val / total) * Math.PI * 2;
      const color = colors?.[i] || this.colors.grad[i % this.colors.grad.length];
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#07071A';
      ctx.lineWidth = 3;
      ctx.stroke();
      angle += slice;
    });

    // Inner cutout
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = '#0F0F2D';
    ctx.fill();

    // Center text
    ctx.fillStyle = 'rgba(240,240,255,0.9)';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(total.toLocaleString(), cx, cy + 6);
  },

  // ── Mini Sparkline ───────────────────────────────────────
  drawSparkline(canvasId, data, color = '#6C63FF') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W   = canvas.width  = canvas.offsetWidth || 120;
    const H   = canvas.height = canvas.offsetHeight || 40;
    const max = Math.max(...data) || 1;
    const min = Math.min(...data);

    ctx.clearRect(0, 0, W, H);

    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * W,
      y: H - ((v - min) / (max - min + 1)) * (H * 0.8) - H * 0.1,
    }));

    // Area
    ctx.beginPath();
    ctx.moveTo(0, H);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(W, H);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, this._rgba(color, 0.4));
    grad.addColorStop(1, this._rgba(color, 0.0));
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
  },

  // ── Generate Sample Data ─────────────────────────────────
  generateDailyData(days = 7, base = 50000) {
    return Array.from({ length: days }, () => Math.round(base * 0.5 + Math.random() * base));
  },

  dayLabels(days = 7) {
    const labels = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return labels;
  },

  monthLabels(months = 6) {
    const labels = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
    }
    return labels;
  }
};
