import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/ui/logo';
import { Text } from '@/components/ui/text';
import { images } from '@/constants/images';
import { useAuth } from '@/context/auth';

export default function SplashScreen() {
  const { user, isInitializing } = useAuth();

  useEffect(() => {
    if (isInitializing) return;

    const timer = setTimeout(() => {
      router.replace(user ? '/home' : '/onboarding');
    }, 2600);
    return () => clearTimeout(timer);
  }, [isInitializing, user]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Enter AlertU"
      onPress={() => router.replace(user ? '/home' : '/onboarding')}
      className="flex-1 bg-navy-950">
      <StatusBar style="light" />
      <Image
        source={images.splashCampus}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={[
          'rgba(4, 17, 33, 0.97)',
          'rgba(5, 21, 40, 0.72)',
          'rgba(5, 20, 38, 0.12)',
          'rgba(4, 17, 33, 0.88)',
          '#061426',
        ]}
        locations={[0, 0.32, 0.58, 0.86, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView className="flex-1 px-8" edges={['top', 'bottom']}>
        <View className="flex-1" />

        <View className="items-center justify-center">
          <Logo tone="inverted" />
        </View>

        <View className="flex-1 items-center justify-end pb-10">
          <View className="mb-7 flex-row items-center gap-2">
            <View className="h-2 w-5 rounded-full bg-white" />
            <View className="h-2 w-2 rounded-full bg-white/35" />
            <View className="h-2 w-2 rounded-full bg-white/35" />
          </View>
          <Text weight="medium" className="text-[11px] tracking-[0.6px] text-white/80">
            Campus Safety <Text className="text-yellow">·</Text> Community{' '}
            <Text className="text-yellow">·</Text> You
          </Text>
        </View>
      </SafeAreaView>
    </Pressable>
  );
}
