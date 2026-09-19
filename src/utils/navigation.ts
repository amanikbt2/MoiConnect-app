import { useRouter } from 'expo-router';

export function useAppNavigation() {
  const router = useRouter();
  return router;
}
