import { useNavigation } from '@react-navigation/native';

export function useAppNavigation() {
  const navigation = useNavigation<any>();

  const resolveTarget = (target: string, params?: any) => {
    if (!target) return { screen: 'MainTabs' };

    // Dynamic path parsing
    if (target.startsWith('/paper/')) {
      const id = target.replace('/paper/', '');
      return { screen: 'PaperDetail', params: { id, ...params } };
    }
    if (target.startsWith('/house/')) {
      const id = target.replace('/house/', '');
      return { screen: 'HouseDetail', params: { id, ...params } };
    }
    if (target.startsWith('/chat/')) {
      const id = target.replace('/chat/', '');
      return { screen: 'ChatRoom', params: { id, ...params } };
    }

    switch (target) {
      case '/(auth)/login':
      case '/login':
      case 'Login':
        return { screen: 'Login', params };
      case '/(auth)/register':
      case '/register':
      case 'Register':
        return { screen: 'Register', params };
      case '/(auth)/request-landlord':
      case '/request-landlord':
      case 'RequestLandlord':
        return { screen: 'RequestLandlord', params };
      case '/(tabs)/academics':
      case '/academics':
      case 'Academics':
        return { screen: 'Academics', params };
      case '/(tabs)/rentals':
      case '/rentals':
      case 'Rentals':
        return { screen: 'Rentals', params };
      case '/(tabs)/downloads':
      case '/downloads':
      case 'Downloads':
        return { screen: 'MainTabs', params: { screen: 'DownloadsTab', ...params } };
      case '/(tabs)/messages':
      case '/messages':
      case 'Messages':
        return { screen: 'MainTabs', params: { screen: 'MessagesTab', ...params } };
      case '/(tabs)/profile':
      case '/profile':
      case 'Profile':
        return { screen: 'MainTabs', params: { screen: 'ProfileTab', ...params } };
      case '/community':
      case 'Community':
        return { screen: 'Community', params };
      case '/privacy':
      case 'Privacy':
        return { screen: 'Privacy', params };
      case '/':
      case '/(tabs)':
      case '/(tabs)/index':
      case 'Home':
        return { screen: 'MainTabs', params: { screen: 'HomeTab', ...params } };
      default:
        return { screen: target, params };
    }
  };

  return {
    push: (target: string, params?: any) => {
      const resolved = resolveTarget(target, params);
      if (navigation && navigation.navigate) {
        navigation.navigate(resolved.screen, resolved.params);
      }
    },
    navigate: (target: string, params?: any) => {
      const resolved = resolveTarget(target, params);
      if (navigation && navigation.navigate) {
        navigation.navigate(resolved.screen, resolved.params);
      }
    },
    replace: (target: string, params?: any) => {
      const resolved = resolveTarget(target, params);
      if (navigation && navigation.replace) {
        navigation.replace(resolved.screen, resolved.params);
      } else if (navigation && navigation.navigate) {
        navigation.navigate(resolved.screen, resolved.params);
      }
    },
    back: () => {
      if (navigation && navigation.goBack) {
        navigation.goBack();
      }
    },
    goBack: () => {
      if (navigation && navigation.goBack) {
        navigation.goBack();
      }
    }
  };
}
