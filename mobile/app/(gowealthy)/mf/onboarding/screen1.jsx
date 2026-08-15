
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   TextInput,
//   Alert,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import * as ImagePicker from 'expo-image-picker';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { db } from '../../../../src/config/firebase';
// import { doc, setDoc, getDoc } from 'firebase/firestore';
// import { BACKEND_URL, NSE_SERVICE_URL, EMAIL_SERVICE_URL } from '../../../../src/config/services';
// import { uploadToSignedPost } from '../../../../src/utils/upload';
//  // CHANGE TO YOUR IP
// const PAN_OCR_ENDPOINT = 'https://pan-parser-763133497996.asia-south1.run.app';

// const Screen1PANBackend = () => {
//   const router = useRouter();
//   const [panImage, setPanImage] = useState(null);
//   const [panData, setPanData] = useState({
//     number: '',
//     name: '',
//     fatherName: '',
//     dob: ''
//   });
//   const [isUploading, setIsUploading] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [isProcessed, setIsProcessed] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [fileUrl, setFileUrl] = useState(null);
//   const generateUCC = (fullName, phone) => {
//   const parts = fullName.trim().toUpperCase().replace(/[^A-Z ]/g, '').split(/\s+/);
//   const firstName = (parts[0] || 'XX').padEnd(2, 'X').slice(0, 2);
//   const lastName  = (parts[parts.length > 1 ? parts.length - 1 : 0] || 'XX').padEnd(2, 'X').slice(0, 2);
//   const lastFour  = String(phone).replace(/\D/g, '').slice(-4).padStart(4, '0');
//   return `${firstName}${lastName}${lastFour}`;
// };

// const [isLoadingExisting, setIsLoadingExisting] = useState(false);
// const loadExistingData = async () => {
//   try {
//     setIsLoadingExisting(true);
//     const phoneNumber = await AsyncStorage.getItem('user_phone');
//     if (!phoneNumber) return;
 
//     const docRef = doc(db, 'mf_onboarding', phoneNumber);
//     const docSnap = await getDoc(docRef);
 
//     if (docSnap.exists() && docSnap.data()?.pan_data) {
//       const saved = docSnap.data().pan_data;
//       console.log('📂 Existing PAN data found, restoring...');
 
//       // Restore OCR data into state
//       setPanData({
//         number:     saved.pan_number   || '',
//         name:       saved.name         || '',
//         fatherName: saved.father_name  || '',
//         dob:        saved.dob          || '',
//       });
 
//       // Show the GCS image URL as preview (https:// URL, not local uri)
//       if (saved.pan_image_url) {
//         setFileUrl(saved.pan_image_url);
//          // shows in Image component
//       }
 
//       setIsProcessed(true);
//       console.log('✅ PAN data restored from Firestore');
//     }
//   } catch (error) {
//     // Silently fail — user just needs to re-upload, not a blocker
//     console.log('ℹ️ No existing PAN data or fetch failed:', error.message);
//   } finally {
//     setIsLoadingExisting(false);
//   }
// };
// useEffect(() => {
//   loadExistingData();
// }, []);
//   const pickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: false,
//       quality: 1,
//     });

//     if (!result.canceled) {
//       setPanImage(result.assets[0].uri);
//       setIsProcessed(false);
//       setPanData({ number: '', name: '', fatherName: '', dob: '' });
//       setFileUrl(null);
//       setUploadProgress(0);
//     }
//   };

//   const handleProcessPAN = async () => {
//     if (!panImage) {
//       Alert.alert('Error', 'Please select an image first');
//       return;
//     }

//     try {
//       setIsUploading(true);
//       setUploadProgress(0);

//       // Get phone number from AsyncStorage
//       const phoneNumber = await AsyncStorage.getItem('user_phone');
//       if (!phoneNumber) {
//         Alert.alert('Error', 'User not found. Please log in again.');
//         return;
//       }

//       console.log('📱 Phone Number:', phoneNumber);

//       // Step 1: Get signed URL from backend
//       const fileName = `pan_${Date.now()}.jpg`;
//       console.log('🔑 Requesting upload URL for PAN...');

//       const urlResponse = await fetch(`${BACKEND_URL}/api/generate-upload-url`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           fileName,
//           contentType: 'image/jpeg',
//           userId: phoneNumber,
//           docType: 'pan'
//         })
//       });

//       if (!urlResponse.ok) {
//         throw new Error('Failed to get upload URL from backend');
//       }

//      const { url, fields, fileUrl: gcsFileUrl, gcsUri } =
//   await urlResponse.json();
//       console.log('✅ Upload URL received');
//       console.log('📁 File will be stored at:', gcsFileUrl);

//       setUploadProgress(25);

//       console.log('📤 Uploading PAN to Google Cloud Storage (POST)...');

// await uploadToSignedPost({ url, fields, uri: panImage });

// console.log('✅ Upload to GCS successful');

//       setUploadProgress(50);
//       setFileUrl(gcsFileUrl);
//       setIsUploading(false);

//       // Step 3: Process with PAN OCR
//       setIsProcessing(true);
//       setUploadProgress(75);
//       console.log('🔄 Starting PAN OCR extraction...');

//      const encodedFileUri = encodeURIComponent(gcsUri);
// const ocrUrl = `${PAN_OCR_ENDPOINT}?file_uri=${encodedFileUri}`;

      
//       console.log('📤 Calling PAN OCR endpoint:', ocrUrl);

//       const ocrResponse = await fetch(ocrUrl, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({})
//       });

//       const ocrText = await ocrResponse.text();
//       console.log('📥 PAN OCR Response:', ocrText);

//       if (!ocrResponse.ok) {
//         console.error('❌ PAN OCR Error Response:', ocrText);
//         throw new Error(`PAN OCR processing failed: ${ocrResponse.status}`);
//       }

