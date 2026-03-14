// import * as DocumentPicker from 'expo-document-picker';
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

// /* ---------------- Mock OCR (replace later) ---------------- */
// const parseOCRResponse = async () => {
//   await new Promise(r => setTimeout(r, 1500));
//   return [
//     {
//       id: `holding_${Date.now()}`,
//       type: 'Stock',
//       name: 'Reliance Industries Ltd',
//       isin: 'INE002A01018',
//       quantity: 10,
//       investedAmount: 25000,
//       marketCap: 'Large Cap',
//       sector: 'Energy',
//       industry: 'Oil & Gas',
//       purchaseDate: new Date().toISOString().split('T')[0],
//       notes: '',
//       addedAt: new Date().toISOString(),
//     },
//   ];
// };

// /* ---------------- Helpers ---------------- */
// const formatCurrency = amt => {
//   if (!amt) return '₹0';
//   if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)}L`;
//   return `₹${amt.toLocaleString('en-IN')}`;
// };

// /* ---------------- Component ---------------- */
// const StockMFCard = ({ data, onAdd, onUpdate, onDelete }) => {
//   const holdings = data?.holdings || [];

//   const [expanded, setExpanded] = useState(false);
//   const [expandedHolding, setExpandedHolding] = useState(null);

//   const [activeFilter, setActiveFilter] = useState('All');
//   const [capFilter, setCapFilter] = useState('All');

//   const [uploading, setUploading] = useState(false);
//   const [passwordSheet, setPasswordSheet] = useState(false);
//   const [casPassword, setCasPassword] = useState('');

//   const [editModal, setEditModal] = useState(false);
//   const [editingHolding, setEditingHolding] = useState(null);
//   const [editForm, setEditForm] = useState({});

//   const [deleteSheet, setDeleteSheet] = useState(false);
//   const [holdingToDelete, setHoldingToDelete] = useState(null);

//   /* ---------------- Stats ---------------- */
//   const stats = useMemo(() => ({
//     total: holdings.length,
//     invested: holdings.reduce((s, h) => s + (h.investedAmount || 0), 0),
//     stocks: holdings.filter(h => h.type === 'Stock').length,
//     mfs: holdings.filter(h => h.type === 'Mutual Fund').length,
//   }), [holdings]);

//   /* ---------------- Filters ---------------- */
//   const filteredHoldings = useMemo(() => {
//     let list = holdings;
//     if (activeFilter !== 'All') {
//       list = list.filter(h => h.type === activeFilter);
//     }
//     if (activeFilter === 'Stock' && capFilter !== 'All') {
//       list = list.filter(h => h.marketCap === capFilter);
//     }
//     return list;
//   }, [holdings, activeFilter, capFilter]);

//   /* ---------------- Upload ---------------- */
//   const pickFile = async () => {
//     const res = await DocumentPicker.getDocumentAsync({
//       type: ['application/pdf', 'image/*'],
//       multiple: false,
//     });

//     if (res.canceled) return;

//     setUploading(true);
//     setPasswordSheet(true);
//   };

//   const handleProcessCAS = async () => {
//     setPasswordSheet(false);
//     const extracted = await parseOCRResponse();

//     for (const h of extracted) {
//       await onAdd(h);
//     }

//     setUploading(false);
//     setExpanded(false);
//     setCasPassword('');
//   };

//   /* ---------------- Edit ---------------- */
//   const openEdit = holding => {
//     setEditingHolding(holding);
//     setEditForm({
//       name: holding.name,
//       quantity: String(holding.quantity),
//       investedAmount: String(holding.investedAmount || ''),
//       marketCap: holding.marketCap,
//       sector: holding.sector,
//       industry: holding.industry,
//       purchaseDate: holding.purchaseDate,
//       notes: holding.notes,
//     });
//     setEditModal(true);
//   };

//   const saveEdit = async () => {
//     await onUpdate({
//       ...editingHolding,
//       ...editForm,
//       quantity: Number(editForm.quantity),
//       investedAmount: Number(editForm.investedAmount) || 0,
//       updatedAt: new Date().toISOString(),
//     });
//     setEditModal(false);
//     setEditingHolding(null);
//   };

//   /* ---------------- Delete ---------------- */
//   const confirmDelete = async () => {
//     await onDelete(holdingToDelete);
//     setDeleteSheet(false);
//     setHoldingToDelete(null);
//   };

//   /* ---------------- UI ---------------- */
//   return (
//     <>
//       <View style={styles.card}>
//         <Pressable onPress={() => setExpanded(!expanded)}>
//           <Text style={styles.title}>📈 Stocks & Mutual Funds</Text>
//           <Text style={styles.sub}>Track your holdings</Text>
//         </Pressable>

//         <View style={styles.statsRow}>
//           <Stat label="Holdings" value={stats.total} />
//           <Stat label="Invested" value={formatCurrency(stats.invested)} />
//           <Stat label="Stocks" value={stats.stocks} />
//           <Stat label="MFs" value={stats.mfs} />
//         </View>

