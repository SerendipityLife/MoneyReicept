import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle, 
  IonCardContent, 
  IonButton, 
  IonIcon, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonThumbnail,
  IonToast,
  IonSpinner,
  ModalController
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Subscription } from 'rxjs';
import { ReceiptService } from '../services/receipt.service';
import { UploadProgressService, UploadProgress } from '../services/upload-progress.service';
import { UploadProgressModalComponent } from '../components/upload-progress-modal.component';
import { Receipt } from '../models/receipt.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardSubtitle, 
    IonCardContent, 
    IonButton, 
    IonIcon, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonThumbnail,
    IonToast,
    IonSpinner,
    UploadProgressModalComponent
  ],
})
export class Tab1Page implements OnInit, OnDestroy {
  recentReceipts: Receipt[] = [];
  isUploading: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';
  showProgressModal: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private receiptService: ReceiptService,
    private uploadProgressService: UploadProgressService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.loadRecentReceipts();
    
    // Subscribe to upload progress to show/hide modal
    this.subscriptions.push(
      this.uploadProgressService.uploadProgress$.subscribe(progress => {
        if (progress.status === 'uploading' || progress.status === 'processing') {
          this.showProgressModal = true;
        } else if (progress.status === 'completed') {
          // Keep modal open to show completion
          setTimeout(() => {
            this.loadRecentReceipts(); // Refresh the list
          }, 1000);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async captureFromCamera() {
    try {
      // Check if camera is available
      if (!Capacitor.isPluginAvailable('Camera')) {
        this.showToastMessage('카메라 기능을 사용할 수 없습니다.');
        return;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        direction: CameraDirection.Rear,
        presentationStyle: 'fullscreen',
        width: 1024,
        height: 1024
      });

      if (image.webPath) {
        await this.uploadImage(image.webPath);
      }
    } catch (error: any) {
      console.error('Error capturing image:', error);
      
      if (error.message && error.message.includes('cancelled')) {
        // User cancelled, don't show error
        return;
      }
      
      if (error.message && error.message.includes('permission')) {
        this.showToastMessage('카메라 권한이 필요합니다. 설정에서 권한을 허용해주세요.');
      } else {
        this.showToastMessage('카메라 촬영 중 오류가 발생했습니다.');
      }
    }
  }

  async selectFromGallery() {
    try {
      // Check if camera plugin is available
      if (!Capacitor.isPluginAvailable('Camera')) {
        this.showToastMessage('갤러리 기능을 사용할 수 없습니다.');
        return;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        width: 1024,
        height: 1024
      });

      if (image.webPath) {
        await this.uploadImage(image.webPath);
      }
    } catch (error: any) {
      console.error('Error selecting image:', error);
      
      if (error.message && error.message.includes('cancelled')) {
        // User cancelled, don't show error
        return;
      }
      
      if (error.message && error.message.includes('permission')) {
        this.showToastMessage('갤러리 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.');
      } else {
        this.showToastMessage('갤러리에서 이미지 선택 중 오류가 발생했습니다.');
      }
    }
  }

  private async uploadImage(imagePath: string) {
    try {
      this.isUploading = true;
      
      // Convert image to blob
      const response = await fetch(imagePath);
      const blob = await response.blob();
      const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
      
      // Upload with progress tracking
      this.uploadProgressService.uploadReceiptWithProgress(file).subscribe({
        next: (response) => {
          if (response && response.length > 0) {
            console.log('Upload response:', response[0]);
          }
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.showToastMessage('업로드 중 오류가 발생했습니다.');
          this.isUploading = false;
        },
        complete: () => {
          this.isUploading = false;
        }
      });
    } catch (error) {
      console.error('Error processing image:', error);
      this.showToastMessage('이미지 처리 중 오류가 발생했습니다.');
      this.isUploading = false;
    }
  }

  async openProgressModal() {
    const modal = await this.modalController.create({
      component: UploadProgressModalComponent,
      componentProps: {
        isOpen: true
      },
      backdropDismiss: false
    });

    await modal.present();
  }

  onProgressModalDismiss() {
    this.showProgressModal = false;
  }

  private loadRecentReceipts() {
    this.receiptService.getRecentReceipts(5).subscribe({
      next: (receipts) => {
        this.recentReceipts = receipts.map(receipt => ({
          ...receipt,
          purchaseDate: new Date(receipt.purchaseDate)
        }));
      },
      error: (error) => {
        console.error('Error loading recent receipts:', error);
        // Fallback to mock data for development
        this.recentReceipts = [
          {
            id: '1',
            imageUrl: '/assets/mock-receipt.jpg',
            storeName: '돈키호테 시부야점',
            totalAmountKrw: 25000,
            totalAmountJpy: 2500,
            purchaseDate: new Date(),
            processingStatus: 'completed'
          }
        ];
      }
    });
  }

  private showToastMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
  }

  onToastDismiss() {
    this.showToast = false;
  }
}