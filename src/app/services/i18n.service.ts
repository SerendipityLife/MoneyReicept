import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  rtl?: boolean;
}

export interface TranslationKeys {
  [key: string]: string | TranslationKeys;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLanguageSubject = new BehaviorSubject<string>('ko');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  private translations: { [lang: string]: TranslationKeys } = {};
  
  public readonly supportedLanguages: LanguageOption[] = [
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  constructor() {
    this.loadTranslations();
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    // Check for saved language preference
    const savedLanguage = localStorage.getItem('app-language');
    if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
      this.setLanguage(savedLanguage);
      return;
    }

    // Detect browser language
    const browserLanguage = navigator.language.split('-')[0];
    if (this.isLanguageSupported(browserLanguage)) {
      this.setLanguage(browserLanguage);
      return;
    }

    // Default to Korean
    this.setLanguage('ko');
  }

  private loadTranslations(): void {
    // Korean translations
    this.translations['ko'] = {
      common: {
        save: '저장',
        cancel: '취소',
        delete: '삭제',
        edit: '편집',
        back: '뒤로',
        loading: '로딩 중...',
        error: '오류',
        success: '성공',
        warning: '경고',
        confirm: '확인',
        yes: '예',
        no: '아니오',
        search: '검색',
        filter: '필터',
        settings: '설정',
        language: '언어',
        offline: '오프라인',
        online: '온라인',
        retry: '다시 시도',
        refresh: '새로고침'
      },
      navigation: {
        home: '홈',
        receipts: '영수증',
        budget: '가계부',
        gallery: '갤러리',
        settings: '설정'
      },
      receipt: {
        title: '영수증',
        upload: '영수증 업로드',
        camera: '카메라로 촬영',
        gallery: '갤러리에서 선택',
        processing: '처리 중...',
        storeName: '매장명',
        date: '날짜',
        total: '총액',
        items: '구매 품목',
        noReceipts: '영수증이 없습니다'
      },
      budget: {
        title: '가계부',
        summary: '지출 요약',
        daily: '일별 지출',
        category: '카테고리별',
        totalSpent: '총 지출',
        averageDaily: '일평균 지출'
      },
      settings: {
        title: '설정',
        language: '언어 설정',
        exchangeRate: '환율 설정',
        translation: '번역 설정',
        notifications: '알림 설정',
        backup: '백업 설정',
        accessibility: '접근성 설정'
      },
      accessibility: {
        title: '접근성 설정',
        fontSize: '글자 크기',
        highContrast: '고대비 모드',
        screenReader: '스크린 리더 지원',
        voiceOver: '음성 안내',
        reducedMotion: '애니메이션 줄이기',
        largeButtons: '큰 버튼 사용',
        textSettings: '텍스트 설정',
        visualSettings: '시각 설정',
        interactionSettings: '상호작용 설정',
        screenReaderSettings: '스크린 리더 설정',
        focusIndicators: '포커스 표시',
        announcements: '음성 안내',
        information: '접근성 정보',
        skipToContent: '본문으로 건너뛰기',
        highContrastDescription: '화면의 대비를 높여 가독성을 향상시킵니다',
        reducedMotionDescription: '애니메이션과 전환 효과를 줄입니다',
        focusIndicatorsDescription: '키보드 탐색 시 포커스 표시를 강화합니다',
        largeButtonsDescription: '버튼과 터치 영역을 크게 만듭니다',
        screenReaderDescription: '스크린 리더 호환성을 향상시킵니다',
        voiceOverDescription: 'iOS VoiceOver 지원을 활성화합니다',
        announcementsDescription: '상태 변경 시 음성 안내를 제공합니다',
        informationText: '이 앱은 웹 접근성 지침(WCAG 2.1)을 준수하여 개발되었습니다.',
        learnMore: '자세히 알아보기',
        resetToDefaults: '기본값으로 재설정',
        fontSizeUpdated: '글자 크기가 변경되었습니다',
        highContrastEnabled: '고대비 모드가 활성화되었습니다',
        highContrastDisabled: '고대비 모드가 비활성화되었습니다',
        reducedMotionEnabled: '애니메이션 줄이기가 활성화되었습니다',
        reducedMotionDisabled: '애니메이션 줄이기가 비활성화되었습니다',
        screenReaderEnabled: '스크린 리더 지원이 활성화되었습니다',
        screenReaderDisabled: '스크린 리더 지원이 비활성화되었습니다',
        voiceOverEnabled: '음성 안내가 활성화되었습니다',
        voiceOverDisabled: '음성 안내가 비활성화되었습니다',
        largeButtonsEnabled: '큰 버튼이 활성화되었습니다',
        largeButtonsDisabled: '큰 버튼이 비활성화되었습니다',
        focusIndicatorsEnabled: '포커스 표시가 활성화되었습니다',
        focusIndicatorsDisabled: '포커스 표시가 비활성화되었습니다',
        announcementsEnabled: '음성 안내가 활성화되었습니다',
        announcementsDisabled: '음성 안내가 비활성화되었습니다'
      },
      offline: {
        title: '오프라인 모드',
        message: '인터넷 연결이 없습니다. 오프라인 모드로 전환됩니다.',
        dataSync: '데이터 동기화',
        pendingUploads: '대기 중인 업로드',
        syncWhenOnline: '온라인 상태가 되면 자동으로 동기화됩니다.',
        statusChange: '상태 변경',
        syncing: '동기화 중...',
        syncError: '동기화 오류',
        pendingSync: '{{count}}개 항목 동기화 대기 중',
        allSynced: '모든 데이터가 동기화되었습니다',
        neverSynced: '동기화된 적 없음',
        justNow: '방금 전',
        minutesAgo: '{{minutes}}분 전',
        hoursAgo: '{{hours}}시간 전',
        daysAgo: '{{days}}일 전',
        lastSync: '마지막 동기화',
        pendingActions: '{{count}}개 대기 중인 작업',
        retrySync: '동기화 재시도',
        syncProgress: '동기화 진행률',
        screenReaderOffline: '오프라인 상태입니다',
        screenReaderSyncing: '데이터를 동기화하고 있습니다',
        screenReaderError: '동기화 오류가 발생했습니다'
      }
    };

    // Japanese translations
    this.translations['ja'] = {
      common: {
        save: '保存',
        cancel: 'キャンセル',
        delete: '削除',
        edit: '編集',
        back: '戻る',
        loading: '読み込み中...',
        error: 'エラー',
        success: '成功',
        warning: '警告',
        confirm: '確認',
        yes: 'はい',
        no: 'いいえ',
        search: '検索',
        filter: 'フィルター',
        settings: '設定',
        language: '言語',
        offline: 'オフライン',
        online: 'オンライン',
        retry: '再試行',
        refresh: '更新'
      },
      navigation: {
        home: 'ホーム',
        receipts: 'レシート',
        budget: '家計簿',
        gallery: 'ギャラリー',
        settings: '設定'
      },
      receipt: {
        title: 'レシート',
        upload: 'レシートアップロード',
        camera: 'カメラで撮影',
        gallery: 'ギャラリーから選択',
        processing: '処理中...',
        storeName: '店舗名',
        date: '日付',
        total: '合計',
        items: '購入商品',
        noReceipts: 'レシートがありません'
      },
      budget: {
        title: '家計簿',
        summary: '支出要約',
        daily: '日別支出',
        category: 'カテゴリ別',
        totalSpent: '総支出',
        averageDaily: '日平均支出'
      },
      settings: {
        title: '設定',
        language: '言語設定',
        exchangeRate: '為替レート設定',
        translation: '翻訳設定',
        notifications: '通知設定',
        backup: 'バックアップ設定',
        accessibility: 'アクセシビリティ設定'
      },
      accessibility: {
        title: 'アクセシビリティ設定',
        fontSize: 'フォントサイズ',
        highContrast: 'ハイコントラストモード',
        screenReader: 'スクリーンリーダー対応',
        voiceOver: '音声ガイド',
        reducedMotion: 'アニメーション削減',
        largeButtons: '大きなボタンを使用'
      },
      offline: {
        title: 'オフラインモード',
        message: 'インターネット接続がありません。オフラインモードに切り替えます。',
        dataSync: 'データ同期',
        pendingUploads: '保留中のアップロード',
        syncWhenOnline: 'オンライン状態になると自動的に同期されます。'
      }
    };

    // English translations
    this.translations['en'] = {
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        back: 'Back',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        confirm: 'Confirm',
        yes: 'Yes',
        no: 'No',
        search: 'Search',
        filter: 'Filter',
        settings: 'Settings',
        language: 'Language',
        offline: 'Offline',
        online: 'Online',
        retry: 'Retry',
        refresh: 'Refresh'
      },
      navigation: {
        home: 'Home',
        receipts: 'Receipts',
        budget: 'Budget',
        gallery: 'Gallery',
        settings: 'Settings'
      },
      receipt: {
        title: 'Receipt',
        upload: 'Upload Receipt',
        camera: 'Take Photo',
        gallery: 'Select from Gallery',
        processing: 'Processing...',
        storeName: 'Store Name',
        date: 'Date',
        total: 'Total',
        items: 'Items',
        noReceipts: 'No receipts found'
      },
      budget: {
        title: 'Budget',
        summary: 'Expense Summary',
        daily: 'Daily Expenses',
        category: 'By Category',
        totalSpent: 'Total Spent',
        averageDaily: 'Daily Average'
      },
      settings: {
        title: 'Settings',
        language: 'Language Settings',
        exchangeRate: 'Exchange Rate Settings',
        translation: 'Translation Settings',
        notifications: 'Notification Settings',
        backup: 'Backup Settings',
        accessibility: 'Accessibility Settings'
      },
      accessibility: {
        title: 'Accessibility Settings',
        fontSize: 'Font Size',
        highContrast: 'High Contrast Mode',
        screenReader: 'Screen Reader Support',
        voiceOver: 'Voice Over',
        reducedMotion: 'Reduce Motion',
        largeButtons: 'Use Large Buttons'
      },
      offline: {
        title: 'Offline Mode',
        message: 'No internet connection. Switching to offline mode.',
        dataSync: 'Data Sync',
        pendingUploads: 'Pending Uploads',
        syncWhenOnline: 'Will sync automatically when online.'
      }
    };

