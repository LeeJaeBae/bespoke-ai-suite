# 트러블슈팅 가이드

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> 대상: 개발자, DevOps 엔지니어, 운영팀

## 목차

1. [개요](#1-개요)
2. [시스템 진단 도구](#2-시스템-진단-도구)
3. [일반적인 문제 해결](#3-일반적인-문제-해결)
4. [성능 문제 해결](#4-성능-문제-해결)
5. [배포 관련 문제](#5-배포-관련-문제)
6. [데이터베이스 문제](#6-데이터베이스-문제)
7. [네트워크 문제](#7-네트워크-문제)
8. [보안 문제](#8-보안-문제)
9. [로그 분석](#9-로그-분석)
10. [긴급 상황 대응](#10-긴급-상황-대응)

---

## 1. 개요

이 가이드는 Bespoke AI Suite 운영 중 발생할 수 있는 다양한 문제들에 대한 체계적인 해결 방법을 제공합니다. 각 문제별로 원인 분석, 진단 방법, 해결 절차를 단계별로 설명합니다.

### 문제 해결 원칙
1. **신속한 서비스 복구** 우선
2. **근본 원인 분석** 수행
3. **재발 방지책** 수립
4. **문서화** 및 지식 공유

## 2. 시스템 진단 도구

### 기본 진단 명령어
```bash
#!/bin/bash
# scripts/system-diagnosis.sh

echo "=== Bespoke AI Suite System Diagnosis ==="
echo "Timestamp: $(date)"
echo

# Kubernetes 클러스터 상태
echo "=== Kubernetes Cluster Status ==="
kubectl cluster-info
kubectl get nodes -o wide
kubectl get pods --all-namespaces | grep -v Running
echo

# 서비스 상태 확인
echo "=== Service Status ==="
kubectl get deployments -n bespoke-production
kubectl get services -n bespoke-production
kubectl get ingress -n bespoke-production
echo

# 리소스 사용량
echo "=== Resource Usage ==="
kubectl top nodes
kubectl top pods -n bespoke-production
echo

# 이벤트 확인
echo "=== Recent Events ==="
kubectl get events -n bespoke-production --sort-by='.lastTimestamp' | tail -20
echo

# 로그 요약
echo "=== Error Logs Summary ==="
kubectl logs -n bespoke-production -l app=content-service --tail=50 | grep -i error
kubectl logs -n bespoke-production -l app=campaign-service --tail=50 | grep -i error
kubectl logs -n bespoke-production -l app=user-service --tail=50 | grep -i error
```

### 상세 진단 스크립트
```python
#!/usr/bin/env python3
# scripts/detailed-diagnosis.py

import subprocess
import json
import sys
from datetime import datetime, timedelta

class SystemDiagnostics:
    def __init__(self, namespace="bespoke-production"):
        self.namespace = namespace
        self.issues = []
    
    def check_pod_health(self):
        """Pod 상태 및 재시작 확인"""
        print("=== Pod Health Check ===")
        
        try:
            result = subprocess.run(
                ["kubectl", "get", "pods", "-n", self.namespace, "-o", "json"],
                capture_output=True, text=True, check=True
            )
            
            pods = json.loads(result.stdout)
            
            for pod in pods["items"]:
                name = pod["metadata"]["name"]
                status = pod["status"]["phase"]
                
                # 재시작 횟수 확인
                restart_count = 0
                for container_status in pod["status"].get("containerStatuses", []):
                    restart_count += container_status["restartCount"]
                    
                    if restart_count > 5:
                        self.issues.append(f"Pod {name} has {restart_count} restarts")
                
                # 상태 확인
                if status != "Running":
                    self.issues.append(f"Pod {name} is in {status} state")
                
                print(f"Pod: {name}, Status: {status}, Restarts: {restart_count}")
                
        except subprocess.CalledProcessError as e:
            print(f"Error checking pod health: {e}")
    
    def check_resource_usage(self):
        """리소스 사용량 확인"""
        print("\n=== Resource Usage Check ===")
        
        try:
            # CPU 사용량
            result = subprocess.run(
                ["kubectl", "top", "pods", "-n", self.namespace, "--no-headers"],
                capture_output=True, text=True, check=True
            )
            
            for line in result.stdout.strip().split('\n'):
                if line:
                    parts = line.split()
                    pod_name = parts[0]
                    cpu = parts[1]
                    memory = parts[2]
                    
                    # CPU 사용량이 높은 경우 (500m 이상)
                    if cpu.endswith('m') and int(cpu[:-1]) > 500:
                        self.issues.append(f"High CPU usage on {pod_name}: {cpu}")
                    
                    # 메모리 사용량이 높은 경우 (1Gi 이상)
                    if 'Gi' in memory and float(memory.replace('Gi', '')) > 1:
                        self.issues.append(f"High memory usage on {pod_name}: {memory}")
                    
                    print(f"Pod: {pod_name}, CPU: {cpu}, Memory: {memory}")
                    
        except subprocess.CalledProcessError as e:
            print(f"Error checking resource usage: {e}")
    
    def check_service_endpoints(self):
        """서비스 엔드포인트 확인"""
        print("\n=== Service Endpoints Check ===")
        
        services = ["content-service", "campaign-service", "user-service"]
        
        for service in services:
            try:
                result = subprocess.run(
                    ["kubectl", "get", "endpoints", service, "-n", self.namespace, "-o", "json"],
                    capture_output=True, text=True, check=True
                )
                
                endpoint = json.loads(result.stdout)
                
                if not endpoint.get("subsets"):
                    self.issues.append(f"Service {service} has no endpoints")
                    print(f"Service: {service}, Status: No endpoints")
                else:
                    endpoint_count = len(endpoint["subsets"][0].get("addresses", []))
                    print(f"Service: {service}, Endpoints: {endpoint_count}")
                    
            except subprocess.CalledProcessError:
                self.issues.append(f"Service {service} not found")
                print(f"Service: {service}, Status: Not found")
    
    def check_database_connectivity(self):
        """데이터베이스 연결 확인"""
        print("\n=== Database Connectivity Check ===")
        
        # PostgreSQL 연결 테스트
        try:
            result = subprocess.run([
                "kubectl", "exec", "-n", self.namespace, 
                "deployment/content-service", "--",
                "pg_isready", "-h", "postgres", "-p", "5432"
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print("PostgreSQL: Connected")
            else:
                self.issues.append("PostgreSQL connection failed")
                print("PostgreSQL: Connection failed")
                
        except subprocess.CalledProcessError:
            self.issues.append("Cannot test PostgreSQL connection")
        
        # Redis 연결 테스트
        try:
            result = subprocess.run([
                "kubectl", "exec", "-n", self.namespace,
                "deployment/content-service", "--",
                "redis-cli", "-h", "redis", "ping"
            ], capture_output=True, text=True)
            
            if "PONG" in result.stdout:
                print("Redis: Connected")
            else:
                self.issues.append("Redis connection failed")
                print("Redis: Connection failed")
                
        except subprocess.CalledProcessError:
            self.issues.append("Cannot test Redis connection")
    
    def generate_report(self):
        """진단 보고서 생성"""
        print("\n" + "="*50)
        print("DIAGNOSTIC REPORT")
        print("="*50)
        
        if not self.issues:
            print("✅ No issues detected!")
        else:
            print(f"⚠️  {len(self.issues)} issues detected:")
            for i, issue in enumerate(self.issues, 1):
                print(f"{i}. {issue}")
        
        print("\nGenerated at:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

if __name__ == "__main__":
    diagnostics = SystemDiagnostics()
    diagnostics.check_pod_health()
    diagnostics.check_resource_usage()
    diagnostics.check_service_endpoints()
    diagnostics.check_database_connectivity()
    diagnostics.generate_report()
```

## 3. 일반적인 문제 해결

### 3.1 Pod 크래시 문제

#### 증상
- Pod가 지속적으로 재시작됨
- CrashLoopBackOff 상태
- 애플리케이션 접근 불가

#### 진단 방법
```bash
# Pod 상태 확인
kubectl get pods -n bespoke-production

# Pod 상세 정보
kubectl describe pod <pod-name> -n bespoke-production

# 로그 확인 (현재 컨테이너)
kubectl logs <pod-name> -n bespoke-production

# 로그 확인 (이전 컨테이너)
kubectl logs <pod-name> -n bespoke-production --previous

# 이벤트 확인
kubectl get events --field-selector involvedObject.name=<pod-name> -n bespoke-production
```

#### 해결 방법

**1. 메모리 부족 (OOMKilled)**
```yaml
# 리소스 제한 증가
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```

**2. 설정 오류**
```bash
# ConfigMap 확인
kubectl get configmap -n bespoke-production
kubectl describe configmap <config-name> -n bespoke-production

# Secret 확인
kubectl get secrets -n bespoke-production
kubectl describe secret <secret-name> -n bespoke-production
```

**3. 종속성 문제**
```bash
# 네트워크 정책 확인
kubectl get networkpolicy -n bespoke-production

# DNS 해결 테스트
kubectl exec -it <pod-name> -n bespoke-production -- nslookup postgres
```

### 3.2 서비스 접근 불가

#### 증상
- 외부에서 서비스에 접근할 수 없음
- 500/502/503 에러 발생
- 타임아웃 발생

#### 진단 방법
```bash
# 서비스 및 엔드포인트 확인
kubectl get svc -n bespoke-production
kubectl get endpoints -n bespoke-production

# Ingress 확인
kubectl get ingress -n bespoke-production
kubectl describe ingress <ingress-name> -n bespoke-production

# 로드밸런서 상태 확인 (AWS)
aws elbv2 describe-load-balancers --load-balancer-arns <arn>
aws elbv2 describe-target-health --target-group-arn <arn>
```

#### 해결 방법

**1. Ingress 설정 문제**
```yaml
# 올바른 Ingress 설정
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bespoke-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.bespoke-ai.com
    secretName: api-tls
  rules:
  - host: api.bespoke-ai.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: content-service
            port:
              number: 80
```

**2. 서비스 셀렉터 문제**
```yaml
# Service와 Deployment 라벨 일치 확인
apiVersion: v1
kind: Service
spec:
  selector:
    app: content-service  # Deployment의 라벨과 일치해야 함
```

### 3.3 환경 변수 및 설정 문제

#### 진단 및 해결
```bash
# Pod 내부 환경 변수 확인
kubectl exec -it <pod-name> -n bespoke-production -- env | grep BESPOKE

# ConfigMap 값 확인
kubectl get configmap <config-name> -n bespoke-production -o yaml

# Secret 값 확인 (base64 디코딩)
kubectl get secret <secret-name> -n bespoke-production -o jsonpath='{.data.API_KEY}' | base64 -d

# 설정 파일 마운트 확인
kubectl exec -it <pod-name> -n bespoke-production -- ls -la /app/config/
kubectl exec -it <pod-name> -n bespoke-production -- cat /app/config/app.json
```

## 4. 성능 문제 해결

### 4.1 높은 응답 시간

#### 원인 분석
```bash
# Prometheus에서 응답 시간 메트릭 확인
curl -G 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))'

# 개별 Pod 성능 확인
kubectl exec -it <pod-name> -n bespoke-production -- curl -s http://localhost:3000/metrics | grep http_request_duration
```

#### 해결 방법

**1. 수평 확장**
```bash
# 수동 스케일링
kubectl scale deployment content-service --replicas=5 -n bespoke-production

# HPA 설정 확인
kubectl get hpa -n bespoke-production
kubectl describe hpa content-service-hpa -n bespoke-production
```

**2. 리소스 증가**
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

**3. 데이터베이스 최적화**
```sql
-- 슬로우 쿼리 확인
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 인덱스 확인
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### 4.2 메모리 누수

#### 진단
```bash
# 메모리 사용량 모니터링
kubectl top pods -n bespoke-production --sort-by=memory

# 상세 메모리 정보
kubectl exec -it <pod-name> -n bespoke-production -- cat /proc/meminfo

# Node.js 애플리케이션의 경우
kubectl exec -it <pod-name> -n bespoke-production -- curl http://localhost:3000/debug/memory
```

#### 해결 방법
```javascript
// Node.js 메모리 모니터링
const memoryUsage = process.memoryUsage();
console.log({
  rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
  heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
  heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
  external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
});

// 가비지 컬렉션 강제 실행 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  if (global.gc) {
    global.gc();
  }
}
```

## 5. 배포 관련 문제

### 5.1 롤링 업데이트 실패

#### 증상
- 새 버전 Pod가 시작되지 않음
- 배포가 중간에 멈춤
- 서비스 중단 발생

#### 진단 및 해결
```bash
# 배포 상태 확인
kubectl rollout status deployment/content-service -n bespoke-production

# 배포 기록 확인
kubectl rollout history deployment/content-service -n bespoke-production

# 문제가 있는 ReplicaSet 확인
kubectl get rs -n bespoke-production

# 즉시 롤백
kubectl rollout undo deployment/content-service -n bespoke-production

# 특정 리비전으로 롤백
kubectl rollout undo deployment/content-service --to-revision=3 -n bespoke-production
```

### 5.2 이미지 풀 오류

#### 해결 방법
```bash
# 이미지 존재 확인
docker manifest inspect your-registry.com/bespoke-content:v1.0.0

# Registry 인증 확인
kubectl get secret regcred -n bespoke-production -o yaml

# ImagePullSecret 재생성
kubectl create secret docker-registry regcred \
  --docker-server=your-registry.com \
  --docker-username=username \
  --docker-password=password \
  --docker-email=email@company.com \
  -n bespoke-production
```

## 6. 데이터베이스 문제

### 6.1 연결 풀 고갈

#### 진단
```bash
# PostgreSQL 연결 상태 확인
kubectl exec -it postgres-0 -n bespoke-production -- psql -U postgres -c "
SELECT pid, usename, application_name, client_addr, state, query_start
FROM pg_stat_activity
WHERE state = 'active';"

# 연결 수 확인
kubectl exec -it postgres-0 -n bespoke-production -- psql -U postgres -c "
SELECT count(*) as total_connections FROM pg_stat_activity;"
```

#### 해결 방법
```javascript
// Node.js 연결 풀 설정 최적화
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // 최대 연결 수
  min: 2,  // 최소 연결 수
  idle: 10000, // 유휴 시간 (10초)
  acquire: 30000, // 연결 대기 시간 (30초)
  evict: 1000 // 연결 검사 간격 (1초)
});

// 연결 모니터링
pool.on('connect', (client) => {
  console.log('Connected to database');
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// 연결 통계
setInterval(() => {
  console.log('Pool stats:', {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
}, 30000);
```

### 6.2 슬로우 쿼리

#### 진단 및 최적화
```sql
-- PostgreSQL 슬로우 쿼리 설정
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1초 이상
SELECT pg_reload_conf();

-- 인덱스 추가
CREATE INDEX CONCURRENTLY idx_contents_created_at ON contents(created_at);
CREATE INDEX CONCURRENTLY idx_contents_user_id ON contents(user_id);

-- 쿼리 플랜 분석
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM contents 
WHERE user_id = 'user123' 
ORDER BY created_at DESC 
LIMIT 10;
```

## 7. 네트워크 문제

### 7.1 서비스 간 통신 문제

#### 진단
```bash
# DNS 해결 테스트
kubectl exec -it <pod-name> -n bespoke-production -- nslookup content-service
kubectl exec -it <pod-name> -n bespoke-production -- dig content-service.bespoke-production.svc.cluster.local

# 포트 연결 테스트
kubectl exec -it <pod-name> -n bespoke-production -- telnet content-service 80
kubectl exec -it <pod-name> -n bespoke-production -- curl -v http://content-service/health

# 네트워크 정책 확인
kubectl get networkpolicy -n bespoke-production
kubectl describe networkpolicy <policy-name> -n bespoke-production
```

#### 해결 방법
```yaml
# 네트워크 정책 수정
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-inter-service
spec:
  podSelector:
    matchLabels:
      app: content-service
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: campaign-service
    ports:
    - protocol: TCP
      port: 3000
```

### 7.2 외부 API 연결 문제

#### 진단
```bash
# 외부 연결 테스트
kubectl exec -it <pod-name> -n bespoke-production -- curl -v https://api.external-service.com

# Egress 정책 확인
kubectl get networkpolicy -n bespoke-production | grep egress

# 방화벽 규칙 확인 (AWS Security Groups)
aws ec2 describe-security-groups --group-ids <sg-id>
```

## 8. 보안 문제

### 8.1 인증 실패

#### 진단 및 해결
```bash
# JWT 토큰 디코딩 및 검증
kubectl exec -it <pod-name> -n bespoke-production -- node -e "
const jwt = require('jsonwebtoken');
const token = 'your-jwt-token';
try {
  const decoded = jwt.decode(token, {complete: true});
  console.log('Header:', decoded.header);
  console.log('Payload:', decoded.payload);
} catch (err) {
  console.error('Invalid token:', err.message);
}
"

# API 키 확인
kubectl get secret api-keys -n bespoke-production -o jsonpath='{.data.BESPOKE_API_KEY}' | base64 -d

# 인증서 만료 확인
kubectl get certificate -n bespoke-production
openssl x509 -in certificate.crt -text -noout | grep "Not After"
```

### 8.2 권한 문제

#### 해결 방법
```yaml
# RBAC 확인 및 수정
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: bespoke-production
  name: content-service-role
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: content-service-binding
  namespace: bespoke-production
subjects:
- kind: ServiceAccount
  name: content-service
  namespace: bespoke-production
roleRef:
  kind: Role
  name: content-service-role
  apiGroup: rbac.authorization.k8s.io
```

## 9. 로그 분석

### 9.1 로그 검색 및 분석

#### Elasticsearch 쿼리
```bash
# 최근 에러 로그 검색
curl -X GET "elasticsearch:9200/bespoke-logs-*/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {"range": {"@timestamp": {"gte": "now-1h"}}},
        {"match": {"level": "error"}}
      ]
    }
  },
  "sort": [{"@timestamp": {"order": "desc"}}],
  "size": 100
}'

# 특정 사용자 관련 로그
curl -X GET "elasticsearch:9200/bespoke-logs-*/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {"match": {"user_id": "user123"}},
        {"range": {"@timestamp": {"gte": "now-24h"}}}
      ]
    }
  }
}'
```

### 9.2 로그 집계 및 패턴 분석
```python
#!/usr/bin/env python3
# scripts/log-analysis.py

import json
import requests
from collections import Counter
from datetime import datetime, timedelta

class LogAnalyzer:
    def __init__(self, elasticsearch_url):
        self.es_url = elasticsearch_url
    
    def analyze_errors(self, hours=24):
        """에러 로그 분석"""
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"level": "error"}},
                        {"range": {"@timestamp": {"gte": f"now-{hours}h"}}}
                    ]
                }
            },
            "size": 1000
        }
        
        response = requests.post(
            f"{self.es_url}/bespoke-logs-*/_search",
            json=query,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            hits = response.json()["hits"]["hits"]
            error_messages = [hit["_source"]["message"] for hit in hits]
            
            # 에러 메시지 빈도 분석
            error_counter = Counter(error_messages)
            
            print(f"Top 10 errors in last {hours} hours:")
            for error, count in error_counter.most_common(10):
                print(f"{count:3d}: {error}")
        
        return error_counter
    
    def analyze_performance(self, hours=1):
        """성능 로그 분석"""
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"exists": {"field": "duration"}},
                        {"range": {"@timestamp": {"gte": f"now-{hours}h"}}}
                    ]
                }
            },
            "aggs": {
                "avg_duration": {"avg": {"field": "duration"}},
                "max_duration": {"max": {"field": "duration"}},
                "percentiles": {
                    "percentiles": {
                        "field": "duration",
                        "percents": [50, 90, 95, 99]
                    }
                }
            },
            "size": 0
        }
        
        response = requests.post(
            f"{self.es_url}/bespoke-logs-*/_search",
            json=query,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            aggs = response.json()["aggregations"]
            print(f"Performance metrics for last {hours} hours:")
            print(f"Average duration: {aggs['avg_duration']['value']:.2f}ms")
            print(f"Max duration: {aggs['max_duration']['value']:.2f}ms")
            
            percentiles = aggs['percentiles']['values']
            for p, value in percentiles.items():
                print(f"{p}th percentile: {value:.2f}ms")

if __name__ == "__main__":
    analyzer = LogAnalyzer("http://elasticsearch:9200")
    analyzer.analyze_errors(24)
    analyzer.analyze_performance(1)
```

## 10. 긴급 상황 대응

### 10.1 서비스 전체 중단

#### 즉시 대응 절차
```bash
#!/bin/bash
# scripts/emergency-response.sh

echo "=== EMERGENCY RESPONSE PROTOCOL ==="
echo "Timestamp: $(date)"

# 1. 시스템 상태 빠른 확인
echo "1. Quick system check..."
kubectl get nodes
kubectl get pods -n bespoke-production | grep -v Running

# 2. 트래픽 차단 (필요시)
echo "2. Traffic control..."
# kubectl patch ingress bespoke-ingress -n bespoke-production -p '{"spec":{"rules":[]}}'

# 3. 이전 버전으로 롤백
echo "3. Emergency rollback..."
kubectl rollout undo deployment/content-service -n bespoke-production
kubectl rollout undo deployment/campaign-service -n bespoke-production
kubectl rollout undo deployment/user-service -n bespoke-production

# 4. 스케일 다운 후 스케일 업 (재시작)
echo "4. Service restart..."
kubectl scale deployment content-service --replicas=0 -n bespoke-production
sleep 10
kubectl scale deployment content-service --replicas=3 -n bespoke-production

# 5. 헬스체크
echo "5. Health check..."
sleep 30
kubectl get pods -n bespoke-production
```

### 10.2 데이터베이스 장애

#### 복구 절차
```bash
# 1. 백업에서 복구
kubectl exec -it postgres-0 -n bespoke-production -- pg_basebackup -h backup-server -D /backup -U postgres -v -P

# 2. 읽기 전용 모드로 전환
kubectl patch configmap postgres-config -n bespoke-production --patch '
data:
  postgresql.conf: |
    default_transaction_read_only = on
'

# 3. 연결 제한
kubectl patch configmap postgres-config -n bespoke-production --patch '
data:
  postgresql.conf: |
    max_connections = 10
'

# 4. 애플리케이션 유지보수 모드
kubectl patch configmap app-config -n bespoke-production --patch '
data:
  maintenance_mode: "true"
'
```

### 10.3 보안 침해 의심

#### 즉시 대응
```bash
# 1. 외부 트래픽 차단
kubectl patch networkpolicy default-deny-all -n bespoke-production --patch '
spec:
  policyTypes:
  - Ingress
  - Egress
  ingress: []
  egress: []
'

# 2. 의심스러운 Pod 격리
kubectl label pod <suspicious-pod> quarantine=true -n bespoke-production
kubectl patch networkpolicy quarantine-policy -n bespoke-production --patch '
spec:
  podSelector:
    matchLabels:
      quarantine: "true"
  policyTypes:
  - Ingress
  - Egress
  ingress: []
  egress: []
'

# 3. 로그 수집 및 보존
kubectl logs <suspicious-pod> -n bespoke-production > incident-$(date +%Y%m%d-%H%M%S).log

# 4. 시크릿 및 인증서 무효화
kubectl delete secret api-keys -n bespoke-production
kubectl delete certificate tls-cert -n bespoke-production
```

### 10.4 에스컬레이션 절차

1. **Level 1**: 자동 알림 (Slack, 이메일)
2. **Level 2**: 온콜 엔지니어 호출 (PagerDuty)
3. **Level 3**: 팀 리드 및 CTO 알림
4. **Level 4**: 경영진 보고

### 10.5 사후 분석 (Post-mortem)

#### 템플릿
```markdown
# Incident Report: [Title]

## Summary
- **Date**: 2025-08-04
- **Duration**: 45 minutes
- **Impact**: 15% of users affected
- **Severity**: High

## Timeline
- 14:30: First alert received
- 14:32: Investigation started
- 14:45: Root cause identified
- 15:00: Fix deployed
- 15:15: Service fully restored

## Root Cause
Memory leak in content generation service causing OOM kills.

## Impact
- 1,250 failed requests
- $2,500 estimated revenue loss
- Customer complaints: 23

## Lessons Learned
1. Need better memory monitoring
2. Resource limits were too low
3. Load testing didn't catch this scenario

## Action Items
- [ ] Implement memory leak detection
- [ ] Increase resource limits
- [ ] Improve load testing scenarios
- [ ] Add proactive alerting

## Prevention
- Regular memory profiling
- Automated resource scaling
- Enhanced monitoring
```

## 체크리스트

### 일상 점검
- [ ] 모든 Pod가 Running 상태
- [ ] 리소스 사용량 정상 범위
- [ ] 에러 로그 확인
- [ ] 성능 메트릭 검토
- [ ] 백업 상태 확인

### 문제 발생 시
- [ ] 영향 범위 파악
- [ ] 증상 기록
- [ ] 로그 수집
- [ ] 임시 조치 실행
- [ ] 근본 원인 분석
- [ ] 영구 해결책 적용
- [ ] 재발 방지책 수립

### 사후 조치
- [ ] 인시던트 보고서 작성
- [ ] 지식베이스 업데이트
- [ ] 모니터링 개선
- [ ] 팀 교육 실시

---

*빠르고 정확한 문제 해결로 서비스 안정성을 확보하세요! 🔧*