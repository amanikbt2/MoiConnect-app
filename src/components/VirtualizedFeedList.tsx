import React, { useMemo } from 'react';
import { FlatList, FlatListProps, RefreshControlProps } from 'react-native';

type VirtualizedFeedListProps = {
  children: React.ReactNode;
  style?: FlatListProps<React.ReactNode>['style'];
  contentContainerStyle?: FlatListProps<React.ReactNode>['contentContainerStyle'];
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: FlatListProps<React.ReactNode>['keyboardShouldPersistTaps'];
  onScrollBeginDrag?: FlatListProps<React.ReactNode>['onScrollBeginDrag'];
  onScroll?: FlatListProps<React.ReactNode>['onScroll'];
  scrollEventThrottle?: number;
  refreshControl?: React.ReactElement<RefreshControlProps>;
};

function flattenFeedRows(children: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === React.Fragment) {
      return flattenFeedRows(child.props.children);
    }
    return [child];
  });
}

/** Virtualizes feed sections so off-screen cards and their images stay unmounted. */
export function VirtualizedFeedList({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  onScrollBeginDrag,
  onScroll,
  scrollEventThrottle = 32,
  refreshControl
}: VirtualizedFeedListProps) {
  const rows = useMemo(() => flattenFeedRows(children), [children]);

  return (
    <FlatList
      data={rows}
      // React.Children.toArray assigns fragment-relative keys that can collide
      // after fragments are flattened, so use the final row position here.
      keyExtractor={(_, index) => `feed-row-${index}`}
      renderItem={({ item }) => <>{item}</>}
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      onScrollBeginDrag={onScrollBeginDrag}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      refreshControl={refreshControl}
      initialNumToRender={6}
      maxToRenderPerBatch={4}
      windowSize={5}
      updateCellsBatchingPeriod={40}
      nestedScrollEnabled
    />
  );
}
