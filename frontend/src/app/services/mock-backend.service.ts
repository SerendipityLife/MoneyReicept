import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { Receipt, ReceiptUploadResponse } from '../models/receipt.model';
import { ProcessingStatus } from './upload-progress.service';

@Injectable({
  providedIn: 'root'
})
export class MockBackendService {
  private mockReceipts: Receipt[] = [
    {
      id: '1',
      imageUrl: '/assets/mock-receipt.jpg',
      storeName: '돈키호테 시부야점',
      storeLocation: '도쿄 시부야구',
      totalAmountKrw: 25000,
      totalAmountJpy: 2500,
      taxAmountJpy: 250,
      discountAmountJpy: 100,
      exchangeRate: 10.2,
      purchaseDate: new Date(),
      processingStatus: 'completed',
      receiptType: 'DONKI',
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: '1-1',
          name: '초콜릿',
          nameJp: 'チョコレート',
          nameKr: '초콜릿',
          priceKrw: 6000,
          priceJpy: 600,
          quantity: 2,
          category: '과자',
          productCode: 'CHO001'
        },
        {
          id: '1-2',
          name: '음료수',
          nameJp: '飲み物',
          nameKr: '음료수',
          priceKrw: 2000,
          priceJpy: 200,
          quantity: 1,
          category: '음료',
          productCode: 'DRK001'
        },
        {
          id: '1-3',
          name: '과자',
          nameJp: 'お菓子',
          nameKr: '과자',
          priceKrw: 1500,
          priceJpy: 150,
          quantity: 3,
          category: '과자',
          productCode: 'SNK001'
        }
      ]
    },
    {
      id: '2',
      imageUrl: '/assets/mock-receipt2.jpg',
      storeName: '세븐일레븐',
      storeLocation: '도쿄 신주쿠구',
      totalAmountKrw: 8000,
      totalAmountJpy: 800,
      taxAmountJpy: 80,
      exchangeRate: 10.0,
      purchaseDate: new Date(Date.now() - 86400000),
      processingStatus: 'processing',
      receiptType: 'CONVENIENCE',
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 86400000),
      items: [
        {
          id: '2-1',
          name: '도시락',
          nameJp: '弁当',
          nameKr: '도시락',
          priceKrw: 5000,
          priceJpy: 500,
          quantity: 1,
          category: '식품',
          productCode: 'BNT001'
        },
        {
          id: '2-2',
          name: '커피',
          nameJp: 'コーヒー',
          nameKr: '커피',
          priceKrw: 3000,
          priceJpy: 300,
          quantity: 1,
          category: '음료',
          productCode: 'COF001'
        }
      ]
    },
    {
      id: '3',
      imageUrl: '/assets/mock-receipt3.jpg',
      storeName: '패밀리마트',
      storeLocation: '도쿄 하라주쿠',
      totalAmountKrw: 12000,
      totalAmountJpy: 1200,
      taxAmountJpy: 120,
      exchangeRate: 10.0,
      purchaseDate: new Date(Date.now() - 172800000),
      processingStatus: 'pending',
      receiptType: 'CONVENIENCE',
      createdAt: new Date(Date.now() - 172800000),
      updatedAt: new Date(Date.now() - 172800000)
    },
    {
      id: '4',
      imageUrl: '/assets/mock-receipt4.jpg',
      storeName: '이온몰 도쿄베이',
      storeLocation: '도쿄 강동구',
      totalAmountKrw: 45000,
      totalAmountJpy: 4500,
      taxAmountJpy: 450,
      discountAmountJpy: 200,
      exchangeRate: 10.0,
      purchaseDate: new Date(Date.now() - 259200000),
      processingStatus: 'completed',
      receiptType: 'GENERAL',
      createdAt: new Date(Date.now() - 259200000),
      updatedAt: new Date(Date.now() - 259200000),
      items: [
        {
          id: '4-1',
          name: '화장품',
          nameJp: '化粧品',
          nameKr: '화장품',
          priceKrw: 25000,
          priceJpy: 2500,
          quantity: 1,
          category: '뷰티',
          productCode: 'COS001'
        },
        {
          id: '4-2',
          name: '의류',
          nameJp: '衣類',
          nameKr: '의류',
          priceKrw: 20000,
          priceJpy: 2000,
          quantity: 1,
          category: '패션',
          productCode: 'CLO001'
        }
      ]
    },
    {
      id: '5',
      imageUrl: '/assets/mock-receipt5.jpg',
      storeName: '라멘 이치란',
      storeLocation: '도쿄 시부야구',
      totalAmountKrw: 15000,
      totalAmountJpy: 1500,
      taxAmountJpy: 150,
      exchangeRate: 10.0,
      purchaseDate: new Date(Date.now() - 345600000),
      processingStatus: 'failed',
      receiptType: 'GENERAL',
      createdAt: new Date(Date.now() - 345600000),
      updatedAt: new Date(Date.now() - 345600000)
    }
  ];

  private processingStatuses: { [key: string]: ProcessingStatus } = {
    '2': {
      receiptId: '2',
      status: 'processing',
      progress: 60,
      currentStep: '영수증 파싱',
      estimatedTimeRemaining: 15
    },
    '3': {
      receiptId: '3',
      status: 'pending',
      progress: 0,
      currentStep: 'OCR 텍스트 추출',
      estimatedTimeRemaining: 30
    }
  };

  mockUploadReceipt(): Observable<ReceiptUploadResponse> {
    const newReceiptId = Date.now().toString();
    
    // Simulate upload response
    return of({
      receiptId: newReceiptId,
      message: '영수증이 성공적으로 업로드되었습니다.',
      status: 'success' as 'success'
    }).pipe(delay(1000));
  }

  mockGetProcessingStatus(receiptId: string): Observable<ProcessingStatus> {
    const status = this.processingStatuses[receiptId];
    
    if (!status) {
      // Return completed status for unknown receipts
      return of({
        receiptId,
        status: 'completed' as 'completed',
        progress: 100,
        currentStep: '데이터 저장',
        estimatedTimeRemaining: 0
      }).pipe(delay(500));
    }

    // Simulate processing progression
    if (status.status === 'processing') {
      status.progress = Math.min(100, status.progress + 10);
      status.estimatedTimeRemaining = Math.max(0, (status.estimatedTimeRemaining || 0) - 3);
      
      if (status.progress >= 100) {
        status.status = 'completed';
        status.currentStep = '데이터 저장';
        status.estimatedTimeRemaining = 0;
      } else if (status.progress >= 80) {
        status.currentStep = '데이터 저장';
      } else if (status.progress >= 60) {
        status.currentStep = '환율 변환';
      } else if (status.progress >= 30) {
        status.currentStep = '영수증 파싱';
      }
    } else if (status.status === 'pending') {
      // Move from pending to processing
      status.status = 'processing';
      status.progress = 10;
      status.currentStep = 'OCR 텍스트 추출';
    }

    return of({ ...status }).pipe(delay(500));
  }

  mockGetReceipts(filters?: any): Observable<Receipt[]> {
    let filteredReceipts = [...this.mockReceipts];
    
    if (filters) {
      // Apply query filter (search in store name and location)
      if (filters.query) {
        const query = filters.query.toLowerCase();
        filteredReceipts = filteredReceipts.filter(receipt => 
          receipt.storeName?.toLowerCase().includes(query) ||
          receipt.storeLocation?.toLowerCase().includes(query)
        );
      }
      
      // Apply date range filter
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        filteredReceipts = filteredReceipts.filter(receipt => 
          receipt.purchaseDate >= fromDate
        );
      }
      
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        filteredReceipts = filteredReceipts.filter(receipt => 
          receipt.purchaseDate <= toDate
        );
      }
      
      // Apply store type filter
      if (filters.storeType) {
        filteredReceipts = filteredReceipts.filter(receipt => {
          const storeName = receipt.storeName?.toLowerCase() || '';
          switch (filters.storeType) {
            case 'donki':
              return storeName.includes('돈키호테');
            case 'convenience':
              return storeName.includes('세븐일레븐') || 
                     storeName.includes('패밀리마트') || 
                     storeName.includes('로손');
            case 'supermarket':
              return storeName.includes('마트') || storeName.includes('슈퍼');
            case 'restaurant':
              return storeName.includes('레스토랑') || 
                     storeName.includes('식당') || 
                     storeName.includes('카페');
            default:
              return true;
          }
        });
      }
      
      // Apply processing status filter
      if (filters.processingStatus) {
        filteredReceipts = filteredReceipts.filter(receipt => 
          receipt.processingStatus === filters.processingStatus
        );
      }
      
      // Apply amount range filter
      if (filters.minAmount !== undefined) {
        filteredReceipts = filteredReceipts.filter(receipt => 
          receipt.totalAmountKrw >= filters.minAmount
        );
      }
      
      if (filters.maxAmount !== undefined) {
        filteredReceipts = filteredReceipts.filter(receipt => 
          receipt.totalAmountKrw <= filters.maxAmount
        );
      }
    }
    
    return of(filteredReceipts).pipe(delay(300));
  }

  mockGetRecentReceipts(limit: number = 5): Observable<Receipt[]> {
    const recent = this.mockReceipts
      .sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime())
      .slice(0, limit);
    
    return of(recent).pipe(delay(200));
  }

  mockGetReceiptById(id: string): Observable<Receipt> {
    const receipt = this.mockReceipts.find(r => r.id === id);
    
    if (!receipt) {
      return throwError(() => new Error('Receipt not found'));
    }
    
    return of({ ...receipt }).pipe(delay(300));
  }

  // Simulate network errors for testing
  mockNetworkError(): Observable<never> {
    return throwError(() => new Error('Network error')).pipe(delay(1000));
  }

  // Add a new receipt to mock data (for testing upload completion)
  addMockReceipt(receipt: Receipt): void {
    this.mockReceipts.unshift(receipt);
  }

  // Update processing status (for testing)
  updateProcessingStatus(receiptId: string, status: ProcessingStatus): void {
    this.processingStatuses[receiptId] = status;
  }
}