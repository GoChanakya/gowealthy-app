import * as DocumentPicker from 'expo-document-picker';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

/* ---------------- Mock OCR (replace later) ---------------- */
const parseOCRResponse = async () => {
  await new Promise(r => setTimeout(r, 1500));
  return [
    {
      id: `holding_${Date.now()}`,
      type: 'Stock',
      name: 'Reliance Industries Ltd',
      isin: 'INE002A01018',
      quantity: 10,
      investedAmount: 25000,
      marketCap: 'Large Cap',
      sector: 'Energy',
      industry: 'Oil & Gas',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: '',
      addedAt: new Date().toISOString(),
    },
  ];
};

/* ---------------- Helpers ---------------- */
const formatCurrency = amt => {
  if (!amt) return '₹0';
  if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)}L`;
  return `₹${amt.toLocaleString('en-IN')}`;
};

/* ---------------- Component ---------------- */
const StockMFCard = ({ data, onAdd, onUpdate, onDelete }) => {
  const holdings = data?.holdings || [];

  const [expanded, setExpanded] = useState(false);
  const [expandedHolding, setExpandedHolding] = useState(null);

  const [activeFilter, setActiveFilter] = useState('All');
  const [capFilter, setCapFilter] = useState('All');

  const [uploading, setUploading] = useState(false);
  const [passwordSheet, setPasswordSheet] = useState(false);
  const [casPassword, setCasPassword] = useState('');

  const [editModal, setEditModal] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [deleteSheet, setDeleteSheet] = useState(false);
  const [holdingToDelete, setHoldingToDelete] = useState(null);

  /* ---------------- Stats ---------------- */
  const stats = useMemo(() => ({
    total: holdings.length,
    invested: holdings.reduce((s, h) => s + (h.investedAmount || 0), 0),
    stocks: holdings.filter(h => h.type === 'Stock').length,
    mfs: holdings.filter(h => h.type === 'Mutual Fund').length,
  }), [holdings]);

  /* ---------------- Filters ---------------- */
  const filteredHoldings = useMemo(() => {
    let list = holdings;
    if (activeFilter !== 'All') {
      list = list.filter(h => h.type === activeFilter);
    }
    if (activeFilter === 'Stock' && capFilter !== 'All') {
      list = list.filter(h => h.marketCap === capFilter);
    }
    return list;
  }, [holdings, activeFilter, capFilter]);

  /* ---------------- Upload ---------------- */
  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      multiple: false,
    });

    if (res.canceled) return;

    setUploading(true);
    setPasswordSheet(true);
  };

  const handleProcessCAS = async () => {
    setPasswordSheet(false);
    const extracted = await parseOCRResponse();

    for (const h of extracted) {
      await onAdd(h);
    }

    setUploading(false);
    setExpanded(false);
    setCasPassword('');
  };

  /* ---------------- Edit ---------------- */
  const openEdit = holding => {
    setEditingHolding(holding);
    setEditForm({
      name: holding.name,
      quantity: String(holding.quantity),
      investedAmount: String(holding.investedAmount || ''),
      marketCap: holding.marketCap,
      sector: holding.sector,
      industry: holding.industry,
      purchaseDate: holding.purchaseDate,
      notes: holding.notes,
    });
    setEditModal(true);
  };

  const saveEdit = async () => {
    await onUpdate({
      ...editingHolding,
      ...editForm,
      quantity: Number(editForm.quantity),
      investedAmount: Number(editForm.investedAmount) || 0,
      updatedAt: new Date().toISOString(),
    });
    setEditModal(false);
    setEditingHolding(null);
  };

  /* ---------------- Delete ---------------- */
  const confirmDelete = async () => {
    await onDelete(holdingToDelete);
    setDeleteSheet(false);
    setHoldingToDelete(null);
  };

  /* ---------------- UI ---------------- */
  return (
    <>
      <View style={styles.card}>
        <Pressable onPress={() => setExpanded(!expanded)}>
          <Text style={styles.title}>📈 Stocks & Mutual Funds</Text>
          <Text style={styles.sub}>Track your holdings</Text>
        </Pressable>

        <View style={styles.statsRow}>
          <Stat label="Holdings" value={stats.total} />
          <Stat label="Invested" value={formatCurrency(stats.invested)} />
          <Stat label="Stocks" value={stats.stocks} />
          <Stat label="MFs" value={stats.mfs} />
        </View>

        {expanded && (
          <View style={{ marginTop: 12 }}>
            <Pressable style={styles.uploadBtn} onPress={pickFile}>
              <Text style={styles.uploadText}>➕ Upload CAS / Screenshots</Text>
            </Pressable>

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
              {['All', 'Stock', 'Mutual Fund', 'Other'].map(f => (
                <Chip
                  key={f}
                  label={f}
                  active={activeFilter === f}
                  onPress={() => {
                    setActiveFilter(f);
                    setCapFilter('All');
                  }}
                />
              ))}
            </ScrollView>

            {activeFilter === 'Stock' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['All', 'Small Cap', 'Mid Cap', 'Large Cap'].map(c => (
                  <Chip
                    key={c}
                    small
                    label={c}
                    active={capFilter === c}
                    onPress={() => setCapFilter(c)}
                  />
                ))}
              </ScrollView>
            )}

            {filteredHoldings.length === 0 ? (
              <Text style={styles.empty}>No holdings yet</Text>
            ) : (
              filteredHoldings.map(h => (
                <View key={h.id} style={styles.holding}>
                  <Pressable onPress={() => setExpandedHolding(expandedHolding === h.id ? null : h.id)}>
                    <Text style={styles.hName}>{h.name}</Text>
                    <Text style={styles.hSub}>{h.type} • {h.quantity}</Text>
                  </Pressable>

                  {expandedHolding === h.id && (
                    <>
                      <Text style={styles.detail}>Invested: {formatCurrency(h.investedAmount)}</Text>
                      <Text style={styles.detail}>Purchase: {h.purchaseDate}</Text>

                      <View style={styles.actions}>
                        <Pressable style={styles.editBtn} onPress={() => openEdit(h)}>
                          <Text style={styles.actionText}>Edit</Text>
                        </Pressable>
                        <Pressable
                          style={styles.delBtn}
                          onPress={() => {
                            setHoldingToDelete(h);
                            setDeleteSheet(true);
                          }}
                        >
                          <Text style={styles.actionText}>Delete</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </View>

      {/* Password Sheet */}
      <Modal visible={passwordSheet} transparent animationType="slide">
        <View style={styles.sheet}>
          <View style={styles.sheetBox}>
            <Text style={styles.modalTitle}>Enter CAS Password</Text>
            <TextInput
              secureTextEntry
              value={casPassword}
              onChangeText={setCasPassword}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
            <Pressable style={styles.saveBtn} onPress={handleProcessCAS}>
              {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Continue</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.sheet}>
          <ScrollView style={styles.sheetBox}>
            <Text style={styles.modalTitle}>Edit Holding</Text>

            <Input label="Name" value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} />
            <Input label="Quantity" keyboardType="numeric" value={editForm.quantity} onChange={v => setEditForm({ ...editForm, quantity: v })} />
            <Input label="Invested Amount" keyboardType="numeric" value={editForm.investedAmount} onChange={v => setEditForm({ ...editForm, investedAmount: v })} />
            <Input label="Purchase Date" value={editForm.purchaseDate} onChange={v => setEditForm({ ...editForm, purchaseDate: v })} />
            <Input label="Notes" value={editForm.notes} onChange={v => setEditForm({ ...editForm, notes: v })} />

            <Pressable style={styles.saveBtn} onPress={saveEdit}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Sheet */}
      <Modal visible={deleteSheet} transparent animationType="fade">
        <View style={styles.sheet}>
          <View style={styles.sheetBox}>
            <Text style={styles.modalTitle}>Delete Holding?</Text>
            <Pressable style={styles.delBtn} onPress={confirmDelete}>
              <Text style={styles.actionText}>Delete</Text>
            </Pressable>
            <Pressable onPress={() => setDeleteSheet(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

/* ---------------- Small UI ---------------- */
const Stat = ({ label, value }) => (
  <View style={styles.stat}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const Chip = ({ label, active, onPress, small }) => (
  <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive, small && styles.chipSmall]}>
    <Text style={{ color: active ? '#fff' : '#9ca3af', fontSize: small ? 12 : 14 }}>
      {label}
    </Text>
  </Pressable>
);

const Input = ({ label, value, onChange, ...props }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput value={value} onChangeText={onChange} style={styles.input} {...props} />
  </View>
);

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  card: { backgroundColor: '#111827', borderRadius: 16, padding: 16, marginBottom: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sub: { color: '#9ca3af', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  stat: { flex: 1, backgroundColor: '#1f2937', padding: 8, borderRadius: 8 },
  statLabel: { color: '#9ca3af', fontSize: 12 },
  statValue: { color: '#fff', fontWeight: '700' },
  uploadBtn: { backgroundColor: '#6c50c4', padding: 12, borderRadius: 12 },
  uploadText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#1f2937', borderRadius: 999, marginRight: 8 },
  chipActive: { backgroundColor: '#6c50c4' },
  chipSmall: { paddingVertical: 6, paddingHorizontal: 10 },
  empty: { color: '#9ca3af', textAlign: 'center', marginTop: 20 },
  holding: { backgroundColor: '#1f2937', borderRadius: 12, padding: 12, marginBottom: 8 },
  hName: { color: '#fff', fontWeight: '700' },
  hSub: { color: '#9ca3af' },
  detail: { color: '#d1d5db', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  editBtn: { flex: 1, backgroundColor: '#4f46e5', padding: 8, borderRadius: 8 },
  delBtn: { flex: 1, backgroundColor: '#ef4444', padding: 8, borderRadius: 8 },
  actionText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  sheet: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheetBox: { backgroundColor: '#111827', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: '#1f2937', color: '#fff', padding: 12, borderRadius: 8 },
  label: { color: '#9ca3af', marginBottom: 4 },
  saveBtn: { backgroundColor: '#6c50c4', padding: 14, borderRadius: 12, marginTop: 12 },
  saveText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  cancel: { color: '#9ca3af', textAlign: 'center', marginTop: 12 },
});

export default StockMFCard;
