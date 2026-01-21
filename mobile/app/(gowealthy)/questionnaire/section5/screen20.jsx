// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StatusBar,
//   StyleSheet,
//   Image,
//   Animated
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useQuestionnaire } from '../../../../src/context/QuestionnaireContext';
// import ScreenScrollView from '../../../../src/components/ScreenScrollView';

// import {
//   colors,
//   globalStyles,
//   isMobile
// } from '../../../../src/theme/globalStyles';

// const Screen20 = () => {
//   const router = useRouter();
//   const { answers, updateAnswer } = useQuestionnaire();

//   const [topGoals, setTopGoals] = useState(answers.top_goals || []);
//   const [typewriterText, setTypewriterText] = useState('');
//   const [showCursor, setShowCursor] = useState(true);
//   const [flippedCards, setFlippedCards] = useState({});

//   const progressData = {
//     sectionData: {
//       1: { isActive: false, progress: 0, isCompleted: true },
//       2: { isActive: false, progress: 0, isCompleted: true },
//       3: { isActive: false, progress: 0, isCompleted: true },
//       4: { isActive: false, progress: 0, isCompleted: true },
//       5: { isActive: true, progress: 50, isCompleted: false },
//       6: { isActive: false, progress: 0, isCompleted: false },
//     }
//   };

//   const sections = [
//     { title: "Start" },
//     { title: "Basic Information" },
//     { title: "Income & Expenses" },
//     { title: "Insurance" },
//     { title: "Goal" },
//     { title: "Psychology" }
//   ];

//   // Get user data for conditions
//   const age = parseInt(answers.age) || 25;
//   const spouseCount = answers.dependents?.spouse || 0;
//   const childCount = answers.dependents?.child || 0;

//   // All possible goal options with images
//   const allGoalOptions = [
//     { 
//       label: "Buy Expensive Gadgets / Appliances", 
//       value: "expensive_gadgets", 
//       image: require('../../../../assets/images/goals/expensive_gadgets.png'),
//       condition: true 
//     },
//     { 
//       label: "Home Renovation", 
//       value: "home_renovation", 
//       image: require('../../../../assets/images/goals/home_renovation.png'),
//       condition: age >= 30 
//     },
//     { 
//       label: "Car Purchase", 
//       value: "car_purchase", 
//       image: require('../../../../assets/images/goals/car_purchase.png'),
//       condition: true 
//     },
//     { 
//       label: "International Holiday", 
//       value: "international_travel", 
//       image: require('../../../../assets/images/goals/international_travel.png'),
//       condition: true 
//     },
//     { 
//       label: "New House Purchase", 
//       value: "house_purchase", 
//       image: require('../../../../assets/images/goals/house_purchase.png'),
//       condition: age >= 30 
//     },
//     { 
//       label: "Start New Venture", 
//       value: "new_venture", 
//       image: require('../../../../assets/images/goals/new_venture.png'),
//       condition: true 
//     },
//     { 
//       label: "Domestic Vacation", 
//       value: "domestic_vacation", 
//       image: require('../../../../assets/images/goals/domestic_vacation.png'),
//       condition: true 
//     },
//     { 
//       label: "Post Graduate Course", 
//       value: "higher_course", 
//       image: require('../../../../assets/images/goals/higher_course.png'),
//       condition: age < 30 
//     },
//     { 
//       label: "Learn a New Skill", 
//       value: "new_skill", 
//       image: require('../../../../assets/images/goals/new_skill.png'),
//       condition: true 
//     },
//     { 
//       label: "Child Education", 
//       value: "child_education", 
//       image: require('../../../../assets/images/goals/child_education.png'),
//       condition: childCount >= 1 
//     },
//     { 
//       label: "Marriage Planning", 
//       value: "own_marriage", 
//       image: require('../../../../assets/images/goals/own_marriage.png'),
//       condition: spouseCount === 0 
//     },
//     { 
//       label: "Planning a Child", 
//       value: "planning_child", 
//       image: require('../../../../assets/images/goals/planning_child.png'),
//       condition: childCount === 0 && spouseCount >= 1 
//     },
//     { 
//       label: "Attending a Concert", 
//       value: "concert", 
//       image: require('../../../../assets/images/goals/concert.png'),
//       condition: age < 30 
//     }
//   ];

