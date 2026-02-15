import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  ScrollView,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { VictoryArea, VictoryLine, VictoryChart, VictoryAxis, VictoryScatter } from 'victory-native';
import { LinearGradient } from 'expo-linear-gradient';
// import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useQuestionnaire } from '../../../../src/context/QuestionnaireContext';
import { db } from '../../../../src/config/firebase';
import { doc, setDoc,getDoc,collection } from 'firebase/firestore';
import {
  colors,
  globalStyles,
  isMobile
} from '../../../../src/theme/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

const Screen22 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();

  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [goalTimePeriods, setGoalTimePeriods] = useState({});
  const [customAllocations, setCustomAllocations] = useState({});

  const userAge = parseInt(answers?.age) || 35;
  const retirementAge = 60;
  const maxPlanningYears = Math.max(5, Math.min(20, retirementAge - userAge));

  const progressData = {
    sectionData: {
      1: { isActive: false, progress: 0, isCompleted: true },
      2: { isActive: false, progress: 0, isCompleted: true },
      3: { isActive: false, progress: 0, isCompleted: true },
      4: { isActive: false, progress: 0, isCompleted: true },
      5: { isActive: true, progress: 100, isCompleted: false },
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

  // Calculate user savings - EXACT SAME AS WEB
  const calculateSavings = () => {
    if (answers?.monthly_breakdown?.remaining_amount) {
      return answers.monthly_breakdown.remaining_amount * 1000;
    }

    let totalIncome = 0;

    if (answers?.income_data?.salary_business?.has && answers?.income_data?.salary_business?.amount) {
      totalIncome += parseFloat(answers.income_data.salary_business.amount) * 1000 || 0;
    }
    if (answers?.income_data?.rental?.has && answers?.income_data?.rental?.amount) {
      totalIncome += parseFloat(answers.income_data.rental.amount) * 1000 || 0;
    }
    if (answers?.income_data?.other?.has && answers?.income_data?.other?.amount) {
      totalIncome += parseFloat(answers.income_data.other.amount) * 1000 || 0;
    }
    if (answers?.income_data?.spouse?.has && answers?.income_data?.spouse?.amount) {
      totalIncome += parseFloat(answers.income_data.spouse.amount) * 1000 || 0;
    }

    let totalExpenses = 0;

    if (answers?.loan_data) {
      Object.values(answers.loan_data).forEach(loan => {
        if (loan.has && loan.emi) {
          totalExpenses += parseFloat(loan.emi) * 1000 || 0;
        }
      });
    }

    if (answers?.house_expenses) {
      Object.values(answers.house_expenses).forEach(expense => {
        if (expense) {
          totalExpenses += parseFloat(expense) * 1000 || 0;
        }
      });
    }

    if (answers?.child_monthly_expense) {
      totalExpenses += answers.child_monthly_expense;
    }

    if (answers?.dependent_expenses) {
      Object.values(answers.dependent_expenses).forEach(expense => {
        if (expense) {
          totalExpenses += parseFloat(expense) * 1000 || 0;
        }
      });
    }

    const potentialSavings = totalIncome - totalExpenses;
    return potentialSavings > 0 ? potentialSavings : Math.max(totalIncome * 0.2, 20000);
  };

  const userSavings = calculateSavings();

  // Map user goals - EXACT SAME AS WEB
  const mapUserGoalsToGoalData = () => {
    const selectedGoals = answers?.top_goals || [];

    const goalMapping = {
      "domestic_vacation": { name: "Domestic Vacation", targetAmount: 200000, inflation: 0, growth: 10, adhoc: 7 },
      "car_purchase": { name: "Buying a Vehicle", targetAmount: 900000, inflation: 8, growth: 10, adhoc: 8 },
      "higher_course": { name: "Post Graduate Course", targetAmount: 500000, inflation: 5, growth: 12, adhoc: 7 },
      "international_travel": { name: "International Travel", targetAmount: 400000, inflation: 8, growth: 12, adhoc: 7 },
      "new_skill": { name: "Learn New Skill", targetAmount: 100000, inflation: 6, growth: 12, adhoc: 6 },
      "house_purchase": { name: "New House Purchase", targetAmount: 5000000, inflation: 5, growth: 12, adhoc: 8 },
      "home_renovation": { name: "Home Renovation", targetAmount: 800000, inflation: 5, growth: 12, adhoc: 8 },
      "child_education": { name: "Child Education", targetAmount: 2000000, inflation: 7, growth: 14, adhoc: 9 },
      "own_marriage": { name: "Marriage Planning", targetAmount: 1500000, inflation: 10, growth: 15, adhoc: 8 },
      "new_venture": { name: "Start New Venture", targetAmount: 1000000, inflation: 6, growth: 12, adhoc: 10 },
      "expensive_gadgets": { name: "Buy Expensive Gadgets", targetAmount: 300000, inflation: 0, growth: 12, adhoc: 6 },
      "planning_child": { name: "Planning a Child", targetAmount: 1000000, inflation: 7, growth: 14, adhoc: 8 },
      "concert": { name: "Attending Concert", targetAmount: 150000, inflation: 0, growth: 10, adhoc: 6 }
    };

    if (selectedGoals.length > 0) {
      return selectedGoals.slice(0, 3).map(goalKey =>
        goalMapping[goalKey] || {
          name: goalKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          targetAmount: 500000,
          inflation: 7,
          growth: 10,
          adhoc: 7
        }
      );
    }

    return [
      { name: "International Vacation", targetAmount: 300000, inflation: 6, growth: 10, adhoc: 7 },
      { name: "Buying a Vehicle", targetAmount: 900000, inflation: 8, growth: 12, adhoc: 8 },
      { name: "Home Renovation", targetAmount: 600000, inflation: 5, growth: 12, adhoc: 8 }
    ];
  };

  const goals = mapUserGoalsToGoalData();

  // Initialize time periods - EXACT SAME AS WEB
  useEffect(() => {
    const initialTimePeriod = userAge < 30 ? 5 : userAge < 40 ? 7 : 10;
    const defaultPeriod = Math.min(initialTimePeriod, maxPlanningYears);

    const initialPeriods = {};
    goals.forEach((_, index) => {
      initialPeriods[index] = defaultPeriod;
    });
    setGoalTimePeriods(initialPeriods);
  }, [userAge, maxPlanningYears, goals.length]);

  const getCurrentTimePeriod = (goalIndex) => {
    return goalTimePeriods[goalIndex] || 5;
  };

  // Calculate step - EXACT SAME AS WEB
  const calculateStep = (sipAmount, inflationRate) => {
    const inflation = inflationRate > 1 ? inflationRate / 100 : inflationRate;
    const calculatedStep = sipAmount * inflation;
    const roundedStep = Math.ceil(calculatedStep / 500) * 500;
    return Math.max(roundedStep, 500);
  };

  // Get allocations - EXACT SAME AS WEB
  const getAllocations = () => {
    const totalSavings = userSavings;

    if (Object.keys(customAllocations).length === 0) {
      return [
        Math.round(totalSavings * 0.5 / 1000) * 1000,
        Math.round(totalSavings * 0.3 / 1000) * 1000,
        Math.round(totalSavings * 0.2 / 1000) * 1000
      ];
    }

    const allocations = [0, 0, 0];
    let remainingSavings = totalSavings;

    if (customAllocations[0] !== undefined) {
      allocations[0] = Math.min(customAllocations[0], totalSavings);
      remainingSavings -= allocations[0];
    } else {
      allocations[0] = Math.round(totalSavings * 0.5 / 1000) * 1000;
      remainingSavings -= allocations[0];
    }

    if (customAllocations[1] !== undefined) {
      allocations[1] = Math.min(customAllocations[1], remainingSavings);
      remainingSavings -= allocations[1];
    } else {
      const defaultGoal2 = Math.round(totalSavings * 0.3 / 1000) * 1000;
      allocations[1] = Math.min(defaultGoal2, remainingSavings);
      remainingSavings -= allocations[1];
    }

    if (customAllocations[2] !== undefined) {
      allocations[2] = Math.min(customAllocations[2], remainingSavings);
    } else {
      allocations[2] = Math.max(0, remainingSavings);
    }

    return allocations;
  };

  const allocations = getAllocations();

  // FV calculation - EXACT SAME AS WEB
  const calculateFV = (rate, months, initialPmt, inflation) => {
    const monthlyRate = rate / 100 / 12;
    let fv = 0;

    for (let month = 1; month <= months; month++) {
      const completedYears = Math.floor((month - 1) / 12);
      const yearlyStep = inflation > 0 ? calculateStep(initialPmt, inflation) : 0;
      const currentPayment = initialPmt + (yearlyStep * completedYears);
      const remainingMonths = months - month + 1;

      if (monthlyRate === 0) {
        fv += currentPayment;
      } else {
        fv += currentPayment * Math.pow(1 + monthlyRate, remainingMonths - 1);
      }
    }
    return Math.round(fv / 1000) * 1000;
  };

  // Generate chart data
  const generateComparisonData = (goal, allocationIndex) => {
    const monthlyAllocation = allocations[allocationIndex];
    const goWealthyData = [];
    const adhocData = [];
    const currentTimePeriod = getCurrentTimePeriod(allocationIndex);
    const timelineMonths = currentTimePeriod * 12;

    for (let months = 0; months <= timelineMonths; months += 12) {
      const years = months / 12;
      let goWealthyValue = 0;
      let adhocValue = 0;

      if (months > 0) {
        goWealthyValue = calculateFV(goal.growth, months, monthlyAllocation, goal.inflation || 0);
        adhocValue = calculateFV(goal.adhoc, months, monthlyAllocation, 0);
      }

      goWealthyData.push({ x: years, y: goWealthyValue });
      adhocData.push({ x: years, y: adhocValue });
    }

    return { goWealthyData, adhocData };
  };

  const currentGoal = goals[currentGoalIndex];
  const { goWealthyData, adhocData } = generateComparisonData(currentGoal, currentGoalIndex);

  // Handle allocation change
  const handleAllocationChange = (goalIndex, newAmount) => {
    const totalSavings = userSavings;
    const step = 1000;
    const roundedAmount = Math.round(newAmount / step) * step;

    if (goalIndex === 0) {
      const maxGoal1 = totalSavings;
      const finalAmount = Math.max(step, Math.min(roundedAmount, maxGoal1));
      setCustomAllocations(prev => ({ ...prev, [0]: finalAmount }));
    } else if (goalIndex === 1) {
      const goal1Amount = customAllocations[0] || Math.round(totalSavings * 0.5 / step) * step;
      const availableForGoal2 = totalSavings - goal1Amount;
      const finalAmount = Math.max(0, Math.min(roundedAmount, availableForGoal2));
      setCustomAllocations(prev => ({ ...prev, [1]: finalAmount }));
    } else if (goalIndex === 2) {
      const goal1Amount = customAllocations[0] || Math.round(totalSavings * 0.5 / step) * step;
      const goal2Amount = customAllocations[1] || Math.round(totalSavings * 0.3 / step) * step;
      const availableForGoal3 = totalSavings - goal1Amount - goal2Amount;
      const finalAmount = Math.max(0, Math.min(roundedAmount, availableForGoal3));
      setCustomAllocations(prev => ({ ...prev, [2]: finalAmount }));
    }
  };

  const canIncrease = (goalIndex) => {
    const currentAllocation = allocations[goalIndex];
    const totalSavings = userSavings;

    if (goalIndex === 0) {
      return currentAllocation + 1000 <= totalSavings;
    } else if (goalIndex === 1) {
      const goal1Amount = allocations[0];
      return currentAllocation + 1000 <= (totalSavings - goal1Amount);
    } else if (goalIndex === 2) {
      const goal1Amount = allocations[0];
      const goal2Amount = allocations[1];
      return currentAllocation + 1000 <= (totalSavings - goal1Amount - goal2Amount);
    }
    return false;
  };

  const canDecrease = (goalIndex) => {
    const currentAllocation = allocations[goalIndex];
    return goalIndex === 2 ? currentAllocation > 0 : currentAllocation > 1000;
  };

  const currentAllocation = allocations[currentGoalIndex];
  const currentGoalTimePeriod = getCurrentTimePeriod(currentGoalIndex);
  const goWealthyProjection = calculateFV(currentGoal.growth, currentGoalTimePeriod * 12, currentAllocation, currentGoal.inflation);
  const adhocProjection = calculateFV(currentGoal.adhoc, currentGoalTimePeriod * 12, currentAllocation, 0);
  const benefitAmount = goWealthyProjection - adhocProjection;
  const benefitPercentage = adhocProjection > 0 ? ((benefitAmount / adhocProjection) * 100) : 0;

//   // Save to context
//   useEffect(() => {
//     if (Object.keys(goalTimePeriods).length > 0) {
//       const updatedGoals = goals.map((goal, index) => {
//         const goalTimePeriod = getCurrentTimePeriod(index);
//         const goalAllocation = allocations[index];
//         const stepValue = calculateStep(goalAllocation, goal.inflation || 0);

//         return {
//           name: goal.name,
//           targetAmount: goal.targetAmount,
//           inflation: goal.inflation,
//           growth: goal.growth,
//           adhoc: goal.adhoc,
//           timePeriod: goalTimePeriod,
//           customAllocation: goalAllocation,
//           stepValue: stepValue,
//           calculatedAmount: calculateFV(goal.growth, goalTimePeriod * 12, goalAllocation, goal.inflation || 0)
//         };
//       });

//       updateAnswer('goal_allocations', {
//         goals: updatedGoals,
//         savings: userSavings,
//         user_age: userAge
//       });
//     }
//   }, [goalTimePeriods, customAllocations, allocations]);
useEffect(() => {
  if (Object.keys(goalTimePeriods).length > 0) {
    const updatedGoals = goals.map((goal, index) => {
      const goalTimePeriod = getCurrentTimePeriod(index);
      const goalAllocation = allocations[index];
      const stepValue = calculateStep(goalAllocation, goal.inflation || 0);

      return {
        name: goal.name,
        targetAmount: goal.targetAmount,
        inflation: goal.inflation,
        growth: goal.growth,
        adhoc: goal.adhoc,
        timePeriod: goalTimePeriod,
        customAllocation: goalAllocation,
        stepValue: stepValue,
        calculatedAmount: calculateFV(goal.growth, goalTimePeriod * 12, goalAllocation, goal.inflation || 0)
      };
    });

    updateAnswer('goal_allocations', updatedGoals);
  }
}, [goalTimePeriods, customAllocations]);  // ✅ Remove allocations
// const handleContinue = async () => {
//   try {
   
    
//     // ✅ GET PHONE FROM ASYNCSTORAGE
//     const phoneNumber = await AsyncStorage.getItem('user_phone');
    
//     if (!phoneNumber) {
//       alert('Phone number not found. Please verify again.');
//       return;
//     }
    
//     console.log('💾 Saving to Firebase for:', phoneNumber);
    
//     // ✅ SAVE ALL DATA TO FIREBASE
//     await setDoc(doc(db, 'users', phoneNumber), {
//       ...answers,
//       createdAt: new Date().toISOString(),
//       lastUpdated: new Date().toISOString()
//     });
    
//     console.log('✅ Data saved to Firebase successfully');
    
//     // Navigate to screen23
//     router.push('/(gowealthy)/questionnaire/section5/screen23');
    
//   } catch (error) {
//     console.error('❌ Firebase save error:', error);
//     alert('Failed to save data. Please try again.');
//   }
// };

const handleContinue = async () => {
  try {
    const phoneNumber = await AsyncStorage.getItem('user_phone');
    
    if (!phoneNumber) {
      alert('Phone number not found. Please verify again.');
      return;
    }
    
    console.log('💾 Saving to Firebase for:', phoneNumber);
    
    // 🔥 CONVERT TO K FORMAT
    const convertToK = (data) => {
      const converted = JSON.parse(JSON.stringify(data));
      
      // Emergency funds: rupees → K
      if (converted.emergency_funds?.amount) {
        converted.emergency_funds.amount = Math.round(converted.emergency_funds.amount / 1000);
        converted.emergency_funds.total_emergency_fund = Math.round(converted.emergency_funds.total_emergency_fund / 1000);
        
        ['foundation_layer', 'intermediate_layer', 'fortress_layer'].forEach(layer => {
          if (converted.emergency_funds[layer]) {
            const layerData = converted.emergency_funds[layer];
            ['amount', 'medical', 'emi', 'work_security', 'house', 'vehicle'].forEach(field => {
              if (layerData[field]) {
                layerData[field] = Math.round(layerData[field] / 1000);
              }
            });
          }
        });
      }
      
      // Insurance: lakhs → K (multiply by 100)
      // if (converted.insurance_data?.life?.sum_insured) {
      //   const lakhs = parseFloat(converted.insurance_data.life.sum_insured);
      //   converted.insurance_data.life.sum_insured = Math.round(lakhs * 100);
      // }
      // if (converted.insurance_data?.health?.sum_insured) {
      //   const lakhs = parseFloat(converted.insurance_data.health.sum_insured);
      //   converted.insurance_data.health.sum_insured = Math.round(lakhs * 100);
      // }
       if (converted.insurance_data?.life?.targetCoverage) {
        const lakhs = parseFloat(converted.insurance_data.life.targetCoverage);
        converted.insurance_data.life.targetCoverage = Math.round(lakhs * 100);
      }
      if (converted.insurance_data?.health?.targetCoverage) {
        const lakhs = parseFloat(converted.insurance_data.health.targetCoverage);
        converted.insurance_data.health.targetCoverage = Math.round(lakhs * 100);
      }
      
      // Goals: rupees → K
     if (Array.isArray(converted.goal_allocations)) {
  converted.goal_allocations = converted.goal_allocations.map(goal => ({
    ...goal,
    targetAmount: Math.round(goal.targetAmount / 1000),
    customAllocation: Math.round(goal.customAllocation / 1000),
    calculatedAmount: Math.round(goal.calculatedAmount / 1000)
  }));
}
      
      // Savings: rupees → K
      if (converted.goal_allocations?.savings) {
        converted.goal_allocations.savings = Math.round(converted.goal_allocations.savings / 1000);
      }
      
      return converted;
    };
    
     const timestamp = new Date();
    const convertedData = convertToK(answers);
    
    const userDocRef = doc(db, 'questionnaire_submissions', phoneNumber);
    
    // 🔥 CHECK EXISTING VERSION
    const userDoc = await getDoc(userDocRef);
    const currentCount = userDoc.exists() ? (userDoc.data().total_submissions || 0) : 0;
    const newVersion = currentCount + 1;
    
    const submissionId = timestamp.toISOString().replace(/[:.]/g, '-');
    
    // 1️⃣ Save versioned submission
    const submissionsColRef = collection(userDocRef, 'submissions');
    await setDoc(doc(submissionsColRef, submissionId), {
      raw_answers: convertedData,
      timestamp: timestamp.toISOString(),
      submitted_at: timestamp,
      version: newVersion
    });
    
    // 2️⃣ Update main document
    await setDoc(userDocRef, {
      raw_answers: convertedData,
      phone_number: phoneNumber,
      full_name: convertedData.fullName || '',
      email: convertedData.email || '',
      latest_submission_date: timestamp.toISOString(),
      latest_submission_id: submissionId,
      total_submissions: newVersion,
      last_updated: timestamp,
      createdAt: userDoc.exists() ? userDoc.data().createdAt : timestamp.toISOString(),
      timestamp: timestamp.toISOString()
    });
    
    console.log('✅ Saved (version:', newVersion, ')');
    
    router.push('/(gowealthy)/questionnaire/section5/screen23');
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Failed to save: ' + error.message);
  }
};
  const handleBack = () => {
    router.back();
  };

  // Format currency
  const formatCurrency = (value) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

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
                <Text style={globalStyles.sectionTitle}>Goal Summary</Text>
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

            <View style={styles.contentContainer}>
              {/* Goal Cards */}
              <View style={styles.goalsGrid}>
                {goals.map((goal, index) => {
                  const allocation = allocations[index];
                  const isSelected = index === currentGoalIndex;

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setCurrentGoalIndex(index)}
                      activeOpacity={0.8}
                      style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                    >
                      <View style={styles.goalCardInner}>
                        <View style={styles.goalCardHeader}>
                          <View style={[styles.goalDot, { backgroundColor: isSelected ? '#a78bfa' : '#6b7280' }]} />
                          <Text style={styles.goalName} numberOfLines={2}>{goal.name}</Text>
                        </View>
                        <Text style={styles.goalAllocation}>₹{(allocation / 1000)}K/mo</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Controllers */}
              <View style={styles.controllersRow}>
                <View style={styles.controllerCard}>
                  <Text style={styles.controllerLabel}>Monthly Amount</Text>
                  <View style={styles.controllerButtons}>
                    <TouchableOpacity
                      onPress={() => handleAllocationChange(currentGoalIndex, currentAllocation - 1000)}
                      disabled={!canDecrease(currentGoalIndex)}
                      style={[styles.controlButton, styles.decreaseButton, !canDecrease(currentGoalIndex) && styles.controlButtonDisabled]}
                    >
                      <Text style={styles.controlButtonText}>−</Text>
                    </TouchableOpacity>
                    <View style={styles.controlValue}>
                      <Text style={styles.controlValueText}>₹{(currentAllocation / 1000)}K</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleAllocationChange(currentGoalIndex, currentAllocation + 1000)}
                      disabled={!canIncrease(currentGoalIndex)}
                      style={[styles.controlButton, styles.increaseButton, !canIncrease(currentGoalIndex) && styles.controlButtonDisabled]}
                    >
                      <Text style={styles.controlButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.controllerCard}>
                  <Text style={styles.controllerLabel}>Time Period</Text>
                  <View style={styles.controllerButtons}>
                    <TouchableOpacity
                      onPress={() => {
                        const currentPeriod = getCurrentTimePeriod(currentGoalIndex);
                        setGoalTimePeriods(prev => ({ ...prev, [currentGoalIndex]: Math.max(1, currentPeriod - 1) }));
                      }}
                      style={[styles.controlButton, styles.decreaseButton]}
                    >
                      <Text style={styles.controlButtonText}>−</Text>
                    </TouchableOpacity>
                    <View style={styles.controlValue}>
                      <Text style={styles.controlValueText}>{getCurrentTimePeriod(currentGoalIndex)} Years</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        const currentPeriod = getCurrentTimePeriod(currentGoalIndex);
                        setGoalTimePeriods(prev => ({ ...prev, [currentGoalIndex]: Math.min(maxPlanningYears, currentPeriod + 1) }));
                      }}
                      style={[styles.controlButton, styles.increaseButton]}
                    >
                      <Text style={styles.controlButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Chart */}
             {/* Chart */}