//       let extractedData;
//       try {
//         extractedData = JSON.parse(ocrText);
//         console.log('✅ Extracted PAN Data:', extractedData);
//       } catch (parseError) {
//         console.error('❌ JSON Parse Error:', parseError);
//         throw new Error('Failed to parse PAN OCR response');
//       }

//       if (extractedData.Error || extractedData.error) {
//         throw new Error(extractedData.Error || extractedData.error);
//       }

//       // Check if success
//       if (extractedData.success !== 'Yes') {
//         throw new Error('PAN extraction failed');
//       }

//       // Map OCR response to our data structure
//       const result = extractedData.response?.result;
//       if (!result) {
//         throw new Error('No result data in PAN OCR response');
//       }

//       const mappedData = {
//         number: result.pan_number || '',
//         name: result.name || '',
//         fatherName: result.father_name || '',
//         dob: result.dob || ''
//       };

//       setPanData(mappedData);
//       setUploadProgress(100);
//       setIsProcessing(false);
//       setIsProcessed(true);

//       console.log('✅ PAN OCR Processing Complete');

//       // Step 4: Save to Firebase
//       await saveToFirebase(phoneNumber, mappedData, gcsFileUrl);

//     } catch (error) {
//       console.error('❌ Error in PAN processing:', error);
//       Alert.alert('Error', error.message || 'Failed to process PAN card');
//       setIsUploading(false);
//       setIsProcessing(false);
//       setUploadProgress(0);
//     }
//   };

// const saveToFirebase = async (phoneNumber, data, gcsUri) => {
//   try {
//     console.log('💾 Saving PAN data to mf_onboarding...');
 
//     const ucc = generateUCC(data.name, phoneNumber);
//     console.log('🆔 Generated UCC:', ucc);
 
//     const docRef = doc(db, 'mf_onboarding', phoneNumber);
 
//     await setDoc(docRef, {
//       ucc_code:       ucc,
//       onboarding_step: 1,
//       pan_data: {
//         pan_number:    data.number,
//         name:          data.name,
//         father_name:   data.fatherName,
//         dob:           data.dob, 
//         pan_image_url:     gcsUri,            // DD/MM/YYYY — as returned by OCR
//         pan_image_gcs_uri: gcsUri,
//         uploaded_at:   new Date().toISOString(),
//       },
//       created_at:     new Date().toISOString(),
//     }, { merge: true });
 
//     console.log('✅ Saved to mf_onboarding/' + phoneNumber);
//   } catch (error) {
//     console.error('❌ Firestore save error:', error);
//     throw new Error('Failed to save PAN data');
//   }
// };

//   const handleInputChange = (field, value) => {
//     setPanData(prev => ({ ...prev, [field]: value }));
//   };

//   const handlePanChange = (value) => {
//     const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
//     handleInputChange('number', formattedValue);
//   };

// const handleContinue = async () => {
//   try {
//     const phoneNumber = await AsyncStorage.getItem('user_phone');
//     if (!phoneNumber) {
//       Alert.alert('Error', 'Session expired. Please log in again.');
//       return;
//     }
 
//     // If user edited fields manually after OCR, persist the latest values
//     if (isProcessed) {
//       await saveToFirebase(phoneNumber, panData, fileUrl);
//     }
 
