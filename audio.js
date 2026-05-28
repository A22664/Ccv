/* ============================================
   ROYAL CHESS 3D — Audio Engine
   Web Audio API Synthesized Sounds
   No external files — fully self-contained
   Lightweight & optimized
   ============================================ */

// ============================================
// AUDIO CONTEXT
// ============================================
let audioCtx = null;
let masterGain = null;
let volume = 0.7;
let soundEnabled = true;

function initAudio() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = volume;
        masterGain.connect(audioCtx.destination);
    } catch (e) {
        console.warn('Web Audio API not supported');
    }
}

function setVolume(vol) {
    volume = Math.max(0, Math.min(1, vol));
    if (masterGain) {
        masterGain.gain.setValueAtTime(volume, audioCtx.currentTime);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    return soundEnabled;
}

// ============================================
// SOUND SYNTHESIS FUNCTIONS
// ============================================

function playSound(type) {
    if (!soundEnabled || !audioCtx) return;

    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    switch (type) {
        case 'move':
            playMoveSound();
            break;
        case 'capture':
            playCaptureSound();
            break;
        case 'select':
            playSelectSound();
            break;
        case 'check':
            playCheckSound();
            break;
        case 'castle':
            playCastleSound();
            break;
        case 'gameStart':
            playGameStartSound();
            break;
        case 'victory':
            playVictorySound();
            break;
        case 'draw':
            playDrawSound();
            break;
        case 'click':
            playClickSound();
            break;
        case 'promotion':
            playPromotionSound();
            break;
    }
}

// ============================================
// INDIVIDUAL SOUND EFFECTS
// ============================================

function playMoveSound() {
    // Wooden piece sliding on board — soft, warm tone
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.15);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.15 * volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);

    // Add subtle noise for wood texture
    playWoodTexture(0.05);
}

function playCaptureSound() {
    // Metallic clash sound — sharp attack, quick decay
    const now = audioCtx.currentTime;

    // Main impact
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(600, now);
    osc1.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    gain1.gain.setValueAtTime(0.2 * volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Secondary ring
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(300, now + 0.15);
    gain2.gain.setValueAtTime(0.1 * volume, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now);
    osc2.stop(now + 0.15);

    // Noise burst for impact
    playNoiseBurst(0.1, 0.08);
}

function playSelectSound() {
    // Gentle click/selection sound
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08 * volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.1);
}

function playCheckSound() {
    // Warning alert sound
    const now = audioCtx.currentTime;

    for (let i = 0; i < 3; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now + i * 0.15);
        osc.frequency.setValueAtTime(1100, now + i * 0.15 + 0.05);

        gain.gain.setValueAtTime(0.12 * volume, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.1);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.1);
    }
}

function playCastleSound() {
    // Heavy stone sliding sound
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.4);

    gain.gain.setValueAtTime(0.2 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.5);

    playWoodTexture(0.1);
}

function playGameStartSound() {
    // Epic orchestral-like fanfare (simplified)
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);

        gain.gain.setValueAtTime(0, now + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.15 * volume, now + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.4);
    });
}

function playVictorySound() {
    // Triumphant fanfare
    const now = audioCtx.currentTime;
    const melody = [
        { f: 523.25, t: 0 },      // C5
        { f: 523.25, t: 0.15 },   // C5
        { f: 523.25, t: 0.3 },    // C5
        { f: 659.25, t: 0.45 },   // E5
        { f: 783.99, t: 0.6 },    // G5
        { f: 1046.50, t: 0.9 },   // C6 (hold)
    ];

    melody.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, now + note.t);

        const duration = note.t === 0.9 ? 0.8 : 0.2;
        gain.gain.setValueAtTime(0, now + note.t);
        gain.gain.linearRampToValueAtTime(0.2 * volume, now + note.t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + duration);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + note.t);
        osc.stop(now + note.t + duration);
    });

    // Add harmony
    const harmony = [
        { f: 329.63, t: 0 },      // E4
        { f: 392.00, t: 0.45 },   // G4
        { f: 523.25, t: 0.9 },    // C5
    ];

    harmony.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now + note.t);

        gain.gain.setValueAtTime(0, now + note.t);
        gain.gain.linearRampToValueAtTime(0.08 * volume, now + note.t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + 0.6);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + note.t);
        osc.stop(now + note.t + 0.6);
    });
}

function playDrawSound() {
    // Neutral ending sound
    const now = audioCtx.currentTime;
    const notes = [440, 440, 440]; // A4 repeated

    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.3);

        gain.gain.setValueAtTime(0.1 * volume, now + i * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.3 + 0.4);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.3);
        osc.stop(now + i * 0.3 + 0.4);
    });
}

function playClickSound() {
    // UI click — very short, crisp
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.06 * volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.05);
}

function playPromotionSound() {
    // Magical ascending sound
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.4);

    gain.gain.setValueAtTime(0.15 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.5);

    // Sparkle effect
    for (let i = 0; i < 5; i++) {
        const sparkOsc = audioCtx.createOscillator();
        const sparkGain = audioCtx.createGain();

        sparkOsc.type = 'sine';
        sparkOsc.frequency.setValueAtTime(2000 + i * 500, now + i * 0.08);

        sparkGain.gain.setValueAtTime(0, now + i * 0.08);
        sparkGain.gain.linearRampToValueAtTime(0.05 * volume, now + i * 0.08 + 0.02);
        sparkGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.1);

        sparkOsc.connect(sparkGain);
        sparkGain.connect(masterGain);
        sparkOsc.start(now + i * 0.08);
        sparkOsc.stop(now + i * 0.08 + 0.1);
    }
}

// ============================================
// HELPER SOUND FUNCTIONS
// ============================================

function playWoodTexture(intensity) {
    // Subtle noise for wooden piece texture
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * intensity * volume;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(intensity * volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start(audioCtx.currentTime);
    noise.stop(audioCtx.currentTime + 0.1);
}

function playNoiseBurst(intensity, duration) {
    // White noise burst for impact effects
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * intensity * volume;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 1;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(intensity * volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start(audioCtx.currentTime);
    noise.stop(audioCtx.currentTime + duration);
}

// ============================================
// EXPORT
// ============================================
window.initAudio = initAudio;
window.playSound = playSound;
window.setVolume = setVolume;
window.toggleSound = toggleSound;
