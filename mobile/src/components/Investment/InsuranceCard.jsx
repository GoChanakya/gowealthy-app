// import { useMemo, useState } from 'react';
// import {
//     ActivityIndicator,
//     Modal,
//     Pressable,
//     ScrollView,
//     StyleSheet,
//     Text,
//     TextInput,
//     View,
// } from 'react-native';

// const InsuranceCard = ({ data, onAdd, onUpdate, onDelete }) => {
//     const [isExpanded, setIsExpanded] = useState(false);
//     const [isFormModalOpen, setIsFormModalOpen] = useState(false);
//     const [isEditingPolicy, setIsEditingPolicy] = useState(false);
//     const [editingSource, setEditingSource] = useState(null); // 🔑 FIX
//     const [expandedPolicy, setExpandedPolicy] = useState(null);
//     const [isSaving, setIsSaving] = useState(false);
//     const [deleteModalOpen, setDeleteModalOpen] = useState(false);
//     const [policyToDelete, setPolicyToDelete] = useState(null);

//     const [formData, setFormData] = useState({
//         id: null,
//         source: 'investment',
//         type: 'Health',
//         provider: '',
//         policyNumber: '',
//         coverageAmount: '',
//         premiumAmount: '',
//         startDate: '',
//         endDate: '',
//         status: '',
//     });

//     const policies = data?.policies || [];

//     /* ---------------- Stats ---------------- */
//     const stats = useMemo(() => {
//         const safe = v => Number(v) || 0;

//         const totalPolicies = policies.length;
//         const totalCoverage = policies.reduce(
//             (sum, p) => sum + safe(p.coverageAmount),
//             0
//         );
//         const activePolicies = policies.filter(p => p.status === 'Active').length;

//         const today = new Date();
//         const sixtyDays = new Date(today.getTime() + 60 * 86400000);
//         const expiringSoon = policies.filter(p => {
//             if (!p.endDate) return false;
//             const end = new Date(p.endDate);
//             return end > today && end <= sixtyDays;
//         }).length;

//         return { totalPolicies, totalCoverage, activePolicies, expiringSoon };
//     }, [policies]);

//     /* ---------------- Helpers ---------------- */
//     const formatCurrency = amount =>
//         amount ? `₹${(Number(amount) / 100000).toFixed(0)}L` : '—';

//     const calculateStatus = endDate => {
//         if (!endDate) return '';
//         const today = new Date();
//         const end = new Date(endDate);
//         const days = Math.floor((end - today) / 86400000);
//         if (days < 0) return 'Expired';
//         if (days <= 60) return 'Expiring Soon';
//         return 'Active';
//     };

//     const handleChange = (key, value) => {
//         setFormData(prev => ({ ...prev, [key]: value }));
//     };

//     /* ---------------- Submit ---------------- */
//     const handleSubmit = async () => {
//         setIsSaving(true);

//         const payload = {
//             ...formData,
//             coverageAmount: Number(formData.coverageAmount),
//             premiumAmount: Number(formData.premiumAmount),
//             status: calculateStatus(formData.endDate),
//             updatedAt: new Date().toISOString(),
//         };

//         if (isEditingPolicy) {
//             await onUpdate(payload); // ✅ SAME ID → UPDATE ONLY
//         } else {
//             await onAdd({
//                 ...payload,
//                 id: `policy_${Date.now()}`,
//                 source: 'investment',
//                 addedAt: new Date().toISOString(),
//             });
//         }

//         resetForm();
//         setIsSaving(false);
//     };

//     const resetForm = () => {
//         setFormData({
//             id: null,
//             source: 'investment',
//             type: 'Health',
//             provider: '',
//             policyNumber: '',
//             coverageAmount: '',
//             premiumAmount: '',
//             startDate: '',
//             endDate: '',
//             status: '',
//         });
//         setEditingSource(null);
//         setIsEditingPolicy(false);
//         setIsFormModalOpen(false);
//     };

