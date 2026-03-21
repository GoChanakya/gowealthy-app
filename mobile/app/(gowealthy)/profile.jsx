// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   StatusBar,
//   Dimensions,
//   Animated,
//   Image,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { doc, getDoc,updateDoc } from 'firebase/firestore';
// import { LinearGradient } from 'expo-linear-gradient';
// import { db } from '../../src/config/firebase';
// import { Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
// import { arrayUnion } from 'firebase/firestore';
// const { width } = Dimensions.get('window');
// const ORANGE = '#FF6300';
// const ORANGE2 = '#FF8500';
// const PURPLE = '#6C50C4';
// const PURPLE2 = '#9B84F0';
// const BackgroundDots = () => {
//   const dots = [
//     { x: '15%', y: '8%', color: ORANGE, size: 3, duration: 2800, delay: 0 },
//     { x: '80%', y: '12%', color: PURPLE2, size: 2, duration: 3400, delay: 600 },
//     { x: '90%', y: '35%', color: ORANGE, size: 2.5, duration: 2600, delay: 300 },
//     { x: '8%', y: '45%', color: PURPLE2, size: 3, duration: 3800, delay: 1000 },
//     { x: '70%', y: '55%', color: ORANGE, size: 2, duration: 3000, delay: 800 },
//     { x: '25%', y: '65%', color: PURPLE2, size: 2.5, duration: 2900, delay: 400 },
//     { x: '88%', y: '72%', color: ORANGE, size: 2, duration: 3600, delay: 200 },
//     { x: '12%', y: '80%', color: PURPLE2, size: 3, duration: 2700, delay: 700 },
//     { x: '55%', y: '88%', color: ORANGE, size: 2, duration: 3200, delay: 500 },
//     { x: '40%', y: '25%', color: PURPLE2, size: 2, duration: 3100, delay: 900 },
//   ];

//   return (
//     <>
//       {dots.map((dot, idx) => {
//         const anim = useRef(new Animated.Value(0)).current;
//         useEffect(() => {
//           setTimeout(() => {
//             Animated.loop(
//               Animated.sequence([
//                 Animated.timing(anim, { toValue: 1, duration: dot.duration, useNativeDriver: true }),
//                 Animated.timing(anim, { toValue: 0, duration: dot.duration, useNativeDriver: true }),
//               ])
//             ).start();
//           }, dot.delay);
//         }, []);
//         const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.55, 0.15] });
//         return (
//           <Animated.View
//             key={idx}
//             pointerEvents="none"
//             style={{
//               position: 'absolute',
//               left: dot.x,
//               top: dot.y,
//               width: dot.size,
//               height: dot.size,
//               borderRadius: dot.size / 2,
//               backgroundColor: dot.color,
//               opacity,
//               shadowColor: dot.color,
//               shadowOffset: { width: 0, height: 0 },
//               shadowOpacity: 0.8,
//               shadowRadius: 4,
//             }}
//           />
//         );
//       })}
//     </>
//   );
// };
// // ── Glow Blob (same as main screen) ───────────────────────────────────────────
// const GlowBlob = ({ color, duration = 5000, delay = 0, style }) => {
//   const anim = useRef(new Animated.Value(0)).current;
//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(anim, { toValue: 1, duration, delay, useNativeDriver: true }),
//         Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
//       ])
//     ).start();
//   }, []);
//   const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.05, 0.15, 0.05] });
//   return (
//     <Animated.View style={[style, { opacity, overflow: 'hidden' }]}>
//       <LinearGradient
//         colors={[color, 'transparent']}
//         style={StyleSheet.absoluteFill}
//         start={{ x: 0.5, y: 0.5 }}
//         end={{ x: 1, y: 1 }}
//       />
//     </Animated.View>
//   );
// };
// const ProfileScreen = () => {
//   const [loading, setLoading] = useState(true);
//   const [profileData, setProfileData] = useState(null);
//   const [phone, setPhone] = useState('');
//   const [xpBalance, setXpBalance] = useState(0);

//   useEffect(() => { loadProfile(); }, []);
// const addFamilyMember = async () => {
//   if (!newMemberName.trim() || !newMemberRelation) return;
//   setAddingMember(true);
//   try {
//     const newMember = {
//       id: Date.now().toString(),
//       name: newMemberName.trim(),
//       relation: newMemberRelation,
//       addedAt: new Date().toISOString(),
//     };
//     const userRef = doc(db, 'questionnaire_submissions', phone);
//     await updateDoc(userRef, {
//       family_members: arrayUnion(newMember)
//     });
//     setFamilyMembers(prev => [...prev, newMember]);
//     setNewMemberName('');
//     setNewMemberRelation('');
//     setShowAddModal(false);
//   } catch (e) {
//     console.error('Error adding family member:', e);
//   } finally {
//     setAddingMember(false);
//   }
// };
//   const loadProfile = async () => {
//     try {
//       const userPhone = await AsyncStorage.getItem('user_phone');
//       if (!userPhone) { setLoading(false); return; }
//       setPhone(userPhone);
//       const userDocRef = doc(db, 'questionnaire_submissions', userPhone);
//       const userDocSnap = await getDoc(userDocRef);
//       if (userDocSnap.exists()) {
//         const firestoreData = userDocSnap.data();
//         const userData = firestoreData.raw_answers || firestoreData.latest_data || firestoreData;
//         setXpBalance(firestoreData?.xp?.balance || 0);
//         setProfileData({
//           fullName: userData.fullName || '',
//           email: userData.email || '',
//           phone: userPhone,
//           age: userData.age || '',
//           gender: userData.gender || '',
//           workSetup: userData.work_setup || '',
//           dependents: {
//             spouse: userData.dependents?.spouse || 0,
//             child: userData.dependents?.child || 0,
//             parent: userData.dependents?.parent || 0,
//             pet: userData.dependents?.pet || 0,
//           },
//           kycDocuments: firestoreData.kyc_documents || {},
//         });
//         setFamilyMembers(firestoreData.family_members || []);
//       }
//     } catch (e) {
//       console.error('Error loading profile:', e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const capitalizeName = (name) => {
//     if (!name) return 'User';
//     return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
//   };

