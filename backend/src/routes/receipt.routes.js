const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receipt.controller');

// 임시 영수증 데이터
let receipts = [
  {
    id: '1',
    imageUrl: 'https://example.com/receipt1.jpg',
    storeName: '도쿄 스시로',
    storeLocation: '도쿄, 시부야',
    totalAmountKrw: 45000,
    totalAmountJpy: 5000,
    taxAmountJpy: 400,
    discountAmountJpy: 0,
    exchangeRate: 9.0,
    purchaseDate: new Date('2025-01-16'),
    receiptType: 'GENERAL',
    processingStatus: 'completed',
    travelPlanId: '1',
    items: [
      { id: '1', name: '스시 세트', priceJpy: 3000, priceKrw: 27000, quantity: 1 },
      { id: '2', name: '미소국', priceJpy: 500, priceKrw: 4500, quantity: 1 },
      { id: '3', name: '차', priceJpy: 200, priceKrw: 1800, quantity: 1 }
    ],
    createdAt: new Date('2025-01-16'),
    updatedAt: new Date('2025-01-16')
  },
  {
    id: '2',
    imageUrl: 'https://example.com/receipt2.jpg',
    storeName: '도쿄 타워',
    storeLocation: '도쿄, 미나토',
    totalAmountKrw: 27000,
    totalAmountJpy: 3000,
    taxAmountJpy: 240,
    discountAmountJpy: 0,
    exchangeRate: 9.0,
    purchaseDate: new Date('2025-01-17'),
    receiptType: 'GENERAL',
    processingStatus: 'completed',
    travelPlanId: '1',
    items: [
      { id: '4', name: '전망대 입장권', priceJpy: 3000, priceKrw: 27000, quantity: 1 }
    ],
    createdAt: new Date('2025-01-17'),
    updatedAt: new Date('2025-01-17')
  },
  {
    id: '3',
    imageUrl: 'https://example.com/receipt3.jpg',
    storeName: '도쿄 돈키호테',
    storeLocation: '도쿄, 시부야',
    totalAmountKrw: 18000,
    totalAmountJpy: 2000,
    taxAmountJpy: 160,
    discountAmountJpy: 0,
    exchangeRate: 9.0,
    purchaseDate: new Date('2025-01-18'),
    receiptType: 'DONKI',
    processingStatus: 'completed',
    travelPlanId: '1',
    items: [
      { id: '5', name: '초콜릿', priceJpy: 800, priceKrw: 7200, quantity: 2 },
      { id: '6', name: '과자', priceJpy: 400, priceKrw: 3600, quantity: 1 }
    ],
    createdAt: new Date('2025-01-18'),
    updatedAt: new Date('2025-01-18')
  }
];

// 영수증 목록 조회 (임시 데이터 사용)
router.get('/', (req, res) => {
  try {
    const { travelPlanId, status, type, page = 1, limit = 10 } = req.query;
    
    let filteredReceipts = [...receipts];
    
    // 여행 계획별 필터링
    if (travelPlanId) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.travelPlanId === travelPlanId);
    }
    
    // 상태별 필터링
    if (status) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.processingStatus === status);
    }
    
    // 타입별 필터링
    if (type) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.receiptType === type);
    }
    
    // 정렬 (최신순)
    filteredReceipts.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
    
    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedReceipts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredReceipts.length / limit),
        totalItems: filteredReceipts.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('영수증 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '영수증 조회 중 오류가 발생했습니다.'
    });
  }
});

// 영수증 상세 조회 (임시 데이터 사용)
router.get('/:id', (req, res) => {
  try {
    const receipt = receipts.find(r => r.id === req.params.id);
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: '영수증을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error('영수증 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '영수증 상세 조회 중 오류가 발생했습니다.'
    });
  }
});

// 영수증을 여행 계획에 할당 (임시 데이터 사용)
router.patch('/:id/travel-plan', (req, res) => {
  try {
    const { travelPlanId } = req.body;
    const receiptIndex = receipts.findIndex(r => r.id === req.params.id);
    
    if (receiptIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '영수증을 찾을 수 없습니다.'
      });
    }
    
    receipts[receiptIndex].travelPlanId = travelPlanId || null;
    receipts[receiptIndex].updatedAt = new Date();
    
    res.json({
      success: true,
      data: receipts[receiptIndex],
      message: travelPlanId ? '영수증이 여행 계획에 할당되었습니다.' : '영수증이 여행 계획에서 제거되었습니다.'
    });
  } catch (error) {
    console.error('여행 계획 할당 오류:', error);
    res.status(500).json({
      success: false,
      error: '여행 계획 할당 중 오류가 발생했습니다.'
    });
  }
});

// 처리 상태 업데이트 (임시 데이터 사용)
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const receiptIndex = receipts.findIndex(r => r.id === req.params.id);
    
    if (receiptIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '영수증을 찾을 수 없습니다.'
      });
    }
    
    receipts[receiptIndex].processingStatus = status;
    receipts[receiptIndex].updatedAt = new Date();
    
    res.json({
      success: true,
      data: receipts[receiptIndex],
      message: '처리 상태가 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('처리 상태 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      error: '처리 상태 업데이트 중 오류가 발생했습니다.'
    });
  }
});

// 영수증 삭제 (임시 데이터 사용)
router.delete('/:id', (req, res) => {
  try {
    const receiptIndex = receipts.findIndex(r => r.id === req.params.id);
    
    if (receiptIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '영수증을 찾을 수 없습니다.'
      });
    }
    
    receipts.splice(receiptIndex, 1);
    
    res.json({
      success: true,
      message: '영수증이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('영수증 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '영수증 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 영수증 업로드 (임시 데이터 사용)
router.post('/upload', (req, res) => {
  try {
    const { imageUrl, storeName, storeLocation, totalAmountKrw, totalAmountJpy, 
            taxAmountJpy, discountAmountJpy, exchangeRate, purchaseDate, receiptType } = req.body;
    
    const newReceipt = {
      id: Date.now().toString(),
      imageUrl,
      storeName,
      storeLocation,
      totalAmountKrw,
      totalAmountJpy,
      taxAmountJpy: taxAmountJpy || 0,
      discountAmountJpy: discountAmountJpy || 0,
      exchangeRate: exchangeRate || 9.0,
      purchaseDate: new Date(purchaseDate),
      receiptType: receiptType || 'GENERAL',
      processingStatus: 'pending',
      travelPlanId: null,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    receipts.push(newReceipt);

    res.status(201).json({
      success: true,
      data: newReceipt,
      message: '영수증이 성공적으로 업로드되었습니다.'
    });
  } catch (error) {
    console.error('영수증 업로드 오류:', error);
    res.status(500).json({
      success: false,
      error: '영수증 업로드 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 