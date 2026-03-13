import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { StyleSheet, LogBox } from 'react-native';

import { COLORS } from './src/utils/constants';
import { setupNotificationChannel, requestPermissions } from './src/utils/notifications';
import { getAlarms } from './src/store/alarmStore';

import HomeScreen from './src/screens/HomeScreen';
import EditAlarmScreen from './src/screens/EditAlarmScreen';
import ActiveAlarmScreen from './src/screens/ActiveAlarmScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

LogBox.ignoreLogs(['Non-serializable values', 'Reanimated 2']);

const Stack = createStackNavigator();

const NavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.bg,
    card: COLORS.bgCard,
    text: COLORS.text,
    border: COLORS.border,
  },
};

export default function App() {
  const navigationRef = React.useRef(null);

  useEffect(() => {
    // Setup permissions and channels
    (async () => {
      await requestPermissions();
      await setupNotificationChannel();
    })();

    // Handle notification received while app is open (alarm fires)
    const sub1 = Notifications.addNotificationReceivedListener(async (notification) => {
      const { alarmId, isRem } = notification.request.content.data || {};
      if (isRem || !alarmId) return; // don't open screen for REM reminder

      const alarms = await getAlarms();
      const alarm = alarms.find(a => a.id === alarmId);
      if (alarm && navigationRef.current) {
        navigationRef.current.navigate('ActiveAlarm', { alarm });
      }
    });

    // Handle notification tap (app in background/killed)
    const sub2 = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { alarmId, isRem } = response.notification.request.content.data || {};
      if (isRem || !alarmId) return;

      const alarms = await getAlarms();
      const alarm = alarms.find(a => a.id === alarmId);
      if (alarm && navigationRef.current) {
        navigationRef.current.navigate('ActiveAlarm', { alarm });
      }
    });

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer theme={NavTheme} ref={navigationRef}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: COLORS.bg },
            presentation: 'card',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="EditAlarm"
            component={EditAlarmScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="ActiveAlarm"
            component={ActiveAlarmScreen}
            options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
          />
          <Stack.Screen
            name="Stats"
            component={StatsScreen}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ presentation: 'card' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
});
