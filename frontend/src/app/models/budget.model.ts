export interface BudgetSummary {
  totalExpense: number;
  averageDaily: number;
  receiptCount: number;
  month: Date;
}

export interface CategoryExpense {
  name: string;
  amount: number;
  percentage: number;
}

export interface TravelPlan {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  receipts: string[]; // Receipt IDs
  description?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}