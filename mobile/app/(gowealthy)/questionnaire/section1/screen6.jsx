import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  StatusBar,
  StyleSheet,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuestionnaire } from '../../../../src/context/QuestionnaireContext';

import { 
  colors, 
  globalStyles,
  isMobile 
} from '../../../../src/theme/globalStyles';

const Screen6 = () => {
  const router = useRouter();
  const { answers } = useQuestionnaire();
  const timerRef = useRef(null); 
  const pulseAnim = useRef(new Animated.Value(1)).current;

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



useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    timerRef.current = setTimeout(() => {
      handleContinue();
    }, 10000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleContinue = () => {
    // CLEAR timer when manually clicking continue
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    console.log('All answers so far:', answers);
    router.push('/(gowealthy)/questionnaire/section2/screen7');
  };

  const handleBack = () => {
    // CLEAR timer when going back
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
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
            <View style={globalStyles.header}>
              <TouchableOpacity style={globalStyles.backButton} onPress={handleBack}>
                <Text style={globalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <View style={globalStyles.logo}>
                <Text style={globalStyles.sectionTitle}>
                  Financial situation analyzed
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

            <View style={styles.flashCard}>
              <Animated.View 
                style={[
                  styles.animationContainer,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <LinearGradient
                  colors={[colors.secondaryAccent, colors.darkAccent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconCircle}
                >
                  <Text style={styles.iconEmoji}>💰</Text>
                  <Text style={styles.iconEmoji}>📊</Text>
                  <Text style={styles.iconEmoji}>💳</Text>
                </LinearGradient>
              </Animated.View>

              <Text style={styles.flashCardMessage}>
                "A person who tracks money closely is already on their path to their Financial Empowerment"
              </Text>

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
                  <Text style={styles.continueButtonText}>Continue Planning</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  flashCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isMobile ? 20 : 40,
    paddingVertical: isMobile ? 30 : 40,
  },

  animationContainer: {
    width: isMobile ? 250 : 300,
    height: isMobile ? 250 : 300,
    marginBottom: isMobile ? 24 : 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconCircle: {
    width: isMobile ? 200 : 240,
    height: isMobile ? 200 : 240,
    borderRadius: isMobile ? 100 : 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: 20,
  },

  iconEmoji: {
    fontSize: isMobile ? 40 : 50,
  },

  flashCardMessage: {
    fontSize: isMobile ? 16 : 18,
    lineHeight: isMobile ? 24 : 28,
    color: colors.subtitleColor,
    textAlign: 'center',
    marginBottom: isMobile ? 32 : 40,
    maxWidth: 500,
    fontWeight: '500',
    fontStyle: 'italic',
  },

  continueButtonWrapper: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    overflow: 'hidden',
  },

  continueButton: {
    paddingVertical: isMobile ? 18 : 20,
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

export default Screen6;