//     router.push('/(gowealthy)/mf/onboarding/screen2');
//   } catch (error) {
//     console.error('Error on continue:', error);
//     Alert.alert('Error', 'Something went wrong. Please try again.');
//   }
// };

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       {isLoadingExisting && (
//   <View style={styles.loadingOverlay}>
//     <ActivityIndicator size="large" color="#6b50c4" />
//     <Text style={styles.loadingText}>Loading your saved data...</Text>
//   </View>
// )}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//           <Text style={styles.backButtonText}>← Back</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.progressContainer}>
//         {[1, 2, 3, 4, 5, 6].map((step, idx) => (
//           <View key={step} style={styles.progressStepContainer}>
//             <View style={[
//               styles.progressCircle,
//               step === 1 && styles.progressCircleActive
//             ]}>
//               <Text style={[
//                 styles.progressText,
//                 step === 1 && styles.progressTextActive
//               ]}>{step}</Text>
//             </View>
//             {idx < 5 && <View style={styles.progressLine} />}
//           </View>
//         ))}
//       </View>

//       <View style={styles.questionSection}>
//         <Text style={styles.questionTitle}>Upload your PAN Card</Text>
//         <Text style={styles.questionSubtitle}>
//           Upload a clear image of your PAN card for automatic data extraction
//         </Text>
//       </View>

//       <View style={styles.contentSection}>
//         <View style={styles.formContainer}>
//           <View style={styles.imageUploadSection}>
//             {!panImage ? (
//               <TouchableOpacity 
//                 style={styles.imageUploadArea}
//                 onPress={pickImage}
//                 activeOpacity={0.8}
//               >
//                 <View style={styles.uploadIconContainer}>
//                   <Text style={styles.uploadIcon}>📤</Text>
//                 </View>
//                 <Text style={styles.uploadTitle}>Upload PAN Card Image</Text>
//                 <Text style={styles.uploadSubtitle}>
//                   Click to select your PAN card image
//                 </Text>
//                 <View style={styles.uploadBrowseBtn}>
//                   <Text style={styles.uploadBrowseBtnText}>Browse Files</Text>
//                 </View>
//               </TouchableOpacity>
//             ) : (
//               <View style={styles.imagePreviewContainer}>
//                 <Image 
//                   source={{ uri: panImage }} 
//                   style={styles.uploadedImagePreview}
//                   resizeMode="contain"
//                 />
//                 <View style={styles.imageActions}>
//                   <TouchableOpacity
//                     onPress={() => {
//                       setPanImage(null);
//                       setIsProcessed(false);
//                       setPanData({ number: '', name: '', fatherName: '', dob: '' });
//                       setFileUrl(null);
//                       setUploadProgress(0);
//                     }}
//                     style={styles.removeImageBtn}
//                   >
//                     <Text style={styles.removeImageBtnText}>✕ Remove</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity
//                     onPress={pickImage}
//                     style={styles.changeImageBtn}
//                   >
//                     <Text style={styles.changeImageBtnText}>📤 Change</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             )}
//           </View>

//           {/* Upload Progress */}
//           {(isUploading || isProcessing) && uploadProgress > 0 && (
//             <View style={styles.progressSection}>
//               <View style={styles.progressInfo}>
//                 <Text style={styles.progressLabel}>
//                   {isUploading ? 'Uploading to Cloud...' : 'Extracting PAN Data...'}
//                 </Text>
//                 <Text style={styles.progressPercent}>{uploadProgress}%</Text>
//               </View>
//               <View style={styles.progressBarContainer}>
//                 <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
//               </View>
//             </View>
//           )}

//           {panImage && !isProcessed && !isUploading && !isProcessing && (
//             <View style={styles.processSection}>
//               <TouchableOpacity
//                 onPress={handleProcessPAN}
//                 style={styles.processButton}
//               >
//                 <Text style={styles.processButtonText}>→ Extract Details</Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           {isProcessed && (
//             <View style={styles.extractedDataSection}>
//               {isProcessed && !isEditing && (
//   <View style={styles.savedBanner}>
//     <Text style={styles.savedBannerText}>✓ Saved data loaded — tap Edit to change or Upload new image</Text>
//   </View>
// )}
//               <View style={styles.extractedHeader}>
//                 <Text style={styles.extractedHeaderTitle}>Extracted Information</Text>
                
//                 <TouchableOpacity
//                   onPress={() => setIsEditing(!isEditing)}
//                   style={styles.editToggleBtn}
//                 >
//                   <Text style={styles.editToggleBtnText}>
//                     {isEditing ? '👁️ View Mode' : '✏️ Edit Details'}
//                   </Text>
//                 </TouchableOpacity>
//               </View>

//               <View style={styles.formRow}>
//                 <View style={styles.inputGroup}>
//                   <Text style={styles.inputLabel}>PAN Number</Text>
//                   <TextInput
//                     value={panData.number}
//                     onChangeText={handlePanChange}
//                     editable={isEditing}
//                     style={[styles.formInput, !isEditing && styles.formInputDisabled]}
//                     maxLength={10}
//                     autoCapitalize="characters"
//                   />
//                 </View>
//                 <View style={styles.inputGroup}>
//                   <Text style={styles.inputLabel}>Date of Birth</Text>
//                   <TextInput
//                     value={panData.dob}
//                     onChangeText={(value) => handleInputChange('dob', value)}
//                     editable={isEditing}
//                     style={[styles.formInput, !isEditing && styles.formInputDisabled]}
//                     placeholder="DD/MM/YYYY"
//                     placeholderTextColor="#666"
//                   />
//                 </View>
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>Full Name</Text>
//                 <TextInput
//                   value={panData.name}
//                   onChangeText={(value) => handleInputChange('name', value.toUpperCase())}
//                   editable={isEditing}
//                   style={[styles.formInput, !isEditing && styles.formInputDisabled]}
//                   autoCapitalize="characters"
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>Father's Name</Text>
//                 <TextInput
//                   value={panData.fatherName}
//                   onChangeText={(value) => handleInputChange('fatherName', value.toUpperCase())}
//                   editable={isEditing}
//                   style={[styles.formInput, !isEditing && styles.formInputDisabled]}
//                   autoCapitalize="characters"
//                 />
//               </View>

//               {/* <View style={styles.verifiedBadge}>
//                 <Text style={styles.verifiedIcon}>✓</Text>
//                 <Text style={styles.verifiedText}>Data extracted and saved to cloud</Text>
//               </View> */}
//             </View>
//           )}

//           <View style={styles.infoCard}>
//             <View style={styles.infoCardHeader}>
//               <Text style={styles.infoIcon}>🛡️</Text>
//               <Text style={styles.infoCardHeaderText}>Secure Processing</Text>
//             </View>
//             <Text style={styles.infoText}>
//               Your PAN card is processed securely using Google Cloud and stored encrypted in our database.
//             </Text>
//           </View>
//         </View>
//       </View>

//       <View style={styles.buttonSection}>
//         {isProcessed ? (
//           <TouchableOpacity
//             onPress={handleContinue}
//             style={styles.continueButton}
//           >
//             <Text style={styles.continueButtonText}>→ Continue to Aadhar</Text>
//           </TouchableOpacity>
//         ) : (
//           <TouchableOpacity
//             onPress={handleProcessPAN}
//             disabled={!panImage || isUploading || isProcessing}
//             style={[styles.continueButton, (!panImage || isUploading || isProcessing) && styles.continueButtonDisabled]}
//           >
//             <Text style={styles.continueButtonText}>
//               {isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : '→ Process PAN Card'}
//             </Text>
//           </TouchableOpacity>
//         )}
        
//         <TouchableOpacity
//           onPress={() => router.push('/(gowealthy)/mf/onboarding/screen6')}
//           style={styles.nextDevButton}
//         >
//           <Text style={styles.nextDevButtonText}>Skip (Dev) →</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   savedBanner: {
//   backgroundColor: 'rgba(16, 185, 129, 0.1)',
//   borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)',
//   borderRadius: 8, padding: 10, marginBottom: 16, alignItems: 'center',
// },
// savedBannerText: { color: '#10b981', fontSize: 13, fontWeight: '500' },
//   loadingOverlay: {
//   position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
//   backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99,
//   alignItems: 'center', justifyContent: 'center', gap: 12,
// },
// loadingText: { color: '#fff', fontSize: 15, fontWeight: '500' },
//   container: { flex: 1, backgroundColor: '#000' },
//   header: { padding: 20, paddingTop: 60 },
//   backButton: { padding: 8 },
//   backButtonText: { color: '#fff', fontSize: 16 },
//   progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, paddingHorizontal: 20 },
//   progressStepContainer: { flexDirection: 'row', alignItems: 'center' },
//   progressCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
//   progressCircleActive: { backgroundColor: '#6b50c4', borderColor: '#6b50c4', shadowColor: '#6b50c4', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
//   progressText: { fontSize: 14, fontWeight: '600', color: '#666' },
//   progressTextActive: { color: '#fff' },
//   progressLine: { width: 24, height: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginHorizontal: 4 },
//   questionSection: { alignItems: 'center', marginBottom: 32, paddingHorizontal: 20 },
//   questionTitle: { fontSize: 28, fontWeight: '600', color: '#fff', marginBottom: 12, textAlign: 'center' },
//   questionSubtitle: { fontSize: 16, color: '#999', lineHeight: 24, maxWidth: 600, textAlign: 'center' },
//   contentSection: { marginBottom: 32 },
//   formContainer: { paddingHorizontal: 20, maxWidth: 600, width: '100%', alignSelf: 'center' },
//   imageUploadSection: { marginBottom: 24 },
//   imageUploadArea: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.1)', borderStyle: 'dashed', borderRadius: 16, padding: 40, alignItems: 'center' },
//   uploadIconContainer: { width: 64, height: 64, backgroundColor: 'rgba(107, 80, 196, 0.1)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
//   uploadIcon: { fontSize: 32 },
//   uploadTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
//   uploadSubtitle: { fontSize: 14, color: '#999', marginBottom: 16, textAlign: 'center' },
//   uploadBrowseBtn: { backgroundColor: '#6b50c4', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
//   uploadBrowseBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
//   imagePreviewContainer: { alignItems: 'center' },
//   uploadedImagePreview: { width: '100%', height: 250, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 16 },
//   imageActions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
//   removeImageBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1.5, borderColor: 'rgba(239, 68, 68, 0.3)', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
//   removeImageBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '500' },
//   changeImageBtn: { backgroundColor: 'rgba(107, 80, 196, 0.1)', borderWidth: 1.5, borderColor: 'rgba(107, 80, 196, 0.3)', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
//   changeImageBtnText: { color: '#6b50c4', fontSize: 14, fontWeight: '500' },
//   progressSection: { marginVertical: 24 },
//   progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
//   progressLabel: { fontSize: 14, fontWeight: '500', color: '#fff' },
//   progressPercent: { fontSize: 14, fontWeight: '600', color: '#6b50c4' },
//   progressBarContainer: { width: '100%', height: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden' },
//   progressBar: { height: '100%', backgroundColor: '#6b50c4', borderRadius: 4 },
//   processSection: { alignItems: 'center', marginVertical: 24 },
//   processButton: { backgroundColor: '#6b50c4', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10 },
//   processButtonText: { color: '#fff', fontSize: 15, fontWeight: '500' },
//   extractedDataSection: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16, padding: 24, marginBottom: 24 },
//   extractedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
//   extractedHeaderTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
//   editToggleBtn: { backgroundColor: 'rgba(107, 80, 196, 0.1)', borderWidth: 1, borderColor: 'rgba(107, 80, 196, 0.3)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
//   editToggleBtnText: { color: '#6b50c4', fontSize: 14, fontWeight: '500' },
//   formRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
//   inputGroup: { flex: 1, marginBottom: 16 },
//   inputLabel: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 8 },
//   formInput: { padding: 14, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, color: '#fff', fontSize: 15 },
//   formInputDisabled: { backgroundColor: 'rgba(100, 100, 100, 0.05)', opacity: 0.8 },
//   verifiedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1.5, borderColor: 'rgba(16, 185, 129, 0.3)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginTop: 8 },
//   verifiedIcon: { fontSize: 20, color: '#10b981', marginRight: 8 },
//   verifiedText: { fontSize: 14, fontWeight: '600', color: '#10b981' },
//   infoCard: { backgroundColor: 'rgba(107, 80, 196, 0.1)', borderWidth: 1.5, borderColor: 'rgba(107, 80, 196, 0.3)', borderRadius: 12, padding: 16 },
//   infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
//   infoIcon: { fontSize: 20 },
//   infoCardHeaderText: { fontSize: 14, fontWeight: '600', color: '#fff' },
//   infoText: { fontSize: 14, color: '#ccc', lineHeight: 20 },
//   buttonSection: { padding: 20, gap: 12, marginBottom: 40 },
//   continueButton: { backgroundColor: '#6b50c4', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center' },
//   continueButtonDisabled: { backgroundColor: '#444', opacity: 0.6 },
//   continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
//   nextDevButton: { backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', opacity: 0.8 },
//   nextDevButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
// });

// export default Screen1PANBackend;
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../../../src/config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { BACKEND_URL, NSE_SERVICE_URL, EMAIL_SERVICE_URL } from '../../../../src/config/services';
import { uploadToSignedPost } from '../../../../src/utils/upload';
 // CHANGE TO YOUR IP
const PAN_OCR_ENDPOINT = 'https://pan-parser-763133497996.asia-south1.run.app';

// ── ember forge palette (matches gowealthy_redesigned.html) ──────────────
const C = {
  bg: '#08060a', bg2: '#0e0a10', bg3: '#151019',
  surface: '#181219', surface2: '#1f1722',
  line: 'rgba(255,180,120,0.09)', line2: 'rgba(255,180,120,0.16)',
  ink: '#fbf5ef', muted: '#a99ba6', faint: '#332a36',
  o: '#ff6a1a', o2: '#ff8f3c', oDeep: '#d4470a',
  gold: '#f7c85a', gold2: '#ffe0a3',
  good: '#4fd39a', bad: '#ff6b6b',
  glass: 'rgba(30,22,34,0.72)',
};

// ── floating embers background (matches .embers/.ember rise animation) ───
const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const EMBER_COUNT = 14;

const EmberField = () => {
  const embers = useMemo(() => (
    Array.from({ length: EMBER_COUNT }).map((_, i) => ({
      key: i,
      left: Math.random() * SCREEN_W,
      size: 2 + Math.random() * 2.5,
      duration: 5500 + Math.random() * 5000,
      delay: Math.random() * 6000,
      drift: (Math.random() - 0.5) * 30,
    }))
  ), []);

  return (
    <View style={styles.embersWrap} pointerEvents="none">
      {embers.map((e) => (
        <Ember key={e.key} {...e} />
      ))}
    </View>
  );
};

const Ember = ({ left, size, duration, delay, drift }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    const loop = () => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && mounted) loop();
      });
    };
    loop();
    return () => { mounted = false; };
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(SCREEN_H + 100)],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drift],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.12, 0.85, 1],
    outputRange: [0, 0.75, 0.4, 0],
  });
  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        bottom: -10,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: C.o2,
        shadowColor: C.o2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        opacity,
        transform: [{ translateY }, { translateX }, { scale }],
      }}
    />
  );
};

