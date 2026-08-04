class InteractiveFigure extends HTMLElement {
  private animationId = 0;

  connectedCallback(): void {
    if (this.querySelector('canvas')) return;

    const kind = this.getAttribute('data-figure') ?? 'spin';
    const width = Number(this.getAttribute('data-width')) || 640;
    const height = Number(this.getAttribute('data-height')) || 360;
    const canvas = document.createElement('canvas');
    canvas.className = 'interactive-figure';
    canvas.width = width;
    canvas.height = height;
    this.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const draw = () => {
      frame += 1;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.35;
      const speed = kind === 'wave' ? 0.05 : 0.02;

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = 'var(--accent, #0f766e)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 80; i += 1) {
        const t = i / 80;
        const angle = t * Math.PI * (kind === 'wave' ? 3 : 2) + frame * speed;
        const x = cx + Math.cos(angle) * radius * t;
        const y = cy + Math.sin(angle) * radius * t;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      this.animationId = requestAnimationFrame(draw);
    };

    this.animationId = requestAnimationFrame(draw);
  }

  disconnectedCallback(): void {
    cancelAnimationFrame(this.animationId);
  }
}

if (!customElements.get('interactive-figure')) {
  customElements.define('interactive-figure', InteractiveFigure);
}
