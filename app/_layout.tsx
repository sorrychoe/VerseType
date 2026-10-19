import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { AttendanceContext, readAttendance } from '../lib/attendance';
import { bundledContent, VersesContext } from '../lib/verses';
import config from '../app.json';

export default function Layout() {
  const [ready, setReady] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState('오프라인 준비 중…');
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
    const refresh = () => {
      setToday(new Date());
      refreshAttendance();
    };
    refresh();
    setReady(true);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    const timer = setInterval(() => setToday(new Date()), 60_000);
    return () => { attendanceRequest.current++; subscription.remove(); clearInterval(timer); };
  }, [refreshAttendance]);
  useEffect(() => {
    let active = true;
    const updateStatus = (value: string) => { if (active) setOfflineStatus(value); };
    if (!('serviceWorker' in navigator)) {
      updateStatus('이 브라우저에서는 온라인으로 사용해 주세요.');
      return;
    }
    const base = config.expo.experiments.baseUrl;
    void navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/`, updateViaCache: 'none' }).then(registration => {
      const status = () => {
        if (registration.waiting) updateStatus('새 버전 준비 완료 · 앱과 탭을 모두 닫고 다시 열어 주세요.');
        else if (registration.active) updateStatus('오프라인 사용 준비 완료');
      };
      status();
      const watchInstall = () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'redundant' && !registration.active) updateStatus('오프라인 준비 실패 · 인터넷 연결 후 다시 열어 주세요.');
          else status();
        });
      };
      watchInstall();
      registration.addEventListener('updatefound', watchInstall);
      void navigator.serviceWorker.ready.then(status);
    }).catch(() => updateStatus('오프라인 준비 실패 · 인터넷 연결 후 다시 열어 주세요.'));
    return () => { active = false; };
  }, []);
  const webTitle = <Head><title>하늘소리 암송말씀</title></Head>;
  if (!ready) return webTitle;
  return (
    <VersesContext.Provider value={{ content: bundledContent, today }}>
      <AttendanceContext.Provider value={{ dates, error: attendanceError, refresh: refreshAttendance }}>
        {webTitle}
        <View style={{ flex: 1, backgroundColor: '#f7f6f0' }}>
          <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
          <Text accessibilityLiveRegion="polite" style={{ fontSize: 12, color: '#5e6a63', padding: 8 }}>{offlineStatus}</Text>
        </View>
      </AttendanceContext.Provider>
    </VersesContext.Provider>
  );
}
