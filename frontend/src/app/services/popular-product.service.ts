import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PopularProduct {
  id: string;
  productName: string;
  category?: string;
  purchaseCount: number;
  averagePriceJpy: number;
  averagePriceKrw?: number;
  lastUpdated: Date;
}

export interface PopularProductQuery {
  category?: string;
  storeName?: string;
  limit?: number;
  offset?: number;
  minPurchaseCount?: number;
  sortBy?: 'purchaseCount' | 'averagePrice' | 'lastUpdated';
  sortOrder?: 'asc' | 'desc';
}

export interface PopularProductsByStore {
  storeName: string;
  products: PopularProduct[];
}

export interface TrendingProduct {
  id: string;
  productName: string;
  category?: string;
  currentPurchaseCount: number;
  previousPurchaseCount: number;
  trendPercentage: number;
  averagePriceJpy: number;
  averagePriceKrw?: number;
  isRising: boolean;
}

export interface ProductRecommendation {
  product: PopularProduct;
  recommendationScore: number;
  reason: string;
  similarProducts?: PopularProduct[];
}

export interface RecommendationRequest {
  storeName?: string;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  excludeProducts?: string[];
  limit?: number;
}

export interface ProductStatistics {
  category: string;
  totalProducts: number;
  totalPurchases: number;
  averagePrice: number;
  topProducts: PopularProduct[];
}

export interface ProductReview {
  id: string;
  productName: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt: Date;
  helpful: number;
}

@Injectable({
  providedIn: 'root'
})
export class PopularProductService {
  private readonly apiUrl = `${environment.apiUrl}/api/products`;

  constructor(private http: HttpClient) {}