//   // Filter goals based on conditions
//   const goalOptions = allGoalOptions.filter(goal => goal.condition);

//   // Typewriter effect
//   useEffect(() => {
//     const fullText = "Select your top 3 goals in order of priority";
//     let currentIndex = 0;

//     const typeInterval = setInterval(() => {
//       if (currentIndex <= fullText.length) {
//         setTypewriterText(fullText.substring(0, currentIndex));
//         currentIndex++;
//       } else {
//         clearInterval(typeInterval);
//         setShowCursor(false);
//       }
//     }, 50);

//     return () => clearInterval(typeInterval);
//   }, []);

//   // Ensure topGoals only contains valid options
//   useEffect(() => {
//     const validGoals = topGoals.filter(goal => 
//       goalOptions.some(option => option.value === goal)
//     );
//     if (validGoals.length !== topGoals.length) {
//       setTopGoals(validGoals);
//     }
//   }, []);

//   const maxSelections = 3;

//   const handleAnswer = (value) => {
//     setTopGoals(prev => {
//       const currentSelections = prev || [];

//       if (currentSelections.includes(value)) {
//         // Remove selection
//         setFlippedCards(prevFlipped => ({ ...prevFlipped, [value]: false }));
//         return currentSelections.filter(item => item !== value);
//       } else if (currentSelections.length < maxSelections) {
//         // Add selection if under limit
//         setFlippedCards(prevFlipped => ({ ...prevFlipped, [value]: true }));
//         return [...currentSelections, value];
//       } else {
//         // Don't add if at limit
//         return prev;
//       }
//     });
//   };

//   const handleContinue = () => {
//     if (topGoals?.length > 0) {
//       setTimeout(() => {
//         updateAnswer('top_goals', topGoals);
//         console.log('Top goals selected:', topGoals);
//         router.replace('/(gowealthy)/questionnaire/section5/screen21');
//       }, 500);
//     }
//   };

//   const handleBack = () => {
//     router.back();
//   };

//   const hasValidSelection = topGoals?.length > 0;
//   const hasMaxSelections = topGoals?.length >= maxSelections;

//   // Render typewriter text with colored parts
//   const renderTypewriterText = () => {
//     const parts = typewriterText.split(/(top 3 goals|priority)/g);

//     return (
//       <Text style={styles.questionText}>
//         {parts.map((part, index) => {
//           if (part === 'top 3 goals' || part === 'priority') {
//             return (
//               <Text key={index} style={styles.highlightedText}>
//                 {part}
//               </Text>
//             );
//           }
//           return <Text key={index}>{part}</Text>;
//         })}
//         {showCursor && (
//           <Text style={styles.cursor}>|</Text>
//         )}
//       </Text>
//     );
//   };

//   return (
//     <>
//       <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />

//       <View style={globalStyles.backgroundContainer}>
//         <ScreenScrollView>
//           <View style={globalStyles.appContainer}>
//             <View style={globalStyles.header}>
//               <TouchableOpacity style={globalStyles.backButton} onPress={handleBack}>
//                 <Text style={globalStyles.backButtonText}>Back</Text>
//               </TouchableOpacity>
//               <View style={globalStyles.logo}>
//                 <Text style={globalStyles.sectionTitle}>
//                   Understanding your financial situation
//                 </Text>
//               </View>
//             </View>

//             <View style={globalStyles.progressContainer}>
//               {sections.map((section, index) => (
//                 <View key={index} style={globalStyles.progressStepContainer}>
//                   <View
//                     style={[
//                       globalStyles.progressStep,
//                       progressData?.sectionData?.[index + 1]?.isCompleted && globalStyles.progressStepCompleted,
//                       progressData?.sectionData?.[index + 1]?.isActive && globalStyles.progressStepActive,
//                     ]}
//                   />
//                   {index < sections.length - 1 && (
//                     <View
//                       style={[
//                         globalStyles.progressLine,
//                         progressData?.sectionData?.[index + 1]?.isCompleted && globalStyles.progressLineCompleted,
//                       ]}
//                     />
//                   )}
//                 </View>
//               ))}
//             </View>

//             <View style={globalStyles.questionContainer}>
//               <View style={{ width: '100%', alignItems: 'center' }}>
//                 {renderTypewriterText()}

