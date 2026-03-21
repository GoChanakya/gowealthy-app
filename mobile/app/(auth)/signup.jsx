import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StatusBar, StyleSheet, KeyboardAvoidingView,
    Platform, ScrollView, ActivityIndicator, Alert,
    Animated, Dimensions, Easing, Image,
} from 'react-native';
// import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';


const { width: W, height: H } = Dimensions.get('window');
const ND = Platform.OS !== 'web';

const VITE_BUBBLE_ID = '9110';
const VITE_BUBBLE_AUTH = 'MzU3MGJlNWZjMGU5NDM3OGQyOTE1ZTU0';
const BUBBLE_API_URL = `https://${VITE_BUBBLE_ID}.bubblewhats.com/send-message`;
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const C = {
    bg: '#000000', card: '#0d1117', cardBorder: '#1a2332',
    orange: '#FF8500', orangeFaint: 'rgba(255,133,0,0.08)',
    orangeBorder: 'rgba(255,133,0,0.35)', purple: '#6C50C4',
    white: '#ffffff', gray300: '#d1d5db', gray400: '#9ca3af',
    gray500: '#6b7280', gray600: '#4b5563', gray700: '#374151',
    inputBg: '#080d14',
};

const Particle = ({ x, y, size, delay, color, duration }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        setTimeout(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(opacity, { toValue: 0.6, duration: duration * 0.4, easing: Easing.out(Easing.quad), useNativeDriver: ND }),
                        Animated.timing(translateY, { toValue: -10, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
                    ]),
                    Animated.parallel([
                        Animated.timing(opacity, { toValue: 0.1, duration: duration * 0.4, easing: Easing.in(Easing.quad), useNativeDriver: ND }),
                        Animated.timing(translateY, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
                    ]),
                ])
            ).start();
        }, delay);
    }, []);
    return (
        <Animated.View style={{
            position: 'absolute', left: x, top: y,
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: color, opacity, transform: [{ translateY }],
        }} />
    );
};

const PARTICLES = [
    { x: W * 0.06, y: H * 0.10, size: 3, delay: 300, color: '#FF8500', duration: 3200 },
    { x: W * 0.88, y: H * 0.08, size: 4, delay: 700, color: '#FF8500', duration: 2900 },
    { x: W * 0.12, y: H * 0.65, size: 2.5, delay: 500, color: '#6C50C4', duration: 3600 },
    { x: W * 0.85, y: H * 0.60, size: 3.5, delay: 900, color: '#6C50C4', duration: 2700 },
];

const STEPS = ['name', 'email', 'phone'];

