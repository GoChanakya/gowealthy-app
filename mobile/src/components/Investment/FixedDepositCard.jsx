// import { Ionicons } from '@expo/vector-icons';
// import { useMemo, useState } from 'react';
// import {
//     ActivityIndicator,
//     Modal,
//     ScrollView,
//     StyleSheet,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     View,
// } from 'react-native';

// export default function FixedDepositCard({ data, onAdd, onUpdate, onDelete }) {
//   const deposits = data?.deposits || [];

//   const [expanded, setExpanded] = useState(false);
//   const [expandedFD, setExpandedFD] = useState(null);

//   const [formOpen, setFormOpen] = useState(false);
//   const [editing, setEditing] = useState(false);
//   const [saving, setSaving] = useState(false);

//   const [deleteTarget, setDeleteTarget] = useState(null);

//   const [form, setForm] = useState({
//     id: null,
//     bank: '',
//     fdNumber: '',
//     principalAmount: '',
//     interestRate: '',
//     startDate: '',
//     maturityDate: '',
//     compoundingFrequency: 'Quarterly',
//     autoRenewal: false,
//   });

//   /* ---------------- Logic from React FD ---------------- */

//   const getDaysRemaining = date => {
//     const diff = new Date(date) - new Date();
//     return Math.ceil(diff / (1000 * 60 * 60 * 24));
//   };

//   const calculateMaturityAmount = (p, r, s, e, f) => {
//     if (!p || !r || !s || !e) return 0;
//     const years = (new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24 * 365);
//     const map = { Monthly: 12, Quarterly: 4, 'Half-Yearly': 2, Annually: 1 };
//     const n = map[f] || 4;
//     return Math.round(p * Math.pow(1 + r / 100 / n, n * years));
//   };

//   const interestTillDate = (p, r, s, f) =>
//     calculateMaturityAmount(p, r, s, new Date().toISOString().slice(0, 10), f) - p;

//   const stats = useMemo(() => {
//     const totalPrincipal = deposits.reduce((s, d) => s + (d.principalAmount || 0), 0);
//     const totalMaturityValue = deposits.reduce((s, d) => s + (d.maturityAmount || 0), 0);

//     const active = deposits
//       .filter(d => new Date(d.maturityDate) > new Date())
//       .sort((a, b) => new Date(a.maturityDate) - new Date(b.maturityDate));

//     return {
//       totalPrincipal,
//       totalMaturityValue,
//       totalInterestEarned: totalMaturityValue - totalPrincipal,
//       totalFDs: deposits.length,
//       nextMaturing: active[0],
//     };
//   }, [deposits]);

//   const formatCurrency = v =>
//     v >= 1e7 ? `₹${(v / 1e7).toFixed(2)}Cr`
//     : v >= 1e5 ? `₹${(v / 1e5).toFixed(2)}L`
//     : `₹${v.toLocaleString('en-IN')}`;

//   /* ---------------- CRUD ---------------- */

//   const resetForm = () => {
//     setForm({
//       id: null,
//       bank: '',
//       fdNumber: '',
//       principalAmount: '',
//       interestRate: '',
//       startDate: '',
//       maturityDate: '',
//       compoundingFrequency: 'Quarterly',
//       autoRenewal: false,
//     });
//     setEditing(false);
//     setFormOpen(false);
//   };

//   const submit = async () => {
//     setSaving(true);

//     const p = Number(form.principalAmount);
//     const r = Number(form.interestRate);

//     const maturityAmount = calculateMaturityAmount(
//       p,
//       r,
//       form.startDate,
//       form.maturityDate,
//       form.compoundingFrequency
//     );

//     const payload = {
//       ...form,
//       principalAmount: p,
//       interestRate: r,
//       maturityAmount,
//       interestEarned: maturityAmount - p,
//       status: 'Active',
//     };

//     const res = editing
//       ? await onUpdate({ ...payload, updatedAt: new Date().toISOString() })
//       : await onAdd({ ...payload, id: `fd_${Date.now()}`, addedAt: new Date().toISOString() });

//     setSaving(false);
//     if (res?.success) resetForm();
//   };

//   /* ---------------- UI ---------------- */

//   return (
//     <>
//       <View style={styles.card}>
//         {/* HEADER */}
//         <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)}>
//           <View style={styles.iconBox}>
//             <Ionicons name="business-outline" size={22} color="#fff" />
//           </View>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.title}>Fixed Deposits</Text>
//             <Text style={styles.subtitle}>Secure investments</Text>
//           </View>
//           <Ionicons
//             name={expanded ? 'chevron-up' : 'chevron-down'}
//             size={20}
//             color="#9ca3af"
//           />
//         </TouchableOpacity>

