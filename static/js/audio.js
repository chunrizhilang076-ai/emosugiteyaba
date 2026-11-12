// Web Audio API による完全内蔵シンセサイザー音源
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.isPlayingBgm = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopBGM();
    } else {
      this.init();
      this.startBGM();
    }
    return this.enabled;
  }

  // エモい夕暮れのコード進行 (Fmaj7 -> G -> Em7 -> Am7)
  startBGM() {
    if (!this.enabled || this.isPlayingBgm) return;
    this.init();
    this.isPlayingBgm = true;

    // 周波数配列 (ローファイ・シンセパッド用コード進行)
    const chords = [
      [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
      [196.00, 246.94, 293.66, 392.00], // G (G3, B3, D4, G4)
      [164.81, 196.00, 246.94, 329.63], // Em7 (E3, G3, B3, E4)
      [220.00, 261.63, 329.63, 440.00], // Am7 (A3, C4, E4, A4)
    ];

    const playNextChord = () => {
      if (!this.isPlayingBgm || !this.enabled) return;
      
      const chord = chords[this.bgmStep % chords.length];
      this.bgmStep++;

      const now = this.ctx.currentTime;
      const duration = 2.6; // 秒

      chord.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // ローパスフィルターで夕暮れの温かいトーンを作る
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(1400, now + 1.2);
        filter.frequency.exponentialRampToValueAtTime(600, now + duration);

        // エンベロープ (フェードイン & フェードアウト)
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.035, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });

      this.bgmTimer = setTimeout(playNextChord, duration * 950);
    };

    playNextChord();
  }

  stopBGM() {
    this.isPlayingBgm = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // 星を拾ったときのキラキラ音
  playStarSound() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    
    // アルペジオ
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);

      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.35);
    });
  }

  // 衝突・ゲームオーバー音
  playCrashSound() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    // ノイズ風 + 低音インパクト
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  playClickSound() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }
}

window.soundManager = new SoundManager();
