import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function Modal() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
      }}
    >
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        This is a Modal
      </Text>

      <Pressable onPress={() => router.back()}>
        <Text style={{ color: 'blue' }}>Close</Text>
      </Pressable>
    </View>
  );
}
