import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { TranslationService, TranslationStats } from '../services/translation.service';
import { SettingsService } from '../services/settings.service';
import { LANGUAGE_OPTIONS } from '../models/settings.model';

@Component({
  selector: 'app-translation-settings-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>번역 설정</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Translation Settings -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>언어 설정</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-label>원본 언어</ion-label>
              <ion-select 
                [(ngModel)]="settings.sourceLanguage"
                (ionChange)="onSettingsChange()"
                interface="popover">
                <ion-select-option 
                  *ngFor="let lang of languageOptions" 
                  [value]="lang.code">
                  {{ lang.flag }} {{ lang.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label>번역 언어</ion-label>
              <ion-select 
                [(ngModel)]="settings.targetLanguage"
                (ionChange)="onSettingsChange()"
                interface="popover">
                <ion-select-option 
                  *ngFor="let lang of languageOptions" 
                  [value]="lang.code">
                  {{ lang.flag }} {{ lang.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label>
                <h3>자동 번역</h3>
                <p>영수증 로드 시 자동으로 번역</p>
              </ion-label>
              <ion-toggle 
                [(ngModel)]="settings.autoTranslateEnabled"
                (ionChange)="onSettingsChange()"
                slot="end">
              </ion-toggle>
            </ion-item>

            <ion-item>
              <ion-label>
                <h3>번역 제공자</h3>
                <p>번역 서비스 선택</p>
              </ion-label>
              <ion-select 
                [(ngModel)]="settings.translationProvider"
                (ionChange)="onSettingsChange()"
                interface="popover"
                slot="end">
                <ion-select-option value="google">Google Translate</ion-select-option>
                <ion-select-option value="manual">수동 번역</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Translation Statistics -->
      <ion-card *ngIf="stats">
        <ion-card-header>
          <ion-card-title>번역 통계</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-label>
                <h3>총 번역 수</h3>
                <p>{{ stats.totalTranslations | number }}</p>
              </ion-label>
              <ion-chip color="primary" slot="end">
                {{ stats.totalTranslations | number }}
              </ion-chip>
            </ion-item>

            <ion-item>
              <ion-label>
                <h3>캐시 적중률</h3>
                <p>{{ (stats.cacheHitRate * 100) | number:'1.1-1' }}%</p>
              </ion-label>
              <ion-chip 
                [color]="stats.cacheHitRate > 0.7 ? 'success' : stats.cacheHitRate > 0.4 ? 'warning' : 'danger'" 
                slot="end">
                {{ (stats.cacheHitRate * 100) | number:'1.0-0' }}%
              </ion-chip>
            </ion-item>

            <ion-item>
              <ion-label>
                <h3>평균 신뢰도</h3>
                <p>번역 품질 점수</p>
              </ion-label>
              <ion-chip 
                [color]="stats.averageConfidence > 0.8 ? 'success' : stats.averageConfidence > 0.6 ? 'warning' : 'danger'" 
                slot="end">
                {{ (stats.averageConfidence * 100) | number:'1.0-0' }}%
              </ion-chip>
            </ion-item>
          </ion-list>

          <!-- Language Pairs -->
          <div class="language-pairs" *ngIf="stats.languagePairs">
            <h4>언어 쌍별 번역 수</h4>
            <div class="language-pair-list">
              <ion-chip 
                *ngFor="let pair of getLanguagePairs()" 
                color="medium"
                class="language-pair-chip">
                {{ pair.label }}: {{ pair.count }}
              </ion-chip>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Cache Management -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>캐시 관리</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-label>
                <h3>캐시 크기</h3>
                <p>{{ cacheSize }} 개의 번역이 캐시됨</p>
              </ion-label>
              <ion-chip color="medium" slot="end">
                {{ cacheSize }}
              </ion-chip>
            </ion-item>

            <ion-item button (click)="clearCache()">
              <ion-icon name="trash-outline" slot="start" color="danger"></ion-icon>
              <ion-label color="danger">
                <h3>캐시 삭제</h3>
                <p>모든 번역 캐시를 삭제합니다</p>
              </ion-label>
            </ion-item>

            <ion-item button (click)="clearOldCache()">
              <ion-icon name="time-outline" slot="start" color="warning"></ion-icon>
              <ion-label color="warning">
                <h3>오래된 캐시 삭제</h3>
                <p>30일 이상된 캐시를 삭제합니다</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <ion-button 
          expand="block" 
          (click)="saveAndClose()"
          [disabled]="isSaving">
          <ion-icon name="checkmark" slot="start"></ion-icon>
          {{ isSaving ? '저장 중...' : '저장하고 닫기' }}
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .language-pairs {
      margin-top: 16px;
      
      h4 {
        margin: 0 0 8px 0;
        font-size: 0.9em;
        color: var(--ion-color-medium);
      }
    }

    .language-pair-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .language-pair-chip {
      font-size: 0.8em;
      --padding-start: 8px;
      --padding-end: 8px;
    }

    .action-buttons {
      padding: 16px;
      padding-bottom: 32px;
    }

    ion-card {
      margin-bottom: 16px;
    }

    ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip
  ]
})
export class TranslationSettingsModalComponent implements OnInit {
  settings = {
    sourceLanguage: 'ja',
    targetLanguage: 'ko',
    autoTranslateEnabled: true,
    translationProvider: 'google' as 'google' | 'manual'
  };

  stats: TranslationStats | null = null;
  cacheSize = 0;
  isSaving = false;
  languageOptions = LANGUAGE_OPTIONS;

  constructor(
    private modalController: ModalController,
    private translationService: TranslationService,
    private settingsService: SettingsService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadCurrentSettings();
    this.loadStats();
    this.loadCacheSize();
  }

  private loadCurrentSettings() {
    const currentSettings = this.settingsService.getCurrentSettings();
    if (currentSettings?.translationSettings) {
      this.settings = {
        sourceLanguage: currentSettings.translationSettings.sourceLanguage,
        targetLanguage: currentSettings.translationSettings.targetLanguage,
        autoTranslateEnabled: currentSettings.translationSettings.autoTranslateEnabled,
        translationProvider: currentSettings.translationSettings.translationProvider
      };
    }
  }

  private loadStats() {
    this.translationService.getTranslationStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading translation stats:', error);
      }
    });
  }

  private loadCacheSize() {
    this.cacheSize = this.translationService.getCacheSize();
  }

  onSettingsChange() {
    // Settings will be saved when user clicks save button
  }

  getLanguagePairs(): { label: string, count: number }[] {
    if (!this.stats?.languagePairs) return [];
    
    return Object.entries(this.stats.languagePairs).map(([pair, count]) => ({
      label: pair,
      count
    }));
  }

  async clearCache() {
    const toast = await this.toastController.create({
      message: '캐시를 삭제하는 중...',
      duration: 1000
    });
    await toast.present();

    this.translationService.clearCache().subscribe({
      next: () => {
        this.loadCacheSize();
        this.showSuccessToast('캐시가 삭제되었습니다.');
      },
      error: (error) => {
        console.error('Error clearing cache:', error);
        this.showErrorToast('캐시 삭제에 실패했습니다.');
      }
    });
  }

  async clearOldCache() {
    const toast = await this.toastController.create({
      message: '오래된 캐시를 삭제하는 중...',
      duration: 1000
    });
    await toast.present();

    this.translationService.clearCache(30).subscribe({
      next: () => {
        this.loadCacheSize();
        this.showSuccessToast('오래된 캐시가 삭제되었습니다.');
      },
      error: (error) => {
        console.error('Error clearing old cache:', error);
        this.showErrorToast('캐시 삭제에 실패했습니다.');
      }
    });
  }

  async saveAndClose() {
    this.isSaving = true;
    
    const currentSettings = this.settingsService.getCurrentSettings();
    if (currentSettings) {
      this.settingsService.updateTranslationSettings(currentSettings.id, this.settings).subscribe({
        next: () => {
          this.isSaving = false;
          this.showSuccessToast('번역 설정이 저장되었습니다.');
          this.dismiss(this.settings);
        },
        error: (error) => {
          console.error('Error saving settings:', error);
          this.isSaving = false;
          this.showErrorToast('설정 저장에 실패했습니다.');
        }
      });
    } else {
      this.isSaving = false;
      this.showErrorToast('설정을 불러올 수 없습니다.');
    }
  }

  dismiss(data?: any) {
    this.modalController.dismiss(data);
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    toast.present();
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    toast.present();
  }
}