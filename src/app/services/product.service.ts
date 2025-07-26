import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ProductImage, ProductAnalysisResult, ProductGalleryFilter } from '../models/product.model';
import { environment } from '../../environments/environment';

export interface ProductUploadResponse {
  success: boolean;
  data?: {
    imageUrl: string;
    analysis: ProductAnalysisResult;
    validation: {
      isValid: boolean;
      issues: string[];
    };
    metadata: {
      originalName: string;
      size: number;
      mimetype: string;
    };
  };
  message?: string;
  error?: string;
}

export interface ProductSaveRequest {
  receiptItemId?: string;
  imageUrl: string;
  productName?: string;
  brand?: string;
  category?: string;
  description?: string;
  confidenceScore?: number;
}

export interface ProductStatistics {
  totalImages: number;
  categoryCounts: { category: string; count: number }[];
  brandCounts: { brand: string; count: number }[];
  averageConfidence: number;
  recentAnalyses: ProductImage[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/api/product-images`;

  constructor(private http: HttpClient) {}

  /**
   * Upload and analyze product image
   */
  async uploadAndAnalyzeProduct(imageFile: File): Promise<ProductUploadResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await firstValueFrom(
        this.http.post<ProductUploadResponse>(`${this.apiUrl}/analyze`, formData)
      );
      return response;
    } catch (error) {
      console.error('Product upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload product image from data URL
   */
  async uploadProductFromDataUrl(dataUrl: string, filename: string = 'product.jpg'): Promise<ProductUploadResponse> {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type });
    
    return this.uploadAndAnalyzeProduct(file);
  }

  /**
   * Save analyzed product to database
   */
  async saveProduct(productData: ProductSaveRequest): Promise<ProductImage> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; data: ProductImage }>(`${this.apiUrl}/save`, productData)
      );
      return response.data;
    } catch (error) {
      console.error('Failed to save product:', error);
      throw error;
    }
  }

  /**
   * Get product gallery with filters
   */
  async getProductGallery(filter: ProductGalleryFilter): Promise<ProductImage[]> {
    let params = new HttpParams();
    
    if (filter.category) params = params.set('category', filter.category);
    if (filter.brand) params = params.set('brand', filter.brand);
    if (filter.startDate) params = params.set('startDate', filter.startDate.toISOString());
    if (filter.endDate) params = params.set('endDate', filter.endDate.toISOString());
    if (filter.minConfidence !== undefined) params = params.set('minConfidence', filter.minConfidence.toString());
    if (filter.limit) params = params.set('limit', filter.limit.toString());
    if (filter.offset) params = params.set('offset', filter.offset.toString());

    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: ProductImage[] }>(`${this.apiUrl}/gallery`, { params })
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get product gallery:', error);
      // Return mock data for development/testing
      return this.getMockProductGallery(filter);
    }
  }

  /**
   * Mock data for development/testing
   */
  private getMockProductGallery(filter: ProductGalleryFilter): ProductImage[] {
    const mockProducts: ProductImage[] = [
      {
        id: '1',
        receiptItemId: 'item1',
        imageUrl: 'https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=Pocky',
        productName: 'Pocky 초콜릿',
        brand: 'Glico',
        category: '과자/스낵',
        description: '일본의 대표적인 과자 브랜드 글리코의 포키 초콜릿맛',
        confidenceScore: 0.95,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        receiptItemId: 'item2',
        imageUrl: 'https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=Kit+Kat',
        productName: 'Kit Kat 말차맛',
        brand: 'Nestle',
        category: '과자/스낵',
        description: '일본 한정 말차맛 킷캣',
        confidenceScore: 0.88,
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16')
      },
      {
        id: '3',
        receiptItemId: 'item3',
        imageUrl: 'https://via.placeholder.com/300x300/45B7D1/FFFFFF?text=Shiseido',
        productName: 'Shiseido 선크림',
        brand: 'Shiseido',
        category: '뷰티/화장품',
        description: '시세이도 아네사 퍼펙트 UV 선크림',
        confidenceScore: 0.92,
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17')
      },
      {
        id: '4',
        receiptItemId: 'item4',
        imageUrl: 'https://via.placeholder.com/300x300/96CEB4/FFFFFF?text=Ramune',
        productName: '라무네 사이다',
        brand: 'Sangaria',
        category: '음료',
        description: '일본 전통 탄산음료 라무네',
        confidenceScore: 0.76,
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18')
      },
      {
        id: '5',
        receiptItemId: 'item5',
        imageUrl: 'https://via.placeholder.com/300x300/FFEAA7/000000?text=Calbee',
        productName: 'Calbee 감자칩',
        brand: 'Calbee',
        category: '과자/스낵',
        description: '칼비 오리지널 감자칩',
        confidenceScore: 0.84,
        createdAt: new Date('2024-01-19'),
        updatedAt: new Date('2024-01-19')
      }
    ];

    // Apply filters
    let filteredProducts = mockProducts;

    if (filter.category) {
      filteredProducts = filteredProducts.filter(p => p.category === filter.category);
    }

    if (filter.brand) {
      filteredProducts = filteredProducts.filter(p => p.brand === filter.brand);
    }

    if (filter.minConfidence !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.confidenceScore >= filter.minConfidence!);
    }

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 50;
    
    return filteredProducts.slice(offset, offset + limit);
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<ProductImage> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: ProductImage }>(`${this.apiUrl}/images/${id}`)
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get product:', error);
      throw error;
    }
  }

  /**
   * Update product information
   */
  async updateProduct(id: string, updates: Partial<ProductImage>): Promise<ProductImage> {
    try {
      const response = await firstValueFrom(
        this.http.put<{ success: boolean; data: ProductImage }>(`${this.apiUrl}/images/${id}`, updates)
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete<{ success: boolean }>(`${this.apiUrl}/images/${id}`)
      );
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  }

  /**
   * Find similar products
   */
  async findSimilarProducts(productName?: string, brand?: string, category?: string, limit: number = 10): Promise<ProductImage[]> {
    let params = new HttpParams();
    
    if (productName) params = params.set('productName', productName);
    if (brand) params = params.set('brand', brand);
    if (category) params = params.set('category', category);
    params = params.set('limit', limit.toString());

    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: ProductImage[] }>(`${this.apiUrl}/similar`, { params })
      );
      return response.data;
    } catch (error) {
      console.error('Failed to find similar products:', error);
      // Return mock similar products
      const mockProducts = this.getMockProductGallery({});
      return mockProducts.filter(p => 
        (!brand || p.brand === brand) && 
        (!category || p.category === category)
      ).slice(0, limit);
    }
  }

  /**
   * Get product statistics
   */
  async getProductStatistics(): Promise<ProductStatistics> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: ProductStatistics }>(`${this.apiUrl}/statistics`)
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get product statistics:', error);
      throw error;
    }
  }

  /**
   * Get products by receipt item ID
   */
  async getProductsByReceiptItem(receiptItemId: string): Promise<ProductImage[]> {
    let params = new HttpParams().set('receiptItemId', receiptItemId);

    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: ProductImage[] }>(`${this.apiUrl}/gallery`, { params })
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get products by receipt item:', error);
      throw error;
    }
  }

  /**
   * Health check for product service
   */
  async healthCheck(): Promise<{ service: string; status: string; components: any }> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/health`)
      );
      return response.data;
    } catch (error) {
      console.error('Product service health check failed:', error);
      throw error;
    }
  }
}