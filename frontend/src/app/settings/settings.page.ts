import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, 
  IonToggle, IonSelect, IonSelectOption, IonIcon, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonInput, IonButtons,
  IonBackButton, AlertController, ToastController, LoadingController, 
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  settingsOutline, swapHorizontalOutline, languageOutline, 
  notificationsOutline, cloudUploadOutline, downloadOutline, 
  cloudDownloadOutline, timeOutline, closeOutline, accessibilityOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { SettingsService } from '../services/settings.service';
import { UserSettings, LANGUAGE_OPTIONS, BACKUP_FREQUENCY_OPTIONS } from '../models/settings.model';
import { I18nService } from '../services/i18n.service';
import { AccessibilityService } from '../services/accessibility.service';
import { OfflineService } from '../services/offline.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, 
    IonToggle, IonSelect, IonSelectOption, IonIcon, IonCard, 
    IonCardHeader, IonCardTitle, IonCardContent, IonInput, IonButtons,
    IonBackButton, CommonModule, FormsModule
  ]
})
export class SettingsPage implements OnInit {
  settings: UserSettings | null = null;
  languageOptions = LANGUAGE_OPTIONS;
  backupFrequencyOptions = BACKUP_FREQUENCY_OPTIONS;
  
  // I18n and accessibility
  i18nLanguageOptions = this.i18nService.getLanguageOptions();
  currentLanguage = this.i18nService.getCurrentLanguage();
  
  // Form data
  manualExchangeRate: number = 0;
  
  constructor(
    private settingsService: SettingsService,
    private i18nService: I18nService,
    private accessibilityService: AccessibilityService,
    private offlineService: OfflineService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({
      settingsOutline, swapHorizontalOutline, languageOutline, 
      notificationsOutline, cloudUploadOutline, downloadOutline, 
      cloudDownloadOutline, timeOutline, closeOutline, accessibilityOutline,
      chevronForwardOutline
    });
  }

  ngOnInit() {
    this.loadSettings();
  }

