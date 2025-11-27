export interface Quote {
  id: string;
  text: string;
  author: string | null;
}

export type ThemeOption = 'light' | 'dark' | 'auto' | 'sepia' | 'ocean' | 'forest' | 'rose';
export type FontSizeOption = 'sm' | 'md' | 'lg' | 'xl';

export interface AppSettings {
  interval: number; // milliseconds
  fontSize: FontSizeOption;
  theme: ThemeOption;
  showAuthor: boolean;
  isCustomSource: boolean;
  containerWidth: number; // percentage 30-100
  containerHeight: number; // percentage 10-100
}

export const DEFAULT_SETTINGS: AppSettings = {
  interval: 60000, // 1 minute
  fontSize: 'md',
  theme: 'auto',
  showAuthor: true,
  isCustomSource: false,
  containerWidth: 90,
  containerHeight: 40,
};