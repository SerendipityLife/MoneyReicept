import { Component, OnInit } from '@angular/core';
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
  IonCardContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonThumbnail,
  IonImg,
  IonBadge,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonFab,
  IonFabButton,
  IonGrid,
  IonRow,
  IonCol,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  IonSpinner,
  IonRange,
  ModalController,
  AlertController,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  camera, 
  images, 
  add, 
  filter, 
  search, 
  eye, 
  create, 
  trash,
  close,
  checkmark,
  star,
  starOutline
} from 'ionicons/icons';
import { ProductService } from '../services/product.service';
import { ProductImage } from '../models/product.model';
import { ProductDetailModalComponent } from '../components/product-detail-modal.component';
import { ProductUploadModalComponent } from '../components/product-upload-modal.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-product-gallery',
  templateUrl: './product-gallery.page.html',
  styleUrls: ['./product-gallery.page.scss'],
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
    IonCardContent, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonThumbnail,
    IonImg,
    IonBadge,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonFab,
    IonFabButton,
    IonGrid,
    IonRow,
    IonCol,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonRefresher,
    IonRefresherContent,
    IonChip,
    IonSpinner,
    IonRange
  ]
})
export class ProductGalleryPage implements OnInit {
  products: ProductImage[] = [];
  filteredProducts: ProductImage[] = [];
  categories: string[] = [];
  brands: string[] = [];
  
  // Filter options
  selectedCategory: string = '';
  selectedBrand: string = '';
  searchTerm: string = '';
  minConfidence: number = 0.3;
  
  // UI state
  isLoading: boolean = false;
  hasMore: boolean = true;
  currentPage: number = 0;
  pageSize: number = 20;
  
  // View mode
  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private productService: ProductService,
    private modalController: ModalController,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({ 
      camera, 
      images, 
      add, 
      filter, 
      search, 
      eye, 
      create, 
      trash,
      close,
      checkmark,
      star,
      starOutline
    });
  }

  ngOnInit() {
    this.loadProducts();
  }

  async doRefresh(event: any) {
    this.currentPage = 0;
    this.hasMore = true;
    await this.loadProducts(true);
    event.target.complete();
  }

  async loadProducts(refresh: boolean = false) {
    if (this.isLoading && !refresh) return;
    
    this.isLoading = true;
    
    try {
      const filter = {
        category: this.selectedCategory || undefined,
        brand: this.selectedBrand || undefined,
        minConfidence: this.minConfidence,
        limit: this.pageSize,
        offset: refresh ? 0 : this.currentPage * this.pageSize
      };

      const newProducts = await this.productService.getProductGallery(filter);
      
      if (refresh) {
        this.products = newProducts;
        this.currentPage = 0;
      } else {
        this.products = [...this.products, ...newProducts];
      }
      
      this.hasMore = newProducts.length === this.pageSize;
      this.currentPage++;
      
      this.applyFilters();
      this.extractFilterOptions();
      
    } catch (error) {
      console.error('Failed to load products:', error);
      this.showErrorAlert('상품을 불러오는데 실패했습니다.');
    } finally {
      this.isLoading = false;
    }
  }

  async loadMore(event: any) {
    await this.loadProducts();
    event.target.complete();
  }

  applyFilters() {
    this.filteredProducts = this.products.filter(product => {
      const matchesSearch = !this.searchTerm || 
        product.productName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = !this.selectedCategory || product.category === this.selectedCategory;
      const matchesBrand = !this.selectedBrand || product.brand === this.selectedBrand;
      const matchesConfidence = product.confidenceScore >= this.minConfidence;
      
      return matchesSearch && matchesCategory && matchesBrand && matchesConfidence;
    });
  }

  extractFilterOptions() {
    const categories = new Set<string>();
    const brands = new Set<string>();
    
    this.products.forEach(product => {
      if (product.category) categories.add(product.category);
      if (product.brand) brands.add(product.brand);
    });
    
    this.categories = Array.from(categories).sort();
    this.brands = Array.from(brands).sort();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.applyFilters();
  }

  onCategoryChange(event: any) {
    this.selectedCategory = event.detail.value;
    this.applyFilters();
  }

  onBrandChange(event: any) {
    this.selectedBrand = event.detail.value;
    this.applyFilters();
  }

  onConfidenceChange(event: any) {
    this.minConfidence = event.detail.value;
    this.applyFilters();
  }

  clearFilters() {
    this.selectedCategory = '';
    this.selectedBrand = '';
    this.searchTerm = '';
    this.minConfidence = 0.3;
    this.applyFilters();
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  async showAddProductOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: '상품 사진 추가',
      buttons: [
        {
          text: '카메라로 촬영',
          icon: 'camera',
          handler: () => {
            this.captureProductImage();
          }
        },
        {
          text: '갤러리에서 선택',
          icon: 'images',
          handler: () => {
            this.selectFromGallery();
          }
        },
        {
          text: '취소',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async captureProductImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        await this.openUploadModal(image.dataUrl);
      }
    } catch (error) {
      console.error('Camera capture failed:', error);
      this.showErrorAlert('카메라 촬영에 실패했습니다.');
    }
  }

  async selectFromGallery() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      if (image.dataUrl) {
        await this.openUploadModal(image.dataUrl);
      }
    } catch (error) {
      console.error('Gallery selection failed:', error);
      this.showErrorAlert('갤러리에서 이미지를 선택하는데 실패했습니다.');
    }
  }

  async openUploadModal(imageDataUrl: string) {
    const modal = await this.modalController.create({
      component: ProductUploadModalComponent,
      componentProps: {
        imageDataUrl: imageDataUrl
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.success) {
        this.loadProducts(true); // Refresh the gallery
      }
    });

    await modal.present();
  }

  async openProductDetail(product: ProductImage) {
    const modal = await this.modalController.create({
      component: ProductDetailModalComponent,
      componentProps: {
        product: product
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.updated) {
        this.loadProducts(true); // Refresh if product was updated
      }
    });

    await modal.present();
  }

  async deleteProduct(product: ProductImage) {
    const alert = await this.alertController.create({
      header: '상품 삭제',
      message: '이 상품을 삭제하시겠습니까?',
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
              await this.productService.deleteProduct(product.id);
              this.products = this.products.filter(p => p.id !== product.id);
              this.applyFilters();
            } catch (error) {
              console.error('Failed to delete product:', error);
              this.showErrorAlert('상품 삭제에 실패했습니다.');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'danger';
  }

  getConfidenceText(confidence: number): string {
    if (confidence >= 0.8) return '높음';
    if (confidence >= 0.6) return '보통';
    return '낮음';
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: '오류',
      message: message,
      buttons: ['확인']
    });
    await alert.present();
  }
}