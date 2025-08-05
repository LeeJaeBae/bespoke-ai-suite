# 01. 인프라 구성 태스크 체크리스트

> **Phase 1**: 인프라 기반 구축  
> **예상 기간**: 1-2개월  
> **우선순위**: Critical  
> **담당자**: DevOps 엔지니어, 시스템 관리자

## 📋 개요

Bespoke AI Suite의 인프라 기반을 구축하는 태스크들입니다. Kubernetes 기반 컨테이너 오케스트레이션, CI/CD 파이프라인, 모니터링 시스템을 포함합니다.

## 🎯 목표

- [ ] **생산 준비된 Kubernetes 클러스터 구축**
- [ ] **자동화된 CI/CD 파이프라인 구현**
- [ ] **모니터링 및 로깅 시스템 구성**
- [ ] **보안 강화된 네트워크 인프라**

---

## 🏗️ 1. 개발 환경 설정

### 1.1 로컬 개발 도구 설치
- [x] **Node.js 설치**
  ```bash
  # Node.js 23 LTS 설치
  nvm install 23
  nvm use 23
  node --version  # v23.x.x 확인
  ```
  - 완료일: 2025-08-06
  - 검증: `node --version` 출력 확인 ✅

- [x] **Docker Desktop 설치**
  ```bash
  # macOS
  brew install --cask docker
  # 또는 공식 웹사이트에서 다운로드
  ```
  - 완료일: 2025-08-06
  - 검증: `docker --version` 출력 확인 ✅ (Docker 26)

- [x] **Kubernetes CLI 설치**
  ```bash
  # kubectl 설치
  brew install kubectl
  kubectl version --client
  ```
  - 완료일: 2025-08-06
  - 검증: `kubectl version --client` 출력 확인 ✅

- [ ] **Helm 설치**
  ```bash
  brew install helm
  helm version
  ```
  - 완료일: ___________
  - 검증: `helm version` 출력 확인

### 1.2 클라우드 CLI 도구
- [x] **AWS CLI 설치 및 설정**
  ```bash
  brew install awscli
  aws configure
  aws sts get-caller-identity
  ```
  - 완료일: ___________
  - 검증: AWS 계정 정보 출력 확인

- [ ] **Google Cloud CLI (선택사항)**
  ```bash
  brew install --cask google-cloud-sdk
  gcloud init
  ```
  - 완료일: ___________
  - 검증: 프로젝트 설정 완료

### 1.3 개발 도구 설정
- [x] **VS Code + 확장 프로그램**
  - Docker 확장
  - Kubernetes 확장
  - YAML 확장
  - Git 확장
  - 완료일: ___________

