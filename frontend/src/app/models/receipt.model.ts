export interface Receipt {
  id: string;
  imageUrl: string;
  storeName?: string;
  storeLocation?: string;
  totalAmountKrw: number;
  totalAmountJpy: number;
  taxAmountJpy?: number;
  discountAmountJpy?: number;
  exchangeRate?: number;
  purchaseDate: Date;
  items?: ReceiptItem[];
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  receiptType?: 'DONKI' | 'CONVENIENCE' | 'GENERAL';
  rawOcrText?: string;
  travelPlanId?: string; // 여행 계획 ID 추가
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReceiptItem {
  id: string;
  name: string;
  nameJp?: string;  // Original Japanese name
  nameKr?: string;  // Translated Korean name
  priceJpy: number;
  priceKrw: number;
  quantity: number;
  category?: string;
  productCode?: string;
}

export interface ReceiptUploadResponse {
  receiptId: string;
  message: string;
  status: 'success' | 'error';
}