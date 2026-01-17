// import { Redirect } from 'expo-router';
// import { View, ActivityIndicator } from 'react-native';

// export default function Index() {
//   // Add auth check here later
//   const isAuthenticated = false; // Replace with actual auth check
  
//   if (isAuthenticated) {
//     return <Redirect href="/(gowealthy)/(tabs)" />;
//   }
  
//   return <Redirect href="/(auth)/login" />;
// }

import { Redirect } from 'expo-router';

export default function Index() {
  // For now, directly go to screen1 for testing
  return <Redirect href="/(gowealthy)/questionnaire/section1/screen1" />;
}
