import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonThumbnail,
  IonLabel,
  IonNote,
  IonChip,
  IonIcon,
  IonButton,
  IonButtons,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  calendarOutline,
  timeOutline,
  locationOutline,
  checkmarkOutline,
  closeOutline,
  receiptOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { TravelPlan } from '../models/budget.model';
import { Receipt } from '../models/receipt.model';
import { ReceiptService } from '../services/receipt.service';

@Component({
  selector: 'app-receipt-list-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <ion-icon name="receipt-outline"></ion-icon>
          여행 기간 영수증 목록
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- 여행 계획 정보 -->
      <ion-card *ngIf="travelPlan" class="travel-plan-info">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="calendar-outline"></ion-icon>
            {{ travelPlan.name }}
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p class="travel-dates">
            {{ travelPlan.startDate | date:'yyyy.MM.dd' }} - {{ travelPlan.endDate | date:'yyyy.MM.dd' }}
          </p>
          <p *ngIf="travelPlan.budget > 0" class="travel-budget">
            예산: {{ travelPlan.budget | currency:'KRW' }}
          </p>
        </ion-card-content>
      </ion-card>

      <!-- 로딩 상태 -->
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>영수증을 불러오는 중...</p>
      </div>

      <!-- 영수증 목록 -->
      <ion-list *ngIf="!isLoading && hasReceipts">
        <ion-item *ngFor="let receipt of receipts" (click)="viewReceipt(receipt)" button>
          <ion-thumbnail slot="start">
            <img [src]="receipt.imageUrl" [alt]="receipt.storeName" 
                 (error)="$event.target.src='assets/icon/favicon.png'">
            <div class="status-overlay" [class]="getStatusColor(receipt.processingStatus)">
              <ion-icon [name]="receipt.processingStatus === 'completed' ? 'checkmark-outline' : 'time-outline'"></ion-icon>
            </div>
          </ion-thumbnail>
          
          <ion-label>
            <h2>{{ receipt.storeName }}</h2>
            <p>
              <ion-icon name="time-outline"></ion-icon>
              {{ receipt.purchaseDate | date:'yyyy.MM.dd HH:mm' }}
            </p>
            <p>
              <ion-icon name="location-outline"></ion-icon>
              {{ receipt.totalAmountJpy | currency:'JPY' }} / {{ receipt.totalAmountKrw | currency:'KRW' }}
            </p>
            <div class="receipt-status">
              <ion-chip [color]="getStatusColor(receipt.processingStatus)" size="small">
                {{ getProcessingStatusText(receipt.processingStatus) }}
              </ion-chip>
            </div>
          </ion-label>
          
          <ion-note slot="end">
            <ion-icon name="chevron-forward-outline"></ion-icon>
          </ion-note>
        </ion-item>
      </ion-list>

      <!-- 영수증이 없는 경우 -->
      <div *ngIf="!isLoading && !hasReceipts" class="no-receipts">
        <ion-icon name="receipt-outline" size="large"></ion-icon>
        <h3>등록된 영수증이 없습니다</h3>
        <p>이 여행 기간에 등록된 영수증이 없습니다.</p>
        <p>영수증을 추가해보세요!</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .travel-plan-info {
      margin: 16px;
      border-radius: 12px;
    }
    
    .travel-plan-info ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
    }
    
    .travel-dates {
      font-size: 16px;
      color: var(--ion-color-dark);
      margin-bottom: 8px;
    }
    
    .travel-budget {
      font-size: 14px;
      color: var(--ion-color-medium);
      margin: 0;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 40px;
      color: var(--ion-color-medium);
    }
    
    .loading-container p {
      margin-top: 16px;
      color: var(--ion-color-medium);
    }
    
    ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
      --border-radius: 8px;
      margin-bottom: 8px;
    }
    
    ion-thumbnail {
      position: relative;
      width: 60px;
      height: 60px;
      border-radius: 8px;
      overflow: hidden;
    }
    
    ion-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .status-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
    }
    
    .status-overlay.success {
      background: rgba(76, 175, 80, 0.8);
    }
    
    .status-overlay.warning {
      background: rgba(255, 152, 0, 0.8);
    }
    
    .status-overlay.danger {
      background: rgba(244, 67, 54, 0.8);
    }
    
    ion-item h2 {
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    ion-item p {
      margin: 2px 0;
      font-size: 14px;
      color: var(--ion-color-medium);
    }
    
    ion-icon {
      margin-right: 4px;
    }
    
    .receipt-status {
      margin-top: 8px;
    }
    
    .no-receipts {
      text-align: center;
      padding: 40px 20px;
      color: var(--ion-color-medium);
    }
    
    .no-receipts ion-icon {
      font-size: 64px;
      margin-bottom: 16px;
      color: var(--ion-color-medium);
    }
    
    .no-receipts h3 {
      margin-bottom: 8px;
      color: var(--ion-color-dark);
    }
    
    .no-receipts p {
      margin-bottom: 8px;
      color: var(--ion-color-medium);
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonThumbnail,
    IonLabel,
    IonNote,
    IonChip,
    IonIcon,
    IonButton,
    IonButtons,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ]
})
export class ReceiptListModalComponent implements OnInit {
  travelPlan: TravelPlan | null = null;
  receipts: Receipt[] = [];
  isLoading = false;
  hasReceipts = false;

