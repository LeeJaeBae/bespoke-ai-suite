# Kubernetes 배포 아키텍처

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> 문서 유형: 인프라 배포 다이어그램

## 개요

이 문서는 Bespoke AI Suite의 Kubernetes 기반 프로덕션 배포 아키텍처를 설명합니다. 고가용성, 확장성, 보안을 고려한 엔터프라이즈급 배포 구조를 제시합니다.

## 전체 클러스터 구조

```mermaid
graph TB
    subgraph "Internet"
        Users[사용자]
        CDN[CloudFlare CDN]
    end
    
    subgraph "AWS Cloud"
        subgraph "Network Layer"
            ALB[Application Load Balancer]
            WAF[AWS WAF]
        end
        
        subgraph "EKS Cluster"
            subgraph "Ingress"
                NGINX[NGINX Ingress Controller]
            end
            
            subgraph "Service Mesh"
                ISTIO[Istio Service Mesh]
            end
            
            subgraph "Namespaces"
                subgraph "production"
                    FE[Frontend Pods]
                    CS[Content Service]
                    CMS[Campaign Service]
                    US[User Service]
                    AS[Analytics Service]
                end
                
                subgraph "kafka"
                    KAFKA[Kafka Cluster]
                    ZK[Zookeeper]
                end
                
                subgraph "monitoring"
                    PROM[Prometheus]
                    GRAF[Grafana]
                    ALERT[AlertManager]
                end
                
                subgraph "logging"
                    EFK[EFK Stack]
                end
            end
            
            subgraph "Storage"
                EBS[EBS Volumes]
                EFS[EFS]
            end
        end
        
        subgraph "Data Layer"
            RDS[(RDS PostgreSQL)]
            DOCDB[(DocumentDB)]
            REDIS[(ElastiCache Redis)]
        end
        
        subgraph "AI/ML Infrastructure"
            SAGE[SageMaker Endpoints]
            GPU[GPU Node Group]
        end
    end
    
    Users --> CDN
    CDN --> WAF
    WAF --> ALB
    ALB --> NGINX
    NGINX --> ISTIO
    ISTIO --> FE
    ISTIO --> CS
    ISTIO --> CMS
    ISTIO --> US
    ISTIO --> AS
    
    CS --> KAFKA
    CMS --> KAFKA
    AS --> KAFKA
    
    CS --> RDS
    CS --> DOCDB
    US --> RDS
    CMS --> REDIS
    
    CS --> SAGE
    CS --> GPU
    
    PROM --> GRAF
    EFK --> ALERT
```

## 네임스페이스별 상세 구조

### Production Namespace

```mermaid
graph LR
    subgraph "Frontend Deployment"
        FE1[frontend-1]
        FE2[frontend-2]
        FE3[frontend-3]
        FES[Frontend Service]
        FE1 & FE2 & FE3 --> FES
    end
    
    subgraph "Content Service"
        CS1[content-1]
        CS2[content-2]
        CS3[content-3]
        CSS[Content Service]
        CS1 & CS2 & CS3 --> CSS
    end
    
    subgraph "Campaign Service"
        CM1[campaign-1]
        CM2[campaign-2]
        CMS[Campaign Service]
        CM1 & CM2 --> CMS
    end
    
    subgraph "User Service"
        US1[user-1]
        US2[user-2]
        USS[User Service]
        US1 & US2 --> USS
    end
    
    subgraph "Analytics Service"
        AS1[analytics-1]
        AS2[analytics-2]
        ASS[Analytics Service]
        AS1 & AS2 --> ASS
    end
```

### Kafka Namespace

```mermaid
graph TB
    subgraph "Kafka Cluster"
        subgraph "Brokers"
            B1[kafka-broker-1]
            B2[kafka-broker-2]
            B3[kafka-broker-3]
        end
        
        subgraph "Zookeeper Ensemble"
            Z1[zookeeper-1]
            Z2[zookeeper-2]
            Z3[zookeeper-3]
        end
        
        subgraph "Schema Registry"
            SR1[schema-registry-1]
            SR2[schema-registry-2]
        end
        
        subgraph "Kafka Connect"
            KC1[connect-1]
            KC2[connect-2]
        end
    end
    
    B1 & B2 & B3 <--> Z1 & Z2 & Z3
    SR1 & SR2 --> B1 & B2 & B3
    KC1 & KC2 --> B1 & B2 & B3
```

## 리소스 할당 및 오토스케일링

### Pod 리소스 사양

```yaml
# Content Service Pod
resources:
  requests:
    memory: "2Gi"
    cpu: "1000m"
  limits:
    memory: "4Gi"
    cpu: "2000m"

# HPA 설정
horizontalPodAutoscaler:
  minReplicas: 3
  maxReplicas: 20
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
    - type: Pods
      pods:
        metric:
          name: kafka_consumer_lag
        target:
          type: AverageValue
          averageValue: "100"
```

### Node Groups

