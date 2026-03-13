import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Alert, StatusBar, Platform,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SOUND_PROFILES, CHALLENGE_TYPES, MATH_DIFFICULTY } from '../utils/constants';
import { getAlarms, saveAlarm, createDefaultAlarm } from '../store/alarmStore';
import { scheduleAlarm, cancelAlarm } from '../utils/notifications';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function OptionRow({ label, value, onPress, right }) {
  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.optionLabel}>{label}</Text>
      {right || <Text style={styles.optionValue}>{value}</Text>}
    </TouchableOpacity>
  );
}

function SegmentedPicker({ options, value, onChange, colorKey }) {
  return (
    <View style={styles.segmented}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.segment, value === opt.id && { backgroundColor: opt[colorKey || 'color'] + '30', borderColor: opt[colorKey || 'color'] }]}
          onPress={() => onChange(opt.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.segmentIcon}>{opt.icon}</Text>
          <Text style={[styles.segmentLabel, value === opt.id && { color: opt[colorKey || 'color'] }]}>{opt.name}</Text>
          {opt.description ? <Text style={styles.segmentDesc}>{opt.description}</Text> : null}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function EditAlarmScreen({ route, navigation }) {
  const { alarmId } = route.params || {};
  const [alarm, setAlarm] = useState(null);
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [showMinutePicker, setShowMinutePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [soundExpanded, setSoundExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      if (alarmId) {
        const alarms = await getAlarms();
        const found = alarms.find(a => a.id === alarmId);
        setAlarm(found || createDefaultAlarm());
      } else {
        setAlarm(createDefaultAlarm());
      }
    })();
  }, [alarmId]);

  const update = (key, value) => setAlarm(prev => ({ ...prev, [key]: value }));
  const updateChallenge = (key, value) =>
    setAlarm(prev => ({ ...prev, challenge: { ...prev.challenge, [key]: value } }));

  const handleSave = async () => {
    if (!alarm.days.length) {
      Alert.alert('Pick at least one day');
      return;
    }
    setSaving(true);
    await saveAlarm(alarm);
    if (alarm.enabled) await scheduleAlarm(alarm);
    else await cancelAlarm(alarm.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigation.goBack();
    }, 600);
  };

  const handlePickCustomSound = async () => {
    // expo-image-picker doesn't support audio — use expo-document-picker in a real build
    // For now show a text input alert to paste a file URI
    Alert.alert(
      'Custom Sound',
      'To use a custom sound, install expo-document-picker and add it to your project. For now, enter a file URI manually or use one of the built-in profiles.',
      [{ text: 'OK' }]
    );
  };

  const toggleDay = (day) => {
    const days = alarm.days.includes(day)
      ? alarm.days.filter(d => d !== day)
      : [...alarm.days, day];
    update('days', days);
  };

  if (!alarm) return <View style={styles.container} />;

  const h12 = alarm.hour % 12 || 12;
  const ampm = alarm.hour < 12 ? 'AM' : 'PM';
  const minStr = alarm.minute.toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{alarmId ? 'Edit Alarm' : 'New Alarm'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || saved}>
          <Text style={[styles.saveBtn, (saving || saved) && { opacity: 0.5 }]}>
            {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Time picker */}
        <View style={styles.timePicker}>
          <TouchableOpacity onPress={() => setShowHourPicker(!showHourPicker)}>
            <Text style={styles.timeDisplay}>{h12}</Text>
          </TouchableOpacity>
          <Text style={styles.timeColon}>:</Text>
          <TouchableOpacity onPress={() => setShowMinutePicker(!showMinutePicker)}>
            <Text style={styles.timeDisplay}>{minStr}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => update('hour', alarm.hour < 12 ? alarm.hour + 12 : alarm.hour - 12)}>
            <Text style={styles.ampmDisplay}>{ampm}</Text>
          </TouchableOpacity>
        </View>

        {showHourPicker && (
          <ScrollView horizontal style={styles.pickerRow} showsHorizontalScrollIndicator={false}>
            {HOURS.map(h => (
              <TouchableOpacity key={h} style={[styles.pickerItem, alarm.hour === h && styles.pickerItemActive]}
                onPress={() => { update('hour', h); setShowHourPicker(false); }}>
                <Text style={[styles.pickerText, alarm.hour === h && styles.pickerTextActive]}>
                  {(h % 12 || 12).toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        {showMinutePicker && (
          <ScrollView horizontal style={styles.pickerRow} showsHorizontalScrollIndicator={false}>
            {MINUTES.map(m => (
              <TouchableOpacity key={m} style={[styles.pickerItem, alarm.minute === m && styles.pickerItemActive]}
                onPress={() => { update('minute', m); setShowMinutePicker(false); }}>
                <Text style={[styles.pickerText, alarm.minute === m && styles.pickerTextActive]}>
                  {m.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Days */}
        <View style={styles.daysRow}>
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dayBtn, alarm.days.includes(i) && styles.dayBtnActive]}
              onPress={() => toggleDay(i)}
            >
              <Text style={[styles.dayTxt, alarm.days.includes(i) && styles.dayTxtActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Label */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Label</Text>
          <TextInput
            style={styles.textInput}
            value={alarm.label}
            onChangeText={v => update('label', v)}
            placeholder="Wake Up"
            placeholderTextColor={COLORS.textDim}
            selectionColor={COLORS.accent}
          />
        </View>

        {/* Sound Profile — collapsible with always-visible summary */}
        <SectionHeader title="SOUND PROFILE" />
        <TouchableOpacity
          style={styles.soundSummaryRow}
          onPress={() => setSoundExpanded(e => !e)}
          activeOpacity={0.8}
        >
          <Text style={styles.soundSummaryIcon}>
            {SOUND_PROFILES[alarm.soundProfile]?.icon || '⚡'}
          </Text>
          <View style={styles.soundSummaryInfo}>
            <Text style={styles.soundSummaryName}>
              {SOUND_PROFILES[alarm.soundProfile]?.name || 'Shock & Awe'}
            </Text>
            <Text style={styles.soundSummaryVol}>
              Volume: {Math.round((alarm.volume ?? 1.0) * 100)}%
            </Text>
          </View>
          <Text style={styles.soundSummaryChevron}>{soundExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {soundExpanded && (
          <>
            <SegmentedPicker
              options={Object.values(SOUND_PROFILES)}
              value={alarm.soundProfile}
              onChange={v => update('soundProfile', v)}
            />
            {alarm.soundProfile === 'custom' && (
              <TouchableOpacity style={styles.card} onPress={handlePickCustomSound}>
                <Text style={styles.fieldLabel}>Custom Sound</Text>
                <Text style={styles.fieldValue}>
                  {alarm.customSoundUri ? '✓ Sound selected' : 'Tap to pick audio file'}
                </Text>
              </TouchableOpacity>
            )}
            {/* Volume slider (discrete steps) */}
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Volume</Text>
              <View style={styles.volumeRow}>
                {[0.25, 0.5, 0.75, 1.0].map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.volBtn, (alarm.volume ?? 1.0) >= v && styles.volBtnActive]}
                    onPress={() => update('volume', v)}
                  >
                    <Text style={[styles.volBtnTxt, (alarm.volume ?? 1.0) >= v && styles.volBtnTxtActive]}>
                      {Math.round(v * 100)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Wake Challenge */}
        <SectionHeader title="WAKE CHALLENGE" />
        <SegmentedPicker
          options={Object.values(CHALLENGE_TYPES)}
          value={alarm.challenge.type}
          onChange={v => updateChallenge('type', v)}
        />

        {(alarm.challenge.type === 'math' || alarm.challenge.type === 'both') && (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Math Difficulty</Text>
            <Text style={styles.fieldHint}>Auto-adjusts based on your solve speed</Text>
            <View style={styles.diffRow}>
              {Object.entries(MATH_DIFFICULTY).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.diffBtn, alarm.challenge.difficulty === key && styles.diffBtnActive]}
                  onPress={() => updateChallenge('difficulty', key)}
                >
                  <Text style={[styles.diffTxt, alarm.challenge.difficulty === key && styles.diffTxtActive]}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {(alarm.challenge.type === 'photo' || alarm.challenge.type === 'both') && (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Object to Photograph</Text>
            <TextInput
              style={styles.textInput}
              value={alarm.challenge.photoObjectName}
              onChangeText={v => updateChallenge('photoObjectName', v)}
              placeholder="e.g. Kitchen faucet, front door"
              placeholderTextColor={COLORS.textDim}
              selectionColor={COLORS.cyan}
            />
            <Text style={styles.fieldLabel} style={{ marginTop: 12 }}>Hint (optional)</Text>
            <TextInput
              style={styles.textInput}
              value={alarm.challenge.photoObjectHint}
              onChangeText={v => updateChallenge('photoObjectHint', v)}
              placeholder="e.g. It's in the kitchen"
              placeholderTextColor={COLORS.textDim}
              selectionColor={COLORS.cyan}
            />
          </View>
        )}

        {/* Options */}
        <SectionHeader title="OPTIONS" />
        <View style={styles.card}>
          <OptionRow
            label="💤 REM Trick"
            right={
              <Switch
                value={alarm.remTrick}
                onValueChange={v => update('remTrick', v)}
                trackColor={{ false: COLORS.bgElevated, true: COLORS.cyan + '60' }}
                thumbColor={alarm.remTrick ? COLORS.cyan : COLORS.textDim}
              />
            }
          />
          <Text style={styles.optionHint}>
            Fires a gentle nudge 90 mins before your alarm to complete a REM cycle, so you wake up naturally refreshed
          </Text>
          <View style={styles.divider} />
          <OptionRow
            label="📳 Vibrate"
            right={
              <Switch
                value={alarm.vibrate}
                onValueChange={v => update('vibrate', v)}
                trackColor={{ false: COLORS.bgElevated, true: COLORS.accent + '60' }}
                thumbColor={alarm.vibrate ? COLORS.accent : COLORS.textDim}
              />
            }
          />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  cancelBtn: { fontSize: 16, color: COLORS.textSecondary },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, letterSpacing: 1 },
  saveBtn: { fontSize: 16, color: COLORS.accent, fontWeight: '700' },

  scroll: { flex: 1, paddingHorizontal: SPACING.md },

  timePicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  timeDisplay: {
    fontSize: 80, fontWeight: '100', color: COLORS.text, letterSpacing: -3,
    minWidth: 90, textAlign: 'center',
  },
  timeColon: { fontSize: 60, fontWeight: '100', color: COLORS.textDim, marginBottom: 8 },
  ampmDisplay: {
    fontSize: 24, fontWeight: '600', color: COLORS.accent,
    marginLeft: SPACING.sm, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.accent + '50',
    borderRadius: RADIUS.sm, overflow: 'hidden',
  },

  pickerRow: {
    marginHorizontal: -SPACING.md, paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  pickerItem: {
    width: 52, height: 52, borderRadius: RADIUS.sm,
    alignItems: 'center', justifyContent: 'center', marginRight: 6,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  },
  pickerItemActive: { backgroundColor: COLORS.accent + '20', borderColor: COLORS.accent },
  pickerText: { fontSize: 18, color: COLORS.textSecondary, fontWeight: '300' },
  pickerTextActive: { color: COLORS.accent, fontWeight: '600' },

  daysRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginHorizontal: SPACING.xs, marginBottom: SPACING.lg,
  },
  dayBtn: {
    width: 42, height: 42, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  },
  dayBtnActive: { backgroundColor: COLORS.accent + '20', borderColor: COLORS.accent },
  dayTxt: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  dayTxtActive: { color: COLORS.accent },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: COLORS.textDim, letterSpacing: 2,
    marginRight: 10,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.border },

  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },

  segmented: { marginBottom: SPACING.sm, gap: SPACING.sm },
  segment: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  segmentIcon: { fontSize: 20, marginRight: 12 },
  segmentLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text, flex: 1 },
  segmentDesc: { fontSize: 12, color: COLORS.textSecondary },

  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textSecondary,
    letterSpacing: 1.5, marginBottom: 8,
  },
  fieldHint: { fontSize: 11, color: COLORS.textDim, marginBottom: SPACING.sm },
  fieldValue: { fontSize: 15, color: COLORS.cyan },

  soundSummaryRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  soundSummaryIcon: { fontSize: 24 },
  soundSummaryInfo: { flex: 1 },
  soundSummaryName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  soundSummaryVol: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  soundSummaryChevron: { fontSize: 12, color: COLORS.textDim },

  volumeRow: { flexDirection: 'row', gap: 8 },
  volBtn: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.bgElevated,
  },
  volBtnActive: { backgroundColor: COLORS.accent + '25', borderColor: COLORS.accent },
  volBtnTxt: { fontSize: 12, fontWeight: '600', color: COLORS.textDim },
  volBtnTxtActive: { color: COLORS.accent },

  textInput: {
    fontSize: 16, color: COLORS.text,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingVertical: 8,
  },

  diffRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  diffBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.bgElevated,
  },
  diffBtnActive: { borderColor: COLORS.yellow, backgroundColor: COLORS.yellow + '20' },
  diffTxt: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  diffTxtActive: { color: COLORS.yellow },

  optionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  optionLabel: { fontSize: 15, color: COLORS.text },
  optionValue: { fontSize: 15, color: COLORS.textSecondary },
  optionHint: {
    fontSize: 12, color: COLORS.textDim, lineHeight: 18,
    marginTop: 4, marginBottom: 4,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
});