//         {/* STATS */}
//         <View style={styles.statsGrid}>
//           <Stat label="Total Principal" value={formatCurrency(stats.totalPrincipal)} />
//           <Stat label="Maturity Value" value={formatCurrency(stats.totalMaturityValue)} />
//           <Stat label="Total FDs" value={stats.totalFDs} />
//           <Stat label="Interest Earned" value={formatCurrency(stats.totalInterestEarned)} accent />
//         </View>

//         {stats.nextMaturing && (
//           <View style={styles.nextBox}>
//             <Text style={styles.nextLabel}>Next Maturing</Text>
//             <Text style={styles.nextValue}>
//               {stats.nextMaturing.bank} • {getDaysRemaining(stats.nextMaturing.maturityDate)} days
//             </Text>
//           </View>
//         )}

//         {/* EXPANDED */}
//         {expanded && (
//           <View style={styles.body}>
//             {deposits.map(fd => {
//               const open = expandedFD === fd.id;
//               return (
//                 <View key={fd.id} style={styles.item}>
//                   <TouchableOpacity
//                     style={styles.itemRow}
//                     onPress={() => setExpandedFD(open ? null : fd.id)}
//                   >
//                     <View style={{ flex: 1 }}>
//                       <Text style={styles.itemName}>{fd.bank}</Text>
//                       <Text style={styles.itemType}>
//                         {formatCurrency(fd.principalAmount)} @ {fd.interestRate}%
//                       </Text>
//                     </View>
//                     <Text style={styles.itemValue}>
//                       {formatCurrency(fd.maturityAmount)}
//                     </Text>
//                   </TouchableOpacity>

//                   {open && (
//                     <View style={styles.itemExpanded}>
//                       <Detail label="FD Number" value={fd.fdNumber} />
//                       <Detail label="Maturity" value={formatCurrency(fd.maturityAmount)} />
//                       <Detail
//                         label="Interest till date"
//                         value={formatCurrency(
//                           interestTillDate(
//                             fd.principalAmount,
//                             fd.interestRate,
//                             fd.startDate,
//                             fd.compoundingFrequency
//                           )
//                         )}
//                       />

//                       <View style={styles.actions}>
//                         <Action
//                           label="Edit"
//                           icon="create-outline"
//                           onPress={() => {
//                             setForm({ ...fd, principalAmount: String(fd.principalAmount), interestRate: String(fd.interestRate) });
//                             setEditing(true);
//                             setFormOpen(true);
//                             setExpandedFD(null);
//                           }}
//                         />
//                         <Action
//                           label="Delete"
//                           icon="trash-outline"
//                           danger
//                           onPress={() => setDeleteTarget(fd)}
//                         />
//                       </View>
//                     </View>
//                   )}
//                 </View>
//               );
//             })}

//             <PrimaryButton text="Add Fixed Deposit" onPress={() => setFormOpen(true)} />
//           </View>
//         )}
//       </View>

//       {/* ADD / EDIT MODAL */}
//       <Modal visible={formOpen} transparent animationType="slide">
//         <View style={styles.modalWrap}>
//           <View style={styles.modal}>
//             <Text style={styles.modalTitle}>
//               {editing ? 'Edit Fixed Deposit' : 'Add Fixed Deposit'}
//             </Text>

//             <ScrollView>
//               {[
//                 ['bank', 'Bank Name'],
//                 ['fdNumber', 'FD Number'],
//                 ['principalAmount', 'Principal Amount'],
//                 ['interestRate', 'Interest Rate'],
//                 ['startDate', 'Start Date (YYYY-MM-DD)'],
//                 ['maturityDate', 'Maturity Date (YYYY-MM-DD)'],
//               ].map(([k, p]) => (
//                 <TextInput
//                   key={k}
//                   placeholder={p}
//                   value={form[k]}
//                   onChangeText={v => setForm({ ...form, [k]: v })}
//                   style={styles.input}
//                   placeholderTextColor="#6b7280"
//                 />
//               ))}
//             </ScrollView>

//             {saving ? (
//               <ActivityIndicator color="#a855f7" />
//             ) : (
//               <View style={styles.modalActions}>
//                 <SecondaryButton text="Cancel" onPress={resetForm} />
//                 <PrimaryButton text="Save" onPress={submit} />
//               </View>
//             )}
//           </View>
//         </View>
//       </Modal>

//       {/* DELETE */}
//       <Modal visible={!!deleteTarget} transparent animationType="fade">
//         <View style={styles.modalWrap}>
//           <View style={styles.modal}>
//             <Text style={styles.modalTitle}>Delete FD?</Text>
//             <Text style={styles.modalText}>{deleteTarget?.bank}</Text>

