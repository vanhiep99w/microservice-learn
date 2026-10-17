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

```d2 title="1. Giới thiệu"
direction: right
traces: Distributed Tracing {
 xray: AWS X-Ray — Managed Tracing
 otel: OpenTelemetry SDK — Vendor-neutral Instrumentation
 xray_sdk: X-Ray SDK — AWS-specific Instrumentation
 adot: ADOT Collector — OTel Distribution
}
logs: Centralized Logging {
 cw: CloudWatch Logs
 query: CloudWatch Logs Insights
 search: OpenSearch — Search / Dashboards
 archive: S3 + Athena — Archive / Ad-hoc Query
}
metrics: Metrics / Alerting {
 cw: CloudWatch Metrics
 containers: Container Insights — ECS / EKS
 emf: CloudWatch EMF — Business Metrics
 prometheus: Amazon Managed Prometheus
 grafana: Amazon Managed Grafana
 alarms: CloudWatch Alarms — Alert / Auto Actions
}
incidents: Incident Response {
 sns: SNS — Notifications
 events: EventBridge — Event Routing
 runbooks: Systems Manager Runbooks — Remediation
 chat: AWS Chatbot — Slack / Teams integration trong ví dụ
}
```

---

## 2. Distributed Tracing với AWS X-Ray

### 2.1. X-Ray hoạt động như thế nào?

**AWS X-Ray** là managed distributed tracing service — thu thập data từ các service, tạo **Service Map** trực quan và cho phép phân tích latency, error rates theo từng request path.

```d2 title="AWS X-Ray — SDK và Collector"
direction: down
a: Service A {
 app: Application Code
 sdk: X-Ray SDK / OTel SDK
 daemon: X-Ray Daemon — Sidecar
 app -> sdk -> daemon
}
b: Service B {
 app: Application Code
 sdk: X-Ray SDK / OTel SDK
 collector: ADOT Collector — Sidecar
 app -> sdk -> collector
}
xray: "X-Ray Service\nTraces • Service Map • Analytics"
a.daemon -> xray
b.collector -> xray
```

Ví dụ header context X-Ray: `X-Amzn-Trace-Id: Root=1-xxx;Parent=yyy;Sampled=1`. Chọn exporter/protocol tương thích: X-Ray SDK thường gửi tới Daemon; OTel SDK thường dùng OTLP tới ADOT Collector.

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

```hcl source="snippets/x-ray-cho-ecs-sidecar-pattern.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2Fx-ray-cho-ecs-sidecar-pattern.tf)

#### X-Ray cho EKS (ADOT Collector DaemonSet)

```yaml source="snippets/x-ray-cho-eks-adot-collector-daemonset.yaml"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2Fx-ray-cho-eks-adot-collector-daemonset.yaml)

#### X-Ray cho Lambda (Built-in)

```hcl source="snippets/x-ray-cho-lambda-built-in.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2Fx-ray-cho-lambda-built-in.tf)

| Platform | Cách tích hợp X-Ray | Effort | Tự động trace |
|----------|---------------------|--------|:-------------:|
| **Lambda** | `tracing_config.mode = "Active"` | Rất thấp | ✅ AWS SDK, HTTP calls |
| **ECS** | X-Ray Daemon sidecar + SDK | Trung bình | ⚠️ Cần instrument code |
| **EKS** | ADOT Collector DaemonSet + OTel SDK | Trung bình | ⚠️ Cần instrument code |
| **API Gateway** | Enable tracing trong stage settings | Rất thấp | ✅ Tự động |
| **App Mesh (legacy)** | Envoy tự gửi traces | Thấp | ⚠️ Legacy, EoS 30/09/2026 |

### 2.3. X-Ray Service Map

X-Ray Service Map hiển thị **biểu đồ trực quan** toàn bộ hệ thống — mỗi node là 1 service, edges là connections, màu sắc thể hiện health.

```d2 title="2.3. X-Ray Service Map"
direction: right
gw: "API Gateway — OK"
inventory: "Inventory — OK"
order: "Order — OK"
payment: "Payment — SLOW"
aurora: "Aurora DB — OK"
stripe: "Stripe API — SLOW"
gw -> inventory
gw -> order
order -> payment: "450ms minh họa"
order -> aurora
payment -> stripe: "380ms — bottleneck minh họa"
```

Legend ví dụ: xanh errors<1% và latency<200ms; vàng errors1–5% hoặc latency>500ms; đỏ errors>5%. Ngưỡng phân loại cần nhất quán với metrics hiển thị, không phải X-Ray tự mặc định mọi ngưỡng này.

### 2.4. Sampling Rules — Kiểm soát chi phí

X-Ray charge theo số traces recorded. **Sampling** giảm chi phí bằng cách chỉ record một phần requests.

```hcl source="snippets/2-4-sampling-rules-kiem-soat-chi-phi.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2F2-4-sampling-rules-kiem-soat-chi-phi.tf)

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

