// import React, { useState } from 'react';
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

// const Screen2Aadhar = () => {
//   const router = useRouter();
//   const [aadharImage, setAadharImage] = useState(null);
//   const [aadharData, setAadharData] = useState({
//     number: '',
//     name: '',
//     address: '',
//     dob: ''
//   });
//   const [isUploading, setIsUploading] = useState(false);
//   const [isProcessed, setIsProcessed] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [isCheckingKYC, setIsCheckingKYC] = useState(false);

//   const pickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [16, 10],
//       quality: 1,
//     });

//     if (!result.canceled) {
//       setAadharImage(result.assets[0].uri);
//       setIsProcessed(false);
//       setAadharData({ number: '', name: '', address: '', dob: '' });
//     }
//   };

//   const handleProcessAadhar = async () => {
//     setIsUploading(true);
//     setTimeout(() => {
//       setIsUploading(false);
//       const mockAadharData = {
//         number: '1234 5678 9012',
//         name: 'JOHN DOE',
//         address: '123 Main Street, New Delhi, 110001',
//         dob: '15/06/1990'
//       };
//       setAadharData(mockAadharData);
//       setIsProcessed(true);
//     }, 2000);
//   };

//   const handleInputChange = (field, value) => {
//     setAadharData(prev => ({ ...prev, [field]: value }));
//   };

//   const handleKYCCheck = async () => {
   
//         router.push('/(gowealthy)/mf/onboarding/screen4');
     
//   };

//   const handleContinue = async () => {
//     try {
//       await AsyncStorage.setItem('mf_aadhar_data', JSON.stringify({
//         aadharImage,
//         aadharData,
//         aadharProcessed: isProcessed
//       }));
      
//       handleKYCCheck();
//     } catch (error) {
//       console.error('Error saving Aadhar data:', error);
//     }
//   };

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
//               step === 1 && styles.progressCircleCompleted,
//               step === 2 && styles.progressCircleActive
//             ]}>
//               <Text style={[
//                 styles.progressText,
//                 (step === 1 || step === 2) && styles.progressTextActive
//               ]}>{step === 1 ? '✓' : step}</Text>
//             </View>
//             {idx < 5 && <View style={styles.progressLine} />}
//           </View>
//         ))}
//       </View>

//       <View style={styles.questionSection}>
//         <Text style={styles.questionTitle}>Upload your Aadhar Card</Text>
//         <Text style={styles.questionSubtitle}>
//           Upload a clear image of your Aadhar card for automatic data extraction
//         </Text>
//       </View>

//       <View style={styles.contentSection}>
//         <View style={styles.formContainer}>
//           <View style={styles.imageUploadSection}>
//             {!aadharImage ? (
//               <TouchableOpacity 
//                 style={styles.imageUploadArea}
//                 onPress={pickImage}
//                 activeOpacity={0.8}
//               >
//                 <View style={styles.uploadIconContainer}>
//                   <Text style={styles.uploadIcon}>📤</Text>
//                 </View>
//                 <Text style={styles.uploadTitle}>Upload Aadhar Card Image</Text>
//                 <Text style={styles.uploadSubtitle}>
//                   Click to select your Aadhar card image
//                 </Text>
//                 <View style={styles.uploadBrowseBtn}>
//                   <Text style={styles.uploadBrowseBtnText}>Browse Files</Text>
//                 </View>
//               </TouchableOpacity>
//             ) : (
//               <View style={styles.imagePreviewContainer}>
//                 <Image 
//                   source={{ uri: aadharImage }} 
//                   style={styles.uploadedImagePreview}
//                   resizeMode="contain"
//                 />
//                 <View style={styles.imageActions}>
//                   <TouchableOpacity
//                     onPress={() => {
//                       setAadharImage(null);
//                       setIsProcessed(false);
//                       setAadharData({ number: '', name: '', address: '', dob: '' });
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

