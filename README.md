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
- [10. Triển khai Microservice trên AWS](#10-triển-khai-microservice-trên-aws)
- [11. Case Study — Thiết kế kiến trúc Microservice từ đầu](#11-case-study--thiết-kế-kiến-trúc-microservice-từ-đầu)
- [Tham khảo](#-tham-khảo)

---

## 🚀 Roadmap học tập

| Giai đoạn | Nội dung | Tài liệu |
|---|---|---|
| Foundation | Nền tảng Microservice | 01 → 05 |
| Integration | Giao tiếp và tích hợp | 06 → 08 |
| Data & Reliability | Dữ liệu, chịu lỗi, quan sát | 09 → 11 |
| Platform | Container, Orchestration, CI/CD, Security | 12 → 17 |
| AWS | Triển khai Microservice trên AWS | 18 → 24 |
| End-to-End | Case study tổng hợp | 25 |

---

## 1. Khái niệm cơ bản

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 01 | [Microservice Overview](01-microservice-overview.md) | Microservice là gì, Monolith vs Microservice vs SOA, ưu/nhược điểm | ✅ |
| 02 | [Single Responsibility & Bounded Context](02-single-responsibility-bounded-context.md) | SRP trong Microservice, Bounded Context (DDD), cách xác định ranh giới service | ✅ |
| 03 | [Loose Coupling & High Cohesion](03-loose-coupling-high-cohesion.md) | Loose Coupling, High Cohesion, cách đo lường và áp dụng trong Microservice | ✅ |
| 04 | [Autonomy & Independence](04-autonomy-independence.md) | Service autonomy, independent deployment, team ownership, self-contained service | ✅ |
| 05 | [Decomposition Strategies](05-decomposition-strategies.md) | Phân tách service theo Business Capability, DDD, Strangler Fig | ✅ |

## 2. Communication & Integration

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 06 | [Inter-Service Communication](06-inter-service-communication.md) | REST vs gRPC vs GraphQL, Sync vs Async, Event-Driven | ✅ |
| 07 | [API Gateway](07-api-gateway.md) | API Gateway Pattern, BFF, Rate Limiting, Load Balancing | ✅ |
| 08 | [Service Discovery](08-service-discovery.md) | Client-side vs Server-side, Consul, Eureka, DNS-based | ✅ |

## 3. Data Management

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 09 | [Data Management](09-data-management.md) | Database per Service, Saga, CQRS, Event Sourcing, CAP Theorem | ✅ |

## 4. Resilience & Reliability

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 10 | [Resilience Patterns](10-resilience-patterns.md) | Circuit Breaker, Retry, Bulkhead, Rate Limiter, Fallback | ✅ |

## 5. Observability & Evolvability

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 11 | [Observability & Evolvability](11-observability-evolvability.md) | Logs, Metrics, Traces, Evolvability, ELK, Prometheus, Grafana, Jaeger | ✅ |

## 6. Deployment & Infrastructure

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 12 | [Containerization](12-containerization.md) | Docker, Docker Compose, multi-stage build, best practices | ✅ |
| 13 | [Orchestration](13-orchestration.md) | Kubernetes, Service Mesh (Istio/Linkerd), Helm Charts | ✅ |
| 14 | [CI/CD & Deployment](14-cicd-deployment.md) | Pipeline, Blue-Green, Canary, Rolling, GitOps | ✅ |

## 7. Security

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 15 | [Security](15-security.md) | OAuth2, JWT, mTLS, API Security, Zero Trust | ✅ |

## 8. Configuration Management

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 16 | [Configuration & Secrets Management](16-configuration-secrets-management.md) | External Config, Config Server, Secrets Management, Vault, Environment Variables | ✅ |

## 9. Design Patterns tổng hợp

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 17 | [Design Patterns](17-design-patterns.md) | Sidecar, Ambassador, Adapter, Anti-patterns, tổng hợp | ✅ |

## 10. Triển khai Microservice trên AWS

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 18 | [Triển khai & Kiến trúc tổng quan](18-aws-deployment-architecture.md) | Kiến trúc reference trên AWS, ECS vs EKS vs Lambda — chọn khi nào, IaC (CDK/Terraform), multi-account strategy | ✅ |
| 19 | [Communication & Service Discovery trên AWS](19-aws-communication-discovery.md) | API Gateway, Service Connect, Cloud Map, VPC Lattice, ALB/NLB routing, SQS/SNS/EventBridge cho async, so sánh sync vs async trên AWS | ✅ |
| 20 | [Data Management trên AWS](20-aws-data-management.md) | Database per Service (RDS/DynamoDB), Saga pattern với Step Functions, CQRS + Event Sourcing với EventBridge/DynamoDB Streams, data consistency | ✅ |
| 21 | [Resilience & Auto Scaling trên AWS](21-aws-resilience.md) | Auto Scaling (ECS/EKS/Lambda), Multi-AZ/Multi-Region, Circuit Breaker (app-level/service mesh), Health Check, Chaos Engineering, disaster recovery | ✅ |
| 22 | [Observability trên AWS](22-aws-observability.md) | Distributed Tracing (X-Ray), Centralized Logging (CloudWatch Logs), Metrics & Alerting, Container Insights, cost monitoring | ✅ |
| 23 | [Security & Zero Trust trên AWS](23-aws-security.md) | IAM Roles cho service-to-service, Cognito cho AuthN/AuthZ, TLS/mTLS service-to-service, Secrets Manager, network isolation (VPC/Security Groups) | ✅ |
| 24 | [CI/CD & Deployment Strategies trên AWS](24-aws-cicd-deployment.md) | CodePipeline/GitHub Actions, Blue-Green (ECS+ALB), Canary (Lambda/EKS), Rolling Update, GitOps với ArgoCD trên EKS, cost optimization | ✅ |

## 11. Case Study — Thiết kế kiến trúc Microservice từ đầu

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 25 | [Case Study: E-Commerce Platform](25-case-study-ecommerce.md) | Đề bài → phân tích domain → decompose services → chọn patterns → thiết kế infra → so sánh nhiều solutions | ✅ |
| 26 | [Case Study: Food Delivery Platform](26-case-study-food-delivery.md) | Đề bài → domain/BC → service decomposition → dispatch flow → data/resilience/security → execution plan | ✅ |
| 27 | [Bảng thuật ngữ (Glossary)](27-glossary.md) | Tổng hợp thuật ngữ Microservice: cơ bản, communication, patterns, infra, observability, security, AWS | ✅ |

## 12. Cheat Sheet & Tham khảo nhanh

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 28 | [Cheat Sheet](28-cheat-sheet.md) | Microservice vs Monolith, communication matrix, data/resilience/deployment/AWS decision tables, security & observability checklist | ✅ |

## 12. Chủ đề nâng cao

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 27 | [Shared Code Strategy](27-shared-code-strategy.md) | Cái gì nên/không nên share, Shared Library vs Code Gen vs Sidecar, versioning, anti-patterns, best practices | ✅ |
| 28 | [Multi-Tenancy Architecture](28-multi-tenancy.md) | Pool/Bridge/Silo models, tenant isolation, data management, rate limiting, observability, CI/CD, cloud deployment, case study | ✅ |

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

> 💡 **Tip**: Đọc theo thứ tự từ 01 → 17 cho kiến thức nền tảng, 18 → 24 cho triển khai trên AWS, và 25 cho case study tổng hợp!
