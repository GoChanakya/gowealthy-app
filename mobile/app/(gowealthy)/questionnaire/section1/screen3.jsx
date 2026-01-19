import React, { useEffect ,useRef} from 'react';

import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
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

const Screen3 = () => {
  const router = useRouter();
  const { answers } = useQuestionnaire();
  
  const dependents = answers.dependents;
  const timerRef = useRef(null);

  const progressData = {
    sectionData: {
      1: { isActive: true, progress: 100, isCompleted: false },
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

  const totalDependents = Object.values(dependents).reduce((sum, count) => sum + count, 0);
  const dependentTypes = Object.entries(dependents).filter(([_, count]) => count > 0);

  let familyMessage = "";
  if (totalDependents === 0) {
    familyMessage = "Perfect! We'll create a financial plan focused on your personal goals and future aspirations. Your independence gives you flexibility to build wealth your way.";
  } else if (totalDependents === 1) {
    familyMessage = "Wonderful! Having someone to care for shows your responsible nature. We'll factor in their needs while building your financial security together.";
  } else {
    familyMessage = "Amazing! You're building a beautiful family legacy. We'll create a comprehensive plan that protects and provides for everyone you love while securing your future.";
  }

  const dependentImages = {
    child: require('../../../../assets/images/page_images/child.png'),
    parent: require('../../../../assets/images/page_images/parent.png'),
    pet: require('../../../../assets/images/page_images/pet.png'),
    spouse: require('../../../../assets/images/page_images/spouse.png')
  };

  const defaultIcons = ["🎯", "💰", "📈", "✨"];

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      handleContinue();
    }, 10000);

    // Clear timer on unmount
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
    router.push('/(gowealthy)/questionnaire/section1/screen4');
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
            {/* Header */}
            <View style={globalStyles.header}>
              <TouchableOpacity style={globalStyles.backButton} onPress={handleBack}>
                <Text style={globalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <View style={globalStyles.logo}>
                <Text style={globalStyles.sectionTitle}>
                  Basic Details Completed!!
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

            {/* Flash Card */}
            <View style={styles.flashCard}>
              <Text style={styles.flashCardHeading}>
                {totalDependents === 0 ? "Ready to Build!" : "Family First!"}
              </Text>

              <View style={styles.illustration}>
                <LinearGradient
                  colors={[colors.secondaryAccent, colors.darkAccent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.circleContainer}
                >
                  <View style={styles.iconsGrid}>
                    {dependentTypes.length > 0 ? (
                      dependentTypes.slice(0, 4).map(([type, count], index) => (
                        <View key={type} style={styles.miniIconContainer}>
                          <Image
                            source={dependentImages[type]}
                            style={styles.miniIconImage}
                            resizeMode="contain"
                          />
                        </View>
                      ))
                    ) : (
                      defaultIcons.map((icon, index) => (
                        <View key={index} style={styles.miniIconContainer}>
                          <Text style={styles.miniIconEmoji}>{icon}</Text>
                        </View>
                      ))
                    )}
                  </View>

                  {/* Floating Hearts */}
                  <View style={styles.floatingHeartsContainer}>
                    <Text style={[styles.floatingHeart, { left: '20%' }]}>💖</Text>
                    <Text style={[styles.floatingHeart, { left: '80%' }]}>💙</Text>
                    <Text style={[styles.floatingHeart, { left: '50%' }]}>💖</Text>
                  </View>
                </LinearGradient>
              </View>

              <Text style={styles.flashCardMessage}>{familyMessage}</Text>

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
    paddingVertical: isMobile ? 20 : 40,
  },

  flashCardHeading: {
    fontSize: isMobile ? 28 : 32,
    fontWeight: '700',
    color: colors.accentColor,
    marginBottom: isMobile ? 24 : 32,
    textAlign: 'center',
  },

  illustration: {
    marginBottom: isMobile ? 28 : 32,
    width: '100%',
    alignItems: 'center',
  },

  circleContainer: {
    width: isMobile ? 120 : 140,
    height: isMobile ? 120 : 140,
    borderRadius: isMobile ? 60 : 70,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
    position: 'relative',
    overflow: 'visible',
  },

  iconsGrid: {
    width: isMobile ? 80 : 90,
    height: isMobile ? 80 : 90,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isMobile ? 6 : 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  miniIconContainer: {
    width: isMobile ? 36 : 40,
    height: isMobile ? 36 : 40,
    borderRadius: isMobile ? 8 : 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  miniIconImage: {
    width: isMobile ? 20 : 24,
    height: isMobile ? 20 : 24,
  },

  miniIconEmoji: {
    fontSize: isMobile ? 18 : 20,
  },

  floatingHeartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  floatingHeart: {
    position: 'absolute',
    fontSize: 16,
    opacity: 0.8,
  },

  flashCardMessage: {
    fontSize: isMobile ? 15 : 18,
    lineHeight: isMobile ? 22 : 28,
    color: colors.subtitleColor,
    textAlign: 'center',
    marginBottom: isMobile ? 32 : 40,
    maxWidth: 360,
  },

  continueButtonWrapper: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    overflow: 'hidden',
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

export default Screen3;