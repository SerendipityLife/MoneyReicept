import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { 
  PopularProductService, 
  PopularProduct, 
  TrendingProduct, 
  ProductStatistics,
  PopularProductQuery 
} from '../services/popular-product.service';
import { ProductDetailModalComponent } from '../components/product-detail-modal.component';

@Component({
  selector: 'app-popular-products',
  templateUrl: './popular-products.page.html',
  styleUrls: ['./popular-products.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PopularProductsPage implements OnInit {
  popularProducts: PopularProduct[] = [];
  trendingProducts: TrendingProduct[] = [];
  productStatistics: ProductStatistics[] = [];
  
  selectedSegment: string = 'popular';
  selectedCategory: string = '';
  selectedStore: string = '';
  
  categories: string[] = ['과자/스낵', '뷰티/화장품', '음료', '생활용품', '의류/잡화'];
  stores: string[] = ['돈키호테', '세븐일레븐', '패밀리마트', '로손', '다이소'];
  
  isLoading: boolean = false;
  hasMore: boolean = true;
  currentOffset: number = 0;
  readonly pageSize: number = 20;

  constructor(
    private popularProductService: PopularProductService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadInitialData();
  }

  async loadInitialData() {
    this.isLoading = true;
    try {
      await Promise.all([
        this.loadPopularProducts(),
        this.loadTrendingProducts(),
        this.loadProductStatistics()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      await this.showErrorToast('데이터를 불러오는데 실패했습니다.');
    } finally {
      this.isLoading = false;
    }
  }

  async onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    this.currentOffset = 0;
    this.hasMore = true;
    
    if (this.selectedSegment === 'popular') {
      await this.loadPopularProducts(true);
    } else if (this.selectedSegment === 'trending') {
      await this.loadTrendingProducts();
    }
  }

  async onCategoryChange() {
    this.currentOffset = 0;
    this.hasMore = true;
    await this.loadPopularProducts(true);
  }

  async onStoreChange() {
    this.currentOffset = 0;
    this.hasMore = true;
    await this.loadPopularProducts(true);
  }

  async loadPopularProducts(reset: boolean = false) {
    if (reset) {
      this.currentOffset = 0;
      this.popularProducts = [];
    }

    const query: PopularProductQuery = {
      category: this.selectedCategory || undefined,
      storeName: this.selectedStore || undefined,
      limit: this.pageSize,
      offset: this.currentOffset,
      sortBy: 'purchaseCount',
      sortOrder: 'desc'
    };

    try {
      const products = await this.popularProductService.getPopularProducts(query);
      
      if (reset) {
        this.popularProducts = products;
      } else {
        this.popularProducts = [...this.popularProducts, ...products];
      }
      
      this.hasMore = products.length === this.pageSize;
      this.currentOffset += products.length;
    } catch (error) {
      console.error('Failed to load popular products:', error);
      await this.showErrorToast('인기 상품을 불러오는데 실패했습니다.');
    }
  }

  async loadTrendingProducts() {
    try {
      this.trendingProducts = await this.popularProductService.getTrendingProducts();
    } catch (error) {
      console.error('Failed to load trending products:', error);
      await this.showErrorToast('트렌드 상품을 불러오는데 실패했습니다.');
    }
  }

  async loadProductStatistics() {
    try {
      this.productStatistics = await this.popularProductService.getProductStatistics();
    } catch (error) {
      console.error('Failed to load product statistics:', error);
      await this.showErrorToast('상품 통계를 불러오는데 실패했습니다.');
    }
  }

  async loadMore(event: any) {
    if (!this.hasMore) {
      event.target.complete();
      return;
    }

    try {
      await this.loadPopularProducts();
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      event.target.complete();
    }
  }

  async onRefresh(event: any) {
    try {
      await this.loadInitialData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      event.target.complete();
    }
  }

  async showProductDetail(product: PopularProduct | TrendingProduct) {
    // Convert TrendingProduct to PopularProduct format for the modal
    let modalProduct: PopularProduct;
    
    if ('trendPercentage' in product) {
      // This is a TrendingProduct, convert it to PopularProduct format
      const trendingProduct = product as TrendingProduct;
      modalProduct = {
        id: trendingProduct.id,
        productName: trendingProduct.productName,
        category: trendingProduct.category,
        purchaseCount: trendingProduct.currentPurchaseCount,
        averagePriceJpy: trendingProduct.averagePriceJpy,
        averagePriceKrw: trendingProduct.averagePriceKrw,
        lastUpdated: new Date() // Use current date as we don't have this info
      };
    } else {
      modalProduct = product as PopularProduct;
    }

    const modal = await this.modalController.create({
      component: ProductDetailModalComponent,
      componentProps: {
        product: modalProduct,
        showRecommendations: true
      }
    });

    await modal.present();
    
    const { data } = await modal.onWillDismiss();
    if (data?.action === 'viewSimilar') {
      await this.showSimilarProducts(modalProduct);
    }
  }

  async showSimilarProducts(product: PopularProduct) {
    try {
      const recommendations = await this.popularProductService.getRecommendations({
        category: product.category,
        limit: 10,
        excludeProducts: [product.productName]
      });

      const alert = await this.alertController.create({
        header: `${product.productName}와 유사한 상품`,
        message: recommendations.map(rec => 
          `• ${rec.product.productName} (${rec.product.purchaseCount}회 구매)`
        ).join('\n'),
        buttons: ['확인']
      });

      await alert.present();
    } catch (error) {
      console.error('Failed to load similar products:', error);
      await this.showErrorToast('유사 상품을 불러오는데 실패했습니다.');
    }
  }

  async showStoreRecommendations(storeName: string) {
    try {
      const storeProducts = await this.popularProductService.getPopularProductsByStore(storeName, 10);
      
      const alert = await this.alertController.create({
        header: `${storeName} 인기 상품`,
        message: storeProducts.products.map(product => 
          `• ${product.productName} (${product.purchaseCount}회 구매, ¥${product.averagePriceJpy})`
        ).join('\n'),
        buttons: ['확인']
      });

      await alert.present();
    } catch (error) {
      console.error('Failed to load store recommendations:', error);
      await this.showErrorToast('매장 추천 상품을 불러오는데 실패했습니다.');
    }
  }

  getTrendIcon(product: TrendingProduct): string {
    return product.isRising ? 'trending-up' : 'trending-down';
  }

  getTrendColor(product: TrendingProduct): string {
    return product.isRising ? 'success' : 'danger';
  }

  formatPrice(priceJpy: number, priceKrw?: number): string {
    if (priceKrw) {
      return `¥${priceJpy.toLocaleString()} (₩${priceKrw.toLocaleString()})`;
    }
    return `¥${priceJpy.toLocaleString()}`;
  }

  formatTrendPercentage(percentage: number): string {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  // TrackBy functions for performance
  trackByProductId(index: number, product: PopularProduct): string {
    return product.id;
  }

  trackByTrendingProductId(index: number, product: TrendingProduct): string {
    return product.id;
  }
}