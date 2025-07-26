import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Receipt, ReceiptUploadResponse } from '../models/receipt.model';
import { AppStateService } from './app-state.service';
import { MockBackendService } from './mock-backend.service';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private apiUrl = `${environment.apiUrl}/receipts`;

  constructor(
    private http: HttpClient,
    private appState: AppStateService,
    private mockBackend: MockBackendService
  ) {}

  uploadReceipt(imageFile: File): Observable<ReceiptUploadResponse> {
    const formData = new FormData();
    formData.append('receipt', imageFile);
    
    return this.http.post<ReceiptUploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  getReceipts(page: number = 1, limit: number = 20, filters?: any): Observable<Receipt[]> {
    let params = `page=${page}&limit=${limit}`;
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params += `&${key}=${encodeURIComponent(filters[key])}`;
        }
      });
    }
    
    return this.http.get<Receipt[]>(`${this.apiUrl}?${params}`).pipe(
      tap(receipts => {
        if (page === 1) {
          this.appState.setReceipts(receipts);
        }
      }),
      catchError((error) => {
        console.warn('Real backend not available for getReceipts, using mock backend:', error);
        return this.mockBackend.mockGetReceipts(filters).pipe(
          tap(receipts => {
            if (page === 1) {
              this.appState.setReceipts(receipts);
            }
          })
        );
      })
    );
  }

  getReceiptById(id: string): Observable<Receipt> {
    return this.http.get<Receipt>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.warn('Real backend not available for getReceiptById, using mock backend:', error);
        return this.mockBackend.mockGetReceiptById(id);
      })
    );
  }

  getRecentReceipts(limit: number = 5): Observable<Receipt[]> {
    return this.http.get<Receipt[]>(`${this.apiUrl}/recent?limit=${limit}`).pipe(
      tap(receipts => this.appState.setRecentReceipts(receipts)),
      catchError((error) => {
        console.warn('Real backend not available for getRecentReceipts, using mock backend:', error);
        return this.mockBackend.mockGetRecentReceipts(limit).pipe(
          tap(receipts => this.appState.setRecentReceipts(receipts))
        );
      })
    );
  }

  searchReceipts(query: string, filters?: any): Observable<Receipt[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
    }
    
    return this.http.get<Receipt[]>(`${this.apiUrl}/search?${params.toString()}`);
  }

  deleteReceipt(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.appState.removeReceipt(id))
    );
  }
}