//                 <View style={styles.goalsGrid}>
//                   {goalOptions.map((option) => {
//                     const isSelected = topGoals?.includes(option.value);
//                     const isDisabled = !isSelected && hasMaxSelections;
//                     const selectionIndex = topGoals.indexOf(option.value);

//                     return (
//                       <TouchableOpacity
//                         key={option.value}
//                         onPress={() => !isDisabled && handleAnswer(option.value)}
//                         disabled={isDisabled}
//                         activeOpacity={0.8}
//                         style={styles.goalCardWrapper}
//                       >
//                         <View style={[
//                           styles.goalCard,
//                           isDisabled && styles.goalCardDisabled
//                         ]}>
//                           {/* Front Side - Brand background */}
//                           {!isSelected && (
//                             <View style={styles.cardFront}>
//                               <Image
//                                 source={require('../../../../assets/images/goals/gochanakya_card2.png')}
//                                 style={styles.brandBackground}
//                                 resizeMode="cover"
//                               />
//                               <View style={styles.frontTextContainer}>
//                                 <Text style={styles.frontText}>{option.label}</Text>
//                               </View>
//                             </View>
//                           )}

//                           {/* Back Side - Goal image */}
//                           {isSelected && (
//                             <View style={styles.cardBack}>
//                               <LinearGradient
//                                 colors={['#8A2BE2', '#9370DB']}
//                                 start={{ x: 0, y: 0 }}
//                                 end={{ x: 1, y: 1 }}
//                                 style={styles.cardBackGradient}
//                               >
//                                 <Image
//                                   source={option.image}
//                                   style={styles.goalImage}
//                                   resizeMode="cover"
//                                 />
                                
//                                 {/* Selection number badge */}
//                                 <View style={styles.selectionBadge}>
//                                   <Text style={styles.selectionBadgeText}>
//                                     {selectionIndex + 1}
//                                   </Text>
//                                 </View>

//                                 {/* Text at top */}
//                                 <View style={styles.backTextContainer}>
//                                   <Text style={styles.backText}>{option.label}</Text>
//                                 </View>

//                                 {/* Shimmer effect */}
//                                 <View style={styles.shimmerOverlay} />
//                               </LinearGradient>
//                             </View>
//                           )}
//                         </View>
//                       </TouchableOpacity>
//                     );
//                   })}
//                 </View>

//                 <Text style={styles.selectionCounter}>
//                   {topGoals?.length || 0} of {maxSelections} selected
//                 </Text>

//                 <View style={[
//                   globalStyles.confirmButton,
//                   !hasValidSelection && globalStyles.confirmButtonDisabled
//                 ]}>
//                   {hasValidSelection ? (
//                     <TouchableOpacity onPress={handleContinue} activeOpacity={0.8}>
//                       <LinearGradient
//                         colors={[colors.gradientPurple1, colors.gradientPurple2]}
//                         start={{ x: 0, y: 0 }}
//                         end={{ x: 1, y: 0 }}
//                         style={globalStyles.buttonInner}
//                       >
//                         <Text style={globalStyles.confirmButtonText}>Continue</Text>
//                       </LinearGradient>
//                     </TouchableOpacity>
//                   ) : (
//                     <View style={globalStyles.buttonInner}>
//                       <Text style={[globalStyles.confirmButtonText, { color: colors.subtitleColor }]}>
//                         Continue
//                       </Text>
//                     </View>
//                   )}
//                 </View>
//               </View>
//             </View>
//           </View>
//         </ScreenScrollView>
//       </View>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   questionText: {
//     fontSize: isMobile ? 20 : 26,
//     fontWeight: '600',
//     color: colors.textColor,
//     textAlign: 'center',
//     marginBottom: isMobile ? 24 : 32,
//     minHeight: isMobile ? 48 : 60,
//     lineHeight: isMobile ? 24 : 30,
//   },

//   highlightedText: {
//     color: '#FF6B35',
//     fontWeight: 'bold',
//   },

//   cursor: {
//     color: colors.textColor,
//     fontWeight: 'bold',
//   },

//   goalsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 16,
//     justifyContent: 'center',
//     maxWidth: isMobile ? 400 : 550,
//     marginBottom: 20,
//   },

//   goalCardWrapper: {
//     width: isMobile ? '45%' : '30%',
//     aspectRatio: 0.8,
//     minHeight: 200,
//   },

