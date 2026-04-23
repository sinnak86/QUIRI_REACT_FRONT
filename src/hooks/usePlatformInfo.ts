import { Platform, useWindowDimensions } from 'react-native';

export type PlatformName = 'Mobile' | 'Tablet' | 'Web Browser';

export type PlatformInfo = {
  platformName: PlatformName;
  isWeb: boolean;
  isMobile: boolean;
  isTablet: boolean;
  width: number;
  height: number;
};

export function usePlatformInfo(): PlatformInfo {
  const { width, height } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';

  let platformName: PlatformName;
  if (isWeb) {
    platformName = width >= 1024 ? 'Web Browser' : width >= 600 ? 'Tablet' : 'Mobile';
  } else {
    platformName = width >= 600 ? 'Tablet' : 'Mobile';
  }

  return {
    platformName,
    isWeb,
    isMobile: platformName === 'Mobile',
    isTablet: platformName === 'Tablet',
    width,
    height,
  };
}
