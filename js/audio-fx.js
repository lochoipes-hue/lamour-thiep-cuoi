/**
 * DaiLo Wedding — Bộ Tổng Hợp Nhạc Nền Cưới + Engine Hiệu Ứng Hoa Rơi / Tim Bay 3D 60fps
 * Bổ sung: Chiều sâu đa lớp (depth-of-field), gió cuốn tự nhiên, 9 loại hạt nghệ thuật,
 * hiệu ứng bung cánh hoa lễ hội khi mở thiệp / gửi lời chúc, và vệt lấp lánh tương tác khi chạm.
 */

const NOTE_FREQ = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, 'F#3': 185.00, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, 'F#4': 369.99, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, 'C#5': 554.37, D5: 587.33, E5: 659.25, F5: 698.46, 'F#5': 739.99, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66,
};

const MELODIES = {
  'canon-d': {
    tempoMs: 560,
    timbre: 'piano',
    seq: [
      ['F#5', ['D3', 'A3', 'D4'], 2], ['E5', ['A3', 'E4'], 2],
      ['D5', ['B3', 'F#4'], 2], ['C#5', ['F#3', 'C#4'], 2],
      ['B4', ['G3', 'D4'], 2], ['A4', ['D3', 'A3'], 2],
      ['B4', ['G3', 'D4'], 2], ['C#5', ['A3', 'E4'], 2],
      ['D5', ['D3', 'F#4'], 1], ['F#5', null, 1], ['A5', ['A3', 'E4'], 1], ['G5', null, 1],
      ['F#5', ['B3', 'D4'], 1], ['D5', null, 1], ['F#5', ['F#3', 'A3'], 1], ['E5', null, 1],
      ['D5', ['G3', 'B3'], 1], ['B4', null, 1], ['D5', ['D3', 'A3'], 1], ['F#5', null, 1],
      ['G5', ['G3', 'D4'], 1], ['F#5', null, 1], ['E5', ['A3', 'E4'], 2],
    ],
  },
  'wedding-box': {
    tempoMs: 470,
    timbre: 'musicbox',
    seq: [
      ['C5', ['C4', 'G4'], 1], ['F5', null, 1.5], ['F5', null, 0.5], ['F5', ['F4', 'A4'], 2],
      ['C5', ['C4', 'G4'], 1], ['G5', null, 1.5], ['E5', null, 0.5], ['F5', ['F4', 'C5'], 2],
      ['C5', ['C4', 'E4'], 1], ['F5', null, 1], ['A5', ['F4', 'C5'], 1], ['G5', null, 1],
      ['F5', ['G4', 'B4'], 1.5], ['E5', null, 0.5], ['G5', ['C4', 'G4'], 2],
      ['A5', ['F4', 'C5'], 1.5], ['G5', null, 0.5], ['F5', ['D4', 'A4'], 1], ['E5', null, 1],
      ['D5', ['G4', 'B4'], 1], ['E5', null, 1], ['C5', ['C4', 'G4'], 2],
    ],
  },
  'romantic-waltz': {
    tempoMs: 490,
    timbre: 'harp',
    seq: [
      ['E5', ['C3', 'G3', 'E4'], 1], ['G5', null, 1], ['C6', null, 1],
      ['B5', ['G3', 'D4', 'G4'], 1], ['G5', null, 1], ['D5', null, 1],
      ['A5', ['A3', 'E4'], 1], ['E5', null, 1], ['C5', null, 1],
      ['G5', ['E3', 'B3', 'E4'], 2], ['E5', null, 1],
      ['F5', ['F3', 'C4', 'A4'], 1], ['A5', null, 1], ['G5', null, 1],
      ['E5', ['C3', 'G3', 'C4'], 1], ['G5', null, 1], ['C5', null, 1],
      ['D5', ['G3', 'D4'], 1], ['F5', null, 1], ['E5', null, 1],
      ['C5', ['C3', 'G3', 'E4'], 3],
    ],
  },
  moonlight: {
    tempoMs: 650,
    timbre: 'pad',
    seq: [
      ['E5', ['A3', 'E4'], 2], ['C5', ['A3', 'C4'], 2],
      ['D5', ['F3', 'C4'], 2], ['B4', ['G3', 'D4'], 2],
      ['C5', ['C3', 'G3'], 2], ['G5', ['E3', 'B3'], 2],
      ['A5', ['F3', 'C4'], 2], ['E5', ['E3', 'B3'], 2],
      ['F5', ['D3', 'A3'], 2], ['E5', ['C3', 'G3'], 2],
      ['D5', ['G3', 'B3'], 2], ['C5', ['A3', 'E4'], 2],
    ],
  },
  'xuan-hy': {
    tempoMs: 440,
    timbre: 'guzheng',
    seq: [
      ['G5', ['C4', 'G4'], 1], ['A5', null, 1], ['C6', ['C4', 'E4'], 1.5], ['A5', null, 0.5],
      ['G5', ['G3', 'D4'], 1], ['E5', null, 1], ['D5', ['D4', 'A4'], 2],
      ['E5', ['C4', 'G4'], 1], ['G5', null, 1], ['A5', ['A3', 'E4'], 1], ['G5', null, 1],
      ['E5', ['G3', 'D4'], 1.5], ['D5', null, 0.5], ['C5', ['C4', 'G4'], 2],
      ['D5', ['D4', 'A4'], 1], ['E5', null, 1], ['G5', ['C4', 'E4'], 1], ['A5', null, 1],
      ['G5', ['G3', 'D4'], 1], ['E5', null, 1], ['G5', ['C4', 'G4'], 2],
    ],
  },
};

