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