import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar,
  StyleSheet,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuestionnaire } from '../../../../src/context/QuestionnaireContext';
import ScreenScrollView from '../../../../src/components/ScreenScrollView';

import { 
  colors, 
  globalStyles,
  isMobile 
} from '../../../../src/theme/globalStyles';

const Screen15 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();
  const [isReady, setIsReady] = useState(false);

  const progressData = {
    sectionData: {
      1: { isActive: false, progress: 0, isCompleted: true },
      2: { isActive: false, progress: 0, isCompleted: true },
      3: { isActive: false, progress: 0, isCompleted: true },
      4: { isActive: false, progress: 0, isCompleted: true },
      5: { isActive: true, progress: 0, isCompleted: false },
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

  const handleContinue = () => {
    setTimeout(() => {
      router.replace('/(gowealthy)/questionnaire/section4/screen16');
    }, 500);
  };

  const handleBack = () => {
    router.back();
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

            <View style={globalStyles.questionContainer}>
              <View style={styles.introContentContainer}>
                <Text style={styles.introMainTitle}>
                  Discover your risk through Psychology
                </Text>

                <View style={styles.gifContainer}>
                  <Video
                    source={require('../../../../assets/animations/brain_psycho1.mp4')}
                    style={styles.video}
                    resizeMode="contain"
                    shouldPlay
                    isLooping
                    isMuted
                    onLoad={() => setIsReady(true)}
                    onError={(error) => {
                      console.log('Video error:', error);
                    }}
                  />
                </View>

                <View style={globalStyles.confirmButton}>
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
  introContentContainer: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
    paddingHorizontal: isMobile ? 16 : 24,
  },

  introMainTitle: {
    fontSize: isMobile ? 22 : 32,
    fontWeight: 'bold',
    color: colors.accentColor,
    marginBottom: isMobile ? 12 : 16,
    marginTop: -10,
    lineHeight: isMobile ? 26 : 38,
    textAlign: 'center',
  },

  gifContainer: {
    width: isMobile ? 250 : 300,
    height: isMobile ? 180 : 200,
    marginBottom: isMobile ? 25 : 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  video: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
});

export default Screen15;