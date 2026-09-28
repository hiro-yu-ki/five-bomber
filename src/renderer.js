import { CONFIG } from './config.js';
import { currentPlayerIndex } from './core.js';

export class StageRenderer {
  constructor(canvas) {
    this.canvas = canvas; this.context = canvas.getContext('2d'); this.previousBomb = null; this.targetBomb = null; this.moveStartedAt = 0;
  }
  setBombTarget(point, now) {
    const target = { x: point.x, y: point.bombY ?? point.y };
    this.previousBomb = this.getBombPosition(now) || target; this.targetBomb = target; this.moveStartedAt = now;
  }
  getBombPosition(now) {
    if (!this.targetBomb) return null;
    const progress = Math.min(1, Math.max(0, (now - this.moveStartedAt) / CONFIG.bombMoveMs));
    const eased = 1 - (1 - progress) ** 3;
    return { x: this.previousBomb.x + (this.targetBomb.x - this.previousBomb.x) * eased, y: this.previousBomb.y + (this.targetBomb.y - this.previousBomb.y) * eased - Math.sin(progress * Math.PI) * 90 };
  }
  draw(game, now) {
    const ctx = this.context, { width, height } = this.canvas;
    const gradient = ctx.createLinearGradient(0, 0, 0, height); gradient.addColorStop(0, CONFIG.colors.skyTop); gradient.addColorStop(1, CONFIG.colors.skyBottom);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
    this.drawBackdrop(ctx, width, height, now);
    game.layouts.forEach((layout, index) => this.drawPipe(ctx, layout, index === currentPlayerIndex(game), game.phase));
    const bomb = this.getBombPosition(now) || game.layouts[currentPlayerIndex(game)];
    if (bomb && game.phase !== 'exploded') this.drawBomb(ctx, bomb.x, bomb.y, now, game.phase);
    if (['timeout', 'exploded'].includes(game.phase)) this.drawExplosion(ctx, bomb?.x ?? width / 2, bomb?.y ?? 650, now - game.startedAt);
    if (game.phase === 'cleared') this.drawFlash(ctx, now);
  }
  drawBackdrop(ctx, width, height, now) {
    ctx.save(); ctx.globalAlpha = 0.15; ctx.strokeStyle = '#65b9ff'; ctx.lineWidth = 3;
    for (let x = -200; x < width + 200; x += 180) { ctx.beginPath(); ctx.moveTo(x + (now / 30) % 180, 0); ctx.lineTo(x - 420 + (now / 30) % 180, height); ctx.stroke(); }
    ctx.restore(); ctx.fillStyle = '#07101c'; ctx.fillRect(0, 890, width, 190);
  }
  drawPipe(ctx, { x, y }, active, phase) {
    ctx.save(); ctx.translate(x, y); ctx.shadowColor = active ? '#ffda00' : '#000'; ctx.shadowBlur = active ? 30 : 12;
    const grad = ctx.createLinearGradient(-65, 0, 65, 0); grad.addColorStop(0, CONFIG.colors.pipeShadow); grad.addColorStop(0.45, CONFIG.colors.pipe); grad.addColorStop(0.7, '#f4f7fa'); grad.addColorStop(1, '#596978');
    ctx.fillStyle = grad; ctx.fillRect(-48, -180, 96, 190); ctx.fillRect(-72, -205, 144, 45);
    ctx.strokeStyle = active ? CONFIG.colors.accent : '#293543'; ctx.lineWidth = active ? 10 : 5; ctx.strokeRect(-72, -205, 144, 45);
    if (active && phase === 'question') { ctx.fillStyle = '#ff2a36'; ctx.beginPath(); ctx.arc(0, -230, 10, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  drawBomb(ctx, x, y, now, phase) {
    const pulse = phase === 'question' ? 1 + Math.sin(now / 95) * 0.035 : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(pulse, pulse); ctx.shadowColor = '#000'; ctx.shadowBlur = 24;
    const grad = ctx.createRadialGradient(-25, -30, 8, 0, 0, 78); grad.addColorStop(0, '#66717d'); grad.addColorStop(0.3, '#242a31'); grad.addColorStop(1, '#050608');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, 74, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5d6570'; ctx.fillRect(-18, -91, 36, 26); ctx.strokeStyle = '#a76c28'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(0, -91); ctx.quadraticCurveTo(35, -135, 62, -105); ctx.stroke();
    ctx.fillStyle = now % 300 < 150 ? '#fff' : '#ffbe00'; ctx.beginPath(); ctx.arc(65, -108, 10, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  drawExplosion(ctx, x, y, elapsed) {
    const progress = Math.min(1, elapsed / CONFIG.explosionMs), radius = 30 + progress * 430;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let ring = 3; ring > 0; ring--) { ctx.fillStyle = ring === 3 ? '#e6241d' : ring === 2 ? '#ff8a00' : '#fff4a3'; ctx.beginPath(); ctx.arc(x, y, radius * ring / 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1 - progress; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); ctx.restore();
  }
  drawFlash(ctx, now) { ctx.save(); ctx.globalAlpha = 0.1 + (Math.sin(now / 100) + 1) * 0.1; ctx.fillStyle = '#ffe344'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); ctx.restore(); }
}