//   const getDocStatus = (docKey) => {
//     if (!profileData?.kycDocuments?.[docKey]) return 'pending';
//     return profileData.kycDocuments[docKey]?.status === 'removed' ? 'pending' : 'verified';
//   };
// const [familyMembers, setFamilyMembers] = useState([]);
// const [showAddModal, setShowAddModal] = useState(false);
// const [newMemberName, setNewMemberName] = useState('');
// const [newMemberRelation, setNewMemberRelation] = useState('');
// const [addingMember, setAddingMember] = useState(false);

// const RELATIONS = [
//   'Spouse', 'Child', 'Parent', 'Sibling',
//   'Grandparent', 'In-law', 'Uncle/Aunt', 'Cousin', 'Other'
// ];
//   const linkedAccounts = [
//     { label: 'Add Banks', imageSource: require('../../assets/images/profile/bank.png') },
//     { label: 'Add Demat', imageSource: require('../../assets/images/profile/demat.png') },
//     { label: 'Add NPS', imageSource: require('../../assets/images/profile/nps.png') },
//     { label: 'Add Credit Cards', imageSource: require('../../assets/images/profile/card.png') },
//   ];

//   const docTypes = [
//     { key: 'aadhaar', label: 'Aadhaar Card', subtitle: 'Government ID · Required', imageSource: null, required: true },
//     { key: 'pan', label: 'PAN Card', subtitle: 'Tax ID · Required', imageSource: null, required: true },
//     { key: 'passport', label: 'Passport', subtitle: 'Travel Document · Optional', imageSource: null, required: false },
//     { key: 'driving_license', label: 'Driving License', subtitle: 'Transport ID · Optional', imageSource: null, required: false },
//   ];

//   if (loading) {
//     return (
//       <View style={s.loadingContainer}>
//         <ActivityIndicator size="large" color={ORANGE} />
//       </View>
//     );
//   }



//   return (
//     <View style={s.wrapper}>
//       <StatusBar barStyle="light-content" />

//       {/* Background gradient */}
// <LinearGradient
//   colors={['#0a0408', '#060308', '#000000', '#04030a']}
//   locations={[0, 0.35, 0.65, 1]}
//   start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
//   style={StyleSheet.absoluteFill}
// />
// <GlowBlob color="#FF8500" duration={5200} delay={0}
//   style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -80, right: -80 }} />
// <GlowBlob color="#6C50C4" duration={4400} delay={800}
//   style={{ position: 'absolute', width: 260, height: 260, borderRadius: 130, bottom: 120, left: -70 }} />
// <BackgroundDots />
//       <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

//         {/* ── Identity Card ────────────────────────────────────── */}
//         <View style={s.identityCard}>
//          <LinearGradient
//   colors={['rgba(108,80,196,0.28)', 'rgba(255,133,0,0.12)', 'transparent']}
//   start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//   style={StyleSheet.absoluteFill}
//   pointerEvents="none"
// />
//           {/* Dual glow border */}
//           <View style={s.identityGlowOrange} />
//           <View style={s.identityGlowPurple} />

//           <Text style={s.identityName}>{capitalizeName(profileData?.fullName)}</Text>

//           <View style={s.identityDivider} />

//           <View style={s.identityMeta}>
//             <View style={s.identityMetaItem}>
//               <Text style={s.identityMetaLabel}>Phone</Text>
//               <Text style={s.identityMetaValue}>{phone}</Text>
//             </View>
//             <View style={s.identityMetaSep} />
//             <View style={s.identityMetaItem}>
//               <Text style={s.identityMetaLabel}>XP Earned</Text>
//               <View style={s.xpRow}>
//                 <Text style={s.xpValue}>{xpBalance}</Text>
//                 <Text style={s.xpLabel}> XP</Text>
//               </View>
//             </View>
//           </View>
//         </View>

//         {/* ── Linked Accounts ──────────────────────────────────── */}
//         <SectionHeader label="Linked Accounts" />
//         <View style={s.linkedGrid}>
//           {linkedAccounts.map((item, idx) => (
//   <TouchableOpacity key={idx} style={s.linkedCard} activeOpacity={0.8}>
//     <LinearGradient
//       colors={
//         idx % 2 === 0
//           ? ['rgba(255,133,0,0.10)', 'rgba(255,133,0,0.03)', 'transparent']
//           : ['rgba(108,80,196,0.12)', 'rgba(108,80,196,0.03)', 'transparent']
//       }
//       start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//       style={StyleSheet.absoluteFill}
//       pointerEvents="none"
//     />
//     {item.imageSource ? (
//       <Image source={item.imageSource} style={s.linkedImage} resizeMode="contain" />
//     ) : (
//       <View style={s.linkedImageFallback}>
//         <Text style={s.linkedImageFallbackText}>IMG</Text>
//       </View>
//     )}
//     <Text style={s.linkedLabel}>{item.label}</Text>
//   </TouchableOpacity>
// ))}
//         </View>

//         {/* ── Family Members ────────────────────────────────────── */}
// <SectionHeader label="Family Members" />
// <ScrollView
//   horizontal
//   showsHorizontalScrollIndicator={false}
//   contentContainerStyle={s.familyScroll}
// >
// {familyMembers.map((member, idx) => (
//   <View key={member.id} style={[
//     s.familyCard,
//     { borderColor: idx % 2 === 0 ? 'rgba(255,133,0,0.22)' : 'rgba(108,80,196,0.24)' }
//   ]}>
//     <LinearGradient
//       colors={idx % 2 === 0
//         ? ['rgba(255,133,0,0.12)', 'rgba(255,133,0,0.02)', 'transparent']
//         : ['rgba(108,80,196,0.14)', 'rgba(108,80,196,0.02)', 'transparent']}
//       start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//       style={StyleSheet.absoluteFill}
//       pointerEvents="none"
//     />
//     <Text style={s.familyMemberName} numberOfLines={1}>{member.name}</Text>
//     <Text style={s.familyMemberRelation}>{member.relation}</Text>
//     <View style={[s.familyDot, { backgroundColor: idx % 2 === 0 ? ORANGE : PURPLE2 }]} />
//   </View>
// ))}