//   goalCard: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 16,
//     overflow: 'hidden',
//   },

//   goalCardDisabled: {
//     opacity: 0.4,
//   },

//   cardFront: {
//     width: '100%',
//     height: '100%',
//     position: 'relative',
//   },

//   brandBackground: {
//     width: '100%',
//     height: '100%',
//     position: 'absolute',
//   },

//   frontTextContainer: {
//     position: 'absolute',
//     width: '100%',
//     height: '100%',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 12,
//   },

//   frontText: {
//     fontSize: 14,
//     textAlign: 'center',
//     lineHeight: 18,
//     fontWeight: '500',
//     color: 'white',
//     backgroundColor: 'rgb(213, 131, 72)',
//     padding: 8,
//     borderRadius: 8,
//     maxWidth: 140,
//   },

//   cardBack: {
//     width: '100%',
//     height: '100%',
//   },

//   cardBackGradient: {
//     width: '100%',
//     height: '100%',
//     padding: 4,
//     borderRadius: 16,
//     position: 'relative',
//   },

//   goalImage: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 12,
//     position: 'absolute',
//     top: 0,
//     left: 0,
//   },

//   selectionBadge: {
//     position: 'absolute',
//     top: 8,
//     left: 8,
//     backgroundColor: '#FF6B35',
//     borderRadius: 12,
//     width: 24,
//     height: 24,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     elevation: 3,
//     zIndex: 10,
//   },

//   selectionBadgeText: {
//     color: 'white',
//     fontSize: 14,
//     fontWeight: 'bold',
//   },

//   backTextContainer: {
//     position: 'absolute',
//     top: 8,
//     left: 0,
//     right: 0,
//     alignItems: 'center',
//     zIndex: 5,
//   },

//   backText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: 'black',
//     textShadowColor: 'rgba(255,255,255,0.8)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 2,
//     padding: 6,
//     borderRadius: 6,
//     textAlign: 'center',
//     maxWidth: 140,
//   },

//   shimmerOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(255,255,255,0.1)',
//   },

//   selectionCounter: {
//     textAlign: 'center',
//     marginTop: 20,
//     marginBottom: 20,
//     color: colors.subtitleColor,
//     fontSize: isMobile ? 12 : 14,
//   },
// });

// export default Screen20;

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Image,
  Animated,
  Dimensions
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