//         {expanded && (
//           <View style={{ marginTop: 12 }}>
//             <Pressable style={styles.uploadBtn} onPress={pickFile}>
//               <Text style={styles.uploadText}>➕ Upload CAS / Screenshots</Text>
//             </Pressable>

//             {/* Filters */}
//             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
//               {['All', 'Stock', 'Mutual Fund', 'Other'].map(f => (
//                 <Chip
//                   key={f}
//                   label={f}
//                   active={activeFilter === f}
//                   onPress={() => {
//                     setActiveFilter(f);
//                     setCapFilter('All');
//                   }}
//                 />
//               ))}
//             </ScrollView>

//             {activeFilter === 'Stock' && (
//               <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//                 {['All', 'Small Cap', 'Mid Cap', 'Large Cap'].map(c => (
//                   <Chip
//                     key={c}
//                     small
//                     label={c}
//                     active={capFilter === c}
//                     onPress={() => setCapFilter(c)}
//                   />
//                 ))}
//               </ScrollView>
//             )}

//             {filteredHoldings.length === 0 ? (
//               <Text style={styles.empty}>No holdings yet</Text>
//             ) : (
//               filteredHoldings.map(h => (
//                 <View key={h.id} style={styles.holding}>
//                   <Pressable onPress={() => setExpandedHolding(expandedHolding === h.id ? null : h.id)}>
//                     <Text style={styles.hName}>{h.name}</Text>
//                     <Text style={styles.hSub}>{h.type} • {h.quantity}</Text>
//                   </Pressable>

//                   {expandedHolding === h.id && (
//                     <>
//                       <Text style={styles.detail}>Invested: {formatCurrency(h.investedAmount)}</Text>
//                       <Text style={styles.detail}>Purchase: {h.purchaseDate}</Text>

//                       <View style={styles.actions}>
//                         <Pressable style={styles.editBtn} onPress={() => openEdit(h)}>
//                           <Text style={styles.actionText}>Edit</Text>
//                         </Pressable>
//                         <Pressable
//                           style={styles.delBtn}
//                           onPress={() => {
//                             setHoldingToDelete(h);
//                             setDeleteSheet(true);
//                           }}
//                         >
//                           <Text style={styles.actionText}>Delete</Text>
//                         </Pressable>
//                       </View>
//                     </>
//                   )}
//                 </View>
//               ))
//             )}
//           </View>
//         )}
//       </View>

//       {/* Password Sheet */}
//       <Modal visible={passwordSheet} transparent animationType="slide">
//         <View style={styles.sheet}>
//           <View style={styles.sheetBox}>
//             <Text style={styles.modalTitle}>Enter CAS Password</Text>
//             <TextInput
//               secureTextEntry
//               value={casPassword}
//               onChangeText={setCasPassword}
//               placeholder="Password"
//               placeholderTextColor="#9ca3af"
//               style={styles.input}
//             />
//             <Pressable style={styles.saveBtn} onPress={handleProcessCAS}>
//               {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Continue</Text>}
//             </Pressable>
//           </View>
//         </View>
//       </Modal>

//       {/* Edit Modal */}
//       <Modal visible={editModal} transparent animationType="slide">
//         <View style={styles.sheet}>
//           <ScrollView style={styles.sheetBox}>
//             <Text style={styles.modalTitle}>Edit Holding</Text>

//             <Input label="Name" value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} />
//             <Input label="Quantity" keyboardType="numeric" value={editForm.quantity} onChange={v => setEditForm({ ...editForm, quantity: v })} />
//             <Input label="Invested Amount" keyboardType="numeric" value={editForm.investedAmount} onChange={v => setEditForm({ ...editForm, investedAmount: v })} />
//             <Input label="Purchase Date" value={editForm.purchaseDate} onChange={v => setEditForm({ ...editForm, purchaseDate: v })} />
//             <Input label="Notes" value={editForm.notes} onChange={v => setEditForm({ ...editForm, notes: v })} />

//             <Pressable style={styles.saveBtn} onPress={saveEdit}>
//               <Text style={styles.saveText}>Save</Text>
//             </Pressable>
//           </ScrollView>
//         </View>
//       </Modal>

//       {/* Delete Sheet */}
//       <Modal visible={deleteSheet} transparent animationType="fade">
//         <View style={styles.sheet}>
//           <View style={styles.sheetBox}>
//             <Text style={styles.modalTitle}>Delete Holding?</Text>
//             <Pressable style={styles.delBtn} onPress={confirmDelete}>
//               <Text style={styles.actionText}>Delete</Text>
//             </Pressable>
//             <Pressable onPress={() => setDeleteSheet(false)}>
//               <Text style={styles.cancel}>Cancel</Text>
//             </Pressable>
//           </View>
//         </View>
//       </Modal>
//     </>
//   );
// };

// /* ---------------- Small UI ---------------- */
// const Stat = ({ label, value }) => (
//   <View style={styles.stat}>
//     <Text style={styles.statLabel}>{label}</Text>
//     <Text style={styles.statValue}>{value}</Text>
//   </View>
// );

// const Chip = ({ label, active, onPress, small }) => (
//   <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive, small && styles.chipSmall]}>
//     <Text style={{ color: active ? '#fff' : '#9ca3af', fontSize: small ? 12 : 14 }}>
//       {label}
//     </Text>
//   </Pressable>
// );

