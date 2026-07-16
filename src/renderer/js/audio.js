let audioContext = null;

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(audio, frequency, startAt, duration, volume = 0.18) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = state.settings.tone === "soft" ? "sine" : "triangle";
  osc.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.03);
}

function getToneFrequencies() {
  const presets = {
    classic: [660, 880, 1046],
    soft: [440, 554, 659],
    deep: [220, 277, 330],
    bright: [784, 988, 1318]
  };

  if (state.settings.tone !== "custom") return presets[state.settings.tone] ?? presets.classic;

  const custom = state.settings.customTone
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value >= 80 && value <= 2000)
    .slice(0, 6);

  return custom.length > 0 ? custom : presets.classic;
}

function playDoneSound(force = false) {
  if (!state.settings.sound) return;
  const audio = getAudioContext();
  if (!audio) return;
  const now = audio.currentTime + (force ? 0.01 : 0.05);
  const frequencies = getToneFrequencies();
  const baseVolume = Math.max(0, Math.min(2, state.settings.volume / 100));
  frequencies.forEach((frequency, index) => {
    const isLastTone = index === frequencies.length - 1;
    playTone(audio, frequency, now + index * 0.26, isLastTone ? 0.46 : 0.28, Math.min(0.85, baseVolume * (isLastTone ? 0.42 : 0.48)));
  });
}

function notifyDone() {
  playDoneSound();
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Focus Tomato", { body: `${getModeLabel()} terminado.` });
  }
}
