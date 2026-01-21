import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar,
  StyleSheet,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuestionnaire } from '../../../../src/context/QuestionnaireContext';
import ScreenScrollView from '../../../../src/components/ScreenScrollView';

import { 
  colors, 
  globalStyles,
  isMobile 
} from '../../../../src/theme/globalStyles';

const Screen12 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();

  const progressData = {
    sectionData: {
      1: { isActive: false, progress: 0, isCompleted: true },
      2: { isActive: true, progress: 75, isCompleted: false },
      3: { isActive: false, progress: 0, isCompleted: false },
      4: { isActive: false, progress: 0, isCompleted: false },
      5: { isActive: false, progress: 0, isCompleted: false },
      6: { isActive: false, progress: 0, isCompleted: false },
    }
  };

  const sections = [
    { title: "Start" },
    { title: "Basic Information" },
    { title: "Income & Expenses" },
    { title: "Insurance" },
    { title: "Goal" },
    { title: "Psychology" }
  ];

  const getTotalMonthlyIncome = () => {
    const incomeData = answers.income_data || {};
    let total = 0;
    Object.values(incomeData).forEach(income => {
      if (income.has && income.amount) {
        total += parseFloat(income.amount) || 0;
      }
    });
    return total;
  };

  const getTotalMonthlyEMI = () => {
    const loanData = answers.loan_data || {};
    let total = 0;
    Object.values(loanData).forEach(loan => {
      if (loan.has && loan.emi) {
        total += parseFloat(loan.emi) || 0;
      }
    });
    return total;
  };

  const getTotalHouseExpenses = () => {
    const houseExpenses = answers.house_expenses || {};
    return Object.values(houseExpenses).reduce((sum, value) => {
      return sum + (parseFloat(value) || 0);
    }, 0);
  };

  const getMonthlyChildExpenses = () => {
    if (answers.dependents?.child > 0) {
      return answers.child_monthly_expense || 0;
    }
    return 0;
  };

  const getMonthlyDependentExpenses = () => {
    const dependentExpenses = answers.dependent_expenses || {};
    const hasOtherDeps = (answers.dependents?.spouse || 0) > 0 ||
      (answers.dependents?.parent || 0) > 0 ||
      (answers.dependents?.pet || 0) > 0;

    if (!hasOtherDeps) return 0;

    return Object.values(dependentExpenses).reduce((sum, value) => {
      return sum + (parseFloat(value) || 0);
    }, 0);
  };

  const totalIncome = getTotalMonthlyIncome();
  const totalEMI = getTotalMonthlyEMI();
  const houseExpenses = getTotalHouseExpenses();
  const childExpenses = getMonthlyChildExpenses();
  const dependentExpenses = getMonthlyDependentExpenses();

  const totalExpenses = totalEMI + houseExpenses + childExpenses + dependentExpenses;
  const remainingAmount = totalIncome - totalExpenses;

  const handleYesProceed = () => {
    updateAnswer('monthly_breakdown', {
      total_income: totalIncome,
      total_emi: totalEMI,
      house_expenses: houseExpenses,
      child_expenses: childExpenses,
      dependent_expenses: dependentExpenses,
      remaining_amount: remainingAmount
    });
    
    setTimeout(() => {
      console.log('Monthly breakdown confirmed');
      router.push('/(gowealthy)/questionnaire/section2/screen13');
    }, 500);
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />
      
      <View style={globalStyles.backgroundContainer}>
        <ScreenScrollView>
          <View style={globalStyles.appContainer}>
            <View style={globalStyles.header}>
              <TouchableOpacity style={globalStyles.backButton} onPress={handleGoBack}>
                <Text style={globalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <View style={globalStyles.logo}>
                <Text style={globalStyles.sectionTitle}>
                  Expense breakdown summary
                </Text>
              </View>
            </View>

            <View style={globalStyles.progressContainer}>
              {sections.map((section, index) => (
                <View key={index} style={globalStyles.progressStepContainer}>
                  <View
                    style={[
                      globalStyles.progressStep,
                      progressData?.sectionData?.[index + 1]?.isCompleted && globalStyles.progressStepCompleted,
                      progressData?.sectionData?.[index + 1]?.isActive && globalStyles.progressStepActive,
                    ]}
                  />
                  {index < sections.length - 1 && (
                    <View
                      style={[
                        globalStyles.progressLine,
                        progressData?.sectionData?.[index + 1]?.isCompleted && globalStyles.progressLineCompleted,
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>

            <View style={globalStyles.questionContainer}>
              <View style={{ width: '100%', alignItems: 'center' }}>
                <Text style={styles.questionText}>Your monthly financial summary:</Text>

                <View style={styles.summaryCardsContainer}>
                  {/* Income Card - Purple */}
                  <LinearGradient
                    colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.08)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.summaryCard, styles.incomeCard]}
                  >
                    <View style={styles.cardLeft}>
                      <Text style={styles.cardLabel}>Total Income</Text>
                      <Text style={styles.cardSubtitle}>Per month</Text>
                    </View>
                    <View style={styles.cardRight}>
                      <Text style={[styles.cardValue, styles.incomeValue]}>₹{totalIncome}K</Text>
                    </View>
                  </LinearGradient>

                  {/* Expense Card - Orange */}
                  <LinearGradient
                    colors={['rgba(251, 146, 60, 0.15)', 'rgba(251, 146, 60, 0.08)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.summaryCard, styles.expenseCard]}
                  >
                    <View style={styles.cardLeft}>
                      <Text style={styles.cardLabel}>Total Expenses</Text>
                      <Text style={styles.cardSubtitle}>Per month</Text>
                    </View>
                    <View style={styles.cardRight}>
                      <Text style={[styles.cardValue, styles.expenseValue]}>₹{totalExpenses}K</Text>
                    </View>
                  </LinearGradient>

                  {/* Surplus Card - Green */}
                  <LinearGradient
                    colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.08)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.summaryCard, styles.surplusCard]}
                  >
                    <View style={styles.cardLeft}>
                      <Text style={styles.cardLabel}>Monthly Surplus</Text>
                      <Text style={styles.cardSubtitle}>
                        {remainingAmount > 0 ? "Available for savings" : "Review expenses"}
                      </Text>
                    </View>
                    <View style={styles.cardRight}>
                      <Text style={[styles.cardValue, styles.surplusValue]}>₹{Math.max(0, remainingAmount)}K</Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Confirmation Section */}
                <View style={styles.confirmationSection}>
                  <Text style={styles.confirmationQuestion}>Does this look accurate?</Text>
                  <View style={styles.confirmationButtons}>
                    <TouchableOpacity
                      style={styles.noButton}
                      onPress={handleGoBack}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.05)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.noButtonInner}
                      >
                        <Text style={styles.buttonIcon}>←</Text>
                        <Text style={styles.noButtonText}>Adjust Expenses</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.yesButton}
                      onPress={handleYesProceed}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#10b981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.yesButtonInner}
                      >
                        <Text style={styles.buttonIcon}>✓</Text>
                        <Text style={styles.yesButtonText}>Yes, Continue</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScreenScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  questionText: {
    fontSize: isMobile ? 20 : 26,
    fontWeight: '600',
    color: colors.textColor,
    textAlign: 'center',
    marginBottom: isMobile ? 20 : 24,
  },

  summaryCardsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: isMobile ? 14 : 16,
    marginBottom: isMobile ? 20 : 24,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: isMobile ? 16 : 20,
    paddingHorizontal: isMobile ? 20 : 24,
    borderRadius: 16,
    borderWidth: 2,
  },

  incomeCard: {
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },

  expenseCard: {
    borderColor: 'rgba(251, 146, 60, 0.4)',
  },

  surplusCard: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },

  cardLeft: {
    flex: 1,
    gap: 4,
  },

  cardRight: {
    alignItems: 'flex-end',
  },

  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textColor,
  },

  cardValue: {
    fontSize: isMobile ? 22 : 28,
    fontWeight: '800',
  },

  incomeValue: {
    color: '#a78bfa',
  },

  expenseValue: {
    color: '#fb923c',
  },

  surplusValue: {
    color: '#10b981',
  },

  cardSubtitle: {
    fontSize: 11,
    color: colors.subtitleColor,
    opacity: 0.85,
    lineHeight: 14,
  },

  confirmationSection: {
    width: '100%',
    maxWidth: 450,
    alignItems: 'center',
    gap: 20,
    marginTop: 16,
  },

  confirmationQuestion: {
    fontSize: isMobile ? 18 : 24,
    fontWeight: '700',
    color: colors.textColor,
    textAlign: 'center',
  },

  confirmationButtons: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
  },

  noButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },

  noButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: isMobile ? 14 : 18,
    paddingHorizontal: isMobile ? 18 : 28,
  },

  noButtonText: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '700',
    color: colors.textColor,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  yesButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },

  yesButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: isMobile ? 14 : 18,
    paddingHorizontal: isMobile ? 18 : 28,
  },

  yesButtonText: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '700',
    color: colors.textColor,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  buttonIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textColor,
  },
});

export default Screen12;