//     /* ---------------- UI ---------------- */
//     return (
//         <>
//             <View style={styles.card}>
//                 <Pressable
//                     style={styles.header}
//                     onPress={() => !isSaving && setIsExpanded(!isExpanded)}
//                 >
//                     <Text style={styles.title}>🛡️ Insurance Policies</Text>
//                     <Text style={styles.subtitle}>Protect what matters</Text>
//                 </Pressable>

//                 <View style={styles.statsRow}>
//                     <Stat label="Policies" value={stats.totalPolicies} />
//                     <Stat label="Coverage" value={formatCurrency(stats.totalCoverage)} />
//                     <Stat label="Active" value={stats.activePolicies} />
//                     <Stat label="Expiring" value={stats.expiringSoon} />
//                 </View>

//                 {isExpanded && (
//                     <View style={styles.body}>
//                         {policies.length === 0 ? (
//                             <Text style={styles.emptyText}>No policies added</Text>
//                         ) : (
//                             policies.map(policy => (
//                                 <Pressable
//                                     key={policy.id}
//                                     style={styles.policy}
//                                     onPress={() =>
//                                         setExpandedPolicy(
//                                             expandedPolicy === policy.id ? null : policy.id
//                                         )
//                                     }
//                                 >
//                                     <Text style={styles.policyTitle}>
//                                         {policy.provider || 'Unnamed Policy'}
//                                     </Text>
//                                     <Text style={styles.policySub}>
//                                         {formatCurrency(policy.coverageAmount)}
//                                     </Text>

//                                     {expandedPolicy === policy.id && (
//                                         <>
//                                             <Text>Type: {policy.type}</Text>
//                                             <Text>Status: {policy.status}</Text>
//                                             <Text>Policy #: {policy.policyNumber}</Text>
//                                             <Text>Premium: ₹{policy.premiumAmount}/year</Text>
//                                         </>
//                                     )}

//                                     <View style={styles.actionsRow}>
//                                         <Pressable
//                                             style={styles.editBtn}
//                                             onPress={e => {
//                                                 e.stopPropagation();
//                                                 setFormData(policy);
//                                                 setEditingSource(policy.source); // 🔑 FIX
//                                                 setIsEditingPolicy(true);
//                                                 setIsFormModalOpen(true);
//                                             }}
//                                         >
//                                             <Text style={styles.actionText}>Edit</Text>
//                                         </Pressable>

//                                         <Pressable
//                                             style={styles.deleteBtn}
//                                             onPress={e => {
//                                                 e.stopPropagation();
//                                                 setPolicyToDelete(policy);
//                                                 setDeleteModalOpen(true);
//                                             }}
//                                         >
//                                             <Text style={styles.actionText}>Delete</Text>
//                                         </Pressable>
//                                     </View>
//                                 </Pressable>
//                             ))
//                         )}

//                         <Pressable
//                             style={styles.addBtn}
//                             onPress={() => setIsFormModalOpen(true)}
//                         >
//                             <Text style={styles.addText}>➕ Add Policy</Text>
//                         </Pressable>
//                     </View>
//                 )}
//             </View>

//             {/* Add / Edit Modal */}
//             <Modal visible={isFormModalOpen} transparent animationType="slide">
//                 <View style={styles.modal}>
//                     <ScrollView contentContainerStyle={styles.modalContent}>
//                         <Text style={styles.modalTitle}>
//                             {isEditingPolicy ? 'Edit Policy' : 'Add Policy'}
//                         </Text>

