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

```d2 title="1. Giới thiệu"
direction: right
scaling: Auto Scaling {
 ecs: ECS Service Scaling — Target Tracking / Step
 eks: EKS — HPA / VPA / Karpenter cho Pod-Node
 lambda: Lambda — Auto concurrency / Reserved-Provisioned settings
 aurora: Aurora — Read Replica Auto Scaling
 dynamo: DynamoDB — Provisioned RCU-WCU Auto Scaling
}
resilience: Resilience Patterns {
 policies: Service Connect / VPC Lattice / Istio — Policies tùy khả năng
 gateway: API Gateway — Rate Limit / Throttle
 lb: ALB / NLB — Health Check / Failover
 dns: Route53 — DNS Failover / Health Check
 dlq: SQS DLQ — Async Failure Handling
}
dr: Disaster Recovery {
 az: Multi-AZ — High Availability
 region: Multi-Region — DR / Global Users
 dns: Route53 DNS Failover
 s3: S3 Cross-Region Replication
 aurora: Aurora Global Database
 dynamo: DynamoDB Global Tables — Multi-Region
}
chaos: Chaos Engineering {
 fis: AWS FIS — Managed Experiments
 gameday: Game Day — Planned Failure Drills
}
# Icons: https://icons.d2lang.com/
scaling.aurora.icon: "https://icons.d2lang.com/aws/Database/Amazon-Aurora.svg"
scaling.dynamo.icon: "https://icons.d2lang.com/aws/Database/Amazon-DynamoDB.svg"
resilience.dlq.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Queue-Service-SQS.svg"
dr.dns.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-Route-53.svg"
dr.s3.icon: "https://icons.d2lang.com/aws/Storage/Amazon-Simple-Storage-Service-S3.svg"
dr.aurora.icon: "https://icons.d2lang.com/aws/Database/Amazon-Aurora.svg"
dr.dynamo.icon: "https://icons.d2lang.com/aws/Database/Amazon-DynamoDB.svg"
scaling.icon: "https://icons.d2lang.com/aws/Management%20%26%20Governance/AWS-Auto-Scaling.svg"
```

Multi-AZ không tự bảo đảm99.99% availability cho cả ứng dụng; SLO còn phụ thuộc service, cấu hình và đường request end-to-end. Replication không thay thế backup độc lập và restore drill.

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

```d2 title="2.2. EKS Auto Scaling (Karpenter & HPA/VPA)"
direction: right
metrics: "CPU / Memory / Prometheus custom metrics"
hpa: "HPA — scale Pod count"
vpa: "VPA — usage analysis\nRecommend / Adjust resource requests theo policy"
pending: "Pods Pending — thiếu node resources"
karpenter: "Karpenter — provision/right-size/consolidate\nOn-Demand / Spot"
ca: "Cluster Autoscaler alternative\nScale ASG / Node Groups"
metrics -> hpa
metrics -> vpa
hpa -> pending
vpa -> pending: "Nếu cần reschedule/resize"
pending -> karpenter: "Chọn node autoscaler phù hợp"
pending -> ca: "Alternative"
```

HPA và node autoscaler làm việc ở hai lớp khác nhau. Thời gian<60s hay2–5phút là ví dụ, không cam kết; không cấu hình cả hai controllers cùng quản lý một capacity pool một cách xung đột.

#### HPA — Horizontal Pod Autoscaler

