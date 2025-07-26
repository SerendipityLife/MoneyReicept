export interface UserSettings {
  id: string;
  userId?: string;
  exchangeRateSettings: ExchangeRateSettings;
  translationSettings: TranslationSettings;
  notificationSettings: NotificationSettings;
  backupSettings: BackupSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeRateSettings {
  useManualRate: boolean;
  manualRate?: number;
  autoUpdateEnabled: boolean;
  lastUpdated?: Date;
}

export interface TranslationSettings {
  sourceLanguage: string;
  targetLanguage: string;
  autoTranslateEnabled: boolean;
  translationProvider: 'google' | 'manual';
}

export interface NotificationSettings {
  receiptProcessingNotifications: boolean;
  budgetAlerts: boolean;
  exchangeRateUpdates: boolean;
  weeklyReports: boolean;
  pushNotificationsEnabled: boolean;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  includeImages: boolean;
  lastBackupDate?: Date;
}

export interface BackupData {
  receipts: any[];
  receiptItems: any[];
  productImages: any[];
  travelPlans: any[];
  products: any[];
  settings: UserSettings;
  exportDate: Date;
  version: string;
}

export interface SettingsUpdateRequest {
  exchangeRateSettings?: Partial<ExchangeRateSettings>;
  translationSettings?: Partial<TranslationSettings>;
  notificationSettings?: Partial<NotificationSettings>;
  backupSettings?: Partial<BackupSettings>;
}

export const LANGUAGE_OPTIONS = [
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

export const BACKUP_FREQUENCY_OPTIONS = [
  { value: 'daily', label: '매일' },
  { value: 'weekly', label: '매주' },
  { value: 'monthly', label: '매월' }
];