const Screen20 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();

  const [topGoals, setTopGoals] = useState(answers.top_goals || []);
  const [typewriterText, setTypewriterText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  
  // Animation refs
  const flipAnimations = useRef({}).current;
  const shimmerAnimations = useRef({}).current;

  const progressData = {
    sectionData: {
      1: { isActive: false, progress: 0, isCompleted: true },
      2: { isActive: false, progress: 0, isCompleted: true },
      3: { isActive: false, progress: 0, isCompleted: true },
      4: { isActive: false, progress: 0, isCompleted: true },
      5: { isActive: true, progress: 50, isCompleted: false },
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

  // Get user data for conditions
  const age = parseInt(answers.age) || 25;
  const spouseCount = answers.dependents?.spouse || 0;
  const childCount = answers.dependents?.child || 0;

  // All possible goal options with images
  const allGoalOptions = [
    { 
      label: "Buy Expensive Gadgets / Appliances", 
      value: "expensive_gadgets", 
      image: require('../../../../assets/images/goals/expensive_gadgets.png'),
      condition: true 
    },
    { 
      label: "Home Renovation", 
      value: "home_renovation", 
      image: require('../../../../assets/images/goals/home_renovation.png'),
      condition: age >= 30 
    },
    { 
      label: "Car Purchase", 
      value: "car_purchase", 
      image: require('../../../../assets/images/goals/car_purchase.png'),
      condition: true 
    },
    { 
      label: "International Holiday", 
      value: "international_travel", 
      image: require('../../../../assets/images/goals/international_travel.png'),
      condition: true 
    },
    { 
      label: "New House Purchase", 
      value: "house_purchase", 
      image: require('../../../../assets/images/goals/house_purchase.png'),
      condition: age >= 30 
    },
    { 
      label: "Start New Venture", 
      value: "new_venture", 
      image: require('../../../../assets/images/goals/new_venture.png'),
      condition: true 
    },
    { 
      label: "Domestic Vacation", 
      value: "domestic_vacation", 
      image: require('../../../../assets/images/goals/domestic_vacation.png'),
      condition: true 
    },
    { 
      label: "Post Graduate Course", 
      value: "higher_course", 
      image: require('../../../../assets/images/goals/higher_course.png'),
      condition: age < 30 
    },
    { 
      label: "Learn a New Skill", 
      value: "new_skill", 
      image: require('../../../../assets/images/goals/new_skill.png'),
      condition: true 
    },
    { 
      label: "Child Education", 
      value: "child_education", 
      image: require('../../../../assets/images/goals/child_education.png'),
      condition: childCount >= 1 
    },
    { 
      label: "Marriage Planning", 
      value: "own_marriage", 
      image: require('../../../../assets/images/goals/own_marriage.png'),
      condition: spouseCount === 0 
    },
    { 
      label: "Planning a Child", 
      value: "planning_child", 
      image: require('../../../../assets/images/goals/planning_child.png'),
      condition: childCount === 0 && spouseCount >= 1 
    },
    { 
      label: "Attending a Concert", 
      value: "concert", 
      image: require('../../../../assets/images/goals/concert.png'),
      condition: age < 30 
    }
  ];

  // Filter goals based on conditions
  const goalOptions = allGoalOptions.filter(goal => goal.condition);

  // Initialize animations for each goal option
  useEffect(() => {
    goalOptions.forEach(option => {
      if (!flipAnimations[option.value]) {
        flipAnimations[option.value] = new Animated.Value(0);
      }
      if (!shimmerAnimations[option.value]) {
        shimmerAnimations[option.value] = new Animated.Value(-1);
      }
    });
  }, [goalOptions]);

  // Typewriter effect
  useEffect(() => {
    const fullText = "Select your top 3 goals in order of priority";
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypewriterText(fullText.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setShowCursor(false);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, []);

  // Ensure topGoals only contains valid options
  useEffect(() => {
    const validGoals = topGoals.filter(goal => 
      goalOptions.some(option => option.value === goal)
    );
    if (validGoals.length !== topGoals.length) {
      setTopGoals(validGoals);
    }
  }, []);

  const maxSelections = 3;

  const handleAnswer = (value) => {
    setTopGoals(prev => {
      const currentSelections = prev || [];

      if (currentSelections.includes(value)) {
        // Flip back animation
        Animated.timing(flipAnimations[value], {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start();
        
        // Stop shimmer
        shimmerAnimations[value].setValue(-1);
        
        return currentSelections.filter(item => item !== value);
      } else if (currentSelections.length < maxSelections) {
        // Flip to back animation
        Animated.timing(flipAnimations[value], {
          toValue: 180,
          duration: 600,
          useNativeDriver: true,
        }).start();
        
        // Start shimmer animation
        Animated.loop(
          Animated.timing(shimmerAnimations[value], {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ).start();
        
        return [...currentSelections, value];
      } else {
        return prev;
      }
    });
  };

  const handleContinue = () => {
    if (topGoals?.length > 0) {
      setTimeout(() => {
        updateAnswer('top_goals', topGoals);
        console.log('Top goals selected:', topGoals);
        router.replace('/(gowealthy)/questionnaire/section5/screen21');
      }, 500);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const hasValidSelection = topGoals?.length > 0;
  const hasMaxSelections = topGoals?.length >= maxSelections;

  // Render typewriter text with colored parts
  const renderTypewriterText = () => {
    const parts = typewriterText.split(/(top 3 goals|priority)/g);

    return (
      <Text style={styles.questionText}>
        {parts.map((part, index) => {
          if (part === 'top 3 goals' || part === 'priority') {
            return (
              <Text key={index} style={styles.highlightedText}>
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
        {showCursor && (
          <Text style={styles.cursor}>|</Text>
        )}
      </Text>
    );
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
                  Understanding your financial situation.
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
                {renderTypewriterText()}

                <View style={styles.goalsGrid}>
                  {goalOptions.map((option) => {
                    const isSelected = topGoals?.includes(option.value);
                    const isDisabled = !isSelected && hasMaxSelections;
                    const selectionIndex = topGoals.indexOf(option.value);

                    const frontInterpolate = flipAnimations[option.value]?.interpolate({
                      inputRange: [0, 180],
                      outputRange: ['0deg', '180deg'],
                    }) || '0deg';

                    const backInterpolate = flipAnimations[option.value]?.interpolate({
                      inputRange: [0, 180],
                      outputRange: ['180deg', '360deg'],
                    }) || '180deg';

                    const shimmerTranslate = shimmerAnimations[option.value]?.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [-300, -150, 300],
                    }) || -300;

                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => !isDisabled && handleAnswer(option.value)}
                        disabled={isDisabled}
                        activeOpacity={0.8}
                        style={styles.goalCardWrapper}
                      >
                        <View style={[
                          styles.goalCard,
                          isDisabled && styles.goalCardDisabled
                        ]}>
                          {/* Front Side - Brand background */}
                          <Animated.View style={[
                            styles.cardFront,
                            {
                              transform: [{ rotateY: frontInterpolate }],
                            }
                          ]}>
                            <Image
                              source={require('../../../../assets/images/goals/gochanakya_card2.png')}
                              style={styles.brandBackground}
                              resizeMode="cover"
                            />
                            <View style={styles.frontTextContainer}>
                              <Text style={styles.frontText}>{option.label}</Text>
                            </View>
                          </Animated.View>

                          {/* Back Side - Goal image */}
                          <Animated.View style={[
                            styles.cardBack,
                            {
                              transform: [{ rotateY: backInterpolate }],
                            }
                          ]}>
                            <LinearGradient
                              colors={['#8A2BE2', '#9370DB']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.cardBackGradient}
                            >
                              <Image
                                source={option.image}
                                style={styles.goalImage}
                                resizeMode="cover"
                              />
                              
                              {/* Selection number badge */}
                              {isSelected && (
                                <View style={styles.selectionBadge}>
                                  <Text style={styles.selectionBadgeText}>
                                    {selectionIndex + 1}
                                  </Text>
                                </View>
                              )}

                              {/* Text at top */}
                              <View style={styles.backTextContainer}>
                                <Text style={styles.backText}>{option.label}</Text>
                              </View>

                              {/* Shimmer effect */}
                              {isSelected && (
                                <Animated.View style={[
                                  styles.shimmerOverlay,
                                  {
                                    transform: [{ translateX: shimmerTranslate }],
                                  }
                                ]} />
                              )}
                            </LinearGradient>
                          </Animated.View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.selectionCounter}>
                  {topGoals?.length || 0} of {maxSelections} selected
                </Text>

                <View style={[
                  globalStyles.confirmButton,
                  !hasValidSelection && globalStyles.confirmButtonDisabled
                ]}>
                  {hasValidSelection ? (
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
  questionText: {
    fontSize: isMobile ? 20 : 26,
    fontWeight: '600',
    color: colors.textColor,
    textAlign: 'center',
    marginBottom: isMobile ? 24 : 32,
    minHeight: isMobile ? 48 : 60,
    lineHeight: isMobile ? 24 : 30,
  },

  highlightedText: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },

  cursor: {
    color: colors.textColor,
    fontWeight: 'bold',
  },

  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    maxWidth: isMobile ? 400 : 550,
    marginBottom: 20,
    width: '100%',
  },

  goalCardWrapper: {
    width: isMobile ? '45%' : '30%',
    aspectRatio: 0.8,
    minHeight: 200,
    marginBottom: 8,
  },

  goalCard: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },

  goalCardDisabled: {
    opacity: 0.4,
  },

  cardFront: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backfaceVisibility: 'hidden',
  },

  brandBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  frontTextContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },

  frontText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
    color: 'white',
    backgroundColor: 'rgb(213, 131, 72)',
    padding: 8,
    borderRadius: 8,
    maxWidth: 140,
  },

  cardBack: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backfaceVisibility: 'hidden',
  },

  cardBackGradient: {
    width: '100%',
    height: '100%',
    padding: 4,
    borderRadius: 16,
    position: 'relative',
  },

  goalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
  },

  selectionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },

  selectionBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  backTextContainer: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
    paddingHorizontal: 8,
  },

  backText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'black',
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    padding: 6,
    borderRadius: 6,
    textAlign: 'center',
    maxWidth: 140,
  },

  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ rotate: '45deg' }],
  },

  selectionCounter: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    color: colors.subtitleColor,
    fontSize: isMobile ? 12 : 14,
  },
});

export default Screen20;