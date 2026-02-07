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

export default function FixedDepositCard({ data, onAdd, onUpdate, onDelete }) {
  const deposits = data?.deposits || [];

  const [expanded, setExpanded] = useState(false);
  const [expandedFD, setExpandedFD] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    id: null,
    bank: '',
    fdNumber: '',
    principalAmount: '',
    interestRate: '',
    startDate: '',
    maturityDate: '',
    compoundingFrequency: 'Quarterly',
    autoRenewal: false,
  });

  /* ---------------- Logic from React FD ---------------- */

  const getDaysRemaining = date => {
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateMaturityAmount = (p, r, s, e, f) => {
    if (!p || !r || !s || !e) return 0;
    const years = (new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24 * 365);
    const map = { Monthly: 12, Quarterly: 4, 'Half-Yearly': 2, Annually: 1 };
    const n = map[f] || 4;
    return Math.round(p * Math.pow(1 + r / 100 / n, n * years));
  };

  const interestTillDate = (p, r, s, f) =>
    calculateMaturityAmount(p, r, s, new Date().toISOString().slice(0, 10), f) - p;

  const stats = useMemo(() => {
    const totalPrincipal = deposits.reduce((s, d) => s + (d.principalAmount || 0), 0);
    const totalMaturityValue = deposits.reduce((s, d) => s + (d.maturityAmount || 0), 0);

    const active = deposits
      .filter(d => new Date(d.maturityDate) > new Date())
      .sort((a, b) => new Date(a.maturityDate) - new Date(b.maturityDate));

    return {
      totalPrincipal,
      totalMaturityValue,
      totalInterestEarned: totalMaturityValue - totalPrincipal,
      totalFDs: deposits.length,
      nextMaturing: active[0],
    };
  }, [deposits]);

  const formatCurrency = v =>
    v >= 1e7 ? `₹${(v / 1e7).toFixed(2)}Cr`
    : v >= 1e5 ? `₹${(v / 1e5).toFixed(2)}L`
    : `₹${v.toLocaleString('en-IN')}`;

  /* ---------------- CRUD ---------------- */

  const resetForm = () => {
    setForm({
      id: null,
      bank: '',
      fdNumber: '',
      principalAmount: '',
      interestRate: '',
      startDate: '',
      maturityDate: '',
      compoundingFrequency: 'Quarterly',
      autoRenewal: false,
    });
    setEditing(false);
    setFormOpen(false);
  };

  const submit = async () => {
    setSaving(true);

    const p = Number(form.principalAmount);
    const r = Number(form.interestRate);

    const maturityAmount = calculateMaturityAmount(
      p,
      r,
      form.startDate,
      form.maturityDate,
      form.compoundingFrequency
    );

    const payload = {
      ...form,
      principalAmount: p,
      interestRate: r,
      maturityAmount,
      interestEarned: maturityAmount - p,
      status: 'Active',
    };

    const res = editing
      ? await onUpdate({ ...payload, updatedAt: new Date().toISOString() })
      : await onAdd({ ...payload, id: `fd_${Date.now()}`, addedAt: new Date().toISOString() });

    setSaving(false);
    if (res?.success) resetForm();
  };

  /* ---------------- UI ---------------- */

  return (
    <>
      <View style={styles.card}>
        {/* HEADER */}
        <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)}>
          <View style={styles.iconBox}>
            <Ionicons name="business-outline" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Fixed Deposits</Text>
            <Text style={styles.subtitle}>Secure investments</Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#9ca3af"
          />
        </TouchableOpacity>

        {/* STATS */}
        <View style={styles.statsGrid}>
          <Stat label="Total Principal" value={formatCurrency(stats.totalPrincipal)} />
          <Stat label="Maturity Value" value={formatCurrency(stats.totalMaturityValue)} />
          <Stat label="Total FDs" value={stats.totalFDs} />
          <Stat label="Interest Earned" value={formatCurrency(stats.totalInterestEarned)} accent />
        </View>

        {stats.nextMaturing && (
          <View style={styles.nextBox}>
            <Text style={styles.nextLabel}>Next Maturing</Text>
            <Text style={styles.nextValue}>
              {stats.nextMaturing.bank} • {getDaysRemaining(stats.nextMaturing.maturityDate)} days
            </Text>
          </View>
        )}

        {/* EXPANDED */}
        {expanded && (
          <View style={styles.body}>
            {deposits.map(fd => {
              const open = expandedFD === fd.id;
              return (
                <View key={fd.id} style={styles.item}>
                  <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => setExpandedFD(open ? null : fd.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{fd.bank}</Text>
                      <Text style={styles.itemType}>
                        {formatCurrency(fd.principalAmount)} @ {fd.interestRate}%
                      </Text>
                    </View>
                    <Text style={styles.itemValue}>
                      {formatCurrency(fd.maturityAmount)}
                    </Text>
                  </TouchableOpacity>

                  {open && (
                    <View style={styles.itemExpanded}>
                      <Detail label="FD Number" value={fd.fdNumber} />
                      <Detail label="Maturity" value={formatCurrency(fd.maturityAmount)} />
                      <Detail
                        label="Interest till date"
                        value={formatCurrency(
                          interestTillDate(
                            fd.principalAmount,
                            fd.interestRate,
                            fd.startDate,
                            fd.compoundingFrequency
                          )
                        )}
                      />

                      <View style={styles.actions}>
                        <Action
                          label="Edit"
                          icon="create-outline"
                          onPress={() => {
                            setForm({ ...fd, principalAmount: String(fd.principalAmount), interestRate: String(fd.interestRate) });
                            setEditing(true);
                            setFormOpen(true);
                            setExpandedFD(null);
                          }}
                        />
                        <Action
                          label="Delete"
                          icon="trash-outline"
                          danger
                          onPress={() => setDeleteTarget(fd)}
                        />
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            <PrimaryButton text="Add Fixed Deposit" onPress={() => setFormOpen(true)} />
          </View>
        )}
      </View>

      {/* ADD / EDIT MODAL */}
      <Modal visible={formOpen} transparent animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editing ? 'Edit Fixed Deposit' : 'Add Fixed Deposit'}
            </Text>

            <ScrollView>
              {[
                ['bank', 'Bank Name'],
                ['fdNumber', 'FD Number'],
                ['principalAmount', 'Principal Amount'],
                ['interestRate', 'Interest Rate'],
                ['startDate', 'Start Date (YYYY-MM-DD)'],
                ['maturityDate', 'Maturity Date (YYYY-MM-DD)'],
              ].map(([k, p]) => (
                <TextInput
                  key={k}
                  placeholder={p}
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

      {/* DELETE */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Delete FD?</Text>
            <Text style={styles.modalText}>{deleteTarget?.bank}</Text>

            <View style={styles.modalActions}>
              <SecondaryButton text="Cancel" onPress={() => setDeleteTarget(null)} />
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

const Stat = ({ label, value, accent }) => (
  <View style={styles.stat}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, accent && { color: '#10b981' }]}>{value}</Text>
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
    <Text style={[styles.actionText, danger && { color: '#ef4444' }]}>{label}</Text>
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

/* ---------- STYLES (same as Other Investments) ---------- */

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
    marginBottom: 12,
  },
  stat: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 10,
    width: '48%',
  },
  statLabel: { color: '#9ca3af', fontSize: 11 },
  statValue: { color: '#fff', fontSize: 15, fontWeight: '600' },

  nextBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#1f2937',
  },
  nextLabel: { color: '#9ca3af', fontSize: 11 },
  nextValue: { color: '#fff', fontSize: 13, fontWeight: '500' },

  body: { padding: 16, gap: 12 },

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
  },
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
    marginTop: 8,
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
