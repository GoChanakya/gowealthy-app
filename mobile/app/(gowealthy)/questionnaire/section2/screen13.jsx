import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar,
  StyleSheet,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path, G, Text as SvgText, ForeignObject } from 'react-native-svg';
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
  
//  const [showIntro, setShowIntro] = useState(() => {
//      return !answers.emergency_funds?.approach;
//    });

const [showIntroModal, setShowIntroModal] = useState(false);
  
  const [selectedLevel, setSelectedLevel] = useState(() => {
    const existingApproach = answers.emergency_funds?.approach;
    if (existingApproach) {
      return existingApproach;
    }
    return null;
  });
  
  const [animationProgress, setAnimationProgress] = useState(0);

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

  // Calculate all expense values - EXACT SAME AS WEB
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
      icon: '🏠',
      level: 1,
      radius: 60,
      fundData: emergencyFunds.ef1
    },
    {
      id: 'intermediate',
      name: 'Intermediate',
      amount: Math.round(emergencyFunds.ef2.total),
      percentage: Math.round((emergencyFunds.ef2.total / grandTotal) * 100) || 0,
      availability: '24-72 hours',
      color: '#f97316',
      description: 'Extended family & vehicle coverage',
      priority: 'EMERGENCY BUFFER',
      icon: '⚡',
      level: 2,
      radius: 100,
      fundData: emergencyFunds.ef2
    },
    {
      id: 'fortress',
      name: 'Fortress',
      amount: Math.round(emergencyFunds.ef3.total),
      percentage: Math.round((emergencyFunds.ef3.total / grandTotal) * 100) || 0,
      availability: '72+ hours',
      color: '#dc2626',
      description: 'Complete family & career protection',
      priority: 'CRISIS FORTRESS',
      icon: '🏰',
      level: 3,
      radius: 140,
      fundData: emergencyFunds.ef3
    }
  ];

  const aspects = [
    { name: 'Medical', angle: 0, icon: '❤️', color: '#ef4444' },
    { name: 'EMI', angle: 72, icon: '💳', color: '#f97316' },
    { name: 'Work Security', angle: 144, icon: '💼', color: '#dc2626' },
    { name: 'House', angle: 216, icon: '🏠', color: '#ef4444' },
    { name: 'Vehicle', angle: 288, icon: '🚗', color: '#f97316' }
  ];

  const centerX = 150;
  const centerY = 150;

//   useEffect(() => {
//     if (!showIntro) {
//       const timer = setTimeout(() => {
//         setAnimationProgress(1);
//       }, 500);
//       return () => clearTimeout(timer);
//     }
//   }, [showIntro]);

