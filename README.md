# ⏰ WakeForce

**The alarm app that won't let you sleep in.**

A React Native / Expo alarm app built around cognitive science and psychoacoustics to make waking up actually work.

---

## Features

### 🔊 Sound Profiles
| Profile | Description | Psychology |
|---------|-------------|-----------|
| 🌅 **Gentle Rise** | Soft tones, 2-min volume ramp | Gradual arousal, less cortisol spike |
| ⚡ **Shock & Awe** | Max volume instantly | Fast attack transient = perceived 2-3x louder |
| 🚨 **No Mercy** | Irregular burst pattern, full volume | Prevents auditory habituation |
| 🎵 **Custom** | Your own audio file | Use what already wakes you up |

### 🧠 Psychoacoustic Tricks (what makes it actually louder)
- **Stereo pan oscillation** — rapidly sweeps L/R, brain perceives "larger" sound
- **Irregular burst pattern** — prevents auditory system from tuning it out
- **Sharp attack transients** — same RMS energy sounds much louder with fast rise time
- **Multi-modal: haptic sync** — vibration + audio is harder to sleep through than audio alone
- **Plays through iOS silent mode** — uses `playsInSilentModeIOS: true`

### 💤 REM Trick
Fires a *gentle* nudge 90 minutes before your actual alarm. If you fall back asleep, you'll complete one full REM cycle and wake at the natural cycle end — feeling significantly more refreshed. Completely optional per alarm.

### 🧮 Wake Challenges

#### Math Mode
- Adaptive difficulty based on your solve speed history
- **Target: 45–90 seconds** — enough to ensure you're cognitively online, not enough to frustrate
- **Faster than 30s average** → bumps to harder difficulty
- **Slower than 90s average** → eases back a level
- 4 levels: Easy (addition/subtraction), Medium (+ multiplication), Hard (all ops), Brutal (chained PEMDAS)

#### Photo Mission 📸
- Set a specific object in another room (kitchen faucet, front door handle, etc.)
- Forces physical movement — the #1 predictor of not going back to sleep
- You must literally get up, walk there, and photograph it

#### Double Threat 💀
- Math problem *first*, then photo. Cognitive + physical.

### 📊 Stats & Adaptive Difficulty
- Tracks every solve session: date, time, duration, difficulty, challenge type
- Rolling average of last 5 sessions drives difficulty adjustment
- Chart of recent solve times vs. 60s optimal target
- Fastest ever, total alarms dismissed

---

## Setup

### Prerequisites
- Node 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone, OR Android/iOS simulator

### Install
```bash
cd WakeForce
npm install
```

### Add sound files
Place `gentle.mp3` and `intense.mp3` in `assets/sounds/`. See `assets/sounds/README.md` for guidance.

### Run
```bash
npx expo start
```
Scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android emulator.

---

## Project Structure

```
WakeForce/
├── App.js                      # Navigation + notification listeners
├── app.json                    # Expo config (permissions, plugins)
├── assets/
│   └── sounds/
│       ├── gentle.mp3          # ADD THIS
│       ├── intense.mp3         # ADD THIS
│       └── README.md
└── src/
    ├── screens/
    │   ├── HomeScreen.js       # Alarm list
    │   ├── EditAlarmScreen.js  # Create/edit alarm
    │   ├── ActiveAlarmScreen.js# Full-screen alarm + challenges
    │   └── StatsScreen.js      # Stats & adaptive difficulty display
    ├── store/
    │   └── alarmStore.js       # AsyncStorage persistence + adaptive logic
    └── utils/
        ├── constants.js        # Theme, profiles, config
        ├── audioEngine.js      # Psychoacoustic audio playback
        ├── mathChallenge.js    # Problem generation + validation
        └── notifications.js    # Expo Notifications scheduling
```

---

## Key Implementation Notes

### iOS Silent Mode Override
`playsInSilentModeIOS: true` in `Audio.setAudioModeAsync()` — critical for alarm functionality.

### Android DND Bypass
`bypassDnd: true` on the notification channel + `USE_EXACT_ALARM` permission.

### Full-Screen on Locked Screen
`fullScreenIntent: true` in notification content (Android) + `allowCriticalAlerts: true` permission (iOS).

### Adaptive Difficulty Algorithm
```
if (avg solve time over last 5 sessions < 30s) → increase difficulty
if (avg solve time over last 5 sessions > 90s) → decrease difficulty
otherwise → maintain current difficulty
```

Research basis: 45–90 seconds of active cognitive engagement is sufficient to prevent sleep re-entry, while preserving morning function.

---

## Next Steps / Roadmap
- [ ] ML-based photo verification (Claude Vision API or ML Kit)
- [ ] Apple Watch haptic escalation
- [ ] Widget showing next alarm time
- [ ] Gradual screen brightness ramp (light therapy)
- [ ] Spotify/Apple Music integration for custom wake playlists
- [ ] Sleep tracking integration (HealthKit / Google Fit)
- [ ] Shared challenges (friends race to dismiss alarms)
