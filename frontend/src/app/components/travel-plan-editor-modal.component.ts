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
  IonAlert,
  ModalController,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  calendarOutline,
  saveOutline,
  closeOutline,
  trashOutline
} from 'ionicons/icons';
import { TravelPlan } from '../models/budget.model';
import { BudgetService } from '../services/budget.service';

@Component({
  selector: 'app-travel-plan-editor-modal',
  templateUrl: './travel-plan-editor-modal.component.html',
  styleUrls: ['./travel-plan-editor-modal.component.scss'],
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
export class TravelPlanEditorModalComponent implements OnInit {
  travelPlan!: TravelPlan;
  editedPlan!: {
    name: string;
    startDate: string;
    endDate: string;
    budget: number;
    description: string;
  };

  minDate = new Date().toISOString();
  isSaving = false;
  isDeleting = false;

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController,
    private budgetService: BudgetService
  ) {
    addIcons({
      calendarOutline,
      saveOutline,
      closeOutline,
      trashOutline
    });
  }

  ngOnInit() {
    // 여행 계획 데이터를 편집용으로 복사
    this.editedPlan = {
      name: this.travelPlan.name,
      startDate: this.travelPlan.startDate.toISOString(),
      endDate: this.travelPlan.endDate.toISOString(),
      budget: this.travelPlan.budget,
      description: this.travelPlan.description || ''
    };
  }

  async saveChanges() {
    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;

    try {
      const updatedPlan: Partial<TravelPlan> = {
        name: this.editedPlan.name,
        startDate: new Date(this.editedPlan.startDate),
        endDate: new Date(this.editedPlan.endDate),
        budget: this.editedPlan.budget,
        description: this.editedPlan.description,
        updatedAt: new Date()
      };

      // 여행 계획 업데이트
      await this.budgetService.updateTravelPlan(this.travelPlan.id, updatedPlan).toPromise();
      
      const toast = await this.toastController.create({
        message: '여행 계획이 수정되었습니다.',
        duration: 2000,
        position: 'top',
        color: 'success'
      });
      toast.present();

      // 모달 닫고 업데이트된 여행 계획 반환
      this.modalController.dismiss({ ...this.travelPlan, ...updatedPlan });
    } catch (error) {
      console.error('Error updating travel plan:', error);
      
      const alert = await this.alertController.create({
        header: '오류',
        message: '여행 계획 수정에 실패했습니다.',
        buttons: ['확인']
      });
      alert.present();
    } finally {
      this.isSaving = false;
    }
  }

  async deleteTravelPlan() {
    const alert = await this.alertController.create({
      header: '여행 계획 삭제',
      message: `'${this.travelPlan.name}' 여행 계획을 삭제하시겠습니까?`,
      buttons: [
        {
          text: '취소',
          role: 'cancel'
        },
        {
          text: '삭제',
          role: 'destructive',
          handler: () => {
            this.confirmDelete();
          }
        }
      ]
    });
    await alert.present();
  }

  private async confirmDelete() {
    this.isDeleting = true;

    try {
      await this.budgetService.deleteTravelPlan(this.travelPlan.id).toPromise();
      
      const toast = await this.toastController.create({
        message: '여행 계획이 삭제되었습니다.',
        duration: 2000,
        position: 'top',
        color: 'success'
      });
      toast.present();

      // 모달 닫고 삭제된 여행 계획 반환
      this.modalController.dismiss(this.travelPlan, 'delete');
    } catch (error) {
      console.error('Error deleting travel plan:', error);
      
      const alert = await this.alertController.create({
        header: '오류',
        message: '여행 계획 삭제에 실패했습니다.',
        buttons: ['확인']
      });
      alert.present();
    } finally {
      this.isDeleting = false;
    }
  }

  private validateForm(): boolean {
    if (!this.editedPlan.name || this.editedPlan.name.trim() === '') {
      this.showError('여행 계획 이름을 입력해주세요.');
      return false;
    }

    if (!this.editedPlan.startDate || !this.editedPlan.endDate) {
      this.showError('여행 기간을 선택해주세요.');
      return false;
    }

    const startDate = new Date(this.editedPlan.startDate);
    const endDate = new Date(this.editedPlan.endDate);

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

  dismiss() {
    this.modalController.dismiss();
  }
} 