// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
// import { useEffect, useMemo, useState } from 'react';
// import {
//     ActivityIndicator,
//     Modal,
//     ScrollView,
//     StyleSheet,
//     Text,
//     View,
// } from 'react-native';

// import { db } from '../../../src/config/firebase';

// import FixedDepositCard from '../../../src/components/Investment/FixedDepositCard';
// import InsuranceCard from '../../../src/components/Investment/InsuranceCard';
// import OtherInvestmentsCard from '../../../src/components/Investment/OtherInvestmentsCard';
// import StockMFCard from '../../../src/components/Investment/StockMFCard';

// const Insurance = () => {
//     const [userData, setUserData] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     /* ---------------- Fetch user ---------------- */
//     useEffect(() => {
//         (async () => {
//             try {
//                 setLoading(true);
//                 const phone = await AsyncStorage.getItem('user_phone');
//                 const snap = await getDoc(doc(db, 'questionnaire_submissions', phone));
//                 if (!snap.exists()) throw new Error('User not found');
//                 setUserData(snap.data());
//             } catch (e) {
//                 setError(e.message);
//             } finally {
//                 setLoading(false);
//             }
//         })();
//     }, []);

//     /* ---------------- Normalize insurance ---------------- */
//     const normalizeQuestionnaireInsurance = (insuranceData = {}) => {
//         return Object.entries(insuranceData)
//             .filter(([, v]) => v?.has)
//             .map(([key, v]) => ({
//                 id: `q_${key}`,
//                 source: 'questionnaire',
//                 questionnaireKey: key,
//                 type: key.charAt(0).toUpperCase() + key.slice(1),
//                 provider: v.provider || '',
//                 policyNumber: v.policy_number || '',
//                 coverageAmount: v.sum_insured ? v.sum_insured * 1000 : '',
//                 premiumAmount: v.premium ? v.premium * 1000 : '',
//                 startDate: v.start_date || '',
//                 endDate: v.end_date || '',
//                 status: v.status || '',
//             }));
//     };

//     const normalizeInvestmentInsurance = (insurance = {}) =>
//         (insurance.policies || []).map(p => ({
//             ...p,
//             source: 'investment',
//         }));

//     /* ---------------- Combined data ---------------- */
//     const investmentData = useMemo(() => {
//         if (!userData) return {};
//         const investments = userData.investments || {};

//         return {
//             insurance: {
//                 policies: [
//                     ...normalizeQuestionnaireInsurance(userData.insurance_data),
//                     ...normalizeInvestmentInsurance(investments.insurance || {}),
//                 ],
//             },
//             stocksMF: investments.stocksMF || { holdings: [] },
//             fixedDeposits: investments.fixedDeposits || { deposits: [] },
//             other: investments.other || { assets: [] },
//         };
//     }, [userData]);

//     const refreshUser = async () => {
//         const phone = await AsyncStorage.getItem('user_phone');
//         const snap = await getDoc(doc(db, 'users', phone));
//         setUserData(snap.data());
//     };

//     /* ---------------- Insurance CRUD ---------------- */

//     const handleAddInsurancePolicy = async (policy) => {
//         const phone = await AsyncStorage.getItem('user_phone');

//         const cleanPolicy = {
//             ...policy,
//             id: `ins_${Date.now()}`,
//             source: 'investment',
//         };

//         await updateDoc(doc(db, 'users', phone), {
//             'investments.insurance.policies': arrayUnion(cleanPolicy),
//             'investments.insurance.lastUpdated': new Date().toISOString(),
//         });

//         await refreshUser();
//         return { success: true };
//     };

//     const handleUpdateInsurancePolicy = async (policy) => {
//         const phone = await AsyncStorage.getItem('user_phone');
//         const ref = doc(db, 'users', phone);

//         if (policy.source === 'questionnaire') {
//             await updateDoc(ref, {
//                 [`insurance_data.${policy.questionnaireKey}`]: {
//                     has: true,
//                     provider: policy.provider,
//                     policy_number: policy.policyNumber,
//                     sum_insured: policy.coverageAmount
//                         ? policy.coverageAmount / 1000
//                         : '',
//                     premium: policy.premiumAmount
//                         ? policy.premiumAmount / 1000
//                         : '',
//                     start_date: policy.startDate,
//                     end_date: policy.endDate,
//                     status: policy.status,
//                 },
//             });
//         } else {
//             const updated = userData.investments.insurance.policies.map(p =>
//                 p.id === policy.id ? { ...policy, source: 'investment' } : p
//             );

//             await updateDoc(ref, {
//                 'investments.insurance.policies': updated,
//                 'investments.insurance.lastUpdated': new Date().toISOString(),
//             });
//         }

//         await refreshUser();
//         return { success: true };
//     };

//     const handleDeleteInsurancePolicy = async (policy) => {
//         const phone = await AsyncStorage.getItem('user_phone');
//         const ref = doc(db, 'users', phone);

//         if (policy.source === 'questionnaire') {
//             await updateDoc(ref, {
//                 [`insurance_data.${policy.questionnaireKey}.has`]: false,
//             });
//         } else {
//             await updateDoc(ref, {
//                 'investments.insurance.policies': arrayRemove(policy),
//             });
//         }

//         await refreshUser();
//         return { success: true };
//     };

//     /* ---------------- Stocks & MF CRUD ---------------- */

//     const handleAddInvestment = async (type, item) => {
//         const phone = await AsyncStorage.getItem('user_phone');
//         const ref = doc(db, 'users', phone);

//         const keyMap = {
//             stocksMF: 'holdings',
//             fixedDeposits: 'deposits',
//             other: 'assets',
//         };

//         await updateDoc(ref, {
//             [`investments.${type}.${keyMap[type]}`]: arrayUnion(item),
//             [`investments.${type}.lastUpdated`]: new Date().toISOString(),
//         });

//         await refreshUser();
//         return { success: true };
//     };

//     const handleUpdateInvestment = async (type, updatedItem) => {
//         const phone = await AsyncStorage.getItem('user_phone');
//         const ref = doc(db, 'users', phone);

//         const keyMap = {
//             stocksMF: 'holdings',
//             fixedDeposits: 'deposits',
//             other: 'assets',
//         };

//         const current =
//             userData?.investments?.[type]?.[keyMap[type]] || [];

//         const updated = current.map(item =>
//             item.id === updatedItem.id ? updatedItem : item
//         );

//         await updateDoc(ref, {
//             [`investments.${type}.${keyMap[type]}`]: updated,
//             [`investments.${type}.lastUpdated`]: new Date().toISOString(),
//         });

//         await refreshUser();
//         return { success: true };
//     };

//     const handleDeleteInvestment = async (type, item) => {
//         const phone = await AsyncStorage.getItem('user_phone');
//         const ref = doc(db, 'users', phone);

//         const keyMap = {
//             stocksMF: 'holdings',
//             fixedDeposits: 'deposits',
//             other: 'assets',
//         };

//         await updateDoc(ref, {
//             [`investments.${type}.${keyMap[type]}`]: arrayRemove(item),
//         });

//         await refreshUser();
//         return { success: true };
//     };


//     /* ---------------- UI ---------------- */
//     if (loading) {
//         return (
//             <Modal transparent visible>
//                 <View style={styles.loadingModal}>
//                     <ActivityIndicator size="large" color="#a855f7" />
//                     <Text style={styles.loadingText}>Loading Insurance</Text>
//                 </View>
//             </Modal>
//         );
//     }

//     if (error) {
//         return (
//             <View style={styles.errorBox}>
//                 <Text style={styles.errorTitle}>Error</Text>
//                 <Text style={styles.errorText}>{error}</Text>
//             </View>
//         );
//     }

//     return (
//         <ScrollView style={styles.container}>
//             <InsuranceCard
//                 data={investmentData.insurance}
//                 onAdd={handleAddInsurancePolicy}
//                 onUpdate={handleUpdateInsurancePolicy}
//                 onDelete={handleDeleteInsurancePolicy}
//             />

//             <StockMFCard
//                 data={investmentData.stocksMF}
//                 onAdd={(h) => handleAddInvestment('stocksMF', h)}
//                 onUpdate={(h) => handleUpdateInvestment('stocksMF', h)}
//                 onDelete={(h) => handleDeleteInvestment('stocksMF', h)}
//             />

//             <FixedDepositCard
//                 data={investmentData.fixedDeposits}
//                 onAdd={(fd) => handleAddInvestment('fixedDeposits', fd)}
//                 onUpdate={(fd) => handleUpdateInvestment('fixedDeposits', fd)}
//                 onDelete={(fd) => handleDeleteInvestment('fixedDeposits', fd)}
//             />

//             <OtherInvestmentsCard
//                 data={investmentData.other}
//                 onAdd={(a) => handleAddInvestment('other', a)}
//                 onUpdate={(a) => handleUpdateInvestment('other', a)}
//                 onDelete={(a) => handleDeleteInvestment('other', a)}
//             />


//             <View style={{ height: 100 }} />
//         </ScrollView>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#000', padding: 16 },
//     loadingModal: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//     loadingText: { color: '#fff', marginTop: 10 },
//     errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//     errorTitle: { color: 'red', fontSize: 18 },
//     errorText: { color: '#fff' },
// });

// export default Insurance;


// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
// import { useEffect, useMemo, useState } from 'react';
// import {
//     ActivityIndicator,
//     Modal,
//     ScrollView,
//     StyleSheet,
//     Text,
//     View,
// } from 'react-native';

// import { db } from '../../../src/config/firebase';

// import FixedDepositCard from '../../../src/components/Investment/FixedDepositCard';
// import InsuranceCard from '../../../src/components/Investment/InsuranceCard';
// import OtherInvestmentsCard from '../../../src/components/Investment/OtherInvestmentsCard';
// import StockMFCard from '../../../src/components/Investment/StockMFCard';

// const COLLECTION = 'questionnaire_submissions';

// const Insurance = () => {
//     const [userData, setUserData] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     /* ---------------- Fetch user ---------------- */
//     const fetchUser = async () => {
//         const phone = await AsyncStorage.getItem('user_phone');
//         const snap = await getDoc(doc(db, COLLECTION, phone));
//         if (!snap.exists()) throw new Error('User not found');
//         return snap.data();
//     };

//     useEffect(() => {
//         (async () => {
//             try {
//                 setLoading(true);
//                 setUserData(await fetchUser());
//             } catch (e) {
//                 setError(e.message);
//             } finally {
//                 setLoading(false);
//             }
//         })();
//     }, []);

//     const refreshUser = async () => {
//         try {
//             setUserData(await fetchUser());
//         } catch (e) {
//             console.error('refreshUser error:', e);
//         }
//     };

//     /* ---------------- Normalize insurance ---------------- */
//     // insurance_data lives at raw_answers.insurance_data in the DB
//     const normalizeQuestionnaireInsurance = (insuranceData = {}) => {
//         return Object.entries(insuranceData)
//             .filter(([, v]) => v?.has)
//             .map(([key, v]) => ({
//                 id: `q_${key}`,
//                 source: 'questionnaire',
//                 questionnaireKey: key,
//                 // capitalize first letter: "health" → "Health"
//                 type: key.charAt(0).toUpperCase() + key.slice(1),
//                 provider: v.provider || '',
//                 policyNumber: v.policy_number || '',
//                 // DB stores values in thousands as strings e.g. "200" means ₹2,00,000
//                 coverageAmount: v.sum_insured ? parseFloat(v.sum_insured) * 1000 : 0,
//                 premiumAmount:  v.premium     ? parseFloat(v.premium)     * 1000 : 0,
//                 startDate: v.start_date || '',
//                 endDate:   v.end_date   || '',
//                 status:    v.status     || 'Active',
//             }));
//     };

//     const normalizeInvestmentInsurance = (insurance = {}) =>
//         (insurance.policies || []).map(p => ({ ...p, source: 'investment' }));