const Screen1PANBackend = () => {
  const router = useRouter();
  const [panImage, setPanImage] = useState(null);
  const [panData, setPanData] = useState({
    number: '',
    name: '',
    fatherName: '',
    dob: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileUrl, setFileUrl] = useState(null);
  const generateUCC = (fullName, phone) => {
  const parts = fullName.trim().toUpperCase().replace(/[^A-Z ]/g, '').split(/\s+/);
  const firstName = (parts[0] || 'XX').padEnd(2, 'X').slice(0, 2);
  const lastName  = (parts[parts.length > 1 ? parts.length - 1 : 0] || 'XX').padEnd(2, 'X').slice(0, 2);
  const lastFour  = String(phone).replace(/\D/g, '').slice(-4).padStart(4, '0');
  return `${firstName}${lastName}${lastFour}`;
};

const [isLoadingExisting, setIsLoadingExisting] = useState(false);
const loadExistingData = async () => {
  try {
    setIsLoadingExisting(true);
    const phoneNumber = await AsyncStorage.getItem('user_phone');
    if (!phoneNumber) return;
 
    const docRef = doc(db, 'mf_onboarding', phoneNumber);
    const docSnap = await getDoc(docRef);
 
    if (docSnap.exists() && docSnap.data()?.pan_data) {
      const saved = docSnap.data().pan_data;
      console.log('📂 Existing PAN data found, restoring...');
 
      // Restore OCR data into state
      setPanData({
        number:     saved.pan_number   || '',
        name:       saved.name         || '',
        fatherName: saved.father_name  || '',
        dob:        saved.dob          || '',
      });
 
      // Show the GCS image URL as preview (https:// URL, not local uri)
      if (saved.pan_image_url) {
        setFileUrl(saved.pan_image_url);
         // shows in Image component
      }
 
      setIsProcessed(true);
      console.log('✅ PAN data restored from Firestore');
    }
  } catch (error) {
    // Silently fail — user just needs to re-upload, not a blocker
    console.log('ℹ️ No existing PAN data or fetch failed:', error.message);
  } finally {
    setIsLoadingExisting(false);
  }
};
useEffect(() => {
  loadExistingData();
}, []);
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setPanImage(result.assets[0].uri);
      setIsProcessed(false);
      setPanData({ number: '', name: '', fatherName: '', dob: '' });
      setFileUrl(null);
      setUploadProgress(0);
    }
  };

  const handleProcessPAN = async () => {
    if (!panImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Get phone number from AsyncStorage
      const phoneNumber = await AsyncStorage.getItem('user_phone');
      if (!phoneNumber) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }

      console.log('📱 Phone Number:', phoneNumber);

      // Step 1: Get signed URL from backend
      const fileName = `pan_${Date.now()}.jpg`;
      console.log('🔑 Requesting upload URL for PAN...');

      const urlResponse = await fetch(`${BACKEND_URL}/api/generate-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          contentType: 'image/jpeg',
          userId: phoneNumber,
          docType: 'pan'
        })
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL from backend');
      }

     const { url, fields, fileUrl: gcsFileUrl, gcsUri } =
  await urlResponse.json();
      console.log('✅ Upload URL received');
      console.log('📁 File will be stored at:', gcsFileUrl);

      setUploadProgress(25);

      console.log('📤 Uploading PAN to Google Cloud Storage (POST)...');

await uploadToSignedPost({ url, fields, uri: panImage });

console.log('✅ Upload to GCS successful');

      setUploadProgress(50);
      setFileUrl(gcsFileUrl);
      setIsUploading(false);

      // Step 3: Process with PAN OCR
      setIsProcessing(true);
      setUploadProgress(75);
      console.log('🔄 Starting PAN OCR extraction...');

     const encodedFileUri = encodeURIComponent(gcsUri);
const ocrUrl = `${PAN_OCR_ENDPOINT}?file_uri=${encodedFileUri}`;

      
      console.log('📤 Calling PAN OCR endpoint:', ocrUrl);

      const ocrResponse = await fetch(ocrUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const ocrText = await ocrResponse.text();
      console.log('📥 PAN OCR Response:', ocrText);

      if (!ocrResponse.ok) {
        console.error('❌ PAN OCR Error Response:', ocrText);
        throw new Error(`PAN OCR processing failed: ${ocrResponse.status}`);
      }

      let extractedData;
      try {
        extractedData = JSON.parse(ocrText);
        console.log('✅ Extracted PAN Data:', extractedData);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        throw new Error('Failed to parse PAN OCR response');
      }

      if (extractedData.Error || extractedData.error) {
        throw new Error(extractedData.Error || extractedData.error);
      }

      // Check if success
      if (extractedData.success !== 'Yes') {
        throw new Error('PAN extraction failed');
      }

      // Map OCR response to our data structure
      const result = extractedData.response?.result;
      if (!result) {
        throw new Error('No result data in PAN OCR response');
      }

      const mappedData = {
        number: result.pan_number || '',
        name: result.name || '',
        fatherName: result.father_name || '',
        dob: result.dob || ''
      };

      setPanData(mappedData);
      setUploadProgress(100);
      setIsProcessing(false);
      setIsProcessed(true);

      console.log('✅ PAN OCR Processing Complete');

      // Step 4: Save to Firebase
      await saveToFirebase(phoneNumber, mappedData, gcsFileUrl);

    } catch (error) {
      console.error('❌ Error in PAN processing:', error);
      Alert.alert('Error', error.message || 'Failed to process PAN card');
      setIsUploading(false);
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

const saveToFirebase = async (phoneNumber, data, gcsUri) => {
  try {
    console.log('💾 Saving PAN data to mf_onboarding...');
 
    const ucc = generateUCC(data.name, phoneNumber);
    console.log('🆔 Generated UCC:', ucc);
 
    const docRef = doc(db, 'mf_onboarding', phoneNumber);
 
    await setDoc(docRef, {
      ucc_code:       ucc,
      onboarding_step: 1,
      pan_data: {
        pan_number:    data.number,
        name:          data.name,
        father_name:   data.fatherName,
        dob:           data.dob, 
        pan_image_url:     gcsUri,            // DD/MM/YYYY — as returned by OCR
        pan_image_gcs_uri: gcsUri,
        uploaded_at:   new Date().toISOString(),
      },
      created_at:     new Date().toISOString(),
    }, { merge: true });
 
    console.log('✅ Saved to mf_onboarding/' + phoneNumber);
  } catch (error) {
    console.error('❌ Firestore save error:', error);
    throw new Error('Failed to save PAN data');
  }
};

  const handleInputChange = (field, value) => {
    setPanData(prev => ({ ...prev, [field]: value }));
  };

  const handlePanChange = (value) => {
    const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    handleInputChange('number', formattedValue);
  };

const handleContinue = async () => {
  try {
    const phoneNumber = await AsyncStorage.getItem('user_phone');
    if (!phoneNumber) {
      Alert.alert('Error', 'Session expired. Please log in again.');
      return;
    }
 
    // If user edited fields manually after OCR, persist the latest values
    if (isProcessed) {
      await saveToFirebase(phoneNumber, panData, fileUrl);
    }
 
    router.push('/(gowealthy)/mf/onboarding/screen2');
  } catch (error) {
    console.error('Error on continue:', error);
    Alert.alert('Error', 'Something went wrong. Please try again.');
  }
};

  const STEP = 1;
  const TOTAL_STEPS = 6;

  return (
    <View style={styles.screen}>
      <EmberField />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoadingExisting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={C.o} />
            <Text style={styles.loadingText}>Loading your saved data...</Text>
          </View>
        )}

        {/* ── top chrome: progress rail + back + step tag ── */}
        <View style={styles.progWrap}>
          <LinearGradient
            colors={[C.oDeep, C.o, C.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progBar, { width: `${(STEP / TOTAL_STEPS) * 100}%` }]}
          />
        </View>

        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.stepTag}>
            <Text style={styles.stepTagText}>STEP {STEP} OF {TOTAL_STEPS}</Text>
          </View>
        </View>

        {/* ── heading ── */}
        <View style={styles.questionSection}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowLine} />
            <Text style={styles.eyebrow}>IDENTITY VERIFICATION</Text>
            <View style={styles.eyebrowLine} />
          </View>
          <Text style={styles.questionTitle}>
            Upload your <Text style={styles.gradWord}>PAN Card</Text>
          </Text>
          <Text style={styles.questionSubtitle}>
            Upload a clear image of your PAN card for automatic data extraction
          </Text>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.formContainer}>
            <View style={styles.imageUploadSection}>
              {!panImage ? (
                <TouchableOpacity
                  style={styles.imageUploadArea}
                  onPress={pickImage}
                  activeOpacity={0.85}
                >
                  <View style={styles.uploadIconContainer}>
                    <Text style={styles.uploadIcon}>📤</Text>
                  </View>
                  <Text style={styles.uploadTitle}>Upload PAN Card Image</Text>
                  <Text style={styles.uploadSubtitle}>
                    Tap to select your PAN card image
                  </Text>
                  <View style={styles.uploadBrowseBtn}>
                    <Text style={styles.uploadBrowseBtnText}>Browse Files</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.imagePreviewContainer}>
                  <View style={styles.imageFrame}>
                    <Image
                      source={{ uri: panImage }}
                      style={styles.uploadedImagePreview}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setPanImage(null);
                        setIsProcessed(false);
                        setPanData({ number: '', name: '', fatherName: '', dob: '' });
                        setFileUrl(null);
                        setUploadProgress(0);
                      }}
                      style={styles.removeImageBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.removeImageBtnText}>✕ Remove</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={pickImage}
                      style={styles.changeImageBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.changeImageBtnText}>📤 Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Upload Progress */}
            {(isUploading || isProcessing) && uploadProgress > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressLabel}>
                    {isUploading ? 'Uploading to Cloud...' : 'Extracting PAN Data...'}
                  </Text>
                  <Text style={styles.progressPercent}>{uploadProgress}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <LinearGradient
                    colors={[C.o, C.gold]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${uploadProgress}%` }]}
                  />
                </View>
              </View>
            )}

            {panImage && !isProcessed && !isUploading && !isProcessing && (
              <View style={styles.processSection}>
                <TouchableOpacity onPress={handleProcessPAN} activeOpacity={0.9} style={styles.processButtonWrap}>
                  <LinearGradient
                    colors={[C.o2, C.o]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.processButton}
                  >
                    <Text style={styles.processButtonText}>→ Extract Details</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {isProcessed && (
              <View style={styles.extractedDataSection}>
                {isProcessed && !isEditing && (
                  <View style={styles.savedBanner}>
                    <Text style={styles.savedBannerText}>✓ Saved data loaded — tap Edit to change or Upload new image</Text>
                  </View>
                )}
                <View style={styles.extractedHeader}>
                  <Text style={styles.extractedHeaderTitle}>Extracted Information</Text>

                  <TouchableOpacity
                    onPress={() => setIsEditing(!isEditing)}
                    style={styles.editToggleBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editToggleBtnText}>
                      {isEditing ? '👁️ View Mode' : '✏️ Edit Details'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PAN Number</Text>
                    <TextInput
                      value={panData.number}
                      onChangeText={handlePanChange}
                      editable={isEditing}
                      style={[styles.formInput, !isEditing && styles.formInputDisabled]}
                      maxLength={10}
                      autoCapitalize="characters"
                      placeholderTextColor={C.muted}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date of Birth</Text>
                    <TextInput
                      value={panData.dob}
                      onChangeText={(value) => handleInputChange('dob', value)}
                      editable={isEditing}
                      style={[styles.formInput, !isEditing && styles.formInputDisabled]}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor={C.muted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    value={panData.name}
                    onChangeText={(value) => handleInputChange('name', value.toUpperCase())}
                    editable={isEditing}
                    style={[styles.formInput, !isEditing && styles.formInputDisabled]}
                    autoCapitalize="characters"
                    placeholderTextColor={C.muted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Father's Name</Text>
                  <TextInput
                    value={panData.fatherName}
                    onChangeText={(value) => handleInputChange('fatherName', value.toUpperCase())}
                    editable={isEditing}
                    style={[styles.formInput, !isEditing && styles.formInputDisabled]}
                    autoCapitalize="characters"
                    placeholderTextColor={C.muted}
                  />
                </View>

                {/* <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedIcon}>✓</Text>
                  <Text style={styles.verifiedText}>Data extracted and saved to cloud</Text>
                </View> */}
              </View>
            )}

            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Text style={styles.infoIcon}>🛡️</Text>
                <Text style={styles.infoCardHeaderText}>Secure Processing</Text>
              </View>
              <Text style={styles.infoText}>
                Your PAN card is processed securely using Google Cloud and stored encrypted in our database.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonSection}>
          {isProcessed ? (
            <TouchableOpacity onPress={handleContinue} activeOpacity={0.9} style={styles.continueButtonWrap}>
              <LinearGradient
                colors={[C.o2, C.o]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.continueButton}
              >
                <Text style={styles.continueButtonText}>→ Continue to Aadhar</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleProcessPAN}
              disabled={!panImage || isUploading || isProcessing}
              activeOpacity={0.9}
              style={styles.continueButtonWrap}
            >
              <LinearGradient
                colors={(!panImage || isUploading || isProcessing) ? [C.faint, C.faint] : [C.o2, C.o]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.continueButton, (!panImage || isUploading || isProcessing) && styles.continueButtonDisabled]}
              >
                <Text style={[styles.continueButtonText, (!panImage || isUploading || isProcessing) && styles.continueButtonTextDisabled]}>
                  {isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : '→ Process PAN Card'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.push('/(gowealthy)/mf/onboarding/screen6')}
            style={styles.nextDevButton}
            activeOpacity={0.8}
          >
            <Text style={styles.nextDevButtonText}>Skip (Dev) →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // ── shell ──
  screen: { flex: 1, backgroundColor: C.bg },
  embersWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingBottom: 24 },

  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(8,6,10,0.88)', zIndex: 99,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingText: { color: C.ink, fontSize: 14, fontWeight: '500' },

  // ── top chrome ──
  progWrap: { height: 3, width: '100%', backgroundColor: 'rgba(255,255,255,0.05)' },
  progBar: { height: '100%' },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: C.glass,
    borderWidth: 1, borderColor: C.line2, alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: C.muted, fontSize: 17, fontWeight: '600' },
  stepTag: {
    backgroundColor: C.glass, borderWidth: 1, borderColor: C.line,
    borderRadius: 30, paddingVertical: 6, paddingHorizontal: 13,
  },
  stepTagText: { color: C.muted, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.2 },

  // ── heading ──
  questionSection: { alignItems: 'center', marginTop: 22, marginBottom: 28, paddingHorizontal: 22 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  eyebrowLine: { width: 20, height: 1, backgroundColor: C.o2 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: C.o2, textTransform: 'uppercase' },
  questionTitle: {
    fontSize: 30, fontWeight: '700', color: C.ink, marginBottom: 12,
    textAlign: 'center', letterSpacing: -0.5, lineHeight: 36,
  },
  gradWord: { color: C.o2 },
  questionSubtitle: { fontSize: 14.5, color: C.muted, lineHeight: 21, maxWidth: 340, textAlign: 'center' },

  // ── content ──
  contentSection: { marginBottom: 8 },
  formContainer: { paddingHorizontal: 20, maxWidth: 600, width: '100%', alignSelf: 'center' },

  // upload area
  imageUploadSection: { marginBottom: 20 },
  imageUploadArea: {
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.line,
    borderStyle: 'dashed', borderRadius: 22, padding: 36, alignItems: 'center',
  },
  uploadIconContainer: {
    width: 60, height: 60, backgroundColor: 'rgba(255,106,26,0.12)', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,106,26,0.25)',
  },
  uploadIcon: { fontSize: 28 },
  uploadTitle: { fontSize: 17, fontWeight: '700', color: C.ink, marginBottom: 6 },
  uploadSubtitle: { fontSize: 13, color: C.muted, marginBottom: 18, textAlign: 'center' },
  uploadBrowseBtn: {
    backgroundColor: 'rgba(255,106,26,0.12)', borderWidth: 1, borderColor: 'rgba(255,106,26,0.35)',
    paddingVertical: 10, paddingHorizontal: 22, borderRadius: 30,
  },
  uploadBrowseBtnText: { color: C.o2, fontSize: 13.5, fontWeight: '700' },

  imagePreviewContainer: { alignItems: 'center' },
  imageFrame: {
    width: '100%', borderRadius: 18, padding: 4, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line2, marginBottom: 14,
  },
  uploadedImagePreview: { width: '100%', height: 230, borderRadius: 14 },
  imageActions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  removeImageBtn: {
    backgroundColor: 'rgba(255,107,107,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,107,107,0.3)',
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 30,
  },
  removeImageBtnText: { color: C.bad, fontSize: 13.5, fontWeight: '600' },
  changeImageBtn: {
    backgroundColor: 'rgba(255,106,26,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,106,26,0.3)',
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 30,
  },
  changeImageBtnText: { color: C.o2, fontSize: 13.5, fontWeight: '600' },

  // progress
  progressSection: { marginVertical: 20 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 13.5, fontWeight: '600', color: C.ink },
  progressPercent: { fontSize: 13.5, fontWeight: '700', color: C.o2 },
  progressBarContainer: { width: '100%', height: 6, backgroundColor: C.faint, borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },

  // extract cta
  processSection: { alignItems: 'center', marginVertical: 20 },
  processButtonWrap: { width: '100%', maxWidth: 420, borderRadius: 15, shadowColor: C.o, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  processButton: { paddingVertical: 15, paddingHorizontal: 28, borderRadius: 15, alignItems: 'center' },
  processButtonText: { color: '#1a0d04', fontSize: 15, fontWeight: '700' },

  // extracted card
  extractedDataSection: {
    backgroundColor: C.glass, borderWidth: 1, borderColor: C.line, borderRadius: 22,
    padding: 22, marginBottom: 20,
  },
  savedBanner: {
    backgroundColor: 'rgba(79,211,154,0.1)', borderWidth: 1, borderColor: 'rgba(79,211,154,0.3)',
    borderRadius: 12, padding: 10, marginBottom: 16, alignItems: 'center',
  },
  savedBannerText: { color: C.good, fontSize: 12.5, fontWeight: '600', textAlign: 'center' },
  extractedHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  extractedHeaderTitle: { fontSize: 15.5, fontWeight: '700', color: C.ink },
  editToggleBtn: {
    backgroundColor: 'rgba(255,106,26,0.1)', borderWidth: 1, borderColor: 'rgba(255,106,26,0.3)',
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 30,
  },
  editToggleBtnText: { color: C.o2, fontSize: 12.5, fontWeight: '700' },

  formRow: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  inputGroup: { flex: 1, marginBottom: 14 },
  inputLabel: { fontSize: 12.5, fontWeight: '600', color: C.muted, marginBottom: 8, letterSpacing: 0.3 },
  formInput: {
    padding: 14, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.line2,
    borderRadius: 13, color: C.ink, fontSize: 14.5,
  },
  formInputDisabled: { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: C.line, opacity: 0.75 },

  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(79,211,154,0.1)', borderWidth: 1.5, borderColor: 'rgba(79,211,154,0.3)',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginTop: 8,
  },
  verifiedIcon: { fontSize: 20, color: C.good, marginRight: 8 },
  verifiedText: { fontSize: 14, fontWeight: '600', color: C.good },

  // info card
  infoCard: {
    backgroundColor: 'rgba(255,106,26,0.07)', borderWidth: 1, borderColor: 'rgba(255,106,26,0.22)',
    borderRadius: 16, padding: 16,
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoIcon: { fontSize: 18 },
  infoCardHeaderText: { fontSize: 13.5, fontWeight: '700', color: C.ink },
  infoText: { fontSize: 13, color: C.muted, lineHeight: 19 },

  // bottom buttons
  buttonSection: { padding: 20, gap: 12, marginBottom: 20 },
  continueButtonWrap: { borderRadius: 15, shadowColor: C.o, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  continueButton: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 15, alignItems: 'center' },
  continueButtonDisabled: { shadowOpacity: 0 },
  continueButtonText: { color: '#1a0d04', fontSize: 15.5, fontWeight: '700' },
  continueButtonTextDisabled: { color: C.muted },
  nextDevButton: {
    backgroundColor: 'rgba(79,211,154,0.1)', borderWidth: 1, borderColor: 'rgba(79,211,154,0.3)',
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30, alignItems: 'center',
  },
  nextDevButtonText: { color: C.good, fontSize: 13, fontWeight: '600' },
});

export default Screen1PANBackend;