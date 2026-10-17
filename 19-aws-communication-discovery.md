# Communication & Service Discovery trên AWS

## 📋 Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
- [2. Ingress — Client-to-Service Communication](#2-ingress--client-to-service-communication)
  - [2.1. Amazon API Gateway](#21-amazon-api-gateway)
  - [2.2. ALB (Application Load Balancer) làm API Gateway](#22-alb-application-load-balancer-làm-api-gateway)
  - [2.3. API Gateway vs ALB — Chọn cái nào?](#23-api-gateway-vs-alb--chọn-cái-nào)
  - [2.4. CloudFront + API Gateway/ALB — Edge Layer](#24-cloudfront--api-gatewayalb--edge-layer)
  - [2.5. BFF Pattern trên AWS](#25-bff-pattern-trên-aws)
- [3. Synchronous — Service-to-Service Communication](#3-synchronous--service-to-service-communication)
  - [3.1. Internal ALB](#31-internal-alb)
  - [3.2. ECS Service Connect](#32-ecs-service-connect)
  - [3.3. AWS Cloud Map](#33-aws-cloud-map)
  - [3.4. VPC Lattice](#34-vpc-lattice)
  - [3.5. App Mesh (Legacy, EoS 30/09/2026)](#35-app-mesh-legacy-eos-30092026)
  - [3.6. So sánh các phương pháp Sync](#36-so-sánh-các-phương-pháp-sync)
- [4. Asynchronous Communication trên AWS](#4-asynchronous-communication-trên-aws)
  - [4.1. Amazon SQS — Message Queue](#41-amazon-sqs--message-queue)
  - [4.2. Amazon SNS — Pub/Sub](#42-amazon-sns--pubsub)
  - [4.3. SQS + SNS — Fanout Pattern](#43-sqs--sns--fanout-pattern)
  - [4.4. Amazon EventBridge — Event Bus](#44-amazon-eventbridge--event-bus)
  - [4.5. Amazon MSK (Managed Kafka)](#45-amazon-msk-managed-kafka)
  - [4.6. SQS vs SNS vs EventBridge vs MSK — Chọn cái nào?](#46-sqs-vs-sns-vs-eventbridge-vs-msk--chọn-cái-nào)
- [5. Patterns thực tế trên AWS](#5-patterns-thực-tế-trên-aws)
  - [5.1. Choreography với EventBridge](#51-choreography-với-eventbridge)
  - [5.2. Orchestration với Step Functions](#52-orchestration-với-step-functions)
  - [5.3. Outbox Pattern trên AWS](#53-outbox-pattern-trên-aws)
  - [5.4. Dead Letter Queue (DLQ)](#54-dead-letter-queue-dlq)
  - [5.5. FIFO vs Standard Queue](#55-fifo-vs-standard-queue)
- [6. Ví dụ thực tế — E-Commerce Communication Map](#6-ví-dụ-thực-tế--e-commerce-communication-map)
- [7. Anti-patterns](#7-anti-patterns)
- [8. Checklist triển khai](#8-checklist-triển-khai)
- [9. Tổng kết](#9-tổng-kết)
- [10. Liên kết liên quan](#10-liên-kết-liên-quan)

---

## 1. Giới thiệu

Trong [doc 18](18-aws-deployment-architecture.md), chúng ta đã thiết lập **nền tảng**: VPC, compute (ECS/EKS/Lambda), networking. Câu hỏi tiếp theo: **Các service giao tiếp với nhau thế nào trên AWS?**

Doc này áp dụng kiến thức từ doc [06 — Inter-Service Communication](06-inter-service-communication.md), [07 — API Gateway](07-api-gateway.md), [08 — Service Discovery](08-service-discovery.md) vào thực tế AWS — mapping từng pattern lý thuyết sang AWS service cụ thể.

```d2 title="1. Giới thiệu"
direction: right
ingress: Client → Service Ingress {
 apigw: API Gateway — REST / WebSocket
 alb: ALB — HTTP Routing
 cf: CloudFront — CDN / Edge
}
sync: Service → Service Sync {
 alb: Internal ALB — HTTP Routing
 connect: ECS Service Connect — ECS Native
 map: Cloud Map — DNS Discovery
 lattice: VPC Lattice — Cross-VPC / Cross-Account
 mesh: App Mesh — Legacy Envoy Mesh
}
async: Service → Service Async {
 sqs: SQS — Point-to-Point Queue
 sns: SNS — Pub/Sub Fan-out
 events: EventBridge — Bus / Routing Rules
 msk: MSK Kafka — Streaming / Replay
 workflow: Step Functions — Workflow Orchestration
}
# Icons: https://icons.d2lang.com/
ingress.alb.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Elastic-Load-Balancing-ELB_Application-load-balancer_light-bg.svg"
sync.alb.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Elastic-Load-Balancing-ELB_Application-load-balancer_light-bg.svg"
sync.connect.icon: "https://icons.d2lang.com/aws/Compute/Amazon-Elastic-Container-Service.svg"
sync.map.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/AWS-Cloud-Map.svg"
async.sqs.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Queue-Service-SQS.svg"
async.sns.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Notification-Service-SNS.svg"
async.workflow.icon: "https://icons.d2lang.com/aws/Application%20Integration/AWS-Step-Functions.svg"
sync.mesh.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/AWS-App-Mesh.svg"
```

---

## 2. Ingress — Client-to-Service Communication

### 2.1. Amazon API Gateway

**API Gateway** (APIGW) — managed service cho REST, HTTP, và WebSocket APIs.

```d2 title="2.1. Amazon API Gateway"
direction: down
rest: REST API {
 gateway: API Gateway REST
 user: User Lambda
 order: Order ECS — VPC integration
 product: Product ECS — ALB integration
 gateway -> user: GET /users/id — POST /users
 gateway -> order: POST /orders
 gateway -> product: GET /products
}
http: HTTP API v2 — JWT Authorizer / CORS / Lightweight
websocket: WebSocket API {
 connect: Connect route
 lambda: Lambda handlers
 db: DynamoDB connection store
 disconnect: Disconnect route — cleanup
 connect -> lambda -> db
 disconnect -> lambda
}
# Icons: https://icons.d2lang.com/
rest.user.icon: "https://icons.d2lang.com/aws/Compute/AWS-Lambda.svg"
websocket.lambda.icon: "https://icons.d2lang.com/aws/Compute/AWS-Lambda.svg"
websocket.db.icon: "https://icons.d2lang.com/aws/Database/Amazon-DynamoDB.svg"
```

REST API có usage plans/API keys, validation, stage response cache, Cognito authorizer, custom domain/WAF integrations theo support. HTTP API ít tính năng quản trị hơn nhưng thường rẻ hơn; tỷ lệ tiết kiệm phụ thuộc pricing/usage, không cố định70%. WebSocket phục vụ chat/notifications/live updates; custom routes dùng handlers.

**3 loại API Gateway:**

| Loại | Giá | Use case | Giới hạn |
|------|-----|----------|----------|
| **REST API** | $3.50/triệu requests | Full-featured: caching, validation, usage plans, WAF | 10,000 req/s (regional) |
| **HTTP API** | $1.00/triệu requests | Simple proxy, JWT auth, CORS — đủ dùng hầu hết | 10,000 req/s |
| **WebSocket API** | $1.00/triệu messages | Real-time bidirectional | 500 connections/s |

**Integration types — APIGW connect tới backend thế nào?**

| Type | Mô tả | Khi nào dùng |
|------|-------|-------------|
| **Lambda** | Invoke Lambda function | Serverless backend |
| **HTTP/HTTP_PROXY** | Forward tới HTTP endpoint (ALB, ECS, external) | Container services |
| **VPC Link** | Connect tới private resources trong VPC | ECS/EKS private subnets |
| **AWS Service** | Gọi thẳng AWS service (SQS, Step Functions, DynamoDB) | Bỏ qua Lambda, giảm latency + cost |
| **Mock** | Trả response cố định | Testing, stub APIs |

> 💡 **Pro tip**: APIGW → SQS integration (không qua Lambda) rất mạnh cho write-heavy APIs. Client POST → APIGW → SQS → consumer xử lý async. Giảm latency, tăng throughput, không cần Lambda trung gian.

### 2.2. ALB (Application Load Balancer) làm API Gateway

ALB không phải "API Gateway" theo đúng nghĩa, nhưng có thể đóng vai trò tương tự cho nhiều use cases:

```d2 title="2.2. ALB (Application Load Balancer) làm API Gateway"
direction: right
alb: "ALB — Listener Rules theo priority"
user: "Target Group User"
order: "Target Group Order"
product: "Target Group Product"
payment: "Target Group Payment"
default: "Default fixed response404"
alb -> user: "Host api.shopvn.com + /users/*"
alb -> order: "/orders/*"
alb -> product: "/products/*"
alb -> payment: "/payments/*"
alb -> default: "Không match"
# Icons: https://icons.d2lang.com/
alb.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Elastic-Load-Balancing-ELB_Application-load-balancer_light-bg.svg"
```

Hỗ trợ path/host/header/query routing, weighted target groups, sticky sessions, target-group health checks, gRPC/HTTP2 và Cognito/OIDC listener authentication theo protocol/configuration.

### 2.3. API Gateway vs ALB — Chọn cái nào?

| Tiêu chí | API Gateway (HTTP API) | ALB |
|----------|----------------------|-----|
| **Giá** | $1.00/triệu requests | ~$22/tháng + $0.008/LCU-hour |
| **Request limit** | 10,000 req/s (soft) | Hàng triệu req/s |
| **Payload limit** | 10MB | Không giới hạn |
| **Timeout** | 30s (REST) / 30s (HTTP) | 4000s |
| **WebSocket** | Có (WebSocket API) | Có |
| **gRPC** | Không | Có |
| **Rate limiting** | Có (Usage Plans, throttling) | Không native (cần WAF) |
| **Request validation** | Có (JSON Schema) | Không |
| **Caching** | Có (REST API) | Không |
| **Auth built-in** | Cognito, Lambda authorizer | Cognito, OIDC |
| **Lambda integration** | Native | Có |
| **Custom domain** | Có | Có (Route 53) |

**Decision:**

```
┌─ Dùng API Gateway khi:
│  • Backend là Lambda (natural fit)
│  • Cần rate limiting per client (API keys, usage plans)
│  • Cần request validation, caching
│  • Cần WebSocket
│  • Traffic < 10K req/s
│
├─ Dùng ALB khi:
│  • Backend là ECS/EKS containers
│  • Cần gRPC
│  • Traffic cao, không muốn per-request pricing
│  • Cần long-running connections (timeout > 30s)
│  • Đơn giản — chỉ cần routing
│
└─ Kết hợp cả hai:
   • CloudFront → API Gateway (public APIs, rate limiting)
   • API Gateway → VPC Link → ALB → ECS (private routing)
   • Hoặc: CloudFront → ALB trực tiếp (simple, high throughput)
```

### 2.4. CloudFront + API Gateway/ALB — Edge Layer

```d2 title="2.4. CloudFront + API Gateway/ALB — Edge Layer"
direction: right
n1: "Client"
n2: "CloudFront"
n3: "API Gateway"
n4: "S3 Bucket"
n5: "Internal ALB"
n6: "User Service"
n7: "Order Service"
n1 -> n2
n2 -> n3: "Cache miss"
n2 -> n4: "Static assets"
n3 -> n5: "VPC Link"
n5 -> n6
n5 -> n7
# Icons: https://icons.d2lang.com/
n2.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-CloudFront.svg"
n3.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-API-Gateway.svg"
n4.icon: "https://icons.d2lang.com/aws/Storage/Amazon-Simple-Storage-Service-S3.svg"
n5.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Elastic-Load-Balancing-ELB_Application-load-balancer_light-bg.svg"
```

**Tại sao đặt CloudFront trước?**

- **Caching** — cache GET responses ở edge, giảm 60-80% traffic tới backend
- **DDoS protection** — AWS Shield Standard miễn phí, Shield Advanced cho L7
- **Global acceleration** — user ở HCM connect tới edge gần nhất, giảm latency
- **SSL termination** — free SSL certificate qua ACM
- **WAF** — attach WAF ở CloudFront level, filter trước khi vào backend

### 2.5. BFF Pattern trên AWS

> 🔗 Xem lý thuyết BFF tại [doc 07 — API Gateway](07-api-gateway.md#4-bff-pattern--backend-for-frontend)

```d2 title="2.5. BFF Pattern trên AWS"
direction: right
web: "Web App"
mobile: "Mobile App"
wbff: "Web BFF — API Gateway + Lambda/ECS\nFull product detail • Pagination"
mbff: "Mobile BFF — API Gateway + Lambda/ECS\nCompact • Optimized images • Offline-friendly"
backend: "Shared Backend Services\nUser / Product / Order"
web -> wbff
mobile -> mbff
wbff -> backend
mbff -> backend
# Icons: https://icons.d2lang.com/
mobile.icon: "https://icons.d2lang.com/tech/052-smartphone-3.svg"
```

Aggregation/client-specific logic nằm ở BFF compute/integration tương ứng; API Gateway không mặc định tự thực thi mọi business aggregation.

**Triển khai BFF trên AWS:**

| Option | Mô tả | Phù hợp khi |
|--------|-------|-------------|
| **Separate API Gateway stages** | 1 API Gateway, 2 stages (web/mobile) | Simple, ít khác biệt |
| **Separate API Gateways** | 2 API Gateways riêng biệt | Khác biệt lớn, team riêng |
| **AppSync (GraphQL)** | Thay cả 2 BFF bằng GraphQL — client tự query fields cần | Mobile tự chọn payload, flexible |

---

## 3. Synchronous — Service-to-Service Communication

### 3.1. Internal ALB

Cách **đơn giản nhất** — mỗi service hoặc nhóm services expose qua 1 Internal ALB (không public).

```d2 title="3.1. Internal ALB"
direction: right
order: "Order Service"
payment: "Payment Service"
alb: "Internal ALB — user-alb"
a: "User Service Replica1"
b: "User Service Replica2"
order -> alb: "HTTP"
payment -> alb: "HTTP"
alb -> a
alb -> b
# Icons: https://icons.d2lang.com/
alb.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Elastic-Load-Balancing-ELB_Application-load-balancer_light-bg.svg"
```

VPC private subnets; ví dụ URL `http://user-alb.internal.shopvn.com/users/123`, DNS từ Route53 Private Hosted Zone.

**Ưu điểm:** Đơn giản, có health check, load balancing, path routing. Dùng Route 53 Private Hosted Zone cho DNS đẹp.

**Nhược điểm:** Mỗi ALB ~$22/tháng. Nếu tạo ALB riêng cho từng service (10 services = 10 ALBs = $220/tháng) thì tốn kém không cần thiết. Thực tế, **1 ALB serve được nhiều services** nhờ path/host-based routing rules (tối đa 100 rules per ALB).

**Recommend:** Dùng **1 shared Internal ALB** cho tất cả services, routing bằng path hoặc host-based rules. Chỉ tách ALB riêng khi cần isolate (VD: Payment service — PCI compliance).

### 3.2. ECS Service Connect

**Service Connect** — built-in service discovery + load balancing cho ECS, không cần ALB.

```d2 title="3.2. ECS Service Connect"
direction: right
cluster: ECS + Service Connect {
 order: Order Task {
  app: Order App
  proxy: Service Connect Proxy — Envoy
  app -> proxy: user-service 8080
 }
 user: User Task {
  proxy: Service Connect Proxy
  app: User App
  proxy -> app
 }
 namespace: Cloud Map Namespace — shopvn.local
 order.proxy -> user.proxy: Resolve / LB / Resilience policies
 namespace -- order.proxy: Endpoint configuration
 namespace -- user.proxy
}
# Icons: https://icons.d2lang.com/
cluster.namespace.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/AWS-Cloud-Map.svg"
```

Order gọi `http://user-service:8080/users/123`; proxy được ECS quản lý, thực hiện load balancing và supported timeout/retry behavior. Không giả định mọi Envoy option đều có thể cấu hình trực tiếp qua Service Connect.

**Cách hoạt động:**

1. Khi ECS service bật Service Connect → AWS inject Envoy sidecar vào mỗi task
2. Service register vào **Cloud Map** namespace (VD: `shopvn.local`)
3. App code gọi `http://user-service:8080` → Envoy proxy intercept → resolve qua Cloud Map → load balance tới healthy tasks
4. Tự động retry, timeout, health check — không cần ALB

**Ưu điểm:**
- **Không tốn tiền ALB** — tiết kiệm đáng kể khi nhiều services
- **Zero-config discovery** — services tự register/discover
- **Retry + timeout built-in** — configurable trong ECS service definition
- **Observability** — Envoy proxy emit metrics tự động (request count, latency, error rate)

**Nhược điểm:**
- **ECS only** — không dùng được với Lambda, EKS, external services
- **Sidecar overhead** — thêm ~256MB RAM, ~0.25 vCPU per task
- **Limited features** — so với Istio (không có mTLS, traffic shifting, circuit breaker advanced)

### 3.3. AWS Cloud Map

**Cloud Map** — managed service registry (DNS-based hoặc API-based discovery).

```d2 title="3.3. AWS Cloud Map"
direction: right
map: Cloud Map — shopvn.local {
 user: user-service {
  one: 10.0.11.45 8080 — healthy
  two: 10.0.12.67 8080 — healthy
  three: 10.0.11.89 8080 — unhealthy
 }
 order: order-service { one: 10.0.11.22 8080; two: 10.0.12.33 8080 }
 payment: payment-service { one: 10.0.11.77 8443 }
}
client: Consumer
client -> map: DNS user-service.shopvn.local / DiscoverInstances API
# Icons: https://icons.d2lang.com/
map.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/AWS-Cloud-Map.svg"
```

Ví dụ DNS trả10.0.11.45. DNS routing policy, health behavior và cache TTL quyết định kết quả discovery; không mặc định DNS query và API query có semantics hoàn toàn giống nhau.

**Cloud Map vs Service Connect:**
- Service Connect **dùng** Cloud Map underneath (auto register)
- Cloud Map có thể dùng **standalone** — cho EKS, Lambda, external services
- Cloud Map chỉ làm **discovery** (tìm IP/port), không làm load balancing/retry
- Service Connect = Cloud Map + Envoy proxy (discovery + LB + retry)

### 3.4. VPC Lattice

**VPC Lattice** (GA 2023) — thế hệ mới cho application networking, thay thế dần ALB + Service Connect cho cross-VPC, cross-account.

```d2 title="3.4. VPC Lattice"
direction: right
lattice: VPC Lattice Service Network {
 a: VPC A — Team User { user: User Service — user-svc.lattice.local }
 b: VPC B — Team Order { order: Order Service }
 c: Account B — Team Payment { payment: Payment Service }
 b.order -> a.user: Cross-VPC service access
 b.order -> c.payment: Cross-account access / IAM auth policy
}
# Icons: https://icons.d2lang.com/
lattice.a.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-VPC.svg"
lattice.b.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-VPC.svg"
```

Service Network có thể liên kết nhiều VPC/accounts mà không cần VPC peering/Transit GW cho service access này. Có weighted routing, access logs/metrics và IAM auth khi được cấu hình; URL trong hình là tên minh họa, không phải suffix bắt buộc.

**Khi nào dùng VPC Lattice?**

- Hệ thống **multi-VPC** (mỗi team 1 VPC) — VPC Lattice kết nối mà không cần VPC Peering
- **Multi-account** — cross-account service calls với IAM authentication
- Muốn **thay thế** Transit Gateway + ALB phức tạp bằng 1 service đơn giản
- **Không nên** dùng nếu tất cả services trong 1 VPC — overkill, Service Connect đủ dùng

### 3.5. App Mesh (Legacy, EoS 30/09/2026)

**App Mesh** là AWS managed service mesh với Envoy sidecar.

> ⚠️ **Lưu ý quan trọng (mốc thời gian cụ thể):** Theo tài liệu AWS, **AWS App Mesh sẽ End of Support vào ngày 30/09/2026**. Không nên chọn App Mesh cho workload mới (greenfield). Ưu tiên **ECS Service Connect** hoặc **VPC Lattice** tùy use case.

```d2 title="3.5. App Mesh (Legacy, EoS 30/09/2026)"
direction: down
legacy: App Mesh — Legacy Reference {
 virtual: Virtual Service — user-service
 router: Virtual Router
 v1: Virtual Node v1 { app: User App v1; envoy: Envoy Proxy; app -- envoy }
 v2: Virtual Node v2 { app: User App v2; envoy: Envoy Proxy; app -- envoy }
 virtual -> router
 router -> v1: 90%
 router -> v2: 10% Canary
}
# Icons: https://icons.d2lang.com/
legacy.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/AWS-App-Mesh.svg"
```

Tham khảo kiến trúc cũ: mTLS, traffic shifting, circuit-breaking/resource limits, retry/timeout, access logging và tracing theo proxy policy. Không chọn App Mesh cho triển khai mới; đối chiếu phần lifecycle/alternatives của bài.

### 3.6. So sánh các phương pháp Sync

| Tiêu chí | Internal ALB | Service Connect | Cloud Map | VPC Lattice | App Mesh (legacy) |
|----------|-------------|----------------|-----------|-------------|----------|
| **Complexity** | Rất thấp | Thấp | Thấp | Trung bình | Cao |
| **Chi phí** | ~$22/ALB/tháng | Free (sidecar CPU/RAM) | Free tier generous | Per-request pricing | Free (sidecar CPU/RAM) |
| **Load Balancing** | ✅ ALB native | ✅ Envoy | ❌ Client-side | ✅ Built-in | ✅ Envoy |
| **Health Check** | ✅ | ✅ | ✅ (Route 53 HC) | ✅ | ✅ |
| **Retry/Timeout** | ❌ | ✅ | ❌ | ✅ | ✅ |
| **mTLS** | ❌ | ❌ | ❌ | ⚠️ TLS + IAM auth (không mTLS native) | ✅ |
| **Traffic Shifting** | ✅ (weighted TG) | ❌ | ❌ | ✅ | ✅ |
| **Cross-VPC** | VPC Peering | ❌ | ❌ | ✅ Native | ✅ |
| **Cross-Account** | Complex | ❌ | ❌ | ✅ Native | ❌ |
| **ECS** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **EKS** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Lambda** | ✅ | ❌ | ✅ | ✅ | ❌ |

**Recommend theo giai đoạn:**

```
Startup (1 VPC, team nhỏ):
  → Service Connect (ECS) hoặc 1 Shared Internal ALB

Scale (multi-VPC hoặc multi-team):
  → VPC Lattice

Enterprise (cần mTLS, traffic management phức tạp):
  → EKS + Istio (thay vì App Mesh)
```

---

## 4. Asynchronous Communication trên AWS

### 4.1. Amazon SQS — Message Queue

> 🔗 Lý thuyết Message Queue tại [doc 06 — Section 3.2](06-inter-service-communication.md#32-message-queue--point-to-point)

**SQS** = managed message queue — **point-to-point** (1 message → 1 consumer).

```d2 title="SQS — Receive, Delete và Retry"
direction: right
producer: Producer — Order Service
queue: "SQS Queue\nmsg1 • msg2 • msg3\nVisibility Timeout 30s mặc định" {shape: queue}
consumer: Consumer — Worker
dlq: Dead Letter Queue {shape: queue}
producer -> queue: SendMessage
queue -> consumer: ReceiveMessage
consumer -> queue: DeleteMessage khi thành công
consumer -> queue: Hiện lại sau timeout nếu crash {style.stroke-dash: 5}
queue -> dlq: Vượt maxReceiveCount
# Icons: https://icons.d2lang.com/
queue.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Queue-Service-SQS.svg"
```

**SQS Standard vs FIFO:**

| Tiêu chí | Standard | FIFO |
|----------|---------|------|
| **Throughput** | Unlimited (hàng triệu msg/s) | 3,000 msg/s (batch) / 300 msg/s (no batch) |
| **Ordering** | Best-effort (không đảm bảo) | Strict FIFO (trong cùng Message Group) |
| **Delivery** | At-least-once (có thể duplicate) | Exactly-once (deduplication 5 phút) |
| **Giá** | $0.40/triệu requests | $0.50/triệu requests |
| **Use case** | Notification, image processing, general async | Payment processing, order sequencing |

**Khi nào dùng SQS?**

- **Decoupling** — Order Service gửi event "order.created" → Notification Service xử lý async
- **Buffer spiky traffic** — Flash sale tạo 10x orders → SQS buffer → workers xử lý từ từ
- **Retry with backoff** — msg fail → requeue → retry automatically
- **Worker pattern** — nhiều consumers cùng poll 1 queue, tự load balance

### 4.2. Amazon SNS — Pub/Sub

> 🔗 Lý thuyết Pub/Sub tại [doc 06 — Section 3.3](06-inter-service-communication.md#33-pubsub--publishsubscribe)

**SNS** = managed pub/sub — **1 message → N subscribers** (fan-out).

```d2 title="SNS — Fan-out Order Events"
direction: right
order: Order Service
topic: SNS Topic — order-events
inventory: SQS — Inventory Service
notification: SQS — Notification
analytics: Lambda — Analytics
email: Email — Admin alert
http: HTTP endpoint
order -> topic: Publish order.created
topic -> inventory
topic -> notification
topic -> analytics
topic -> email
topic -> http
# Icons: https://icons.d2lang.com/
topic.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Notification-Service-SNS.svg"
inventory.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Queue-Service-SQS.svg"
notification.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Queue-Service-SQS.svg"
analytics.icon: "https://icons.d2lang.com/aws/Compute/AWS-Lambda.svg"
```

Một publish được fan-out tới tất cả subscribers. Độ trễ phụ thuộc dịch vụ đích, retry và tải, không phải cam kết cố định dưới 100ms.

**SNS Subscription types:**

| Type | Mô tả | Use case |
|------|-------|----------|
| **SQS** | Push to SQS queue | Reliable processing, buffering |
| **Lambda** | Invoke Lambda | Serverless processing |
| **HTTP/HTTPS** | POST to endpoint | Webhook, external services |
| **Email** | Send email | Alerting |
| **SMS** | Send SMS | Critical alerts |
| **Firehose** | Stream to Firehose → S3/Redshift | Analytics, archival |

### 4.3. SQS + SNS — Fanout Pattern

**Pattern phổ biến nhất** trên AWS — kết hợp SNS (fan-out) + SQS (reliable processing):

```d2 title="4.3. SQS + SNS — Fanout Pattern"
direction: right
n1: "Order Service"
n2: "SNS: order-events"
n3: "SQS: inventory-queue"
n4: "SQS: notification-queue"
n5: "SQS: analytics-queue"
n6: "Inventory Service"
n7: "Notification Service"
n8: "Analytics Lambda"
n1 -> n2: "publish"
n2 -> n3: "subscribe"
n2 -> n4: "subscribe"
n2 -> n5: "subscribe"
n3 -> n6
n4 -> n7
n5 -> n8
# Icons: https://icons.d2lang.com/
n2.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Notification-Service-SNS.svg"
n3.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Queue-Service-SQS.svg"
n4.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Queue-Service-SQS.svg"
n5.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Queue-Service-SQS.svg"
n8.icon: "https://icons.d2lang.com/aws/Compute/AWS-Lambda.svg"
```

**Tại sao không SNS → Lambda trực tiếp?**

- SNS → Lambda: nếu Lambda fail → message **mất** (SNS retry 3 lần rồi bỏ)
- SNS → SQS → Lambda: nếu Lambda fail → message **ở lại SQS** → retry → DLQ nếu hết retry
- SQS làm **buffer** — throttle Lambda concurrency, tránh overwhelm downstream

**Đây là best practice #1** cho event-driven trên AWS: luôn đặt **SQS giữa SNS và consumer**.

### 4.4. Amazon EventBridge — Event Bus

**EventBridge** = serverless event bus — routing events theo **rules** (content-based filtering).

```d2 title="4.4. Amazon EventBridge — Event Bus"
direction: right
order: "Order Service"
user: "User Service"
payment: "Payment Service"
aws: "AWS Services — ECS / S3 / ..."
bus: "EventBridge Event Bus"
inventory: "SQS — Inventory"
saga: "Step Functions"
welcome: "Lambda — Welcome"
alert: "SNS — Alert"
order -> bus: "Publish"
user -> bus: "Publish"
payment -> bus: "Publish"
aws -> bus: "Service event integration"
bus -> inventory: "Rule source=order / created"
bus -> saga: "Rule source=order / paid"
bus -> welcome: "Rule source=user / signup"
bus -> alert: "Rule ECS task STOPPED"
# Icons: https://icons.d2lang.com/
bus.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-EventBridge.svg"
inventory.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Queue-Service-SQS.svg"
saga.icon: "https://icons.d2lang.com/aws/Application%20Integration/AWS-Step-Functions.svg"
welcome.icon: "https://icons.d2lang.com/aws/Compute/AWS-Lambda.svg"
alert.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Notification-Service-SNS.svg"
```

Custom event ví dụ: `source=com.shopvn.order`, `detail-type=OrderCreated`, `detail={orderId:ORD-123,userId:USR-456,totalAmount:500000}`. Rule patterns phải match đúng source/detail-type thực tế; `TASK_STOPPED` là ý nghĩa minh họa, không mặc định một field hợp lệ cho mọi AWS event.

**EventBridge vs SNS:**

| Tiêu chí | EventBridge | SNS |
|----------|-------------|-----|
| **Routing** | Content-based rules (filter trên event fields) | Topic-based + filter policies |
| **Schema** | Schema Registry, discovery, validation | Không |
| **Event replay** | ✅ Archive & Replay (lên đến vài năm) | ❌ |
| **AWS integration** | 100+ AWS sources tự động | Phải publish thủ công |
| **3rd party** | Salesforce, Zendesk, Datadog... | Không |
| **Throughput** | Soft limit (default ~10K/s, tăng được) | ~30M msg/s |
| **Giá** | $1.00/triệu events | $0.50/triệu requests |
| **Ordering** | Không đảm bảo | Không đảm bảo (FIFO topic có) |

**Khi nào EventBridge thay SNS?**

- **Dùng EventBridge** khi: cần content-based routing, schema management, event replay, tích hợp AWS services/3rd party, hệ thống event-driven phức tạp
- **Dùng SNS** khi: cần throughput rất cao (>10K events/s), simple fan-out không cần filter, đã có SNS setup

### 4.5. Amazon MSK (Managed Kafka)

> 🔗 Lý thuyết Event Streaming tại [doc 06 — Section 3.4](06-inter-service-communication.md#34-event-streaming--event-log)

**MSK** = managed Apache Kafka trên AWS — **event streaming** (persistent log, replay, ordering).

```d2 title="4.5. Amazon MSK (Managed Kafka)"
direction: down
order: Order Producer
msk: MSK — Topic order-events {
 p0: Partition0 — msg1 / msg2 / msg3 / msg4
 p1: Partition1 — msg5 / msg6 / msg7
 p2: Partition2 — msg8 / msg9
}
inventory: Group Inventory — ví dụ offset1042
analytics: Group Analytics — ví dụ offset987
search: Group Search Indexer — ví dụ offset1042
order -> msk
msk -> inventory
msk -> analytics
msk -> search
# Icons: https://icons.d2lang.com/
msk.icon: "https://icons.d2lang.com/aws/Analytics/Amazon-Managed-Streaming-for-Kafka.svg"
```

Retention ví dụ7ngày; reading không xóa messages ngay, groups có progress độc lập. Offsets thực tế là theo partition, không phải một scalar global offset của cả topic. Có thể replay trong retention window.

**Khi nào dùng MSK thay SQS/SNS/EventBridge?**

| Tiêu chí | SQS/SNS/EventBridge | MSK (Kafka) |
|----------|--------------------|----|
| **Message replay** | ❌ (EventBridge có archive) | ✅ Native (retention period) |
| **Ordering** | SQS FIFO / EventBridge không | ✅ Per-partition ordering |
| **Throughput** | Rất cao (managed scaling) | Rất cao (nhưng phải size cluster) |
| **Consumer model** | Push (SNS/EB) / Pull (SQS) | Pull (consumer groups) |
| **Ops overhead** | Zero (serverless) | Trung bình (managed nhưng cần size, monitor) |
| **Chi phí** | Pay per use | Cluster-based (chạy 24/7) — $200-500+/tháng minimum |
| **Use case** | Event-driven, async processing | Event sourcing, stream processing, CDC, audit log |

**Recommend:** Bắt đầu với SQS+SNS hoặc EventBridge. Chỉ dùng MSK khi thực sự cần: event replay, event sourcing, stream processing (Kafka Streams/Flink), hoặc team đã có Kafka experience.

### 4.6. SQS vs SNS vs EventBridge vs MSK — Chọn cái nào?

```d2 title="4.6. SQS vs SNS vs EventBridge vs MSK — Chọn cái nào?"
direction: down
n1: "Chọn Async Service"
n2: "Cần event replay / event sourcing?" {
  shape: diamond
}
n3: "✅ MSK Kafka"
n4: "Cần content-based routing?" {
  shape: diamond
}
n5: "✅ EventBridge"
n6: "1 consumer hay N consumers?" {
  shape: diamond
}
n7: "✅ SQS"
n8: "✅ SNS + SQS"
n1 -> n2
n2 -> n3: "Có"
n2 -> n4: "Không"
n4 -> n5: "Có, filter trên event fields"
n4 -> n6: "Không, simple fan-out"
n6 -> n7: "1 consumer point-to-point"
n6 -> n8: "N consumers fan-out"
# Icons: https://icons.d2lang.com/
n3.icon: "https://icons.d2lang.com/aws/Analytics/Amazon-Managed-Streaming-for-Kafka.svg"
n5.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-EventBridge.svg"
n7.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Queue-Service-SQS.svg"
```

**Tóm tắt nhanh:**

| Nhu cầu | Chọn |
|---------|------|
| Decouple 2 services, buffer, retry | **SQS** |
| 1 event → nhiều consumers | **SNS → SQS** (fan-out) |
| Routing theo nội dung event, schema management | **EventBridge** |
| Event sourcing, replay, stream processing | **MSK (Kafka)** |
| Orchestrate multi-step workflow | **Step Functions** |

---

## 5. Patterns thực tế trên AWS

### 5.1. Choreography với EventBridge

> 🔗 Lý thuyết Choreography tại [doc 06 — Section 5.3](06-inter-service-communication.md#53-choreography-vs-orchestration--phân-biệt-rõ-ràng)

```d2 title="5.1. Choreography với EventBridge"
shape: sequence_diagram
"Client": "Client"
"Order": "Order Service"
"EB": "EventBridge"
"Inv": "Inventory Service"
"Pay": "Payment Service"
"Notif": "Notification Service"
"Client" -> "Order": "POST /orders"
"Order" -> "Order": "Create order (PENDING)"
"Order" -> "EB": "OrderCreated event"
"EB" -> "Inv": "Rule: OrderCreated → Inventory"
"Inv" -> "Inv": "Reserve stock"
"Inv" -> "EB": "StockReserved event"
"EB" -> "Pay": "Rule: StockReserved → Payment"
"Pay" -> "Pay": "Charge customer"
"Pay" -> "EB": "PaymentCompleted event"
"EB" -> "Order": "Rule: PaymentCompleted → Order"
"Order" -> "Order": "Update status: CONFIRMED"
"EB" -> "Notif": "Rule: PaymentCompleted → Notification"
"Notif" -> "Client": "Email confirmation"
# Icons: https://icons.d2lang.com/
EB.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-EventBridge.svg"
```

**Ưu điểm:** Loose coupling, mỗi service independent, dễ thêm service mới (chỉ thêm rule).

**Nhược điểm:** Khó trace flow end-to-end, khó handle compensation (rollback), business logic phân tán.

### 5.2. Orchestration với Step Functions

> 🔗 Lý thuyết Orchestration tại [doc 06 — Section 5.3](06-inter-service-communication.md#53-choreography-vs-orchestration--phân-biệt-rõ-ràng)

**Step Functions** = managed workflow orchestration — define flow bằng state machine.

```d2 title="5.2. Orchestration với Step Functions"
direction: down
start: "Start"
reserve: "Reserve Stock — Inventory Lambda/ECS"
charge: "Charge Payment"
confirm: "Confirm Order"
success: "Notify Success"
fail: "Order Failed / Notify Customer"
release: "Release Stock — Compensation"
notifyfail: "Notify Failure"
start -> reserve
reserve -> charge: "Success"
reserve -> fail: "Failure"
charge -> confirm: "Success"
charge -> release: "Failure"
release -> notifyfail
confirm -> success
```

Step Functions hỗ trợ workflow editor, retry/catch/timeout, parallel/wait states. Standard/Express có execution/delivery semantics và costs khác nhau; Standard execution semantics không làm external payment side effect exactly-once. Tasks/compensation vẫn cần idempotency.

**Step Functions: Standard vs Express:**

| Tiêu chí | Standard | Express |
|----------|---------|---------|
| **Duration** | Tối đa 1 năm | Tối đa 5 phút |
| **Execution** | Exactly-once | At-least-once |
| **Giá** | $25/triệu state transitions | $1/triệu requests + duration |
| **History** | Full execution history | CloudWatch Logs |
| **Use case** | Order workflow, approval, long-running | Data processing, high-volume, ETL |

**Choreography vs Orchestration — Khi nào chọn gì trên AWS?**

| Tiêu chí | Choreography (EventBridge) | Orchestration (Step Functions) |
|----------|--------------------------|-------------------------------|
| **Coupling** | Rất loose | Service → Step Functions coupling |
| **Visibility** | Phải tự trace qua logs | Visual execution history |
| **Error handling** | Mỗi service tự handle | Centralized: catch, retry, compensate |
| **Complexity** | Đơn giản nếu ít steps | Tốt cho multi-step, branching |
| **Scalability** | Rất cao | Quota-limited (nhưng đủ dùng) |
| **Recommend** | Broadcast events (notifications, analytics) | Business workflows (order, payment, approval) |

### 5.3. Outbox Pattern trên AWS

> 🔗 Lý thuyết Outbox Pattern tại [doc 06 — Section 6.3](06-inter-service-communication.md#63-outbox-pattern)

Vấn đề: Service cần **write DB** và **publish event** — cả 2 phải thành công hoặc cả 2 fail. Nhưng DB + SQS/EventBridge là 2 hệ thống khác nhau → không thể dùng transaction.

```d2 title="5.3. Outbox Pattern trên AWS"
direction: down
order: Order Service — local transaction ghi orders + outbox
options: Outbox Relay Alternatives {
 dynamo: DynamoDB Streams → Lambda → EventBridge / SQS
 polling: RDS Outbox → Polling Worker → Publish → Mark done
 debezium: RDS WAL / Binlog → Debezium MSK Connect → Kafka
}
order -> options.dynamo: DynamoDB transaction variant
order -> options.polling: RDS transaction variant
order -> options.debezium: RDS CDC variant
```

Relay cần retry/recovery và consumer idempotency vì at-least-once. Poll mỗi5giây là interval worker minh họa, không phải một EventBridge Scheduler cron precision bảo đảm5giây.

### 5.4. Dead Letter Queue (DLQ)

> 🔗 Lý thuyết DLQ tại [doc 06 — Section 6.4](06-inter-service-communication.md#64-dead-letter-queue)

```d2 title="SQS — DLQ và Redrive"
direction: right
queue: Main SQS Queue {shape: queue}
consumer: Consumer
fail: Processing FAIL
dlq: DLQ {shape: queue}
alarm: CloudWatch Alarm — DLQ depth > 0
investigate: Manual investigation / Fix bug
queue -> consumer -> fail
fail -> queue: Visibility timeout hết — retry
queue -> dlq: Vượt maxReceiveCount — ví dụ 3 lần nhận
dlq -> alarm -> investigate
investigate -> queue: Start DLQ Redrive → reprocess
# Icons: https://icons.d2lang.com/
queue.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-Simple-Queue-Service-SQS.svg"
alarm.icon: "https://icons.d2lang.com/aws/Management%20%26%20Governance/Amazon-CloudWatch.svg"
```

**Best practices DLQ:**

- **Luôn attach DLQ** cho mọi SQS queue và Lambda function
- **CloudWatch Alarm** khi DLQ có messages (`ApproximateNumberOfMessagesVisible > 0`)
- **Retention DLQ** đặt dài hơn main queue (VD: 14 ngày) để có thời gian debug
- **Redrive feature** — SQS hỗ trợ redrive DLQ messages về source queue sau khi fix bug

### 5.5. FIFO vs Standard Queue

**Khi nào cần FIFO?**

| Scenario | Standard | FIFO |
|----------|---------|------|
| Gửi email notification | ✅ (thứ tự không quan trọng) | ❌ Overkill |
| Image resize sau upload | ✅ | ❌ |
| Order status updates | ❌ (sai thứ tự = bug) | ✅ Cần ordering |
| Payment processing | ❌ (duplicate charge!) | ✅ Cần exactly-once |
| Inventory updates | ❌ (race condition) | ✅ Per-SKU ordering |

**FIFO Message Group ID** — ordering **per group**, không phải toàn bộ queue:

```
Queue FIFO: order-updates.fifo

Message Group: "order-123"  → [created] → [paid] → [shipped]    (ordered)
Message Group: "order-456"  → [created] → [cancelled]           (ordered)
Message Group: "order-789"  → [created] → [paid]                (ordered)

→ 3 groups xử lý SONG SONG, nhưng mỗi group thứ tự đúng
→ Throughput = 300 msg/s × N groups (scale bằng cách tăng groups)
```

---

## 6. Ví dụ thực tế — E-Commerce Communication Map

> 🔗 Đề bài chi tiết tại [25 — Case Study: E-Commerce](25-case-study-ecommerce.md)

### Tổng quan giao tiếp giữa các services

```d2 title="Tổng quan giao tiếp giữa các services"
direction: down
ingress: CloudFront → API Gateway HTTP API → VPC Link
sync: Service Connect — Sync {
 order: Order
 user: User
 product: Product
 inventory: Inventory
 cart: Cart
 promotion: Promotion
 order -> user: Validate user
 order -> product: Get price / Validate
 order -> inventory: Check stock
 cart -> product: Details
 cart -> promotion: Apply voucher
}
async: EventBridge + SQS / SNS {
 order: Order
 payment: Payment
 inventory: Inventory
 bus: EventBridge
 stock: SQS → Inventory reserve
 noti: SQS → Notification email
 confirm: SQS → Order confirm
 ship: SQS → Shipping create
 ops: SNS → Ops Team
 order -> bus: OrderCreated
 payment -> bus: PaymentCompleted
 inventory -> bus: LowStock
 bus -> stock: OrderCreated
 bus -> noti: OrderCreated
 bus -> confirm: PaymentCompleted
 bus -> ship: PaymentCompleted
 bus -> ops: LowStock
}
saga: Step Functions — Orchestration alternative {
 create: Create Order
 reserve: Reserve Stock
 charge: Charge Payment
 confirm: Confirm
 compensation: Compensation theo các bước đã commit
 create -> reserve -> charge -> confirm
 reserve -> compensation: Failure
 charge -> compensation: Failure
}
ingress -> sync.order
# Icons: https://icons.d2lang.com/
async.bus.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-EventBridge.svg"
saga.icon: "https://icons.d2lang.com/aws/Application%20Integration/AWS-Step-Functions.svg"
```

Các khối minh họa sync, event fan-out và orchestration; không phải luôn chạy cả choreography lẫn coordinator cho cùng một command. Compensation phải đảo đúng các bước đã thành công (release reserve, refund nếu đã charge, cancel order), không phải mọi fail đều gọi cùng một undo.

### Bảng tổng hợp — Service nào giao tiếp thế nào?

| Từ → Đến | Phương thức | AWS Service | Lý do |
|----------|------------|-------------|-------|
| Client → API | Sync REST | API Gateway (HTTP API) | Rate limiting, auth, custom domain |
| Order → User | Sync HTTP | Service Connect | Validate user trước khi tạo order, cần response |
| Order → Inventory | Sync HTTP | Service Connect | Check stock trước khi confirm, cần response |
| Order → Payment | Orchestration | Step Functions | Saga pattern: cần compensation nếu fail |
| Order → Notification | Async event | EventBridge → SQS | Fire-and-forget, không cần chờ email gửi xong |
| Payment → Order | Async event | EventBridge → SQS | Decouple, payment result xử lý async |
| Product → Search | Async event | EventBridge → SQS | Reindex khi product update, eventually consistent |
| Inventory → Ops | Async alert | EventBridge → SNS → Email | Low stock alert, fan-out tới nhiều channels |
| Upload → Image Resize | Async trigger | S3 Event → Lambda | Event-driven, stateless processing |

---

## 7. Anti-patterns

| Anti-pattern | Vấn đề | Nên làm |
|-------------|--------|---------|
| **Sync everywhere** | Service A sync call B, B sync call C → latency cộng dồn, cascading failure | Async cho mọi thứ không cần response ngay (notifications, analytics, indexing) |
| **SNS direct to Lambda** | Message mất nếu Lambda fail (SNS chỉ retry 3 lần) | SNS → SQS → Lambda (SQS buffer + DLQ) |
| **No DLQ** | Failed messages biến mất, không debug được | Luôn attach DLQ, CloudWatch Alarm khi DLQ > 0 |
| **Kafka cho mọi thứ** | Over-engineering, chi phí cao, ops overhead cho use case đơn giản | SQS+SNS hoặc EventBridge cho hầu hết cases |
| **Hardcode service URLs** | Deploy lại khi IP thay đổi | Service Connect / Cloud Map / VPC Lattice |
| **Shared SQS queue** | Nhiều message types trong 1 queue → consumer xử lý phức tạp | 1 queue per consumer, routing bằng SNS/EventBridge |
| **No idempotency** | At-least-once delivery → duplicate processing | Idempotency key (orderId + eventType) trong consumer |
| **Fat events** | Event chứa toàn bộ data (100KB+) → queue chậm | Event chứa ID, consumer query service nếu cần detail |

---

## 8. Checklist triển khai

### Ingress
- [ ] Chọn API Gateway (HTTP API) hoặc ALB cho external traffic
- [ ] CloudFront trước API Gateway/ALB (caching, DDoS)
- [ ] WAF rules configured
- [ ] Custom domain + SSL (ACM)
- [ ] Rate limiting / throttling

### Service-to-Service Sync
- [ ] Service Connect (ECS) hoặc Internal ALB
- [ ] Health check cho mọi service
- [ ] Timeout configured (đừng dùng default infinite)
- [ ] Circuit breaker cho external dependencies

### Async
- [ ] DLQ cho mọi SQS queue và Lambda
- [ ] CloudWatch Alarm trên DLQ depth
- [ ] Idempotency trong consumers
- [ ] FIFO queue cho flows cần ordering (payment, inventory)
- [ ] Visibility timeout > processing time
- [ ] Message retention phù hợp (default 4 ngày, max 14 ngày)

### Event-Driven
- [ ] Event schema documented (EventBridge Schema Registry)
- [ ] Content-based filtering (EventBridge rules) thay vì consumer filter
- [ ] Event versioning strategy (additive changes only)

---

## 9. Tổng kết

```
┌───────────────────────────────────────────────────────────────┐
│                    CHEAT SHEET                                │
│                                                               │
│  CLIENT → SERVICE:                                            │
│  • REST API    → API Gateway (HTTP API) — rẻ, đủ features     │
│  • High volume → ALB — không per-request pricing              │
│  • Cả hai     → CloudFront → API GW → VPC Link → ALB          │
│                                                               │
│  SERVICE → SERVICE (Sync):                                    │
│  • ECS đơn giản  → Service Connect (free, zero-config)        │
│  • Cross-VPC     → VPC Lattice                                │
│  • EKS           → K8s Service + Ingress                      │
│                                                               │
│  SERVICE → SERVICE (Async):                                   │
│  • 1:1 decouple  → SQS                                        │
│  • 1:N fan-out   → SNS → SQS                                  │
│  • Smart routing → EventBridge → SQS                          │
│  • Streaming     → MSK (Kafka) — chỉ khi thực sự cần          │
│                                                               │
│  WORKFLOW:                                                    │
│  • Simple events → Choreography (EventBridge)                 │
│  • Saga / multi-step → Orchestration (Step Functions)         │
│                                                               │
│  GOLDEN RULE:                                                 │
│  "Sync chỉ khi cần response ngay. Còn lại → Async."           │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 10. Liên kết liên quan

- [06 — Inter-Service Communication](06-inter-service-communication.md) — Lý thuyết REST, gRPC, Async, Event-Driven
- [07 — API Gateway](07-api-gateway.md) — API Gateway pattern, BFF
- [08 — Service Discovery](08-service-discovery.md) — Client-side vs Server-side discovery
- [18 — Triển khai & Kiến trúc tổng quan](18-aws-deployment-architecture.md) — VPC, Compute, Networking foundation
- [20 — Data Management trên AWS](20-aws-data-management.md) — Database per Service, Saga, CQRS
- [25 — Case Study: E-Commerce](25-case-study-ecommerce.md) — Áp dụng tổng hợp
