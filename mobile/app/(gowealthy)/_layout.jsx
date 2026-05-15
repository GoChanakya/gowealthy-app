  import { Stack } from 'expo-router';

  export default function GoWealthyLayout() {
    return (
      <Stack screenOptions={{ headerShown: false , animation: 'slide_from_right',}}>
        <Stack.Screen name="home" />
        <Stack.Screen name="questionnaire" />
      </Stack>
    );
  }