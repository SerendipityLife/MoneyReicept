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
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonImg,
  IonBadge,
  IonCard,
  IonCardContent,
  IonList,
  IonProgressBar,
  IonSpinner,
  IonCheckbox,
  IonRange,
  ModalController,
  AlertController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  close, 
  save, 
  refresh, 
  checkmark,
  warning,
  information
} from 'ionicons/icons';
import { ProductService, ProductUploadResponse } from '../services/product.service';
import { ProductImage, ProductAnalysisResult, PRODUCT_CATEGORIES, JAPANESE_BRANDS } from '../models/product.model';

@Component({
  selector: 'app-product-upload-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>상품 분석 및 저장</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button 
            (click)="saveProduct()" 
            [disabled]="!canSave || isSaving">
            <ion-spinner *ngIf="isSaving" name="crescent"></ion-spinner>
            <ion-icon *ngIf="!isSaving" name="save"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Image Preview -->
      <div class="image-container">
        <ion-img [src]="imageDataUrl" alt="업로드된 상품 이미지"></ion-img>
        <ion-badge 
          *ngIf="analysisResult"
          class="confidence-badge" 
          [color]="getConfidenceColor(analysisResult.confidenceScore)">
          신뢰도: {{(analysisResult.confidenceScore * 100).toFixed(0)}}%
        </ion-badge>
      </div>

      <!-- Analysis Status -->
      <div class="status-container">
        <ion-card *ngIf="isAnalyzing">
          <ion-card-content>
            <div class="analysis-progress">
              <ion-spinner name="crescent"></ion-spinner>
              <p>상품을 분석하는 중...</p>
            </div>
            <ion-progress-bar type="indeterminate"></ion-progress-bar>
          </ion-card-content>
        </ion-card>

        <ion-card *ngIf="analysisError">
          <ion-card-content>
            <div class="error-message">
              <ion-icon name="warning" color="danger"></ion-icon>
              <p>분석에 실패했습니다: {{analysisError}}</p>
              <ion-button (click)="retryAnalysis()" fill="outline" size="small">
                <ion-icon name="refresh" slot="start"></ion-icon>
                다시 시도
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card *ngIf="analysisResult && !isAnalyzing">
          <ion-card-content>
            <div class="analysis-success">
              <ion-icon name="checkmark" color="success"></ion-icon>
              <p>분석이 완료되었습니다!</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Product Information Form -->
      <div class="form-container" *ngIf="analysisResult || analysisError">
        <ion-card>
          <ion-card-content>
            <h3>상품 정보</h3>
            <ion-list>
              <!-- Product Name -->
              <ion-item>
                <ion-label position="stacked">상품명 *</ion-label>
                <ion-input
                  [(ngModel)]="productData.productName"
                  placeholder="상품명을 입력하세요"
                  required>
                </ion-input>
              </ion-item>

              <!-- Brand -->
              <ion-item>
                <ion-label position="stacked">브랜드</ion-label>
                <ion-select
                  [(ngModel)]="productData.brand"
                  placeholder="브랜드를 선택하세요"
                  interface="popover">
                  <ion-select-option value="">선택 안함</ion-select-option>
                  <ion-select-option *ngFor="let brand of availableBrands" [value]="brand">
                    {{brand}}
                  </ion-select-option>
                  <ion-select-option value="custom">직접 입력</ion-select-option>
                </ion-select>
              </ion-item>

              <!-- Custom Brand Input -->
              <ion-item *ngIf="productData.brand === 'custom'">
                <ion-label position="stacked">브랜드명</ion-label>
                <ion-input
                  [(ngModel)]="customBrand"
                  placeholder="브랜드명을 입력하세요">
                </ion-input>
              </ion-item>

              <!-- Category -->
              <ion-item>
                <ion-label position="stacked">카테고리</ion-label>
                <ion-select
                  [(ngModel)]="productData.category"
                  placeholder="카테고리를 선택하세요"
                  interface="popover">
                  <ion-select-option value="">선택 안함</ion-select-option>
                  <ion-select-option *ngFor="let category of availableCategories" [value]="category">
                    {{category}}
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <!-- Description -->
              <ion-item>
                <ion-label position="stacked">설명</ion-label>
                <ion-textarea
                  [(ngModel)]="productData.description"
                  placeholder="상품 설명을 입력하세요"
                  rows="3">
                </ion-textarea>
              </ion-item>

              <!-- Manual Confidence Override -->
              <ion-item>
                <ion-checkbox 
                  [(ngModel)]="overrideConfidence"
                  slot="start">
                </ion-checkbox>
                <ion-label>신뢰도 수동 설정</ion-label>
              </ion-item>

              <ion-item *ngIf="overrideConfidence">
                <ion-label position="stacked">
                  신뢰도: {{(productData.confidenceScore * 100).toFixed(0)}}%
                </ion-label>
                <ion-range
                  [(ngModel)]="productData.confidenceScore"
                  min="0"
                  max="1"
                  step="0.1"
                  color="primary">
                  <ion-label slot="start">0%</ion-label>
                  <ion-label slot="end">100%</ion-label>
                </ion-range>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Analysis Details -->
        <ion-card *ngIf="analysisResult">
          <ion-card-content>
            <h3>분석 결과</h3>
            <ion-list>
              <ion-item *ngIf="analysisResult.detectedLabels && analysisResult.detectedLabels.length > 0">
                <ion-label>
                  <h4>감지된 라벨</h4>
                  <p>{{analysisResult.detectedLabels.join(', ')}}</p>
                </ion-label>
              </ion-item>
              <ion-item *ngIf="analysisResult.colors && analysisResult.colors.length > 0">
                <ion-label>
                  <h4>주요 색상</h4>
                  <p>{{analysisResult.colors.join(', ')}}</p>
                </ion-label>
              </ion-item>
              <ion-item *ngIf="analysisResult.estimatedPrice">
                <ion-label>
                  <h4>예상 가격대</h4>
                  <p>{{analysisResult.estimatedPrice.min}} - {{analysisResult.estimatedPrice.max}} {{analysisResult.estimatedPrice.currency}}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Validation Issues -->
        <ion-card *ngIf="validationIssues.length > 0" color="warning">
          <ion-card-content>
            <h3>
              <ion-icon name="warning"></ion-icon>
              검증 이슈
            </h3>
            <ul>
              <li *ngFor="let issue of validationIssues">{{issue}}</li>
            </ul>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .image-container {
      position: relative;
      height: 200px;
      overflow: hidden;

      ion-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .confidence-badge {
        position: absolute;
        top: 16px;
        right: 16px;
        font-size: 12px;
        padding: 4px 8px;
      }
    }

    .status-container {
      padding: 16px;
    }

    .analysis-progress,
    .error-message,
    .analysis-success {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;

      ion-icon {
        font-size: 24px;
      }

      p {
        margin: 0;
        flex: 1;
      }
    }

    .form-container {
      padding: 0 16px 16px;
    }

    h3 {
      margin: 0 0 16px 0;
      color: var(--ion-color-dark);
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    ion-list {
      ion-item {
        --padding-start: 0;
        --padding-end: 0;
        --inner-padding-end: 0;

        ion-label {
          margin: 8px 0;

          h4 {
            margin: 0 0 4px 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--ion-color-dark);
          }

          p {
            margin: 0;
            font-size: 14px;
            color: var(--ion-color-medium);
          }
        }
      }
    }

    ul {
      margin: 8px 0 0 0;
      padding-left: 20px;

      li {
        margin-bottom: 4px;
        font-size: 14px;
      }
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
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonImg,
    IonBadge,
    IonCard,
    IonCardContent,
    IonList,
    IonProgressBar,
    IonSpinner,
    IonCheckbox,
    IonRange
  ]
})
export class ProductUploadModalComponent implements OnInit {
  @Input() imageDataUrl!: string;
  @Input() receiptItemId?: string;

