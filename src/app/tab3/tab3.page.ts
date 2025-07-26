import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle, 
  IonCardContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { BudgetService } from '../services/budget.service';
import { BudgetSummary, CategoryExpense, TravelPlan } from '../models/budget.model';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
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
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardSubtitle, 
    IonCardContent, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonProgressBar,
    IonSegment,
    IonSegmentButton,
    IonRefresher,
    IonRefresherContent
  ],
})
export class Tab3Page implements OnInit, AfterViewInit {
  @ViewChild('dailyChart', { static: false }) dailyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart', { static: false }) categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyChart', { static: false }) monthlyChartRef!: ElementRef<HTMLCanvasElement>;

  currentMonth: Date = new Date();
  selectedPeriod: string = 'daily';
  totalExpense: number = 0;
  averageDaily: number = 0;
  receiptCount: number = 0;
  categoryExpenses: CategoryExpense[] = [];
  travelPlans: TravelPlan[] = [];

  private dailyChart?: Chart;
  private categoryChart?: Chart;
  private monthlyChart?: Chart;

  constructor(private budgetService: BudgetService) {}

  ngOnInit() {
    this.loadBudgetData();
  }

  ngAfterViewInit() {
    // Initialize charts after view is ready
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  async doRefresh(event: any) {
    await this.loadBudgetData();
    event.target.complete();
  }

  onPeriodChange(event: any) {
    this.selectedPeriod = event.detail.value;
    this.updateChartsForPeriod();
  }

  openDatePicker() {
    // TODO: Implement date picker for month selection
    console.log('Opening date picker');
  }

  private async loadBudgetData() {
    try {
      // Load budget summary
      this.budgetService.getBudgetSummary(this.currentMonth).subscribe({
        next: (summary) => {
          this.totalExpense = summary.totalExpense;
          this.averageDaily = summary.averageDaily;
          this.receiptCount = summary.receiptCount;
        },
        error: (error) => {
          console.error('Error loading budget summary:', error);
          // Fallback to mock data
          this.totalExpense = 150000;
          this.averageDaily = 5000;
          this.receiptCount = 12;
        }
      });

      // Load category expenses
      this.budgetService.getCategoryExpenses(this.currentMonth).subscribe({
        next: (categories) => {
          this.categoryExpenses = categories;
          this.updateCategoryChart();
        },
        error: (error) => {
          console.error('Error loading category expenses:', error);
          // Fallback to mock data
          this.categoryExpenses = [
            { name: '식비', amount: 80000, percentage: 53 },
            { name: '쇼핑', amount: 45000, percentage: 30 },
            { name: '교통비', amount: 15000, percentage: 10 },
            { name: '기타', amount: 10000, percentage: 7 }
          ];
          this.updateCategoryChart();
        }
      });

      // Load travel plans
      this.budgetService.getTravelPlans().subscribe({
        next: (plans) => {
          this.travelPlans = plans.map(plan => ({
            ...plan,
            startDate: new Date(plan.startDate),
            endDate: new Date(plan.endDate)
          }));
        },
        error: (error) => {
          console.error('Error loading travel plans:', error);
          // Fallback to mock data
          this.travelPlans = [
            {
              id: '1',
              name: '도쿄 여행',
              startDate: new Date('2024-01-15'),
              endDate: new Date('2024-01-20'),
              budget: 500000,
              spent: 350000,
              receipts: []
            },
            {
              id: '2',
              name: '오사카 여행',
              startDate: new Date('2024-02-10'),
              endDate: new Date('2024-02-15'),
              budget: 400000,
              spent: 280000,
              receipts: []
            }
          ];
        }
      });

      // Load daily expenses for chart
      this.budgetService.getDailyExpenses(this.currentMonth).subscribe({
        next: (dailyExpenses) => {
          this.updateDailyChart(dailyExpenses);
        },
        error: (error) => {
          console.error('Error loading daily expenses:', error);
          // Initialize chart with mock data
          this.updateDailyChart();
        }
      });

    } catch (error) {
      console.error('Error in loadBudgetData:', error);
    }
  }

  private initializeCharts() {
    this.initializeDailyChart();
    this.initializeCategoryChart();
    this.initializeMonthlyChart();
  }

  private initializeDailyChart() {
    if (!this.dailyChartRef?.nativeElement) return;

    const ctx = this.dailyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.dailyChart) {
      this.dailyChart.destroy();
    }

    this.dailyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: '일별 지출',
          data: [],
          borderColor: '#3880ff',
          backgroundColor: 'rgba(56, 128, 255, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₩' + (Number(value) / 1000).toFixed(0) + 'k';
              }
            }
          }
        }
      }
    });
  }

  private initializeCategoryChart() {
    if (!this.categoryChartRef?.nativeElement) return;

    const ctx = this.categoryChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            '#3880ff',
            '#10dc60',
            '#ffce00',
            '#f04141',
            '#7044ff',
            '#ff6600'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  }

  private initializeMonthlyChart() {
    if (!this.monthlyChartRef?.nativeElement) return;

    const ctx = this.monthlyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }

    // Generate mock monthly data for the last 6 months
    const monthlyData = this.generateMonthlyMockData();

    this.monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthlyData.labels,
        datasets: [{
          label: '월별 지출',
          data: monthlyData.data,
          backgroundColor: 'rgba(56, 128, 255, 0.8)',
          borderColor: '#3880ff',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₩' + (Number(value) / 1000).toFixed(0) + 'k';
              }
            }
          }
        }
      }
    });
  }

  private updateDailyChart(dailyExpenses?: { date: string; amount: number }[]) {
    if (!this.dailyChart) return;

    // Use provided data or fallback to mock data
    const mockData = this.generateDailyMockData();
    const data = dailyExpenses || mockData;

    this.dailyChart.data.labels = data.map(d => {
      const date = new Date(d.date);
      return date.getDate() + '일';
    });
    this.dailyChart.data.datasets[0].data = data.map(d => d.amount);
    this.dailyChart.update();
  }

  private updateCategoryChart() {
    if (!this.categoryChart || this.categoryExpenses.length === 0) return;

    this.categoryChart.data.labels = this.categoryExpenses.map(c => c.name);
    this.categoryChart.data.datasets[0].data = this.categoryExpenses.map(c => c.amount);
    this.categoryChart.update();
  }

  private updateChartsForPeriod() {
    if (this.selectedPeriod === 'daily') {
      this.updateDailyChart();
    } else if (this.selectedPeriod === 'monthly') {
      // Monthly chart is already initialized with data
      if (this.monthlyChart) {
        this.monthlyChart.update();
      }
    }
  }

  private generateDailyMockData(): { date: string; amount: number }[] {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      data.push({
        date: date.toISOString(),
        amount: Math.floor(Math.random() * 20000) + 5000
      });
    }
    
    return data;
  }

  private generateMonthlyMockData(): { labels: string[]; data: number[] } {
    const labels = [];
    const data = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      labels.push(date.toLocaleDateString('ko-KR', { month: 'short' }));
      data.push(Math.floor(Math.random() * 200000) + 100000);
    }
    
    return { labels, data };
  }
}