//   {/* Add button card */}
//   <TouchableOpacity style={s.familyAddCard} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
//     <View style={s.familyAddIconWrap}>
//       <Text style={s.familyAddPlus}>+</Text>
//     </View>
//     <Text style={s.familyAddLabel}>Add Family{'\n'}Member</Text>
//   </TouchableOpacity>
// </ScrollView>

// {/* Add Member Modal */}
// <Modal
//   visible={showAddModal}
//   transparent
//   animationType="slide"
//   onRequestClose={() => setShowAddModal(false)}
// >
//   <View style={s.modalOverlay}>
//     <TouchableOpacity
//       style={{ flex: 1 }}
//       onPress={() => setShowAddModal(false)}
//       activeOpacity={1}
//     />
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <View style={s.modalSheet}>
//         {/* all modal content unchanged */}
//       </View>
//     </KeyboardAvoidingView>
//   </View>
// </Modal>
//         {/* ── Secure Document Vault ──────────────────────────────── */}
//         <SectionHeader label="Secure Document Vault" />
//         <View style={s.vaultContainer}>
//           {docTypes.map((docItem, idx) => {
//             const status = getDocStatus(docItem.key);
//             const verified = status === 'verified';
//             const isOrange = idx % 2 === 0;
//             return (
//               <TouchableOpacity
//                 key={docItem.key}
//                 style={[
//                   s.docCard,
//                   { borderColor: isOrange ? 'rgba(255,133,0,0.20)' : 'rgba(108,80,196,0.22)' }
//                 ]}
//                 activeOpacity={0.8}
//               >
//                 <LinearGradient
//                   colors={
//                     isOrange
//                       ? ['rgba(255,133,0,0.10)', 'rgba(255,133,0,0.02)', 'transparent']
//                       : ['rgba(108,80,196,0.12)', 'rgba(108,80,196,0.02)', 'transparent']
//                   }
//                   start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//                   style={StyleSheet.absoluteFill}
//                   pointerEvents="none"
//                 />
//                 {/* Left: icon image */}
//                 <View style={[
//                   s.docIconWrap,
//                   isOrange
//                     ? { borderColor: 'rgba(255,133,0,0.30)', backgroundColor: 'rgba(255,133,0,0.10)' }
//                     : { borderColor: 'rgba(108,80,196,0.32)', backgroundColor: 'rgba(108,80,196,0.12)' }
//                 ]}>
//                   {docItem.imageSource ? (
//                     <Image source={docItem.imageSource} style={s.docImage} resizeMode="contain" />
//                   ) : (
//                     <View style={s.docImageFallback}>
//                       <Text style={s.docImageFallbackText}>IMG</Text>
//                     </View>
//                   )}
//                 </View>

//                 {/* Middle: info */}
//                 <View style={s.docMeta}>
//                   <Text style={s.docLabel}>
//                     {docItem.label}
//                     {docItem.required && <Text style={{ color: '#ef4444' }}> *</Text>}
//                   </Text>
//                   <Text style={s.docSubtitle}>{docItem.subtitle}</Text>
//                 </View>

//                 {/* Right: status */}
//                 <View style={[
//                   s.docStatusBadge,
//                   verified
//                     ? { backgroundColor: 'rgba(108,80,196,0.18)', borderColor: 'rgba(108,80,196,0.35)' }
//                     : { backgroundColor: 'rgba(255,99,0,0.10)', borderColor: 'rgba(255,99,0,0.28)' }
//                 ]}>
//                   <Text style={[
//                     s.docStatusText,
//                     { color: verified ? PURPLE2 : ORANGE }
//                   ]}>
//                     {verified ? '✓ Done' : '+ Add'}
//                   </Text>
//                 </View>
//               </TouchableOpacity>
//             );
//           })}
//         </View>

//         <View style={{ height: 110 }} />
//       </ScrollView>
//     </View>
//   );
// };

// const SectionHeader = ({ label }) => (
//   <View style={s.sectionHeader}>
//     <Text style={s.sectionHeaderText}>{label}</Text>
//     <View style={s.sectionLine} />
//   </View>
// );

// const s = StyleSheet.create({
//   wrapper: { flex: 1, backgroundColor: '#000' },

//   loadingContainer: {
//     flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000',
//   },

//   scroll: { paddingHorizontal: 16, paddingTop: 58 },

//   // ── Identity Card ──────────────────────────────────────────────────────────
// identityCard: {
//   backgroundColor: '#0d1117',
//   borderRadius: 22,
//   borderWidth: 1,
//   borderColor: 'rgba(108,80,196,0.40)',
//   padding: 22,
//   marginBottom: 26,
//   overflow: 'hidden',
//   position: 'relative',
//   shadowColor: PURPLE,
//   shadowOffset: { width: 0, height: 0 },
//   shadowOpacity: 0.70,
//   shadowRadius: 24,
//   elevation: 12,
// },

// identityGlowOrange: {
//   position: 'absolute', top: -1, left: -1, right: -1, bottom: -1,
//   borderRadius: 22, borderWidth: 1.5,
//   borderColor: 'rgba(255,133,0,0.45)',
//   shadowColor: '#FF8500',
//   shadowOffset: { width: 0, height: 0 },
//   shadowOpacity: 0.60,
//   shadowRadius: 16,
// },

// identityGlowPurple: {
//   position: 'absolute', top: 1, left: 1, right: 1, bottom: 1,
//   borderRadius: 21, borderWidth: 1,
//   borderColor: 'rgba(108,80,196,0.55)',
//   shadowColor: PURPLE,
//   shadowOffset: { width: 0, height: 0 },
//   shadowOpacity: 0.50,
//   shadowRadius: 12,
// },

