import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { REM_CYCLE_MINUTES } from '../utils/constants';

// Configure how notifications appear when alarm fires
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: true, // CRITICAL: plays through Do Not Disturb
    },
  });
  return status === 'granted';
}

/**
 * Schedule all notification triggers for an alarm.
 * Returns array of scheduled notification IDs.
 */
export async function scheduleAlarm(alarm) {
  // Cancel existing schedules for this alarm
  await cancelAlarm(alarm.id);

  const ids = [];
  const now = new Date();

  for (const day of alarm.days) {
    // Schedule main alarm
    const trigger = buildTrigger(alarm.hour, alarm.minute, day);
    const id = await Notifications.scheduleNotificationAsync({
      content: buildContent(alarm, false),
      trigger,
      identifier: `alarm-${alarm.id}-day${day}`,
    });
    ids.push(id);

    // Schedule REM pre-alarm if enabled (90 min before)
    if (alarm.remTrick) {
      let remHour = alarm.hour;
      let remMinute = alarm.minute - REM_CYCLE_MINUTES;
      if (remMinute < 0) {
        remMinute += 60;
        remHour -= 1;
        if (remHour < 0) remHour += 24;
      }
      const remTrigger = buildTrigger(remHour, remMinute, day);
      const remId = await Notifications.scheduleNotificationAsync({
        content: buildContent(alarm, true),
        trigger: remTrigger,
        identifier: `alarm-rem-${alarm.id}-day${day}`,
      });
      ids.push(remId);
    }
  }

  return ids;
}

export async function cancelAlarm(alarmId) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(n =>
    n.identifier.includes(`alarm-${alarmId}`) ||
    n.identifier.includes(`alarm-rem-${alarmId}`)
  );
  await Promise.all(toCancel.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function cancelAllAlarms() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

function buildTrigger(hour, minute, weekday) {
  // weekday: 0=Sun, 1=Mon...6=Sat (matches JS Date)
  return {
    hour,
    minute,
    second: 0,
    weekday: weekday + 1, // expo uses 1-7
    repeats: true,
  };
}

function buildContent(alarm, isRem) {
  if (isRem) {
    return {
      title: '💤 REM Window — Sleep Now',
      body: `Your alarm "${alarm.label}" fires in 90 minutes. Complete this REM cycle.`,
      data: { alarmId: alarm.id, isRem: true },
      sound: 'gentle.mp3',
      priority: 'high',
      categoryIdentifier: 'alarm',
    };
  }
  return {
    title: `⏰ ${alarm.label}`,
    body: alarm.challenge.type === 'photo'
      ? `Wake up! Find: ${alarm.challenge.photoObjectName}`
      : 'Wake up! Solve a problem to dismiss.',
    data: { alarmId: alarm.id, isRem: false },
    sound: alarm.soundProfile === 'gentle' ? 'gentle.mp3' : 'intense.mp3',
    priority: 'max',
    categoryIdentifier: 'alarm',
    android: {
      channelId: 'alarm-channel',
      priority: 'max',
      vibrationPattern: [0, 250, 250, 250],
      color: '#ff3b30',
      fullScreenIntent: true, // shows even on locked screen
    },
  };
}

// Set up Android notification channel
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alarm-channel', {
      name: 'Alarms',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ff3b30',
      bypassDnd: true, // bypass Do Not Disturb
      sound: 'intense.mp3',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}
