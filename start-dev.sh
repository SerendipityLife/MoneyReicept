#!/bin/bash

echo "🚀 Money Receipt Management System 개발 환경 시작"

# 백엔드 시작
echo "📦 백엔드 의존성 설치 중..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# 환경 변수 파일 확인
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다. env.example을 복사합니다."
    cp env.example .env
    echo "📝 .env 파일을 확인하고 필요한 설정을 수정하세요."
fi

echo "🔧 백엔드 서버 시작 중..."
npm run dev &
BACKEND_PID=$!

cd ..

# 프론트엔드 시작
echo "📦 프론트엔드 의존성 설치 중..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "🔧 프론트엔드 서버 시작 중..."
npm start &
FRONTEND_PID=$!

cd ..

echo "✅ 모든 서비스가 시작되었습니다!"
echo "🌐 프론트엔드: http://localhost:4200"
echo "🔌 백엔드 API: http://localhost:3000"
echo "📊 MongoDB: http://localhost:27017"

# 종료 시그널 처리
trap 'echo "🛑 서비스 종료 중..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT

# 대기
wait 