import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonItem,
  IonLabel,
  IonInput,
  IonDatetime,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  ModalController,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  calendarOutline,
  saveOutline,
  closeOutline
} from 'ionicons/icons';
import { TravelPlan } from '../models/budget.model';
import { BudgetService } from '../services/budget.service';

@Component({
  selector: 'app-travel-plan-creator-modal',
  templateUrl: './travel-plan-creator-modal.component.html',
  styleUrls: ['./travel-plan-creator-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonItem,
    IonLabel,
    IonInput,
    IonDatetime,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon
  ]
})
export class TravelPlanCreatorModalComponent implements OnInit {
  travelPlan: {
    name: string;
    startDate: string;
    endDate: string;
    budget: number;
    description: string;
  } = {
    name: '',
    startDate: '',
    endDate: '',
    budget: 0,
    description: ''
  };

  minDate = new Date().toISOString();
  selectedDate = new Date().toISOString();
  isCreating = false;
  isSelectingStartDate = true;
  highlightedDates: any[] = [];

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController,
    private budgetService: BudgetService
  ) {
    addIcons({
      calendarOutline,
      saveOutline,
      closeOutline
    });
  }

  ngOnInit() {
    // 기본값 설정
    const today = new Date();
    this.selectedDate = today.toISOString();
  }

  onDateSelected(event: any) {
    const selectedDate = new Date(event.detail.value);
    
    if (this.isSelectingStartDate) {
      // 시작일 선택
      this.travelPlan.startDate = selectedDate.toISOString();
      this.isSelectingStartDate = false;
      this.updateHighlightedDates();
      this.showToast('시작일이 선택되었습니다. 이제 종료일을 선택해주세요.');
    } else {
      // 종료일 선택
      const startDate = new Date(this.travelPlan.startDate);
      
      if (selectedDate < startDate) {
        this.showError('종료일은 시작일보다 이후여야 합니다.');
        return;
      }
      
      this.travelPlan.endDate = selectedDate.toISOString();
      this.isSelectingStartDate = true;
      this.updateHighlightedDates();
      this.showToast('여행 기간이 설정되었습니다.');
    }
  }

  private updateHighlightedDates() {
    this.highlightedDates = [];
    
    if (this.travelPlan.startDate && this.travelPlan.endDate) {
      const startDate = new Date(this.travelPlan.startDate);
      const endDate = new Date(this.travelPlan.endDate);
      
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        this.highlightedDates.push({
          date: currentDate.toISOString().split('T')[0],
          textColor: '#ffffff',
          backgroundColor: '#3880ff'
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (this.travelPlan.startDate) {
      // 시작일만 선택된 경우
      this.highlightedDates.push({
        date: this.travelPlan.startDate.split('T')[0],
        textColor: '#ffffff',
        backgroundColor: '#3880ff'
      });
    }
  }

  getDateRangeDays(): number {
    if (!this.travelPlan.startDate || !this.travelPlan.endDate) {
      return 0;
    }
    
    const startDate = new Date(this.travelPlan.startDate);
    const endDate = new Date(this.travelPlan.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // 시작일과 종료일 포함
  }

  async saveTravelPlan() {
    if (!this.validateForm()) {
      return;
    }

    this.isCreating = true;

    try {
      const newTravelPlan: TravelPlan = {
        id: Date.now().toString(), // 임시 ID 생성
        name: this.travelPlan.name,
        startDate: new Date(this.travelPlan.startDate),
        endDate: new Date(this.travelPlan.endDate),
        budget: this.travelPlan.budget,
        spent: 0,
        receipts: [],
        description: this.travelPlan.description,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 여행 계획 저장
      await this.budgetService.createTravelPlan(newTravelPlan).toPromise();
      
      const toast = await this.toastController.create({
        message: '여행 계획이 생성되었습니다.',
        duration: 2000,
        position: 'top',
        color: 'success'
      });
      toast.present();

      // 모달 닫고 생성된 여행 계획 반환
      this.modalController.dismiss(newTravelPlan);
    } catch (error) {
      console.error('Error creating travel plan:', error);
      
      const alert = await this.alertController.create({
        header: '오류',
        message: '여행 계획 생성에 실패했습니다.',
        buttons: ['확인']
      });
      alert.present();
    } finally {
      this.isCreating = false;
    }
  }

  private validateForm(): boolean {
    if (!this.travelPlan.name || this.travelPlan.name.trim() === '') {
      this.showError('여행 계획 이름을 입력해주세요.');
      return false;
    }

    if (!this.travelPlan.startDate || !this.travelPlan.endDate) {
      this.showError('여행 기간을 선택해주세요.');
      return false;
    }

    const startDate = new Date(this.travelPlan.startDate);
    const endDate = new Date(this.travelPlan.endDate);

    if (startDate > endDate) {
      this.showError('시작일은 종료일보다 이전이어야 합니다.');
      return false;
    }

    return true;
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
    toast.present();
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top',
      color: 'primary'
    });
    toast.present();
  }

  dismiss() {
    this.modalController.dismiss();
  }
} 