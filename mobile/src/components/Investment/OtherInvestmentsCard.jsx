import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, TextInput, ActivityIndicator, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import {
  Coins, Plus, ChevronDown, X, Calendar,
  DollarSign, FileText, Check, Filter,
  AlertTriangle, Edit2,
} from 'lucide-react-native';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const PURPLE = 'rgb(108,80,196)';
const GREEN  = '#10b981';
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

// ─── Static data ──────────────────────────────────────────────────────────────
const INVESTMENT_TYPES = [
  'Gold', 'Silver', 'Real Estate', 'Bonds', 'PPF',
  'EPF', 'NPS', 'Crypto', 'P2P Lending', 'Commodities',
  'Art & Collectibles', 'Other',
];

const INVESTMENT_ICONS = {
  'Gold': '🪙', 'Silver': '⚪', 'Real Estate': '🏢', 'Bonds': '📜',
  'PPF': '🏛️', 'EPF': '🏛️', 'NPS': '📊', 'Crypto': '₿',
  'P2P Lending': '🤝', 'Commodities': '📦', 'Art & Collectibles': '🎨', 'Other': '💼',
};

const EMPTY_FORM = {
  id: '', type: 'Gold', name: '', investedAmount: '',
  quantity: '', unit: '', purchaseDate: '', notes: '',
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

const ff = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: '#fff', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#fff' },
});

// ─── Filter pill ──────────────────────────────────────────────────────────────
const FilterPill = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[fp.pill, active && fp.active]}
  >
    <Text style={[fp.text, active && fp.activeText]}>{label}</Text>
  </TouchableOpacity>
);

const fp = StyleSheet.create({
  pill:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, marginRight: 8 },
  active:     { backgroundColor: PURPLE, borderColor: PURPLE },
  text:       { fontSize: 12, fontWeight: '600', color: GRAY },
  activeText: { color: '#fff' },
});

