import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonRefresher, 
  IonRefresherContent, 
  IonSegment, 
  IonSegmentButton, 
  IonLabel, 
  IonList, 
  IonItemGroup, 
  IonItemDivider, 
  IonItem, 
  IonThumbnail, 
  IonNote, 
  IonInfiniteScroll, 
  IonInfiniteScrollContent,
  IonChip,
  IonSpinner,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { ReceiptService } from '../services/receipt.service';
import { Receipt } from '../models/receipt.model';
import { ReceiptSearchModalComponent, SearchFilters } from '../components/receipt-search-modal.component';

interface ReceiptGroup {
  date: Date;
  receipts: Receipt[];
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
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
    IonRefresher, 
    IonRefresherContent, 
    IonSegment, 
    IonSegmentButton, 
    IonLabel, 
    IonList, 
    IonItemGroup, 
    IonItemDivider, 
    IonItem, 
    IonThumbnail, 
    IonNote, 
    IonInfiniteScroll, 
    IonInfiniteScrollContent,
    IonChip,
    IonSpinner
  ],
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

  constructor(
    private receiptService: ReceiptService,
    private modalController: ModalController,
    private toastController: ToastController,
    private router: Router
  ) {}

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
    this.currentPage = 1;
    this.loadReceipts();
  }

  async loadMore(event: any) {
    if (!this.hasMoreData) {
      event.target.complete();
      return;
    }

    this.currentPage++;
    await this.loadReceipts(true);
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
      if (result.role === 'apply' && result.data) {
        this.currentFilters = result.data;
        this.isSearchActive = Object.keys(this.currentFilters).some(key => 
          this.currentFilters[key as keyof SearchFilters] !== undefined && 
          this.currentFilters[key as keyof SearchFilters] !== ''
        );
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
    
    const toast = await this.toastController.create({
      message: '검색 필터가 초기화되었습니다',
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  viewReceipt(receiptId: string) {
    this.router.navigate(['/receipt-detail', receiptId]);
  }

  private async loadReceipts(append: boolean = false) {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      this.receiptService.getReceipts(this.currentPage, 20, this.currentFilters).subscribe({
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

  private async showSearchToast() {
    const toast = await this.toastController.create({
      message: '검색 필터가 적용되었습니다',
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  private applySegmentFilter(receipts: Receipt[]): Receipt[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    switch (this.selectedSegment) {
      case 'today':
        return receipts.filter(receipt => {
          const receiptDate = new Date(receipt.purchaseDate);
          const receiptDay = new Date(receiptDate.getFullYear(), receiptDate.getMonth(), receiptDate.getDate());
          return receiptDay.getTime() === today.getTime();
        });
      case 'week':
        return receipts.filter(receipt => {
          const receiptDate = new Date(receipt.purchaseDate);
          return receiptDate >= weekStart && receiptDate <= now;
        });
      default:
        return receipts;
    }
  }

  private groupReceiptsByDate() {
    // Apply segment filter first
    const filteredReceipts = this.applySegmentFilter(this.receipts);
    
    const groups: { [key: string]: Receipt[] } = {};
    
    filteredReceipts.forEach(receipt => {
      const dateKey = receipt.purchaseDate.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(receipt);
    });

    this.groupedReceipts = Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(dateKey => ({
        date: new Date(dateKey),
        receipts: groups[dateKey].sort((a, b) => 
          b.purchaseDate.getTime() - a.purchaseDate.getTime()
        )
      }));
  }
}