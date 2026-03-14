import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar,
  StyleSheet,
  Image,
  ScrollView
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

const Screen16 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();
  
  const [responses, setResponses] = useState({
    restaurant_choice: '',
    laptop_choice: '',
    phone_vacation: '',
    insurance_choice: ''
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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

  const questions = [
    {
      key: 'restaurant_choice',
      title: 'Q1. New Restaurant',
      text: "Everyone's talking about a new, trendy Japanese restaurant in town. You have to plan a family dinner.",
      options: [
        { value: 'trending', label: 'Go to the trending one', score: 3, icon: '🍜' },
        { value: 'stick_favourite', label: 'Stick to our favourite cuisine', score: 1, icon: '🍝' },
        { value: 'check_reviews', label: 'Check out the Menu and Reviews first', score: 2, icon: '📱' }
      ]
    },
    {
      key: 'laptop_choice',
      title: 'Q2. Laptop Choice',
      subtitle: 'You have to buy a new laptop, select your choice',
      laptopOptions: [
        {
          value: 'dell',
          brand: 'Dell',
          image: require('../../../../assets/images/page_images/dell_laptop.png'),
          year: '2025',
          ram: '16 GB RAM',
          storage: '1 TB Storage',
          price: '₹ 50,000',
          score: 1,
          icon: '💻'
        },
        {
          value: 'macbook',
          brand: 'Macbook',
          image: require('../../../../assets/images/page_images/mac_laptop.png'),
          year: '2023',
          ram: '12 GB RAM',
          storage: '512 GB Storage',
          price: '₹ 60,000',
          originalPrice: '(Discounted from Rs. 80,000)',
          score: 3,
          icon: '🍎'
        },
        {
          value: 'any_brand',
          brand: 'Any Brand',
          image: require('../../../../assets/images/page_images/other_laptop.png'),
          year: '2024',
          ram: '16 GB RAM',
          storage: '2 TB Storage',
          price: '₹ 55,000',
          score: 2,
          icon: '💼'
        }
      ]
    },
    {
      key: 'phone_vacation',
      title: 'Q3. Phone vs Vacation',
      text: 'You set aside ₹40k for a new phone, but a limited-time sale pops up for an anticipated travel plan, which you have been thinking about.',
      options: [
        { value: 'vacation_emi', label: 'Go for the Vacation and get the phone on EMI', score: 2, icon: '✈️' },
        { value: 'phone_now', label: 'Buy the phone, vacation can wait', score: 3, icon: '📱' },
        { value: 'travel_first', label: 'Travel first, delay phone purchase', score: 1, icon: '🌍' }
      ]
    },
    {
      key: 'insurance_choice',
      title: 'Q4. Insurance Plan',
      subtitle: 'Which would you choose?',
      text: 'You need to choose between two health insurance plans for your family:',
      planA: {
        name: 'Plan A',
        premium: '₹25,000/year',
        coverage: 'up to ₹20 lakhs',
        extra: 'No critical illness rider',
        value: 'plan_a',
        score: 2
      },
      planB: {
        name: 'Plan B',
        premium: '₹30,000/year',
        coverage: 'up to ₹25 lakhs',
        extra: 'includes critical illness cover up to ₹2 lakhs',
        value: 'plan_b',
        score: 1
      },
      options: [
        { 
          value: 'ask_expert', 
          label: 'Ask an expert', 
          score: 3, 
          icon: '👨‍⚕️' 
        }
      ]
    }
  ];

  const handleResponseChange = (key, value, score) => {
    const updatedResponses = {
      ...responses,
      [key]: { value, score }
    };
    
    setResponses(updatedResponses);

    // Check if this is the last question (index 3)
    if (currentQuestionIndex === questions.length - 1) {
      // Last question - auto navigate to next screen
      setTimeout(() => {
        const psychologyScores = {};
        Object.keys(updatedResponses).forEach(k => {
          psychologyScores[k] = updatedResponses[k].score;
        });

        const totalScore = Object.values(psychologyScores).reduce((sum, s) => sum + s, 0);

        updateAnswer('psychology_responses', updatedResponses);
        updateAnswer('psychology_scores', psychologyScores);
        updateAnswer('total_psychology_score', totalScore);

        router.push('/(gowealthy)/questionnaire/section4/screen17');
      }, 300);
    } else if (currentQuestionIndex < questions.length - 1) {
      // Not last question - go to next question
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const currentQuestion = questions[currentQuestionIndex];

  const renderLaptopOptions = () => {
    if (currentQuestion.key !== 'laptop_choice') return null;

    return (
      <View style={styles.laptopOptionsContainer}>
        {currentQuestion.laptopOptions.map((laptop, index) => {
          const isSelected = responses[currentQuestion.key]?.value === laptop.value;
          
          return (
            <TouchableOpacity
              key={laptop.value}
              onPress={() => handleResponseChange(currentQuestion.key, laptop.value, laptop.score)}
              style={[
                styles.laptopOption,
                isSelected && styles.laptopOptionSelected
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.laptopImageContainer}>
                <Image 
                  source={laptop.image}
                  style={styles.laptopImage}
                  resizeMode="contain"
                />
              </View>
              
              <View style={styles.laptopTextContent}>
                <Text style={styles.laptopBrand}>
                  {index + 1}. {laptop.brand}
                </Text>
                <Text style={[styles.laptopDetail, isSelected && styles.laptopDetailSelected]}>
                  Year: {laptop.year}
                </Text>
                <Text style={[styles.laptopDetail, isSelected && styles.laptopDetailSelected]}>
                  {laptop.ram} - {laptop.storage}
                </Text>
                
                <View style={styles.laptopPriceContainer}>
                  {laptop.originalPrice && (
                    <Text style={styles.laptopOriginalPrice}>₹ 80,000</Text>
                  )}
                  <Text style={styles.laptopPrice}>{laptop.price}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      <View style={[globalStyles.backgroundContainer, { backgroundColor: '#0a0a0a' }]}>
        <ScreenScrollView>
          <View style={globalStyles.appContainer}>
            <View style={globalStyles.header}>
              <TouchableOpacity style={globalStyles.backButton} onPress={handleBack}>
                <Text style={globalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <View style={globalStyles.logo}>
                <Text style={globalStyles.sectionTitle}>
                  Understanding your personality
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

            <View style={[styles.questionContainer, currentQuestionIndex === 0 && isMobile && { paddingTop: 5 }]}>
              <View style={styles.contentWrapper}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
                  {currentQuestion.subtitle && (
                    <Text style={styles.questionSubtitle}>{currentQuestion.subtitle}</Text>
                  )}
                </View>

                {currentQuestion.key === 'laptop_choice' && renderLaptopOptions()}

                {currentQuestion.key !== 'laptop_choice' && (
                  <View style={styles.questionTextBox}>
                    {currentQuestion.text && (
                      <Text style={styles.questionText}>{currentQuestion.text}</Text>
                    )}
                  </View>
                )}

                {currentQuestion.key !== 'laptop_choice' && (
                  <View style={styles.optionsContainer}>
                    {currentQuestion.key === 'insurance_choice' && (
                      <>
                        <TouchableOpacity
                          onPress={() => handleResponseChange('insurance_choice', currentQuestion.planA.value, currentQuestion.planA.score)}
                          style={[
                            styles.insurancePlanCard,
                            responses.insurance_choice?.value === 'plan_a' && styles.insurancePlanCardSelected
                          ]}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.planBadge, { backgroundColor: '#3b82f6' }]}>
                            <Text style={styles.planBadgeText}>{currentQuestion.planA.name}</Text>
                          </View>
                          <View style={styles.planDetails}>
                            <Text style={[styles.planPremium, { color: '#3b82f6' }]}>
                              {currentQuestion.planA.premium}
                            </Text>
                            <Text style={styles.planCoverage}>
                              Coverage: {currentQuestion.planA.coverage}
                            </Text>
                            <Text style={styles.planExtra}>{currentQuestion.planA.extra}</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleResponseChange('insurance_choice', currentQuestion.planB.value, currentQuestion.planB.score)}
                          style={[
                            styles.insurancePlanCard,
                            responses.insurance_choice?.value === 'plan_b' && styles.insurancePlanCardSelected
                          ]}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.planBadge, { backgroundColor: '#10b981' }]}>
                            <Text style={styles.planBadgeText}>{currentQuestion.planB.name}</Text>
                          </View>
                          <View style={styles.planDetails}>
                            <Text style={[styles.planPremium, { color: '#10b981' }]}>
                              {currentQuestion.planB.premium}
                            </Text>
                            <Text style={styles.planCoverage}>
                              Coverage: {currentQuestion.planB.coverage}
                            </Text>
                            <Text style={[styles.planExtra, { color: '#34d399' }]}>
                              ✓ {currentQuestion.planB.extra}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    )}

                    {currentQuestion.options.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => handleResponseChange(currentQuestion.key, option.value, option.score)}
                        style={[
                          styles.optionButton,
                          responses[currentQuestion.key]?.value === option.value && styles.optionButtonSelected
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.optionIcon}>{option.icon}</Text>
                        <Text style={styles.optionLabel}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {currentQuestionIndex > 0 && (
                  <View style={styles.navigationButtons}>
                    <TouchableOpacity
                      onPress={goToPreviousQuestion}
                      style={styles.previousButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.previousButtonText}>← Previous</Text>
                    </TouchableOpacity>
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
  questionContainer: {
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    paddingHorizontal: isMobile ? 15 : 20,
    paddingTop: 15,
    paddingBottom: 20,
    marginTop: 0,
  },

  contentWrapper: {
    width: '100%',
    maxWidth: 800,
  },

  questionHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },

  questionTitle: {
    color: colors.accentColor,
    fontSize: isMobile ? 20 : 28,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Poppins',
    textAlign: 'center',
  },

  questionSubtitle: {
    color: '#9ca3af',
    fontSize: isMobile ? 14 : 16,
    fontStyle: 'italic',
    fontFamily: 'Poppins',
    marginTop: 8,
    textAlign: 'center',
  },

  laptopOptionsContainer: {
    gap: 12,
    marginBottom: 16,
  },

  laptopOption: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(55, 65, 81, 0.6)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  laptopOptionSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: colors.accentColor,
  },

  laptopImageContainer: {
    width: isMobile ? 100 : 120,
    height: isMobile ? 70 : 80,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  laptopImage: {
    width: '90%',
    height: '90%',
  },

  laptopTextContent: {
    flex: 1,
    gap: 4,
  },

  laptopBrand: {
    fontSize: isMobile ? 15 : 16,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Poppins',
  },

  laptopDetail: {
    fontSize: 12,
    color: '#d1d5db',
  },

  laptopDetailSelected: {
    color: '#e0e7ff',
  },

  laptopPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },

  laptopOriginalPrice: {
    fontSize: isMobile ? 16 : 15,
    color: '#ef4444',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },

  laptopPrice: {
    fontSize: isMobile ? 16 : 15,
    fontWeight: 'bold',
    color: '#10b981',
    fontFamily: 'Poppins',
  },

  questionTextBox: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16,
    padding: isMobile ? 16 : 20,
    marginBottom: 24,
    maxWidth: isMobile ? '100%' : 500,
    alignSelf: 'center',
    width: '100%',
  },

  questionText: {
    color: '#ffffff',
    fontSize: isMobile ? 16 : 18,
    lineHeight: isMobile ? 22 : 26,
    textAlign: 'center',
    fontWeight: '500',
  },

  optionsContainer: {
    gap: 16,
  },

  insurancePlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },

  insurancePlanCardSelected: {
    backgroundColor: colors.accentColor,
    borderColor: colors.accentColor,
  },

  planBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },

  planBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  planDetails: {
    flex: 1,
  },

  planPremium: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  planCoverage: {
    fontSize: 13,
    color: '#ffffff',
    marginBottom: 4,
  },

  planExtra: {
    fontSize: 12,
    color: '#f87171',
    fontStyle: 'italic',
  },

  optionButton: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#374151',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  optionButtonSelected: {
    backgroundColor: colors.accentColor,
    borderColor: colors.accentColor,
  },

  optionIcon: {
    fontSize: 28,
    minWidth: 36,
    textAlign: 'center',
  },

  optionLabel: {
    flex: 1,
    color: '#ffffff',
    fontSize: isMobile ? 16 : 18,
    fontWeight: '500',
  },

  navigationButtons: {
    alignItems: 'center',
    marginTop: 40,
  },

  previousButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#374151',
    borderRadius: 12,
  },

  previousButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Screen16;