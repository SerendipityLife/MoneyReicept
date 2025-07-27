const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameJp: { type: String, required: true },
  nameKr: { type: String, required: true },
  category: { type: String, required: true },
  productCode: { type: String, unique: true },
  priceJpy: { type: Number, required: true },
  priceKrw: { type: Number, required: true },
  imageUrl: { type: String },
  description: { type: String },
  isPopular: { type: Boolean, default: false },
  purchaseCount: { type: Number, default: 0 },
  lastPurchased: { type: Date },
  receiptType: {
    type: String,
    enum: ['DONKI', 'CONVENIENCE', 'RESTAURANT', 'OTHER'],
    default: 'OTHER'
  }
}, {
  timestamps: true
});

// 인덱스 설정
productSchema.index({ category: 1 });
productSchema.index({ isPopular: 1 });
productSchema.index({ productCode: 1 });
productSchema.index({ receiptType: 1 });

module.exports = mongoose.model('Product', productSchema); 