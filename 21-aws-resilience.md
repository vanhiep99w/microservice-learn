# Resilience & Auto Scaling trên AWS

## 📋 Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
- [2. Auto Scaling trên AWS](#2-auto-scaling-trên-aws)
  - [2.1. ECS Auto Scaling](#21-ecs-auto-scaling)
  - [2.2. EKS Auto Scaling (Karpenter & HPA/VPA)](#22-eks-auto-scaling-karpenter--hpavpa)
  - [2.3. Lambda Concurrency & Scaling](#23-lambda-concurrency--scaling)
  - [2.4. So sánh Auto Scaling: ECS vs EKS vs Lambda](#24-so-sánh-auto-scaling-ecs-vs-eks-vs-lambda)
- [3. Multi-AZ & Multi-Region](#3-multi-az--multi-region)
  - [3.1. Multi-AZ — High Availability trong Region](#31-multi-az--high-availability-trong-region)
  - [3.2. Multi-Region — Disaster Recovery & Global Users](#32-multi-region--disaster-recovery--global-users)
  - [3.3. DR Strategies trên AWS](#33-dr-strategies-trên-aws)
- [4. Circuit Breaker & Resilience Patterns trên AWS](#4-circuit-breaker--resilience-patterns-trên-aws)
  - [4.1. Circuit Breaker ở service layer (ưu tiên non-App-Mesh)](#41-circuit-breaker-ở-service-layer-ưu-tiên-non-app-mesh)
  - [4.2. Retry & Timeout trên AWS](#42-retry--timeout-trên-aws)
  - [4.3. Bulkhead trên AWS](#43-bulkhead-trên-aws)
  - [4.4. Rate Limiting trên AWS](#44-rate-limiting-trên-aws)
  - [4.5. Fallback Patterns trên AWS](#45-fallback-patterns-trên-aws)
- [5. Health Check & Self-Healing](#5-health-check--self-healing)
  - [5.1. Health Check trên ECS](#51-health-check-trên-ecs)
  - [5.2. Health Check trên EKS](#52-health-check-trên-eks)
  - [5.3. ALB/NLB Health Check](#53-albnlb-health-check)
  - [5.4. Route 53 Health Check](#54-route-53-health-check)
- [6. Chaos Engineering trên AWS](#6-chaos-engineering-trên-aws)
  - [6.1. AWS Fault Injection Service (FIS)](#61-aws-fault-injection-service-fis)
  - [6.2. Các thí nghiệm Chaos phổ biến](#62-các-thí-nghiệm-chaos-phổ-biến)
  - [6.3. Game Day — Quy trình thực hành](#63-game-day--quy-trình-thực-hành)
- [7. Disaster Recovery trên AWS](#7-disaster-recovery-trên-aws)
  - [7.1. Bốn chiến lược DR](#71-bốn-chiến-lược-dr)
  - [7.2. DR cho Microservice — Thiết kế chi tiết](#72-dr-cho-microservice--thiết-kế-chi-tiết)
  - [7.3. Failover tự động với Route 53](#73-failover-tự-động-với-route-53)
- [8. Ví dụ thực tế — E-Commerce Resilience Architecture](#8-ví-dụ-thực-tế--e-commerce-resilience-architecture)
- [9. Anti-patterns](#9-anti-patterns)
- [10. Checklist triển khai](#10-checklist-triển-khai)
- [11. Tổng kết](#11-tổng-kết)
- [12. Liên kết liên quan](#12-liên-kết-liên-quan)

---

## 1. Giới thiệu

Trong [doc 10 — Resilience Patterns](10-resilience-patterns.md), chúng ta đã hiểu lý thuyết về Circuit Breaker, Retry, Bulkhead, Rate Limiter, Fallback, Health Check, Chaos Engineering. Doc này **áp dụng tất cả kiến thức đó vào thực tế trên AWS** — mapping từng pattern lý thuyết sang AWS service cụ thể, kết hợp thêm **Auto Scaling** và **Disaster Recovery** — hai yếu tố cốt lõi cho hệ thống production trên cloud.

Doc này trả lời câu hỏi: **Auto Scaling ECS/EKS/Lambda khác nhau thế nào? Multi-AZ/Multi-Region triển khai ra sao? Circuit Breaker cấu hình ở service layer như thế nào? Chaos Engineering thực hành trên AWS bằng cách nào? DR strategy nào phù hợp?**

> 💡 Giả định: Bạn đã đọc [doc 10](10-resilience-patterns.md) và hiểu lý thuyết. Doc này tập trung vào **cách AWS hiện thực hóa** các khái niệm đó.

```
┌────────────────────────────────────────────────────────────────────┐
│          RESILIENCE & AUTO SCALING LANDSCAPE trên AWS              │
│                                                                    │
│  ┌─────── Auto Scaling ────────────────────────────────────────┐   │
│  │  ECS Service Auto Scaling    ← Target Tracking, Step        │   │
│  │  EKS HPA / VPA / Karpenter   ← Pod & Node scaling           │   │
│  │  Lambda Concurrency          ← tự động, reserved/provisioned│   │
│  │  Aurora Auto Scaling         ← Read Replicas                │   │
│  │  DynamoDB Auto Scaling       ← RCU/WCU                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌─────── Resilience Patterns ────────────────────────────────┐    │
│  │  Service Connect / VPC Lattice / Istio                     │    │
│  │                               ← Timeout, Retry, policy      │    │
│  │  API Gateway                 ← Rate Limiting, Throttling   │    │
│  │  ALB/NLB                     ← Health Check, Failover      │    │
│  │  Route 53                    ← DNS Failover, Health Check  │    │
│  │  SQS Dead Letter Queue       ← Async error handling        │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌─────── Disaster Recovery ──────────────────────────────────┐    │
│  │  Multi-AZ                    ← High Availability (99.99%)  │    │
│  │  Multi-Region                ← DR, global users            │    │
│  │  Route 53 Failover           ← automatic DNS failover      │    │
│  │  S3 Cross-Region Replication ← data backup                 │    │
│  │  Aurora Global Database      ← cross-region replication    │    │
│  │  DynamoDB Global Tables      ← multi-region active-active  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌─────── Chaos Engineering ──────────────────────────────────┐    │
│  │  AWS FIS                     ← managed chaos experiments   │    │
│  │  Game Day                    ← planned failure drills      │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Auto Scaling trên AWS

Auto Scaling là khả năng **tự động tăng/giảm tài nguyên** dựa trên workload thực tế. Trên AWS, mỗi compute platform (ECS, EKS, Lambda) có cơ chế scaling riêng.

### 2.1. ECS Auto Scaling

ECS sử dụng **Application Auto Scaling** để scale số lượng task (container) trong service.

#### Các loại Scaling Policy

```
┌────────────────────────────────────────────────────────────┐
│                 ECS AUTO SCALING POLICIES                  │
│                                                            │
│  1. Target Tracking Scaling                                │
│     ├── Giữ metric ở mức target (ví dụ: CPU = 70%)         │
│     ├── AWS tự điều chỉnh desired count                    │
│     └── Đơn giản nhất, phù hợp hầu hết use cases           │
│                                                            │
│  2. Step Scaling                                           │
│     ├── Tăng/giảm theo từng bậc (steps)                    │
│     ├── Ví dụ: CPU 70-80% → +2, CPU 80-90% → +4            │
│     └── Linh hoạt hơn Target Tracking                      │
│                                                            │
│  3. Scheduled Scaling                                      │
│     ├── Scale theo lịch cố định                            │
│     ├── Ví dụ: 8h sáng → min=10, 22h → min=2               │
│     └── Phù hợp workload có pattern rõ ràng                │
│                                                            │
│  4. Predictive Scaling (ECS trên EC2)                      │
│     ├── ML dự đoán traffic pattern                         │
│     ├── Pre-scale trước khi traffic tăng                   │
│     └── Kết hợp với Target Tracking                        │
└────────────────────────────────────────────────────────────┘
```

#### Cấu hình ECS Auto Scaling (Terraform)

```hcl source="snippets/cau-hinh-ecs-auto-scaling-terraform.tf"
# ECS Service
resource "aws_ecs_service" "order_service" {
  name            = "order-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.order.arn
  desired_count   = 3

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 70
    base              = 2          # Minimum 2 tasks luôn chạy trên Fargate
  }
  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 30         # 30% tasks dùng Spot (tiết kiệm ~70% chi phí)
  }
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "order_service" {
  max_capacity       = 20
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.order_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Target Tracking — CPU
resource "aws_appautoscaling_policy" "cpu" {
  name               = "order-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.order_service.resource_id
  scalable_dimension = aws_appautoscaling_target.order_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.order_service.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300   # Chờ 5 phút trước khi scale in
    scale_out_cooldown = 60    # Scale out nhanh hơn (1 phút)
  }
}

# Target Tracking — Custom Metric (SQS Queue Depth)
resource "aws_appautoscaling_policy" "sqs_backlog" {
  name               = "order-sqs-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.order_service.resource_id
  scalable_dimension = aws_appautoscaling_target.order_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.order_service.service_namespace

  target_tracking_scaling_policy_configuration {
    customized_metric_specification {
      metric_name = "BacklogPerTask"
      namespace   = "Custom/ECS"
      statistic   = "Average"
    }
    target_value = 100.0    # Mỗi task xử lý tối đa 100 messages trong queue
  }
}

# Scheduled Scaling — Peak hours
resource "aws_appautoscaling_scheduled_action" "peak_hours" {
  name               = "order-peak-hours"
  resource_id        = aws_appautoscaling_target.order_service.resource_id
  scalable_dimension = aws_appautoscaling_target.order_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.order_service.service_namespace

  schedule = "cron(0 8 * * ? *)"    # 8h sáng mỗi ngày

  scalable_target_action {
    min_capacity = 5
    max_capacity = 30
  }
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=21-aws-resilience&snapshot=article&file=snippets%2Fcau-hinh-ecs-auto-scaling-terraform.tf)

#### Metric nào để scale ECS?

| Metric | Khi nào dùng | Target Value khuyến nghị |
|--------|-------------|------------------------|
| **CPU Utilization** | CPU-bound workloads (tính toán, image processing) | 60-80% |
| **Memory Utilization** | Memory-bound workloads (caching, in-memory data) | 70-85% |
| **ALB Request Count Per Target** | Web services, API endpoints | Tùy capacity test |
| **SQS Backlog Per Task** | Queue consumers, async workers | Messages/task phù hợp throughput |
| **Custom CloudWatch Metric** | Business metrics (orders/min, active users) | Tùy SLA |

> 💡 **Best practice**: Dùng **Target Tracking trên CPU** làm baseline, kết hợp thêm **custom metric** cho business-specific scaling. Scale out nhanh (cooldown 60s), scale in chậm (cooldown 300s) để tránh flapping.

### 2.2. EKS Auto Scaling (Karpenter & HPA/VPA)

EKS có **ba tầng scaling** — Pod level, Node level, và Cluster level.

```
┌─────────────────────────────────────────────────────────────┐
│                 EKS SCALING LAYERS                          │
│                                                             │
│  ┌─── Layer 1: Pod Scaling ──────────────────────────────┐  │
│  │  HPA (Horizontal Pod Autoscaler)                      │  │
│  │  ├── Scale số lượng Pod dựa trên metrics              │  │
│  │  ├── CPU, Memory, custom metrics (Prometheus)         │  │
│  │  └── Giống ECS Target Tracking                        │  │
│  │                                                       │  │
│  │  VPA (Vertical Pod Autoscaler)                        │  │
│  │  ├── Tự động điều chỉnh CPU/Memory request/limit      │  │
│  │  ├── Phân tích usage → recommend → (optional) apply   │  │
│  │  └── Dùng cho workloads khó horizontal scale          │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌─── Layer 2: Node Scaling ─────────────────────────────┐  │
│  │  Karpenter (khuyến nghị)                              │  │
│  │  ├── Tự động provision node khi Pod pending           │  │
│  │  ├── Chọn instance type tối ưu (right-sizing)         │  │
│  │  ├── Mix On-Demand + Spot instances                   │  │
│  │  ├── Consolidation — gom Pod, terminate node thừa     │  │
│  │  └── Nhanh hơn Cluster Autoscaler (< 60s)             │  │
│  │                                                       │  │
│  │  Cluster Autoscaler (legacy)                          │  │
│  │  ├── Scale ASG (Auto Scaling Group)                   │  │
│  │  ├── Chậm hơn Karpenter (2-5 phút)                    │  │
│  │  └── Ít flexible hơn về instance type                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### HPA — Horizontal Pod Autoscaler

```yaml source="snippets/hpa-horizontal-pod-autoscaler.yaml"
# HPA dựa trên CPU + Custom Metric
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 3
  maxReplicas: 50
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30      # Scale up nhanh
      policies:
        - type: Percent
          value: 100                       # Tối đa gấp đôi
          periodSeconds: 60
        - type: Pods
          value: 5                         # Hoặc thêm 5 pods
          periodSeconds: 60
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300      # Scale down chậm (5 phút)
      policies:
        - type: Percent
          value: 10                        # Giảm tối đa 10%
          periodSeconds: 60
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second    # Custom metric từ Prometheus
        target:
          type: AverageValue
          averageValue: "1000"              # 1000 RPS per pod
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=21-aws-resilience&snapshot=article&file=snippets%2Fhpa-horizontal-pod-autoscaler.yaml)

#### Karpenter — Node Auto Provisioning

```yaml source="snippets/karpenter-node-auto-provisioning.yaml"
# Karpenter NodePool
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: default
spec:
  template:
    spec:
      requirements:
        - key: "karpenter.sh/capacity-type"
          operator: In
          values: ["on-demand", "spot"]     # Mix On-Demand + Spot
        - key: "node.kubernetes.io/instance-type"
          operator: In
          values:                           # Right-sizing: chọn nhiều instance types
            - "m6i.large"
            - "m6i.xlarge"
            - "m6a.large"
            - "m6a.xlarge"
            - "m5.large"
            - "m5.xlarge"
            - "c6i.large"                   # Compute-optimized cho CPU-bound
            - "c6i.xlarge"
        - key: "topology.kubernetes.io/zone"
          operator: In
          values: ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
      nodeClassRef:
        name: default
  limits:
    cpu: "200"                              # Tối đa 200 vCPU toàn cluster
    memory: "400Gi"
  disruption:
    consolidationPolicy: WhenUnderutilized  # Tự gom Pod, terminate node thừa
    expireAfter: 720h                       # Rotate node mỗi 30 ngày
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=21-aws-resilience&snapshot=article&file=snippets%2Fkarpenter-node-auto-provisioning.yaml)

### 2.3. Lambda Concurrency & Scaling

Lambda có cơ chế scaling **hoàn toàn tự động** — mỗi request tạo 1 execution environment riêng.

```
┌────────────────────────────────────────────────────────────┐
│               LAMBDA SCALING MODEL                         │
│                                                            │
│  Account Concurrency Limit = 1000 (default, có thể tăng)   │
│                                                            │
│  ┌── Unreserved Concurrency ──────────────────────────┐    │
│  │  Chia sẻ giữa tất cả Lambda functions              │    │
│  │  Không đảm bảo capacity cho function cụ thể        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌── Reserved Concurrency ────────────────────────────┐    │
│  │  Đặt trước capacity cho function cụ thể            │    │
│  │  Ví dụ: Payment function = 200 concurrent          │    │
│  │  ⚠️ Vượt limit → throttle (429)                    │    │
│  │  Miễn phí — chỉ reserve, không charge thêm         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌── Provisioned Concurrency ─────────────────────────┐    │
│  │  Pre-warm execution environments                   │    │
│  │  Loại bỏ cold start hoàn toàn                      │    │
│  │  ⚠️ Tốn phí — charge theo provisioned units        │    │
│  │  Dùng cho: latency-sensitive (< 100ms required)    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  Burst Limit:                                              │
│  ├── 3000 concurrent (us-east-1, us-west-2, eu-west-1)     │
│  ├── 1000 concurrent (các region khác)                     │
│  └── Sau burst: +500/minute cho đến account limit          │
└────────────────────────────────────────────────────────────┘
```

#### Cấu hình Lambda Scaling (Terraform)

```hcl source="snippets/cau-hinh-lambda-scaling-terraform.tf"
# Lambda Function với Reserved Concurrency
resource "aws_lambda_function" "payment_processor" {
  function_name = "payment-processor"
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  memory_size   = 512
  timeout       = 30

  reserved_concurrent_executions = 200    # Reserve 200 concurrent

  environment {
    variables = {
      PAYMENT_GATEWAY_URL = var.payment_gateway_url
    }
  }
}

# Provisioned Concurrency — loại bỏ cold start
resource "aws_lambda_provisioned_concurrency_config" "payment" {
  function_name                  = aws_lambda_function.payment_processor.function_name
  provisioned_concurrent_executions = 50   # 50 pre-warmed instances
  qualifier                      = aws_lambda_alias.live.name
}

# Auto Scaling Provisioned Concurrency theo schedule
resource "aws_appautoscaling_target" "lambda_target" {
  max_capacity       = 200
  min_capacity       = 10
  resource_id        = "function:${aws_lambda_function.payment_processor.function_name}:${aws_lambda_alias.live.name}"
  scalable_dimension = "lambda:function:ProvisionedConcurrency"
  service_namespace  = "lambda"
}

resource "aws_appautoscaling_policy" "lambda_scaling" {
  name               = "payment-lambda-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.lambda_target.resource_id
  scalable_dimension = aws_appautoscaling_target.lambda_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.lambda_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "LambdaProvisionedConcurrencyUtilization"
    }
    target_value = 0.7    # Giữ utilization ở 70%
  }
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=21-aws-resilience&snapshot=article&file=snippets%2Fcau-hinh-lambda-scaling-terraform.tf)

### 2.4. So sánh Auto Scaling: ECS vs EKS vs Lambda

| Tiêu chí | ECS (Fargate) | EKS (Karpenter) | Lambda |
|----------|--------------|-----------------|--------|
| **Scaling speed** | 1-3 phút | 30s-2 phút (Karpenter) | Milliseconds (có sẵn) |
| **Min instances** | 0 (Scale to Zero với Scheduled) | 0 (KEDA) | 0 (tự động) |
| **Max instances** | Fargate quota (per region) | Node limits + vCPU quota | 1000 concurrent (default) |
| **Scaling metric** | CPU, Memory, ALB, Custom | CPU, Memory, Custom (Prometheus) | Tự động theo request |
| **Cost khi idle** | Min task count × giá | Min node × giá | $0 (pay per invocation) |
| **Cold start** | Task startup (30-60s) | Pod + Node startup (30-120s) | 100ms-10s (tùy runtime) |
| **Best for** | Long-running services | Complex workloads, GPU | Event-driven, bursty |

> 💡 **Khi nào chọn gì?**
> - **Lambda**: Bursty traffic, event-driven, execution time < 15 phút
> - **ECS Fargate**: Stateless web services, API backends, predictable workloads
> - **EKS**: Complex microservices, cần full Kubernetes ecosystem, GPU workloads

---

## 3. Multi-AZ & Multi-Region

### 3.1. Multi-AZ — High Availability trong Region

Multi-AZ là **mức tối thiểu** cho production — deploy service trên **ít nhất 2 Availability Zones** trong cùng Region.

```
┌───────────────────────── Region: ap-southeast-1 ──────────────────────────┐
│                                                                           │
│  ┌──────────────── Application Load Balancer ──────────────────────────┐  │
│  │  Cross-Zone Load Balancing: ENABLED                                 │  │
│  │  Routes traffic to healthy targets across all AZs                   │  │
│  └────────┬───────────────────────┬───────────────────────┬────────────┘  │
│           │                       │                       │               │
│           ▼                       ▼                       ▼               │
│  ┌──────── AZ-1a ───────┐  ┌──────── AZ-1b ───────┐  ┌──────── AZ-1c ──┐  │
│  │                      │  │                      │  │                 │  │
│  │  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌────────────┐ │  │
│  │  │ ECS Task ×3    │  │  │  │ ECS Task ×3    │  │  │  │ ECS Task×2 │ │  │
│  │  │ Order Service  │  │  │  │ Order Service  │  │  │  │ Order Svc  │ │  │
│  │  └────────────────┘  │  │  └────────────────┘  │  │  └────────────┘ │  │
│  │                      │  │                      │  │                 │  │
│  │  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌────────────┐ │  │
│  │  │ Aurora         │  │  │  │ Aurora         │  │  │  │ Aurora     │ │  │
│  │  │ Primary        │──┼──┼──▶ Read Replica   │──┼──┼──▶ Read       │ │  │
│  │  │ (Writer)       │  │  │  │ (Reader)       │  │  │  │ Replica    │ │  │
│  │  └────────────────┘  │  │  └────────────────┘  │  │  └────────────┘ │  │
│  │                      │  │                      │  │                 │  │
│  │  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌────────────┐ │  │
│  │  │ ElastiCache    │  │  │  │ ElastiCache    │  │  │  │ ElastiCache│ │  │
│  │  │ Primary        │──┼──┼──▶ Replica        │──┼──┼──▶ Replica    │ │  │
│  │  └────────────────┘  │  │  └────────────────┘  │  │  └────────────┘ │  │
│  │                      │  │                      │  │                 │  │
│  │  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌────────────┐ │  │
│  │  │ NAT Gateway    │  │  │  │ NAT Gateway    │  │  │  │ NAT GW     │ │  │
│  │  └────────────────┘  │  │  └────────────────┘  │  │  └────────────┘ │  │
│  └──────────────────────┘  └──────────────────────┘  └─────────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Multi-AZ Checklist

| Layer | Service | Multi-AZ mặc định? | Cần cấu hình? |
|-------|---------|:------------------:|---------------|
| **Compute** | ECS Fargate | ✅ (spread across AZs) | Chỉ cần chọn ≥ 2 subnets |
| **Compute** | EKS | ✅ (nếu node group multi-AZ) | Karpenter: cấu hình zone topology |
| **Compute** | Lambda | ✅ (tự động) | Không cần |
| **Database** | Aurora | ⚠️ Cần bật Multi-AZ | `availability_zones` + replica |
| **Database** | DynamoDB | ✅ (tự động replicate 3 AZs) | Không cần |
| **Cache** | ElastiCache | ⚠️ Cần bật Multi-AZ | `automatic_failover_enabled = true` |
| **Queue** | SQS | ✅ (tự động) | Không cần |
| **Storage** | S3 | ✅ (tự động replicate) | Không cần |
| **Network** | ALB | ✅ (khi chọn ≥ 2 subnets) | Chọn subnets ở nhiều AZs |
| **Network** | NAT Gateway | ❌ Single-AZ per gateway | Tạo 1 NAT GW mỗi AZ |

### 3.2. Multi-Region — Disaster Recovery & Global Users

Multi-Region cần thiết khi: **(1)** Yêu cầu DR cho critical workloads, **(2)** Giảm latency cho global users, **(3)** Compliance — data phải ở region cụ thể.

```
                         ┌──────────────────────┐
                         │      Route 53        │
                         │  Failover Routing    │
                         │  (Health Check based)│
                         └─────┬──────────┬─────┘
                               │          │
                    Primary    │          │   Secondary
                               ▼          ▼
┌──── Region: ap-southeast-1 (Primary) ───────┐  ┌──── Region: ap-northeast-1 (DR) ───────┐
│                                             │  │                                        │
│  ┌───────── ECS / EKS Cluster ───────────┐  │  │  ┌──────── ECS / EKS Cluster ───────┐  │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │  │  │  │  ┌─────┐ ┌─────┐                 │  │
│  │  │Svc A│ │Svc B│ │Svc C│ │Svc D│      │  │  │  │  │Svc A│ │Svc B│  (standby)      │  │
│  │  └─────┘ └─────┘ └─────┘ └─────┘      │  │  │  │  └─────┘ └─────┘                 │  │
│  └───────────────────────────────────────┘  │  │  └──────────────────────────────────┘  │
│                                             │  │                                        │
│  ┌──────────────────┐   Global Database     │  │  ┌──────────────────┐                  │
│  │ Aurora Primary   │ ──── async repl ──────┼──┼──▶ Aurora Replica   │                  │
│  │ (read-write)     │   (~1s lag)           │  │  │ (read-only)      │                  │
│  └──────────────────┘                       │  │  └──────────────────┘                  │
│                                             │  │                                        │
│  ┌──────────────────┐   Global Tables       │  │  ┌──────────────────┐                  │
│  │ DynamoDB Table   │ ──── active-active ───┼──┼──▶ DynamoDB Replica │                  │
│  │ (read-write)     │                       │  │  │ (read-write)     │                  │
│  └──────────────────┘                       │  │  └──────────────────┘                  │
│                                             │  │                                        │
│  ┌──────────────────┐   Cross-Region Repl   │  │  ┌──────────────────┐                  │
│  │ S3 Bucket        │ ──────────────────────┼──┼──▶ S3 Replica       │                  │
│  └──────────────────┘                       │  │  └──────────────────┘                  │
│                                             │  │                                        │
└─────────────────────────────────────────────┘  └────────────────────────────────────────┘
```

### 3.3. DR Strategies trên AWS

| Strategy | RTO | RPO | Cost | Khi nào dùng |
|----------|-----|-----|------|-------------|
| **Backup & Restore** | Giờ | Giờ | $ | Non-critical, batch workloads |
| **Pilot Light** | 10-30 phút | Phút | $$ | Core services, database replicated |
| **Warm Standby** | Phút | Giây-phút | $$$ | Business-critical, cần failover nhanh |
| **Active-Active** | ~0 (near zero) | ~0 | $$$$ | Mission-critical, global users |

> **RTO** (Recovery Time Objective) = thời gian tối đa chấp nhận được để khôi phục hệ thống.
> **RPO** (Recovery Point Objective) = lượng data tối đa chấp nhận mất khi sự cố xảy ra.

---

## 4. Circuit Breaker & Resilience Patterns trên AWS

### 4.1. Circuit Breaker ở service layer (ưu tiên non-App-Mesh)

Circuit Breaker có thể triển khai ở 2 tầng:
- **Application-level** (Resilience4j/Polly): linh hoạt nhất cho business fallback.
- **Service layer** (Service Connect/VPC Lattice/Istio): quản lý policy tập trung.

> ⚠️ **Lưu ý thời gian:** AWS App Mesh có mốc **End of Support ngày 30/09/2026**. Không nên chọn App Mesh cho workload mới.

```
┌──────────────────────────────────────────────────────────┐
│          CIRCUIT BREAKER VỚI APP MESH                    │
│                                                          │
│  ┌─────────────────────┐      ┌─────────────────────┐    │
│  │   Order Service     │      │   Payment Service   │    │
│  │  ┌───────────────┐  │      │  ┌───────────────┐  │    │
│  │  │  Application  │  │      │  │  Application  │  │    │
│  │  └───────┬───────┘  │      │  └───────────────┘  │    │
│  │          │          │      │         ▲           │    │
│  │  ┌───────▼───────┐  │      │  ┌──────┴────────┐  │    │
│  │  │ Envoy Proxy   │──┼──────┼──▶ Envoy Proxy   │  │    │
│  │  │               │  │      │  │               │  │    │
│  │  │ • Outlier Det │  │      │  │ • Health Check│  │    │
│  │  │ • Retry       │  │      │  │ • Rate Limit  │  │    │
│  │  │ • Timeout     │  │      │  │               │  │    │
│  │  │ • Circuit Brk │  │      │  │               │  │    │
│  │  └───────────────┘  │      │  └───────────────┘  │    │
│  └─────────────────────┘      └─────────────────────┘    │
│                                                          │
│  Service layer control plane ← cấu hình qua API/Terraform │
└──────────────────────────────────────────────────────────┘
```

#### Cấu hình Outlier Detection (legacy App Mesh, chỉ tham khảo migration)

> Phần cấu hình dưới đây giữ lại để hỗ trợ hệ thống cũ đang chạy App Mesh; không khuyến nghị cho dự án greenfield.

```hcl source="snippets/cau-hinh-outlier-detection-legacy-app-mesh-chi-tham-khao-migration.tf"
# App Mesh Virtual Node với Outlier Detection
resource "aws_appmesh_virtual_node" "payment_service" {
  name      = "payment-service"
  mesh_name = aws_appmesh_mesh.main.name

  spec {
    listener {
      port_mapping {
        port     = 8080
        protocol = "http"
      }

      # Connection pool — Bulkhead pattern
      connection_pool {
        http {
          max_connections      = 100   # Max concurrent connections
          max_pending_requests = 50    # Max queued requests
        }
      }

      # Outlier Detection — Circuit Breaker
      outlier_detection {
        max_server_errors    = 5              # 5 lỗi 5xx liên tiếp
        interval {
          value = 30
          unit  = "s"                         # Check mỗi 30 giây
        }
        base_ejection_duration {
          value = 30
          unit  = "s"                         # Eject (open circuit) 30 giây
        }
        max_ejection_percent = 50             # Tối đa eject 50% endpoints
      }

      # Timeout
      timeout {
        http {
          per_request {
            value = 15
            unit  = "s"                       # Timeout mỗi request: 15s
          }
          idle {
            value = 300
            unit  = "s"                       # Idle timeout: 5 phút
          }
        }
      }
    }

    # Retry Policy
    listener {
      port_mapping {
        port     = 8080
        protocol = "http"
      }
    }

    service_discovery {
      aws_cloud_map {
        namespace_name = aws_service_discovery_private_dns_namespace.main.name
        service_name   = "payment-service"
      }
    }
  }
}

# Virtual Router với Retry Policy
resource "aws_appmesh_route" "payment_route" {
  name                = "payment-route"
  mesh_name           = aws_appmesh_mesh.main.name
  virtual_router_name = aws_appmesh_virtual_router.payment.name

  spec {
    http_route {
      match {
        prefix = "/"
      }

      action {
        weighted_target {
          virtual_node = aws_appmesh_virtual_node.payment_service.name
          weight       = 100
        }
      }

      # Retry Policy
      retry_policy {
        max_retries = 3

        http_retry_events = [
          "server-error",      # 5xx
          "gateway-error",     # 502, 503, 504
        ]

        tcp_retry_events = [
          "connection-error",
        ]

        per_retry_timeout {
          value = 5
          unit  = "s"
        }
      }

      # Timeout
      timeout {
        per_request {
          value = 30
          unit  = "s"
        }
        idle {
          value = 60
          unit  = "s"
        }
      }
    }
  }
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=21-aws-resilience&snapshot=article&file=snippets%2Fcau-hinh-outlier-detection-legacy-app-mesh-chi-tham-khao-migration.tf)

#### Service Layer vs Application-Level Circuit Breaker

| Tiêu chí | Service Layer (Service Connect/VPC Lattice/Istio) | Application-Level (Resilience4j, Polly) |
|----------|------------------|----------------------------------------|
| **Ngôn ngữ** | Language-agnostic | Per-language library |
| **Config** | Infrastructure-as-Code | Application config |
| **Granularity** | Per-service endpoint | Per-method/per-call |
| **Custom logic** | ❌ Limited | ✅ Full control (fallback, custom metrics) |
| **Overhead** | Sidecar resource (~50MB RAM) | In-process (minimal) |
| **Khi nào dùng** | Policy tập trung, giảm drift cấu hình | Fine-grained control, complex fallbacks |

> 💡 **Best practice**: Dùng **service-layer policy** cho baseline (timeout, retry), kết hợp **application-level** cho business logic (custom fallback, degraded response).

### 4.2. Retry & Timeout trên AWS

Ngoài service layer, nhiều AWS service có **built-in retry**:

| Service | Retry tích hợp | Cấu hình |
|---------|:--------------:|----------|
| **API Gateway** | ❌ | Cần tự handle ở backend |
| **ALB** | ❌ | Retry ở client hoặc service mesh |
| **SQS** | ✅ | `maxReceiveCount` → DLQ |
| **Step Functions** | ✅ | `Retry` field trong state definition |
| **EventBridge** | ✅ | Retry policy (max 185 lần trong 24h) |
| **Lambda (async)** | ✅ | 2 retries mặc định → DLQ/event destination |
| **SNS** | ✅ | Retry policy per subscription |

#### Step Functions — Retry & Error Handling

```json source="snippets/step-functions-retry-error-handling.json"
{
  "ProcessPayment": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:ap-southeast-1:123456789:function:process-payment",
    "TimeoutSeconds": 30,
    "HeartbeatSeconds": 10,
    "Retry": [
      {
        "ErrorEquals": ["PaymentGatewayTimeout", "Lambda.ServiceException"],
        "IntervalSeconds": 2,
        "MaxAttempts": 3,
        "BackoffRate": 2.0
      },
      {
        "ErrorEquals": ["States.TaskFailed"],
        "IntervalSeconds": 5,
        "MaxAttempts": 2,
        "BackoffRate": 1.5
      }
    ],
    "Catch": [
      {
        "ErrorEquals": ["PaymentDeclined"],
        "Next": "NotifyPaymentFailed",
        "ResultPath": "$.error"
      },
      {
        "ErrorEquals": ["States.ALL"],
        "Next": "CompensateOrder",
        "ResultPath": "$.error"
      }
    ],
    "Next": "ConfirmOrder"
  }
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=21-aws-resilience&snapshot=article&file=snippets%2Fstep-functions-retry-error-handling.json)

### 4.3. Bulkhead trên AWS

Bulkhead trên AWS được triển khai qua nhiều tầng:

```
┌────────────────────────────────────────────────────────────┐
│                  BULKHEAD trên AWS                         │
│                                                            │
│  ┌── Infrastructure-Level Bulkhead ───────────────────┐    │
│  │  • Separate ECS Services (không chia sẻ task)      │    │
│  │  • Separate EKS namespaces + resource quotas       │    │
│  │  • Lambda reserved concurrency per function        │    │
│  │  • Separate VPCs/subnets cho critical services     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌── Service-Level Bulkhead ──────────────────────────┐    │
│  │  • Service-layer connection pool (max_connections)  │    │
│  │  • ALB target group per service                    │    │
│  │  • API Gateway usage plans per client              │    │
│  │  • SQS separate queues per workload type           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌── Database-Level Bulkhead ─────────────────────────┐    │
│  │  • Database per Service (doc 09, doc 20)           │    │
│  │  • Aurora connection limits per service            │    │
│  │  • DynamoDB separate tables per service            │    │
│  │  • ElastiCache separate clusters for critical data │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

### 4.4. Rate Limiting trên AWS

```
┌─────────────────────────────────────────────────────────┐
│              RATE LIMITING LAYERS trên AWS              │
│                                                         │
│  Layer 1: CloudFront                                    │
│  ├── AWS WAF Rate-based Rules                           │
│  ├── Giới hạn per IP: ví dụ 2000 req / 5 min            │
│  └── Block DDoS tại edge (trước khi vào Region)         │
│                                                         │
│  Layer 2: API Gateway                                   │
│  ├── Usage Plans + API Keys                             │
│  ├── Per-client throttling: 100 req/s burst, 50 req/s   │
│  ├── Account-level: 10,000 req/s (default)              │
│  └── Method-level throttling (override per endpoint)    │
│                                                         │
│  Layer 3: ALB + WAF                                     │
│  ├── WAF Rate-based Rules trên ALB                      │
│  └── Giới hạn per IP hoặc per header                    │
│                                                         │
│  Layer 4: Application                                   │
│  ├── Redis-based rate limiter (ElastiCache)             │
│  ├── Token Bucket / Sliding Window algorithm            │
│  └── Per-user, per-tenant, per-API-key                  │
└─────────────────────────────────────────────────────────┘
```

#### API Gateway Throttling (Terraform)

```hcl source="snippets/api-gateway-throttling-terraform.tf"
# Usage Plan — Rate limiting per client
resource "aws_api_gateway_usage_plan" "partner_plan" {
  name = "partner-tier"

  throttle_settings {
    burst_limit = 200     # Max burst requests
    rate_limit  = 100     # Sustained requests per second
  }

  quota_settings {
    limit  = 100000       # 100K requests per month
    period = "MONTH"
  }

  api_stages {
    api_id = aws_api_gateway_rest_api.main.id
    stage  = aws_api_gateway_stage.prod.stage_name

    # Override cho specific endpoint
    throttle {
      path        = "/orders/POST"
      burst_limit = 50
      rate_limit  = 20
    }
  }
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=21-aws-resilience&snapshot=article&file=snippets%2Fapi-gateway-throttling-terraform.tf)

### 4.5. Fallback Patterns trên AWS

| Pattern | AWS Implementation | Ví dụ |
|---------|-------------------|-------|
| **Cache Fallback** | ElastiCache (Redis) | Product catalog: DB down → serve from cache |
| **Queue Fallback** | SQS | Payment timeout → queue for retry later |
| **Static Fallback** | S3 + CloudFront | Service down → serve static response |
| **Default Response** | API Gateway Mock | Recommendation down → return default list |
| **Async Fallback** | EventBridge + Lambda | Sync call fails → emit event for async processing |

```d2 title="Product Service — Fallback từ DB tới S3"
direction: down
request: Request
service: Product Service
db: DB Query
fresh: Response — fresh
redis: Redis Cache — stale OK
cached: Response — cached
s3: S3 Static — default
request -> service -> db
db -> fresh: Success
db -> redis: Fail / Timeout
redis -> cached: Cache Hit
redis -> s3: Cache Miss
```

---

## 5. Health Check & Self-Healing

### 5.1. Health Check trên ECS

ECS hỗ trợ **2 loại health check**: Container-level và ALB Target Group.

```hcl source="snippets/5-1-health-check-tren-ecs.tf"
# ECS Task Definition — Container Health Check
resource "aws_ecs_task_definition" "order_service" {
  family = "order-service"

  container_definitions = jsonencode([{
    name  = "order-service"
    image = "123456789.dkr.ecr.ap-southeast-1.amazonaws.com/order-service:latest"

    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]

    # Container Health Check
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
      interval    = 30        # Check mỗi 30 giây
      timeout     = 5         # Timeout per check: 5 giây
      retries     = 3         # 3 lần fail → unhealthy
      startPeriod = 60        # Grace period sau khi start: 60 giây
    }

    # Resource limits
    cpu    = 512
    memory = 1024
  }])
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=21-aws-resilience&snapshot=article&file=snippets%2F5-1-health-check-tren-ecs.tf)

#### Health Check Endpoint Design

```
GET /health          → Basic liveness (luôn return 200 nếu process sống)
GET /health/ready    → Readiness (check dependencies: DB, cache, queue)
GET /health/detailed → Deep check (chi tiết từng dependency — chỉ internal)
```

```json source="snippets/health-check-endpoint-design.json"
// GET /health/ready — 200 OK
{
  "status": "UP",
  "checks": {
    "database": { "status": "UP", "responseTime": "12ms" },
    "redis": { "status": "UP", "responseTime": "2ms" },
    "sqs": { "status": "UP" }
  }
}

// GET /health/ready — 503 Service Unavailable
{
  "status": "DOWN",
  "checks": {
    "database": { "status": "DOWN", "error": "Connection timeout" },
    "redis": { "status": "UP", "responseTime": "2ms" },
    "sqs": { "status": "UP" }
  }
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=21-aws-resilience&snapshot=article&file=snippets%2Fhealth-check-endpoint-design.json)

### 5.2. Health Check trên EKS

```yaml source="snippets/5-2-health-check-tren-eks.yaml"
# Kubernetes Pod — Liveness & Readiness Probes
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  template:
    spec:
      containers:
        - name: order-service
          image: order-service:latest
          ports:
            - containerPort: 8080

          # Liveness Probe — restart container nếu fail
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30     # Chờ 30s sau khi start
            periodSeconds: 10           # Check mỗi 10s
            timeoutSeconds: 3
            failureThreshold: 3         # 3 lần fail → restart

          # Readiness Probe — remove khỏi Service endpoints nếu fail
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 2         # 2 lần fail → stop traffic

          # Startup Probe — cho phép app khởi động chậm
          startupProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
            failureThreshold: 30        # 30 × 5s = 150s max startup time
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=21-aws-resilience&snapshot=article&file=snippets%2F5-2-health-check-tren-eks.yaml)

### 5.3. ALB/NLB Health Check

```hcl source="snippets/5-3-alb-nlb-health-check.tf"
# ALB Target Group Health Check
resource "aws_lb_target_group" "order_service" {
  name        = "order-service-tg"
  port        = 8080
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    path                = "/health/ready"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 2          # 2 lần OK → healthy
    unhealthy_threshold = 3          # 3 lần fail → unhealthy → stop traffic
    timeout             = 5
    interval            = 15         # Check mỗi 15 giây
    matcher             = "200"      # Chỉ accept 200
  }

  # Deregistration delay — cho phép drain connections
  deregistration_delay = 30

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = false          # Stateless service → không cần sticky
  }
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=21-aws-resilience&snapshot=article&file=snippets%2F5-3-alb-nlb-health-check.tf)

### 5.4. Route 53 Health Check

Route 53 Health Check dùng cho **DNS-level failover** — chuyển traffic giữa regions hoặc endpoints.

```hcl source="snippets/5-4-route-53-health-check.tf"
# Route 53 Health Check — Primary Region
resource "aws_route53_health_check" "primary" {
  fqdn              = "api-primary.example.com"
  port               = 443
  type               = "HTTPS"
  resource_path      = "/health"
  failure_threshold  = 3
  request_interval   = 10         # Check mỗi 10 giây (fast)

  regions = [
    "us-east-1",
    "eu-west-1",
    "ap-southeast-1"              # Check từ 3 regions
  ]

  tags = {
    Name = "primary-region-health"
  }
}

# CloudWatch Alarm cho Health Check
resource "aws_route53_health_check" "primary_alarm" {
  type                = "CLOUDWATCH_METRIC"
  cloudwatch_alarm_name   = aws_cloudwatch_metric_alarm.primary_error_rate.alarm_name
  cloudwatch_alarm_region = "ap-southeast-1"
  insufficient_data_health_status = "LastKnownStatus"
}

# DNS Failover Record
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.example.com"
  type    = "A"

  # Primary
  failover_routing_policy {
    type = "PRIMARY"
  }

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }

  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "api_dr" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.example.com"
  type    = "A"

  # Secondary (DR)
  failover_routing_policy {
    type = "SECONDARY"
  }

  alias {
    name                   = aws_lb.dr.dns_name
    zone_id                = aws_lb.dr.zone_id
    evaluate_target_health = true
  }

  set_identifier = "secondary"
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=21-aws-resilience&snapshot=article&file=snippets%2F5-4-route-53-health-check.tf)

---

## 6. Chaos Engineering trên AWS

### 6.1. AWS Fault Injection Service (FIS)

**AWS FIS** (Fault Injection Service) là managed service cho Chaos Engineering — inject failures vào hệ thống để kiểm tra resilience.

```d2 title="AWS FIS — Experiment Lifecycle"
direction: right
template: "Experiment Template\nTargets — EC2 / ECS / EKS / RDS\nActions — stop instance / kill container\nStop conditions — CloudWatch alarms\nDuration"
run: "Run Experiment\n1. Inject fault\n2. Monitor CloudWatch\n3. Stop theo stop condition\n4. Analyze → improve resilience"
template -> run
```

Stop condition dừng experiment. Việc khôi phục/rollback phụ thuộc action và tài nguyên; không mặc định mọi lỗi được tự động hoàn tác.

#### FIS Experiment Template (Terraform)

```hcl source="snippets/fis-experiment-template-terraform.tf"
# FIS Experiment — Kill ECS Tasks
resource "aws_fis_experiment_template" "ecs_task_kill" {
  description = "Kill 50% ECS tasks to test auto-recovery"
  role_arn    = aws_iam_role.fis_role.arn

  # Stop condition — dừng nếu error rate quá cao
  stop_condition {
    source = "aws:cloudwatch:alarm"
    value  = aws_cloudwatch_metric_alarm.high_error_rate.arn
  }

  # Target: ECS Tasks
  target {
    name           = "ecs-tasks"
    resource_type  = "aws:ecs:task"
    selection_mode = "PERCENT(50)"       # Kill 50% tasks

    resource_tag {
      key   = "Environment"
      value = "staging"                  # Chỉ staging!
    }

    filter {
      path   = "State.Name"
      values = ["RUNNING"]
    }
  }

  # Action: Stop ECS Tasks
  action {
    name        = "stop-ecs-tasks"
    action_id   = "aws:ecs:stop-task"
    description = "Stop 50% of order-service tasks"

    target {
      key   = "Tasks"
      value = "ecs-tasks"
    }
  }

  tags = {
    Experiment = "ecs-resilience-test"
    Team       = "platform"
  }
}

# FIS Experiment — Network Latency
resource "aws_fis_experiment_template" "network_latency" {
  description = "Add 500ms latency to simulate slow network"
  role_arn    = aws_iam_role.fis_role.arn

  stop_condition {
    source = "aws:cloudwatch:alarm"
    value  = aws_cloudwatch_metric_alarm.p99_latency.arn
  }

  target {
    name           = "ec2-instances"
    resource_type  = "aws:ec2:instance"
    selection_mode = "ALL"

    resource_tag {
      key   = "Service"
      value = "payment-service"
    }
  }

  action {
    name        = "inject-latency"
    action_id   = "aws:ssm:send-command"
    description = "Inject 500ms network latency"

    parameter {
      key   = "documentArn"
      value = "arn:aws:ssm:ap-southeast-1::document/AWSFIS-Run-Network-Latency"
    }
    parameter {
      key   = "documentParameters"
      value = jsonencode({
        DurationSeconds  = "300"
        DelayMilliseconds = "500"
        Interface         = "eth0"
      })
    }
    parameter {
      key   = "duration"
      value = "PT5M"                    # 5 phút
    }

    target {
      key   = "Instances"
      value = "ec2-instances"
    }
  }
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=21-aws-resilience&snapshot=article&file=snippets%2Ffis-experiment-template-terraform.tf)

### 6.2. Các thí nghiệm Chaos phổ biến

| Thí nghiệm | Target | Kỳ vọng | FIS Action |
|------------|--------|---------|------------|
| **Kill tasks/pods** | ECS Tasks / EKS Pods | Auto Scaling tạo tasks mới, zero downtime | `aws:ecs:stop-task` / `aws:eks:terminate-nodegroup-instances` |
| **AZ failure** | Subnet / AZ | Traffic chuyển sang AZ khác, ALB healthy | `aws:ec2:stop-instances` (all in 1 AZ) |
| **Network latency** | EC2 / ECS | Circuit breaker kích hoạt, fallback hoạt động | `AWSFIS-Run-Network-Latency` |
| **CPU stress** | EC2 / ECS | Auto Scaling tăng instances, latency không tăng quá SLA | `AWSFIS-Run-CPU-Stress` |
| **DB failover** | RDS / Aurora | Automatic failover, app reconnect trong vài giây | `aws:rds:failover-db-cluster` |
| **DNS failure** | Route 53 | Failover sang secondary region | `aws:route53:update-healthcheck` |

### 6.3. Game Day — Quy trình thực hành

```
┌────────────────────────────────────────────────────────────┐
│                    GAME DAY PROCESS                        │
│                                                            │
│  Phase 1: CHUẨN BỊ                                         │
│  ├── 1. Xác định scope (service nào, environment nào)      │
│  ├── 2. Đặt giả thuyết ("Nếu AZ-a down, hệ thống vẫn       │
│  │       serve 100% traffic với p99 < 500ms")              │
│  ├── 3. Thiết lập monitoring dashboard                     │
│  ├── 4. Define stop conditions (abort criteria)            │
│  └── 5. Notify stakeholders                                │
│                                                            │
│  Phase 2: THỰC HIỆN                                        │
│  ├── 1. Start monitoring (record baseline metrics)         │
│  ├── 2. Inject fault (qua FIS hoặc manual)                 │
│  ├── 3. Observe — so sánh metrics vs giả thuyết            │
│  ├── 4. Escalate nếu cần (trigger stop condition)          │
│  └── 5. Rollback fault injection                           │
│                                                            │
│  Phase 3: PHÂN TÍCH                                        │
│  ├── 1. So sánh kết quả vs giả thuyết                      │
│  ├── 2. Document findings (gì hoạt động, gì không)         │
│  ├── 3. Tạo action items (fix gaps)                        │
│  ├── 4. Update runbooks nếu cần                            │
│  └── 5. Schedule next Game Day                             │
└────────────────────────────────────────────────────────────┘
```

> 💡 **Quy tắc vàng**: **Bắt đầu từ staging**, chỉ chạy production khi đã tự tin. Luôn có **stop condition** rõ ràng. **Blast radius nhỏ** — tăng dần scope qua từng Game Day.

---

## 7. Disaster Recovery trên AWS

### 7.1. Bốn chiến lược DR

```
┌─────────────────────────────────────────────────────────────────┐
│                  DR STRATEGIES SPECTRUM                         │
│                                                                 │
│  Cost thấp ◄──────────────────────────────────────► Cost cao    │
│  RTO dài   ◄──────────────────────────────────────► RTO ngắn    │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Backup &   │  │   Pilot     │  │  Warm    │  │  Active-  │  │
│  │  Restore    │  │   Light     │  │  Standby │  │  Active   │  │
│  │             │  │             │  │          │  │           │  │
│  │ RTO: giờ    │  │ RTO: 10-30m │  │ RTO: phút│  │ RTO: ~0   │  │
│  │ RPO: giờ    │  │ RPO: phút   │  │ RPO: giây│  │ RPO: ~0   │  │
│  │ Cost: $     │  │ Cost: $$    │  │ Cost: $$$│  │ Cost: $$$$│  │
│  │             │  │             │  │          │  │           │  │
│  │ S3 backups  │  │ DB replica  │  │ Scaled   │  │ Full      │  │
│  │ AMI copies  │  │ Min compute │  │ down     │  │ capacity  │  │
│  │ No compute  │  │ Core only   │  │ compute  │  │ both      │  │
│  │             │  │             │  │          │  │ regions   │  │
│  └─────────────┘  └─────────────┘  └──────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2. DR cho Microservice — Thiết kế chi tiết

#### Pilot Light — Phổ biến nhất cho Microservice

```
┌──── Primary Region ──────────────────┐   ┌──── DR Region ─────────────────────┐
│                                      │   │                                    │
│  ECS Cluster (ACTIVE)                │   │  ECS Cluster (STOPPED)             │
│  ┌──────┐ ┌──────┐ ┌──────┐          │   │  Task definitions ready            │
│  │ ×5   │ │ ×3   │ │ ×3   │          │   │  ECR images replicated             │
│  │Order │ │Pay   │ │Notif │          │   │  desired_count = 0                 │
│  └──────┘ └──────┘ └──────┘          │   │                                    │
│                                      │   │                                    │
│  Aurora Primary ─── Global DB ───────┼───▶  Aurora Replica (ALWAYS ON)        │
│  (read-write)    (async, ~1s lag)    │   │  (read-only, promote khi failover) │
│                                      │   │                                    │
│  DynamoDB ─── Global Tables ─────────┼───▶  DynamoDB Replica (ALWAYS ON)      │
│  (read-write)  (active-active)       │   │  (read-write ready)                │
│                                      │   │                                    │
│  ElastiCache ─── ❌ No replication ──┼───│  ElastiCache (cold, warm on DR)    │
│                                      │   │                                    │
│  S3 ─── Cross-Region Replication ────┼───▶  S3 Replica                        │
│                                      │   │                                    │
│  Secrets Manager (replicated) ───────┼───▶  Secrets (ALWAYS AVAILABLE)        │
│                                      │   │                                    │
└──────────────────────────────────────┘   └────────────────────────────────────┘

Failover Steps (automated via Lambda + Step Functions):
1. Route 53 health check fails → trigger failover
2. Step Functions orchestrate:
   a. Promote Aurora Replica → Primary
   b. Update ECS service desired_count (0 → N)
   c. Create ElastiCache cluster (from snapshot hoặc empty)
   d. Update Route 53 DNS → DR region ALB
3. Total time: 10-30 phút
```

#### Active-Active — Cho Mission-Critical Services

```hcl source="snippets/active-active-cho-mission-critical-services.tf"
# DynamoDB Global Tables — Active-Active
resource "aws_dynamodb_table" "orders" {
  name         = "orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "orderId"

  attribute {
    name = "orderId"
    type = "S"
  }

  # Enable Global Tables
  replica {
    region_name = "ap-northeast-1"     # DR Region
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }
}

# Aurora Global Database
resource "aws_rds_global_cluster" "main" {
  global_cluster_identifier = "ecommerce-global"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  storage_encrypted         = true
}

resource "aws_rds_cluster" "primary" {
  cluster_identifier        = "ecommerce-primary"
  global_cluster_identifier = aws_rds_global_cluster.main.id
  engine                    = aws_rds_global_cluster.main.engine
  engine_version            = aws_rds_global_cluster.main.engine_version
  availability_zones        = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
  master_username           = "admin"
  master_password           = var.db_password
}

resource "aws_rds_cluster" "dr" {
  provider                  = aws.dr_region
  cluster_identifier        = "ecommerce-dr"
  global_cluster_identifier = aws_rds_global_cluster.main.id
  engine                    = aws_rds_global_cluster.main.engine
  engine_version            = aws_rds_global_cluster.main.engine_version
  availability_zones        = ["ap-northeast-1a", "ap-northeast-1b", "ap-northeast-1c"]

  # DR cluster không cần master credentials (replicate từ primary)
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=21-aws-resilience&snapshot=article&file=snippets%2Factive-active-cho-mission-critical-services.tf)

### 7.3. Failover tự động với Route 53

```
┌────────────────────────────────────────────────────────────┐
│            AUTOMATIC FAILOVER FLOW                         │
│                                                            │
│  Route 53 Health Checker (3 regions)                       │
│         │                                                  │
│         ▼                                                  │
│  ┌──────────────┐    Healthy     ┌──────────────────┐      │
│  │ Check primary│───────────────▶│ Route to Primary │      │
│  │ /health      │                │ Region ALB       │      │
│  └──────┬───────┘                └──────────────────┘      │
│         │                                                  │
│         │ 3 consecutive failures                           │
│         ▼                                                  │
│  ┌──────────────┐                ┌──────────────────┐      │
│  │Mark UNHEALTHY│───────────────▶│ Route to DR      │      │
│  │              │                │ Region ALB       │      │
│  └──────┬───────┘                └──────────────────┘      │
│         │                                                  │
│         ▼                                                  │
│  ┌──────────────┐                                          │
│  │ CloudWatch   │── SNS ──▶ PagerDuty/Slack notification   │
│  │ Alarm        │                                          │
│  └──────┬───────┘                                          │
│         │                                                  │
│         ▼                                                  │
│  ┌──────────────┐                                          │
│  │ EventBridge  │── Step Functions ──▶ Auto promote DB     │
│  │ Rule         │                     ▶ Scale up DR ECS    │
│  └──────────────┘                     ▶ Warm up caches     │
└────────────────────────────────────────────────────────────┘
```

---

## 8. Ví dụ thực tế — E-Commerce Resilience Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│              E-COMMERCE RESILIENCE ARCHITECTURE trên AWS                 │
│                                                                         │
│  ┌─── Edge Layer ───────────────────────────────────────────────────┐    │
│  │  CloudFront + WAF                                                │    │
│  │  ├── DDoS protection (Shield Standard — free)                    │    │
│  │  ├── Rate limiting: 2000 req/5min per IP                         │    │
│  │  └── Static fallback: S3 maintenance page                        │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│           │                                                             │
│  ┌─── API Layer ────────────────────────────────────────────────────┐    │
│  │  API Gateway (Regional)                                          │    │
│  │  ├── Throttling: 1000 req/s per client                           │    │
│  │  ├── Usage Plans per tier (Free/Pro/Enterprise)                  │    │
│  │  └── Lambda Authorizer (JWT validation)                          │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│           │                                                              │
│  ┌─── Service Layer (ECS Fargate + Service Connect) ────────────────┐    │
│  │                                                                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐              │    │
│  │  │ Order Svc   │  │ Payment Svc │  │ Inventory    │              │    │
│  │  │ min:3 max:20│  │ min:2 max:15│  │ min:2 max:10 │              │    │
│  │  │             │  │             │  │              │              │    │
│  │  │ Envoy:      │  │ Envoy:      │  │ Envoy:       │              │    │
│  │  │ •timeout:15s│  │ •timeout:30s│  │ •timeout:10s │              │    │
│  │  │ •retry: 2   │  │ •retry: 1   │  │ •retry: 3    │              │    │
│  │  │ •CB: 5err/30s│ │ •CB: 3err/30s│ │ •CB: 5err/30s│              │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘              │    │
│  │         │                │                │                      │    │
│  │  Auto Scaling:           │                │                      │    │
│  │  • CPU Target: 70%       │                │                      │    │
│  │  • Scale out: 60s cool   │                │                      │    │
│  │  • Scale in: 300s cool   │                │                      │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│           │                                                              │
│  ┌─── Data Layer ───────────────────────────────────────────────────┐    │
│  │  Aurora PostgreSQL (Multi-AZ, 2 read replicas)                   │    │
│  │  ├── Auto failover: ~30 giây                                     │    │
│  │  ├── Aurora Auto Scaling read replicas (1-5)                     │    │
│  │  └── Global Database → DR region                                 │    │
│  │                                                                  │    │
│  │  DynamoDB (On-Demand, Global Tables)                             │    │
│  │  ├── Auto scaling RCU/WCU (nếu Provisioned mode)                 │    │
│  │  └── Point-in-time recovery enabled                              │    │
│  │                                                                  │    │
│  │  ElastiCache Redis (Multi-AZ, auto failover)                     │    │
│  │  ├── Cache fallback cho Product catalog                          │    │
│  │  └── Session store (stateless services)                          │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│           │                                                              │
│  ┌─── Async Layer ──────────────────────────────────────────────────┐    │
│  │  SQS Queues (per service) + DLQ                                  │    │
│  │  ├── Order Queue: maxReceiveCount=5 → DLQ                        │    │
│  │  ├── Payment Queue: maxReceiveCount=3 → DLQ                      │    │
│  │  └── Notification Queue: maxReceiveCount=10 → DLQ                │    │
│  │                                                                  │    │
│  │  EventBridge                                                     │    │
│  │  ├── Retry policy: 3 retries                                     │    │
│  │  └── DLQ for failed events                                       │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─── DR ───────────────────────────────────────────────────────────┐    │
│  │  Strategy: Pilot Light                                           │    │
│  │  ├── Aurora Global Database (always replicating)                 │    │
│  │  ├── DynamoDB Global Tables (active-active)                      │    │
│  │  ├── ECS task definitions ready (desired_count = 0)              │    │
│  │  ├── Route 53 failover routing                                   │    │
│  │  └── Failover automation: Step Functions + Lambda                │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Anti-patterns

| Anti-pattern | Vấn đề | Cách khắc phục |
|-------------|--------|---------------|
| **No health checks** | Container crash nhưng vẫn nhận traffic | Luôn có liveness + readiness probes |
| **Same scaling metric cho mọi service** | CPU-based scaling cho I/O-bound service → scale không hiệu quả | Chọn metric phù hợp workload (SQS depth, RPS, custom) |
| **Scale in quá nhanh** | Flapping: scale out → scale in → scale out liên tục | Scale in cooldown ≥ 300s, stabilization window |
| **Không test DR** | DR plan trên giấy, thực tế không hoạt động | Game Day hàng quý, automated DR testing |
| **Retry everything** | Retry non-idempotent operations → duplicate data | Chỉ retry idempotent operations, dùng idempotency key |
| **Circuit Breaker mở quá sớm** | 1-2 lỗi → open circuit → service unavailable | Threshold đủ cao (5-10 errors), window đủ dài (30-60s) |
| **Single NAT Gateway** | NAT GW single AZ down → tất cả private subnets mất internet | 1 NAT GW per AZ |
| **No DLQ** | Failed messages mất vĩnh viễn, không retry được | Luôn có DLQ cho SQS, Lambda async, EventBridge |
| **Over-provisioned "just in case"** | Chi phí cloud phình to không cần thiết | Right-sizing, auto scaling, Spot instances |

---

## 10. Checklist triển khai

### Auto Scaling

- [ ] ECS/EKS services có auto scaling policy (Target Tracking)
- [ ] Scale out cooldown ≤ 60s, scale in cooldown ≥ 300s
- [ ] Min capacity đủ cho baseline traffic
- [ ] Max capacity đủ cho peak traffic (+ buffer 20%)
- [ ] Custom metrics cho business-specific scaling (SQS depth, RPS)
- [ ] Lambda reserved concurrency cho critical functions
- [ ] Provisioned Concurrency cho latency-sensitive Lambda

### High Availability

- [ ] Services deploy trên ≥ 2 AZs
- [ ] Aurora Multi-AZ enabled
- [ ] ElastiCache Multi-AZ + automatic failover
- [ ] NAT Gateway per AZ
- [ ] ALB cross-zone load balancing enabled

### Resilience Patterns

- [ ] Circuit Breaker được cấu hình ở application-level hoặc service layer
- [ ] Retry policy cho mỗi service-to-service call
- [ ] Timeout configured (connection + request timeout)
- [ ] DLQ cho tất cả SQS queues
- [ ] Fallback strategy cho critical dependencies

### Health Check

- [ ] Container health check (liveness)
- [ ] ALB target group health check (readiness)
- [ ] Health check endpoint kiểm tra dependencies
- [ ] Startup grace period cho slow-starting services

### Disaster Recovery

- [ ] DR strategy đã chọn (Pilot Light / Warm Standby / Active-Active)
- [ ] Database replication cross-region (Aurora Global / DynamoDB Global Tables)
- [ ] Route 53 failover routing configured
- [ ] DR runbook documented và tested
- [ ] Game Day scheduled hàng quý

### Chaos Engineering

- [ ] FIS experiment templates cho common failures
- [ ] Stop conditions defined (CloudWatch alarms)
- [ ] Chaos testing chạy trên staging thường xuyên
- [ ] Findings documented và action items tracked

---

## 11. Tổng kết

```
┌───────────────────────────────────────────────────────────────────┐
│             RESILIENCE DECISION GUIDE trên AWS                    │
│                                                                   │
│  Auto Scaling:                                                    │
│  • ECS: Target Tracking (CPU 70%) + custom metric (SQS/RPS)       │
│  • EKS: HPA (Pod) + Karpenter (Node) + KEDA (event-driven)        │
│  • Lambda: Reserved + Provisioned Concurrency cho critical        │
│                                                                   │
│  High Availability:                                               │
│  • Minimum: Multi-AZ (99.99% SLA)                                 │
│  • Critical: Multi-Region (99.999% SLA)                           │
│  • Always: ALB + Health Check + Auto Scaling                      │
│                                                                   │
│  Resilience Patterns:                                             │
│  • Platform-level: Service layer policy + app-level resilience     │
│  • Application-level: Custom fallback, graceful degradation       │
│  • Async: SQS + DLQ cho error isolation                           │
│  • Edge: WAF + API Gateway throttling cho rate limiting           │
│                                                                   │
│  Disaster Recovery:                                               │
│  • Non-critical: Backup & Restore ($)                             │
│  • Business apps: Pilot Light ($$)                                │
│  • Critical: Warm Standby ($$$)                                   │
│  • Mission-critical: Active-Active ($$$$)                         │
│                                                                   │
│  Chaos Engineering:                                               │
│  • AWS FIS cho managed experiments                                │
│  • Game Day hàng quý                                              │
│  • Start staging → production (tăng blast radius dần)             │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Key takeaways:**

1. **Auto Scaling là bắt buộc** — không manual scale trên cloud, chọn metric phù hợp workload
2. **Multi-AZ là minimum** — mọi production service phải Multi-AZ, cost thêm rất ít
3. **Không phụ thuộc 1 công cụ** cho platform-level resilience — ưu tiên service layer hiện hành + app-level logic
4. **Health Check ở mọi tầng** — Container, ALB, Route 53, mỗi tầng có mục đích khác nhau
5. **Chaos Engineering là văn hóa** — không phải one-time activity, cần Game Day định kỳ
6. **DR phải test thường xuyên** — DR plan chưa test = không có DR plan

---

## 12. Liên kết liên quan

- [10 — Resilience Patterns](10-resilience-patterns.md) — Lý thuyết Circuit Breaker, Retry, Bulkhead, Fallback
- [18 — Triển khai & Kiến trúc tổng quan](18-aws-deployment-architecture.md) — ECS vs EKS vs Lambda, IaC
- [19 — Communication & Service Discovery trên AWS](19-aws-communication-discovery.md) — Service Connect, VPC Lattice, SQS/SNS, EventBridge
- [20 — Data Management trên AWS](20-aws-data-management.md) — Aurora Global Database, DynamoDB Global Tables
- [22 — Observability trên AWS](22-aws-observability.md) — Monitoring, alerting cho resilience
- [23 — Security trên AWS](23-aws-security.md) — WAF, Shield, network isolation
- [25 — Case Study: E-Commerce](25-case-study-ecommerce.md) — Áp dụng tổng hợp
