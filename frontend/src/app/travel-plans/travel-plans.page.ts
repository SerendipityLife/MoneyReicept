import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonProgressBar,
  IonChip,
  IonFab,
  IonFabButton,
  IonRefresher,
  IonRefresherContent,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  ModalController,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { BudgetService } from '../services/budget.service';
import { TravelPlan } from '../models/budget.model';
import { TravelPlanModalComponent } from '../components/travel-plan-modal.component';

@Component({
  selector: 'app-travel-plans',
  templateUrl: './travel-plans.page.html',
  styleUrls: ['./travel-plans.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
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
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonProgressBar,
    IonChip,
    IonFab,
    IonFabButton,
    IonRefresher,
    IonRefresherContent,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
  ]
})
export class TravelPlansPage implements OnInit {
  travelPlans: TravelPlan[] = [];
  isLoading: boolean = false;

  constructor(
    private budgetService: BudgetService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadTravelPlans();
  }

  async doRefresh(event: any) {
    await this.loadTravelPlans();
    event.target.complete();
  }

  async openCreateModal() {
    const modal = await this.modalController.create({
      component: TravelPlanModalComponent
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'save') {
        this.loadTravelPlans();
      }
    });

    return await modal.present();
  }

  async openEditModal(plan: TravelPlan) {
    const modal = await this.modalController.create({
      component: TravelPlanModalComponent,
      componentProps: {
        existingPlan: plan
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'save') {
        this.loadTravelPlans();
      }
    });

    return await modal.present();
  }

  async deletePlan(plan: TravelPlan) {
    const alert = await this.alertController.create({
      header: '여행 일정 삭제',
      message: `"${plan.name}" 일정을 삭제하시겠습니까?`,
      buttons: [
        {
          text: '취소',
          role: 'cancel'
        },
        {
          text: '삭제',
          role: 'destructive',
          handler: async () => {
            try {
              await this.budgetService.deleteTravelPlan(plan.id).toPromise();
              await this.showToast('여행 일정이 삭제되었습니다');
              this.loadTravelPlans();
            } catch (error) {
              console.error('Error deleting travel plan:', error);
              await this.showToast('삭제 중 오류가 발생했습니다', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  viewPlanDetails(plan: TravelPlan) {
    // Navigate to detailed view or expand inline
    console.log('View plan details:', plan);
  }

  getProgressColor(plan: TravelPlan): string {
    const percentage = (plan.spent / plan.budget) * 100;
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'primary';
  }

  getProgressPercentage(plan: TravelPlan): number {
    return Math.min((plan.spent / plan.budget) * 100, 100);
  }

  getRemainingBudget(plan: TravelPlan): number {
    return Math.max(plan.budget - plan.spent, 0);
  }

  getDaysRemaining(plan: TravelPlan): number {
    const today = new Date();
    const endDate = new Date(plan.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
  }

  getDailyBudgetRemaining(plan: TravelPlan): number {
    const daysRemaining = this.getDaysRemaining(plan);
    const remainingBudget = this.getRemainingBudget(plan);
    return daysRemaining > 0 ? remainingBudget / daysRemaining : 0;
  }

  get activePlans(): TravelPlan[] {
    return this.travelPlans.filter(plan => this.isPlanActive(plan));
  }

  get upcomingPlans(): TravelPlan[] {
    return this.travelPlans.filter(plan => this.isPlanUpcoming(plan));
  }

  get completedPlans(): TravelPlan[] {
    return this.travelPlans.filter(plan => this.isPlanCompleted(plan));
  }

  isPlanActive(plan: TravelPlan): boolean {
    const today = new Date();
    const startDate = new Date(plan.startDate);
    const endDate = new Date(plan.endDate);
    return today >= startDate && today <= endDate;
  }

  isPlanUpcoming(plan: TravelPlan): boolean {
    const today = new Date();
    const startDate = new Date(plan.startDate);
    return today < startDate;
  }

  isPlanCompleted(plan: TravelPlan): boolean {
    const today = new Date();
    const endDate = new Date(plan.endDate);
    return today > endDate;
  }

  private async loadTravelPlans() {
    this.isLoading = true;
    
    try {
      this.budgetService.getTravelPlans().subscribe({
        next: (plans) => {
          this.travelPlans = plans.map(plan => ({
            ...plan,
            startDate: new Date(plan.startDate),
            endDate: new Date(plan.endDate)
          })).sort((a, b) => {
            // Sort by start date, with active plans first
            if (this.isPlanActive(a) && !this.isPlanActive(b)) return -1;
            if (!this.isPlanActive(a) && this.isPlanActive(b)) return 1;
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          });
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
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error in loadTravelPlans:', error);
      this.isLoading = false;
    }
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}