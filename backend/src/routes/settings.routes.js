const express = require('express');
const router = express.Router();

// 임시 설정 데이터 저장소
let settings = {
  language: 'ko',
  currency: 'KRW',
  notifications: true,
  autoUpload: false,
  theme: 'light',
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    screenReader: false
  }
};

// 설정 조회
router.get('/', (req, res) => {
  try {
    res.json(settings);
  } catch (error) {
    console.error('설정 조회 오류:', error);
    res.status(500).json({ error: '설정 조회에 실패했습니다.' });
  }
});

// 설정 업데이트
router.put('/', (req, res) => {
  try {
    const updateData = req.body;
    
    settings = { ...settings, ...updateData };
    res.json(settings);
  } catch (error) {
    console.error('설정 업데이트 오류:', error);
    res.status(500).json({ error: '설정 업데이트에 실패했습니다.' });
  }
});

// 언어 설정 업데이트
router.put('/language', (req, res) => {
  try {
    const { language } = req.body;
    
    if (!language) {
      return res.status(400).json({ error: '언어 설정이 필요합니다.' });
    }

    settings.language = language;
    res.json({ language: settings.language });
  } catch (error) {
    console.error('언어 설정 업데이트 오류:', error);
    res.status(500).json({ error: '언어 설정 업데이트에 실패했습니다.' });
  }
});

// 통화 설정 업데이트
router.put('/currency', (req, res) => {
  try {
    const { currency } = req.body;
    
    if (!currency) {
      return res.status(400).json({ error: '통화 설정이 필요합니다.' });
    }

    settings.currency = currency;
    res.json({ currency: settings.currency });
  } catch (error) {
    console.error('통화 설정 업데이트 오류:', error);
    res.status(500).json({ error: '통화 설정 업데이트에 실패했습니다.' });
  }
});

// 알림 설정 업데이트
router.put('/notifications', (req, res) => {
  try {
    const { notifications } = req.body;
    
    if (typeof notifications !== 'boolean') {
      return res.status(400).json({ error: '알림 설정은 boolean 값이어야 합니다.' });
    }

    settings.notifications = notifications;
    res.json({ notifications: settings.notifications });
  } catch (error) {
    console.error('알림 설정 업데이트 오류:', error);
    res.status(500).json({ error: '알림 설정 업데이트에 실패했습니다.' });
  }
});

// 접근성 설정 업데이트
router.put('/accessibility', (req, res) => {
  try {
    const { accessibility } = req.body;
    
    if (!accessibility) {
      return res.status(400).json({ error: '접근성 설정이 필요합니다.' });
    }

    settings.accessibility = { ...settings.accessibility, ...accessibility };
    res.json({ accessibility: settings.accessibility });
  } catch (error) {
    console.error('접근성 설정 업데이트 오류:', error);
    res.status(500).json({ error: '접근성 설정 업데이트에 실패했습니다.' });
  }
});

// 테마 설정 업데이트
router.put('/theme', (req, res) => {
  try {
    const { theme } = req.body;
    
    if (!theme || !['light', 'dark', 'auto'].includes(theme)) {
      return res.status(400).json({ error: '유효한 테마 설정이 필요합니다.' });
    }

    settings.theme = theme;
    res.json({ theme: settings.theme });
  } catch (error) {
    console.error('테마 설정 업데이트 오류:', error);
    res.status(500).json({ error: '테마 설정 업데이트에 실패했습니다.' });
  }
});

module.exports = router; 