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
import { LinearGradient } from 'expo-linear-gradient';
import { useQuestionnaire } from '../../../../src/context/QuestionnaireContext';
import ScreenScrollView from '../../../../src/components/ScreenScrollView';

import {
    colors,
    globalStyles,
    isMobile
} from '../../../../src/theme/globalStyles';

const Screen18 = () => {
    const router = useRouter();
    const { answers, updateAnswer } = useQuestionnaire();
    const [showContent, setShowContent] = useState(false);
    const fadeAnim = new Animated.Value(0);
    const translateAnim = new Animated.Value(20);

    const progressData = {
        sectionData: {
            1: { isActive: false, progress: 0, isCompleted: true },
            2: { isActive: false, progress: 0, isCompleted: true },
            3: { isActive: false, progress: 0, isCompleted: true },
            4: { isActive: false, progress: 0, isCompleted: true },
            5: { isActive: true, progress: 100, isCompleted: false },
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
        const timer = setTimeout(() => {
            setShowContent(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(translateAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                })
            ]).start();
        }, 300);

        return () => clearTimeout(timer);
    }, []);


    const handleContinue = () => {
        setTimeout(() => {
              router.replace('/(gowealthy)/questionnaire/section5/screen19');
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
                                    Goal Planning
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
                            <Animated.View
                                style={[
                                    styles.transitionContentContainer,
                                    {
                                        opacity: fadeAnim,
                                        transform: [{ translateY: translateAnim }]
                                    }
                                ]}
                            >
                                <Text style={styles.transitionMainTitle}>
                                    Prioritize better, Achieve Faster!
                                </Text>

                                <View style={styles.riveContainer}>
                                    <Text style={styles.emojiPlaceholder}>🎯</Text>
                                    <Text style={styles.placeholderText}>Goal Planning</Text>
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
                            </Animated.View>
                        </View>
                    </View>
                </ScreenScrollView>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    transitionContentContainer: {
        width: '100%',
        maxWidth: 600,
        alignItems: 'center',
        paddingHorizontal: isMobile ? 16 : 24,
    },

    transitionMainTitle: {
        fontSize: isMobile ? 20 : 30,
        fontWeight: 'bold',
        color: colors.accentColor,
        marginBottom: 20,
        lineHeight: isMobile ? 26 : 36,
        fontFamily: 'Syne',
        textAlign: 'center',
    },

    riveContainer: {
        height: 200,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },

    riveAnimation: {
        width: '100%',
        height: '100%',
    },

    emojiPlaceholder: {
        fontSize: 80,
        marginBottom: 10,
    },

    placeholderText: {
        fontSize: 18,
        color: colors.textColor,
        fontWeight: '600',
        opacity: 0.8,
    },
});

export default Screen18;