//           {aadharImage && !isProcessed && (
//             <View style={styles.processSection}>
//               <TouchableOpacity
//                 onPress={handleProcessAadhar}
//                 disabled={isUploading}
//                 style={[styles.processButton, isUploading && styles.processButtonDisabled]}
//               >
//                 {isUploading ? (
//                   <>
//                     <ActivityIndicator size="small" color="#fff" />
//                     <Text style={styles.processButtonText}>Processing Image...</Text>
//                   </>
//                 ) : (
//                   <Text style={styles.processButtonText}>→ Extract Details</Text>
//                 )}
//               </TouchableOpacity>
//             </View>
//           )}

//           {isProcessed && (
//             <View style={styles.extractedDataSection}>
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
//                   <Text style={styles.inputLabel}>Aadhar Number</Text>
//                   <TextInput
//                     value={aadharData.number}
//                     onChangeText={(value) => handleInputChange('number', value)}
//                     editable={isEditing}
//                     style={[styles.formInput, !isEditing && styles.formInputDisabled]}
//                   />
//                 </View>
//                 <View style={styles.inputGroup}>
//                   <Text style={styles.inputLabel}>Date of Birth</Text>
//                   <TextInput
//                     value={aadharData.dob}
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
//                   value={aadharData.name}
//                   onChangeText={(value) => handleInputChange('name', value.toUpperCase())}
//                   editable={isEditing}
//                   style={[styles.formInput, !isEditing && styles.formInputDisabled]}
//                   autoCapitalize="characters"
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>Address</Text>
//                 <TextInput
//                   value={aadharData.address}
//                   onChangeText={(value) => handleInputChange('address', value)}
//                   editable={isEditing}
//                   style={[styles.formTextarea, !isEditing && styles.formInputDisabled]}
//                   multiline
//                   numberOfLines={3}
//                 />
//               </View>
//             </View>
//           )}

//           <View style={styles.infoCard}>
//             <View style={styles.infoCardHeader}>
//               <Text style={styles.infoIcon}>🛡️</Text>
//               <Text style={styles.infoCardHeaderText}>Privacy Protected</Text>
//             </View>
//             <Text style={styles.infoText}>
//               Your Aadhar details are processed securely and used only for KYC verification as per regulations.
//             </Text>
//           </View>
//         </View>
//       </View>

//       <View style={styles.buttonSection}>
//         {isProcessed ? (
//           <TouchableOpacity
//             onPress={handleContinue}
//             disabled={isCheckingKYC}
//             style={[styles.continueButton, isCheckingKYC && styles.continueButtonDisabled]}
//           >
//             {isCheckingKYC ? (
//               <>
//                 <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
//                 <Text style={styles.continueButtonText}>Checking KYC...</Text>
//               </>
//             ) : (
//               <Text style={styles.continueButtonText}>🛡️ Check KYC Status</Text>
//             )}
//           </TouchableOpacity>
//         ) : (
//           <TouchableOpacity
//             onPress={handleProcessAadhar}
//             disabled={!aadharImage || isUploading}
//             style={[styles.continueButton, (!aadharImage || isUploading) && styles.continueButtonDisabled]}
//           >
//             <Text style={styles.continueButtonText}>
//               {isUploading ? 'Processing...' : '→ Process Aadhar Card'}
//             </Text>
//           </TouchableOpacity>
//         )}
        
//         <TouchableOpacity
//           onPress={() => router.push('/(gowealthy)/mf/onboarding/screen3')}
//           style={styles.nextDevButton}
//         >
//           <Text style={styles.nextDevButtonText}>Next →</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#000' },
//   header: { padding: 20, paddingTop: 60 },
//   backButton: { padding: 8 },
//   backButtonText: { color: '#fff', fontSize: 16 },
//   progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, paddingHorizontal: 20 },
//   progressStepContainer: { flexDirection: 'row', alignItems: 'center' },
//   progressCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
//   progressCircleActive: { backgroundColor: '#6b50c4', borderColor: '#6b50c4', shadowColor: '#6b50c4', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
//   progressCircleCompleted: { backgroundColor: '#10b981', borderColor: '#10b981' },
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
//   processSection: { alignItems: 'center', marginVertical: 24 },
//   processButton: { backgroundColor: '#6b50c4', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10 },
//   processButtonDisabled: { backgroundColor: '#444', opacity: 0.6 },
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
//   formTextarea: { padding: 14, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, color: '#fff', fontSize: 15, height: 80, textAlignVertical: 'top' },
//   formInputDisabled: { backgroundColor: 'rgba(100, 100, 100, 0.05)', opacity: 0.8 },
//   infoCard: { backgroundColor: 'rgba(107, 80, 196, 0.1)', borderWidth: 1.5, borderColor: 'rgba(107, 80, 196, 0.3)', borderRadius: 12, padding: 16 },
//   infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
//   infoIcon: { fontSize: 20 },
//   infoCardHeaderText: { fontSize: 14, fontWeight: '600', color: '#fff' },
//   infoText: { fontSize: 14, color: '#ccc', lineHeight: 20 },
//   buttonSection: { padding: 20, gap: 12, marginBottom: 40 },
//   continueButton: { backgroundColor: '#6b50c4', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
//   continueButtonDisabled: { backgroundColor: '#444', opacity: 0.6 },
//   continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
//   nextDevButton: { backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', opacity: 0.8 },
//   nextDevButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
// });

