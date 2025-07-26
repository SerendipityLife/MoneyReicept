import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonChip,
  IonImg,
  IonGrid,
  IonRow,
  IonCol,

  IonSpinner,
  IonBadge,
  IonInput,
  IonDatetime,
  IonToggle,
  ActionSheetController,
  AlertController,
  ToastController,
  LoadingController,
  ModalController
} from '@ionic/angular/standalone';
import { ReceiptService } from '../services/receipt.service';
import { TranslationService, TranslationResult, TranslationFeedback } from '../services/translation.service';
import { SettingsService } from '../services/settings.service';
import { Receipt, ReceiptItem } from '../models/receipt.model';

@Component({
  selector: 'app-receipt-detail',
  templateUrl: './receipt-detail.page.html',
  styleUrls: ['./receipt-detail.page.scss'],
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonChip,
    IonImg,
    IonGrid,
    IonRow,
    IonCol,

    IonSpinner,
    IonBadge,
    IonInput,
    IonDatetime,
    IonToggle
  ]
})
export class ReceiptDetailPage implements OnInit {
  receipt: Receipt | null = null;
  isLoading = true;
  isEditing = false;
  editableReceipt: Partial<Receipt> = {};
  
  // Translation-related properties
  translations: Map<string, TranslationResult> = new Map();
  isTranslating = false;
  showTranslationSettings = false;
  translationSettings = {
    sourceLanguage: 'ja',
    targetLanguage: 'ko',
    autoTranslateEnabled: true
  };
  editingTranslations: Map<string, string> = new Map();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private receiptService: ReceiptService,
    private translationService: TranslationService,
    private settingsService: SettingsService,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    const receiptId = this.route.snapshot.paramMap.get('id');
    if (receiptId) {
      this.loadReceipt(receiptId);
    }
    this.loadTranslationSettings();
  }

  async loadReceipt(id: string) {
    this.isLoading = true;
    
    try {
      this.receiptService.getReceiptById(id).subscribe({
        next: (receipt) => {
          this.receipt = {
            ...receipt,
            purchaseDate: new Date(receipt.purchaseDate)
          };
          this.editableReceipt = { ...this.receipt };
          this.isLoading = false;
          
          // Auto-translate if enabled
          if (this.translationSettings.autoTranslateEnabled && this.receipt.items && this.receipt.items.length > 0) {
            this.translateAllItems();
          }
        },
        error: (error) => {
          console.error('Error loading receipt:', error);
          this.showErrorToast('영수증을 불러오는데 실패했습니다.');
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error loading receipt:', error);
      this.showErrorToast('영수증을 불러오는데 실패했습니다.');
      this.isLoading = false;
    }
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: '영수증 관리',
      buttons: [
        {
          text: '수정',
          icon: 'create-outline',
          handler: () => {
            this.toggleEdit();
          }
        },
        {
          text: '삭제',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.confirmDelete();
          }
        },
        {
          text: '공유',
          icon: 'share-outline',
          handler: () => {
            this.shareReceipt();
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

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset editable data if canceling
      this.editableReceipt = { ...this.receipt };
    }
  }

  async saveChanges() {
    if (!this.receipt || !this.editableReceipt) return;

    const loading = await this.loadingController.create({
      message: '저장 중...'
    });
    await loading.present();

    try {
      // Here you would call the update API
      // For now, just update the local data
      this.receipt = { ...this.receipt, ...this.editableReceipt };
      this.isEditing = false;
      
      await loading.dismiss();
      this.showSuccessToast('영수증이 성공적으로 수정되었습니다.');
    } catch (error) {
      await loading.dismiss();
      this.showErrorToast('영수증 수정에 실패했습니다.');
    }
  }

  async confirmDelete() {
    const alert = await this.alertController.create({
      header: '영수증 삭제',
      message: '이 영수증을 삭제하시겠습니까? 삭제된 영수증은 복구할 수 없습니다.',
      buttons: [
        {
          text: '취소',
          role: 'cancel'
        },
        {
          text: '삭제',
          role: 'destructive',
          handler: () => {
            this.deleteReceipt();
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteReceipt() {
    if (!this.receipt) return;

    const loading = await this.loadingController.create({
      message: '삭제 중...'
    });
    await loading.present();

    try {
      this.receiptService.deleteReceipt(this.receipt.id).subscribe({
        next: () => {
          loading.dismiss();
          this.showSuccessToast('영수증이 삭제되었습니다.');
          this.router.navigate(['/tabs/tab2']);
        },
        error: (error) => {
          loading.dismiss();
          this.showErrorToast('영수증 삭제에 실패했습니다.');
        }
      });
    } catch (error) {
      await loading.dismiss();
      this.showErrorToast('영수증 삭제에 실패했습니다.');
    }
  }

  shareReceipt() {
    if (!this.receipt) return;
    
    // Implement sharing functionality
    this.showInfoToast('공유 기능은 준비 중입니다.');
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'pending':
        return 'medium';
      default:
        return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return '처리 완료';
      case 'processing':
        return '처리 중';
      case 'failed':
        return '처리 실패';
      case 'pending':
        return '처리 대기';
      default:
        return '알 수 없음';
    }
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

  private async showInfoToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'primary'
    });
    toast.present();
  }

  goBack() {
    this.router.navigate(['/tabs/tab2']);
  }

  // Translation-related methods
  private loadTranslationSettings() {
    const settings = this.settingsService.getCurrentSettings();
    if (settings?.translationSettings) {
      this.translationSettings = {
        sourceLanguage: settings.translationSettings.sourceLanguage,
        targetLanguage: settings.translationSettings.targetLanguage,
        autoTranslateEnabled: settings.translationSettings.autoTranslateEnabled
      };
    }
  }

  async translateAllItems() {
    if (!this.receipt?.items || this.receipt.items.length === 0) {
      this.showInfoToast('번역할 상품이 없습니다.');
      return;
    }

    this.isTranslating = true;
    const loading = await this.loadingController.create({
      message: '상품명을 번역하는 중...'
    });
    await loading.present();

    try {
      const textsToTranslate = this.receipt.items
        .filter(item => this.translationService.needsTranslation(
          item.nameJp || item.name, 
          this.translationSettings.sourceLanguage, 
          this.translationSettings.targetLanguage
        ))
        .map(item => item.nameJp || item.name);

      if (textsToTranslate.length === 0) {
        await loading.dismiss();
        this.isTranslating = false;
        this.showInfoToast('번역이 필요한 상품이 없습니다.');
        return;
      }

      this.translationService.batchTranslate(
        textsToTranslate,
        this.translationSettings.sourceLanguage,
        this.translationSettings.targetLanguage
      ).subscribe({
        next: (result) => {
          result.translations.forEach(translation => {
            this.translations.set(translation.originalText, translation);
          });
          
          loading.dismiss();
          this.isTranslating = false;
          this.showSuccessToast(`${result.successCount}개 상품명이 번역되었습니다.`);
        },
        error: (error) => {
          console.error('Translation error:', error);
          loading.dismiss();
          this.isTranslating = false;
          this.showErrorToast('번역에 실패했습니다.');
        }
      });
    } catch (error) {
      await loading.dismiss();
      this.isTranslating = false;
      this.showErrorToast('번역 중 오류가 발생했습니다.');
    }
  }

  async translateSingleItem(text: string) {
    if (!this.translationService.needsTranslation(text, this.translationSettings.sourceLanguage, this.translationSettings.targetLanguage)) {
      return;
    }

    // Check cache first
    const cached = this.translationService.getCachedTranslation(text, this.translationSettings.sourceLanguage, this.translationSettings.targetLanguage);
    if (cached) {
      this.translations.set(text, cached);
      return;
    }

    this.translationService.translateText(
      text,
      this.translationSettings.sourceLanguage,
      this.translationSettings.targetLanguage
    ).subscribe({
      next: (result) => {
        this.translations.set(text, result);
      },
      error: (error) => {
        console.error('Single translation error:', error);
      }
    });
  }

  getTranslatedText(originalText: string): string {
    const translation = this.translations.get(originalText);
    return translation?.translatedText || originalText;
  }

  hasTranslation(originalText: string): boolean {
    return this.translations.has(originalText);
  }

  async editTranslation(originalText: string) {
    const currentTranslation = this.getTranslatedText(originalText);
    
    const alert = await this.alertController.create({
      header: '번역 수정',
      message: `원문: ${originalText}`,
      inputs: [
        {
          name: 'translation',
          type: 'textarea',
          placeholder: '번역을 입력하세요',
          value: currentTranslation
        }
      ],
      buttons: [
        {
          text: '취소',
          role: 'cancel'
        },
        {
          text: '저장',
          handler: (data) => {
            if (data.translation && data.translation.trim() !== '') {
              this.updateTranslation(originalText, data.translation.trim());
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private updateTranslation(originalText: string, correctedTranslation: string) {
    // Update local translation
    const existingTranslation = this.translations.get(originalText);
    if (existingTranslation) {
      this.translations.set(originalText, {
        ...existingTranslation,
        translatedText: correctedTranslation
      });
    } else {
      this.translations.set(originalText, {
        originalText,
        translatedText: correctedTranslation,
        sourceLanguage: this.translationSettings.sourceLanguage,
        targetLanguage: this.translationSettings.targetLanguage
      });
    }

    // Submit feedback to backend
    const feedback: TranslationFeedback = {
      originalText,
      correctedTranslation,
      sourceLanguage: this.translationSettings.sourceLanguage,
      targetLanguage: this.translationSettings.targetLanguage
    };

    this.translationService.submitTranslationFeedback(feedback).subscribe({
      next: () => {
        this.showSuccessToast('번역이 수정되었습니다.');
      },
      error: (error) => {
        console.error('Translation feedback error:', error);
        this.showErrorToast('번역 수정 저장에 실패했습니다.');
      }
    });
  }

  async presentTranslationSettings() {
    const { TranslationSettingsModalComponent } = await import('../components/translation-settings-modal.component');
    
    const modal = await this.modalController.create({
      component: TranslationSettingsModalComponent,
      presentingElement: await this.modalController.getTop()
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.translationSettings = result.data;
        this.loadTranslationSettings(); // Reload from settings service
      }
    });

    return await modal.present();
  }

  private saveTranslationSettings() {
    const settings = this.settingsService.getCurrentSettings();
    if (settings) {
      this.settingsService.updateTranslationSettings(settings.id, this.translationSettings).subscribe({
        next: () => {
          this.showSuccessToast('번역 설정이 저장되었습니다.');
        },
        error: (error) => {
          console.error('Settings update error:', error);
          this.showErrorToast('설정 저장에 실패했습니다.');
        }
      });
    }
  }

  toggleAutoTranslate() {
    this.translationSettings.autoTranslateEnabled = !this.translationSettings.autoTranslateEnabled;
    this.saveTranslationSettings();
    
    if (this.translationSettings.autoTranslateEnabled && this.receipt?.items) {
      this.translateAllItems();
    }
  }

  async presentTranslationFeedback(originalText: string) {
    const currentTranslation = this.getTranslatedText(originalText);
    
    const alert = await this.alertController.create({
      header: '번역 품질 평가',
      message: `원문: ${originalText}\n번역: ${currentTranslation}`,
      inputs: [
        {
          name: 'rating',
          type: 'radio',
          label: '매우 좋음',
          value: '5',
          checked: false
        },
        {
          name: 'rating',
          type: 'radio',
          label: '좋음',
          value: '4',
          checked: true
        },
        {
          name: 'rating',
          type: 'radio',
          label: '보통',
          value: '3',
          checked: false
        },
        {
          name: 'rating',
          type: 'radio',
          label: '나쁨',
          value: '2',
          checked: false
        },
        {
          name: 'rating',
          type: 'radio',
          label: '매우 나쁨',
          value: '1',
          checked: false
        }
      ],
      buttons: [
        {
          text: '취소',
          role: 'cancel'
        },
        {
          text: '수정하기',
          handler: () => {
            this.editTranslation(originalText);
          }
        },
        {
          text: '평가 제출',
          handler: (data) => {
            if (data) {
              this.submitRating(originalText, parseInt(data));
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private submitRating(originalText: string, rating: number) {
    const feedback: TranslationFeedback = {
      originalText,
      correctedTranslation: this.getTranslatedText(originalText),
      sourceLanguage: this.translationSettings.sourceLanguage,
      targetLanguage: this.translationSettings.targetLanguage,
      rating
    };

    this.translationService.submitTranslationFeedback(feedback).subscribe({
      next: () => {
        this.showSuccessToast('평가가 제출되었습니다.');
      },
      error: (error) => {
        console.error('Rating submission error:', error);
        this.showErrorToast('평가 제출에 실패했습니다.');
      }
    });
  }
}