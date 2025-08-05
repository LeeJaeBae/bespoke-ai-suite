# 배포 가이드

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> 대상: DevOps 엔지니어, 시스템 관리자

## 목차

1. [개요](#1-개요)
2. [배포 아키텍처](#2-배포-아키텍처)
3. [사전 준비사항](#3-사전-준비사항)
4. [컨테이너 이미지 빌드](#4-컨테이너-이미지-빌드)
5. [Kubernetes 배포](#5-kubernetes-배포)
6. [CI/CD 파이프라인](#6-cicd-파이프라인)
7. [환경별 배포 전략](#7-환경별-배포-전략)
8. [롤링 업데이트](#8-롤링-업데이트)
9. [롤백 절차](#9-롤백-절차)
10. [모니터링 및 검증](#10-모니터링-및-검증)

---

## 1. 개요

Bespoke AI Suite는 마이크로서비스 아키텍처로 구성되어 있으며, Kubernetes를 통해 컨테이너 오케스트레이션을 수행합니다. 이 가이드는 개발 환경부터 프로덕션 환경까지의 배포 프로세스를 다룹니다.

### 주요 특징
- 무중단 배포 (Zero-downtime deployment)
- 자동 롤백 기능
- 멀티 리전 지원
- 자동 스케일링
- 보안 강화 배포

## 2. 배포 아키텍처

### 인프라 구성
```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                            │
└─────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │    Load Balancer      │
                    │   (AWS ALB/NLB)       │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │    Ingress Nginx      │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │                Kubernetes Cluster              │
        │                                                │
        │  ┌─────────────┐  ┌─────────────┐  ┌────────┐│
        │  │Content Pods │  │Campaign Pods│  │User    ││
        │  │(3 replicas) │  │(3 replicas) │  │Pods    ││
        │  └─────────────┘  └─────────────┘  └────────┘│
        │                                                │
        │  ┌─────────────┐  ┌─────────────┐  ┌────────┐│
        │  │Analytics    │  │ Message      │  │Redis   ││
        │  │Pods         │  │ Queue        │  │Cache   ││
        │  └─────────────┘  └─────────────┘  └────────┘│
        └────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │              Data Layer                        │
        │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
        │  │PostgreSQL│  │MongoDB   │  │S3 Storage│    │
        │  │(Primary) │  │(Replica  │  │          │    │
        │  │          │  │ Set)     │  │          │    │
        │  └──────────┘  └──────────┘  └──────────┘    │
        └────────────────────────────────────────────────┘
```

## 3. 사전 준비사항

### 필수 도구 설치
```bash
# Kubernetes CLI
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# AWS CLI (AWS 사용 시)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Terraform
wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
unzip terraform_1.5.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### 클러스터 접근 설정
```bash
# kubeconfig 설정
export KUBECONFIG=/path/to/kubeconfig

# 클러스터 연결 확인
kubectl cluster-info
kubectl get nodes
```

## 4. 컨테이너 이미지 빌드

### 멀티스테이지 Dockerfile
```dockerfile
# services/content/Dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 캐싱을 위한 package 파일 복사
COPY package*.json ./
RUN npm ci --only=production

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine

# 보안을 위한 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# 빌드된 파일만 복사
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# 환경 변수
ENV NODE_ENV=production

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js || exit 1

# non-root 사용자로 전환
USER nodejs

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### 이미지 빌드 및 푸시
```bash
#!/bin/bash
# scripts/build-and-push.sh

set -e

REGISTRY="your-registry.com"
VERSION="${1:-latest}"
SERVICES=("content" "campaign" "user" "analytics")

for SERVICE in "${SERVICES[@]}"; do
  echo "Building $SERVICE:$VERSION..."
  
  # 빌드
  docker build \
    --build-arg VERSION=$VERSION \
    --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
    --build-arg VCS_REF=$(git rev-parse --short HEAD) \
    -t $REGISTRY/bespoke-$SERVICE:$VERSION \
    -f services/$SERVICE/Dockerfile \
    services/$SERVICE
  
  # 보안 스캔
  trivy image $REGISTRY/bespoke-$SERVICE:$VERSION
  
  # 푸시
  docker push $REGISTRY/bespoke-$SERVICE:$VERSION
  
  # latest 태그도 업데이트
  if [ "$VERSION" != "latest" ]; then
    docker tag $REGISTRY/bespoke-$SERVICE:$VERSION $REGISTRY/bespoke-$SERVICE:latest
    docker push $REGISTRY/bespoke-$SERVICE:latest
  fi
done

echo "All images built and pushed successfully!"
```

## 5. Kubernetes 배포

### Namespace 및 기본 리소스
```yaml
# k8s/base/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: bespoke-ai
  labels:
    name: bespoke-ai
    environment: production

---
# k8s/base/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: bespoke-ai
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace
  namespace: bespoke-ai
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector: {}
```

### 서비스 배포 매니페스트
```yaml
# k8s/services/content/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: content-service
  namespace: bespoke-ai
  labels:
    app: content-service
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: content-service
  template:
    metadata:
      labels:
        app: content-service
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: content-service
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: content-service
        image: your-registry.com/bespoke-content:v1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        - containerPort: 9090
          name: metrics
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: content-service-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: content-service-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
      volumes:
      - name: config
        configMap:
          name: content-service-config
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - content-service
              topologyKey: kubernetes.io/hostname

---
# k8s/services/content/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: content-service
  namespace: bespoke-ai
  labels:
    app: content-service
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: content-service

---
# k8s/services/content/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: content-service-hpa
  namespace: bespoke-ai
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: content-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
```

### Helm Chart 구조
```
helm/bespoke-ai/
├── Chart.yaml
├── values.yaml
├── values-dev.yaml
├── values-staging.yaml
├── values-prod.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── configmap.yaml
│   └── secrets.yaml
└── charts/
    ├── postgresql/
    ├── redis/
    └── kafka/
```

### Helm 배포
```bash
# Helm 차트 의존성 업데이트
helm dependency update ./helm/bespoke-ai

# 드라이런으로 검증
helm install bespoke-ai ./helm/bespoke-ai \
  --namespace bespoke-ai \
  --values ./helm/bespoke-ai/values-prod.yaml \
  --dry-run --debug

# 실제 배포
helm upgrade --install bespoke-ai ./helm/bespoke-ai \
  --namespace bespoke-ai \
  --values ./helm/bespoke-ai/values-prod.yaml \
  --atomic \
  --timeout 10m \
  --wait

# 배포 상태 확인
helm status bespoke-ai -n bespoke-ai
kubectl get all -n bespoke-ai
```

## 6. CI/CD 파이프라인

### GitHub Actions 워크플로우
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - main
    tags:
      - 'v*'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [content, campaign, user, analytics]
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: services/${{ matrix.service }}/package-lock.json
    
    - name: Install dependencies
      working-directory: services/${{ matrix.service }}
      run: npm ci
    
    - name: Run tests
      working-directory: services/${{ matrix.service }}
      run: |
        npm run test:unit
        npm run test:integration
        npm run test:coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./services/${{ matrix.service }}/coverage/lcov.info
        flags: ${{ matrix.service }}

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        service: [content, campaign, user, analytics]
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=sha,prefix={{branch}}-
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: ./services/${{ matrix.service }}
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        build-args: |
          VERSION=${{ github.ref_name }}
          BUILD_DATE=${{ steps.meta.outputs.created }}
          VCS_REF=${{ github.sha }}
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}:${{ steps.meta.outputs.version }}
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig --name bespoke-staging --region us-west-2
    
    - name: Deploy to staging
      run: |
        helm upgrade --install bespoke-ai ./helm/bespoke-ai \
          --namespace bespoke-staging \
          --values ./helm/bespoke-ai/values-staging.yaml \
          --set-string global.image.tag=${{ github.sha }} \
          --atomic \
          --timeout 10m \
          --wait
    
    - name: Run smoke tests
      run: |
        kubectl run smoke-test \
          --image=curlimages/curl:latest \
          --rm \
          --attach \
          --restart=Never \
          -- sh -c "curl -f http://content-service.bespoke-staging/health || exit 1"

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.PROD_AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.PROD_AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig --name bespoke-production --region us-east-1
    
    - name: Deploy to production
      run: |
        # Blue-Green 배포
        helm upgrade --install bespoke-ai-green ./helm/bespoke-ai \
          --namespace bespoke-production \
          --values ./helm/bespoke-ai/values-prod.yaml \
          --set-string global.image.tag=${{ github.ref_name }} \
          --set-string global.deployment.strategy=blue-green \
          --atomic \
          --timeout 15m \
          --wait
    
    - name: Health check
      run: |
        ./scripts/health-check.sh production
    
    - name: Switch traffic
      run: |
        kubectl patch service bespoke-ai-lb \
          -n bespoke-production \
          --type merge \
          -p '{"spec":{"selector":{"version":"green"}}}'
    
    - name: Monitor deployment
      run: |
        ./scripts/monitor-deployment.sh production 300
    
    - name: Cleanup old deployment
      if: success()
      run: |
        kubectl delete deployment bespoke-ai-blue -n bespoke-production || true
```

### ArgoCD 배포 설정
```yaml
# argocd/applications/production.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: bespoke-ai-production
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/bespoke-ai/infrastructure
    targetRevision: HEAD
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: bespoke-production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
    - Validate=true
    - CreateNamespace=false
    - PrunePropagationPolicy=foreground
    - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10
```

## 7. 환경별 배포 전략

### 개발 환경
```bash
# 로컬 K8s (Minikube/Kind)
kind create cluster --name bespoke-dev --config kind-config.yaml

# Skaffold를 사용한 개발 배포
skaffold dev --port-forward
```

### 스테이징 환경
```yaml
# values-staging.yaml
global:
  environment: staging
  
replicaCount: 2

resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: staging.bespoke-ai.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: staging-tls
      hosts:
        - staging.bespoke-ai.com
```

### 프로덕션 환경
```yaml
# values-prod.yaml
global:
  environment: production
  
replicaCount: 3

resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20

persistence:
  enabled: true
  storageClass: gp3
  size: 100Gi

monitoring:
  enabled: true
  serviceMonitor:
    enabled: true

backup:
  enabled: true
  schedule: "0 2 * * *"
```

## 8. 롤링 업데이트

### 롤링 업데이트 전략
```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%        # 추가로 생성할 수 있는 최대 Pod 수
      maxUnavailable: 0    # 동시에 사용 불가능한 최대 Pod 수 (무중단)
```

### 업데이트 프로세스
```bash
#!/bin/bash
# scripts/rolling-update.sh

SERVICE=$1
VERSION=$2

echo "Starting rolling update for $SERVICE to version $VERSION"

# 이미지 업데이트
kubectl set image deployment/$SERVICE-deployment \
  $SERVICE=your-registry.com/bespoke-$SERVICE:$VERSION \
  -n bespoke-production

# 롤아웃 상태 확인
kubectl rollout status deployment/$SERVICE-deployment -n bespoke-production

# 업데이트 검증
./scripts/verify-deployment.sh $SERVICE $VERSION
```

## 9. 롤백 절차

### 자동 롤백
```yaml
# Flagger를 사용한 자동 카나리 배포 및 롤백
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: content-service
  namespace: bespoke-production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: content-service
  service:
    port: 80
    targetPort: 3000
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 30s
    webhooks:
    - name: acceptance-test
      type: pre-rollout
      url: http://flagger-loadtester.test/
      timeout: 30s
      metadata:
        type: bash
        cmd: "curl -sd 'test' http://content-service-canary/test | grep success"
```

### 수동 롤백
```bash
# 이전 버전으로 롤백
kubectl rollout undo deployment/content-service -n bespoke-production

# 특정 리비전으로 롤백
kubectl rollout undo deployment/content-service --to-revision=3 -n bespoke-production

# Helm 롤백
helm rollback bespoke-ai 3 -n bespoke-production

# 롤백 상태 확인
kubectl rollout status deployment/content-service -n bespoke-production
```

## 10. 모니터링 및 검증

### 배포 검증 스크립트
```bash
#!/bin/bash
# scripts/verify-deployment.sh

NAMESPACE=${1:-bespoke-production}
EXPECTED_VERSION=$2

echo "Verifying deployment in namespace: $NAMESPACE"

# Pod 상태 확인
PODS=$(kubectl get pods -n $NAMESPACE -l app=content-service -o json)
READY_PODS=$(echo $PODS | jq '.items | map(select(.status.phase == "Running")) | length')
TOTAL_PODS=$(echo $PODS | jq '.items | length')

if [ "$READY_PODS" != "$TOTAL_PODS" ]; then
  echo "ERROR: Not all pods are ready ($READY_PODS/$TOTAL_PODS)"
  exit 1
fi

# 버전 확인
for POD in $(kubectl get pods -n $NAMESPACE -l app=content-service -o name); do
  VERSION=$(kubectl get $POD -n $NAMESPACE -o jsonpath='{.spec.containers[0].image}' | cut -d: -f2)
  if [ "$VERSION" != "$EXPECTED_VERSION" ]; then
    echo "ERROR: Pod $POD has wrong version: $VERSION (expected: $EXPECTED_VERSION)"
    exit 1
  fi
done

# 헬스체크
for POD in $(kubectl get pods -n $NAMESPACE -l app=content-service -o name | cut -d/ -f2); do
  HEALTH=$(kubectl exec $POD -n $NAMESPACE -- curl -s http://localhost:3000/health)
  STATUS=$(echo $HEALTH | jq -r '.status')
  
  if [ "$STATUS" != "healthy" ]; then
    echo "ERROR: Pod $POD is not healthy"
    exit 1
  fi
done

# 서비스 엔드포인트 확인
ENDPOINTS=$(kubectl get endpoints content-service -n $NAMESPACE -o json | jq '.subsets[0].addresses | length')
if [ "$ENDPOINTS" -lt 1 ]; then
  echo "ERROR: No service endpoints available"
  exit 1
fi

echo "✅ Deployment verification successful!"
```

### 모니터링 대시보드
```yaml
# k8s/monitoring/grafana-dashboard.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: deployment-dashboard
  namespace: monitoring
data:
  dashboard.json: |
    {
      "dashboard": {
        "title": "Bespoke AI Deployment Monitor",
        "panels": [
          {
            "title": "Deployment Status",
            "targets": [
              {
                "expr": "kube_deployment_status_replicas{namespace=\"bespoke-production\"}"
              }
            ]
          },
          {
            "title": "Pod Restarts",
            "targets": [
              {
                "expr": "rate(kube_pod_container_status_restarts_total{namespace=\"bespoke-production\"}[5m])"
              }
            ]
          },
          {
            "title": "Request Rate",
            "targets": [
              {
                "expr": "sum(rate(http_requests_total{namespace=\"bespoke-production\"}[5m])) by (service)"
              }
            ]
          },
          {
            "title": "Error Rate",
            "targets": [
              {
                "expr": "sum(rate(http_requests_total{namespace=\"bespoke-production\",status=~\"5..\"}[5m])) by (service)"
              }
            ]
          }
        ]
      }
    }
```

### 알림 설정
```yaml
# k8s/monitoring/alerts.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: deployment-alerts
  namespace: bespoke-production
spec:
  groups:
  - name: deployment
    interval: 30s
    rules:
    - alert: DeploymentReplicasMismatch
      expr: |
        kube_deployment_spec_replicas{namespace="bespoke-production"}
        != kube_deployment_status_replicas_available{namespace="bespoke-production"}
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Deployment replica mismatch"
        description: "Deployment {{ $labels.deployment }} has {{ $value }} replicas available, expected {{ $labels.spec_replicas }}"
    
    - alert: HighPodRestartRate
      expr: |
        rate(kube_pod_container_status_restarts_total{namespace="bespoke-production"}[15m]) > 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High pod restart rate"
        description: "Pod {{ $labels.pod }} has restarted {{ $value }} times in the last 15 minutes"
    
    - alert: DeploymentGenerationMismatch
      expr: |
        kube_deployment_status_observed_generation{namespace="bespoke-production"}
        != kube_deployment_metadata_generation{namespace="bespoke-production"}
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Deployment generation mismatch"
        description: "Deployment {{ $labels.deployment }} generation mismatch"
```

## 체크리스트

### 배포 전
- [ ] 모든 테스트 통과
- [ ] 이미지 보안 스캔 완료
- [ ] 환경 변수 및 시크릿 확인
- [ ] 리소스 제한 설정 확인
- [ ] 롤백 계획 수립

### 배포 중
- [ ] 이전 버전 백업
- [ ] 점진적 롤아웃 진행
- [ ] 실시간 모니터링
- [ ] 헬스체크 통과

### 배포 후
- [ ] 기능 검증
- [ ] 성능 모니터링
- [ ] 로그 분석
- [ ] 사용자 피드백 수집
- [ ] 문서 업데이트

---

*안전하고 신뢰성 있는 배포를 위해 이 가이드를 따라주세요! 🚀*