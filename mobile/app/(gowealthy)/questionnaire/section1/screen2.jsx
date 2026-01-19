import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuestionnaire } from '../../../../src/context/QuestionnaireContext';

import { 
  colors, 
  globalStyles,
  shadows,
  isMobile 
} from '../../../../src/theme/globalStyles';

const Screen2 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();
  
  const [dependents, setDependents] = useState(answers.dependents || {
    child: 0,
    parent: 0,
    pet: 0,
    spouse: 0
  });

  const progressData = {
    sectionData: {
      1: { isActive: true, progress: 50, isCompleted: false },
      2: { isActive: false, progress: 0, isCompleted: false },
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

  const dependentOptions = [
    { 
      label: "Child", 
      value: "child", 
      emoji: "👶",
      image: require('../../../../assets/images/page_images/child.png')
    },
    { 
      label: "Parent", 
      value: "parent", 
      emoji: "👨‍🦳",
      image: require('../../../../assets/images/page_images/parent.png')
    },
    { 
      label: "Pet", 
      value: "pet", 
      emoji: "🐕",
      image: require('../../../../assets/images/page_images/pet.png')
    },
    { 
      label: "Spouse", 
      value: "spouse", 
      emoji: "💑",
      image: require('../../../../assets/images/page_images/spouse.png')
    }
  ];

  const handleDependentQuantityChange = (dependentType, change) => {
    setDependents(prev => ({
      ...prev,
      [dependentType]: Math.max(0, Math.min(10, prev[dependentType] + change))
    }));
  };

  const handleContinue = () => {
    updateAnswer('dependents', dependents);
    console.log('Dependents:', dependents);
    router.push('/(gowealthy)/questionnaire/section1/screen3');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />
      
      <View style={globalStyles.backgroundContainer}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
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
                    Let's start with some basic details
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
                  <Text style={globalStyles.questionText}>Do you have any dependents?</Text>

                  <View style={styles.dependentsContainer}>
                    <View style={styles.dependentsGrid}>
                      {dependentOptions.map((option) => (
                        <View
                          key={option.value}
                          style={[
                            styles.dependentCard,
                            dependents[option.value] > 0 && styles.hasSelection
                          ]}
                        >
                          <Image
                            source={option.image}
                            style={styles.dependentImage}
                            resizeMode="contain"
                          />
                          <Text style={styles.dependentLabel}>{option.label}</Text>
                          
                          <View style={styles.quantityControls}>
                            <TouchableOpacity
                              style={[
                                styles.quantityButton,
                                dependents[option.value] === 0 && styles.quantityButtonDisabled
                              ]}
                              onPress={() => handleDependentQuantityChange(option.value, -1)}
                              disabled={dependents[option.value] === 0}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quantityButtonText}>-</Text>
                            </TouchableOpacity>
                            
                            <Text style={styles.quantityDisplay}>
                              {dependents[option.value]}
                            </Text>
                            
                            <TouchableOpacity
                              style={[
                                styles.quantityButton,
                                dependents[option.value] >= 10 && styles.quantityButtonDisabled
                              ]}
                              onPress={() => handleDependentQuantityChange(option.value, 1)}
                              disabled={dependents[option.value] >= 10}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quantityButtonText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Continue Button */}
                    <TouchableOpacity
                      onPress={handleContinue}
                      activeOpacity={0.8}
                      style={styles.continueButtonWrapper}
                    >
                      <LinearGradient
                        colors={[colors.gradientPurple1, colors.gradientPurple2]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.continueButton}
                      >
                        <Text style={styles.continueButtonText}>Continue</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  dependentsContainer: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 30,
  },

  dependentsGrid: {
    width: '100%',
    maxWidth: isMobile ? 300 : 360,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isMobile ? 12 : 16,
    justifyContent: 'center',
  },

  dependentCard: {
    width: isMobile ? '47%' : '48%',
    minHeight: isMobile ? 120 : 150,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: isMobile ? 16 : 20,
    paddingHorizontal: isMobile ? 12 : 16,
    borderRadius: 16,
    backgroundColor: colors.optionBackground,
    borderWidth: 2,
    borderColor: colors.optionBorder,
  },

  hasSelection: {
    backgroundColor: colors.optionSelected,
    borderColor: colors.accentColor,
    ...shadows.md,
  },

  dependentImage: {
    width: isMobile ? 60 : 80,
    height: isMobile ? 60 : 80,
    marginBottom: isMobile ? 8 : 12,
  },

  dependentLabel: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: '500',
    color: colors.textColor,
    marginBottom: isMobile ? 8 : 12,
    textAlign: 'center',
  },

  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isMobile ? 8 : 12,
    marginTop: 'auto',
  },

  quantityButton: {
    width: isMobile ? 28 : 32,
    height: isMobile ? 28 : 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.optionBorder,
    backgroundColor: colors.optionBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityButtonDisabled: {
    opacity: 0.4,
  },

  quantityButtonText: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: colors.textColor,
  },

  quantityDisplay: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.textColor,
  },

  continueButtonWrapper: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: isMobile ? 20 : 30,
  },

  continueButton: {
    paddingVertical: isMobile ? 14 : 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textColor,
  },
});

export default Screen2;