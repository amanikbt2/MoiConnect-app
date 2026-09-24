import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Platform
} from 'react-native';

interface BrandLoaderProps {
  message?: string;
  size?: number;
}

export const BrandLoader: React.FC<BrandLoaderProps> = ({
  message = 'Loading...',
  size = 72
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    const spinAnim = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web'
      })
    );

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.08,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web'
        }),
        Animated.timing(pulseValue, {
          toValue: 0.92,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web'
        })
      ])
    );

    spinAnim.start();
    pulseAnim.start();

    return () => {
      spinAnim.stop();
      pulseAnim.stop();
    };
  }, [spinValue, pulseValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const logoSize = size * 0.58;
  const ringSize = size;

  return (
    <View style={styles.container}>
      <View style={[styles.spinnerWrapper, { width: ringSize, height: ringSize }]}>
        {/* Outer Rotating Emerald Ring */}
        <Animated.View
          style={[
            styles.spinRing,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              transform: [{ rotate: spin }]
            }
          ]}
        />

        {/* Inner Pulsing Brand Logo */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              width: logoSize,
              height: logoSize,
              borderRadius: logoSize / 3,
              transform: [{ scale: pulseValue }]
            }
          ]}
        >
          <Image
            source={require('../../assets/favicon.png')}
            style={{ width: logoSize, height: logoSize, borderRadius: logoSize / 3 }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {message ? <Text style={styles.messageText}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 16
  },
  spinnerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  spinRing: {
    position: 'absolute',
    borderWidth: 3.5,
    borderColor: 'rgba(21, 128, 61, 0.15)',
    borderTopColor: '#15803d',
    borderRightColor: '#22c55e'
  },
  logoWrapper: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    overflow: 'hidden'
  },
  messageText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center'
  }
});