//     /* ---------------- Combined data ---------------- */
//     const investmentData = useMemo(() => {
//         if (!userData) return {};

//         // insurance_data is under raw_answers
//         const rawAnswers  = userData.raw_answers   || {};
//         const investments = userData.investments    || {};

//         return {
//             insurance: {
//                 policies: [
//                     ...normalizeQuestionnaireInsurance(rawAnswers.insurance_data),
//                     ...normalizeInvestmentInsurance(investments.insurance || {}),
//                 ],
//             },
//             stocksMF:      investments.stocksMF      || { holdings: [] },
//             fixedDeposits: investments.fixedDeposits || { deposits: [] },
//             other:         investments.other         || { assets: [] },
//         };
//     }, [userData]);

//     /* ---------------- Insurance CRUD ---------------- */
//     const handleAddInsurancePolicy = async (policy) => {
//         try {
//             const phone = await AsyncStorage.getItem('user_phone');
//             const cleanPolicy = { ...policy, id: `ins_${Date.now()}`, source: 'investment' };

//             await updateDoc(doc(db, COLLECTION, phone), {
//                 'investments.insurance.policies': arrayUnion(cleanPolicy),
//                 'investments.insurance.lastUpdated': new Date().toISOString(),
//             });

//             await refreshUser();
//             return { success: true };
//         } catch (e) {
//             console.error('handleAddInsurancePolicy:', e);
//             return { success: false, error: e.message };
//         }
//     };

//     const handleUpdateInsurancePolicy = async (policy) => {
//         try {
//             const phone = await AsyncStorage.getItem('user_phone');
//             const ref   = doc(db, COLLECTION, phone);

//             if (policy.source === 'questionnaire') {
//                 // Update directly inside raw_answers.insurance_data
//                 await updateDoc(ref, {
//                     [`raw_answers.insurance_data.${policy.questionnaireKey}`]: {
//                         has:         true,
//                         provider:    policy.provider,
//                         policy_number: policy.policyNumber,
//                         // store back as thousands string to match DB format
//                         sum_insured: policy.coverageAmount ? String(policy.coverageAmount / 1000) : '',
//                         premium:     policy.premiumAmount  ? String(policy.premiumAmount  / 1000) : '',
//                         start_date:  policy.startDate,
//                         end_date:    policy.endDate,
//                         status:      policy.status,
//                     },
//                 });
//             } else {
//                 const current = userData?.investments?.insurance?.policies || [];
//                 const updated = current.map(p =>
//                     p.id === policy.id ? { ...policy, source: 'investment' } : p
//                 );
//                 await updateDoc(ref, {
//                     'investments.insurance.policies': updated,
//                     'investments.insurance.lastUpdated': new Date().toISOString(),
//                 });
//             }

//             await refreshUser();
//             return { success: true };
//         } catch (e) {
//             console.error('handleUpdateInsurancePolicy:', e);
//             return { success: false, error: e.message };
//         }
//     };

//     const handleDeleteInsurancePolicy = async (policy) => {
//         try {
//             const phone = await AsyncStorage.getItem('user_phone');
//             const ref   = doc(db, COLLECTION, phone);

//             if (policy.source === 'questionnaire') {
//                 await updateDoc(ref, {
//                     [`raw_answers.insurance_data.${policy.questionnaireKey}.has`]: false,
//                     [`raw_answers.insurance_data.${policy.questionnaireKey}.premium`]: "0",
//                     [`raw_answers.insurance_data.${policy.questionnaireKey}.sum_insured`]: "0",
//                 });
//             } else {
//                 await updateDoc(ref, {
//                     'investments.insurance.policies': arrayRemove(policy),
//                 });
//             }

//             await refreshUser();
//             return { success: true };
//         } catch (e) {
//             console.error('handleDeleteInsurancePolicy:', e);
//             return { success: false, error: e.message };
//         }
//     };

//     /* ---------------- Stocks, FD, Other CRUD ---------------- */
//     const KEY_MAP = { stocksMF: 'holdings', fixedDeposits: 'deposits', other: 'assets' };

//     const handleAddInvestment = async (type, item) => {
//         try {
//             const phone = await AsyncStorage.getItem('user_phone');
//             await updateDoc(doc(db, COLLECTION, phone), {
//                 [`investments.${type}.${KEY_MAP[type]}`]: arrayUnion(item),
//                 [`investments.${type}.lastUpdated`]: new Date().toISOString(),
//             });
//             await refreshUser();
//             return { success: true };
//         } catch (e) {
//             return { success: false, error: e.message };
//         }
//     };

//     const handleUpdateInvestment = async (type, updatedItem) => {
//         try {
//             const phone   = await AsyncStorage.getItem('user_phone');
//             const current = userData?.investments?.[type]?.[KEY_MAP[type]] || [];
//             const updated = current.map(i => i.id === updatedItem.id ? updatedItem : i);
//             await updateDoc(doc(db, COLLECTION, phone), {
//                 [`investments.${type}.${KEY_MAP[type]}`]: updated,
//                 [`investments.${type}.lastUpdated`]: new Date().toISOString(),
//             });
//             await refreshUser();
//             return { success: true };
//         } catch (e) {
//             return { success: false, error: e.message };
//         }
//     };

//     const handleDeleteInvestment = async (type, item) => {
//         try {
//             const phone = await AsyncStorage.getItem('user_phone');
//             await updateDoc(doc(db, COLLECTION, phone), {
//                 [`investments.${type}.${KEY_MAP[type]}`]: arrayRemove(item),
//             });
//             await refreshUser();
//             return { success: true };
//         } catch (e) {
//             return { success: false, error: e.message };
//         }
//     };

//     /* ---------------- UI ---------------- */
//     if (loading) {
//         return (
//             <Modal transparent visible>
//                 <View style={styles.loadingModal}>
//                     <ActivityIndicator size="large" color={PURPLE} />
//                     <Text style={styles.loadingText}>Loading Investments…</Text>
//                 </View>
//             </Modal>
//         );
//     }

//     if (error) {
//         return (
//             <View style={styles.errorBox}>
//                 <Text style={styles.errorTitle}>Error</Text>
//                 <Text style={styles.errorText}>{error}</Text>
//             </View>
//         );
//     }

//     return (
//         <ScrollView style={styles.container}>
//             <InsuranceCard
//                 data={investmentData.insurance}
//                 onAdd={handleAddInsurancePolicy}
//                 onUpdate={handleUpdateInsurancePolicy}
//                 onDelete={handleDeleteInsurancePolicy}
//             />

//             <StockMFCard
//                 data={investmentData.stocksMF}
//                 onAdd={(h)  => handleAddInvestment('stocksMF', h)}
//                 onUpdate={(h)  => handleUpdateInvestment('stocksMF', h)}
//                 onDelete={(h)  => handleDeleteInvestment('stocksMF', h)}
//             />

//             <FixedDepositCard
//                 data={investmentData.fixedDeposits}
//                 onAdd={(fd) => handleAddInvestment('fixedDeposits', fd)}
//                 onUpdate={(fd) => handleUpdateInvestment('fixedDeposits', fd)}
//                 onDelete={(fd) => handleDeleteInvestment('fixedDeposits', fd)}
//             />

//             <OtherInvestmentsCard
//                 data={investmentData.other}
//                 onAdd={(a)  => handleAddInvestment('other', a)}
//                 onUpdate={(a)  => handleUpdateInvestment('other', a)}
//                 onDelete={(a)  => handleDeleteInvestment('other', a)}
//             />

//             <View style={{ height: 100 }} />
//         </ScrollView>
//     );
// };

// const PURPLE = 'rgb(108,80,196)';

// const styles = StyleSheet.create({
//     container:    { flex: 1, backgroundColor: '#000', padding: 16 },
//     loadingModal: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
//     loadingText:  { color: '#fff', marginTop: 12, fontSize: 14 },
//     errorBox:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
//     errorTitle:   { color: '#ef4444', fontSize: 18, fontWeight: '700', marginBottom: 8 },
//     errorText:    { color: '#9ca3af', textAlign: 'center' },
// });

// export default Insurance;

/**
 * Asset Holdings Screen — GoWealthy
 * File: app/(gowealthy)/investments/index.jsx
 *
 * Tab structure:
 *   Row 1 — Member filter:  All · You · [family members]
 *   Row 2 — Asset class:    Stocks · Mutual Funds · Insurance · Fixed Deposits · Others
 *   Row 3 — Cap sub-tab:    All · Large Cap · Mid Cap · Small Cap  (Stocks only)
 *
 * Every asset type has edit + delete via bottom sheet.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef, forwardRef, useImperativeHandle, createRef, } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    StyleSheet, StatusBar, Platform, ActivityIndicator,
    Modal, TextInput, Switch, Dimensions, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../src/config/firebase';
import DateTimePicker from '@react-native-community/datetimepicker';
// import Toast from 'react-native-toast-message';
import {
    ChevronDown, Plus, X, Check, Edit2, Trash2,
    AlertTriangle, Calendar, Shield, Heart, Car,
    Home, Landmark, TrendingUp, Coins, Users,
} from 'lucide-react-native';

const COLL = 'questionnaire_submissions';

// ── Tokens ─────────────────────────────────────────────────────────────────────
const T = {
    bg: '#0B0C10',
    orange: '#FF7E40',
    purple: '#A64BFF',
    white: '#FFFFFF',
    dim: 'rgba(255,255,255,0.55)',
    faint: 'rgba(255,255,255,0.18)',
    green: '#4CAF50',
    red: '#F44336',
    amber: '#f59e0b',
    glass: 'rgba(14,14,22,0.96)',
    card: 'rgba(18,18,28,0.97)',
    border: 'rgba(255,255,255,0.08)',
};

// ── Custom Toast ───────────────────────────────────────────────────────────────
// import { useImperativeHandle, forwardRef } from 'react';
import { Animated } from 'react-native';

const ToastRef = React.createRef();

export const showToast = (type, title, subtitle) => {
    ToastRef.current?.show(type, title, subtitle);
};

const TOAST_ICONS = { success: '✦', error: '✕', info: '◈' };
const TOAST_COLORS = {
    success: T.green,
    error: T.red,
    info: T.purple,
};

const CustomToast = forwardRef((_, ref) => {
    const [toast, setToast] = useState(null);
    const translateY = useRef(new Animated.Value(-120)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timerRef = useRef(null);

    useImperativeHandle(ref, () => ({
        show: (type, title, subtitle) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setToast({ type, title, subtitle });

            // Slide in
            Animated.parallel([
                Animated.timing(translateY, { toValue: 0, duration: 380, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
            ]).start();

            // Auto dismiss after 3s
            timerRef.current = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(translateY, { toValue: -120, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }),
                ]).start(() => setToast(null));
            }, 3000);
        },
    }));

    if (!toast) return null;

    const col = TOAST_COLORS[toast.type] || T.purple;

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                ct.wrap,
                { transform: [{ translateY }], opacity },
            ]}
        >
            <LinearGradient
                colors={['rgba(166,75,255,0.55)', 'rgba(255,126,64,0.55)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={ct.gradBorder}
            >
                <View style={ct.inner}>
                    {/* Left accent bar */}
                    <View style={[ct.accentBar, { backgroundColor: col }]} />

                    {/* Icon */}
                    <View style={[ct.iconWrap, { backgroundColor: `${col}18`, borderColor: `${col}35` }]}>
                        <Text style={[ct.icon, { color: col }]}>{TOAST_ICONS[toast.type]}</Text>
                    </View>

                    {/* Text */}
                    <View style={{ flex: 1 }}>
                        <Text style={ct.title} numberOfLines={1}>{toast.title}</Text>
                        {!!toast.subtitle && (
                            <Text style={ct.subtitle} numberOfLines={2}>{toast.subtitle}</Text>
                        )}
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );
});

