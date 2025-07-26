export interface ProductImage {
  id: string;
  receiptItemId: string;
  imageUrl: string;
  productName?: string;
  brand?: string;
  category?: string;
  description?: string;
  confidenceScore: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductAnalysisResult {
  productName?: string;
  brand?: string;
  category?: string;
  description?: string;
  confidenceScore: number;
  detectedLabels?: string[];
  colors?: string[];
  estimatedPrice?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface ProductGalleryFilter {
  category?: string;
  brand?: string;
  storeName?: string;
  startDate?: Date;
  endDate?: Date;
  minConfidence?: number;
  limit?: number;
  offset?: number;
}

export interface ProductUploadData {
  imageDataUrl: string;
  receiptItemId?: string;
  manualData?: {
    productName?: string;
    brand?: string;
    category?: string;
    description?: string;
  };
}

export interface ProductEditData {
  productName?: string;
  brand?: string;
  category?: string;
  description?: string;
  confidenceScore?: number;
}

// Common product categories for Japanese products
export const PRODUCT_CATEGORIES = [
  '과자/스낵',
  '음료',
  '식품',
  '뷰티/화장품',
  '의약품',
  '생활용품',
  '패션/의류',
  '전자제품',
  '문구/잡화',
  '기타'
] as const;

// Common Japanese brands
export const JAPANESE_BRANDS = [
  'Pocky',
  'Kit Kat',
  'Meiji',
  'Glico',
  'Calbee',
  'Nissin',
  'Shiseido',
  'SK-II',
  'Uniqlo',
  'Muji',
  'Nintendo',
  'Sony',
  'Panasonic',
  'DHC',
  'Rohto',
  'Lion',
  'Kao',
  'P&G Japan'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
export type JapaneseBrand = typeof JAPANESE_BRANDS[number];