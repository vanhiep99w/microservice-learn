# Observability trên AWS

## 📋 Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
- [2. Distributed Tracing với AWS X-Ray](#2-distributed-tracing-với-aws-x-ray)
  - [2.1. X-Ray hoạt động như thế nào?](#21-x-ray-hoạt-động-như-thế-nào)
  - [2.2. Tích hợp X-Ray với ECS / EKS / Lambda](#22-tích-hợp-x-ray-với-ecs--eks--lambda)
  - [2.3. X-Ray Service Map](#23-x-ray-service-map)
  - [2.4. Sampling Rules — Kiểm soát chi phí](#24-sampling-rules--kiểm-soát-chi-phí)
  - [2.5. X-Ray vs OpenTelemetry trên AWS](#25-x-ray-vs-opentelemetry-trên-aws)
- [3. Centralized Logging với CloudWatch Logs](#3-centralized-logging-với-cloudwatch-logs)
  - [3.1. Kiến trúc Logging trên AWS](#31-kiến-trúc-logging-trên-aws)
  - [3.2. CloudWatch Logs — Cấu hình cho ECS / EKS / Lambda](#32-cloudwatch-logs--cấu-hình-cho-ecs--eks--lambda)
  - [3.3. Structured Logging & Log Insights](#33-structured-logging--log-insights)
  - [3.4. Cross-Account & Cross-Region Logging](#34-cross-account--cross-region-logging)
  - [3.5. Lựa chọn thay thế — OpenSearch (ELK trên AWS)](#35-lựa-chọn-thay-thế--opensearch-elk-trên-aws)
- [4. Metrics & Alerting với CloudWatch](#4-metrics--alerting-với-cloudwatch)
  - [4.1. CloudWatch Metrics — Built-in & Custom](#41-cloudwatch-metrics--built-in--custom)
  - [4.2. CloudWatch Container Insights](#42-cloudwatch-container-insights)
  - [4.3. Custom Metrics — Embedded Metric Format (EMF)](#43-custom-metrics--embedded-metric-format-emf)
  - [4.4. CloudWatch Alarms & Composite Alarms](#44-cloudwatch-alarms--composite-alarms)
  - [4.5. CloudWatch Dashboards](#45-cloudwatch-dashboards)
- [5. Managed Prometheus & Grafana trên AWS](#5-managed-prometheus--grafana-trên-aws)
  - [5.1. Amazon Managed Prometheus (AMP)](#51-amazon-managed-prometheus-amp)
  - [5.2. Amazon Managed Grafana (AMG)](#52-amazon-managed-grafana-amg)
  - [5.3. Khi nào CloudWatch vs Prometheus + Grafana?](#53-khi-nào-cloudwatch-vs-prometheus--grafana)
- [6. Alerting & Incident Response](#6-alerting--incident-response)
  - [6.1. Alerting Pipeline trên AWS](#61-alerting-pipeline-trên-aws)
  - [6.2. Thiết kế Alert hiệu quả — Tránh Alert Fatigue](#62-thiết-kế-alert-hiệu-quả--tránh-alert-fatigue)
  - [6.3. Runbook Automation với Systems Manager](#63-runbook-automation-với-systems-manager)
- [7. Cost Monitoring & Optimization](#7-cost-monitoring--optimization)
  - [7.1. Observability Cost trên AWS](#71-observability-cost-trên-aws)
  - [7.2. Chiến lược giảm chi phí Observability](#72-chiến-lược-giảm-chi-phí-observability)
- [8. Ví dụ thực tế — E-Commerce Observability Stack](#8-ví-dụ-thực-tế--e-commerce-observability-stack)
- [9. Anti-patterns](#9-anti-patterns)
- [10. Checklist triển khai](#10-checklist-triển-khai)
- [11. Tổng kết](#11-tổng-kết)
- [12. Liên kết liên quan](#12-liên-kết-liên-quan)

---

## 1. Giới thiệu

Trong [doc 11 — Observability & Evolvability](11-observability-evolvability.md), chúng ta đã hiểu lý thuyết về ba trụ cột Observability: **Logs, Metrics, Traces**, cùng các công cụ như ELK Stack, Prometheus, Grafana, Jaeger. Doc này **áp dụng tất cả kiến thức đó vào thực tế trên AWS** — mapping từng trụ cột sang AWS service cụ thể, từ cấu hình chi tiết đến best practices về chi phí.

Doc này trả lời câu hỏi: **Distributed Tracing triển khai với X-Ray ra sao? Centralized Logging với CloudWatch Logs hay OpenSearch? Metrics + Alerting cấu hình thế nào? Container Insights là gì? Chi phí Observability kiểm soát bằng cách nào?**

> 💡 Giả định: Bạn đã đọc [doc 11](11-observability-evolvability.md) và hiểu lý thuyết. Doc này tập trung vào **cách AWS hiện thực hóa** các khái niệm đó.

```
┌────────────────────────────────────────────────────────────────────┐
│            OBSERVABILITY LANDSCAPE trên AWS                        │
│                                                                    │
│  ┌─────── Traces (Distributed Tracing) ────────────────────────┐   │
│  │  AWS X-Ray                    ← managed tracing             │   │
│  │  OpenTelemetry + X-Ray SDK    ← vendor-neutral              │   │
│  │  ADOT Collector               ← OTel collector managed      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌─────── Logs (Centralized Logging) ──────────────────────────┐   │
│  │  CloudWatch Logs              ← default, tích hợp sẵn       │   │
│  │  CloudWatch Logs Insights     ← query engine                │   │
│  │  OpenSearch (ELK trên AWS)    ← full-text search, Kibana    │   │
│  │  S3 + Athena                  ← archive & ad-hoc query      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌─────── Metrics & Alerting ──────────────────────────────────┐   │
│  │  CloudWatch Metrics           ← built-in AWS metrics        │   │
│  │  CloudWatch Container Insights← ECS/EKS metrics             │   │
│  │  CloudWatch EMF               ← custom business metrics     │   │
│  │  Amazon Managed Prometheus    ← Prometheus-compatible       │   │
│  │  Amazon Managed Grafana       ← dashboards                  │   │
│  │  CloudWatch Alarms            ← alerting + auto actions     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌─────── Incident Response ───────────────────────────────────┐   │
│  │  SNS                          ← notifications               │   │
│  │  EventBridge                  ← event routing               │   │
│  │  Systems Manager Runbooks     ← automated remediation       │   │
│  │  AWS Chatbot                  ← Slack/Teams integration     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Distributed Tracing với AWS X-Ray

### 2.1. X-Ray hoạt động như thế nào?

**AWS X-Ray** là managed distributed tracing service — thu thập data từ các service, tạo **Service Map** trực quan và cho phép phân tích latency, error rates theo từng request path.

```
┌──────────────────────────────────────────────────────────────────┐
│                  AWS X-RAY ARCHITECTURE                          │
│                                                                  │
│  ┌─── Service A ──────┐   ┌─── Service B ──────┐                 │
│  │  Application Code  │   │  Application Code  │                 │
│  │       │            │   │       │            │                 │
│  │  ┌────▼──────────┐ │   │  ┌────▼──────────┐ │                 │
│  │  │ X-Ray SDK /   │ │   │  │ X-Ray SDK /   │ │                 │
│  │  │ OTel SDK      │ │   │  │ OTel SDK      │ │                 │
│  │  └────┬──────────┘ │   │  └────┬──────────┘ │                 │
│  │       │            │   │       │            │                 │
│  │  ┌────▼──────────┐ │   │  ┌────▼──────────┐ │                 │
│  │  │ X-Ray Daemon  │ │   │  │ ADOT Collector│ │                 │
│  │  │ (sidecar)     │ │   │  │ (sidecar)     │ │                 │
│  │  └────┬──────────┘ │   │  └────┬──────────┘ │                 │
│  └───────┼────────────┘   └───────┼────────────┘                 │
│          │                        │                              │
│          └──────────┬─────────────┘                              │
│                     ▼                                            │
│          ┌──────────────────┐                                    │
│          │   X-Ray Service  │                                    │
│          │   ┌────────────┐ │                                    │
│          │   │ Traces     │ │                                    │
│          │   │ Service Map│ │                                    │
│          │   │ Analytics  │ │                                    │
│          │   └────────────┘ │                                    │
│          └──────────────────┘                                    │
│                                                                  │
│  Trace Context propagation:                                      │
│  HTTP Header: X-Amzn-Trace-Id                                    │
│  Format: Root=1-xxx;Parent=yyy;Sampled=1                         │
└──────────────────────────────────────────────────────────────────┘
```

#### Các khái niệm cốt lõi

| Khái niệm | Mô tả | Tương đương OpenTelemetry |
|-----------|--------|--------------------------|
| **Trace** | Toàn bộ journey của 1 request qua các service | Trace |
| **Segment** | Công việc mà 1 service thực hiện cho request | Span |
| **Subsegment** | Chi tiết bên trong segment (DB call, HTTP call) | Child Span |
| **Annotations** | Key-value indexed, dùng để filter traces | Span Attributes (indexed) |
| **Metadata** | Key-value không indexed, data bổ sung | Span Attributes (non-indexed) |
| **Service Map** | Biểu đồ trực quan các service và connections | Service Graph |

### 2.2. Tích hợp X-Ray với ECS / EKS / Lambda

#### X-Ray cho ECS (Sidecar Pattern)

```hcl
# ECS Task Definition với X-Ray Daemon sidecar
resource "aws_ecs_task_definition" "order_service" {
  family                   = "order-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 1024
  memory                   = 2048
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      # Application container
      name  = "order-service"
      image = "${aws_ecr_repository.order.repository_url}:latest"
      portMappings = [{ containerPort = 8080, protocol = "tcp" }]

      environment = [
        {
          name  = "AWS_XRAY_DAEMON_ADDRESS"
          value = "localhost:2000"           # X-Ray daemon cùng task
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/order-service"
          "awslogs-region"        = "ap-southeast-1"
          "awslogs-stream-prefix" = "app"
        }
      }
    },
    {
      # X-Ray Daemon sidecar
      name      = "xray-daemon"
      image     = "amazon/aws-xray-daemon:latest"
      cpu       = 32
      memory    = 256
      essential = true
      portMappings = [{ containerPort = 2000, protocol = "udp" }]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/order-service"
          "awslogs-region"        = "ap-southeast-1"
          "awslogs-stream-prefix" = "xray"
        }
      }
    }
  ])
}

# IAM Policy cho X-Ray
resource "aws_iam_role_policy_attachment" "xray" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}
```

#### X-Ray cho EKS (ADOT Collector DaemonSet)

```yaml
# ADOT (AWS Distro for OpenTelemetry) Collector — DaemonSet
apiVersion: opentelemetry.io/v1alpha1
kind: OpenTelemetryCollector
metadata:
  name: adot-collector
  namespace: observability
spec:
  mode: daemonset
  serviceAccount: adot-collector
  config: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318

    processors:
      batch:
        timeout: 5s
        send_batch_size: 256
      memory_limiter:
        check_interval: 1s
        limit_mib: 512
        spike_limit_mib: 128

    exporters:
      awsxray:
        region: ap-southeast-1
        index_all_attributes: true
      awsemf:
        region: ap-southeast-1
        namespace: EKS/CustomMetrics
        log_group_name: /eks/metrics

    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [memory_limiter, batch]
          exporters: [awsxray]
        metrics:
          receivers: [otlp]
          processors: [memory_limiter, batch]
          exporters: [awsemf]
```

#### X-Ray cho Lambda (Built-in)

```hcl
# Lambda — X-Ray tracing tích hợp sẵn
resource "aws_lambda_function" "payment_processor" {
  function_name = "payment-processor"
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  tracing_config {
    mode = "Active"        # Tự động trace mọi invocation
    # "PassThrough" = chỉ trace nếu upstream đã sampled
  }
}
```

| Platform | Cách tích hợp X-Ray | Effort | Tự động trace |
|----------|---------------------|--------|:-------------:|
| **Lambda** | `tracing_config.mode = "Active"` | Rất thấp | ✅ AWS SDK, HTTP calls |
| **ECS** | X-Ray Daemon sidecar + SDK | Trung bình | ⚠️ Cần instrument code |
| **EKS** | ADOT Collector DaemonSet + OTel SDK | Trung bình | ⚠️ Cần instrument code |
| **API Gateway** | Enable tracing trong stage settings | Rất thấp | ✅ Tự động |
| **App Mesh (legacy)** | Envoy tự gửi traces | Thấp | ⚠️ Legacy, EoS 30/09/2026 |

### 2.3. X-Ray Service Map

X-Ray Service Map hiển thị **biểu đồ trực quan** toàn bộ hệ thống — mỗi node là 1 service, edges là connections, màu sắc thể hiện health.

```
┌──────────────────────────────────────────────────────────────┐
│                  X-RAY SERVICE MAP                           │
│                                                              │
│                    ┌──────────┐                              │
│        ┌──────────▶│ Inventory│                              │
│        │           │  🟢 OK   │                              │
│  ┌─────┴────┐      └──────────┘                              │
│  │   API    │                                                │
│  │ Gateway  │      ┌──────────┐       ┌──────────┐           │
│  │  🟢 OK   │─────▶│  Order   │──────▶│ Payment  │           │
│  └──────────┘      │  🟢 OK   │       │  🟡 Slow │           │
│                    └────┬─────┘       └────┬─────┘           │
│                         │                  │                 │
│                    ┌────▼─────┐       ┌────▼─────┐           │
│                    │ Aurora   │       │ Stripe   │           │
│                    │ DB 🟢    │       │ API 🟡   │           │
│                    └──────────┘       └──────────┘           │
│                                                              │
│  🟢 < 1% errors, < 200ms     Latency breakdown:              │
│  🟡 1-5% errors hoặc > 500ms   Order → Payment: 450ms        │
│  🔴 > 5% errors                Payment → Stripe: 380ms ⚠️    │
│                                                              │
│  → Bottleneck: Stripe API response time                      │
└──────────────────────────────────────────────────────────────┘
```

### 2.4. Sampling Rules — Kiểm soát chi phí

X-Ray charge theo số traces recorded. **Sampling** giảm chi phí bằng cách chỉ record một phần requests.

```hcl
# X-Ray Sampling Rule — Terraform
resource "aws_xray_sampling_rule" "payment_service" {
  rule_name      = "payment-service"
  priority       = 100
  version        = 1
  reservoir_size = 10          # 10 traces/giây guaranteed
  fixed_rate     = 0.1         # 10% các request còn lại
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "payment-service"
  resource_arn   = "*"
}

# Health check — không trace (giảm noise)
resource "aws_xray_sampling_rule" "health_check" {
  rule_name      = "health-check-no-trace"
  priority       = 1           # Ưu tiên cao nhất
  version        = 1
  reservoir_size = 0
  fixed_rate     = 0.0         # 0% — không trace
  url_path       = "/health*"
  host           = "*"
  http_method    = "GET"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"
}

# Error requests — trace 100%
resource "aws_xray_sampling_rule" "errors" {
  rule_name      = "all-errors"
  priority       = 50
  version        = 1
  reservoir_size = 100
  fixed_rate     = 1.0         # 100% — trace tất cả errors
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  # Kết hợp với X-Ray SDK: chỉ gửi error traces khi response code >= 400
}
```

#### Chiến lược Sampling

| Chiến lược | Fixed Rate | Reservoir | Use case |
|-----------|-----------|-----------|----------|
| **Development** | 100% | N/A | Debug, thấy mọi trace |
| **Staging** | 50% | 50/s | Test performance, đủ data |
| **Production — default** | 5-10% | 10/s | Balance cost vs visibility |
| **Production — critical path** | 20-50% | 20/s | Payment, checkout flows |
| **Production — health check** | 0% | 0 | Loại bỏ noise hoàn toàn |
| **Production — errors** | 100% | 100/s | Luôn trace tất cả errors |

### 2.5. X-Ray vs OpenTelemetry trên AWS

```
┌────────────────────────────────────────────────────────────────┐
│          TRACING OPTIONS trên AWS                              │
│                                                                │
│  Option 1: X-Ray SDK (AWS native)                              │
│  ┌──────────┐    ┌───────────┐    ┌───────────┐                │
│  │ App +    │───▶│ X-Ray     │───▶│ X-Ray     │                │
│  │ X-Ray SDK│    │ Daemon    │    │ Service   │                │
│  └──────────┘    └───────────┘    └───────────┘                │
│  ✅ Đơn giản, auto-instrument AWS SDK                          │
│  ❌ Vendor lock-in, chỉ export sang X-Ray                      │
│                                                                │
│  Option 2: OpenTelemetry + ADOT (khuyến nghị)                  │
│  ┌──────────┐    ┌───────────┐    ┌───────────┐                │
│  │ App +    │───▶│ ADOT      │───▶│ X-Ray     │                │
│  │ OTel SDK │    │ Collector │───▶│ Prometheus│                │
│  └──────────┘    └───────────┘───▶│ Jaeger    │                │
│                                   └───────────┘                │
│  ✅ Vendor-neutral, multi-backend                              │
│  ✅ Richer instrumentation libraries                           │
│  ⚠️ Setup phức tạp hơn một chút                                │
│                                                                │
│  💡 Khuyến nghị: Dùng OpenTelemetry SDK + ADOT Collector       │
│     → export sang X-Ray cho traces, CloudWatch cho metrics     │
│     → dễ migrate sang backend khác trong tương lai             │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Centralized Logging với CloudWatch Logs

### 3.1. Kiến trúc Logging trên AWS

```
┌───────────────────────────────────────────────────────────────────────┐
│                  CENTRALIZED LOGGING ARCHITECTURE                     │
│                                                                       │
│  ┌──── Log Sources ──────────────────────────────────────────────┐    │
│  │                                                               │    │
│  │  ECS Tasks ──── awslogs driver ──────┐                        │    │
│  │  EKS Pods ───── Fluent Bit DaemonSet ┤                        │    │
│  │  Lambda ─────── built-in ────────────┤                        │    │
│  │  API Gateway ── access logs ─────────┤                        │    │
│  │  ALB ────────── access logs ─────────┤                        │    │
│  │  RDS/Aurora ─── audit/slow query ────┤                        │    │
│  │  VPC Flow Logs ──────────────────────┤                        │    │
│  └──────────────────────────────────────┼────────────────────────┘    │
│                                         ▼                             │
│                              ┌───────────────────┐                    │
│                              │  CloudWatch Logs  │                    │
│                              │  (Log Groups)     │                    │
│                              └────┬────┬────┬────┘                    │
│                                   │    │    │                         │
│                    ┌──────────────┘    │    └──────────────┐          │
│                    ▼                   ▼                   ▼          │
│           ┌──────────────┐  ┌──────────────┐  ┌───────────────┐       │
│           │ Logs Insights│  │ Subscription │  │ S3 Export     │       │
│           │ (query)      │  │ Filter       │  │ (archive)     │       │
│           └──────────────┘  └──────┬───────┘  └──────┬────────┘       │
│                                    │                 │                │
│                          ┌─────────▼──────┐   ┌──────▼────────┐       │
│                          │ Lambda /       │   │ Athena        │       │
│                          │ OpenSearch /   │   │ (ad-hoc query │       │
│                          │ Kinesis        │   │  on S3 logs)  │       │
│                          └────────────────┘   └───────────────┘       │
└───────────────────────────────────────────────────────────────────────┘
```

### 3.2. CloudWatch Logs — Cấu hình cho ECS / EKS / Lambda

#### ECS — awslogs driver (mặc định)

```hcl
# ECS Task Definition — log configuration
container_definitions = jsonencode([{
  name  = "order-service"
  image = "order-service:latest"

  logConfiguration = {
    logDriver = "awslogs"
    options = {
      "awslogs-group"           = "/ecs/order-service"
      "awslogs-region"          = "ap-southeast-1"
      "awslogs-stream-prefix"   = "order"
      "awslogs-create-group"    = "true"
      "awslogs-datetime-format" = "%Y-%m-%dT%H:%M:%S"    # Multiline log parsing
    }
  }
}])

# Log Group với retention
resource "aws_cloudwatch_log_group" "order_service" {
  name              = "/ecs/order-service"
  retention_in_days = 30           # Tự xóa sau 30 ngày (giảm chi phí)

  tags = {
    Service     = "order-service"
    Environment = "production"
  }
}
```

#### EKS — Fluent Bit DaemonSet

```yaml
# Fluent Bit ConfigMap cho EKS
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: observability
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         5
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf

    [INPUT]
        Name              tail
        Tag               kube.*
        Path              /var/log/containers/*.log
        Parser            docker
        DB                /var/log/flb_kube.db
        Mem_Buf_Limit     50MB
        Skip_Long_Lines   On
        Refresh_Interval  10

    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Merge_Log           On
        K8S-Logging.Parser  On
        K8S-Logging.Exclude On

    [OUTPUT]
        Name                cloudwatch_logs
        Match               kube.*
        region              ap-southeast-1
        log_group_name      /eks/$(kubernetes['namespace_name'])
        log_stream_prefix   $(kubernetes['pod_name'])-
        auto_create_group   true
        log_retention_days  30
```

#### Lambda — Built-in Logging

```hcl
# Lambda tự động ghi log vào CloudWatch
# Log Group: /aws/lambda/<function-name>
# Chỉ cần cấu hình retention

resource "aws_cloudwatch_log_group" "payment_lambda" {
  name              = "/aws/lambda/payment-processor"
  retention_in_days = 14       # Lambda logs thường ngắn hạn hơn
}
```

### 3.3. Structured Logging & Log Insights

#### Structured Logging Format (JSON)

```json
{
  "timestamp": "2025-02-27T10:30:45.123Z",
  "level": "INFO",
  "service": "order-service",
  "traceId": "1-65d8f3a1-abcdef012345678901234567",
  "spanId": "a1b2c3d4e5f6",
  "correlationId": "req-abc123",
  "message": "Order created successfully",
  "orderId": "ORD-2025-001",
  "userId": "USR-456",
  "amount": 150.00,
  "duration_ms": 245,
  "metadata": {
    "items_count": 3,
    "payment_method": "credit_card"
  }
}
```

#### CloudWatch Logs Insights — Query Examples

```sql
-- Top 10 slowest requests trong 1 giờ
fields @timestamp, service, message, duration_ms, traceId
| filter duration_ms > 0
| sort duration_ms desc
| limit 10

-- Error rate per service (15 phút gần nhất)
fields service
| filter level = "ERROR"
| stats count(*) as error_count by service
| sort error_count desc

-- Trace một request xuyên services bằng correlationId
fields @timestamp, service, level, message, duration_ms
| filter correlationId = "req-abc123"
| sort @timestamp asc

-- P50, P90, P99 latency per service
fields service, duration_ms
| filter duration_ms > 0
| stats avg(duration_ms) as avg_ms,
        pct(duration_ms, 50) as p50,
        pct(duration_ms, 90) as p90,
        pct(duration_ms, 99) as p99
    by service

-- Đếm errors theo error type
fields @timestamp, level, errorType, message
| filter level = "ERROR"
| stats count(*) as count by errorType
| sort count desc

-- Tìm cold starts của Lambda
fields @timestamp, @duration, @billedDuration, @initDuration
| filter ispresent(@initDuration)
| stats count(*) as cold_starts,
        avg(@initDuration) as avg_init_ms,
        max(@initDuration) as max_init_ms
    by bin(1h)
```

### 3.4. Cross-Account & Cross-Region Logging

Với hệ thống multi-account (theo AWS best practice), logs cần tập trung về **central logging account**.

```
┌─────────────────────────────────────────────────────────────────┐
│              CROSS-ACCOUNT LOGGING                              │
│                                                                 │
│  ┌─── Account: Production ────┐  ┌─── Account: Staging ───────┐ │
│  │  CloudWatch Logs           │  │  CloudWatch Logs           │ │
│  │  /ecs/order-service        │  │  /ecs/order-service        │ │
│  │  /ecs/payment-service      │  │  /ecs/payment-service      │ │
│  └──────────┬─────────────────┘  └───────────┬────────────────┘ │
│             │ Subscription Filter            │                  │
│             ▼                                ▼                  │
│  ┌──────────────────── Account: Central Logging ──────────────┐ │
│  │                                                            │ │
│  │  ┌──────────────┐     ┌──────────────┐    ┌─────────────┐  │ │
│  │  │ Kinesis Data │────▶│ OpenSearch   │    │ S3 Bucket   │  │ │
│  │  │ Firehose     │     │ (Kibana)     │    │ (Archive)   │  │ │
│  │  └──────────────┘     └──────────────┘    └──────┬──────┘  │ │
│  │                                                  │         │ │
│  │                                            ┌─────▼──────┐  │ │
│  │                                            │ Athena     │  │ │
│  │                                            │ (ad-hoc)   │  │ │
│  │                                            └────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

```hcl
# Subscription Filter — gửi logs sang central account
resource "aws_cloudwatch_log_subscription_filter" "central" {
  name            = "central-logging"
  log_group_name  = "/ecs/order-service"
  filter_pattern  = ""                        # Gửi tất cả logs
  destination_arn = "arn:aws:logs:ap-southeast-1:CENTRAL_ACCOUNT:destination:central-logs"
  role_arn        = aws_iam_role.cw_to_central.arn
}

# S3 Export cho archival (giảm chi phí long-term storage)
resource "aws_cloudwatch_log_group" "order_service" {
  name              = "/ecs/order-service"
  retention_in_days = 30      # CloudWatch giữ 30 ngày

  # Logs > 30 ngày → export sang S3 (qua Lambda scheduled task)
}
```

### 3.5. Lựa chọn thay thế — OpenSearch (ELK trên AWS)

| Tiêu chí | CloudWatch Logs + Insights | OpenSearch (ELK) |
|----------|---------------------------|-----------------|
| **Setup** | Zero setup (built-in) | Cần provision cluster |
| **Query** | Logs Insights (SQL-like) | KQL + Lucene (powerful) |
| **Dashboard** | CloudWatch Dashboards | Kibana (rất mạnh) |
| **Full-text search** | ⚠️ Basic | ✅ Excellent |
| **Log correlation** | ✅ Tốt với Trace ID | ✅ Excellent |
| **Cost (10GB/day)** | ~$150/month | ~$300-500/month |
| **Cost (100GB/day)** | ~$1500/month | ~$1000-2000/month |
| **Retention** | Flexible (1 day - forever) | Cluster storage dependent |
| **Best for** | Hầu hết use cases | Heavy log analytics, complex queries |

> 💡 **Khuyến nghị**: Bắt đầu với **CloudWatch Logs + Insights** (đơn giản, zero setup). Chỉ thêm **OpenSearch** khi cần full-text search phức tạp hoặc Kibana dashboards.

---

## 4. Metrics & Alerting với CloudWatch

### 4.1. CloudWatch Metrics — Built-in & Custom

AWS services tự động gửi metrics về CloudWatch — gọi là **built-in metrics**. Ngoài ra, application có thể gửi **custom metrics**.

#### Built-in Metrics quan trọng

| Service | Metrics | Ý nghĩa |
|---------|---------|---------|
| **ECS** | CPUUtilization, MemoryUtilization | Resource usage per service |
| **ALB** | RequestCount, TargetResponseTime, HTTP_5XX | Traffic & errors |
| **Lambda** | Invocations, Errors, Duration, Throttles, ConcurrentExecutions | Function performance |
| **API Gateway** | Count, Latency, 4XXError, 5XXError | API performance |
| **RDS/Aurora** | CPUUtilization, DatabaseConnections, ReadLatency, WriteLatency | DB health |
| **DynamoDB** | ConsumedRCU/WCU, ThrottledRequests, SuccessfulRequestLatency | Table performance |
| **SQS** | ApproximateNumberOfMessages, ApproximateAgeOfOldestMessage | Queue depth & lag |
| **ElastiCache** | CacheHitRate, CurrConnections, EngineCPUUtilization | Cache effectiveness |

### 4.2. CloudWatch Container Insights

**Container Insights** cung cấp metrics chi tiết cho **ECS và EKS** — bao gồm cluster, service, task/pod level metrics.

```hcl
# Bật Container Insights cho ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "production"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
```

```yaml
# Bật Container Insights cho EKS — ADOT addon
apiVersion: eks.amazonaws.com/v1alpha1
kind: Addon
metadata:
  name: amazon-cloudwatch-observability
spec:
  addonName: amazon-cloudwatch-observability
  clusterName: production
```

#### Metrics từ Container Insights

```
┌────────────────────────────────────────────────────────────────┐
│              CONTAINER INSIGHTS METRICS HIERARCHY              │
│                                                                │
│  Cluster Level:                                                │
│  ├── cluster_cpu_utilization                                   │
│  ├── cluster_memory_utilization                                │
│  ├── cluster_running_task_count (ECS) / pod_count (EKS)        │
│  └── cluster_node_count (EKS)                                  │
│                                                                │
│  Service Level (ECS) / Deployment Level (EKS):                 │
│  ├── service_cpu_utilization                                   │
│  ├── service_memory_utilization                                │
│  ├── service_running_task_count / deployment_replicas          │
│  └── service_desired_task_count                                │
│                                                                │
│  Task Level (ECS) / Pod Level (EKS):                           │
│  ├── task_cpu_utilization / pod_cpu_utilization                │
│  ├── task_memory_utilization / pod_memory_utilizatio           │
│  ├── task_network_rx_bytes / pod_network_rx_bytes              │
│  └── container_restart_count                                   │
│                                                                │
│  Performance Insights (Container Insights Enhanced):           │
│  ├── pod_cpu_request / pod_cpu_limit                           │
│  ├── pod_memory_request / pod_memory_limit                     │
│  └── node_filesystem_utilization                               │
└────────────────────────────────────────────────────────────────┘
```

### 4.3. Custom Metrics — Embedded Metric Format (EMF)

**EMF** (Embedded Metric Format) cho phép gửi custom metrics **qua structured logs** — không cần gọi `PutMetricData` API riêng (giảm latency, giảm cost).

```json
// EMF Log Line — ghi ra stdout, CloudWatch tự extract metrics
{
  "_aws": {
    "Timestamp": 1709020245123,
    "CloudWatchMetrics": [
      {
        "Namespace": "ECommerce/OrderService",
        "Dimensions": [["Service", "Environment"]],
        "Metrics": [
          { "Name": "OrderProcessingTime", "Unit": "Milliseconds" },
          { "Name": "OrderValue", "Unit": "None" },
          { "Name": "OrderCount", "Unit": "Count" }
        ]
      }
    ]
  },
  "Service": "order-service",
  "Environment": "production",
  "OrderProcessingTime": 245,
  "OrderValue": 150.00,
  "OrderCount": 1,
  "orderId": "ORD-2025-001",
  "message": "Order processed"
}
```

```typescript
// Node.js — sử dụng aws-embedded-metrics library
import { createMetricsLogger, Unit } from "aws-embedded-metrics";

async function processOrder(order: Order) {
  const metrics = createMetricsLogger();
  const start = Date.now();

  try {
    // Process order...
    const result = await orderService.create(order);

    metrics.putMetric("OrderProcessingTime", Date.now() - start, Unit.Milliseconds);
    metrics.putMetric("OrderValue", order.totalAmount, Unit.None);
    metrics.putMetric("OrderCount", 1, Unit.Count);
    metrics.setProperty("orderId", order.id);
    metrics.setDimensions({ Service: "order-service", Environment: "production" });

    await metrics.flush();
    return result;
  } catch (error) {
    metrics.putMetric("OrderErrors", 1, Unit.Count);
    metrics.setProperty("errorType", error.name);
    await metrics.flush();
    throw error;
  }
}
```

#### PutMetricData vs EMF

| Tiêu chí | PutMetricData API | Embedded Metric Format (EMF) |
|----------|-------------------|------------------------------|
| **Cách gửi** | API call riêng | Ghi vào log (stdout) |
| **Latency** | Thêm API call overhead | Zero overhead (async log) |
| **Cost** | $0.01/1000 metrics | Chỉ tính log ingestion |
| **Batching** | Cần tự batch | CloudWatch tự batch từ logs |
| **High-cardinality** | ⚠️ Expensive | ✅ Properties không tạo metric (free) |
| **Khi nào dùng** | Cần push metric từ bên ngoài CloudWatch | Trong application code |

### 4.4. CloudWatch Alarms & Composite Alarms

```hcl
# Alarm — High Error Rate
resource "aws_cloudwatch_metric_alarm" "order_error_rate" {
  alarm_name          = "order-service-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3           # 3 data points liên tiếp
  threshold           = 5           # > 5% errors
  alarm_description   = "Order service error rate > 5% for 3 consecutive periods"

  metric_query {
    id          = "error_rate"
    expression  = "(errors / total) * 100"
    label       = "Error Rate %"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "HTTP_5XX"
      namespace   = "AWS/ApplicationELB"
      period      = 300            # 5 phút
      stat        = "Sum"
      dimensions = {
        TargetGroup  = aws_lb_target_group.order.arn_suffix
        LoadBalancer = aws_lb.main.arn_suffix
      }
    }
  }

  metric_query {
    id = "total"
    metric {
      metric_name = "RequestCount"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Sum"
      dimensions = {
        TargetGroup  = aws_lb_target_group.order.arn_suffix
        LoadBalancer = aws_lb.main.arn_suffix
      }
    }
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

# Alarm — High Latency (P99)
resource "aws_cloudwatch_metric_alarm" "order_latency_p99" {
  alarm_name          = "order-service-high-latency-p99"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 2000       # > 2 seconds P99

  metric_name = "TargetResponseTime"
  namespace   = "AWS/ApplicationELB"
  period      = 300
  statistic   = "p99"

  dimensions = {
    TargetGroup  = aws_lb_target_group.order.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# Alarm — SQS Queue Depth (messages backing up)
resource "aws_cloudwatch_metric_alarm" "order_queue_depth" {
  alarm_name          = "order-queue-high-depth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 1000

  metric_name = "ApproximateNumberOfMessagesVisible"
  namespace   = "AWS/SQS"
  period      = 300
  statistic   = "Maximum"

  dimensions = {
    QueueName = aws_sqs_queue.order_queue.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# Composite Alarm — Service Critical (cả error rate VÀ latency đều cao)
resource "aws_cloudwatch_composite_alarm" "order_critical" {
  alarm_name = "order-service-CRITICAL"

  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.order_error_rate.alarm_name}) AND ALARM(${aws_cloudwatch_metric_alarm.order_latency_p99.alarm_name})"

  alarm_actions = [aws_sns_topic.critical_alerts.arn]    # PagerDuty / on-call
}
```

### 4.5. CloudWatch Dashboards

```hcl
# CloudWatch Dashboard — Order Service
resource "aws_cloudwatch_dashboard" "order_service" {
  dashboard_name = "Order-Service-Production"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "Request Rate & Errors"
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "TargetGroup", "${tg_arn}", { stat = "Sum", label = "Total Requests" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "TargetGroup", "${tg_arn}", { stat = "Sum", label = "5XX Errors", color = "#d62728" }]
          ]
          period = 60
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "Response Time (ms)"
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "TargetGroup", "${tg_arn}", { stat = "p50", label = "P50" }],
            ["AWS/ApplicationELB", "TargetResponseTime", "TargetGroup", "${tg_arn}", { stat = "p90", label = "P90", color = "#ff7f0e" }],
            ["AWS/ApplicationELB", "TargetResponseTime", "TargetGroup", "${tg_arn}", { stat = "p99", label = "P99", color = "#d62728" }]
          ]
          period = 60
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 8
        height = 6
        properties = {
          title   = "ECS CPU & Memory"
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", "order-service", "ClusterName", "production", { stat = "Average", label = "CPU %" }],
            ["AWS/ECS", "MemoryUtilization", "ServiceName", "order-service", "ClusterName", "production", { stat = "Average", label = "Memory %" }]
          ]
          period = 60
          yAxis  = { left = { min = 0, max = 100 } }
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 6
        width  = 8
        height = 6
        properties = {
          title   = "ECS Task Count"
          metrics = [
            ["ECS/ContainerInsights", "RunningTaskCount", "ServiceName", "order-service", "ClusterName", "production", { stat = "Average", label = "Running" }],
            ["ECS/ContainerInsights", "DesiredTaskCount", "ServiceName", "order-service", "ClusterName", "production", { stat = "Average", label = "Desired" }]
          ]
          period = 60
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 6
        width  = 8
        height = 6
        properties = {
          title   = "SQS Queue Depth"
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", "order-queue", { stat = "Maximum", label = "Messages Waiting" }],
            ["AWS/SQS", "ApproximateAgeOfOldestMessage", "QueueName", "order-queue", { stat = "Maximum", label = "Oldest Message (s)" }]
          ]
          period = 60
        }
      }
    ]
  })
}
```

---

## 5. Managed Prometheus & Grafana trên AWS

### 5.1. Amazon Managed Prometheus (AMP)

**AMP** là fully managed Prometheus-compatible service — không cần quản lý Prometheus server, tự động scale, multi-AZ.

```
┌───────────────────────────────────────────────────────────┐
│          AMAZON MANAGED PROMETHEUS (AMP)                  │
│                                                           │
│  ┌─── EKS Cluster ───────────────────────────────────┐    │
│  │                                                   │    │
│  │  ┌──────────────┐     ┌───────────────────────┐   │    │
│  │  │ Application  │     │ Prometheus Metrics    │   │    │
│  │  │ Pods         │────▶│ (/metrics endpoint)   │   │    │
│  │  └──────────────┘     └──────────┬────────────┘   │    │
│  │                                  │                │    │
│  │  ┌──────────────────────────────▼─────────────┐   │    │
│  │  │ ADOT Collector (hoặc Prometheus Agent)     │   │    │
│  │  │ remote_write → AMP endpoint                │   │    │
│  │  └──────────────────────────────┬─────────────┘   │    │
│  └─────────────────────────────────┼─────────────────┘    │
│                                    │                      │
│                                    ▼                      │
│  ┌──────────────────────────────────────────────────┐     │
│  │  Amazon Managed Prometheus                       │     │
│  │  ├── PromQL query engine                         │     │
│  │  ├── Multi-AZ storage (150 days default)         │     │
│  │  ├── Auto scaling                                │     │
│  │  └── IAM-based access control                    │     │
│  └────────────────────┬─────────────────────────────┘     │
│                       │                                   │
│                       ▼                                   │
│  ┌──────────────────────────────────────────────────┐     │
│  │  Amazon Managed Grafana                          │     │
│  │  ├── Pre-built dashboards                        │     │
│  │  ├── SSO integration (SAML/OAuth)                │     │
│  │  └── Alert Manager integration                   │     │
│  └──────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────┘
```

#### Cấu hình AMP (Terraform)

```hcl
# Amazon Managed Prometheus Workspace
resource "aws_prometheus_workspace" "main" {
  alias = "production-microservices"

  tags = {
    Environment = "production"
  }
}

# Alert Manager — Rule Group
resource "aws_prometheus_rule_group_namespace" "order_alerts" {
  name         = "order-service-alerts"
  workspace_id = aws_prometheus_workspace.main.id

  data = yamlencode({
    groups = [{
      name = "order-service"
      rules = [
        {
          alert = "HighErrorRate"
          expr  = "rate(http_requests_total{service=\"order-service\",status=~\"5..\"}[5m]) / rate(http_requests_total{service=\"order-service\"}[5m]) > 0.05"
          for   = "5m"
          labels = {
            severity = "critical"
          }
          annotations = {
            summary     = "Order service error rate > 5%"
            description = "Error rate is {{ $value | humanizePercentage }}"
          }
        },
        {
          alert = "HighLatency"
          expr  = "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{service=\"order-service\"}[5m])) > 2"
          for   = "5m"
          labels = {
            severity = "warning"
          }
          annotations = {
            summary = "Order service P99 latency > 2s"
          }
        }
      ]
    }]
  })
}
```

### 5.2. Amazon Managed Grafana (AMG)

```hcl
# Amazon Managed Grafana
resource "aws_grafana_workspace" "main" {
  name                     = "production-dashboards"
  account_access_type      = "CURRENT_ACCOUNT"
  authentication_providers = ["AWS_SSO"]
  permission_type          = "SERVICE_MANAGED"
  role_arn                 = aws_iam_role.grafana.arn

  data_sources = [
    "CLOUDWATCH",
    "PROMETHEUS",
    "XRAY"
  ]

  configuration = jsonencode({
    plugins = {
      pluginAdminEnabled = true
    }
  })
}
```

### 5.3. Khi nào CloudWatch vs Prometheus + Grafana?

| Tiêu chí | CloudWatch | AMP + AMG (Prometheus + Grafana) |
|----------|-----------|--------------------------------|
| **Setup** | Zero (built-in) | Cần provision workspace |
| **AWS metrics** | ✅ Native | ⚠️ Cần CloudWatch exporter |
| **Custom metrics** | EMF hoặc PutMetricData | Application /metrics endpoint |
| **Query language** | Metric Math (basic) | PromQL (rất mạnh) |
| **Dashboards** | CloudWatch Dashboards (basic) | Grafana (rất đẹp, flexible) |
| **Alerting** | CloudWatch Alarms | Prometheus Alert Manager |
| **Cardinality** | ⚠️ Expensive (dimension-based pricing) | ✅ Tốt hơn (metric samples) |
| **Ecosystem** | AWS only | Open-source ecosystem |
| **Cost** | $0.30/metric/month + alarm cost | $0.03/million samples ingested |
| **Best for** | AWS-native, đơn giản | EKS, Kubernetes-native, complex dashboards |

> 💡 **Khuyến nghị**:
> - **ECS + simple setup**: CloudWatch + Container Insights
> - **EKS + complex dashboards**: AMP + AMG (Prometheus + Grafana)
> - **Hybrid**: CloudWatch cho AWS metrics + Prometheus cho application metrics + Grafana cho dashboards

---

## 6. Alerting & Incident Response

### 6.1. Alerting Pipeline trên AWS

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ALERTING PIPELINE                                 │
│                                                                      │
│  ┌─── Detect ──────────────────────────────────────────────────────┐ │
│  │  CloudWatch Alarm  │  Prometheus AlertManager  │  X-Ray Insights│ │
│  └───────┬────────────┴──────────┬────────────────┴─────────┬──────┘ │
│          │                       │                          │        │
│          └───────────────────────┼──────────────────────────┘        │
│                                  ▼                                   │
│  ┌─── Route ─────────────────────────────────────────────────────┐   │
│  │                        SNS Topic                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │   │
│  │  │ Critical    │  │ Warning     │  │ Info                │    │   │
│  │  │ (P1)        │  │ (P2-P3)     │  │ (P4)                │    │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────────────┘    │   │
│  └─────────┼────────────────┼────────────────┼───────────────────┘   │
│            │                │                │                       │
│            ▼                ▼                ▼                       │
│  ┌─── Notify ────────────────────────────────────────────────────┐   │
│  │                                                               │   │
│  │  PagerDuty    Slack Channel      Email / CloudWatch           │   │
│  │  (on-call)    (#alerts-warning)  Dashboard                    │   │
│  │                                                               │   │
│  └─────────┬─────────────────────────────────────────────────────┘   │
│            │                                                         │
│            ▼                                                         │
│  ┌─── Respond (Automated) ────────────────────────────────────────┐  │
│  │  EventBridge Rule → SSM Runbook                                │  │
│  │  • Auto scale up ECS service                                   │  │
│  │  • Restart unhealthy tasks                                     │  │
│  │  • Failover database                                           │  │
│  │  • Block suspicious IPs (WAF)                                  │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

```hcl
# SNS Topics — phân loại severity
resource "aws_sns_topic" "critical" {
  name = "alerts-critical"
}

resource "aws_sns_topic" "warning" {
  name = "alerts-warning"
}

# PagerDuty cho critical alerts
resource "aws_sns_topic_subscription" "pagerduty" {
  topic_arn = aws_sns_topic.critical.arn
  protocol  = "https"
  endpoint  = "https://events.pagerduty.com/integration/xxx/enqueue"
}

# Slack cho warning alerts (qua AWS Chatbot)
resource "aws_chatbot_slack_channel_configuration" "alerts" {
  configuration_name = "alerts-warning"
  iam_role_arn       = aws_iam_role.chatbot.arn
  slack_channel_id   = "C0XXXXXXX"
  slack_team_id      = "T0XXXXXXX"
  sns_topic_arns     = [aws_sns_topic.warning.arn]

  logging_level = "ERROR"
}
```

### 6.2. Thiết kế Alert hiệu quả — Tránh Alert Fatigue

```
┌──────────────────────────────────────────────────────────────┐
│              ALERT DESIGN BEST PRACTICES                     │
│                                                              │
│  ❌ BAD Alert:                                               │
│  "CPU > 80% for 1 minute"                                    │
│  → Flapping, noisy, không actionable                         │
│                                                              │
│  ✅ GOOD Alert:                                              │
│  "Error rate > 5% for 5 minutes AND P99 latency > 2s"        │
│  → Composite, stable, actionable                             │
│                                                              │
│  Nguyên tắc:                                                 │
│  1. Alert trên SYMPTOMS, không phải CAUSES                   │
│     • ✅ "Error rate tăng" (symptom — user bị ảnh hưởng)     │
│     • ❌ "CPU cao" (cause — có thể bình thường)              │
│                                                              │
│  2. Mỗi alert phải có RUNBOOK                                │
│     • Alert fires → on-call mở runbook → follow steps        │
│     • Runbook gồm: context, diagnosis steps, remediation     │
│                                                              │
│  3. Phân loại severity rõ ràng                               │
│     • P1 Critical: User-facing impact → PagerDuty (24/7)     │
│     • P2 Warning: Degraded performance → Slack (business hrs)│
│     • P3 Info: Anomaly detected → Dashboard/Email            │
│                                                              │
│  4. Evaluation period đủ dài                                 │
│     • ❌ 1 data point (1 min) → too noisy                    │
│     • ✅ 3-5 data points (5-15 min) → stable signal          │
│                                                              │
│  5. Composite Alarms cho critical paths                      │
│     • Kết hợp nhiều signals → giảm false positives           │
└──────────────────────────────────────────────────────────────┘
```

### 6.3. Runbook Automation với Systems Manager

```hcl
# SSM Automation Runbook — Auto remediate high error rate
resource "aws_ssm_document" "restart_ecs_service" {
  name            = "RestartECSService"
  document_type   = "Automation"
  document_format = "YAML"

  content = yamlencode({
    schemaVersion = "0.3"
    description   = "Force new deployment of ECS service to restart all tasks"
    parameters = {
      ClusterName = { type = "String" }
      ServiceName = { type = "String" }
    }
    mainSteps = [
      {
        name   = "ForceNewDeployment"
        action = "aws:executeAwsApi"
        inputs = {
          Service = "ecs"
          Api     = "UpdateService"
          cluster = "{{ ClusterName }}"
          service = "{{ ServiceName }}"
          forceNewDeployment = true
        }
      },
      {
        name   = "WaitForStability"
        action = "aws:waitForAwsResourceProperty"
        inputs = {
          Service      = "ecs"
          Api          = "DescribeServices"
          cluster      = "{{ ClusterName }}"
          services     = ["{{ ServiceName }}"]
          PropertySelector = "$.services[0].deployments[0].rolloutState"
          DesiredValues    = ["COMPLETED"]
        }
        timeoutSeconds = 600
      }
    ]
  })
}

# EventBridge Rule — trigger runbook từ alarm
resource "aws_cloudwatch_event_rule" "auto_remediate" {
  name = "auto-remediate-order-service"

  event_pattern = jsonencode({
    source      = ["aws.cloudwatch"]
    detail-type = ["CloudWatch Alarm State Change"]
    detail = {
      alarmName = ["order-service-high-error-rate"]
      state     = { value = ["ALARM"] }
    }
  })
}

resource "aws_cloudwatch_event_target" "ssm_automation" {
  rule     = aws_cloudwatch_event_rule.auto_remediate.name
  arn      = "arn:aws:ssm:ap-southeast-1:123456789:automation-definition/${aws_ssm_document.restart_ecs_service.name}"
  role_arn = aws_iam_role.eventbridge_ssm.arn

  input = jsonencode({
    ClusterName = ["production"]
    ServiceName = ["order-service"]
  })
}
```

---

## 7. Cost Monitoring & Optimization

### 7.1. Observability Cost trên AWS

| Service | Pricing Model | Ước tính (10 microservices, production) |
|---------|--------------|---------------------------------------|
| **CloudWatch Logs** | $0.50/GB ingested + $0.03/GB stored | ~$100-300/month |
| **CloudWatch Logs Insights** | $0.005/GB scanned | ~$10-30/month |
| **CloudWatch Metrics** | $0.30/metric/month (custom) | ~$50-100/month |
| **CloudWatch Alarms** | $0.10/alarm/month (standard) | ~$10-20/month |
| **Container Insights** | Standard CloudWatch pricing (metrics + logs) | ~$50-150/month |
| **X-Ray** | $5.00/million traces recorded | ~$20-100/month |
| **Managed Prometheus** | $0.03/million samples ingested | ~$30-100/month |
| **Managed Grafana** | $9/editor/month + $5/viewer/month | ~$50-100/month |
| **OpenSearch** | Instance hours + storage | ~$300-1000/month |

> 💡 **Tổng chi phí Observability điển hình**: **$300-800/month** cho 10 microservices (CloudWatch-based). Thêm OpenSearch → **$600-1800/month**.

### 7.2. Chiến lược giảm chi phí Observability

```
┌──────────────────────────────────────────────────────────────┐
│           COST OPTIMIZATION STRATEGIES                       │
│                                                              │
│  1. Log Retention                                            │
│  ├── Production: 30 ngày CloudWatch → S3 archive             │
│  ├── Staging: 7 ngày                                         │
│  ├── Development: 3 ngày                                     │
│  └── Tiết kiệm: ~40-60% log costs                            │
│                                                              │
│  2. Log Filtering (trước khi ingest)                         │
│  ├── Loại bỏ DEBUG logs ở production                         │
│  ├── Filter health check logs                                │
│  ├── Chỉ giữ ERROR + WARN + INFO                             │
│  └── Tiết kiệm: ~30-50% ingestion costs                      │
│                                                              │
│  3. X-Ray Sampling                                           │
│  ├── Default: 5-10% sampling rate                            │
│  ├── Health checks: 0% (loại bỏ hoàn toàn)                   │
│  ├── Errors: 100% (luôn capture)                             │
│  └── Tiết kiệm: ~80-90% X-Ray costs                          │
│                                                              │
│  4. Metric Resolution                                        │
│  ├── Standard resolution: 1 phút (default, rẻ)               │
│  ├── High resolution: 1 giây (chỉ khi cần)                   │
│  └── Giảm custom metrics: dùng dimensions thay vì metrics    │
│                                                              │
│  5. S3 Tiered Storage cho Logs                               │
│  ├── CloudWatch → S3 Standard (0-30 ngày)                    │
│  ├── S3 Standard-IA (30-90 ngày)                             │
│  ├── S3 Glacier (90 ngày - 1 năm)                            │
│  ├── S3 Glacier Deep Archive (> 1 năm, compliance)           │
│  └── Tiết kiệm: ~80-95% storage costs                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Ví dụ thực tế — E-Commerce Observability Stack

```
┌──────────────────────────────────────────────────────────────────────────┐
│            E-COMMERCE OBSERVABILITY STACK trên AWS                       │
│                                                                          │
│  ┌─── Traces ───────────────────────────────────────────────────────┐    │
│  │  OpenTelemetry SDK (application)                                 │    │
│  │       │                                                          │    │
│  │  ADOT Collector (sidecar / DaemonSet)                            │    │
│  │       │                                                          │    │
│  │  AWS X-Ray                                                       │    │
│  │  ├── Service Map: toàn bộ dependencies                           │    │
│  │  ├── Sampling: 10% default, 100% errors, 0% health checks        │    │
│  │  └── Insights: auto-detect anomalies                             │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─── Logs ─────────────────────────────────────────────────────────┐    │
│  │  ECS: awslogs driver → CloudWatch Logs                           │    │
│  │  ├── Structured JSON logs (traceId, correlationId)               │    │
│  │  ├── Logs Insights: query & debug                                │    │
│  │  ├── Retention: 30 ngày CW, archive → S3 → Glacier               │    │
│  │  └── Metric Filter: extract error counts → CloudWatch Metric     │    │
│  │                                                                  │    │
│  │  Critical services: Subscription Filter → OpenSearch (Kibana)    │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─── Metrics ──────────────────────────────────────────────────────┐    │
│  │  Built-in: CloudWatch Metrics (ECS, ALB, RDS, SQS, DynamoDB)     │    │
│  │  Container: Container Insights (ECS cluster/service/task)        │    │
│  │  Custom: EMF (OrderCount, OrderValue, ProcessingTime)            │    │
│  │                                                                  │    │
│  │  Dashboards:                                                     │    │
│  │  ├── System Dashboard: CPU, Memory, Task Count per service       │    │
│  │  ├── Business Dashboard: Orders/min, Revenue, Conversion Rate    │    │
│  │  └── SLA Dashboard: Error Rate, P50/P90/P99 Latency              │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─── Alerting ─────────────────────────────────────────────────────┐    │
│  │  P1 Critical (PagerDuty):                                        │    │
│  │  ├── Error rate > 5% for 5 min + P99 > 2s (Composite Alarm)      │    │
│  │  ├── Payment service down (health check failed 3x)               │    │
│  │  └── SQS DLQ messages > 0 (unprocessed failures)                 │    │
│  │                                                                  │    │
│  │  P2 Warning (Slack #alerts):                                     │    │
│  │  ├── Error rate > 1% for 10 min                                  │    │
│  │  ├── P99 latency > 1s for 10 min                                 │    │
│  │  ├── Queue depth > 500 messages                                  │    │
│  │  └── CPU > 80% for 15 min (scaling issue?)                       │    │
│  │                                                                  │    │
│  │  P3 Info (Dashboard only):                                       │    │
│  │  ├── New deployment detected                                     │    │
│  │  ├── Auto scaling event                                          │    │
│  │  └── Cost anomaly detected                                       │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─── Auto Remediation ─────────────────────────────────────────────┐    │
│  │  Error rate alarm → SSM Runbook → Force new ECS deployment       │    │
│  │  Queue depth alarm → Auto Scaling policy → Scale up consumers    │    │
│  │  WAF rate alarm → Lambda → Block IP in WAF                       │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Estimated Cost: ~$400-600/month (10 services, CloudWatch-based)         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Anti-patterns

| Anti-pattern | Vấn đề | Cách khắc phục |
|-------------|--------|---------------|
| **Log everything at DEBUG** | CloudWatch ingestion cost phình to, noise cao | Production: INFO + ERROR only, DEBUG chỉ khi cần investigate |
| **No structured logging** | Logs Insights query không hiệu quả, không filter được | JSON structured logs với traceId, service, level, duration |
| **Alert on causes, not symptoms** | "CPU > 80%" → noisy, không actionable | Alert trên error rate, latency (symptoms mà user cảm nhận) |
| **No sampling (trace 100%)** | X-Ray cost rất cao ở high-traffic services | Sampling rules: 5-10% default, 100% errors, 0% health checks |
| **No log retention policy** | CloudWatch Logs giữ forever → storage cost tích lũy | Set retention: 30 ngày CW → S3 archive → Glacier |
| **Dashboard sprawl** | 50 dashboards → không ai xem | 3-4 dashboards cốt lõi: System, Business, SLA, On-call |
| **No correlation ID** | Không trace được request xuyên services | Propagate traceId và correlationId qua tất cả services |
| **Metrics cardinality explosion** | userId làm dimension → millions metrics → $$$$ | Dùng userId trong log properties, không phải metric dimensions |
| **Alert fatigue** | 100 alerts/ngày → on-call ignore tất cả | Composite alarms, đủ evaluation period, mỗi alert có runbook |

---

## 10. Checklist triển khai

### Distributed Tracing

- [ ] X-Ray hoặc OTel + ADOT enabled cho tất cả services
- [ ] Trace context propagation (X-Amzn-Trace-Id header)
- [ ] Sampling rules configured (default + error + health check)
- [ ] Service Map accessible cho team
- [ ] API Gateway tracing enabled

### Logging

- [ ] Structured JSON logging (traceId, correlationId, service, level)
- [ ] CloudWatch Log Groups với retention policy
- [ ] Log levels phù hợp environment (DEBUG dev, INFO production)
- [ ] Health check logs filtered (giảm noise và cost)
- [ ] Logs Insights queries đã chuẩn bị cho common investigations

### Metrics

- [ ] Container Insights enabled
- [ ] Custom business metrics via EMF
- [ ] Four Golden Signals monitored: Latency, Traffic, Errors, Saturation
- [ ] Dashboards: System, Business, SLA

### Alerting

- [ ] P1/P2/P3 severity classification
- [ ] Composite alarms cho critical paths
- [ ] Alert → SNS → PagerDuty (P1) / Slack (P2) / Dashboard (P3)
- [ ] Mỗi alert có runbook
- [ ] Auto remediation cho known issues (SSM Runbooks)

### Cost Control

- [ ] Log retention policy applied (30 ngày CW → S3 archive)
- [ ] X-Ray sampling rules configured
- [ ] Không dùng high-resolution metrics nếu không cần
- [ ] Review observability cost hàng tháng

---

## 11. Tổng kết

```
┌───────────────────────────────────────────────────────────────────┐
│             OBSERVABILITY DECISION GUIDE trên AWS                 │
│                                                                   │
│  Traces:                                                          │
│  • OpenTelemetry SDK + ADOT Collector → X-Ray (khuyến nghị)       │
│  • Sampling: 5-10% default, 100% errors, 0% health checks         │
│  • Service Map cho system-wide visibility                         │
│                                                                   │
│  Logs:                                                            │
│  • CloudWatch Logs (default) + Logs Insights (query)              │
│  • Structured JSON với traceId, correlationId                     │
│  • Thêm OpenSearch khi cần Kibana / full-text search              │
│  • Retention: 30 ngày CW → S3 → Glacier                           │
│                                                                   │
│  Metrics:                                                         │
│  • CloudWatch built-in + Container Insights (baseline)            │
│  • EMF cho custom business metrics (zero-overhead)                │
│  • AMP + AMG cho EKS / complex dashboards                         │
│                                                                   │
│  Alerting:                                                        │
│  • Alert trên symptoms (error rate, latency) không causes (CPU)   │
│  • Composite Alarms → giảm false positives                        │
│  • P1→PagerDuty, P2→Slack, P3→Dashboard                           │
│  • SSM Runbooks cho auto remediation                              │
│                                                                   │
│  Cost:                                                            │
│  • Budget ~$400-600/month cho 10 microservices (CW-based)         │
│  • Sampling, log retention, metric resolution = top 3 levers      │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Key takeaways:**

1. **OpenTelemetry + X-Ray là combo tracing tốt nhất** — vendor-neutral SDK, managed backend
2. **CloudWatch Logs Insights đủ mạnh** cho hầu hết use cases — chỉ cần OpenSearch khi thực sự cần
3. **EMF = custom metrics miễn phí** — ghi metrics qua log, không cần API call riêng
4. **Alert trên symptoms, không causes** — error rate & latency thay vì CPU & memory
5. **Composite Alarms giảm noise** — kết hợp nhiều signals cho accurate alerts
6. **Cost control từ đầu** — sampling, retention, log levels là 3 levers chính

---

## 12. Liên kết liên quan

- [11 — Observability & Evolvability](11-observability-evolvability.md) — Lý thuyết Logs, Metrics, Traces, ELK, Prometheus, Jaeger
- [18 — Triển khai & Kiến trúc tổng quan](18-aws-deployment-architecture.md) — ECS vs EKS vs Lambda
- [19 — Communication & Service Discovery trên AWS](19-aws-communication-discovery.md) — Service Connect, VPC Lattice, tracing qua service layer
- [20 — Data Management trên AWS](20-aws-data-management.md) — Monitoring data layer
- [21 — Resilience & Auto Scaling trên AWS](21-aws-resilience.md) — Health Check, Auto Scaling (cần metrics)
- [23 — Security trên AWS](23-aws-security.md) — Audit logging, security monitoring
- [25 — Case Study: E-Commerce](25-case-study-ecommerce.md) — Áp dụng tổng hợp
