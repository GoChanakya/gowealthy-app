// import { ErrorUtils, Alert } from 'react-native';

// Alert.alert('1. JS Entry Loaded');

// if (typeof ErrorUtils !== 'undefined') {
//   ErrorUtils.setGlobalHandler((error, isFatal) => {
//     setTimeout(() => {
//       Alert.alert(
//         'Global Error!',
//         `Fatal: ${isFatal}\n${error?.message}\n${(error?.stack || '').substring(0, 300)}`,
//         [{ text: 'OK' }]
//       );
//     }, 500);
//   });
// }

// try {
//   Alert.alert('2. About to load expo-router');
//   require('expo-router/entry');
//   Alert.alert('3. expo-router loaded');
// } catch(e) {
//   Alert.alert('Require Error!', e?.message + '\n' + (e?.stack || '').substring(0, 300));
// }

import { ErrorUtils, Alert } from 'react-native';

Alert.alert('App Started', 'JS is loading...');

ErrorUtils.setGlobalHandler((error, isFatal) => {
  setTimeout(() => {
    Alert.alert(
      'Global Error!',
      `${error?.message}\n${(error?.stack||'').substring(0,300)}`,
      [{ text: 'OK' }]
    );
  }, 500);
});

require('expo-router/entry');