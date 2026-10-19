import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VersePractice, { Action, ChurchBrand, styles } from '../lib/VersePractice';
import { monthButtons, monthKey, monthLabel, pastVerses, useVerses } from '../lib/verses';

export default function PastScreen() {
  const { content, today } = useVerses();
  const current = monthKey(today);
  const [selected, setSelected] = useState<{ month: string; period: string } | null>(null);
  const [hidden, setHidden] = useState(false);
  useFocusEffect(useCallback(() => { setSelected(null); }, []));
  const verses = pastVerses(content, today);
  const verse = (selected?.period === current ? verses.find(v => v.month === selected.month) : undefined) ?? verses.at(-1);
  return <SafeAreaView style={styles.screen}>
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <ChurchBrand />
          <Action label="이달 말씀으로" onPress={() => router.replace('/')} />
          <Text accessibilityRole="header" style={styles.title}>{verse ? monthLabel(verse.month) : '지난달 말씀'}</Text>
          {verse && <Text style={styles.reference}>{verse.reference}</Text>}
          <ScrollView horizontal keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8 }} accessibilityLabel="월 선택">
            {monthButtons(content, today).map(button => {
              const active = button.month === verse?.month;
              const label = `${button.month.slice(0, 4) === current.slice(0, 4) ? '' : `${button.month.slice(0, 4)}년 `}${Number(button.month.slice(5))}월`;
              return <Pressable key={button.month} accessibilityRole="button" accessibilityLabel={`${button.month.slice(0, 4)}년 ${Number(button.month.slice(5))}월 말씀`} accessibilityState={{ disabled: !button.available, selected: active }} disabled={!button.available}
                style={[styles.button, active && { borderWidth: 2, borderColor: '#436857' }, !button.available && { opacity: 0.4 }]}
                onPress={() => button.month === current ? router.replace('/') : setSelected({ month: button.month, period: current })}>
                <Text style={styles.buttonText}>{active ? `✓ ${label}` : label}</Text>
              </Pressable>;
            })}
          </ScrollView>
        </View>
        {verse ? <VersePractice key={`${verse.month}:${verse.text}`} verse={verse} past hidden={hidden} onHiddenChange={setHidden} /> : <Text style={styles.hint}>아직 등록된 지난달 말씀이 없습니다.</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
