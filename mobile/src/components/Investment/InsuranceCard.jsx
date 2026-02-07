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

const InsuranceCard = ({ data, onAdd, onUpdate, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isEditingPolicy, setIsEditingPolicy] = useState(false);
    const [editingSource, setEditingSource] = useState(null); // 🔑 FIX
    const [expandedPolicy, setExpandedPolicy] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [policyToDelete, setPolicyToDelete] = useState(null);

    const [formData, setFormData] = useState({
        id: null,
        source: 'investment',
        type: 'Health',
        provider: '',
        policyNumber: '',
        coverageAmount: '',
        premiumAmount: '',
        startDate: '',
        endDate: '',
        status: '',
    });

    const policies = data?.policies || [];

    /* ---------------- Stats ---------------- */
    const stats = useMemo(() => {
        const safe = v => Number(v) || 0;

        const totalPolicies = policies.length;
        const totalCoverage = policies.reduce(
            (sum, p) => sum + safe(p.coverageAmount),
            0
        );
        const activePolicies = policies.filter(p => p.status === 'Active').length;

        const today = new Date();
        const sixtyDays = new Date(today.getTime() + 60 * 86400000);
        const expiringSoon = policies.filter(p => {
            if (!p.endDate) return false;
            const end = new Date(p.endDate);
            return end > today && end <= sixtyDays;
        }).length;

        return { totalPolicies, totalCoverage, activePolicies, expiringSoon };
    }, [policies]);

    /* ---------------- Helpers ---------------- */
    const formatCurrency = amount =>
        amount ? `₹${(Number(amount) / 100000).toFixed(0)}L` : '—';

    const calculateStatus = endDate => {
        if (!endDate) return '';
        const today = new Date();
        const end = new Date(endDate);
        const days = Math.floor((end - today) / 86400000);
        if (days < 0) return 'Expired';
        if (days <= 60) return 'Expiring Soon';
        return 'Active';
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    /* ---------------- Submit ---------------- */
    const handleSubmit = async () => {
        setIsSaving(true);

        const payload = {
            ...formData,
            coverageAmount: Number(formData.coverageAmount),
            premiumAmount: Number(formData.premiumAmount),
            status: calculateStatus(formData.endDate),
            updatedAt: new Date().toISOString(),
        };

        if (isEditingPolicy) {
            await onUpdate(payload); // ✅ SAME ID → UPDATE ONLY
        } else {
            await onAdd({
                ...payload,
                id: `policy_${Date.now()}`,
                source: 'investment',
                addedAt: new Date().toISOString(),
            });
        }

        resetForm();
        setIsSaving(false);
    };

    const resetForm = () => {
        setFormData({
            id: null,
            source: 'investment',
            type: 'Health',
            provider: '',
            policyNumber: '',
            coverageAmount: '',
            premiumAmount: '',
            startDate: '',
            endDate: '',
            status: '',
        });
        setEditingSource(null);
        setIsEditingPolicy(false);
        setIsFormModalOpen(false);
    };

    /* ---------------- UI ---------------- */
    return (
        <>
            <View style={styles.card}>
                <Pressable
                    style={styles.header}
                    onPress={() => !isSaving && setIsExpanded(!isExpanded)}
                >
                    <Text style={styles.title}>🛡️ Insurance Policies</Text>
                    <Text style={styles.subtitle}>Protect what matters</Text>
                </Pressable>

                <View style={styles.statsRow}>
                    <Stat label="Policies" value={stats.totalPolicies} />
                    <Stat label="Coverage" value={formatCurrency(stats.totalCoverage)} />
                    <Stat label="Active" value={stats.activePolicies} />
                    <Stat label="Expiring" value={stats.expiringSoon} />
                </View>

                {isExpanded && (
                    <View style={styles.body}>
                        {policies.length === 0 ? (
                            <Text style={styles.emptyText}>No policies added</Text>
                        ) : (
                            policies.map(policy => (
                                <Pressable
                                    key={policy.id}
                                    style={styles.policy}
                                    onPress={() =>
                                        setExpandedPolicy(
                                            expandedPolicy === policy.id ? null : policy.id
                                        )
                                    }
                                >
                                    <Text style={styles.policyTitle}>
                                        {policy.provider || 'Unnamed Policy'}
                                    </Text>
                                    <Text style={styles.policySub}>
                                        {formatCurrency(policy.coverageAmount)}
                                    </Text>

                                    {expandedPolicy === policy.id && (
                                        <>
                                            <Text>Type: {policy.type}</Text>
                                            <Text>Status: {policy.status}</Text>
                                            <Text>Policy #: {policy.policyNumber}</Text>
                                            <Text>Premium: ₹{policy.premiumAmount}/year</Text>
                                        </>
                                    )}

                                    <View style={styles.actionsRow}>
                                        <Pressable
                                            style={styles.editBtn}
                                            onPress={e => {
                                                e.stopPropagation();
                                                setFormData(policy);
                                                setEditingSource(policy.source); // 🔑 FIX
                                                setIsEditingPolicy(true);
                                                setIsFormModalOpen(true);
                                            }}
                                        >
                                            <Text style={styles.actionText}>Edit</Text>
                                        </Pressable>

                                        <Pressable
                                            style={styles.deleteBtn}
                                            onPress={e => {
                                                e.stopPropagation();
                                                setPolicyToDelete(policy);
                                                setDeleteModalOpen(true);
                                            }}
                                        >
                                            <Text style={styles.actionText}>Delete</Text>
                                        </Pressable>
                                    </View>
                                </Pressable>
                            ))
                        )}

                        <Pressable
                            style={styles.addBtn}
                            onPress={() => setIsFormModalOpen(true)}
                        >
                            <Text style={styles.addText}>➕ Add Policy</Text>
                        </Pressable>
                    </View>
                )}
            </View>

            {/* Add / Edit Modal */}
            <Modal visible={isFormModalOpen} transparent animationType="slide">
                <View style={styles.modal}>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {isEditingPolicy ? 'Edit Policy' : 'Add Policy'}
                        </Text>

                        {/* ✅ TYPE — ONLY FOR INVESTMENT */}
                        {!isEditingPolicy && (
                            <View style={{ marginBottom: 12 }}>
                                <Text style={styles.inputLabel}>Policy Type</Text>
                                <View style={styles.typeRow}>
                                    {['Health', 'Life', 'Motor', 'Home', 'Travel', 'Other'].map(t => (
                                        <Pressable
                                            key={t}
                                            style={[
                                                styles.typeChip,
                                                formData.type === t && styles.typeChipActive,
                                            ]}
                                            onPress={() => handleChange('type', t)}
                                        >
                                            <Text
                                                style={[
                                                    styles.typeChipText,
                                                    formData.type === t && styles.typeChipTextActive,
                                                ]}
                                            >
                                                {t}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        )}

                        <Input label="Provider" value={formData.provider} onChange={v => handleChange('provider', v)} />
                        <Input label="Policy Number" value={formData.policyNumber} onChange={v => handleChange('policyNumber', v)} />
                        <Input label="Coverage Amount" keyboardType="numeric" value={String(formData.coverageAmount)} onChange={v => handleChange('coverageAmount', v)} />
                        <Input label="Premium Amount (₹)" keyboardType="numeric" value={String(formData.premiumAmount)} onChange={v => handleChange('premiumAmount', v)} />
                        <Input label="Start Date (YYYY-MM-DD)" value={formData.startDate} onChange={v => handleChange('startDate', v)} />
                        <Input label="End Date (YYYY-MM-DD)" value={formData.endDate} onChange={v => handleChange('endDate', v)} />

                        <Pressable style={styles.saveBtn} onPress={handleSubmit}>
                            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
                        </Pressable>

                        <Pressable onPress={resetForm}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                    </ScrollView>
                </View>
            </Modal>

            {/* Delete Modal */}
            <Modal visible={deleteModalOpen} transparent animationType="fade">
                <View style={styles.modal}>
                    <View style={styles.confirmBox}>
                        <Text style={styles.modalTitle}>Delete Policy?</Text>
                        <Pressable
                            style={styles.deleteConfirm}
                            onPress={async () => {
                                await onDelete(policyToDelete);
                                setDeleteModalOpen(false);
                            }}
                        >
                            <Text style={{ color: '#fff' }}>Delete</Text>
                        </Pressable>
                        <Pressable onPress={() => setDeleteModalOpen(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </>
    );
};

/* ---------------- Helpers ---------------- */
const Stat = ({ label, value }) => (
    <View style={styles.stat}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

const Input = ({ label, value, onChange, ...props }) => (
    <View style={{ marginBottom: 12 }}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput value={value} onChangeText={onChange} style={styles.input} {...props} />
    </View>
);

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
    card: { backgroundColor: '#111827', borderRadius: 16, padding: 16, marginBottom: 16 },
    header: { marginBottom: 12 },
    title: { color: '#fff', fontSize: 18, fontWeight: '700' },
    subtitle: { color: '#9ca3af' },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    stat: { flex: 1, backgroundColor: '#1f2937', padding: 8, borderRadius: 8 },
    statLabel: { color: '#9ca3af', fontSize: 12 },
    statValue: { color: '#fff', fontSize: 16, fontWeight: '700' },
    body: { marginTop: 12 },
    emptyText: { color: '#9ca3af', textAlign: 'center', marginVertical: 20 },
    policy: { backgroundColor: '#1f2937', borderRadius: 12, padding: 12, marginBottom: 8 },
    policyTitle: { color: '#fff', fontWeight: '700' },
    policySub: { color: '#9ca3af', marginBottom: 6 },
    actionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    editBtn: { flex: 1, backgroundColor: '#4f46e5', padding: 8, borderRadius: 8 },
    deleteBtn: { flex: 1, backgroundColor: '#ef4444', padding: 8, borderRadius: 8 },
    actionText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
    addBtn: { marginTop: 12, backgroundColor: '#6c50c4', padding: 12, borderRadius: 12 },
    addText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
    modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' },
    modalContent: { backgroundColor: '#111827', margin: 16, borderRadius: 16, padding: 16 },
    modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
    inputLabel: { color: '#9ca3af', marginBottom: 4 },
    input: { backgroundColor: '#1f2937', color: '#fff', padding: 12, borderRadius: 8 },
    saveBtn: { backgroundColor: '#6c50c4', padding: 14, borderRadius: 12, marginTop: 12 },
    saveText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
    cancelText: { color: '#9ca3af', textAlign: 'center', marginTop: 12 },
    confirmBox: { backgroundColor: '#111827', margin: 32, padding: 24, borderRadius: 16 },
    deleteConfirm: { backgroundColor: '#ef4444', padding: 12, borderRadius: 12, marginTop: 12, alignItems: 'center' },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' },
    typeChipActive: { backgroundColor: '#6c50c4', borderColor: '#6c50c4' },
    typeChipText: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
    typeChipTextActive: { color: '#fff' },
});

export default InsuranceCard;
