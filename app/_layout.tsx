import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { AttendanceContext, readAttendance } from '../lib/attendance';
import { bundledContent, loadVerses, VersesContext } from '../lib/verses';

export default function Layout() {
  const [content, setContent] = useState(bundledContent);
  const [today, setToday] = useState(() => new Date());
  const [dates, setDates] = useState<string[] | null>(null);
  const [attendanceError, setAttendanceError] = useState(false);
  const attendanceRequest = useRef(0);
  const refreshAttendance = useCallback(() => {
    const request = ++attendanceRequest.current;
    void readAttendance(AsyncStorage).then(value => {
      if (request === attendanceRequest.current) { setDates(value); setAttendanceError(false); }
    }).catch(() => { if (request === attendanceRequest.current) setAttendanceError(true); });
  }, []);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      setToday(new Date());
      refreshAttendance();
      void loadVerses(AsyncStorage, process.env.EXPO_PUBLIC_VERSES_URL, value => { if (active) setContent(value); });
    };
    refresh();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    const timer = setInterval(() => setToday(new Date()), 60_000);
    return () => { active = false; attendanceRequest.current++; subscription.remove(); clearInterval(timer); };
  }, [refreshAttendance]);
  return (
    <VersesContext.Provider value={{ content, today }}>
      <AttendanceContext.Provider value={{ dates, error: attendanceError, refresh: refreshAttendance }}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
      </AttendanceContext.Provider>
    </VersesContext.Provider>
  );
}