```d2 title="2.5. X-Ray vs OpenTelemetry trên AWS"
direction: down
native: X-Ray SDK Path {
 app: App + X-Ray SDK
 daemon: X-Ray Daemon
 xray: X-Ray Service
 app -> daemon -> xray
}
otel: OpenTelemetry / ADOT Path {
 app: App + OTel SDK
 collector: ADOT Collector
 xray: X-Ray — traces
 metrics: Prometheus / CloudWatch — metrics theo exporter
 jaeger: Jaeger — alternative trace backend
 app -> collector
 collector -> xray
 collector -> metrics
 collector -> jaeger
}
```

OTel giảm vendor coupling, có nhiều instrumentation/exporters nhưng cần cấu hình đúng protocols/pipelines. Traces không được export như metrics tới Prometheus; mỗi signal dùng exporter tương ứng. Đối chiếu lifecycle của X-Ray SDK/Daemon khi chọn cho dự án mới.

---

## 3. Centralized Logging với CloudWatch Logs

### 3.1. Kiến trúc Logging trên AWS

```d2 title="AWS — Centralized Logging Architecture"
direction: down
ecs: ECS Tasks
eks: EKS Pods
lambda: Lambda
api: API Gateway
alb: ALB
rds: RDS / Aurora
vpc: VPC Flow Logs
logs: CloudWatch Logs — Log Groups
insights: Logs Insights — Query
filter: Subscription Filter
targets: Lambda / OpenSearch / Kinesis
s3: S3 Archive {shape: cylinder}
athena: Athena — Ad-hoc query
ecs -> logs: awslogs driver
eks -> logs: Fluent Bit DaemonSet
lambda -> logs: Built-in
api -> logs: Access logs
alb -> s3: Access logs — native destination
rds -> logs: Audit / Slow query theo cấu hình
vpc -> logs
logs -> insights
logs -> filter -> targets
logs -> s3: Export
s3 -> athena
```

ALB access logs mặc định được publish vào S3, không trực tiếp vào CloudWatch Logs; cần pipeline bổ sung nếu muốn hợp nhất tại CloudWatch.

### 3.2. CloudWatch Logs — Cấu hình cho ECS / EKS / Lambda

#### ECS — awslogs driver (mặc định)

```hcl source="snippets/ecs-awslogs-driver-mac-dinh.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2Fecs-awslogs-driver-mac-dinh.tf)

#### EKS — Fluent Bit DaemonSet

```yaml source="snippets/eks-fluent-bit-daemonset.yaml"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2Feks-fluent-bit-daemonset.yaml)

#### Lambda — Built-in Logging

```hcl source="snippets/lambda-built-in-logging.tf"
# Lambda tự động ghi log vào CloudWatch
# Log Group: /aws/lambda/<function-name>
# Chỉ cần cấu hình retention

resource "aws_cloudwatch_log_group" "payment_lambda" {
  name              = "/aws/lambda/payment-processor"
  retention_in_days = 14       # Lambda logs thường ngắn hạn hơn
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2Flambda-built-in-logging.tf)

### 3.3. Structured Logging & Log Insights

#### Structured Logging Format (JSON)

```json source="snippets/structured-logging-format-json.json"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2Fstructured-logging-format-json.json)

#### CloudWatch Logs Insights — Query Examples

```sql source="snippets/cloudwatch-logs-insights-query-examples.sql"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2Fcloudwatch-logs-insights-query-examples.sql)

### 3.4. Cross-Account & Cross-Region Logging

Với hệ thống multi-account (theo AWS best practice), logs cần tập trung về **central logging account**.

```d2 title="Cross-account Logging"
direction: down
prod: "Production — CloudWatch Logs\n/ecs/order-service\n/ecs/payment-service"
staging: "Staging — CloudWatch Logs\n/ecs/order-service\n/ecs/payment-service"
central: Central Logging Account {
 firehose: Kinesis Data Firehose
 search: OpenSearch — Dashboards
 s3: S3 Archive {shape: cylinder}
 athena: Athena — ad-hoc
 firehose -> search
 firehose -> s3: Archive / backup theo cấu hình
 s3 -> athena
}
prod -> central.firehose: Subscription Filter
staging -> central.firehose: Subscription Filter
```

```hcl source="snippets/3-4-cross-account-cross-region-logging.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2F3-4-cross-account-cross-region-logging.tf)

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

```hcl source="snippets/4-2-cloudwatch-container-insights.tf"
# Bật Container Insights cho ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "production"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2F4-2-cloudwatch-container-insights.tf)

```yaml source="snippets/4-2-cloudwatch-container-insights-2.yaml"
# Bật Container Insights cho EKS — ADOT addon
apiVersion: eks.amazonaws.com/v1alpha1
kind: Addon
metadata:
  name: amazon-cloudwatch-observability
spec:
  addonName: amazon-cloudwatch-observability
  clusterName: production
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2F4-2-cloudwatch-container-insights-2.yaml)

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

```json source="snippets/4-3-custom-metrics-embedded-metric-format-emf.json"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2F4-3-custom-metrics-embedded-metric-format-emf.json)

```typescript source="snippets/4-3-custom-metrics-embedded-metric-format-emf-2.ts"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2F4-3-custom-metrics-embedded-metric-format-emf-2.ts)

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