export class WeddingMusicEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.playing = false;
    this.timerId = null;
    this.stepIdx = 0;
    this.audioEl = null;
    this.config = { trackId: 'canon-d', customUrl: '', volume: 0.65 };
    this.listeners = new Set();
  }

  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.playing));
  }

  ensureContext() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = (this.config.volume ?? 0.65) * 0.45;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return true;
  }

  playSynthNote(freq, durationSec, timbre = 'piano', gainScale = 1) {
    if (!this.ctx || !freq) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    if (timbre === 'musicbox') {
      osc.type = 'sine';
      osc2.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3600, now);
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(0.24 * gainScale, now + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0008, now + durationSec * 1.6);
    } else if (timbre === 'guzheng') {
      osc.type = 'triangle';
      osc2.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2.002, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, now);
      filter.frequency.exponentialRampToValueAtTime(900, now + durationSec);
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(0.26 * gainScale, now + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0008, now + durationSec * 1.45);
    } else if (timbre === 'pad') {
      osc.type = 'sine';
      osc2.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.003, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(0.18 * gainScale, now + 0.25);
      env.gain.exponentialRampToValueAtTime(0.0008, now + durationSec * 1.7);
    } else {
      osc.type = 'triangle';
      osc2.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(timbre === 'harp' ? 2400 : 1900, now);
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(0.22 * gainScale, now + 0.025);
      env.gain.exponentialRampToValueAtTime(0.0008, now + durationSec * 1.55);
    }

    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.22;

    osc.connect(filter);
    osc2.connect(subGain);
    subGain.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    const stopAt = now + durationSec * 1.8;
    osc.stop(stopAt);
    osc2.stop(stopAt);
  }

  scheduleNextStep() {
    if (!this.playing) return;
    const track = MELODIES[this.config.trackId] || MELODIES['canon-d'];
    const [melodyNote, chordNotes, beats] = track.seq[this.stepIdx % track.seq.length];
    const durMs = track.tempoMs * beats;
    const durSec = durMs / 1000;

    if (melodyNote && NOTE_FREQ[melodyNote]) {
      this.playSynthNote(NOTE_FREQ[melodyNote], durSec, track.timbre, 1.0);
    }
    if (Array.isArray(chordNotes)) {
      chordNotes.forEach((cn, idx) => {
        if (NOTE_FREQ[cn]) {
          setTimeout(() => {
            if (this.playing) this.playSynthNote(NOTE_FREQ[cn], durSec * 1.2, track.timbre, 0.42);
          }, idx * 28);
        }
      });
    }

    this.stepIdx = (this.stepIdx + 1) % track.seq.length;
    this.timerId = setTimeout(() => this.scheduleNextStep(), durMs);
  }

  async start(config = {}) {
    this.stop();
    this.config = { ...this.config, ...config };
    const useCustom = this.config.trackId === 'custom' && this.config.customUrl;

    if (useCustom) {
      try {
        this.audioEl = new Audio(this.config.customUrl);
        this.audioEl.loop = true;
        this.audioEl.volume = this.config.volume ?? 0.65;
        await this.audioEl.play();
        this.playing = true;
        this.notify();
        return true;
      } catch (_) {
        this.audioEl = null;
      }
    }

    if (!this.ensureContext()) return false;
    if (this.masterGain) {
      this.masterGain.gain.value = (this.config.volume ?? 0.65) * 0.45;
    }
    this.playing = true;
    this.stepIdx = 0;
    this.scheduleNextStep();
    this.notify();
    return true;
  }

  stop() {
    this.playing = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.currentTime = 0;
      } catch (_) {}
      this.audioEl = null;
    }
    this.notify();
  }

  toggle(config) {
    if (this.playing) {
      this.stop();
      return false;
    }
    this.start(config || this.config);
    return true;
  }

  setVolume(vol) {
    this.config.volume = vol;
    if (this.audioEl) this.audioEl.volume = vol;
    if (this.masterGain) this.masterGain.gain.value = vol * 0.45;
  }
}

