import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { BudgetSummary, CategoryExpense, TravelPlan } from '../models/budget.model';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = `${environment.apiUrl}/budget`;

  constructor(
    private http: HttpClient,
    private appState: AppStateService
  ) {}

  getBudgetSummary(month?: Date): Observable<BudgetSummary> {
    const params = month ? `?month=${month.toISOString()}` : '';
    return this.http.get<BudgetSummary>(`${this.apiUrl}/summary${params}`).pipe(
      tap(summary => this.appState.setBudgetSummary(summary))
    );
  }

  getCategoryExpenses(month?: Date): Observable<CategoryExpense[]> {
    const params = month ? `?month=${month.toISOString()}` : '';
    return this.http.get<CategoryExpense[]>(`${this.apiUrl}/categories${params}`);
  }

  getDailyExpenses(month?: Date): Observable<{ date: string; amount: number }[]> {
    const params = month ? `?month=${month.toISOString()}` : '';
    return this.http.get<{ date: string; amount: number }[]>(`${this.apiUrl}/daily${params}`);
  }

  getTravelPlans(): Observable<TravelPlan[]> {
    return this.http.get<TravelPlan[]>(`${environment.apiUrl}/travel-plans`).pipe(
      tap(plans => this.appState.setTravelPlans(plans))
    );
  }

  createTravelPlan(plan: Omit<TravelPlan, 'id' | 'spent' | 'receipts'>): Observable<TravelPlan> {
    return this.http.post<TravelPlan>(`${environment.apiUrl}/travel-plans`, plan).pipe(
      tap(newPlan => this.appState.addTravelPlan(newPlan))
    );
  }

  updateTravelPlan(id: string, plan: Partial<TravelPlan>): Observable<TravelPlan> {
    return this.http.put<TravelPlan>(`${environment.apiUrl}/travel-plans/${id}`, plan).pipe(
      tap(updatedPlan => this.appState.updateTravelPlan(updatedPlan))
    );
  }

  deleteTravelPlan(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/travel-plans/${id}`).pipe(
      tap(() => {
        const currentPlans = this.appState.currentState.travelPlans.filter(p => p.id !== id);
        this.appState.setTravelPlans(currentPlans);
      })
    );
  }
}