export default function SignupScreen() {
    const router = useRouter();
    //   const [step, setStep]       = useState('name');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    //   const [phone, setPhone]     = useState('');
    const [loading, setLoading] = useState(false);

    const { phone: prefillPhone } = useLocalSearchParams();
    const [phone, setPhone] = useState(prefillPhone || '');
    const [step, setStep] = useState('name');

    const STEPS = ['name', 'email', 'phone'];


    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(28)).current;
    const cardAnim = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(32)).current;

    useEffect(() => {
        Animated.stagger(120, [
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: ND }),
                Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: ND }),
            ]),
            Animated.parallel([
                Animated.timing(cardAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: ND }),
                Animated.spring(cardSlide, { toValue: 0, tension: 55, friction: 9, useNativeDriver: ND }),
            ]),
        ]).start();
    }, []);

    const isValidName = (v) => v.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(v.trim());
    const isValidEmail = (v) => !v || v.includes('@');
    const isValidPhone = () => {
        const d = phone.replace(/\D/g, '');
        if (d.length !== 10) return false;
        if (!['6', '7', '8', '9'].includes(d[0])) return false;
        for (let i = 0; i <= d.length - 5; i++) {
            const sub = d.substring(i, i + 5);
            if (sub.split('').every(x => x === sub[0])) return false;
        }
        return true;
    };

    const handleNext = async () => {
        if (step === 'name') {
            if (!isValidName(name)) {
                Alert.alert('Invalid Name', 'Please enter your full name (letters only, min 2 characters).');
                return;
            }
            setStep('email');
        } else if (step === 'email') {
            if (!isValidEmail(email)) {
                Alert.alert('Invalid Email', 'Please enter a valid email or leave it empty.');
                return;
            }
            setStep('phone');
        } else if (step === 'phone') {
            if (!isValidPhone()) {
                Alert.alert('Invalid Number', 'Please enter a valid 10-digit Indian mobile number.');
                return;
            }
            await sendOTP();
        }
    };

    const sendOTP = async () => {
        setLoading(true);
        const otp = generateOTP();
        const expiry = (Date.now() + 5 * 60 * 1000).toString();
        const clean = phone.replace(/\D/g, '');
        try {
            const res = await fetch(BUBBLE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': VITE_BUBBLE_AUTH },
                body: JSON.stringify({
                    jid: `91${clean}`,
                    message: `Your OTP is ${otp} for GoWealthy. Please do not share it with anyone. Valid for 5 minutes.`,
                }),
            });
            if (res.ok) {
                router.push({
                    pathname: '/(auth)/otp',
                    params: { phone: clean, otp, expiry, name: name.trim(), email: email.trim(), isSignup: 'true' },
                });
            } else {
                Alert.alert('Could not send OTP', 'Please check your number and try again.');
            }
        } catch {
            Alert.alert('Network Error', 'Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const stepIndex = STEPS.indexOf(step);
    const canProceed = step === 'name' ? isValidName(name)
        : step === 'email' ? true
            : isValidPhone();

    const label = step === 'name' ? 'Full Name'
        : step === 'email' ? 'Email Address'
            : 'Phone Number';

    const placeholder = step === 'name' ? 'Your full name'
        : step === 'email' ? 'your@email.com (optional)'
            : '98765 43210';

    const value = step === 'name' ? name : step === 'email' ? email : phone;
    const setValue = step === 'name' ? setName : step === 'email' ? setEmail : setPhone;

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
            <View style={s.root}>
                <LinearGradient
                    colors={['#0a0408', '#060308', '#000000', '#04030a']}
                    locations={[0, 0.35, 0.65, 1]}
                    start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                        <Animated.View style={[s.brand, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Image source={require('../../assets/images/logo.png')} style={s.logoImg} resizeMode="contain" />
                            <View>
                                <Text style={s.brandSub}>Create your account</Text>
                                <Text style={s.brandName}>
                                    <Text style={s.brandNameLight}>Go</Text>Wealthy
                                </Text>
                            </View>
                        </Animated.View>

                        <Animated.View style={[s.card, { opacity: cardAnim, transform: [{ translateY: cardSlide }] }]}>
                            <LinearGradient
                                colors={['#FF8500', '#6C50C4']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={s.cardTopLine}
                            />

                            <View style={s.stepRow}>
                                {STEPS.map((st, i) => (
                                    <View key={st} style={[s.stepDot, i <= stepIndex && s.stepDotActive]} />
                                ))}
                            </View>

                            <Text style={s.cardTitle}>
                                {step === 'name' ? 'What\'s your name?' :
                                    step === 'email' ? 'Your email?' : 'Your WhatsApp number?'}
                            </Text>
                            {/* <Text style={s.cardSub}>
                {step === 'name'  ? 'We\'ll use this to personalise your experience.' :
                 step === 'email' ? 'Optional — for account recovery and updates.' :
                 'We\'ll send an OTP to verify your number.'}
              </Text> */}
                            <Text style={s.cardSub}>
                                {step === 'name' ? 'We\'ll use this to personalise your experience.' :
                                    step === 'email' ? 'Optional — for account recovery and updates.' :
                                        prefillPhone ? `We\'ll send an OTP to +91 ${phone}.` : 'We\'ll send an OTP to verify your number.'}
                            </Text>

                            <Text style={s.inputLabel}>{label}</Text>

                            <View style={[s.inputRow, canProceed && s.inputRowActive]}>
                                {step === 'phone' && (
                                    <>
                                        <View style={s.prefixBox}>
                                            <Text style={s.prefix}>🇮🇳  +91</Text>
                                        </View>
                                        <View style={s.inputDivider} />
                                    </>
                                )}
                                <TextInput
                                    style={[s.input, prefillPhone && { color: C.gray400 }]}
                                    placeholder={placeholder}
                                    placeholderTextColor={C.gray600}
                                    keyboardType={step === 'phone' ? 'numeric' : step === 'email' ? 'email-address' : 'default'}
                                    autoCapitalize={step === 'name' ? 'words' : 'none'}
                                    maxLength={step === 'phone' ? 10 : undefined}
                                    value={value}
                                    editable={!(step === 'phone' && prefillPhone)}
                                    onChangeText={(t) => {
                                        if (step === 'phone') {
                                            if (/^\d*$/.test(t)) setValue(t);
                                        } else {
                                            setValue(t);
                                        }
                                    }}
                                    returnKeyType={step === 'phone' ? 'done' : 'next'}
                                    onSubmitEditing={handleNext}
                                    autoFocus
                                />
                            </View>

                            <TouchableOpacity onPress={handleNext} disabled={loading} activeOpacity={0.86}>
                                {canProceed ? (
                                    <LinearGradient
                                        colors={['#FF8500', '#d96800']}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={s.btn}
                                    >
                                        {loading
                                            ? <ActivityIndicator color="#fff" />
                                            : <Text style={s.btnText}>{step === 'phone' ? 'Send OTP  →' : 'Continue  →'}</Text>
                                        }
                                    </LinearGradient>
                                ) : (
                                    <View style={[s.btn, s.btnDisabled]}>
                                        <Text style={[s.btnText, { color: C.gray600 }]}>
                                            {step === 'phone' ? 'Send OTP  →' : 'Continue  →'}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {step === 'email' && (
                                <TouchableOpacity onPress={() => { setEmail(''); setStep('phone'); }} style={s.skipBtn}>
                                    <Text style={s.skipText}>Skip for now</Text>
                                </TouchableOpacity>
                            )}

                        </Animated.View>

                        <Animated.View style={[s.trust, { opacity: cardAnim }]}>
                            {['🔒 Secure', '🇮🇳 Made in India', '✦ GoChanakya'].map((t, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && <View style={s.trustDiv} />}
                                    <Text style={s.trustText}>{t}</Text>
                                </React.Fragment>
                            ))}
                        </Animated.View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 32 },
    logoImg: { width: 44, height: 44, borderRadius: 12 },
    brandSub: { fontSize: 12, color: C.gray500, fontWeight: '500', marginBottom: 2 },
    brandName: { fontSize: 26, fontWeight: '800', color: C.orange, letterSpacing: -0.5, fontFamily: 'Syne' },
    brandNameLight: { color: 'rgba(255,255,255,0.55)', fontWeight: '300' },
    card: {
        backgroundColor: 'rgba(13,17,23,0.85)',
        borderWidth: 1, borderColor: C.cardBorder,
        borderRadius: 24, overflow: 'hidden',
        paddingHorizontal: 24, paddingBottom: 28, paddingTop: 0,
        maxWidth: 440, alignSelf: 'stretch',
    },
    cardTopLine: { height: 2, width: '100%', marginBottom: 24 },
    stepRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
    stepDot: { width: 24, height: 4, borderRadius: 2, backgroundColor: C.cardBorder },
    stepDotActive: { backgroundColor: C.orange },
    cardTitle: {
        fontSize: 24, fontWeight: '800', color: C.white,
        marginBottom: 8, letterSpacing: -0.4, fontFamily: 'Syne',
    },
    cardSub: { fontSize: 13, color: C.gray500, lineHeight: 20, marginBottom: 24 },
    inputLabel: {
        fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)',
        marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2,
    },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.inputBg,
        borderWidth: 1.5, borderColor: C.cardBorder,
        borderRadius: 14, marginBottom: 20, overflow: 'hidden',
    },
    inputRowActive: { borderColor: C.orange },
    prefixBox: { paddingHorizontal: 14, paddingVertical: 15, backgroundColor: 'rgba(255,133,0,0.05)' },
    prefix: { fontSize: 14, color: C.gray400, fontWeight: '600' },
    inputDivider: { width: 1, height: '55%', backgroundColor: C.cardBorder },
    input: {
        flex: 1, fontSize: 16, color: C.white,
        paddingHorizontal: 14, paddingVertical: 15, fontWeight: '500',
    },
    btn: {
        borderRadius: 14, paddingVertical: 16,
        alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    },
    btnDisabled: { backgroundColor: '#080d14', borderWidth: 1, borderColor: C.cardBorder },
    btnText: { fontSize: 15, fontWeight: '800', color: C.white, letterSpacing: 0.3 },
    skipBtn: { alignItems: 'center', marginBottom: 14 },
    skipText: { fontSize: 13, color: C.gray500, fontWeight: '500' },
    loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 6 },
    loginText: { fontSize: 13, color: C.gray500 },
    loginLink: { fontSize: 13, color: C.orange, fontWeight: '700' },
    trust: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', marginTop: 28, gap: 10, flexWrap: 'wrap',
    },
    trustDiv: { width: 1, height: 10, backgroundColor: C.gray700 },
    trustText: { fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: '500' },
});