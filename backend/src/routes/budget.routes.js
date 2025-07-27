const express = require('express');
const router = express.Router();

// 임시 데이터 저장소 (실제로는 데이터베이스 사용)
let travelPlans = [
  {
    id: '1',
    name: '도쿄 여행 2025',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-01-22'),
    budget: 500000,
    spent: 0,
    receipts: [],
    description: '도쿄 7박 8일 여행',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: '오사카 여행',
    startDate: new Date('2025-03-10'),
    endDate: new Date('2025-03-15'),
    budget: 300000,
    spent: 0,
    receipts: [],
    description: '오사카 5박 6일 여행',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// 모든 여행 계획 조회
router.get('/travel-plans', (req, res) => {
  try {
    res.json(travelPlans);
  } catch (error) {
    console.error('여행 계획 조회 오류:', error);
    res.status(500).json({ error: '여행 계획 조회에 실패했습니다.' });
  }
});

// 새 여행 계획 생성
router.post('/travel-plans', (req, res) => {
  try {
    const { name, startDate, endDate, budget, description } = req.body;
    
    // 유효성 검사
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
    }

    const newPlan = {
      id: Date.now().toString(),
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: budget || 0,
      spent: 0,
      receipts: [],
      description: description || '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    travelPlans.push(newPlan);
    res.status(201).json(newPlan);
  } catch (error) {
    console.error('여행 계획 생성 오류:', error);
    res.status(500).json({ error: '여행 계획 생성에 실패했습니다.' });
  }
});

// 여행 계획 수정
router.put('/travel-plans/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, budget, description } = req.body;
    
    const planIndex = travelPlans.findIndex(plan => plan.id === id);
    if (planIndex === -1) {
      return res.status(404).json({ error: '여행 계획을 찾을 수 없습니다.' });
    }

    const updatedPlan = {
      ...travelPlans[planIndex],
      name: name || travelPlans[planIndex].name,
      startDate: startDate ? new Date(startDate) : travelPlans[planIndex].startDate,
      endDate: endDate ? new Date(endDate) : travelPlans[planIndex].endDate,
      budget: budget !== undefined ? budget : travelPlans[planIndex].budget,
      description: description !== undefined ? description : travelPlans[planIndex].description,
      updatedAt: new Date()
    };

    travelPlans[planIndex] = updatedPlan;
    res.json(updatedPlan);
  } catch (error) {
    console.error('여행 계획 수정 오류:', error);
    res.status(500).json({ error: '여행 계획 수정에 실패했습니다.' });
  }
});

// 여행 계획 삭제
router.delete('/travel-plans/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const planIndex = travelPlans.findIndex(plan => plan.id === id);
    if (planIndex === -1) {
      return res.status(404).json({ error: '여행 계획을 찾을 수 없습니다.' });
    }

    travelPlans.splice(planIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error('여행 계획 삭제 오류:', error);
    res.status(500).json({ error: '여행 계획 삭제에 실패했습니다.' });
  }
});

// 예산 요약 조회
router.get('/summary', (req, res) => {
  try {
    const month = req.query.month ? new Date(req.query.month) : new Date();
    const currentMonth = month.getMonth();
    const currentYear = month.getFullYear();

    // 해당 월의 여행 계획들 필터링
    const monthlyPlans = travelPlans.filter(plan => {
      const planStart = new Date(plan.startDate);
      const planEnd = new Date(plan.endDate);
      const queryDate = new Date(currentYear, currentMonth, 1);
      const queryEndDate = new Date(currentYear, currentMonth + 1, 0);

      return planStart <= queryEndDate && planEnd >= queryDate;
    });

    const totalBudget = monthlyPlans.reduce((sum, plan) => sum + plan.budget, 0);
    const totalSpent = monthlyPlans.reduce((sum, plan) => sum + plan.spent, 0);

    const summary = {
      totalExpense: totalSpent,
      averageDaily: monthlyPlans.length > 0 ? totalSpent / 30 : 0,
      receiptCount: monthlyPlans.reduce((sum, plan) => sum + plan.receipts.length, 0),
      month: month
    };

    res.json(summary);
  } catch (error) {
    console.error('예산 요약 조회 오류:', error);
    res.status(500).json({ error: '예산 요약 조회에 실패했습니다.' });
  }
});

// 카테고리별 지출 조회
router.get('/categories', (req, res) => {
  try {
    // 임시 카테고리 데이터
    const categories = [
      { name: '식비', amount: 150000, percentage: 30 },
      { name: '교통비', amount: 80000, percentage: 16 },
      { name: '숙박비', amount: 200000, percentage: 40 },
      { name: '쇼핑', amount: 70000, percentage: 14 }
    ];

    res.json(categories);
  } catch (error) {
    console.error('카테고리별 지출 조회 오류:', error);
    res.status(500).json({ error: '카테고리별 지출 조회에 실패했습니다.' });
  }
});

// 일별 지출 조회
router.get('/daily', (req, res) => {
  try {
    const month = req.query.month ? new Date(req.query.month) : new Date();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    
    // 임시 일별 데이터
    const dailyExpenses = [];
    for (let day = 1; day <= daysInMonth; day++) {
      dailyExpenses.push({
        date: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        amount: Math.floor(Math.random() * 50000) + 10000
      });
    }

    res.json(dailyExpenses);
  } catch (error) {
    console.error('일별 지출 조회 오류:', error);
    res.status(500).json({ error: '일별 지출 조회에 실패했습니다.' });
  }
});

module.exports = router; 