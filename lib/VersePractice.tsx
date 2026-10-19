import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { compare } from './compare';
import { saveAttendance, useAttendance } from './attendance';
import { completeVerse, readProgress, type Progress, type Verse } from './verses';

export function ChurchBrand() {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <Image source={require('../assets/church-logo.png')} style={{ width: 28, height: 28 }} accessibilityLabel="하늘소리교회 로고" />
    <Text style={styles.hint}>made by 하늘소리교회</Text>
  </View>;
}

export function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, disabled && { opacity: 0.4 }]}>
    <Text style={styles.buttonText}>{label}</Text>
  </Pressable>;
}

export default function VersePractice({ verse, past = false, hidden, onHiddenChange }: { verse: Verse; past?: boolean; hidden: boolean; onHiddenChange: (value: boolean) => void }) {
  const [input, setInput] = useState('');
  const { refresh: refreshAttendance } = useAttendance();
  const [attendanceNotice, setAttendanceNotice] = useState(false);
  const completedAt = useRef<Date | null>(null);
  const savedProgress = useRef<Progress | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [storageError, setStorageError] = useState(false);
  const field = useRef<TextInput>(null);
  const awarded = useRef(false);
  const mounted = useRef(true);
  const result = compare(verse.text, input);

  useFocusEffect(useCallback(() => {
    const timer = setTimeout(() => field.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []));
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    readProgress(AsyncStorage, verse.month).then(progress => {
      if (!cancelled && !awarded.current) setCount(progress.count);
    }).catch(() => { if (!cancelled) setStorageError(true); });
    return () => { cancelled = true; mounted.current = false; };
  }, [verse.month]);

  const save = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const at = completedAt.current!;
      const progress = savedProgress.current ?? await completeVerse(AsyncStorage, verse.month, at);
      savedProgress.current = progress;
      const attendance = await saveAttendance(AsyncStorage, at);
      refreshAttendance();
      if (mounted.current && attendance.newlyRecorded) setAttendanceNotice(true);
      if (mounted.current) { setCount(progress.count); setSaveStatus('saved'); setStorageError(false); }
    } catch { if (mounted.current) { setSaveStatus('error'); setStorageError(true); } }
  }, [verse.month, refreshAttendance]);
  useEffect(() => {
    if (result.complete && !awarded.current) { awarded.current = true; void save(); }
  }, [result.complete, save]);

  useEffect(() => {
    if (!attendanceNotice) return;
    const timer = setTimeout(() => setAttendanceNotice(false), 3500);
    return () => clearTimeout(timer);
  }, [attendanceNotice]);

  const reset = () => {
    awarded.current = false;
    completedAt.current = null;
    savedProgress.current = null;
    setAttendanceNotice(false);
    setInput('');
    setSaveStatus('idle');
    field.current?.focus();
  };
  // past: 화면 전체가 스크롤되도록 바깥 ScrollView에 맡긴다.
  const body = <>
    <View style={styles.row}>
      <Text style={styles.label}>가리고 쓰기</Text>
      <Switch accessibilityLabel="가리고 쓰기" value={hidden} onValueChange={onHiddenChange} trackColor={{ true: '#436857' }} />
    </View>
    {past && !hidden && <View style={styles.guide} accessibilityLabel="말씀 원문">
      <Text selectable style={styles.body}>{verse.text}</Text>
    </View>}
    <Text style={styles.hint}>문장부호는 생략해도 됩니다. 오답은 밑줄로도 표시합니다.</Text>
    <View style={styles.guide} accessible accessibilityLabel={hidden ? `입력한 내용: ${input}` : `타이핑 가이드: ${verse.text}. 입력한 내용: ${input}`}>
      <Text style={styles.body}>
        {result.characters.map((character, index) => character.status === 'guide' && hidden ? null : <Text key={index} style={character.status === 'guide' ? styles.faint : character.status === 'wrong' ? styles.wrong : character.status === 'pending' ? styles.pending : styles.correct}>{character.text}</Text>)}
        {hidden && !input ? <Text style={styles.faint}>말씀을 기억하며 입력하세요.</Text> : null}
      </Text>
    </View>
    <Text nativeID="input-label" style={styles.label}>말씀 입력</Text>
    <TextInput ref={field} autoFocus multiline value={input} onChangeText={value => {
      if (awarded.current) return;
      if (compare(verse.text, value).complete) completedAt.current = new Date();
      setInput(value);
    }}
      editable={!awarded.current} accessibilityLabel="암송 말씀 본문 입력" accessibilityHint="본문만 입력하세요. 문장부호는 비교하지 않습니다."
      autoCorrect={false} autoCapitalize="none" spellCheck={false} textAlignVertical="top" style={styles.input}
      placeholder="여기에 말씀을 입력하세요" placeholderTextColor="#69766f" />
    <Text accessibilityLiveRegion="polite" style={styles.hint}>
      {result.complete ? '✓ 말씀을 모두 정확하게 입력했습니다!' : result.errors ? `오답 ${result.errors}글자 · 밑줄 부분을 확인하세요.` : '천천히 말씀을 채워 보세요.'}
    </Text>
    {attendanceNotice && <Text accessibilityLiveRegion="polite" style={styles.label}>오늘 출석 완료</Text>}
    <Text style={styles.label}>완료 횟수: {count === null ? '확인 중' : `${count}회`}</Text>
    {saveStatus === 'saving' && <Text style={styles.hint}>완료 기록 저장 중…</Text>}
    {storageError && <Text accessibilityRole="alert" style={styles.error}>완료 또는 출석 기록을 읽거나 저장하지 못했습니다. 기존 기록은 덮어쓰지 않습니다.</Text>}
    {saveStatus === 'error' && <Action label="저장 다시 시도" onPress={() => void save()} />}
    <Action label="다시 쓰기" onPress={reset} disabled={saveStatus === 'saving' || saveStatus === 'error'} />
  </>;
  return past
    ? <View style={styles.practice}>{body}</View>
    : <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.practice} keyboardShouldPersistTaps="handled">{body}</ScrollView>;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f6f0' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  header: { paddingVertical: 12, gap: 6 },
  title: { fontSize: 23, fontWeight: '700', color: '#253f33' },
  reference: { fontSize: 18, color: '#436857', fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  practice: { paddingVertical: 12, gap: 14, paddingBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: '#253f33' },
  hint: { fontSize: 14, color: '#5e6a63', lineHeight: 22 },
  body: { fontSize: 20, lineHeight: 32, color: '#253f33' },
  guide: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, minHeight: 88 },
  faint: { color: '#87948a' },
  correct: { color: '#213e2f' },
  wrong: { color: '#ad2828', textDecorationLine: 'underline', textDecorationStyle: 'double' },
  pending: { color: '#59665e' },
  input: { fontSize: 20, lineHeight: 32, minHeight: 120, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#85998a', color: '#213e2f', backgroundColor: '#fff' },
  button: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#e4ebe3', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#253f33', fontSize: 16, fontWeight: '600' },
  error: { color: '#ad2828', fontSize: 14, lineHeight: 22 },
});
