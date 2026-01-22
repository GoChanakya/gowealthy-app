import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  Animated,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Video } from 'expo-av';
import { useQuestionnaire } from '../../../../src/context/QuestionnaireContext';
import ScreenScrollView from '../../../../src/components/ScreenScrollView';

import {
  colors,
  globalStyles,
  isMobile
} from '../../../../src/theme/globalStyles';

const { width: screenWidth } = Dimensions.get('window');

const Screen23 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();

  const [currentSection, setCurrentSection] = useState(0);
  const [sectionsCompleted, setSectionsCompleted] = useState([false, false, false, false, false, false]);
  const [showLoader, setShowLoader] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [typewriterComplete, setTypewriterComplete] = useState(false);
  const [loaderComplete, setLoaderComplete] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const loaderFadeAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  const progressData = {
    sectionData: {
      1: { isActive: false, progress: 0, isCompleted: true },
      2: { isActive: false, progress: 0, isCompleted: true },
      3: { isActive: false, progress: 0, isCompleted: true },
      4: { isActive: false, progress: 0, isCompleted: true },
      5: { isActive: false, progress: 0, isCompleted: true },
      6: { isActive: true, progress: 100, isCompleted: false },
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

  // Auto-progress through sections
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentSection < 6) {
        setSectionsCompleted(prev => {
          const updated = [...prev];
          updated[currentSection] = true;
          return updated;
        });
        setCurrentSection(prev => prev + 1);
      } else {
        // All sections completed, start smooth crossfade
        setFadeOut(true);
        
        // Fade out sections
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }).start();

        // Start showing loader
        setTimeout(() => {
          setShowLoader(true);
          
          // Fade in loader
          Animated.timing(loaderFadeAnim, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }).start();

          // Loader runs for 6 seconds, then complete and start typewriter
          setTimeout(() => {
            setLoaderComplete(true);
            setTimeout(() => {
              startTypewriter();
            }, 500);
          }, 6000);
        }, 100);
      }
    }, 667); // 4 seconds / 6 sections = 667ms each

    return () => clearTimeout(timer);
  }, [currentSection]);

  // Typewriter effect for the text
  const startTypewriter = () => {
    const text = "Your financial plan is ready!";
    let index = 0;

    // Fade in text container
    Animated.timing(textFadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setTypewriterText(text.substring(0, index + 1));
        index++;
      } else {
        setTypewriterComplete(true);
        clearInterval(typeInterval);
      }
    }, 80);
  };

  // Navigate to dashboard after typewriter completes
  useEffect(() => {
    if (typewriterComplete) {
      const delay = setTimeout(() => {
        // Mark questionnaire as complete
        updateAnswer('questionnaire_completed', true);
        updateAnswer('completion_timestamp', new Date().toISOString());
        
        // Navigate to dashboard or next screen
        router.replace('/(gowealthy)/dashboard'); // Adjust this path as needed
      }, 2000);
      return () => clearTimeout(delay);
    }
  }, [typewriterComplete]);

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />

      <View style={globalStyles.backgroundContainer}>
        <ScreenScrollView contentContainerStyle={styles.scrollContent}>
          <View style={globalStyles.appContainer}>
            {/* Header */}
            <View style={globalStyles.header}>
              <View style={globalStyles.logo}>
                <Text style={globalStyles.sectionTitle}>
                  Journey Complete!
                </Text>
              </View>
            </View>

            {/* Progress Bar - Show all 6 sections completed */}
            <View style={globalStyles.progressContainer}>
              {sections.map((section, index) => (
                <View key={index} style={globalStyles.progressStepContainer}>
                  <View
                    style={[
                      globalStyles.progressStep,
                      sectionsCompleted[index] && globalStyles.progressStepCompleted,
                    ]}
                  />
                  {index < sections.length - 1 && (
                    <View
                      style={[
                        globalStyles.progressLine,
                        sectionsCompleted[index] && globalStyles.progressLineCompleted,
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>

            {/* Loading Content */}
            <View style={styles.loadingContent}>
              {/* Show Loader with text - fade in after sections fade out */}
              {showLoader && (
                <Animated.View style={[styles.loaderContainer, { opacity: loaderFadeAnim }]}>
                  <View style={styles.loaderImageWrapper}>
                    <Video
                      source={require('../../../../assets/animations/loader2.mp4')}
                      style={styles.loaderVideo}
                      resizeMode="contain"
                      shouldPlay
                      isLooping={false}
                      onPlaybackStatusUpdate={(status) => {
                        if (status.didJustFinish) {
                          setLoaderComplete(true);
                        }
                      }}
                    />
                  </View>
                  
                  {loaderComplete && (
                    <Animated.View style={[styles.loaderTextWrapper, { opacity: textFadeAnim }]}>
                      <Text style={styles.loaderText}>
                        {typewriterText}
                        {!typewriterComplete && <Text style={styles.typingCursor}>|</Text>}
                      </Text>
                    </Animated.View>
                  )}
                </Animated.View>
              )}

              {/* Processing Sections - Fade out while loader fades in */}
              <Animated.View style={[styles.processingSections, { opacity: fadeAnim }]}>
                <View style={styles.processingHeader}>
                  <Text style={styles.processingTitle}>
                    Creating your personalized financial roadmap
                  </Text>
                </View>

                {/* Section List */}
                <View style={styles.sectionsList}>
                  {sections.map((section, index) => (
                    <View
                      key={index}
                      style={[
                        styles.sectionItem,
                        sectionsCompleted[index] && styles.sectionItemCompleted,
                        currentSection === index && styles.sectionItemActive,
                      ]}
                    >
                      <View style={styles.sectionIconContainer}>
                        {sectionsCompleted[index] ? (
                          <View style={styles.checkmarkContainer}>
                            <Text style={styles.checkmark}>✓</Text>
                          </View>
                        ) : currentSection === index ? (
                          <View style={styles.loadingSpinner}>
                            <Animated.View style={styles.spinner} />
                          </View>
                        ) : (
                          <Text style={styles.sectionNumber}>{index + 1}</Text>
                        )}
                      </View>

                      <View style={styles.sectionContent}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                      </View>

                      {sectionsCompleted[index] && (
                        <View style={styles.completionAnimation}>
                          <Animated.View style={styles.successPulse} />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </Animated.View>
            </View>
          </View>
        </ScreenScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },

  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
  },

loaderContainer: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  transform: [{ translateY: -60 }], // Shift up by 60 pixels
},

  loaderImageWrapper: {
    width: isMobile ? screenWidth * 0.9 : 400,
    height: isMobile ? screenWidth * 0.9 : 400,
    maxWidth: 450,
    maxHeight: 450,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loaderVideo: {
    width: '100%',
    height: '100%',
  },

  loaderTextWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: isMobile ? 10 : 20,
  },

  loaderText: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: '700',
    color: '#FF8500',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },

  typingCursor: {
    color: '#FF8500',
    marginLeft: 2,
  },

  processingSections: {
    width: '100%',
    maxWidth: 500,
    gap: 24,
  },

  processingHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },

  processingTitle: {
    fontSize: isMobile ? 18 : 22,
    fontWeight: '600',
    color: colors.textColor,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Poppins-SemiBold',
  },

  sectionsList: {
    gap: 14,
  },

  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: isMobile ? 16 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },

  sectionItemActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },

  sectionItemCompleted: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },

  sectionIconContainer: {
    width: isMobile ? 40 : 50,
    height: isMobile ? 40 : 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  sectionNumber: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: colors.textColor,
  },

  checkmarkContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkmark: {
    color: 'white',
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
  },

  loadingSpinner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  spinner: {
    width: isMobile ? 20 : 24,
    height: isMobile ? 20 : 24,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderTopColor: '#6366f1',
    borderRadius: 12,
  },

  sectionContent: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    fontSize: isMobile ? 15 : 18,
    fontWeight: '600',
    color: colors.textColor,
    fontFamily: 'Poppins-SemiBold',
  },

  completionAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },

  successPulse: {
    position: 'absolute',
    top: '50%',
    right: 20,
    width: 12,
    height: 12,
    backgroundColor: '#10b981',
    borderRadius: 6,
    transform: [{ translateY: -6 }],
  },
});

export default Screen23;