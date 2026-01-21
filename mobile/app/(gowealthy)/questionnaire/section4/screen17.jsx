import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar,
  StyleSheet,
  Animated
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

const Screen17 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();
  
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [riskScores, setRiskScores] = useState(null);

  const progressData = {
    sectionData: {
      1: { isActive: false, progress: 0, isCompleted: true },
      2: { isActive: false, progress: 0, isCompleted: true },
      3: { isActive: false, progress: 0, isCompleted: true },
      4: { isActive: false, progress: 0, isCompleted: true },
      5: { isActive: true, progress: 75, isCompleted: false },
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

  // Question weights mapping
  const questionWeights = {
    restaurant_choice: { SI: 0.5, FO: 0.1, LT: 0.3, CO: 0.3, AT: 0.0 },
    laptop_choice: { SI: 0.3, FO: 0.2, LT: 0.1, CO: 0.2, AT: 0.3 },
    phone_vacation: { SI: 0.1, FO: 0.3, LT: 0.4, CO: 0.4, AT: 0.2 },
    insurance_choice: { SI: 0.1, FO: 0.4, LT: 0.2, CO: 0.1, AT: 0.5 }
  };

  const calculateRiskScores = () => {
    const responses = answers.psychology_scores || {};
    
    // Initialize dimension scores
    const dimensions = {
      SI: 0, // Social Influence Tendency
      FO: 0, // Future Orientation
      LT: 0, // Loss Tolerance (previously LS - Loss Sensitivity)
      CO: 0, // Confidence Outlook
      AT: 0  // Analytical Thinking
    };

    // Calculate weighted scores for each dimension
    Object.keys(responses).forEach(questionKey => {
      const score = responses[questionKey];
      const weights = questionWeights[questionKey];
      
      if (weights) {
        Object.keys(weights).forEach(dimension => {
          dimensions[dimension] += weights[dimension] * score;
        });
      }
    });

    // Calculate percentages for each dimension
    const dimensionPercentages = {};
    Object.keys(dimensions).forEach(dim => {
      const maxPossible = Object.values(questionWeights).reduce((sum, weights) => {
        return sum + (weights[dim] || 0) * 3;
      }, 0);
      dimensionPercentages[dim] = Math.round((dimensions[dim] / maxPossible) * 100);
    });

    // Calculate Loss Sensitivity (LS) from Loss Tolerance (LT)
    const LS = 100 - dimensionPercentages.LT;

    // Calculate overall risk capacity (equal weights: 20% each)
    const riskCapacity = Math.round(
      (dimensionPercentages.SI * 0.20) +
      (dimensionPercentages.FO * 0.20) +
      (LS * 0.20) +
      (dimensionPercentages.CO * 0.20) +
      (dimensionPercentages.AT * 0.20)
    );

    // Determine risk category
    let riskCategory = '';
    let riskDescription = '';
    let keywords = '';

    if (riskCapacity >= 0 && riskCapacity <= 30) {
      riskCategory = 'Highly Rational';
      keywords = 'Analytical, Disciplined, Methodical';
      riskDescription = 'You make financial decisions through careful analysis and research. You prefer data over emotions, take time to understand details, and stick to your plans even when market sentiment says otherwise.';
    } else if (riskCapacity >= 31 && riskCapacity <= 50) {
      riskCategory = 'Balanced';
      keywords = 'Thoughtful, Flexible, Pragmatic';
      riskDescription = 'You balance logic with intuition when making financial decisions. You do reasonable research before investing, but you are not stuck on analysis. You can follow your plan during ups and downs while remaining open to adjusting course with expert guidance.';
    } else if (riskCapacity >= 51 && riskCapacity <= 70) {
      riskCategory = 'Emotionally Influenced';
      keywords = 'Reactive, Intuitive, Social';
      riskDescription = 'Market news, global stories, and your own feelings about money naturally influence you. You may make quick decisions based on recent events, and sometimes second-guess your choices. You prefer having guardrails and automated systems to keep you on track.';
    } else {
      riskCategory = 'Highly Emotional';
      keywords = 'Impulsive, Cautious, Seeker';
      riskDescription = 'Your financial decisions are mainly driven by how you feel in the moment—excitement about opportunities, fear of losses, or worry about missing out. You prefer simple, reassuring investment options that require minimal ongoing decisions.';
    }

    return {
      riskCapacity,
      riskCategory,
      keywords,
      description: riskDescription,
      dimensions: {
        SI: dimensionPercentages.SI,
        FO: dimensionPercentages.FO,
        LS: LS,
        CO: dimensionPercentages.CO,
        AT: dimensionPercentages.AT
      }
    };
  };

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsAnalyzing(false);
            const scores = calculateRiskScores();
            setRiskScores(scores);
            setShowResults(true);
          }, 500);
          return 100;
        }
        return prev + (100 / 40);
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, []);

  // Typewriter effect for description
  useEffect(() => {
    if (showResults && riskScores) {
      let currentIndex = 0;
      const fullText = riskScores.description;
      
      const typeInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setTypewriterText(fullText.substring(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
        }
      }, 50);

      return () => clearInterval(typeInterval);
    }
  }, [showResults, riskScores]);

  const getBarColor = (percentage) => {
    if (percentage <= 30) return '#8B5CF6'; // Purple
    if (percentage <= 50) return '#A78BFA'; // Light Purple
    if (percentage <= 70) return '#FB923C'; // Light Orange
    return '#F97316'; // Orange
  };

  const handleContinue = () => {
    updateAnswer('risk_assessment', riskScores);
    updateAnswer('analysis_complete', true);
    router.push('/(gowealthy)/questionnaire/section4/screen18');
  };

  const handleBack = () => {
    router.back();
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

            <View style={styles.questionContainer}>
              <View style={styles.analysisContentContainer}>
                {isAnalyzing ? (
                  <>
                    <Text style={styles.analysisTitle}>
                      Analyzing Your Responses
                    </Text>

                    <View style={styles.videoContainer}>
                      <Video
                        source={require('../../../../assets/Analyzing_Responses.mp4')}
                        style={styles.video}
                        resizeMode="cover"
                        shouldPlay
                        isLooping
                        isMuted
                      />
                    </View>

                    <View style={styles.analysisProgressContainer}>
                      <View style={styles.progressBarBg}>
                        <View 
                          style={[
                            styles.progressBarFill,
                            { width: `${progress}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(progress)}% Complete
                      </Text>
                    </View>

                    <Text style={styles.analysisStatus}>
                      Processing your responses...
                    </Text>
                  </>
                ) : (
                  <View style={styles.fadeInResults}>
                    <Text style={styles.resultsMainTitle}>
                      Your Money Mindset
                    </Text>

                    <View style={styles.riskScoreDisplay}>
                      <Text style={[
                        styles.riskCategory,
                        { color: getBarColor(riskScores.riskCapacity) }
                      ]}>
                        {riskScores.riskCategory}
                      </Text>

                      <Text style={styles.keywords}>
                        {riskScores.keywords}
                      </Text>

                      <View style={styles.barVisualization}>
                        <LinearGradient
                          colors={['#8B5CF6', '#A78BFA', '#FB923C', '#F97316']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.gradientBar}
                        />
                        <View 
                          style={[
                            styles.marker,
                            { 
                              left: `${riskScores.riskCapacity}%`,
                              borderColor: getBarColor(riskScores.riskCapacity)
                            }
                          ]}
                        >
                          <Text style={[
                            styles.markerText,
                            { color: getBarColor(riskScores.riskCapacity) }
                          ]}>
                            {riskScores.riskCapacity}%
                          </Text>
                        </View>
                      </View>

                      <View style={styles.descriptionContainer}>
                        <Text style={styles.typewriterDescription}>
                          {typewriterText}
                          {typewriterText.length < riskScores.description.length && (
                            <Text style={styles.cursor}>|</Text>
                          )}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={handleContinue}
                      style={styles.continueButtonContainer}
                      activeOpacity={0.8}
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
    alignItems: 'center',
    paddingHorizontal: isMobile ? 10 : 40,
    paddingVertical: 20,
  },

  analysisContentContainer: {
    alignItems: 'center',
    maxWidth: 900,
    width: '100%',
  },

  analysisTitle: {
    fontSize: isMobile ? 24 : 32,
    fontWeight: 'bold',
    color: colors.accentColor,
    marginBottom: 30,
    lineHeight: isMobile ? 29 : 38,
    fontFamily: 'Poppins',
    textAlign: 'center',
  },

  videoContainer: {
    width: isMobile ? 280 : 400,
    height: isMobile ? 200 : 280,
    marginVertical: 20,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },

  video: {
    width: '100%',
    height: '100%',
  },

  analysisProgressContainer: {
    width: isMobile ? 280 : 400,
    marginBottom: 20,
  },

  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accentColor,
    borderRadius: 4,
  },

  progressText: {
    marginTop: 8,
    fontSize: isMobile ? 12 : 14,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },

  analysisStatus: {
    fontSize: isMobile ? 13 : 15,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  fadeInResults: {
    width: '100%',
    alignItems: 'center',
  },

  resultsMainTitle: {
    fontSize: isMobile ? 24 : 32,
    fontWeight: 'bold',
    color: colors.accentColor,
    marginBottom: 20,
    fontFamily: 'Syne',
    textAlign: 'center',
  },

  riskScoreDisplay: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: isMobile ? 30 : 40,
    borderWidth: 1,
    borderColor: '#374151',
    width: '100%',
  },

  riskCategory: {
    fontSize: isMobile ? 28 : 36,
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: 'Poppins',
    textAlign: 'center',
  },

  keywords: {
    fontSize: isMobile ? 18 : 20,
    color: '#d1d5db',
    fontWeight: '500',
    marginBottom: 24,
    fontFamily: 'Poppins',
    textAlign: 'center',
  },

  barVisualization: {
    position: 'relative',
    height: 40,
    borderRadius: 20,
    marginBottom: 32,
    overflow: 'visible',
  },

  gradientBar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },

  marker: {
    position: 'absolute',
    top: '50%',
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 30,
    borderWidth: 4,
    transform: [{ translateX: -30 }, { translateY: -30 }],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },

  markerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  descriptionContainer: {
    minHeight: 120,
  },

  typewriterDescription: {
    fontSize: isMobile ? 14 : 16,
    color: '#d1d5db',
    lineHeight: isMobile ? 22 : 26,
    textAlign: 'left',
    fontFamily: 'Poppins',
  },

  cursor: {
    opacity: 1,
  },

  continueButtonContainer: {
    marginTop: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },

  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
});

export default Screen17;