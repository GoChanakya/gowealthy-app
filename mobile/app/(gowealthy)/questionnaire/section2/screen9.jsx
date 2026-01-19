import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  StatusBar,
  StyleSheet,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { useQuestionnaire } from '../../../../src/context/QuestionnaireContext';
import ScreenScrollView from '../../../../src/components/ScreenScrollView';
import { 
  colors, 
  globalStyles,
  isMobile 
} from '../../../../src/theme/globalStyles';

const Screen9 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();
  
  const [houseExpenses, setHouseExpenses] = useState(answers.house_expenses || {
    rent_maintenance: 0,
    groceries: 0,
    help_salaries: 0,
    shopping_dining_entertainment: 0
  });

  const [totalAmount, setTotalAmount] = useState(0);
  const [sliderMaxValues, setSliderMaxValues] = useState({
    rent_maintenance: 0,
    groceries: 0,
    help_salaries: 0,
    shopping_dining_entertainment: 0
  });

  const progressData = {
    sectionData: {
      1: { isActive: false, progress: 0, isCompleted: true },
      2: { isActive: true, progress: 30, isCompleted: false },
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

  const getTotalIncome = () => {
    const incomeData = answers.income_data || {};
    let total = 0;
    Object.values(incomeData).forEach(income => {
      if (income.has && income.amount) {
        total += parseFloat(income.amount) || 0;
      }
    });
    return total;
  };

  const totalIncome = getTotalIncome();

  const getStepSize = () => {
    if (totalIncome <= 30) return 1;
    else if (totalIncome <= 150) return 5;
    else return 10;
  };

  const getRemainingIncomeForSlider = (currentKey) => {
    let usedIncome = 0;
    Object.keys(houseExpenses).forEach(key => {
      if (key !== currentKey) {
        usedIncome += parseFloat(houseExpenses[key]) || 0;
      }
    });
    return Math.max(0, totalIncome - usedIncome);
  };

  const calculateAllMaxValues = () => {
    const newMaxValues = {};
    Object.keys(houseExpenses).forEach(key => {
      const remainingIncome = getRemainingIncomeForSlider(key);
      newMaxValues[key] = remainingIncome;
    });
    return newMaxValues;
  };

  useEffect(() => {
    const total = Object.values(houseExpenses).reduce((sum, value) => {
      return sum + (parseFloat(value) || 0);
    }, 0);
    setTotalAmount(total);

    const newMaxValues = calculateAllMaxValues();
    setSliderMaxValues(newMaxValues);
  }, [houseExpenses, totalIncome]);

  useEffect(() => {
    const initialMaxValues = calculateAllMaxValues();
    setSliderMaxValues(initialMaxValues);
  }, []);

  const handleSliderChange = (key, value) => {
    const numValue = parseInt(value) || 0;
    const maxValue = sliderMaxValues[key];
    const clampedValue = Math.min(numValue, maxValue);

    setHouseExpenses(prev => {
      const newExpenses = {
        ...prev,
        [key]: clampedValue
      };

      const newTotal = Object.values(newExpenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

      if (newTotal > totalIncome) {
        const otherExpensesTotal = Object.keys(newExpenses)
          .filter(k => k !== key)
          .reduce((sum, k) => sum + (parseFloat(newExpenses[k]) || 0), 0);

        const maxPossibleValue = Math.max(0, totalIncome - otherExpensesTotal);
        newExpenses[key] = maxPossibleValue;
      }

      return newExpenses;
    });
  };

  const canContinue = () => {
    return Object.values(houseExpenses).some(value => value && parseFloat(value) > 0);
  };

  const handleContinue = () => {
    if (canContinue()) {
      updateAnswer('house_expenses', houseExpenses);
      console.log('House expenses:', houseExpenses);
      
      const hasChild = answers.dependents?.child > 0;
      router.push(hasChild ? '/(gowealthy)/questionnaire/section2/screen10' : '/(gowealthy)/questionnaire/section2/screen11');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getRemainingIncome = () => {
    return Math.max(0, totalIncome - totalAmount);
  };

  const expenseCategories = [
    { key: 'rent_maintenance', label: 'Rent, Maintenance, Bills, Subscriptions' },
    { key: 'groceries', label: 'Groceries, Medicines, Gym, Salon' },
    { key: 'help_salaries', label: 'Househelp Salaries' },
    { key: 'shopping_dining_entertainment', label: 'Dining Out, Entertainment, Local Travel' }
  ];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />
      
      <View style={globalStyles.backgroundContainer}>
        <ScreenScrollView >
          <View style={globalStyles.appContainer}>
            <View style={globalStyles.header}>
              <TouchableOpacity style={globalStyles.backButton} onPress={handleBack}>
                <Text style={globalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <View style={globalStyles.logo}>
                <Text style={globalStyles.sectionTitle}>
                  Let's work through your expenses...
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
                <Text style={globalStyles.questionText}>Your monthly house expenses:</Text>

                <Image
                  source={require('../../../../assets/images/page_images/home.png')}
                  style={styles.houseImage}
                  resizeMode="contain"
                />

                <View style={styles.summaryBoxesContainer}>
                  <LinearGradient
                    colors={['rgba(255, 107, 53, 0.1)', 'rgba(255, 107, 53, 0.05)']}
                    style={styles.summaryBox}
                  >
                    <Text style={styles.summaryLabel}>Total Monthly Expense</Text>
                    <Text style={[styles.summaryValue, { color: colors.primaryOrange }]}>₹{totalAmount}K</Text>
                  </LinearGradient>

                  <LinearGradient
                    colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
                    style={styles.summaryBox}
                  >
                    <Text style={styles.summaryLabel}>Remaining Monthly</Text>
                    <Text style={[styles.summaryValue, { color: colors.primaryPurple }]}>₹{getRemainingIncome()}K</Text>
                  </LinearGradient>
                </View>

                <View style={styles.expenseSlidersContainer}>
                  {expenseCategories.map((category) => {
                    const maxValue = sliderMaxValues[category.key] || 0;
                    const currentValue = houseExpenses[category.key] || 0;
                    const stepSize = getStepSize();

                    return (
                      <View key={category.key} style={styles.expenseSliderSection}>
                        <View style={styles.sliderHeader}>
                          <Text style={styles.expenseSliderLabel}>{category.label}</Text>
                          <Text style={styles.expenseSliderValue}>₹{currentValue}K</Text>
                        </View>

                        <View style={styles.expenseSliderContainer}>
                          <Text style={styles.sliderMinMax}>0K</Text>
                          <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={maxValue}
                            step={stepSize}
                            value={currentValue}
                            onValueChange={(value) => handleSliderChange(category.key, value)}
                            minimumTrackTintColor={colors.accentColor}
                            maximumTrackTintColor={colors.optionBorder}
                            thumbTintColor={colors.accentColor}
                            disabled={maxValue === 0}
                          />
                          <Text style={styles.sliderMinMax}>{Math.round(maxValue)}K</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View style={[
                  globalStyles.confirmButton,
                  !canContinue() && globalStyles.confirmButtonDisabled
                ]}>
                  {canContinue() ? (
                    <TouchableOpacity onPress={handleContinue} activeOpacity={0.8}>
                      <LinearGradient
                        colors={[colors.gradientPurple1, colors.gradientPurple2]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={globalStyles.buttonInner}
                      >
                        <Text style={globalStyles.confirmButtonText}>Continue</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <View style={globalStyles.buttonInner}>
                      <Text style={[globalStyles.confirmButtonText, { color: colors.subtitleColor }]}>
                        Continue
                      </Text>
                    </View>
                  )}
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
  houseImage: {
    width: isMobile ? 150 : 230,
    height: isMobile ? 150 : 230,
    marginBottom: isMobile ? 20 : 30,
  },

  summaryBoxesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: isMobile ? 25 : 35,
    width: '100%',
    maxWidth: 420,
  },

  summaryBox: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: isMobile ? 12 : 16,
    paddingHorizontal: isMobile ? 16 : 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  summaryLabel: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: '500',
    color: colors.textColor,
    opacity: 0.8,
  },

  summaryValue: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: '700',
  },

  expenseSlidersContainer: {
    width: '100%',
    maxWidth: 400,
    gap: isMobile ? 25 : 35,
  },

  expenseSliderSection: {
    gap: 15,
  },

  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  expenseSliderLabel: {
    flex: 1,
    fontSize: isMobile ? 13 : 16,
    fontWeight: '300',
    color: colors.textColor,
    lineHeight: isMobile ? 16 : 20,
  },

  expenseSliderValue: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: colors.accentColor,
  },

  expenseSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  sliderMinMax: {
    fontSize: isMobile ? 12 : 14,
    color: colors.subtitleColor,
    minWidth: isMobile ? 30 : 35,
    textAlign: 'center',
    fontWeight: '500',
  },

  slider: {
    flex: 1,
    height: 40,
  },
});

export default Screen9;