// const Input = ({ label, value, onChange, ...props }) => (
//   <View style={{ marginBottom: 12 }}>
//     <Text style={styles.label}>{label}</Text>
//     <TextInput value={value} onChangeText={onChange} style={styles.input} {...props} />
//   </View>
// );

// /* ---------------- Styles ---------------- */
// const styles = StyleSheet.create({
//   card: { backgroundColor: '#111827', borderRadius: 16, padding: 16, marginBottom: 16 },
//   title: { color: '#fff', fontSize: 18, fontWeight: '700' },
//   sub: { color: '#9ca3af', marginBottom: 12 },
//   statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
//   stat: { flex: 1, backgroundColor: '#1f2937', padding: 8, borderRadius: 8 },
//   statLabel: { color: '#9ca3af', fontSize: 12 },
//   statValue: { color: '#fff', fontWeight: '700' },
//   uploadBtn: { backgroundColor: '#6c50c4', padding: 12, borderRadius: 12 },
//   uploadText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
//   chip: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#1f2937', borderRadius: 999, marginRight: 8 },
//   chipActive: { backgroundColor: '#6c50c4' },
//   chipSmall: { paddingVertical: 6, paddingHorizontal: 10 },
//   empty: { color: '#9ca3af', textAlign: 'center', marginTop: 20 },
//   holding: { backgroundColor: '#1f2937', borderRadius: 12, padding: 12, marginBottom: 8 },
//   hName: { color: '#fff', fontWeight: '700' },
//   hSub: { color: '#9ca3af' },
//   detail: { color: '#d1d5db', marginTop: 4 },
//   actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
//   editBtn: { flex: 1, backgroundColor: '#4f46e5', padding: 8, borderRadius: 8 },
//   delBtn: { flex: 1, backgroundColor: '#ef4444', padding: 8, borderRadius: 8 },
//   actionText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
//   sheet: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
//   sheetBox: { backgroundColor: '#111827', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
//   modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
//   input: { backgroundColor: '#1f2937', color: '#fff', padding: 12, borderRadius: 8 },
//   label: { color: '#9ca3af', marginBottom: 4 },
//   saveBtn: { backgroundColor: '#6c50c4', padding: 14, borderRadius: 12, marginTop: 12 },
//   saveText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
//   cancel: { color: '#9ca3af', textAlign: 'center', marginTop: 12 },
// });

// export default StockMFCard;