  isAnalyzing: boolean = false;
  isSaving: boolean = false;
  analysisResult?: ProductAnalysisResult;
  analysisError?: string;
  validationIssues: string[] = [];
  overrideConfidence: boolean = false;
  customBrand: string = '';

  productData = {
    productName: '',
    brand: '',
    category: '',
    description: '',
    confidenceScore: 0.5
  };

  availableCategories = PRODUCT_CATEGORIES;
  availableBrands = JAPANESE_BRANDS;

  constructor(
    private modalController: ModalController,
    private productService: ProductService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ 
      close, 
      save, 
      refresh, 
      checkmark,
      warning,
      information
    });
  }

  ngOnInit() {
    this.analyzeProduct();
  }

  get canSave(): boolean {
    return !!this.productData.productName.trim() && !this.isAnalyzing;
  }

  async analyzeProduct() {
    this.isAnalyzing = true;
    this.analysisError = undefined;
    this.validationIssues = [];

    try {
      const response = await this.productService.uploadProductFromDataUrl(
        this.imageDataUrl,
        `product-${Date.now()}.jpg`
      );

      if (response.success && response.data) {
        this.analysisResult = response.data.analysis;
        this.validationIssues = response.data.validation.issues || [];
        
        // Pre-fill form with analysis results
        this.productData = {
          productName: this.analysisResult.productName || '',
          brand: this.analysisResult.brand || '',
          category: this.analysisResult.category || '',
          description: this.analysisResult.description || '',
          confidenceScore: this.analysisResult.confidenceScore
        };
      } else {
        this.analysisError = response.message || '분석에 실패했습니다.';
      }
    } catch (error) {
      console.error('Product analysis failed:', error);
      this.analysisError = '네트워크 오류가 발생했습니다.';
    } finally {
      this.isAnalyzing = false;
    }
  }

  async retryAnalysis() {
    await this.analyzeProduct();
  }

  async saveProduct() {
    if (!this.canSave || this.isSaving) return;

    const loading = await this.loadingController.create({
      message: '상품을 저장하는 중...'
    });
    await loading.present();

    this.isSaving = true;

    try {
      // Handle custom brand
      let finalBrand = this.productData.brand;
      if (this.productData.brand === 'custom' && this.customBrand.trim()) {
        finalBrand = this.customBrand.trim();
      }

      // First upload and get the image URL
      const uploadResponse = await this.productService.uploadProductFromDataUrl(
        this.imageDataUrl,
        `product-${Date.now()}.jpg`
      );

      if (!uploadResponse.success || !uploadResponse.data) {
        throw new Error('이미지 업로드에 실패했습니다.');
      }

      // Then save the product data
      const productData = {
        receiptItemId: this.receiptItemId,
        imageUrl: uploadResponse.data.imageUrl,
        productName: this.productData.productName.trim(),
        brand: finalBrand,
        category: this.productData.category,
        description: this.productData.description.trim(),
        confidenceScore: this.overrideConfidence ? 
          this.productData.confidenceScore : 
          this.analysisResult?.confidenceScore || 0.5
      };

      const savedProduct = await this.productService.saveProduct(productData);

      const toast = await this.toastController.create({
        message: '상품이 성공적으로 저장되었습니다!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      this.dismiss(true);

    } catch (error) {
      console.error('Failed to save product:', error);
      
      const alert = await this.alertController.create({
        header: '오류',
        message: '상품 저장에 실패했습니다.',
        buttons: ['확인']
      });
      await alert.present();
    } finally {
      this.isSaving = false;
      await loading.dismiss();
    }
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'danger';
  }

  dismiss(success: boolean = false) {
    this.modalController.dismiss({
      success: success
    });
  }
}