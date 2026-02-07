import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const INVESTMENT_TYPES = [
  'Gold',
  'Silver',
  'Real Estate',
  'Bonds',
  'PPF',
  'EPF',
  'NPS',
  'Crypto',
  'P2P Lending',
  'Commodities',
  'Art & Collectibles',
  'Other',
];

const ICONS = {
  Gold: '🪙',
  Silver: '⚪',
  'Real Estate': '🏢',
  Bonds: '📜',
  PPF: '🏛️',
  EPF: '🏛️',
  NPS: '📊',
  Crypto: '₿',
  'P2P Lending': '🤝',
  Commodities: '📦',
  'Art & Collectibles': '🎨',
  Other: '💼',
};

export default function OtherInvestmentsCard({ data, onAdd, onUpdate, onDelete }) {
  const investments = data?.assets || [];

  const [expanded, setExpanded] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);
  const [category, setCategory] = useState('All');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    id: null,
    type: 'Gold',
    name: '',
    investedAmount: '',
    quantity: '',
    unit: '',
    purchaseDate: '',
    notes: '',
  });

  /* ---------- Stats ---------- */
  const stats = useMemo(() => {
    const totalInvested = investments.reduce((s, i) => s + (i.investedAmount || 0), 0);
    const totalHoldings = investments.length;
    const assetTypes = new Set(investments.map(i => i.type)).size;
    return { totalInvested, totalHoldings, assetTypes };
  }, [investments]);

  const categories = ['All', ...new Set(investments.map(i => i.type))];
  const filtered =
    category === 'All'
      ? investments
      : investments.filter(i => i.type === category);

  const formatCurrency = amt => {
    if (amt >= 1e7) return `₹${(amt / 1e7).toFixed(2)}Cr`;
    if (amt >= 1e5) return `₹${(amt / 1e5).toFixed(2)}L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  /* ---------- Handlers ---------- */
  const resetForm = () => {
    setForm({
      id: null,
      type: 'Gold',
      name: '',
      investedAmount: '',
      quantity: '',
      unit: '',
      purchaseDate: '',
      notes: '',
    });
    setEditing(false);
    setFormOpen(false);
  };

  const submit = async () => {
    setSaving(true);

    const payload = {
      ...form,
      investedAmount: Number(form.investedAmount),
    };

    const res = editing
      ? await onUpdate({ ...payload, updatedAt: new Date().toISOString() })
      : await onAdd({
          ...payload,
          id: `inv_${Date.now()}`,
          addedAt: new Date().toISOString(),
        });

    setSaving(false);
    if (res?.success) resetForm();
  };

  /* ---------- UI ---------- */
  return (
    <>
      {/* CARD */}
      <View style={styles.card}>
        {/* HEADER */}
        <TouchableOpacity
          style={styles.header}
          onPress={() => !formOpen && setExpanded(!expanded)}
        >
          <View style={styles.iconBox}>
            <Ionicons name="wallet" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Other Investments</Text>
            <Text style={styles.subtitle}>Alternative assets</Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#9ca3af"
          />
        </TouchableOpacity>

        {/* STATS */}
        <View style={styles.statsGrid}>
          <Stat label="Total Invested" value={formatCurrency(stats.totalInvested)} />
          <Stat label="Holdings" value={stats.totalHoldings} />
          <Stat
            label="Asset Types"
            value={`${stats.assetTypes}`}
            wide
            accent
          />
        </View>

        {/* EXPANDED */}
        {expanded && (
          <View style={styles.body}>
            {/* FILTER */}
            {investments.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[
                      styles.filter,
                      category === c && styles.filterActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        category === c && styles.filterTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* LIST */}
            {filtered.map(inv => {
              const open = expandedItem === inv.id;
              return (
                <View key={inv.id} style={styles.item}>
                  <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => setExpandedItem(open ? null : inv.id)}
                  >
                    <Text style={styles.itemIcon}>{ICONS[inv.type] || '💼'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{inv.name}</Text>
                      <Text style={styles.itemType}>{inv.type}</Text>
                    </View>
                    <Text style={styles.itemValue}>
                      {formatCurrency(inv.investedAmount)}
                    </Text>
                  </TouchableOpacity>

                  {open && (
                    <View style={styles.itemExpanded}>
                      <Detail label="Invested" value={formatCurrency(inv.investedAmount)} />
                      {inv.quantity && (
                        <Detail label="Quantity" value={`${inv.quantity} ${inv.unit}`} />
                      )}
                      <Detail label="Date" value={inv.purchaseDate} />

                      <View style={styles.actions}>
                        <Action
                          label="Edit"
                          icon="create-outline"
                          onPress={() => {
                            setForm({ ...inv, investedAmount: String(inv.investedAmount) });
                            setEditing(true);
                            setFormOpen(true);
                            setExpandedItem(null);
                          }}
                        />
                        <Action
                          label="Delete"
                          danger
                          icon="trash-outline"
                          onPress={() => setDeleteTarget(inv)}
                        />
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {/* ADD */}
            <PrimaryButton text="Add Investment" onPress={() => setFormOpen(true)} />
          </View>
        )}
      </View>

      {/* ADD / EDIT MODAL */}
      <Modal visible={formOpen} animationType="slide" transparent>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editing ? 'Edit Investment' : 'Add Investment'}
            </Text>

            <ScrollView>
              {['name', 'investedAmount', 'quantity', 'unit', 'purchaseDate', 'notes'].map(k => (
                <TextInput
                  key={k}
                  placeholder={k}
                  value={form[k]}
                  onChangeText={v => setForm({ ...form, [k]: v })}
                  style={styles.input}
                  placeholderTextColor="#6b7280"
                />
              ))}
            </ScrollView>

            {saving ? (
              <ActivityIndicator color="#a855f7" />
            ) : (
              <View style={styles.modalActions}>
                <SecondaryButton text="Cancel" onPress={resetForm} />
                <PrimaryButton text="Save" onPress={submit} />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* DELETE CONFIRM */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Delete Investment?</Text>
            <Text style={styles.modalText}>{deleteTarget?.name}</Text>

            <View style={styles.modalActions}>
              <SecondaryButton
                text="Cancel"
                onPress={() => setDeleteTarget(null)}
              />
              <PrimaryButton
                danger
                text="Delete"
                onPress={async () => {
                  await onDelete(deleteTarget);
                  setDeleteTarget(null);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

const Stat = ({ label, value, wide, accent }) => (
  <View style={[styles.stat, wide && { width: '100%' }]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, accent && { color: '#10b981' }]}>
      {value}
    </Text>
  </View>
);

const Detail = ({ label, value }) => (
  <View style={styles.detail}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const Action = ({ label, icon, danger, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.action, danger && { borderColor: '#ef4444' }]}
  >
    <Ionicons name={icon} size={14} color={danger ? '#ef4444' : '#a855f7'} />
    <Text style={[styles.actionText, danger && { color: '#ef4444' }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const PrimaryButton = ({ text, onPress, danger }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.primaryBtn, danger && { backgroundColor: '#ef4444' }]}
  >
    <Text style={styles.primaryText}>{text}</Text>
  </TouchableOpacity>
);

const SecondaryButton = ({ text, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.secondaryBtn}>
    <Text style={styles.secondaryText}>{text}</Text>
  </TouchableOpacity>
);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#000',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#6c50c4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  subtitle: { color: '#9ca3af', fontSize: 12 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  stat: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 10,
    width: '48%',
  },
  statLabel: { color: '#9ca3af', fontSize: 11 },
  statValue: { color: '#fff', fontSize: 15, fontWeight: '600' },

  body: { padding: 16, gap: 12 },

  filter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginRight: 8,
  },
  filterActive: { backgroundColor: '#6c50c4' },
  filterText: { color: '#9ca3af', fontSize: 11 },
  filterTextActive: { color: '#fff' },

  item: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  itemIcon: { fontSize: 18 },
  itemName: { color: '#fff', fontSize: 14, fontWeight: '500' },
  itemType: { color: '#9ca3af', fontSize: 11 },
  itemValue: { color: '#fff', fontSize: 13 },

  itemExpanded: {
    backgroundColor: '#111827',
    padding: 12,
    gap: 8,
  },
  detail: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: '#9ca3af', fontSize: 12 },
  detailValue: { color: '#fff', fontSize: 12 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  action: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#a855f7',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  actionText: { color: '#a855f7', fontSize: 12 },

  primaryBtn: {
    backgroundColor: '#6c50c4',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: {
    borderColor: '#374151',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  secondaryText: { color: '#fff' },

  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: '85%',
  },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  modalText: { color: '#9ca3af', marginBottom: 16 },
  input: {
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    marginBottom: 10,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
});
