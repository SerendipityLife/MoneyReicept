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
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonDatetime,
  IonSelect,
  IonSelectOption,
  IonRange,
  IonFooter,
  ModalController
} from '@ionic/angular/standalone';

export interface SearchFilters {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  storeType?: string;
  minAmount?: number;
  maxAmount?: number;
  processingStatus?: string;
}

@Component({
  selector: 'app-receipt-search-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>영수증 검색</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="search-container">
        <ion-searchbar
          [(ngModel)]="filters.query"
          placeholder="매장명, 상품명으로 검색"
          debounce="300">
        </ion-searchbar>

        <ion-list>
          <ion-item>
            <ion-label position="stacked">기간 설정</ion-label>
            <div class="date-range-container">
              <ion-datetime
                [(ngModel)]="filters.dateFrom"
                presentation="date"
                placeholder="시작일"
                class="date-input">
              </ion-datetime>
              <span class="date-separator">~</span>
              <ion-datetime
                [(ngModel)]="filters.dateTo"
                presentation="date"
                placeholder="종료일"
                class="date-input">
              </ion-datetime>
            </div>
          </ion-item>

          <ion-item>
            <ion-label>매장 유형</ion-label>
            <ion-select [(ngModel)]="filters.storeType" placeholder="전체">
              <ion-select-option value="">전체</ion-select-option>
              <ion-select-option value="donki">돈키호테</ion-select-option>
              <ion-select-option value="convenience">편의점</ion-select-option>
              <ion-select-option value="supermarket">마트</ion-select-option>
              <ion-select-option value="restaurant">레스토랑</ion-select-option>
              <ion-select-option value="other">기타</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label>처리 상태</ion-label>
            <ion-select [(ngModel)]="filters.processingStatus" placeholder="전체">
              <ion-select-option value="">전체</ion-select-option>
              <ion-select-option value="completed">완료</ion-select-option>
              <ion-select-option value="processing">처리중</ion-select-option>
              <ion-select-option value="failed">실패</ion-select-option>
              <ion-select-option value="pending">대기</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">금액 범위 (원)</ion-label>
            <div class="amount-range-container">
              <ion-range
                [(ngModel)]="amountRange"
                dual-knobs="true"
                min="0"
                max="500000"
                step="1000"
                pin="true"
                (ionChange)="onAmountRangeChange($event)">
              </ion-range>
              <div class="amount-labels">
                <span>{{ filters.minAmount | currency:'KRW':'symbol':'1.0-0' }}</span>
                <span>{{ filters.maxAmount | currency:'KRW':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <div class="footer-buttons">
          <ion-button fill="clear" (click)="resetFilters()">
            초기화
          </ion-button>
          <ion-button (click)="applyFilters()" expand="block">
            검색
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .search-container {
      padding: 16px;
    }

    .date-range-container {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      margin-top: 8px;
    }

    .date-input {
      flex: 1;
      --background: var(--ion-color-light);
      --border-radius: 8px;
      --padding-start: 12px;
      --padding-end: 12px;
    }

    .date-separator {
      color: var(--ion-color-medium);
      font-weight: 500;
    }

    .amount-range-container {
      width: 100%;
      margin-top: 8px;
    }

    .amount-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 0.9em;
      color: var(--ion-color-medium);
    }

    .footer-buttons {
      display: flex;
      gap: 12px;
      padding: 16px;
      width: 100%;
    }

    .footer-buttons ion-button[fill="clear"] {
      flex: 0 0 auto;
    }

    .footer-buttons ion-button[expand="block"] {
      flex: 1;
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
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonDatetime,
    IonSelect,
    IonSelectOption,
    IonRange,
    IonFooter
  ]
})
export class ReceiptSearchModalComponent implements OnInit {
  filters: SearchFilters = {
    minAmount: 0,
    maxAmount: 500000
  };

  amountRange = {
    lower: 0,
    upper: 500000
  };

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    // Initialize filters if passed from parent
  }

  onAmountRangeChange(event: any) {
    this.filters.minAmount = event.detail.value.lower;
    this.filters.maxAmount = event.detail.value.upper;
  }

  resetFilters() {
    this.filters = {
      minAmount: 0,
      maxAmount: 500000
    };
    this.amountRange = {
      lower: 0,
      upper: 500000
    };
  }

  applyFilters() {
    this.modalController.dismiss(this.filters, 'apply');
  }

  dismiss() {
    this.modalController.dismiss(null, 'cancel');
  }
}