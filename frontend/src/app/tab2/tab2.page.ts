import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonNote,
  IonChip,
  IonIcon,
  IonButton,
  IonButtons,
  IonSegment,
  IonSegmentButton,
  IonItemGroup,
  IonItemDivider,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  ModalController,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  closeCircleOutline,
  calendarOutline,
  addOutline
} from 'ionicons/icons';
import { Receipt } from '../models/receipt.model';
import { TravelPlan } from '../models/budget.model';
import { ReceiptService } from '../services/receipt.service';
import { BudgetService } from '../services/budget.service';
import { ReceiptSearchModalComponent } from '../components/receipt-search-modal.component';
import { TravelPlanSelectorModalComponent } from '../components/travel-plan-selector-modal.component';

interface ReceiptGroup {
  date: Date;
  receipts: Receipt[];
}

interface SearchFilters {
  storeName?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonNote,
    IonChip,
    IonIcon,
    IonButton,
    IonButtons,
    IonSegment,
    IonSegmentButton,
    IonItemGroup,
    IonItemDivider,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ]
})
export class Tab2Page implements OnInit {
  receipts: Receipt[] = [];
  groupedReceipts: ReceiptGroup[] = [];
  selectedSegment: string = 'all';
  currentPage: number = 1;
  isLoading: boolean = false;
  hasMoreData: boolean = true;
  currentFilters: SearchFilters = {};
  isSearchActive: boolean = false;
  selectedTravelPlan: TravelPlan | null = null;

  constructor(
    private receiptService: ReceiptService,
    private budgetService: BudgetService,
    private modalController: ModalController,
    private toastController: ToastController,
    private router: Router
  ) {
    addIcons({
      searchOutline,
      closeCircleOutline,
      calendarOutline,
      addOutline
    });
  }

  ngOnInit() {
    this.loadReceipts();
  }

  async doRefresh(event: any) {
    this.currentPage = 1;
    await this.loadReceipts();
    event.target.complete();
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    this.loadReceipts();
  }

  async loadMore(event: any) {
    if (this.hasMoreData && !this.isLoading) {
      this.currentPage++;
      await this.loadReceipts(true);
    }
    event.target.complete();
  }

  async openSearchModal() {
    const modal = await this.modalController.create({
      component: ReceiptSearchModalComponent,
      componentProps: {
        currentFilters: this.currentFilters
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.currentFilters = result.data;
        this.isSearchActive = true;
        this.currentPage = 1;
        this.loadReceipts();
        this.showSearchToast();
      }
    });

    return await modal.present();
  }

  async clearSearch() {
    this.currentFilters = {};
    this.isSearchActive = false;
    this.currentPage = 1;
    await this.loadReceipts();
  }

  async openTravelPlanSelector() {
    const modal = await this.modalController.create({
      component: TravelPlanSelectorModalComponent
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.selectedTravelPlan = result.data;
        this.loadReceiptsByTravelPlan();
      }
    });

    return await modal.present();
  }

  async clearTravelPlanSelection() {
    this.selectedTravelPlan = null;
    this.currentPage = 1;
    await this.loadReceipts();
  }

  async loadReceiptsByTravelPlan() {
    if (!this.selectedTravelPlan) return;

    this.isLoading = true;

    try {
      this.receiptService.getReceiptsByTravelPlan(this.selectedTravelPlan.id).subscribe({
        next: (receipts) => {
          const processedReceipts = receipts.map(receipt => ({
            ...receipt,
            purchaseDate: new Date(receipt.purchaseDate)
          }));

          this.receipts = processedReceipts;
          this.groupReceiptsByDate();
        },
        error: (error) => {
          console.error('Error loading receipts by travel plan:', error);
          this.receipts = [];
          this.groupReceiptsByDate();
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error loading receipts by travel plan:', error);
      this.isLoading = false;
    }
  }

  viewReceipt(receiptId: string) {
    this.router.navigate(['/receipt-detail', receiptId]);
  }

  private async loadReceipts(append: boolean = false) {

    this.isLoading = true;

    try {
      this.receiptService.getReceipts({
        page: this.currentPage,
        limit: 20,
        ...this.currentFilters
      }).subscribe({
        next: (receipts) => {
          const processedReceipts = receipts.map(receipt => ({
            ...receipt,
            purchaseDate: new Date(receipt.purchaseDate)
          }));

          if (append) {
            this.receipts = [...this.receipts, ...processedReceipts];
          } else {
            this.receipts = processedReceipts;
          }

          this.groupReceiptsByDate();
        },
        error: (error) => {
          console.error('Error loading receipts:', error);
          // Fallback to mock data for development
          const mockReceipts: Receipt[] = [
            {
              id: '1',
              imageUrl: '/assets/mock-receipt.jpg',
              storeName: '돈키호테 시부야점',
              storeLocation: '도쿄 시부야구',
              totalAmountKrw: 25000,
              totalAmountJpy: 2500,
              purchaseDate: new Date(),
              processingStatus: 'completed'
            },
            {
              id: '2',
              imageUrl: '/assets/mock-receipt2.jpg',
              storeName: '세븐일레븐',
              storeLocation: '도쿄 신주쿠구',
              totalAmountKrw: 8000,
              totalAmountJpy: 800,
              purchaseDate: new Date(Date.now() - 86400000),
              processingStatus: 'completed'
            }
          ];

          if (append) {
            this.receipts = [...this.receipts, ...mockReceipts];
          } else {
            this.receipts = mockReceipts;
          }

          this.groupReceiptsByDate();
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error loading receipts:', error);
      this.isLoading = false;
    }
  }

  private async showSearchToast() {
    const toast = await this.toastController.create({
      message: '검색 필터가 적용되었습니다.',
      duration: 2000,
      position: 'top',
      color: 'primary'
    });
    toast.present();
  }

  private applySegmentFilter(receipts: Receipt[]): Receipt[] {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    switch (this.selectedSegment) {
      case 'today':
        return receipts.filter(receipt => {
          const receiptDate = new Date(receipt.purchaseDate);
          return receiptDate.toDateString() === today.toDateString();
        });
      case 'week':
        return receipts.filter(receipt => {
          const receiptDate = new Date(receipt.purchaseDate);
          return receiptDate >= startOfWeek && receiptDate <= today;
        });
      default:
        return receipts;
    }
  }

  private groupReceiptsByDate() {
    const filteredReceipts = this.applySegmentFilter(this.receipts);

    const grouped = filteredReceipts.reduce((groups, receipt) => {
      const date = new Date(receipt.purchaseDate);
      const dateKey = date.toDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: date,
          receipts: []
        };
      }

      groups[dateKey].receipts.push(receipt);
      return groups;
    }, {} as { [key: string]: ReceiptGroup });

    this.groupedReceipts = Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  getProcessingStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return '처리 대기 중...';
      case 'processing':
        return '영수증 분석 중...';
      case 'failed':
        return '처리 실패';
      default:
        return '';
    }
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
        return '완료';
      case 'processing':
        return '처리중';
      case 'failed':
        return '실패';
      case 'pending':
        return '대기';
      default:
        return '알 수 없음';
    }
  }
}