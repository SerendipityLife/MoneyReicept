import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonIcon, 
  IonText,
  IonItem,
  IonLabel,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonBadge,
  ModalController
} from '@ionic/angular/standalone';
import { ReceiptService } from '../services/receipt.service';
import { Receipt } from '../models/receipt.model';

@Component({
  selector: 'app-receipt-result-modal',
  template: `
    <ion-modal [isOpen]="isOpen" (didDismiss)="onDismiss()">
      <ion-header>
        <ion-toolbar>
          <ion-title>영수증 처리 결과</ion-title>
          <ion-button slot="end" fill="clear" (click)="close()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <div class="result-container" *ngIf="receipt">
          <!-- Success Message -->
          <div class="success-message">
            <ion-icon name="checkmark-circle" color="success" size="large"></ion-icon>
            <h2>영수증 처리 완료!</h2>
            <p>영수증이 성공적으로 분석되어 저장되었습니다.</p>
          </div>

          <!-- Receipt Summary -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>영수증 정보</ion-card-title>
            </ion-card-header>
            
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-icon name="storefront" slot="start" color="primary"></ion-icon>
                  <ion-label>
                    <h3>매장명</h3>
                    <p>{{ receipt.storeName || '알 수 없음' }}</p>
                  </ion-label>
                </ion-item>

                <ion-item>
                  <ion-icon name="location" slot="start" color="primary"></ion-icon>
                  <ion-label>
                    <h3>위치</h3>
                    <p>{{ receipt.storeLocation || '알 수 없음' }}</p>
                  </ion-label>
                </ion-item>

                <ion-item>
                  <ion-icon name="calendar" slot="start" color="primary"></ion-icon>
                  <ion-label>
                    <h3>구매 일시</h3>
                    <p>{{ receipt.purchaseDate | date:'yyyy년 MM월 dd일 HH:mm' }}</p>
                  </ion-label>
                </ion-item>

                <ion-item>
                  <ion-icon name="cash" slot="start" color="success"></ion-icon>
                  <ion-label>
                    <h3>총 금액</h3>
                    <p>
                      <ion-chip color="success">
                        {{ receipt.totalAmountKrw | currency:'KRW':'symbol':'1.0-0' }}
                      </ion-chip>
                      <ion-chip color="medium">
                        ¥{{ receipt.totalAmountJpy | number:'1.0-0' }}
                      </ion-chip>
                    </p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <!-- Items Summary -->
          <ion-card *ngIf="receipt.items && receipt.items.length > 0">
            <ion-card-header>
              <ion-card-title>
                구매 품목 
                <ion-badge color="primary">{{ receipt.items.length }}개</ion-badge>
              </ion-card-title>
            </ion-card-header>
            
            <ion-card-content>
              <ion-list>
                <ion-item *ngFor="let item of receipt.items; let i = index">
                  <ion-label>
                    <h3>{{ item.name }}</h3>
                    <p>
                      수량: {{ item.quantity }}개 | 
                      {{ item.priceKrw | currency:'KRW':'symbol':'1.0-0' }}
                      (¥{{ item.priceJpy | number:'1.0-0' }})
                    </p>
                    <p *ngIf="item.category">
                      <ion-chip size="small" color="tertiary">{{ item.category }}</ion-chip>
                    </p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <!-- Processing Status -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>처리 상태</ion-card-title>
            </ion-card-header>
            
            <ion-card-content>
              <div class="status-indicators">
                <div class="status-item">
                  <ion-icon name="checkmark-circle" color="success"></ion-icon>
                  <span>OCR 텍스트 추출</span>
                </div>
                <div class="status-item">
                  <ion-icon name="checkmark-circle" color="success"></ion-icon>
                  <span>영수증 파싱</span>
                </div>
                <div class="status-item">
                  <ion-icon name="checkmark-circle" color="success"></ion-icon>
                  <span>환율 변환</span>
                </div>
                <div class="status-item">
                  <ion-icon name="checkmark-circle" color="success"></ion-icon>
                  <span>데이터 저장</span>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <ion-button expand="block" color="primary" (click)="viewReceiptDetail()">
              <ion-icon name="eye" slot="start"></ion-icon>
              상세 정보 보기
            </ion-button>

            <ion-button expand="block" fill="outline" color="secondary" (click)="editReceipt()">
              <ion-icon name="create" slot="start"></ion-icon>
              정보 수정
            </ion-button>

            <ion-button expand="block" fill="clear" (click)="close()">
              닫기
            </ion-button>
          </div>
        </div>

        <!-- Loading State -->
        <div class="loading-container" *ngIf="!receipt && receiptId">
          <ion-icon name="hourglass" size="large" color="medium"></ion-icon>
          <h3>영수증 정보를 불러오는 중...</h3>
        </div>

        <!-- Error State -->
        <div class="error-container" *ngIf="!receipt && !receiptId">
          <ion-icon name="alert-circle" size="large" color="danger"></ion-icon>
          <h3>영수증 정보를 불러올 수 없습니다</h3>
          <ion-button fill="outline" (click)="close()">닫기</ion-button>
        </div>
      </ion-content>
    </ion-modal>
  `,
  styles: [`
    .result-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .success-message {
      text-align: center;
      padding: 20px;
      background: var(--ion-color-success-tint);
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .success-message h2 {
      color: var(--ion-color-success);
      margin: 10px 0;
    }

    .success-message p {
      color: var(--ion-color-success-shade);
      margin: 0;
    }

    .status-indicators {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-item span {
      font-weight: 500;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 20px;
      min-height: 300px;
    }

    .loading-container h3,
    .error-container h3 {
      margin: 20px 0;
      color: var(--ion-color-medium);
    }

    ion-chip {
      margin-right: 8px;
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
    IonButton,
    IonIcon,
    IonText,
    IonItem,
    IonLabel,
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonBadge
  ]
})
export class ReceiptResultModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() receiptId: string = '';

  receipt: Receipt | null = null;

  constructor(
    private receiptService: ReceiptService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    if (this.receiptId) {
      this.loadReceiptDetails();
    }
  }

  private loadReceiptDetails() {
    this.receiptService.getReceiptById(this.receiptId).subscribe({
      next: (receipt) => {
        this.receipt = {
          ...receipt,
          purchaseDate: new Date(receipt.purchaseDate)
        };
      },
      error: (error) => {
        console.error('Error loading receipt details:', error);
        // Fallback to mock data for development
        this.receipt = {
          id: this.receiptId,
          imageUrl: '/assets/mock-receipt.jpg',
          storeName: '돈키호테 시부야점',
          storeLocation: '도쿄 시부야구',
          totalAmountKrw: 25000,
          totalAmountJpy: 2500,
          purchaseDate: new Date(),
          processingStatus: 'completed',
          items: [
            {
              id: '1',
              name: '초콜릿',
              priceKrw: 3000,
              priceJpy: 300,
              quantity: 2,
              category: '과자'
            },
            {
              id: '2',
              name: '음료수',
              priceKrw: 2000,
              priceJpy: 200,
              quantity: 1,
              category: '음료'
            }
          ]
        };
      }
    });
  }

  viewReceiptDetail() {
    // Navigate to receipt detail page
    // This will be implemented when we have routing
    console.log('Viewing receipt detail:', this.receiptId);
    this.close();
  }

  editReceipt() {
    // Navigate to receipt edit page
    // This will be implemented when we have routing
    console.log('Editing receipt:', this.receiptId);
    this.close();
  }

  close() {
    this.modalController.dismiss();
  }

  onDismiss() {
    // Handle modal dismiss
  }
}