    // Chinese translations
    this.translations['zh'] = {
      common: {
        save: '保存',
        cancel: '取消',
        delete: '删除',
        edit: '编辑',
        back: '返回',
        loading: '加载中...',
        error: '错误',
        success: '成功',
        warning: '警告',
        confirm: '确认',
        yes: '是',
        no: '否',
        search: '搜索',
        filter: '筛选',
        settings: '设置',
        language: '语言',
        offline: '离线',
        online: '在线',
        retry: '重试',
        refresh: '刷新'
      },
      navigation: {
        home: '首页',
        receipts: '收据',
        budget: '预算',
        gallery: '图库',
        settings: '设置'
      },
      receipt: {
        title: '收据',
        upload: '上传收据',
        camera: '拍照',
        gallery: '从图库选择',
        processing: '处理中...',
        storeName: '商店名称',
        date: '日期',
        total: '总计',
        items: '商品',
        noReceipts: '没有找到收据'
      },
      budget: {
        title: '预算',
        summary: '支出摘要',
        daily: '每日支出',
        category: '按类别',
        totalSpent: '总支出',
        averageDaily: '日均支出'
      },
      settings: {
        title: '设置',
        language: '语言设置',
        exchangeRate: '汇率设置',
        translation: '翻译设置',
        notifications: '通知设置',
        backup: '备份设置',
        accessibility: '无障碍设置'
      },
      accessibility: {
        title: '无障碍设置',
        fontSize: '字体大小',
        highContrast: '高对比度模式',
        screenReader: '屏幕阅读器支持',
        voiceOver: '语音提示',
        reducedMotion: '减少动画',
        largeButtons: '使用大按钮'
      },
      offline: {
        title: '离线模式',
        message: '没有网络连接。切换到离线模式。',
        dataSync: '数据同步',
        pendingUploads: '待上传',
        syncWhenOnline: '联网后将自动同步。'
      }
    };
  }

  public setLanguage(languageCode: string): void {
    if (this.isLanguageSupported(languageCode)) {
      this.currentLanguageSubject.next(languageCode);
      localStorage.setItem('app-language', languageCode);
      
      // Update document language attribute for accessibility
      document.documentElement.lang = languageCode;
      
      // Update document direction for RTL languages
      const language = this.supportedLanguages.find(lang => lang.code === languageCode);
      document.documentElement.dir = language?.rtl ? 'rtl' : 'ltr';
    }
  }

  public getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  public isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.some(lang => lang.code === languageCode);
  }

  public translate(key: string, params?: { [key: string]: string }): string {
    const currentLang = this.getCurrentLanguage();
    const translation = this.getNestedTranslation(this.translations[currentLang], key);
    
    if (!translation) {
      // Fallback to Korean if translation not found
      const fallback = this.getNestedTranslation(this.translations['ko'], key);
      if (!fallback) {
        console.warn(`Translation not found for key: ${key}`);
        return key;
      }
      return this.interpolateParams(fallback, params);
    }
    
    return this.interpolateParams(translation, params);
  }

  private getNestedTranslation(translations: TranslationKeys, key: string): string | null {
    const keys = key.split('.');
    let current: any = translations;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }
    
    return typeof current === 'string' ? current : null;
  }

  private interpolateParams(translation: string, params?: { [key: string]: string }): string {
    if (!params) return translation;
    
    let result = translation;
    Object.keys(params).forEach(key => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), params[key]);
    });
    
    return result;
  }

  public getLanguageOptions(): LanguageOption[] {
    return this.supportedLanguages;
  }

  public getLanguageName(code: string): string {
    const language = this.supportedLanguages.find(lang => lang.code === code);
    return language ? `${language.flag} ${language.name}` : code;
  }

  // Accessibility helpers
  public announceToScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  public setPageTitle(titleKey: string): void {
    const title = this.translate(titleKey);
    document.title = `${title} - Receipt Manager`;
  }
}