- [x] **Git 설정**
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  git config --global init.defaultBranch main
  ```
  - 완료일: ___________

---

## ☁️ 2. 클라우드 인프라 구축

### 2.1 AWS 기본 인프라
- [ ] **VPC 생성**
  ```bash
  # Terraform 또는 AWS CLI로 VPC 생성
  # - CIDR: 10.0.0.0/16
  # - Public/Private 서브넷 각 3개 (Multi-AZ)
  # - Internet Gateway, NAT Gateway 설정
  ```
  - 완료일: ___________
  - 검증: VPC 대시보드에서 확인

- [ ] **보안 그룹 설정**
  - HTTP/HTTPS (80, 443) 허용
  - Kubernetes API (6443) 허용  
  - PostgreSQL (5432) 내부 통신만
  - MongoDB (27017) 내부 통신만
  - 완료일: ___________

- [ ] **IAM 역할 및 정책 생성**
  - EKS 클러스터 역할
  - EKS 노드 그룹 역할
  - ALB Controller 역할
  - 완료일: ___________

### 2.2 EKS 클러스터 구축
- [ ] **EKS 클러스터 생성**
  ```bash
  # eksctl을 사용한 클러스터 생성
  eksctl create cluster \
    --name bespoke-ai-cluster \
    --version 1.28 \
    --region us-west-2 \
    --nodegroup-name worker-nodes \
    --node-type m5.large \
    --nodes 3 \
    --nodes-min 3 \
    --nodes-max 10 \
    --managed
  ```
  - 완료일: ___________
  - 검증: `kubectl get nodes` 실행

- [ ] **kubectl 설정**
  ```bash
  aws eks update-kubeconfig --region us-west-2 --name bespoke-ai-cluster
  kubectl get svc
  ```
  - 완료일: ___________
  - 검증: Kubernetes API 접근 확인

- [ ] **클러스터 오토스케일러 설치**
  ```bash
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml
  ```
  - 완료일: ___________
  - 검증: 스케일러 파드 실행 확인

### 2.3 네트워크 구성
- [ ] **AWS Load Balancer Controller 설치**
  ```bash
  helm repo add eks https://aws.github.io/eks-charts
  helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    -n kube-system \
    --set clusterName=bespoke-ai-cluster
  ```
  - 완료일: ___________
  - 검증: 컨트롤러 파드 실행 확인

- [ ] **Ingress Nginx 설치**
  ```bash
  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
  helm install ingress-nginx ingress-nginx/ingress-nginx \
    --namespace ingress-nginx \
    --create-namespace
  ```
  - 완료일: ___________
  - 검증: 외부 IP 할당 확인

- [ ] **Certificate Manager 설치**
  ```bash
  kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
  ```
  - 완료일: ___________
  - 검증: SSL 인증서 자동 발급 테스트

---

## 📦 3. 컨테이너 레지스트리

### 3.1 Docker Registry 설정
- [ ] **AWS ECR 레포지토리 생성**
  ```bash
  # 각 마이크로서비스별 레포지토리 생성
  aws ecr create-repository --repository-name bespoke-ai/content-service
  aws ecr create-repository --repository-name bespoke-ai/campaign-service
  aws ecr create-repository --repository-name bespoke-ai/user-service
  aws ecr create-repository --repository-name bespoke-ai/analytics-service
  ```
  - 완료일: ___________
  - 검증: ECR 콘솔에서 레포지토리 확인

- [ ] **Docker 인증 설정**
  ```bash
  aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com
  ```
  - 완료일: ___________
  - 검증: 로그인 성공 메시지 확인

### 3.2 이미지 스캔 설정
- [ ] **취약점 스캔 활성화**
  - ECR에서 이미지 스캔 자동 설정
  - Snyk 또는 Trivy 통합
  - 완료일: ___________

---

## 🔄 4. CI/CD 파이프라인

### 4.1 GitHub Actions 설정
- [ ] **저장소 Secrets 설정**
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY
  - AWS_REGION
  - ECR_REGISTRY
  - KUBE_CONFIG
  - 완료일: ___________

- [ ] **기본 워크플로우 생성**
  ```yaml
  # .github/workflows/ci.yml
  name: CI/CD Pipeline
  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main]
  ```
  - 완료일: ___________
  - 검증: 워크플로우 실행 확인

- [ ] **빌드 및 테스트 단계**
  - 코드 품질 검사 (ESLint, Prettier)
  - 단위 테스트 실행
  - 보안 스캔 (SAST)
  - 완료일: ___________

- [ ] **배포 단계**
  - Docker 이미지 빌드
  - ECR에 푸시
  - Kubernetes 배포
  - 완료일: ___________

### 4.2 ArgoCD 설치 (GitOps)
- [ ] **ArgoCD 설치**
  ```bash
  kubectl create namespace argocd
  kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
  ```
  - 완료일: ___________
  - 검증: ArgoCD UI 접근 확인

- [ ] **ArgoCD CLI 설치**
  ```bash
  brew install argocd
  argocd version
  ```
  - 완료일: ___________

- [ ] **애플리케이션 설정**
  - Git 저장소 연결
  - 자동 동기화 설정
  - 완료일: ___________

---

## 🗄️ 5. 데이터베이스 인프라

### 5.1 PostgreSQL 설정
- [ ] **AWS RDS PostgreSQL 생성**
  ```bash
  # Multi-AZ, 백업 활성화, 암호화 설정
  aws rds create-db-instance \
    --db-instance-identifier bespoke-ai-postgres \
    --db-instance-class db.r5.large \
    --engine postgres \
    --master-username admin \
    --master-user-password <secure-password> \
    --allocated-storage 100 \
    --storage-encrypted \
    --multi-az
  ```
  - 완료일: ___________
  - 검증: RDS 대시보드에서 "Available" 상태 확인

- [ ] **데이터베이스 사용자 및 권한 설정**
  ```sql
  -- 각 서비스별 데이터베이스 생성
  CREATE DATABASE content_service;
  CREATE DATABASE user_service;
  CREATE DATABASE analytics_service;
  
  -- 서비스별 사용자 생성
  CREATE USER content_service_user WITH PASSWORD 'secure_password';
  GRANT ALL PRIVILEGES ON DATABASE content_service TO content_service_user;
  ```
  - 완료일: ___________

### 5.2 MongoDB 설정
- [ ] **MongoDB Atlas 클러스터 생성** (또는 AWS DocumentDB)
  - M10 인스턴스 (프로덕션용)
  - 백업 활성화
  - VPC 피어링 설정
  - 완료일: ___________

- [ ] **연결 테스트**
  ```bash
  mongo "mongodb+srv://<username>:<password>@cluster.mongodb.net/test"
  ```
  - 완료일: ___________

### 5.3 Redis 설정
- [ ] **AWS ElastiCache Redis 생성**
  ```bash
  aws elasticache create-cache-cluster \
    --cache-cluster-id bespoke-ai-redis \
    --cache-node-type cache.r5.large \
    --engine redis \
    --num-cache-nodes 1
  ```
  - 완료일: ___________
  - 검증: 연결 테스트 성공

---

## 📊 6. 모니터링 인프라

### 6.1 Prometheus & Grafana 설치
- [ ] **Prometheus Operator 설치**
  ```bash
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  helm install prometheus prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --create-namespace
  ```
  - 완료일: ___________
  - 검증: Prometheus UI 접근 확인

- [ ] **Grafana 대시보드 설정**
  - Kubernetes 클러스터 대시보드
  - 애플리케이션 메트릭 대시보드
  - 완료일: ___________

### 6.2 로깅 시스템
- [ ] **ELK Stack 설치**
  ```bash
  helm repo add elastic https://helm.elastic.co
  helm install elasticsearch elastic/elasticsearch --namespace logging --create-namespace
  helm install kibana elastic/kibana --namespace logging
  helm install filebeat elastic/filebeat --namespace logging
  ```
  - 완료일: ___________
  - 검증: Kibana에서 로그 확인

### 6.3 알림 설정
- [ ] **Alertmanager 설정**
  - 클러스터 리소스 알림
  - 애플리케이션 오류 알림
  - Slack 통합
  - 완료일: ___________

---

## 🔐 7. 보안 인프라

### 7.1 Secret 관리
- [ ] **HashiCorp Vault 설치** (선택사항)
  ```bash
  helm repo add hashicorp https://helm.releases.hashicorp.com
  helm install vault hashicorp/vault --namespace vault --create-namespace
  ```
  - 완료일: ___________

- [ ] **Kubernetes Secrets 설정**
  ```bash
  # 데이터베이스 인증 정보
  kubectl create secret generic db-credentials \
    --from-literal=postgres-url="postgresql://..." \
    --from-literal=mongodb-url="mongodb://..."
  ```
  - 완료일: ___________

### 7.2 네트워크 보안
- [ ] **Network Policies 설정**
  - 마이크로서비스 간 통신 제한
  - 외부 접근 제어
  - 완료일: ___________

- [ ] **Service Mesh (Istio) 설치** (선택사항)
  ```bash
  istioctl install --set values.defaultRevision=default
  kubectl label namespace default istio-injection=enabled
  ```
  - 완료일: ___________

---

## ✅ 검증 체크리스트

### 인프라 검증
- [ ] **Kubernetes 클러스터 상태 확인**
  ```bash
  kubectl get nodes
  kubectl get pods --all-namespaces
  ```
  - 모든 노드가 Ready 상태
  - 시스템 파드들이 Running 상태

- [ ] **네트워크 연결 테스트**
  ```bash
  kubectl run test-pod --image=busybox --rm -it -- sh
  # 내부에서 nslookup kubernetes.default 실행
  ```
  - DNS 해상도 정상 작동

- [ ] **외부 접근 테스트**
  - Ingress를 통한 HTTP 접근
  - SSL 인증서 정상 발급

### 데이터베이스 검증
- [ ] **연결 테스트**
  ```bash
  psql -h <rds-endpoint> -U admin -d postgres
  mongo "mongodb+srv://..."
  redis-cli -h <elasticache-endpoint> ping
  ```
  - 모든 데이터베이스 연결 성공

### CI/CD 검증
- [ ] **파이프라인 테스트**
  - 코드 푸시 시 자동 빌드
  - 테스트 통과 시 자동 배포
  - 배포 실패 시 롤백

### 모니터링 검증
- [ ] **메트릭 수집 확인**
  - Prometheus에서 타겟 상태 확인
  - Grafana 대시보드 데이터 표시
  - 알림 테스트 (의도적 오류 발생)

---

## 📈 성능 기준

### 클러스터 성능
- [ ] **노드 리소스 사용률 < 70%**
- [ ] **파드 시작 시간 < 30초**
- [ ] **네트워크 지연시간 < 10ms (내부)**

### 데이터베이스 성능
- [ ] **PostgreSQL 연결 시간 < 100ms**
- [ ] **MongoDB 읽기 작업 < 50ms**
- [ ] **Redis 응답 시간 < 1ms**

### CI/CD 성능
- [ ] **빌드 시간 < 5분**
- [ ] **배포 시간 < 10분**
- [ ] **롤백 시간 < 2분**

---

## 🚨 트러블슈팅

### 일반적인 문제들
1. **EKS 클러스터 생성 실패**
   - IAM 권한 확인
   - 서브넷 설정 확인
   - 리전별 가용성 확인

2. **파드가 Pending 상태**
   - 노드 리소스 부족
   - 스케줄링 제약 조건
   - PVC 바인딩 문제

3. **Ingress 접근 불가**
   - 보안 그룹 설정
   - DNS 설정
   - 인증서 발급 상태

### 로그 확인 명령어
```bash
# 클러스터 이벤트 확인
kubectl get events --sort-by=.metadata.creationTimestamp

# 파드 로그 확인
kubectl logs <pod-name> -n <namespace>

# 서비스 상태 확인
kubectl describe svc <service-name>
```

---

## 📚 다음 단계

인프라 구축 완료 후:
1. **[02. 백엔드 서비스 개발](./02-backend-services.md)** 진행
2. 기본 헬스체크 엔드포인트 배포 테스트
3. 성능 및 보안 검증

---

**완료일**: ___________  
**검토자**: ___________  
**승인자**: ___________

---

*업데이트: 2025년 8월 4일 | 다음 검토: 진행 상황에 따라*