//   identityName: {
//     fontSize: 28,
//     fontWeight: '800',
//     color: '#fff',
//     letterSpacing: -0.8,
//     marginBottom: 14,
//   },

//   identityDivider: {
//     height: 1,
//     backgroundColor: 'rgba(255,255,255,0.06)',
//     marginBottom: 14,
//   },

//   identityMeta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },

//   identityMetaItem: {
//     flex: 1,
//   },

//   identityMetaSep: {
//     width: 1,
//     height: 32,
//     backgroundColor: 'rgba(255,255,255,0.08)',
//     marginHorizontal: 16,
//   },

//   identityMetaLabel: {
//     fontSize: 10,
//     fontWeight: '600',
//     color: 'rgba(255,255,255,0.32)',
//     letterSpacing: 0.6,
//     textTransform: 'uppercase',
//     marginBottom: 4,
//   },

//   identityMetaValue: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: 'rgba(255,255,255,0.75)',
//   },

//   xpRow: {
//     flexDirection: 'row',
//     alignItems: 'baseline',
//   },

//   xpValue: {
//     fontSize: 20,
//     fontWeight: '800',
//     color: ORANGE2,
//     textShadowColor: ORANGE,
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 8,
//   },
// familyScroll: {
//   gap: 12,
//   paddingBottom: 4,
//   marginBottom: 26,
// },
// familyCard: {
//   width: 110,
//   backgroundColor: '#0d1117',
//   borderRadius: 16,
//   borderWidth: 1,
//   paddingVertical: 16,
//   paddingHorizontal: 12,
//   alignItems: 'center',
//   justifyContent: 'center',
//   overflow: 'hidden',
//   position: 'relative',
//   minHeight: 80,
// },

// familyAvatar: {
//   width: 48,
//   height: 48,
//   borderRadius: 24,
//   borderWidth: 1.5,
//   justifyContent: 'center',
//   alignItems: 'center',
//   marginBottom: 8,
// },

// familyAvatarText: {
//   fontSize: 20,
//   fontWeight: '800',
// },

// familyMemberName: {
//   fontSize: 13,
//   fontWeight: '700',
//   color: '#fff',
//   marginBottom: 3,
//   textAlign: 'center',
// },

// familyMemberRelation: {
//   fontSize: 10,
//   color: 'rgba(255,255,255,0.35)',
//   fontWeight: '500',
//   marginBottom: 8,
//   textAlign: 'center',
// },

// familyDot: {
//   width: 6,
//   height: 6,
//   borderRadius: 3,
// },

// familyAddCard: {
//   width: 110,
//   backgroundColor: '#0d1117',
//   borderRadius: 16,
//   borderWidth: 1.5,
//   borderColor: 'rgba(255,133,0,0.30)',
//   borderStyle: 'dashed',
//   padding: 14,
//   alignItems: 'center',
//   justifyContent: 'center',
//   gap: 8,
// },

// familyAddIconWrap: {
//   width: 48,
//   height: 48,
//   borderRadius: 24,
//   borderWidth: 1.5,
//   borderColor: 'rgba(255,133,0,0.40)',
//   backgroundColor: 'rgba(255,133,0,0.10)',
//   justifyContent: 'center',
//   alignItems: 'center',
//   marginBottom: 4,
// },

// familyAddPlus: {
//   fontSize: 24,
//   color: ORANGE2,
//   fontWeight: '300',
//   lineHeight: 28,
// },

// familyAddLabel: {
//   fontSize: 11,
//   fontWeight: '600',
//   color: 'rgba(255,133,0,0.70)',
//   textAlign: 'center',
//   lineHeight: 16,
// },

// modalOverlay: {
//   flex: 1,
//   justifyContent: 'flex-end',
//   backgroundColor: 'rgba(0,0,0,0.65)',
// },

// modalSheet: {
//   backgroundColor: '#0d1117',
//   borderTopLeftRadius: 28,
//   borderTopRightRadius: 28,
//   borderWidth: 1,
//   borderColor: 'rgba(108,80,196,0.30)',
//   padding: 24,
//   paddingBottom: 40,
//   overflow: 'hidden',
//   position: 'relative',
//   shadowColor: PURPLE,
//   shadowOffset: { width: 0, height: -4 },
//   shadowOpacity: 0.4,
//   shadowRadius: 20,
//   elevation: 20,
// },

// modalGlowOrange: {
//   position: 'absolute', top: -1, left: -1, right: -1, bottom: -1,
//   borderTopLeftRadius: 28, borderTopRightRadius: 28,
//   borderWidth: 1.5,
//   borderColor: 'rgba(255,133,0,0.35)',
// },

// modalGlowPurple: {
//   position: 'absolute', top: 1, left: 1, right: 1, bottom: 1,
//   borderTopLeftRadius: 27, borderTopRightRadius: 27,
//   borderWidth: 1,
//   borderColor: 'rgba(108,80,196,0.45)',
// },

// modalHandle: {
//   width: 40,
//   height: 4,
//   borderRadius: 2,
//   backgroundColor: 'rgba(255,255,255,0.15)',
//   alignSelf: 'center',
//   marginBottom: 20,
// },

// modalTitle: {
//   fontSize: 22,
//   fontWeight: '800',
//   color: '#fff',
//   letterSpacing: -0.5,
//   marginBottom: 4,
// },

// modalSubtitle: {
//   fontSize: 13,
//   color: 'rgba(255,255,255,0.35)',
//   marginBottom: 24,
// },

// inputLabel: {
//   fontSize: 11,
//   fontWeight: '700',
//   color: 'rgba(255,255,255,0.40)',
//   letterSpacing: 0.8,
//   textTransform: 'uppercase',
//   marginBottom: 8,
// },

// textInput: {
//   backgroundColor: 'rgba(255,255,255,0.05)',
//   borderWidth: 1,
//   borderColor: 'rgba(255,255,255,0.10)',
//   borderRadius: 14,
//   padding: 14,
//   fontSize: 15,
//   fontWeight: '600',
//   color: '#fff',
//   marginBottom: 20,
// },

