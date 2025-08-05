# 모니터링 설정 가이드

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> 대상: DevOps 엔지니어, SRE

## 목차

1. [개요](#1-개요)
2. [모니터링 아키텍처](#2-모니터링-아키텍처)
3. [메트릭 수집](#3-메트릭-수집)
4. [로그 관리](#4-로그-관리)
5. [분산 추적](#5-분산-추적)
6. [알림 시스템](#6-알림-시스템)
7. [대시보드 구성](#7-대시보드-구성)
8. [성능 모니터링](#8-성능-모니터링)
9. [보안 모니터링](#9-보안-모니터링)
10. [문제 해결](#10-문제-해결)

---

## 1. 개요

Bespoke AI Suite의 종합 모니터링 시스템은 가관측성(Observability)의 세 기둥인 메트릭, 로그, 트레이싱을 통해 시스템의 건강성과 성능을 실시간으로 모니터링합니다.

### 모니터링 목표
- 99.9% 가용성 달성
- 평균 복구 시간(MTTR) 5분 이하
- 문제 발생 전 사전 탐지
- 사용자 경험 최적화

## 2. 모니터링 아키텍처

### 전체 구조
```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring Stack                         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Grafana   │  │ Prometheus  │  │   Jaeger    │        │
│  │ Dashboards  │  │   Metrics   │  │  Tracing    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ AlertManager│  │     ELK     │  │  DataDog    │        │
│  │   Alerts    │  │    Logs     │  │    APM      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │              Application Layer                 │
        │                                               │
        │  ┌─────────────┐  ┌─────────────┐  ┌────────┐│
        │  │Content API  │  │Campaign API │  │User API││
        │  │/metrics     │  │/metrics     │  │/metrics││
        │  └─────────────┘  └─────────────┘  └────────┘│
        │                                               │
        │  ┌─────────────┐  ┌─────────────┐  ┌────────┐│
        │  │  Postgres   │  │   Redis     │  │ Kafka  ││
        │  │  Exporter   │  │  Exporter   │  │Exporter││
        │  └─────────────┘  └─────────────┘  └────────┘│
        └───────────────────────────────────────────────┘
```

### 컴포넌트 역할
- **Prometheus**: 메트릭 수집 및 저장
- **Grafana**: 시각화 및 대시보드
- **Jaeger**: 분산 추적
- **ELK Stack**: 로그 수집 및 분석
- **AlertManager**: 알림 관리
- **DataDog**: 통합 APM (선택사항)

## 3. 메트릭 수집

### Prometheus 설정
```yaml
# k8s/monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
      external_labels:
        cluster: 'bespoke-production'
        region: 'us-east-1'
    
    rule_files:
      - "alert_rules.yml"
      - "recording_rules.yml"
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager:9093
    
    scrape_configs:
      # Kubernetes API Server
      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
        - role: endpoints
          namespaces:
            names:
            - default
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
        - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
          action: keep
          regex: default;kubernetes;https
      
      # Node Exporter
      - job_name: 'node-exporter'
        kubernetes_sd_configs:
        - role: endpoints
        relabel_configs:
        - source_labels: [__meta_kubernetes_endpoints_name]
          action: keep
          regex: node-exporter
      
      # Application Services
      - job_name: 'bespoke-services'
        kubernetes_sd_configs:
        - role: endpoints
          namespaces:
            names:
            - bespoke-production
        relabel_configs:
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
          action: keep
          regex: true
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
          action: replace
          target_label: __metrics_path__
          regex: (.+)
        - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
          action: replace
          regex: ([^:]+)(?::\d+)?;(\d+)
          replacement: $1:$2
          target_label: __address__
        - action: labelmap
          regex: __meta_kubernetes_service_label_(.+)
        - source_labels: [__meta_kubernetes_namespace]
          action: replace
          target_label: kubernetes_namespace
        - source_labels: [__meta_kubernetes_service_name]
          action: replace
          target_label: kubernetes_name
      
      # Database Exporters
      - job_name: 'postgres-exporter'
        static_configs:
        - targets: ['postgres-exporter:9187']
      
      - job_name: 'redis-exporter'
        static_configs:
        - targets: ['redis-exporter:9121']
      
      - job_name: 'kafka-exporter'
        static_configs:
        - targets: ['kafka-exporter:9308']
```

### 애플리케이션 메트릭 구현
```javascript
// Node.js 애플리케이션 메트릭
const prometheus = require('prom-client');

// 기본 메트릭 수집
prometheus.collectDefaultMetrics({
  timeout: 5000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  prefix: 'bespoke_content_'
});

// 커스텀 메트릭 정의
const httpRequestDuration = new prometheus.Histogram({
  name: 'bespoke_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new prometheus.Counter({
  name: 'bespoke_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const contentGenerationDuration = new prometheus.Histogram({
  name: 'bespoke_content_generation_duration_seconds',
  help: 'Duration of content generation',
  labelNames: ['type', 'status'],
  buckets: [1, 5, 10, 30, 60, 120, 300]
});

const contentQualityScore = new prometheus.Gauge({
  name: 'bespoke_content_quality_score',
  help: 'Quality score of generated content',
  labelNames: ['type', 'user_id']
});

const databaseConnectionPool = new prometheus.Gauge({
  name: 'bespoke_db_connection_pool_size',
  help: 'Database connection pool size',
  labelNames: ['database', 'state']
});

// 미들웨어
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || 'unknown',
      status_code: res.statusCode
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });
  
  next();
}

// 비즈니스 메트릭 기록
function recordContentGeneration(type, duration, qualityScore, userId, status) {
  contentGenerationDuration.observe({ type, status }, duration);
  if (status === 'completed') {
    contentQualityScore.set({ type, user_id: userId }, qualityScore);
  }
}

// 메트릭 엔드포인트
app.get('/metrics', async (req, res) => {
  // 데이터베이스 연결 풀 상태 업데이트
  const poolStats = await db.pool.stats();
  databaseConnectionPool.set({ database: 'postgres', state: 'active' }, poolStats.active);
  databaseConnectionPool.set({ database: 'postgres', state: 'idle' }, poolStats.idle);
  
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});

module.exports = {
  metricsMiddleware,
  recordContentGeneration
};
```

### Python 메트릭 구현
```python
# Python Flask 애플리케이션 메트릭
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from prometheus_client import CollectorRegistry, multiprocess
from functools import wraps
import time

# 메트릭 정의
REQUEST_COUNT = Counter(
    'bespoke_http_requests_total',
    'Total app requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'bespoke_http_request_duration_seconds',
    'Request latency',
    ['method', 'endpoint']
)

CONTENT_GENERATION_DURATION = Histogram(
    'bespoke_content_generation_duration_seconds',
    'Content generation duration',
    ['type', 'model'],
    buckets=[1, 5, 10, 30, 60, 120, 300]
)

ACTIVE_USERS = Gauge(
    'bespoke_active_users',
    'Number of active users',
    ['subscription_tier']
)

AI_MODEL_USAGE = Counter(
    'bespoke_ai_model_usage_total',
    'AI model usage count',
    ['model', 'type']
)

def monitor_requests(f):
    """요청 모니터링 데코레이터"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = f(*args, **kwargs)
            status = 'success'
            return result
        except Exception as e:
            status = 'error'
            raise
        finally:
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.endpoint,
                status=status
            ).inc()
            
            REQUEST_LATENCY.labels(
                method=request.method,
                endpoint=request.endpoint
            ).observe(time.time() - start_time)
    
    return decorated_function

@app.route('/metrics')
def metrics():
    # 멀티프로세스 환경에서 메트릭 수집
    registry = CollectorRegistry()
    multiprocess.MultiProcessCollector(registry)
    
    return generate_latest(registry)

# 비즈니스 메트릭 기록
def record_content_generation(content_type, model, duration):
    CONTENT_GENERATION_DURATION.labels(
        type=content_type,
        model=model
    ).observe(duration)

def record_ai_model_usage(model, content_type):
    AI_MODEL_USAGE.labels(
        model=model,
        type=content_type
    ).inc()

def update_active_users():
    """활성 사용자 수 업데이트"""
    with database.get_connection() as conn:
        result = conn.execute("""
            SELECT subscription_tier, COUNT(*) 
            FROM users 
            WHERE last_active > NOW() - INTERVAL '1 hour'
            GROUP BY subscription_tier
        """).fetchall()
        
        for tier, count in result:
            ACTIVE_USERS.labels(subscription_tier=tier).set(count)

# 주기적으로 게이지 메트릭 업데이트
import threading

def update_gauges():
    while True:
        try:
            update_active_users()
            time.sleep(60)  # 1분마다 업데이트
        except Exception as e:
            print(f"Error updating gauges: {e}")

gauge_thread = threading.Thread(target=update_gauges, daemon=True)
gauge_thread.start()
```

## 4. 로그 관리

### ELK Stack 설정
```yaml
# k8s/logging/elasticsearch.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: elasticsearch
  namespace: logging
spec:
  serviceName: elasticsearch
  replicas: 3
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
      - name: elasticsearch
        image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
        env:
        - name: cluster.name
          value: bespoke-logs
        - name: node.name
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: discovery.seed_hosts
          value: elasticsearch-0.elasticsearch,elasticsearch-1.elasticsearch,elasticsearch-2.elasticsearch
        - name: cluster.initial_master_nodes
          value: elasticsearch-0,elasticsearch-1,elasticsearch-2
        - name: ES_JAVA_OPTS
          value: "-Xms2g -Xmx2g"
        - name: xpack.security.enabled
          value: "true"
        - name: xpack.security.transport.ssl.enabled
          value: "true"
        ports:
        - containerPort: 9200
          name: http
        - containerPort: 9300
          name: transport
        volumeMounts:
        - name: data
          mountPath: /usr/share/elasticsearch/data
        resources:
          requests:
            memory: "2Gi"
            cpu: "500m"
          limits:
            memory: "4Gi"
            cpu: "1000m"
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: gp3
      resources:
        requests:
          storage: 100Gi

---
# k8s/logging/logstash.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: logstash
  namespace: logging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: logstash
  template:
    metadata:
      labels:
        app: logstash
    spec:
      containers:
      - name: logstash
        image: docker.elastic.co/logstash/logstash:8.10.0
        ports:
        - containerPort: 5044
        - containerPort: 9600
        env:
        - name: LS_JAVA_OPTS
          value: "-Xmx1g -Xms1g"
        volumeMounts:
        - name: config
          mountPath: /usr/share/logstash/pipeline
        - name: settings
          mountPath: /usr/share/logstash/config
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
      volumes:
      - name: config
        configMap:
          name: logstash-config
      - name: settings
        configMap:
          name: logstash-settings
```

### Fluent Bit 로그 수집
```yaml
# k8s/logging/fluent-bit.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: logging
spec:
  selector:
    matchLabels:
      app: fluent-bit
  template:
    metadata:
      labels:
        app: fluent-bit
    spec:
      serviceAccountName: fluent-bit
      containers:
      - name: fluent-bit
        image: fluent/fluent-bit:2.1.0
        ports:
        - containerPort: 2020
        env:
        - name: FLUENT_ELASTICSEARCH_HOST
          value: "elasticsearch"
        - name: FLUENT_ELASTICSEARCH_PORT
          value: "9200"
        volumeMounts:
        - name: config
          mountPath: /fluent-bit/etc
        - name: varlog
          mountPath: /var/log
          readOnly: true
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
      volumes:
      - name: config
        configMap:
          name: fluent-bit-config
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: logging
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         5
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf
        HTTP_Server   On
        HTTP_Listen   0.0.0.0
        HTTP_Port     2020
    
    [INPUT]
        Name              tail
        Path              /var/log/containers/*bespoke*.log
        Parser            cri
        Tag               kubernetes.*
        Refresh_Interval  5
        Mem_Buf_Limit     50MB
        Skip_Long_Lines   On
    
    [FILTER]
        Name                kubernetes
        Match               kubernetes.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Kube_Tag_Prefix     kubernetes.var.log.containers.
        Merge_Log           On
        Merge_Log_Key       log_processed
        K8S-Logging.Parser  On
        K8S-Logging.Exclude Off
    
    [FILTER]
        Name    grep
        Match   kubernetes.*
        Regex   kubernetes_namespace_name ^bespoke-.*
    
    [OUTPUT]
        Name            es
        Match           kubernetes.*
        Host            ${FLUENT_ELASTICSEARCH_HOST}
        Port            ${FLUENT_ELASTICSEARCH_PORT}
        Index           bespoke-logs
        Type            _doc
        Logstash_Format On
        Logstash_Prefix bespoke
        Time_Key        @timestamp
        Replace_Dots    On
        Retry_Limit     False
  
  parsers.conf: |
    [PARSER]
        Name        cri
        Format      regex
        Regex       ^(?<time>[^ ]+) (?<stream>stdout|stderr) (?<logtag>[^ ]*) (?<message>.*)$
        Time_Key    time
        Time_Format %Y-%m-%dT%H:%M:%S.%L%z
```

### 구조화된 로깅
```javascript
// Node.js 구조화 로깅
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.metadata({
      fillExcept: ['message', 'level', 'timestamp', 'label']
    })
  ),
  defaultMeta: {
    service: 'content-service',
    version: process.env.VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200'
      },
      index: 'bespoke-logs'
    })
  ]
});

// 요청 로깅 미들웨어
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // 요청 시작 로그
  logger.info('Request started', {
    request_id: req.headers['x-request-id'] || generateRequestId(),
    method: req.method,
    url: req.url,
    user_agent: req.headers['user-agent'],
    ip: req.ip,
    user_id: req.user?.id
  });
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // 요청 완료 로그
    logger.info('Request completed', {
      request_id: req.headers['x-request-id'],
      method: req.method,
      url: req.url,
      status_code: res.statusCode,
      duration: duration,
      user_id: req.user?.id
    });
  });
  
  next();
}

// 에러 로깅
function errorLogger(error, req, res, next) {
  logger.error('Request failed', {
    request_id: req.headers['x-request-id'],
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    method: req.method,
    url: req.url,
    user_id: req.user?.id
  });
  
  next(error);
}

// 비즈니스 이벤트 로깅
function logContentGeneration(contentId, userId, type, status, metadata = {}) {
  logger.info('Content generation event', {
    event_type: 'content_generation',
    content_id: contentId,
    user_id: userId,
    content_type: type,
    status: status,
    quality_score: metadata.qualityScore,
    generation_time: metadata.generationTime,
    ai_model: metadata.aiModel
  });
}

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  logContentGeneration
};
```

## 5. 분산 추적

### Jaeger 설정
```yaml
# k8s/tracing/jaeger.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
  namespace: tracing
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
      - name: jaeger
        image: jaegertracing/all-in-one:1.48
        env:
        - name: COLLECTOR_OTLP_ENABLED
          value: "true"
        - name: SPAN_STORAGE_TYPE
          value: elasticsearch
        - name: ES_SERVER_URLS
          value: http://elasticsearch.logging:9200
        - name: ES_INDEX_PREFIX
          value: jaeger
        ports:
        - containerPort: 16686
          name: ui
        - containerPort: 14268
          name: collector
        - containerPort: 4317
          name: otlp-grpc
        - containerPort: 4318
          name: otlp-http
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "200m"

---
apiVersion: v1
kind: Service
metadata:
  name: jaeger
  namespace: tracing
spec:
  selector:
    app: jaeger
  ports:
  - port: 16686
    targetPort: 16686
    name: ui
  - port: 14268
    targetPort: 14268
    name: collector
  - port: 4317
    targetPort: 4317
    name: otlp-grpc
  - port: 4318
    targetPort: 4318
    name: otlp-http
```

### OpenTelemetry 계측
```javascript
// Node.js OpenTelemetry 설정
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Tracer 초기화
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'content-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
  }),
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces'
  }),
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': {
      enabled: false, // 파일시스템 계측 비활성화
    },
  })]
});

sdk.start();

// 커스텀 트레이싱
const { trace } = require('@opentelemetry/api');
const tracer = trace.getTracer('content-service', '1.0.0');

async function generateContent(prompt, options) {
  return await tracer.startActiveSpan('content.generate', async (span) => {
    try {
      span.setAttributes({
        'content.type': options.type,
        'content.length': options.length,
        'user.id': options.userId,
        'ai.model': options.model
      });
      
      // AI 모델 호출
      const content = await tracer.startActiveSpan('ai.model.call', async (aiSpan) => {
        aiSpan.setAttributes({
          'ai.model.name': options.model,
          'ai.prompt.length': prompt.length
        });
        
        const result = await aiService.generate(prompt, options);
        
        aiSpan.setAttributes({
          'ai.tokens.input': result.tokensUsed.input,
          'ai.tokens.output': result.tokensUsed.output,
          'ai.response.length': result.content.length
        });
        
        return result;
      });
      
      // 품질 검사
      const qualityScore = await tracer.startActiveSpan('content.quality_check', async (qcSpan) => {
        const score = await qualityService.analyze(content.content);
        qcSpan.setAttributes({
          'content.quality_score': score,
          'content.quality.passed': score >= 80
        });
        return score;
      });
      
      span.setAttributes({
        'content.id': content.id,
        'content.quality_score': qualityScore,
        'content.status': 'completed'
      });
      
      return { ...content, qualityScore };
      
    } catch (error) {
      span.recordException(error);
      span.setStatus({
        code: trace.SpanStatusCode.ERROR,
        message: error.message
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

// HTTP 요청 트레이싱
function tracingMiddleware(req, res, next) {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes({
      'http.method': req.method,
      'http.url': req.url,
      'http.user_agent': req.headers['user-agent'],
      'user.id': req.user?.id
    });
    
    res.on('finish', () => {
      span.setAttributes({
        'http.status_code': res.statusCode,
        'http.response.size': res.get('content-length') || 0
      });
    });
  }
  
  next();
}

module.exports = {
  generateContent,
  tracingMiddleware
};
```

## 6. 알림 시스템

### AlertManager 설정
```yaml
# k8s/monitoring/alertmanager.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      smtp_smarthost: 'smtp.gmail.com:587'
      smtp_from: 'alerts@thebespoke-ai.com'
      smtp_auth_username: 'alerts@thebespoke-ai.com'
      smtp_auth_password: 'app-password'
    
    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 1h
      receiver: 'web.hook'
      routes:
      - match:
          severity: critical
        receiver: 'critical-alerts'
        group_wait: 10s
        repeat_interval: 5m
      - match:
          severity: warning
        receiver: 'warning-alerts'
        group_wait: 30s
        repeat_interval: 30m
      - match:
          alertname: DeadMansSwitch
        receiver: 'null'
    
    receivers:
    - name: 'web.hook'
      webhook_configs:
      - url: 'http://slack-webhook/webhook'
        send_resolved: true
        title: 'Bespoke AI Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
    
    - name: 'critical-alerts'
      email_configs:
      - to: 'oncall@thebespoke-ai.com'
        subject: '[CRITICAL] Bespoke AI Alert'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Labels:
          {{ range .Labels.SortedPairs }}  {{ .Name }}: {{ .Value }}
          {{ end }}
          {{ end }}
      slack_configs:
      - api_url: 'https://hooks.slack.com/services/...'
        channel: '#alerts-critical'
        title: 'Critical Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        actions:
        - type: button
          text: 'View in Grafana'
          url: '{{ .CommonAnnotations.grafana_url }}'
        - type: button
          text: 'Acknowledge'
          url: '{{ .CommonAnnotations.ack_url }}'
      pagerduty_configs:
      - routing_key: 'integration-key'
        description: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
    
    - name: 'warning-alerts'
      slack_configs:
      - api_url: 'https://hooks.slack.com/services/...'
        channel: '#alerts-warning'
        title: 'Warning Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
    
    - name: 'null'
```

### 알림 규칙
```yaml
# k8s/monitoring/alert-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: bespoke-alerts
  namespace: monitoring
spec:
  groups:
  - name: kubernetes
    interval: 30s
    rules:
    - alert: KubernetesPodCrashLooping
      expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Pod {{ $labels.pod }} is crash looping"
        description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is restarting {{ $value }} times per second"
        grafana_url: "https://grafana.thebespoke-ai.com/d/kubernetes/kubernetes-pods?var-namespace={{ $labels.namespace }}&var-pod={{ $labels.pod }}"
    
    - alert: KubernetesNodeNotReady
      expr: kube_node_status_condition{condition="Ready",status="true"} == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Node {{ $labels.node }} is not ready"
        description: "Node {{ $labels.node }} has been not ready for more than 5 minutes"
  
  - name: application
    interval: 30s
    rules:
    - alert: HighErrorRate
      expr: |
        (
          sum(rate(bespoke_http_requests_total{status_code=~"5.."}[5m])) by (service)
          /
          sum(rate(bespoke_http_requests_total[5m])) by (service)
        ) > 0.05
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate on {{ $labels.service }}"
        description: "{{ $labels.service }} has error rate of {{ $value | humanizePercentage }}"
        grafana_url: "https://grafana.thebespoke-ai.com/d/application/application-overview?var-service={{ $labels.service }}"
    
    - alert: HighResponseTime
      expr: |
        histogram_quantile(0.95, sum(rate(bespoke_http_request_duration_seconds_bucket[5m])) by (service, le)) > 1
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "High response time on {{ $labels.service }}"
        description: "95th percentile response time is {{ $value }}s"
    
    - alert: ContentGenerationQueueBacklog
      expr: bespoke_content_generation_queue_size > 100
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Content generation queue backlog"
        description: "Queue has {{ $value }} pending items"
    
    - alert: LowContentQualityScore
      expr: avg_over_time(bespoke_content_quality_score[1h]) < 70
      for: 15m
      labels:
        severity: warning
      annotations:
        summary: "Content quality score is low"
        description: "Average quality score over 1h is {{ $value }}"
  
  - name: infrastructure
    interval: 30s
    rules:
    - alert: HighCPUUsage
      expr: |
        (
          100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
        ) > 80
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "High CPU usage on {{ $labels.instance }}"
        description: "CPU usage is {{ $value }}%"
    
    - alert: HighMemoryUsage
      expr: |
        (
          1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)
        ) > 0.85
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage on {{ $labels.instance }}"
        description: "Memory usage is {{ $value | humanizePercentage }}"
    
    - alert: DiskSpaceLow
      expr: |
        (
          1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)
        ) > 0.85
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Disk space low on {{ $labels.instance }}"
        description: "Disk usage is {{ $value | humanizePercentage }}"
    
    - alert: DatabaseConnectionsHigh
      expr: |
        (
          bespoke_db_connection_pool_size{state="active"}
          /
          (bespoke_db_connection_pool_size{state="active"} + bespoke_db_connection_pool_size{state="idle"})
        ) > 0.9
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Database connection pool usage high"
        description: "Connection pool usage is {{ $value | humanizePercentage }}"
```

## 7. 대시보드 구성

### Grafana 대시보드
```json
{
  "dashboard": {
    "id": null,
    "title": "Bespoke AI Suite - Application Overview",
    "tags": ["bespoke", "application"],
    "timezone": "browser",
    "refresh": "30s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(bespoke_http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec",
            "min": 0
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(bespoke_http_requests_total{status_code=~\"5..\"}[5m])) by (service) / sum(rate(bespoke_http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ],
        "yAxes": [
          {
            "label": "Error Rate",
            "min": 0,
            "max": 1,
            "unit": "percentunit"
          }
        ],
        "thresholds": [
          {
            "value": 0.05,
            "colorMode": "critical",
            "op": "gt"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        }
      },
      {
        "id": 3,
        "title": "Response Time (95th percentile)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(bespoke_http_request_duration_seconds_bucket[5m])) by (service, le))",
            "legendFormat": "{{service}}"
          }
        ],
        "yAxes": [
          {
            "label": "Response Time",
            "min": 0,
            "unit": "s"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 24,
          "x": 0,
          "y": 8
        }
      },
      {
        "id": 4,
        "title": "Content Generation Metrics",
        "type": "row",
        "gridPos": {
          "h": 1,
          "w": 24,
          "x": 0,
          "y": 16
        }
      },
      {
        "id": 5,
        "title": "Content Generation Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(bespoke_content_generation_duration_seconds_bucket[5m])) by (type, le))",
            "legendFormat": "{{type}} (95th)"
          },
          {
            "expr": "histogram_quantile(0.50, sum(rate(bespoke_content_generation_duration_seconds_bucket[5m])) by (type, le))",
            "legendFormat": "{{type}} (50th)"
          }
        ],
        "yAxes": [
          {
            "label": "Duration",
            "min": 0,
            "unit": "s"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 17
        }
      },
      {
        "id": 6,
        "title": "Content Quality Score",
        "type": "stat",
        "targets": [
          {
            "expr": "avg(bespoke_content_quality_score)",
            "legendFormat": "Average Quality Score"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "min": 0,
            "max": 100,
            "unit": "none",
            "thresholds": {
              "steps": [
                {
                  "color": "red",
                  "value": 0
                },
                {
                  "color": "yellow",
                  "value": 70
                },
                {
                  "color": "green",
                  "value": 85
                }
              ]
            }
          }
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 17
        }
      }
    ]
  }
}
```

### 비즈니스 메트릭 대시보드
```json
{
  "dashboard": {
    "title": "Bespoke AI - Business Metrics",
    "panels": [
      {
        "title": "Daily Active Users",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(bespoke_active_users) by (subscription_tier)",
            "legendFormat": "{{subscription_tier}}"
          }
        ]
      },
      {
        "title": "Content Generation Volume",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(increase(bespoke_content_generation_duration_seconds_count[1h])) by (type)",
            "legendFormat": "{{type}}"
          }
        ]
      },
      {
        "title": "Revenue Metrics",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(bespoke_revenue_total)",
            "legendFormat": "Total Revenue"
          }
        ]
      },
      {
        "title": "API Usage by Plan",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum(increase(bespoke_http_requests_total[1h])) by (subscription_plan)",
            "legendFormat": "{{subscription_plan}}"
          }
        ]
      }
    ]
  }
}
```

## 8. 성능 모니터링

### APM 통합 (DataDog)
```javascript
// DataDog APM 설정
const tracer = require('dd-trace').init({
  service: 'content-service',
  env: process.env.NODE_ENV,
  version: process.env.VERSION,
  logInjection: true,
  profiling: true,
  runtimeMetrics: true
});

// 커스텀 메트릭
const StatsD = require('hot-shots');
const statsd = new StatsD({
  host: 'datadog-agent',
  port: 8125,
  globalTags: {
    service: 'content-service',
    env: process.env.NODE_ENV
  }
});

// 비즈니스 메트릭 전송
function trackContentGeneration(type, duration, qualityScore) {
  statsd.timing('content.generation.duration', duration, [`type:${type}`]);
  statsd.gauge('content.quality.score', qualityScore, [`type:${type}`]);
  statsd.increment('content.generation.count', 1, [`type:${type}`]);
}

// 사용자 행동 추적
function trackUserAction(action, userId, metadata = {}) {
  const tags = [`action:${action}`, `user:${userId}`];
  
  Object.entries(metadata).forEach(([key, value]) => {
    tags.push(`${key}:${value}`);
  });
  
  statsd.increment('user.action', 1, tags);
}

module.exports = {
  tracer,
  statsd,
  trackContentGeneration,
  trackUserAction
};
```

### 성능 임계값 모니터링
```yaml
# SLI/SLO 정의
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-config
data:
  slos.yaml: |
    slos:
      - name: content-service-availability
        description: "Content service should be 99.9% available"
        service: content-service
        sli:
          query: |
            sum(rate(bespoke_http_requests_total{service="content-service",status_code!~"5.."}[5m]))
            /
            sum(rate(bespoke_http_requests_total{service="content-service"}[5m]))
        objective: 0.999
        window: 28d
        error_budget: 0.001
      
      - name: content-generation-latency
        description: "95% of content generation should complete within 30s"
        service: content-service
        sli:
          query: |
            histogram_quantile(0.95, 
              sum(rate(bespoke_content_generation_duration_seconds_bucket[5m])) by (le)
            )
        objective: 30
        window: 7d
      
      - name: content-quality
        description: "Average content quality should be above 80"
        service: content-service
        sli:
          query: "avg(bespoke_content_quality_score)"
        objective: 80
        window: 1d
```

## 9. 보안 모니터링

### 보안 이벤트 감지
```yaml
# 보안 알림 규칙
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: security-alerts
spec:
  groups:
  - name: security
    rules:
    - alert: SuspiciousLoginActivity
      expr: |
        sum(rate(bespoke_auth_failed_total[5m])) by (ip, user) > 5
      for: 1m
      labels:
        severity: warning
      annotations:
        summary: "Suspicious login activity detected"
        description: "{{ $value }} failed login attempts from {{ $labels.ip }} for user {{ $labels.user }}"
    
    - alert: AbnormalAPIUsage
      expr: |
        sum(rate(bespoke_http_requests_total[5m])) by (user_id) > 100
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Abnormal API usage detected"
        description: "User {{ $labels.user_id }} is making {{ $value }} requests per second"
    
    - alert: UnauthorizedAccess
      expr: |
        sum(rate(bespoke_http_requests_total{status_code="401"}[5m])) > 10
      for: 2m
      labels:
        severity: critical
      annotations:
        summary: "High number of unauthorized access attempts"
        description: "{{ $value }} unauthorized requests per second"
```

### 감사 로그 모니터링
```python
# 보안 이벤트 로깅
import logging
from datetime import datetime

security_logger = logging.getLogger('security')

class SecurityMonitor:
    def __init__(self):
        self.failed_login_attempts = {}
        self.suspicious_ips = set()
    
    def log_login_attempt(self, user_id, ip, success, metadata=None):
        event = {
            'event_type': 'login_attempt',
            'user_id': user_id,
            'ip_address': ip,
            'success': success,
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': metadata or {}
        }
        
        if success:
            security_logger.info('Successful login', extra=event)
            # 성공 시 실패 카운터 리셋
            self.failed_login_attempts.pop(ip, None)
        else:
            security_logger.warning('Failed login attempt', extra=event)
            # 실패 카운터 증가
            self.failed_login_attempts[ip] = self.failed_login_attempts.get(ip, 0) + 1
            
            # 임계값 초과 시 IP 차단
            if self.failed_login_attempts[ip] >= 5:
                self.block_suspicious_ip(ip)
    
    def log_api_access(self, user_id, endpoint, method, status_code, ip):
        event = {
            'event_type': 'api_access',
            'user_id': user_id,
            'endpoint': endpoint,
            'method': method,
            'status_code': status_code,
            'ip_address': ip,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        security_logger.info('API access', extra=event)
        
        # 비정상적인 접근 패턴 감지
        if status_code == 403:
            self.detect_unauthorized_access(user_id, ip, endpoint)
    
    def block_suspicious_ip(self, ip):
        self.suspicious_ips.add(ip)
        security_logger.critical('IP blocked due to suspicious activity', extra={
            'event_type': 'ip_blocked',
            'ip_address': ip,
            'reason': 'multiple_failed_logins',
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # 방화벽 규칙 업데이트 (실제 구현 필요)
        # firewall.block_ip(ip)
    
    def detect_unauthorized_access(self, user_id, ip, endpoint):
        security_logger.warning('Unauthorized access attempt', extra={
            'event_type': 'unauthorized_access',
            'user_id': user_id,
            'ip_address': ip,
            'endpoint': endpoint,
            'timestamp': datetime.utcnow().isoformat()
        })

security_monitor = SecurityMonitor()
```

## 10. 문제 해결

### 일반적인 모니터링 문제

#### 1. 메트릭이 수집되지 않는 경우
```bash
# Prometheus 타겟 상태 확인
kubectl port-forward svc/prometheus 9090:9090 -n monitoring
# http://localhost:9090/targets 에서 확인

# 서비스 디스커버리 확인
kubectl get endpoints -n bespoke-production

# 메트릭 엔드포인트 직접 테스트
kubectl exec -it deployment/content-service -- curl localhost:3000/metrics
```

#### 2. 로그가 보이지 않는 경우
```bash
# Fluent Bit 상태 확인
kubectl logs daemonset/fluent-bit -n logging

# Elasticsearch 상태 확인
kubectl exec -it elasticsearch-0 -n logging -- curl localhost:9200/_cluster/health

# 로그 인덱스 확인
kubectl exec -it elasticsearch-0 -n logging -- curl localhost:9200/_cat/indices
```

#### 3. 알림이 발송되지 않는 경우
```bash
# AlertManager 설정 확인
kubectl logs deployment/alertmanager -n monitoring

# 알림 규칙 검증
promtool check rules /path/to/rules.yml

# Slack 웹훅 테스트
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  YOUR_SLACK_WEBHOOK_URL
```

### 성능 최적화

#### 메트릭 저장소 최적화
```yaml
# Prometheus 설정
global:
  scrape_interval: 15s  # 너무 짧지 않게
  evaluation_interval: 15s

# 보존 기간 설정
storage:
  tsdb:
    retention.time: 15d  # 15일 보존
    retention.size: 50GB # 최대 50GB
```

#### 로그 필터링
```yaml
# Fluent Bit 필터링
[FILTER]
    Name    grep
    Match   kubernetes.*
    Exclude log .*health.*  # 헬스체크 로그 제외
```

### 모니터링 체크리스트

- [ ] 모든 서비스에서 메트릭 수집 중
- [ ] 핵심 비즈니스 메트릭 추적 중
- [ ] 에러율 및 응답시간 모니터링
- [ ] 인프라 리소스 모니터링
- [ ] 보안 이벤트 모니터링
- [ ] 알림 규칙 테스트 완료
- [ ] 대시보드 구성 완료
- [ ] 런북 및 대응 절차 문서화

---

*체계적인 모니터링으로 안정적인 서비스 운영을 보장하세요! 📊*