  private async loadSettings() {
    const loading = await this.loadingController.create({
      message: '설정을 불러오는 중...'
    });
    await loading.present();

    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        this.settings = settings;
        this.manualExchangeRate = settings.exchangeRateSettings.manualRate || 0;
        loading.dismiss();
      },
      error: (error) => {
        console.error('Error loading settings:', error);
        loading.dismiss();
        this.showToast('설정을 불러오는데 실패했습니다.', 'danger');
      }
    });
  }

  async onExchangeRateToggle() {
    if (!this.settings) return;

    const useManual = this.settings.exchangeRateSettings.useManualRate;
    
    if (useManual && !this.manualExchangeRate) {
      await this.showExchangeRateInput();
    } else {
      await this.updateExchangeRateSettings();
    }
  }

  async showExchangeRateInput() {
    const alert = await this.alertController.create({
      header: '환율 설정',
      message: '수동으로 설정할 환율을 입력하세요 (1엔 = ? 원)',
      inputs: [
        {
          name: 'rate',
          type: 'number',
          placeholder: '예: 9.5',
          value: this.manualExchangeRate || ''
        }
      ],
      buttons: [
        {
          text: '취소',
          role: 'cancel',
          handler: () => {
            if (this.settings) {
              this.settings.exchangeRateSettings.useManualRate = false;
            }
          }
        },
        {
          text: '설정',
          handler: (data) => {
            const rate = parseFloat(data.rate);
            if (rate && rate > 0) {
              this.manualExchangeRate = rate;
              this.updateExchangeRateSettings();
            } else {
              this.showToast('올바른 환율을 입력해주세요.', 'warning');
              if (this.settings) {
                this.settings.exchangeRateSettings.useManualRate = false;
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async updateExchangeRateSettings() {
    if (!this.settings) return;

    const loading = await this.loadingController.create({
      message: '환율 설정을 업데이트하는 중...'
    });
    await loading.present();

    this.settingsService.updateExchangeRate(
      this.settings.id,
      this.manualExchangeRate,
      this.settings.exchangeRateSettings.useManualRate
    ).subscribe({
      next: (updatedSettings) => {
        this.settings = updatedSettings;
        loading.dismiss();
        this.showToast('환율 설정이 업데이트되었습니다.', 'success');
      },
      error: (error) => {
        console.error('Error updating exchange rate:', error);
        loading.dismiss();
        this.showToast('환율 설정 업데이트에 실패했습니다.', 'danger');
      }
    });
  }

  async updateTranslationSettings() {
    if (!this.settings) return;

    const loading = await this.loadingController.create({
      message: '번역 설정을 업데이트하는 중...'
    });
    await loading.present();

    this.settingsService.updateTranslationSettings(this.settings.id, {
      sourceLanguage: this.settings.translationSettings.sourceLanguage,
      targetLanguage: this.settings.translationSettings.targetLanguage,
      autoTranslateEnabled: this.settings.translationSettings.autoTranslateEnabled,
      translationProvider: this.settings.translationSettings.translationProvider
    }).subscribe({
      next: (updatedSettings) => {
        this.settings = updatedSettings;
        loading.dismiss();
        this.showToast('번역 설정이 업데이트되었습니다.', 'success');
      },
      error: (error) => {
        console.error('Error updating translation settings:', error);
        loading.dismiss();
        this.showToast('번역 설정 업데이트에 실패했습니다.', 'danger');
      }
    });
  }

  async updateNotificationSettings() {
    if (!this.settings) return;

    const loading = await this.loadingController.create({
      message: '알림 설정을 업데이트하는 중...'
    });
    await loading.present();

    this.settingsService.updateNotificationSettings(this.settings.id, {
      receiptProcessingNotifications: this.settings.notificationSettings.receiptProcessingNotifications,
      budgetAlerts: this.settings.notificationSettings.budgetAlerts,
      exchangeRateUpdates: this.settings.notificationSettings.exchangeRateUpdates,
      weeklyReports: this.settings.notificationSettings.weeklyReports,
      pushNotificationsEnabled: this.settings.notificationSettings.pushNotificationsEnabled
    }).subscribe({
      next: (updatedSettings) => {
        this.settings = updatedSettings;
        loading.dismiss();
        this.showToast('알림 설정이 업데이트되었습니다.', 'success');
      },
      error: (error) => {
        console.error('Error updating notification settings:', error);
        loading.dismiss();
        this.showToast('알림 설정 업데이트에 실패했습니다.', 'danger');
      }
    });
  }

  async showBackupOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: '백업 옵션',
      buttons: [
        {
          text: '백업 생성',
          icon: 'cloud-upload-outline',
          handler: () => {
            this.createBackup();
          }
        },
        {
          text: '백업 내보내기',
          icon: 'download-outline',
          handler: () => {
            this.exportBackup();
          }
        },
        {
          text: '백업 복원',
          icon: 'cloud-download-outline',
          handler: () => {
            this.showRestoreOptions();
          }
        },
        {
          text: '백업 기록',
          icon: 'time-outline',
          handler: () => {
            this.showBackupHistory();
          }
        },
        {
          text: '취소',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async createBackup() {
    const loading = await this.loadingController.create({
      message: '백업을 생성하는 중...'
    });
    await loading.present();

    this.settingsService.createBackup().subscribe({
      next: (backupData) => {
        loading.dismiss();
        this.showToast('백업이 성공적으로 생성되었습니다.', 'success');
      },
      error: (error) => {
        console.error('Error creating backup:', error);
        loading.dismiss();
        this.showToast('백업 생성에 실패했습니다.', 'danger');
      }
    });
  }

  async exportBackup() {
    const loading = await this.loadingController.create({
      message: '백업을 내보내는 중...'
    });
    await loading.present();

    this.settingsService.exportBackup().subscribe({
      next: (blob) => {
        loading.dismiss();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        window.URL.revokeObjectURL(url);
        this.showToast('백업 파일이 다운로드되었습니다.', 'success');
      },
      error: (error) => {
        console.error('Error exporting backup:', error);
        loading.dismiss();
        this.showToast('백업 내보내기에 실패했습니다.', 'danger');
      }
    });
  }

  async showRestoreOptions() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.restoreBackup(file);
      }
    };
    input.click();
  }

  async restoreBackup(file: File) {
    const alert = await this.alertController.create({
      header: '백업 복원 확인',
      message: '백업을 복원하면 현재 데이터가 모두 삭제됩니다. 계속하시겠습니까?',
      buttons: [
        {
          text: '취소',
          role: 'cancel'
        },
        {
          text: '복원',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: '백업을 복원하는 중...'
            });
            await loading.present();

            this.settingsService.restoreBackup(file).subscribe({
              next: (response) => {
                loading.dismiss();
                this.showToast('백업이 성공적으로 복원되었습니다.', 'success');
                this.loadSettings(); // Reload settings
              },
              error: (error) => {
                console.error('Error restoring backup:', error);
                loading.dismiss();
                this.showToast('백업 복원에 실패했습니다.', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async showBackupHistory() {
    const loading = await this.loadingController.create({
      message: '백업 기록을 불러오는 중...'
    });
    await loading.present();

    this.settingsService.getBackupHistory().subscribe({
      next: (history) => {
        loading.dismiss();
        this.showBackupHistoryAlert(history);
      },
      error: (error) => {
        console.error('Error getting backup history:', error);
        loading.dismiss();
        this.showToast('백업 기록을 불러오는데 실패했습니다.', 'danger');
      }
    });
  }

  async showBackupHistoryAlert(history: string[]) {
    const alert = await this.alertController.create({
      header: '백업 기록',
      message: history.length > 0 
        ? `총 ${history.length}개의 백업 파일이 있습니다:\n\n${history.slice(0, 5).join('\n')}`
        : '백업 기록이 없습니다.',
      buttons: ['확인']
    });

    await alert.present();
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  getLanguageName(code: string): string {
    const language = this.languageOptions.find(lang => lang.code === code);
    return language ? `${language.flag} ${language.name}` : code;
  }

  getBackupFrequencyLabel(value: string): string {
    const option = this.backupFrequencyOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  onLanguageChange() {
    this.i18nService.setLanguage(this.currentLanguage);
    this.showToast('언어가 변경되었습니다.', 'success');
    
    // Announce language change to screen reader
    this.accessibilityService.announceToScreenReader(
      `Language changed to ${this.i18nService.getLanguageName(this.currentLanguage)}`
    );
  }
}