<View style={styles.chartContainer}>
  <VictoryChart
    height={280}
    width={screenWidth - 60}
    padding={{ top: 40, bottom: 50, left: 60, right: 30 }}
  >
    <VictoryAxis
      style={{
        axis: { stroke: '#374151' },
        axisLabel: { fill: '#9ca3af', fontSize: 12 },
        tickLabels: { fill: '#9ca3af', fontSize: 10 },
        grid: { stroke: '#374151', strokeDasharray: '3,3' }
      }}
      tickFormat={(t) => `${Math.round(t)}Y`}
    />
    <VictoryAxis
      dependentAxis
      tickFormat={(t) => formatCurrency(t)}
      style={{
        axis: { stroke: '#374151' },
        tickLabels: { fill: '#9ca3af', fontSize: 10 },
        grid: { stroke: '#374151', strokeDasharray: '3,3' }
      }}
    />
    <VictoryArea
      data={goWealthyData}
      style={{
        data: { fill: '#F59E0B', fillOpacity: 0.3, stroke: '#F59E0B', strokeWidth: 3 }
      }}
    />
    <VictoryLine
      data={adhocData}
      style={{
        data: { stroke: '#8B5CF6', strokeWidth: 3, strokeDasharray: '8,4' }
      }}
    />
    <VictoryScatter
      data={[goWealthyData[goWealthyData.length - 1]]}
      size={5}
      style={{ data: { fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 } }}
    />
    <VictoryScatter
      data={[adhocData[adhocData.length - 1]]}
      size={5}
      style={{ data: { fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 } }}
    />
  </VictoryChart>

  <View style={styles.chartLegend}>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
      <Text style={styles.legendText}>With GoWealthy</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
      <Text style={styles.legendText}>Adhoc Plan</Text>
    </View>
  </View>
