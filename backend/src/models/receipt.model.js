const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameJp: { type: String, required: true },
  nameKr: { type: String, required: true },
  priceKrw: { type: Number, required: true },
  priceJpy: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  category: { type: String, required: true },
  productCode: { type: String }
}, { _id: true });

const receiptSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  storeName: { type: String, required: true },
  storeLocation: { type: String },
  totalAmountKrw: { type: Number, required: true },
  totalAmountJpy: { type: Number, required: true },
  taxAmountJpy: { type: Number, default: 0 },
  discountAmountJpy: { type: Number, default: 0 },
  exchangeRate: { type: Number, required: true },
  purchaseDate: { type: Date, required: true },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  receiptType: {
    type: String,
    enum: ['DONKI', 'CONVENIENCE', 'RESTAURANT', 'OTHER'],
    default: 'OTHER'
  },
  items: [itemSchema],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// 인덱스 설정
receiptSchema.index({ userId: 1, purchaseDate: -1 });
receiptSchema.index({ processingStatus: 1 });
receiptSchema.index({ receiptType: 1 });

module.exports = mongoose.model('Receipt', receiptSchema); 