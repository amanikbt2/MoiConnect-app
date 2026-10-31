import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { findKenyanUniversity, KENYAN_UNIVERSITIES, KenyanUniversity, getKenyanUniversitySearchAliases } from '../data/kenyanUniversities';
import { useUniversity } from '../context/UniversityContext';
import { useAuth } from '../context/AuthContext';
import { showIceMessage } from './IceMessageCard';

export function UniversitySetupModal({ allowReselect = false, visible = false, onDismiss }: { allowReselect?: boolean; visible?: boolean; onDismiss?: () => void }) {
  const { ready, selectedUniversity, selectUniversity } = useUniversity();
  const { user, loading: authLoading, updateUserProfile } = useAuth();
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const syncedUniversityRef = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading || !user?._id || !user.university) return;
    const syncKey = `${user._id}:${user.university}`;
    if (syncedUniversityRef.current === syncKey) return;
    syncedUniversityRef.current = syncKey;
    const university = findKenyanUniversity(user.university);
    if (university && selectedUniversity?.name !== university.name) void selectUniversity(university);
  }, [authLoading, user?._id, user?.university, selectedUniversity?.name]);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return KENYAN_UNIVERSITIES;
    return KENYAN_UNIVERSITIES.filter((item) => getKenyanUniversitySearchAliases(item).some((alias) => alias.toLowerCase().includes(search)));
  }, [query]);

  const choose = async (university: KenyanUniversity) => {
    setSaving(true);
    try {
      await selectUniversity(university);
      onDismiss?.();
      if (user && user.university !== university.name) {
        try {
          await updateUserProfile({ university: university.name });
        } catch (error: any) {
          showIceMessage('University Saved on This Device', error?.message || 'Your university could not be synced to your account. You can try again in Profile settings.');
        }
      }
    } catch (error: any) {
      showIceMessage('University Not Saved', error?.message || 'Could not save your university on this device. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={allowReselect ? visible : ready && !authLoading && !selectedUniversity} animationType="fade" transparent onRequestClose={() => { if (allowReselect) onDismiss?.(); }}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View>
          <Text style={styles.title}>{allowReselect ? 'Update your university' : 'Choose your university'}</Text>
          <Text style={styles.subtitle}>Select your campus community to personalize MConnect.</Text>
          {!allowReselect && <View style={styles.requiredPill}><Text style={styles.requiredText}>Required on first setup</Text></View>}
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search university..."
            placeholderTextColor="#94a3b8"
            style={styles.search}
            autoCapitalize="words"
            underlineColorAndroid="transparent"
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.name}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No university found. Try another name or abbreviation.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.option} onPress={() => choose(item)} disabled={saving} activeOpacity={0.75}>
                <View style={styles.optionIcon}><Text style={styles.optionIconText}>{item.shortName.slice(0, 3).toUpperCase()}</Text></View>
                <View style={styles.optionCopy}><Text style={styles.optionShort}>{item.shortName} Campus</Text><Text style={styles.optionName}>{item.name}</Text></View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(2, 44, 34, 0.72)', justifyContent: 'center', padding: 18 },
  card: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.2)' } as any)
      : { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 })
  },
  brandMark: { alignSelf: 'center', width: 52, height: 52, borderRadius: 16, backgroundColor: '#006400', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brandMarkText: { color: '#fff', fontWeight: '900', fontSize: 30 },
  title: { color: '#0f172a', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: '#64748b', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 },
  requiredPill: { alignSelf: 'center', backgroundColor: '#ecfdf5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginTop: 12 },
  requiredText: { color: '#047857', fontSize: 11, fontWeight: '800' },
  search: {
    height: 46,
    width: '100%',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#0f172a',
    fontSize: 14,
    marginTop: 16,
    backgroundColor: '#f8fafc'
  },
  list: { marginTop: 10 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 10 },
  optionIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  optionIconText: { color: '#15803d', fontSize: 10, fontWeight: '900' },
  optionCopy: { flex: 1 },
  optionShort: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
  optionName: { color: '#64748b', fontSize: 11, marginTop: 2 },
  chevron: { color: '#15803d', fontSize: 26, fontWeight: '300' },
  empty: { color: '#64748b', textAlign: 'center', paddingVertical: 28, fontSize: 13 }
});
