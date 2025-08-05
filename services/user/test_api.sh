#!/bin/bash

# API 테스트 스크립트
BASE_URL="http://localhost:8080/api/v1"

echo "=== User Service API 테스트 ==="
echo ""

# 1. Health Check
echo "1. Health Check 테스트"
curl -X GET http://localhost:8080/health
echo -e "\n"

# 2. 사용자 등록
echo "2. 사용자 등록 테스트"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User"
  }')

echo $REGISTER_RESPONSE | jq .
echo ""

# 3. 로그인
echo "3. 로그인 테스트"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }')

echo $LOGIN_RESPONSE | jq .
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo ""

# 4. 프로필 조회
if [ "$TOKEN" != "null" ]; then
  echo "4. 프로필 조회 테스트"
  curl -s -X GET $BASE_URL/users/me \
    -H "Authorization: Bearer $TOKEN" | jq .
else
  echo "로그인 실패로 프로필 조회 테스트 스킵"
fi