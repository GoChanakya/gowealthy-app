import React, { useState } from 'react';
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

const Screen14 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();
  
  const [insuranceData, setInsuranceData] = useState(() => {
    const existing = answers.insurance_data || {};
    
    // Convert from K back to lakhs when loading
    return {
      life: {
        has: existing.life?.has || false,
        premium: existing.life?.premium || '',
        sum_insured: existing.life?.sum_insured ? Math.round(existing.life.sum_insured / 100).toString() : ''
      },
      health: {
        has: existing.health?.has || false,
        premium: existing.health?.premium || '',
        sum_insured: existing.health?.sum_insured ? Math.round(existing.health.sum_insured / 100).toString() : ''
      },
      motor: {
        has: existing.motor?.has || false,
        premium: existing.motor?.premium || ''
      }
    };
  });

  const progressData = {
    sectionData: {
      1: { isActive: false, progress: 0, isCompleted: true },
      2: { isActive: false, progress: 0, isCompleted: true },
      3: { isActive: true, progress: 100, isCompleted: false },
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

  // Calculate user's own monthly income (excluding spouse income)
  const getOwnMonthlyIncome = () => {
    const incomeData = answers.income_data || {};
    let ownIncome = 0;

    // Add all income sources except spouse
    Object.keys(incomeData).forEach(key => {
      if (key !== 'spouse' && incomeData[key].has && incomeData[key].amount) {
        ownIncome += parseFloat(incomeData[key].amount) || 0;
      }
    });

    return ownIncome;
  };

  const getTargetCoverage = (insuranceType) => {
    switch (insuranceType) {
      case 'health':
        return Math.round((ownMonthlyIncome * 10)/100); // Convert to lakhs
      case 'life':
        return Math.round((ownMonthlyIncome * 180)/100); // Convert to lakhs  
      case 'motor':
        return 0; // No target for motor
      default:
        return 0;
    }
  };

  const getCoverageStatus = (insuranceType, currentCoverage) => {
    const target = getTargetCoverage(insuranceType);
    const current = parseInt(currentCoverage) || 0;

    if (insuranceType === 'motor') return { status: 'neutral', message: '', difference: 0 };

    if (current >= target) {
      const excess = current - target;
      return {
        status: 'covered',
        message: insuranceType === 'health' ? 'Well Covered ✓' : `Well Covered: ${excess} Lacs excess`,
        difference: excess
      };
    } else {
      const shortfall = target - current;
      return {
        status: 'insufficient',
        message: insuranceType === 'health' ? 'Not enough coverage!' : `Shortfall: ${shortfall} Lacs`,
        difference: shortfall
      };
    }
  };

  const ownMonthlyIncome = getOwnMonthlyIncome();
  const ownYearlyIncome = ownMonthlyIncome * 12;

  const insuranceTypes = [
    {
      key: 'life',
      label: 'Life Insurance',
      icon: '🏥',
      emoji: '💼',
      show: true,
      hasDoubleSlider: true,
      premiumMax: 100,
      sumInsuredMax: Math.round(ownYearlyIncome * 20 / 100), // 20 times yearly income in lakhs
      sumInsuredStep: 20, // 20 lakhs step
      description: `Premium: 0-100K | Sum: 0-${Math.round(ownYearlyIncome * 20 / 100)} Lacs`,
      targetCoverage: getTargetCoverage('life'),
      sliderColor: '#FF6B35'
    },
    {
      key: 'health',
      label: 'Health Insurance',
      icon: '🏥',
      emoji: '🩺',
      show: true,
      hasDoubleSlider: true,
      premiumMax: 100,
      sumInsuredMax: Math.round(ownYearlyIncome * 5 / 100), 
      sumInsuredStep: Math.round(ownYearlyIncome * 5 / 100) <= 20 ? 2 : 5,
      description: `Premium: 0-100K | Sum: 0-${Math.round(ownYearlyIncome * 5 / 100)} Lacs`,
      targetCoverage: getTargetCoverage('health'),
      sliderColor: '#FF6B35' // Orange for coverage slider
    },
    {
      key: 'motor',
      label: 'Motor Insurance',
      icon: '🚗',
      emoji: '🚙',
      show: true,
      hasDoubleSlider: false,
      premiumMax: 100,
      description: 'Premium: 0-100K',
      targetCoverage: 0,
      sliderColor: '#6366f1' // Keep blue for motor
    }
  ];

  const handleToggle = (key) => {
    setInsuranceData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        has: !prev[key].has,
        premium: prev[key].has ? '' : prev[key].premium,
        sum_insured: prev[key].has ? '' : (prev[key].sum_insured || '')
      }
    }));
  };

  const handlePremiumChange = (key, value) => {
    const numValue = parseInt(value) || 0;
    setInsuranceData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        premium: numValue.toString()
      }
    }));
  };

  const handleSumInsuredChange = (key, value) => {
    const numValue = parseInt(value) || 0;
    setInsuranceData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        sum_insured: numValue.toString()
      }
    }));
  };

  const canContinue = () => {
    return insuranceTypes.some(type =>
      insuranceData[type.key].has
    );
  };

  const handleContinue = () => {
    setTimeout(() => {
      // Convert lakhs back to K before saving (multiply by 100)
      const insuranceDataForSave = {
        life: {
          ...insuranceData.life,
          sum_insured: insuranceData.life.sum_insured 
            ? (parseFloat(insuranceData.life.sum_insured) * 100).toString() 
            : ''
        },
        health: {
          ...insuranceData.health,
          sum_insured: insuranceData.health.sum_insured 
            ? (parseFloat(insuranceData.health.sum_insured) * 100).toString() 
            : ''
        },
        motor: {
          ...insuranceData.motor
        }
      };

      console.log('💾 Saving insurance data:');
      console.log('- Display values (lakhs):', insuranceData);
      console.log('- Saved values (K):', insuranceDataForSave);

      updateAnswer('insurance_data', insuranceDataForSave);
      router.push('/(gowealthy)/questionnaire/section4/screen15');
    }, 500);
  };

  const handleBack = () => {
    router.back();
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
                  Understanding your insurance expenses
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
                  What are your annual{'\n'}insurance expenses?
                </Text>

                <Image
                  source={require('../../../../assets/images/page_images/insurance.png')}
                  style={styles.insuranceImage}
                  resizeMode="contain"
                />

                <View style={styles.insuranceContainer}>
                  {insuranceTypes.map((type) => (
                    <View key={type.key} style={styles.insuranceItem}>
                      <View style={styles.insuranceHeader}>
                        <View style={styles.insuranceIcon}>
                          <Text style={styles.insuranceEmoji}>{type.emoji}</Text>
                        </View>
                        <View style={styles.insuranceInfo}>
                          <Text style={styles.insuranceLabel}>{type.label}</Text>
                          <Text style={styles.insuranceDescription}>{type.description}</Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.insuranceToggle,
                            insuranceData[type.key].has && styles.insuranceToggleActive
                          ]}
                          onPress={() => handleToggle(type.key)}
                          activeOpacity={0.8}
                        >
                          <View style={[
                            styles.toggleSlider,
                            insuranceData[type.key].has && styles.toggleSliderActive
                          ]} />
                        </TouchableOpacity>
                      </View>

                      {insuranceData[type.key].has && (
                        <View style={styles.insuranceSlidersContainer}>
                          {/* Premium Slider */}
                          <View style={styles.insuranceSliderSection}>
                            <View style={styles.sliderHeader}>
                              <Text style={styles.insuranceSliderLabel}>Annual Premium</Text>
                              <Text style={styles.insuranceSliderValue}>
                                ₹{insuranceData[type.key].premium || 0}K
                              </Text>
                            </View>

                            <View style={styles.insuranceSliderContainer}>
                              <Text style={styles.sliderMinMax}>0K</Text>
                              <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={type.premiumMax}
                                step={1}
                                value={parseInt(insuranceData[type.key].premium) || 0}
                                onValueChange={(value) => handlePremiumChange(type.key, value)}
                                minimumTrackTintColor="#6366f1"
                                maximumTrackTintColor={colors.optionBorder}
                                thumbTintColor="#6366f1"
                              />
                              <Text style={styles.sliderMinMax}>{type.premiumMax}K</Text>
                            </View>
                          </View>

                          {/* Sum Insured Slider (only for Life and Health) */}
                          {type.hasDoubleSlider && (
                            <View style={styles.insuranceSliderSection}>
                              <View style={styles.sliderHeader}>
                                <Text style={styles.insuranceSliderLabel}>Sum Insured</Text>
                                <Text style={[styles.insuranceSliderValue, styles.sumInsuredValue]}>
                                  ₹{insuranceData[type.key].sum_insured || 0} Lacs
                                </Text>
                              </View>

                              <View style={styles.insuranceSliderContainer}>
                                <Text style={styles.sliderMinMax}>0 Lacs</Text>
                                <Slider
                                  style={styles.slider}
                                  minimumValue={0}
                                  maximumValue={type.sumInsuredMax}
                                  step={type.sumInsuredStep}
                                  value={parseInt(insuranceData[type.key].sum_insured) || 0}
                                  onValueChange={(value) => handleSumInsuredChange(type.key, value)}
                                  minimumTrackTintColor="#FF6B35"
                                  maximumTrackTintColor={colors.optionBorder}
                                  thumbTintColor="#FF6B35"
                                />
                                <Text style={styles.sliderMinMax}>{type.sumInsuredMax} Lacs</Text>
                              </View>
                            </View>
                          )}

                          {/* Coverage Status */}
                          {type.hasDoubleSlider && (
                            <View style={styles.coverageStatusSection}>
                              <View style={styles.targetCoverageInfo}>
                                <Text style={styles.targetLabel}>Coverage you should have:</Text>
                                <Text style={styles.targetValue}>₹{type.targetCoverage} Lacs</Text>
                              </View>

                              {(() => {
                                const status = getCoverageStatus(type.key, insuranceData[type.key].sum_insured);
                                return (
                                  <View style={[
                                    styles.coverageStatus,
                                    status.status === 'covered' && styles.coverageStatusCovered,
                                    status.status === 'insufficient' && styles.coverageStatusInsufficient,
                                    status.status === 'neutral' && styles.coverageStatusNeutral
                                  ]}>
                                    <Text style={[
                                      styles.statusMessage,
                                      status.status === 'covered' && styles.statusMessageCovered,
                                      status.status === 'insufficient' && styles.statusMessageInsufficient,
                                      status.status === 'neutral' && styles.statusMessageNeutral
                                    ]}>
                                      {status.message}
                                    </Text>
                                    {status.difference > 0 && status.status === 'insufficient' && (
                                      <Text style={styles.differenceValue}>
                                        Need ₹{status.difference} Lacs more
                                      </Text>
                                    )}
                                  </View>
                                );
                              })()}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                <View style={[
                  globalStyles.confirmButton,
                  { marginTop: 30 }
                ]}>
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
  insuranceImage: {
    width: isMobile ? 200 : 350,
    height: isMobile ? 150 : 250,
    marginBottom: isMobile ? 20 : 30,
  },

  insuranceContainer: {
    width: '100%',
    maxWidth: 420,
    gap: 0,
  },

  insuranceItem: {
    backgroundColor: colors.optionBackground,
    borderWidth: 1,
    borderColor: colors.optionBorder,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },

  insuranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },

  insuranceIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },

  insuranceEmoji: {
    fontSize: 24,
  },

  insuranceInfo: {
    flex: 1,
    gap: 4,
  },

  insuranceLabel: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: colors.textColor,
    lineHeight: isMobile ? 19 : 22,
  },

  insuranceDescription: {
    fontSize: isMobile ? 12 : 13,
    fontWeight: '400',
    color: colors.subtitleColor,
    opacity: 0.8,
    lineHeight: isMobile ? 16 : 17,
  },

  insuranceToggle: {
    width: isMobile ? 50 : 56,
    height: isMobile ? 26 : 28,
    backgroundColor: colors.optionBorder,
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
  },

  insuranceToggleActive: {
    backgroundColor: colors.accentColor,
  },

  toggleSlider: {
    width: isMobile ? 22 : 24,
    height: isMobile ? 22 : 24,
    backgroundColor: 'white',
    borderRadius: 12,
    position: 'absolute',
    left: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  toggleSliderActive: {
    transform: [{ translateX: isMobile ? 24 : 28 }],
  },

  insuranceSlidersContainer: {
    marginTop: 20,
    gap: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.optionBorder,
  },

  insuranceSliderSection: {
    gap: 15,
  },

  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  insuranceSliderLabel: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '500',
    color: colors.textColor,
    lineHeight: isMobile ? 17 : 19,
  },

  insuranceSliderValue: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: '#6366f1',
    fontFamily: 'Poppins',
  },

  sumInsuredValue: {
    color: '#FF6B35',
  },

  insuranceSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  sliderMinMax: {
    fontSize: isMobile ? 12 : 14,
    color: colors.subtitleColor,
    minWidth: isMobile ? 40 : 50,
    textAlign: 'center',
    fontWeight: '500',
  },

  slider: {
    flex: 1,
    height: 40,
  },

  coverageStatusSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.optionBorder,
  },

  targetCoverageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },

  targetLabel: {
    fontSize: isMobile ? 13 : 14,
    fontWeight: '500',
    color: colors.textColor,
  },

  targetValue: {
    fontSize: isMobile ? 15 : 16,
    fontWeight: '600',
    color: '#FF6B35',
    fontFamily: 'Poppins',
  },

  coverageStatus: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },

  coverageStatusCovered: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },

  coverageStatusInsufficient: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },

  coverageStatusNeutral: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },

  statusMessage: {
    fontSize: isMobile ? 14 : 15,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },

  statusMessageCovered: {
    color: '#10B981',
  },

  statusMessageInsufficient: {
    color: '#EF4444',
  },

  statusMessageNeutral: {
    color: '#6366f1',
  },

  differenceValue: {
    fontSize: isMobile ? 11 : 12,
    opacity: 0.8,
    color: '#EF4444',
    textAlign: 'center',
  },
});

export default Screen14;