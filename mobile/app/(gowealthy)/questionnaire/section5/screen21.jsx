import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StatusBar,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import { useQuestionnaire } from '../../../../src/context/QuestionnaireContext';

import {
  colors,
  globalStyles,
  isMobile
} from '../../../../src/theme/globalStyles';

const API_URL = 'http://localhost:5000'; // Change to your IP for real device testing
const RAZORPAY_KEY = 'rzp_test_RPOWWhySJj5p5d';

const Screen21 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [advisorDetails, setAdvisorDetails] = useState({
    name: '',
    mobile: ''
  });
  const [loading, setLoading] = useState(false);

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

  const plans = [
    {
      name: "Pro Plan",
      price: "₹450",
      razorpayPlanId: "plan_RPOM9sVlYLZ7Av",
      originalPrice: "₹3,000",
      period: "/month",
      description: "Comprehensive financial planning for families",
      theme: "purple",
      popular: true,
      features: [
        "Family Financial Plan",
        "Unlimited Goals",
        "Advance Fund Selection",
        "Risk Assessment",
        "Asset Allocation",
        "Money Persona",
        "Expense Analyser",
        "Premium Learning Content"
      ],
      buttonText: "Choose Pro Plan"
    },
    {
      name: "Basic Plan",
      price: "₹0",
      razorpayPlanId: "plan_RPOLwDrvObKKvd",
      originalPrice: "₹1,800",
      period: "/month",
      description: "Perfect for individuals getting started with financial planning",
      theme: "orange",
      features: [
        "Single Financial Plan",
        "3 Goals",
        "Insurance Plan",
        "Emergency Fund",
        "Basic Mutual Fund"
      ],
      buttonText: "Choose Basic Plan"
    }
  ];

  const handlePlanSelect = (planIndex) => {
    if (selectedPlan === planIndex) {
      setSelectedPlan(null);
    } else {
      setSelectedPlan(planIndex);
    }
  };

  const handleAdvisorDetailChange = (field, value) => {
    setAdvisorDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePayment = async () => {
    if (selectedPlan === null) {
      Alert.alert("Error", "Please select a plan first");
      return;
    }

    const plan = plans[selectedPlan];
    setLoading(true);

    try {
      // Create subscription via backend
      const response = await fetch(`${API_URL}/api/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.razorpayPlanId })
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const subscription = await response.json();

      // Razorpay options
      const options = {
        key: RAZORPAY_KEY,
        subscription_id: subscription.id,
        name: "GoWealthy",
        description: plan.name,
        prefill: {
          name: answers.user_verification?.fullName || '',
          email: answers.user_verification?.email || '',
          contact: answers.user_verification?.phoneNumber || ''
        },
        theme: {
          color: plan.theme === 'orange' ? "#ff6300" : "#6c50c4"
        }
      };

      // Open Razorpay
      RazorpayCheckout.open(options)
        .then((data) => {
          // Payment successful
          console.log("✅ Payment successful! ID:", data.razorpay_payment_id);

          const subscriptionStartDate = new Date();
          const subscriptionEndDate = new Date();
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

          const subscriptionType = plan.price === "₹0" ? 'free' : 'paid';

          // Save to context only
          updateAnswer('payment_info', {
            razorpay_payment_id: data.razorpay_payment_id,
            subscription_id: subscription.id,
            subscription_type: subscriptionType,
            payment_completed: true,
            payment_timestamp: subscriptionStartDate.toISOString(),
            selected_payment_plan: plan.name,
            subscription_start_date: subscriptionStartDate.toISOString(),
            subscription_end_date: subscriptionEndDate.toISOString(),
            subscription_status: 'active',
            advisor_info: advisorDetails.name.trim() && advisorDetails.mobile.trim() ? advisorDetails : null
          });

          Alert.alert('Success', 'Payment successful!');

          // Navigate to next screen
          setTimeout(() => {
            router.replace('/(gowealthy)/questionnaire/section5/screen22');
          }, 1000);

        })
        .catch((error) => {
          console.error('Razorpay Error:', error);
          if (error.code !== RazorpayCheckout.PAYMENT_CANCELLED) {
            Alert.alert('Payment Failed', error.description || 'Something went wrong');
          }
        })
        .finally(() => {
          setLoading(false);
        });

    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to create subscription. Please try again.');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Save to context only
    updateAnswer('payment_info', {
      subscription_type: 'free',
      payment_completed: false,
      payment_timestamp: new Date().toISOString(),
      subscription_status: 'skip',
      advisor_info: advisorDetails.name.trim() && advisorDetails.mobile.trim() ? advisorDetails : null
    });

    router.push('/(gowealthy)/questionnaire/section5/screen22');
  };

  const canProceedToPayment = () => {
    if (selectedPlan === null) return false;
    const hasAdvisorInfo = advisorDetails.name.trim() !== '' || advisorDetails.mobile.trim() !== '';
    if (hasAdvisorInfo) {
      return advisorDetails.name.trim() !== '' && advisorDetails.mobile.trim() !== '';
    }
    return true;
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
            <View style={globalStyles.header}>
              <TouchableOpacity style={globalStyles.backButton} onPress={handleBack}>
                <Text style={globalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <View style={globalStyles.logo}>
                <Text style={globalStyles.sectionTitle}>
                  Choose Your Plan
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

            <View style={styles.contentContainer}>
              <Text style={styles.subtitle}>
                Choose the perfect plan for your financial journey
              </Text>

              {/* Plans Grid */}
              <View style={styles.plansContainer}>
                {plans.map((plan, index) => {
                  const isSelected = selectedPlan === index;
                  const isOtherSelected = selectedPlan !== null && selectedPlan !== index;

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handlePlanSelect(index)}
                      activeOpacity={0.8}
                      style={[
                        styles.planCard,
                        isOtherSelected && styles.planCardFaded
                      ]}
                    >
                      <LinearGradient
                        colors={
                          isSelected
                            ? plan.theme === 'orange'
                              ? ['rgba(255, 99, 0, 0.2)', 'rgba(229, 90, 0, 0.1)']
                              : ['rgba(83, 46, 166, 0.2)', 'rgba(108, 80, 196, 0.1)']
                            : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
                        }
                        style={[
                          styles.planCardGradient,
                          isSelected && {
                            borderColor: plan.theme === 'orange' ? '#ff6300' : '#6c50c4',
                            borderWidth: 2
                          }
                        ]}
                      >
                        {isSelected && (
                          <View style={styles.checkmarkBadge}>
                            <Text style={styles.checkmark}>✓</Text>
                          </View>
                        )}

                        {plan.popular && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularText}>POPULAR</Text>
                          </View>
                        )}

                        <View style={[
                          styles.planIcon,
                          { backgroundColor: plan.theme === 'orange' ? '#ff6300' : '#6c50c4' }
                        ]}>
                          <Text style={styles.planIconText}>
                            {plan.theme === 'orange' ? '⚡' : '⭐'}
                          </Text>
                        </View>

                        <Text style={[
                          styles.planName,
                          { color: plan.theme === 'orange' ? '#FF6B35' : '#6c50c4' }
                        ]}>
                          {plan.name}
                        </Text>

                        <View style={styles.priceContainer}>
                          <Text style={styles.planPrice}>{plan.price}</Text>
                          <Text style={styles.planPeriod}>{plan.period}</Text>
                        </View>

                        {selectedPlan === null && (
                          <Text style={styles.planDescription}>
                            {plan.description}
                          </Text>
                        )}

                        {selectedPlan === null && (
                          <View style={styles.featuresContainer}>
                            {plan.features.map((feature, idx) => (
                              <View key={idx} style={styles.featureRow}>
                                <View style={[
                                  styles.featureCheck,
                                  { backgroundColor: plan.theme === 'orange' ? '#ff6300' : '#6c50c4' }
                                ]}>
                                  <Text style={styles.featureCheckText}>✓</Text>
                                </View>
                                <Text style={styles.featureText}>{feature}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {isSelected && (
                          <View style={styles.selectedBadge}>
                            <View style={[
                              styles.selectedDot,
                              { backgroundColor: plan.theme === 'orange' ? '#ff6300' : '#6c50c4' }
                            ]} />
                            <Text style={styles.selectedText}>Selected Plan</Text>
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Advisor Section */}
              {selectedPlan !== null && (
                <View style={styles.advisorSection}>
                  <View style={styles.advisorHeader}>
                    <View style={styles.advisorIcon}>
                      <Text style={styles.advisorIconText}>👤</Text>
                    </View>
                    <View style={styles.advisorHeaderText}>
                      <Text style={styles.advisorTitle}>Link your Advisor</Text>
                      <Text style={styles.advisorSubtitle}>
                        Get 20% cashback if your advisor signs up with us (Optional)
                      </Text>
                    </View>
                  </View>

                  <View style={styles.advisorForm}>
                    <Text style={styles.inputLabel}>
                      Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={advisorDetails.name}
                      onChangeText={(value) => handleAdvisorDetailChange('name', value)}
                      placeholder="Enter advisor's full name"
                      placeholderTextColor={colors.subtitleColor}
                    />

                    <Text style={styles.inputLabel}>
                      Mobile Number <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={advisorDetails.mobile}
                      onChangeText={(value) => handleAdvisorDetailChange('mobile', value)}
                      placeholder="Enter advisor's WhatsApp number"
                      placeholderTextColor={colors.subtitleColor}
                      keyboardType="phone-pad"
                    />

                    <Text style={styles.inputNote}>
                      *Both fields are required if you want to link an advisor
                    </Text>
                  </View>
                </View>
              )}

              {/* Proceed to Payment Button */}
              {selectedPlan !== null && (
                <TouchableOpacity
                  onPress={handlePayment}
                  disabled={!canProceedToPayment() || loading}
                  style={[
                    styles.paymentButton,
                    (!canProceedToPayment() || loading) && styles.paymentButtonDisabled
                  ]}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.paymentButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.textColor} />
                    ) : (
                      <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Skip Button */}
              <View style={globalStyles.confirmButton}>
                <TouchableOpacity
                  onPress={handleSkip}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.gradientPurple1, colors.gradientPurple2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={globalStyles.buttonInner}
                  >
                    <Text style={globalStyles.confirmButtonText}>Skip Payment & Continue</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: isMobile ? 16 : 24,
    paddingBottom: 30,
    alignItems: 'center',
  },

  subtitle: {
    fontSize: isMobile ? 14 : 16,
    color: colors.subtitleColor,
    textAlign: 'center',
    marginBottom: isMobile ? 20 : 24,
    maxWidth: 600,
  },

  plansContainer: {
    width: '100%',
    maxWidth: 800,
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? 16 : 20,
    marginBottom: 24,
  },

  planCard: {
    flex: 1,
    minHeight: 400,
  },

  planCardFaded: {
    opacity: 0.3,
  },

  planCardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },

  checkmarkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  checkmark: {
    color: colors.textColor,
    fontSize: 16,
    fontWeight: 'bold',
  },

  popularBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 8,
  },

  popularText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },

  planIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },

  planIconText: {
    fontSize: 32,
  },

  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 12,
  },

  planPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textColor,
  },

  planPeriod: {
    fontSize: 14,
    color: colors.subtitleColor,
    marginLeft: 8,
  },

  planDescription: {
    fontSize: 13,
    color: colors.subtitleColor,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },

  featuresContainer: {
    gap: 12,
    marginBottom: 16,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  featureCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  featureCheckText: {
    color: colors.textColor,
    fontSize: 12,
    fontWeight: 'bold',
  },

  featureText: {
    flex: 1,
    fontSize: 13,
    color: colors.textColor,
  },

  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 12,
  },

  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  selectedText: {
    fontSize: 12,
    color: colors.textColor,
    fontWeight: '600',
  },

  advisorSection: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    marginBottom: 24,
  },

  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },

  advisorIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6c50c4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  advisorIconText: {
    fontSize: 24,
  },

  advisorHeaderText: {
    flex: 1,
  },

  advisorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textColor,
    marginBottom: 4,
  },

  advisorSubtitle: {
    fontSize: 12,
    color: colors.subtitleColor,
  },

  advisorForm: {
    gap: 16,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textColor,
    marginBottom: 8,
  },

  required: {
    color: '#ef4444',
  },

  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.textColor,
  },

  inputNote: {
    fontSize: 11,
    color: colors.subtitleColor,
    fontStyle: 'italic',
  },

  paymentButton: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },

  paymentButtonDisabled: {
    opacity: 0.5,
  },

  paymentButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },

  paymentButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textColor,
  },
});

export default Screen21;