```mermaid
graph LR
    subgraph "EKS Node Groups"
        subgraph "General Purpose"
            GP1[t3.xlarge x 3-10]
            GP2[Services & Apps]
        end
        
        subgraph "Memory Optimized"
            MO1[r6i.2xlarge x 2-5]
            MO2[Analytics & Cache]
        end
        
        subgraph "GPU Nodes"
            GPU1[g4dn.xlarge x 1-3]
            GPU2[AI Inference]
        end
        
        subgraph "Spot Instances"
            SPOT1[t3.large x 0-20]
            SPOT2[Batch Jobs]
        end
    end
```

## 보안 구성

### Network Policies

```mermaid
graph TB
    subgraph "Network Security"
        subgraph "Ingress Rules"
            I1[Allow from ALB only]
            I2[Inter-service mTLS]
            I3[Kafka internal only]
        end
        
        subgraph "Egress Rules"
            E1[Allow to RDS]
            E2[Allow to External APIs]
            E3[Deny all others]
        end
        
        subgraph "Pod Security"
            PS1[SecurityContext]
            PS2[Non-root user]
            PS3[Read-only root]
            PS4[No privileged]
        end
    end
```

### RBAC 구성

```yaml
# Service Account 예시
apiVersion: v1
kind: ServiceAccount
metadata:
  name: content-service
  namespace: production
  
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: content-service-role
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
```

## 모니터링 및 로깅 스택

```mermaid
graph LR
    subgraph "Observability Stack"
        subgraph "Metrics"
            PROM[Prometheus]
            GRAF[Grafana]
            AM[AlertManager]
            PROM --> GRAF
            PROM --> AM
        end
        
        subgraph "Logging"
            FB[Fluent Bit]
            ES[Elasticsearch]
            KB[Kibana]
            FB --> ES --> KB
        end
        
        subgraph "Tracing"
            JAE[Jaeger]
            OT[OpenTelemetry]
            OT --> JAE
        end
    end
    
    subgraph "Dashboards"
        D1[System Metrics]
        D2[Application Metrics]
        D3[Business Metrics]
        D4[SLO Dashboard]
    end
    
    GRAF --> D1 & D2 & D3 & D4
```

## CI/CD 파이프라인 통합

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant GHA as GitHub Actions
    participant ECR as ECR Registry
    participant ARGO as ArgoCD
    participant K8S as Kubernetes
    
    Dev->>GH: Push Code
    GH->>GHA: Trigger Workflow
    GHA->>GHA: Run Tests
    GHA->>GHA: Build Image
    GHA->>ECR: Push Image
    GHA->>ARGO: Update Manifest
    ARGO->>K8S: Sync Deployment
    K8S->>K8S: Rolling Update
    ARGO->>Dev: Deployment Status
```

## 재해 복구 및 백업

### 백업 전략

```mermaid
graph TB
    subgraph "Backup Strategy"
        subgraph "Application Data"
            RDS_SNAP[RDS Snapshots<br/>Daily]
            DOCDB_SNAP[DocumentDB Backup<br/>Continuous]
            EFS_BACKUP[EFS Backup<br/>Hourly]
        end
        
        subgraph "Kubernetes Resources"
            VELERO[Velero Backup]
            ETCD[ETCD Snapshots]
            CONFIG[ConfigMaps/Secrets]
        end
        
        subgraph "Backup Storage"
            S3[S3 Bucket<br/>Cross-Region]
            GLACIER[Glacier<br/>Long-term]
        end
    end
    
    RDS_SNAP & DOCDB_SNAP & EFS_BACKUP --> S3
    VELERO & ETCD & CONFIG --> S3
    S3 --> GLACIER
```

### 복구 시나리오

1. **Pod 장애**: 자동 재시작 (30초 이내)
2. **Node 장애**: Pod 재스케줄링 (2분 이내)
3. **Zone 장애**: 다른 AZ로 자동 페일오버 (5분 이내)
4. **Region 장애**: DR Region 활성화 (30분 이내)

## 비용 최적화

### 리소스 활용 전략

```mermaid
pie title "컴퓨팅 리소스 분배"
    "Reserved Instances" : 40
    "On-Demand" : 30
    "Spot Instances" : 20
    "Savings Plans" : 10
```

### 예상 월간 비용 (USD)

| 컴포넌트 | 리소스 | 예상 비용 |
|---------|--------|----------|
| EKS Control Plane | 1 cluster | $72 |
| Worker Nodes | 10-30 nodes | $1,500-4,000 |
| Load Balancer | 2 ALB | $50 |
| RDS PostgreSQL | db.r6g.xlarge Multi-AZ | $600 |
| DocumentDB | 3 nodes | $800 |
| ElastiCache | cache.r6g.large | $200 |
| Data Transfer | 10TB/month | $900 |
| **총계** | | **$4,122-6,622** |

## 운영 체크리스트

- [ ] 모든 Pod에 리소스 제한 설정
- [ ] HPA/VPA 설정 및 테스트
- [ ] Network Policy 적용
- [ ] RBAC 최소 권한 원칙 적용
- [ ] 모니터링 대시보드 구성
- [ ] 알람 규칙 설정
- [ ] 백업 자동화 검증
- [ ] DR 시나리오 테스트
- [ ] 보안 스캔 자동화
- [ ] 비용 알림 설정

---

*이 배포 아키텍처는 프로덕션 환경의 요구사항에 따라 조정될 수 있습니다.*