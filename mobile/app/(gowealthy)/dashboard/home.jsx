
// import React, { useState, useEffect, useMemo } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   StyleSheet,
//   Modal,
//   ActivityIndicator,
//   Dimensions,
//   TouchableOpacity,
// } from 'react-native';
// import { db } from '../../../src/config/firebase';
// import { doc, getDoc } from 'firebase/firestore';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width: screenWidth } = Dimensions.get('window');

// const DashboardHome = () => {
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
//   const [expandedCards, setExpandedCards] = useState({});

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         setLoading(true);
//         const phoneNumber = await AsyncStorage.getItem('user_phone');

//         if (!phoneNumber) {
//           console.log('❌ No phone number found');
//           setLoading(false);
//           return;
//         }

//         console.log('📥 Fetching dashboard data for:', phoneNumber);
//         const userDoc = await getDoc(doc(db, 'users', phoneNumber));

//         if (userDoc.exists()) {
//           const data = userDoc.data();
//           setUserData(data);
//           console.log('✅ Dashboard data loaded');
//         } else {
//           console.log('❌ No data found');
//         }
//       } catch (error) {
//         console.error('❌ Firebase fetch error:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUserData();
//   }, []);

//   const totalIncome = useMemo(() => {
//     if (!userData?.income_data) return 0;
//     const income = userData.income_data;
//     let total = 0;
//     if (income.salary_business?.has) total += parseFloat(income.salary_business.amount || 0);
//     if (income.rental?.has) total += parseFloat(income.rental.amount || 0);
//     if (income.other?.has) total += parseFloat(income.other.amount || 0);
//     if (income.spouse?.has) total += parseFloat(income.spouse.amount || 0);
//     return total * 1000;
//   }, [userData]);

//   const totalExpenses = useMemo(() => {
//     if (!userData) return 0;
//     const house = userData.house_expenses || {};
//     const loans = userData.loan_data || {};
//     const dependent = userData.dependent_expenses || {};
//     let total = 0;
//     total += parseFloat(house.rent_maintenance || 0);
//     total += parseFloat(house.groceries || 0);
//     total += parseFloat(house.help_salaries || 0);
//     total += parseFloat(house.shopping_dining_entertainment || 0);
//     total += parseFloat(userData.child_monthly_expense || 0);
//     total += parseFloat(dependent.spouse || 0);
//     total += parseFloat(dependent.parent || 0);
//     total += parseFloat(dependent.pet || 0);
//     if (loans.home?.has) total += parseFloat(loans.home.emi || 0);
//     if (loans.commercial?.has) total += parseFloat(loans.commercial.emi || 0);
//     if (loans.car?.has) total += parseFloat(loans.car.emi || 0);
//     if (loans.education?.has) total += parseFloat(loans.education.emi || 0);
//     if (loans.personal?.has) total += parseFloat(loans.personal.emi || 0);
//     return total * 1000;
//   }, [userData]);

//   const savings = totalIncome - totalExpenses;

//   const formatAmount = (amount) => {
//     if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
//     if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
//     return `₹${amount.toFixed(0)}`;
//   };

//   const getUserName = () => {
//     const fullName = userData?.user_data?.fullName || userData?.fullName || 'User';
//     const firstName = fullName.split(' ')[0] || 'User';
//     return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
//   };

//   const riskCapacity = userData?.risk_assessment?.riskCapacity || 0;
//   const riskCategory = userData?.risk_assessment?.riskCategory || 'Not Assessed';
//   const keywords = userData?.risk_assessment?.keywords || 'Complete assessment';

//   const getRiskColor = (score) => {
//     if (score <= 30) return '#ef4444';
//     if (score <= 45) return '#f59e0b';
//     if (score <= 60) return '#eab308';
//     return '#10b981';
//   };
//   const riskColor = getRiskColor(riskCapacity);

//   const efData = userData?.emergency_funds;
//   const selectedLayer = efData?.approach || 'foundation';
//   const layerData = efData?.[`${selectedLayer}_layer`] || efData?.foundation_layer;
//   const totalEmergencyFund = layerData?.amount || 0;

//   const healthInsurance = userData?.insurance_data?.health;
//   const healthCoverage = healthInsurance?.has ? (parseFloat(healthInsurance.sum_insured || 0) * 1000) : 0;
  
//   const lifeInsurance = userData?.insurance_data?.life;
//   const lifeCoverage = lifeInsurance?.has ? (parseFloat(lifeInsurance.sum_insured || 0) * 1000) : 0;

//   const goals = userData?.goal_allocations?.goals || [];

//   const toggleExpand = (cardId) => {
//     setExpandedCards(prev => ({
//       ...prev,
//       [cardId]: !prev[cardId]
//     }));
//   };

//   if (loading) {
//     return (
//       <Modal transparent visible={loading} animationType="fade">
//         <View style={styles.loadingModal}>
//           <View style={styles.loadingContent}>
//             <ActivityIndicator size="large" color="#a855f7" />
//             <Text style={styles.loadingText}>Updating Dashboard...</Text>
//             <Text style={styles.loadingSubtext}>Fetching your financial data</Text>
//           </View>
//         </View>
//       </Modal>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>
//           <Text style={styles.headerName}>{getUserName()}'s </Text>
//           <Text style={styles.headerBrand}>GoWealthy </Text>
//           <Text style={styles.headerName}>Journey</Text>
//         </Text>
//       </View>

//       <CashFlowCard totalIncome={totalIncome} totalExpenses={totalExpenses} savings={savings} formatAmount={formatAmount} />
//       <RiskProfileCard riskCapacity={riskCapacity} riskCategory={riskCategory} keywords={keywords} riskColor={riskColor} />
      
//       {efData && (
//         <EmergencyFundCard
//           layerName={selectedLayer.charAt(0).toUpperCase() + selectedLayer.slice(1)}
//           totalAmount={totalEmergencyFund}
//           layerData={layerData}
//           formatAmount={formatAmount}
//           expanded={expandedCards['emergency']}
//           onToggle={() => toggleExpand('emergency')}
//         />
//       )}

//       <HealthInsuranceCard coverage={healthCoverage} formatAmount={formatAmount} isActive={healthInsurance?.has} />
//       <LifeInsuranceCard coverage={lifeCoverage} formatAmount={formatAmount} isActive={lifeInsurance?.has} />

//       {goals.length > 0 && (
//         <GoalsCard goals={goals} currentIndex={currentGoalIndex} onIndexChange={setCurrentGoalIndex} formatAmount={formatAmount} />
//       )}

//       <View style={{ height: 100 }} />
//     </ScrollView>
//   );
// };

// const CashFlowCard = ({ totalIncome, totalExpenses, savings, formatAmount }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: '#10b98120' }]}>
//         <Text style={styles.iconText}>₹</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your CashFlow</Text>
//         <Text style={styles.cardSubtitle}>Income, Expenses & Savings</Text>
//       </View>
//       <TouchableOpacity style={styles.editIcon}>
//         <Text style={styles.editIconText}>✎</Text>
//       </TouchableOpacity>
//     </View>
//     <View style={styles.statsGrid}>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Income</Text>
//         <Text style={[styles.statValue, { color: '#10b981' }]}>{formatAmount(totalIncome)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Expenses</Text>
//         <Text style={[styles.statValue, { color: '#ef4444' }]}>{formatAmount(totalExpenses)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Savings</Text>
//         <Text style={[styles.statValue, { color: '#3b82f6' }]}>{formatAmount(savings)}</Text>
//       </View>
//     </View>
//   </View>
// );

// const RiskProfileCard = ({ riskCapacity, riskCategory, keywords, riskColor }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: `${riskColor}20` }]}>
//         <Text style={styles.iconEmoji}>🎯</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your Money Mindset</Text>
//         <Text style={styles.cardSubtitle}>Psychology-based assessment</Text>
//       </View>
//       <TouchableOpacity style={styles.editIcon}>
//         <Text style={styles.editIconText}>✎</Text>
//       </TouchableOpacity>
//     </View>
//     <View style={styles.riskContent}>
//       <View style={styles.riskCircleOuter}>
//         <View style={[styles.riskCircleInner, { backgroundColor: riskColor }]}>
//           <Text style={styles.riskPercentage}>{Math.round(riskCapacity)}%</Text>
//         </View>
//       </View>
//       <View style={{ flex: 1, marginLeft: 16 }}>
//         <Text style={[styles.riskCategory, { color: riskColor }]}>{riskCategory}</Text>
//         <Text style={styles.riskKeywords}>{keywords}</Text>
//       </View>
//     </View>
//   </View>
// );

// const EmergencyFundCard = ({ layerName, totalAmount, layerData, formatAmount, expanded, onToggle }) => {
//   const getLayerColor = (name) => {
//     const colors = { Foundation: '#a855f7', Intermediate: '#f97316', Fortress: '#a855f7' };
//     return colors[name] || '#a855f7';
//   };
//   const color = getLayerColor(layerName);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
//           <Text style={styles.iconEmoji}>⚡</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Emergency Fund</Text>
//           <Text style={styles.cardSubtitle}>Extended family & vehicle coverage</Text>
//         </View>
//         <View style={styles.amountRight}>
//           <Text style={styles.amountLarge}>{formatAmount(totalAmount)}</Text>
//           <Text style={styles.amountSubtext}>{layerName} layer</Text>
//         </View>
//       </View>

//       <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
//         <Text style={styles.expandText}>{expanded ? 'Hide Details ∧' : 'View Breakdown ∨'}</Text>
//       </TouchableOpacity>

//       {expanded && layerData && (
//         <View style={styles.breakdownSection}>
//           <Text style={styles.breakdownTitle}>Coverage Breakdown</Text>
//           {[
//             { label: 'Medical', value: layerData.medical, icon: '❤️', color: '#a855f7' },
//             { label: 'EMI', value: layerData.emi, icon: '💳', color: '#f97316' },
//             { label: 'Work Security', value: layerData.work_security, icon: '💼', color: '#a855f7' },
//             { label: 'House', value: layerData.house, icon: '🏠', color: '#f97316' },
//             { label: 'Vehicle', value: layerData.vehicle, icon: '🚗', color: '#a855f7' }
//           ].map((item, idx) => {
//             const percentage = totalAmount > 0 ? ((item.value || 0) / totalAmount) * 100 : 0;
//             return (
//               <View key={idx} style={styles.breakdownItem}>
//                 <View style={styles.breakdownRow}>
//                   <View style={styles.breakdownLeft}>
//                     <Text style={styles.breakdownIcon}>{item.icon}</Text>
//                     <Text style={styles.breakdownLabel}>{item.label}</Text>
//                   </View>
//                   <View style={styles.breakdownRight}>
//                     <Text style={styles.breakdownValue}>{formatAmount(item.value || 0)}</Text>
//                     <Text style={styles.breakdownPercent}>{percentage.toFixed(1)}%</Text>
//                   </View>
//                 </View>
//                 <View style={styles.progressBar}>
//                   <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: item.color }]} />
//                 </View>
//               </View>
//             );
//           })}
//         </View>
//       )}

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonIcon}>🔗</Text>
//           <Text style={styles.buttonText}>Link Investments</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
//           <Text style={styles.buttonIcon}>✓</Text>
//           <Text style={styles.buttonText}>Mark as Done</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// // ✅ FIXED: Side-by-side insurance stats like web
// const HealthInsuranceCard = ({ coverage, formatAmount, isActive }) => {
//   const recommendedCoverage = 1500000;
//   const currentPercentage = recommendedCoverage > 0 ? (coverage / recommendedCoverage) * 100 : 0;
//   const gap = Math.max(0, recommendedCoverage - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: '#a855f720' }]}>
//           <Text style={styles.iconEmoji}>❤️</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Health Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Protection'}</Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.editIcon}>
//           <Text style={styles.editIconText}>✎</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.insuranceCenter}>
//         <View style={styles.circularProgress}>
//           <View style={styles.circularInner}>
//             <Text style={styles.circularAmount}>{formatAmount(recommendedCoverage)}</Text>
//             <Text style={styles.circularLabel}>Recommended Coverage</Text>
//           </View>
//         </View>
//         <View style={styles.percentageBox}>
//           <Text style={styles.percentageText}>{currentPercentage.toFixed(0)}%</Text>
//           <Text style={styles.percentageLabel}>Current Coverage</Text>
//         </View>
//       </View>

//       {/* ✅ SIDE BY SIDE - Like Web */}
//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>⚠️ Coverage Gap</Text>
//           <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>

//           <Text style={styles.buttonText}>Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// // ✅ FIXED: Side-by-side insurance stats like web
// const LifeInsuranceCard = ({ coverage, formatAmount, isActive }) => {
//   const recommendedCoverage = 5000000;
//   const gap = Math.max(0, recommendedCoverage - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: '#f9731620' }]}>
//           <Text style={styles.iconEmoji}>🔺</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Life Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Security'}</Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.editIcon}>
//           <Text style={styles.editIconText}>✎</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.lifeCenter}>
//         <Text style={styles.lifeAmount}>{formatAmount(coverage)}</Text>
//         <Text style={styles.lifeLabel}>Coverage Amount</Text>
//       </View>

//       {/* ✅ SIDE BY SIDE - Like Web */}
//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>📈 Coverage Gap</Text>
//           <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// // ✅ FIXED: Monthly SIP displayed as-is (already in K format from DB)
// const GoalsCard = ({ goals, currentIndex, onIndexChange, formatAmount }) => {
//   return (
//     <View style={styles.goalsContainer}>
//       <ScrollView
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         snapToInterval={screenWidth - 32}
//         decelerationRate="fast"
//         onMomentumScrollEnd={(e) => {
//           const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 32));
//           onIndexChange(index);
//         }}
//       >
//         {goals.map((goal, index) => (
//           <View key={index} style={[styles.goalCard, { width: screenWidth - 32 }]}>
//             <View style={styles.goalHeader}>
//               <View style={styles.goalIconBox}>
//                 <Text style={styles.goalIcon}>🎯</Text>
//               </View>
//               <View style={styles.goalTitleContainer}>
//                 <Text style={styles.goalName}>{goal.name}</Text>
//                 <View style={styles.goalBadge}>
//                   <Text style={styles.goalBadgeText}>⚠️ Needs Attention</Text>
//                 </View>
//               </View>
//               <View style={styles.goalMonthly}>
//                 <Text style={styles.goalMonthlyLabel}>Monthly</Text>
//                 {/* ✅ Display as-is - already in K format */}
//                 <Text style={styles.goalMonthlyValue}>₹{goal.customAllocation || 0 }</Text>
//               </View>
//             </View>

//             <Text style={styles.goalProgress}>Achievement Progress</Text>
//             <View style={styles.goalProgressBar}>
//               <View style={[styles.goalProgressFill, { width: '0%' }]} />
//             </View>
//             <Text style={styles.goalProgressText}>0%</Text>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>🎯</Text>
//                 <Text style={styles.goalStatLabel}>Target Amount</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>⏰</Text>
//                 <Text style={styles.goalStatLabel}>Time Left</Text>
//                 <Text style={styles.goalStatValue}>{goal.timePeriod} years left</Text>
//               </View>
//             </View>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>₹</Text>
//                 <Text style={styles.goalStatLabel}>Current</Text>
//                 <Text style={styles.goalStatValue}>₹0</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>📈</Text>
//                 <Text style={styles.goalStatLabel}>Remaining</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//             </View>

//             <View style={styles.buttonColumn}>
//               <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//                 <Text style={styles.buttonText}>Link Investments</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//                 <Text style={styles.buttonText}>Discover Funds</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         ))}
//       </ScrollView>