// relationsRow: {
//   gap: 8,
//   paddingBottom: 4,
//   marginBottom: 24,
// },

// relationChip: {
//   paddingHorizontal: 14,
//   paddingVertical: 8,
//   borderRadius: 20,
//   borderWidth: 1,
//   borderColor: 'rgba(255,255,255,0.12)',
//   backgroundColor: 'rgba(255,255,255,0.04)',
// },

// relationChipActive: {
//   borderColor: ORANGE,
//   backgroundColor: 'rgba(255,133,0,0.15)',
// },

// relationChipText: {
//   fontSize: 13,
//   fontWeight: '600',
//   color: 'rgba(255,255,255,0.45)',
// },

// relationChipTextActive: {
//   color: ORANGE2,
// },

// addButton: {
//   borderRadius: 14,
//   overflow: 'hidden',
//   shadowColor: ORANGE,
//   shadowOffset: { width: 0, height: 4 },
//   shadowOpacity: 0.4,
//   shadowRadius: 10,
//   elevation: 6,
// },

// addButtonGradient: {
//   paddingVertical: 16,
//   alignItems: 'center',
//   borderRadius: 14,
// },

// addButtonText: {
//   fontSize: 15,
//   fontWeight: '800',
//   color: '#fff',
//   letterSpacing: 0.3,
// },
//   xpLabel: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: ORANGE,
//     opacity: 0.8,
//   },

//   // ── Section Header ─────────────────────────────────────────────────────────
//   sectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//     marginBottom: 12,
//   },

//   sectionHeaderText: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: 'rgba(255,255,255,0.50)',
//     letterSpacing: 0.3,
//   },

//   sectionLine: {
//     flex: 1, height: 1,
//     backgroundColor: 'rgba(255,255,255,0.05)',
//   },

//   // ── Linked Accounts ────────────────────────────────────────────────────────
//   linkedGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//     marginBottom: 26,
//   },
// linkedCard: {
//   width: (width - 44) / 2,
//   backgroundColor: '#0d1117',
//   borderRadius: 18,
//   borderWidth: 1,
//   padding: 0,
//   alignItems: 'center',
//   overflow: 'hidden',
//   position: 'relative',
//   borderColor: 'rgba(255,255,255,0.07)',
// },

//   linkedIconWrap: {
//     width: 56,
//     height: 56,
//     borderRadius: 16,
//     borderWidth: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 10,
//     overflow: 'hidden',
//   },

// linkedImage: {
//   width: '100%',
//   height: 70,
//   borderRadius: 0,
// },

//   linkedImageFallback: {
//     width: '100%', height: '100%',
//     justifyContent: 'center', alignItems: 'center',
//   },

//   linkedImageFallbackText: {
//     fontSize: 9,
//     color: 'rgba(255,255,255,0.20)',
//     fontWeight: '700',
//     letterSpacing: 1,
//   },

// linkedLabel: {
//   fontSize: 13,
//   fontWeight: '700',
//   color: '#fff',
//   textAlign: 'center',
//   paddingVertical: 10,
//   paddingHorizontal: 8,
// },

//   comingSoonPill: {
//     backgroundColor: 'rgba(255,255,255,0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.08)',
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 6,
//   },

//   comingSoonText: {
//     fontSize: 9,
//     color: 'rgba(255,255,255,0.25)',
//     fontWeight: '600',
//     letterSpacing: 0.5,
//   },

//   // ── Family Members ─────────────────────────────────────────────────────────
//   familyScroll: {
//     gap: 12,
//     paddingBottom: 4,
//     marginBottom: 26,
//   },



//   familyImageWrap: {
//     width: 46,
//     height: 46,
//     borderRadius: 14,
//     borderWidth: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     overflow: 'hidden',
//     flexShrink: 0,
//   },

//   familyImageFallback: {
//     width: '100%', height: '100%',
//     justifyContent: 'center', alignItems: 'center',
//   },

//   familyImageFallbackText: {
//     fontSize: 8,
//     color: 'rgba(255,255,255,0.20)',
//     fontWeight: '700',
//     letterSpacing: 1,
//   },

//   familyCardInfo: {
//     flex: 1,
//   },

//   familyCardLabel: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 3,
//   },

//   familyCardCount: {
//     fontSize: 10,
//     color: 'rgba(255,255,255,0.35)',
//     fontWeight: '500',
//     marginBottom: 6,
//   },

//   familyDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//   },

//   emptyCard: {
//     backgroundColor: '#0d1117',
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.06)',
//     padding: 20,
//     alignItems: 'center',
//     marginBottom: 26,
//   },

//   emptyText: {
//     fontSize: 13,
//     color: 'rgba(255,255,255,0.25)',
//   },

//   // ── Document Vault ─────────────────────────────────────────────────────────
//   vaultContainer: {
//     gap: 10,
//     marginBottom: 8,
//   },

//   docCard: {
//     backgroundColor: '#0d1117',
//     borderRadius: 16,
//     borderWidth: 1,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 14,
//     overflow: 'hidden',
//     position: 'relative',
//   },

//   docIconWrap: {
//     width: 50,
//     height: 50,
//     borderRadius: 14,
//     borderWidth: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     overflow: 'hidden',
//     flexShrink: 0,
//   },

//   docImage: { width: 30, height: 30 },

//   docImageFallback: {
//     width: '100%', height: '100%',
//     justifyContent: 'center', alignItems: 'center',
//   },

//   docImageFallbackText: {
//     fontSize: 8,
//     color: 'rgba(255,255,255,0.20)',
//     fontWeight: '700',
//     letterSpacing: 1,
//   },

//   docMeta: {
//     flex: 1,
//   },

//   docLabel: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 3,
//   },

//   docSubtitle: {
//     fontSize: 11,
//     color: 'rgba(255,255,255,0.35)',
//     fontWeight: '500',
//   },