//             <View style={styles.modalActions}>
//               <SecondaryButton text="Cancel" onPress={() => setDeleteTarget(null)} />
//               <PrimaryButton
//                 danger
//                 text="Delete"
//                 onPress={async () => {
//                   await onDelete(deleteTarget);
//                   setDeleteTarget(null);
//                 }}
//               />
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </>
//   );
// }

// /* ---------- SMALL COMPONENTS ---------- */

// const Stat = ({ label, value, accent }) => (
//   <View style={styles.stat}>
//     <Text style={styles.statLabel}>{label}</Text>
//     <Text style={[styles.statValue, accent && { color: '#10b981' }]}>{value}</Text>
//   </View>
// );

// const Detail = ({ label, value }) => (
//   <View style={styles.detail}>
//     <Text style={styles.detailLabel}>{label}</Text>
//     <Text style={styles.detailValue}>{value}</Text>
//   </View>
// );

// const Action = ({ label, icon, danger, onPress }) => (
//   <TouchableOpacity
//     onPress={onPress}
//     style={[styles.action, danger && { borderColor: '#ef4444' }]}
//   >
//     <Ionicons name={icon} size={14} color={danger ? '#ef4444' : '#a855f7'} />
//     <Text style={[styles.actionText, danger && { color: '#ef4444' }]}>{label}</Text>
//   </TouchableOpacity>
// );

// const PrimaryButton = ({ text, onPress, danger }) => (
//   <TouchableOpacity
//     onPress={onPress}
//     style={[styles.primaryBtn, danger && { backgroundColor: '#ef4444' }]}
//   >
//     <Text style={styles.primaryText}>{text}</Text>
//   </TouchableOpacity>
// );

// const SecondaryButton = ({ text, onPress }) => (
//   <TouchableOpacity onPress={onPress} style={styles.secondaryBtn}>
//     <Text style={styles.secondaryText}>{text}</Text>
//   </TouchableOpacity>
// );

// /* ---------- STYLES (same as Other Investments) ---------- */

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: '#000',
//     borderColor: '#374151',
//     borderWidth: 1,
//     borderRadius: 16,
//     marginBottom: 16,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     gap: 12,
//   },
//   iconBox: {
//     width: 44,
//     height: 44,
//     borderRadius: 12,
//     backgroundColor: '#6c50c4',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   title: { color: '#fff', fontSize: 16, fontWeight: '600' },
//   subtitle: { color: '#9ca3af', fontSize: 12 },

//   statsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     paddingHorizontal: 16,
//     marginBottom: 12,
//   },
//   stat: {
//     backgroundColor: '#1f2937',
//     borderRadius: 12,
//     padding: 10,
//     width: '48%',
//   },
//   statLabel: { color: '#9ca3af', fontSize: 11 },
//   statValue: { color: '#fff', fontSize: 15, fontWeight: '600' },

//   nextBox: {
//     marginHorizontal: 16,
//     marginBottom: 12,
//     padding: 10,
//     borderRadius: 10,
//     backgroundColor: '#1f2937',
//   },
//   nextLabel: { color: '#9ca3af', fontSize: 11 },
//   nextValue: { color: '#fff', fontSize: 13, fontWeight: '500' },

//   body: { padding: 16, gap: 12 },

//   item: {
//     backgroundColor: '#1f2937',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#374151',
//   },
//   itemRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//   },
//   itemName: { color: '#fff', fontSize: 14, fontWeight: '500' },
//   itemType: { color: '#9ca3af', fontSize: 11 },
//   itemValue: { color: '#fff', fontSize: 13 },

//   itemExpanded: {
//     backgroundColor: '#111827',
//     padding: 12,
//     gap: 8,
//   },
//   detail: { flexDirection: 'row', justifyContent: 'space-between' },
//   detailLabel: { color: '#9ca3af', fontSize: 12 },
//   detailValue: { color: '#fff', fontSize: 12 },

//   actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
//   action: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#a855f7',
//     borderRadius: 8,
//     padding: 8,
//     flexDirection: 'row',
//     gap: 6,
//     justifyContent: 'center',
//   },
//   actionText: { color: '#a855f7', fontSize: 12 },

//   primaryBtn: {
//     backgroundColor: '#6c50c4',
//     padding: 12,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginTop: 8,
//   },
//   primaryText: { color: '#fff', fontWeight: '600' },

//   secondaryBtn: {
//     borderColor: '#374151',
//     borderWidth: 1,
//     padding: 12,
//     borderRadius: 12,
//     alignItems: 'center',
//     flex: 1,
//   },
//   secondaryText: { color: '#fff' },

//   modalWrap: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'flex-end',
//   },
//   modal: {
//     backgroundColor: '#1f2937',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     padding: 16,
//     maxHeight: '85%',
//   },
//   modalTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
//   modalText: { color: '#9ca3af', marginBottom: 16 },

