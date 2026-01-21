import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  StatusBar,
  StyleSheet,
  Dimensions,
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

const { width: screenWidth } = Dimensions.get('window');

const Screen13 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();
  
  const [showIntro, setShowIntro] = useState(true);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(() => {
    const existingApproach = answers.emergency_funds?.approach;
    if (existingApproach) {
      return existingApproach;
    }
    return null;
  });
  
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const child = answers.dependents?.child || 0;
  const parent = answers.dependents?.parent || 0;
  const spouse = answers.dependents?.spouse || 0;
  const userAge = answers.age || 25;

  const progressData = {
    sectionData: {
      1: { isActive: false, progress: 0, isCompleted: true },
      2: { isActive: true, progress: 100, isCompleted: false },
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

  // Get recommended layer based on age
  const getRecommendedLayer = () => {
    if (userAge <= 24) return 'foundation';
    if (userAge >= 25 && userAge <= 40) return 'intermediate';
    return 'fortress';
  };

  const recommendedLayer = getRecommendedLayer();

  // Calculate all expense values
  const EMI = Object.values(answers.loan_data || {}).reduce((total, loan) => {
    return total + (loan.has && loan.emi ? parseFloat(loan.emi) * 1000 : 0);
  }, 0);

  const rent = (parseFloat(answers.house_expenses?.rent_maintenance) || 0) * 1000;
  const personal_exp = (parseFloat(answers.house_expenses?.shopping_dining_entertainment) || 0) * 1000;
  
  const household_exp = ((parseFloat(answers.house_expenses?.groceries) || 0) +
    (parseFloat(answers.house_expenses?.help_salaries) || 0)) * 1000;

  const businessIncome = answers.income_data?.salary_business?.has ?
    (parseFloat(answers.income_data.salary_business.amount) || 0) * 1000 : 0;
  const motor_ins = businessIncome * 0.1;

  const work_type = answers.work_setup || "salaried";

  const total_income = Object.values(answers.income_data || {}).reduce((total, income) => {
    return total + (income.has && income.amount ? parseFloat(income.amount) * 1000 : 0);
  }, 0);

  // Calculate emergency fund values - EXACT SAME LOGIC AS WEB
  const calculateEmergencyFunds = () => {
    const roundToNearestTenThousand = (value) => {
      return Math.round(value / 10000) * 10000;
    };

    // Medical calculation
    const medical_multiplier_ef1 = (child > 0 ? child : 0) * 0.1 + parent * 0.5 + spouse * 0.4;
    const medical_multiplier_ef2 = (child > 0 ? child : 0) * 0.2 + parent * 0.7 + spouse * 0.5;
    const medical_multiplier_ef3 = (child > 0 ? child : 0) * 0.3 + parent * 0.9 + spouse * 0.6;

    const medical_ef1 = roundToNearestTenThousand(medical_multiplier_ef1 * total_income * 0.4);
    const medical_ef2 = roundToNearestTenThousand(medical_multiplier_ef2 * total_income * 0.4);
    const medical_ef3 = roundToNearestTenThousand(medical_multiplier_ef3 * total_income * 0.4);

    // EMI calculation
    const emi_ef1 = EMI * 2;
    const emi_ef2 = EMI * 4;
    const emi_ef3 = EMI * 6;

    // Work Security calculation
    const work_multiplier_ef1 = work_type === "business" ? 2 : 0.5;
    const work_multiplier_ef2 = work_type === "business" ? 3 : 1;
    const work_multiplier_ef3 = work_type === "business" ? 5 : 1.5;

    const monthly_expenses = rent + personal_exp;
    const work_ef1 = monthly_expenses * work_multiplier_ef1;
    const work_ef2 = monthly_expenses * work_multiplier_ef2;
    const work_ef3 = monthly_expenses * work_multiplier_ef3;

    // House calculation
    const house_ef1 = 0;
    const house_ef2 = (rent + household_exp) * 0.5;
    const house_ef3 = (rent + household_exp) * 1;

    // Vehicle calculation
    const vehicle_ef1 = motor_ins * 1;
    const vehicle_ef2 = motor_ins * 2;
    const vehicle_ef3 = motor_ins * 3;

    return {
      ef1: {
        medical: medical_ef1,
        emi: roundToNearestTenThousand(emi_ef1),
        work: roundToNearestTenThousand(work_ef1),
        house: roundToNearestTenThousand(house_ef1),
        vehicle: roundToNearestTenThousand(vehicle_ef1),
        total: roundToNearestTenThousand(
          medical_ef1 + emi_ef1 + work_ef1 + house_ef1 + vehicle_ef1
        )
      },
      ef2: {
        medical: medical_ef2,
        emi: roundToNearestTenThousand(emi_ef2),
        work: roundToNearestTenThousand(work_ef2),
        house: roundToNearestTenThousand(house_ef2),
        vehicle: roundToNearestTenThousand(vehicle_ef2),
        total: roundToNearestTenThousand(
          medical_ef2 + emi_ef2 + work_ef2 + house_ef2 + vehicle_ef2
        )
      },
      ef3: {
        medical: medical_ef3,
        emi: roundToNearestTenThousand(emi_ef3),
        work: roundToNearestTenThousand(work_ef3),
        house: roundToNearestTenThousand(house_ef3),
        vehicle: roundToNearestTenThousand(vehicle_ef3),
        total: roundToNearestTenThousand(
          medical_ef3 + emi_ef3 + work_ef3 + house_ef3 + vehicle_ef3
        )
      }
    };
  };

  const emergencyFunds = calculateEmergencyFunds();
  const grandTotal = emergencyFunds.ef1.total + emergencyFunds.ef2.total + emergencyFunds.ef3.total;

  const fundLevels = [
    {
      id: 'foundation',
      name: 'Foundation',
      amount: Math.round(emergencyFunds.ef1.total),
      percentage: Math.round((emergencyFunds.ef1.total / grandTotal) * 100) || 0,
      availability: '0-24 hours',
      color: '#ef4444',
      description: 'Critical survival coverage',
      priority: 'CRITICAL SURVIVAL',
      level: 1,
      fundData: emergencyFunds.ef1
    },
    {
      id: 'intermediate',
      name: 'Intermediate',
      amount: Math.round(emergencyFunds.ef2.total),
      percentage: Math.round((emergencyFunds.ef2.total / grandTotal) * 100) || 0,
      availability: '24-72 hours',
      color: '#f97316',
      description: 'Extended protection buffer',
      priority: 'STABILITY BUFFER',
      level: 2,
      fundData: emergencyFunds.ef2
    },
    {
      id: 'fortress',
      name: 'Fortress',
      amount: Math.round(emergencyFunds.ef3.total),
      percentage: Math.round((emergencyFunds.ef3.total / grandTotal) * 100) || 0,
      availability: '3-7 days',
      color: '#eab308',
      description: 'Complete financial security',
      priority: 'MAXIMUM SECURITY',
      level: 3,
      fundData: emergencyFunds.ef3
    }
  ];

  const aspects = [
    { name: 'Medical', emoji: '❤️' },
    { name: 'EMI', emoji: '💳' },
    { name: 'Work Security', emoji: '💼' },
    { name: 'House', emoji: '🏠' },
    { name: 'Vehicle', emoji: '🚗' }
  ];

  const formatCurrency = (value) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${value}`;
  };

  const getCurrentLevel = () => {
    return fundLevels.find(l => l.id === selectedLevel);
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleLayerSelect = (levelId) => {
    setSelectedLevel(levelId);
  };

  const handleContinue = () => {
    if (!selectedLevel) return;

    const currentLevel = getCurrentLevel();
    
    updateAnswer('emergency_funds', {
      approach: selectedLevel,
      amount: currentLevel.amount,
      fundData: currentLevel.fundData
    });

    console.log('Emergency fund selected:', {
      approach: selectedLevel,
      amount: currentLevel.amount
    });

    router.push('/(gowealthy)/questionnaire/section3/screen14');
  };

  const handleBack = () => {
    router.back();
  };

  // Intro Screen
  if (showIntro) {
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
                    Emergency Fund Planning
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

              <View style={styles.introContainer}>
                <Animated.View style={[styles.shieldContainer, { transform: [{ scale: pulseAnim }] }]}>
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.shieldCircle}
                  >
                    <Text style={styles.shieldEmoji}>🛡️</Text>
                  </LinearGradient>
                </Animated.View>

                <Text style={styles.introTitle}>
                  Financial Security Through{'\n'}Emergency Funds
                </Text>

                <Text style={styles.introText}>
                  Life is unpredictable. Medical emergencies, job loss, or unexpected repairs can happen anytime. 
                  An emergency fund is your financial safety net, protecting you and your loved ones from financial stress.
                </Text>

                <View style={styles.whyMattersBox}>
                  <Text style={styles.whyMattersTitle}>Why it matters:</Text>
                  <View style={styles.bulletPoint}>
                    <Text style={styles.bulletEmoji}>🏥</Text>
                    <Text style={styles.bulletText}>Cover unexpected medical expenses</Text>
                  </View>
                  <View style={styles.bulletPoint}>
                    <Text style={styles.bulletEmoji}>💼</Text>
                    <Text style={styles.bulletText}>Bridge income gaps during job transitions</Text>
                  </View>
                  <View style={styles.bulletPoint}>
                    <Text style={styles.bulletEmoji}>🏠</Text>
                    <Text style={styles.bulletText}>Handle urgent home or vehicle repairs</Text>
                  </View>
                  <View style={styles.bulletPoint}>
                    <Text style={styles.bulletEmoji}>😌</Text>
                    <Text style={styles.bulletText}>Sleep peacefully knowing you're protected</Text>
                  </View>
                </View>

                <Text style={styles.nextStepText}>
                  In the next step, we'll help you calculate your ideal emergency fund based on your unique situation.
                </Text>

                <TouchableOpacity
                  onPress={handleIntroComplete}
                  activeOpacity={0.8}
                  style={styles.continueButtonWrapper}
                >
                  <LinearGradient
                    colors={[colors.gradientPurple1, colors.gradientPurple2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.continueButton}
                  >
                    <Text style={styles.continueButtonText}>Calculate My Emergency Fund</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </>
    );
  }

  // Main Layer Selection Screen
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
                  Choose Your Protection Level
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

            <View style={styles.mainContainer}>
              <Text style={styles.questionText}>
                Select your Emergency Fund approach:
              </Text>

              <View style={styles.totalFundBox}>
                <Text style={styles.totalFundLabel}>Total Recommended Fund</Text>
                <Text style={styles.totalFundAmount}>{formatCurrency(grandTotal)}</Text>
                <Text style={styles.totalFundSubtext}>
                  Based on your expenses and dependents
                </Text>
              </View>

              <View style={styles.layersContainer}>
                {fundLevels.map((level) => {
                  const isSelected = selectedLevel === level.id;
                  const isRecommended = recommendedLayer === level.id;

                  return (
                    <TouchableOpacity
                      key={level.id}
                      style={[
                        styles.layerCard,
                        isSelected && styles.layerCardSelected,
                        { borderColor: level.color }
                      ]}
                      onPress={() => handleLayerSelect(level.id)}
                      activeOpacity={0.7}
                    >
                      {isRecommended && (
                        <View style={[styles.recommendedBadge, { backgroundColor: level.color }]}>
                          <Text style={styles.recommendedText}>RECOMMENDED</Text>
                        </View>
                      )}

                      <View style={styles.layerHeader}>
                        <View style={[styles.layerIconCircle, { backgroundColor: level.color }]}>
                          <Text style={styles.layerLevel}>{level.level}</Text>
                        </View>
                        <View style={styles.layerHeaderText}>
                          <Text style={styles.layerName}>{level.name} Layer</Text>
                          <Text style={styles.layerDescription}>{level.description}</Text>
                        </View>
                      </View>

                      <View style={styles.layerAmountBox}>
                        <Text style={[styles.layerAmount, { color: level.color }]}>
                          {formatCurrency(level.amount)}
                        </Text>
                        <Text style={styles.layerPercentage}>{level.percentage}% of total</Text>
                      </View>

                      <View style={styles.aspectsContainer}>
                        {aspects.map((aspect) => {
                          let value = 0;
                          switch (aspect.name) {
                            case 'Medical': value = level.fundData.medical; break;
                            case 'EMI': value = level.fundData.emi; break;
                            case 'Work Security': value = level.fundData.work; break;
                            case 'House': value = level.fundData.house; break;
                            case 'Vehicle': value = level.fundData.vehicle; break;
                          }

                          return (
                            <View key={aspect.name} style={[styles.aspectChip, { borderColor: level.color + '50' }]}>
                              <Text style={styles.aspectEmoji}>{aspect.emoji}</Text>
                              <Text style={styles.aspectText}>
                                {aspect.name}: {formatCurrency(value)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>

                      {isSelected && (
                        <View style={[styles.selectedIndicator, { backgroundColor: level.color }]}>
                          <Text style={styles.selectedIndicatorText}>✓ SELECTED</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[
                globalStyles.confirmButton,
                !selectedLevel && globalStyles.confirmButtonDisabled
              ]}>
                {selectedLevel ? (
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
                      Select a layer to continue
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScreenScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  // Intro Screen Styles
  introContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isMobile ? 24 : 40,
    paddingVertical: isMobile ? 30 : 40,
  },

  shieldContainer: {
    marginBottom: isMobile ? 24 : 32,
  },

  shieldCircle: {
    width: isMobile ? 100 : 120,
    height: isMobile ? 100 : 120,
    borderRadius: isMobile ? 50 : 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shieldEmoji: {
    fontSize: isMobile ? 50 : 60,
  },

  introTitle: {
    fontSize: isMobile ? 24 : 28,
    fontWeight: '700',
    color: colors.textColor,
    textAlign: 'center',
    marginBottom: isMobile ? 16 : 20,
    lineHeight: isMobile ? 32 : 38,
  },

  introText: {
    fontSize: isMobile ? 14 : 16,
    color: colors.subtitleColor,
    textAlign: 'center',
    marginBottom: isMobile ? 24 : 32,
    lineHeight: isMobile ? 22 : 26,
    maxWidth: 500,
  },

  whyMattersBox: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 16,
    padding: isMobile ? 20 : 24,
    marginBottom: isMobile ? 24 : 32,
  },

  whyMattersTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 16,
  },

  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  bulletEmoji: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },

  bulletText: {
    flex: 1,
    fontSize: isMobile ? 13 : 15,
    color: colors.textColor,
    lineHeight: 20,
  },

  nextStepText: {
    fontSize: isMobile ? 13 : 15,
    color: colors.subtitleColor,
    textAlign: 'center',
    marginBottom: isMobile ? 24 : 32,
    fontStyle: 'italic',
    maxWidth: 400,
  },

  continueButtonWrapper: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    overflow: 'hidden',
  },

  continueButton: {
    paddingVertical: isMobile ? 16 : 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textColor,
  },

  // Main Screen Styles
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: isMobile ? 16 : 24,
    paddingBottom: 30,
  },

  questionText: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: '700',
    color: colors.textColor,
    textAlign: 'center',
    marginBottom: isMobile ? 20 : 24,
  },

  totalFundBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 16,
    padding: isMobile ? 20 : 24,
    alignItems: 'center',
    marginBottom: isMobile ? 24 : 32,
  },

  totalFundLabel: {
    fontSize: isMobile ? 13 : 14,
    fontWeight: '600',
    color: colors.subtitleColor,
    marginBottom: 8,
  },

  totalFundAmount: {
    fontSize: isMobile ? 32 : 40,
    fontWeight: '800',
    color: colors.primaryPurple,
    marginBottom: 4,
  },

  totalFundSubtext: {
    fontSize: isMobile ? 11 : 12,
    color: colors.subtitleColor,
    opacity: 0.8,
  },

  layersContainer: {
    width: '100%',
    maxWidth: 420,
    gap: isMobile ? 16 : 20,
    marginBottom: isMobile ? 24 : 32,
  },

  layerCard: {
    width: '100%',
    backgroundColor: colors.optionBackground,
    borderWidth: 3,
    borderRadius: 16,
    padding: isMobile ? 16 : 20,
    position: 'relative',
  },

  layerCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },

  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textColor,
    letterSpacing: 0.5,
  },

  layerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  layerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  layerLevel: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textColor,
  },

  layerHeaderText: {
    flex: 1,
  },

  layerName: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    color: colors.textColor,
    marginBottom: 4,
  },

  layerDescription: {
    fontSize: isMobile ? 12 : 13,
    color: colors.subtitleColor,
  },

  layerAmountBox: {
    alignItems: 'center',
    marginBottom: 16,
  },

  layerAmount: {
    fontSize: isMobile ? 28 : 32,
    fontWeight: '800',
    marginBottom: 4,
  },

  layerPercentage: {
    fontSize: 12,
    color: colors.subtitleColor,
  },

  aspectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  aspectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },

  aspectEmoji: {
    fontSize: 14,
  },

  aspectText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textColor,
  },

  selectedIndicator: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },

  selectedIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textColor,
    letterSpacing: 1,
  },
});

export default Screen13;