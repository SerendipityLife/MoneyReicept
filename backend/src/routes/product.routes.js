const express = require('express');
const router = express.Router();

// 임시 데이터 저장소
let products = [
  {
    id: '1',
    name: '도쿄 타워 티켓',
    category: '관광',
    productCode: 'TT001',
    priceJpy: 3000,
    priceKrw: 27000,
    imageUrl: 'https://example.com/tokyo-tower.jpg',
    description: '도쿄 타워 전망대 입장권',
    isPopular: true,
    purchaseCount: 150,
    lastPurchased: new Date('2025-01-15'),
    receiptType: 'tourism'
  },
  {
    id: '2',
    name: '스시로 점심 세트',
    category: '식비',
    productCode: 'FD001',
    priceJpy: 1500,
    priceKrw: 13500,
    imageUrl: 'https://example.com/sushi.jpg',
    description: '스시로 점심 세트 메뉴',
    isPopular: true,
    purchaseCount: 89,
    lastPurchased: new Date('2025-01-16'),
    receiptType: 'food'
  }
];

// 모든 상품 조회
router.get('/', (req, res) => {
  try {
    res.json(products);
  } catch (error) {
    console.error('상품 조회 오류:', error);
    res.status(500).json({ error: '상품 조회에 실패했습니다.' });
  }
});

// 인기 상품 조회
router.get('/popular', (req, res) => {
  try {
    const popularProducts = products.filter(product => product.isPopular);
    res.json(popularProducts);
  } catch (error) {
    console.error('인기 상품 조회 오류:', error);
    res.status(500).json({ error: '인기 상품 조회에 실패했습니다.' });
  }
});

// 상품 상세 조회
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = products.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('상품 상세 조회 오류:', error);
    res.status(500).json({ error: '상품 상세 조회에 실패했습니다.' });
  }
});

// 새 상품 생성
router.post('/', (req, res) => {
  try {
    const { name, category, productCode, priceJpy, priceKrw, imageUrl, description, receiptType } = req.body;
    
    if (!name || !category || !priceJpy) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
    }

    const newProduct = {
      id: Date.now().toString(),
      name,
      category,
      productCode: productCode || `PRD${Date.now()}`,
      priceJpy,
      priceKrw: priceKrw || Math.round(priceJpy * 9),
      imageUrl: imageUrl || '',
      description: description || '',
      isPopular: false,
      purchaseCount: 0,
      lastPurchased: null,
      receiptType: receiptType || 'general'
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('상품 생성 오류:', error);
    res.status(500).json({ error: '상품 생성에 실패했습니다.' });
  }
});

// 상품 수정
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    products[productIndex] = { ...products[productIndex], ...updateData };
    res.json(products[productIndex]);
  } catch (error) {
    console.error('상품 수정 오류:', error);
    res.status(500).json({ error: '상품 수정에 실패했습니다.' });
  }
});

// 상품 삭제
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    products.splice(productIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error('상품 삭제 오류:', error);
    res.status(500).json({ error: '상품 삭제에 실패했습니다.' });
  }
});

module.exports = router; 