//   input: {
//     backgroundColor: '#111827',
//     borderRadius: 10,
//     padding: 12,
//     color: '#fff',
//     marginBottom: 10,
//   },
//   modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
// });

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, TextInput, ActivityIndicator, Platform, Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import {
  Landmark, Plus, ChevronDown, X, Calendar,
  Percent, TrendingUp, DollarSign, Clock,
  Edit2, Check, AlertTriangle,
} from 'lucide-react-native';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const PURPLE = 'rgb(108,80,196)';
const GREEN  = '#10b981';
const AMBER  = '#f59e0b';
const RED    = '#ef4444';
const GRAY   = '#9ca3af';
const CARD   = '#1f2937';
const CARD2  = '#111827';
const BORDER = '#374151';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000)   return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

const formatDate = (str) => {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const toDateStr = (date) => {
  const d  = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const getDaysRemaining = (maturityDate) => {
  const days = Math.ceil((new Date(maturityDate) - new Date()) / 86400000);
  return days;
};

const calculateMaturityAmount = (principal, rate, startDate, endDate, frequency) => {
  if (!principal || !rate || !startDate || !endDate) return 0;
  const years = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24 * 365);
  const n = { Monthly: 12, Quarterly: 4, 'Half-Yearly': 2, Annually: 1 }[frequency] || 4;
  return Math.round(principal * Math.pow(1 + (rate / 100) / n, n * years));
};

const getInterestToDate = (principal, rate, startDate, frequency) =>
  calculateMaturityAmount(principal, rate, startDate, toDateStr(new Date()), frequency) - principal;

const statusColor = (s) =>
  ({ Active: GREEN, 'Maturing Soon': AMBER, Matured: GRAY }[s] || GRAY);

const FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Annually'];

const EMPTY_FORM = {
  id: '', bank: '', fdNumber: '', principalAmount: '',
  interestRate: '', startDate: '', maturityDate: '',
  compoundingFrequency: 'Quarterly', autoRenewal: false,
};

// ─── Reusable bottom sheet ────────────────────────────────────────────────────
const BottomSheet = ({ visible, onClose, title, children, footer }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={bs.overlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      <View style={bs.sheet}>
        <View style={bs.handle} />
        <View style={bs.header}>
          <Text style={bs.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={bs.closeBtn}>
            <X size={18} color={GRAY} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={{ paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
          <View style={{ height: 16 }} />
        </ScrollView>
        {footer && <View style={bs.footer}>{footer}</View>}
      </View>
    </View>
  </Modal>
);

const bs = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet:    { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: '#4b5563', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER },
  title:    { fontSize: 17, fontWeight: '700', color: '#fff' },
  closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  footer:   { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: BORDER },
});

// ─── Form helpers ─────────────────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <Text style={ff.label}>{children}{required && <Text style={{ color: RED }}> *</Text>}</Text>
);

const StyledInput = (props) => (
  <TextInput style={ff.input} placeholderTextColor={GRAY} selectionColor={PURPLE} {...props} />
);

const DateField = ({ label, value, onPress, required }) => (
  <View style={{ flex: 1 }}>
    <Label required={required}>{label}</Label>
    <TouchableOpacity style={ff.dateBtn} onPress={onPress}>
      <Calendar size={14} color={GRAY} />
      <Text style={[ff.dateText, !value && { color: GRAY }]}>
        {value ? formatDate(value) : 'Select date'}
      </Text>
    </TouchableOpacity>
  </View>
);

const ff = StyleSheet.create({
  label:   { fontSize: 13, fontWeight: '600', color: '#fff', marginBottom: 8, marginTop: 16 },
  input:   { backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#fff' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  dateText:{ fontSize: 15, color: '#fff' },
});

// ─── Main Component ───────────────────────────────────────────────────────────
const FixedDepositCard = ({ data, onAdd, onUpdate, onDelete }) => {
  const [isExpanded,     setIsExpanded]     = useState(false);
  const [isFormOpen,     setIsFormOpen]     = useState(false);
  const [isEditing,      setIsEditing]      = useState(false);
  const [expandedFD,     setExpandedFD]     = useState(null);
  const [isSaving,       setIsSaving]       = useState(false);
  const [deleteOpen,     setDeleteOpen]     = useState(false);
  const [fdToDelete,     setFdToDelete]     = useState(null);
  const [formData,       setFormData]       = useState(EMPTY_FORM);

  // Date picker state: 'start' | 'maturity' | null
  const [activeDateField, setActiveDateField] = useState(null);
  // Frequency picker sheet
  const [freqSheetOpen, setFreqSheetOpen] = useState(false);

  const fixedDeposits = data?.deposits || [];

  const stats = useMemo(() => {
    const totalPrincipal     = fixedDeposits.reduce((s, fd) => s + (fd.principalAmount || 0), 0);
    const totalMaturityValue = fixedDeposits.reduce((s, fd) => s + (fd.maturityAmount   || 0), 0);
    const today   = new Date();
    const active  = fixedDeposits
      .filter(fd => new Date(fd.maturityDate) > today)
      .sort((a, b) => new Date(a.maturityDate) - new Date(b.maturityDate));
    return {
      totalPrincipal,
      totalMaturityValue,
      totalInterestEarned: totalMaturityValue - totalPrincipal,
      totalFDs:            fixedDeposits.length,
      nextMaturing:        active.length > 0 ? {
        bank:          active[0].bank,
        daysRemaining: getDaysRemaining(active[0].maturityDate),
        amount:        active[0].maturityAmount,
      } : null,
    };
  }, [fixedDeposits]);

  const set = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  const resetForm = () => { setFormData(EMPTY_FORM); setIsFormOpen(false); setIsEditing(false); };

  // Live maturity preview
  const maturityPreview = useMemo(() => {
    const p = parseFloat(formData.principalAmount);
    const r = parseFloat(formData.interestRate);
    if (!p || !r || !formData.startDate || !formData.maturityDate) return null;
    const maturity  = calculateMaturityAmount(p, r, formData.startDate, formData.maturityDate, formData.compoundingFrequency);
    return { maturity, interest: maturity - p };
  }, [formData.principalAmount, formData.interestRate, formData.startDate, formData.maturityDate, formData.compoundingFrequency]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const { bank, fdNumber, principalAmount, interestRate, startDate, maturityDate } = formData;
    if (!bank || !fdNumber || !principalAmount || !interestRate || !startDate || !maturityDate) {
      Toast.show({ type: 'error', text1: 'Missing fields', text2: 'Please fill in all required fields' });
      return;
    }
    setIsSaving(true);
    const principal = parseFloat(principalAmount);
    const rate      = parseFloat(interestRate);
    const matAmt    = calculateMaturityAmount(principal, rate, startDate, maturityDate, formData.compoundingFrequency);
    const base = {
      bank, fdNumber, principalAmount: principal, interestRate: rate,
      startDate, maturityDate,
      compoundingFrequency: formData.compoundingFrequency,
      autoRenewal: formData.autoRenewal,
      maturityAmount: matAmt,
      interestEarned: matAmt - principal,
      status: 'Active',
    };

    const result = isEditing
      ? await onUpdate({ ...base, id: formData.id, updatedAt: new Date().toISOString() })
      : await onAdd({ ...base, id: `fd_${Date.now()}`, addedAt: new Date().toISOString() });

    if (result?.success) {
      resetForm();
      Toast.show({ type: 'success', text1: isEditing ? 'FD updated' : 'FD added', text2: `${bank} — ${formatCurrency(principal)}` });
    } else {
      Toast.show({ type: 'error', text1: isEditing ? 'Update failed' : 'Add failed', text2: result?.error || 'Please try again' });
    }
    setIsSaving(false);
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = (fd) => {
    setFormData({
      id:                   fd.id,
      bank:                 fd.bank,
      fdNumber:             fd.fdNumber,
      principalAmount:      String(fd.principalAmount),
      interestRate:         String(fd.interestRate),
      startDate:            fd.startDate,
      maturityDate:         fd.maturityDate,
      compoundingFrequency: fd.compoundingFrequency,
      autoRenewal:          fd.autoRenewal || false,
    });
    setIsEditing(true);
    setIsFormOpen(true);
    setExpandedFD(null);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!fdToDelete) return;
    setIsSaving(true);
    const result = await onDelete(fdToDelete);
    if (result?.success) {
      setExpandedFD(null);
      setDeleteOpen(false);
      setFdToDelete(null);
      Toast.show({ type: 'success', text1: 'FD deleted' });
    } else {
      Toast.show({ type: 'error', text1: 'Delete failed', text2: result?.error });
    }
    setIsSaving(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <View style={s.card}>

        {/* Stats header */}
        <TouchableOpacity
          style={s.headerArea}
          onPress={() => !isSaving && setIsExpanded(v => !v)}
          activeOpacity={0.85}
        >
          <View style={s.titleRow}>
            <View style={s.iconBox}>
              <Landmark size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Fixed Deposits</Text>
              <Text style={s.cardSub}>Secure investments</Text>
            </View>
            <View style={s.chevronBtn}>
              <ChevronDown size={18} color={GRAY} style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
            </View>
          </View>

          {/* Stats grid */}
          <View style={s.statsGrid}>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Total Principal</Text>
              <Text style={[s.statValue, { color: '#fff' }]}>{formatCurrency(stats.totalPrincipal)}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Maturity Value</Text>
              <Text style={[s.statValue, { color: GREEN }]}>{formatCurrency(stats.totalMaturityValue)}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Total FDs</Text>
              <Text style={[s.statValue, { color: PURPLE }]}>{stats.totalFDs}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Interest Earned</Text>
              <Text style={[s.statValue, { color: GREEN }]}>{formatCurrency(stats.totalInterestEarned)}</Text>
            </View>
          </View>

          {/* Next maturing banner */}
          {stats.nextMaturing && (
            <View style={s.nextMaturingBox}>
              <View>
                <Text style={s.nextMaturingLabel}>Next Maturing</Text>
                <Text style={s.nextMaturingBank}>{stats.nextMaturing.bank}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.nextMaturingDays}>{stats.nextMaturing.daysRemaining} days</Text>
                <Text style={s.nextMaturingAmt}>{formatCurrency(stats.nextMaturing.amount)}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* FD list */}
        {isExpanded && (
          <View style={s.listArea}>
            {fixedDeposits.length === 0 ? (
              <View style={s.emptyBox}>
                <Landmark size={44} color={BORDER} />
                <Text style={s.emptyTitle}>No Fixed Deposits yet</Text>
                <Text style={s.emptySub}>Add your first FD to start tracking</Text>
              </View>
            ) : (
              fixedDeposits.map(fd => {
                const isOpen       = expandedFD === fd.id;
                const daysLeft     = getDaysRemaining(fd.maturityDate);
                const interestTD   = getInterestToDate(fd.principalAmount, fd.interestRate, fd.startDate, fd.compoundingFrequency);
                const sColor       = statusColor(fd.status);

                return (
                  <View key={fd.id} style={s.fdCard}>
                    {/* Row */}
                    <TouchableOpacity
                      style={s.fdRow}
                      onPress={() => setExpandedFD(isOpen ? null : fd.id)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={s.fdBank} numberOfLines={1}>{fd.bank}</Text>
                        <Text style={s.fdSub}>{formatCurrency(fd.principalAmount)} @ {fd.interestRate}%</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                        <Text style={s.fdMaturityLabel}>Maturity</Text>
                        <Text style={s.fdMaturityAmt}>{formatCurrency(fd.maturityAmount)}</Text>
                      </View>
                      <ChevronDown size={18} color={GRAY} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
                    </TouchableOpacity>

                    {/* Expanded details */}
                    {isOpen && (
                      <View style={s.fdDetails}>
                        {[
                          { icon: Landmark,   label: 'FD Number',             value: fd.fdNumber },
                          { icon: DollarSign, label: 'Principal Amount',       value: formatCurrency(fd.principalAmount) },
                          { icon: Percent,    label: 'Interest Rate',          value: `${fd.interestRate}% p.a.` },
                          { icon: TrendingUp, label: 'Compounding',            value: fd.compoundingFrequency },
                          { icon: Calendar,   label: 'Start Date',             value: formatDate(fd.startDate) },
                          { icon: Calendar,   label: 'Maturity Date',          value: formatDate(fd.maturityDate) },
                          { icon: Clock,      label: 'Days Remaining',         value: `${daysLeft} days`, valueColor: daysLeft <= 30 ? AMBER : GREEN },
                          { icon: DollarSign, label: 'Maturity Amount',        value: formatCurrency(fd.maturityAmount), valueColor: GREEN },
                          { icon: TrendingUp, label: 'Interest Earned (Till Date)', value: formatCurrency(interestTD), valueColor: GREEN },
                        ].map(({ icon: Ic, label, value, valueColor }) => (
                          <View key={label} style={s.detailRow}>
                            <View style={s.detailLabel}>
                              <Ic size={13} color={GRAY} />
                              <Text style={s.detailLabelText}>{label}</Text>
                            </View>
                            <Text style={[s.detailValue, valueColor && { color: valueColor }]}>{value}</Text>
                          </View>
                        ))}

                        {/* Auto Renewal & Status */}
                        <View style={s.detailRow}>
                          <Text style={s.detailLabelText}>Auto Renewal</Text>
                          <Text style={s.detailValue}>{fd.autoRenewal ? 'Yes' : 'No'}</Text>
                        </View>
                        <View style={s.detailRow}>
                          <Text style={s.detailLabelText}>Status</Text>
                          <View style={[s.statusBadge, { backgroundColor: `${sColor}18` }]}>
                            <Text style={[s.statusText, { color: sColor }]}>{fd.status}</Text>
                          </View>
                        </View>

                        {/* Edit / Delete */}
                        <View style={s.actionRow}>
                          <TouchableOpacity
                            style={[s.actionBtn, { borderColor: `${PURPLE}44`, backgroundColor: `${PURPLE}18` }]}
                            onPress={() => handleEdit(fd)}
                            disabled={isSaving}
                          >
                            <Edit2 size={15} color={PURPLE} />
                            <Text style={[s.actionText, { color: PURPLE }]}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[s.actionBtn, { borderColor: `${RED}44`, backgroundColor: `${RED}18` }]}
                            onPress={() => { setFdToDelete(fd); setDeleteOpen(true); }}
                            disabled={isSaving}
                          >
                            <X size={15} color={RED} />
                            <Text style={[s.actionText, { color: RED }]}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {/* Add button */}
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => { setIsEditing(false); setFormData(EMPTY_FORM); setIsFormOpen(true); }}
              disabled={isSaving}
            >
              <Plus size={18} color="#fff" />
              <Text style={s.addBtnText}>Add Fixed Deposit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Add / Edit Sheet ─────────────────────────────────────────────────── */}
      <BottomSheet
        visible={isFormOpen}
        onClose={resetForm}
        title={isEditing ? 'Edit Fixed Deposit' : 'Add New Fixed Deposit'}
        footer={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={s.cancelBtn} onPress={resetForm} disabled={isSaving}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.submitBtn, isSaving && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isSaving}
            >
              {isSaving
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Check size={15} color="#fff" /><Text style={s.submitText}>{isEditing ? 'Update FD' : 'Add FD'}</Text></>
              }
            </TouchableOpacity>
          </View>
        }
      >
        <Label required>Bank / Institution Name</Label>
        <StyledInput value={formData.bank} onChangeText={v => set('bank', v)} placeholder="e.g. HDFC Bank, SBI, ICICI" />

        <Label required>FD Number</Label>
        <StyledInput value={formData.fdNumber} onChangeText={v => set('fdNumber', v)} placeholder="Enter FD number" />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Label required>Principal Amount (₹)</Label>
            <StyledInput value={formData.principalAmount} onChangeText={v => set('principalAmount', v)} placeholder="100000" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Label required>Interest Rate (% p.a.)</Label>
            <StyledInput value={formData.interestRate} onChangeText={v => set('interestRate', v)} placeholder="7.5" keyboardType="decimal-pad" />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <DateField label="Start Date"    value={formData.startDate}    onPress={() => setActiveDateField('start')}    required />
          <DateField label="Maturity Date" value={formData.maturityDate} onPress={() => setActiveDateField('maturity')} required />
        </View>

        <Label required>Compounding Frequency</Label>
        <TouchableOpacity style={ff.input} onPress={() => setFreqSheetOpen(true)}>
          <Text style={{ color: '#fff', fontSize: 15 }}>{formData.compoundingFrequency}</Text>
        </TouchableOpacity>

        {/* Auto Renewal toggle */}
        <View style={s.toggleRow}>
          <Text style={s.toggleLabel}>Enable Auto Renewal</Text>
          <Switch
            value={formData.autoRenewal}
            onValueChange={v => set('autoRenewal', v)}
            trackColor={{ false: BORDER, true: PURPLE }}
            thumbColor="#fff"
          />
        </View>

        {/* Maturity preview */}
        {maturityPreview && (
          <View style={s.previewBox}>
            <Text style={s.previewTitle}>Maturity Preview</Text>
            <View style={s.previewRow}>
              <Text style={s.previewLabel}>Maturity Amount</Text>
              <Text style={s.previewValue}>{formatCurrency(maturityPreview.maturity)}</Text>
            </View>
            <View style={s.previewRow}>
              <Text style={s.previewLabelSm}>Interest Earned</Text>
              <Text style={s.previewValueSm}>{formatCurrency(maturityPreview.interest)}</Text>
            </View>
          </View>
        )}
      </BottomSheet>

      {/* ── Frequency picker sheet ───────────────────────────────────────────── */}
      <BottomSheet visible={freqSheetOpen} onClose={() => setFreqSheetOpen(false)} title="Compounding Frequency">
        {FREQUENCIES.map(f => {
          const active = formData.compoundingFrequency === f;
          return (
            <TouchableOpacity
              key={f}
              style={[s.pickerRow, active && s.pickerRowActive]}
              onPress={() => { set('compoundingFrequency', f); setFreqSheetOpen(false); }}
            >
              <Text style={[s.pickerText, active && { color: '#fff', fontWeight: '700' }]}>{f}</Text>
              {active && <Check size={16} color={PURPLE} />}
            </TouchableOpacity>
          );
        })}
      </BottomSheet>

      {/* ── Native date picker ───────────────────────────────────────────────── */}
      {activeDateField && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          value={new Date(
            activeDateField === 'start'
              ? (formData.startDate    || Date.now())
              : (formData.maturityDate || Date.now())
          )}
          onChange={(_, date) => {
            if (date) set(activeDateField === 'start' ? 'startDate' : 'maturityDate', toDateStr(date));
            setActiveDateField(null);
          }}
        />
      )}

      {/* ── Delete sheet ─────────────────────────────────────────────────────── */}
      <BottomSheet
        visible={deleteOpen}
        onClose={() => !isSaving && setDeleteOpen(false)}
        title="Delete Fixed Deposit"
      >
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <View style={s.deleteIcon}>
            <AlertTriangle size={30} color={RED} />
          </View>
          <Text style={s.deleteTitle}>Are you sure?</Text>
          <Text style={s.deleteSub}>
            Delete FD from{' '}
            <Text style={{ color: '#fff', fontWeight: '700' }}>{fdToDelete?.bank}</Text>
            {'? This cannot be undone.'}
          </Text>
          <TouchableOpacity
            style={[s.deleteConfirmBtn, isSaving && { opacity: 0.6 }]}
            onPress={confirmDelete}
            disabled={isSaving}
          >
            {isSaving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Delete FD</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteCancelBtn} onPress={() => setDeleteOpen(false)} disabled={isSaving}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card:           { backgroundColor: '#000', borderWidth: 1, borderColor: BORDER, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  headerArea:     { padding: 18 },
  titleRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconBox:        { width: 46, height: 46, borderRadius: 13, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center' },
  cardTitle:      { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardSub:        { fontSize: 12, color: GRAY, marginTop: 2 },
  chevronBtn:     { width: 34, height: 34, borderRadius: 10, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox:        { flex: 1, minWidth: '45%', backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 12 },
  statLabel:      { fontSize: 11, color: GRAY, marginBottom: 4 },
  statValue:      { fontSize: 20, fontWeight: '800' },

  nextMaturingBox:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 12, marginTop: 10 },
  nextMaturingLabel:  { fontSize: 11, color: GRAY, marginBottom: 3 },
  nextMaturingBank:   { fontSize: 13, fontWeight: '700', color: '#fff' },
  nextMaturingDays:   { fontSize: 11, color: AMBER, marginBottom: 3 },
  nextMaturingAmt:    { fontSize: 13, fontWeight: '700', color: '#fff' },

  listArea:       { paddingHorizontal: 16, paddingBottom: 16 },
  emptyBox:       { alignItems: 'center', paddingVertical: 36 },
  emptyTitle:     { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 12 },
  emptySub:       { color: GRAY, fontSize: 13, marginTop: 4 },

  fdCard:         { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  fdRow:          { flexDirection: 'row', alignItems: 'center', padding: 14 },
  fdBank:         { fontSize: 14, fontWeight: '700', color: '#fff' },
  fdSub:          { fontSize: 12, color: GRAY, marginTop: 2 },
  fdMaturityLabel:{ fontSize: 11, color: GRAY },
  fdMaturityAmt:  { fontSize: 13, fontWeight: '700', color: '#fff' },

  fdDetails:      { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: BORDER, gap: 10 },
  detailRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailLabelText:{ fontSize: 13, color: GRAY },
  detailValue:    { fontSize: 13, color: '#fff', fontWeight: '600' },
  statusBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText:     { fontSize: 11, fontWeight: '700' },

  actionRow:      { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  actionText:     { fontSize: 13, fontWeight: '700' },

  addBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 14, marginTop: 4 },
  addBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },

  cancelBtn:      { flex: 1, backgroundColor: CARD, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  cancelText:     { color: '#fff', fontWeight: '600', fontSize: 15 },
  submitBtn:      { flex: 1, backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  submitText:     { color: '#fff', fontWeight: '700', fontSize: 15 },

  toggleRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingVertical: 4 },
  toggleLabel:    { fontSize: 14, fontWeight: '600', color: '#fff' },

  previewBox:     { backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 14, marginTop: 16 },
  previewTitle:   { fontSize: 11, color: GRAY, marginBottom: 10 },
  previewRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  previewLabel:   { fontSize: 13, color: '#fff' },
  previewValue:   { fontSize: 17, fontWeight: '800', color: GREEN },
  previewLabelSm: { fontSize: 11, color: GRAY },
  previewValueSm: { fontSize: 13, fontWeight: '700', color: GREEN },

  pickerRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 4, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', marginBottom: 4 },
  pickerRowActive: { backgroundColor: `${PURPLE}22`, borderColor: `${PURPLE}55` },
  pickerText:      { fontSize: 15, color: GRAY },

  deleteIcon:       { width: 64, height: 64, borderRadius: 32, backgroundColor: `${RED}18`, borderWidth: 1, borderColor: `${RED}44`, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  deleteTitle:      { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  deleteSub:        { fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: 24, paddingHorizontal: 10 },
  deleteConfirmBtn: { width: '100%', backgroundColor: RED, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  deleteCancelBtn:  { width: '100%', backgroundColor: '#374151', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
});

export default FixedDepositCard;