import { Image } from 'expo-image';
import { View } from 'react-native';

import { images } from '@/constants/images';
import { cn } from '@/lib/cn';

import { Text } from './text';

type LogoProps = {
  tone?: 'default' | 'inverted';
  compact?: boolean;
  className?: string;
};

export function Logo({ tone = 'default', compact = false, className }: LogoProps) {
  const isInverted = tone === 'inverted';
  const markSize = compact ? 34 : 92;
  const wordSize = compact ? 'text-[26px]' : 'text-[46px]';
  const taglineSize = compact ? 'text-[10px]' : 'text-[13px]';

  return (
    <View
      className={cn(
        compact ? 'flex-row items-center gap-2' : 'items-center',
        className
      )}>
      <Image
        source={isInverted ? images.markWhite : images.markNavy}
        style={{ width: markSize, height: markSize * 0.87 }}
        contentFit="contain"
      />
      <View className={compact ? 'items-start' : 'items-center'}>
        <Text
          weight="extrabold"
          className={cn(
            wordSize,
            'tracking-[-1.5px]',
            compact ? 'leading-7' : 'leading-[52px]',
            isInverted ? 'text-white' : 'text-navy'
          )}>
          Alert
          <Text weight="extrabold" className={cn(wordSize, 'tracking-[-1.5px] text-yellow')}>
            U
          </Text>
        </Text>
        {!compact ? (
          <Text
            weight="medium"
            className={cn(
              taglineSize,
              '-mt-1 tracking-[0.2px]',
              isInverted ? 'text-white/80' : 'text-muted'
            )}>
            Stay aware, stay ahead.
          </Text>
        ) : null}
      </View>
    </View>
  );
}
