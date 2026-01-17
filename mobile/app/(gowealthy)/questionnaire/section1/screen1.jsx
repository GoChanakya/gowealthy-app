// import React, { useState } from 'react';
// import { 
//   View, 
//   Text, 
//   TextInput, 
//   TouchableOpacity, 
//   Image,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   StatusBar
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';

// // Import global styles
// import { 
//   colors, 
//   globalStyles, 
//   section1Styles,
//   isMobile 
// } from '../../../../src/theme/globalStyles';

// const Screen1 = () => {
//   const router = useRouter();
//   const [age, setAge] = useState('');
//   const [gender, setGender] = useState('');

//   const viewport = { isMobile };
//   const progressData = {
//     sectionData: {
//       1: { isActive: true, progress: 0, isCompleted: false },
//       2: { isActive: false, progress: 0, isCompleted: false },
//       3: { isActive: false, progress: 0, isCompleted: false },
//       4: { isActive: false, progress: 0, isCompleted: false },
//       5: { isActive: false, progress: 0, isCompleted: false },
//       6: { isActive: false, progress: 0, isCompleted: false },
//     }
//   };

//   const sections = [
//     { title: "Start" },
//     { title: "Basic Information" },
//     { title: "Income & Expenses" },
//     { title: "Insurance" },
//     { title: "Goal" },
//     { title: "Psychology" }
//   ];

//   const genderOptions = [
//     {
//       label: "Male",
//       value: "male",
//       image: require('../../../../assets/images/page_images/male.png')
//     },
//     {
//       label: "Female",
//       value: "female",
//       image: require('../../../../assets/images/page_images/female.png')
//     }
//   ];

//   const handleNumberInput = (value) => {
//     if (value === '' || value === null || value === undefined) {
//       setAge('');
//       return;
//     }

//     const numValue = parseInt(value);
//     if (!isNaN(numValue) && numValue >= 18 && numValue <= 100) {
//       setAge(numValue);
//     } else if (!isNaN(numValue)) {
//       setAge(numValue);
//     }
//   };

//   const handleGenderSelect = (genderValue) => {
//     setGender(genderValue);
//   };

//   const handleContinue = () => {
//     if (age && gender && age >= 18 && age <= 100) {
//       console.log('Navigating to screen2 with:', { age, gender });
//       // router.push('/(gowealthy)/questionnaire/section1/screen2');
//     }
//   };

//   const handleBack = () => {
//     router.back();
//   };

//   const isButtonActive = age && gender && age >= 18 && age <= 100;

//   return (
//     <>
//       <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />
      
//       {/* Black Background */}
//       <View style={globalStyles.backgroundContainer}>
//         <KeyboardAvoidingView 
//           style={{ flex: 1 }}
//           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         >
//           <ScrollView 
//             contentContainerStyle={{ flexGrow: 1 }}
//             keyboardShouldPersistTaps="handled"
//             showsVerticalScrollIndicator={false}
//           >
//             {/* App Container */}
//             <View style={globalStyles.appContainer}>
//               {/* Header */}
//               <View style={globalStyles.header}>
//                 <TouchableOpacity style={globalStyles.backButton} onPress={handleBack}>
//                   <Text style={globalStyles.backButtonText}>Back</Text>
//                 </TouchableOpacity>
//                 <View style={globalStyles.logo}>
//                   <Text style={globalStyles.sectionTitle}>
//                     Let's start with some basic details
//                   </Text>
//                 </View>
//               </View>

//               {/* Progress Container */}
//               <View style={globalStyles.progressContainer}>
//                 {sections.map((section, index) => (
//                   <View key={index} style={globalStyles.progressStepContainer}>
//                     <View
//                       style={[
//                         globalStyles.progressStep,
//                         progressData?.sectionData?.[index + 1]?.isCompleted && globalStyles.progressStepCompleted,
//                         progressData?.sectionData?.[index + 1]?.isActive && globalStyles.progressStepActive,
//                       ]}
//                     />
//                     {index < sections.length - 1 && (
//                       <View
//                         style={[
//                           globalStyles.progressLine,
//                           progressData?.sectionData?.[index + 1]?.isCompleted && globalStyles.progressLineCompleted,
//                         ]}
//                       />
//                     )}
//                   </View>
//                 ))}
//               </View>

