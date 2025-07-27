import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonFab,
  IonFabButton,
  IonChip,
  IonLabel,
  ModalController,
  ToastController,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline,
  cameraOutline,
  imagesOutline,
  calendarOutline
} from 'ionicons/icons';
import { TravelPlan } from '../models/budget.model';
import { BudgetService } from '../services/budget.service';
import { TravelPlanSelectorModalComponent } from '../components/travel-plan-selector-modal.component';
import { ReceiptListModalComponent } from '../components/receipt-list-modal.component';

@Component({
  selector: 'app-receipts',
  templateUrl: './receipts.page.html',
  styleUrls: ['./receipts.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonFab,
    IonFabButton,
    IonChip,
    IonLabel
  ]
})
export class ReceiptsPage implements OnInit {
  selectedTravelPlan: TravelPlan | null = null;

  constructor(
    private budgetService: BudgetService,
    private modalController: ModalController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private router: Router
  ) {
    addIcons({
      addOutline,
      cameraOutline,
      imagesOutline,
      calendarOutline
    });
  }

  ngOnInit() {
    // 페이지 초기화
  }

  async openTravelPlanSelector() {
    const modal = await this.modalController.create({
      component: TravelPlanSelectorModalComponent
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.selectedTravelPlan = result.data;
        this.showTravelPlanSelectedToast();
        // 여행 계획 선택 후 영수증 목록 모달 열기
        this.openReceiptListModal();
      }
    });

    return await modal.present();
  }

  async openReceiptListModal() {
    if (!this.selectedTravelPlan) {
      return;
    }

    const modal = await this.modalController.create({
      component: ReceiptListModalComponent,
      componentProps: {
        travelPlan: this.selectedTravelPlan
      }
    });

    return await modal.present();
  }

  async clearTravelPlanSelection() {
    this.selectedTravelPlan = null;
    const toast = await this.toastController.create({
      message: '여행 계획 선택이 해제되었습니다.',
      duration: 2000,
      position: 'top',
      color: 'medium'
    });
    toast.present();
  }

  async openReceiptUploadOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: '영수증 추가',
      buttons: [
        {
          text: '카메라로 촬영',
          icon: 'camera-outline',
          handler: () => {
            this.uploadFromCamera();
          }
        },
        {
          text: '갤러리에서 선택',
          icon: 'images-outline',
          handler: () => {
            this.uploadFromGallery();
          }
        },
        {
          text: '취소',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async uploadFromCamera() {
    // 카메라로 촬영 기능 구현
    console.log('카메라로 촬영');
    // TODO: 카메라 기능 구현
  }

  async uploadFromGallery() {
    // 갤러리에서 선택 기능 구현
    console.log('갤러리에서 선택');
    // TODO: 갤러리 선택 기능 구현
  }

  private async showTravelPlanSelectedToast() {
    const toast = await this.toastController.create({
      message: `'${this.selectedTravelPlan?.name}' 여행 계획이 선택되었습니다.`,
      duration: 2000,
      position: 'top',
      color: 'success'
    });
    toast.present();
  }
} 