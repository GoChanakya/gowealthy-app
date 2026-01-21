import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  StatusBar,
  StyleSheet,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuestionnaire } from '../../../../src/context/QuestionnaireContext';

import { 
  colors, 
  globalStyles,
  isMobile 
} from '../../../../src/theme/globalStyles';

const Screen11 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();
  
  const [dependentExpenses, setDependentExpenses] = useState(answers.dependent_expenses || {
    spouse: '',
    parent: '',
    pet: ''
  });

  const progressData = {
    sectionData: {
      1: { isActive: false, progress: 0, isCompleted: true },
      2: { isActive: true, progress: 60, isCompleted: false },
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

  const dependents = answers.dependents || {};
  const activeDependents = [
    {
      key: 'spouse',
      label: 'Spouse',
      emoji: '💑',
      image: require('../../../../assets/images/page_images/spouse.png'),
      count: dependents.spouse || 0
    },
    {
      key: 'parent',
      label: 'Parent',
      emoji: '👨‍🦳',
      image: require('../../../../assets/images/page_images/parent.png'),
      count: dependents.parent || 0
    },
    {
      key: 'pet',
      label: 'Pet',
      emoji: '🐕',
      image: require('../../../../assets/images/page_images/pet.png'),
      count: dependents.pet || 0
    }
  ].filter(dep => dep.count >= 1);

  const handleExpenseChange = (key, value) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDependentExpenses(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const canContinue = () => {
    return Object.values(dependentExpenses).some(value => value !== '');
  };

  const handleContinue = () => {
    if (canContinue()) {
      updateAnswer('dependent_expenses', dependentExpenses);
      console.log('Dependent expenses:', dependentExpenses);
      router.push('/(gowealthy)/questionnaire/section2/screen12');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const convertToWords = (amount) => {
    if (!amount || amount === '') return '';

    const num = parseFloat(amount);
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

  if (activeDependents.length === 0) {
    setTimeout(() => {
      router.push('/(gowealthy)/questionnaire/section2/screen12');
    }, 100);
    return null;
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />
      
      <View style={globalStyles.backgroundContainer}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={globalStyles.appContainer}>
            <View style={globalStyles.header}>
              <TouchableOpacity style={globalStyles.backButton} onPress={handleBack}>
                <Text style={globalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <View style={globalStyles.logo}>
                <Text style={globalStyles.sectionTitle}>
                  Other dependent expenses
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
                  How much do you spend on your dependents monthly?
                </Text>

                <View style={styles.dependentsExpensesContainer}>
                  {activeDependents.map((dependent) => (
                    <View key={dependent.key} style={styles.dependentExpenseItem}>
                      <View style={styles.dependentExpenseHeader}>
                        <Image
                          source={dependent.image}
                          style={styles.dependentImage}
                          resizeMode="contain"
                        />
                        <Text style={styles.dependentExpenseLabel}>
                          {dependent.label} {dependent.count > 1 ? `(${dependent.count})` : ''}
                        </Text>
                      </View>

                      <View style={styles.dependentExpenseInputWrapper}>
                        <Text style={styles.dependentExpenseRupee}>₹</Text>
                        <TextInput
                          style={styles.dependentExpenseInput}
                          placeholder="thousands"
                          placeholderTextColor={colors.subtitleColor}
                          keyboardType="decimal-pad"
                          value={dependentExpenses[dependent.key]}
                          onChangeText={(value) => handleExpenseChange(dependent.key, value)}
                        />
                        <Text style={styles.dependentExpenseUnit}>K</Text>
                      </View>

                      {dependentExpenses[dependent.key] && (
                        <Text style={styles.amountInWords}>
                          {convertToWords(dependentExpenses[dependent.key])}
                        </Text>
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
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  dependentsExpensesContainer: {
    width: '100%',
    maxWidth: 420,
    gap: isMobile ? 20 : 24,
  },

  dependentExpenseItem: {
    width: '100%',
    gap: 12,
  },

  dependentExpenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  dependentImage: {
    width: isMobile ? 40 : 50,
    height: isMobile ? 40 : 50,
  },

  dependentExpenseLabel: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: colors.textColor,
  },

  dependentExpenseInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.optionBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: colors.optionBorder,
  },

  dependentExpenseRupee: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: colors.textColor,
    marginRight: 8,
  },

  dependentExpenseInput: {
    flex: 1,
    fontSize: isMobile ? 14 : 16,
    color: colors.textColor,
    fontWeight: '500',
  },

  dependentExpenseUnit: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: colors.subtitleColor,
    marginLeft: 8,
  },

  amountInWords: {
    fontSize: 13,
    color: colors.primaryOrange,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default Screen11;