//               {/* Question Container */}
//               <View style={globalStyles.questionContainer}>
//                 <Text style={globalStyles.questionText}>About yourself</Text>

//                 <View style={section1Styles.combinedInputContainer}>
//                   {/* Age Input Section */}
//                   <View style={section1Styles.ageInputSection}>
//                     <Text style={globalStyles.inputLabel}>Your Age</Text>
//                     <View style={section1Styles.numberInputContainer}>
//                       <TextInput
//                         style={section1Styles.numberInput}
//                         placeholder="Enter your age"
//                         placeholderTextColor={colors.subtitleColor}
//                         keyboardType="numeric"
//                         value={age ? age.toString() : ''}
//                         onChangeText={(value) => {
//                           if (value === '' || /^\d+$/.test(value)) {
//                             handleNumberInput(value);
//                           }
//                         }}
//                         maxLength={3}
//                         autoComplete="off"
//                         autoCapitalize="none"
//                         autoCorrect={false}
//                       />
//                     </View>
//                     {age && (age < 18 || age > 100) && (
//                       <Text style={globalStyles.errorText}>
//                         Age must be between 18 and 100
//                       </Text>
//                     )}
//                   </View>

//                   {/* Gender Section */}
//                   <View style={section1Styles.genderSection}>
//                     <Text style={globalStyles.inputLabel}>Your Gender</Text>
//                     <View style={section1Styles.genderOptionsContainer}>
//                       {genderOptions.map((option) => (
//                         <TouchableOpacity
//                           key={option.value}
//                           style={[
//                             section1Styles.genderOption,
//                             gender === option.value && section1Styles.selectedGender
//                           ]}
//                           onPress={() => handleGenderSelect(option.value)}
//                           activeOpacity={0.7}
//                         >
//                           <Image
//                             source={option.image}
//                             style={section1Styles.genderImage}
//                             resizeMode="contain"
//                           />
//                           <Text style={section1Styles.genderLabel}>{option.label}</Text>
//                         </TouchableOpacity>
//                       ))}
//                     </View>
//                   </View>

//                   {/* Continue Button */}
//                   <View style={[
//                     globalStyles.confirmButton,
//                     !isButtonActive && globalStyles.confirmButtonDisabled
//                   ]}>
//                     {isButtonActive ? (
//                       <LinearGradient
//                         colors={[colors.gradientPurple1, colors.gradientPurple2]}
//                         start={{ x: 0, y: 0 }}
//                         end={{ x: 1, y: 0 }}
//                         style={{ paddingVertical: 18, paddingHorizontal: 24, borderRadius: 16 }}
//                       >
//                         <TouchableOpacity
//                           onPress={handleContinue}
//                           activeOpacity={0.8}
//                           style={{ alignItems: 'center' }}
//                         >
//                           <Text style={globalStyles.confirmButtonText}>Continue</Text>
//                         </TouchableOpacity>
//                       </LinearGradient>
//                     ) : (
//                       <View style={{ paddingVertical: 18, paddingHorizontal: 24 }}>
//                         <Text style={[globalStyles.confirmButtonText, { color: colors.subtitleColor }]}>
//                           Continue
//                         </Text>
//                       </View>
//                     )}
//                   </View>
//                 </View>
//               </View>
//             </View>
//           </ScrollView>
//         </KeyboardAvoidingView>
//       </View>
//     </>
//   );
// };

// export default Screen1;


import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Import global styles
import { 
  colors, 
  globalStyles, 
  section1Styles,
  isMobile 
} from '../../../../src/theme/globalStyles';