//       <View style={styles.dotsContainer}>
//         {goals.map((_, idx) => (
//           <View key={idx} style={[styles.dot, idx === currentIndex && styles.dotActive]} />
//         ))}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//     paddingHorizontal: 16,
//   },
//   header: {
//     marginTop: 24,
//     marginBottom: 20,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   headerName: {
//     color: '#fff',
//   },
//   headerBrand: {
//     color: '#f97316',
//   },
//   card: {
//     backgroundColor: 'rgba(31, 41, 55, 0.6)',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 16,
//     marginBottom: 16,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   iconBox: {
//     width: 48,
//     height: 48,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   iconText: {
//     fontSize: 24,
//     color: '#10b981',
//     fontWeight: '700',
//   },
//   iconEmoji: {
//     fontSize: 24,
//   },
//   cardTitleContainer: {
//     flex: 1,
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   cardSubtitle: {
//     fontSize: 11,
//     color: '#9ca3af',
//   },
//   editIcon: {
//     padding: 4,
//   },
//   editIconText: {
//     fontSize: 16,
//     color: '#9ca3af',
//   },
//   badge: {
//     marginTop: 4,
//   },
//   badgeText: {
//     fontSize: 10,
//     color: '#a855f7',
//     fontWeight: '600',
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   statBox: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statLabel: {
//     fontSize: 11,
//     color: '#9ca3af',
//     marginBottom: 4,
//   },
//   statValue: {
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   riskContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   riskCircleOuter: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     borderWidth: 4,
//     borderColor: '#374151',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskCircleInner: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskPercentage: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '700',
//   },
//   riskCategory: {
//     fontSize: 15,
//     fontWeight: '700',
//     marginBottom: 4,
//   },
//   riskKeywords: {
//     fontSize: 11,
//     color: '#9ca3af',
//   },
//   amountRight: {
//     alignItems: 'flex-end',
//   },
//   amountLarge: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   amountSubtext: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginTop: 2,
//     textAlign: 'right',
//   },
//   expandButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   expandText: {
//     color: '#d1d5db',
//     fontSize: 13,
//     fontWeight: '500',
//   },
//   breakdownSection: {
//     marginBottom: 16,
//   },
//   breakdownTitle: {
//     fontSize: 12,
//     color: '#9ca3af',
//     fontWeight: '600',
//     marginBottom: 12,
//   },
//   breakdownItem: {
//     marginBottom: 14,
//   },
//   breakdownRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 6,
//   },
//   breakdownLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   breakdownIcon: {
//     fontSize: 14,
//   },
//   breakdownLabel: {
//     fontSize: 13,
//     color: '#d1d5db',
//     fontWeight: '500',
//   },
//   breakdownRight: {
//     alignItems: 'flex-end',
//   },
//   breakdownValue: {
//     fontSize: 13,
//     color: '#fff',
//     fontWeight: '700',
//   },
//   breakdownPercent: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginTop: 2,
//   },
//   progressBar: {
//     height: 6,
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 3,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     borderRadius: 3,
//   },
//   buttonColumn: {
//     gap: 10,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderRadius: 12,
//     gap: 6,
//   },
//   primaryButton: {
//     backgroundColor: '#a855f7',
//   },
//   secondaryButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   orangeButton: {
//     backgroundColor: '#f97316',
//   },
//   buttonIcon: {
//     fontSize: 14,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '600',
//   },
//   insuranceCenter: {
//     alignItems: 'center',
//     marginVertical: 16,
//   },
//   circularProgress: {
//     width: 180,
//     height: 180,
//     borderRadius: 90,
//     borderWidth: 10,
//     borderColor: '#374151',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 12,
//   },
//   circularInner: {
//     alignItems: 'center',
//   },
//   circularAmount: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   circularLabel: {
//     fontSize: 10,
//     color: '#9ca3af',
//     textAlign: 'center',
//   },
//   percentageBox: {
//     alignItems: 'center',
//   },
//   percentageText: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   percentageLabel: {
//     fontSize: 10,
//     color: '#6b7280',
//   },
//   // ✅ SIDE BY SIDE STATS - Like Web
//   insuranceStatsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 16,
//   },
//   insuranceStat: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
//   },
//   insuranceStatAlert: {
//     backgroundColor: 'rgba(239, 68, 68, 0.1)',
//     borderColor: 'rgba(239, 68, 68, 0.3)',
//   },
//   insuranceStatLabel: {
//     fontSize: 11,
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   insuranceStatValue: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   alertText: {
//     fontSize: 10,
//     color: '#ef4444',
//     fontWeight: '600',
//     marginTop: 4,
//   },
//   lifeCenter: {
//     alignItems: 'center',
//     marginVertical: 16,
//   },
//   lifeAmount: {
//     fontSize: 36,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 6,
//   },
//   lifeLabel: {
//     fontSize: 12,
//     color: '#9ca3af',
//   },
//   goalsContainer: {
//     marginBottom: 16,
//   },
//   goalCard: {
//     backgroundColor: 'rgba(31, 41, 55, 0.6)',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 16,
//     marginRight: 0,
//   },
//   goalHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   goalIconBox: {
//     width: 48,
//     height: 48,
//     borderRadius: 12,
//     backgroundColor: '#f9731620',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   goalIcon: {
//     fontSize: 24,
//   },
//   goalTitleContainer: {
//     flex: 1,
//   },
//   goalName: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 6,
//   },
//   goalBadge: {
//     alignSelf: 'flex-start',
//   },
//   goalBadgeText: {
//     fontSize: 10,
//     color: '#f97316',
//     fontWeight: '600',
//   },
//   goalMonthly: {
//     alignItems: 'flex-end',
//   },
//   goalMonthlyLabel: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginBottom: 2,
//   },
//   goalMonthlyValue: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   goalProgress: {
//     fontSize: 12,
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   goalProgressBar: {
//     height: 10,
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 5,
//     overflow: 'hidden',
//     marginBottom: 6,
//   },
//   goalProgressFill: {
//     height: '100%',
//     backgroundColor: '#a855f7',
//     borderRadius: 5,
//   },
//   goalProgressText: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 12,
//   },
//   // ✅ SIDE BY SIDE GOAL STATS - Like Web
//   goalStatsRow: {
//     flexDirection: 'row',
//     gap: 10,
//     marginBottom: 12,
//   },
//   goalStat: {
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 10,
//   },
//   goalStatIcon: {
//     fontSize: 14,
//     marginBottom: 4,
//   },
//   goalStatLabel: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   goalStatValue: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   dotsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 6,
//     marginTop: 12,
//   },
//   dot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: '#374151',
//   },
//   dotActive: {
//     width: 24,
//     backgroundColor: '#a855f7',
//   },
//   loadingModal: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.95)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   loadingContent: {
//     backgroundColor: 'rgba(31, 41, 55, 0.9)',
//     borderRadius: 20,
//     padding: 32,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '700',
//     marginTop: 16,
//     textAlign: 'center',
//   },
//   loadingSubtext: {
//     color: '#9ca3af',
//     fontSize: 13,
//     marginTop: 8,
//     textAlign: 'center',
//   },
// });

// export default DashboardHome;
// import { useEffect, useMemo, useState } from 'react';

// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { doc, getDoc } from 'firebase/firestore';
// import {
//   ActivityIndicator,
//   Dimensions,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { db } from '../../../src/config/firebase';


// const { width: screenWidth } = Dimensions.get('window');

// const DashboardHome = () => {
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
//   const [expandedCards, setExpandedCards] = useState({});

// useEffect(() => {
//   const fetchUserData = async () => {
//     try {
//       setLoading(true);
//       const phoneNumber = await AsyncStorage.getItem('user_phone');

//       if (!phoneNumber) {
//         console.log('❌ No phone number found');
//         setLoading(false);
//         return;
//       }

//       console.log('📥 Fetching dashboard data for:', phoneNumber);
//       console.log('📍 Collection: questionnaire_submissions');
      
//       const userDoc = await getDoc(doc(db, 'questionnaire_submissions', phoneNumber));

//       console.log('📄 Document exists:', userDoc.exists());
      
//       if (userDoc.exists()) {
//         const data = userDoc.data();
//         console.log('📦 Raw data keys:', Object.keys(data));
//         console.log('📦 Has raw_answers:', !!data.raw_answers);
        
//         if (!data.raw_answers) {
//           console.log('❌ No raw_answers found in document');
//           console.log('📦 Available data:', JSON.stringify(data, null, 2));
//           setLoading(false);
//           return;
//         }
        
//         const convertedData = convertKToRupees(data.raw_answers);
//         setUserData(convertedData);
//         console.log('✅ Dashboard data loaded and converted');
//       } else {
//         console.log('❌ Document does not exist at questionnaire_submissions/' + phoneNumber);
//       }
//     } catch (error) {
//       console.error('❌ Firebase fetch error:', error);
//       console.error('❌ Error code:', error.code);
//       console.error('❌ Error message:', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchUserData();
// }, []);
//   const totalIncome = useMemo(() => {
//     if (!userData?.income_data) return 0;
//     const income = userData.income_data;
//     let total = 0;
//     if (income.salary_business?.has) total += parseFloat(income.salary_business.amount || 0);
//     if (income.rental?.has) total += parseFloat(income.rental.amount || 0);
//     if (income.other?.has) total += parseFloat(income.other.amount || 0);
//     if (income.spouse?.has) total += parseFloat(income.spouse.amount || 0);
//     return total * 1000;
//   }, [userData]);

//   const totalExpenses = useMemo(() => {
//     if (!userData) return 0;
//     const house = userData.house_expenses || {};
//     const loans = userData.loan_data || {};
//     const dependent = userData.dependent_expenses || {};
//     let total = 0;
//     total += parseFloat(house.rent_maintenance || 0);
//     total += parseFloat(house.groceries || 0);
//     total += parseFloat(house.help_salaries || 0);
//     total += parseFloat(house.shopping_dining_entertainment || 0);
//     total += parseFloat(userData.child_monthly_expense || 0);
//     total += parseFloat(dependent.spouse || 0);
//     total += parseFloat(dependent.parent || 0);
//     total += parseFloat(dependent.pet || 0);
//     if (loans.home?.has) total += parseFloat(loans.home.emi || 0);
//     if (loans.commercial?.has) total += parseFloat(loans.commercial.emi || 0);
//     if (loans.car?.has) total += parseFloat(loans.car.emi || 0);
//     if (loans.education?.has) total += parseFloat(loans.education.emi || 0);
//     if (loans.personal?.has) total += parseFloat(loans.personal.emi || 0);
//     return total * 1000;
//   }, [userData]);

//   const savings = totalIncome - totalExpenses;

//   const formatAmount = (amount) => {
//     if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
//     if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
//     return `₹${amount.toFixed(0)}`;
//   };

//   const getUserName = () => {
//     const fullName = userData?.user_data?.fullName || userData?.fullName || 'User';
//     const firstName = fullName.split(' ')[0] || 'User';
//     return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
//   };

//   const riskCapacity = userData?.risk_assessment?.riskCapacity || 0;
//   const riskCategory = userData?.risk_assessment?.riskCategory || 'Not Assessed';
//   const keywords = userData?.risk_assessment?.keywords || 'Complete assessment';

//   const getRiskColor = (score) => {
//     if (score <= 30) return '#ef4444';
//     if (score <= 45) return '#f59e0b';
//     if (score <= 60) return '#eab308';
//     return '#10b981';
//   };
//   const riskColor = getRiskColor(riskCapacity);

//   const efData = userData?.emergency_funds;
//   const selectedLayer = efData?.approach || 'foundation';
//   const layerData = efData?.[`${selectedLayer}_layer`] || efData?.foundation_layer;
//   const totalEmergencyFund = layerData?.amount || 0;

//   const healthInsurance = userData?.insurance_data?.health;
//   const healthCoverage = healthInsurance?.has ? (parseFloat(healthInsurance.sum_insured || 0) * 1000) : 0;
  
//   const lifeInsurance = userData?.insurance_data?.life;
//   const lifeCoverage = lifeInsurance?.has ? (parseFloat(lifeInsurance.sum_insured || 0) * 1000) : 0;

// const healthTargetCoverage = userData?.insurance_data?.health?.targetCoverage || (familySize * 500000);
// const lifeTargetCoverage = userData?.insurance_data?.life?.targetCoverage || (totalIncome * 10);

// const familySize = useMemo(() => {
//   if (!userData?.dependents) return 1;
//   const dependents = userData.dependents;
//   return 1 + (dependents.spouse || 0) + (dependents.child || 0) + (dependents.parent || 0);
// }, [userData]);
//   const goals = Array.isArray(userData?.goal_allocations) 
//   ? userData.goal_allocations 
//   : (userData?.goal_allocations?.goals || []);

//   const toggleExpand = (cardId) => {
//     setExpandedCards(prev => ({
//       ...prev,
//       [cardId]: !prev[cardId]
//     }));
//   };

//   if (loading) {
//     return (
//       <Modal transparent visible={loading} animationType="fade">
//         <View style={styles.loadingModal}>
//           <View style={styles.loadingContent}>
//             <ActivityIndicator size="large" color="#a855f7" />
//             <Text style={styles.loadingText}>Loading Dashboard</Text>
//             <Text style={styles.loadingSubtext}>Fetching your financial data...</Text>
//           </View>
//         </View>
//       </Modal>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>
//           <Text style={styles.headerName}>{getUserName()}'s </Text>
//           <Text style={styles.headerBrand}>GoWealthy </Text>
//           <Text style={styles.headerName}>Journey</Text>
//         </Text>
//       </View>

//       <CashFlowCard totalIncome={totalIncome} totalExpenses={totalExpenses} savings={savings} formatAmount={formatAmount} />
//       <RiskProfileCard riskCapacity={riskCapacity} riskCategory={riskCategory} keywords={keywords} riskColor={riskColor} />
      
//       {efData && (
//         <EmergencyFundCard
//           layerName={selectedLayer.charAt(0).toUpperCase() + selectedLayer.slice(1)}
//           totalAmount={totalEmergencyFund}
//           layerData={layerData}
//           formatAmount={formatAmount}
//           expanded={expandedCards['emergency']}
//           onToggle={() => toggleExpand('emergency')}
//         />
//       )}

//       <HealthInsuranceCard coverage={healthCoverage} formatAmount={formatAmount} isActive={healthInsurance?.has} familySize={familySize} targetCoverage={healthTargetCoverage} />
//       <LifeInsuranceCard coverage={lifeCoverage} formatAmount={formatAmount} isActive={lifeInsurance?.has} familySize={familySize} targetCoverage={lifeTargetCoverage} />

//       {goals.length > 0 && (
//         <GoalsCard goals={goals} currentIndex={currentGoalIndex} onIndexChange={setCurrentGoalIndex} formatAmount={formatAmount} />
//       )}

//       <View style={{ height: 100 }} />
//     </ScrollView>
//   );
// };

// const CashFlowCard = ({ totalIncome, totalExpenses, savings, formatAmount }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
//         <Text style={styles.iconText}>₹</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your CashFlow</Text>
//         <Text style={styles.cardSubtitle}>Income, Expenses & Savings</Text>
//       </View>
//     </View>
//     <View style={styles.statsGrid}>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Income</Text>
//         <Text style={[styles.statValue, { color: '#10b981' }]}>{formatAmount(totalIncome)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Expenses</Text>
//         <Text style={[styles.statValue, { color: '#ef4444' }]}>{formatAmount(totalExpenses)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Savings</Text>
//         <Text style={[styles.statValue, { color: '#3b82f6' }]}>{formatAmount(savings)}</Text>
//       </View>
//     </View>
//   </View>
// );

// const RiskProfileCard = ({ riskCapacity, riskCategory, keywords, riskColor }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: `${riskColor}20` }]}>
//         <Text style={styles.iconEmoji}>🎯</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your Risk Profile</Text>
//         <Text style={styles.cardSubtitle}>Psychology-based assessment</Text>
//       </View>
//     </View>
//     <View style={styles.riskContent}>
//       <View style={styles.riskCircleOuter}>
//         <View style={[styles.riskCircleInner, { backgroundColor: riskColor }]}>
//           <Text style={styles.riskPercentage}>{Math.round(riskCapacity)}%</Text>
//         </View>
//       </View>
//       <View style={{ flex: 1, marginLeft: 16 }}>
//         <Text style={[styles.riskCategory, { color: riskColor }]}>
//           {riskCategory === 'Not Assessed' ? riskCategory : `${riskCategory} Risk`}
//         </Text>
//         <Text style={styles.riskKeywords}>Risk Tolerance: {Math.round(riskCapacity)}%</Text>
//       </View>
//     </View>
//   </View>
// );

// const EmergencyFundCard = ({ layerName, totalAmount, layerData, formatAmount, expanded, onToggle }) => {
//   const getLayerColor = (name) => {
//     const colors = { Foundation: '#a855f7', Intermediate: '#f97316', Fortress: '#a855f7' };
//     return colors[name] || '#a855f7';
//   };
//   const color = getLayerColor(layerName);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: `${color}30` }]}>
//           <Text style={[styles.iconEmoji, { fontSize: 28 }]}>⚡</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Emergency Fund</Text>
//           <Text style={styles.cardSubtitle}>Extended family & vehicle coverage</Text>
//         </View>
//         <View style={styles.amountRight}>
//           <Text style={styles.amountLarge}>{formatAmount(totalAmount)}</Text>
//           <Text style={styles.amountSubtext}>{layerName} Layer</Text>
//         </View>
//       </View>

//       {!expanded && (
//         <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
//           <Text style={styles.expandText}>View Breakdown</Text>
//           <Text style={styles.chevron}>∨</Text>
//         </TouchableOpacity>
//       )}

//       {expanded && layerData && (
//         <View style={styles.breakdownSection}>
//           <Text style={styles.breakdownTitle}>Coverage Breakdown</Text>
//           {[
//             { label: 'Medical', value: layerData.medical, icon: '❤️', color: '#a855f7' },
//             { label: 'EMI', value: layerData.emi, icon: '💳', color: '#f97316' },
//             { label: 'Work Security', value: layerData.work_security, icon: '💼', color: '#a855f7' },
//             { label: 'House', value: layerData.house, icon: '🏠', color: '#f97316' },
//             { label: 'Vehicle', value: layerData.vehicle, icon: '🚗', color: '#a855f7' }
//           ].map((item, idx) => {
//             const percentage = totalAmount > 0 ? ((item.value || 0) / totalAmount) * 100 : 0;
//             return (
//               <View key={idx} style={styles.breakdownItem}>
//                 <View style={styles.breakdownRow}>
//                   <View style={styles.breakdownLeft}>
//                     <View style={[styles.breakdownIconBox, { backgroundColor: `${item.color}30` }]}>
//                       <Text style={styles.breakdownIcon}>{item.icon}</Text>
//                     </View>
//                     <Text style={styles.breakdownLabel}>{item.label}</Text>
//                   </View>
//                   <View style={styles.breakdownRight}>
//                     <Text style={styles.breakdownValue}>{formatAmount(item.value || 0)}</Text>
//                     <Text style={styles.breakdownPercent}>{percentage.toFixed(1)}%</Text>
//                   </View>
//                 </View>
//                 <View style={styles.progressBar}>
//                   <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: item.color, opacity: 0.9 }]} />
//                 </View>
//               </View>
//             );
//           })}
          
//           <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
//             <Text style={styles.expandText}>Hide Details</Text>
//             <Text style={[styles.chevron, { transform: [{ rotate: '180deg' }] }]}>∨</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>🔗 Link Investments</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
//           <Text style={styles.buttonText}>✓ Mark as Done</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const HealthInsuranceCard = ({ coverage, formatAmount, isActive, familySize, targetCoverage }) => {
//  const currentPercentage = targetCoverage > 0 ? Math.round((coverage / (targetCoverage*100000)) * 100) : 0;
//   const gap = Math.max(0, (targetCoverage*100000) - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
//           <Text style={styles.iconEmoji}>❤️</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Health Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Protection'}</Text>
//           </View>
//         </View>
//          <View style={styles.familyInfo}>
//           <Text style={styles.familyIcon}>👥</Text>
//           <Text style={styles.familyText}>{familySize} {familySize === 1 ? 'Member' : 'Members'}</Text>
//         </View>
//       </View>

//       <View style={styles.insuranceCenter}>
//         <View style={styles.circularProgress}>
//           <View style={styles.circularInner}>
//             <Text style={styles.circularAmount}>{formatAmount(targetCoverage)}Lacs</Text>
//             <Text style={styles.circularLabel}>Recommended Coverage</Text>
//                   <Text style={styles.percentageText}>{currentPercentage}%</Text>
//           <Text style={styles.percentageLabel}>Current Coverage</Text>
//           </View>
//         </View>
//         {/* <View style={styles.percentageBox}>
    
//         </View> */}
//       </View>

//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>⚠️ Coverage Gap</Text>
//          <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>🔗Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const LifeInsuranceCard = ({ coverage, formatAmount, isActive, familySize, targetCoverage }) => {
//   const gap = Math.max(0, (targetCoverage*100000) - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: 'rgba(249, 115, 22, 0.2)' }]}>
//           <Text style={styles.iconEmoji}>🔺</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Life Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Security'}</Text>
//           </View>
//         </View>
//          <View style={styles.familyInfo}>
//           <Text style={styles.familyIcon}>👥</Text>
//           <Text style={styles.familyText}>{familySize} Protected</Text>
//         </View>
//       </View>

//       <View style={styles.lifeCenter}>
//         <Text style={styles.lifeAmount}>{formatAmount(coverage)}</Text>
//         <Text style={styles.lifeLabel}>Coverage Amount</Text>
//       </View>

//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>📈 Coverage Gap</Text>
//         <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>🔗Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const GoalsCard = ({ goals, currentIndex, onIndexChange, formatAmount }) => {
//     const getGoalIcon = (goalName) => {
//   const name = goalName?.toLowerCase() || '';
//   if (name.includes('home') || name.includes('house')) return '🏠';
//   if (name.includes('car') || name.includes('vehicle')) return '🚗';
//   if (name.includes('travel') || name.includes('trip') || name.includes('vacation')) return '✈️';
//   if (name.includes('education') || name.includes('study')) return '🎓';
//   if (name.includes('marriage') || name.includes('wedding')) return '💍';
//   if (name.includes('child') || name.includes('baby')) return '👶';
//   if (name.includes('business') || name.includes('startup')) return '💼';
//   if (name.includes('gadget') || name.includes('laptop') || name.includes('phone')) return '📱';
//   if (name.includes('retirement')) return '🏖️';
//   return '🎯'; // default
// };
//   return (
//     <View style={styles.goalsContainer}>
//       <ScrollView
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         snapToInterval={screenWidth - 32}
//         decelerationRate="fast"
//         onMomentumScrollEnd={(e) => {
//           const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 32));
//           onIndexChange(index);
//         }}
//       >
//         {goals.map((goal, index) => (
//           <View key={index} style={[styles.goalCard, { width: screenWidth - 32 }]}>
//             <View style={styles.goalHeader}>
//               <View style={styles.goalIconBox}>
//                 <Text style={styles.goalIcon}>{getGoalIcon(goal.name)}</Text>
//               </View>
//               <View style={styles.goalTitleContainer}>
//                 <Text style={styles.goalName}>{goal.name}</Text>
//                 <View style={styles.goalBadge}>
//                   <Text style={styles.goalBadgeText}>⚠️ Needs Attention</Text>
//                 </View>
//               </View>
//               <View style={styles.goalMonthly}>
//                 <Text style={styles.goalMonthlyLabel}>Monthly SIP</Text>
//                <Text style={styles.goalMonthlyValue}>{formatAmount(goal.customAllocation || 0)}</Text>
//               </View>
//             </View>

//             <Text style={styles.goalProgress}>Achievement Progress</Text>
//             <View style={styles.goalProgressBar}>
//               <View style={[styles.goalProgressFill, { width: '0%' }]} />
//             </View>
//             <Text style={styles.goalProgressText}>0%</Text>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>🎯</Text>
//                 <Text style={styles.goalStatLabel}>Target Amount</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>⏰</Text>
//                 <Text style={styles.goalStatLabel}>Time Left</Text>
//                 <Text style={styles.goalStatValue}>{goal.timePeriod} years left</Text>
//               </View>
//             </View>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>₹</Text>
//                 <Text style={styles.goalStatLabel}>Current</Text>
//                 <Text style={styles.goalStatValue}>₹0</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>📈</Text>
//                 <Text style={styles.goalStatLabel}>Remaining</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//             </View>

//             <View style={styles.buttonColumn}>
//               <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//                 <Text style={styles.buttonText}>🔗Link Investments</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//                 <Text style={styles.buttonText}>Discover Funds</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         ))}
//       </ScrollView>

//       <View style={styles.dotsContainer}>
//         {goals.map((_, idx) => (
//           <View key={idx} style={[styles.dot, idx === currentIndex && styles.dotActive]} />
//         ))}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//     paddingHorizontal: 16,
//     paddingTop: 25,
//   },
//   header: {
//     marginTop: 24,
//     marginBottom: 16,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 26,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   headerName: {
//     color: '#fff',
//   },
//   headerBrand: {
//     color: '#fb923c', // orange-400
//   },
//   // 🎨 UPDATED: Card styling to match web
//   card: {
//     backgroundColor: 'rgba(17, 24, 39, 0.6)', // gray-900/60 - darker
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 24, // p-6
//     marginBottom: 16,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 24, // mb-6
//   },
//   // 🎨 UPDATED: Icon box styling
//   iconBox: {
//     width: 56, // w-14
//     height: 56, // h-14
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   iconText: {
//     fontSize: 28,
//     color: '#10b981',
//     fontWeight: '700',
//   },
//   iconEmoji: {
//     fontSize: 28,
//   },
//   cardTitleContainer: {
//     flex: 1,
//   },
//   // 🎨 UPDATED: Text sizing
//   cardTitle: {
//     fontSize: 20, // text-xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   cardSubtitle: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af', // gray-400
//   },
//   editIcon: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//   },
//   editIconText: {
//     fontSize: 16,
//     color: '#9ca3af',
//   },
//   // 🎨 UPDATED: Badge styling
//   badge: {
//     marginTop: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(168, 85, 247, 0.15)', // purple-500/15
//     borderWidth: 1,
//     borderColor: 'rgba(168, 85, 247, 0.3)', // purple-500/30
//     borderRadius: 999,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     alignSelf: 'flex-start',
//   },
//   badgeText: {
//     fontSize: 12, // text-xs
//     color: '#d8b4fe', // purple-300
//     fontWeight: '600',
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 16,
//   },
//   statBox: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statLabel: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     marginBottom: 4,
//   },
//   statValue: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//   },
//   riskContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   riskCircleOuter: {
//     width: 64, // w-16
//     height: 64, // h-16
//     borderRadius: 32,
//     borderWidth: 4,
//     borderColor: '#374151', // gray-700
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskCircleInner: {
//     width: 48, // w-12
//     height: 48, // h-12
//     borderRadius: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskPercentage: {
//     color: '#fff',
//     fontSize: 14, // text-sm
//     fontWeight: '700',
//   },
//   riskCategory: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     marginBottom: 4,
//   },
//   riskKeywords: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//   },
//   amountRight: {
//     alignItems: 'flex-end',
//   },
//   amountLarge: {
//     fontSize: 24, // text-2xl
//     fontWeight: '700',
//     color: '#fff',
//   },
//   amountSubtext: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginTop: 4,
//     textAlign: 'right',
//   },
//   // 🎨 UPDATED: Expand button
//   expandButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 14, // p-3.5
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//     flexDirection: 'row',
//     gap: 8,
//   },
//   expandText: {
//     color: '#d1d5db', // gray-300
//     fontSize: 14, // text-sm
//     fontWeight: '500',
//   },
//   chevron: {
//     color: '#9ca3af',
//     fontSize: 14,
//   },
//   // 🎨 UPDATED: Breakdown section
//   breakdownSection: {
//     marginBottom: 16,
//     paddingTop: 24,
//     borderTopWidth: 1,
//     borderTopColor: 'rgba(255, 255, 255, 0.1)',
//     marginHorizontal: -24,
//     paddingHorizontal: 24,
//     paddingBottom: 24,
//   },
//   breakdownTitle: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     fontWeight: '600',
//     marginBottom: 20,
//   },
//   breakdownItem: {
//     marginBottom: 16,
//   },
//   breakdownRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   breakdownLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   // 🎨 NEW: Icon box for breakdown items
//   breakdownIconBox: {
//     width: 32,
//     height: 32,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   breakdownIcon: {
//     fontSize: 16,
//   },
//   breakdownLabel: {
//     fontSize: 14, // text-sm
//     color: '#d1d5db', // gray-200
//     fontWeight: '500',
//   },
//   breakdownRight: {
//     alignItems: 'flex-end',
//   },
//   breakdownValue: {
//     fontSize: 14, // text-sm
//     color: '#fff',
//     fontWeight: '700',
//   },
//   breakdownPercent: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginTop: 2,
//   },
//   // 🎨 UPDATED: Progress bar
//   progressBar: {
//     height: 8,
//     backgroundColor: 'rgba(17, 24, 39, 0.8)', // darker
//     borderRadius: 4,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     borderRadius: 4,
//   },
//   buttonColumn: {
//     gap: 12,
//   },
//   // 🎨 UPDATED: Button styling with shadows
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 14, // py-3.5
//     paddingHorizontal: 16,
//     borderRadius: 12,
//     gap: 8,
//   },
//   primaryButton: {
//     backgroundColor: 'rgba(168, 85, 247, 0.3)',
//     borderWidth: 1,
//     borderColor: '#a44df6',
//   },
//   secondaryButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   orangeButton: {
//     backgroundColor: 'rgba(255, 106, 0, 0.3)',
//     borderWidth: 1,
//     borderColor: 'rgba(249, 115, 22, 0.6)',
//   },
//   buttonIcon: {
//     fontSize: 16,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 14, // text-sm
//     fontWeight: '600',
    
//   },
//   insuranceCenter: {
//     alignItems: 'center',
//     marginVertical: 24,
//   },
//   // 🎨 UPDATED: Circular progress
//   circularProgress: {
//     width: 180,
//     height: 180,
//     borderRadius: 90,
//     borderWidth: 10,
//     borderColor: 'rgba(31, 41, 55, 0.8)', // darker
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//   },
//   circularInner: {
//     alignItems: 'center',
//   },
//   circularAmount: {
//     fontSize: 24, // text-2xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   circularLabel: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     textAlign: 'center',
//   },
//   percentageBox: {
//     alignItems: 'center',
//   },
//   percentageText: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     color: '#fff',
//   },
//   percentageLabel: {
//     fontSize: 12, // text-xs
//     color: '#6b7280',
//   },
//   insuranceStatsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 24,
//   },
//   insuranceStat: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
    
//   },
//  insuranceStatAlert: {
//   backgroundColor: 'rgba(239, 68, 68, 0.1)',
//   borderColor: '#ef4444',
//   borderWidth: 1.5,
//   shadowColor: '#ef4444',

// },
//   insuranceStatLabel: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginBottom: 8,
//   },
//   insuranceStatValue: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     color: '#fff',
//   },
//   alertText: {
//     fontSize: 10,
//     color: '#ef4444',
//     fontWeight: '600',
//     marginTop: 4,
//   },
//   lifeCenter: {
//     alignItems: 'center',
//     marginVertical: 24,
//   },
//   lifeAmount: {
//     fontSize: 36, // text-3xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   lifeLabel: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//   },
//   goalsContainer: {
//     marginBottom: 16,
//   },
//   goalCard: {
//     backgroundColor: 'rgba(17, 24, 39, 0.6)',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 24,
//     marginRight: 0,
//   },
//   goalHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   goalIconBox: {
//     width: 56,
//     height: 56,
//     borderRadius: 12,
//     backgroundColor: 'rgba(249, 115, 22, 0.3)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   goalIcon: {
//     fontSize: 28,
//   },
//   goalTitleContainer: {
//     flex: 1,
//   },
//   goalName: {
//     fontSize: 20, // text-xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   goalBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(249, 115, 22, 0.15)',
//     borderWidth: 1,
//     borderColor: 'rgba(249, 115, 22, 0.3)',
//     borderRadius: 999,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     alignSelf: 'flex-start',
//   },
//   goalBadgeText: {
//     fontSize: 12,
//     color: '#fb923c', // orange-400
//     fontWeight: '600',
//   },
//   goalMonthly: {
//     alignItems: 'flex-end',
//   },
//   goalMonthlyLabel: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     marginBottom: 4,
//   },
//   goalMonthlyValue: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     color: '#fff',
//   },
//   goalProgress: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     marginBottom: 8,
//   },
//   goalProgressBar: {
//     height: 12, // h-3
//     backgroundColor: 'rgba(17, 24, 39, 0.8)',
//     borderRadius: 6,
//     overflow: 'hidden',
//     marginBottom: 8,
//   },
//   goalProgressFill: {
//     height: '100%',
//     backgroundColor: '#a855f7',
//     borderRadius: 6,
//   },
//   goalProgressText: {
//     fontSize: 14, // text-sm
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 16,
//   },
//   goalStatsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 12,
//   },
//   goalStat: {
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
//   },
//   goalStatIcon: {
//     fontSize: 14,
//     marginBottom: 6,
//   },
//   goalStatLabel: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   goalStatValue: {
//     fontSize: 14, // text-sm
//     fontWeight: '700',
//     color: '#fff',
//   },
//   dotsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 8,
//     marginTop: 16,
//   },
//   dot: {
//     width: 8, // w-2
//     height: 8, // h-2
//     borderRadius: 4,
//     backgroundColor: '#4b5563', // gray-600
//   },
//   dotActive: {
//     width: 32, // w-8
//     backgroundColor: '#a855f7',
//   },
//   // 🎨 UPDATED: Loading modal
//   loadingModal: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   loadingContent: {
//     backgroundColor: 'rgba(17, 24, 39, 0.9)', // gray-900/90
//     borderRadius: 20,
//     padding: 24,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     minWidth: 200,
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     marginTop: 16,
//     textAlign: 'center',
//   },
//   loadingSubtext: {
//     color: '#9ca3af',
//     fontSize: 14, // text-sm
//     marginTop: 8,
//     textAlign: 'center',
//   },
//   familyInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   familyIcon: {
//     fontSize: 14,
//   },
//   familyText: {
//     fontSize: 14,
//     color: '#9ca3af',
//     fontWeight: '500',
//   },
// });

// export default DashboardHome;
// import React, { useState, useEffect, useMemo } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   StyleSheet,
//   Modal,
//   ActivityIndicator,
//   Dimensions,
//   TouchableOpacity,
// } from 'react-native';
// import { db } from '../../../src/config/firebase';
// import { doc, getDoc } from 'firebase/firestore';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width: screenWidth } = Dimensions.get('window');

// const DashboardHome = () => {
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
//   const [expandedCards, setExpandedCards] = useState({});

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         setLoading(true);
//         const phoneNumber = await AsyncStorage.getItem('user_phone');

//         if (!phoneNumber) {
//           console.log('❌ No phone number found');
//           setLoading(false);
//           return;
//         }

//         console.log('📥 Fetching dashboard data for:', phoneNumber);
//         const userDoc = await getDoc(doc(db, 'users', phoneNumber));

//         if (userDoc.exists()) {
//           const data = userDoc.data();
//           setUserData(data);
//           console.log('✅ Dashboard data loaded');
//         } else {
//           console.log('❌ No data found');
//         }
//       } catch (error) {
//         console.error('❌ Firebase fetch error:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUserData();
//   }, []);

//   const totalIncome = useMemo(() => {
//     if (!userData?.income_data) return 0;
//     const income = userData.income_data;
//     let total = 0;
//     if (income.salary_business?.has) total += parseFloat(income.salary_business.amount || 0);
//     if (income.rental?.has) total += parseFloat(income.rental.amount || 0);
//     if (income.other?.has) total += parseFloat(income.other.amount || 0);
//     if (income.spouse?.has) total += parseFloat(income.spouse.amount || 0);
//     return total * 1000;
//   }, [userData]);

//   const totalExpenses = useMemo(() => {
//     if (!userData) return 0;
//     const house = userData.house_expenses || {};
//     const loans = userData.loan_data || {};
//     const dependent = userData.dependent_expenses || {};
//     let total = 0;
//     total += parseFloat(house.rent_maintenance || 0);
//     total += parseFloat(house.groceries || 0);
//     total += parseFloat(house.help_salaries || 0);
//     total += parseFloat(house.shopping_dining_entertainment || 0);
//     total += parseFloat(userData.child_monthly_expense || 0);
//     total += parseFloat(dependent.spouse || 0);
//     total += parseFloat(dependent.parent || 0);
//     total += parseFloat(dependent.pet || 0);
//     if (loans.home?.has) total += parseFloat(loans.home.emi || 0);
//     if (loans.commercial?.has) total += parseFloat(loans.commercial.emi || 0);
//     if (loans.car?.has) total += parseFloat(loans.car.emi || 0);
//     if (loans.education?.has) total += parseFloat(loans.education.emi || 0);
//     if (loans.personal?.has) total += parseFloat(loans.personal.emi || 0);
//     return total * 1000;
//   }, [userData]);

//   const savings = totalIncome - totalExpenses;

//   const formatAmount = (amount) => {
//     if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
//     if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
//     return `₹${amount.toFixed(0)}`;
//   };

//   const getUserName = () => {
//     const fullName = userData?.user_data?.fullName || userData?.fullName || 'User';
//     const firstName = fullName.split(' ')[0] || 'User';
//     return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
//   };

//   const riskCapacity = userData?.risk_assessment?.riskCapacity || 0;
//   const riskCategory = userData?.risk_assessment?.riskCategory || 'Not Assessed';
//   const keywords = userData?.risk_assessment?.keywords || 'Complete assessment';

//   const getRiskColor = (score) => {
//     if (score <= 30) return '#ef4444';
//     if (score <= 45) return '#f59e0b';
//     if (score <= 60) return '#eab308';
//     return '#10b981';
//   };
//   const riskColor = getRiskColor(riskCapacity);

//   const efData = userData?.emergency_funds;
//   const selectedLayer = efData?.approach || 'foundation';
//   const layerData = efData?.[`${selectedLayer}_layer`] || efData?.foundation_layer;
//   const totalEmergencyFund = layerData?.amount || 0;

//   const healthInsurance = userData?.insurance_data?.health;
//   const healthCoverage = healthInsurance?.has ? (parseFloat(healthInsurance.sum_insured || 0) * 1000) : 0;
  
//   const lifeInsurance = userData?.insurance_data?.life;
//   const lifeCoverage = lifeInsurance?.has ? (parseFloat(lifeInsurance.sum_insured || 0) * 1000) : 0;

//   const goals = userData?.goal_allocations?.goals || [];

//   const toggleExpand = (cardId) => {
//     setExpandedCards(prev => ({
//       ...prev,
//       [cardId]: !prev[cardId]
//     }));
//   };

//   if (loading) {
//     return (
//       <Modal transparent visible={loading} animationType="fade">
//         <View style={styles.loadingModal}>
//           <View style={styles.loadingContent}>
//             <ActivityIndicator size="large" color="#a855f7" />
//             <Text style={styles.loadingText}>Updating Dashboard...</Text>
//             <Text style={styles.loadingSubtext}>Fetching your financial data</Text>
//           </View>
//         </View>
//       </Modal>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>
//           <Text style={styles.headerName}>{getUserName()}'s </Text>
//           <Text style={styles.headerBrand}>GoWealthy </Text>
//           <Text style={styles.headerName}>Journey</Text>
//         </Text>
//       </View>

//       <CashFlowCard totalIncome={totalIncome} totalExpenses={totalExpenses} savings={savings} formatAmount={formatAmount} />
//       <RiskProfileCard riskCapacity={riskCapacity} riskCategory={riskCategory} keywords={keywords} riskColor={riskColor} />
      
//       {efData && (
//         <EmergencyFundCard
//           layerName={selectedLayer.charAt(0).toUpperCase() + selectedLayer.slice(1)}
//           totalAmount={totalEmergencyFund}
//           layerData={layerData}
//           formatAmount={formatAmount}
//           expanded={expandedCards['emergency']}
//           onToggle={() => toggleExpand('emergency')}
//         />
//       )}

//       <HealthInsuranceCard coverage={healthCoverage} formatAmount={formatAmount} isActive={healthInsurance?.has} />
//       <LifeInsuranceCard coverage={lifeCoverage} formatAmount={formatAmount} isActive={lifeInsurance?.has} />

//       {goals.length > 0 && (
//         <GoalsCard goals={goals} currentIndex={currentGoalIndex} onIndexChange={setCurrentGoalIndex} formatAmount={formatAmount} />
//       )}

//       <View style={{ height: 100 }} />
//     </ScrollView>
//   );
// };

// const CashFlowCard = ({ totalIncome, totalExpenses, savings, formatAmount }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: '#10b98120' }]}>
//         <Text style={styles.iconText}>₹</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your CashFlow</Text>
//         <Text style={styles.cardSubtitle}>Income, Expenses & Savings</Text>
//       </View>
//       <TouchableOpacity style={styles.editIcon}>
//         <Text style={styles.editIconText}>✎</Text>
//       </TouchableOpacity>
//     </View>
//     <View style={styles.statsGrid}>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Income</Text>
//         <Text style={[styles.statValue, { color: '#10b981' }]}>{formatAmount(totalIncome)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Expenses</Text>
//         <Text style={[styles.statValue, { color: '#ef4444' }]}>{formatAmount(totalExpenses)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Savings</Text>
//         <Text style={[styles.statValue, { color: '#3b82f6' }]}>{formatAmount(savings)}</Text>
//       </View>
//     </View>
//   </View>
// );

// const RiskProfileCard = ({ riskCapacity, riskCategory, keywords, riskColor }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: `${riskColor}20` }]}>
//         <Text style={styles.iconEmoji}>🎯</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your Money Mindset</Text>
//         <Text style={styles.cardSubtitle}>Psychology-based assessment</Text>
//       </View>
//       <TouchableOpacity style={styles.editIcon}>
//         <Text style={styles.editIconText}>✎</Text>
//       </TouchableOpacity>
//     </View>
//     <View style={styles.riskContent}>
//       <View style={styles.riskCircleOuter}>
//         <View style={[styles.riskCircleInner, { backgroundColor: riskColor }]}>
//           <Text style={styles.riskPercentage}>{Math.round(riskCapacity)}%</Text>
//         </View>
//       </View>
//       <View style={{ flex: 1, marginLeft: 16 }}>
//         <Text style={[styles.riskCategory, { color: riskColor }]}>{riskCategory}</Text>
//         <Text style={styles.riskKeywords}>{keywords}</Text>
//       </View>
//     </View>
//   </View>
// );

// const EmergencyFundCard = ({ layerName, totalAmount, layerData, formatAmount, expanded, onToggle }) => {
//   const getLayerColor = (name) => {
//     const colors = { Foundation: '#a855f7', Intermediate: '#f97316', Fortress: '#a855f7' };
//     return colors[name] || '#a855f7';
//   };
//   const color = getLayerColor(layerName);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
//           <Text style={styles.iconEmoji}>⚡</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Emergency Fund</Text>
//           <Text style={styles.cardSubtitle}>Extended family & vehicle coverage</Text>
//         </View>
//         <View style={styles.amountRight}>
//           <Text style={styles.amountLarge}>{formatAmount(totalAmount)}</Text>
//           <Text style={styles.amountSubtext}>{layerName} layer</Text>
//         </View>
//       </View>

//       <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
//         <Text style={styles.expandText}>{expanded ? 'Hide Details ∧' : 'View Breakdown ∨'}</Text>
//       </TouchableOpacity>

//       {expanded && layerData && (
//         <View style={styles.breakdownSection}>
//           <Text style={styles.breakdownTitle}>Coverage Breakdown</Text>
//           {[
//             { label: 'Medical', value: layerData.medical, icon: '❤️', color: '#a855f7' },
//             { label: 'EMI', value: layerData.emi, icon: '💳', color: '#f97316' },
//             { label: 'Work Security', value: layerData.work_security, icon: '💼', color: '#a855f7' },
//             { label: 'House', value: layerData.house, icon: '🏠', color: '#f97316' },
//             { label: 'Vehicle', value: layerData.vehicle, icon: '🚗', color: '#a855f7' }
//           ].map((item, idx) => {
//             const percentage = totalAmount > 0 ? ((item.value || 0) / totalAmount) * 100 : 0;
//             return (
//               <View key={idx} style={styles.breakdownItem}>
//                 <View style={styles.breakdownRow}>
//                   <View style={styles.breakdownLeft}>
//                     <Text style={styles.breakdownIcon}>{item.icon}</Text>
//                     <Text style={styles.breakdownLabel}>{item.label}</Text>
//                   </View>
//                   <View style={styles.breakdownRight}>
//                     <Text style={styles.breakdownValue}>{formatAmount(item.value || 0)}</Text>
//                     <Text style={styles.breakdownPercent}>{percentage.toFixed(1)}%</Text>
//                   </View>
//                 </View>
//                 <View style={styles.progressBar}>
//                   <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: item.color }]} />
//                 </View>
//               </View>
//             );
//           })}
//         </View>
//       )}

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonIcon}>🔗</Text>
//           <Text style={styles.buttonText}>Link Investments</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
//           <Text style={styles.buttonIcon}>✓</Text>
//           <Text style={styles.buttonText}>Mark as Done</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// // ✅ FIXED: Side-by-side insurance stats like web
// const HealthInsuranceCard = ({ coverage, formatAmount, isActive }) => {
//   const recommendedCoverage = 1500000;
//   const currentPercentage = recommendedCoverage > 0 ? (coverage / recommendedCoverage) * 100 : 0;
//   const gap = Math.max(0, recommendedCoverage - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: '#a855f720' }]}>
//           <Text style={styles.iconEmoji}>❤️</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Health Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Protection'}</Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.editIcon}>
//           <Text style={styles.editIconText}>✎</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.insuranceCenter}>
//         <View style={styles.circularProgress}>
//           <View style={styles.circularInner}>
//             <Text style={styles.circularAmount}>{formatAmount(recommendedCoverage)}</Text>
//             <Text style={styles.circularLabel}>Recommended Coverage</Text>
//           </View>
//         </View>
//         <View style={styles.percentageBox}>
//           <Text style={styles.percentageText}>{currentPercentage.toFixed(0)}%</Text>
//           <Text style={styles.percentageLabel}>Current Coverage</Text>
//         </View>
//       </View>

//       {/* ✅ SIDE BY SIDE - Like Web */}
//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>⚠️ Coverage Gap</Text>
//           <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>

//           <Text style={styles.buttonText}>Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// // ✅ FIXED: Side-by-side insurance stats like web
// const LifeInsuranceCard = ({ coverage, formatAmount, isActive }) => {
//   const recommendedCoverage = 5000000;
//   const gap = Math.max(0, recommendedCoverage - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: '#f9731620' }]}>
//           <Text style={styles.iconEmoji}>🔺</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Life Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Security'}</Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.editIcon}>
//           <Text style={styles.editIconText}>✎</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.lifeCenter}>
//         <Text style={styles.lifeAmount}>{formatAmount(coverage)}</Text>
//         <Text style={styles.lifeLabel}>Coverage Amount</Text>
//       </View>

//       {/* ✅ SIDE BY SIDE - Like Web */}
//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>📈 Coverage Gap</Text>
//           <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// // ✅ FIXED: Monthly SIP displayed as-is (already in K format from DB)
// const GoalsCard = ({ goals, currentIndex, onIndexChange, formatAmount }) => {
//   return (
//     <View style={styles.goalsContainer}>
//       <ScrollView
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         snapToInterval={screenWidth - 32}
//         decelerationRate="fast"
//         onMomentumScrollEnd={(e) => {
//           const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 32));
//           onIndexChange(index);
//         }}
//       >
//         {goals.map((goal, index) => (
//           <View key={index} style={[styles.goalCard, { width: screenWidth - 32 }]}>
//             <View style={styles.goalHeader}>
//               <View style={styles.goalIconBox}>
//                 <Text style={styles.goalIcon}>🎯</Text>
//               </View>
//               <View style={styles.goalTitleContainer}>
//                 <Text style={styles.goalName}>{goal.name}</Text>
//                 <View style={styles.goalBadge}>
//                   <Text style={styles.goalBadgeText}>⚠️ Needs Attention</Text>
//                 </View>
//               </View>
//               <View style={styles.goalMonthly}>
//                 <Text style={styles.goalMonthlyLabel}>Monthly</Text>
//                 {/* ✅ Display as-is - already in K format */}
//                 <Text style={styles.goalMonthlyValue}>₹{goal.customAllocation || 0 }</Text>
//               </View>
//             </View>

//             <Text style={styles.goalProgress}>Achievement Progress</Text>
//             <View style={styles.goalProgressBar}>
//               <View style={[styles.goalProgressFill, { width: '0%' }]} />
//             </View>
//             <Text style={styles.goalProgressText}>0%</Text>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>🎯</Text>
//                 <Text style={styles.goalStatLabel}>Target Amount</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>⏰</Text>
//                 <Text style={styles.goalStatLabel}>Time Left</Text>
//                 <Text style={styles.goalStatValue}>{goal.timePeriod} years left</Text>
//               </View>
//             </View>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>₹</Text>
//                 <Text style={styles.goalStatLabel}>Current</Text>
//                 <Text style={styles.goalStatValue}>₹0</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>📈</Text>
//                 <Text style={styles.goalStatLabel}>Remaining</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//             </View>

//             <View style={styles.buttonColumn}>
//               <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//                 <Text style={styles.buttonText}>Link Investments</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//                 <Text style={styles.buttonText}>Discover Funds</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         ))}
//       </ScrollView>

//       <View style={styles.dotsContainer}>
//         {goals.map((_, idx) => (
//           <View key={idx} style={[styles.dot, idx === currentIndex && styles.dotActive]} />
//         ))}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//     paddingHorizontal: 16,
//   },
//   header: {
//     marginTop: 24,
//     marginBottom: 20,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   headerName: {
//     color: '#fff',
//   },
//   headerBrand: {
//     color: '#f97316',
//   },
//   card: {
//     backgroundColor: 'rgba(31, 41, 55, 0.6)',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 16,
//     marginBottom: 16,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   iconBox: {
//     width: 48,
//     height: 48,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   iconText: {
//     fontSize: 24,
//     color: '#10b981',
//     fontWeight: '700',
//   },
//   iconEmoji: {
//     fontSize: 24,
//   },
//   cardTitleContainer: {
//     flex: 1,
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   cardSubtitle: {
//     fontSize: 11,
//     color: '#9ca3af',
//   },
//   editIcon: {
//     padding: 4,
//   },
//   editIconText: {
//     fontSize: 16,
//     color: '#9ca3af',
//   },
//   badge: {
//     marginTop: 4,
//   },
//   badgeText: {
//     fontSize: 10,
//     color: '#a855f7',
//     fontWeight: '600',
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   statBox: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statLabel: {
//     fontSize: 11,
//     color: '#9ca3af',
//     marginBottom: 4,
//   },
//   statValue: {
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   riskContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   riskCircleOuter: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     borderWidth: 4,
//     borderColor: '#374151',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskCircleInner: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskPercentage: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '700',
//   },
//   riskCategory: {
//     fontSize: 15,
//     fontWeight: '700',
//     marginBottom: 4,
//   },
//   riskKeywords: {
//     fontSize: 11,
//     color: '#9ca3af',
//   },
//   amountRight: {
//     alignItems: 'flex-end',
//   },
//   amountLarge: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   amountSubtext: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginTop: 2,
//     textAlign: 'right',
//   },
//   expandButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   expandText: {
//     color: '#d1d5db',
//     fontSize: 13,
//     fontWeight: '500',
//   },
//   breakdownSection: {
//     marginBottom: 16,
//   },
//   breakdownTitle: {
//     fontSize: 12,
//     color: '#9ca3af',
//     fontWeight: '600',
//     marginBottom: 12,
//   },
//   breakdownItem: {
//     marginBottom: 14,
//   },
//   breakdownRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 6,
//   },
//   breakdownLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   breakdownIcon: {
//     fontSize: 14,
//   },
//   breakdownLabel: {
//     fontSize: 13,
//     color: '#d1d5db',
//     fontWeight: '500',
//   },
//   breakdownRight: {
//     alignItems: 'flex-end',
//   },
//   breakdownValue: {
//     fontSize: 13,
//     color: '#fff',
//     fontWeight: '700',
//   },
//   breakdownPercent: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginTop: 2,
//   },
//   progressBar: {
//     height: 6,
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 3,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     borderRadius: 3,
//   },
//   buttonColumn: {
//     gap: 10,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderRadius: 12,
//     gap: 6,
//   },
//   primaryButton: {
//     backgroundColor: '#a855f7',
//   },
//   secondaryButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   orangeButton: {
//     backgroundColor: '#f97316',
//   },
//   buttonIcon: {
//     fontSize: 14,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '600',
//   },
//   insuranceCenter: {
//     alignItems: 'center',
//     marginVertical: 16,
//   },
//   circularProgress: {
//     width: 180,
//     height: 180,
//     borderRadius: 90,
//     borderWidth: 10,
//     borderColor: '#374151',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 12,
//   },
//   circularInner: {
//     alignItems: 'center',
//   },
//   circularAmount: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   circularLabel: {
//     fontSize: 10,
//     color: '#9ca3af',
//     textAlign: 'center',
//   },
//   percentageBox: {
//     alignItems: 'center',
//   },
//   percentageText: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   percentageLabel: {
//     fontSize: 10,
//     color: '#6b7280',
//   },
//   // ✅ SIDE BY SIDE STATS - Like Web
//   insuranceStatsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 16,
//   },
//   insuranceStat: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
//   },
//   insuranceStatAlert: {
//     backgroundColor: 'rgba(239, 68, 68, 0.1)',
//     borderColor: 'rgba(239, 68, 68, 0.3)',
//   },
//   insuranceStatLabel: {
//     fontSize: 11,
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   insuranceStatValue: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   alertText: {
//     fontSize: 10,
//     color: '#ef4444',
//     fontWeight: '600',
//     marginTop: 4,
//   },
//   lifeCenter: {
//     alignItems: 'center',
//     marginVertical: 16,
//   },
//   lifeAmount: {
//     fontSize: 36,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 6,
//   },
//   lifeLabel: {
//     fontSize: 12,
//     color: '#9ca3af',
//   },
//   goalsContainer: {
//     marginBottom: 16,
//   },
//   goalCard: {
//     backgroundColor: 'rgba(31, 41, 55, 0.6)',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 16,
//     marginRight: 0,
//   },
//   goalHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   goalIconBox: {
//     width: 48,
//     height: 48,
//     borderRadius: 12,
//     backgroundColor: '#f9731620',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   goalIcon: {
//     fontSize: 24,
//   },
//   goalTitleContainer: {
//     flex: 1,
//   },
//   goalName: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 6,
//   },
//   goalBadge: {
//     alignSelf: 'flex-start',
//   },
//   goalBadgeText: {
//     fontSize: 10,
//     color: '#f97316',
//     fontWeight: '600',
//   },
//   goalMonthly: {
//     alignItems: 'flex-end',
//   },
//   goalMonthlyLabel: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginBottom: 2,
//   },
//   goalMonthlyValue: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   goalProgress: {
//     fontSize: 12,
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   goalProgressBar: {
//     height: 10,
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 5,
//     overflow: 'hidden',
//     marginBottom: 6,
//   },
//   goalProgressFill: {
//     height: '100%',
//     backgroundColor: '#a855f7',
//     borderRadius: 5,
//   },
//   goalProgressText: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 12,
//   },
//   // ✅ SIDE BY SIDE GOAL STATS - Like Web
//   goalStatsRow: {
//     flexDirection: 'row',
//     gap: 10,
//     marginBottom: 12,
//   },
//   goalStat: {
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 10,
//   },
//   goalStatIcon: {
//     fontSize: 14,
//     marginBottom: 4,
//   },
//   goalStatLabel: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   goalStatValue: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   dotsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 6,
//     marginTop: 12,
//   },
//   dot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: '#374151',
//   },
//   dotActive: {
//     width: 24,
//     backgroundColor: '#a855f7',
//   },
//   loadingModal: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.95)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   loadingContent: {
//     backgroundColor: 'rgba(31, 41, 55, 0.9)',
//     borderRadius: 20,
//     padding: 32,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '700',
//     marginTop: 16,
//     textAlign: 'center',
//   },
//   loadingSubtext: {
//     color: '#9ca3af',
//     fontSize: 13,
//     marginTop: 8,
//     textAlign: 'center',
//   },
// });

// export default DashboardHome;
// import { useEffect, useMemo, useState } from 'react';

// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { doc, getDoc } from 'firebase/firestore';
// import {
//   ActivityIndicator,
//   Dimensions,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { db } from '../../../src/config/firebase';


// const { width: screenWidth } = Dimensions.get('window');

// const DashboardHome = () => {
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
//   const [expandedCards, setExpandedCards] = useState({});

// useEffect(() => {
//   const fetchUserData = async () => {
//     try {
//       setLoading(true);
//       const phoneNumber = await AsyncStorage.getItem('user_phone');

//       if (!phoneNumber) {
//         console.log('❌ No phone number found');
//         setLoading(false);
//         return;
//       }

//       console.log('📥 Fetching dashboard data for:', phoneNumber);
//       console.log('📍 Collection: questionnaire_submissions');
      
//       const userDoc = await getDoc(doc(db, 'questionnaire_submissions', phoneNumber));

//       console.log('📄 Document exists:', userDoc.exists());
      
//       if (userDoc.exists()) {
//         const data = userDoc.data();
//         console.log('📦 Raw data keys:', Object.keys(data));
//         console.log('📦 Has raw_answers:', !!data.raw_answers);
        
//         if (!data.raw_answers) {
//           console.log('❌ No raw_answers found in document');
//           console.log('📦 Available data:', JSON.stringify(data, null, 2));
//           setLoading(false);
//           return;
//         }
        
//         const convertedData = convertKToRupees(data.raw_answers);
//         setUserData(convertedData);
//         console.log('✅ Dashboard data loaded and converted');
//       } else {
//         console.log('❌ Document does not exist at questionnaire_submissions/' + phoneNumber);
//       }
//     } catch (error) {
//       console.error('❌ Firebase fetch error:', error);
//       console.error('❌ Error code:', error.code);
//       console.error('❌ Error message:', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchUserData();
// }, []);
//   const totalIncome = useMemo(() => {
//     if (!userData?.income_data) return 0;
//     const income = userData.income_data;
//     let total = 0;
//     if (income.salary_business?.has) total += parseFloat(income.salary_business.amount || 0);
//     if (income.rental?.has) total += parseFloat(income.rental.amount || 0);
//     if (income.other?.has) total += parseFloat(income.other.amount || 0);
//     if (income.spouse?.has) total += parseFloat(income.spouse.amount || 0);
//     return total * 1000;
//   }, [userData]);

//   const totalExpenses = useMemo(() => {
//     if (!userData) return 0;
//     const house = userData.house_expenses || {};
//     const loans = userData.loan_data || {};
//     const dependent = userData.dependent_expenses || {};
//     let total = 0;
//     total += parseFloat(house.rent_maintenance || 0);
//     total += parseFloat(house.groceries || 0);
//     total += parseFloat(house.help_salaries || 0);
//     total += parseFloat(house.shopping_dining_entertainment || 0);
//     total += parseFloat(userData.child_monthly_expense || 0);
//     total += parseFloat(dependent.spouse || 0);
//     total += parseFloat(dependent.parent || 0);
//     total += parseFloat(dependent.pet || 0);
//     if (loans.home?.has) total += parseFloat(loans.home.emi || 0);
//     if (loans.commercial?.has) total += parseFloat(loans.commercial.emi || 0);
//     if (loans.car?.has) total += parseFloat(loans.car.emi || 0);
//     if (loans.education?.has) total += parseFloat(loans.education.emi || 0);
//     if (loans.personal?.has) total += parseFloat(loans.personal.emi || 0);
//     return total * 1000;
//   }, [userData]);

//   const savings = totalIncome - totalExpenses;

//   const formatAmount = (amount) => {
//     if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
//     if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
//     return `₹${amount.toFixed(0)}`;
//   };

//   const getUserName = () => {
//     const fullName = userData?.user_data?.fullName || userData?.fullName || 'User';
//     const firstName = fullName.split(' ')[0] || 'User';
//     return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
//   };

//   const riskCapacity = userData?.risk_assessment?.riskCapacity || 0;
//   const riskCategory = userData?.risk_assessment?.riskCategory || 'Not Assessed';
//   const keywords = userData?.risk_assessment?.keywords || 'Complete assessment';

//   const getRiskColor = (score) => {
//     if (score <= 30) return '#ef4444';
//     if (score <= 45) return '#f59e0b';
//     if (score <= 60) return '#eab308';
//     return '#10b981';
//   };
//   const riskColor = getRiskColor(riskCapacity);

//   const efData = userData?.emergency_funds;
//   const selectedLayer = efData?.approach || 'foundation';
//   const layerData = efData?.[`${selectedLayer}_layer`] || efData?.foundation_layer;
//   const totalEmergencyFund = layerData?.amount || 0;

//   const healthInsurance = userData?.insurance_data?.health;
//   const healthCoverage = healthInsurance?.has ? (parseFloat(healthInsurance.sum_insured || 0) * 1000) : 0;
  
//   const lifeInsurance = userData?.insurance_data?.life;
//   const lifeCoverage = lifeInsurance?.has ? (parseFloat(lifeInsurance.sum_insured || 0) * 1000) : 0;

// const healthTargetCoverage = userData?.insurance_data?.health?.targetCoverage || (familySize * 500000);
// const lifeTargetCoverage = userData?.insurance_data?.life?.targetCoverage || (totalIncome * 10);

// const familySize = useMemo(() => {
//   if (!userData?.dependents) return 1;
//   const dependents = userData.dependents;
//   return 1 + (dependents.spouse || 0) + (dependents.child || 0) + (dependents.parent || 0);
// }, [userData]);
//   const goals = Array.isArray(userData?.goal_allocations) 
//   ? userData.goal_allocations 
//   : (userData?.goal_allocations?.goals || []);

//   const toggleExpand = (cardId) => {
//     setExpandedCards(prev => ({
//       ...prev,
//       [cardId]: !prev[cardId]
//     }));
//   };

//   if (loading) {
//     return (
//       <Modal transparent visible={loading} animationType="fade">
//         <View style={styles.loadingModal}>
//           <View style={styles.loadingContent}>
//             <ActivityIndicator size="large" color="#a855f7" />
//             <Text style={styles.loadingText}>Loading Dashboard</Text>
//             <Text style={styles.loadingSubtext}>Fetching your financial data...</Text>
//           </View>
//         </View>
//       </Modal>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>
//           <Text style={styles.headerName}>{getUserName()}'s </Text>
//           <Text style={styles.headerBrand}>GoWealthy </Text>
//           <Text style={styles.headerName}>Journey</Text>
//         </Text>
//       </View>

//       <CashFlowCard totalIncome={totalIncome} totalExpenses={totalExpenses} savings={savings} formatAmount={formatAmount} />
//       <RiskProfileCard riskCapacity={riskCapacity} riskCategory={riskCategory} keywords={keywords} riskColor={riskColor} />
      
//       {efData && (
//         <EmergencyFundCard
//           layerName={selectedLayer.charAt(0).toUpperCase() + selectedLayer.slice(1)}
//           totalAmount={totalEmergencyFund}
//           layerData={layerData}
//           formatAmount={formatAmount}
//           expanded={expandedCards['emergency']}
//           onToggle={() => toggleExpand('emergency')}
//         />
//       )}

//       <HealthInsuranceCard coverage={healthCoverage} formatAmount={formatAmount} isActive={healthInsurance?.has} familySize={familySize} targetCoverage={healthTargetCoverage} />
//       <LifeInsuranceCard coverage={lifeCoverage} formatAmount={formatAmount} isActive={lifeInsurance?.has} familySize={familySize} targetCoverage={lifeTargetCoverage} />

//       {goals.length > 0 && (
//         <GoalsCard goals={goals} currentIndex={currentGoalIndex} onIndexChange={setCurrentGoalIndex} formatAmount={formatAmount} />
//       )}

//       <View style={{ height: 100 }} />
//     </ScrollView>
//   );
// };

// const CashFlowCard = ({ totalIncome, totalExpenses, savings, formatAmount }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
//         <Text style={styles.iconText}>₹</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your CashFlow</Text>
//         <Text style={styles.cardSubtitle}>Income, Expenses & Savings</Text>
//       </View>
//     </View>
//     <View style={styles.statsGrid}>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Income</Text>
//         <Text style={[styles.statValue, { color: '#10b981' }]}>{formatAmount(totalIncome)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Expenses</Text>
//         <Text style={[styles.statValue, { color: '#ef4444' }]}>{formatAmount(totalExpenses)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Savings</Text>
//         <Text style={[styles.statValue, { color: '#3b82f6' }]}>{formatAmount(savings)}</Text>
//       </View>
//     </View>
//   </View>
// );

// const RiskProfileCard = ({ riskCapacity, riskCategory, keywords, riskColor }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: `${riskColor}20` }]}>
//         <Text style={styles.iconEmoji}>🎯</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your Risk Profile</Text>
//         <Text style={styles.cardSubtitle}>Psychology-based assessment</Text>
//       </View>
//     </View>
//     <View style={styles.riskContent}>
//       <View style={styles.riskCircleOuter}>
//         <View style={[styles.riskCircleInner, { backgroundColor: riskColor }]}>
//           <Text style={styles.riskPercentage}>{Math.round(riskCapacity)}%</Text>
//         </View>
//       </View>
//       <View style={{ flex: 1, marginLeft: 16 }}>
//         <Text style={[styles.riskCategory, { color: riskColor }]}>
//           {riskCategory === 'Not Assessed' ? riskCategory : `${riskCategory} Risk`}
//         </Text>
//         <Text style={styles.riskKeywords}>Risk Tolerance: {Math.round(riskCapacity)}%</Text>
//       </View>
//     </View>
//   </View>
// );

// const EmergencyFundCard = ({ layerName, totalAmount, layerData, formatAmount, expanded, onToggle }) => {
//   const getLayerColor = (name) => {
//     const colors = { Foundation: '#a855f7', Intermediate: '#f97316', Fortress: '#a855f7' };
//     return colors[name] || '#a855f7';
//   };
//   const color = getLayerColor(layerName);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: `${color}30` }]}>
//           <Text style={[styles.iconEmoji, { fontSize: 28 }]}>⚡</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Emergency Fund</Text>
//           <Text style={styles.cardSubtitle}>Extended family & vehicle coverage</Text>
//         </View>
//         <View style={styles.amountRight}>
//           <Text style={styles.amountLarge}>{formatAmount(totalAmount)}</Text>
//           <Text style={styles.amountSubtext}>{layerName} Layer</Text>
//         </View>
//       </View>

//       {!expanded && (
//         <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
//           <Text style={styles.expandText}>View Breakdown</Text>
//           <Text style={styles.chevron}>∨</Text>
//         </TouchableOpacity>
//       )}

//       {expanded && layerData && (
//         <View style={styles.breakdownSection}>
//           <Text style={styles.breakdownTitle}>Coverage Breakdown</Text>
//           {[
//             { label: 'Medical', value: layerData.medical, icon: '❤️', color: '#a855f7' },
//             { label: 'EMI', value: layerData.emi, icon: '💳', color: '#f97316' },
//             { label: 'Work Security', value: layerData.work_security, icon: '💼', color: '#a855f7' },
//             { label: 'House', value: layerData.house, icon: '🏠', color: '#f97316' },
//             { label: 'Vehicle', value: layerData.vehicle, icon: '🚗', color: '#a855f7' }
//           ].map((item, idx) => {
//             const percentage = totalAmount > 0 ? ((item.value || 0) / totalAmount) * 100 : 0;
//             return (
//               <View key={idx} style={styles.breakdownItem}>
//                 <View style={styles.breakdownRow}>
//                   <View style={styles.breakdownLeft}>
//                     <View style={[styles.breakdownIconBox, { backgroundColor: `${item.color}30` }]}>
//                       <Text style={styles.breakdownIcon}>{item.icon}</Text>
//                     </View>
//                     <Text style={styles.breakdownLabel}>{item.label}</Text>
//                   </View>
//                   <View style={styles.breakdownRight}>
//                     <Text style={styles.breakdownValue}>{formatAmount(item.value || 0)}</Text>
//                     <Text style={styles.breakdownPercent}>{percentage.toFixed(1)}%</Text>
//                   </View>
//                 </View>
//                 <View style={styles.progressBar}>
//                   <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: item.color, opacity: 0.9 }]} />
//                 </View>
//               </View>
//             );
//           })}
          
//           <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
//             <Text style={styles.expandText}>Hide Details</Text>
//             <Text style={[styles.chevron, { transform: [{ rotate: '180deg' }] }]}>∨</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>🔗 Link Investments</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
//           <Text style={styles.buttonText}>✓ Mark as Done</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const HealthInsuranceCard = ({ coverage, formatAmount, isActive, familySize, targetCoverage }) => {
//  const currentPercentage = targetCoverage > 0 ? Math.round((coverage / (targetCoverage*100000)) * 100) : 0;
//   const gap = Math.max(0, (targetCoverage*100000) - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
//           <Text style={styles.iconEmoji}>❤️</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Health Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Protection'}</Text>
//           </View>
//         </View>
//          <View style={styles.familyInfo}>
//           <Text style={styles.familyIcon}>👥</Text>
//           <Text style={styles.familyText}>{familySize} {familySize === 1 ? 'Member' : 'Members'}</Text>
//         </View>
//       </View>

//       <View style={styles.insuranceCenter}>
//         <View style={styles.circularProgress}>
//           <View style={styles.circularInner}>
//             <Text style={styles.circularAmount}>{formatAmount(targetCoverage)}Lacs</Text>
//             <Text style={styles.circularLabel}>Recommended Coverage</Text>
//                   <Text style={styles.percentageText}>{currentPercentage}%</Text>
//           <Text style={styles.percentageLabel}>Current Coverage</Text>
//           </View>
//         </View>
//         {/* <View style={styles.percentageBox}>
    
//         </View> */}
//       </View>

//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>⚠️ Coverage Gap</Text>
//          <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>🔗Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const LifeInsuranceCard = ({ coverage, formatAmount, isActive, familySize, targetCoverage }) => {
//   const gap = Math.max(0, (targetCoverage*100000) - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: 'rgba(249, 115, 22, 0.2)' }]}>
//           <Text style={styles.iconEmoji}>🔺</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Life Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Security'}</Text>
//           </View>
//         </View>
//          <View style={styles.familyInfo}>
//           <Text style={styles.familyIcon}>👥</Text>
//           <Text style={styles.familyText}>{familySize} Protected</Text>
//         </View>
//       </View>

//       <View style={styles.lifeCenter}>
//         <Text style={styles.lifeAmount}>{formatAmount(coverage)}</Text>
//         <Text style={styles.lifeLabel}>Coverage Amount</Text>
//       </View>

//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>📈 Coverage Gap</Text>
//         <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>🔗Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const GoalsCard = ({ goals, currentIndex, onIndexChange, formatAmount }) => {
//     const getGoalIcon = (goalName) => {
//   const name = goalName?.toLowerCase() || '';
//   if (name.includes('home') || name.includes('house')) return '🏠';
//   if (name.includes('car') || name.includes('vehicle')) return '🚗';
//   if (name.includes('travel') || name.includes('trip') || name.includes('vacation')) return '✈️';
//   if (name.includes('education') || name.includes('study')) return '🎓';
//   if (name.includes('marriage') || name.includes('wedding')) return '💍';
//   if (name.includes('child') || name.includes('baby')) return '👶';
//   if (name.includes('business') || name.includes('startup')) return '💼';
//   if (name.includes('gadget') || name.includes('laptop') || name.includes('phone')) return '📱';
//   if (name.includes('retirement')) return '🏖️';
//   return '🎯'; // default
// };
//   return (
//     <View style={styles.goalsContainer}>
//       <ScrollView
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         snapToInterval={screenWidth - 32}
//         decelerationRate="fast"
//         onMomentumScrollEnd={(e) => {
//           const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 32));
//           onIndexChange(index);
//         }}
//       >
//         {goals.map((goal, index) => (
//           <View key={index} style={[styles.goalCard, { width: screenWidth - 32 }]}>
//             <View style={styles.goalHeader}>
//               <View style={styles.goalIconBox}>
//                 <Text style={styles.goalIcon}>{getGoalIcon(goal.name)}</Text>
//               </View>
//               <View style={styles.goalTitleContainer}>
//                 <Text style={styles.goalName}>{goal.name}</Text>
//                 <View style={styles.goalBadge}>
//                   <Text style={styles.goalBadgeText}>⚠️ Needs Attention</Text>
//                 </View>
//               </View>
//               <View style={styles.goalMonthly}>
//                 <Text style={styles.goalMonthlyLabel}>Monthly SIP</Text>
//                <Text style={styles.goalMonthlyValue}>{formatAmount(goal.customAllocation || 0)}</Text>
//               </View>
//             </View>

//             <Text style={styles.goalProgress}>Achievement Progress</Text>
//             <View style={styles.goalProgressBar}>
//               <View style={[styles.goalProgressFill, { width: '0%' }]} />
//             </View>
//             <Text style={styles.goalProgressText}>0%</Text>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>🎯</Text>
//                 <Text style={styles.goalStatLabel}>Target Amount</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>⏰</Text>
//                 <Text style={styles.goalStatLabel}>Time Left</Text>
//                 <Text style={styles.goalStatValue}>{goal.timePeriod} years left</Text>
//               </View>
//             </View>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>₹</Text>
//                 <Text style={styles.goalStatLabel}>Current</Text>
//                 <Text style={styles.goalStatValue}>₹0</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>📈</Text>
//                 <Text style={styles.goalStatLabel}>Remaining</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//             </View>

//             <View style={styles.buttonColumn}>
//               <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//                 <Text style={styles.buttonText}>🔗Link Investments</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//                 <Text style={styles.buttonText}>Discover Funds</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         ))}
//       </ScrollView>

//       <View style={styles.dotsContainer}>
//         {goals.map((_, idx) => (
//           <View key={idx} style={[styles.dot, idx === currentIndex && styles.dotActive]} />
//         ))}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//     paddingHorizontal: 16,
//     paddingTop: 25,
//   },
//   header: {
//     marginTop: 24,
//     marginBottom: 16,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 26,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   headerName: {
//     color: '#fff',
//   },
//   headerBrand: {
//     color: '#fb923c', // orange-400
//   },
//   // 🎨 UPDATED: Card styling to match web
//   card: {
//     backgroundColor: 'rgba(17, 24, 39, 0.6)', // gray-900/60 - darker
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 24, // p-6
//     marginBottom: 16,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 24, // mb-6
//   },
//   // 🎨 UPDATED: Icon box styling
//   iconBox: {
//     width: 56, // w-14
//     height: 56, // h-14
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   iconText: {
//     fontSize: 28,
//     color: '#10b981',
//     fontWeight: '700',
//   },
//   iconEmoji: {
//     fontSize: 28,
//   },
//   cardTitleContainer: {
//     flex: 1,
//   },
//   // 🎨 UPDATED: Text sizing
//   cardTitle: {
//     fontSize: 20, // text-xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   cardSubtitle: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af', // gray-400
//   },
//   editIcon: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//   },
//   editIconText: {
//     fontSize: 16,
//     color: '#9ca3af',
//   },
//   // 🎨 UPDATED: Badge styling
//   badge: {
//     marginTop: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(168, 85, 247, 0.15)', // purple-500/15
//     borderWidth: 1,
//     borderColor: 'rgba(168, 85, 247, 0.3)', // purple-500/30
//     borderRadius: 999,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     alignSelf: 'flex-start',
//   },
//   badgeText: {
//     fontSize: 12, // text-xs
//     color: '#d8b4fe', // purple-300
//     fontWeight: '600',
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 16,
//   },
//   statBox: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statLabel: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     marginBottom: 4,
//   },
//   statValue: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//   },
//   riskContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   riskCircleOuter: {
//     width: 64, // w-16
//     height: 64, // h-16
//     borderRadius: 32,
//     borderWidth: 4,
//     borderColor: '#374151', // gray-700
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskCircleInner: {
//     width: 48, // w-12
//     height: 48, // h-12
//     borderRadius: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskPercentage: {
//     color: '#fff',
//     fontSize: 14, // text-sm
//     fontWeight: '700',
//   },
//   riskCategory: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     marginBottom: 4,
//   },
//   riskKeywords: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//   },
//   amountRight: {
//     alignItems: 'flex-end',
//   },
//   amountLarge: {
//     fontSize: 24, // text-2xl
//     fontWeight: '700',
//     color: '#fff',
//   },
//   amountSubtext: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginTop: 4,
//     textAlign: 'right',
//   },
//   // 🎨 UPDATED: Expand button
//   expandButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 14, // p-3.5
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//     flexDirection: 'row',
//     gap: 8,
//   },
//   expandText: {
//     color: '#d1d5db', // gray-300
//     fontSize: 14, // text-sm
//     fontWeight: '500',
//   },
//   chevron: {
//     color: '#9ca3af',
//     fontSize: 14,
//   },
//   // 🎨 UPDATED: Breakdown section
//   breakdownSection: {
//     marginBottom: 16,
//     paddingTop: 24,
//     borderTopWidth: 1,
//     borderTopColor: 'rgba(255, 255, 255, 0.1)',
//     marginHorizontal: -24,
//     paddingHorizontal: 24,
//     paddingBottom: 24,
//   },
//   breakdownTitle: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     fontWeight: '600',
//     marginBottom: 20,
//   },
//   breakdownItem: {
//     marginBottom: 16,
//   },
//   breakdownRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   breakdownLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   // 🎨 NEW: Icon box for breakdown items
//   breakdownIconBox: {
//     width: 32,
//     height: 32,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   breakdownIcon: {
//     fontSize: 16,
//   },
//   breakdownLabel: {
//     fontSize: 14, // text-sm
//     color: '#d1d5db', // gray-200
//     fontWeight: '500',
//   },
//   breakdownRight: {
//     alignItems: 'flex-end',
//   },
//   breakdownValue: {
//     fontSize: 14, // text-sm
//     color: '#fff',
//     fontWeight: '700',
//   },
//   breakdownPercent: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginTop: 2,
//   },
//   // 🎨 UPDATED: Progress bar
//   progressBar: {
//     height: 8,
//     backgroundColor: 'rgba(17, 24, 39, 0.8)', // darker
//     borderRadius: 4,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     borderRadius: 4,
//   },
//   buttonColumn: {
//     gap: 12,
//   },
//   // 🎨 UPDATED: Button styling with shadows
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 14, // py-3.5
//     paddingHorizontal: 16,
//     borderRadius: 12,
//     gap: 8,
//   },
//   primaryButton: {
//     backgroundColor: 'rgba(168, 85, 247, 0.3)',
//     borderWidth: 1,
//     borderColor: '#a44df6',
//   },
//   secondaryButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   orangeButton: {
//     backgroundColor: 'rgba(255, 106, 0, 0.3)',
//     borderWidth: 1,
//     borderColor: 'rgba(249, 115, 22, 0.6)',
//   },
//   buttonIcon: {
//     fontSize: 16,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 14, // text-sm
//     fontWeight: '600',
    
//   },
//   insuranceCenter: {
//     alignItems: 'center',
//     marginVertical: 24,
//   },
//   // 🎨 UPDATED: Circular progress
//   circularProgress: {
//     width: 180,
//     height: 180,
//     borderRadius: 90,
//     borderWidth: 10,
//     borderColor: 'rgba(31, 41, 55, 0.8)', // darker
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//   },
//   circularInner: {
//     alignItems: 'center',
//   },
//   circularAmount: {
//     fontSize: 24, // text-2xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   circularLabel: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     textAlign: 'center',
//   },
//   percentageBox: {
//     alignItems: 'center',
//   },
//   percentageText: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     color: '#fff',
//   },
//   percentageLabel: {
//     fontSize: 12, // text-xs
//     color: '#6b7280',
//   },
//   insuranceStatsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 24,
//   },
//   insuranceStat: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
    
//   },
//  insuranceStatAlert: {
//   backgroundColor: 'rgba(239, 68, 68, 0.1)',
//   borderColor: '#ef4444',
//   borderWidth: 1.5,
//   shadowColor: '#ef4444',

// },
//   insuranceStatLabel: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginBottom: 8,
//   },
//   insuranceStatValue: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     color: '#fff',
//   },
//   alertText: {
//     fontSize: 10,
//     color: '#ef4444',
//     fontWeight: '600',
//     marginTop: 4,
//   },
//   lifeCenter: {
//     alignItems: 'center',
//     marginVertical: 24,
//   },
//   lifeAmount: {
//     fontSize: 36, // text-3xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   lifeLabel: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//   },
//   goalsContainer: {
//     marginBottom: 16,
//   },
//   goalCard: {
//     backgroundColor: 'rgba(17, 24, 39, 0.6)',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 24,
//     marginRight: 0,
//   },
//   goalHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   goalIconBox: {
//     width: 56,
//     height: 56,
//     borderRadius: 12,
//     backgroundColor: 'rgba(249, 115, 22, 0.3)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   goalIcon: {
//     fontSize: 28,
//   },
//   goalTitleContainer: {
//     flex: 1,
//   },
//   goalName: {
//     fontSize: 20, // text-xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   goalBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(249, 115, 22, 0.15)',
//     borderWidth: 1,
//     borderColor: 'rgba(249, 115, 22, 0.3)',
//     borderRadius: 999,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     alignSelf: 'flex-start',
//   },
//   goalBadgeText: {
//     fontSize: 12,
//     color: '#fb923c', // orange-400
//     fontWeight: '600',
//   },
//   goalMonthly: {
//     alignItems: 'flex-end',
//   },
//   goalMonthlyLabel: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     marginBottom: 4,
//   },
//   goalMonthlyValue: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     color: '#fff',
//   },
//   goalProgress: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     marginBottom: 8,
//   },
//   goalProgressBar: {
//     height: 12, // h-3
//     backgroundColor: 'rgba(17, 24, 39, 0.8)',
//     borderRadius: 6,
//     overflow: 'hidden',
//     marginBottom: 8,
//   },
//   goalProgressFill: {
//     height: '100%',
//     backgroundColor: '#a855f7',
//     borderRadius: 6,
//   },
//   goalProgressText: {
//     fontSize: 14, // text-sm
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 16,
//   },
//   goalStatsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 12,
//   },
//   goalStat: {
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
//   },
//   goalStatIcon: {
//     fontSize: 14,
//     marginBottom: 6,
//   },
//   goalStatLabel: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   goalStatValue: {
//     fontSize: 14, // text-sm
//     fontWeight: '700',
//     color: '#fff',
//   },
//   dotsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 8,
//     marginTop: 16,
//   },
//   dot: {
//     width: 8, // w-2
//     height: 8, // h-2
//     borderRadius: 4,
//     backgroundColor: '#4b5563', // gray-600
//   },
//   dotActive: {
//     width: 32, // w-8
//     backgroundColor: '#a855f7',
//   },
//   // 🎨 UPDATED: Loading modal
//   loadingModal: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   loadingContent: {
//     backgroundColor: 'rgba(17, 24, 39, 0.9)', // gray-900/90
//     borderRadius: 20,
//     padding: 24,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     minWidth: 200,
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     marginTop: 16,
//     textAlign: 'center',
//   },
//   loadingSubtext: {
//     color: '#9ca3af',
//     fontSize: 14, // text-sm
//     marginTop: 8,
//     textAlign: 'center',
//   },
//   familyInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   familyIcon: {
//     fontSize: 14,
//   },
//   familyText: {
//     fontSize: 14,
//     color: '#9ca3af',
//     fontWeight: '500',
//   },
// });

// export default DashboardHome;
// import React, { useState, useEffect, useMemo } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   StyleSheet,
//   Modal,
//   ActivityIndicator,
//   Dimensions,
//   TouchableOpacity,
// } from 'react-native';
// import { db } from '../../../src/config/firebase';
// import { doc, getDoc } from 'firebase/firestore';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width: screenWidth } = Dimensions.get('window');

// const DashboardHome = () => {
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
//   const [expandedCards, setExpandedCards] = useState({});

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         setLoading(true);
//         const phoneNumber = await AsyncStorage.getItem('user_phone');

//         if (!phoneNumber) {
//           console.log('❌ No phone number found');
//           setLoading(false);
//           return;
//         }

//         console.log('📥 Fetching dashboard data for:', phoneNumber);
//         const userDoc = await getDoc(doc(db, 'users', phoneNumber));

//         if (userDoc.exists()) {
//           const data = userDoc.data();
//           setUserData(data);
//           console.log('✅ Dashboard data loaded');
//         } else {
//           console.log('❌ No data found');
//         }
//       } catch (error) {
//         console.error('❌ Firebase fetch error:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUserData();
//   }, []);

//   const totalIncome = useMemo(() => {
//     if (!userData?.income_data) return 0;
//     const income = userData.income_data;
//     let total = 0;
//     if (income.salary_business?.has) total += parseFloat(income.salary_business.amount || 0);
//     if (income.rental?.has) total += parseFloat(income.rental.amount || 0);
//     if (income.other?.has) total += parseFloat(income.other.amount || 0);
//     if (income.spouse?.has) total += parseFloat(income.spouse.amount || 0);
//     return total * 1000;
//   }, [userData]);

//   const totalExpenses = useMemo(() => {
//     if (!userData) return 0;
//     const house = userData.house_expenses || {};
//     const loans = userData.loan_data || {};
//     const dependent = userData.dependent_expenses || {};
//     let total = 0;
//     total += parseFloat(house.rent_maintenance || 0);
//     total += parseFloat(house.groceries || 0);
//     total += parseFloat(house.help_salaries || 0);
//     total += parseFloat(house.shopping_dining_entertainment || 0);
//     total += parseFloat(userData.child_monthly_expense || 0);
//     total += parseFloat(dependent.spouse || 0);
//     total += parseFloat(dependent.parent || 0);
//     total += parseFloat(dependent.pet || 0);
//     if (loans.home?.has) total += parseFloat(loans.home.emi || 0);
//     if (loans.commercial?.has) total += parseFloat(loans.commercial.emi || 0);
//     if (loans.car?.has) total += parseFloat(loans.car.emi || 0);
//     if (loans.education?.has) total += parseFloat(loans.education.emi || 0);
//     if (loans.personal?.has) total += parseFloat(loans.personal.emi || 0);
//     return total * 1000;
//   }, [userData]);

//   const savings = totalIncome - totalExpenses;

//   const formatAmount = (amount) => {
//     if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
//     if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
//     return `₹${amount.toFixed(0)}`;
//   };

//   const getUserName = () => {
//     const fullName = userData?.user_data?.fullName || userData?.fullName || 'User';
//     const firstName = fullName.split(' ')[0] || 'User';
//     return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
//   };

//   const riskCapacity = userData?.risk_assessment?.riskCapacity || 0;
//   const riskCategory = userData?.risk_assessment?.riskCategory || 'Not Assessed';
//   const keywords = userData?.risk_assessment?.keywords || 'Complete assessment';

//   const getRiskColor = (score) => {
//     if (score <= 30) return '#ef4444';
//     if (score <= 45) return '#f59e0b';
//     if (score <= 60) return '#eab308';
//     return '#10b981';
//   };
//   const riskColor = getRiskColor(riskCapacity);

//   const efData = userData?.emergency_funds;
//   const selectedLayer = efData?.approach || 'foundation';
//   const layerData = efData?.[`${selectedLayer}_layer`] || efData?.foundation_layer;
//   const totalEmergencyFund = layerData?.amount || 0;

//   const healthInsurance = userData?.insurance_data?.health;
//   const healthCoverage = healthInsurance?.has ? (parseFloat(healthInsurance.sum_insured || 0) * 1000) : 0;
  
//   const lifeInsurance = userData?.insurance_data?.life;
//   const lifeCoverage = lifeInsurance?.has ? (parseFloat(lifeInsurance.sum_insured || 0) * 1000) : 0;

//   const goals = userData?.goal_allocations?.goals || [];

//   const toggleExpand = (cardId) => {
//     setExpandedCards(prev => ({
//       ...prev,
//       [cardId]: !prev[cardId]
//     }));
//   };

//   if (loading) {
//     return (
//       <Modal transparent visible={loading} animationType="fade">
//         <View style={styles.loadingModal}>
//           <View style={styles.loadingContent}>
//             <ActivityIndicator size="large" color="#a855f7" />
//             <Text style={styles.loadingText}>Updating Dashboard...</Text>
//             <Text style={styles.loadingSubtext}>Fetching your financial data</Text>
//           </View>
//         </View>
//       </Modal>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>
//           <Text style={styles.headerName}>{getUserName()}'s </Text>
//           <Text style={styles.headerBrand}>GoWealthy </Text>
//           <Text style={styles.headerName}>Journey</Text>
//         </Text>
//       </View>

//       <CashFlowCard totalIncome={totalIncome} totalExpenses={totalExpenses} savings={savings} formatAmount={formatAmount} />
//       <RiskProfileCard riskCapacity={riskCapacity} riskCategory={riskCategory} keywords={keywords} riskColor={riskColor} />
      
//       {efData && (
//         <EmergencyFundCard
//           layerName={selectedLayer.charAt(0).toUpperCase() + selectedLayer.slice(1)}
//           totalAmount={totalEmergencyFund}
//           layerData={layerData}
//           formatAmount={formatAmount}
//           expanded={expandedCards['emergency']}
//           onToggle={() => toggleExpand('emergency')}
//         />
//       )}

//       <HealthInsuranceCard coverage={healthCoverage} formatAmount={formatAmount} isActive={healthInsurance?.has} />
//       <LifeInsuranceCard coverage={lifeCoverage} formatAmount={formatAmount} isActive={lifeInsurance?.has} />

//       {goals.length > 0 && (
//         <GoalsCard goals={goals} currentIndex={currentGoalIndex} onIndexChange={setCurrentGoalIndex} formatAmount={formatAmount} />
//       )}

//       <View style={{ height: 100 }} />
//     </ScrollView>
//   );
// };

// const CashFlowCard = ({ totalIncome, totalExpenses, savings, formatAmount }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: '#10b98120' }]}>
//         <Text style={styles.iconText}>₹</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your CashFlow</Text>
//         <Text style={styles.cardSubtitle}>Income, Expenses & Savings</Text>
//       </View>
//       <TouchableOpacity style={styles.editIcon}>
//         <Text style={styles.editIconText}>✎</Text>
//       </TouchableOpacity>
//     </View>
//     <View style={styles.statsGrid}>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Income</Text>
//         <Text style={[styles.statValue, { color: '#10b981' }]}>{formatAmount(totalIncome)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Expenses</Text>
//         <Text style={[styles.statValue, { color: '#ef4444' }]}>{formatAmount(totalExpenses)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Savings</Text>
//         <Text style={[styles.statValue, { color: '#3b82f6' }]}>{formatAmount(savings)}</Text>
//       </View>
//     </View>
//   </View>
// );

// const RiskProfileCard = ({ riskCapacity, riskCategory, keywords, riskColor }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: `${riskColor}20` }]}>
//         <Text style={styles.iconEmoji}>🎯</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your Money Mindset</Text>
//         <Text style={styles.cardSubtitle}>Psychology-based assessment</Text>
//       </View>
//       <TouchableOpacity style={styles.editIcon}>
//         <Text style={styles.editIconText}>✎</Text>
//       </TouchableOpacity>
//     </View>
//     <View style={styles.riskContent}>
//       <View style={styles.riskCircleOuter}>
//         <View style={[styles.riskCircleInner, { backgroundColor: riskColor }]}>
//           <Text style={styles.riskPercentage}>{Math.round(riskCapacity)}%</Text>
//         </View>
//       </View>
//       <View style={{ flex: 1, marginLeft: 16 }}>
//         <Text style={[styles.riskCategory, { color: riskColor }]}>{riskCategory}</Text>
//         <Text style={styles.riskKeywords}>{keywords}</Text>
//       </View>
//     </View>
//   </View>
// );

// const EmergencyFundCard = ({ layerName, totalAmount, layerData, formatAmount, expanded, onToggle }) => {
//   const getLayerColor = (name) => {
//     const colors = { Foundation: '#a855f7', Intermediate: '#f97316', Fortress: '#a855f7' };
//     return colors[name] || '#a855f7';
//   };
//   const color = getLayerColor(layerName);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
//           <Text style={styles.iconEmoji}>⚡</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Emergency Fund</Text>
//           <Text style={styles.cardSubtitle}>Extended family & vehicle coverage</Text>
//         </View>
//         <View style={styles.amountRight}>
//           <Text style={styles.amountLarge}>{formatAmount(totalAmount)}</Text>
//           <Text style={styles.amountSubtext}>{layerName} layer</Text>
//         </View>
//       </View>

//       <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
//         <Text style={styles.expandText}>{expanded ? 'Hide Details ∧' : 'View Breakdown ∨'}</Text>
//       </TouchableOpacity>

//       {expanded && layerData && (
//         <View style={styles.breakdownSection}>
//           <Text style={styles.breakdownTitle}>Coverage Breakdown</Text>
//           {[
//             { label: 'Medical', value: layerData.medical, icon: '❤️', color: '#a855f7' },
//             { label: 'EMI', value: layerData.emi, icon: '💳', color: '#f97316' },
//             { label: 'Work Security', value: layerData.work_security, icon: '💼', color: '#a855f7' },
//             { label: 'House', value: layerData.house, icon: '🏠', color: '#f97316' },
//             { label: 'Vehicle', value: layerData.vehicle, icon: '🚗', color: '#a855f7' }
//           ].map((item, idx) => {
//             const percentage = totalAmount > 0 ? ((item.value || 0) / totalAmount) * 100 : 0;
//             return (
//               <View key={idx} style={styles.breakdownItem}>
//                 <View style={styles.breakdownRow}>
//                   <View style={styles.breakdownLeft}>
//                     <Text style={styles.breakdownIcon}>{item.icon}</Text>
//                     <Text style={styles.breakdownLabel}>{item.label}</Text>
//                   </View>
//                   <View style={styles.breakdownRight}>
//                     <Text style={styles.breakdownValue}>{formatAmount(item.value || 0)}</Text>
//                     <Text style={styles.breakdownPercent}>{percentage.toFixed(1)}%</Text>
//                   </View>
//                 </View>
//                 <View style={styles.progressBar}>
//                   <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: item.color }]} />
//                 </View>
//               </View>
//             );
//           })}
//         </View>
//       )}

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonIcon}>🔗</Text>
//           <Text style={styles.buttonText}>Link Investments</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
//           <Text style={styles.buttonIcon}>✓</Text>
//           <Text style={styles.buttonText}>Mark as Done</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// // ✅ FIXED: Side-by-side insurance stats like web
// const HealthInsuranceCard = ({ coverage, formatAmount, isActive }) => {
//   const recommendedCoverage = 1500000;
//   const currentPercentage = recommendedCoverage > 0 ? (coverage / recommendedCoverage) * 100 : 0;
//   const gap = Math.max(0, recommendedCoverage - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: '#a855f720' }]}>
//           <Text style={styles.iconEmoji}>❤️</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Health Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Protection'}</Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.editIcon}>
//           <Text style={styles.editIconText}>✎</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.insuranceCenter}>
//         <View style={styles.circularProgress}>
//           <View style={styles.circularInner}>
//             <Text style={styles.circularAmount}>{formatAmount(recommendedCoverage)}</Text>
//             <Text style={styles.circularLabel}>Recommended Coverage</Text>
//           </View>
//         </View>
//         <View style={styles.percentageBox}>
//           <Text style={styles.percentageText}>{currentPercentage.toFixed(0)}%</Text>
//           <Text style={styles.percentageLabel}>Current Coverage</Text>
//         </View>
//       </View>

//       {/* ✅ SIDE BY SIDE - Like Web */}
//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>⚠️ Coverage Gap</Text>
//           <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>

//           <Text style={styles.buttonText}>Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// // ✅ FIXED: Side-by-side insurance stats like web
// const LifeInsuranceCard = ({ coverage, formatAmount, isActive }) => {
//   const recommendedCoverage = 5000000;
//   const gap = Math.max(0, recommendedCoverage - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: '#f9731620' }]}>
//           <Text style={styles.iconEmoji}>🔺</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Life Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Security'}</Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.editIcon}>
//           <Text style={styles.editIconText}>✎</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.lifeCenter}>
//         <Text style={styles.lifeAmount}>{formatAmount(coverage)}</Text>
//         <Text style={styles.lifeLabel}>Coverage Amount</Text>
//       </View>

//       {/* ✅ SIDE BY SIDE - Like Web */}
//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>📈 Coverage Gap</Text>
//           <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// // ✅ FIXED: Monthly SIP displayed as-is (already in K format from DB)
// const GoalsCard = ({ goals, currentIndex, onIndexChange, formatAmount }) => {
//   return (
//     <View style={styles.goalsContainer}>
//       <ScrollView
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         snapToInterval={screenWidth - 32}
//         decelerationRate="fast"
//         onMomentumScrollEnd={(e) => {
//           const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 32));
//           onIndexChange(index);
//         }}
//       >
//         {goals.map((goal, index) => (
//           <View key={index} style={[styles.goalCard, { width: screenWidth - 32 }]}>
//             <View style={styles.goalHeader}>
//               <View style={styles.goalIconBox}>
//                 <Text style={styles.goalIcon}>🎯</Text>
//               </View>
//               <View style={styles.goalTitleContainer}>
//                 <Text style={styles.goalName}>{goal.name}</Text>
//                 <View style={styles.goalBadge}>
//                   <Text style={styles.goalBadgeText}>⚠️ Needs Attention</Text>
//                 </View>
//               </View>
//               <View style={styles.goalMonthly}>
//                 <Text style={styles.goalMonthlyLabel}>Monthly</Text>
//                 {/* ✅ Display as-is - already in K format */}
//                 <Text style={styles.goalMonthlyValue}>₹{goal.customAllocation || 0 }</Text>
//               </View>
//             </View>

//             <Text style={styles.goalProgress}>Achievement Progress</Text>
//             <View style={styles.goalProgressBar}>
//               <View style={[styles.goalProgressFill, { width: '0%' }]} />
//             </View>
//             <Text style={styles.goalProgressText}>0%</Text>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>🎯</Text>
//                 <Text style={styles.goalStatLabel}>Target Amount</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>⏰</Text>
//                 <Text style={styles.goalStatLabel}>Time Left</Text>
//                 <Text style={styles.goalStatValue}>{goal.timePeriod} years left</Text>
//               </View>
//             </View>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>₹</Text>
//                 <Text style={styles.goalStatLabel}>Current</Text>
//                 <Text style={styles.goalStatValue}>₹0</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>📈</Text>
//                 <Text style={styles.goalStatLabel}>Remaining</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//             </View>

//             <View style={styles.buttonColumn}>
//               <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//                 <Text style={styles.buttonText}>Link Investments</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//                 <Text style={styles.buttonText}>Discover Funds</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         ))}
//       </ScrollView>

//       <View style={styles.dotsContainer}>
//         {goals.map((_, idx) => (
//           <View key={idx} style={[styles.dot, idx === currentIndex && styles.dotActive]} />
//         ))}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//     paddingHorizontal: 16,
//   },
//   header: {
//     marginTop: 24,
//     marginBottom: 20,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   headerName: {
//     color: '#fff',
//   },
//   headerBrand: {
//     color: '#f97316',
//   },
//   card: {
//     backgroundColor: 'rgba(31, 41, 55, 0.6)',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 16,
//     marginBottom: 16,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   iconBox: {
//     width: 48,
//     height: 48,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   iconText: {
//     fontSize: 24,
//     color: '#10b981',
//     fontWeight: '700',
//   },
//   iconEmoji: {
//     fontSize: 24,
//   },
//   cardTitleContainer: {
//     flex: 1,
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   cardSubtitle: {
//     fontSize: 11,
//     color: '#9ca3af',
//   },
//   editIcon: {
//     padding: 4,
//   },
//   editIconText: {
//     fontSize: 16,
//     color: '#9ca3af',
//   },
//   badge: {
//     marginTop: 4,
//   },
//   badgeText: {
//     fontSize: 10,
//     color: '#a855f7',
//     fontWeight: '600',
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   statBox: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statLabel: {
//     fontSize: 11,
//     color: '#9ca3af',
//     marginBottom: 4,
//   },
//   statValue: {
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   riskContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   riskCircleOuter: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     borderWidth: 4,
//     borderColor: '#374151',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskCircleInner: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskPercentage: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '700',
//   },
//   riskCategory: {
//     fontSize: 15,
//     fontWeight: '700',
//     marginBottom: 4,
//   },
//   riskKeywords: {
//     fontSize: 11,
//     color: '#9ca3af',
//   },
//   amountRight: {
//     alignItems: 'flex-end',
//   },
//   amountLarge: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   amountSubtext: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginTop: 2,
//     textAlign: 'right',
//   },
//   expandButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   expandText: {
//     color: '#d1d5db',
//     fontSize: 13,
//     fontWeight: '500',
//   },
//   breakdownSection: {
//     marginBottom: 16,
//   },
//   breakdownTitle: {
//     fontSize: 12,
//     color: '#9ca3af',
//     fontWeight: '600',
//     marginBottom: 12,
//   },
//   breakdownItem: {
//     marginBottom: 14,
//   },
//   breakdownRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 6,
//   },
//   breakdownLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   breakdownIcon: {
//     fontSize: 14,
//   },
//   breakdownLabel: {
//     fontSize: 13,
//     color: '#d1d5db',
//     fontWeight: '500',
//   },
//   breakdownRight: {
//     alignItems: 'flex-end',
//   },
//   breakdownValue: {
//     fontSize: 13,
//     color: '#fff',
//     fontWeight: '700',
//   },
//   breakdownPercent: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginTop: 2,
//   },
//   progressBar: {
//     height: 6,
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 3,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     borderRadius: 3,
//   },
//   buttonColumn: {
//     gap: 10,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderRadius: 12,
//     gap: 6,
//   },
//   primaryButton: {
//     backgroundColor: '#a855f7',
//   },
//   secondaryButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   orangeButton: {
//     backgroundColor: '#f97316',
//   },
//   buttonIcon: {
//     fontSize: 14,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '600',
//   },
//   insuranceCenter: {
//     alignItems: 'center',
//     marginVertical: 16,
//   },
//   circularProgress: {
//     width: 180,
//     height: 180,
//     borderRadius: 90,
//     borderWidth: 10,
//     borderColor: '#374151',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 12,
//   },
//   circularInner: {
//     alignItems: 'center',
//   },
//   circularAmount: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   circularLabel: {
//     fontSize: 10,
//     color: '#9ca3af',
//     textAlign: 'center',
//   },
//   percentageBox: {
//     alignItems: 'center',
//   },
//   percentageText: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   percentageLabel: {
//     fontSize: 10,
//     color: '#6b7280',
//   },
//   // ✅ SIDE BY SIDE STATS - Like Web
//   insuranceStatsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 16,
//   },
//   insuranceStat: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
//   },
//   insuranceStatAlert: {
//     backgroundColor: 'rgba(239, 68, 68, 0.1)',
//     borderColor: 'rgba(239, 68, 68, 0.3)',
//   },
//   insuranceStatLabel: {
//     fontSize: 11,
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   insuranceStatValue: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   alertText: {
//     fontSize: 10,
//     color: '#ef4444',
//     fontWeight: '600',
//     marginTop: 4,
//   },
//   lifeCenter: {
//     alignItems: 'center',
//     marginVertical: 16,
//   },
//   lifeAmount: {
//     fontSize: 36,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 6,
//   },
//   lifeLabel: {
//     fontSize: 12,
//     color: '#9ca3af',
//   },
//   goalsContainer: {
//     marginBottom: 16,
//   },
//   goalCard: {
//     backgroundColor: 'rgba(31, 41, 55, 0.6)',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 16,
//     marginRight: 0,
//   },
//   goalHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   goalIconBox: {
//     width: 48,
//     height: 48,
//     borderRadius: 12,
//     backgroundColor: '#f9731620',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   goalIcon: {
//     fontSize: 24,
//   },
//   goalTitleContainer: {
//     flex: 1,
//   },
//   goalName: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 6,
//   },
//   goalBadge: {
//     alignSelf: 'flex-start',
//   },
//   goalBadgeText: {
//     fontSize: 10,
//     color: '#f97316',
//     fontWeight: '600',
//   },
//   goalMonthly: {
//     alignItems: 'flex-end',
//   },
//   goalMonthlyLabel: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginBottom: 2,
//   },
//   goalMonthlyValue: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   goalProgress: {
//     fontSize: 12,
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   goalProgressBar: {
//     height: 10,
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 5,
//     overflow: 'hidden',
//     marginBottom: 6,
//   },
//   goalProgressFill: {
//     height: '100%',
//     backgroundColor: '#a855f7',
//     borderRadius: 5,
//   },
//   goalProgressText: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 12,
//   },
//   // ✅ SIDE BY SIDE GOAL STATS - Like Web
//   goalStatsRow: {
//     flexDirection: 'row',
//     gap: 10,
//     marginBottom: 12,
//   },
//   goalStat: {
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 10,
//   },
//   goalStatIcon: {
//     fontSize: 14,
//     marginBottom: 4,
//   },
//   goalStatLabel: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   goalStatValue: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   dotsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 6,
//     marginTop: 12,
//   },
//   dot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: '#374151',
//   },
//   dotActive: {
//     width: 24,
//     backgroundColor: '#a855f7',
//   },
//   loadingModal: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.95)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   loadingContent: {
//     backgroundColor: 'rgba(31, 41, 55, 0.9)',
//     borderRadius: 20,
//     padding: 32,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '700',
//     marginTop: 16,
//     textAlign: 'center',
//   },
//   loadingSubtext: {
//     color: '#9ca3af',
//     fontSize: 13,
//     marginTop: 8,
//     textAlign: 'center',
//   },
// });

// export default DashboardHome;
// import { useEffect, useMemo, useState } from 'react';

// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { doc, getDoc } from 'firebase/firestore';
// import {
//   ActivityIndicator,
//   Dimensions,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { db } from '../../../src/config/firebase';


// const { width: screenWidth } = Dimensions.get('window');

// const DashboardHome = () => {
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
//   const [expandedCards, setExpandedCards] = useState({});

// useEffect(() => {
//   const fetchUserData = async () => {
//     try {
//       setLoading(true);
//       const phoneNumber = await AsyncStorage.getItem('user_phone');

//       if (!phoneNumber) {
//         console.log('❌ No phone number found');
//         setLoading(false);
//         return;
//       }

//       console.log('📥 Fetching dashboard data for:', phoneNumber);
//       console.log('📍 Collection: questionnaire_submissions');
      
//       const userDoc = await getDoc(doc(db, 'questionnaire_submissions', phoneNumber));

//       console.log('📄 Document exists:', userDoc.exists());
      
//       if (userDoc.exists()) {
//         const data = userDoc.data();
//         console.log('📦 Raw data keys:', Object.keys(data));
//         console.log('📦 Has raw_answers:', !!data.raw_answers);
        
//         if (!data.raw_answers) {
//           console.log('❌ No raw_answers found in document');
//           console.log('📦 Available data:', JSON.stringify(data, null, 2));
//           setLoading(false);
//           return;
//         }
        
//         const convertedData = convertKToRupees(data.raw_answers);
//         setUserData(convertedData);
//         console.log('✅ Dashboard data loaded and converted');
//       } else {
//         console.log('❌ Document does not exist at questionnaire_submissions/' + phoneNumber);
//       }
//     } catch (error) {
//       console.error('❌ Firebase fetch error:', error);
//       console.error('❌ Error code:', error.code);
//       console.error('❌ Error message:', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchUserData();
// }, []);
//   const totalIncome = useMemo(() => {
//     if (!userData?.income_data) return 0;
//     const income = userData.income_data;
//     let total = 0;
//     if (income.salary_business?.has) total += parseFloat(income.salary_business.amount || 0);
//     if (income.rental?.has) total += parseFloat(income.rental.amount || 0);
//     if (income.other?.has) total += parseFloat(income.other.amount || 0);
//     if (income.spouse?.has) total += parseFloat(income.spouse.amount || 0);
//     return total * 1000;
//   }, [userData]);

//   const totalExpenses = useMemo(() => {
//     if (!userData) return 0;
//     const house = userData.house_expenses || {};
//     const loans = userData.loan_data || {};
//     const dependent = userData.dependent_expenses || {};
//     let total = 0;
//     total += parseFloat(house.rent_maintenance || 0);
//     total += parseFloat(house.groceries || 0);
//     total += parseFloat(house.help_salaries || 0);
//     total += parseFloat(house.shopping_dining_entertainment || 0);
//     total += parseFloat(userData.child_monthly_expense || 0);
//     total += parseFloat(dependent.spouse || 0);
//     total += parseFloat(dependent.parent || 0);
//     total += parseFloat(dependent.pet || 0);
//     if (loans.home?.has) total += parseFloat(loans.home.emi || 0);
//     if (loans.commercial?.has) total += parseFloat(loans.commercial.emi || 0);
//     if (loans.car?.has) total += parseFloat(loans.car.emi || 0);
//     if (loans.education?.has) total += parseFloat(loans.education.emi || 0);
//     if (loans.personal?.has) total += parseFloat(loans.personal.emi || 0);
//     return total * 1000;
//   }, [userData]);

//   const savings = totalIncome - totalExpenses;

//   const formatAmount = (amount) => {
//     if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
//     if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
//     return `₹${amount.toFixed(0)}`;
//   };

//   const getUserName = () => {
//     const fullName = userData?.user_data?.fullName || userData?.fullName || 'User';
//     const firstName = fullName.split(' ')[0] || 'User';
//     return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
//   };

//   const riskCapacity = userData?.risk_assessment?.riskCapacity || 0;
//   const riskCategory = userData?.risk_assessment?.riskCategory || 'Not Assessed';
//   const keywords = userData?.risk_assessment?.keywords || 'Complete assessment';

//   const getRiskColor = (score) => {
//     if (score <= 30) return '#ef4444';
//     if (score <= 45) return '#f59e0b';
//     if (score <= 60) return '#eab308';
//     return '#10b981';
//   };
//   const riskColor = getRiskColor(riskCapacity);

//   const efData = userData?.emergency_funds;
//   const selectedLayer = efData?.approach || 'foundation';
//   const layerData = efData?.[`${selectedLayer}_layer`] || efData?.foundation_layer;
//   const totalEmergencyFund = layerData?.amount || 0;

//   const healthInsurance = userData?.insurance_data?.health;
//   const healthCoverage = healthInsurance?.has ? (parseFloat(healthInsurance.sum_insured || 0) * 1000) : 0;
  
//   const lifeInsurance = userData?.insurance_data?.life;
//   const lifeCoverage = lifeInsurance?.has ? (parseFloat(lifeInsurance.sum_insured || 0) * 1000) : 0;

// const healthTargetCoverage = userData?.insurance_data?.health?.targetCoverage || (familySize * 500000);
// const lifeTargetCoverage = userData?.insurance_data?.life?.targetCoverage || (totalIncome * 10);

// const familySize = useMemo(() => {
//   if (!userData?.dependents) return 1;
//   const dependents = userData.dependents;
//   return 1 + (dependents.spouse || 0) + (dependents.child || 0) + (dependents.parent || 0);
// }, [userData]);
//   const goals = Array.isArray(userData?.goal_allocations) 
//   ? userData.goal_allocations 
//   : (userData?.goal_allocations?.goals || []);

//   const toggleExpand = (cardId) => {
//     setExpandedCards(prev => ({
//       ...prev,
//       [cardId]: !prev[cardId]
//     }));
//   };

//   if (loading) {
//     return (
//       <Modal transparent visible={loading} animationType="fade">
//         <View style={styles.loadingModal}>
//           <View style={styles.loadingContent}>
//             <ActivityIndicator size="large" color="#a855f7" />
//             <Text style={styles.loadingText}>Loading Dashboard</Text>
//             <Text style={styles.loadingSubtext}>Fetching your financial data...</Text>
//           </View>
//         </View>
//       </Modal>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>
//           <Text style={styles.headerName}>{getUserName()}'s </Text>
//           <Text style={styles.headerBrand}>GoWealthy </Text>
//           <Text style={styles.headerName}>Journey</Text>
//         </Text>
//       </View>

//       <CashFlowCard totalIncome={totalIncome} totalExpenses={totalExpenses} savings={savings} formatAmount={formatAmount} />
//       <RiskProfileCard riskCapacity={riskCapacity} riskCategory={riskCategory} keywords={keywords} riskColor={riskColor} />
      
//       {efData && (
//         <EmergencyFundCard
//           layerName={selectedLayer.charAt(0).toUpperCase() + selectedLayer.slice(1)}
//           totalAmount={totalEmergencyFund}
//           layerData={layerData}
//           formatAmount={formatAmount}
//           expanded={expandedCards['emergency']}
//           onToggle={() => toggleExpand('emergency')}
//         />
//       )}

//       <HealthInsuranceCard coverage={healthCoverage} formatAmount={formatAmount} isActive={healthInsurance?.has} familySize={familySize} targetCoverage={healthTargetCoverage} />
//       <LifeInsuranceCard coverage={lifeCoverage} formatAmount={formatAmount} isActive={lifeInsurance?.has} familySize={familySize} targetCoverage={lifeTargetCoverage} />

//       {goals.length > 0 && (
//         <GoalsCard goals={goals} currentIndex={currentGoalIndex} onIndexChange={setCurrentGoalIndex} formatAmount={formatAmount} />
//       )}

//       <View style={{ height: 100 }} />
//     </ScrollView>
//   );
// };

// const CashFlowCard = ({ totalIncome, totalExpenses, savings, formatAmount }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
//         <Text style={styles.iconText}>₹</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your CashFlow</Text>
//         <Text style={styles.cardSubtitle}>Income, Expenses & Savings</Text>
//       </View>
//     </View>
//     <View style={styles.statsGrid}>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Income</Text>
//         <Text style={[styles.statValue, { color: '#10b981' }]}>{formatAmount(totalIncome)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Expenses</Text>
//         <Text style={[styles.statValue, { color: '#ef4444' }]}>{formatAmount(totalExpenses)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Savings</Text>
//         <Text style={[styles.statValue, { color: '#3b82f6' }]}>{formatAmount(savings)}</Text>
//       </View>
//     </View>
//   </View>
// );

// const RiskProfileCard = ({ riskCapacity, riskCategory, keywords, riskColor }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: `${riskColor}20` }]}>
//         <Text style={styles.iconEmoji}>🎯</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your Risk Profile</Text>
//         <Text style={styles.cardSubtitle}>Psychology-based assessment</Text>
//       </View>
//     </View>
//     <View style={styles.riskContent}>
//       <View style={styles.riskCircleOuter}>
//         <View style={[styles.riskCircleInner, { backgroundColor: riskColor }]}>
//           <Text style={styles.riskPercentage}>{Math.round(riskCapacity)}%</Text>
//         </View>
//       </View>
//       <View style={{ flex: 1, marginLeft: 16 }}>
//         <Text style={[styles.riskCategory, { color: riskColor }]}>
//           {riskCategory === 'Not Assessed' ? riskCategory : `${riskCategory} Risk`}
//         </Text>
//         <Text style={styles.riskKeywords}>Risk Tolerance: {Math.round(riskCapacity)}%</Text>
//       </View>
//     </View>
//   </View>
// );

// const EmergencyFundCard = ({ layerName, totalAmount, layerData, formatAmount, expanded, onToggle }) => {
//   const getLayerColor = (name) => {
//     const colors = { Foundation: '#a855f7', Intermediate: '#f97316', Fortress: '#a855f7' };
//     return colors[name] || '#a855f7';
//   };
//   const color = getLayerColor(layerName);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: `${color}30` }]}>
//           <Text style={[styles.iconEmoji, { fontSize: 28 }]}>⚡</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Emergency Fund</Text>
//           <Text style={styles.cardSubtitle}>Extended family & vehicle coverage</Text>
//         </View>
//         <View style={styles.amountRight}>
//           <Text style={styles.amountLarge}>{formatAmount(totalAmount)}</Text>
//           <Text style={styles.amountSubtext}>{layerName} Layer</Text>
//         </View>
//       </View>

//       {!expanded && (
//         <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
//           <Text style={styles.expandText}>View Breakdown</Text>
//           <Text style={styles.chevron}>∨</Text>
//         </TouchableOpacity>
//       )}

//       {expanded && layerData && (
//         <View style={styles.breakdownSection}>
//           <Text style={styles.breakdownTitle}>Coverage Breakdown</Text>
//           {[
//             { label: 'Medical', value: layerData.medical, icon: '❤️', color: '#a855f7' },
//             { label: 'EMI', value: layerData.emi, icon: '💳', color: '#f97316' },
//             { label: 'Work Security', value: layerData.work_security, icon: '💼', color: '#a855f7' },
//             { label: 'House', value: layerData.house, icon: '🏠', color: '#f97316' },
//             { label: 'Vehicle', value: layerData.vehicle, icon: '🚗', color: '#a855f7' }
//           ].map((item, idx) => {
//             const percentage = totalAmount > 0 ? ((item.value || 0) / totalAmount) * 100 : 0;
//             return (
//               <View key={idx} style={styles.breakdownItem}>
//                 <View style={styles.breakdownRow}>
//                   <View style={styles.breakdownLeft}>
//                     <View style={[styles.breakdownIconBox, { backgroundColor: `${item.color}30` }]}>
//                       <Text style={styles.breakdownIcon}>{item.icon}</Text>
//                     </View>
//                     <Text style={styles.breakdownLabel}>{item.label}</Text>
//                   </View>
//                   <View style={styles.breakdownRight}>
//                     <Text style={styles.breakdownValue}>{formatAmount(item.value || 0)}</Text>
//                     <Text style={styles.breakdownPercent}>{percentage.toFixed(1)}%</Text>
//                   </View>
//                 </View>
//                 <View style={styles.progressBar}>
//                   <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: item.color, opacity: 0.9 }]} />
//                 </View>
//               </View>
//             );
//           })}
          
//           <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
//             <Text style={styles.expandText}>Hide Details</Text>
//             <Text style={[styles.chevron, { transform: [{ rotate: '180deg' }] }]}>∨</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>🔗 Link Investments</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
//           <Text style={styles.buttonText}>✓ Mark as Done</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const HealthInsuranceCard = ({ coverage, formatAmount, isActive, familySize, targetCoverage }) => {
//  const currentPercentage = targetCoverage > 0 ? Math.round((coverage / (targetCoverage*100000)) * 100) : 0;
//   const gap = Math.max(0, (targetCoverage*100000) - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
//           <Text style={styles.iconEmoji}>❤️</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Health Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Protection'}</Text>
//           </View>
//         </View>
//          <View style={styles.familyInfo}>
//           <Text style={styles.familyIcon}>👥</Text>
//           <Text style={styles.familyText}>{familySize} {familySize === 1 ? 'Member' : 'Members'}</Text>
//         </View>
//       </View>

//       <View style={styles.insuranceCenter}>
//         <View style={styles.circularProgress}>
//           <View style={styles.circularInner}>
//             <Text style={styles.circularAmount}>{formatAmount(targetCoverage)}Lacs</Text>
//             <Text style={styles.circularLabel}>Recommended Coverage</Text>
//                   <Text style={styles.percentageText}>{currentPercentage}%</Text>
//           <Text style={styles.percentageLabel}>Current Coverage</Text>
//           </View>
//         </View>
//         {/* <View style={styles.percentageBox}>
    
//         </View> */}
//       </View>

//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>⚠️ Coverage Gap</Text>
//          <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>🔗Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const LifeInsuranceCard = ({ coverage, formatAmount, isActive, familySize, targetCoverage }) => {
//   const gap = Math.max(0, (targetCoverage*100000) - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: 'rgba(249, 115, 22, 0.2)' }]}>
//           <Text style={styles.iconEmoji}>🔺</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Life Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Security'}</Text>
//           </View>
//         </View>
//          <View style={styles.familyInfo}>
//           <Text style={styles.familyIcon}>👥</Text>
//           <Text style={styles.familyText}>{familySize} Protected</Text>
//         </View>
//       </View>

//       <View style={styles.lifeCenter}>
//         <Text style={styles.lifeAmount}>{formatAmount(coverage)}</Text>
//         <Text style={styles.lifeLabel}>Coverage Amount</Text>
//       </View>

//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>📈 Coverage Gap</Text>
//         <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>🔗Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const GoalsCard = ({ goals, currentIndex, onIndexChange, formatAmount }) => {
//     const getGoalIcon = (goalName) => {
//   const name = goalName?.toLowerCase() || '';
//   if (name.includes('home') || name.includes('house')) return '🏠';
//   if (name.includes('car') || name.includes('vehicle')) return '🚗';
//   if (name.includes('travel') || name.includes('trip') || name.includes('vacation')) return '✈️';
//   if (name.includes('education') || name.includes('study')) return '🎓';
//   if (name.includes('marriage') || name.includes('wedding')) return '💍';
//   if (name.includes('child') || name.includes('baby')) return '👶';
//   if (name.includes('business') || name.includes('startup')) return '💼';
//   if (name.includes('gadget') || name.includes('laptop') || name.includes('phone')) return '📱';
//   if (name.includes('retirement')) return '🏖️';
//   return '🎯'; // default
// };
//   return (
//     <View style={styles.goalsContainer}>
//       <ScrollView
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         snapToInterval={screenWidth - 32}
//         decelerationRate="fast"
//         onMomentumScrollEnd={(e) => {
//           const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 32));
//           onIndexChange(index);
//         }}
//       >
//         {goals.map((goal, index) => (
//           <View key={index} style={[styles.goalCard, { width: screenWidth - 32 }]}>
//             <View style={styles.goalHeader}>
//               <View style={styles.goalIconBox}>
//                 <Text style={styles.goalIcon}>{getGoalIcon(goal.name)}</Text>
//               </View>
//               <View style={styles.goalTitleContainer}>
//                 <Text style={styles.goalName}>{goal.name}</Text>
//                 <View style={styles.goalBadge}>
//                   <Text style={styles.goalBadgeText}>⚠️ Needs Attention</Text>
//                 </View>
//               </View>
//               <View style={styles.goalMonthly}>
//                 <Text style={styles.goalMonthlyLabel}>Monthly SIP</Text>
//                <Text style={styles.goalMonthlyValue}>{formatAmount(goal.customAllocation || 0)}</Text>
//               </View>
//             </View>

//             <Text style={styles.goalProgress}>Achievement Progress</Text>
//             <View style={styles.goalProgressBar}>
//               <View style={[styles.goalProgressFill, { width: '0%' }]} />
//             </View>
//             <Text style={styles.goalProgressText}>0%</Text>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>🎯</Text>
//                 <Text style={styles.goalStatLabel}>Target Amount</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>⏰</Text>
//                 <Text style={styles.goalStatLabel}>Time Left</Text>
//                 <Text style={styles.goalStatValue}>{goal.timePeriod} years left</Text>
//               </View>
//             </View>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>₹</Text>
//                 <Text style={styles.goalStatLabel}>Current</Text>
//                 <Text style={styles.goalStatValue}>₹0</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>📈</Text>
//                 <Text style={styles.goalStatLabel}>Remaining</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//             </View>

//             <View style={styles.buttonColumn}>
//               <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//                 <Text style={styles.buttonText}>🔗Link Investments</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//                 <Text style={styles.buttonText}>Discover Funds</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         ))}
//       </ScrollView>

//       <View style={styles.dotsContainer}>
//         {goals.map((_, idx) => (
//           <View key={idx} style={[styles.dot, idx === currentIndex && styles.dotActive]} />
//         ))}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//     paddingHorizontal: 16,
//     paddingTop: 25,
//   },
//   header: {
//     marginTop: 24,
//     marginBottom: 16,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 26,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   headerName: {
//     color: '#fff',
//   },
//   headerBrand: {
//     color: '#fb923c', // orange-400
//   },
//   // 🎨 UPDATED: Card styling to match web
//   card: {
//     backgroundColor: 'rgba(17, 24, 39, 0.6)', // gray-900/60 - darker
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 24, // p-6
//     marginBottom: 16,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 24, // mb-6
//   },
//   // 🎨 UPDATED: Icon box styling
//   iconBox: {
//     width: 56, // w-14
//     height: 56, // h-14
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   iconText: {
//     fontSize: 28,
//     color: '#10b981',
//     fontWeight: '700',
//   },
//   iconEmoji: {
//     fontSize: 28,
//   },
//   cardTitleContainer: {
//     flex: 1,
//   },
//   // 🎨 UPDATED: Text sizing
//   cardTitle: {
//     fontSize: 20, // text-xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   cardSubtitle: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af', // gray-400
//   },
//   editIcon: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//   },
//   editIconText: {
//     fontSize: 16,
//     color: '#9ca3af',
//   },
//   // 🎨 UPDATED: Badge styling
//   badge: {
//     marginTop: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(168, 85, 247, 0.15)', // purple-500/15
//     borderWidth: 1,
//     borderColor: 'rgba(168, 85, 247, 0.3)', // purple-500/30
//     borderRadius: 999,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     alignSelf: 'flex-start',
//   },
//   badgeText: {
//     fontSize: 12, // text-xs
//     color: '#d8b4fe', // purple-300
//     fontWeight: '600',
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 16,
//   },
//   statBox: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statLabel: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     marginBottom: 4,
//   },
//   statValue: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//   },
//   riskContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   riskCircleOuter: {
//     width: 64, // w-16
//     height: 64, // h-16
//     borderRadius: 32,
//     borderWidth: 4,
//     borderColor: '#374151', // gray-700
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskCircleInner: {
//     width: 48, // w-12
//     height: 48, // h-12
//     borderRadius: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskPercentage: {
//     color: '#fff',
//     fontSize: 14, // text-sm
//     fontWeight: '700',
//   },
//   riskCategory: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     marginBottom: 4,
//   },
//   riskKeywords: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//   },
//   amountRight: {
//     alignItems: 'flex-end',
//   },
//   amountLarge: {
//     fontSize: 24, // text-2xl
//     fontWeight: '700',
//     color: '#fff',
//   },
//   amountSubtext: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginTop: 4,
//     textAlign: 'right',
//   },
//   // 🎨 UPDATED: Expand button
//   expandButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 14, // p-3.5
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//     flexDirection: 'row',
//     gap: 8,
//   },
//   expandText: {
//     color: '#d1d5db', // gray-300
//     fontSize: 14, // text-sm
//     fontWeight: '500',
//   },
//   chevron: {
//     color: '#9ca3af',
//     fontSize: 14,
//   },
//   // 🎨 UPDATED: Breakdown section
//   breakdownSection: {
//     marginBottom: 16,
//     paddingTop: 24,
//     borderTopWidth: 1,
//     borderTopColor: 'rgba(255, 255, 255, 0.1)',
//     marginHorizontal: -24,
//     paddingHorizontal: 24,
//     paddingBottom: 24,
//   },
//   breakdownTitle: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     fontWeight: '600',
//     marginBottom: 20,
//   },
//   breakdownItem: {
//     marginBottom: 16,
//   },
//   breakdownRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   breakdownLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   // 🎨 NEW: Icon box for breakdown items
//   breakdownIconBox: {
//     width: 32,
//     height: 32,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   breakdownIcon: {
//     fontSize: 16,
//   },
//   breakdownLabel: {
//     fontSize: 14, // text-sm
//     color: '#d1d5db', // gray-200
//     fontWeight: '500',
//   },
//   breakdownRight: {
//     alignItems: 'flex-end',
//   },
//   breakdownValue: {
//     fontSize: 14, // text-sm
//     color: '#fff',
//     fontWeight: '700',
//   },
//   breakdownPercent: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginTop: 2,
//   },
//   // 🎨 UPDATED: Progress bar
//   progressBar: {
//     height: 8,
//     backgroundColor: 'rgba(17, 24, 39, 0.8)', // darker
//     borderRadius: 4,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     borderRadius: 4,
//   },
//   buttonColumn: {
//     gap: 12,
//   },
//   // 🎨 UPDATED: Button styling with shadows
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 14, // py-3.5
//     paddingHorizontal: 16,
//     borderRadius: 12,
//     gap: 8,
//   },
//   primaryButton: {
//     backgroundColor: 'rgba(168, 85, 247, 0.3)',
//     borderWidth: 1,
//     borderColor: '#a44df6',
//   },
//   secondaryButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   orangeButton: {
//     backgroundColor: 'rgba(255, 106, 0, 0.3)',
//     borderWidth: 1,
//     borderColor: 'rgba(249, 115, 22, 0.6)',
//   },
//   buttonIcon: {
//     fontSize: 16,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 14, // text-sm
//     fontWeight: '600',
    
//   },
//   insuranceCenter: {
//     alignItems: 'center',
//     marginVertical: 24,
//   },
//   // 🎨 UPDATED: Circular progress
//   circularProgress: {
//     width: 180,
//     height: 180,
//     borderRadius: 90,
//     borderWidth: 10,
//     borderColor: 'rgba(31, 41, 55, 0.8)', // darker
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//   },
//   circularInner: {
//     alignItems: 'center',
//   },
//   circularAmount: {
//     fontSize: 24, // text-2xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   circularLabel: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     textAlign: 'center',
//   },
//   percentageBox: {
//     alignItems: 'center',
//   },
//   percentageText: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     color: '#fff',
//   },
//   percentageLabel: {
//     fontSize: 12, // text-xs
//     color: '#6b7280',
//   },
//   insuranceStatsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 24,
//   },
//   insuranceStat: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
    
//   },
//  insuranceStatAlert: {
//   backgroundColor: 'rgba(239, 68, 68, 0.1)',
//   borderColor: '#ef4444',
//   borderWidth: 1.5,
//   shadowColor: '#ef4444',

// },
//   insuranceStatLabel: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginBottom: 8,
//   },
//   insuranceStatValue: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     color: '#fff',
//   },
//   alertText: {
//     fontSize: 10,
//     color: '#ef4444',
//     fontWeight: '600',
//     marginTop: 4,
//   },
//   lifeCenter: {
//     alignItems: 'center',
//     marginVertical: 24,
//   },
//   lifeAmount: {
//     fontSize: 36, // text-3xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   lifeLabel: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//   },
//   goalsContainer: {
//     marginBottom: 16,
//   },
//   goalCard: {
//     backgroundColor: 'rgba(17, 24, 39, 0.6)',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 24,
//     marginRight: 0,
//   },
//   goalHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   goalIconBox: {
//     width: 56,
//     height: 56,
//     borderRadius: 12,
//     backgroundColor: 'rgba(249, 115, 22, 0.3)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   goalIcon: {
//     fontSize: 28,
//   },
//   goalTitleContainer: {
//     flex: 1,
//   },
//   goalName: {
//     fontSize: 20, // text-xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   goalBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(249, 115, 22, 0.15)',
//     borderWidth: 1,
//     borderColor: 'rgba(249, 115, 22, 0.3)',
//     borderRadius: 999,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     alignSelf: 'flex-start',
//   },
//   goalBadgeText: {
//     fontSize: 12,
//     color: '#fb923c', // orange-400
//     fontWeight: '600',
//   },
//   goalMonthly: {
//     alignItems: 'flex-end',
//   },
//   goalMonthlyLabel: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     marginBottom: 4,
//   },
//   goalMonthlyValue: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     color: '#fff',
//   },
//   goalProgress: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     marginBottom: 8,
//   },
//   goalProgressBar: {
//     height: 12, // h-3
//     backgroundColor: 'rgba(17, 24, 39, 0.8)',
//     borderRadius: 6,
//     overflow: 'hidden',
//     marginBottom: 8,
//   },
//   goalProgressFill: {
//     height: '100%',
//     backgroundColor: '#a855f7',
//     borderRadius: 6,
//   },
//   goalProgressText: {
//     fontSize: 14, // text-sm
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 16,
//   },
//   goalStatsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 12,
//   },
//   goalStat: {
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
//   },
//   goalStatIcon: {
//     fontSize: 14,
//     marginBottom: 6,
//   },
//   goalStatLabel: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   goalStatValue: {
//     fontSize: 14, // text-sm
//     fontWeight: '700',
//     color: '#fff',
//   },
//   dotsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 8,
//     marginTop: 16,
//   },
//   dot: {
//     width: 8, // w-2
//     height: 8, // h-2
//     borderRadius: 4,
//     backgroundColor: '#4b5563', // gray-600
//   },
//   dotActive: {
//     width: 32, // w-8
//     backgroundColor: '#a855f7',
//   },
//   // 🎨 UPDATED: Loading modal
//   loadingModal: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   loadingContent: {
//     backgroundColor: 'rgba(17, 24, 39, 0.9)', // gray-900/90
//     borderRadius: 20,
//     padding: 24,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     minWidth: 200,
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     marginTop: 16,
//     textAlign: 'center',
//   },
//   loadingSubtext: {
//     color: '#9ca3af',
//     fontSize: 14, // text-sm
//     marginTop: 8,
//     textAlign: 'center',
//   },
//   familyInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   familyIcon: {
//     fontSize: 14,
//   },
//   familyText: {
//     fontSize: 14,
//     color: '#9ca3af',
//     fontWeight: '500',
//   },
// });

// export default DashboardHome;
// import React, { useState, useEffect, useMemo } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   StyleSheet,
//   Modal,
//   ActivityIndicator,
//   Dimensions,
//   TouchableOpacity,
// } from 'react-native';
// import { db } from '../../../src/config/firebase';
// import { doc, getDoc } from 'firebase/firestore';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width: screenWidth } = Dimensions.get('window');

// const DashboardHome = () => {
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
//   const [expandedCards, setExpandedCards] = useState({});

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         setLoading(true);
//         const phoneNumber = await AsyncStorage.getItem('user_phone');

//         if (!phoneNumber) {
//           console.log('❌ No phone number found');
//           setLoading(false);
//           return;
//         }

//         console.log('📥 Fetching dashboard data for:', phoneNumber);
//         const userDoc = await getDoc(doc(db, 'users', phoneNumber));

//         if (userDoc.exists()) {
//           const data = userDoc.data();
//           setUserData(data);
//           console.log('✅ Dashboard data loaded');
//         } else {
//           console.log('❌ No data found');
//         }
//       } catch (error) {
//         console.error('❌ Firebase fetch error:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUserData();
//   }, []);

//   const totalIncome = useMemo(() => {
//     if (!userData?.income_data) return 0;
//     const income = userData.income_data;
//     let total = 0;
//     if (income.salary_business?.has) total += parseFloat(income.salary_business.amount || 0);
//     if (income.rental?.has) total += parseFloat(income.rental.amount || 0);
//     if (income.other?.has) total += parseFloat(income.other.amount || 0);
//     if (income.spouse?.has) total += parseFloat(income.spouse.amount || 0);
//     return total * 1000;
//   }, [userData]);

//   const totalExpenses = useMemo(() => {
//     if (!userData) return 0;
//     const house = userData.house_expenses || {};
//     const loans = userData.loan_data || {};
//     const dependent = userData.dependent_expenses || {};
//     let total = 0;
//     total += parseFloat(house.rent_maintenance || 0);
//     total += parseFloat(house.groceries || 0);
//     total += parseFloat(house.help_salaries || 0);
//     total += parseFloat(house.shopping_dining_entertainment || 0);
//     total += parseFloat(userData.child_monthly_expense || 0);
//     total += parseFloat(dependent.spouse || 0);
//     total += parseFloat(dependent.parent || 0);
//     total += parseFloat(dependent.pet || 0);
//     if (loans.home?.has) total += parseFloat(loans.home.emi || 0);
//     if (loans.commercial?.has) total += parseFloat(loans.commercial.emi || 0);
//     if (loans.car?.has) total += parseFloat(loans.car.emi || 0);
//     if (loans.education?.has) total += parseFloat(loans.education.emi || 0);
//     if (loans.personal?.has) total += parseFloat(loans.personal.emi || 0);
//     return total * 1000;
//   }, [userData]);

//   const savings = totalIncome - totalExpenses;

//   const formatAmount = (amount) => {
//     if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
//     if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
//     return `₹${amount.toFixed(0)}`;
//   };

//   const getUserName = () => {
//     const fullName = userData?.user_data?.fullName || userData?.fullName || 'User';
//     const firstName = fullName.split(' ')[0] || 'User';
//     return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
//   };

//   const riskCapacity = userData?.risk_assessment?.riskCapacity || 0;
//   const riskCategory = userData?.risk_assessment?.riskCategory || 'Not Assessed';
//   const keywords = userData?.risk_assessment?.keywords || 'Complete assessment';

//   const getRiskColor = (score) => {
//     if (score <= 30) return '#ef4444';
//     if (score <= 45) return '#f59e0b';
//     if (score <= 60) return '#eab308';
//     return '#10b981';
//   };
//   const riskColor = getRiskColor(riskCapacity);

//   const efData = userData?.emergency_funds;
//   const selectedLayer = efData?.approach || 'foundation';
//   const layerData = efData?.[`${selectedLayer}_layer`] || efData?.foundation_layer;
//   const totalEmergencyFund = layerData?.amount || 0;

//   const healthInsurance = userData?.insurance_data?.health;
//   const healthCoverage = healthInsurance?.has ? (parseFloat(healthInsurance.sum_insured || 0) * 1000) : 0;
  
//   const lifeInsurance = userData?.insurance_data?.life;
//   const lifeCoverage = lifeInsurance?.has ? (parseFloat(lifeInsurance.sum_insured || 0) * 1000) : 0;

//   const goals = userData?.goal_allocations?.goals || [];

//   const toggleExpand = (cardId) => {
//     setExpandedCards(prev => ({
//       ...prev,
//       [cardId]: !prev[cardId]
//     }));
//   };

//   if (loading) {
//     return (
//       <Modal transparent visible={loading} animationType="fade">
//         <View style={styles.loadingModal}>
//           <View style={styles.loadingContent}>
//             <ActivityIndicator size="large" color="#a855f7" />
//             <Text style={styles.loadingText}>Updating Dashboard...</Text>
//             <Text style={styles.loadingSubtext}>Fetching your financial data</Text>
//           </View>
//         </View>
//       </Modal>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>
//           <Text style={styles.headerName}>{getUserName()}'s </Text>
//           <Text style={styles.headerBrand}>GoWealthy </Text>
//           <Text style={styles.headerName}>Journey</Text>
//         </Text>
//       </View>

//       <CashFlowCard totalIncome={totalIncome} totalExpenses={totalExpenses} savings={savings} formatAmount={formatAmount} />
//       <RiskProfileCard riskCapacity={riskCapacity} riskCategory={riskCategory} keywords={keywords} riskColor={riskColor} />
      
//       {efData && (
//         <EmergencyFundCard
//           layerName={selectedLayer.charAt(0).toUpperCase() + selectedLayer.slice(1)}
//           totalAmount={totalEmergencyFund}
//           layerData={layerData}
//           formatAmount={formatAmount}
//           expanded={expandedCards['emergency']}
//           onToggle={() => toggleExpand('emergency')}
//         />
//       )}

//       <HealthInsuranceCard coverage={healthCoverage} formatAmount={formatAmount} isActive={healthInsurance?.has} />
//       <LifeInsuranceCard coverage={lifeCoverage} formatAmount={formatAmount} isActive={lifeInsurance?.has} />

//       {goals.length > 0 && (
//         <GoalsCard goals={goals} currentIndex={currentGoalIndex} onIndexChange={setCurrentGoalIndex} formatAmount={formatAmount} />
//       )}

//       <View style={{ height: 100 }} />
//     </ScrollView>
//   );
// };

// const CashFlowCard = ({ totalIncome, totalExpenses, savings, formatAmount }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: '#10b98120' }]}>
//         <Text style={styles.iconText}>₹</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your CashFlow</Text>
//         <Text style={styles.cardSubtitle}>Income, Expenses & Savings</Text>
//       </View>
//       <TouchableOpacity style={styles.editIcon}>
//         <Text style={styles.editIconText}>✎</Text>
//       </TouchableOpacity>
//     </View>
//     <View style={styles.statsGrid}>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Income</Text>
//         <Text style={[styles.statValue, { color: '#10b981' }]}>{formatAmount(totalIncome)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Expenses</Text>
//         <Text style={[styles.statValue, { color: '#ef4444' }]}>{formatAmount(totalExpenses)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Savings</Text>
//         <Text style={[styles.statValue, { color: '#3b82f6' }]}>{formatAmount(savings)}</Text>
//       </View>
//     </View>
//   </View>
// );

// const RiskProfileCard = ({ riskCapacity, riskCategory, keywords, riskColor }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: `${riskColor}20` }]}>
//         <Text style={styles.iconEmoji}>🎯</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your Money Mindset</Text>
//         <Text style={styles.cardSubtitle}>Psychology-based assessment</Text>
//       </View>
//       <TouchableOpacity style={styles.editIcon}>
//         <Text style={styles.editIconText}>✎</Text>
//       </TouchableOpacity>
//     </View>
//     <View style={styles.riskContent}>
//       <View style={styles.riskCircleOuter}>
//         <View style={[styles.riskCircleInner, { backgroundColor: riskColor }]}>
//           <Text style={styles.riskPercentage}>{Math.round(riskCapacity)}%</Text>
//         </View>
//       </View>
//       <View style={{ flex: 1, marginLeft: 16 }}>
//         <Text style={[styles.riskCategory, { color: riskColor }]}>{riskCategory}</Text>
//         <Text style={styles.riskKeywords}>{keywords}</Text>
//       </View>
//     </View>
//   </View>
// );

// const EmergencyFundCard = ({ layerName, totalAmount, layerData, formatAmount, expanded, onToggle }) => {
//   const getLayerColor = (name) => {
//     const colors = { Foundation: '#a855f7', Intermediate: '#f97316', Fortress: '#a855f7' };
//     return colors[name] || '#a855f7';
//   };
//   const color = getLayerColor(layerName);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
//           <Text style={styles.iconEmoji}>⚡</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Emergency Fund</Text>
//           <Text style={styles.cardSubtitle}>Extended family & vehicle coverage</Text>
//         </View>
//         <View style={styles.amountRight}>
//           <Text style={styles.amountLarge}>{formatAmount(totalAmount)}</Text>
//           <Text style={styles.amountSubtext}>{layerName} layer</Text>
//         </View>
//       </View>

//       <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
//         <Text style={styles.expandText}>{expanded ? 'Hide Details ∧' : 'View Breakdown ∨'}</Text>
//       </TouchableOpacity>

//       {expanded && layerData && (
//         <View style={styles.breakdownSection}>
//           <Text style={styles.breakdownTitle}>Coverage Breakdown</Text>
//           {[
//             { label: 'Medical', value: layerData.medical, icon: '❤️', color: '#a855f7' },
//             { label: 'EMI', value: layerData.emi, icon: '💳', color: '#f97316' },
//             { label: 'Work Security', value: layerData.work_security, icon: '💼', color: '#a855f7' },
//             { label: 'House', value: layerData.house, icon: '🏠', color: '#f97316' },
//             { label: 'Vehicle', value: layerData.vehicle, icon: '🚗', color: '#a855f7' }
//           ].map((item, idx) => {
//             const percentage = totalAmount > 0 ? ((item.value || 0) / totalAmount) * 100 : 0;
//             return (
//               <View key={idx} style={styles.breakdownItem}>
//                 <View style={styles.breakdownRow}>
//                   <View style={styles.breakdownLeft}>
//                     <Text style={styles.breakdownIcon}>{item.icon}</Text>
//                     <Text style={styles.breakdownLabel}>{item.label}</Text>
//                   </View>
//                   <View style={styles.breakdownRight}>
//                     <Text style={styles.breakdownValue}>{formatAmount(item.value || 0)}</Text>
//                     <Text style={styles.breakdownPercent}>{percentage.toFixed(1)}%</Text>
//                   </View>
//                 </View>
//                 <View style={styles.progressBar}>
//                   <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: item.color }]} />
//                 </View>
//               </View>
//             );
//           })}
//         </View>
//       )}

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonIcon}>🔗</Text>
//           <Text style={styles.buttonText}>Link Investments</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
//           <Text style={styles.buttonIcon}>✓</Text>
//           <Text style={styles.buttonText}>Mark as Done</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// // ✅ FIXED: Side-by-side insurance stats like web
// const HealthInsuranceCard = ({ coverage, formatAmount, isActive }) => {
//   const recommendedCoverage = 1500000;
//   const currentPercentage = recommendedCoverage > 0 ? (coverage / recommendedCoverage) * 100 : 0;
//   const gap = Math.max(0, recommendedCoverage - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: '#a855f720' }]}>
//           <Text style={styles.iconEmoji}>❤️</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Health Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Protection'}</Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.editIcon}>
//           <Text style={styles.editIconText}>✎</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.insuranceCenter}>
//         <View style={styles.circularProgress}>
//           <View style={styles.circularInner}>
//             <Text style={styles.circularAmount}>{formatAmount(recommendedCoverage)}</Text>
//             <Text style={styles.circularLabel}>Recommended Coverage</Text>
//           </View>
//         </View>
//         <View style={styles.percentageBox}>
//           <Text style={styles.percentageText}>{currentPercentage.toFixed(0)}%</Text>
//           <Text style={styles.percentageLabel}>Current Coverage</Text>
//         </View>
//       </View>

//       {/* ✅ SIDE BY SIDE - Like Web */}
//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>⚠️ Coverage Gap</Text>
//           <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>

//           <Text style={styles.buttonText}>Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// // ✅ FIXED: Side-by-side insurance stats like web
// const LifeInsuranceCard = ({ coverage, formatAmount, isActive }) => {
//   const recommendedCoverage = 5000000;
//   const gap = Math.max(0, recommendedCoverage - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: '#f9731620' }]}>
//           <Text style={styles.iconEmoji}>🔺</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Life Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Security'}</Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.editIcon}>
//           <Text style={styles.editIconText}>✎</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.lifeCenter}>
//         <Text style={styles.lifeAmount}>{formatAmount(coverage)}</Text>
//         <Text style={styles.lifeLabel}>Coverage Amount</Text>
//       </View>

//       {/* ✅ SIDE BY SIDE - Like Web */}
//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>📈 Coverage Gap</Text>
//           <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// // ✅ FIXED: Monthly SIP displayed as-is (already in K format from DB)
// const GoalsCard = ({ goals, currentIndex, onIndexChange, formatAmount }) => {
//   return (
//     <View style={styles.goalsContainer}>
//       <ScrollView
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         snapToInterval={screenWidth - 32}
//         decelerationRate="fast"
//         onMomentumScrollEnd={(e) => {
//           const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 32));
//           onIndexChange(index);
//         }}
//       >
//         {goals.map((goal, index) => (
//           <View key={index} style={[styles.goalCard, { width: screenWidth - 32 }]}>
//             <View style={styles.goalHeader}>
//               <View style={styles.goalIconBox}>
//                 <Text style={styles.goalIcon}>🎯</Text>
//               </View>
//               <View style={styles.goalTitleContainer}>
//                 <Text style={styles.goalName}>{goal.name}</Text>
//                 <View style={styles.goalBadge}>
//                   <Text style={styles.goalBadgeText}>⚠️ Needs Attention</Text>
//                 </View>
//               </View>
//               <View style={styles.goalMonthly}>
//                 <Text style={styles.goalMonthlyLabel}>Monthly</Text>
//                 {/* ✅ Display as-is - already in K format */}
//                 <Text style={styles.goalMonthlyValue}>₹{goal.customAllocation || 0 }</Text>
//               </View>
//             </View>

//             <Text style={styles.goalProgress}>Achievement Progress</Text>
//             <View style={styles.goalProgressBar}>
//               <View style={[styles.goalProgressFill, { width: '0%' }]} />
//             </View>
//             <Text style={styles.goalProgressText}>0%</Text>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>🎯</Text>
//                 <Text style={styles.goalStatLabel}>Target Amount</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>⏰</Text>
//                 <Text style={styles.goalStatLabel}>Time Left</Text>
//                 <Text style={styles.goalStatValue}>{goal.timePeriod} years left</Text>
//               </View>
//             </View>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>₹</Text>
//                 <Text style={styles.goalStatLabel}>Current</Text>
//                 <Text style={styles.goalStatValue}>₹0</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>📈</Text>
//                 <Text style={styles.goalStatLabel}>Remaining</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//             </View>

//             <View style={styles.buttonColumn}>
//               <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//                 <Text style={styles.buttonText}>Link Investments</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//                 <Text style={styles.buttonText}>Discover Funds</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         ))}
//       </ScrollView>

//       <View style={styles.dotsContainer}>
//         {goals.map((_, idx) => (
//           <View key={idx} style={[styles.dot, idx === currentIndex && styles.dotActive]} />
//         ))}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//     paddingHorizontal: 16,
//   },
//   header: {
//     marginTop: 24,
//     marginBottom: 20,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   headerName: {
//     color: '#fff',
//   },
//   headerBrand: {
//     color: '#f97316',
//   },
//   card: {
//     backgroundColor: 'rgba(31, 41, 55, 0.6)',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 16,
//     marginBottom: 16,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   iconBox: {
//     width: 48,
//     height: 48,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   iconText: {
//     fontSize: 24,
//     color: '#10b981',
//     fontWeight: '700',
//   },
//   iconEmoji: {
//     fontSize: 24,
//   },
//   cardTitleContainer: {
//     flex: 1,
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   cardSubtitle: {
//     fontSize: 11,
//     color: '#9ca3af',
//   },
//   editIcon: {
//     padding: 4,
//   },
//   editIconText: {
//     fontSize: 16,
//     color: '#9ca3af',
//   },
//   badge: {
//     marginTop: 4,
//   },
//   badgeText: {
//     fontSize: 10,
//     color: '#a855f7',
//     fontWeight: '600',
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   statBox: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statLabel: {
//     fontSize: 11,
//     color: '#9ca3af',
//     marginBottom: 4,
//   },
//   statValue: {
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   riskContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   riskCircleOuter: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     borderWidth: 4,
//     borderColor: '#374151',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskCircleInner: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskPercentage: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '700',
//   },
//   riskCategory: {
//     fontSize: 15,
//     fontWeight: '700',
//     marginBottom: 4,
//   },
//   riskKeywords: {
//     fontSize: 11,
//     color: '#9ca3af',
//   },
//   amountRight: {
//     alignItems: 'flex-end',
//   },
//   amountLarge: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   amountSubtext: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginTop: 2,
//     textAlign: 'right',
//   },
//   expandButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   expandText: {
//     color: '#d1d5db',
//     fontSize: 13,
//     fontWeight: '500',
//   },
//   breakdownSection: {
//     marginBottom: 16,
//   },
//   breakdownTitle: {
//     fontSize: 12,
//     color: '#9ca3af',
//     fontWeight: '600',
//     marginBottom: 12,
//   },
//   breakdownItem: {
//     marginBottom: 14,
//   },
//   breakdownRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 6,
//   },
//   breakdownLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   breakdownIcon: {
//     fontSize: 14,
//   },
//   breakdownLabel: {
//     fontSize: 13,
//     color: '#d1d5db',
//     fontWeight: '500',
//   },
//   breakdownRight: {
//     alignItems: 'flex-end',
//   },
//   breakdownValue: {
//     fontSize: 13,
//     color: '#fff',
//     fontWeight: '700',
//   },
//   breakdownPercent: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginTop: 2,
//   },
//   progressBar: {
//     height: 6,
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 3,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     borderRadius: 3,
//   },
//   buttonColumn: {
//     gap: 10,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderRadius: 12,
//     gap: 6,
//   },
//   primaryButton: {
//     backgroundColor: '#a855f7',
//   },
//   secondaryButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   orangeButton: {
//     backgroundColor: '#f97316',
//   },
//   buttonIcon: {
//     fontSize: 14,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '600',
//   },
//   insuranceCenter: {
//     alignItems: 'center',
//     marginVertical: 16,
//   },
//   circularProgress: {
//     width: 180,
//     height: 180,
//     borderRadius: 90,
//     borderWidth: 10,
//     borderColor: '#374151',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 12,
//   },
//   circularInner: {
//     alignItems: 'center',
//   },
//   circularAmount: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   circularLabel: {
//     fontSize: 10,
//     color: '#9ca3af',
//     textAlign: 'center',
//   },
//   percentageBox: {
//     alignItems: 'center',
//   },
//   percentageText: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   percentageLabel: {
//     fontSize: 10,
//     color: '#6b7280',
//   },
//   // ✅ SIDE BY SIDE STATS - Like Web
//   insuranceStatsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 16,
//   },
//   insuranceStat: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
//   },
//   insuranceStatAlert: {
//     backgroundColor: 'rgba(239, 68, 68, 0.1)',
//     borderColor: 'rgba(239, 68, 68, 0.3)',
//   },
//   insuranceStatLabel: {
//     fontSize: 11,
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   insuranceStatValue: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   alertText: {
//     fontSize: 10,
//     color: '#ef4444',
//     fontWeight: '600',
//     marginTop: 4,
//   },
//   lifeCenter: {
//     alignItems: 'center',
//     marginVertical: 16,
//   },
//   lifeAmount: {
//     fontSize: 36,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 6,
//   },
//   lifeLabel: {
//     fontSize: 12,
//     color: '#9ca3af',
//   },
//   goalsContainer: {
//     marginBottom: 16,
//   },
//   goalCard: {
//     backgroundColor: 'rgba(31, 41, 55, 0.6)',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 16,
//     marginRight: 0,
//   },
//   goalHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   goalIconBox: {
//     width: 48,
//     height: 48,
//     borderRadius: 12,
//     backgroundColor: '#f9731620',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   goalIcon: {
//     fontSize: 24,
//   },
//   goalTitleContainer: {
//     flex: 1,
//   },
//   goalName: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 6,
//   },
//   goalBadge: {
//     alignSelf: 'flex-start',
//   },
//   goalBadgeText: {
//     fontSize: 10,
//     color: '#f97316',
//     fontWeight: '600',
//   },
//   goalMonthly: {
//     alignItems: 'flex-end',
//   },
//   goalMonthlyLabel: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginBottom: 2,
//   },
//   goalMonthlyValue: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   goalProgress: {
//     fontSize: 12,
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   goalProgressBar: {
//     height: 10,
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 5,
//     overflow: 'hidden',
//     marginBottom: 6,
//   },
//   goalProgressFill: {
//     height: '100%',
//     backgroundColor: '#a855f7',
//     borderRadius: 5,
//   },
//   goalProgressText: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 12,
//   },
//   // ✅ SIDE BY SIDE GOAL STATS - Like Web
//   goalStatsRow: {
//     flexDirection: 'row',
//     gap: 10,
//     marginBottom: 12,
//   },
//   goalStat: {
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 10,
//   },
//   goalStatIcon: {
//     fontSize: 14,
//     marginBottom: 4,
//   },
//   goalStatLabel: {
//     fontSize: 10,
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   goalStatValue: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   dotsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 6,
//     marginTop: 12,
//   },
//   dot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: '#374151',
//   },
//   dotActive: {
//     width: 24,
//     backgroundColor: '#a855f7',
//   },
//   loadingModal: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.95)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   loadingContent: {
//     backgroundColor: 'rgba(31, 41, 55, 0.9)',
//     borderRadius: 20,
//     padding: 32,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '700',
//     marginTop: 16,
//     textAlign: 'center',
//   },
//   loadingSubtext: {
//     color: '#9ca3af',
//     fontSize: 13,
//     marginTop: 8,
//     textAlign: 'center',
//   },
// });

// export default DashboardHome;
// import { useEffect, useMemo, useState } from 'react';

// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { doc, getDoc } from 'firebase/firestore';
// import {
//   ActivityIndicator,
//   Dimensions,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { db } from '../../../src/config/firebase';


// const { width: screenWidth } = Dimensions.get('window');

// const DashboardHome = () => {
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
//   const [expandedCards, setExpandedCards] = useState({});

// useEffect(() => {
//   const fetchUserData = async () => {
//     try {
//       setLoading(true);
//       const phoneNumber = await AsyncStorage.getItem('user_phone');

//       if (!phoneNumber) {
//         console.log('❌ No phone number found');
//         setLoading(false);
//         return;
//       }

//       console.log('📥 Fetching dashboard data for:', phoneNumber);
//       console.log('📍 Collection: questionnaire_submissions');
      
//       const userDoc = await getDoc(doc(db, 'questionnaire_submissions', phoneNumber));

//       console.log('📄 Document exists:', userDoc.exists());
      
//       if (userDoc.exists()) {
//         const data = userDoc.data();
//         console.log('📦 Raw data keys:', Object.keys(data));
//         console.log('📦 Has raw_answers:', !!data.raw_answers);
        
//         if (!data.raw_answers) {
//           console.log('❌ No raw_answers found in document');
//           console.log('📦 Available data:', JSON.stringify(data, null, 2));
//           setLoading(false);
//           return;
//         }
        
//         const convertedData = convertKToRupees(data.raw_answers);
//         setUserData(convertedData);
//         console.log('✅ Dashboard data loaded and converted');
//       } else {
//         console.log('❌ Document does not exist at questionnaire_submissions/' + phoneNumber);
//       }
//     } catch (error) {
//       console.error('❌ Firebase fetch error:', error);
//       console.error('❌ Error code:', error.code);
//       console.error('❌ Error message:', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchUserData();
// }, []);
//   const totalIncome = useMemo(() => {
//     if (!userData?.income_data) return 0;
//     const income = userData.income_data;
//     let total = 0;
//     if (income.salary_business?.has) total += parseFloat(income.salary_business.amount || 0);
//     if (income.rental?.has) total += parseFloat(income.rental.amount || 0);
//     if (income.other?.has) total += parseFloat(income.other.amount || 0);
//     if (income.spouse?.has) total += parseFloat(income.spouse.amount || 0);
//     return total * 1000;
//   }, [userData]);

//   const totalExpenses = useMemo(() => {
//     if (!userData) return 0;
//     const house = userData.house_expenses || {};
//     const loans = userData.loan_data || {};
//     const dependent = userData.dependent_expenses || {};
//     let total = 0;
//     total += parseFloat(house.rent_maintenance || 0);
//     total += parseFloat(house.groceries || 0);
//     total += parseFloat(house.help_salaries || 0);
//     total += parseFloat(house.shopping_dining_entertainment || 0);
//     total += parseFloat(userData.child_monthly_expense || 0);
//     total += parseFloat(dependent.spouse || 0);
//     total += parseFloat(dependent.parent || 0);
//     total += parseFloat(dependent.pet || 0);
//     if (loans.home?.has) total += parseFloat(loans.home.emi || 0);
//     if (loans.commercial?.has) total += parseFloat(loans.commercial.emi || 0);
//     if (loans.car?.has) total += parseFloat(loans.car.emi || 0);
//     if (loans.education?.has) total += parseFloat(loans.education.emi || 0);
//     if (loans.personal?.has) total += parseFloat(loans.personal.emi || 0);
//     return total * 1000;
//   }, [userData]);

//   const savings = totalIncome - totalExpenses;

//   const formatAmount = (amount) => {
//     if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
//     if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
//     return `₹${amount.toFixed(0)}`;
//   };

//   const getUserName = () => {
//     const fullName = userData?.user_data?.fullName || userData?.fullName || 'User';
//     const firstName = fullName.split(' ')[0] || 'User';
//     return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
//   };

//   const riskCapacity = userData?.risk_assessment?.riskCapacity || 0;
//   const riskCategory = userData?.risk_assessment?.riskCategory || 'Not Assessed';
//   const keywords = userData?.risk_assessment?.keywords || 'Complete assessment';

//   const getRiskColor = (score) => {
//     if (score <= 30) return '#ef4444';
//     if (score <= 45) return '#f59e0b';
//     if (score <= 60) return '#eab308';
//     return '#10b981';
//   };
//   const riskColor = getRiskColor(riskCapacity);

//   const efData = userData?.emergency_funds;
//   const selectedLayer = efData?.approach || 'foundation';
//   const layerData = efData?.[`${selectedLayer}_layer`] || efData?.foundation_layer;
//   const totalEmergencyFund = layerData?.amount || 0;

//   const healthInsurance = userData?.insurance_data?.health;
//   const healthCoverage = healthInsurance?.has ? (parseFloat(healthInsurance.sum_insured || 0) * 1000) : 0;
  
//   const lifeInsurance = userData?.insurance_data?.life;
//   const lifeCoverage = lifeInsurance?.has ? (parseFloat(lifeInsurance.sum_insured || 0) * 1000) : 0;

// const healthTargetCoverage = userData?.insurance_data?.health?.targetCoverage || (familySize * 500000);
// const lifeTargetCoverage = userData?.insurance_data?.life?.targetCoverage || (totalIncome * 10);

// const familySize = useMemo(() => {
//   if (!userData?.dependents) return 1;
//   const dependents = userData.dependents;
//   return 1 + (dependents.spouse || 0) + (dependents.child || 0) + (dependents.parent || 0);
// }, [userData]);
//   const goals = Array.isArray(userData?.goal_allocations) 
//   ? userData.goal_allocations 
//   : (userData?.goal_allocations?.goals || []);

//   const toggleExpand = (cardId) => {
//     setExpandedCards(prev => ({
//       ...prev,
//       [cardId]: !prev[cardId]
//     }));
//   };

//   if (loading) {
//     return (
//       <Modal transparent visible={loading} animationType="fade">
//         <View style={styles.loadingModal}>
//           <View style={styles.loadingContent}>
//             <ActivityIndicator size="large" color="#a855f7" />
//             <Text style={styles.loadingText}>Loading Dashboard</Text>
//             <Text style={styles.loadingSubtext}>Fetching your financial data...</Text>
//           </View>
//         </View>
//       </Modal>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>
//           <Text style={styles.headerName}>{getUserName()}'s </Text>
//           <Text style={styles.headerBrand}>GoWealthy </Text>
//           <Text style={styles.headerName}>Journey</Text>
//         </Text>
//       </View>

//       <CashFlowCard totalIncome={totalIncome} totalExpenses={totalExpenses} savings={savings} formatAmount={formatAmount} />
//       <RiskProfileCard riskCapacity={riskCapacity} riskCategory={riskCategory} keywords={keywords} riskColor={riskColor} />
      
//       {efData && (
//         <EmergencyFundCard
//           layerName={selectedLayer.charAt(0).toUpperCase() + selectedLayer.slice(1)}
//           totalAmount={totalEmergencyFund}
//           layerData={layerData}
//           formatAmount={formatAmount}
//           expanded={expandedCards['emergency']}
//           onToggle={() => toggleExpand('emergency')}
//         />
//       )}

//       <HealthInsuranceCard coverage={healthCoverage} formatAmount={formatAmount} isActive={healthInsurance?.has} familySize={familySize} targetCoverage={healthTargetCoverage} />
//       <LifeInsuranceCard coverage={lifeCoverage} formatAmount={formatAmount} isActive={lifeInsurance?.has} familySize={familySize} targetCoverage={lifeTargetCoverage} />

//       {goals.length > 0 && (
//         <GoalsCard goals={goals} currentIndex={currentGoalIndex} onIndexChange={setCurrentGoalIndex} formatAmount={formatAmount} />
//       )}

//       <View style={{ height: 100 }} />
//     </ScrollView>
//   );
// };

// const CashFlowCard = ({ totalIncome, totalExpenses, savings, formatAmount }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
//         <Text style={styles.iconText}>₹</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your CashFlow</Text>
//         <Text style={styles.cardSubtitle}>Income, Expenses & Savings</Text>
//       </View>
//     </View>
//     <View style={styles.statsGrid}>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Income</Text>
//         <Text style={[styles.statValue, { color: '#10b981' }]}>{formatAmount(totalIncome)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Expenses</Text>
//         <Text style={[styles.statValue, { color: '#ef4444' }]}>{formatAmount(totalExpenses)}</Text>
//       </View>
//       <View style={styles.statBox}>
//         <Text style={styles.statLabel}>Savings</Text>
//         <Text style={[styles.statValue, { color: '#3b82f6' }]}>{formatAmount(savings)}</Text>
//       </View>
//     </View>
//   </View>
// );

// const RiskProfileCard = ({ riskCapacity, riskCategory, keywords, riskColor }) => (
//   <View style={styles.card}>
//     <View style={styles.cardHeader}>
//       <View style={[styles.iconBox, { backgroundColor: `${riskColor}20` }]}>
//         <Text style={styles.iconEmoji}>🎯</Text>
//       </View>
//       <View style={styles.cardTitleContainer}>
//         <Text style={styles.cardTitle}>Your Risk Profile</Text>
//         <Text style={styles.cardSubtitle}>Psychology-based assessment</Text>
//       </View>
//     </View>
//     <View style={styles.riskContent}>
//       <View style={styles.riskCircleOuter}>
//         <View style={[styles.riskCircleInner, { backgroundColor: riskColor }]}>
//           <Text style={styles.riskPercentage}>{Math.round(riskCapacity)}%</Text>
//         </View>
//       </View>
//       <View style={{ flex: 1, marginLeft: 16 }}>
//         <Text style={[styles.riskCategory, { color: riskColor }]}>
//           {riskCategory === 'Not Assessed' ? riskCategory : `${riskCategory} Risk`}
//         </Text>
//         <Text style={styles.riskKeywords}>Risk Tolerance: {Math.round(riskCapacity)}%</Text>
//       </View>
//     </View>
//   </View>
// );

// const EmergencyFundCard = ({ layerName, totalAmount, layerData, formatAmount, expanded, onToggle }) => {
//   const getLayerColor = (name) => {
//     const colors = { Foundation: '#a855f7', Intermediate: '#f97316', Fortress: '#a855f7' };
//     return colors[name] || '#a855f7';
//   };
//   const color = getLayerColor(layerName);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: `${color}30` }]}>
//           <Text style={[styles.iconEmoji, { fontSize: 28 }]}>⚡</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Emergency Fund</Text>
//           <Text style={styles.cardSubtitle}>Extended family & vehicle coverage</Text>
//         </View>
//         <View style={styles.amountRight}>
//           <Text style={styles.amountLarge}>{formatAmount(totalAmount)}</Text>
//           <Text style={styles.amountSubtext}>{layerName} Layer</Text>
//         </View>
//       </View>

//       {!expanded && (
//         <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
//           <Text style={styles.expandText}>View Breakdown</Text>
//           <Text style={styles.chevron}>∨</Text>
//         </TouchableOpacity>
//       )}

//       {expanded && layerData && (
//         <View style={styles.breakdownSection}>
//           <Text style={styles.breakdownTitle}>Coverage Breakdown</Text>
//           {[
//             { label: 'Medical', value: layerData.medical, icon: '❤️', color: '#a855f7' },
//             { label: 'EMI', value: layerData.emi, icon: '💳', color: '#f97316' },
//             { label: 'Work Security', value: layerData.work_security, icon: '💼', color: '#a855f7' },
//             { label: 'House', value: layerData.house, icon: '🏠', color: '#f97316' },
//             { label: 'Vehicle', value: layerData.vehicle, icon: '🚗', color: '#a855f7' }
//           ].map((item, idx) => {
//             const percentage = totalAmount > 0 ? ((item.value || 0) / totalAmount) * 100 : 0;
//             return (
//               <View key={idx} style={styles.breakdownItem}>
//                 <View style={styles.breakdownRow}>
//                   <View style={styles.breakdownLeft}>
//                     <View style={[styles.breakdownIconBox, { backgroundColor: `${item.color}30` }]}>
//                       <Text style={styles.breakdownIcon}>{item.icon}</Text>
//                     </View>
//                     <Text style={styles.breakdownLabel}>{item.label}</Text>
//                   </View>
//                   <View style={styles.breakdownRight}>
//                     <Text style={styles.breakdownValue}>{formatAmount(item.value || 0)}</Text>
//                     <Text style={styles.breakdownPercent}>{percentage.toFixed(1)}%</Text>
//                   </View>
//                 </View>
//                 <View style={styles.progressBar}>
//                   <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: item.color, opacity: 0.9 }]} />
//                 </View>
//               </View>
//             );
//           })}
          
//           <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
//             <Text style={styles.expandText}>Hide Details</Text>
//             <Text style={[styles.chevron, { transform: [{ rotate: '180deg' }] }]}>∨</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>🔗 Link Investments</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
//           <Text style={styles.buttonText}>✓ Mark as Done</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const HealthInsuranceCard = ({ coverage, formatAmount, isActive, familySize, targetCoverage }) => {
//  const currentPercentage = targetCoverage > 0 ? Math.round((coverage / (targetCoverage*100000)) * 100) : 0;
//   const gap = Math.max(0, (targetCoverage*100000) - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
//           <Text style={styles.iconEmoji}>❤️</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Health Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Protection'}</Text>
//           </View>
//         </View>
//          <View style={styles.familyInfo}>
//           <Text style={styles.familyIcon}>👥</Text>
//           <Text style={styles.familyText}>{familySize} {familySize === 1 ? 'Member' : 'Members'}</Text>
//         </View>
//       </View>

//       <View style={styles.insuranceCenter}>
//         <View style={styles.circularProgress}>
//           <View style={styles.circularInner}>
//             <Text style={styles.circularAmount}>{formatAmount(targetCoverage)}Lacs</Text>
//             <Text style={styles.circularLabel}>Recommended Coverage</Text>
//                   <Text style={styles.percentageText}>{currentPercentage}%</Text>
//           <Text style={styles.percentageLabel}>Current Coverage</Text>
//           </View>
//         </View>
//         {/* <View style={styles.percentageBox}>
    
//         </View> */}
//       </View>

//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>⚠️ Coverage Gap</Text>
//          <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>🔗Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const LifeInsuranceCard = ({ coverage, formatAmount, isActive, familySize, targetCoverage }) => {
//   const gap = Math.max(0, (targetCoverage*100000) - coverage);

//   return (
//     <View style={styles.card}>
//       <View style={styles.cardHeader}>
//         <View style={[styles.iconBox, { backgroundColor: 'rgba(249, 115, 22, 0.2)' }]}>
//           <Text style={styles.iconEmoji}>🔺</Text>
//         </View>
//         <View style={styles.cardTitleContainer}>
//           <Text style={styles.cardTitle}>Life Insurance</Text>
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Security'}</Text>
//           </View>
//         </View>
//          <View style={styles.familyInfo}>
//           <Text style={styles.familyIcon}>👥</Text>
//           <Text style={styles.familyText}>{familySize} Protected</Text>
//         </View>
//       </View>

//       <View style={styles.lifeCenter}>
//         <Text style={styles.lifeAmount}>{formatAmount(coverage)}</Text>
//         <Text style={styles.lifeLabel}>Coverage Amount</Text>
//       </View>

//       <View style={styles.insuranceStatsRow}>
//         <View style={[styles.insuranceStat, { flex: 1 }]}>
//           <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
//           <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
//         </View>
//         <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
//           <Text style={styles.insuranceStatLabel}>📈 Coverage Gap</Text>
//         <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
//           {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
//         </View>
//       </View>

//       <View style={styles.buttonColumn}>
//         <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//           <Text style={styles.buttonText}>🔗Link Policies</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//           <Text style={styles.buttonText}>Discover Policies</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const GoalsCard = ({ goals, currentIndex, onIndexChange, formatAmount }) => {
//     const getGoalIcon = (goalName) => {
//   const name = goalName?.toLowerCase() || '';
//   if (name.includes('home') || name.includes('house')) return '🏠';
//   if (name.includes('car') || name.includes('vehicle')) return '🚗';
//   if (name.includes('travel') || name.includes('trip') || name.includes('vacation')) return '✈️';
//   if (name.includes('education') || name.includes('study')) return '🎓';
//   if (name.includes('marriage') || name.includes('wedding')) return '💍';
//   if (name.includes('child') || name.includes('baby')) return '👶';
//   if (name.includes('business') || name.includes('startup')) return '💼';
//   if (name.includes('gadget') || name.includes('laptop') || name.includes('phone')) return '📱';
//   if (name.includes('retirement')) return '🏖️';
//   return '🎯'; // default
// };
//   return (
//     <View style={styles.goalsContainer}>
//       <ScrollView
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         snapToInterval={screenWidth - 32}
//         decelerationRate="fast"
//         onMomentumScrollEnd={(e) => {
//           const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 32));
//           onIndexChange(index);
//         }}
//       >
//         {goals.map((goal, index) => (
//           <View key={index} style={[styles.goalCard, { width: screenWidth - 32 }]}>
//             <View style={styles.goalHeader}>
//               <View style={styles.goalIconBox}>
//                 <Text style={styles.goalIcon}>{getGoalIcon(goal.name)}</Text>
//               </View>
//               <View style={styles.goalTitleContainer}>
//                 <Text style={styles.goalName}>{goal.name}</Text>
//                 <View style={styles.goalBadge}>
//                   <Text style={styles.goalBadgeText}>⚠️ Needs Attention</Text>
//                 </View>
//               </View>
//               <View style={styles.goalMonthly}>
//                 <Text style={styles.goalMonthlyLabel}>Monthly SIP</Text>
//                <Text style={styles.goalMonthlyValue}>{formatAmount(goal.customAllocation || 0)}</Text>
//               </View>
//             </View>

//             <Text style={styles.goalProgress}>Achievement Progress</Text>
//             <View style={styles.goalProgressBar}>
//               <View style={[styles.goalProgressFill, { width: '0%' }]} />
//             </View>
//             <Text style={styles.goalProgressText}>0%</Text>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>🎯</Text>
//                 <Text style={styles.goalStatLabel}>Target Amount</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>⏰</Text>
//                 <Text style={styles.goalStatLabel}>Time Left</Text>
//                 <Text style={styles.goalStatValue}>{goal.timePeriod} years left</Text>
//               </View>
//             </View>

//             <View style={styles.goalStatsRow}>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>₹</Text>
//                 <Text style={styles.goalStatLabel}>Current</Text>
//                 <Text style={styles.goalStatValue}>₹0</Text>
//               </View>
//               <View style={styles.goalStat}>
//                 <Text style={styles.goalStatIcon}>📈</Text>
//                 <Text style={styles.goalStatLabel}>Remaining</Text>
//                 <Text style={styles.goalStatValue}>{formatAmount(goal.calculatedAmount || 0)}</Text>
//               </View>
//             </View>

//             <View style={styles.buttonColumn}>
//               <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
//                 <Text style={styles.buttonText}>🔗Link Investments</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
//                 <Text style={styles.buttonText}>Discover Funds</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         ))}
//       </ScrollView>

//       <View style={styles.dotsContainer}>
//         {goals.map((_, idx) => (
//           <View key={idx} style={[styles.dot, idx === currentIndex && styles.dotActive]} />
//         ))}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//     paddingHorizontal: 16,
//     paddingTop: 25,
//   },
//   header: {
//     marginTop: 24,
//     marginBottom: 16,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 26,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   headerName: {
//     color: '#fff',
//   },
//   headerBrand: {
//     color: '#fb923c', // orange-400
//   },
//   // 🎨 UPDATED: Card styling to match web
//   card: {
//     backgroundColor: 'rgba(17, 24, 39, 0.6)', // gray-900/60 - darker
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 24, // p-6
//     marginBottom: 16,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 24, // mb-6
//   },
//   // 🎨 UPDATED: Icon box styling
//   iconBox: {
//     width: 56, // w-14
//     height: 56, // h-14
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   iconText: {
//     fontSize: 28,
//     color: '#10b981',
//     fontWeight: '700',
//   },
//   iconEmoji: {
//     fontSize: 28,
//   },
//   cardTitleContainer: {
//     flex: 1,
//   },
//   // 🎨 UPDATED: Text sizing
//   cardTitle: {
//     fontSize: 20, // text-xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   cardSubtitle: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af', // gray-400
//   },
//   editIcon: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//   },
//   editIconText: {
//     fontSize: 16,
//     color: '#9ca3af',
//   },
//   // 🎨 UPDATED: Badge styling
//   badge: {
//     marginTop: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(168, 85, 247, 0.15)', // purple-500/15
//     borderWidth: 1,
//     borderColor: 'rgba(168, 85, 247, 0.3)', // purple-500/30
//     borderRadius: 999,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     alignSelf: 'flex-start',
//   },
//   badgeText: {
//     fontSize: 12, // text-xs
//     color: '#d8b4fe', // purple-300
//     fontWeight: '600',
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 16,
//   },
//   statBox: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statLabel: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     marginBottom: 4,
//   },
//   statValue: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//   },
//   riskContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   riskCircleOuter: {
//     width: 64, // w-16
//     height: 64, // h-16
//     borderRadius: 32,
//     borderWidth: 4,
//     borderColor: '#374151', // gray-700
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskCircleInner: {
//     width: 48, // w-12
//     height: 48, // h-12
//     borderRadius: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riskPercentage: {
//     color: '#fff',
//     fontSize: 14, // text-sm
//     fontWeight: '700',
//   },
//   riskCategory: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     marginBottom: 4,
//   },
//   riskKeywords: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//   },
//   amountRight: {
//     alignItems: 'flex-end',
//   },
//   amountLarge: {
//     fontSize: 24, // text-2xl
//     fontWeight: '700',
//     color: '#fff',
//   },
//   amountSubtext: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginTop: 4,
//     textAlign: 'right',
//   },
//   // 🎨 UPDATED: Expand button
//   expandButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 14, // p-3.5
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//     flexDirection: 'row',
//     gap: 8,
//   },
//   expandText: {
//     color: '#d1d5db', // gray-300
//     fontSize: 14, // text-sm
//     fontWeight: '500',
//   },
//   chevron: {
//     color: '#9ca3af',
//     fontSize: 14,
//   },
//   // 🎨 UPDATED: Breakdown section
//   breakdownSection: {
//     marginBottom: 16,
//     paddingTop: 24,
//     borderTopWidth: 1,
//     borderTopColor: 'rgba(255, 255, 255, 0.1)',
//     marginHorizontal: -24,
//     paddingHorizontal: 24,
//     paddingBottom: 24,
//   },
//   breakdownTitle: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     fontWeight: '600',
//     marginBottom: 20,
//   },
//   breakdownItem: {
//     marginBottom: 16,
//   },
//   breakdownRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   breakdownLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   // 🎨 NEW: Icon box for breakdown items
//   breakdownIconBox: {
//     width: 32,
//     height: 32,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   breakdownIcon: {
//     fontSize: 16,
//   },
//   breakdownLabel: {
//     fontSize: 14, // text-sm
//     color: '#d1d5db', // gray-200
//     fontWeight: '500',
//   },
//   breakdownRight: {
//     alignItems: 'flex-end',
//   },
//   breakdownValue: {
//     fontSize: 14, // text-sm
//     color: '#fff',
//     fontWeight: '700',
//   },
//   breakdownPercent: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginTop: 2,
//   },
//   // 🎨 UPDATED: Progress bar
//   progressBar: {
//     height: 8,
//     backgroundColor: 'rgba(17, 24, 39, 0.8)', // darker
//     borderRadius: 4,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     borderRadius: 4,
//   },
//   buttonColumn: {
//     gap: 12,
//   },
//   // 🎨 UPDATED: Button styling with shadows
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 14, // py-3.5
//     paddingHorizontal: 16,
//     borderRadius: 12,
//     gap: 8,
//   },
//   primaryButton: {
//     backgroundColor: 'rgba(168, 85, 247, 0.3)',
//     borderWidth: 1,
//     borderColor: '#a44df6',
//   },
//   secondaryButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   orangeButton: {
//     backgroundColor: 'rgba(255, 106, 0, 0.3)',
//     borderWidth: 1,
//     borderColor: 'rgba(249, 115, 22, 0.6)',
//   },
//   buttonIcon: {
//     fontSize: 16,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 14, // text-sm
//     fontWeight: '600',
    
//   },
//   insuranceCenter: {
//     alignItems: 'center',
//     marginVertical: 24,
//   },
//   // 🎨 UPDATED: Circular progress
//   circularProgress: {
//     width: 180,
//     height: 180,
//     borderRadius: 90,
//     borderWidth: 10,
//     borderColor: 'rgba(31, 41, 55, 0.8)', // darker
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//   },
//   circularInner: {
//     alignItems: 'center',
//   },
//   circularAmount: {
//     fontSize: 24, // text-2xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   circularLabel: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     textAlign: 'center',
//   },
//   percentageBox: {
//     alignItems: 'center',
//   },
//   percentageText: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     color: '#fff',
//   },
//   percentageLabel: {
//     fontSize: 12, // text-xs
//     color: '#6b7280',
//   },
//   insuranceStatsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 24,
//   },
//   insuranceStat: {
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
    
//   },
//  insuranceStatAlert: {
//   backgroundColor: 'rgba(239, 68, 68, 0.1)',
//   borderColor: '#ef4444',
//   borderWidth: 1.5,
//   shadowColor: '#ef4444',

// },
//   insuranceStatLabel: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginBottom: 8,
//   },
//   insuranceStatValue: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     color: '#fff',
//   },
//   alertText: {
//     fontSize: 10,
//     color: '#ef4444',
//     fontWeight: '600',
//     marginTop: 4,
//   },
//   lifeCenter: {
//     alignItems: 'center',
//     marginVertical: 24,
//   },
//   lifeAmount: {
//     fontSize: 36, // text-3xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   lifeLabel: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//   },
//   goalsContainer: {
//     marginBottom: 16,
//   },
//   goalCard: {
//     backgroundColor: 'rgba(17, 24, 39, 0.6)',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 24,
//     marginRight: 0,
//   },
//   goalHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   goalIconBox: {
//     width: 56,
//     height: 56,
//     borderRadius: 12,
//     backgroundColor: 'rgba(249, 115, 22, 0.3)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   goalIcon: {
//     fontSize: 28,
//   },
//   goalTitleContainer: {
//     flex: 1,
//   },
//   goalName: {
//     fontSize: 20, // text-xl
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   goalBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(249, 115, 22, 0.15)',
//     borderWidth: 1,
//     borderColor: 'rgba(249, 115, 22, 0.3)',
//     borderRadius: 999,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     alignSelf: 'flex-start',
//   },
//   goalBadgeText: {
//     fontSize: 12,
//     color: '#fb923c', // orange-400
//     fontWeight: '600',
//   },
//   goalMonthly: {
//     alignItems: 'flex-end',
//   },
//   goalMonthlyLabel: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     marginBottom: 4,
//   },
//   goalMonthlyValue: {
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     color: '#fff',
//   },
//   goalProgress: {
//     fontSize: 14, // text-sm
//     color: '#9ca3af',
//     marginBottom: 8,
//   },
//   goalProgressBar: {
//     height: 12, // h-3
//     backgroundColor: 'rgba(17, 24, 39, 0.8)',
//     borderRadius: 6,
//     overflow: 'hidden',
//     marginBottom: 8,
//   },
//   goalProgressFill: {
//     height: '100%',
//     backgroundColor: '#a855f7',
//     borderRadius: 6,
//   },
//   goalProgressText: {
//     fontSize: 14, // text-sm
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 16,
//   },
//   goalStatsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 12,
//   },
//   goalStat: {
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     padding: 12,
//   },
//   goalStatIcon: {
//     fontSize: 14,
//     marginBottom: 6,
//   },
//   goalStatLabel: {
//     fontSize: 12, // text-xs
//     color: '#9ca3af',
//     marginBottom: 6,
//   },
//   goalStatValue: {
//     fontSize: 14, // text-sm
//     fontWeight: '700',
//     color: '#fff',
//   },
//   dotsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 8,
//     marginTop: 16,
//   },
//   dot: {
//     width: 8, // w-2
//     height: 8, // h-2
//     borderRadius: 4,
//     backgroundColor: '#4b5563', // gray-600
//   },
//   dotActive: {
//     width: 32, // w-8
//     backgroundColor: '#a855f7',
//   },
//   // 🎨 UPDATED: Loading modal
//   loadingModal: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   loadingContent: {
//     backgroundColor: 'rgba(17, 24, 39, 0.9)', // gray-900/90
//     borderRadius: 20,
//     padding: 24,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     minWidth: 200,
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 18, // text-lg
//     fontWeight: '700',
//     marginTop: 16,
//     textAlign: 'center',
//   },
//   loadingSubtext: {
//     color: '#9ca3af',
//     fontSize: 14, // text-sm
//     marginTop: 8,
//     textAlign: 'center',
//   },
//   familyInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   familyIcon: {
//     fontSize: 14,
//   },
//   familyText: {
//     fontSize: 14,
//     color: '#9ca3af',
//     fontWeight: '500',
//   },
// });

// export default DashboardHome;
import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../../src/config/firebase';

const { width: screenWidth } = Dimensions.get('window');
const LAKH_DIVISOR = 100000;

const DashboardHome = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [expandedCards, setExpandedCards] = useState({});

  // 🔥 HELPER: Convert K format to Rupees (EXACT SAME AS WEB)
  const parseAmount = (value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value * 1000;
    if (typeof value === 'string') {
      const numValue = parseInt(value.replace(/\D/g, '')) || 0;
      return numValue * 1000;
    }
    return 0;
  };

  // 🔥 Fetch data from Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        let phoneNumber = await AsyncStorage.getItem('user_phone');

        if (!phoneNumber) {
          setLoading(false);
          return;
        }

        // Remove +91 prefix if present (Firebase stores without country code)
        if (phoneNumber.startsWith('+91')) {
          phoneNumber = phoneNumber.substring(3);
        }
        
        const docRef = doc(db, 'questionnaire_submissions', phoneNumber);
        const userDoc = await getDoc(docRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          
          if (data.raw_answers) {
            setUserData({ raw_answers: data.raw_answers });
          } else {
            setLoading(false);
            return;
          }
        } else {
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Firebase fetch error:', error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // 🔥 Calculate Total Income (USING parseAmount LIKE WEB)
  const totalIncome = useMemo(() => {
    if (!userData?.raw_answers?.income_data) return 0;
    
    let total = 0;
    Object.values(userData.raw_answers.income_data).forEach(income => {
      if (income && income.has && income.amount) {
        total += parseAmount(income.amount);
      }
    });
    
    return total;
  }, [userData]);

  // 🔥 Calculate Total Expenses (USING parseAmount LIKE WEB)
  const totalExpenses = useMemo(() => {
    if (!userData?.raw_answers) return 0;
    
    let total = 0;

    // Loan EMIs
    if (userData.raw_answers.loan_data) {
      Object.values(userData.raw_answers.loan_data).forEach(loan => {
        if (loan && loan.has && loan.emi) {
          total += parseAmount(loan.emi);
        }
      });
    }

    // House expenses
    if (userData.raw_answers.house_expenses) {
      Object.values(userData.raw_answers.house_expenses).forEach(expense => {
        if (expense) {
          total += parseAmount(expense);
        }
      });
    }

    // Child expenses
    if (userData.raw_answers.child_monthly_expense) {
      total += parseAmount(userData.raw_answers.child_monthly_expense);
    }

    // Dependent expenses
    if (userData.raw_answers.dependent_expenses) {
      Object.values(userData.raw_answers.dependent_expenses).forEach(expense => {
        if (expense) {
          total += parseAmount(expense);
        }
      });
    }

    return total;
  }, [userData]);

  const savings = totalIncome - totalExpenses;

  const formatAmount = (amount) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount.toFixed(0)}`;
  };

  // 🔥 Get user name (MATCHING WEB LOGIC)
  const getUserName = () => {
    const fullName = userData?.raw_answers?.fullName || 
                     userData?.raw_answers?.user_data?.fullName || 
                     'User';
    const firstName = fullName.split(' ')[0] || 'User';
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  // 🔥 Get Risk Profile (EXACT SAME AS WEB)
  const riskCapacity = userData?.raw_answers?.risk_assessment?.riskCapacity || 0;
  const riskCategory = userData?.raw_answers?.risk_assessment?.riskCategory || 'Not Assessed';
  const keywords = userData?.raw_answers?.risk_assessment?.keywords || 'Complete assessment';

  const getRiskColor = (score) => {
    if (score <= 30) return '#ef4444';
    if (score <= 45) return '#f59e0b';
    if (score <= 60) return '#eab308';
    return '#10b981';
  };
  const riskColor = getRiskColor(riskCapacity);

  // 🔥 Emergency Fund (EXACT SAME AS WEB)
  const efData = userData?.raw_answers?.emergency_funds;
  const selectedLayer = efData?.approach || 'foundation';
  const layerData = efData?.[`${selectedLayer}_layer`] || efData?.foundation_layer;
  
  // ✅ Emergency fund amounts are stored in K format, convert to rupees
  const totalEmergencyFund = layerData?.amount ? parseAmount(layerData.amount) : 0;

  // 🔥 Family Size (EXACT SAME AS WEB)
  const familySize = useMemo(() => {
    if (!userData?.raw_answers?.dependents) return 1;
    const dependents = userData.raw_answers.dependents;
    return 1 + (dependents.spouse || 0) + (dependents.child || 0) + (dependents.parent || 0);
  }, [userData]);

  // 🔥 Health Insurance (EXACT SAME AS WEB)
  const healthInsurance = userData?.raw_answers?.insurance_data?.health;
  
  // Insurance sum_insured is stored as lakhs in K format (200 = 2 lakhs)
  // We need to convert: 200 → 2 lakhs → 200,000 rupees
  const healthCoverage = healthInsurance?.has 
    ? (parseFloat(healthInsurance.sum_insured || 0) * 1000) // K to rupees (200K → 200,000)
    : 0;
  
  const healthTargetCoverage = healthInsurance?.targetCoverage 
    ? healthInsurance.targetCoverage * 1000  // Convert K to rupees (1000K → 1,000,000 rupees = 10 lakhs)
    : (familySize * 500000); // Default 5 lakhs per person

  // 🔥 Life Insurance (EXACT SAME AS WEB)
  const lifeInsurance = userData?.raw_answers?.insurance_data?.life;
  
  const lifeCoverage = lifeInsurance?.has 
    ? (parseFloat(lifeInsurance.sum_insured || 0) * 1000) // K to rupees
    : 0;
  
  const lifeTargetCoverage = lifeInsurance?.targetCoverage 
    ? lifeInsurance.targetCoverage * 1000  // Convert K to rupees (18000K → 18,000,000 rupees = 180 lakhs)
    : Math.round(totalIncome * 10); // Default 10x annual income

  // 🔥 Goals (EXACT SAME AS WEB - handles nested .goals structure)
  const goals = Array.isArray(userData?.raw_answers?.goal_allocations) 
    ? userData.raw_answers.goal_allocations 
    : (userData?.raw_answers?.goal_allocations?.goals || []);

  const toggleExpand = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  if (loading) {
    return (
      <Modal transparent visible={loading} animationType="fade">
        <View style={styles.loadingModal}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#a855f7" />
            <Text style={styles.loadingText}>Loading Dashboard</Text>
            <Text style={styles.loadingSubtext}>Fetching your financial data...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <Text style={styles.headerName}>{getUserName()}'s </Text>
          <Text style={styles.headerBrand}>GoWealthy </Text>
          <Text style={styles.headerName}>Journey</Text>
        </Text>
      </View>

      <CashFlowCard 
        totalIncome={totalIncome} 
        totalExpenses={totalExpenses} 
        savings={savings} 
        formatAmount={formatAmount} 
      />
      
      <RiskProfileCard 
        riskCapacity={riskCapacity} 
        riskCategory={riskCategory} 
        keywords={keywords} 
        riskColor={riskColor} 
      />
      
      {efData && (
        <EmergencyFundCard
          layerName={selectedLayer.charAt(0).toUpperCase() + selectedLayer.slice(1)}
          totalAmount={totalEmergencyFund}
          layerData={layerData}
          formatAmount={formatAmount}
          expanded={expandedCards['emergency']}
          onToggle={() => toggleExpand('emergency')}
          parseAmount={parseAmount}
        />
      )}

      <HealthInsuranceCard 
        coverage={healthCoverage} 
        formatAmount={formatAmount} 
        isActive={healthInsurance?.has} 
        familySize={familySize} 
        targetCoverage={healthTargetCoverage} 
      />
      
      <LifeInsuranceCard 
        coverage={lifeCoverage} 
        formatAmount={formatAmount} 
        isActive={lifeInsurance?.has} 
        familySize={familySize} 
        targetCoverage={lifeTargetCoverage} 
      />

      {goals.length > 0 && (
        <GoalsCard 
          goals={goals} 
          currentIndex={currentGoalIndex} 
          onIndexChange={setCurrentGoalIndex} 
          formatAmount={formatAmount}
          parseAmount={parseAmount}
        />
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const CashFlowCard = ({ totalIncome, totalExpenses, savings, formatAmount }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
        <Text style={styles.iconText}>₹</Text>
      </View>
      <View style={styles.cardTitleContainer}>
        <Text style={styles.cardTitle}>Your CashFlow</Text>
        <Text style={styles.cardSubtitle}>Income, Expenses & Savings</Text>
      </View>
    </View>
    <View style={styles.statsGrid}>
      <View style={styles.statBox}>
        <Text style={styles.statLabel}>Income</Text>
        <Text style={[styles.statValue, { color: '#10b981' }]}>{formatAmount(totalIncome)}</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statLabel}>Expenses</Text>
        <Text style={[styles.statValue, { color: '#ef4444' }]}>{formatAmount(totalExpenses)}</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statLabel}>Savings</Text>
        <Text style={[styles.statValue, { color: '#3b82f6' }]}>{formatAmount(savings)}</Text>
      </View>
    </View>
  </View>
);

const RiskProfileCard = ({ riskCapacity, riskCategory, keywords, riskColor }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={[styles.iconBox, { backgroundColor: `${riskColor}20` }]}>
        <Text style={styles.iconEmoji}>🎯</Text>
      </View>
      <View style={styles.cardTitleContainer}>
        <Text style={styles.cardTitle}>Your Risk Profile</Text>
        <Text style={styles.cardSubtitle}>Psychology-based assessment</Text>
      </View>
    </View>
    <View style={styles.riskContent}>
      <View style={styles.riskCircleOuter}>
        <View style={[styles.riskCircleInner, { backgroundColor: riskColor }]}>
          <Text style={styles.riskPercentage}>{Math.round(riskCapacity)}%</Text>
        </View>
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={[styles.riskCategory, { color: riskColor }]}>
          {riskCategory}
        </Text>
        <Text style={styles.riskKeywords}>{keywords}</Text>
      </View>
    </View>
  </View>
);

const EmergencyFundCard = ({ layerName, totalAmount, layerData, formatAmount, expanded, onToggle, parseAmount }) => {
  const getLayerColor = (name) => {
    const colors = { Foundation: '#a855f7', Intermediate: '#f97316', Fortress: '#a855f7' };
    return colors[name] || '#a855f7';
  };
  const color = getLayerColor(layerName);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: `${color}30` }]}>
          <Text style={[styles.iconEmoji, { fontSize: 28 }]}>⚡</Text>
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>Emergency Fund</Text>
          <Text style={styles.cardSubtitle}>Extended family & vehicle coverage</Text>
        </View>
        <View style={styles.amountRight}>
          <Text style={styles.amountLarge}>{formatAmount(totalAmount)}</Text>
          <Text style={styles.amountSubtext}>{layerName} Layer</Text>
        </View>
      </View>

      {!expanded && (
        <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
          <Text style={styles.expandText}>View Breakdown</Text>
          <Text style={styles.chevron}>∨</Text>
        </TouchableOpacity>
      )}

      {expanded && layerData && (
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownTitle}>Coverage Breakdown</Text>
          {[
            { label: 'Medical', value: layerData.medical, icon: '❤️', color: '#a855f7' },
            { label: 'EMI', value: layerData.emi, icon: '💳', color: '#f97316' },
            { label: 'Work Security', value: layerData.work_security, icon: '💼', color: '#a855f7' },
            { label: 'House', value: layerData.house, icon: '🏠', color: '#f97316' },
            { label: 'Vehicle', value: layerData.vehicle, icon: '🚗', color: '#a855f7' }
          ].map((item, idx) => {
            // Convert K to rupees for display
            const valueInRupees = parseAmount(item.value || 0);
            const percentage = totalAmount > 0 ? ((valueInRupees / totalAmount) * 100) : 0;
            
            return (
              <View key={idx} style={styles.breakdownItem}>
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.breakdownIconBox, { backgroundColor: `${item.color}30` }]}>
                      <Text style={styles.breakdownIcon}>{item.icon}</Text>
                    </View>
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={styles.breakdownValue}>{formatAmount(valueInRupees)}</Text>
                    <Text style={styles.breakdownPercent}>{percentage.toFixed(1)}%</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: item.color, opacity: 0.9 }]} />
                </View>
              </View>
            );
          })}
          
          <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
            <Text style={styles.expandText}>Hide Details</Text>
            <Text style={[styles.chevron, { transform: [{ rotate: '180deg' }] }]}>∨</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonColumn}>
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
          <Text style={styles.buttonText}>🔗 Link Investments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
          <Text style={styles.buttonText}>✓ Mark as Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const HealthInsuranceCard = ({ coverage, formatAmount, isActive, familySize, targetCoverage }) => {
  // targetCoverage is already in rupees
  const currentPercentage = targetCoverage > 0 ? Math.round((coverage / targetCoverage) * 100) : 0;
  const gap = Math.max(0, targetCoverage - coverage);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
          <Text style={styles.iconEmoji}>❤️</Text>
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>Health Insurance</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Protection'}</Text>
          </View>
        </View>
        <View style={styles.familyInfo}>
          <Text style={styles.familyIcon}>👥</Text>
          <Text style={styles.familyText}>{familySize} {familySize === 1 ? 'Member' : 'Members'}</Text>
        </View>
      </View>

      <View style={styles.insuranceCenter}>
        <View style={styles.circularProgress}>
          <View style={styles.circularInner}>
            <Text style={styles.circularAmount}>{formatAmount(targetCoverage)}</Text>
            <Text style={styles.circularLabel}>Recommended Coverage</Text>
            <Text style={styles.percentageText}>{currentPercentage}%</Text>
            <Text style={styles.percentageLabel}>Current Coverage</Text>
          </View>
        </View>
      </View>

      <View style={styles.insuranceStatsRow}>
        <View style={[styles.insuranceStat, { flex: 1 }]}>
          <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
          <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
        </View>
        <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
          <Text style={styles.insuranceStatLabel}>⚠️ Coverage Gap</Text>
          <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
          {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
        </View>
      </View>

      <View style={styles.buttonColumn}>
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
          <Text style={styles.buttonText}>🔗Link Policies</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
          <Text style={styles.buttonText}>Discover Policies</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const LifeInsuranceCard = ({ coverage, formatAmount, isActive, familySize, targetCoverage }) => {
  // targetCoverage is already in rupees
  const gap = Math.max(0, targetCoverage - coverage);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(249, 115, 22, 0.2)' }]}>
          <Text style={styles.iconEmoji}>🔺</Text>
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>Life Insurance</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🛡️ {isActive ? 'Active' : 'Needs Security'}</Text>
          </View>
        </View>
        <View style={styles.familyInfo}>
          <Text style={styles.familyIcon}>👥</Text>
          <Text style={styles.familyText}>{familySize} Protected</Text>
        </View>
      </View>

      <View style={styles.lifeCenter}>
        <Text style={styles.lifeAmount}>{formatAmount(coverage)}</Text>
        <Text style={styles.lifeLabel}>Coverage Amount</Text>
      </View>

      <View style={styles.insuranceStatsRow}>
        <View style={[styles.insuranceStat, { flex: 1 }]}>
          <Text style={styles.insuranceStatLabel}>🛡️ Current Coverage</Text>
          <Text style={styles.insuranceStatValue}>{formatAmount(coverage)}</Text>
        </View>
        <View style={[styles.insuranceStat, { flex: 1 }, gap > 0 && styles.insuranceStatAlert]}>
          <Text style={styles.insuranceStatLabel}>📈 Coverage Gap</Text>
          <Text style={[styles.insuranceStatValue, gap > 0 && { color: '#ef4444' }]}>{formatAmount(gap)}</Text>
          {gap > 0 && <Text style={styles.alertText}>⚠️ Needs Attention</Text>}
        </View>
      </View>

      <View style={styles.buttonColumn}>
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
          <Text style={styles.buttonText}>🔗Link Policies</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
          <Text style={styles.buttonText}>Discover Policies</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const GoalsCard = ({ goals, currentIndex, onIndexChange, formatAmount, parseAmount }) => {
  const getGoalIcon = (goalName) => {
    const name = goalName?.toLowerCase() || '';
    if (name.includes('home') || name.includes('house')) return '🏠';
    if (name.includes('car') || name.includes('vehicle')) return '🚗';
    if (name.includes('travel') || name.includes('trip') || name.includes('vacation')) return '✈️';
    if (name.includes('education') || name.includes('study')) return '🎓';
    if (name.includes('marriage') || name.includes('wedding')) return '💍';
    if (name.includes('child') || name.includes('baby')) return '👶';
    if (name.includes('business') || name.includes('startup')) return '💼';
    if (name.includes('gadget') || name.includes('laptop') || name.includes('phone')) return '📱';
    if (name.includes('retirement')) return '🏖️';
    return '🎯';
  };

  return (
    <View style={styles.goalsContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={screenWidth - 32}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 32));
          onIndexChange(index);
        }}
      >
        {goals.map((goal, index) => {
          // Convert K to rupees
          const customAllocationRupees = parseAmount(goal.customAllocation || 0);
          const calculatedAmountRupees = parseAmount(goal.calculatedAmount || 0);
          
          return (
            <View key={index} style={[styles.goalCard, { width: screenWidth - 32 }]}>
              <View style={styles.goalHeader}>
                <View style={styles.goalIconBox}>
                  <Text style={styles.goalIcon}>{getGoalIcon(goal.name)}</Text>
                </View>
                <View style={styles.goalTitleContainer}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <View style={styles.goalBadge}>
                    <Text style={styles.goalBadgeText}>⚠️ Needs Attention</Text>
                  </View>
                </View>
                <View style={styles.goalMonthly}>
                  <Text style={styles.goalMonthlyLabel}>Monthly SIP</Text>
                  <Text style={styles.goalMonthlyValue}>{formatAmount(customAllocationRupees)}</Text>
                </View>
              </View>

              <Text style={styles.goalProgress}>Achievement Progress</Text>
              <View style={styles.goalProgressBar}>
                <View style={[styles.goalProgressFill, { width: '0%' }]} />
              </View>
              <Text style={styles.goalProgressText}>0%</Text>

              <View style={styles.goalStatsRow}>
                <View style={styles.goalStat}>
                  <Text style={styles.goalStatIcon}>🎯</Text>
                  <Text style={styles.goalStatLabel}>Target Amount</Text>
                  <Text style={styles.goalStatValue}>{formatAmount(calculatedAmountRupees)}</Text>
                </View>
                <View style={styles.goalStat}>
                  <Text style={styles.goalStatIcon}>⏰</Text>
                  <Text style={styles.goalStatLabel}>Time Left</Text>
                  <Text style={styles.goalStatValue}>{goal.timePeriod} years left</Text>
                </View>
              </View>

              <View style={styles.goalStatsRow}>
                <View style={styles.goalStat}>
                  <Text style={styles.goalStatIcon}>₹</Text>
                  <Text style={styles.goalStatLabel}>Current</Text>
                  <Text style={styles.goalStatValue}>₹0</Text>
                </View>
                <View style={styles.goalStat}>
                  <Text style={styles.goalStatIcon}>📈</Text>
                  <Text style={styles.goalStatLabel}>Remaining</Text>
                  <Text style={styles.goalStatValue}>{formatAmount(calculatedAmountRupees)}</Text>
                </View>
              </View>

              <View style={styles.buttonColumn}>
                <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
                  <Text style={styles.buttonText}>🔗Link Investments</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.orangeButton]}>
                  <Text style={styles.buttonText}>Discover Funds</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.dotsContainer}>
        {goals.map((_, idx) => (
          <View key={idx} style={[styles.dot, idx === currentIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingTop: 25,
  },
  header: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerName: {
    color: '#fff',
  },
  headerBrand: {
    color: '#fb923c',
  },
  card: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconText: {
    fontSize: 28,
    color: '#10b981',
    fontWeight: '700',
  },
  iconEmoji: {
    fontSize: 28,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  badge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    color: '#d8b4fe',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  riskContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskCircleOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskCircleInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskPercentage: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  riskCategory: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  riskKeywords: {
    fontSize: 14,
    color: '#9ca3af',
  },
  amountRight: {
    alignItems: 'flex-end',
  },
  amountLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  amountSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },
  expandButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    gap: 8,
  },
  expandText: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
  },
  chevron: {
    color: '#9ca3af',
    fontSize: 14,
  },
  breakdownSection: {
    marginBottom: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: -24,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  breakdownTitle: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 20,
  },
  breakdownItem: {
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breakdownIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  breakdownIcon: {
    fontSize: 16,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: '500',
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  breakdownPercent: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  buttonColumn: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    borderWidth: 1,
    borderColor: '#a44df6',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  orangeButton: {
    backgroundColor: 'rgba(255, 106, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.6)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  insuranceCenter: {
    alignItems: 'center',
    marginVertical: 24,
  },
  circularProgress: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 10,
    borderColor: 'rgba(31, 41, 55, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  circularInner: {
    alignItems: 'center',
  },
  circularAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  circularLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  percentageLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  insuranceStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  insuranceStat: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  insuranceStatAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
    borderWidth: 1.5,
    shadowColor: '#ef4444',
  },
  insuranceStatLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  insuranceStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  alertText: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 4,
  },
  lifeCenter: {
    alignItems: 'center',
    marginVertical: 24,
  },
  lifeAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  lifeLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  goalsContainer: {
    marginBottom: 16,
  },
  goalCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    marginRight: 0,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  goalIcon: {
    fontSize: 28,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  goalBadgeText: {
    fontSize: 12,
    color: '#fb923c',
    fontWeight: '600',
  },
  goalMonthly: {
    alignItems: 'flex-end',
  },
  goalMonthlyLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  goalMonthlyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  goalProgress: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  goalProgressBar: {
    height: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#a855f7',
    borderRadius: 6,
  },
  goalProgressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  goalStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  goalStat: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  goalStatIcon: {
    fontSize: 14,
    marginBottom: 6,
  },
  goalStatLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
  },
  goalStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4b5563',
  },
  dotActive: {
    width: 32,
    backgroundColor: '#a855f7',
  },
  loadingModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 200,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  familyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  familyIcon: {
    fontSize: 14,
  },
  familyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
});

export default DashboardHome;