// export default Screen2Aadhar;
import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../../src/config/firebase';
import { doc, setDoc } from 'firebase/firestore';

const BACKEND_URL = 'http://192.168.1.20:3001'; // CHANGE TO YOUR IP
const OCR_ENDPOINT = 'https://adhar-parser-763133497996.asia-south1.run.app';

const Screen2AadhaarBackend = () => {
  const router = useRouter();
  const [aadharImage, setAadharImage] = useState(null);
  const [aadharData, setAadharData] = useState({
    number: '',
    name: '',
    address: '',
    dob: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileUrl, setFileUrl] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setAadharImage(result.assets[0].uri);
      setIsProcessed(false);
      setAadharData({ number: '', name: '', address: '', dob: '' });
      setFileUrl(null);
      setUploadProgress(0);
    }
  };

  const handleProcessAadhar = async () => {
    if (!aadharImage) {
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
      const fileName = `aadhaar_${Date.now()}.jpg`;
      console.log('🔑 Requesting upload URL...');

      const urlResponse = await fetch(`${BACKEND_URL}/api/generate-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          contentType: 'image/jpeg',
          userId: phoneNumber,
          docType: 'aadhaar'
        })
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL from backend');
      }

      // const { uploadUrl, fileUrl: gcsFileUrl } = await urlResponse.json();
      const { url, fields, fileUrl: gcsFileUrl, gcsUri} = await urlResponse.json();

      console.log('✅ Upload URL received');
      console.log('📁 File will be stored at:', gcsFileUrl);

      setUploadProgress(25);

      // Step 2: Upload to GCS
      console.log('📤 Uploading to Google Cloud Storage...');
      
      const imageResponse = await fetch(aadharImage);
      const imageBlob = await imageResponse.blob();

      // const uploadResponse = await fetch(uploadUrl, {
      //   method: 'PUT',
      //   body: imageBlob,
      //   headers: { 'Content-Type': 'image/jpeg' }
      // });

      // if (!uploadResponse.ok) {
      //   throw new Error('Failed to upload to Google Cloud Storage');
      // }
// Step 2: Upload to GCS using POST
console.log('📤 Uploading to Google Cloud Storage...');

const formData = new FormData();

// Add signed fields
Object.entries(fields).forEach(([key, value]) => {
  formData.append(key, value);
});

// Add file
formData.append('file', {
  uri: aadharImage,
  type: 'image/jpeg',
  name: fileName,
});

const uploadResponse = await fetch(url, {
  method: 'POST',
  body: formData,
});

if (!uploadResponse.ok) {
  const errText = await uploadResponse.text();
  console.error('Upload error:', errText);
  throw new Error('Failed to upload to Google Cloud Storage');
}

// console.log('✅ Upload to GCS successful');

      console.log('✅ Upload to GCS successful');
      setUploadProgress(50);
      setFileUrl(gcsFileUrl);
      setIsUploading(false);

      // Step 3: Process with OCR
      setIsProcessing(true);
      setUploadProgress(75);
      console.log('🔄 Starting OCR extraction...');

     const encodedFileUrl = encodeURIComponent(gcsUri);
const ocrUrl = `${OCR_ENDPOINT}?file_uri=${encodedFileUrl}`;

      
      console.log('📤 Calling OCR endpoint:', ocrUrl);

      const ocrResponse = await fetch(ocrUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const ocrText = await ocrResponse.text();
      console.log('📥 OCR Response:', ocrText);

      if (!ocrResponse.ok) {
        console.error('❌ OCR Error Response:', ocrText);
        throw new Error(`OCR processing failed: ${ocrResponse.status}`);
      }

      let extractedData;
      try {
        extractedData = JSON.parse(ocrText);
        console.log('✅ Extracted Data:', extractedData);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        throw new Error('Failed to parse OCR response');
      }

      if (extractedData.Error || extractedData.error) {
        throw new Error(extractedData.Error || extractedData.error);
      }

      // Map OCR response to our data structure
      const mappedData = {
        number: extractedData.aadhaarNumber || extractedData.number || '',
        name: extractedData.name || '',
        address: extractedData.address || '',
        dob: extractedData.dob || extractedData.dateOfBirth || ''
      };

      setAadharData(mappedData);
      setUploadProgress(100);
      setIsProcessing(false);
      setIsProcessed(true);

      console.log('✅ OCR Processing Complete');

      // Step 4: Save to Firebase
      await saveToFirebase(phoneNumber, mappedData, gcsFileUrl);

    } catch (error) {
      console.error('❌ Error in processing:', error);
      Alert.alert('Error', error.message || 'Failed to process Aadhaar card');
      setIsUploading(false);
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const saveToFirebase = async (phoneNumber, data, gcsFileUrl) => {
    try {
      console.log('💾 Saving to Firebase...');
      
      const userDocRef = doc(db, 'users', phoneNumber);
      
      await setDoc(userDocRef, {
        aadhaar_info: {
          [phoneNumber]: {
            name: data.name,
            dob: data.dob,
            aadhaarNumber: data.number,
            address: data.address,
            fileUrl: gcsFileUrl,
            uploadedAt: new Date().toISOString(),
            status: 'verified',
            lastUpdated: new Date().toISOString()
          }
        }
      }, { merge: true });

      console.log('✅ Saved to Firebase: users/' + phoneNumber + '/aadhaar_info/' + phoneNumber);
      
    } catch (error) {
      console.error('❌ Firebase save error:', error);
      throw new Error('Failed to save to database');
    }
  };

  const handleInputChange = (field, value) => {
    setAadharData(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = async () => {
    try {
      // Save updated data to AsyncStorage
      await AsyncStorage.setItem('mf_aadhar_data', JSON.stringify({
        aadharImage,
        aadharData,
        aadharProcessed: isProcessed,
        fileUrl
      }));

      // Update Firebase with any manual edits
      const phoneNumber = await AsyncStorage.getItem('user_phone');
      if (phoneNumber && isProcessed) {
        await saveToFirebase(phoneNumber, aadharData, fileUrl);
      }
      
      // Navigate to next screen
      router.push('/(gowealthy)/mf/onboarding/screen3');
    } catch (error) {
      console.error('Error continuing:', error);
      Alert.alert('Error', 'Failed to save data');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5, 6].map((step, idx) => (
          <View key={step} style={styles.progressStepContainer}>
            <View style={[
              styles.progressCircle,
              step === 1 && styles.progressCircleCompleted,
              step === 2 && styles.progressCircleActive
            ]}>
              <Text style={[
                styles.progressText,
                (step === 1 || step === 2) && styles.progressTextActive
              ]}>{step === 1 ? '✓' : step}</Text>
            </View>
            {idx < 5 && <View style={styles.progressLine} />}
          </View>
        ))}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionTitle}>Upload your Aadhaar Card</Text>
        <Text style={styles.questionSubtitle}>
          Upload a clear image of your Aadhaar card for automatic data extraction
        </Text>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.formContainer}>
          <View style={styles.imageUploadSection}>
            {!aadharImage ? (
              <TouchableOpacity 
                style={styles.imageUploadArea}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <View style={styles.uploadIconContainer}>
                  <Text style={styles.uploadIcon}>📤</Text>
                </View>
                <Text style={styles.uploadTitle}>Upload Aadhaar Card Image</Text>
                <Text style={styles.uploadSubtitle}>
                  Click to select your Aadhaar card image
                </Text>
                <View style={styles.uploadBrowseBtn}>
                  <Text style={styles.uploadBrowseBtnText}>Browse Files</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: aadharImage }} 
                  style={styles.uploadedImagePreview}
                  resizeMode="contain"
                />
                <View style={styles.imageActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setAadharImage(null);
                      setIsProcessed(false);
                      setAadharData({ number: '', name: '', address: '', dob: '' });
                      setFileUrl(null);
                      setUploadProgress(0);
                    }}
                    style={styles.removeImageBtn}
                  >
                    <Text style={styles.removeImageBtnText}>✕ Remove</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={styles.changeImageBtn}
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
                  {isUploading ? 'Uploading to Cloud...' : 'Extracting Data...'}
                </Text>
                <Text style={styles.progressPercent}>{uploadProgress}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
              </View>
            </View>
          )}

          {aadharImage && !isProcessed && !isUploading && !isProcessing && (
            <View style={styles.processSection}>
              <TouchableOpacity
                onPress={handleProcessAadhar}
                style={styles.processButton}
              >
                <Text style={styles.processButtonText}>→ Extract Details</Text>
              </TouchableOpacity>
            </View>
          )}

          {isProcessed && (
            <View style={styles.extractedDataSection}>
              <View style={styles.extractedHeader}>
                <Text style={styles.extractedHeaderTitle}>Extracted Information</Text>
                <TouchableOpacity
                  onPress={() => setIsEditing(!isEditing)}
                  style={styles.editToggleBtn}
                >
                  <Text style={styles.editToggleBtnText}>
                    {isEditing ? '👁️ View Mode' : '✏️ Edit Details'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Aadhaar Number</Text>
                  <TextInput
                    value={aadharData.number}
                    onChangeText={(value) => handleInputChange('number', value)}
                    editable={isEditing}
                    style={[styles.formInput, !isEditing && styles.formInputDisabled]}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date of Birth</Text>
                  <TextInput
                    value={aadharData.dob}
                    onChangeText={(value) => handleInputChange('dob', value)}
                    editable={isEditing}
                    style={[styles.formInput, !isEditing && styles.formInputDisabled]}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  value={aadharData.name}
                  onChangeText={(value) => handleInputChange('name', value.toUpperCase())}
                  editable={isEditing}
                  style={[styles.formInput, !isEditing && styles.formInputDisabled]}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  value={aadharData.address}
                  onChangeText={(value) => handleInputChange('address', value)}
                  editable={isEditing}
                  style={[styles.formTextarea, !isEditing && styles.formInputDisabled]}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
                <Text style={styles.verifiedText}>Data extracted and saved to cloud</Text>
              </View>
            </View>
          )}

          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Text style={styles.infoIcon}>🛡️</Text>
              <Text style={styles.infoCardHeaderText}>Privacy Protected</Text>
            </View>
            <Text style={styles.infoText}>
              Your Aadhaar details are processed securely using Google Cloud and stored encrypted in our database.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonSection}>
        {isProcessed ? (
          <TouchableOpacity
            onPress={handleContinue}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>→ Continue to KYC</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleProcessAadhar}
            disabled={!aadharImage || isUploading || isProcessing}
            style={[styles.continueButton, (!aadharImage || isUploading || isProcessing) && styles.continueButtonDisabled]}
          >
            <Text style={styles.continueButtonText}>
              {isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : '→ Process Aadhaar Card'}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          onPress={() => router.push('/(gowealthy)/mf/onboarding/screen3')}
          style={styles.nextDevButton}
        >
          <Text style={styles.nextDevButtonText}>Skip (Dev) →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 20, paddingTop: 60 },
  backButton: { padding: 8 },
  backButtonText: { color: '#fff', fontSize: 16 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, paddingHorizontal: 20 },
  progressStepContainer: { flexDirection: 'row', alignItems: 'center' },
  progressCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  progressCircleActive: { backgroundColor: '#6b50c4', borderColor: '#6b50c4', shadowColor: '#6b50c4', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  progressCircleCompleted: { backgroundColor: '#10b981', borderColor: '#10b981' },
  progressText: { fontSize: 14, fontWeight: '600', color: '#666' },
  progressTextActive: { color: '#fff' },
  progressLine: { width: 24, height: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginHorizontal: 4 },
  questionSection: { alignItems: 'center', marginBottom: 32, paddingHorizontal: 20 },
  questionTitle: { fontSize: 28, fontWeight: '600', color: '#fff', marginBottom: 12, textAlign: 'center' },
  questionSubtitle: { fontSize: 16, color: '#999', lineHeight: 24, maxWidth: 600, textAlign: 'center' },
  contentSection: { marginBottom: 32 },
  formContainer: { paddingHorizontal: 20, maxWidth: 600, width: '100%', alignSelf: 'center' },
  imageUploadSection: { marginBottom: 24 },
  imageUploadArea: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.1)', borderStyle: 'dashed', borderRadius: 16, padding: 40, alignItems: 'center' },
  uploadIconContainer: { width: 64, height: 64, backgroundColor: 'rgba(107, 80, 196, 0.1)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  uploadIcon: { fontSize: 32 },
  uploadTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  uploadSubtitle: { fontSize: 14, color: '#999', marginBottom: 16, textAlign: 'center' },
  uploadBrowseBtn: { backgroundColor: '#6b50c4', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  uploadBrowseBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  imagePreviewContainer: { alignItems: 'center' },
  uploadedImagePreview: { width: '100%', height: 250, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 16 },
  imageActions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  removeImageBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1.5, borderColor: 'rgba(239, 68, 68, 0.3)', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  removeImageBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '500' },
  changeImageBtn: { backgroundColor: 'rgba(107, 80, 196, 0.1)', borderWidth: 1.5, borderColor: 'rgba(107, 80, 196, 0.3)', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  changeImageBtnText: { color: '#6b50c4', fontSize: 14, fontWeight: '500' },
  progressSection: { marginVertical: 24 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 14, fontWeight: '500', color: '#fff' },
  progressPercent: { fontSize: 14, fontWeight: '600', color: '#6b50c4' },
  progressBarContainer: { width: '100%', height: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#6b50c4', borderRadius: 4 },
  processSection: { alignItems: 'center', marginVertical: 24 },
  processButton: { backgroundColor: '#6b50c4', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10 },
  processButtonText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  extractedDataSection: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16, padding: 24, marginBottom: 24 },
  extractedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  extractedHeaderTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  editToggleBtn: { backgroundColor: 'rgba(107, 80, 196, 0.1)', borderWidth: 1, borderColor: 'rgba(107, 80, 196, 0.3)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  editToggleBtnText: { color: '#6b50c4', fontSize: 14, fontWeight: '500' },
  formRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  inputGroup: { flex: 1, marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 8 },
  formInput: { padding: 14, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, color: '#fff', fontSize: 15 },
  formTextarea: { padding: 14, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, color: '#fff', fontSize: 15, height: 80, textAlignVertical: 'top' },
  formInputDisabled: { backgroundColor: 'rgba(100, 100, 100, 0.05)', opacity: 0.8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1.5, borderColor: 'rgba(16, 185, 129, 0.3)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginTop: 8 },
  verifiedIcon: { fontSize: 20, color: '#10b981', marginRight: 8 },
  verifiedText: { fontSize: 14, fontWeight: '600', color: '#10b981' },
  infoCard: { backgroundColor: 'rgba(107, 80, 196, 0.1)', borderWidth: 1.5, borderColor: 'rgba(107, 80, 196, 0.3)', borderRadius: 12, padding: 16 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoIcon: { fontSize: 20 },
  infoCardHeaderText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  infoText: { fontSize: 14, color: '#ccc', lineHeight: 20 },
  buttonSection: { padding: 20, gap: 12, marginBottom: 40 },
  continueButton: { backgroundColor: '#6b50c4', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: '#444', opacity: 0.6 },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  nextDevButton: { backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', opacity: 0.8 },
  nextDevButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});

export default Screen2AadhaarBackend;