const ct = StyleSheet.create({
    wrap: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 58 : 44,
        left: 20, right: 20,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    gradBorder: {
        borderRadius: 18,
        padding: 1.5,
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(10,10,18,0.97)',
        borderRadius: 17,
        overflow: 'hidden',
        paddingVertical: 14,
        paddingRight: 16,
        gap: 12,
    },
    accentBar: {
        width: 3,
        alignSelf: 'stretch',
        borderRadius: 2,
        marginLeft: 2,
    },
    iconWrap: {
        width: 34, height: 34, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
    },
    icon: { fontSize: 14, fontWeight: '800' },
    title: { fontSize: 14, fontWeight: '700', color: T.white, fontFamily: 'Syne_700Bold ', marginBottom: 2 },
    subtitle: { fontSize: 12, color: T.dim, lineHeight: 16 },
});
// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n) => {
    if (!n && n !== 0) return '₹0';
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${Number(n).toLocaleString('en-IN')}`;
};
const fmtDate = (s) => {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const toDS = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};
const daysLeft = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
const insStatus = (e) => {
    const d = daysLeft(e);
    if (d < 0) return { label: 'Expired', color: T.red };
    if (d <= 60) return { label: 'Expiring Soon', color: T.amber };
    return { label: 'Active', color: T.green };
};
const fdStatus = (m) => {
    const d = daysLeft(m);
    if (d < 0) return { label: 'Matured', color: T.dim };
    if (d <= 30) return { label: 'Maturing Soon', color: T.amber };
    return { label: 'Active', color: T.green };
};
const calcMaturity = (p, r, s, e, freq) => {
    if (!p || !r || !s || !e) return 0;
    const yrs = (new Date(e) - new Date(s)) / (365 * 86400000);
    const n = { Monthly: 12, Quarterly: 4, 'Half-Yearly': 2, Annually: 1 }[freq] || 4;
    return Math.round(p * Math.pow(1 + (r / 100) / n, n * yrs));
};
const normalizeQIns = (d = {}) =>
    Object.entries(d).filter(([, v]) => v?.has).map(([key, v]) => ({
        id: `q_${key}`, source: 'questionnaire', questionnaireKey: key,
        type: key.charAt(0).toUpperCase() + key.slice(1),
        provider: v.provider || '', policyNumber: v.policy_number || '',
        coverageAmount: v.sum_insured ? parseFloat(v.sum_insured) * 1000 : 0,
        premiumAmount: v.premium ? parseFloat(v.premium) * 1000 : 0,
        startDate: v.start_date || '', endDate: v.end_date || '',
        status: v.status || 'Active', memberId: null,
    }));

// ── Glassify wrapper ───────────────────────────────────────────────────────────
const Glassify = ({ children, style, innerStyle, radius = 16, bw = 1.5 }) => (
    <LinearGradient
        colors={['rgba(166,75,255,0.70)', 'rgba(255,126,64,0.70)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[{ borderRadius: radius, padding: bw }, style]}
    >
        <View style={[{ borderRadius: radius - bw, backgroundColor: T.glass, overflow: 'hidden' }, innerStyle]}>
            {children}
        </View>
    </LinearGradient>
);

// ── Bottom Sheet ───────────────────────────────────────────────────────────────
const Sheet = ({ visible, onClose, title, children, footer }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={bs.overlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
            <View style={bs.sheet}>
                <View style={bs.handle} />
                <View style={bs.hdr}>
                    <Text style={bs.title}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={bs.close}><X size={18} color={T.dim} /></TouchableOpacity>
                </View>
                <ScrollView style={bs.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {children}
                    <View style={{ height: 28 }} />
                </ScrollView>
                {footer && <View style={bs.footer}>{footer}</View>}
            </View>
        </View>
    </Modal>
);
const bs = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.80)' },
    sheet: { backgroundColor: '#0d0d16', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '93%', paddingBottom: Platform.OS === 'ios' ? 34 : 16, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: T.border },
    handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'center', marginTop: 14, marginBottom: 4 },
    hdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: T.border },
    title: { fontSize: 17, fontWeight: '700', color: T.white, fontFamily: 'Syne' },
    close: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: 24 },
    footer: { paddingHorizontal: 24, paddingTop: 14, borderTopWidth: 1, borderTopColor: T.border },
});

// ── Form helpers ───────────────────────────────────────────────────────────────
const FL = ({ t, req }) => (
    <Text style={fh.lbl}>{t}{req && <Text style={{ color: T.red }}> *</Text>}</Text>
);
const FI = (props) => (
    <TextInput style={fh.inp} placeholderTextColor="rgba(255,255,255,0.20)" selectionColor={T.purple} {...props} />
);
const FDateBtn = ({ label, value, onPress }) => (
    <TouchableOpacity style={[fh.inp, { flexDirection: 'row', alignItems: 'center', gap: 8 }]} onPress={onPress}>
        <Calendar size={14} color={T.dim} />
        <Text style={{ color: value ? T.white : 'rgba(255,255,255,0.20)', fontSize: 15 }}>
            {value ? fmtDate(value) : label}
        </Text>
    </TouchableOpacity>
);
const fh = StyleSheet.create({
    lbl: { fontSize: 11, fontWeight: '600', color: T.dim, marginBottom: 6, marginTop: 18, letterSpacing: 1.0, textTransform: 'uppercase' },
    inp: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: T.white },
});

// ── Sheet footer buttons ───────────────────────────────────────────────────────
const SheetFooter = ({ onCancel, onSubmit, saving, label }) => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity style={sf.cancel} onPress={onCancel} disabled={saving}>
            <Text style={sf.cancelT}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[sf.submit, saving && { opacity: 0.5 }]} onPress={onSubmit} disabled={saving}>
            <LinearGradient colors={[T.purple, T.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={sf.submitT}>{label}</Text>}
        </TouchableOpacity>
    </View>
);
const sf = StyleSheet.create({
    cancel: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: T.border },
    cancelT: { color: T.white, fontWeight: '600', fontSize: 15 },
    submit: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    submitT: { color: T.white, fontWeight: '700', fontSize: 15 },
});

// ── Delete sheet ───────────────────────────────────────────────────────────────
const DeleteSheet = ({ visible, onClose, name, onConfirm, saving }) => (
    <Sheet visible={visible} onClose={onClose} title="Confirm Delete">
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <View style={ds.icon}><AlertTriangle size={28} color={T.red} /></View>
            <Text style={ds.title}>Delete this?</Text>
            <Text style={ds.sub}><Text style={{ color: T.white, fontWeight: '700' }}>{name}</Text>{'\n'}This cannot be undone.</Text>
            <TouchableOpacity style={[ds.btn, saving && { opacity: 0.6 }]} onPress={onConfirm} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={ds.btnT}>Yes, Delete</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={ds.cancel} onPress={onClose} disabled={saving}>
                <Text style={ds.cancelT}>Cancel</Text>
            </TouchableOpacity>
        </View>
    </Sheet>
);
const ds = StyleSheet.create({
    icon: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(244,67,54,0.12)', borderWidth: 1, borderColor: 'rgba(244,67,54,0.28)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    title: { fontSize: 20, fontWeight: '800', color: T.white, marginBottom: 8, fontFamily: 'Syne' },
    sub: { fontSize: 13, color: T.dim, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
    btn: { width: '100%', backgroundColor: T.red, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
    btnT: { color: T.white, fontWeight: '700', fontSize: 15 },
    cancel: { width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    cancelT: { color: T.white, fontWeight: '600', fontSize: 15 },
});

// ── Member picker (in forms) ───────────────────────────────────────────────────
const MemberPicker = ({ members, value, onChange }) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
        {[{ id: null, name: 'You (Self)' }, ...members].map(m => {
            const active = value === m.id;
            return (
                <TouchableOpacity key={m.id ?? 'self'} style={[mp.pill, active && mp.active]} onPress={() => onChange(m.id)}>
                    <Text style={[mp.text, active && { color: T.white }]}>{m.name}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
);
const mp = StyleSheet.create({
    pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: T.border },
    active: { backgroundColor: 'rgba(166,75,255,0.18)', borderColor: 'rgba(166,75,255,0.45)' },
    text: { fontSize: 13, color: T.dim, fontWeight: '600' },
});

// ── FAB ────────────────────────────────────────────────────────────────────────
const FAB = ({ label, onPress }) => (
    <View style={fab.wrap} pointerEvents="box-none">
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
            <Glassify radius={28} bw={1.5} style={{ alignSelf: 'center' }}>
                <View style={fab.inner}>
                    <Plus size={15} color={T.white} />
                    <Text style={fab.text}>{label}</Text>
                </View>
            </Glassify>
        </TouchableOpacity>
    </View>
);
const fab = StyleSheet.create({
    wrap: { position: 'absolute', bottom: 110, left: 0, right: 0, alignItems: 'center' },
    inner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 30, paddingVertical: 13 },
    text: { fontSize: 14, fontWeight: '700', color: T.white, fontFamily: 'Syne' },
});

// ── Picker sheet row ───────────────────────────────────────────────────────────
const PkRow = ({ label, active, onPress, icon, iconEl }) => (
    <TouchableOpacity style={[pk.row, active && pk.active]} onPress={onPress}>
        {iconEl ? iconEl : !!icon && <Text style={pk.emoji}>{icon}</Text>}
        <Text style={[pk.label, active && { color: T.white }]}>{label}</Text>
        {active && <Check size={16} color={T.purple} />}
    </TouchableOpacity>
);
const pk = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 4, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', marginBottom: 4 },
    active: { backgroundColor: 'rgba(166,75,255,0.14)', borderColor: 'rgba(166,75,255,0.40)' },
    emoji: { fontSize: 20, width: 30, textAlign: 'center' },
    label: { flex: 1, fontSize: 15, color: T.dim },
});

// ── Static data ────────────────────────────────────────────────────────────────
const INS_ICONS = { Health: Heart, Life: Shield, Auto: Car, Home };
const INS_COLORS = { Health: '#F44336', Life: T.purple, Auto: '#3b82f6', Home: T.green };
const INS_TYPES = ['Health', 'Life', 'Auto', 'Home'];
const FD_FREQS = ['Monthly', 'Quarterly', 'Half-Yearly', 'Annually'];
const OTHER_TYPES = ['Gold', 'Silver', 'Real Estate', 'Bonds', 'PPF', 'EPF', 'NPS', 'Crypto', 'P2P Lending', 'Commodities', 'Art & Collectibles', 'Other'];
const OTHER_ICON = { Gold: '🪙', Silver: '⚪', 'Real Estate': '🏢', Bonds: '📜', PPF: '🏛️', EPF: '🏛️', NPS: '📊', Crypto: '₿', 'P2P Lending': '🤝', Commodities: '📦', 'Art & Collectibles': '🎨', Other: '💼' };
const CAP_COLORS = { 'Large Cap': T.green, 'Mid Cap': T.orange, 'Small Cap': '#60a5fa' };

// ══════════════════════════════════════════════════════════════════════════════
//  TABLE ROW (shared by Stocks & MF)
// ══════════════════════════════════════════════════════════════════════════════
const TableRow = ({ children, alt, onEdit, onDelete }) => (
    <View style={[tv.row, alt && tv.rowAlt]}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            {children}
        </View>
        <View style={tv.rowActions}>
            <TouchableOpacity style={tv.editBtn} onPress={onEdit}>
                <Edit2 size={12} color={T.purple} />
            </TouchableOpacity>
            <TouchableOpacity style={tv.delBtn} onPress={onDelete}>
                <Trash2 size={12} color={T.red} />
            </TouchableOpacity>
        </View>
    </View>
);


// ══════════════════════════════════════════════════════════════════════════════
//  SummaryBar (shared by Stocks, MFs, FD, Others)
// ══════════════════════════════════════════════════════════════════════════════

const SummaryBar = ({ stats }) => (
    <View style={sb.wrap}>
        {stats.map((s, i) => (
            <View key={i} style={[sb.cell, i < stats.length - 1 && sb.cellBorder]}>
                <Text style={sb.val} numberOfLines={1}>{s.value}</Text>
                <Text style={sb.label}>{s.label}</Text>
            </View>
        ))}
    </View>
);

const sb = StyleSheet.create({
    wrap: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, borderRadius: 14, borderWidth: 1, borderColor: T.border, backgroundColor: T.card, overflow: 'hidden' },
    cell: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' },
    cellBorder: { borderRightWidth: 1, borderRightColor: T.border },
    val: { fontSize: 15, fontWeight: '800', color: T.white, fontFamily: 'Poppins_700Bold', marginBottom: 3 },
    label: { fontSize: 10, color: T.dim, fontWeight: '600', letterSpacing: 0.4, textAlign: 'center' },
});

// ══════════════════════════════════════════════════════════════════════════════
//  CARD (shared by Insurance, FD, Others)
// ══════════════════════════════════════════════════════════════════════════════
const AssetCard = ({ accentColor = T.purple, children, onEdit, onDelete, editDisabled }) => (
    <View style={cv.card}>
        <LinearGradient colors={[`${accentColor}18`, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        {children}
        <View style={cv.actions}>
            {!editDisabled && (
                <TouchableOpacity style={cv.actionBtn} onPress={onEdit}>
                    <Edit2 size={13} color={T.purple} /><Text style={[cv.actionT, { color: T.purple }]}>Edit</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={[cv.actionBtn, cv.actionDanger]} onPress={onDelete}>
                <Trash2 size={13} color={T.red} /><Text style={[cv.actionT, { color: T.red }]}>Delete</Text>
            </TouchableOpacity>
        </View>
    </View>
);

// ══════════════════════════════════════════════════════════════════════════════
//  STOCKS VIEW
// ══════════════════════════════════════════════════════════════════════════════
const EMPTY_STK = { name: '', quantity: '', investedAmount: '', marketCap: 'Large Cap', sector: '', industry: '', purchaseDate: toDS(new Date()), memberId: null };

const StocksView = ({ filtered, members, onAdd, onUpdate, onDelete, capFilter }) => {
    const [form, setForm] = useState(EMPTY_STK);
    const [editing, setEditing] = useState(null);
    const [sheetOpen, setSheet] = useState(false);
    const [delItem, setDel] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showDate, setDate] = useState(false);

    const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const reset = () => { setForm(EMPTY_STK); setSheet(false); setEditing(null); };

    const openAdd = () => { setForm(EMPTY_STK); setEditing(null); setSheet(true); };
    const openEdit = (h) => {
        setForm({ name: h.name, quantity: String(h.quantity), investedAmount: String(h.investedAmount || 0), marketCap: h.marketCap || 'Large Cap', sector: h.sector || '', industry: h.industry || '', purchaseDate: h.purchaseDate || toDS(new Date()), memberId: h.memberId || null });
        setEditing(h); setSheet(true);
    };

    const stocks = useMemo(() => {
        let s = filtered.filter(h => h.type === 'Stock');
        if (capFilter !== 'All') s = s.filter(h => h.marketCap === capFilter);
        return s;
    }, [filtered, capFilter]);

    const submit = async () => {
        if (!form.name || !form.quantity || !form.purchaseDate) { showToast('error', 'Name, qty & date required'); return; }
        setSaving(true);
        const base = { type: 'Stock', name: form.name, quantity: parseFloat(form.quantity), investedAmount: parseFloat(form.investedAmount) || 0, marketCap: form.marketCap, sector: form.sector, industry: form.industry, purchaseDate: form.purchaseDate, memberId: form.memberId };
        const res = editing
            ? await onUpdate({ ...editing, ...base, updatedAt: new Date().toISOString() })
            : await onAdd({ ...base, id: `stk_${Date.now()}`, addedAt: new Date().toISOString() });
        if (res?.success) { reset(); showToast('success', editing ? 'Stock updated' : 'Stock added'); }
        else showToast('error', res?.error || 'Failed');
        setSaving(false);
    };

    const confirmDel = async () => {
        setSaving(true);
        const res = await onDelete(delItem);
        if (res?.success) { setDel(null); showToast('success', 'Deleted'); }
        setSaving(false);
    };

    return (
        <>
            <SummaryBar stats={[
                { label: 'Invested', value: fmt(stocks.reduce((s, h) => s + (h.investedAmount || 0), 0)) },
                { label: 'Stocks', value: String(stocks.length) },
                { label: 'Large Cap', value: String(stocks.filter(h => h.marketCap === 'Large Cap').length) },
                { label: 'Mid Cap', value: String(stocks.filter(h => h.marketCap === 'Mid Cap').length) },
                { label: 'Small Cap', value: String(stocks.filter(h => h.marketCap === 'Small Cap').length) },
            ]} />
            <View style={tv.wrap}>
                {/* Header */}
                <View style={tv.hdr}>
                    <Text style={[tv.hc, { flex: 2.0 }]}>NAME</Text>
                    <Text style={[tv.hc, { flex: 1.0 }]}>CAP</Text>
                    <Text style={[tv.hc, { flex: 0.8, textAlign: 'right' }]}>QTY</Text>
                    <Text style={[tv.hc, { flex: 1.2, textAlign: 'right' }]}>INVESTED</Text>
                    <View style={{ width: 58 }} />
                </View>

                {stocks.length === 0
                    ? <View style={tv.empty}><TrendingUp size={30} color="rgba(255,255,255,0.08)" /><Text style={tv.emptyT}>No stocks{capFilter !== 'All' ? ` · ${capFilter}` : ''}</Text></View>
                    : stocks.map((h, i) => (
                        <TableRow key={h.id} alt={i % 2 === 0} onEdit={() => openEdit(h)} onDelete={() => setDel(h)}>
                            <Text style={[tv.c, { flex: 2.0 }]} numberOfLines={1}>{h.name}</Text>
                            <View style={{ flex: 1.0 }}>
                                <Text style={[tv.cap, { color: CAP_COLORS[h.marketCap] || T.dim, backgroundColor: `${CAP_COLORS[h.marketCap] || T.dim}18` }]} numberOfLines={1}>
                                    {(h.marketCap || '').replace(' Cap', '') || '—'}
                                </Text>
                            </View>
                            <Text style={[tv.c, { flex: 0.8, textAlign: 'right', color: T.dim }]}>{h.quantity}</Text>
                            <Text style={[tv.c, { flex: 1.2, textAlign: 'right' }]}>{fmt(h.investedAmount)}</Text>
                        </TableRow>
                    ))
                }
                {stocks.length > 0 && (
                    <View style={tv.footer}>
                        <Text style={tv.footerL}>{stocks.length} stocks</Text>
                        <Text style={tv.footerV}>{fmt(stocks.reduce((s, h) => s + (h.investedAmount || 0), 0))}</Text>
                    </View>
                )}
            </View>

            <FAB label="Add Stock" onPress={openAdd} />

            <Sheet visible={sheetOpen} onClose={reset} title={editing ? 'Edit Stock' : 'Add Stock'}
                footer={<SheetFooter onCancel={reset} onSubmit={submit} saving={saving} label={editing ? 'Update Stock' : 'Add Stock'} />}
            >
                <FL t="Stock Name" req /><FI value={form.name} onChangeText={v => sf('name', v)} placeholder="e.g. HDFC Bank" />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}><FL t="Quantity" req /><FI value={form.quantity} onChangeText={v => sf('quantity', v)} placeholder="100" keyboardType="numeric" /></View>
                    <View style={{ flex: 1 }}><FL t="Invested (₹)" /><FI value={form.investedAmount} onChangeText={v => sf('investedAmount', v)} placeholder="50000" keyboardType="numeric" /></View>
                </View>
                <FL t="Market Cap" />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    {['Large Cap', 'Mid Cap', 'Small Cap'].map(c => (
                        <TouchableOpacity key={c} style={[cpb.b, form.marketCap === c && { borderColor: CAP_COLORS[c], backgroundColor: `${CAP_COLORS[c]}14` }]} onPress={() => sf('marketCap', c)}>
                            <Text style={[cpb.t, form.marketCap === c && { color: CAP_COLORS[c] }]}>{c.replace(' Cap', '')}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <FL t="Sector" /><FI value={form.sector} onChangeText={v => sf('sector', v)} placeholder="e.g. Banking, IT" />
                <FL t="Purchase Date" req /><FDateBtn label="Select date" value={form.purchaseDate} onPress={() => setDate(true)} />
                <FL t="Assign To" /><MemberPicker members={members} value={form.memberId} onChange={v => sf('memberId', v)} />
            </Sheet>

            {showDate && <DateTimePicker mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} value={new Date(form.purchaseDate || Date.now())} onChange={(_, d) => { if (d) sf('purchaseDate', toDS(d)); setDate(false); }} />}
            <DeleteSheet visible={!!delItem} onClose={() => setDel(null)} name={delItem?.name} onConfirm={confirmDel} saving={saving} />
        </>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MUTUAL FUNDS VIEW
// ══════════════════════════════════════════════════════════════════════════════
const EMPTY_MF = { name: '', units: '', investedAmount: '', folioNumber: '', purchaseDate: toDS(new Date()), memberId: null };

const MFView = ({ filtered, members, onAdd, onUpdate, onDelete }) => {
    const [form, setForm] = useState(EMPTY_MF);
    const [editing, setEditing] = useState(null);
    const [sheetOpen, setSheet] = useState(false);
    const [delItem, setDel] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showDate, setDate] = useState(false);

    const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const reset = () => { setForm(EMPTY_MF); setSheet(false); setEditing(null); };

    const openAdd = () => { setForm(EMPTY_MF); setEditing(null); setSheet(true); };
    const openEdit = (h) => {
        setForm({ name: h.name, units: String(h.quantity), investedAmount: String(h.investedAmount || 0), folioNumber: h.folioNumber || '', purchaseDate: h.purchaseDate || toDS(new Date()), memberId: h.memberId || null });
        setEditing(h); setSheet(true);
    };

    const mfs = useMemo(() => filtered.filter(h => h.type === 'Mutual Fund'), [filtered]);

    const submit = async () => {
        if (!form.name || !form.units || !form.purchaseDate) { showToast('error', 'Name, units & date required'); return; }
        setSaving(true);
        const base = { type: 'Mutual Fund', name: form.name, quantity: parseFloat(form.units), investedAmount: parseFloat(form.investedAmount) || 0, folioNumber: form.folioNumber, purchaseDate: form.purchaseDate, memberId: form.memberId };
        const res = editing
            ? await onUpdate({ ...editing, ...base, updatedAt: new Date().toISOString() })
            : await onAdd({ ...base, id: `mf_${Date.now()}`, addedAt: new Date().toISOString() });
        if (res?.success) { reset(); showToast('success', editing ? 'Updated' : 'MF added'); }
        else showToast('error', res?.error || 'Failed');
        setSaving(false);
    };

    const confirmDel = async () => {
        setSaving(true);
        const res = await onDelete(delItem);
        if (res?.success) { setDel(null); showToast('success', 'Deleted'); }
        setSaving(false);
    };

    return (
        <>
            <SummaryBar stats={[
                { label: 'Invested', value: fmt(mfs.reduce((s, h) => s + (h.investedAmount || 0), 0)) },
                { label: 'Schemes', value: String(mfs.length) },
                { label: 'Units', value: mfs.reduce((s, h) => s + (h.quantity || 0), 0).toFixed(1) },
            ]} />
            <View style={tv.wrap}>
                <View style={tv.hdr}>
                    <Text style={[tv.hc, { flex: 2.4 }]}>SCHEME</Text>
                    <Text style={[tv.hc, { flex: 1.0, textAlign: 'right' }]}>UNITS</Text>
                    <Text style={[tv.hc, { flex: 1.2, textAlign: 'right' }]}>INVESTED</Text>
                    <View style={{ width: 58 }} />
                </View>

                {mfs.length === 0
                    ? <View style={tv.empty}><TrendingUp size={30} color="rgba(255,255,255,0.08)" /><Text style={tv.emptyT}>No mutual funds added</Text></View>
                    : mfs.map((h, i) => (
                        <TableRow key={h.id} alt={i % 2 === 0} onEdit={() => openEdit(h)} onDelete={() => setDel(h)}>
                            <View style={{ flex: 2.4 }}>
                                <Text style={tv.c} numberOfLines={1}>{h.name}</Text>
                                {!!h.folioNumber && <Text style={tv.sub}>{h.folioNumber}</Text>}
                            </View>
                            <Text style={[tv.c, { flex: 1.0, textAlign: 'right', color: T.dim }]}>{Number(h.quantity).toFixed(3)}</Text>
                            <Text style={[tv.c, { flex: 1.2, textAlign: 'right' }]}>{fmt(h.investedAmount)}</Text>
                        </TableRow>
                    ))
                }
                {mfs.length > 0 && (
                    <View style={tv.footer}>
                        <Text style={tv.footerL}>{mfs.length} schemes</Text>
                        <Text style={tv.footerV}>{fmt(mfs.reduce((s, h) => s + (h.investedAmount || 0), 0))}</Text>
                    </View>
                )}
            </View>

            <FAB label="Add Mutual Fund" onPress={openAdd} />

            <Sheet visible={sheetOpen} onClose={reset} title={editing ? 'Edit Mutual Fund' : 'Add Mutual Fund'}
                footer={<SheetFooter onCancel={reset} onSubmit={submit} saving={saving} label={editing ? 'Update' : 'Add MF'} />}
            >
                <FL t="Scheme Name" req /><FI value={form.name} onChangeText={v => sf('name', v)} placeholder="e.g. HDFC Flexi Cap - Direct Growth" />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}><FL t="Units" req /><FI value={form.units} onChangeText={v => sf('units', v)} placeholder="6747.527" keyboardType="decimal-pad" /></View>
                    <View style={{ flex: 1 }}><FL t="Invested (₹)" /><FI value={form.investedAmount} onChangeText={v => sf('investedAmount', v)} placeholder="100000" keyboardType="numeric" /></View>
                </View>
                <FL t="Folio Number" /><FI value={form.folioNumber} onChangeText={v => sf('folioNumber', v)} placeholder="Enter folio number" />
                <FL t="Purchase Date" req /><FDateBtn label="Select date" value={form.purchaseDate} onPress={() => setDate(true)} />
                <FL t="Assign To" /><MemberPicker members={members} value={form.memberId} onChange={v => sf('memberId', v)} />
            </Sheet>

            {showDate && <DateTimePicker mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} value={new Date(form.purchaseDate || Date.now())} onChange={(_, d) => { if (d) sf('purchaseDate', toDS(d)); setDate(false); }} />}
            <DeleteSheet visible={!!delItem} onClose={() => setDel(null)} name={delItem?.name} onConfirm={confirmDel} saving={saving} />
        </>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
//  INSURANCE VIEW
// ══════════════════════════════════════════════════════════════════════════════
const EMPTY_INS = { type: 'Health', provider: '', policyNumber: '', coverageAmount: '', premiumAmount: '', startDate: toDS(new Date()), endDate: '', source: 'investment', memberId: null };

const InsuranceView = ({ filtered, members, onAdd, onUpdate, onDelete }) => {
    const [form, setForm] = useState(EMPTY_INS);
    const [editing, setEditing] = useState(null);
    const [sheetOpen, setSheet] = useState(false);
    const [typeSheet, setType] = useState(false);
    const [delItem, setDel] = useState(null);
    const [saving, setSaving] = useState(false);
    const [dpf, setDpf] = useState(null);

    const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const reset = () => { setForm(EMPTY_INS); setSheet(false); setEditing(null); };

    const openAdd = () => { setForm(EMPTY_INS); setEditing(null); setSheet(true); };
    const openEdit = (p) => {
        setForm({ type: p.type, provider: p.provider, policyNumber: p.policyNumber, coverageAmount: String(p.coverageAmount), premiumAmount: String(p.premiumAmount), startDate: p.startDate || toDS(new Date()), endDate: p.endDate || '', source: p.source || 'investment', memberId: p.memberId || null });
        setEditing(p); setSheet(true);
    };

    const submit = async () => {
        if (!form.provider || !form.policyNumber || !form.coverageAmount || !form.endDate) { showToast({ type: 'error', text1: 'Provider, policy#, coverage & end date required' }); return; }
        setSaving(true);
        const base = { type: form.type, provider: form.provider, policyNumber: form.policyNumber, coverageAmount: parseFloat(form.coverageAmount), premiumAmount: parseFloat(form.premiumAmount) || 0, startDate: form.startDate, endDate: form.endDate, status: insStatus(form.endDate).label, source: 'investment', memberId: form.memberId };
        const res = editing
            ? await onUpdate({ ...editing, ...base, updatedAt: new Date().toISOString() })
            : await onAdd({ ...base, id: `ins_${Date.now()}`, addedAt: new Date().toISOString() });
        if (res?.success) { reset(); showToast('success', editing ? 'Policy updated' : 'Policy added'); }
        else showToast('error', res?.error || 'Failed');
        setSaving(false);
    };

    const confirmDel = async () => {
        setSaving(true);
        const res = await onDelete(delItem);
        if (res?.success) { setDel(null); showToast('success', 'Deleted'); }
        setSaving(false);
    };

    return (
        <>
            <SummaryBar stats={[
                { label: 'Policies', value: String(filtered.length) },
                { label: 'Total Coverage', value: fmt(filtered.reduce((s, p) => s + (p.coverageAmount || 0), 0)) },
                { label: 'Active', value: String(filtered.filter(p => insStatus(p.endDate).label === 'Active').length) },
                { label: 'Expiring Soon', value: String(filtered.filter(p => insStatus(p.endDate).label === 'Expiring Soon').length) },
            ]} />
            <View style={{ paddingHorizontal: 20 }}>
                {filtered.length === 0
                    ? <View style={cv.empty}><Shield size={32} color="rgba(255,255,255,0.08)" /><Text style={cv.emptyT}>No insurance policies</Text></View>
                    : filtered.map(p => {
                        const Ic = INS_ICONS[p.type] || Shield;
                        const col = INS_COLORS[p.type] || T.purple;
                        const st = insStatus(p.endDate);
                        // const isQ = p.source === 'questionnaire';
                        const isQ = false; // hide source for now as it's not a user-settable field
                        return (
                            <AssetCard key={p.id} accentColor={col} onEdit={() => openEdit(p)} onDelete={() => setDel(p)} editDisabled={isQ}>
                                <View style={cv.cardTop}>
                                    <View style={[cv.typeIcon, { backgroundColor: `${col}20` }]}><Ic size={18} color={col} /></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={cv.provider} numberOfLines={1}>{p.provider}</Text>
                                        <Text style={cv.typeLabel}>{p.type} Insurance {isQ && '· from questionnaire'}</Text>
                                    </View>
                                    <View style={[cv.badge, { backgroundColor: `${st.color}18` }]}>
                                        <Text style={[cv.badgeT, { color: st.color }]}>{st.label}</Text>
                                    </View>
                                </View>
                                <View style={cv.cardGrid}>
                                    <View style={cv.gridCell}><Text style={cv.gridLabel}>Coverage</Text><Text style={[cv.gridVal, { color: T.green }]}>{fmt(p.coverageAmount)}</Text></View>
                                    <View style={cv.gridCell}><Text style={cv.gridLabel}>Premium/yr</Text><Text style={cv.gridVal}>₹{Number(p.premiumAmount || 0).toLocaleString('en-IN')}</Text></View>
                                    <View style={cv.gridCell}><Text style={cv.gridLabel}>Expires</Text><Text style={cv.gridVal}>{fmtDate(p.endDate)}</Text></View>
                                </View>
                            </AssetCard>
                        );
                    })
                }
            </View>

            <FAB label="Add Policy" onPress={openAdd} />

            <Sheet visible={sheetOpen} onClose={reset} title={editing ? 'Edit Policy' : 'Add Policy'}
                footer={<SheetFooter onCancel={reset} onSubmit={submit} saving={saving} label={editing ? 'Update Policy' : 'Add Policy'} />}
            >
                <FL t="Policy Type" />
                <TouchableOpacity style={[fh.inp, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]} onPress={() => setType(true)}>
                    <Text style={{ color: T.white, fontSize: 15 }}>{form.type} Insurance</Text>
                    <ChevronDown size={16} color={T.dim} />
                </TouchableOpacity>
                <FL t="Provider" req /><FI value={form.provider} onChangeText={v => sf('provider', v)} placeholder="e.g. HDFC ERGO, LIC" />
                <FL t="Policy Number" req /><FI value={form.policyNumber} onChangeText={v => sf('policyNumber', v)} placeholder="Enter policy number" />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}><FL t="Coverage (₹)" req /><FI value={form.coverageAmount} onChangeText={v => sf('coverageAmount', v)} placeholder="500000" keyboardType="numeric" /></View>
                    <View style={{ flex: 1 }}><FL t="Annual Premium" /><FI value={form.premiumAmount} onChangeText={v => sf('premiumAmount', v)} placeholder="12000" keyboardType="numeric" /></View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}><FL t="Start Date" /><FDateBtn label="Start" value={form.startDate} onPress={() => setDpf('startDate')} /></View>
                    <View style={{ flex: 1 }}><FL t="End Date" req /><FDateBtn label="End" value={form.endDate} onPress={() => setDpf('endDate')} /></View>
                </View>
                <FL t="Assign To" /><MemberPicker members={members} value={form.memberId} onChange={v => sf('memberId', v)} />
            </Sheet>

            <Sheet visible={typeSheet} onClose={() => setType(false)} title="Policy Type">
                {INS_TYPES.map(t => {
                    const Ic = INS_ICONS[t]; const col = INS_COLORS[t];
                    return <PkRow key={t} label={`${t} Insurance`} active={form.type === t} onPress={() => { sf('type', t); setType(false); }} iconEl={<View style={[pk.iconBox, { backgroundColor: `${col}20` }]}><Ic size={16} color={col} /></View>} />;
                })}
            </Sheet>

            {dpf && <DateTimePicker mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} value={new Date(form[dpf] || Date.now())} onChange={(_, d) => { if (d) sf(dpf, toDS(d)); setDpf(null); }} />}
            <DeleteSheet visible={!!delItem} onClose={() => setDel(null)} name={delItem?.provider} onConfirm={confirmDel} saving={saving} />
        </>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
//  FIXED DEPOSITS VIEW
// ══════════════════════════════════════════════════════════════════════════════
const EMPTY_FD = { bank: '', fdNumber: '', principalAmount: '', interestRate: '', startDate: toDS(new Date()), maturityDate: '', compoundingFrequency: 'Quarterly', autoRenewal: false, memberId: null };

const FDView = ({ filtered, members, onAdd, onUpdate, onDelete }) => {
    const [form, setForm] = useState(EMPTY_FD);
    const [editing, setEditing] = useState(null);
    const [sheetOpen, setSheet] = useState(false);
    const [freqSheet, setFreq] = useState(false);
    const [delItem, setDel] = useState(null);
    const [saving, setSaving] = useState(false);
    const [dpf, setDpf] = useState(null);

    const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const reset = () => { setForm(EMPTY_FD); setSheet(false); setEditing(null); };

    const openAdd = () => { setForm(EMPTY_FD); setEditing(null); setSheet(true); };
    const openEdit = (fd) => {
        setForm({ bank: fd.bank, fdNumber: fd.fdNumber, principalAmount: String(fd.principalAmount), interestRate: String(fd.interestRate), startDate: fd.startDate, maturityDate: fd.maturityDate, compoundingFrequency: fd.compoundingFrequency, autoRenewal: fd.autoRenewal || false, memberId: fd.memberId || null });
        setEditing(fd); setSheet(true);
    };

    const preview = useMemo(() => {
        const p = parseFloat(form.principalAmount), r = parseFloat(form.interestRate);
        if (!p || !r || !form.startDate || !form.maturityDate) return null;
        const mat = calcMaturity(p, r, form.startDate, form.maturityDate, form.compoundingFrequency);
        return { mat, interest: mat - p };
    }, [form.principalAmount, form.interestRate, form.startDate, form.maturityDate, form.compoundingFrequency]);

    const submit = async () => {
        if (!form.bank || !form.fdNumber || !form.principalAmount || !form.interestRate || !form.startDate || !form.maturityDate) { showToast('error', 'All required fields needed'); return; }
        setSaving(true);
        const p = parseFloat(form.principalAmount), r = parseFloat(form.interestRate);
        const mat = calcMaturity(p, r, form.startDate, form.maturityDate, form.compoundingFrequency);
        const base = { bank: form.bank, fdNumber: form.fdNumber, principalAmount: p, interestRate: r, startDate: form.startDate, maturityDate: form.maturityDate, compoundingFrequency: form.compoundingFrequency, autoRenewal: form.autoRenewal, maturityAmount: mat, interestEarned: mat - p, status: 'Active', memberId: form.memberId };
        const res = editing
            ? await onUpdate({ ...editing, ...base, updatedAt: new Date().toISOString() })
            : await onAdd({ ...base, id: `fd_${Date.now()}`, addedAt: new Date().toISOString() });
        if (res?.success) { reset(); showToast('success', editing ? 'FD updated' : 'FD added'); }
        else showToast('error', res?.error || 'Failed');
        setSaving(false);
    };

    const confirmDel = async () => {
        setSaving(true);
        const res = await onDelete(delItem);
        if (res?.success) { setDel(null); showToast('success', 'FD deleted'); }
        setSaving(false);
    };

    return (
        <>
            <SummaryBar stats={[
                { label: 'Principal', value: fmt(filtered.reduce((s, f) => s + (f.principalAmount || 0), 0)) },
                { label: 'Maturity Val', value: fmt(filtered.reduce((s, f) => s + (f.maturityAmount || 0), 0)) },
                { label: 'Interest', value: fmt(filtered.reduce((s, f) => s + (f.interestEarned || 0), 0)) },
                { label: 'FDs', value: String(filtered.length) },
            ]} />
            <View style={{ paddingHorizontal: 20 }}>
                {filtered.length === 0
                    ? <View style={cv.empty}><Landmark size={32} color="rgba(255,255,255,0.08)" /><Text style={cv.emptyT}>No fixed deposits added</Text></View>
                    : filtered.map(fd => {
                        const d = daysLeft(fd.maturityDate);
                        const st = fdStatus(fd.maturityDate);
                        return (
                            <AssetCard key={fd.id} accentColor={T.orange} onEdit={() => openEdit(fd)} onDelete={() => setDel(fd)}>
                                <View style={cv.cardTop}>
                                    <View style={[cv.typeIcon, { backgroundColor: 'rgba(255,126,64,0.15)' }]}><Landmark size={18} color={T.orange} /></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={cv.provider} numberOfLines={1}>{fd.bank}</Text>
                                        <Text style={cv.typeLabel}>{fd.fdNumber} · {fd.interestRate}% p.a.</Text>
                                    </View>
                                    <View style={[cv.badge, { backgroundColor: `${st.color}18` }]}>
                                        <Text style={[cv.badgeT, { color: st.color }]}>{d > 0 ? `${d}d left` : 'Matured'}</Text>
                                    </View>
                                </View>
                                <View style={cv.cardGrid}>
                                    <View style={cv.gridCell}><Text style={cv.gridLabel}>Principal</Text><Text style={cv.gridVal}>{fmt(fd.principalAmount)}</Text></View>
                                    <View style={cv.gridCell}><Text style={cv.gridLabel}>Maturity Value</Text><Text style={[cv.gridVal, { color: T.green }]}>{fmt(fd.maturityAmount)}</Text></View>
                                    <View style={cv.gridCell}><Text style={cv.gridLabel}>Matures On</Text><Text style={cv.gridVal}>{fmtDate(fd.maturityDate)}</Text></View>
                                </View>
                                {d > 0 && (
                                    <View style={cv.progressWrap}>
                                        <View style={cv.progressTrack}>
                                            <View style={[cv.progressFill, { width: `${Math.min(100, Math.max(2, (1 - d / 365) * 100))}%` }]}>
                                                <LinearGradient colors={[T.purple, T.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </AssetCard>
                        );
                    })
                }
            </View>

            <FAB label="Add Fixed Deposit" onPress={openAdd} />

            <Sheet visible={sheetOpen} onClose={reset} title={editing ? 'Edit Fixed Deposit' : 'Add Fixed Deposit'}
                footer={<SheetFooter onCancel={reset} onSubmit={submit} saving={saving} label={editing ? 'Update FD' : 'Add FD'} />}
            >
                <FL t="Bank / Institution" req /><FI value={form.bank} onChangeText={v => sf('bank', v)} placeholder="e.g. HDFC Bank, SBI" />
                <FL t="FD Number" req /><FI value={form.fdNumber} onChangeText={v => sf('fdNumber', v)} placeholder="Enter FD number" />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}><FL t="Principal (₹)" req /><FI value={form.principalAmount} onChangeText={v => sf('principalAmount', v)} placeholder="100000" keyboardType="numeric" /></View>
                    <View style={{ flex: 1 }}><FL t="Rate (% p.a.)" req /><FI value={form.interestRate} onChangeText={v => sf('interestRate', v)} placeholder="7.5" keyboardType="decimal-pad" /></View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}><FL t="Start Date" req /><FDateBtn label="Start" value={form.startDate} onPress={() => setDpf('startDate')} /></View>
                    <View style={{ flex: 1 }}><FL t="Maturity Date" req /><FDateBtn label="Maturity" value={form.maturityDate} onPress={() => setDpf('maturityDate')} /></View>
                </View>
                <FL t="Compounding" />
                <TouchableOpacity style={[fh.inp, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]} onPress={() => setFreq(true)}>
                    <Text style={{ color: T.white, fontSize: 15 }}>{form.compoundingFrequency}</Text>
                    <ChevronDown size={16} color={T.dim} />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
                    <Text style={fh.lbl}>AUTO RENEWAL</Text>
                    <Switch value={form.autoRenewal} onValueChange={v => sf('autoRenewal', v)} trackColor={{ false: 'rgba(255,255,255,0.08)', true: T.purple }} thumbColor="#fff" />
                </View>
                {preview && (
                    <View style={pv.box}>
                        <Text style={pv.label}>MATURITY PREVIEW</Text>
                        <Text style={pv.big}>{fmt(preview.mat)}</Text>
                        <Text style={pv.sm}>Interest earned: {fmt(preview.interest)}</Text>
                    </View>
                )}
                <FL t="Assign To" /><MemberPicker members={members} value={form.memberId} onChange={v => sf('memberId', v)} />
            </Sheet>

            <Sheet visible={freqSheet} onClose={() => setFreq(false)} title="Compounding Frequency">
                {FD_FREQS.map(f => <PkRow key={f} label={f} active={form.compoundingFrequency === f} onPress={() => { sf('compoundingFrequency', f); setFreq(false); }} />)}
            </Sheet>

            {dpf && <DateTimePicker mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} value={new Date(form[dpf] || Date.now())} onChange={(_, d) => { if (d) sf(dpf, toDS(d)); setDpf(null); }} />}
            <DeleteSheet visible={!!delItem} onClose={() => setDel(null)} name={delItem?.bank} onConfirm={confirmDel} saving={saving} />
        </>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
//  OTHERS VIEW
// ══════════════════════════════════════════════════════════════════════════════
const EMPTY_OTH = { type: 'Gold', name: '', investedAmount: '', quantity: '', unit: '', purchaseDate: toDS(new Date()), notes: '', memberId: null };

const OthersView = ({ filtered, members, onAdd, onUpdate, onDelete }) => {
    const [form, setForm] = useState(EMPTY_OTH);
    const [editing, setEditing] = useState(null);
    const [sheetOpen, setSheet] = useState(false);
    const [typeSheet, setType] = useState(false);
    const [delItem, setDel] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showDate, setDate] = useState(false);

    const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const reset = () => { setForm(EMPTY_OTH); setSheet(false); setEditing(null); };

    const openAdd = () => { setForm(EMPTY_OTH); setEditing(null); setSheet(true); };
    const openEdit = (inv) => {
        setForm({ type: inv.type, name: inv.name, investedAmount: String(inv.investedAmount), quantity: inv.quantity || '', unit: inv.unit || '', purchaseDate: inv.purchaseDate, notes: inv.notes || '', memberId: inv.memberId || null });
        setEditing(inv); setSheet(true);
    };

    const submit = async () => {
        if (!form.name || !form.investedAmount || !form.purchaseDate) { showToast('error', 'Name, amount & date required'); return; }
        setSaving(true);
        const base = { type: form.type, name: form.name, investedAmount: parseFloat(form.investedAmount), quantity: form.quantity, unit: form.unit, purchaseDate: form.purchaseDate, notes: form.notes, memberId: form.memberId };
        const res = editing
            ? await onUpdate({ ...editing, ...base, updatedAt: new Date().toISOString() })
            : await onAdd({ ...base, id: `inv_${Date.now()}`, addedAt: new Date().toISOString() });
        if (res?.success) { reset(); showToast('success', editing ? 'Updated' : 'Investment added'); }
        else showToast('error', res?.error || 'Failed');
        setSaving(false);
    };

    const confirmDel = async () => {
        setSaving(true);
        const res = await onDelete(delItem);
        if (res?.success) { setDel(null); showToast('success', 'Deleted'); }
        setSaving(false);
    };

    return (
        <>
            <SummaryBar stats={[
                { label: 'Invested', value: fmt(filtered.reduce((s, i) => s + (i.investedAmount || 0), 0)) },
                { label: 'Holdings', value: String(filtered.length) },
                { label: 'Asset Types', value: String(new Set(filtered.map(i => i.type)).size) },
            ]} />
            <View style={{ paddingHorizontal: 20 }}>
                {filtered.length === 0
                    ? <View style={cv.empty}><Coins size={32} color="rgba(255,255,255,0.08)" /><Text style={cv.emptyT}>No other investments</Text></View>
                    : filtered.map(inv => (
                        <AssetCard key={inv.id} accentColor={T.purple} onEdit={() => openEdit(inv)} onDelete={() => setDel(inv)}>
                            <View style={cv.cardTop}>
                                <Text style={cv.otherEmoji}>{OTHER_ICON[inv.type] || '💼'}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={cv.provider} numberOfLines={1}>{inv.name}</Text>
                                    <Text style={cv.typeLabel}>{inv.type}</Text>
                                </View>
                                <Text style={[cv.gridVal, { color: T.orange }]}>{fmt(inv.investedAmount)}</Text>
                            </View>
                            {(inv.quantity || inv.purchaseDate) && (
                                <View style={cv.cardGrid}>
                                    {!!inv.quantity && <View style={cv.gridCell}><Text style={cv.gridLabel}>Quantity</Text><Text style={cv.gridVal}>{inv.quantity} {inv.unit}</Text></View>}
                                    <View style={cv.gridCell}><Text style={cv.gridLabel}>Purchased</Text><Text style={cv.gridVal}>{fmtDate(inv.purchaseDate)}</Text></View>
                                </View>
                            )}
                        </AssetCard>
                    ))
                }
            </View>

            <FAB label="Add Investment" onPress={openAdd} />

            <Sheet visible={sheetOpen} onClose={reset} title={editing ? 'Edit Investment' : 'Add Investment'}
                footer={<SheetFooter onCancel={reset} onSubmit={submit} saving={saving} label={editing ? 'Update' : 'Add Investment'} />}
            >
                <FL t="Type" />
                <TouchableOpacity style={[fh.inp, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]} onPress={() => setType(true)}>
                    <Text style={{ color: T.white, fontSize: 15 }}>{OTHER_ICON[form.type]} {form.type}</Text>
                    <ChevronDown size={16} color={T.dim} />
                </TouchableOpacity>
                <FL t="Name" req /><FI value={form.name} onChangeText={v => sf('name', v)} placeholder="e.g. Physical Gold 24K" />
                <FL t="Invested Amount (₹)" req /><FI value={form.investedAmount} onChangeText={v => sf('investedAmount', v)} placeholder="100000" keyboardType="numeric" />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}><FL t="Quantity" /><FI value={form.quantity} onChangeText={v => sf('quantity', v)} placeholder="10" /></View>
                    <View style={{ flex: 1 }}><FL t="Unit" /><FI value={form.unit} onChangeText={v => sf('unit', v)} placeholder="grams, sqft" /></View>
                </View>
                <FL t="Purchase Date" req /><FDateBtn label="Select date" value={form.purchaseDate} onPress={() => setDate(true)} />
                <FL t="Notes" />
                <TextInput style={[fh.inp, { minHeight: 72, textAlignVertical: 'top' }]} value={form.notes} onChangeText={v => sf('notes', v)} placeholder="Any additional notes..." placeholderTextColor="rgba(255,255,255,0.20)" multiline />
                <FL t="Assign To" /><MemberPicker members={members} value={form.memberId} onChange={v => sf('memberId', v)} />
            </Sheet>

            <Sheet visible={typeSheet} onClose={() => setType(false)} title="Investment Type">
                {OTHER_TYPES.map(t => <PkRow key={t} label={t} icon={OTHER_ICON[t]} active={form.type === t} onPress={() => { sf('type', t); setType(false); }} />)}
            </Sheet>

            {showDate && <DateTimePicker mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} value={new Date(form.purchaseDate || Date.now())} onChange={(_, d) => { if (d) sf('purchaseDate', toDS(d)); setDate(false); }} />}
            <DeleteSheet visible={!!delItem} onClose={() => setDel(null)} name={delItem?.name} onConfirm={confirmDel} saving={saving} />
        </>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
//  FAMILY MEMBERS SHEET
// ══════════════════════════════════════════════════════════════════════════════
const FamilySheet = ({ visible, onClose, members, onAdd, onDelete }) => {
    const [name, setName] = useState('');
    const [relation, setRel] = useState('');
    const [saving, setSaving] = useState(false);
    const [delTarget, setDT] = useState(null);
    const RELATIONS = ['Parent', 'Spouse', 'Child', 'Sibling', 'Other'];

    const submit = async () => {
        if (!name.trim()) { showToast('error', 'Name required'); return; }
        setSaving(true);
        await onAdd({ id: `${Date.now()}`, name: name.trim(), relation: relation.trim(), addedAt: new Date().toISOString() });
        setName(''); setRel('');
        setSaving(false);
    };

    return (
        <Sheet visible={visible} onClose={onClose} title="Family Members">
            {members.length === 0
                ? <View style={{ paddingVertical: 20, alignItems: 'center' }}><Text style={{ color: T.dim, fontSize: 13 }}>No family members added yet</Text></View>
                : members.map(m => (
                    <View key={m.id} style={fm.row}>
                        <View style={fm.avatar}><Text style={fm.avatarT}>{m.name[0]}</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={fm.name}>{m.name}</Text>
                            {!!m.relation && <Text style={fm.rel}>{m.relation}</Text>}
                        </View>
                        <TouchableOpacity onPress={() => setDT(m)} style={fm.del}><X size={14} color={T.red} /></TouchableOpacity>
                    </View>
                ))
            }
            <View style={fm.divider} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: T.white, fontFamily: 'Syne' }}>Add Member</Text>
            <FL t="Name" req /><FI value={name} onChangeText={setName} placeholder="e.g. Tushar" />
            <FL t="Relation" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>
                {RELATIONS.map(r => (
                    <TouchableOpacity key={r} style={[mp.pill, relation === r && mp.active]} onPress={() => setRel(r)}>
                        <Text style={[mp.text, relation === r && { color: T.white }]}>{r}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <View style={{ marginTop: 20 }}>
                <TouchableOpacity style={[sf.submit, { flex: undefined, width: '100%' }, saving && { opacity: 0.5 }]} onPress={submit} disabled={saving}>
                    <LinearGradient colors={[T.purple, T.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={sf.submitT}>Add Member</Text>}
                </TouchableOpacity>
            </View>
            <DeleteSheet visible={!!delTarget} onClose={() => setDT(null)} name={delTarget?.name}
                onConfirm={async () => { setSaving(true); await onDelete(delTarget); setDT(null); setSaving(false); }}
                saving={saving}
            />
        </Sheet>
    );
};
const fm = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border },
    avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(166,75,255,0.18)', borderWidth: 1, borderColor: 'rgba(166,75,255,0.35)', alignItems: 'center', justifyContent: 'center' },
    avatarT: { fontSize: 16, fontWeight: '700', color: T.purple },
    name: { fontSize: 14, fontWeight: '700', color: T.white },
    rel: { fontSize: 12, color: T.dim, marginTop: 2 },
    del: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(244,67,54,0.10)', alignItems: 'center', justifyContent: 'center' },
    divider: { height: 1, backgroundColor: T.border, marginVertical: 20 },
});

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
const ASSET_TABS = [
    { key: 'stocks', label: 'Stocks' },
    { key: 'mf', label: 'Mutual Funds' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'fd', label: 'Fixed Deposits' },
    { key: 'others', label: 'Others' },
];

const CAP_TABS = ['All', 'Large Cap', 'Mid Cap', 'Small Cap'];

export default function AssetHoldingsScreen() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assetTab, setAssetTab] = useState('stocks');
    const [memberTab, setMemberTab] = useState('all');   // 'all' | 'self' | memberId
    const [capTab, setCapTab] = useState('All');
    const [familyOpen, setFamilyOpen] = useState(false);
    const [ownerOpen, setOwnerOpen] = useState(false);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchUser = async () => {
        const phone = await AsyncStorage.getItem('user_phone');
        const snap = await getDoc(doc(db, COLL, phone));
        if (!snap.exists()) throw new Error('User not found');
        return { ...snap.data(), _phone: phone };
    };

    useEffect(() => {
        (async () => {
            try { setLoading(true); setUserData(await fetchUser()); }
            catch (e) { setError(e.message); }
            finally { setLoading(false); }
        })();
    }, []);

    const refreshUser = async () => {
        try { setUserData(await fetchUser()); } catch (e) { console.error(e); }
    };

    // ── Derived ────────────────────────────────────────────────────────────────
    const members = useMemo(() => userData?.family_members || [], [userData]);
    const rawInv = useMemo(() => userData?.investments || {}, [userData]);
    const rawAns = useMemo(() => userData?.raw_answers || {}, [userData]);

    const allHoldings = useMemo(() => rawInv?.stocksMF?.holdings || [], [rawInv]);
    const allPolicies = useMemo(() => [...normalizeQIns(rawAns.insurance_data), ...(rawInv?.insurance?.policies || [])], [rawInv, rawAns]);
    const allFDs = useMemo(() => rawInv?.fixedDeposits?.deposits || [], [rawInv]);
    const allOthers = useMemo(() => rawInv?.other?.assets || [], [rawInv]);

    const filterM = useCallback((arr) => {
        if (memberTab === 'all') return arr;
        if (memberTab === 'self') return arr.filter(i => !i.memberId);
        return arr.filter(i => i.memberId === memberTab);
    }, [memberTab]);

    const filtH = useMemo(() => filterM(allHoldings), [allHoldings, filterM]);
    const filtP = useMemo(() => filterM(allPolicies), [allPolicies, filterM]);
    const filtF = useMemo(() => filterM(allFDs), [allFDs, filterM]);
    const filtO = useMemo(() => filterM(allOthers), [allOthers, filterM]);

    // ── CRUD ───────────────────────────────────────────────────────────────────
    const KEY_MAP = { stocksMF: 'holdings', fixedDeposits: 'deposits', other: 'assets' };

    const addItem = async (type, item) => {
        try {
            await updateDoc(doc(db, COLL, userData._phone), {
                [`investments.${type}.${KEY_MAP[type]}`]: arrayUnion(item),
                [`investments.${type}.lastUpdated`]: new Date().toISOString(),
            });
            await refreshUser(); return { success: true };
        } catch (e) { return { success: false, error: e.message }; }
    };

    const updateItem = async (type, updated) => {
        try {
            const current = rawInv?.[type]?.[KEY_MAP[type]] || [];
            await updateDoc(doc(db, COLL, userData._phone), {
                [`investments.${type}.${KEY_MAP[type]}`]: current.map(i => i.id === updated.id ? updated : i),
                [`investments.${type}.lastUpdated`]: new Date().toISOString(),
            });
            await refreshUser(); return { success: true };
        } catch (e) { return { success: false, error: e.message }; }
    };

    const deleteItem = async (type, item) => {
        try {
            await updateDoc(doc(db, COLL, userData._phone), {
                [`investments.${type}.${KEY_MAP[type]}`]: arrayRemove(item),
            });
            await refreshUser(); return { success: true };
        } catch (e) { return { success: false, error: e.message }; }
    };

    // Insurance-specific (questionnaire source handling)
    const addIns = async (policy) => {
        try {
            await updateDoc(doc(db, COLL, userData._phone), { 'investments.insurance.policies': arrayUnion({ ...policy, source: 'investment' }) });
            await refreshUser(); return { success: true };
        } catch (e) { return { success: false, error: e.message }; }
    };
    const updateIns = async (policy) => {
        try {
            if (policy.source === 'questionnaire') {
                await updateDoc(doc(db, COLL, userData._phone), {
                    [`raw_answers.insurance_data.${policy.questionnaireKey}`]: { has: true, provider: policy.provider, policy_number: policy.policyNumber, sum_insured: policy.coverageAmount ? String(policy.coverageAmount / 1000) : '', premium: policy.premiumAmount ? String(policy.premiumAmount / 1000) : '', start_date: policy.startDate, end_date: policy.endDate, status: policy.status },
                });
            } else {
                const current = rawInv?.insurance?.policies || [];
                await updateDoc(doc(db, COLL, userData._phone), { 'investments.insurance.policies': current.map(p => p.id === policy.id ? policy : p) });
            }
            await refreshUser(); return { success: true };
        } catch (e) { return { success: false, error: e.message }; }
    };
    const deleteIns = async (policy) => {
        try {
            if (policy.source === 'questionnaire') {
                await updateDoc(doc(db, COLL, userData._phone), { [`raw_answers.insurance_data.${policy.questionnaireKey}.has`]: false });
            } else {
                await updateDoc(doc(db, COLL, userData._phone), { 'investments.insurance.policies': arrayRemove(policy) });
            }
            await refreshUser(); return { success: true };
        } catch (e) { return { success: false, error: e.message }; }
    };

    const addMember = async (m) => { try { await updateDoc(doc(db, COLL, userData._phone), { family_members: arrayUnion(m) }); await refreshUser(); } catch (e) { showToast('error', e.message); } };
    const deleteMember = async (m) => { try { await updateDoc(doc(db, COLL, userData._phone), { family_members: arrayRemove(m) }); await refreshUser(); } catch (e) { showToast('error', e.message); } };

    // ── Loading / Error ────────────────────────────────────────────────────────
    if (loading) return (
        <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
            <StatusBar barStyle="light-content" backgroundColor={T.bg} />
            <ActivityIndicator size="large" color={T.purple} />
            <Text style={{ color: T.dim, marginTop: 12, fontSize: 13 }}>Loading holdings…</Text>
        </View>
    );
    if (error) return (
        <View style={[s.root, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
            <Text style={{ color: T.red, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Error</Text>
            <Text style={{ color: T.dim, textAlign: 'center' }}>{error}</Text>
        </View>
    );

    // ── Member tabs: All · You · [members] ─────────────────────────────────────
    const memberTabs = [
        { id: 'all', label: 'All' },
        { id: 'self', label: 'You' },
        ...members.map(m => ({ id: m.id, label: m.name })),
    ];

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" backgroundColor={T.bg} />
            <View style={s.blob1} pointerEvents="none" />
            <View style={s.blob2} pointerEvents="none" />

            {/* Header */}
            {/* <View style={s.header}>
                <Text style={s.logo}>
                    <Text style={{ color: T.orange }}>Go</Text>
                    <Text style={{ color: T.white }}>Wealthy</Text>
                </Text>
                <TouchableOpacity style={s.familyBtn} onPress={() => setFamilyOpen(true)}>
                    <Users size={14} color={T.dim} />
                    <Text style={s.familyBtnT}>Family</Text>
                </TouchableOpacity>
            </View> */}

            <View style={s.header}>
                <Text style={s.logo}>
                    <Text style={{ color: T.orange }}>Go</Text>
                    <Text style={{ color: T.white }}>Wealthy</Text>
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {/* Member dropdown — only if family members exist */}
                    {members.length > 0 && (
                        <View style={{ position: 'relative', zIndex: 100 }}>
                            <TouchableOpacity
                                style={s.ownerPill}
                                onPress={() => setOwnerOpen(v => !v)}
                            >
                                <Text style={s.ownerPillT}>
                                    {memberTab === 'all' ? 'All' : memberTab === 'self' ? 'You' : members.find(m => m.id === memberTab)?.name || 'All'}
                                </Text>
                                <ChevronDown size={13} color={T.dim} style={{ transform: [{ rotate: ownerOpen ? '180deg' : '0deg' }] }} />
                            </TouchableOpacity>

                            {ownerOpen && (
                                <View style={s.ownerDropdown}>
                                    {memberTabs.map(o => (
                                        <TouchableOpacity
                                            key={o.id}
                                            style={[s.ownerItem, memberTab === o.id && s.ownerItemActive]}
                                            onPress={() => { setMemberTab(o.id); setOwnerOpen(false); }}
                                        >
                                            <Text style={[s.ownerItemT, memberTab === o.id && { color: T.white }]}>{o.label}</Text>
                                            {memberTab === o.id && <Check size={13} color={T.purple} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    <TouchableOpacity style={s.familyBtn} onPress={() => setFamilyOpen(true)}>
                        <Users size={14} color={T.dim} />
                        <Text style={s.familyBtnT}>Family</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Row 1 — Member filter tabs */}
            {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabRow} contentContainerStyle={s.tabContent}>
                {memberTabs.map(tab => {
                    const active = memberTab === tab.id;
                    return active ? (
                        <Glassify key={tab.id} radius={18} bw={1.5} style={{ marginRight: 8 }}>
                            <View style={s.tabPillInner}><Text style={[s.tabLabel, { color: T.white }]}>{tab.label}</Text></View>
                        </Glassify>
                    ) : (
                        <TouchableOpacity key={tab.id} style={s.tabPillOff} onPress={() => setMemberTab(tab.id)}>
                            <Text style={s.tabLabel}>{tab.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView> */}

            {/* Row 2 — Asset class tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[s.tabRow, { marginBottom: 0 }]} contentContainerStyle={s.tabContent}>
                {ASSET_TABS.map(tab => {
                    const active = assetTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[s.assetTab, active && s.assetTabActive]}
                            onPress={() => { setAssetTab(tab.key); setCapTab('All'); }}
                        >
                            {active && <LinearGradient colors={[T.purple, T.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />}
                            <Text style={[s.assetTabLabel, active && { color: T.white }]}>{tab.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Row 3 — Cap sub-tabs (Stocks only) */}
            {assetTab === 'stocks' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabRow} contentContainerStyle={s.tabContent}>
                    {CAP_TABS.map(cap => {
                        const active = capTab === cap;
                        const col = CAP_COLORS[cap] || T.purple;
                        return (
                            <TouchableOpacity
                                key={cap}
                                style={[s.capTab, active && { borderColor: col, backgroundColor: `${col}14` }]}
                                onPress={() => setCapTab(cap)}
                            >
                                <Text style={[s.capTabLabel, active && { color: col }]}>{cap}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* Content */}
            <ScrollView style={s.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180, paddingTop: 8 }}>
                {assetTab === 'stocks' && <StocksView filtered={filtH} members={members} capFilter={capTab} onAdd={i => addItem('stocksMF', i)} onUpdate={i => updateItem('stocksMF', i)} onDelete={i => deleteItem('stocksMF', i)} />}
                {assetTab === 'mf' && <MFView filtered={filtH} members={members} onAdd={i => addItem('stocksMF', i)} onUpdate={i => updateItem('stocksMF', i)} onDelete={i => deleteItem('stocksMF', i)} />}
                {assetTab === 'insurance' && <InsuranceView filtered={filtP} members={members} onAdd={addIns} onUpdate={updateIns} onDelete={deleteIns} />}
                {assetTab === 'fd' && <FDView filtered={filtF} members={members} onAdd={i => addItem('fixedDeposits', i)} onUpdate={i => updateItem('fixedDeposits', i)} onDelete={i => deleteItem('fixedDeposits', i)} />}
                {assetTab === 'others' && <OthersView filtered={filtO} members={members} onAdd={i => addItem('other', i)} onUpdate={i => updateItem('other', i)} onDelete={i => deleteItem('other', i)} />}
            </ScrollView>

            <FamilySheet visible={familyOpen} onClose={() => setFamilyOpen(false)} members={members} onAdd={addMember} onDelete={deleteMember} />
            <CustomToast ref={ToastRef} />
        </View>
    );
}

// ── Shared table styles ────────────────────────────────────────────────────────
const tv = StyleSheet.create({
    wrap: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: T.border, backgroundColor: T.card },
    hdr: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.border, alignItems: 'center' },
    hc: { fontSize: 10, color: T.dim, fontWeight: '700', letterSpacing: 0.8 },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
    rowAlt: { backgroundColor: 'rgba(255,255,255,0.015)' },
    // c: { fontSize: 13, color: T.white, fontWeight: '500' },
    sub: { fontSize: 10, color: T.dim, marginTop: 2, fontFamily: 'Poppins_600SemiBold' },
    cap: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, overflow: 'hidden' },
    rowActions: { flexDirection: 'row', gap: 6, width: 58, justifyContent: 'flex-end' },
    editBtn: { width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(166,75,255,0.12)', borderWidth: 1, borderColor: 'rgba(166,75,255,0.30)', alignItems: 'center', justifyContent: 'center' },
    delBtn: { width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(244,67,54,0.10)', borderWidth: 1, borderColor: 'rgba(244,67,54,0.25)', alignItems: 'center', justifyContent: 'center' },
    empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyT: { fontSize: 13, color: T.dim },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: T.border },
    c: { fontSize: 13, color: T.white, fontWeight: '500', fontFamily: 'Poppins_600SemiBold' },
    footerV: { fontSize: 13, fontWeight: '800', color: T.orange, fontFamily: 'Poppins_700Bold' },
    footerL: { fontSize: 11, color: T.dim, fontWeight: '600' },
    // footerV: { fontSize: 13, fontWeight: '800', color: T.orange },
});

// ── Shared card styles ─────────────────────────────────────────────────────────
const cv = StyleSheet.create({
    gridVal: { fontSize: 13, color: T.white, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
    badgeT: { fontSize: 10, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
    card: { borderRadius: 16, borderWidth: 1, borderColor: T.border, backgroundColor: T.card, marginBottom: 12, overflow: 'hidden', padding: 16 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    typeIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    otherEmoji: { fontSize: 24, width: 38, textAlign: 'center' },
    provider: { fontSize: 14, fontWeight: '700', color: T.white },
    typeLabel: { fontSize: 11, color: T.dim, marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    // badgeT: { fontSize: 10, fontWeight: '700' },
    cardGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    gridCell: { flex: 1 },
    gridLabel: { fontSize: 10, color: T.dim, marginBottom: 3, fontWeight: '600', letterSpacing: 0.4 },
    // gridVal: { fontSize: 13, color: T.white, fontWeight: '700' },
    progressWrap: { marginBottom: 12 },
    progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 2, overflow: 'hidden' },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(166,75,255,0.28)', backgroundColor: 'rgba(166,75,255,0.07)' },
    actionDanger: { borderColor: 'rgba(244,67,54,0.28)', backgroundColor: 'rgba(244,67,54,0.07)' },
    actionT: { fontSize: 12, fontWeight: '700' },
    empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
    emptyT: { fontSize: 13, color: T.dim },
});

// ── Picker icon box ────────────────────────────────────────────────────────────
pk.iconBox = { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' };

// ── Maturity preview box ───────────────────────────────────────────────────────
const pv = StyleSheet.create({
    box: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
    label: { fontSize: 10, color: T.dim, letterSpacing: 1, marginBottom: 6 },
    // big: { fontSize: 26, fontWeight: '800', color: T.green, fontFamily: 'Syne' },
    // sm: { fontSize: 12, color: T.dim, marginTop: 4 },
    big: { fontSize: 26, fontWeight: '800', color: T.green, fontFamily: 'Poppins_700Bold' },
    sm: { fontSize: 12, color: T.dim, marginTop: 4, fontFamily: 'Poppins_600SemiBold' },
});

// ── Cap button (in form) ───────────────────────────────────────────────────────
const cpb = StyleSheet.create({
    b: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: T.border, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
    t: { fontSize: 12, color: T.dim, fontWeight: '600' },
});

// ── Main screen styles ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    blob1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,126,64,0.06)', top: -80, right: -80 },
    blob2: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(166,75,255,0.07)', bottom: 80, left: -80 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 58 : 44, paddingBottom: 16 },
    logo: { fontSize: 24, fontWeight: '800', fontFamily: 'Syne', letterSpacing: -0.5 },
    familyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: T.border },
    familyBtnT: { fontSize: 12, color: T.dim, fontWeight: '600' },

    // Tab rows
    tabRow: { flexGrow: 0, marginBottom: 10 },
    tabContent: { paddingHorizontal: 20, paddingVertical: 2 },

    // Member tabs (Glassify active, ghost inactive)
    tabPillInner: { paddingHorizontal: 16, paddingVertical: 7 },
    tabPillOff: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: T.border },
    tabLabel: { fontSize: 13, fontWeight: '700', color: T.dim },

    // Asset class tabs (solid active with gradient, plain inactive)
    assetTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginRight: 8, borderWidth: 1, borderColor: T.border, backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden' },
    assetTabActive: { borderColor: 'transparent' },
    assetTabLabel: { fontSize: 13, fontWeight: '700', color: T.dim },

    // Cap sub-tabs
    capTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: T.border, backgroundColor: 'rgba(255,255,255,0.02)' },
    capTabLabel: { fontSize: 12, fontWeight: '600', color: T.dim },

    content: { flex: 1 },

    ownerPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: T.border },
    ownerPillT: { fontSize: 13, color: T.white, fontWeight: '700' },
    ownerDropdown: { position: 'absolute', top: 38, right: 0, backgroundColor: '#0e0e18', borderRadius: 14, borderWidth: 1, borderColor: T.border, overflow: 'hidden', minWidth: 140 },
    ownerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border },
    ownerItemActive: { backgroundColor: 'rgba(166,75,255,0.12)' },
    ownerItemT: { fontSize: 13, color: T.dim, fontWeight: '600' },
});