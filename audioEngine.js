import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { SOUND_PROFILES } from '../utils/constants';

let _player = null;
let _rampInterval = null;
let _burstTimeout = null;
let _psychoInterval = null;
let _currentVolume = 0;

async function createPlayer(source, volume = 1.0) {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });

    const player = createAudioPlayer(source);
    player.loop = true;
    player.volume = Math.min(1.0, Math.max(0, volume));
    player.play();
    return player;
  } catch (e) {
    console.warn('[WakeForce] Audio error:', e);
    return null;
  }
}

function startBurstPattern(player, useHaptics) {
  const pattern = [
    { on: 850, off: 130 }, { on: 620, off: 380 }, { on: 1100, off: 90 },
    { on: 450, off: 520 }, { on: 780, off: 200 }, { on: 1300, off: 60 },
    { on: 500, off: 440 },
  ];
  let step = 0;

  function doOn() {
    if (!_player) return;
    try { player.play(); } catch {}
    if (useHaptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    _burstTimeout = setTimeout(doOff, pattern[step % pattern.length].on);
  }

  function doOff() {
    if (!_player) return;
    try { player.pause(); } catch {}
    const off = pattern[step % pattern.length].off;
    step++;
    _burstTimeout = setTimeout(doOn, off);
  }

  doOn();
}

function startVolumoTremolo(player, baseVolume) {
  let phase = 0;
  _psychoInterval = setInterval(() => {
    if (!_player) return;
    phase += 0.05;
    try {
      player.volume = Math.min(1.0, Math.max(0, baseVolume + Math.sin(phase) * 0.15));
    } catch {}
  }, 16);
}

function startVolumeRamp(player, startVol, targetVol, rampSeconds) {
  _currentVolume = startVol;
  const stepSize = (targetVol - startVol) / Math.max(rampSeconds * 2, 1);
  try { player.volume = _currentVolume; } catch {}

  _rampInterval = setInterval(() => {
    _currentVolume = Math.min(_currentVolume + stepSize, targetVol);
    try { player.volume = _currentVolume; } catch {}
    if (_currentVolume >= targetVol) clearInterval(_rampInterval);
  }, 500);
}

export async function startAlarm(alarm, settings = {}) {
  await stopAlarm();
  if (!alarm) return;

  const profile = SOUND_PROFILES[alarm.soundProfile] || SOUND_PROFILES.intense;
  const useHaptics = settings.hapticFeedback !== false;
  const usePsycho = settings.psychoAudio !== false;

  let source;
  if (alarm.soundProfile === 'custom' && alarm.customSoundUri) {
    source = { uri: alarm.customSoundUri };
  } else if (alarm.soundProfile === 'gentle') {
    source = require('../../assets/sounds/gentle.wav');
  } else if (alarm.soundProfile === 'military') {
    source = require('../../assets/sounds/military.wav');
  } else {
    source = require('../../assets/sounds/intense.wav');
  }

  _currentVolume = profile.startVolume;
  _player = await createPlayer(source, _currentVolume);
  if (!_player) return;

  if (profile.pattern === 'gradual') {
    startVolumeRamp(_player, profile.startVolume, profile.targetVolume, profile.rampDuration);
    if (usePsycho) startVolumoTremolo(_player, profile.startVolume);
    if (useHaptics) {
      _burstTimeout = setInterval(
        () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
        3000
      );
    }
  } else {
    _currentVolume = 1.0;
    try { _player.volume = 1.0; } catch {}
    if (usePsycho) {
      startBurstPattern(_player, useHaptics);
      startVolumoTremolo(_player, 1.0);
    } else if (useHaptics) {
      _burstTimeout = setInterval(
        () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}),
        600
      );
    }
  }
}

export async function stopAlarm() {
  clearInterval(_rampInterval);
  clearInterval(_psychoInterval);
  clearTimeout(_burstTimeout);
  clearInterval(_burstTimeout);
  _rampInterval = null;
  _psychoInterval = null;
  _burstTimeout = null;

  if (_player) {
    try { _player.remove(); } catch {}
    _player = null;
  }
  _currentVolume = 0;
}

export async function pulseHaptic(count = 3) {
  for (let i = 0; i < count; i++) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    await new Promise(r => setTimeout(r, 300));
  }
}