export const musicEngine = new WeddingMusicEngine();

/**
 * 60fps 3D Layered Canvas Particle & Burst FX Engine
 * Hỗ trợ: 9 hiệu ứng hạt nghệ thuật đa chiều sâu + Gió tự nhiên + Bung cánh hoa lễ hội + Vệt tương tác chạm
 */
export class ParticleCanvasController {
  constructor(canvas, effect = 'burgundy-petals', density = 'medium') {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.effect = effect;
    this.density = density;
    this.particles = [];
    this.bursts = [];
    this.rafId = null;
    this.running = false;
    this.clock = 0;
    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler);
    this.resize();
    this.configure(effect, density);
  }

  resize() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(rect.width, 300);
    this.height = Math.max(rect.height, 420);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  configure(effect, density = 'medium') {
    this.effect = effect || 'none';
    this.density = density || 'medium';
    if (this.effect === 'none') {
      this.particles = [];
      if (!this.bursts.length) {
        this.stop();
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
      return;
    }
    const baseCount = this.width < 520 ? 26 : 46;
    const factor = density === 'low' ? 0.55 : density === 'high' ? 1.65 : 1.0;
    const count = Math.round(baseCount * factor);
    this.particles = Array.from({ length: count }, () => this.spawn(true));
    this.ensureLoop();
  }

  ensureLoop() {
    if (!this.running) {
      this.running = true;
      this.loop();
    }
  }

  spawn(randomY = false) {
    const upward = this.effect === 'hearts' || this.effect === 'fireflies';
    const depth = 0.55 + Math.random() * 0.9; // 0.55 (far) -> 1.45 (near foreground)
    const x = Math.random() * this.width;
    const y = randomY ? Math.random() * this.height : (upward ? this.height + 24 : -24);
    const sizeBase = (this.effect === 'gold-bokeh' ? 6 + Math.random() * 14 : 6.5 + Math.random() * 8) * depth;

    return {
      x,
      y,
      depth,
      size: sizeBase,
      vx: (Math.random() - 0.5) * 0.7 * depth,
      vy: (upward ? -(0.4 + Math.random() * 0.95) : (0.55 + Math.random() * 1.15)) * depth,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.036,
      flip: Math.random() * Math.PI * 2,
      flipSpeed: 0.018 + Math.random() * 0.035,
      swayPhase: Math.random() * Math.PI * 2,
      swayAmp: (0.4 + Math.random() * 0.85) * depth,
      alpha: Math.min(0.95, (0.32 + Math.random() * 0.55) * (depth > 0.85 ? 1 : 0.72)),
      colorIdx: Math.floor(Math.random() * 4),
    };
  }

  /**
   * Hiệu ứng bung cánh hoa & ánh kim lễ hội khi chạm mở bìa hoặc gửi lời chúc!
   */
  triggerBurst(x, y, count = 34) {
    const cx = x ?? this.width * 0.5;
    const cy = y ?? this.height * 0.42;
    const palette = this.getPaletteForEffect(this.effect === 'none' ? 'burgundy-petals' : this.effect);
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
      const spd = 2.2 + Math.random() * 5.8;
      this.bursts.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 2.2,
        gravity: 0.085 + Math.random() * 0.05,
        drag: 0.975,
        size: 5 + Math.random() * 8,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.14,
        flip: Math.random() * Math.PI,
        life: 1,
        decay: 0.0085 + Math.random() * 0.007,
        kind: i % 3 === 0 ? 'sparkle' : 'petal',
        color: palette[i % palette.length],
      });
    }
    this.ensureLoop();
  }

  /**
   * Vệt lấp lánh nhẹ khi rê chuột / chạm lướt trên thiệp
   */
  spawnTrail(x, y) {
    if (this.bursts.length > 90) return;
    const palette = this.getPaletteForEffect(this.effect === 'none' ? 'gold-bokeh' : this.effect);
    this.bursts.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.9,
      vy: 0.35 + Math.random() * 0.7,
      gravity: 0.015,
      drag: 0.98,
      size: 3.5 + Math.random() * 4.5,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.08,
      flip: Math.random() * Math.PI,
      life: 0.85,
      decay: 0.022,
      kind: Math.random() > 0.4 ? 'sparkle' : 'petal',
      color: palette[Math.floor(Math.random() * palette.length)],
    });
    this.ensureLoop();
  }

  getPaletteForEffect(fx) {
    switch (fx) {
      case 'sakura': return ['#F8C5D4', '#F4A6BE', '#FDE3EC', '#E58AA6'];
      case 'hearts': return ['#D9A64C', '#9E2A35', '#E8C57B', '#C44556'];
      case 'olive-leaves': return ['#BFA366', '#6F8558', '#D6BE88', '#4F6940'];
      case 'white-feathers': return ['#FFFFFF', '#F7F3EC', '#ECE5D8', '#FFFDF8'];
      case 'champagne-confetti': return ['#E5C47A', '#C99A44', '#F7E7BE', '#B86E78'];
      case 'gold-bokeh': return ['#F5DC9B', '#DFB35C', '#FFF3CE', '#D49E48'];
      case 'burgundy-petals':
      default: return ['#7D1D26', '#A62C38', '#F2E2CC', '#591319'];
    }
  }

  drawHeart(ctx, size, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    const s = size * 0.5;
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s, -s * 0.45, -s * 1.15, s * 0.55, 0, s * 1.25);
    ctx.bezierCurveTo(s * 1.15, s * 0.55, s, -s * 0.45, 0, s * 0.35);
    ctx.fill();
  }

  drawPetal(ctx, size, fill, veinColor) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.72);
    ctx.bezierCurveTo(size * 0.8, -size * 0.42, size * 0.76, size * 0.58, 0, size * 0.88);
    ctx.bezierCurveTo(-size * 0.76, size * 0.58, -size * 0.8, -size * 0.42, 0, -size * 0.72);
    ctx.fill();
    if (veinColor) {
      ctx.strokeStyle = veinColor;
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.46);
      ctx.quadraticCurveTo(size * 0.1, 0, 0, size * 0.52);
      ctx.stroke();
    }
  }

  drawLeaf(ctx, size, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.95);
    ctx.quadraticCurveTo(size * 0.62, -size * 0.1, 0, size * 0.95);
    ctx.quadraticCurveTo(-size * 0.62, -size * 0.1, 0, -size * 0.95);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,250,235,0.45)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.75);
    ctx.lineTo(0, size * 0.75);
    ctx.stroke();
  }

  drawFeather(ctx, size, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.34, size * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,165,145,0.4)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.95);
    ctx.lineTo(0, size * 1.15);
    ctx.stroke();
  }

  drawSparkle(ctx, size, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const r1 = size;
      const r2 = size * 0.22;
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a + Math.PI / 4) * r2, Math.sin(a + Math.PI / 4) * r2);
    }
    ctx.closePath();
    ctx.fill();
  }

  loop() {
    if (!this.running) return;
    this.clock += 0.016;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const windGust = Math.sin(this.clock * 0.55) * 0.45;
    const palette = this.getPaletteForEffect(this.effect);

    // 1. Ambient layered particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.swayPhase += 0.018;
      p.x += p.vx + windGust * p.depth + Math.sin(p.swayPhase) * p.swayAmp;
      p.y += p.vy;
      p.angle += p.spin;
      p.flip += p.flipSpeed;

      const upward = this.effect === 'hearts' || this.effect === 'fireflies';
      if ((!upward && p.y > this.height + 28) || (upward && p.y < -28) || p.x < -36 || p.x > this.width + 36) {
        this.particles[i] = this.spawn(false);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      const tumbleX = ['burgundy-petals', 'sakura', 'olive-leaves', 'champagne-confetti'].includes(this.effect)
        ? Math.max(0.22, Math.abs(Math.cos(p.flip)))
        : 1;
      ctx.scale(tumbleX, 1);

      const col = palette[p.colorIdx % palette.length];
      if (this.effect === 'burgundy-petals' || this.effect === 'sakura') {
        ctx.globalAlpha = p.alpha;
        this.drawPetal(ctx, p.size, col, 'rgba(255,245,240,0.36)');
      } else if (this.effect === 'olive-leaves') {
        ctx.globalAlpha = p.alpha * 0.9;
        this.drawLeaf(ctx, p.size, col);
      } else if (this.effect === 'white-feathers') {
        ctx.globalAlpha = p.alpha * 0.82;
        this.drawFeather(ctx, p.size, col);
      } else if (this.effect === 'champagne-confetti') {
        ctx.globalAlpha = p.alpha * 0.92;
        ctx.fillStyle = col;
        ctx.fillRect(-p.size * 0.55, -p.size * 0.22, p.size * 1.1, p.size * 0.44);
      } else if (this.effect === 'hearts') {
        ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.flip));
        this.drawHeart(ctx, p.size, col);
      } else if (this.effect === 'gold-bokeh') {
        const pulse = 0.25 + 0.55 * Math.abs(Math.sin(p.flip));
        ctx.globalAlpha = p.alpha * pulse;
        if (p.colorIdx === 0) {
          this.drawSparkle(ctx, p.size * 0.55, col);
        } else {
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
          g.addColorStop(0, col);
          g.addColorStop(1, 'rgba(245,220,155,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (this.effect === 'snow') {
        ctx.globalAlpha = p.alpha * 0.85;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 0.65);
        grad.addColorStop(0, 'rgba(255,255,255,0.95)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.65, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.effect === 'fireflies') {
        const pulse = 0.3 + 0.7 * Math.abs(Math.sin(p.flip));
        ctx.globalAlpha = p.alpha * pulse;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 1.15);
        grad.addColorStop(0, 'rgba(255, 240, 175, 0.96)');
        grad.addColorStop(0.45, 'rgba(225, 190, 96, 0.42)');
        grad.addColorStop(1, 'rgba(225, 190, 96, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 1.15, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Interactive Celebration Bursts & Touch Trails
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.vx *= b.drag;
      b.vy = b.vy * b.drag + b.gravity;
      b.x += b.vx;
      b.y += b.vy;
      b.angle += b.spin;
      b.flip += 0.12;
      b.life -= b.decay;
      if (b.life <= 0) {
        this.bursts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);
      ctx.scale(Math.max(0.25, Math.abs(Math.cos(b.flip))), 1);
      ctx.globalAlpha = Math.max(0, b.life);
      if (b.kind === 'sparkle') {
        this.drawSparkle(ctx, b.size * 0.7, '#F2D388');
      } else {
        this.drawPetal(ctx, b.size, b.color, 'rgba(255,255,255,0.3)');
      }
      ctx.restore();
    }

    if (this.effect === 'none' && this.bursts.length === 0) {
      this.stop();
      return;
    }

    this.rafId = requestAnimationFrame(() => this.loop());
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.resizeHandler);
  }
}