</View>
              {/* Projections */}
              <View style={styles.projectionsRow}>
                <View style={[styles.projectionCard, styles.goWealthyProjection]}>
                  <Text style={styles.projectionLabel}>GoWealthy ({currentGoalTimePeriod}Y)</Text>
                  <Text style={[styles.projectionValue, { color: '#F59E0B' }]}>{formatCurrency(goWealthyProjection)}</Text>
                </View>
                <View style={[styles.projectionCard, styles.adhocProjection]}>
                  <Text style={styles.projectionLabel}>Adhoc Plan ({currentGoalTimePeriod}Y)</Text>
                  <Text style={[styles.projectionValue, { color: '#8B5CF6' }]}>{formatCurrency(adhocProjection)}</Text>
                </View>
              </View>

              {/* Planning Horizon */}
              <View style={styles.planningHorizon}>
                <Text style={styles.planningHorizonText}>
                  <Text style={styles.planningHorizonLabel}>Planning Horizon: </Text>
                  {userAge < 30 && "You have excellent time for wealth building!"}
                  {userAge >= 30 && userAge < 40 && "Prime earning years ahead!"}
                  {userAge >= 40 && userAge < 50 && "Focus on accelerated growth!"}
                  {userAge >= 50 && "Strategic planning for retirement!"}
                </Text>
              </View>

              {/* GoWealthy Advantage */}
              {benefitAmount > 0 && (
                <View style={styles.advantageCard}>
                  <View style={styles.advantageLeft}>
                    <Text style={styles.advantageTitle}>GoWealthy Advantage</Text>
                    <Text style={styles.advantageSubtitle}>vs Adhoc Planning</Text>
                  </View>
                  <View style={styles.advantageRight}>
                    <Text style={styles.advantageAmount}>+{formatCurrency(benefitAmount)}</Text>
                    <Text style={styles.advantagePercentage}>+{benefitPercentage.toFixed(1)}% more</Text>
                  </View>
                </View>
              )}

              {/* Continue Button */}
              <View style={globalStyles.confirmButton}>
                <TouchableOpacity onPress={handleContinue} activeOpacity={0.8}>
                  <LinearGradient
                    colors={[colors.gradientPurple1, colors.gradientPurple2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={globalStyles.buttonInner}
                  >
                    <Text style={globalStyles.confirmButtonText}>Continue to Next Step</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  contentContainer: { flex: 1, paddingHorizontal: isMobile ? 12 : 24, paddingBottom: 30 },
  goalsGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  goalCard: { flex: 1, minHeight: 70, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.03)', overflow: 'hidden' },
  goalCardSelected: { borderColor: '#a78bfa', backgroundColor: 'rgba(167, 139, 250, 0.15)' },
  goalCardInner: { flex: 1, padding: 8, justifyContent: 'space-between' },
  goalCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  goalDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  goalName: { flex: 1, fontSize: 11, fontWeight: '600', color: colors.textColor, lineHeight: 14 },
  goalAllocation: { fontSize: 10, color: colors.subtitleColor },
  controllersRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  controllerCard: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  controllerLabel: { fontSize: 12, color: colors.subtitleColor, marginBottom: 12, fontWeight: '500' },
  controllerButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  controlButton: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  decreaseButton: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  increaseButton: { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.3)' },
  controlButtonDisabled: { opacity: 0.3 },
  controlButtonText: { fontSize: 20, fontWeight: 'bold', color: colors.textColor },
  controlValue: { flex: 1, alignItems: 'center' },
  controlValueText: { fontSize: 14, fontWeight: 'bold', color: colors.textColor },
  chartContainer: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 12 },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11, color: colors.subtitleColor },
  projectionsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  projectionCard: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1 },
  goWealthyProjection: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' },
  adhocProjection: { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.3)' },
  projectionLabel: { fontSize: 10, color: colors.subtitleColor, marginBottom: 4 },
  projectionValue: { fontSize: 16, fontWeight: 'bold' },
  planningHorizon: { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', marginBottom: 12 },
  planningHorizonText: { fontSize: 12, color: '#93c5fd' },
  planningHorizonLabel: { fontWeight: '600' },
  advantageCard: { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  advantageLeft: { flex: 1 },
  advantageTitle: { fontSize: 14, fontWeight: '600', color: '#4ade80', marginBottom: 4 },
  advantageSubtitle: { fontSize: 11, color: '#86efac' },
  advantageRight: { alignItems: 'flex-end' },
  advantageAmount: { fontSize: 18, fontWeight: 'bold', color: '#4ade80' },
  advantagePercentage: { fontSize: 11, color: '#86efac' },
});

export default Screen22;