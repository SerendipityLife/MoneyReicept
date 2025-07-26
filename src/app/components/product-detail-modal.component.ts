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
  IonRange,
  IonSpinner,
  ModalController,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  close, 
  save, 
  create, 
  star, 
  starOutline,
  checkmark,
  refresh,
  eye,
  eyeOff,
  search,
  imageOutline
} from 'ionicons/icons';
import { ProductService } from '../services/product.service';
import { PopularProductService, PopularProduct, ProductRecommendation } from '../services/popular-product.service';
import { ProductImage, ProductEditData, PRODUCT_CATEGORIES, JAPANESE_BRANDS } from '../models/product.model';

@Component({
  selector: 'app-product-detail-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{isPopularProduct() ? '인기 상품 상세' : '상품 상세'}}</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button 
            *ngIf="!isPopularProduct()" 
            (click)="toggleEditMode()" 
            [disabled]="isSaving">
            <ion-icon [name]="isEditing ? 'eye' : 'create'"></ion-icon>
          </ion-button>
          <ion-button 
            *ngIf="isEditing" 
            (click)="saveChanges()" 
            [disabled]="isSaving">
            <ion-spinner *ngIf="isSaving" name="crescent"></ion-spinner>
            <ion-icon *ngIf="!isSaving" name="save"></ion-icon>
          </ion-button>
          <ion-button 
            *ngIf="showRecommendations && isPopularProduct()" 
            (click)="viewSimilarProducts()" 
            fill="clear">
            <ion-icon name="search"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Product Image or Placeholder -->
      <div class="image-container">
        <ion-img 
          *ngIf="getProductImageUrl()" 
          [src]="getProductImageUrl()" 
          [alt]="product.productName || '상품 이미지'">
        </ion-img>
        <div *ngIf="!getProductImageUrl()" class="placeholder-image">
          <ion-icon name="image-outline" size="large"></ion-icon>
          <p>이미지 없음</p>
        </div>
        <ion-badge 
          *ngIf="getProductConfidence() !== undefined"
          class="confidence-badge" 
          [color]="getConfidenceColor(getProductConfidence()!)">
          신뢰도: {{(getProductConfidence()! * 100).toFixed(0)}}%
        </ion-badge>
        <ion-badge 
          *ngIf="isPopularProduct()"
          class="popularity-badge" 
          color="primary">
          {{getPopularProduct().purchaseCount}}회 구매
        </ion-badge>
      </div>

      <!-- Product Information -->
      <div class="content-container">
        <ion-card>
          <ion-card-content>
            <ion-list>
              <!-- Product Name -->
              <ion-item>
                <ion-label position="stacked">상품명</ion-label>
                <ion-input
                  *ngIf="isEditing"
                  [(ngModel)]="editData.productName"
                  placeholder="상품명을 입력하세요">
                </ion-input>
                <ion-label *ngIf="!isEditing">
                  {{product.productName || '알 수 없는 상품'}}
                </ion-label>
              </ion-item>

              <!-- Brand -->
              <ion-item *ngIf="getProductBrand() || isEditing">
                <ion-label position="stacked">브랜드</ion-label>
                <ion-select
                  *ngIf="isEditing"
                  [(ngModel)]="editData.brand"
                  placeholder="브랜드를 선택하세요"
                  interface="popover">
                  <ion-select-option value="">선택 안함</ion-select-option>
                  <ion-select-option *ngFor="let brand of availableBrands" [value]="brand">
                    {{brand}}
                  </ion-select-option>
                </ion-select>
                <ion-input
                  *ngIf="isEditing && editData.brand === 'custom'"
                  [(ngModel)]="customBrand"
                  placeholder="직접 입력">
                </ion-input>
                <ion-label *ngIf="!isEditing">
                  {{getProductBrand()}}
                </ion-label>
              </ion-item>

              <!-- Category -->
              <ion-item *ngIf="product.category || isEditing">
                <ion-label position="stacked">카테고리</ion-label>
                <ion-select
                  *ngIf="isEditing"
                  [(ngModel)]="editData.category"
                  placeholder="카테고리를 선택하세요"
                  interface="popover">
                  <ion-select-option value="">선택 안함</ion-select-option>
                  <ion-select-option *ngFor="let category of availableCategories" [value]="category">
                    {{category}}
                  </ion-select-option>
                </ion-select>
                <ion-label *ngIf="!isEditing">
                  {{product.category}}
                </ion-label>
              </ion-item>

              <!-- Price Information (for popular products) -->
              <ion-item *ngIf="isPopularProduct()">
                <ion-label>
                  <h3>평균 가격</h3>
                  <p>{{formatPrice(getPopularProduct().averagePriceJpy, getPopularProduct().averagePriceKrw)}}</p>
                </ion-label>
              </ion-item>

              <!-- Purchase Count (for popular products) -->
              <ion-item *ngIf="isPopularProduct()">
                <ion-label>
                  <h3>구매 횟수</h3>
                  <p>{{getPopularProduct().purchaseCount}}회</p>
                </ion-label>
              </ion-item>

              <!-- Description -->
              <ion-item *ngIf="getProductDescription() || isEditing">
                <ion-label position="stacked">설명</ion-label>
                <ion-textarea
                  *ngIf="isEditing"
                  [(ngModel)]="editData.description"
                  placeholder="상품 설명을 입력하세요"
                  rows="3">
                </ion-textarea>
                <ion-label *ngIf="!isEditing" class="description-text">
                  {{getProductDescription()}}
                </ion-label>
              </ion-item>

              <!-- Confidence Score (editable for manual correction) -->
              <ion-item *ngIf="isEditing && getProductConfidence() !== undefined">
                <ion-label position="stacked">
                  신뢰도: {{(editData.confidenceScore! * 100).toFixed(0)}}%
                </ion-label>
                <ion-range
                  [(ngModel)]="editData.confidenceScore"
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

        <!-- Recommendations (for popular products) -->
        <ion-card *ngIf="recommendations.length > 0">
          <ion-card-content>
            <h3>추천 상품</h3>
            <div class="recommendations">
              <div 
                *ngFor="let rec of recommendations" 
                class="recommendation-item"
                (click)="viewRecommendation(rec)">
                <div class="recommendation-info">
                  <h4>{{rec.product.productName}}</h4>
                  <p>{{rec.reason}}</p>
                  <p class="price">{{formatPrice(rec.product.averagePriceJpy, rec.product.averagePriceKrw)}}</p>
                </div>
                <ion-badge color="success">{{rec.recommendationScore.toFixed(0)}}</ion-badge>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Similar Products -->
        <ion-card *ngIf="similarProducts.length > 0">
          <ion-card-content>
            <h3>유사한 상품</h3>
            <div class="similar-products">
              <div 
                *ngFor="let similar of similarProducts" 
                class="similar-product"
                (click)="viewSimilarProduct(similar)">
                <ion-img [src]="similar.imageUrl" [alt]="similar.productName"></ion-img>
                <p>{{similar.productName}}</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Metadata -->
        <ion-card>
          <ion-card-content>
            <h3>메타데이터</h3>
            <ion-list>
              <ion-item *ngIf="getProductCreatedAt()">
                <ion-label>
                  <h4>{{isPopularProduct() ? '마지막 업데이트' : '생성일'}}</h4>
                  <p>{{formatDate(getProductCreatedAt())}}</p>
                </ion-label>
              </ion-item>
              <ion-item *ngIf="getProductUpdatedAt()">
                <ion-label>
                  <h4>수정일</h4>
                  <p>{{formatDate(getProductUpdatedAt())}}</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h4>상품 ID</h4>
                  <p>{{product.id}}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .image-container {
      position: relative;
      height: 250px;
      overflow: hidden;

      ion-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .placeholder-image {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: var(--ion-color-light);
        color: var(--ion-color-medium);

        ion-icon {
          margin-bottom: 8px;
        }

        p {
          margin: 0;
          font-size: 14px;
        }
      }

      .confidence-badge {
        position: absolute;
        top: 16px;
        right: 16px;
        font-size: 12px;
        padding: 4px 8px;
      }

      .popularity-badge {
        position: absolute;
        top: 16px;
        left: 16px;
        font-size: 12px;
        padding: 4px 8px;
      }
    }

    .content-container {
      padding: 16px;
    }

    .description-text {
      white-space: pre-wrap;
      word-break: break-word;
    }

    .recommendations {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .recommendation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: var(--ion-color-light);
        border-radius: 8px;
        cursor: pointer;

        &:hover {
          background: var(--ion-color-step-100);
        }

        .recommendation-info {
          flex: 1;

          h4 {
            margin: 0 0 4px 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--ion-color-dark);
          }

          p {
            margin: 0 0 2px 0;
            font-size: 14px;
            color: var(--ion-color-medium);

            &.price {
              color: var(--ion-color-success);
              font-weight: 500;
            }
          }
        }

        ion-badge {
          margin-left: 12px;
        }
      }
    }

    .similar-products {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 8px 0;

      .similar-product {
        flex-shrink: 0;
        width: 80px;
        text-align: center;
        cursor: pointer;

        ion-img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 4px;
        }

        p {
          font-size: 12px;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    h3 {
      margin: 0 0 16px 0;
      color: var(--ion-color-dark);
      font-size: 18px;
      font-weight: 600;
    }

    ion-list {
      ion-item {
        --padding-start: 0;
        --padding-end: 0;
        --inner-padding-end: 0;

        ion-label {
          margin: 8px 0;

          h3 {
            margin: 0 0 4px 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--ion-color-dark);
          }

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
    IonRange,
    IonSpinner
  ]
})
export class ProductDetailModalComponent implements OnInit {
  @Input() product!: ProductImage | PopularProduct;
  @Input() showRecommendations: boolean = false;

  isEditing: boolean = false;
  isSaving: boolean = false;
  editData: ProductEditData = {};
  customBrand: string = '';
  similarProducts: ProductImage[] = [];
  recommendations: ProductRecommendation[] = [];

  availableCategories = PRODUCT_CATEGORIES;
  availableBrands = [...JAPANESE_BRANDS, 'custom'];

  constructor(
    private modalController: ModalController,
    private productService: ProductService,
    private popularProductService: PopularProductService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ 
      close, 
      save, 
      create, 
      star, 
      starOutline,
      checkmark,
      refresh,
      eye,
      eyeOff,
      search,
      imageOutline
    });
  }

  ngOnInit() {
    this.initializeEditData();
    this.loadSimilarProducts();
    if (this.showRecommendations && this.isPopularProduct()) {
      this.loadRecommendations();
    }
  }

  initializeEditData() {
    if (this.isPopularProduct()) {
      // Popular products have limited editable fields
      const popularProduct = this.getPopularProduct();
      this.editData = {
        productName: popularProduct.productName,
        category: popularProduct.category
      };
    } else {
      // Product images have full editable fields
      const productImage = this.getProductImage();
      this.editData = {
        productName: productImage.productName,
        brand: productImage.brand,
        category: productImage.category,
        description: productImage.description,
        confidenceScore: productImage.confidenceScore
      };
    }
  }

  async loadSimilarProducts() {
    try {
      // Only load similar products for ProductImage, not PopularProduct
      if (!this.isPopularProduct()) {
        const productImage = this.getProductImage();
        this.similarProducts = await this.productService.findSimilarProducts(
          undefined, // Don't match exact name
          productImage.brand,
          productImage.category,
          5
        );
        // Filter out the current product
        this.similarProducts = this.similarProducts.filter(p => p.id !== this.product.id);
      }
    } catch (error) {
      console.error('Failed to load similar products:', error);
    }
  }

  toggleEditMode() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset edit data when canceling
      this.initializeEditData();
    }
  }

  async saveChanges() {
    if (this.isSaving) return;

    this.isSaving = true;

    try {
      // Handle custom brand
      if (this.editData.brand === 'custom' && this.customBrand.trim()) {
        this.editData.brand = this.customBrand.trim();
      }

      const updatedProduct = await this.productService.updateProduct(this.product.id, this.editData);
      
      // Update the local product data
      Object.assign(this.product, updatedProduct);
      
      this.isEditing = false;
      
      const toast = await this.toastController.create({
        message: '상품 정보가 업데이트되었습니다.',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

    } catch (error) {
      console.error('Failed to update product:', error);
      
      const alert = await this.alertController.create({
        header: '오류',
        message: '상품 정보 업데이트에 실패했습니다.',
        buttons: ['확인']
      });
      await alert.present();
    } finally {
      this.isSaving = false;
    }
  }

  async viewSimilarProduct(product: ProductImage) {
    const modal = await this.modalController.create({
      component: ProductDetailModalComponent,
      componentProps: {
        product: product
      }
    });

    await modal.present();
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'danger';
  }

  formatDate(date?: Date): string {
    if (!date) return '알 수 없음';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Type checking methods
  isPopularProduct(): boolean {
    return 'purchaseCount' in this.product;
  }

  getPopularProduct(): PopularProduct {
    return this.product as PopularProduct;
  }

  getProductImage(): ProductImage {
    return this.product as ProductImage;
  }

  // Helper methods to handle different product types
  getProductImageUrl(): string | undefined {
    if (this.isPopularProduct()) {
      return undefined; // Popular products don't have image URLs
    }
    return this.getProductImage().imageUrl;
  }

  getProductConfidence(): number | undefined {
    if (this.isPopularProduct()) {
      return undefined; // Popular products don't have confidence scores
    }
    return this.getProductImage().confidenceScore;
  }

  getProductCreatedAt(): Date | undefined {
    if (this.isPopularProduct()) {
      return this.getPopularProduct().lastUpdated;
    }
    return this.getProductImage().createdAt;
  }

  getProductUpdatedAt(): Date | undefined {
    if (this.isPopularProduct()) {
      return undefined; // Popular products only have lastUpdated
    }
    return this.getProductImage().updatedAt;
  }

  getProductBrand(): string | undefined {
    if (this.isPopularProduct()) {
      return undefined; // Popular products don't have brand information
    }
    return this.getProductImage().brand;
  }

  getProductDescription(): string | undefined {
    if (this.isPopularProduct()) {
      return undefined; // Popular products don't have descriptions
    }
    return this.getProductImage().description;
  }

  async loadRecommendations() {
    if (!this.isPopularProduct()) return;

    try {
      const popularProduct = this.getPopularProduct();
      this.recommendations = await this.popularProductService.getRecommendations({
        category: popularProduct.category,
        limit: 5,
        excludeProducts: [popularProduct.productName]
      });
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  }

  async viewSimilarProducts() {
    if (!this.isPopularProduct()) return;

    try {
      const popularProduct = this.getPopularProduct();
      const recommendations = await this.popularProductService.getRecommendations({
        category: popularProduct.category,
        limit: 10,
        excludeProducts: [popularProduct.productName]
      });

      const alert = await this.alertController.create({
        header: `${popularProduct.productName}와 유사한 상품`,
        message: recommendations.map(rec => 
          `• ${rec.product.productName} (${rec.product.purchaseCount}회 구매)`
        ).join('\n'),
        buttons: ['확인']
      });

      await alert.present();
    } catch (error) {
      console.error('Failed to load similar products:', error);
    }
  }

  async viewRecommendation(recommendation: ProductRecommendation) {
    const modal = await this.modalController.create({
      component: ProductDetailModalComponent,
      componentProps: {
        product: recommendation.product,
        showRecommendations: true
      }
    });

    await modal.present();
  }

  formatPrice(priceJpy: number, priceKrw?: number): string {
    if (priceKrw) {
      return `¥${priceJpy.toLocaleString()} (₩${priceKrw.toLocaleString()})`;
    }
    return `¥${priceJpy.toLocaleString()}`;
  }

  dismiss(updated: boolean = false) {
    this.modalController.dismiss({
      updated: updated
    });
  }
}