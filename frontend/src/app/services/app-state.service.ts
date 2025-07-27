import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Receipt } from '../models/receipt.model';
import { BudgetSummary, TravelPlan } from '../models/budget.model';

export interface AppState {
  receipts: Receipt[];
  recentReceipts: Receipt[];
  budgetSummary: BudgetSummary | null;
  travelPlans: TravelPlan[];
  selectedTravelPlan: TravelPlan | null;
  isOnline: boolean;
}

const initialState: AppState = {
  receipts: [],
  recentReceipts: [],
  budgetSummary: null,
  travelPlans: [],
  selectedTravelPlan: null,
  isOnline: navigator.onLine
};

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  private stateSubject = new BehaviorSubject<AppState>(initialState);
  
  get state$(): Observable<AppState> {
    return this.stateSubject.asObservable();
  }

  get currentState(): AppState {
    return this.stateSubject.value;
  }

  // Receipt state management
  setReceipts(receipts: Receipt[]): void {
    this.updateState({ receipts });
  }

  addReceipt(receipt: Receipt): void {
    const receipts = [...this.currentState.receipts, receipt];
    this.updateState({ receipts });
  }

  updateReceipt(updatedReceipt: Receipt): void {
    const receipts = this.currentState.receipts.map(receipt =>
      receipt.id === updatedReceipt.id ? updatedReceipt : receipt
    );
    this.updateState({ receipts });
  }

  removeReceipt(receiptId: string): void {
    const receipts = this.currentState.receipts.filter(receipt => receipt.id !== receiptId);
    this.updateState({ receipts });
  }

  setRecentReceipts(recentReceipts: Receipt[]): void {
    this.updateState({ recentReceipts });
  }

  // Budget state management
  setBudgetSummary(budgetSummary: BudgetSummary): void {
    this.updateState({ budgetSummary });
  }

  // Travel plan state management
  setTravelPlans(travelPlans: TravelPlan[]): void {
    this.updateState({ travelPlans });
  }

  addTravelPlan(travelPlan: TravelPlan): void {
    const travelPlans = [...this.currentState.travelPlans, travelPlan];
    this.updateState({ travelPlans });
  }

  updateTravelPlan(updatedPlan: TravelPlan): void {
    const travelPlans = this.currentState.travelPlans.map(plan =>
      plan.id === updatedPlan.id ? updatedPlan : plan
    );
    this.updateState({ travelPlans });
  }

  setSelectedTravelPlan(travelPlan: TravelPlan | null): void {
    this.updateState({ selectedTravelPlan: travelPlan });
  }

  // Network state management
  setOnlineStatus(isOnline: boolean): void {
    this.updateState({ isOnline });
  }

  // Generic state update method
  private updateState(partialState: Partial<AppState>): void {
    const newState = { ...this.currentState, ...partialState };
    this.stateSubject.next(newState);
  }

  // Reset state (useful for logout or app reset)
  resetState(): void {
    this.stateSubject.next(initialState);
  }
}