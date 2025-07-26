import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonProgressBar, 
  IonButton, 
  IonIcon, 
  IonText,
  IonSpinner,
  IonItem,
  IonLabel,
  IonList,
  ModalController
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { UploadProgressService, UploadProgress, ProcessingStatus } from '../services/upload-progress.service';
import { ReceiptResultModalComponent } from './receipt-result-modal.component';

@Component({
  selector: 'app-upload-progress-modal',
  template: `
    <ion-modal [isOpen]="isOpen" (didDismiss)="onDismiss()">
      <ion-header>
        <ion-toolbar>
          <ion-title>영수증 처리 중</ion-title>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <div class="progress-container">
          <!-- Upload Progress -->
          <div class="progress-section">
            <h3>{{ uploadProgress.message }}</h3>
            
            <ion-progress-bar 
              [value]="uploadProgress.progress / 100"
              [color]="getProgressColor(uploadProgress.status)">
            </ion-progress-bar>
            
            <p class="progress-text">{{ uploadProgress.progress }}%</p>
          </div>

          <!-- Processing Status -->
          <div class="processing-section" *ngIf="processingStatus">
            <h4>처리 단계</h4>
            
            <ion-list>
              <ion-item>
                <ion-icon 
                  [name]="getStepIcon('OCR 텍스트 추출')" 
                  [color]="getStepColor('OCR 텍스트 추출')"
                  slot="start">
                </ion-icon>
                <ion-label>
                  <h3>OCR 텍스트 추출</h3>
                  <p>이미지에서 텍스트를 추출합니다</p>
                </ion-label>
                <ion-spinner 
                  *ngIf="processingStatus.currentStep === 'OCR 텍스트 추출'" 
                  name="crescent" 
                  slot="end">
                </ion-spinner>
              </ion-item>

              <ion-item>
                <ion-icon 
                  [name]="getStepIcon('영수증 파싱')" 
                  [color]="getStepColor('영수증 파싱')"
                  slot="start">
                </ion-icon>
                <ion-label>
                  <h3>영수증 파싱</h3>
                  <p>구매 정보를 분석합니다</p>
                </ion-label>
                <ion-spinner 
                  *ngIf="processingStatus.currentStep === '영수증 파싱'" 
                  name="crescent" 
                  slot="end">
                </ion-spinner>
              </ion-item>

              <ion-item>
                <ion-icon 
                  [name]="getStepIcon('환율 변환')" 
                  [color]="getStepColor('환율 변환')"
                  slot="start">
                </ion-icon>
                <ion-label>
                  <h3>환율 변환</h3>
                  <p>엔화를 원화로 변환합니다</p>
                </ion-label>
                <ion-spinner 
                  *ngIf="processingStatus.currentStep === '환율 변환'" 
                  name="crescent" 
                  slot="end">
                </ion-spinner>
              </ion-item>

              <ion-item>
                <ion-icon 
                  [name]="getStepIcon('데이터 저장')" 
                  [color]="getStepColor('데이터 저장')"
                  slot="start">
                </ion-icon>
                <ion-label>
                  <h3>데이터 저장</h3>
                  <p>처리된 데이터를 저장합니다</p>
                </ion-label>
                <ion-spinner 
                  *ngIf="processingStatus.currentStep === '데이터 저장'" 
                  name="crescent" 
                  slot="end">
                </ion-spinner>
              </ion-item>
            </ion-list>

            <div class="estimated-time" *ngIf="processingStatus.estimatedTimeRemaining">
              <ion-text color="medium">
                <p>예상 남은 시간: {{ processingStatus.estimatedTimeRemaining }}초</p>
              </ion-text>
            </div>
          </div>

          <!-- Status Messages -->
          <div class="status-message">
            <ion-text 
              [color]="uploadProgress.status === 'failed' ? 'danger' : 
                       uploadProgress.status === 'completed' ? 'success' : 'primary'">
              <p>{{ getStatusMessage() }}</p>
            </ion-text>
            
            <ion-text color="danger" *ngIf="uploadProgress.error">
              <p>오류: {{ uploadProgress.error }}</p>
            </ion-text>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <ion-button 
              *ngIf="uploadProgress.status === 'completed'" 
              expand="block" 
              color="success"
              (click)="viewResult()">
              <ion-icon name="eye" slot="start"></ion-icon>
              결과 확인
            </ion-button>

            <ion-button 
              *ngIf="uploadProgress.status === 'failed'" 
              expand="block" 
              color="warning"
              (click)="retry()">
              <ion-icon name="refresh" slot="start"></ion-icon>
              다시 시도
            </ion-button>

            <ion-button 
              *ngIf="uploadProgress.status === 'completed' || uploadProgress.status === 'failed'" 
              expand="block" 
              fill="outline"
              (click)="close()">
              닫기
            </ion-button>
          </div>
        </div>
      </ion-content>
    </ion-modal>
  `,
  styles: [`
    .progress-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-height: 400px;
    }

    .progress-section {
      text-align: center;
    }

    .progress-text {
      margin-top: 10px;
      font-weight: bold;
      font-size: 1.2em;
    }

    .processing-section {
      flex: 1;
    }

    .processing-section h4 {
      margin-bottom: 15px;
      color: var(--ion-color-primary);
    }

    .estimated-time {
      text-align: center;
      margin-top: 15px;
    }

    .status-message {
      text-align: center;
      padding: 15px;
      border-radius: 8px;
      background: var(--ion-color-light);
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
    }

    ion-icon[slot="start"] {
      margin-right: 15px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonProgressBar,
    IonButton,
    IonIcon,
    IonText,
    IonSpinner,
    IonItem,
    IonLabel,
    IonList
  ]
})
export class UploadProgressModalComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;

  uploadProgress: UploadProgress = {
    progress: 0,
    status: 'idle',
    message: ''
  };

  processingStatus: ProcessingStatus | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private uploadProgressService: UploadProgressService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    // Subscribe to upload progress
    this.subscriptions.push(
      this.uploadProgressService.uploadProgress$.subscribe(progress => {
        this.uploadProgress = progress;
      })
    );

    // Subscribe to processing status
    this.subscriptions.push(
      this.uploadProgressService.processingStatus$.subscribe(status => {
        this.processingStatus = status;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getProgressColor(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'processing': return 'warning';
      default: return 'primary';
    }
  }

  getStepIcon(step: string): string {
    if (!this.processingStatus) return 'ellipse-outline';

    const currentStep = this.processingStatus.currentStep;
    const steps = ['OCR 텍스트 추출', '영수증 파싱', '환율 변환', '데이터 저장'];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);

    if (this.processingStatus.status === 'completed') {
      return 'checkmark-circle';
    } else if (this.processingStatus.status === 'failed') {
      return stepIndex <= currentIndex ? 'close-circle' : 'ellipse-outline';
    } else if (stepIndex < currentIndex) {
      return 'checkmark-circle';
    } else if (stepIndex === currentIndex) {
      return 'time';
    } else {
      return 'ellipse-outline';
    }
  }

  getStepColor(step: string): string {
    if (!this.processingStatus) return 'medium';

    const currentStep = this.processingStatus.currentStep;
    const steps = ['OCR 텍스트 추출', '영수증 파싱', '환율 변환', '데이터 저장'];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);

    if (this.processingStatus.status === 'completed') {
      return 'success';
    } else if (this.processingStatus.status === 'failed') {
      return stepIndex <= currentIndex ? 'danger' : 'medium';
    } else if (stepIndex < currentIndex) {
      return 'success';
    } else if (stepIndex === currentIndex) {
      return 'warning';
    } else {
      return 'medium';
    }
  }

  getStatusMessage(): string {
    switch (this.uploadProgress.status) {
      case 'uploading':
        return '이미지를 서버에 업로드하고 있습니다...';
      case 'processing':
        return '영수증을 분석하고 있습니다. 잠시만 기다려주세요.';
      case 'completed':
        return '영수증 처리가 완료되었습니다!';
      case 'failed':
        return '영수증 처리 중 오류가 발생했습니다.';
      default:
        return '';
    }
  }

  async viewResult() {
    if (this.uploadProgress.receiptId) {
      // Close current modal first
      await this.close();
      
      // Open receipt result modal
      const modal = await this.modalController.create({
        component: ReceiptResultModalComponent,
        componentProps: {
          isOpen: true,
          receiptId: this.uploadProgress.receiptId
        }
      });

      await modal.present();
    }
  }

  retry() {
    // Reset progress and close modal
    this.uploadProgressService.resetProgress();
    this.close();
  }

  close() {
    this.modalController.dismiss();
  }

  onDismiss() {
    // Reset progress when modal is dismissed
    this.uploadProgressService.resetProgress();
  }
}