//                         {/* ✅ TYPE — ONLY FOR INVESTMENT */}
//                         {!isEditingPolicy && (
//                             <View style={{ marginBottom: 12 }}>
//                                 <Text style={styles.inputLabel}>Policy Type</Text>
//                                 <View style={styles.typeRow}>
//                                     {['Health', 'Life', 'Motor', 'Home', 'Travel', 'Other'].map(t => (
//                                         <Pressable
//                                             key={t}
//                                             style={[
//                                                 styles.typeChip,
//                                                 formData.type === t && styles.typeChipActive,
//                                             ]}
//                                             onPress={() => handleChange('type', t)}
//                                         >
//                                             <Text
//                                                 style={[
//                                                     styles.typeChipText,
//                                                     formData.type === t && styles.typeChipTextActive,
//                                                 ]}
//                                             >
//                                                 {t}
//                                             </Text>
//                                         </Pressable>
//                                     ))}
//                                 </View>
//                             </View>
//                         )}

//                         <Input label="Provider" value={formData.provider} onChange={v => handleChange('provider', v)} />
//                         <Input label="Policy Number" value={formData.policyNumber} onChange={v => handleChange('policyNumber', v)} />
//                         <Input label="Coverage Amount" keyboardType="numeric" value={String(formData.coverageAmount)} onChange={v => handleChange('coverageAmount', v)} />
//                         <Input label="Premium Amount (₹)" keyboardType="numeric" value={String(formData.premiumAmount)} onChange={v => handleChange('premiumAmount', v)} />
//                         <Input label="Start Date (YYYY-MM-DD)" value={formData.startDate} onChange={v => handleChange('startDate', v)} />
//                         <Input label="End Date (YYYY-MM-DD)" value={formData.endDate} onChange={v => handleChange('endDate', v)} />

//                         <Pressable style={styles.saveBtn} onPress={handleSubmit}>
//                             {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
//                         </Pressable>

//                         <Pressable onPress={resetForm}>
//                             <Text style={styles.cancelText}>Cancel</Text>
//                         </Pressable>
//                     </ScrollView>
//                 </View>
//             </Modal>

//             {/* Delete Modal */}
//             <Modal visible={deleteModalOpen} transparent animationType="fade">
//                 <View style={styles.modal}>
//                     <View style={styles.confirmBox}>
//                         <Text style={styles.modalTitle}>Delete Policy?</Text>
//                         <Pressable
//                             style={styles.deleteConfirm}
//                             onPress={async () => {
//                                 await onDelete(policyToDelete);
//                                 setDeleteModalOpen(false);
//                             }}
//                         >
//                             <Text style={{ color: '#fff' }}>Delete</Text>
//                         </Pressable>
//                         <Pressable onPress={() => setDeleteModalOpen(false)}>
//                             <Text style={styles.cancelText}>Cancel</Text>
//                         </Pressable>
//                     </View>
//                 </View>
//             </Modal>
//         </>
//     );
// };

// /* ---------------- Helpers ---------------- */
// const Stat = ({ label, value }) => (
//     <View style={styles.stat}>
//         <Text style={styles.statLabel}>{label}</Text>
//         <Text style={styles.statValue}>{value}</Text>
//     </View>
// );

// const Input = ({ label, value, onChange, ...props }) => (
//     <View style={{ marginBottom: 12 }}>
//         <Text style={styles.inputLabel}>{label}</Text>
//         <TextInput value={value} onChangeText={onChange} style={styles.input} {...props} />
//     </View>
// );

