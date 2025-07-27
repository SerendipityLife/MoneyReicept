import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonIcon,
  IonChip,
  IonSearchbar,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, locationOutline, timeOutline, checkmarkOutline, addOutline, createOutline, trashOutline } from 'ionicons/icons';
import { TravelPlan } from '../models/budget.model';
import { BudgetService } from '../services/budget.service';
import { TravelPlanCreatorModalComponent } from './travel-plan-creator-modal.component';
import { TravelPlanEditorModalComponent } from './travel-plan-editor-modal.component';

@Component({
  selector: 'app-travel-plan-selector-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>여행 계획 선택</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">닫기</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="header-actions">
        <ion-button fill="outline" (click)="createNewPlan()">
          <ion-icon name="add-outline" slot="start"></ion-icon>
          새 여행 계획 만들기
        </ion-button>
      </div>

      <ion-searchbar
        [(ngModel)]="searchTerm"
        placeholder="여행 계획 검색"
        (ionInput)="filterPlans()"
        debounce="300">
      </ion-searchbar>

      <ion-list>
        <ion-item-sliding *ngFor="let plan of filteredPlans">
          <ion-item (click)="selectPlan(plan)">
            <ion-label>
              <h2>{{ plan.name }}</h2>
              <p>
                <ion-icon name="calendar-outline"></ion-icon>
                {{ plan.startDate | date:'yyyy.MM.dd' }} - {{ plan.endDate | date:'yyyy.MM.dd' }}
              </p>
              <p *ngIf="plan.budget > 0">
                <ion-icon name="location-outline"></ion-icon>
                예산: {{ plan.budget | currency:'KRW' }}
              </p>
              <p *ngIf="plan.description">
                {{ plan.description }}
              </p>
              <div class="plan-status">
                <ion-chip [color]="getPlanStatusColor(plan)" size="small">
                  {{ getPlanStatusText(plan) }}
                </ion-chip>
              </div>
            </ion-label>
            <ion-icon 
              *ngIf="selectedPlanId === plan.id" 
              name="checkmark-outline" 
              color="primary"
              slot="end">
            </ion-icon>
          </ion-item>
          
          <ion-item-options side="end">
            <ion-item-option color="primary" (click)="editPlan(plan)">
              <ion-icon name="create-outline" slot="icon-only"></ion-icon>
            </ion-item-option>
            <ion-item-option color="danger" (click)="deletePlan(plan)">
              <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <div *ngIf="filteredPlans.length === 0" class="no-plans">
        <ion-icon name="calendar-outline" size="large"></ion-icon>
        <h3>여행 계획이 없습니다</h3>
        <p>새로운 여행 계획을 만들어보세요</p>
        <ion-button fill="outline" (click)="createNewPlan()">
          <ion-icon name="add-outline" slot="start"></ion-icon>
          새 여행 계획 만들기
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .header-actions {
      padding: 16px;
      border-bottom: 1px solid var(--ion-color-light);
    }
    
    .plan-status {
      margin-top: 8px;
    }
    
    .no-plans {
      text-align: center;
      padding: 40px 20px;
      color: var(--ion-color-medium);
    }
    
    .no-plans ion-icon {
      font-size: 64px;
      margin-bottom: 16px;
      color: var(--ion-color-medium);
    }
    
    .no-plans h3 {
      margin-bottom: 8px;
      color: var(--ion-color-dark);
    }
    
    .no-plans p {
      margin-bottom: 24px;
      color: var(--ion-color-medium);
    }
    
    ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
    }
    
    ion-item h2 {
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    ion-item p {
      margin: 2px 0;
      font-size: 14px;
      color: var(--ion-color-medium);
    }
    
    ion-icon {
      margin-right: 4px;
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
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonIcon,
    IonChip,
    IonSearchbar,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
  ]
})
export class TravelPlanSelectorModalComponent implements OnInit {
  travelPlans: TravelPlan[] = [];
  filteredPlans: TravelPlan[] = [];
  searchTerm: string = '';
  selectedPlanId: string | null = null;