  /**
   * Get popular products with query filters
   */
  async getPopularProducts(query: PopularProductQuery = {}): Promise<PopularProduct[]> {
    let params = new HttpParams();
    
    if (query.category) params = params.set('category', query.category);
    if (query.storeName) params = params.set('storeName', query.storeName);
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.offset) params = params.set('offset', query.offset.toString());
    if (query.minPurchaseCount) params = params.set('minPurchaseCount', query.minPurchaseCount.toString());
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.sortOrder) params = params.set('sortOrder', query.sortOrder);

    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: PopularProduct[] }>(`${this.apiUrl}/popular`, { params })
      );
      return response.data.map(product => ({
        ...product,
        lastUpdated: new Date(product.lastUpdated)
      }));
    } catch (error) {
      console.error('Failed to get popular products:', error);
      return this.getMockPopularProducts(query);
    }
  }

  /**
   * Get popular product by ID
   */
  async getPopularProductById(id: string): Promise<PopularProduct | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: PopularProduct }>(`${this.apiUrl}/popular/${id}`)
      );
      return {
        ...response.data,
        lastUpdated: new Date(response.data.lastUpdated)
      };
    } catch (error) {
      console.error('Failed to get popular product by ID:', error);
      return null;
    }
  }

  /**
   * Get popular products by store
   */
  async getPopularProductsByStore(storeName: string, limit: number = 10): Promise<PopularProductsByStore> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: PopularProductsByStore }>(`${this.apiUrl}/popular/store/${encodeURIComponent(storeName)}?limit=${limit}`)
      );
      return {
        ...response.data,
        products: response.data.products.map(product => ({
          ...product,
          lastUpdated: new Date(product.lastUpdated)
        }))
      };
    } catch (error) {
      console.error('Failed to get popular products by store:', error);
      return this.getMockPopularProductsByStore(storeName, limit);
    }
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(periodDays: number = 30, minPurchaseThreshold: number = 2): Promise<TrendingProduct[]> {
    let params = new HttpParams()
      .set('periodDays', periodDays.toString())
      .set('minPurchaseThreshold', minPurchaseThreshold.toString());

    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: TrendingProduct[] }>(`${this.apiUrl}/trending`, { params })
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get trending products:', error);
      return this.getMockTrendingProducts();
    }
  }

  /**
   * Get product recommendations
   */
  async getRecommendations(request: RecommendationRequest): Promise<ProductRecommendation[]> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; data: ProductRecommendation[] }>(`${this.apiUrl}/recommendations`, request)
      );
      return response.data.map(rec => ({
        ...rec,
        product: {
          ...rec.product,
          lastUpdated: new Date(rec.product.lastUpdated)
        },
        similarProducts: rec.similarProducts?.map(product => ({
          ...product,
          lastUpdated: new Date(product.lastUpdated)
        }))
      }));
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return this.getMockRecommendations(request);
    }
  }

  /**
   * Get product statistics by category
   */
  async getProductStatistics(): Promise<ProductStatistics[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: ProductStatistics[] }>(`${this.apiUrl}/statistics`)
      );
      return response.data.map(stat => ({
        ...stat,
        topProducts: stat.topProducts.map(product => ({
          ...product,
          lastUpdated: new Date(product.lastUpdated)
        }))
      }));
    } catch (error) {
      console.error('Failed to get product statistics:', error);
      return this.getMockProductStatistics();
    }
  }

  /**
   * Mock data for development/testing
   */
  private getMockPopularProducts(query: PopularProductQuery): PopularProduct[] {
    const mockProducts: PopularProduct[] = [
      {
        id: '1',
        productName: 'Pocky 초콜릿',
        category: '과자/스낵',
        purchaseCount: 45,
        averagePriceJpy: 150,
        averagePriceKrw: 1500,
        lastUpdated: new Date('2024-01-20')
      },
      {
        id: '2',
        productName: 'Kit Kat 말차맛',
        category: '과자/스낵',
        purchaseCount: 38,
        averagePriceJpy: 200,
        averagePriceKrw: 2000,
        lastUpdated: new Date('2024-01-19')
      },
      {
        id: '3',
        productName: 'Shiseido 선크림',
        category: '뷰티/화장품',
        purchaseCount: 32,
        averagePriceJpy: 2500,
        averagePriceKrw: 25000,
        lastUpdated: new Date('2024-01-18')
      },
      {
        id: '4',
        productName: '라무네 사이다',
        category: '음료',
        purchaseCount: 28,
        averagePriceJpy: 120,
        averagePriceKrw: 1200,
        lastUpdated: new Date('2024-01-17')
      },
      {
        id: '5',
        productName: 'Calbee 감자칩',
        category: '과자/스낵',
        purchaseCount: 25,
        averagePriceJpy: 180,
        averagePriceKrw: 1800,
        lastUpdated: new Date('2024-01-16')
      },
      {
        id: '6',
        productName: '하이츄 딸기맛',
        category: '과자/스낵',
        purchaseCount: 22,
        averagePriceJpy: 130,
        averagePriceKrw: 1300,
        lastUpdated: new Date('2024-01-15')
      },
      {
        id: '7',
        productName: 'SK-II 에센스',
        category: '뷰티/화장품',
        purchaseCount: 18,
        averagePriceJpy: 15000,
        averagePriceKrw: 150000,
        lastUpdated: new Date('2024-01-14')
      },
      {
        id: '8',
        productName: '아사히 맥주',
        category: '음료',
        purchaseCount: 35,
        averagePriceJpy: 250,
        averagePriceKrw: 2500,
        lastUpdated: new Date('2024-01-13')
      }
    ];

    // Apply filters
    let filteredProducts = mockProducts;

    if (query.category) {
      filteredProducts = filteredProducts.filter(p => p.category === query.category);
    }

    if (query.minPurchaseCount) {
      filteredProducts = filteredProducts.filter(p => p.purchaseCount >= query.minPurchaseCount!);
    }

    // Apply sorting
    if (query.sortBy) {
      filteredProducts.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (query.sortBy) {
          case 'purchaseCount':
            aValue = a.purchaseCount;
            bValue = b.purchaseCount;
            break;
          case 'averagePrice':
            aValue = a.averagePriceJpy;
            bValue = b.averagePriceJpy;
            break;
          case 'lastUpdated':
            aValue = a.lastUpdated.getTime();
            bValue = b.lastUpdated.getTime();
            break;
          default:
            return 0;
        }

        const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return query.sortOrder === 'desc' ? -result : result;
      });
    }

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    
    return filteredProducts.slice(offset, offset + limit);
  }

  private getMockPopularProductsByStore(storeName: string, limit: number): PopularProductsByStore {
    const allProducts = this.getMockPopularProducts({});
    return {
      storeName,
      products: allProducts.slice(0, limit)
    };
  }

  private getMockTrendingProducts(): TrendingProduct[] {
    return [
      {
        id: '1',
        productName: 'Kit Kat 말차맛',
        category: '과자/스낵',
        currentPurchaseCount: 38,
        previousPurchaseCount: 25,
        trendPercentage: 52.0,
        averagePriceJpy: 200,
        averagePriceKrw: 2000,
        isRising: true
      },
      {
        id: '2',
        productName: '하이츄 딸기맛',
        category: '과자/스낵',
        currentPurchaseCount: 22,
        previousPurchaseCount: 15,
        trendPercentage: 46.7,
        averagePriceJpy: 130,
        averagePriceKrw: 1300,
        isRising: true
      },
      {
        id: '3',
        productName: 'Shiseido 선크림',
        category: '뷰티/화장품',
        currentPurchaseCount: 32,
        previousPurchaseCount: 24,
        trendPercentage: 33.3,
        averagePriceJpy: 2500,
        averagePriceKrw: 25000,
        isRising: true
      }
    ];
  }

  private getMockRecommendations(request: RecommendationRequest): ProductRecommendation[] {
    const products = this.getMockPopularProducts({});
    return products.slice(0, request.limit || 5).map((product, index) => ({
      product,
      recommendationScore: 85 - index * 5,
      reason: `인기 상품 (${product.purchaseCount}회 구매)`,
      similarProducts: products.slice(index + 1, index + 4)
    }));
  }

  private getMockProductStatistics(): ProductStatistics[] {
    const products = this.getMockPopularProducts({});
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    
    return categories.map(category => {
      const categoryProducts = products.filter(p => p.category === category);
      return {
        category: category!,
        totalProducts: categoryProducts.length,
        totalPurchases: categoryProducts.reduce((sum, p) => sum + p.purchaseCount, 0),
        averagePrice: Math.round(categoryProducts.reduce((sum, p) => sum + p.averagePriceJpy, 0) / categoryProducts.length),
        topProducts: categoryProducts.slice(0, 3)
      };
    });
  }
}