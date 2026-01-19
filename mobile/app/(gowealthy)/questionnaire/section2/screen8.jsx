import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  StatusBar,
  StyleSheet
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

const Screen8 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();
  
  const [loanData, setLoanData] = useState(answers.loan_data || {
    home: { has: false, emi: '' },
    commercial: { has: false, emi: '' },
    car: { has: false, emi: '' },
    education: { has: false, emi: '' },
    personal: { has: false, emi: '' }
  });

  const progressData = {
    sectionData: {
      1: { isActive: false, progress: 0, isCompleted: true },
      2: { isActive: true, progress: 15, isCompleted: false },
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

  const loanTypes = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'commercial', label: 'Commercial Property', icon: '🏢' },
    { key: 'car', label: 'Car', icon: '🚗' },
    { key: 'education', label: 'Education', icon: '🎓' },
    { key: 'personal', label: 'Personal', icon: '💳' }
  ];

  const handleToggle = (key, value) => {
    setLoanData(prev => ({
      ...prev,
      [key]: {
        has: value,
        emi: value ? prev[key].emi : ''
      }
    }));
  };

  const handleEmiChange = (key, value) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setLoanData(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          emi: value
        }
      }));
    }
  };

  const handleContinue = () => {
    updateAnswer('loan_data', loanData);
    console.log('Loan data:', loanData);
    router.push('/(gowealthy)/questionnaire/section2/screen9');
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

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />
      
      <View style={globalStyles.backgroundContainer}>
        <ScreenScrollView>
          <View style={globalStyles.appContainer}>
            <View style={globalStyles.header}>
              <TouchableOpacity style={globalStyles.backButton} onPress={handleBack}>
                <Text style={globalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <View style={globalStyles.logo}>
                <Text style={globalStyles.sectionTitle}>
                  Let's understand your loan commitments
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
                  Do you have any ongoing loans?
                </Text>

                <View style={styles.loansContainer}>
                  {loanTypes.map((type) => (
                    <View key={type.key} style={styles.loanItem}>
                      <View style={styles.loanHeader}>
                        <Text style={styles.loanIcon}>{type.icon}</Text>
                        <Text style={styles.loanLabel}>{type.label}</Text>
                        <View style={styles.loanToggleButtons}>
                          <TouchableOpacity
                            style={[
                              styles.loanToggleBtn,
                              !loanData[type.key].has && styles.loanToggleBtnActive
                            ]}
                            onPress={() => handleToggle(type.key, false)}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.loanToggleBtnText,
                              !loanData[type.key].has && styles.loanToggleBtnTextActive
                            ]}>No</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.loanToggleBtn,
                              loanData[type.key].has && styles.loanToggleBtnActive
                            ]}
                            onPress={() => handleToggle(type.key, true)}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.loanToggleBtnText,
                              loanData[type.key].has && styles.loanToggleBtnTextActive
                            ]}>Yes</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {loanData[type.key].has && (
                        <View style={styles.loanInputContainer}>
                          <View style={styles.loanInputWrapper}>
                            <Text style={styles.loanRupee}>₹</Text>
                            <TextInput
                              style={styles.loanInput}
                              placeholder="EMI amount"
                              placeholderTextColor={colors.subtitleColor}
                              keyboardType="decimal-pad"
                              value={loanData[type.key].emi}
                              onChangeText={(value) => handleEmiChange(type.key, value)}
                            />
                            <Text style={styles.loanUnit}>K</Text>
                          </View>
                          {loanData[type.key].emi && (
                            <Text style={styles.amountInWords}>
                              {convertToWords(loanData[type.key].emi)}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleContinue}
                  activeOpacity={0.8}
                  style={globalStyles.confirmButton}
                >
                  <LinearGradient
                    colors={[colors.gradientPurple1, colors.gradientPurple2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={globalStyles.buttonInner}
                  >
                    <Text style={globalStyles.confirmButtonText}>Continue</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScreenScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  loansContainer: {
    width: '100%',
    maxWidth: 420,
    gap: isMobile ? 16 : 20,
  },

  loanItem: {
    width: '100%',
    padding: isMobile ? 16 : 20,
    borderRadius: 12,
    backgroundColor: colors.optionBackground,
    borderWidth: 2,
    borderColor: colors.optionBorder,
    gap: 12,
  },

  loanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  loanIcon: {
    fontSize: isMobile ? 20 : 24,
    marginRight: 12,
    width: 32,
  },

  loanLabel: {
    flex: 1,
    fontSize: isMobile ? 14 : 16,
    fontWeight: '500',
    color: colors.textColor,
  },

  loanToggleButtons: {
    flexDirection: 'row',
    gap: 6,
  },

  loanToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.optionBorder,
    backgroundColor: colors.optionBackground,
  },

  loanToggleBtnActive: {
    backgroundColor: colors.accentColor,
    borderColor: colors.accentColor,
  },

  loanToggleBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textColor,
  },

  loanToggleBtnTextActive: {
    color: colors.textColor,
  },

  loanInputContainer: {
    gap: 8,
  },

  loanInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.optionBorder,
  },

  loanRupee: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: colors.textColor,
    marginRight: 8,
  },

  loanInput: {
    flex: 1,
    fontSize: isMobile ? 14 : 16,
    color: colors.textColor,
    fontWeight: '500',
  },

  loanUnit: {
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

export default Screen8;