// /* ---------------- Styles ---------------- */
// const styles = StyleSheet.create({
//     card: { backgroundColor: '#111827', borderRadius: 16, padding: 16, marginBottom: 16 },
//     header: { marginBottom: 12 },
//     title: { color: '#fff', fontSize: 18, fontWeight: '700' },
//     subtitle: { color: '#9ca3af' },
//     statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
//     stat: { flex: 1, backgroundColor: '#1f2937', padding: 8, borderRadius: 8 },
//     statLabel: { color: '#9ca3af', fontSize: 12 },
//     statValue: { color: '#fff', fontSize: 16, fontWeight: '700' },
//     body: { marginTop: 12 },
//     emptyText: { color: '#9ca3af', textAlign: 'center', marginVertical: 20 },
//     policy: { backgroundColor: '#1f2937', borderRadius: 12, padding: 12, marginBottom: 8 },
//     policyTitle: { color: '#fff', fontWeight: '700' },
//     policySub: { color: '#9ca3af', marginBottom: 6 },
//     actionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
//     editBtn: { flex: 1, backgroundColor: '#4f46e5', padding: 8, borderRadius: 8 },
//     deleteBtn: { flex: 1, backgroundColor: '#ef4444', padding: 8, borderRadius: 8 },
//     actionText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
//     addBtn: { marginTop: 12, backgroundColor: '#6c50c4', padding: 12, borderRadius: 12 },
//     addText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
//     modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' },
//     modalContent: { backgroundColor: '#111827', margin: 16, borderRadius: 16, padding: 16 },
//     modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
//     inputLabel: { color: '#9ca3af', marginBottom: 4 },
//     input: { backgroundColor: '#1f2937', color: '#fff', padding: 12, borderRadius: 8 },
//     saveBtn: { backgroundColor: '#6c50c4', padding: 14, borderRadius: 12, marginTop: 12 },
//     saveText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
//     cancelText: { color: '#9ca3af', textAlign: 'center', marginTop: 12 },
//     confirmBox: { backgroundColor: '#111827', margin: 32, padding: 24, borderRadius: 16 },
//     deleteConfirm: { backgroundColor: '#ef4444', padding: 12, borderRadius: 12, marginTop: 12, alignItems: 'center' },
//     typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
//     typeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' },
//     typeChipActive: { backgroundColor: '#6c50c4', borderColor: '#6c50c4' },
//     typeChipText: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
//     typeChipTextActive: { color: '#fff' },
// });

// export default InsuranceCard;


import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, TextInput, ActivityIndicator, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import {
  Shield, Heart, Car, Home, Plus, ChevronDown,
  X, Calendar, DollarSign, FileText,
  AlertTriangle, Edit2, Check,
} from 'lucide-react-native';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const PURPLE = 'rgb(108,80,196)';
const GREEN  = '#10b981';
const AMBER  = '#f59e0b';
const RED    = '#ef4444';
const BLUE   = '#3b82f6';
const GRAY   = '#9ca3af';
const CARD   = '#1f2937';
const CARD2  = '#111827';
const BORDER = '#374151';

// ─── Policy meta ──────────────────────────────────────────────────────────────
const POLICY_ICONS  = { Health: Heart, Life: Shield, Auto: Car, Home };
const POLICY_COLORS = { Health: RED, Life: '#8b5cf6', Auto: BLUE, Home: GREEN };
const POLICY_TYPES  = ['Health', 'Life', 'Auto', 'Home'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount) => {
  const l = amount / 100000;
  return `₹${Number.isInteger(l) ? l : l.toFixed(1)} Lakhs`;
};

