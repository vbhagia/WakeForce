# WakeForce Sound Files

Place your alarm audio files here:

- `gentle.mp3` — Soft, rising tone for gentle wake profile
- `intense.mp3` — Jarring, high-energy sound for instant wake

## Psychoacoustic Design Notes

For maximum wake effectiveness, the **intense** sound should have:
- Fast attack transient (0–100% in <5ms) — perceived as 2-3x louder than same RMS with slow attack
- Frequency content in 1000–4000 Hz range — this is where human hearing is most sensitive
- Slight harmonic distortion — makes sound "harsher" and harder to ignore
- Irregular rhythm — prevents auditory habituation

The audio engine will additionally apply:
- Stereo panning oscillation (L/R sweep)
- Burst pattern interruptions (forces startle response on each burst)
- Haptic synchronization

## Free Sources
- freesound.org (CC0 license)
- zapsplat.com (free tier)
- Generate with Audacity or any DAW
