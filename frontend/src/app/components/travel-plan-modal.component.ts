import { Component, Input, OnInit } from '@angular/core';
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
  IonItem,
  IonLabel,
  IonInput,
  IonDatetime,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { BudgetService } from '../services/budget.service';
import { TravelPlan } from '../models/budget.model';

@Component({
  selector: 'app-travel-plan-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ isEdit ? '여행 일정 수정' : '새 여행 일정' }}</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button (click)="save()" [disabled]="!isFormValid()">
            저장
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="travel-plan-form">
        <ion-list>
          <ion-item>
            <ion-label position="stacked">여행 이름</ion-label>
            <ion-input 
              [(ngModel)]="travelPlan.name" 
              placeholder="예: 도쿄 여행"
              required>
            </ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">시작 날짜</ion-label>
            <ion-datetime 
              [(ngModel)]="travelPlan.startDate"
              presentation="date"
              [max]="travelPlan.endDate"
              required>
            </ion-datetime>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">종료 날짜</ion-label>
            <ion-datetime 
              [(ngModel)]="travelPlan.endDate"
              presentation="date"
              [min]="travelPlan.startDate"
              required>
            </ion-datetime>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">예산 (원)</ion-label>
            <ion-input 
              [(ngModel)]="travelPlan.budget" 
              type="number"
              placeholder="500000"
              required>
            </ion-input>
          </ion-item>
        </ion-list>

        <div class="form-preview" *ngIf="isFormValid()">
          <ion-card>
            <ion-card-header>
              <ion-card-title>미리보기</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <h3>{{ travelPlan.name }}</h3>
              <p>
                {{ travelPlan.startDate | date:'yyyy.MM.dd' }} - 
                {{ travelPlan.endDate | date:'yyyy.MM.dd' }}
              </p>
              <p>예산: {{ travelPlan.budget | currency:'KRW':'symbol':'1.0-0' }}</p>
              <p>기간: {{ getTravelDuration() }}일</p>
              <p>일평균 예산: {{ getDailyBudget() | currency:'KRW':'symbol':'1.0-0' }}</p>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .travel-plan-form {
      padding: 16px;
    }

    .form-preview {
      margin-top: 20px;
    }

    ion-datetime {
      width: 100%;
    }
  `],
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
    IonItem,
    IonLabel,
    IonInput,
    IonDatetime,
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ]
})
export class TravelPlanModalComponent implements OnInit {
  @Input() existingPlan?: TravelPlan;
  
  travelPlan: Partial<TravelPlan> = {
    name: '',
    startDate: new Date(),
    endDate: new Date(),
    budget: 0
  };

  isEdit: boolean = false;

  constructor(
    private modalController: ModalController,
    private budgetService: BudgetService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    if (this.existingPlan) {
      this.isEdit = true;
      this.travelPlan = { ...this.existingPlan };
    } else {
      // Set default end date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.travelPlan.endDate = tomorrow;
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  async save() {
    if (!this.isFormValid()) return;

    try {
      if (this.isEdit && this.existingPlan) {
        await this.budgetService.updateTravelPlan(this.existingPlan.id, this.travelPlan).toPromise();
        await this.showToast('여행 일정이 수정되었습니다');
      } else {
        await this.budgetService.createTravelPlan(this.travelPlan as Omit<TravelPlan, 'id' | 'spent' | 'receipts'>).toPromise();
        await this.showToast('새 여행 일정이 생성되었습니다');
      }
      
      this.modalController.dismiss(this.travelPlan, 'save');
    } catch (error) {
      console.error('Error saving travel plan:', error);
      await this.showToast('저장 중 오류가 발생했습니다', 'danger');
    }
  }

  isFormValid(): boolean {
    return !!(
      this.travelPlan.name &&
      this.travelPlan.startDate &&
      this.travelPlan.endDate &&
      this.travelPlan.budget &&
      this.travelPlan.budget > 0 &&
      new Date(this.travelPlan.startDate) <= new Date(this.travelPlan.endDate)
    );
  }

  getTravelDuration(): number {
    if (!this.travelPlan.startDate || !this.travelPlan.endDate) return 0;
    
    const start = new Date(this.travelPlan.startDate);
    const end = new Date(this.travelPlan.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  getDailyBudget(): number {
    const duration = this.getTravelDuration();
    return duration > 0 ? (this.travelPlan.budget || 0) / duration : 0;
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