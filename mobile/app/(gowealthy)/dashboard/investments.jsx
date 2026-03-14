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


import AsyncStorage from '@react-native-async-storage/async-storage';
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { db } from '../../../src/config/firebase';

import FixedDepositCard from '../../../src/components/Investment/FixedDepositCard';
import InsuranceCard from '../../../src/components/Investment/InsuranceCard';
import OtherInvestmentsCard from '../../../src/components/Investment/OtherInvestmentsCard';
import StockMFCard from '../../../src/components/Investment/StockMFCard';

const COLLECTION = 'questionnaire_submissions';

const Insurance = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* ---------------- Fetch user ---------------- */
    const fetchUser = async () => {
        const phone = await AsyncStorage.getItem('user_phone');
        const snap = await getDoc(doc(db, COLLECTION, phone));
        if (!snap.exists()) throw new Error('User not found');
        return snap.data();
    };

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setUserData(await fetchUser());
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const refreshUser = async () => {
        try {
            setUserData(await fetchUser());
        } catch (e) {
            console.error('refreshUser error:', e);
        }
    };

    /* ---------------- Normalize insurance ---------------- */
    // insurance_data lives at raw_answers.insurance_data in the DB
    const normalizeQuestionnaireInsurance = (insuranceData = {}) => {
        return Object.entries(insuranceData)
            .filter(([, v]) => v?.has)
            .map(([key, v]) => ({
                id: `q_${key}`,
                source: 'questionnaire',
                questionnaireKey: key,
                // capitalize first letter: "health" → "Health"
                type: key.charAt(0).toUpperCase() + key.slice(1),
                provider: v.provider || '',
                policyNumber: v.policy_number || '',
                // DB stores values in thousands as strings e.g. "200" means ₹2,00,000
                coverageAmount: v.sum_insured ? parseFloat(v.sum_insured) * 1000 : 0,
                premiumAmount:  v.premium     ? parseFloat(v.premium)     * 1000 : 0,
                startDate: v.start_date || '',
                endDate:   v.end_date   || '',
                status:    v.status     || 'Active',
            }));
    };

    const normalizeInvestmentInsurance = (insurance = {}) =>
        (insurance.policies || []).map(p => ({ ...p, source: 'investment' }));

    /* ---------------- Combined data ---------------- */
    const investmentData = useMemo(() => {
        if (!userData) return {};

        // insurance_data is under raw_answers
        const rawAnswers  = userData.raw_answers   || {};
        const investments = userData.investments    || {};

        return {
            insurance: {
                policies: [
                    ...normalizeQuestionnaireInsurance(rawAnswers.insurance_data),
                    ...normalizeInvestmentInsurance(investments.insurance || {}),
                ],
            },
            stocksMF:      investments.stocksMF      || { holdings: [] },
            fixedDeposits: investments.fixedDeposits || { deposits: [] },
            other:         investments.other         || { assets: [] },
        };
    }, [userData]);

    /* ---------------- Insurance CRUD ---------------- */
    const handleAddInsurancePolicy = async (policy) => {
        try {
            const phone = await AsyncStorage.getItem('user_phone');
            const cleanPolicy = { ...policy, id: `ins_${Date.now()}`, source: 'investment' };

            await updateDoc(doc(db, COLLECTION, phone), {
                'investments.insurance.policies': arrayUnion(cleanPolicy),
                'investments.insurance.lastUpdated': new Date().toISOString(),
            });

            await refreshUser();
            return { success: true };
        } catch (e) {
            console.error('handleAddInsurancePolicy:', e);
            return { success: false, error: e.message };
        }
    };

    const handleUpdateInsurancePolicy = async (policy) => {
        try {
            const phone = await AsyncStorage.getItem('user_phone');
            const ref   = doc(db, COLLECTION, phone);

            if (policy.source === 'questionnaire') {
                // Update directly inside raw_answers.insurance_data
                await updateDoc(ref, {
                    [`raw_answers.insurance_data.${policy.questionnaireKey}`]: {
                        has:         true,
                        provider:    policy.provider,
                        policy_number: policy.policyNumber,
                        // store back as thousands string to match DB format
                        sum_insured: policy.coverageAmount ? String(policy.coverageAmount / 1000) : '',
                        premium:     policy.premiumAmount  ? String(policy.premiumAmount  / 1000) : '',
                        start_date:  policy.startDate,
                        end_date:    policy.endDate,
                        status:      policy.status,
                    },
                });
            } else {
                const current = userData?.investments?.insurance?.policies || [];
                const updated = current.map(p =>
                    p.id === policy.id ? { ...policy, source: 'investment' } : p
                );
                await updateDoc(ref, {
                    'investments.insurance.policies': updated,
                    'investments.insurance.lastUpdated': new Date().toISOString(),
                });
            }

            await refreshUser();
            return { success: true };
        } catch (e) {
            console.error('handleUpdateInsurancePolicy:', e);
            return { success: false, error: e.message };
        }
    };

    const handleDeleteInsurancePolicy = async (policy) => {
        try {
            const phone = await AsyncStorage.getItem('user_phone');
            const ref   = doc(db, COLLECTION, phone);

            if (policy.source === 'questionnaire') {
                await updateDoc(ref, {
                    [`raw_answers.insurance_data.${policy.questionnaireKey}.has`]: false,
                    [`raw_answers.insurance_data.${policy.questionnaireKey}.premium`]: "0",
                    [`raw_answers.insurance_data.${policy.questionnaireKey}.sum_insured`]: "0",
                });
            } else {
                await updateDoc(ref, {
                    'investments.insurance.policies': arrayRemove(policy),
                });
            }

            await refreshUser();
            return { success: true };
        } catch (e) {
            console.error('handleDeleteInsurancePolicy:', e);
            return { success: false, error: e.message };
        }
    };

    /* ---------------- Stocks, FD, Other CRUD ---------------- */
    const KEY_MAP = { stocksMF: 'holdings', fixedDeposits: 'deposits', other: 'assets' };

    const handleAddInvestment = async (type, item) => {
        try {
            const phone = await AsyncStorage.getItem('user_phone');
            await updateDoc(doc(db, COLLECTION, phone), {
                [`investments.${type}.${KEY_MAP[type]}`]: arrayUnion(item),
                [`investments.${type}.lastUpdated`]: new Date().toISOString(),
            });
            await refreshUser();
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    const handleUpdateInvestment = async (type, updatedItem) => {
        try {
            const phone   = await AsyncStorage.getItem('user_phone');
            const current = userData?.investments?.[type]?.[KEY_MAP[type]] || [];
            const updated = current.map(i => i.id === updatedItem.id ? updatedItem : i);
            await updateDoc(doc(db, COLLECTION, phone), {
                [`investments.${type}.${KEY_MAP[type]}`]: updated,
                [`investments.${type}.lastUpdated`]: new Date().toISOString(),
            });
            await refreshUser();
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    const handleDeleteInvestment = async (type, item) => {
        try {
            const phone = await AsyncStorage.getItem('user_phone');
            await updateDoc(doc(db, COLLECTION, phone), {
                [`investments.${type}.${KEY_MAP[type]}`]: arrayRemove(item),
            });
            await refreshUser();
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    /* ---------------- UI ---------------- */
    if (loading) {
        return (
            <Modal transparent visible>
                <View style={styles.loadingModal}>
                    <ActivityIndicator size="large" color={PURPLE} />
                    <Text style={styles.loadingText}>Loading Investments…</Text>
                </View>
            </Modal>
        );
    }

    if (error) {
        return (
            <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Error</Text>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <InsuranceCard
                data={investmentData.insurance}
                onAdd={handleAddInsurancePolicy}
                onUpdate={handleUpdateInsurancePolicy}
                onDelete={handleDeleteInsurancePolicy}
            />

            <StockMFCard
                data={investmentData.stocksMF}
                onAdd={(h)  => handleAddInvestment('stocksMF', h)}
                onUpdate={(h)  => handleUpdateInvestment('stocksMF', h)}
                onDelete={(h)  => handleDeleteInvestment('stocksMF', h)}
            />

            <FixedDepositCard
                data={investmentData.fixedDeposits}
                onAdd={(fd) => handleAddInvestment('fixedDeposits', fd)}
                onUpdate={(fd) => handleUpdateInvestment('fixedDeposits', fd)}
                onDelete={(fd) => handleDeleteInvestment('fixedDeposits', fd)}
            />

            <OtherInvestmentsCard
                data={investmentData.other}
                onAdd={(a)  => handleAddInvestment('other', a)}
                onUpdate={(a)  => handleUpdateInvestment('other', a)}
                onDelete={(a)  => handleDeleteInvestment('other', a)}
            />

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const PURPLE = 'rgb(108,80,196)';

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#000', padding: 16 },
    loadingModal: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
    loadingText:  { color: '#fff', marginTop: 12, fontSize: 14 },
    errorBox:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    errorTitle:   { color: '#ef4444', fontSize: 18, fontWeight: '700', marginBottom: 8 },
    errorText:    { color: '#9ca3af', textAlign: 'center' },
});

export default Insurance;