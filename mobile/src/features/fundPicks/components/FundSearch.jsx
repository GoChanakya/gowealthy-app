import React, { forwardRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { Search, X } from 'lucide-react-native';
import { P, F, TABULAR, MIN_TOUCH } from '../theme';
import { hapticSmall } from '../../../lib/haptics';

/**
 * Search across every fund the screen knows about — the picks and their
 * alternates — by name, AMC or category. Results can be swapped onto the list.
 */
const FundSearch = forwardRef(function FundSearch({ search, onSwapIn }, inputRef) {
  const [query, setQuery] = useState('');
  const [swapping, setSwapping] = useState(null);
  const results = search(query);

  const swap = async (entry) => {
    hapticSmall();
    setSwapping(entry.scheme_code);
    try {
      await onSwapIn(entry);
      setQuery('');
    } catch (e) {
      if (__DEV__) console.warn('[fundPicks] swap in failed', e);
      Toast.show({ type: 'error', text1: 'Could not load that fund', text2: 'Try again.' });
    } finally {
      setSwapping(null);
    }
  };

  return (
    <View>
      <View style={styles.field}>
        <Search size={18} color={P.textDim} strokeWidth={2} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search another fund or AMC"
          placeholderTextColor={P.textDim}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Search another fund or AMC"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={10} style={styles.clear} accessibilityLabel="Clear search">
            <X size={16} color={P.textSecondary} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      {query.trim().length > 0 && (
        <View style={styles.results}>
          {results.length === 0 && <Text style={styles.empty}>No funds match “{query.trim()}”</Text>}
          {results.map((r, i) => (
            <View key={r.scheme_code} style={[styles.row, i > 0 && styles.rowBorder]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.name} numberOfLines={1}>{r.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>{r.category} · {r.amc}</Text>
              </View>
              <Text style={styles.match}>{r.match}%</Text>
              {r.listed ? (
                <Text style={styles.listed}>Listed</Text>
              ) : (
                <Pressable
                  onPress={() => swap(r)}
                  disabled={!!swapping}
                  style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Swap in ${r.name}`}
                >
                  {swapping === r.scheme_code
                    ? <ActivityIndicator size="small" color={P.gold} />
                    : <Text style={styles.btnText}>Swap in</Text>}
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

export default FundSearch;

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: P.panel,
    borderWidth: 1,
    borderColor: P.cardBorder,
  },
  input: { flex: 1, fontFamily: F.body, fontSize: 15, color: P.text, paddingVertical: 12 },
  clear: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },

  results: { backgroundColor: P.panel, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 10 },
  empty: { fontFamily: F.body, fontSize: 13, color: P.textDim, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: P.divider },
  name: { fontFamily: F.bodySemi, fontSize: 14, color: P.text },
  meta: { fontFamily: F.body, fontSize: 12, color: P.textSecondary, marginTop: 2 },
  match: { fontFamily: F.bodyBold, fontSize: 14, color: P.gold, ...TABULAR },
  listed: {
    minWidth: 84, textAlign: 'center', fontFamily: F.bodyMed, fontSize: 12.5, color: P.textDim,
  },
  btn: {
    minWidth: 84,
    minHeight: MIN_TOUCH,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(242,181,68,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontFamily: F.bodySemi, fontSize: 13, color: P.gold },
});
