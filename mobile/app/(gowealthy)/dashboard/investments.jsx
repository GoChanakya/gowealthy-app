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

const Insurance = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* ---------------- Fetch user ---------------- */
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const phone = await AsyncStorage.getItem('user_phone');
                const snap = await getDoc(doc(db, 'users', phone));
                if (!snap.exists()) throw new Error('User not found');
                setUserData(snap.data());
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ---------------- Normalize insurance ---------------- */
    const normalizeQuestionnaireInsurance = (insuranceData = {}) => {
        return Object.entries(insuranceData)
            .filter(([, v]) => v?.has)
            .map(([key, v]) => ({
                id: `q_${key}`,
                source: 'questionnaire',
                questionnaireKey: key,
                type: key.charAt(0).toUpperCase() + key.slice(1),
                provider: v.provider || '',
                policyNumber: v.policy_number || '',
                coverageAmount: v.sum_insured ? v.sum_insured * 1000 : '',
                premiumAmount: v.premium ? v.premium * 1000 : '',
                startDate: v.start_date || '',
                endDate: v.end_date || '',
                status: v.status || '',
            }));
    };

    const normalizeInvestmentInsurance = (insurance = {}) =>
        (insurance.policies || []).map(p => ({
            ...p,
            source: 'investment',
        }));

    /* ---------------- Combined data ---------------- */
    const investmentData = useMemo(() => {
        if (!userData) return {};
        const investments = userData.investments || {};

        return {
            insurance: {
                policies: [
                    ...normalizeQuestionnaireInsurance(userData.insurance_data),
                    ...normalizeInvestmentInsurance(investments.insurance || {}),
                ],
            },
            stocksMF: investments.stocksMF || { holdings: [] },
            fixedDeposits: investments.fixedDeposits || { deposits: [] },
            other: investments.other || { assets: [] },
        };
    }, [userData]);

    const refreshUser = async () => {
        const phone = await AsyncStorage.getItem('user_phone');
        const snap = await getDoc(doc(db, 'users', phone));
        setUserData(snap.data());
    };

    /* ---------------- Insurance CRUD ---------------- */

    const handleAddInsurancePolicy = async (policy) => {
        const phone = await AsyncStorage.getItem('user_phone');

        const cleanPolicy = {
            ...policy,
            id: `ins_${Date.now()}`,
            source: 'investment',
        };

        await updateDoc(doc(db, 'users', phone), {
            'investments.insurance.policies': arrayUnion(cleanPolicy),
            'investments.insurance.lastUpdated': new Date().toISOString(),
        });

        await refreshUser();
        return { success: true };
    };

    const handleUpdateInsurancePolicy = async (policy) => {
        const phone = await AsyncStorage.getItem('user_phone');
        const ref = doc(db, 'users', phone);

        if (policy.source === 'questionnaire') {
            await updateDoc(ref, {
                [`insurance_data.${policy.questionnaireKey}`]: {
                    has: true,
                    provider: policy.provider,
                    policy_number: policy.policyNumber,
                    sum_insured: policy.coverageAmount
                        ? policy.coverageAmount / 1000
                        : '',
                    premium: policy.premiumAmount
                        ? policy.premiumAmount / 1000
                        : '',
                    start_date: policy.startDate,
                    end_date: policy.endDate,
                    status: policy.status,
                },
            });
        } else {
            const updated = userData.investments.insurance.policies.map(p =>
                p.id === policy.id ? { ...policy, source: 'investment' } : p
            );

            await updateDoc(ref, {
                'investments.insurance.policies': updated,
                'investments.insurance.lastUpdated': new Date().toISOString(),
            });
        }

        await refreshUser();
        return { success: true };
    };

    const handleDeleteInsurancePolicy = async (policy) => {
        const phone = await AsyncStorage.getItem('user_phone');
        const ref = doc(db, 'users', phone);

        if (policy.source === 'questionnaire') {
            await updateDoc(ref, {
                [`insurance_data.${policy.questionnaireKey}.has`]: false,
            });
        } else {
            await updateDoc(ref, {
                'investments.insurance.policies': arrayRemove(policy),
            });
        }

        await refreshUser();
        return { success: true };
    };

    /* ---------------- Stocks & MF CRUD ---------------- */

    const handleAddInvestment = async (type, item) => {
        const phone = await AsyncStorage.getItem('user_phone');
        const ref = doc(db, 'users', phone);

        const keyMap = {
            stocksMF: 'holdings',
            fixedDeposits: 'deposits',
            other: 'assets',
        };

        await updateDoc(ref, {
            [`investments.${type}.${keyMap[type]}`]: arrayUnion(item),
            [`investments.${type}.lastUpdated`]: new Date().toISOString(),
        });

        await refreshUser();
        return { success: true };
    };

    const handleUpdateInvestment = async (type, updatedItem) => {
        const phone = await AsyncStorage.getItem('user_phone');
        const ref = doc(db, 'users', phone);

        const keyMap = {
            stocksMF: 'holdings',
            fixedDeposits: 'deposits',
            other: 'assets',
        };

        const current =
            userData?.investments?.[type]?.[keyMap[type]] || [];

        const updated = current.map(item =>
            item.id === updatedItem.id ? updatedItem : item
        );

        await updateDoc(ref, {
            [`investments.${type}.${keyMap[type]}`]: updated,
            [`investments.${type}.lastUpdated`]: new Date().toISOString(),
        });

        await refreshUser();
        return { success: true };
    };

    const handleDeleteInvestment = async (type, item) => {
        const phone = await AsyncStorage.getItem('user_phone');
        const ref = doc(db, 'users', phone);

        const keyMap = {
            stocksMF: 'holdings',
            fixedDeposits: 'deposits',
            other: 'assets',
        };

        await updateDoc(ref, {
            [`investments.${type}.${keyMap[type]}`]: arrayRemove(item),
        });

        await refreshUser();
        return { success: true };
    };


    /* ---------------- UI ---------------- */
    if (loading) {
        return (
            <Modal transparent visible>
                <View style={styles.loadingModal}>
                    <ActivityIndicator size="large" color="#a855f7" />
                    <Text style={styles.loadingText}>Loading Insurance</Text>
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
                onAdd={(h) => handleAddInvestment('stocksMF', h)}
                onUpdate={(h) => handleUpdateInvestment('stocksMF', h)}
                onDelete={(h) => handleDeleteInvestment('stocksMF', h)}
            />

            <FixedDepositCard
                data={investmentData.fixedDeposits}
                onAdd={(fd) => handleAddInvestment('fixedDeposits', fd)}
                onUpdate={(fd) => handleUpdateInvestment('fixedDeposits', fd)}
                onDelete={(fd) => handleDeleteInvestment('fixedDeposits', fd)}
            />

            <OtherInvestmentsCard
                data={investmentData.other}
                onAdd={(a) => handleAddInvestment('other', a)}
                onUpdate={(a) => handleUpdateInvestment('other', a)}
                onDelete={(a) => handleDeleteInvestment('other', a)}
            />


            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 16 },
    loadingModal: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#fff', marginTop: 10 },
    errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorTitle: { color: 'red', fontSize: 18 },
    errorText: { color: '#fff' },
});

export default Insurance;
