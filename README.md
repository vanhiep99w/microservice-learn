# 🏗️ Microservice Architecture - Tài liệu học tập

> Repository chứa tài liệu chi tiết về kiến trúc Microservice — từ khái niệm cơ bản đến triển khai nâng cao.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MICROSERVICE ARCHITECTURE                       │
│                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │ Service A│  │ Service B│  │ Service C│  │ Service D│            │
│   │  ┌────┐  │  │  ┌────┐  │  │  ┌────┐  │  │  ┌────┐  │            │
│   │  │ DB │  │  │  │ DB │  │  │  │ DB │  │  │  │ DB │  │            │
│   │  └────┘  │  │  └────┘  │  │  └────┘  │  │  └────┘  │            │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│        │             │             │             │                  │
│   ─────┴─────────────┴─────────────┴─────────────┴─────────         │
│                    Message Bus / API Gateway                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Mục lục

- [Roadmap học tập](#-roadmap-học-tập)
- [1. Khái niệm cơ bản](#1-khái-niệm-cơ-bản)
- [2. Communication & Integration](#2-communication--integration)
- [3. Data Management](#3-data-management)
- [4. Resilience & Reliability](#4-resilience--reliability)
- [5. Observability & Evolvability](#5-observability--evolvability)
- [6. Deployment & Infrastructure](#6-deployment--infrastructure)
- [7. Security](#7-security)
- [8. Configuration Management](#8-configuration-management)
- [9. Design Patterns tổng hợp](#9-design-patterns-tổng-hợp)
- [10. Microservice trên AWS](#10-microservice-trên-aws)
- [Tham khảo](#-tham-khảo)

---

## 1. Khái niệm cơ bản

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 01 | [Microservice Overview](docs/01-microservice-overview.md) | Microservice là gì, Monolith vs Microservice vs SOA, ưu/nhược điểm | ✅ |
| 02 | [Single Responsibility & Bounded Context](docs/02-single-responsibility-bounded-context.md) | SRP trong Microservice, Bounded Context (DDD), cách xác định ranh giới service | ✅ |
| 03 | [Loose Coupling & High Cohesion](docs/03-loose-coupling-high-cohesion.md) | Loose Coupling, High Cohesion, cách đo lường và áp dụng trong Microservice | ✅ |
| 04 | [Autonomy & Independence](docs/04-autonomy-independence.md) | Service autonomy, independent deployment, team ownership, self-contained service | ✅ |
| 05 | [Decomposition Strategies](docs/05-decomposition-strategies.md) | Phân tách service theo Business Capability, DDD, Strangler Fig | ✅ |

## 2. Communication & Integration

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 06 | [Inter-Service Communication](docs/06-inter-service-communication.md) | REST vs gRPC vs GraphQL, Sync vs Async, Event-Driven | ✅ |
| 07 | [API Gateway](docs/07-api-gateway.md) | API Gateway Pattern, BFF, Rate Limiting, Load Balancing | ✅ |
| 08 | [Service Discovery](docs/08-service-discovery.md) | Client-side vs Server-side, Consul, Eureka, DNS-based | ✅ |

## 3. Data Management

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 09 | [Data Management](docs/09-data-management.md) | Database per Service, Saga, CQRS, Event Sourcing, CAP Theorem | ✅ |

## 4. Resilience & Reliability

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 10 | [Resilience Patterns](docs/10-resilience-patterns.md) | Circuit Breaker, Retry, Bulkhead, Rate Limiter, Fallback | ✅ |

## 5. Observability & Evolvability

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 11 | [Observability & Evolvability](docs/11-observability-evolvability.md) | Logs, Metrics, Traces, Evolvability, ELK, Prometheus, Grafana, Jaeger | ✅ |

## 6. Deployment & Infrastructure

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 12 | [Containerization](docs/12-containerization.md) | Docker, Docker Compose, multi-stage build, best practices | ✅ |
| 13 | [Orchestration](docs/13-orchestration.md) | Kubernetes, Service Mesh (Istio/Linkerd), Helm Charts | ✅ |
| 14 | [CI/CD & Deployment](docs/14-cicd-deployment.md) | Pipeline, Blue-Green, Canary, Rolling, GitOps | ✅ |

## 7. Security

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 15 | [Security](docs/15-security.md) | OAuth2, JWT, mTLS, API Security, Zero Trust | ✅ |

## 8. Configuration Management

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 16 | [Configuration & Secrets Management](docs/16-configuration-secrets-management.md) | External Config, Config Server, Secrets Management, Vault, Environment Variables | ✅ |

## 9. Design Patterns tổng hợp

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 17 | [Design Patterns](docs/17-design-patterns.md) | Sidecar, Ambassador, Adapter, Anti-patterns, tổng hợp | ⬜ |

## 10. Microservice trên AWS

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 18 | [AWS Overview & Architecture](docs/18-aws-microservice-overview.md) | Tổng quan kiến trúc Microservice trên AWS, ECS vs EKS vs Lambda, Well-Architected | ⬜ |
| 19 | [AWS Networking & Load Balancing](docs/19-aws-networking.md) | VPC, ALB/NLB, API Gateway, CloudFront, Route 53, PrivateLink | ⬜ |
| 20 | [AWS Compute — ECS, EKS, Lambda](docs/20-aws-compute.md) | ECS Fargate vs EC2, EKS, Lambda cho Microservice, so sánh chi tiết | ⬜ |
| 21 | [AWS Data & Messaging](docs/21-aws-data-messaging.md) | RDS, DynamoDB, ElastiCache, SQS, SNS, EventBridge, MSK (Kafka) | ⬜ |
| 22 | [AWS Observability & Monitoring](docs/22-aws-observability.md) | CloudWatch, X-Ray, CloudTrail, Container Insights, cost monitoring | ⬜ |
| 23 | [AWS Security & IAM](docs/23-aws-security.md) | IAM Roles, Cognito, Secrets Manager, KMS, WAF, Security Groups, Zero Trust | ⬜ |
| 24 | [AWS Deployment Strategies](docs/24-aws-deployment-strategies.md) | Các mô hình triển khai trên AWS (ECS+ALB, EKS+Ingress, Lambda+APIGW), Blue-Green, Canary, IaC (CDK/Terraform), cost optimization | ⬜ |

---

## 📖 Quy ước

| Ký hiệu | Ý nghĩa |
|:--------:|---------|
| ⬜ | Chưa viết |
| 🟡 | Đang viết |
| ✅ | Hoàn thành |

Mỗi tài liệu đều có:
- 📋 **Mục lục** với anchor links tới từng phần
- 📊 **Diagrams** (Mermaid / ASCII art / Tables)
- 💡 **Ví dụ thực tế** và use cases
- 🔗 **Liên kết** tới các tài liệu liên quan

---

## 📚 Tham khảo

- [Microservices.io](https://microservices.io/) — Patterns & best practices
- [Martin Fowler — Microservices](https://martinfowler.com/articles/microservices.html)
- [Microsoft — Microservices Architecture](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices)
- [The Twelve-Factor App](https://12factor.net/)
- [Building Microservices — Sam Newman](https://www.oreilly.com/library/view/building-microservices-2nd/9781492034018/)

---

> 💡 **Tip**: Đọc theo thứ tự từ 01 → 17 cho kiến thức nền tảng, sau đó 18 → 23 cho triển khai thực tế trên AWS!