const formatCurrencyCompact = (amount) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000)   return `₹${Math.floor(amount / 100000)}L`;
  if (amount >= 1000)     return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const toDateStr = (date) => {
  const d  = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const calculateStatus = (endDate) => {
  const days = Math.floor((new Date(endDate) - new Date()) / 86400000);
  if (days < 0)   return 'Expired';
  if (days <= 60) return 'Expiring Soon';
  return 'Active';
};

const statusColor = (s) =>
  ({ Active: GREEN, 'Expiring Soon': AMBER, Expired: RED }[s] || GRAY);

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
          <View style={{ height: 12 }} />
        </ScrollView>
        {footer && (
          <View style={bs.footer}>
            {footer}
          </View>
        )}
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
const Label = ({ children }) => <Text style={f.label}>{children}</Text>;

const StyledInput = ({ ...props }) => (
  <TextInput
    style={f.input}
    placeholderTextColor={GRAY}
    selectionColor={PURPLE}
    {...props}
  />
);

const DateField = ({ label, value, onPress }) => (
  <View style={{ flex: 1 }}>
    <Label>{label}</Label>
    <TouchableOpacity style={f.dateBtn} onPress={onPress}>
      <Calendar size={15} color={GRAY} />
      <Text style={[f.dateText, !value && { color: GRAY }]}>
        {value ? formatDate(value) : 'Select date'}
      </Text>
    </TouchableOpacity>
  </View>
);

const f = StyleSheet.create({
  label:    { fontSize: 13, fontWeight: '600', color: '#fff', marginBottom: 8, marginTop: 16 },
  input:    { backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#fff' },
  dateBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  dateText: { fontSize: 15, color: '#fff' },
});

// ─── EMPTY FORM ───────────────────────────────────────────────────────────────
const EMPTY = { id: '', type: 'Health', provider: '', policyNumber: '', coverageAmount: '', premiumAmount: '', startDate: '2026-03-14', endDate: '2027-03-14' };

// ─── Main Component ───────────────────────────────────────────────────────────
const InsuranceCard = ({ data, onAdd, onUpdate, onDelete }) => {
  const [isExpanded,      setIsExpanded]      = useState(false);
  const [isFormOpen,      setIsFormOpen]      = useState(false);
  const [isEditing,       setIsEditing]       = useState(false);
  const [expandedPolicy,  setExpandedPolicy]  = useState(null);
  const [isSaving,        setIsSaving]        = useState(false);
  const [deleteOpen,      setDeleteOpen]      = useState(false);
  const [policyToDelete,  setPolicyToDelete]  = useState(null);
  const [typeSheetOpen,   setTypeSheetOpen]   = useState(false);
  const [activeDateField, setActiveDateField] = useState(null); // 'start' | 'end'
  const [formData,        setFormData]        = useState(EMPTY);

  const policies = data?.policies || [];

  const stats = useMemo(() => {
    const today      = new Date();
    const sixtyDays  = new Date(Date.now() + 60 * 86400000);
    return {
      totalPolicies:  policies.length,
      totalCoverage:  policies.reduce((s, p) => s + (p.coverageAmount || 0), 0),
      activePolicies: policies.filter(p => p.status === 'Active').length,
      expiringSoon:   policies.filter(p => {
        const e = new Date(p.endDate);
        return e > today && e <= sixtyDays;
      }).length,
    };
  }, [policies]);

  const set = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  const resetForm = () => { setFormData(EMPTY); setIsFormOpen(false); setIsEditing(false); };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const { type, provider, policyNumber, coverageAmount, premiumAmount, startDate, endDate } = formData;
    if (!provider || !policyNumber || !coverageAmount || !premiumAmount || !startDate || !endDate) {
      Toast.show({ type: 'error', text1: 'Missing fields', text2: 'Please fill in all fields' });
      return;
    }
    setIsSaving(true);
    const base = {
      type, provider, policyNumber,
      coverageAmount: parseFloat(coverageAmount),
      premiumAmount:  parseFloat(premiumAmount),
      startDate, endDate,
      status: calculateStatus(endDate),
    };
    const result = isEditing
      ? await onUpdate({ ...base, id: formData.id, updatedAt: new Date().toISOString() })
      : await onAdd({ ...base, id: `ins_${Date.now()}`, addedAt: new Date().toISOString() });

    if (result?.success) {
      resetForm();
      Toast.show({ type: 'success', text1: isEditing ? 'Policy updated' : 'Policy added', text2: `${provider} — ${formatCurrency(base.coverageAmount)}` });
    } else {
      Toast.show({ type: 'error', text1: isEditing ? 'Update failed' : 'Add failed', text2: result?.error || 'Please try again' });
    }
    setIsSaving(false);
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const handleEdit = (policy) => {
    setFormData({
      id: policy.id, type: policy.type, provider: policy.provider,
      policyNumber: policy.policyNumber,
      coverageAmount: String(policy.coverageAmount),
      premiumAmount:  String(policy.premiumAmount),
      startDate: policy.startDate,
      endDate:   policy.endDate,
    });
    setIsEditing(true);
    setIsFormOpen(true);
    setExpandedPolicy(null);
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!policyToDelete) return;
    setIsSaving(true);
    const result = await onDelete(policyToDelete);
    if (result?.success) {
      setExpandedPolicy(null);
      setDeleteOpen(false);
      setPolicyToDelete(null);
      Toast.show({ type: 'success', text1: 'Policy deleted' });
    } else {
      Toast.show({ type: 'error', text1: 'Delete failed', text2: result?.error || 'Please try again' });
    }
    setIsSaving(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <View style={s.card}>

        {/* Stats header */}
        <TouchableOpacity
          style={s.headerArea}
          onPress={() => !isSaving && setIsExpanded(v => !v)}
          activeOpacity={0.85}
        >
          {/* Title row */}
          <View style={s.titleRow}>
            <View style={s.iconBox}>
              <Shield size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Insurance Policies</Text>
              <Text style={s.cardSub}>Protect what matters</Text>
            </View>
            <View style={s.chevronBtn}>
              <ChevronDown size={18} color={GRAY} style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
            </View>
          </View>

          {/* Stats grid */}
          <View style={s.statsGrid}>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Total Policies</Text>
              <Text style={[s.statValue, { color: '#fff' }]}>{stats.totalPolicies}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Total Coverage</Text>
              <Text style={[s.statValue, { color: GREEN }]}>{formatCurrencyCompact(stats.totalCoverage)}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Active</Text>
              <Text style={[s.statValue, { color: PURPLE }]}>{stats.activePolicies}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Expiring Soon</Text>
              <Text style={[s.statValue, { color: AMBER }]}>{stats.expiringSoon}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Policy list */}
        {isExpanded && (
          <View style={s.listArea}>
            {policies.length === 0 ? (
              <View style={s.emptyBox}>
                <Shield size={44} color={BORDER} />
                <Text style={s.emptyTitle}>No policies linked yet</Text>
                <Text style={s.emptySub}>Add your first insurance policy</Text>
              </View>
            ) : (
              policies.map((policy) => {
                const Icon        = POLICY_ICONS[policy.type] || Shield;
                const color       = POLICY_COLORS[policy.type] || GRAY;
                const isOpen      = expandedPolicy === policy.id;
                const sColor      = statusColor(policy.status);

                return (
                  <View key={policy.id} style={s.policyCard}>
                    {/* Row */}
                    <TouchableOpacity
                      style={s.policyRow}
                      onPress={() => setExpandedPolicy(isOpen ? null : policy.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[s.policyIcon, { backgroundColor: `${color}22` }]}>
                        <Icon size={18} color={color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.policyProvider} numberOfLines={1}>{policy.provider}</Text>
                        <Text style={s.policyCoverage}>{formatCurrency(policy.coverageAmount)} Coverage</Text>
                      </View>
                      <View style={[s.statusBadge, { backgroundColor: `${sColor}18` }]}>
                        <Text style={[s.statusText, { color: sColor }]}>{policy.status}</Text>
                      </View>
                      <ChevronDown size={18} color={GRAY} style={{ marginLeft: 6, transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
                    </TouchableOpacity>

                    {/* Expanded details */}
                    {isOpen && (
                      <View style={s.policyDetails}>
                        {[
                          { icon: Shield,    label: 'Policy Type',   value: `${policy.type} Insurance` },
                          { icon: FileText,  label: 'Policy Number', value: policy.policyNumber },
                          { icon: DollarSign,label: 'Coverage',      value: formatCurrency(policy.coverageAmount) },
                          { icon: DollarSign,label: 'Premium',       value: `₹${policy.premiumAmount?.toLocaleString('en-IN')}/year` },
                          { icon: Calendar,  label: 'Valid Until',   value: formatDate(policy.endDate) },
                        ].map(({ icon: Ic, label, value }) => (
                          <View key={label} style={s.detailRow}>
                            <View style={s.detailLabel}>
                              <Ic size={13} color={GRAY} />
                              <Text style={s.detailLabelText}>{label}</Text>
                            </View>
                            <Text style={s.detailValue}>{value}</Text>
                          </View>
                        ))}

                        {/* Edit / Delete */}
                        <View style={s.actionRow}>
                          <TouchableOpacity
                            style={[s.actionBtn, { borderColor: `${PURPLE}44`, backgroundColor: `${PURPLE}18` }]}
                            onPress={() => handleEdit(policy)}
                            disabled={isSaving}
                          >
                            <Edit2 size={15} color={'#fff'} />
                            <Text style={[s.actionText, { color: '#fff' }]}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[s.actionBtn, { borderColor: `${RED}44`, backgroundColor: `${RED}18` }]}
                            onPress={() => { setPolicyToDelete(policy); setDeleteOpen(true); }}
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
              onPress={() => { setIsEditing(false); setFormData(EMPTY); setIsFormOpen(true); }}
              disabled={isSaving}
            >
              <Plus size={18} color="#fff" />
              <Text style={s.addBtnText}>Add New Policy</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Add / Edit Sheet ─────────────────────────────────────────────────── */}
      <BottomSheet
        visible={isFormOpen}
        onClose={resetForm}
        title={isEditing ? 'Edit Policy' : 'Add New Policy'}
        footer={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={s.cancelBtn} onPress={resetForm} disabled={isSaving}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.submitBtn, isSaving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={isSaving}>
              {isSaving
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Check size={15} color="#fff" /><Text style={s.submitText}>{isEditing ? 'Update Policy' : 'Add Policy'}</Text></>
              }
            </TouchableOpacity>
          </View>
        }
      >
        {/* Policy Type selector */}
        <Label>Policy Type</Label>
        <TouchableOpacity style={f.input} onPress={() => setTypeSheetOpen(true)}>
          <Text style={{ color: '#fff', fontSize: 15 }}>{formData.type} Insurance</Text>
        </TouchableOpacity>

        <Label>Insurance Provider</Label>
        <StyledInput
          value={formData.provider}
          onChangeText={v => set('provider', v)}
          placeholder="e.g. HDFC ERGO, ICICI Lombard"
        />

        <Label>Policy Number</Label>
        <StyledInput
          value={formData.policyNumber}
          onChangeText={v => set('policyNumber', v)}
          placeholder="Enter policy number"
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Label>Coverage Amount (₹)</Label>
            <StyledInput
              value={formData.coverageAmount}
              onChangeText={v => set('coverageAmount', v)}
              placeholder="500000"
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Label>Annual Premium (₹)</Label>
            <StyledInput
              value={formData.premiumAmount}
              onChangeText={v => set('premiumAmount', v)}
              placeholder="10000"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
          <DateField
            label="Start Date"
            value={formData.startDate}
            onPress={() => setActiveDateField('start')}
          />
          <DateField
            label="End Date"
            value={formData.endDate}
            onPress={() => setActiveDateField('end')}
          />
        </View>
      </BottomSheet>

      {/* ── Policy Type picker sheet ─────────────────────────────────────────── */}
      <BottomSheet visible={typeSheetOpen} onClose={() => setTypeSheetOpen(false)} title="Select Policy Type">
        {POLICY_TYPES.map(t => {
          const Ic     = POLICY_ICONS[t];
          const color  = POLICY_COLORS[t];
          const active = formData.type === t;
          return (
            <TouchableOpacity
              key={t}
              style={[s.typeRow, active && { backgroundColor: `${PURPLE}22`, borderColor: `${PURPLE}55` }]}
              onPress={() => { set('type', t); setTypeSheetOpen(false); }}
            >
              <View style={[s.typeIcon, { backgroundColor: `${color}22` }]}>
                <Ic size={18} color={color} />
              </View>
              <Text style={[s.typeLabel, active && { color: '#fff', fontWeight: '700' }]}>{t} Insurance</Text>
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
          value={new Date(formData[activeDateField === 'start' ? 'startDate' : 'endDate'] || Date.now())}
          onChange={(_, date) => {
            if (date) set(activeDateField === 'start' ? 'startDate' : 'endDate', toDateStr(date));
            setActiveDateField(null);
          }}
        />
      )}

      {/* ── Delete confirmation sheet ────────────────────────────────────────── */}
      <BottomSheet
        visible={deleteOpen}
        onClose={() => !isSaving && setDeleteOpen(false)}
        title="Delete Policy"
      >
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <View style={s.deleteIcon}>
            <AlertTriangle size={30} color={RED} />
          </View>
          <Text style={s.deleteTitle}>Are you sure?</Text>
          <Text style={s.deleteSub}>
            Delete{' '}
            <Text style={{ color: '#fff', fontWeight: '700' }}>{policyToDelete?.provider}</Text>
            {'? This cannot be undone.'}
          </Text>
          <TouchableOpacity
            style={[s.deleteConfirmBtn, isSaving && { opacity: 0.6 }]}
            onPress={confirmDelete}
            disabled={isSaving}
          >
            {isSaving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Delete Policy</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={s.deleteCancelBtn}
            onPress={() => setDeleteOpen(false)}
            disabled={isSaving}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Card
  card:           { backgroundColor: '#000', borderWidth: 1, borderColor: BORDER, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  headerArea:     { padding: 18 },
  titleRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconBox:        { width: 46, height: 46, borderRadius: 13, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center' },
  cardTitle:      { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardSub:        { fontSize: 12, color: GRAY, marginTop: 2 },
  chevronBtn:     { width: 34, height: 34, borderRadius: 10, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },

  // Stats
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox:        { flex: 1, minWidth: '45%', backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 12 },
  statLabel:      { fontSize: 11, color: GRAY, marginBottom: 4 },
  statValue:      { fontSize: 20, fontWeight: '800' },

  // List
  listArea:       { paddingHorizontal: 16, paddingBottom: 16 },
  emptyBox:       { alignItems: 'center', paddingVertical: 36 },
  emptyTitle:     { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 12 },
  emptySub:       { color: GRAY, fontSize: 13, marginTop: 4 },

  // Policy card
  policyCard:     { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  policyRow:      { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  policyIcon:     { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  policyProvider: { fontSize: 14, fontWeight: '700', color: '#fff' },
  policyCoverage: { fontSize: 12, color: GRAY, marginTop: 2 },
  statusBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText:     { fontSize: 11, fontWeight: '700' },

  // Details
  policyDetails:  { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: BORDER, gap: 10 },
  detailRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailLabelText:{ fontSize: 13, color: GRAY },
  detailValue:    { fontSize: 13, color: '#fff', fontWeight: '600' },

  // Action buttons
  actionRow:      { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  actionText:     { fontSize: 13, fontWeight: '700' },

  // Add button
  addBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 14, marginTop: 4 },
  addBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Form sheet footer
  cancelBtn:      { flex: 1, backgroundColor: CARD, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  cancelText:     { color: '#fff', fontWeight: '600', fontSize: 15 },
  submitBtn:      { flex: 1, backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  submitText:     { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Type picker
  typeRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 4, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', marginBottom: 6 },
  typeIcon:       { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeLabel:      { flex: 1, fontSize: 15, color: GRAY },

  // Delete sheet
  deleteIcon:       { width: 64, height: 64, borderRadius: 32, backgroundColor: `${RED}18`, borderWidth: 1, borderColor: `${RED}44`, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  deleteTitle:      { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  deleteSub:        { fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: 24, paddingHorizontal: 10 },
  deleteConfirmBtn: { width: '100%', backgroundColor: RED, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  deleteCancelBtn:  { width: '100%', backgroundColor: '#374151', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
});

export default InsuranceCard;