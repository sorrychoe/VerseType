import { useState } from 'react';
import { attendanceStats, useAttendance } from '../lib/attendance';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VersePractice, { Action, ChurchBrand, styles } from '../lib/VersePractice';
import { currentVerse, monthLabel, useVerses } from '../lib/verses';

export default function CurrentScreen() {
  const [hidden, setHidden] = useState(false);
  const { dates, error } = useAttendance();
  const { content, today } = useVerses();
  const stats = attendanceStats(dates ?? [], today);
  const { verse, fallback } = currentVerse(content, today);
  return <SafeAreaView style={styles.screen}>
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <ChurchBrand />
        <Text accessibilityRole="header" style={styles.title}>{verse ? monthLabel(verse.month) : '이달의 암송 말씀'}</Text>
        {verse && <Text style={styles.reference}>{verse.reference}</Text>}
        <Action label={error ? '출석 기록 확인 필요' : dates === null ? '출석 확인 중' : `연속 ${stats.streak}일 · 이번 달 ${stats.monthCount}일`} onPress={() => router.push('/attendance')} />
        {fallback && verse && <Text style={styles.hint}>이달 말씀이 아직 등록되지 않았습니다. 최근 말씀을 표시합니다.</Text>}
        <Action label="지난달 말씀" onPress={() => router.push('/past')} />
      </View>
      <>{verse ? <VersePractice key={`${verse.month}:${verse.text}`} verse={verse} hidden={hidden} onHiddenChange={setHidden} /> : <Text style={styles.hint}>아직 사용할 수 있는 말씀이 없습니다. 등록 후 앱을 다시 열어 주세요.</Text>}</>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
