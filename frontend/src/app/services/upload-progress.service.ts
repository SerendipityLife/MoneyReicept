import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, takeWhile, switchMap, catchError, of } from 'rxjs';
import { HttpClient, HttpEventType, HttpProgressEvent } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { MockBackendService } from './mock-backend.service';

export interface UploadProgress {
  receiptId?: string;
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  message: string;
  error?: string;
}

export interface ProcessingStatus {
  receiptId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UploadProgressService {
  private uploadProgressSubject = new BehaviorSubject<UploadProgress>({
    progress: 0,
    status: 'idle',
    message: ''
  });

  private processingStatusSubject = new BehaviorSubject<ProcessingStatus | null>(null);

  constructor(
    private http: HttpClient,
    private mockBackend: MockBackendService
  ) {}

  get uploadProgress$(): Observable<UploadProgress> {
    return this.uploadProgressSubject.asObservable();
  }

  get processingStatus$(): Observable<ProcessingStatus | null> {
    return this.processingStatusSubject.asObservable();
  }

  uploadReceiptWithProgress(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('receipt', file);

    // Reset progress
    this.uploadProgressSubject.next({
      progress: 0,
      status: 'uploading',
      message: '이미지 업로드 중...'
    });

    return this.http.post(`${environment.apiUrl}/receipts/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      switchMap((event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          // Calculate upload progress
          const progress = Math.round(100 * event.loaded / event.total);
          this.uploadProgressSubject.next({
            progress,
            status: 'uploading',
            message: `업로드 중... ${progress}%`
          });
          return [];
        } else if (event.type === HttpEventType.Response) {
          // Upload completed, start processing
          const response = event.body;
          this.uploadProgressSubject.next({
            receiptId: response.receiptId,
            progress: 100,
            status: 'processing',
            message: '영수증 분석 중...'
          });

          // Start polling for processing status
          this.startProcessingStatusPolling(response.receiptId);
          return [response];
        }
        return [];
      }),
      catchError((error) => {
        console.warn('Real backend not available, using mock backend:', error);
        return this.uploadWithMockBackend(file);
      })
    );
  }

  private uploadWithMockBackend(file: File): Observable<any> {
    // Simulate upload progress
    this.simulateUploadProgress();
    
    return this.mockBackend.mockUploadReceipt().pipe(
      switchMap((response) => {
        this.uploadProgressSubject.next({
          receiptId: response.receiptId,
          progress: 100,
          status: 'processing',
          message: '영수증 분석 중...'
        });

        // Start polling for processing status with mock backend
        this.startMockProcessingStatusPolling(response.receiptId);
        return [response];
      })
    );
  }

  private simulateUploadProgress(): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      
      this.uploadProgressSubject.next({
        progress,
        status: 'uploading',
        message: `업로드 중... ${Math.round(progress)}%`
      });
    }, 200);
  }

  private startProcessingStatusPolling(receiptId: string): void {
    // Poll every 2 seconds for processing status
    interval(2000).pipe(
      switchMap(() => this.getProcessingStatus(receiptId)),
      takeWhile((status) => status.status === 'pending' || status.status === 'processing', true)
    ).subscribe({
      next: (status) => {
        this.processingStatusSubject.next(status);
        
        // Update upload progress based on processing status
        if (status.status === 'completed') {
          this.uploadProgressSubject.next({
            receiptId: status.receiptId,
            progress: 100,
            status: 'completed',
            message: '영수증 분석 완료!'
          });
        } else if (status.status === 'failed') {
          this.uploadProgressSubject.next({
            receiptId: status.receiptId,
            progress: 100,
            status: 'failed',
            message: '영수증 분석 실패',
            error: status.error
          });
        } else {
          this.uploadProgressSubject.next({
            receiptId: status.receiptId,
            progress: status.progress,
            status: 'processing',
            message: status.currentStep
          });
        }
      },
      error: (error) => {
        console.error('Error polling processing status:', error);
        this.uploadProgressSubject.next({
          receiptId,
          progress: 100,
          status: 'failed',
          message: '상태 확인 실패',
          error: error.message
        });
      }
    });
  }

  private startMockProcessingStatusPolling(receiptId: string): void {
    // Poll every 2 seconds for processing status using mock backend
    interval(2000).pipe(
      switchMap(() => this.mockBackend.mockGetProcessingStatus(receiptId)),
      takeWhile((status) => status.status === 'pending' || status.status === 'processing', true)
    ).subscribe({
      next: (status) => {
        this.processingStatusSubject.next(status);
        
        // Update upload progress based on processing status
        if (status.status === 'completed') {
          this.uploadProgressSubject.next({
            receiptId: status.receiptId,
            progress: 100,
            status: 'completed',
            message: '영수증 분석 완료!'
          });
        } else if (status.status === 'failed') {
          this.uploadProgressSubject.next({
            receiptId: status.receiptId,
            progress: 100,
            status: 'failed',
            message: '영수증 분석 실패',
            error: status.error
          });
        } else {
          this.uploadProgressSubject.next({
            receiptId: status.receiptId,
            progress: status.progress,
            status: 'processing',
            message: status.currentStep
          });
        }
      },
      error: (error) => {
        console.error('Error polling mock processing status:', error);
        this.uploadProgressSubject.next({
          receiptId,
          progress: 100,
          status: 'failed',
          message: '상태 확인 실패',
          error: error.message
        });
      }
    });
  }

  private getProcessingStatus(receiptId: string): Observable<ProcessingStatus> {
    return this.http.get<ProcessingStatus>(`${environment.apiUrl}/receipts/${receiptId}/status`).pipe(
      catchError((error) => {
        console.warn('Real backend not available for status check, using mock backend:', error);
        return this.mockBackend.mockGetProcessingStatus(receiptId);
      })
    );
  }

  resetProgress(): void {
    this.uploadProgressSubject.next({
      progress: 0,
      status: 'idle',
      message: ''
    });
    this.processingStatusSubject.next(null);
  }

  getCurrentProgress(): UploadProgress {
    return this.uploadProgressSubject.value;
  }

  getCurrentProcessingStatus(): ProcessingStatus | null {
    return this.processingStatusSubject.value;
  }
}