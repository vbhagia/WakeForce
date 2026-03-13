import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity,
  StatusBar, Alert, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { COLORS, SPACING, RADIUS } from '../utils/constants';
import { getSettings, saveSettings, getStats } from '../store/alarmStore';
import { cancelAllAlarms } from '../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SectionHeader, Card, OptionRow, Divider } from '../components/UI';

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState(null);
  const [notifStatus, setNotifStatus] = useState('unknown');

  useFocusEffect(useCallback(() => {
    (async () => {
      const s = await getSettings();
      setSettings(s);
      const { status } = await Notifications.getPermissionsAsync();
      setNotifStatus(status);
    })();
  }, []));

  const update = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings(updated);
  };

  const handleResetStats = () => {
    Alert.alert(
      'Reset Stats',
      'This will clear all solve history and reset difficulty to Medium. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('wakeforce:stats');
            Alert.alert('Done', 'Stats reset.');
          },
        },
      ]
    );
  };

  const handleClearAllAlarms = () => {
    Alert.alert(
      'Delete All Alarms',
      'This will remove every alarm and cancel all scheduled notifications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All', style: 'destructive',
          onPress: async () => {
            await cancelAllAlarms();
            await AsyncStorage.removeItem('wakeforce:alarms');
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  const handleRequestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true, allowCriticalAlerts: true },
    });
    setNotifStatus(status);
    if (status !== 'granted') {
      Alert.alert(
        'Permissions Needed',
        'Open Settings and enable Notifications + Critical Alerts for WakeForce.',
        [{ text: 'OK' }]
      );
    }
  };

  if (!settings) return <View style={styles.container} />;

  const permColor = notifStatus === 'granted' ? COLORS.green : COLORS.accent;
  const permLabel = notifStatus === 'granted' ? '✓ Granted' : '⚠ Not granted';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Permissions status */}
        <SectionHeader title="PERMISSIONS" />
        <Card>
          <OptionRow
            label="Notifications"
            sub={Platform.OS === 'ios' ? 'Required for Critical Alerts (bypasses silent mode)' : 'Required for alarm scheduling'}
            right={
              <TouchableOpacity onPress={handleRequestPermissions}>
                <Text style={[styles.permLabel, { color: permColor }]}>{permLabel}</Text>
              </TouchableOpacity>
            }
          />
        </Card>

        {/* Audio */}
        <SectionHeader title="AUDIO & HAPTICS" />
        <Card>
          <OptionRow
            label="Psychoacoustic Tricks"
            sub="Stereo panning + burst patterns — makes alarm feel louder"
            right={
              <Switch
                value={settings.psychoAudio}
                onValueChange={v => update('psychoAudio', v)}
                trackColor={{ false: COLORS.bgElevated, true: COLORS.accent + '60' }}
                thumbColor={settings.psychoAudio ? COLORS.accent : COLORS.textDim}
              />
            }
          />
          <Divider />
          <OptionRow
            label="Haptic Feedback"
            sub="Synchronized vibration during alarm"
            right={
              <Switch
                value={settings.hapticFeedback}
                onValueChange={v => update('hapticFeedback', v)}
                trackColor={{ false: COLORS.bgElevated, true: COLORS.accent + '60' }}
                thumbColor={settings.hapticFeedback ? COLORS.accent : COLORS.textDim}
              />
            }
          />
          <Divider />
          <OptionRow
            label="Keep Screen On"
            sub="Prevent screen from sleeping during active alarm"
            right={
              <Switch
                value={settings.keepScreenOn}
                onValueChange={v => update('keepScreenOn', v)}
                trackColor={{ false: COLORS.bgElevated, true: COLORS.accent + '60' }}
                thumbColor={settings.keepScreenOn ? COLORS.accent : COLORS.textDim}
              />
            }
          />
        </Card>

        {/* Science notes */}
        <SectionHeader title="THE SCIENCE" />
        <Card>
          <Text style={styles.scienceText}>
            <Text style={styles.scienceBold}>Why solve a math problem?{'\n'}</Text>
            The prefrontal cortex — responsible for math — is the last region to "come online" after waking. Forcing it to engage for 45–90 seconds prevents sleep inertia from pulling you back under.{'\n\n'}
            <Text style={styles.scienceBold}>Why irregular alarm bursts?{'\n'}</Text>
            The auditory system habituates to predictable sounds within seconds. Irregular patterns (varying gap lengths) trigger a fresh startle response each time, maintaining arousal.{'\n\n'}
            <Text style={styles.scienceBold}>Why panning audio?{'\n'}</Text>
            Spatial audio (L/R movement) engages more of the auditory cortex than mono sound. The brain perceives the "moving" sound as larger and more urgent — same volume, more wake.{'\n\n'}
            <Text style={styles.scienceBold}>Why 90-minute REM cycles?{'\n'}</Text>
            A full sleep cycle is ~90 minutes. Waking mid-cycle causes sleep inertia (grogginess). The REM trick pre-alarms you so you naturally surface at cycle end before the real alarm.
          </Text>
        </Card>

        {/* Danger zone */}
        <SectionHeader title="DATA" />
        <Card>
          <TouchableOpacity style={styles.dangerRow} onPress={handleResetStats}>
            <Text style={styles.dangerLabel}>Reset Solve Stats</Text>
            <Text style={styles.dangerArrow}>→</Text>
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity style={styles.dangerRow} onPress={handleClearAllAlarms}>
            <Text style={[styles.dangerLabel, { color: COLORS.accent }]}>Delete All Alarms</Text>
            <Text style={styles.dangerArrow}>→</Text>
          </TouchableOpacity>
        </Card>

        {/* Version */}
        <Text style={styles.version}>WakeForce v1.0.0</Text>

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
  backBtn: { fontSize: 24, color: COLORS.textSecondary, width: 40 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, letterSpacing: 4 },
  scroll: { flex: 1, padding: SPACING.md },
  permLabel: { fontSize: 13, fontWeight: '700' },
  scienceText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  scienceBold: { fontWeight: '700', color: COLORS.text },
  dangerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  dangerLabel: { fontSize: 15, color: COLORS.textSecondary },
  dangerArrow: { fontSize: 16, color: COLORS.textDim },
  version: {
    textAlign: 'center', fontSize: 12, color: COLORS.textDim,
    marginTop: SPACING.lg, letterSpacing: 1,
  },
});