// ─── Main Component ───────────────────────────────────────────────────────────
const OtherInvestmentsCard = ({ data, onAdd, onUpdate, onDelete }) => {
  const [isExpanded,          setIsExpanded]          = useState(false);
  const [isFormOpen,          setIsFormOpen]          = useState(false);
  const [isEditing,           setIsEditing]           = useState(false);
  const [expandedInvestment,  setExpandedInvestment]  = useState(null);
  const [selectedCategory,    setSelectedCategory]    = useState('All');
  const [isSaving,            setIsSaving]            = useState(false);
  const [deleteOpen,          setDeleteOpen]          = useState(false);
  const [investmentToDelete,  setInvestmentToDelete]  = useState(null);
  const [formData,            setFormData]            = useState(EMPTY_FORM);
  const [showDatePicker,      setShowDatePicker]      = useState(false);
  const [typeSheetOpen,       setTypeSheetOpen]       = useState(false);

  const investments = data?.assets || [];

  const stats = useMemo(() => ({
    totalInvested: investments.reduce((s, i) => s + (i.investedAmount || 0), 0),
    totalHoldings: investments.length,
    assetTypes:    new Set(investments.map(i => i.type)).size,
  }), [investments]);

  const groupedInvestments = useMemo(() =>
    investments.reduce((acc, inv) => {
      acc[inv.type] = [...(acc[inv.type] || []), inv];
      return acc;
    }, {}),
  [investments]);

  const categories = useMemo(() =>
    ['All', ...new Set(investments.map(i => i.type))],
  [investments]);

  const filteredInvestments = useMemo(() =>
    selectedCategory === 'All'
      ? investments
      : investments.filter(i => i.type === selectedCategory),
  [investments, selectedCategory]);

  const set = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  const resetForm = () => { setFormData(EMPTY_FORM); setIsFormOpen(false); setIsEditing(false); };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const { type, name, investedAmount, purchaseDate } = formData;
    if (!type || !name || !investedAmount || !purchaseDate) {
      Toast.show({ type: 'error', text1: 'Missing fields', text2: 'Type, Name, Amount and Date are required' });
      return;
    }
    setIsSaving(true);
    const amount = parseFloat(investedAmount);
    const base   = { ...formData, investedAmount: amount };

    const result = isEditing
      ? await onUpdate({ ...base, updatedAt: new Date().toISOString() })
      : await onAdd({ ...base, id: `inv_${Date.now()}`, addedAt: new Date().toISOString() });

    if (result?.success) {
      resetForm();
      Toast.show({ type: 'success', text1: isEditing ? 'Investment updated' : 'Investment added', text2: name });
    } else {
      Toast.show({ type: 'error', text1: isEditing ? 'Update failed' : 'Add failed', text2: result?.error || 'Please try again' });
    }
    setIsSaving(false);
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = (inv) => {
    setFormData({
      id:             inv.id,
      type:           inv.type,
      name:           inv.name,
      investedAmount: String(inv.investedAmount),
      quantity:       inv.quantity || '',
      unit:           inv.unit     || '',
      purchaseDate:   inv.purchaseDate,
      notes:          inv.notes    || '',
    });
    setIsEditing(true);
    setIsFormOpen(true);
    setExpandedInvestment(null);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!investmentToDelete) return;
    setIsSaving(true);
    const result = await onDelete(investmentToDelete);
    if (result?.success) {
      setExpandedInvestment(null);
      setDeleteOpen(false);
      setInvestmentToDelete(null);
      Toast.show({ type: 'success', text1: 'Investment deleted' });
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
              <Coins size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Other Investments</Text>
              <Text style={s.cardSub}>Alternative assets</Text>
            </View>
            <View style={s.chevronBtn}>
              <ChevronDown size={18} color={GRAY} style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
            </View>
          </View>

          <View style={s.statsGrid}>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Total Invested</Text>
              <Text style={[s.statValue, { color: '#fff' }]}>{formatCurrency(stats.totalInvested)}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Total Holdings</Text>
              <Text style={[s.statValue, { color: PURPLE }]}>{stats.totalHoldings}</Text>
            </View>
            <View style={[s.statBox, { minWidth: '100%' }]}>
              <Text style={s.statLabel}>Asset Types</Text>
              <Text style={[s.statValue, { color: GREEN }]}>
                {stats.assetTypes} {stats.assetTypes === 1 ? 'Type' : 'Types'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded section */}
        {isExpanded && (
          <View style={s.listArea}>

            {/* Category filters */}
            {investments.length > 0 && (
              <View style={s.filterSection}>
                <View style={s.filterHeader}>
                  <Filter size={14} color={GRAY} />
                  <Text style={s.filterLabel}>Filter by type:</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categories.map(cat => (
                    <FilterPill
                      key={cat}
                      label={cat === 'All'
                        ? `All (${investments.length})`
                        : `${cat} (${groupedInvestments[cat]?.length || 0})`}
                      active={selectedCategory === cat}
                      onPress={() => setSelectedCategory(cat)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Investment list */}
            {filteredInvestments.length === 0 ? (
              <View style={s.emptyBox}>
                <Coins size={44} color={BORDER} />
                <Text style={s.emptyTitle}>No investments found</Text>
                <Text style={s.emptySub}>
                  {selectedCategory === 'All'
                    ? 'Add your first investment to get started'
                    : `No ${selectedCategory} investments yet`}
                </Text>
              </View>
            ) : (
              filteredInvestments.map(inv => {
                const isOpen = expandedInvestment === inv.id;
                const icon   = INVESTMENT_ICONS[inv.type] || '💼';

                return (
                  <View key={inv.id} style={s.invCard}>
                    {/* Row */}
                    <TouchableOpacity
                      style={s.invRow}
                      onPress={() => setExpandedInvestment(isOpen ? null : inv.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.invIcon}>{icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.invName} numberOfLines={1}>{inv.name}</Text>
                        <Text style={s.invType}>{inv.type}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                        <Text style={s.invAmtLabel}>Invested</Text>
                        <Text style={s.invAmt}>{formatCurrency(inv.investedAmount)}</Text>
                      </View>
                      <ChevronDown size={18} color={GRAY} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
                    </TouchableOpacity>

                    {/* Expanded details */}
                    {isOpen && (
                      <View style={s.invDetails}>
                        {[
                          { icon: FileText,   label: 'Type',            value: inv.type },
                          { icon: DollarSign, label: 'Invested Amount', value: formatCurrency(inv.investedAmount) },
                          inv.quantity && inv.unit && { icon: null, label: 'Quantity', value: `${inv.quantity} ${inv.unit}` },
                          { icon: Calendar,   label: 'Purchase Date',   value: formatDate(inv.purchaseDate) },
                        ].filter(Boolean).map(({ icon: Ic, label, value }) => (
                          <View key={label} style={s.detailRow}>
                            <View style={s.detailLabel}>
                              {Ic && <Ic size={13} color={GRAY} />}
                              <Text style={s.detailLabelText}>{label}</Text>
                            </View>
                            <Text style={s.detailValue}>{value}</Text>
                          </View>
                        ))}

                        {/* Notes */}
                        {!!inv.notes && (
                          <View style={s.notesBox}>
                            <Text style={s.notesTitle}>Notes</Text>
                            <Text style={s.notesText}>{inv.notes}</Text>
                          </View>
                        )}

                        {/* Edit / Delete */}
                        <View style={s.actionRow}>
                          <TouchableOpacity
                            style={[s.actionBtn, { borderColor: `${PURPLE}44`, backgroundColor: `${PURPLE}18` }]}
                            onPress={() => handleEdit(inv)}
                            disabled={isSaving}
                          >
                            <Edit2 size={15} color={PURPLE} />
                            <Text style={[s.actionText, { color: PURPLE }]}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[s.actionBtn, { borderColor: `${RED}44`, backgroundColor: `${RED}18` }]}
                            onPress={() => { setInvestmentToDelete(inv); setDeleteOpen(true); }}
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
              <Text style={s.addBtnText}>Add Investment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Add / Edit Sheet ─────────────────────────────────────────────────── */}
      <BottomSheet
        visible={isFormOpen}
        onClose={resetForm}
        title={isEditing ? 'Edit Investment' : 'Add New Investment'}
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
                : <><Check size={15} color="#fff" /><Text style={s.submitText}>{isEditing ? 'Update Investment' : 'Add Investment'}</Text></>
              }
            </TouchableOpacity>
          </View>
        }
      >
        {/* Type selector */}
        <Label required>Investment Type</Label>
        <TouchableOpacity style={ff.input} onPress={() => setTypeSheetOpen(true)}>
          <Text style={{ color: '#fff', fontSize: 15 }}>
            {INVESTMENT_ICONS[formData.type]} {formData.type}
          </Text>
        </TouchableOpacity>

        <Label required>Investment Name</Label>
        <StyledInput
          value={formData.name}
          onChangeText={v => set('name', v)}
          placeholder="e.g. Physical Gold - 24K, Bitcoin, Pune Property"
        />

        <Label required>Invested Amount (₹)</Label>
        <StyledInput
          value={formData.investedAmount}
          onChangeText={v => set('investedAmount', v)}
          placeholder="100000"
          keyboardType="numeric"
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Label>Quantity</Label>
            <StyledInput value={formData.quantity} onChangeText={v => set('quantity', v)} placeholder="e.g. 100, 0.5" />
          </View>
          <View style={{ flex: 1 }}>
            <Label>Unit</Label>
            <StyledInput value={formData.unit} onChangeText={v => set('unit', v)} placeholder="grams, coins, sq ft" />
          </View>
        </View>

        <Label required>Purchase Date</Label>
        <TouchableOpacity
          style={[ff.input, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar size={14} color={GRAY} />
          <Text style={{ color: formData.purchaseDate ? '#fff' : GRAY, fontSize: 15 }}>
            {formData.purchaseDate ? formatDate(formData.purchaseDate) : 'Select date'}
          </Text>
        </TouchableOpacity>

        <Label>Notes</Label>
        <TextInput
          style={[ff.input, { minHeight: 80, textAlignVertical: 'top' }]}
          value={formData.notes}
          onChangeText={v => set('notes', v)}
          placeholder="Any additional information..."
          placeholderTextColor={GRAY}
          multiline
          numberOfLines={3}
        />
      </BottomSheet>

      {/* ── Type picker sheet ────────────────────────────────────────────────── */}
      <BottomSheet visible={typeSheetOpen} onClose={() => setTypeSheetOpen(false)} title="Select Investment Type">
        {INVESTMENT_TYPES.map(t => {
          const active = formData.type === t;
          return (
            <TouchableOpacity
              key={t}
              style={[s.pickerRow, active && s.pickerRowActive]}
              onPress={() => { set('type', t); setTypeSheetOpen(false); }}
            >
              <Text style={s.pickerIcon}>{INVESTMENT_ICONS[t]}</Text>
              <Text style={[s.pickerText, active && { color: '#fff', fontWeight: '700' }]}>{t}</Text>
              {active && <Check size={16} color={PURPLE} />}
            </TouchableOpacity>
          );
        })}
      </BottomSheet>

      {/* ── Date picker ──────────────────────────────────────────────────────── */}
      {showDatePicker && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          value={new Date(formData.purchaseDate || Date.now())}
          onChange={(_, date) => {
            if (date) set('purchaseDate', toDateStr(date));
            setShowDatePicker(false);
          }}
        />
      )}

      {/* ── Delete sheet ─────────────────────────────────────────────────────── */}
      <BottomSheet
        visible={deleteOpen}
        onClose={() => !isSaving && setDeleteOpen(false)}
        title="Delete Investment"
      >
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <View style={s.deleteIcon}>
            <AlertTriangle size={30} color={RED} />
          </View>
          <Text style={s.deleteTitle}>Are you sure?</Text>
          <Text style={s.deleteSub}>
            Delete{' '}
            <Text style={{ color: '#fff', fontWeight: '700' }}>{investmentToDelete?.name}</Text>
            {'? This cannot be undone.'}
          </Text>
          <TouchableOpacity
            style={[s.deleteConfirmBtn, isSaving && { opacity: 0.6 }]}
            onPress={confirmDelete}
            disabled={isSaving}
          >
            {isSaving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Delete Investment</Text>
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
  card:        { backgroundColor: '#000', borderWidth: 1, borderColor: BORDER, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  headerArea:  { padding: 18 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconBox:     { width: 46, height: 46, borderRadius: 13, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center' },
  cardTitle:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardSub:     { fontSize: 12, color: GRAY, marginTop: 2 },
  chevronBtn:  { width: 34, height: 34, borderRadius: 10, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox:     { flex: 1, minWidth: '45%', backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 12 },
  statLabel:   { fontSize: 11, color: GRAY, marginBottom: 4 },
  statValue:   { fontSize: 20, fontWeight: '800' },

  listArea:    { paddingHorizontal: 16, paddingBottom: 16 },

  filterSection: { marginBottom: 14 },
  filterHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  filterLabel:   { fontSize: 13, color: GRAY },

  emptyBox:    { alignItems: 'center', paddingVertical: 36, marginBottom: 14 },
  emptyTitle:  { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 12 },
  emptySub:    { color: GRAY, fontSize: 13, marginTop: 4, textAlign: 'center' },

  invCard:     { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  invRow:      { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  invIcon:     { fontSize: 22 },
  invName:     { fontSize: 14, fontWeight: '700', color: '#fff' },
  invType:     { fontSize: 11, color: GRAY, marginTop: 2 },
  invAmtLabel: { fontSize: 11, color: GRAY },
  invAmt:      { fontSize: 13, fontWeight: '700', color: '#fff' },

  invDetails:      { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: BORDER, gap: 10 },
  detailRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailLabelText: { fontSize: 13, color: GRAY },
  detailValue:     { fontSize: 13, color: '#fff', fontWeight: '600', maxWidth: '55%', textAlign: 'right' },

  notesBox:    { backgroundColor: '#27272a', borderRadius: 10, padding: 12, marginTop: 4 },
  notesTitle:  { fontSize: 11, color: GRAY, marginBottom: 4 },
  notesText:   { fontSize: 13, color: '#fff' },

  actionRow:   { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  actionText:  { fontSize: 13, fontWeight: '700' },

  addBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 14, marginTop: 4 },
  addBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },

  cancelBtn:   { flex: 1, backgroundColor: CARD, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  cancelText:  { color: '#fff', fontWeight: '600', fontSize: 15 },
  submitBtn:   { flex: 1, backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  submitText:  { color: '#fff', fontWeight: '700', fontSize: 15 },

  pickerRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 4, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', marginBottom: 4 },
  pickerRowActive: { backgroundColor: `${PURPLE}22`, borderColor: `${PURPLE}55` },
  pickerIcon:      { fontSize: 18, width: 28 },
  pickerText:      { flex: 1, fontSize: 15, color: GRAY },

  deleteIcon:       { width: 64, height: 64, borderRadius: 32, backgroundColor: `${RED}18`, borderWidth: 1, borderColor: `${RED}44`, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  deleteTitle:      { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  deleteSub:        { fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: 24, paddingHorizontal: 10 },
  deleteConfirmBtn: { width: '100%', backgroundColor: RED, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  deleteCancelBtn:  { width: '100%', backgroundColor: '#374151', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
});

export default OtherInvestmentsCard;