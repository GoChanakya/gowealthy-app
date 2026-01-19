import React, { useRef } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';

const ScreenScrollView = ({ children, contentContainerStyle, ...props }) => {
  const scrollViewRef = useRef(null);

  // Reset scroll whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Scroll to top when screen is focused
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={contentContainerStyle || { flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </ScrollView>
  );
};

export default ScreenScrollView;