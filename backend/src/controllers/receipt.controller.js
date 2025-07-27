const Receipt = require('../models/receipt.model');

// 영수증 업로드
exports.uploadReceipt = async (req, res) => {
  try {
    const { imageUrl, storeName, storeLocation, totalAmountKrw, totalAmountJpy, 
            taxAmountJpy, discountAmountJpy, exchangeRate, purchaseDate, receiptType } = req.body;
    
    const receipt = new Receipt({
      imageUrl,
      storeName,
      storeLocation,
      totalAmountKrw,
      totalAmountJpy,
      taxAmountJpy: taxAmountJpy || 0,
      discountAmountJpy: discountAmountJpy || 0,
      exchangeRate,
      purchaseDate: new Date(purchaseDate),
      receiptType: receiptType || 'OTHER',
      processingStatus: 'pending'
    });

    await receipt.save();

    res.status(201).json({
      success: true,
      data: receipt,
      message: '영수증이 성공적으로 업로드되었습니다.'
    });
  } catch (error) {
    console.error('영수증 업로드 오류:', error);
    res.status(500).json({
      success: false,
      error: '영수증 업로드 중 오류가 발생했습니다.'
    });
  }
};

// 영수증 목록 조회
exports.getReceipts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, startDate, endDate, travelPlanId } = req.query;
    
    const filter = {};
    if (status) filter.processingStatus = status;
    if (type) filter.receiptType = type;
    if (travelPlanId) filter.travelPlanId = travelPlanId;
    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate);
      if (endDate) filter.purchaseDate.$lte = new Date(endDate);
    }

    const receipts = await Receipt.find(filter)
      .sort({ purchaseDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Receipt.countDocuments(filter);

    res.json({
      success: true,
      data: receipts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('영수증 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '영수증 조회 중 오류가 발생했습니다.'
    });
  }
};

// 영수증 상세 조회
exports.getReceiptById = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    
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
};

// 영수증을 여행 계획에 할당
exports.assignReceiptToTravelPlan = async (req, res) => {
  try {
    const { travelPlanId } = req.body;
    const receipt = await Receipt.findByIdAndUpdate(
      req.params.id,
      { travelPlanId: travelPlanId || null },
      { new: true }
    );

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: '영수증을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: receipt,
      message: travelPlanId ? '영수증이 여행 계획에 할당되었습니다.' : '영수증이 여행 계획에서 제거되었습니다.'
    });
  } catch (error) {
    console.error('여행 계획 할당 오류:', error);
    res.status(500).json({
      success: false,
      error: '여행 계획 할당 중 오류가 발생했습니다.'
    });
  }
};

// 처리 상태 업데이트
exports.updateProcessingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const receipt = await Receipt.findByIdAndUpdate(
      req.params.id,
      { processingStatus: status },
      { new: true }
    );

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: '영수증을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: receipt,
      message: '처리 상태가 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('처리 상태 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      error: '처리 상태 업데이트 중 오류가 발생했습니다.'
    });
  }
};

// 영수증 삭제
exports.deleteReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findByIdAndDelete(req.params.id);
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: '영수증을 찾을 수 없습니다.'
      });
    }

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
}; 