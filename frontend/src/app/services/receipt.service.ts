import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Receipt } from '../models/receipt.model';
import { BudgetService } from './budget.service';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private budgetService: BudgetService
  ) {}

  // 영수증 업로드 (자동 여행 계획 할당 포함)
  uploadReceipt(receiptData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/receipts/upload`, receiptData)
      .pipe(
        switchMap((response: any) => {
          // 업로드 성공 후 자동으로 여행 계획 할당
          if (response.success && response.data) {
            return this.autoAssignToTravelPlan(response.data);
          }
          return [response];
        }),
        catchError(this.handleError)
      );
  }

  // 자동 여행 계획 할당
  private autoAssignToTravelPlan(receipt: Receipt): Observable<any> {
    return this.budgetService.getTravelPlans().pipe(
      map(plans => {
        const purchaseDate = new Date(receipt.purchaseDate);
        
        // 해당 날짜에 포함되는 여행 계획 찾기
        const matchingPlan = plans.find(plan => {
          const startDate = new Date(plan.startDate);
          const endDate = new Date(plan.endDate);
          return purchaseDate >= startDate && purchaseDate <= endDate;
        });

        if (matchingPlan) {
          // 여행 계획에 자동 할당
          this.assignReceiptToTravelPlan(receipt.id, matchingPlan.id).subscribe({
            next: () => {
              console.log(`영수증이 여행 계획 "${matchingPlan.name}"에 자동 할당되었습니다.`);
            },
            error: (error) => {
              console.error('자동 여행 계획 할당 오류:', error);
            }
          });
        }

        return receipt;
      }),
      catchError(error => {
        console.error('여행 계획 조회 오류:', error);
        return [receipt];
      })
    );
  }

  // 영수증 목록 조회
  getReceipts(params?: any): Observable<Receipt[]> {
    let queryParams = '';
    if (params) {
      queryParams = '?' + new URLSearchParams(params).toString();
    }
    
    return this.http.get<any>(`${this.apiUrl}/receipts${queryParams}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // 영수증 상세 조회
  getReceiptById(id: string): Observable<Receipt> {
    return this.http.get<any>(`${this.apiUrl}/receipts/${id}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // 여행 계획별 영수증 조회
  getReceiptsByTravelPlan(travelPlanId: string): Observable<Receipt[]> {
    return this.http.get<any>(`${this.apiUrl}/receipts?travelPlanId=${travelPlanId}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // 영수증을 여행 계획에 할당
  assignReceiptToTravelPlan(receiptId: string, travelPlanId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/receipts/${receiptId}/travel-plan`, { travelPlanId })
      .pipe(
        catchError(this.handleError)
      );
  }

  // 여행 계획에서 영수증 제거
  removeReceiptFromTravelPlan(receiptId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/receipts/${receiptId}/travel-plan`, { travelPlanId: null })
      .pipe(
        catchError(this.handleError)
      );
  }

  // 처리 상태 업데이트
  updateProcessingStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/receipts/${id}/status`, { status })
      .pipe(
        catchError(this.handleError)
      );
  }

  // 영수증 삭제
  deleteReceipt(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/receipts/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // 최근 영수증 조회
  getRecentReceipts(limit: number = 5): Observable<Receipt[]> {
    return this.getReceipts({ limit, page: 1 });
  }

  // 에러 핸들링
  private handleError(error: any) {
    console.error('ReceiptService 오류:', error);
    return throwError(() => new Error(error.error?.message || '서버 오류가 발생했습니다.'));
  }
}