import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, TextInput, ActivityIndicator, Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import {
  TrendingUp, FileText, Image as ImageIcon, X, Check,
  ChevronDown, Camera, Edit2, AlertCircle, Trash2, Loader2,
} from 'lucide-react-native';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const PURPLE = 'rgb(108,80,196)';
const RED    = '#ef4444';
const GREEN  = '#10b981';
const GRAY   = '#9ca3af';
const CARD   = '#1f2937';
const CARD2  = '#111827';
const BORDER = '#374151';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000)   return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000)     return `₹${(amount / 1000).toFixed(2)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

const toDateStr = (date) => {
  const d  = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const formatDate = (str) => {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── OCR mock (replace with real API) ────────────────────────────────────────
const parseOCRResponse = () => new Promise(resolve => {
  setTimeout(() => {
    resolve({
      accounts: [
        {
          holdings: [{
            data: [
              { isin: 'INE967B01028', security: 'SCANPOINT GEOMATICS LIMITED', total_holding: 100, 'Market Cap': 'Small Cap', 'Sector Name': 'Information Technology', 'Industry New Name': 'Information Technology' },
              { isin: 'INE769A01020', security: 'AARTI INDUSTRIES LIMITED',    total_holding: 301, 'Market Cap': 'Small Cap', 'Sector Name': 'Commodities',           'Industry New Name': 'Chemicals' },
            ],
            date: '30-06-2024',
          }],
        },
        {
          holdings: [{
            data: [
              { security: 'AXIS LIQUID FUND - DIRECT PLAN - GROWTH', isin: 'INF846K01CX4', folio_no: '910177063656/0', total_holding: 8.576,    amount: 23000,  'Sector Name': '', 'Industry New Name': '', 'Market Cap': '' },
              { security: 'HDFC FLEXI CAP FUND - DIRECT GROWTH',     isin: 'INF179KC1GL9', folio_no: '23124220/91',    total_holding: 6747.527, amount: 100000, 'Sector Name': '', 'Industry New Name': '', 'Market Cap': '' },
            ],
            date: '30-06-2024',
          }],
        },
      ],
    });
  }, 2000);
});

const categorizeHolding = (h) => {
  if (h.folio_no || h.isin?.startsWith('INF')) return 'Mutual Fund';
  if (h['Market Cap']?.trim()) return 'Stock';
  return 'Other';
};

const extractHoldings = (ocrResponse, purchaseDate) => {
  const all = [];
  ocrResponse.accounts.forEach(account => {
    account.holdings.forEach(group => {
      (group.data || []).forEach(item => {
        const type = categorizeHolding(item);
        if ((item.total_holding || 0) > 0) {
          all.push({
            id: `holding_${Date.now()}_${Math.random()}`,
            type,
            isin:          item.isin         || '',
            name:          item.security     || '',
            quantity:      item.total_holding || 0,
            investedAmount:item.amount       || 0,
            marketCap:     item['Market Cap']         || '',
            sector:        item['Sector Name']        || '',
            industry:      item['Industry New Name']  || '',
            folioNumber:   item.folio_no || '',
            purchaseDate:  purchaseDate || group.date || '',
            notes:         '',
            addedAt:       new Date().toISOString(),
          });
        }
      });
    });
  });
  return all;
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
        <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
          <View style={{ height: 12 }} />
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
const FilterPill = ({ label, active, onPress, small }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[fp.pill, small && fp.small, active && fp.active]}
  >
    <Text style={[fp.text, small && fp.smallText, active && fp.activeText]}>{label}</Text>
  </TouchableOpacity>
);

const fp = StyleSheet.create({
  pill:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, marginRight: 8 },
  small:      { paddingHorizontal: 10, paddingVertical: 5 },
  active:     { backgroundColor: PURPLE, borderColor: PURPLE },
  text:       { fontSize: 13, fontWeight: '600', color: GRAY },
  smallText:  { fontSize: 11 },
  activeText: { color: '#fff' },
});

// ─── Main Component ───────────────────────────────────────────────────────────
const StockMFCard = ({ data = { holdings: [] }, onAdd, onUpdate, onDelete }) => {
  const [isExpanded,       setIsExpanded]       = useState(false);
  const [activeTab,        setActiveTab]        = useState('cas');
  const [uploadedFiles,    setUploadedFiles]    = useState([]);
  const [isUploading,      setIsUploading]      = useState(false);
  const [isProcessing,     setIsProcessing]     = useState(false);
  const [expandedHolding,  setExpandedHolding]  = useState(null);
  const [activeFilter,     setActiveFilter]     = useState('All');
  const [activeCapFilter,  setActiveCapFilter]  = useState('All');

  // Password sheet
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);
  const [casPassword,        setCasPassword]       = useState('');
  const [pendingOCRFile,     setPendingOCRFile]    = useState(null);

  // Edit sheet
  const [editSheetOpen,   setEditSheetOpen]   = useState(false);
  const [editingHolding,  setEditingHolding]  = useState(null);
  const [editFormData,    setEditFormData]    = useState({});
  const [showDatePicker,  setShowDatePicker]  = useState(false);

  // Market cap picker sheet
  const [capSheetOpen, setCapSheetOpen] = useState(false);

  // Delete sheet
  const [deleteSheetOpen,  setDeleteSheetOpen]  = useState(false);
  const [holdingToDelete,  setHoldingToDelete]  = useState(null);
  const [isSaving,         setIsSaving]         = useState(false);

  const holdings = data?.holdings || [];

  const stats = useMemo(() => ({
    totalHoldings: holdings.length,
    stocks:        holdings.filter(h => h.type === 'Stock').length,
    mutualFunds:   holdings.filter(h => h.type === 'Mutual Fund').length,
    others:        holdings.filter(h => h.type === 'Other').length,
    totalInvested: holdings.reduce((s, h) => s + (h.investedAmount || 0), 0),
  }), [holdings]);

  const filteredHoldings = useMemo(() => {
    let f = holdings;
    if (activeFilter !== 'All')  f = f.filter(h => h.type === activeFilter);
    if (activeFilter === 'Stock' && activeCapFilter !== 'All')
      f = f.filter(h => h.marketCap === activeCapFilter);
    return f;
  }, [holdings, activeFilter, activeCapFilter]);

  // ── File picking ─────────────────────────────────────────────────────────
  const pickCAS = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled) return;
    const file = result.assets[0];
    addFile({ id: Date.now(), name: file.name, size: ((file.size || 0) / 1024 / 1024).toFixed(2), uri: file.uri, status: 'pending', progress: 0 });
  };

  const pickScreenshots = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Toast.show({ type: 'error', text1: 'Permission denied' }); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (result.canceled) return;
    result.assets.forEach((asset, i) => {
      const name = asset.fileName || `screenshot_${i + 1}.jpg`;
      addFile({ id: Date.now() + i, name, size: '—', uri: asset.uri, status: 'pending', progress: 0 });
    });
  };

  const addFile = (fileObj) => {
    setUploadedFiles(prev => [...prev, fileObj]);
    simulateUpload(fileObj);
  };

  const simulateUpload = async (fileObj) => {
    setIsUploading(true);
    setUploadedFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'uploading' } : f));
    for (let p = 0; p <= 100; p += 10) {
      await new Promise(r => setTimeout(r, 80));
      setUploadedFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress: p } : f));
    }
    setUploadedFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'completed' } : f));
    setIsUploading(false);
    setPendingOCRFile(fileObj);
    setPasswordSheetOpen(true);
  };

  const removeFile = (id) => setUploadedFiles(prev => prev.filter(f => f.id !== id));

  // ── Password submit ───────────────────────────────────────────────────────
  const handlePasswordSubmit = () => {
    if (!casPassword) { Toast.show({ type: 'error', text1: 'Password required' }); return; }
    setPasswordSheetOpen(false);
    startProcessing(pendingOCRFile, casPassword);
    setPendingOCRFile(null);
    setCasPassword('');
  };

  const handlePasswordCancel = () => {
    setPasswordSheetOpen(false);
    setCasPassword('');
    setPendingOCRFile(null);
    setUploadedFiles([]);
  };

  // ── OCR processing ────────────────────────────────────────────────────────
  const startProcessing = async (file, password) => {
    setIsProcessing(true);
    try {
      const ocrResponse = await parseOCRResponse(file, password);
      const extracted   = extractHoldings(ocrResponse, toDateStr(new Date()));
      if (!extracted.length) { Toast.show({ type: 'error', text1: 'No holdings detected' }); setIsProcessing(false); return; }
      for (const h of extracted) await onAdd(h);
      Toast.show({ type: 'success', text1: 'Holdings imported!', text2: `${extracted.length} holdings added` });
      setUploadedFiles([]);
      setIsExpanded(false);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Processing failed', text2: e.message });
    }
    setIsProcessing(false);
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEditHolding = (holding) => {
    setEditingHolding(holding);
    setEditFormData({
      name:          holding.name,
      quantity:      String(holding.quantity),
      investedAmount:String(holding.investedAmount || 0),
      marketCap:     holding.marketCap,
      sector:        holding.sector,
      industry:      holding.industry,
      purchaseDate:  holding.purchaseDate,
      notes:         holding.notes,
    });
    setEditSheetOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData.name || !editFormData.quantity || !editFormData.purchaseDate) {
      Toast.show({ type: 'error', text1: 'Missing fields', text2: 'Name, Quantity and Purchase Date are required' });
      return;
    }
    setIsSaving(true);
    const result = await onUpdate({
      ...editingHolding,
      name:          editFormData.name,
      quantity:      parseFloat(editFormData.quantity),
      investedAmount:parseFloat(editFormData.investedAmount) || 0,
      marketCap:     editFormData.marketCap,
      sector:        editFormData.sector,
      industry:      editFormData.industry,
      purchaseDate:  editFormData.purchaseDate,
      notes:         editFormData.notes,
      updatedAt:     new Date().toISOString(),
    });
    if (result?.success) {
      setEditSheetOpen(false);
      setEditingHolding(null);
      Toast.show({ type: 'success', text1: 'Holding updated' });
    } else {
      Toast.show({ type: 'error', text1: 'Update failed', text2: result?.error });
    }
    setIsSaving(false);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    setIsSaving(true);
    const result = await onDelete(holdingToDelete);
    if (result?.success) {
      setDeleteSheetOpen(false);
      setHoldingToDelete(null);
      Toast.show({ type: 'success', text1: 'Holding deleted' });
    } else {
      Toast.show({ type: 'error', text1: 'Delete failed', text2: result?.error });
    }
    setIsSaving(false);
  };

  const setEdit = (k, v) => setEditFormData(prev => ({ ...prev, [k]: v }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <View style={s.card}>

        {/* Stats header */}
        <TouchableOpacity
          style={s.headerArea}
          onPress={() => !isProcessing && setIsExpanded(v => !v)}
          activeOpacity={0.85}
        >
          <View style={s.titleRow}>
            <View style={s.iconBox}>
              <TrendingUp size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Stocks & Mutual Funds</Text>
              <Text style={s.cardSub}>Track your portfolio holdings</Text>
            </View>
            <View style={s.chevronBtn}>
              <ChevronDown size={18} color={GRAY} style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
            </View>
          </View>

          <View style={s.statsGrid}>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Total Holdings</Text>
              <Text style={[s.statValue, { color: '#fff' }]}>{stats.totalHoldings}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Total Invested</Text>
              <Text style={[s.statValue, { color: PURPLE }]}>{formatCurrency(stats.totalInvested)}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Stocks</Text>
              <Text style={[s.statValue, { color: '#fff' }]}>{stats.stocks}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Mutual Funds</Text>
              <Text style={[s.statValue, { color: '#fff' }]}>{stats.mutualFunds}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded section */}
        {isExpanded && (
          <View style={s.listArea}>

            {/* Tab switcher */}
            <View style={s.tabBar}>
              {[
                { key: 'cas',         label: 'CAS Statement', Icon: FileText },
                { key: 'screenshots', label: 'Screenshots',   Icon: Camera   },
              ].map(({ key, label, Icon }) => (
                <TouchableOpacity
                  key={key}
                  style={[s.tabBtn, activeTab === key && s.tabBtnActive]}
                  onPress={() => setActiveTab(key)}
                >
                  <Icon size={14} color={activeTab === key ? '#fff' : GRAY} />
                  <Text style={[s.tabText, activeTab === key && s.tabTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Upload button */}
            <TouchableOpacity
              style={s.uploadArea}
              onPress={activeTab === 'cas' ? pickCAS : pickScreenshots}
              disabled={isUploading || isProcessing}
            >
              {activeTab === 'cas' ? (
                <>
                  <FileText size={40} color={PURPLE} />
                  <Text style={s.uploadTitle}>Upload CAS Statement</Text>
                  <Text style={s.uploadSub}>Tap to browse PDF</Text>
                  <Text style={s.uploadHint}>PDF only • Max 10MB</Text>
                </>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8 }}>
                    <ImageIcon size={36} color={PURPLE} />
                    <Camera   size={36} color={PURPLE} />
                  </View>
                  <Text style={s.uploadTitle}>Upload Portfolio Screenshots</Text>
                  <Text style={s.uploadSub}>Tap to pick from gallery</Text>
                  <Text style={s.uploadHint}>JPG, PNG • Max 10MB per file</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Uploaded files */}
            {uploadedFiles.map(file => (
              <View key={file.id} style={s.fileRow}>
                {file.status === 'completed'
                  ? <View style={[s.fileIconBox, { backgroundColor: `${GREEN}22` }]}><Check size={16} color={GREEN} /></View>
                  : file.status === 'uploading'
                  ? <View style={[s.fileIconBox, { backgroundColor: `${PURPLE}22` }]}><ActivityIndicator size="small" color={PURPLE} /></View>
                  : <View style={[s.fileIconBox, { backgroundColor: BORDER }]}><FileText size={16} color={GRAY} /></View>
                }
                <View style={{ flex: 1 }}>
                  <Text style={s.fileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={s.fileSize}>{file.size} MB</Text>
                  {file.status === 'uploading' && (
                    <View style={s.progressBar}>
                      <View style={[s.progressFill, { width: `${file.progress}%` }]} />
                    </View>
                  )}
                </View>
                {file.status !== 'uploading' && (
                  <TouchableOpacity onPress={() => removeFile(file.id)}>
                    <X size={18} color={RED} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Processing state */}
            {isProcessing && (
              <View style={s.processingBox}>
                <ActivityIndicator size="large" color={PURPLE} />
                <Text style={s.processingTitle}>Analyzing your portfolio…</Text>
                <Text style={s.processingSub}>This may take a few moments</Text>
              </View>
            )}

            {/* Holdings list */}
            {holdings.length > 0 && (
              <View style={s.holdingsSection}>
                <Text style={s.sectionTitle}>Your Holdings ({filteredHoldings.length})</Text>

                {/* Type filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {['All', 'Stock', 'Mutual Fund', 'Other'].map(f => (
                    <FilterPill
                      key={f} label={f} active={activeFilter === f}
                      onPress={() => { setActiveFilter(f); setActiveCapFilter('All'); }}
                    />
                  ))}
                </ScrollView>

                {/* Cap filters */}
                {activeFilter === 'Stock' && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {['All', 'Small Cap', 'Mid Cap', 'Large Cap'].map(c => (
                      <FilterPill key={c} label={c} active={activeCapFilter === c} onPress={() => setActiveCapFilter(c)} small />
                    ))}
                  </ScrollView>
                )}

                {filteredHoldings.length === 0
                  ? <Text style={s.emptyText}>No holdings found for this filter</Text>
                  : filteredHoldings.map(holding => {
                    const isOpen = expandedHolding === holding.id;
                    return (
                      <View key={holding.id} style={s.holdingCard}>
                        {/* Row */}
                        <TouchableOpacity
                          style={s.holdingRow}
                          onPress={() => setExpandedHolding(isOpen ? null : holding.id)}
                          activeOpacity={0.8}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={s.holdingName} numberOfLines={1}>{holding.name}</Text>
                            <View style={s.holdingMeta}>
                              <Text style={s.holdingQty}>
                                {holding.type === 'Mutual Fund'
                                  ? `${holding.quantity.toFixed(2)} units`
                                  : `${holding.quantity} shares`}
                              </Text>
                              {!!holding.marketCap && (
                                <View style={s.capBadge}>
                                  <Text style={s.capBadgeText}>{holding.marketCap}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <ChevronDown size={18} color={GRAY} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
                        </TouchableOpacity>

                        {/* Expanded details */}
                        {isOpen && (
                          <View style={s.holdingDetails}>
                            {[
                              { label: 'Type',           value: holding.type },
                              holding.isin         && { label: 'ISIN',           value: holding.isin },
                              holding.folioNumber  && { label: 'Folio Number',   value: holding.folioNumber },
                              { label: holding.type === 'Mutual Fund' ? 'Units' : 'Quantity', value: holding.type === 'Mutual Fund' ? holding.quantity.toFixed(3) : String(holding.quantity) },
                              { label: 'Invested Amount',  value: formatCurrency(holding.investedAmount || 0) },
                              holding.sector       && { label: 'Sector',         value: holding.sector },
                              holding.industry     && { label: 'Industry',       value: holding.industry },
                              { label: 'Purchase Date',    value: formatDate(holding.purchaseDate) },
                              holding.notes        && { label: 'Notes',          value: holding.notes },
                            ].filter(Boolean).map(({ label, value }) => (
                              <View key={label} style={s.detailRow}>
                                <Text style={s.detailLabel}>{label}</Text>
                                <Text style={s.detailValue}>{value}</Text>
                              </View>
                            ))}

                            <View style={s.actionRow}>
                              <TouchableOpacity
                                style={[s.actionBtn, { borderColor: `${PURPLE}44`, backgroundColor: `${PURPLE}18` }]}
                                onPress={() => handleEditHolding(holding)}
                              >
                                <Edit2 size={15} color={PURPLE} />
                                <Text style={[s.actionText, { color: PURPLE }]}>Edit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[s.actionBtn, { borderColor: `${RED}44`, backgroundColor: `${RED}18` }]}
                                onPress={() => { setHoldingToDelete(holding); setDeleteSheetOpen(true); }}
                              >
                                <Trash2 size={15} color={RED} />
                                <Text style={[s.actionText, { color: RED }]}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })
                }
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── CAS Password Sheet ───────────────────────────────────────────────── */}
      <BottomSheet
        visible={passwordSheetOpen}
        onClose={handlePasswordCancel}
        title="Enter CAS Password"
        footer={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={s.cancelBtn} onPress={handlePasswordCancel}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.submitBtn} onPress={handlePasswordSubmit}>
              <Text style={s.submitText}>Continue</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <Text style={s.sheetDesc}>
          Your CAS statement is password protected. Enter the password to continue.
        </Text>
        <Label>Password</Label>
        <StyledInput
          value={casPassword}
          onChangeText={setCasPassword}
          placeholder="Enter password"
          secureTextEntry
        />
      </BottomSheet>

      {/* ── Edit Holding Sheet ───────────────────────────────────────────────── */}
      <BottomSheet
        visible={editSheetOpen}
        onClose={() => { setEditSheetOpen(false); setEditingHolding(null); }}
        title="Edit Holding"
        footer={
          <TouchableOpacity
            style={[s.submitBtn, { flex: undefined, width: '100%' }, isSaving && { opacity: 0.6 }]}
            onPress={handleSaveEdit}
            disabled={isSaving}
          >
            {isSaving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.submitText}>Save Changes</Text>
            }
          </TouchableOpacity>
        }
      >
        <Label required>Name</Label>
        <StyledInput value={editFormData.name || ''} onChangeText={v => setEdit('name', v)} placeholder="Holding name" />

        <Label required>Quantity / Units</Label>
        <StyledInput value={editFormData.quantity || ''} onChangeText={v => setEdit('quantity', v)} placeholder="0" keyboardType="numeric" />

        <Label>Invested Amount (₹)</Label>
        <StyledInput value={editFormData.investedAmount || ''} onChangeText={v => setEdit('investedAmount', v)} placeholder="0" keyboardType="numeric" />
        <Text style={s.hint}>Leave blank if unknown</Text>

        {editingHolding?.type === 'Stock' && (
          <>
            <Label>Market Cap</Label>
            <TouchableOpacity style={ff.input} onPress={() => setCapSheetOpen(true)}>
              <Text style={{ color: editFormData.marketCap ? '#fff' : GRAY, fontSize: 15 }}>
                {editFormData.marketCap || 'Select Market Cap'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <Label>Sector</Label>
        <StyledInput value={editFormData.sector || ''} onChangeText={v => setEdit('sector', v)} placeholder="e.g. Technology, Finance" />

        <Label>Industry</Label>
        <StyledInput value={editFormData.industry || ''} onChangeText={v => setEdit('industry', v)} placeholder="e.g. Software, Banking" />

        <Label required>Purchase Date</Label>
        <TouchableOpacity style={[ff.input, { flexDirection: 'row', alignItems: 'center', gap: 8 }]} onPress={() => setShowDatePicker(true)}>
          <Text style={{ color: editFormData.purchaseDate ? '#fff' : GRAY, fontSize: 15 }}>
            {editFormData.purchaseDate ? formatDate(editFormData.purchaseDate) : 'Select date'}
          </Text>
        </TouchableOpacity>

        <Label>Notes</Label>
        <TextInput
          style={[ff.input, { minHeight: 80, textAlignVertical: 'top' }]}
          value={editFormData.notes || ''}
          onChangeText={v => setEdit('notes', v)}
          placeholder="Add any notes..."
          placeholderTextColor={GRAY}
          multiline
          numberOfLines={3}
        />
      </BottomSheet>

      {/* Market cap picker */}
      <BottomSheet visible={capSheetOpen} onClose={() => setCapSheetOpen(false)} title="Select Market Cap">
        {['Small Cap', 'Mid Cap', 'Large Cap'].map(cap => (
          <TouchableOpacity
            key={cap}
            style={[s.pickerRow, editFormData.marketCap === cap && s.pickerRowActive]}
            onPress={() => { setEdit('marketCap', cap); setCapSheetOpen(false); }}
          >
            <Text style={[s.pickerText, editFormData.marketCap === cap && { color: '#fff', fontWeight: '700' }]}>{cap}</Text>
            {editFormData.marketCap === cap && <Check size={16} color={PURPLE} />}
          </TouchableOpacity>
        ))}
      </BottomSheet>

      {/* Date picker */}
      {showDatePicker && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          value={new Date(editFormData.purchaseDate || Date.now())}
          onChange={(_, date) => {
            if (date) setEdit('purchaseDate', toDateStr(date));
            setShowDatePicker(false);
          }}
        />
      )}

      {/* ── Delete Sheet ─────────────────────────────────────────────────────── */}
      <BottomSheet
        visible={deleteSheetOpen}
        onClose={() => !isSaving && setDeleteSheetOpen(false)}
        title="Delete Holding"
      >
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <View style={s.deleteIcon}>
            <AlertCircle size={30} color={RED} />
          </View>
          <Text style={s.deleteTitle}>Are you sure?</Text>
          <Text style={s.deleteSub}>
            This holding will be permanently removed. This action cannot be undone.
          </Text>
          <TouchableOpacity
            style={[s.deleteConfirmBtn, isSaving && { opacity: 0.6 }]}
            onPress={confirmDelete}
            disabled={isSaving}
          >
            {isSaving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Delete Holding</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteCancelBtn} onPress={() => setDeleteSheetOpen(false)} disabled={isSaving}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card:          { backgroundColor: '#000', borderWidth: 1, borderColor: BORDER, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  headerArea:    { padding: 18 },
  titleRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconBox:       { width: 46, height: 46, borderRadius: 13, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center' },
  cardTitle:     { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardSub:       { fontSize: 12, color: GRAY, marginTop: 2 },
  chevronBtn:    { width: 34, height: 34, borderRadius: 10, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  statsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox:       { flex: 1, minWidth: '45%', backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 12 },
  statLabel:     { fontSize: 11, color: GRAY, marginBottom: 4 },
  statValue:     { fontSize: 20, fontWeight: '800' },

  listArea:      { paddingHorizontal: 16, paddingBottom: 16 },

  // Tab bar
  tabBar:        { flexDirection: 'row', backgroundColor: CARD, borderRadius: 14, padding: 4, marginBottom: 14, gap: 4 },
  tabBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabBtnActive:  { backgroundColor: PURPLE },
  tabText:       { fontSize: 13, fontWeight: '600', color: GRAY },
  tabTextActive: { color: '#fff' },

  // Upload
  uploadArea:    { borderWidth: 2, borderStyle: 'dashed', borderColor: BORDER, borderRadius: 16, padding: 28, alignItems: 'center', backgroundColor: CARD, marginBottom: 14, gap: 6 },
  uploadTitle:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  uploadSub:     { fontSize: 13, color: GRAY },
  uploadHint:    { fontSize: 11, color: '#6b7280' },

  // File row
  fileRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 12, marginBottom: 8 },
  fileIconBox:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  fileName:      { fontSize: 13, fontWeight: '600', color: '#fff' },
  fileSize:      { fontSize: 11, color: GRAY, marginTop: 2 },
  progressBar:   { height: 4, backgroundColor: BORDER, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: PURPLE, borderRadius: 2 },

  // Processing
  processingBox:   { alignItems: 'center', paddingVertical: 32, gap: 10 },
  processingTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  processingSub:   { fontSize: 13, color: GRAY },

  // Holdings
  holdingsSection: { marginTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: BORDER, paddingTop: 16 },
  sectionTitle:    { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12 },
  emptyText:       { color: GRAY, textAlign: 'center', paddingVertical: 24 },

  holdingCard:     { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  holdingRow:      { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  holdingName:     { fontSize: 14, fontWeight: '700', color: '#fff' },
  holdingMeta:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  holdingQty:      { fontSize: 12, color: GRAY },
  capBadge:        { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: `${PURPLE}22` },
  capBadgeText:    { fontSize: 11, color: PURPLE, fontWeight: '600' },

  holdingDetails:  { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: BORDER, gap: 10 },
  detailRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel:     { fontSize: 13, color: GRAY },
  detailValue:     { fontSize: 13, color: '#fff', fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  actionRow:       { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  actionText:      { fontSize: 13, fontWeight: '700' },

  // Sheet helpers
  sheetDesc:     { fontSize: 13, color: GRAY, marginTop: 12, lineHeight: 20 },
  hint:          { fontSize: 11, color: GRAY, marginTop: 4 },
  cancelBtn:     { flex: 1, backgroundColor: CARD, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  cancelText:    { color: '#fff', fontWeight: '600', fontSize: 15 },
  submitBtn:     { flex: 1, backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  submitText:    { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Picker row
  pickerRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 4, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', marginBottom: 4 },
  pickerRowActive: { backgroundColor: `${PURPLE}22`, borderColor: `${PURPLE}55` },
  pickerText:      { fontSize: 15, color: GRAY },

  // Delete sheet
  deleteIcon:       { width: 64, height: 64, borderRadius: 32, backgroundColor: `${RED}18`, borderWidth: 1, borderColor: `${RED}44`, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  deleteTitle:      { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  deleteSub:        { fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: 24, paddingHorizontal: 10 },
  deleteConfirmBtn: { width: '100%', backgroundColor: RED, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  deleteCancelBtn:  { width: '100%', backgroundColor: '#374151', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
});

export default StockMFCard;