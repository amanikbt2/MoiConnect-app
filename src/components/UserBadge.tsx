import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';

export type UserBadgeKind = 'blue' | 'red' | 'green';

export function UserBadge({ badge, size = 15 }: { badge?: UserBadgeKind; size?: number }) {
  if (!badge) return null;
  const colors: Record<UserBadgeKind, string> = {
    blue: '#2563eb',
    red: '#dc2626',
    green: '#16a34a'
  };
  const color = colors[badge];
  return (
    <View style={[styles.badge, { width: size * 1.12, height: size * 1.12 }]} accessibilityLabel={`${badge} profile badge`}>
      <Svg width={size * 1.12} height={size * 1.12} viewBox="0 0 100 100">
        <Polygon
          fill={color}
          points="50,3 57,12 67,7 71,18 83,16 83,28 95,31 89,41 98,49 89,57 95,68 83,72 83,84 71,82 67,94 57,89 50,98 43,89 33,94 29,82 17,84 17,72 5,68 11,57 2,49 11,41 5,31 17,28 17,16 29,18 33,7 43,12"
        />
        <Path
          d="M27 51 L43 67 L74 34"
          fill="none"
          stroke="#ffffff"
          strokeWidth="10"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4
  }
});