  constructor(
    private receiptService: ReceiptService,
    private modalController: ModalController,
    private toastController: ToastController,
    private router: Router
  ) {
    addIcons({
      calendarOutline,
      timeOutline,
      locationOutline,
      checkmarkOutline,
      closeOutline,
      receiptOutline,
      chevronForwardOutline
    });
  }

  ngOnInit() {
    if (this.travelPlan) {
      this.loadReceiptsForTravelPlan();
    }
  }

  async loadReceiptsForTravelPlan() {
    if (!this.travelPlan) {
      return;
    }

    this.isLoading = true;
    try {
      // 백엔드 API 호출 대신 모의 데이터 사용
      setTimeout(() => {
        // 모의 데이터
        this.receipts = [
          {
            id: '1',
            imageUrl: 'https://example.com/receipt1.jpg',
            storeName: '도쿄 스시로',
            storeLocation: '도쿄, 시부야',
            totalAmountKrw: 45000,
            totalAmountJpy: 5000,
            taxAmountJpy: 400,
            discountAmountJpy: 0,
            exchangeRate: 9.0,
            purchaseDate: new Date('2025-01-16'),
            processingStatus: 'completed',
            receiptType: 'GENERAL',
            items: [
              { 
                id: '1',
                name: '스시 세트', 
                priceJpy: 3000, 
                priceKrw: 27000,
                quantity: 1
              },
              { 
                id: '2',
                name: '미소국', 
                priceJpy: 500, 
                priceKrw: 4500,
                quantity: 1
              },
              { 
                id: '3',
                name: '차', 
                priceJpy: 200, 
                priceKrw: 1800,
                quantity: 1
              }
            ],
            travelPlanId: this.travelPlan?.id
          },
          {
            id: '2',
            imageUrl: 'https://example.com/receipt2.jpg',
            storeName: '도쿄 타워',
            storeLocation: '도쿄, 미나토',
            totalAmountKrw: 27000,
            totalAmountJpy: 3000,
            taxAmountJpy: 240,
            discountAmountJpy: 0,
            exchangeRate: 9.0,
            purchaseDate: new Date('2025-01-17'),
            processingStatus: 'completed',
            receiptType: 'GENERAL',
            items: [
              { 
                id: '4',
                name: '전망대 입장권', 
                priceJpy: 3000, 
                priceKrw: 27000,
                quantity: 1
              }
            ],
            travelPlanId: this.travelPlan?.id
          },
          {
            id: '3',
            imageUrl: 'https://example.com/receipt3.jpg',
            storeName: '도쿄 돈키호테',
            storeLocation: '도쿄, 시부야',
            totalAmountKrw: 18000,
            totalAmountJpy: 2000,
            taxAmountJpy: 160,
            discountAmountJpy: 0,
            exchangeRate: 9.0,
            purchaseDate: new Date('2025-01-18'),
            processingStatus: 'completed',
            receiptType: 'DONKI',
            items: [
              { 
                id: '5',
                name: '초콜릿', 
                priceJpy: 800, 
                priceKrw: 7200,
                quantity: 2
              },
              { 
                id: '6',
                name: '과자', 
                priceJpy: 400, 
                priceKrw: 3600,
                quantity: 1
              }
            ],
            travelPlanId: this.travelPlan?.id
          }
        ];
        this.hasReceipts = this.receipts.length > 0;
        this.isLoading = false;
      }, 1000); // 1초 지연으로 로딩 효과 시뮬레이션

      // 백엔드 API 호출 (현재는 주석 처리)
      /*
      this.receiptService.getReceiptsByTravelPlan(this.travelPlan.id).subscribe({
        next: (receipts) => {
          this.receipts = receipts;
          this.hasReceipts = receipts.length > 0;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('여행 계획별 영수증 조회 오류:', error);
          this.isLoading = false;
        }
      });
      */
    } catch (error) {
      console.error('여행 계획별 영수증 조회 오류:', error);
      this.isLoading = false;
    }
  }

  viewReceipt(receipt: Receipt) {
    this.dismiss();
    this.router.navigate(['/receipt-detail', receipt.id]);
  }

  getProcessingStatusText(status: string): string {
    switch (status) {
      case 'pending': return '처리 중';
      case 'completed': return '완료';
      case 'failed': return '실패';
      default: return '알 수 없음';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      default: return 'medium';
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }
} 