const Screen1 = () => {
  const router = useRouter();
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  const viewport = { isMobile };
  const progressData = {
    sectionData: {
      1: { isActive: true, progress: 0, isCompleted: false },
      2: { isActive: false, progress: 0, isCompleted: false },
      3: { isActive: false, progress: 0, isCompleted: false },
      4: { isActive: false, progress: 0, isCompleted: false },
      5: { isActive: false, progress: 0, isCompleted: false },
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

  const genderOptions = [
    {
      label: "Male",
      value: "male",
      image: require('../../../../assets/images/page_images/male.png')
    },
    {
      label: "Female",
      value: "female",
      image: require('../../../../assets/images/page_images/female.png')
    }
  ];

  const handleNumberInput = (value) => {
    if (value === '' || value === null || value === undefined) {
      setAge('');
      return;
    }

    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 18 && numValue <= 100) {
      setAge(numValue);
    } else if (!isNaN(numValue)) {
      setAge(numValue);
    }
  };

  const handleGenderSelect = (genderValue) => {
    setGender(genderValue);
  };

  const handleContinue = () => {
    if (age && gender && age >= 18 && age <= 100) {
      console.log('Navigating to screen2 with:', { age, gender });
      // router.push('/(gowealthy)/questionnaire/section1/screen2');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isButtonActive = age && gender && age >= 18 && age <= 100;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />
      
      {/* Black Background */}
      <View style={globalStyles.backgroundContainer}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* App Container */}
            <View style={globalStyles.appContainer}>
              {/* Header */}
              <View style={globalStyles.header}>
                <TouchableOpacity style={globalStyles.backButton} onPress={handleBack}>
                  <Text style={globalStyles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <View style={globalStyles.logo}>
                  <Text style={globalStyles.sectionTitle}>
                    Let's start with some basic details
                  </Text>
                </View>
              </View>

              {/* Progress Container */}
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

              {/* Question Container - Centered */}
              <View style={globalStyles.questionContainer}>
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={globalStyles.questionText}>About yourself</Text>

                  <View style={section1Styles.combinedInputContainer}>
                    {/* Age Input Section */}
                    <View style={section1Styles.ageInputSection}>
                      <Text style={globalStyles.inputLabel}>Your Age</Text>
                      <View style={section1Styles.numberInputContainer}>
                        <TextInput
                          style={section1Styles.numberInput}
                          placeholder="Enter your age"
                          placeholderTextColor={colors.subtitleColor}
                          keyboardType="numeric"
                          value={age ? age.toString() : ''}
                          onChangeText={(value) => {
                            if (value === '' || /^\d+$/.test(value)) {
                              handleNumberInput(value);
                            }
                          }}
                          maxLength={3}
                          autoComplete="off"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                      {age && (age < 18 || age > 100) && (
                        <Text style={globalStyles.errorText}>
                          Age must be between 18 and 100
                        </Text>
                      )}
                    </View>

                    {/* Gender Section */}
                    <View style={section1Styles.genderSection}>
                      <Text style={globalStyles.inputLabel}>Your Gender</Text>
                      <View style={section1Styles.genderOptionsContainer}>
                        {genderOptions.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              section1Styles.genderOption,
                              gender === option.value && section1Styles.selectedGender
                            ]}
                            onPress={() => handleGenderSelect(option.value)}
                            activeOpacity={0.7}
                          >
                            <Image
                              source={option.image}
                              style={section1Styles.genderImage}
                              resizeMode="contain"
                            />
                            <Text style={section1Styles.genderLabel}>{option.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Continue Button */}
                    <View style={[
                      globalStyles.confirmButton,
                      !isButtonActive && globalStyles.confirmButtonDisabled
                    ]}>
                      {isButtonActive ? (
                        <TouchableOpacity
                          onPress={handleContinue}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={[colors.gradientPurple1, colors.gradientPurple2]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={globalStyles.buttonInner}
                          >
                            <Text style={globalStyles.confirmButtonText}>Continue</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ) : (
                        <View style={globalStyles.buttonInner}>
                          <Text style={[globalStyles.confirmButtonText, { color: colors.subtitleColor }]}>
                            Continue
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

export default Screen1;