//   docStatusBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 10,
//     borderWidth: 1,
//     flexShrink: 0,
//   },

//   docStatusText: {
//     fontSize: 12,
//     fontWeight: '700',
//   },
// });

// export default ProfileScreen;
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Animated,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { arrayUnion } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../src/config/firebase';

const { width } = Dimensions.get('window');
const ORANGE = '#FF6300';
const ORANGE2 = '#FF8500';
const PURPLE = '#6C50C4';
const PURPLE2 = '#9B84F0';

const BackgroundDots = () => {
  const dots = [
    { x: '15%', y: '8%', color: ORANGE, size: 3, duration: 2800, delay: 0 },
    { x: '80%', y: '12%', color: PURPLE2, size: 2, duration: 3400, delay: 600 },
    { x: '90%', y: '35%', color: ORANGE, size: 2.5, duration: 2600, delay: 300 },
    { x: '8%', y: '45%', color: PURPLE2, size: 3, duration: 3800, delay: 1000 },
    { x: '70%', y: '55%', color: ORANGE, size: 2, duration: 3000, delay: 800 },
    { x: '25%', y: '65%', color: PURPLE2, size: 2.5, duration: 2900, delay: 400 },
    { x: '88%', y: '72%', color: ORANGE, size: 2, duration: 3600, delay: 200 },
    { x: '12%', y: '80%', color: PURPLE2, size: 3, duration: 2700, delay: 700 },
    { x: '55%', y: '88%', color: ORANGE, size: 2, duration: 3200, delay: 500 },
    { x: '40%', y: '25%', color: PURPLE2, size: 2, duration: 3100, delay: 900 },
  ];
  return (
    <>
      {dots.map((dot, idx) => {
        const anim = useRef(new Animated.Value(0)).current;
        useEffect(() => {
          setTimeout(() => {
            Animated.loop(
              Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: dot.duration, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: dot.duration, useNativeDriver: true }),
              ])
            ).start();
          }, dot.delay);
        }, []);
        const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.55, 0.15] });
        return (
          <Animated.View key={idx} pointerEvents="none" style={{
            position: 'absolute', left: dot.x, top: dot.y,
            width: dot.size, height: dot.size, borderRadius: dot.size / 2,
            backgroundColor: dot.color, opacity,
            shadowColor: dot.color, shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8, shadowRadius: 4,
          }} />
        );
      })}
    </>
  );
};

const GlowBlob = ({ color, duration = 5000, delay = 0, style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.05, 0.15, 0.05] });
  return (
    <Animated.View style={[style, { opacity, overflow: 'hidden' }]}>
      <LinearGradient colors={[color, 'transparent']} style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }} />
    </Animated.View>
  );
};