```hcl source="snippets/4-4-cloudwatch-alarms-composite-alarms.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2F4-4-cloudwatch-alarms-composite-alarms.tf)

### 4.5. CloudWatch Dashboards

```hcl source="snippets/4-5-cloudwatch-dashboards.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2F4-5-cloudwatch-dashboards.tf)

---

## 5. Managed Prometheus & Grafana trên AWS

### 5.1. Amazon Managed Prometheus (AMP)

**AMP** là fully managed Prometheus-compatible service — không cần quản lý Prometheus server, tự động scale, multi-AZ.

```d2 title="5.1. Amazon Managed Prometheus (AMP)"
direction: right
pods: "EKS Application Pods\nExpose /metrics"
agent: "ADOT Collector / Prometheus Agent\nScrape + remote_write"
amp: "Amazon Managed Prometheus\nPromQL • Multi-AZ storage\nIAM access • Managed capacity"
grafana: "Amazon Managed Grafana\nDashboards • SSO • Alerts"
pods -> agent: "Scrape metrics"
agent -> amp: "remote_write"
amp -> grafana: "Queries / Data source"
```

Retention ví dụ150ngày cần kiểm tra workspace settings hiện hành. IAM/SigV4, SSO/auth và Alertmanager integrations phải được cấu hình; diagram không đại diện cho mọi default.

#### Cấu hình AMP (Terraform)

```hcl source="snippets/cau-hinh-amp-terraform.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2Fcau-hinh-amp-terraform.tf)

### 5.2. Amazon Managed Grafana (AMG)

```hcl source="snippets/5-2-amazon-managed-grafana-amg.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2F5-2-amazon-managed-grafana-amg.tf)

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

```d2 title="6.1. Alerting Pipeline trên AWS"
direction: down
cw: "CloudWatch Alarms"
prom: "Prometheus Alertmanager"
xray: "X-Ray Insights / Anomaly signal"
route: "Configured routing / SNS Topics"
p1: "Critical P1 → PagerDuty on-call"
p2: "Warning P2–P3 → Slack alerts-warning"
p4: "Info P4 → Email / Dashboard"
response: "EventBridge / SSM Runbook\nScale ECS • Restart unhealthy tasks\nDB failover • WAF IP rule"
cw -> route
prom -> route: "Webhook/Integration"
xray -> route: "Event integration"
route -> p1
route -> p2
route -> p4
p1 -> response: "Approved automation policy"
```

SNS không mặc định tự phân loại severity hay thực thi remediation; cần message attributes/subscriptions/rules. Automations phải có permission, guardrails, stop conditions và audit.

```hcl source="snippets/6-1-alerting-pipeline-tren-aws.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2F6-1-alerting-pipeline-tren-aws.tf)

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

```hcl source="snippets/6-3-runbook-automation-voi-systems-manager.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=22-aws-observability&snapshot=article&file=snippets%2F6-3-runbook-automation-voi-systems-manager.tf)

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

```d2 title="8. Ví dụ thực tế — E-Commerce Observability Stack"
direction: right
traces: Traces {
 sdk: OpenTelemetry SDK
 collector: ADOT Sidecar / DaemonSet
 xray: X-Ray — Service Map / Insights
 sdk -> collector -> xray
}
logs: Logs {
 ecs: ECS awslogs — JSON traceId / correlationId
 cw: CloudWatch Logs — Insights / Metric Filters
 archive: S3 → Glacier archive
 search: OpenSearch Dashboards — Critical logs
 ecs -> cw
 cw -> archive: Export pipeline
 cw -> search: Subscription + supported relay
}
metrics: Metrics {
 sources: ECS / ALB / RDS / SQS / DynamoDB / Container Insights / Custom EMF
 dashboards: System / Business / SLO Dashboards
 sources -> dashboards
}
alert: Alerting / Remediation {
 alarms: Composite / Threshold Alarms
 pager: P1 PagerDuty
 slack: P2 Slack
 dashboard: P3 Dashboard
 automation: SSM / Scaling policy / Lambda WAF actions
 alarms -> pager
 alarms -> slack
 alarms -> dashboard
 alarms -> automation
}
metrics.sources -> alert.alarms
logs.cw -> alert.alarms: Extracted error metrics
```

Retention minh họa30ngày CloudWatch rồi archive. Custom EMF: OrderCount, OrderValue, ProcessingTime. Dashboards: CPU/memory/task count; orders/min/revenue/conversion; error rate/P50/P90/P99.

- **P1:** error rate>5% trong5phút VÀ P99>2s; Payment health check fail3lần; DLQ messages>0.
- **P2:** errors>1%10phút; P99>1s10phút; queue depth>500; CPU>80%15phút.
- **P3:** deployment, scaling và cost anomaly events theo notification policy.
- **Remediation:** error alarm→SSM force ECS deployment; queue alarm→consumer scaling; WAF alarm→Lambda block policy.

Sampling ví dụ10% default/100%errors/0%health cần tail-based pipeline phù hợp nếu quyết định sau khi biết lỗi; head sampling10% không tự đảm bảo giữ mọi error trace. Ước tính cũ400–600USD/tháng cho10services chỉ là illustrative workload, không phải báo giá hiện hành.

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