useEffect(() => {
     if (!showIntroModal) {
       const timer = setTimeout(() => {
         setAnimationProgress(1);
       }, 500);
       return () => clearTimeout(timer);
     }
   }, [showIntroModal]);
  const getPointOnCircle = (angle, radius) => {
    const radian = (angle - 90) * Math.PI / 180;
    return {
      x: centerX + radius * Math.cos(radian),
      y: centerY + radius * Math.sin(radian)
    };
  };

  const createSpiderPath = (level) => {
    if (!level || !level.fundData) return '';

    const maxValue = Math.max(
      emergencyFunds.ef3.medical,
      emergencyFunds.ef3.emi,
      emergencyFunds.ef3.work,
      emergencyFunds.ef3.house,
      emergencyFunds.ef3.vehicle
    );

    const points = aspects.map(aspect => {
      let value = 0;
      switch (aspect.name) {
        case 'Medical': value = level.fundData.medical; break;
        case 'EMI': value = level.fundData.emi; break;
        case 'Work Security': value = level.fundData.work; break;
        case 'House': value = level.fundData.house; break;
        case 'Vehicle': value = level.fundData.vehicle; break;
      }

      const normalizedValue = maxValue > 0 ? (value / maxValue) : 0;
      const radius = 100 * normalizedValue * animationProgress;
      return getPointOnCircle(aspect.angle, radius);
    });

    if (points.length === 0) return '';

    return `M ${points[0].x} ${points[0].y} ` +
      points.slice(1).map(point => `L ${point.x} ${point.y}`).join(' ') +
      ' Z';
  };

  const getCurrentLevel = () => {
    if (selectedLevel) {
      return fundLevels.find(level => level.id === selectedLevel);
    }
    return null;
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}K`;
    }
    return `₹${amount}`;
  };

  const handleGraphClick = () => {
    if (selectedLevel === null) {
      setSelectedLevel('foundation');
    } else if (selectedLevel === 'foundation') {
      setSelectedLevel('intermediate');
    } else if (selectedLevel === 'intermediate') {
      setSelectedLevel('fortress');
    } else if (selectedLevel === 'fortress') {
      setSelectedLevel('foundation');
    }
  };

  const handleContinueFromIntro = () => {
setShowIntroModal(false);  // ✅ CORRECT
  };

  const handleContinue = () => {
    const emergencyFundData = {
      emergency_funds: {
        amount: Math.round(grandTotal),
        months_covered: Math.round(grandTotal / (total_income / 12)),
        approach: selectedLevel || 'comprehensive',
        selected_layer: selectedLevel,
        foundation_layer: {
          selected: selectedLevel === 'foundation' || selectedLevel === null,
          amount: emergencyFunds.ef1.total,
          medical: emergencyFunds.ef1.medical,
          emi: emergencyFunds.ef1.emi,
          work_security: emergencyFunds.ef1.work,
          house: emergencyFunds.ef1.house,
          vehicle: emergencyFunds.ef1.vehicle,
          access_time: "0-24 hours"
        },
        intermediate_layer: {
          selected: selectedLevel === 'intermediate' || selectedLevel === null,
          amount: emergencyFunds.ef2.total,
          medical: emergencyFunds.ef2.medical,
          emi: emergencyFunds.ef2.emi,
          work_security: emergencyFunds.ef2.work,
          house: emergencyFunds.ef2.house,
          vehicle: emergencyFunds.ef2.vehicle,
          access_time: "24-72 hours"
        },
        fortress_layer: {
          selected: selectedLevel === 'fortress' || selectedLevel === null,
          amount: emergencyFunds.ef3.total,
          medical: emergencyFunds.ef3.medical,
          emi: emergencyFunds.ef3.emi,
          work_security: emergencyFunds.ef3.work,
          house: emergencyFunds.ef3.house,
          vehicle: emergencyFunds.ef3.vehicle,
          access_time: "72+ hours"
        },
        total_emergency_fund: grandTotal,
        user_interaction_data: {
          layers_viewed: selectedLevel ? [selectedLevel] : ['all'],
          layer_selection_timestamp: new Date().toISOString(),
          visualization_completed: true
        }
      }
    };

    updateAnswer('emergency_funds', emergencyFundData.emergency_funds);

    console.log('Emergency fund data:', emergencyFundData);
    router.replace('/(gowealthy)/questionnaire/section3/screen14');
  };

  const handleBack = () => {
     router.back(); // Always go back to Screen12
   };

  // Intro Screen
//   if (showIntro) {
//     return (
//       <>
//         <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />
        
//         <View style={globalStyles.backgroundContainer}>
//           <ScreenScrollView>
//             <View style={globalStyles.appContainer}>
//               <View style={globalStyles.header}>
//                 <TouchableOpacity style={globalStyles.backButton} onPress={handleBack}>
//                   <Text style={globalStyles.backButtonText}>Back</Text>
//                 </TouchableOpacity>
//                 <View style={globalStyles.logo}>
//                   <Text style={globalStyles.sectionTitle}>
//                     Let's build your safety net
//                   </Text>
//                 </View>
//               </View>

//               <View style={globalStyles.progressContainer}>
//                 {sections.map((section, index) => (
//                   <View key={index} style={globalStyles.progressStepContainer}>
//                     <View
//                       style={[
//                         globalStyles.progressStep,
//                         progressData?.sectionData?.[index + 1]?.isCompleted && globalStyles.progressStepCompleted,
//                         progressData?.sectionData?.[index + 1]?.isActive && globalStyles.progressStepActive,
//                       ]}
//                     />
//                     {index < sections.length - 1 && (
//                       <View
//                         style={[
//                           globalStyles.progressLine,
//                           progressData?.sectionData?.[index + 1]?.isCompleted && globalStyles.progressLineCompleted,
//                         ]}
//                       />
//                     )}
//                   </View>
//                 ))}
//               </View>

//               <View style={styles.introContainer}>
//                 <View style={styles.introHeader}>
//                   <Text style={styles.introHeading}>What is an Emergency Fund?</Text>
//                 </View>

//                 <View style={styles.introSection}>
//                   <View style={styles.introIconBox}>
//                     <Text style={styles.introIcon}>🛡️</Text>
//                   </View>
//                   <Text style={styles.introSectionTitle}>Your Financial Safety Net</Text>
//                   <Text style={styles.introText}>
//                     An emergency fund is money set aside to cover unexpected expenses like medical 
//                     emergencies, job loss, or urgent home repairs.
//                   </Text>
//                 </View>

//                 <View style={styles.introSection}>
//                   <View style={styles.introIconBox}>
//                     <Text style={styles.introIcon}>⚠️</Text>
//                   </View>
//                   <Text style={styles.introSectionTitle}>Why it's Important</Text>
//                   <Text style={styles.introText}>
//                     It prevents you from going into debt during crises and provides peace of mind knowing 
//                     you're prepared for unexpected momentss.
//                   </Text>
//                 </View>

//                 <View style={styles.introSection}>
//                   <View style={styles.introIconBox}>
//                     <Text style={styles.introIcon}>🏗️</Text>
//                   </View>
//                   <Text style={styles.introSectionTitle}>Layered Protection</Text>
//                   <Text style={styles.introText}>
//                     We'll help you build a multi-layer emergency fund covering different types of 
//                     emergencies based on your family situation and expenses.
//                   </Text>
//                 </View>

//                 <TouchableOpacity
//                   onPress={handleContinueFromIntro}
//                   activeOpacity={0.8}
//                   style={styles.introButton}
//                 >
//                   <LinearGradient
//                     colors={[colors.gradientPurple1, colors.gradientPurple2]}
//                     start={{ x: 0, y: 0 }}
//                     end={{ x: 1, y: 0 }}
//                     style={styles.introButtonGradient}
//                   >
//                     <Text style={styles.introButtonText}>Let's Select your Emergency Fund{'\n'}Layer to Start with</Text>
//                   </LinearGradient>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </ScreenScrollView>
//         </View>
//       </>
//     );
//   }

  // Main Layer Selection Screen with Spider Chart
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

            <View style={styles.mainContainer}>
              <View style={styles.titleContainer}>
                <View style={styles.titleBadge}>
                  <Text style={styles.titleBadgeIcon}>🏗️</Text>
                  <Text style={styles.titleBadgeText}>Emergency Fund Layers</Text>
                </View>
                <Text style={styles.subtitle}>Select a Layer as per your choice.</Text>
              </View>

              {/* Three Layer Boxes */}
              <View style={styles.layerBoxesContainer}>
                {fundLevels.map((level) => {
                  const isSelected = selectedLevel === level.id;
                  const isRecommended = level.id === recommendedLayer;

                  return (
                    <TouchableOpacity
                      key={level.id}
                      style={[
                        styles.layerBox,
                        isSelected && styles.layerBoxSelected
                      ]}
                      onPress={() => setSelectedLevel(selectedLevel === level.id ? null : level.id)}
                      activeOpacity={0.7}
                    >
                      {isRecommended && (
                        <View style={styles.recommendedStar}>
                          <Text style={styles.recommendedStarText}>⭐</Text>
                        </View>
                      )}
                      <View style={[styles.layerBoxIcon, { backgroundColor: level.color }]}>
                        <Text style={styles.layerBoxIconText}>{level.icon}</Text>
                      </View>
                      <Text style={styles.layerBoxName}>{level.name}</Text>
                      <Text style={styles.layerBoxAmount}>{formatCurrency(level.amount)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Spider Chart */}
              <TouchableOpacity
                style={styles.spiderChartContainer}
                onPress={handleGraphClick}
                activeOpacity={0.9}
              >
                <Svg width="100%" height="100%" viewBox="0 0 300 300">
                  {/* Background Circle */}
                  <Circle
                    cx={150}
                    cy={150}
                    r={70}
                    fill="none"
                    stroke="rgba(239, 68, 68, 0.2)"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />

                  {/* Radial Lines */}
                  {aspects.map((aspect, index) => {
                    const endPoint = getPointOnCircle(aspect.angle, 100);
                    return (
                      <Line
                        key={`line-${aspect.name}-${index}`}
                        x1={150}
                        y1={150}
                        x2={endPoint.x}
                        y2={endPoint.y}
                        stroke="rgba(239, 68, 68, 0.3)"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Spider Path for Selected Layer */}
                  {selectedLevel && fundLevels.map((level) => {
                    if (selectedLevel !== level.id) return null;

                    return (
                      <Path
                        key={level.id}
                        d={createSpiderPath(level)}
                        fill={`${level.color}40`}
                        stroke={level.color}
                        strokeWidth={level.level}
                      />
                    );
                  })}

                  {/* Aspect Points and Labels */}
                  {aspects.map((aspect, index) => {
                    const labelPoint = getPointOnCircle(aspect.angle, 120);
                    const level = getCurrentLevel();
                    let value = 0;

                    if (level) {
                      switch (aspect.name) {
                        case 'Medical': value = level.fundData.medical; break;
                        case 'EMI': value = level.fundData.emi; break;
                        case 'Work Security': value = level.fundData.work; break;
                        case 'House': value = level.fundData.house; break;
                        case 'Vehicle': value = level.fundData.vehicle; break;
                      }
                    }

                    const displayValue = value >= 100000
                      ? `₹${(value / 100000).toFixed(1)}L`
                      : `₹${(value / 1000).toFixed(0)}K`;

                    return (
                      <G key={`${aspect.name}-${index}`}>
                        <Circle
                          cx={labelPoint.x}
                          cy={labelPoint.y}
                          r="10"
                          fill="rgba(239, 68, 68, 0.6)"
                          stroke="rgba(255,255,255,0.5)"
                          strokeWidth="1"
                        />
                        <SvgText
                          x={labelPoint.x}
                          y={labelPoint.y + 4}
                          fill="white"
                          fontSize="12"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {aspect.icon}
                        </SvgText>
                        <SvgText
                          x={labelPoint.x}
                          y={labelPoint.y + 20}
                          fill="white"
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {aspect.name}
                        </SvgText>
                        {selectedLevel && (
                          <SvgText
                            x={labelPoint.x}
                            y={labelPoint.y + 30}
                            fill="#10b981"
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {displayValue}
                          </SvgText>
                        )}
                      </G>
                    );
                  })}

                  {/* Center Amount Display */}
                  {selectedLevel && (
                    <G>
                      <Circle cx={150} cy={150} r={40} fill="rgba(0,0,0,0.7)" />
                      <SvgText
                        x={150}
                        y={145}
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {getCurrentLevel()?.name}
                      </SvgText>
                      <SvgText
                        x={150}
                        y={160}
                        fill="#10b981"
                        fontSize="14"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {formatCurrency(getCurrentLevel()?.amount)}
                      </SvgText>
                    </G>
                  )}
                </Svg>
              </TouchableOpacity>

              {/* Layer Details Cards
              {selectedLevel && (
                <View style={styles.detailsContainer}>
                  {fundLevels.filter(l => l.id === selectedLevel).map((level) => (
                    <View key={level.id} style={[styles.detailCard, { borderColor: level.color }]}>
                      <View style={styles.detailHeader}>
                        <View style={[styles.detailIcon, { backgroundColor: level.color }]}>
                          <Text style={styles.detailIconText}>{level.icon}</Text>
                        </View>
                        <View style={styles.detailHeaderText}>
                          <Text style={styles.detailName}>{level.name} Layer</Text>
                          <Text style={styles.detailDescription}>{level.description}</Text>
                        </View>
                        <View style={styles.detailAmountBox}>
                          <Text style={[styles.detailAmount, { color: level.color }]}>
                            {formatCurrency(level.amount)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.aspectBreakdown}>
                        <Text style={styles.aspectBreakdownTitle}>Coverage Breakdown:</Text>
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
                            <View key={aspect.name} style={[styles.aspectRow, { borderColor: level.color + '50' }]}>
                              <Text style={styles.aspectIcon}>{aspect.icon}</Text>
                              <Text style={styles.aspectName}>{aspect.name}</Text>
                              <Text style={styles.aspectValue}>{formatCurrency(value)}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              )} */}

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
                      Select a layer to continued
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScreenScrollView>
      </View>

       {showIntroModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🛡️ Emergency Fund</Text>
            <Text style={styles.modalText}>
              Your financial safety net for unexpected expenses. We'll help you build layered protection based on your needs.
            </Text>
            
            <TouchableOpacity 
              onPress={() => setShowIntroModal(false)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.gradientPurple1, colors.gradientPurple2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Got it, Let's Start!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  // Intro Screen Styles
  introContainer: {
    flex: 1,
    paddingHorizontal: isMobile ? 20 : 32,
    paddingVertical: isMobile ? 24 : 32,
  },

  introHeader: {
    alignItems: 'center',
    marginBottom: isMobile ? 32 : 40,
  },

  introHeading: {
    fontSize: isMobile ? 24 : 28,
    fontWeight: '700',
    color: colors.textColor,
    textAlign: 'center',
  },

  introSection: {
    alignItems: 'center',
    marginBottom: isMobile ? 32 : 40,
  },

  introIconBox: {
    width: isMobile ? 80 : 100,
    height: isMobile ? 80 : 100,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: isMobile ? 20 : 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },

  introIcon: {
    fontSize: isMobile ? 40 : 50,
  },

  introSectionTitle: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: '700',
    color: colors.textColor,
    marginBottom: 12,
    textAlign: 'center',
  },

  introText: {
    fontSize: isMobile ? 14 : 16,
    color: colors.subtitleColor,
    textAlign: 'center',
    lineHeight: isMobile ? 22 : 26,
    maxWidth: 400,
  },

  introButton: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: isMobile ? 16 : 24,
  },

  introButtonGradient: {
    paddingVertical: isMobile ? 18 : 22,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  introButtonText: {
    fontSize: isMobile ? 15 : 16,
    fontWeight: '600',
    color: colors.textColor,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Main Screen Styles
  mainContainer: {
    flex: 1,
    paddingHorizontal: isMobile ? 16 : 24,
    paddingBottom: 30,
  },

  titleContainer: {
    alignItems: 'center',
    marginBottom: isMobile ? 20 : 24,
  },

  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  titleBadgeIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  titleBadgeText: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '700',
    color: '#ef4444',
  },

  subtitle: {
    fontSize: isMobile ? 14 : 16,
    color: colors.subtitleColor,
  },

  layerBoxesContainer: {
    flexDirection: 'row',
    gap: isMobile ? 8 : 12,
    marginBottom: isMobile ? 20 : 24,
    justifyContent: 'center',
  },

  layerBox: {
    flex: 1,
    maxWidth: isMobile ? 110 : 130,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    paddingVertical: isMobile ? 20 : 28,
    paddingHorizontal: isMobile ? 8 : 12,
    alignItems: 'center',
    position: 'relative',
  },

  layerBoxSelected: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    transform: [{ scale: 1.05 }],
  },

  recommendedStar: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 10,
  },

  recommendedStarText: {
    fontSize: 12,
  },

  layerBoxIcon: {
    width: isMobile ? 40 : 48,
    height: isMobile ? 40 : 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  layerBoxIconText: {
    fontSize: isMobile ? 20 : 24,
  },

  layerBoxName: {
    fontSize: isMobile ? 13 : 14,
    fontWeight: '700',
    color: colors.textColor,
    marginBottom: 4,
    textAlign: 'center',
  },

  layerBoxAmount: {
    fontSize: isMobile ? 13 : 14,
    fontWeight: '600',
    color: '#ef4444',
  },

  spiderChartContainer: {
    width: '100%',
    maxWidth: isMobile ? 300 : 350,
    aspectRatio: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    padding: isMobile ? 12 : 16,
    alignSelf: 'center',
    marginBottom: isMobile ? 20 : 24,
  },

  detailsContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    marginBottom: isMobile ? 20 : 24,
  },

  detailCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 2,
    borderRadius: 16,
    padding: isMobile ? 16 : 20,
  },

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  detailIconText: {
    fontSize: 24,
  },

  detailHeaderText: {
    flex: 1,
  },

  detailName: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    color: colors.textColor,
    marginBottom: 4,
  },

  detailDescription: {
    fontSize: isMobile ? 12 : 13,
    color: colors.subtitleColor,
  },

  detailAmountBox: {
    alignItems: 'flex-end',
  },

  detailAmount: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: '800',
  },

  aspectBreakdown: {
    gap: 12,
  },

  aspectBreakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },

  aspectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  aspectIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
  },

  aspectName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textColor,
  },

  aspectValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textColor,
  },

  modalOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
},

modalContent: {
  width: '85%',
  maxWidth: 400,
  backgroundColor: colors.cardBackground,
  borderRadius: 20,
  padding: isMobile ? 24 : 32,
  alignItems: 'center',
  borderWidth: 2,
  borderColor: colors.accentColor,
},

modalTitle: {
  fontSize: isMobile ? 24 : 28,
  fontWeight: '700',
  color: colors.textColor,
  marginBottom: 16,
  textAlign: 'center',
},

modalText: {
  fontSize: isMobile ? 14 : 16,
  color: colors.subtitleColor,
  textAlign: 'center',
  lineHeight: isMobile ? 22 : 26,
  marginBottom: 24,
},

modalButton: {
  paddingVertical: 14,
  paddingHorizontal: 32,
  borderRadius: 12,
},

modalButtonText: {
  fontSize: 16,
  fontWeight: '600',
  color: colors.textColor,
},
});

export default Screen13;