```annotated source="snippets/hpa-horizontal-pod-autoscaler.yaml"
title: "HPA: scale nhanh, thu hẹp có kiểm soát"
language: yaml
code: |-
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
annotations:
  - id: note-1
    title: Workload đích và biên replica
    description: HPA điều chỉnh Deployment được tham chiếu trong khoảng minReplicas và maxReplicas.
    ranges: [[8, 13]]
  - id: note-2
    title: Behavior khác nhau giữa scale up và scale down
    description: Stabilization window và policies hạn chế dao động; số liệu là ví dụ chứ không phải SLO.
    ranges: [[14, 30]]
  - id: note-3
    title: Hai loại metric
    description: CPU utilization cần resource requests; metric Pods tùy chỉnh cần metrics adapter và pipeline thu thập tương ứng.
    ranges: [[31, 44]]
source:
  project: 21-aws-resilience
  snapshot: article
  file: snippets/hpa-horizontal-pod-autoscaler.yaml
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

```d2 title="2.3. Lambda Concurrency & Scaling"
direction: right
lambda: Lambda Concurrency {
 unreserved: Unreserved — shared account pool
 reserved: Reserved — ví dụ Payment200 / reservation và upper cap
 provisioned: Provisioned — pre-warm execution environments / billed
}
# Icons: https://icons.d2lang.com/
lambda.icon: "https://icons.d2lang.com/aws/Compute/AWS-Lambda.svg"
```

Account concurrency ví dụ1.000 có thể khác theo account/region/quota. Reserved không phải pre-warming; Provisioned giảm cold-start cho lượng provisioned, không loại bỏ mọi cold-start/initialization khi spillover hoặc deployment. Burst/scaling rates phụ thuộc hiện hành, không dùng các mốc3.000/1.000/+500phút cũ như guarantee.

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

```d2 title="3.1. Multi-AZ — High Availability trong Region"
direction: down
region: ap-southeast-1 {
 alb: ALB — Cross-zone enabled / Healthy targets
 a: AZ1a {
  tasks: Order ECS Tasks ×3
  aurora: Aurora Writer
  redis: ElastiCache Primary
  nat: NAT Gateway
 }
 b: AZ1b {
  tasks: Order ECS Tasks ×3
  aurora: Aurora Reader
  redis: ElastiCache Replica
  nat: NAT Gateway
 }
 c: AZ1c {
  tasks: Order ECS Tasks ×2
  aurora: Aurora Reader
  redis: ElastiCache Replica
  nat: NAT Gateway
 }
 alb -> a.tasks
 alb -> b.tasks
 alb -> c.tasks
 a.redis -> b.redis: Replication
 a.redis -> c.redis: Replication
 storage: Aurora Cluster Storage — replicated / shared
 a.aurora -- storage
 b.aurora -- storage
 c.aurora -- storage
}
# Icons: https://icons.d2lang.com/
region.a.aurora.icon: "https://icons.d2lang.com/aws/Database/Amazon-Aurora.svg"
region.a.redis.icon: "https://icons.d2lang.com/aws/Database/Amazon-ElastiCache.svg"
region.b.aurora.icon: "https://icons.d2lang.com/aws/Database/Amazon-Aurora.svg"
region.b.redis.icon: "https://icons.d2lang.com/aws/Database/Amazon-ElastiCache.svg"
region.c.aurora.icon: "https://icons.d2lang.com/aws/Database/Amazon-Aurora.svg"
region.c.redis.icon: "https://icons.d2lang.com/aws/Database/Amazon-ElastiCache.svg"
region.a.nat.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-VPC_NAT-Gateway_light-bg.svg"
region.b.nat.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-VPC_NAT-Gateway_light-bg.svg"
region.c.nat.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-VPC_NAT-Gateway_light-bg.svg"
```

Aurora instances trong cùng cluster dùng shared distributed storage; không diễn tả readers như một chain writer→reader→reader replication. NAT per-AZ phục vụ egress, cần route tables/policy phù hợp.

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

```d2 title="3.2. Multi-Region — Disaster Recovery & Global Users"
direction: down
route: Route53 — Health-check-based DNS Failover
primary: ap-southeast-1 — Primary {
 cluster: ECS / EKS — Svc A / B / C / D
 aurora: Aurora Primary — Read/Write
 dynamo: DynamoDB — Read/Write
 s3: S3 Bucket
}
dr: ap-northeast-1 — DR {
 cluster: ECS / EKS — Svc A / B standby
 aurora: Aurora Secondary — Read-only trước promotion
 dynamo: DynamoDB Global Table replica
 s3: S3 Replica
}
route -> primary.cluster: Primary DNS target
route -> dr.cluster: Secondary khi DR ready / Policy failover
primary.aurora -> dr.aurora: Global Database async replication
primary.dynamo <-> dr.dynamo: Global Tables theo consistency/topology đã chọn
primary.s3 -> dr.s3: Cross-Region Replication
# Icons: https://icons.d2lang.com/
route.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-Route-53.svg"
primary.aurora.icon: "https://icons.d2lang.com/aws/Database/Amazon-Aurora.svg"
primary.dynamo.icon: "https://icons.d2lang.com/aws/Database/Amazon-DynamoDB.svg"
primary.s3.icon: "https://icons.d2lang.com/aws/Storage/Amazon-Simple-Storage-Service-S3.svg"
dr.aurora.icon: "https://icons.d2lang.com/aws/Database/Amazon-Aurora.svg"
dr.dynamo.icon: "https://icons.d2lang.com/aws/Database/Amazon-DynamoDB.svg"
dr.s3.icon: "https://icons.d2lang.com/aws/Storage/Amazon-Simple-Storage-Service-S3.svg"
```

Replication lag/RPO tùy dịch vụ và cấu hình, không bảo đảm mọi async replica luôn<1s. DNS failover không tự promote DB hay tạo compute; cần DR readiness/orchestration riêng.

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

```d2 title="4.1. Circuit Breaker ở service layer (ưu tiên non-App-Mesh)"
direction: right
order: Order Service {
 app: Application
 envoy: Envoy — Outlier detection / Retry / Timeout / Resource circuit limits
 app -> envoy
}
payment: Payment Service {
 envoy: Envoy — Health / Rate policies theo deployment
 app: Application
 envoy -> app
}
control: Service-layer control plane / API / Terraform
control -> order.envoy: Configure policy
control -> payment.envoy: Configure policy
order.envoy -> payment.envoy: Service request
```

Envoy/App Mesh là mô hình legacy tham khảo trong hình cũ; ưu tiên non-App-Mesh alternatives của bài. Proxy circuit limits/outlier detection không hoàn toàn đồng nghĩa application-level state-machine CB/fallback.

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

```d2 title="4.3. Bulkhead trên AWS"
direction: right
bulkheads: AWS Bulkhead Layers {
 infra: Infrastructure {
  ecs: Separate ECS Services / Tasks
  eks: EKS namespaces + Resource Quotas
  lambda: Lambda Reserved Concurrency per function
  network: Separate VPCs / Subnets cho critical workloads
 }
 service: Service {
  pools: Per-dependency connection/concurrency pools
  alb: Target Group per service
  api: Per-client Gateway usage policies
  queues: Separate SQS queues per workload
 }
 db: Database {
  owner: Database per Service
  aurora: Aurora per-service connection limits
  dynamo: Separate DynamoDB tables theo boundary
  cache: Separate critical ElastiCache clusters
 }
}
# Icons: https://icons.d2lang.com/
bulkheads.infra.lambda.icon: "https://icons.d2lang.com/aws/Compute/AWS-Lambda.svg"
bulkheads.db.icon: "https://icons.d2lang.com/essentials/117-database.svg"
bulkheads.db.aurora.icon: "https://icons.d2lang.com/aws/Database/Amazon-Aurora.svg"
```

### 4.4. Rate Limiting trên AWS

```d2 title="4.4. Rate Limiting trên AWS"
direction: right
edge: "Layer1 CloudFront + WAF\nIP rate rule ví dụ2.000req/5phút"
api: "Layer2 API Gateway\nPer-client usage/throttle\nVí dụ50req/s sustained, burst100\nAccount quota ví dụ10.000req/s"
alb: "Layer3 ALB + WAF\nIP / Header-based rules"
app: "Layer4 Application\nRedis Token Bucket / Sliding Window\nPer-user / Tenant / API-key"
edge -> api
api -> alb
alb -> app
```

Đây là logical protection layers; không mọi request cần đi qua cả API Gateway lẫn ALB/WAF layer. API type, account/region quotas và WAF rule windows phải kiểm tra khi triển khai.

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
# Icons: https://icons.d2lang.com/
redis.icon: "https://icons.d2lang.com/dev/redis.svg"
s3.icon: "https://icons.d2lang.com/aws/Storage/Amazon-Simple-Storage-Service-S3.svg"
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

```d2 title="7.1. Bốn chiến lược DR"
direction: right
backup: "Backup & Restore\nRTO giờ / RPO giờ\nCost thấp • S3 backups / AMIs\nKhông warm compute"
pilot: "Pilot Light\nRTO10–30phút / RPO phút\nDB replica • Min core compute"
warm: "Warm Standby\nRTO phút / RPO giây\nScaled-down compute đang chạy"
active: "Active-Active\nRTO/RPO mục tiêu gần0\nFull capacity cả hai regions"
backup -> pilot
pilot -> warm
warm -> active
```

Chi phí/capacity thường tăng từ trái sang phải, recovery targets thường ngắn hơn. Các RTO/RPO là ví dụ mục tiêu, cần đo qua DR drills; active-active không tự bảo đảm RPO0 hay loại bỏ mọi failover gap.

### 7.2. DR cho Microservice — Thiết kế chi tiết

#### Pilot Light — Phổ biến nhất cho Microservice

```d2 title="Pilot Light — Phổ biến nhất cho Microservice"
direction: right
primary: Primary Region {
 cluster: ECS ACTIVE — Order×5 / Payment×3 / Notification×3
 aurora: Aurora Primary — Read/Write
 dynamo: DynamoDB — Read/Write
 redis: ElastiCache Primary
 s3: S3
 secrets: Secrets Manager
}
dr: DR Region {
 cluster: ECS desired_count0 — task defs / ECR images sẵn
 aurora: Aurora Replica — Always on / Read-only trước promotion
 dynamo: DynamoDB Replica — Always on
 redis: Cache chưa tạo / Cold
 s3: S3 Replica
 secrets: Replicated Secrets
}
primary.aurora -> dr.aurora: Global DB — Async
primary.dynamo <-> dr.dynamo: Global Tables
primary.s3 -> dr.s3: Cross-Region Replication
primary.secrets -> dr.secrets: Secret replication
# Icons: https://icons.d2lang.com/
primary.aurora.icon: "https://icons.d2lang.com/aws/Database/Amazon-Aurora.svg"
primary.dynamo.icon: "https://icons.d2lang.com/aws/Database/Amazon-DynamoDB.svg"
primary.redis.icon: "https://icons.d2lang.com/aws/Database/Amazon-ElastiCache.svg"
primary.s3.icon: "https://icons.d2lang.com/aws/Storage/Amazon-Simple-Storage-Service-S3.svg"
primary.secrets.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Secrets-Manager.svg"
dr.dynamo.icon: "https://icons.d2lang.com/aws/Database/Amazon-DynamoDB.svg"
dr.s3.icon: "https://icons.d2lang.com/aws/Storage/Amazon-Simple-Storage-Service-S3.svg"
```

Pilot Light flow minh họa: health failure → Step Functions/Lambda promote DB, scale ECS từ0 lênN, tạo/warm cache, verify readiness rồi đổi DNS về DR ALB. Redis trong ví dụ không cross-region replicate, không phải mọi ElastiCache deployment đều bắt buộc như vậy. RTO10–30phút là mục tiêu cần kiểm nghiệm.

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

```d2 title="7.3. Failover tự động với Route 53"
direction: down
health: "Route53 health checker — kiểm tra primary /health"
primary: "Primary healthy → DNS target Primary ALB"
bad: "3 consecutive failures theo ví dụ → UNHEALTHY"
alarm: "CloudWatch Alarm → SNS PagerDuty/Slack"
event: "EventBridge Rule / Configured integration"
workflow: "Step Functions\nPromote DB • Scale ECS DR • Warm caches"
ready: "Verify DR readiness"
route: "DNS Failover tới DR ALB"
health -> primary: "Healthy"
health -> bad: "Fail threshold"
bad -> alarm
alarm -> event
event -> workflow
workflow -> ready
ready -> route
# Icons: https://icons.d2lang.com/
health.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-Route-53.svg"
workflow.icon: "https://icons.d2lang.com/aws/Application%20Integration/AWS-Step-Functions.svg"
```

Control-plane automation và DNS failover phải được phối hợp/config riêng. DNS/cache TTL khiến traffic switch không tức thời; không chuyển users vào DR chưa sẵn sàng.

---

## 8. Ví dụ thực tế — E-Commerce Resilience Architecture

```d2 title="8. Ví dụ thực tế — E-Commerce Resilience Architecture"
direction: down
edge: "Edge — CloudFront / WAF / Shield\nVí dụ2.000req/5phút/IP • S3 maintenance fallback"
api: "Regional API Gateway\nVí dụ1.000req/s/client • Free/Pro/Enterprise tiers\nJWT Lambda Authorizer"
services: ECS Fargate + Service Connect {
 order: "Order min3/max20\nTimeout15s • Retry2 • CB policy ví dụ5err/30s"
 payment: "Payment min2/max15\nTimeout30s • Retry1 • CB policy ví dụ3err/30s"
 inventory: "Inventory min2/max10\nTimeout10s • Retry3 • CB policy ví dụ5err/30s"
}
data: Data {
 aurora: Aurora Multi-AZ / Readers2 / Autoscale1–5 / Global Database
 dynamo: DynamoDB On-Demand / Global Tables / PITR
 redis: ElastiCache Multi-AZ — Product fallback / Sessions
}
async: Async {
 queues: SQS per-service + DLQ — maxReceiveCount Order5/Payment3/Notification10
 bridge: EventBridge retry/DLQ theo rule policy
}
dr: Pilot Light — replicated DBs / ECS desired0 / Route53 / Step Functions
edge -> api -> services
services -- data: Theo ownership / Query needs
services -- async: Events / Queue work
 data -- dr: Replication / Recovery
# Icons: https://icons.d2lang.com/
async.bridge.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-EventBridge.svg"
```

Auto Scaling ví dụ CPU target70%, scale-out cooldown60s, scale-in300s. Các proxy/CB numbers là logical policy, không mặc định mọi knob được Service Connect expose. DB failover~30s, retry counts, concurrency và quotas không phải SLA; đo/kiểm chứng cấu hình thực tế.

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
