import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuestionnaire } from '../../../../src/context/QuestionnaireContext';
import ScreenScrollView from '../../../../src/components/ScreenScrollView';

import { 
  colors, 
  globalStyles,
  shadows,
  isMobile 
} from '../../../../src/theme/globalStyles';

const Screen7 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();
  
  const hasSpouse = answers.dependents?.spouse > 0;

  const [incomeData, setIncomeData] = useState(answers.income_data || {
    salary_business: { has: false, amount: '' },
    rental: { has: false, amount: '' },
    other: { has: false, amount: '' },
    spouse: { has: false, amount: '' }
  });

  const progressData = {
    sectionData: {
      1: { isActive: false, progress: 0, isCompleted: true },
      2: { isActive: true, progress: 0, isCompleted: false },
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

  const incomeTypes = [
    { key: 'salary_business', label: 'Salary or Business Income', icon: '💼', show: true },
    { key: 'rental', label: 'Rental Income', icon: '🏠', show: true },
    { key: 'other', label: 'Other Income', icon: '💰', show: true },
    { key: 'spouse', label: 'Spouse Income', icon: '💑', show: hasSpouse }
  ].filter(item => item.show);

  const handleToggle = (key) => {
    setIncomeData(prev => ({
      ...prev,
      [key]: {
        has: !prev[key].has,
        amount: !prev[key].has ? prev[key].amount : ''
      }
    }));
  };

  const handleAmountChange = (key, value) => {
    if (/^\d{0,4}$/.test(value)) {
      setIncomeData(prev => ({
        ...prev,
        [key]: { ...prev[key], amount: value }
      }));
    }
  };

  const canContinue = () => {
    return incomeTypes.some(type =>
      incomeData[type.key].has &&
      incomeData[type.key].amount &&
      parseInt(incomeData[type.key].amount, 10) > 0
    );
  };

  const handleContinue = () => {
    if (canContinue()) {
      updateAnswer('income_data', incomeData);
      console.log('Income data:', incomeData);
      router.push('/(gowealthy)/questionnaire/section2/screen8');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const convertToWords = (amount) => {
    if (!amount || amount === '') return '';
    const num = parseInt(amount, 10);
    if (num === 0) return '';

    const actualAmount = num * 1000;

    if (actualAmount >= 10000000) {
      const crores = actualAmount / 10000000;
      const formattedCrores = crores % 1 === 0 ? crores.toString() : crores.toFixed(2);
      return `${formattedCrores === '1.00' || formattedCrores === '1' ? 'one' : formattedCrores} crore${crores > 1 ? 's' : ''} per month`;
    } else if (actualAmount >= 100000) {
      const lakhs = actualAmount / 100000;
      const formattedLakhs = lakhs % 1 === 0 ? lakhs.toString() : lakhs.toFixed(2);
      return `${formattedLakhs === '1.00' || formattedLakhs === '1' ? 'one' : formattedLakhs} lakh${lakhs > 1 ? 's' : ''} per month`;
    } else if (actualAmount >= 1000) {
      const thousands = actualAmount / 1000;
      const formattedThousands = thousands % 1 === 0 ? thousands.toString() : thousands.toFixed(2);
      return `${formattedThousands} thousand per month`;
    } else {
      return `${actualAmount} per month`;
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />
      
      <View style={globalStyles.backgroundContainer}>
        <ScreenScrollView 
        >
          <View style={globalStyles.appContainer}>
            <View style={globalStyles.header}>
              <TouchableOpacity style={globalStyles.backButton} onPress={handleBack}>
                <Text style={globalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <View style={globalStyles.logo}>
                <Text style={globalStyles.sectionTitle}>
                  Let's understand your income sources
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
                <Text style={globalStyles.questionText}>
                  What are your <Text style={{ color: colors.accentColor }}>monthly</Text>{'\n'}income sources?
                </Text>

                <View style={styles.incomeContainer}>
                  {incomeTypes.map((type) => (
                    <View key={type.key} style={styles.incomeItem}>
                      <View style={styles.incomeHeader}>
                        <Text style={styles.incomeIcon}>{type.icon}</Text>
                        <Text style={styles.incomeLabel}>{type.label}</Text>
                        <Switch
                          value={incomeData[type.key].has}
                          onValueChange={() => handleToggle(type.key)}
                          trackColor={{ false: colors.optionBorder, true: colors.accentColor }}
                          thumbColor={colors.textColor}
                        />
                      </View>

                      {incomeData[type.key].has && (
                        <View style={styles.incomeInputContainer}>
                          <View style={styles.incomeInputWrapper}>
                            <Text style={styles.incomeRupee}>₹</Text>
                            <TextInput
                              style={styles.incomeInput}
                              placeholder="thousands"
                              placeholderTextColor={colors.subtitleColor}
                              keyboardType="numeric"
                              value={incomeData[type.key].amount}
                              onChangeText={(value) => handleAmountChange(type.key, value)}
                              maxLength={4}
                            />
                            <Text style={styles.incomeUnit}>K</Text>
                          </View>
                          {incomeData[type.key].amount && (
                            <Text style={styles.amountInWords}>
                              {convertToWords(incomeData[type.key].amount)}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
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
  incomeContainer: {
    width: '100%',
    maxWidth: 420,
    gap: isMobile ? 16 : 20,
  },

  incomeItem: {
    width: '100%',
    padding: isMobile ? 16 : 20,
    borderRadius: 12,
    backgroundColor: colors.optionBackground,
    borderWidth: 2,
    borderColor: colors.optionBorder,
    gap: 12,
  },

  incomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  incomeIcon: {
    fontSize: isMobile ? 20 : 24,
    marginRight: 12,
    width: 32,
  },

  incomeLabel: {
    flex: 1,
    fontSize: isMobile ? 14 : 16,
    fontWeight: '500',
    color: colors.textColor,
  },

  incomeInputContainer: {
    gap: 8,
  },

  incomeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.optionBorder,
  },

  incomeRupee: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: colors.textColor,
    marginRight: 8,
  },

  incomeInput: {
    flex: 1,
    fontSize: isMobile ? 14 : 16,
    color: colors.textColor,
    fontWeight: '500',
  },

  incomeUnit: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: colors.subtitleColor,
    marginLeft: 8,
  },

  amountInWords: {
    fontSize: 13,
    color: colors.primaryOrange,  // CHANGED TO ORANGE
    fontStyle: 'italic',
    textAlign: 'center',  // CENTERED
    marginTop: 4,
  },
});

export default Screen7;