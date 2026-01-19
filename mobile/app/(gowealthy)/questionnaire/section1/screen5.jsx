import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  StatusBar,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuestionnaire } from '../../../../src/context/QuestionnaireContext';

import { 
  colors, 
  globalStyles,
  shadows,
  isMobile 
} from '../../../../src/theme/globalStyles';

const Screen5 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();
  
  const [expenseTracking, setExpenseTracking] = useState(answers.expense_tracking || '');

  const progressData = {
    sectionData: {
      1: { isActive: false, progress: 0, isCompleted: true },
      2: { isActive: true, progress: 25, isCompleted: false },
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

  const trackingOptions = [
    { label: "I have an app to track them", value: "app", emoji: "📱" },
    { label: "I know it roughly in my mind", value: "roughly", emoji: "🧠" },
    { label: "I don't track", value: "none", emoji: "🤷" }
  ];

  const handleAnswer = (value) => {
    setExpenseTracking(value);
    updateAnswer('expense_tracking', value);
    
    setTimeout(() => {
      console.log('Expense tracking:', value);
      router.push('/(gowealthy)/questionnaire/section1/screen6');
    }, 500);
  };

  const handleBack = () => {
    router.back();
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
            {/* Header */}
            <View style={globalStyles.header}>
              <TouchableOpacity style={globalStyles.backButton} onPress={handleBack}>
                <Text style={globalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <View style={globalStyles.logo}>
                <Text style={globalStyles.sectionTitle}>
                  Understanding your financial situation
                </Text>
              </View>
            </View>

            {/* Progress Container */}
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

            {/* Question Container */}
            <View style={globalStyles.questionContainer}>
              <View style={{ width: '100%', alignItems: 'center' }}>
                <Text style={globalStyles.questionText}>
                  How well do you track your expenses?
                </Text>

                <View style={styles.optionsContainer}>
                  {trackingOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        expenseTracking === option.value && styles.selectedOption
                      ]}
                      onPress={() => handleAnswer(option.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.optionEmoji}>{option.emoji}</Text>
                      <Text style={styles.optionLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
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
  optionsContainer: {
    width: '100%',
    maxWidth: 420,
    gap: isMobile ? 12 : 16,
  },

  optionButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isMobile ? 16 : 20,
    paddingHorizontal: isMobile ? 16 : 20,
    borderRadius: 12,
    backgroundColor: colors.optionBackground,
    borderWidth: 2,
    borderColor: colors.optionBorder,
  },

  selectedOption: {
    backgroundColor: colors.optionSelected,
    borderColor: colors.accentColor,
    ...shadows.md,
  },

  optionEmoji: {
    fontSize: isMobile ? 20 : 24,
    marginRight: isMobile ? 12 : 16,
    width: isMobile ? 28 : 32,
    textAlign: 'center',
  },

  optionLabel: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '500',
    color: colors.textColor,
    flex: 1,
  },
});

export default Screen5;