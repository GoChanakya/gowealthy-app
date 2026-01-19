import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
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

const Screen1 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();
  
  const [age, setAge] = useState(answers.age || '');
  const [gender, setGender] = useState(answers.gender || '');

  const progressData = {
    sectionData: {
      1: { isActive: true, progress: 0, isCompleted: false },
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

  const genderOptions = [
    {
      label: "Male",
      value: "male",
      image: require('../../../../assets/images/page_images/male.png')
    },
    {
      label: "Female",
      value: "female",
      image: require('../../../../assets/images/page_images/female.png')
    }
  ];

  const handleNumberInput = (value) => {
    if (value === '' || value === null || value === undefined) {
      setAge('');
      return;
    }

    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 18 && numValue <= 100) {
      setAge(numValue);
    } else if (!isNaN(numValue)) {
      setAge(numValue);
    }
  };

  const handleGenderSelect = (genderValue) => {
    setGender(genderValue);
  };

  const handleContinue = () => {
    if (age && gender && age >= 18 && age <= 100) {
      updateAnswer('age', age);
      updateAnswer('gender', gender);
      console.log('Navigating to screen2 with:', { age, gender });
      router.push('/(gowealthy)/questionnaire/section1/screen2');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isButtonActive = age && gender && age >= 18 && age <= 100;

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
                  <Text style={globalStyles.questionText}>About yourself</Text>

                  <View style={styles.combinedInputContainer}>
                    {/* Age Input Section */}
                    <View style={styles.ageInputSection}>
                      <Text style={globalStyles.inputLabel}>Your Age</Text>
                      <View style={styles.numberInputContainer}>
                        <TextInput
                          style={styles.numberInput}
                          placeholder="Enter your age"
                          placeholderTextColor={colors.subtitleColor}
                          keyboardType="numeric"
                          value={age ? age.toString() : ''}
                          onChangeText={(value) => {
                            if (value === '' || /^\d+$/.test(value)) {
                              handleNumberInput(value);
                            }
                          }}
                          maxLength={3}
                          autoComplete="off"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                      {age && (age < 18 || age > 100) && (
                        <Text style={globalStyles.errorText}>
                          Age must be between 18 and 100
                        </Text>
                      )}
                    </View>

                    {/* Gender Section */}
                    <View style={styles.genderSection}>
                      <Text style={globalStyles.inputLabel}>Your Gender</Text>
                      <View style={styles.genderOptionsContainer}>
                        {genderOptions.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.genderOption,
                              gender === option.value && styles.selectedGender
                            ]}
                            onPress={() => handleGenderSelect(option.value)}
                            activeOpacity={0.7}
                          >
                            <Image
                              source={option.image}
                              style={styles.genderImage}
                              resizeMode="contain"
                            />
                            <Text style={styles.genderLabel}>{option.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Continue Button */}
                    <View style={[
                      globalStyles.confirmButton,
                      !isButtonActive && globalStyles.confirmButtonDisabled
                    ]}>
                      {isButtonActive ? (
                        <TouchableOpacity
                          onPress={handleContinue}
                          activeOpacity={0.8}
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
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  combinedInputContainer: {
    width: '100%',
    maxWidth: 420,
    gap: isMobile ? 28 : 36,
  },
  
  ageInputSection: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  
  numberInputContainer: {
    width: '100%',
    maxWidth: isMobile ? 200 : 220,
    borderWidth: 2,
    borderColor: colors.optionBorder,
    borderRadius: 12,
    backgroundColor: colors.optionBackground,
  },
  
  numberInput: {
    width: '100%',
    padding: isMobile ? 14 : 16,
    fontSize: isMobile ? 16 : 18,
    color: colors.textColor,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  genderSection: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  
  genderOptionsContainer: {
    flexDirection: 'row',
    gap: isMobile ? 16 : 20,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
  },
  
  genderOption: {
    flex: 1,
    maxWidth: isMobile ? 160 : 180,
    alignItems: 'center',
    paddingVertical: isMobile ? 20 : 24,
    paddingHorizontal: isMobile ? 12 : 16,
    borderRadius: 16,
    backgroundColor: colors.optionBackground,
    borderWidth: 2,
    borderColor: colors.optionBorder,
  },
  
  selectedGender: {
    backgroundColor: colors.optionSelected,
    borderColor: colors.accentColor,
    ...shadows.md,
  },
  
  genderImage: {
    width: isMobile ? 70 : 80,
    height: isMobile ? 70 : 80,
    marginBottom: isMobile ? 16 : 20,
  },
  
  genderLabel: {
    fontSize: isMobile ? 15 : 16,
    fontWeight: '500',
    color: colors.textColor,
  },
});

export default Screen1;