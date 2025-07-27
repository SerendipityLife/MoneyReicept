# Money Receipt Management System

영수증 관리 시스템 - 프론트엔드와 백엔드가 분리된 구조

## 프로젝트 구조

```
MoneyReicept/
├── frontend/          # Ionic/Angular 프론트엔드
├── backend/           # Node.js/Express 백엔드
└── README.md
```

## 빠른 시작

### 백엔드 실행

```bash
cd backend
npm install
cp env.example .env
# .env 파일에서 환경 변수 설정
npm run dev
```

### 프론트엔드 실행

```bash
cd frontend
npm install
npm start
```

## 기술 스택

### 프론트엔드
- **Ionic/Angular**: 하이브리드 모바일 앱 프레임워크
- **TypeScript**: 타입 안전성
- **Chart.js**: 데이터 시각화
- **Capacitor**: 네이티브 기능 접근

### 백엔드
- **Node.js/Express**: RESTful API 서버
- **MongoDB/Mongoose**: 데이터베이스
- **JWT**: 인증
- **Multer**: 파일 업로드
- **Helmet**: 보안

## API 엔드포인트

### 영수증 관리
- `POST /api/receipts/upload` - 영수증 업로드
- `GET /api/receipts` - 영수증 목록 조회
- `GET /api/receipts/:id` - 영수증 상세 조회
- `PATCH /api/receipts/:id/status` - 처리 상태 업데이트
- `DELETE /api/receipts/:id` - 영수증 삭제

### 상품 관리
- `GET /api/products` - 상품 목록 조회
- `GET /api/products/popular` - 인기 상품 조회

### 예산 관리
- `GET /api/budgets` - 예산 조회
- `POST /api/budgets` - 예산 설정

## 환경 설정

### 백엔드 환경 변수
- `PORT`: 서버 포트 (기본값: 3000)
- `MONGODB_URI`: MongoDB 연결 문자열
- `JWT_SECRET`: JWT 시크릿 키
- `FRONTEND_URL`: 프론트엔드 URL

### 프론트엔드 환경 변수
- `apiUrl`: 백엔드 API URL
- `mockBackend`: 모의 백엔드 사용 여부

## 개발 가이드

### 백엔드 개발
1. `backend/src/controllers/` - 컨트롤러 로직
2. `backend/src/models/` - 데이터 모델
3. `backend/src/routes/` - API 라우트
4. `backend/src/middleware/` - 미들웨어

### 프론트엔드 개발
1. `frontend/src/app/services/` - API 서비스
2. `frontend/src/app/components/` - 재사용 컴포넌트
3. `frontend/src/app/pages/` - 페이지 컴포넌트
4. `frontend/src/app/models/` - 타입 정의

## 배포

### 백엔드 배포
```bash
cd backend
npm run build
npm start
```

### 프론트엔드 배포
```bash
cd frontend
npm run build
```

## 라이센스

MIT License 