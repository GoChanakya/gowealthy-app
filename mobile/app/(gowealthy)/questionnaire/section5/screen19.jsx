import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuestionnaire } from '../../../../src/context/QuestionnaireContext';
// import { VITE_BUBBLE_ID, VITE_BUBBLE_AUTH } from '@env';

import {
  colors,
  globalStyles,
  isMobile
} from '../../../../src/theme/globalStyles';
const VITE_BUBBLE_ID = '9110';
const VITE_BUBBLE_AUTH = 'MzU3MGJlNWZjMGU5NDM3OGQyOTE1ZTU0';
const BUBBLE_API_URL = `https://${VITE_BUBBLE_ID}.bubblewhats.com/send-message`;

const Screen19 = () => {
  const router = useRouter();
  const { answers, updateAnswer } = useQuestionnaire();
  const scrollViewRef = useRef(null);
  const initializedRef = useRef(false);

  const [step, setStep] = useState('name');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: ''
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verifiedData, setVerifiedData] = useState(null);
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);

  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setBotTyping] = useState(false);

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

  // Initialize chat
  useEffect(() => {
    if (!initializedRef.current) {
      addBotMessage("Hi there! Let's start with your full name.", 1000);
      initializedRef.current = true;
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-continue after success
  useEffect(() => {
    if (step === 'success' && verifiedData) {
      const timer = setTimeout(() => {
        updateAnswer('user_verification', verifiedData);
        router.push('/(gowealthy)/questionnaire/section5/screen20');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step, verifiedData]);

  // Pre-generate OTP when step changes to phone
  useEffect(() => {
    if (step === 'phone') {
      const otpCode = generateOTP();
      setGeneratedOTP(otpCode.toString());
      setOtpExpiry(Date.now() + 5 * 60 * 1000); // 5 minutes
    }
  }, [step]);

  // Scroll to bottom when typing
  useEffect(() => {
    if (isTyping) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isTyping]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const formatPhone = (number) => {
    const digits = number.replace(/\D/g, '');
    if (number.startsWith('+')) {
      return number;
    }
    if (digits.startsWith('91') && digits.length === 12) {
      return `+${digits}`;
    } else if (digits.length === 10) {
      return `+91${digits}`;
    } else {
      return `+${digits}`;
    }
  };

  const getFirstName = (fullName) => {
    return fullName.trim().split(' ')[0];
  };

  const validateName = (name) => {
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      return { isValid: false, error: 'Name must be at least 3 characters long' };
    }
    if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
      return { isValid: false, error: 'Name should only contain letters and spaces' };
    }
    return { isValid: true, error: '' };
  };

  const validateMobile = (mobile) => {
    const digits = mobile.replace(/\D/g, '');
    if (digits.length !== 10) {
      return { isValid: false, error: 'Mobile number must be exactly 10 digits' };
    }
    if (!['6', '7', '8', '9'].includes(digits[0])) {
      return { isValid: false, error: 'Mobile number should start with 6, 7, 8, or 9' };
    }
    for (let i = 0; i <= digits.length - 5; i++) {
      const substring = digits.substring(i, i + 5);
      if (substring.split('').every(digit => digit === substring[0])) {
        return { isValid: false, error: 'Mobile number cannot have 5 continuous same digits' };
      }
    }
    return { isValid: true, error: '' };
  };

  const validateEmail = (email) => {
    if (email && !email.includes('@')) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true, error: '' };
  };

  const addMessage = (message, isBot = false, delay = 0) => {
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        text: message,
        isBot,
        timestamp: new Date()
      }]);
      setTimeout(scrollToBottom, 100);
    }, delay);
  };
      const goToTestScreen = () => {
    router.push('/(gowealthy)/questionnaire/section5/screen20');
  };

  const addBotMessage = (message, delay = 1000) => {
    setBotTyping(true);
    setTimeout(() => {
      setBotTyping(false);
      addMessage(message, true);
    }, delay);
  };

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };

  const sendOTP = async (phoneNumber) => {
    if (!phoneNumber) {
      addBotMessage("Please enter a valid phone number first.", 1000);
      return;
    }

    // Check if OTP has expired, regenerate if needed
    if (!generatedOTP || Date.now() > otpExpiry) {
      const newOTP = generateOTP();
      setGeneratedOTP(newOTP.toString());
      setOtpExpiry(Date.now() + 5 * 60 * 1000);
    }

    setLoading(true);
    addBotMessage("Sending Otp...", 500);

    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

      const response = await fetch(BUBBLE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': VITE_BUBBLE_AUTH
        },
        body: JSON.stringify({
          jid: formattedPhone,
          message: `Your OTP is ${generatedOTP} for GoWealthy. Please do not share it with anyone. Valid for 5 minutes.`
        })
      });

      if (response.ok) {
        setStep('otp');
        setCountdown(60);

        setMessages(prev => {
          const updated = [...prev];
          const lastMessageIndex = updated.length - 1;
          if (updated[lastMessageIndex] && updated[lastMessageIndex].text === "Sending Otp...") {
            updated[lastMessageIndex] = {
              ...updated[lastMessageIndex],
              text: "Otp Sent"
            };
          }
          return updated;
        });

        setTimeout(() => {
          addMessage(`Perfect! Please enter the OTP shared to +91${phoneNumber}.`, true);
        }, 1500);
      } else {
        const errorData = await response.json();
        setMessages(prev => {
          const updated = [...prev];
          const lastMessageIndex = updated.length - 1;
          if (updated[lastMessageIndex] && updated[lastMessageIndex].text === "Sending Otp...") {
            updated[lastMessageIndex] = {
              ...updated[lastMessageIndex],
              text: `Failed to send OTP. ${errorData.message || 'Please try again.'}`
            };
          }
          return updated;
        });
        setStep('phone');
      }
    } catch (err) {
      console.error('Send OTP Error:', err);
      setMessages(prev => {
        const updated = [...prev];
        const lastMessageIndex = updated.length - 1;
        if (updated[lastMessageIndex] && updated[lastMessageIndex].text === "Sending Otp...") {
          updated[lastMessageIndex] = {
            ...updated[lastMessageIndex],
            text: 'Network error. Please check your connection and try again.'
          };
        }
        return updated;
      });
      setStep('phone');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (otpCode) => {
    setLoading(true);

    try {
      if (otpCode === generatedOTP && Date.now() <= otpExpiry) {
        setVerifiedData({
          ...formData,
          phoneNumber: formatPhone(formData.phoneNumber),
          verifiedAt: new Date().toISOString()
        });
        setStep('success');
        addBotMessage('Excellent! Your phone number has been successfully verified!', 1500);
        setTimeout(() => {
          addBotMessage('You\'re all set!', 3000);
        }, 2000);
      } else if (Date.now() > otpExpiry) {
        addBotMessage('OTP has expired. Please request a new one.', 1000);
        setOtp('');
      } else {
        addBotMessage('Invalid OTP. Please try entering the code again, or I can resend it if needed.', 1000);
        setOtp('');
      }
    } catch (err) {
      console.error('Verify OTP Error:', err);
      addBotMessage('Verification failed. Please try again.', 1000);
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = () => {
    if (countdown > 0 || loading) return;
    setOtp('');

    const newOTP = generateOTP();
    setGeneratedOTP(newOTP.toString());
    setOtpExpiry(Date.now() + 5 * 60 * 1000);

    addMessage("Please resend the OTP");
    addBotMessage("No problem! Let me send you a new code.", 500);
    sendOTP(formData.phoneNumber);
  };

  const handleNameInput = (input) => {
    const validation = validateName(input);
    if (!validation.isValid) {
      addBotMessage(validation.error, 1000);
      return;
    }
    const firstName = getFirstName(input);
    setFormData(prev => ({ ...prev, fullName: input }));
    addBotMessage(`Nice to meet you, ${firstName}!`, 1000);
    setTimeout(() => {
      setStep('email');
      addBotMessage("What's your email address? (Optional - you can type 'skip' to skip this step)", 2500);
    }, 1500);
  };

  const handleEmailInput = (input) => {
    const firstName = getFirstName(formData.fullName);
    if (input.toLowerCase().trim() === 'skip') {
      addBotMessage("No worries! We'll skip the email.", 1000);
      setTimeout(() => {
        setStep('phone');
        addBotMessage(`Now ${firstName}, Please enter your 10-digit WhatsApp mobile number.`, 2500);
      }, 1500);
      return;
    }
    const validation = validateEmail(input);
    if (!validation.isValid) {
      addBotMessage(`${validation.error}. Please try again or type 'skip' to skip this step.`, 1000);
      return;
    }
    setFormData(prev => ({ ...prev, email: input }));
    addBotMessage("Perfect! Email saved.", 1000);
    setTimeout(() => {
      setStep('phone');
      addBotMessage(`Now ${firstName}, I need your WhatsApp number for verification. Please enter your 10-digit mobile number.`, 2500);
    }, 1500);
  };

  const handlePhoneInput = (input) => {
    const cleanNumber = input.replace(/\D/g, '');
    const validation = validateMobile(cleanNumber);
    if (!validation.isValid) {
      addBotMessage(validation.error, 1000);
      return;
    }
    setFormData(prev => ({ ...prev, phoneNumber: cleanNumber }));
    sendOTP(cleanNumber);
  };

  const handleOTPInput = (input) => {
    const cleanOTP = input.replace(/\D/g, '');
    if (cleanOTP.length !== 6) {
      addBotMessage("Please enter the complete 6-digit OTP.", 1000);
      return;
    }
    setOtp(cleanOTP);
    verifyOTP(cleanOTP);
  };

  const handleUserInput = () => {
    if (!currentInput.trim() || loading || isTyping) return;
    const input = currentInput.trim();
    addMessage(input);
    setCurrentInput('');
    setTimeout(() => {
      switch (step) {
        case 'name':
          handleNameInput(input);
          break;
        case 'email':
          handleEmailInput(input);
          break;
        case 'phone':
          handlePhoneInput(input);
          break;
        case 'otp':
          handleOTPInput(input);
          break;
        default:
          break;
      }
    }, 500);
  };

  const editPhoneNumber = () => {
    setOtp('');
    setCountdown(0);
    setStep('phone');
    addMessage("Edit phone number");
    addBotMessage("Sure! Please enter your WhatsApp number again.", 500);
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={globalStyles.appContainer}>
            <View style={globalStyles.header}>
              <TouchableOpacity style={globalStyles.backButton} onPress={handleBack}>
                <Text style={globalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <View style={globalStyles.logo}>
                <Text style={globalStyles.sectionTitle}>
                  Let's verify your details
                </Text>
              </View>
            </View>
<TouchableOpacity
              onPress={goToTestScreen}
              style={{
                backgroundColor: '#FF6B35',
                padding: 15,
                borderRadius: 10,
                marginBottom: 20,
                marginHorizontal: 20,
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                skip this screen (for testing purposes)
              </Text>
            </TouchableOpacity>
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

            <View style={styles.chatContainer}>
              <View style={styles.messagesContainer}>
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesScrollView}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={false}
                >
                  {messages.map((message) => (
                    <View
                      key={message.id}
                      style={[
                        styles.messageRow,
                        message.isBot ? styles.messageRowBot : styles.messageRowUser
                      ]}
                    >
                      <View
                        style={[
                          styles.messageBubble,
                          message.isBot ? styles.messageBubbleBot : styles.messageBubbleUser
                        ]}
                      >
                        {message.isBot && (
                          <View style={styles.botHeader}>
                            <Text style={styles.botEmoji}>🤖</Text>
                            <Text style={styles.botName}>GoWealthy Bot</Text>
                          </View>
                        )}
                        <Text style={styles.messageText}>
                          {message.text}
                        </Text>
                        {message.isBot && message.text.includes('Perfect! Please enter the OTP shared to +91') && (
                          <TouchableOpacity onPress={editPhoneNumber}>
                            <Text style={styles.editButton}>Edit</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}

                  {isTyping && (
                    <View style={[styles.messageRow, styles.messageRowBot]}>
                      <View style={[styles.messageBubble, styles.messageBubbleBot]}>
                        <View style={styles.botHeader}>
                          <Text style={styles.botEmoji}>🤖</Text>
                          <Text style={styles.botName}>GoWealthy Bot</Text>
                        </View>
                        <View style={styles.typingIndicator}>
                          <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                          <View style={[styles.typingDot, { animationDelay: '100ms' }]} />
                          <View style={[styles.typingDot, { animationDelay: '200ms' }]} />
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.inputContainer}>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.textInput}
                      value={currentInput}
                      onChangeText={setCurrentInput}
                      placeholder={
                        step === 'name' ? 'Type your full name...' :
                          step === 'email' ? 'Type your email or "skip"...' :
                            step === 'phone' ? 'Type your 10-digit mobile number...' :
                              step === 'otp' ? 'Enter the 6-digit OTP...' :
                                step === 'success' ? 'Directing to next step...' :
                                  'Type your message...'
                      }
                      placeholderTextColor={colors.subtitleColor}
                      editable={!loading && !isTyping}
                      autoFocus
                      returnKeyType="send"
                      onSubmitEditing={handleUserInput}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        (!currentInput.trim() || loading || isTyping) && styles.sendButtonDisabled
                      ]}
                      onPress={handleUserInput}
                      disabled={!currentInput.trim() || loading || isTyping}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color={colors.textColor} />
                      ) : (
                        <Text style={styles.sendButtonText}>➤</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {step === 'otp' && (
                    <View style={styles.resendContainer}>
                      <TouchableOpacity
                        onPress={resendOTP}
                        disabled={countdown > 0 || loading}
                        style={styles.resendButton}
                      >
                        <Text
                          style={[
                            styles.resendText,
                            (countdown > 0 || loading) && styles.resendTextDisabled
                          ]}
                        >
                          {countdown > 0
                            ? `Resend code in ${countdown}s`
                            : "Didn't receive the code? Click to resend"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 672,
    alignSelf: 'center',
    paddingHorizontal: isMobile ? 16 : 24,
  },

  messagesContainer: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },

  messagesScrollView: {
    flex: 1,
  },

  messagesContent: {
    padding: 16,
    gap: 16,
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  messageRowBot: {
    justifyContent: 'flex-start',
  },

  messageRowUser: {
    justifyContent: 'flex-end',
  },

  messageBubble: {
    maxWidth: '75%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },

  messageBubbleBot: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },

  messageBubbleUser: {
    backgroundColor: '#374151',
  },

  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  botEmoji: {
    fontSize: 14,
    marginRight: 6,
  },

  botName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF8500',
  },

  messageText: {
    fontSize: 14,
    color: colors.textColor,
    lineHeight: 20,
  },

  editButton: {
    fontSize: 12,
    color: '#FF8500',
    textDecorationLine: 'underline',
    marginTop: 6,
  },

  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },

  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textColor,
  },

  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    padding: 16,
  },

  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },

  textInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textColor,
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    opacity: 0.5,
  },

  sendButtonText: {
    fontSize: 20,
    color: colors.textColor,
    fontWeight: '600',
  },

  resendContainer: {
    marginTop: 12,
    alignItems: 'center',
  },

  resendButton: {
    paddingVertical: 8,
  },

  resendText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366f1',
  },

  resendTextDisabled: {
    color: colors.subtitleColor,
  },
});

export default Screen19;