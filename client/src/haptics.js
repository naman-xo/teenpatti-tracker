// Synthesized sounds via Web Audio API — no audio files needed
// Haptics via Vibration API (Android) + visual feedback fallback

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function playTone({ freq = 440, freq2, type = "square", duration = 0.08, gain = 0.15, decay = 0.05, delay = 0 }) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gainNode = c.createGain();
    osc.connect(gainNode);
    gainNode.connect(c.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);
    if (freq2) osc.frequency.exponentialRampToValueAtTime(freq2, c.currentTime + delay + duration);

    gainNode.gain.setValueAtTime(0, c.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(gain, c.currentTime + delay + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration + decay);

    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + duration + decay + 0.01);
  } catch (e) {
    // AudioContext blocked or unavailable — silent fallback
  }
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// ─── Sound Library ───────────────────────────────────────────────

export const sounds = {
  // Short mechanical click — buttons, tabs
  click() {
    playTone({ freq: 800, freq2: 400, type: "square", duration: 0.04, gain: 0.08, decay: 0.02 });
    vibrate(10);
  },

  // Primary action — create room, start game, confirm
  confirm() {
    playTone({ freq: 220, freq2: 440, type: "sawtooth", duration: 0.1, gain: 0.12 });
    playTone({ freq: 440, freq2: 880, type: "square", duration: 0.08, gain: 0.08, delay: 0.08 });
    vibrate([20, 10, 20]);
  },

  // Success — winner declared, round ended
  win() {
    [0, 0.07, 0.14, 0.2].forEach((delay, i) => {
      playTone({ freq: [330, 440, 550, 660][i], type: "square", duration: 0.12, gain: 0.1, decay: 0.08, delay });
    });
    vibrate([30, 20, 30, 20, 60]);
  },

  // Warning — pack, error
  pack() {
    playTone({ freq: 300, freq2: 150, type: "sawtooth", duration: 0.12, gain: 0.1, decay: 0.05 });
    vibrate([15, 5, 15]);
  },

  // Show called — dramatic
  show() {
    playTone({ freq: 150, type: "sawtooth", duration: 0.15, gain: 0.15, decay: 0.1 });
    playTone({ freq: 600, freq2: 300, type: "square", duration: 0.1, gain: 0.08, delay: 0.1 });
    vibrate([50, 20, 50]);
  },

  // Raise/bet — punchy
  bet() {
    playTone({ freq: 500, freq2: 700, type: "square", duration: 0.06, gain: 0.1, decay: 0.03 });
    vibrate(15);
  },

  // Navigation / screen change
  nav() {
    playTone({ freq: 600, freq2: 800, type: "square", duration: 0.05, gain: 0.06, decay: 0.02 });
    vibrate(8);
  },

  // Error
  error() {
    playTone({ freq: 180, freq2: 120, type: "sawtooth", duration: 0.2, gain: 0.12, decay: 0.05 });
    vibrate([40, 20, 40, 20, 40]);
  },

  // Numpad key press — very subtle
  numpad() {
    playTone({ freq: 1000, freq2: 800, type: "square", duration: 0.025, gain: 0.04, decay: 0.01 });
    vibrate(6);
  },

  // Player joined lobby
  join() {
    playTone({ freq: 440, freq2: 550, type: "sine", duration: 0.1, gain: 0.08 });
    vibrate(12);
  },

  // Game start — dramatic boot sequence
  gameStart() {
    [0, 0.1, 0.2].forEach((delay, i) => {
      playTone({ freq: [200, 300, 500][i], type: "sawtooth", duration: 0.15, gain: 0.1, delay });
    });
    playTone({ freq: 100, type: "sine", duration: 0.3, gain: 0.15, delay: 0.3 });
    vibrate([20, 10, 20, 10, 20, 10, 80]);
  },
};
