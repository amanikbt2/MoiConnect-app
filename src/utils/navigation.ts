import { useNavigation } from '@react-navigation/native';

export function useAppNavigation() {
  const navigation = useNavigation<any>();

  const resolveTarget = (target: string, params?: any) => {
    if (!target) return { screen: 'MainTabs' };

    // Dynamic path parsing
    if (target.startsWith('/paper/')) {
      const id = target.replace('/paper/', '').split('?')[0];
      return { screen: 'PaperDetail', params: { id, ...params } };
    }
    if (target.startsWith('/house/')) {
      const id = target.replace('/house/', '').split('?')[0];
      return { screen: 'HouseDetail', params: { id, ...params } };
    }
    if (target.startsWith('/chat/')) {
      const id = target.replace('/chat/', '').split('?')[0];
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
        return { screen: 'Profile', params };
      case '/community':
      case 'Community':
        return { screen: 'Community', params };
      case '/privacy':
      case 'Privacy':
        return { screen: 'Privacy', params };
      case '/notes':
      case 'Notes':
        return { screen: 'Notes', params };
      case '/past-papers':
      case 'PastPapers':
        return { screen: 'PastPapers', params };
      case '/cat-papers':
      case 'CatPapers':
        return { screen: 'CatPapers', params };
      case '/':
      case '/(tabs)':
      case '/(tabs)/index':
      case 'Home':
        return { screen: 'MainTabs', params: { screen: 'HomeTab', ...params } };
      default:
        return { screen: target, params };
    }
  };

  const parseRoute = (target: string, params?: any) => {
    // Strip query string and parse into params before resolving
    if (target.includes('?')) {
      const [basePath, queryString] = target.split('?');
      const queryParams: Record<string, string> = {};
      queryString.split('&').forEach((pair) => {
        const [key, val] = pair.split('=');
        if (key) queryParams[decodeURIComponent(key)] = decodeURIComponent(val || '');
      });
      return resolveTarget(basePath, { ...queryParams, ...params });
    }
    return resolveTarget(target, params);
  };

  return {
    push: (target: string, params?: any) => {
      const resolved = parseRoute(target, params);
      if (navigation && navigation.navigate) {
        navigation.navigate(resolved.screen, resolved.params);
      }
    },
    navigate: (target: string, params?: any) => {
      const resolved = parseRoute(target, params);
      if (navigation && navigation.navigate) {
        navigation.navigate(resolved.screen, resolved.params);
      }
    },
    replace: (target: string, params?: any) => {
      const resolved = parseRoute(target, params);
      if (navigation && navigation.replace) {
        navigation.replace(resolved.screen, resolved.params);
      } else if (navigation && navigation.navigate) {
        navigation.navigate(resolved.screen, resolved.params);
      }
    },
    canGoBack: () => {
      return navigation && navigation.canGoBack ? navigation.canGoBack() : false;
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