  constructor(
    private budgetService: BudgetService,
    private modalController: ModalController,
    private toastController: ToastController
  ) {
    addIcons({
      calendarOutline,
      locationOutline,
      timeOutline,
      checkmarkOutline,
      addOutline,
      createOutline,
      trashOutline
    });
  }

  ngOnInit() {
    this.loadTravelPlans();
  }

  async loadTravelPlans() {
    try {
      this.budgetService.getTravelPlans().subscribe({
        next: (plans) => {
          this.travelPlans = plans;
          this.filteredPlans = [...this.travelPlans];
        },
        error: (error) => {
          console.error('여행 계획 로드 오류:', error);
          // Mock data for development
          this.travelPlans = [
            {
              id: '1',
              name: '도쿄 여행 2025',
              startDate: new Date('2025-01-15'),
              endDate: new Date('2025-01-22'),
              budget: 500000,
              spent: 0,
              receipts: [],
              description: '도쿄 7박 8일 여행'
            },
            {
              id: '2',
              name: '오사카 여행',
              startDate: new Date('2025-03-10'),
              endDate: new Date('2025-03-15'),
              budget: 300000,
              spent: 0,
              receipts: [],
              description: '오사카 5박 6일 여행'
            }
          ];
          this.filteredPlans = [...this.travelPlans];
        }
      });
    } catch (error) {
      console.error('여행 계획 로드 오류:', error);
    }
  }

  filterPlans() {
    if (!this.searchTerm.trim()) {
      this.filteredPlans = [...this.travelPlans];
    } else {
      this.filteredPlans = this.travelPlans.filter(plan =>
        plan.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  selectPlan(plan: TravelPlan) {
    this.selectedPlanId = plan.id;
    this.dismiss(plan);
  }

  async editPlan(plan: TravelPlan) {
    const modal = await this.modalController.create({
      component: TravelPlanEditorModalComponent,
      componentProps: {
        travelPlan: plan
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        if (result.role === 'delete') {
          // 삭제된 경우 목록에서 제거
          this.travelPlans = this.travelPlans.filter(p => p.id !== result.data.id);
          this.filteredPlans = [...this.travelPlans];
          this.showToast('여행 계획이 삭제되었습니다.');
        } else {
          // 수정된 경우 목록 업데이트
          const index = this.travelPlans.findIndex(p => p.id === result.data.id);
          if (index !== -1) {
            this.travelPlans[index] = result.data;
            this.filteredPlans = [...this.travelPlans];
            this.showToast('여행 계획이 수정되었습니다.');
          }
        }
      }
    });

    return await modal.present();
  }

  async deletePlan(plan: TravelPlan) {
    // 편집 모달을 통해 삭제 처리
    await this.editPlan(plan);
  }

  getPlanStatusColor(plan: TravelPlan): string {
    const today = new Date();
    const startDate = new Date(plan.startDate);
    const endDate = new Date(plan.endDate);

    if (today >= startDate && today <= endDate) {
      return 'success';
    } else if (today < startDate) {
      return 'warning';
    } else {
      return 'medium';
    }
  }

  getPlanStatusText(plan: TravelPlan): string {
    const today = new Date();
    const startDate = new Date(plan.startDate);
    const endDate = new Date(plan.endDate);

    if (today >= startDate && today <= endDate) {
      return '진행중';
    } else if (today < startDate) {
      return '예정';
    } else {
      return '완료';
    }
  }

  async createNewPlan() {
    const modal = await this.modalController.create({
      component: TravelPlanCreatorModalComponent
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        // 새로 생성된 여행 계획을 목록에 추가
        this.travelPlans.unshift(result.data);
        this.filteredPlans = [...this.travelPlans];
        
        // 생성된 여행 계획을 자동으로 선택
        this.selectPlan(result.data);
      }
    });

    return await modal.present();
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top',
      color: 'success'
    });
    toast.present();
  }

  dismiss(selectedPlan?: TravelPlan) {
    this.modalController.dismiss(selectedPlan, 'select');
  }
} 