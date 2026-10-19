import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { attendanceStats, calendarDays, dateKey, useAttendance } from '../lib/attendance';
import { monthKey, useVerses } from '../lib/verses';
import { Action, ChurchBrand, styles } from '../lib/VersePractice';

export default function AttendanceScreen() {
  const { today } = useVerses();
  const { dates, error, refresh } = useAttendance();
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const current = monthKey(today);
  const [selected, setSelected] = useState<string | null>(null);
  const month = selected && selected < current ? selected : current;
  const days = calendarDays(month);
  const recorded = new Set(dates ?? []);
  const stats = attendanceStats(dates ?? [], today);
  const [year, number] = month.split('-').map(Number);
  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <ChurchBrand />
      <Action label="말씀으로 돌아가기" onPress={() => router.back()} />
      <Text accessibilityRole="header" style={styles.title}>출석 달력</Text>
      <Text style={styles.hint}>말씀 한 편을 끝까지 맞게 입력하면 출석으로 기록됩니다.</Text>
      <Text accessibilityLiveRegion="polite" style={styles.label}>{error ? '출석 기록을 읽지 못했습니다.' : dates === null ? '출석 확인 중…' : `연속 ${stats.streak}일 · 이번 달 ${stats.monthCount}일`}</Text>
      {error && <Action label="다시 불러오기" onPress={refresh} />}
      <View style={styles.row}>
        <Action label="이전 달" onPress={() => setSelected(monthKey(new Date(year, number - 2, 1)))} />
        <Text style={styles.label}>{year}년 {number}월</Text>
        <Action label="다음 달" disabled={month === current} onPress={() => setSelected(monthKey(new Date(year, number, 1)))} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {['일', '월', '화', '수', '목', '금', '토'].map(day => <Text key={day} style={[styles.label, { width: '14.2857%', textAlign: 'center', paddingVertical: 8 }]}>{day}</Text>)}
        {Array.from({ length: days[0].getDay() }, (_, i) => <View key={`blank-${i}`} style={{ width: '14.2857%' }} />)}
        {days.map(day => {
          const key = dateKey(day);
          const attended = recorded.has(key) && key <= dateKey(today);
          return <View key={key} accessible accessibilityLabel={`${key}${key === dateKey(today) ? ' 오늘' : ''}, ${attended ? '출석 완료' : '출석 없음'}`} style={{ width: '14.2857%', minHeight: 64, padding: 2 }}>
            <View style={{ flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: key === dateKey(today) ? 2 : 0, borderColor: '#436857', backgroundColor: attended ? '#e4ebe3' : 'transparent' }}>
              <Text style={[styles.label, { textAlign: 'center' }]}>{day.getDate()}</Text>
              <Text style={[styles.hint, { textAlign: 'center' }]}>{attended ? '✓' : ' '}</Text>
            </View>
          </View>;
        })}
      </View>
      <Text style={styles.hint}>✓ 출석 완료 · 테두리: 오늘</Text>
    </ScrollView>
  </SafeAreaView>;
}