const SectionHeader = ({ label }) => (
  <View style={s.sectionHeader}>
    <Text style={s.sectionHeaderText}>{label}</Text>
    <View style={s.sectionLine} />
  </View>
);

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [phone, setPhone] = useState('');
  const [xpBalance, setXpBalance] = useState(0);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const userPhone = await AsyncStorage.getItem('user_phone');
      if (!userPhone) { setLoading(false); return; }
      setPhone(userPhone);
      const userDocRef = doc(db, 'questionnaire_submissions', userPhone);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const firestoreData = userDocSnap.data();
        const userData = firestoreData.raw_answers || firestoreData.latest_data || firestoreData;
        setXpBalance(firestoreData?.xp?.balance || 0);
        setFamilyMembers(firestoreData.family_members || []);
        setProfileData({
          fullName: userData.fullName || '',
          email: userData.email || '',
          phone: userPhone,
          kycDocuments: firestoreData.kyc_documents || {},
        });
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const capitalizeName = (name) => {
    if (!name) return 'User';
    return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const getDocStatus = (docKey) => {
    if (!profileData?.kycDocuments?.[docKey]) return 'pending';
    return profileData.kycDocuments[docKey]?.status === 'removed' ? 'pending' : 'verified';
  };

  const addFamilyMember = async () => {
    if (!newMemberName.trim() || !newMemberRelation) return;
    setAddingMember(true);
    try {
      const newMember = {
        id: Date.now().toString(),
        name: newMemberName.trim(),
        relation: newMemberRelation,
        addedAt: new Date().toISOString(),
      };
      const userRef = doc(db, 'questionnaire_submissions', phone);
      await updateDoc(userRef, { family_members: arrayUnion(newMember) });
      setFamilyMembers(prev => [...prev, newMember]);
      setNewMemberName('');
      setNewMemberRelation('');
      setShowAddModal(false);
    } catch (e) {
      console.error('Error adding family member:', e);
    } finally {
      setAddingMember(false);
    }
  };

  const linkedAccounts = [
    { label: 'Add Banks', imageSource: require('../../assets/images/profile/bank.png') },
    { label: 'Add Demat', imageSource: require('../../assets/images/profile/demat.png') },
    { label: 'Add NPS', imageSource: require('../../assets/images/profile/nps.png') },
    { label: 'Add Credit Cards', imageSource: require('../../assets/images/profile/card.png') },
  ];

  const docTypes = [
    { key: 'aadhaar', label: 'Aadhaar Card', subtitle: 'Government ID · Required', required: true },
    { key: 'pan', label: 'PAN Card', subtitle: 'Tax ID · Required', required: true },
    { key: 'passport', label: 'Passport', subtitle: 'Travel Document · Optional', required: false },
    { key: 'driving_license', label: 'Driving License', subtitle: 'Transport ID · Optional', required: false },
  ];

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  return (
    <View style={s.wrapper}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0a0408', '#060308', '#000000', '#04030a']}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <GlowBlob color="#FF8500" duration={5200} delay={0}
        style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -80, right: -80 }} />
      <GlowBlob color="#6C50C4" duration={4400} delay={800}
        style={{ position: 'absolute', width: 260, height: 260, borderRadius: 130, bottom: 120, left: -70 }} />
      <BackgroundDots />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Identity Card */}
        <View style={s.identityCard}>
          <LinearGradient
            colors={['rgba(108,80,196,0.28)', 'rgba(255,133,0,0.12)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill} pointerEvents="none"
          />
          <View style={s.identityGlowOrange} />
          <View style={s.identityGlowPurple} />
          <Text style={s.identityName}>{capitalizeName(profileData?.fullName)}</Text>
          <View style={s.identityDivider} />
          <View style={s.identityMeta}>
            <View style={s.identityMetaItem}>
              <Text style={s.identityMetaLabel}>Phone</Text>
              <Text style={s.identityMetaValue}>{phone}</Text>
            </View>
            <View style={s.identityMetaSep} />
            <View style={s.identityMetaItem}>
              <Text style={s.identityMetaLabel}>XP Earned</Text>
              <View style={s.xpRow}>
                <Text style={s.xpValue}>{xpBalance}</Text>
                <Text style={s.xpLabel}> XP</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Linked Accounts */}
        <SectionHeader label="Linked Accounts" />
        <View style={s.linkedGrid}>
          {linkedAccounts.map((item, idx) => (
            <TouchableOpacity key={idx} style={s.linkedCard} activeOpacity={0.8}>
              <LinearGradient
                colors={idx % 2 === 0
                  ? ['rgba(255,133,0,0.10)', 'rgba(255,133,0,0.03)', 'transparent']
                  : ['rgba(108,80,196,0.12)', 'rgba(108,80,196,0.03)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill} pointerEvents="none"
              />
              {item.imageSource
                ? <Image source={item.imageSource} style={s.linkedImage} resizeMode="contain" />
                : <View style={s.linkedImageFallback}><Text style={s.linkedImageFallbackText}>IMG</Text></View>
              }
              <Text style={s.linkedLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Family Members */}
        <SectionHeader label="Family Members" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.familyScroll}>
          {familyMembers.map((member, idx) => (
            <View key={member.id} style={[
              s.familyCard,
              { borderColor: idx % 2 === 0 ? 'rgba(255,133,0,0.22)' : 'rgba(108,80,196,0.24)' }
            ]}>
              <LinearGradient
                colors={idx % 2 === 0
                  ? ['rgba(255,133,0,0.12)', 'rgba(255,133,0,0.02)', 'transparent']
                  : ['rgba(108,80,196,0.14)', 'rgba(108,80,196,0.02)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill} pointerEvents="none"
              />
              <Text style={s.familyMemberName} numberOfLines={1}>{member.name}</Text>
              <Text style={s.familyMemberRelation}>{member.relation}</Text>
              <View style={[s.familyDot, { backgroundColor: idx % 2 === 0 ? ORANGE : PURPLE2 }]} />
            </View>
          ))}
          <TouchableOpacity style={s.familyAddCard} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
            <View style={s.familyAddIconWrap}>
              <Text style={s.familyAddPlus}>+</Text>
            </View>
            <Text style={s.familyAddLabel}>Add Family{'\n'}Member</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Document Vault */}
        <SectionHeader label="Secure Document Vault" />
        <View style={s.vaultContainer}>
          {docTypes.map((docItem, idx) => {
            const verified = getDocStatus(docItem.key) === 'verified';
            const isOrange = idx % 2 === 0;
            return (
              <TouchableOpacity key={docItem.key} style={[
                s.docCard,
                { borderColor: isOrange ? 'rgba(255,133,0,0.20)' : 'rgba(108,80,196,0.22)' }
              ]} activeOpacity={0.8}>
                <LinearGradient
                  colors={isOrange
                    ? ['rgba(255,133,0,0.10)', 'rgba(255,133,0,0.02)', 'transparent']
                    : ['rgba(108,80,196,0.12)', 'rgba(108,80,196,0.02)', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill} pointerEvents="none"
                />
                <View style={[s.docIconWrap,
                  isOrange
                    ? { borderColor: 'rgba(255,133,0,0.30)', backgroundColor: 'rgba(255,133,0,0.10)' }
                    : { borderColor: 'rgba(108,80,196,0.32)', backgroundColor: 'rgba(108,80,196,0.12)' }
                ]}>
                  <View style={s.docImageFallback}>
                    <Text style={s.docImageFallbackText}>IMG</Text>
                  </View>
                </View>
                <View style={s.docMeta}>
                  <Text style={s.docLabel}>
                    {docItem.label}{docItem.required && <Text style={{ color: '#ef4444' }}> *</Text>}
                  </Text>
                  <Text style={s.docSubtitle}>{docItem.subtitle}</Text>
                </View>
                <View style={[s.docStatusBadge,
                  verified
                    ? { backgroundColor: 'rgba(108,80,196,0.18)', borderColor: 'rgba(108,80,196,0.35)' }
                    : { backgroundColor: 'rgba(255,99,0,0.10)', borderColor: 'rgba(255,99,0,0.28)' }
                ]}>
                  <Text style={[s.docStatusText, { color: verified ? PURPLE2 : ORANGE }]}>
                    {verified ? '✓ Done' : '+ Add'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Add Family Member Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowAddModal(false)} activeOpacity={1} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}style={{ backgroundColor: 'transparent' }}>
            <View style={s.modalSheet}>
              <LinearGradient
                colors={['rgba(108,80,196,0.20)', 'rgba(255,133,0,0.08)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill} pointerEvents="none"
              />
              <View style={s.modalGlowOrange} />
              <View style={s.modalGlowPurple} />

              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>Add Family Member</Text>
              <Text style={s.modalSubtitle}>Add a member to your family profile</Text>

              <Text style={s.inputLabel}>Name</Text>
              <TextInput
                style={s.textInput}
                placeholder="Enter full name"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={newMemberName}
                onChangeText={setNewMemberName}
                autoCapitalize="words"
              />

              <Text style={s.inputLabel}>Relation</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.relationsRow}>
                {['Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'In-law', 'Uncle/Aunt', 'Cousin', 'Other'].map((rel) => (
                  <TouchableOpacity
                    key={rel}
                    style={[s.relationChip, newMemberRelation === rel && s.relationChipActive]}
                    onPress={() => setNewMemberRelation(rel)}
                  >
                    <Text style={[s.relationChipText, newMemberRelation === rel && s.relationChipTextActive]}>{rel}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[s.addButton, (!newMemberName.trim() || !newMemberRelation) && { opacity: 0.4 }]}
                onPress={addFamilyMember}
                disabled={!newMemberName.trim() || !newMemberRelation || addingMember}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[ORANGE2, ORANGE]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.addButtonGradient}
                >
                  {addingMember
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.addButtonText}>Add Member</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  scroll: { paddingHorizontal: 16, paddingTop: 58 },

  identityCard: {
    backgroundColor: '#0d1117', borderRadius: 22, borderWidth: 1,
    borderColor: 'rgba(108,80,196,0.40)', padding: 22, marginBottom: 26,
    overflow: 'hidden', position: 'relative',
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.70, shadowRadius: 24, elevation: 12,
  },
  identityGlowOrange: {
    position: 'absolute', top: -1, left: -1, right: -1, bottom: -1,
    borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(255,133,0,0.45)',
    shadowColor: '#FF8500', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.60, shadowRadius: 16,
  },
  identityGlowPurple: {
    position: 'absolute', top: 1, left: 1, right: 1, bottom: 1,
    borderRadius: 21, borderWidth: 1, borderColor: 'rgba(108,80,196,0.55)',
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.50, shadowRadius: 12,
  },
  identityName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.8, marginBottom: 14 },
  identityDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 14 },
  identityMeta: { flexDirection: 'row', alignItems: 'center' },
  identityMetaItem: { flex: 1 },
  identityMetaSep: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 16 },
  identityMetaLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.32)', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  identityMetaValue: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  xpRow: { flexDirection: 'row', alignItems: 'baseline' },
  xpValue: { fontSize: 20, fontWeight: '800', color: ORANGE2, textShadowColor: ORANGE, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  xpLabel: { fontSize: 13, fontWeight: '700', color: ORANGE, opacity: 0.8 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionHeaderText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.50)', letterSpacing: 0.3 },
  sectionLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  linkedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 26 },
  linkedCard: {
    width: (width - 44) / 2, backgroundColor: '#0d1117', borderRadius: 18,
    borderWidth: 1, padding: 0, alignItems: 'center', overflow: 'hidden',
    position: 'relative', borderColor: 'rgba(255,255,255,0.07)',
  },
  linkedImage: { width: '100%', height: 90, borderRadius: 0 },
  linkedImageFallback: { width: '100%', height: 90, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  linkedImageFallbackText: { fontSize: 9, color: 'rgba(255,255,255,0.20)', fontWeight: '700', letterSpacing: 1 },
  linkedLabel: { fontSize: 13, fontWeight: '700', color: '#fff', textAlign: 'center', paddingVertical: 10, paddingHorizontal: 8 },

  familyScroll: { gap: 12, paddingBottom: 4, marginBottom: 26 },
familyCard: {
  backgroundColor: '#0d1117',
  borderRadius: 16,
  borderWidth: 1,
  paddingVertical: 14,
  paddingHorizontal: 14,
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  position: 'relative',
  minWidth: 90,
},

familyMemberName: {
  fontSize: 15,
  fontWeight: '800',
  color: '#fff',
  marginBottom: 4,
  textAlign: 'center',
},
  familyMemberRelation: { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '500', marginBottom: 8, textAlign: 'center' },
  familyDot: { width: 6, height: 6, borderRadius: 3 },
  familyAddCard: {
    width: 100, backgroundColor: '#0d1117', borderRadius: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,133,0,0.30)', borderStyle: 'dashed',
    paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  familyAddIconWrap: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5,
    borderColor: 'rgba(255,133,0,0.40)', backgroundColor: 'rgba(255,133,0,0.10)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  familyAddPlus: { fontSize: 22, color: ORANGE2, fontWeight: '300', lineHeight: 26 },
  familyAddLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,133,0,0.70)', textAlign: 'center', lineHeight: 15 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  modalSheet: {
    backgroundColor: '#0d1117', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderColor: 'rgba(108,80,196,0.30)', padding: 24, paddingBottom: 40,
    overflow: 'hidden', position: 'relative',
    shadowColor: PURPLE, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
  },
  modalGlowOrange: {
    position: 'absolute', top: -1, left: -1, right: -1, bottom: -1,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1.5, borderColor: 'rgba(255,133,0,0.35)',
  },
  modalGlowPurple: {
    position: 'absolute', top: 1, left: 1, right: 1, bottom: 1,
    borderTopLeftRadius: 27, borderTopRightRadius: 27, borderWidth: 1, borderColor: 'rgba(108,80,196,0.45)',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.40)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14, padding: 14, fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 20,
  },
  relationsRow: { gap: 8, paddingBottom: 4, marginBottom: 24 },
  relationChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' },
  relationChipActive: { borderColor: ORANGE, backgroundColor: 'rgba(255,133,0,0.15)' },
  relationChipText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  relationChipTextActive: { color: ORANGE2 },
  addButton: { borderRadius: 14, overflow: 'hidden', shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  addButtonGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  addButtonText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  vaultContainer: { gap: 10, marginBottom: 8 },
  docCard: {
    backgroundColor: '#0d1117', borderRadius: 16, borderWidth: 1, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden', position: 'relative',
  },
  docIconWrap: { width: 50, height: 50, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexShrink: 0 },
  docImageFallback: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  docImageFallbackText: { fontSize: 8, color: 'rgba(255,255,255,0.20)', fontWeight: '700', letterSpacing: 1 },
  docMeta: { flex: 1 },
  docLabel: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 3 },
  docSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
  docStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, flexShrink: 0 },
  docStatusText: { fontSize: 12, fontWeight: '700' },
});

export default ProfileScreen;