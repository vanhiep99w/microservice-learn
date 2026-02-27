# 🛒 Case Study: Thiết kế kiến trúc Microservice cho E-Commerce Platform

## 📋 Mục lục

- [Đề bài](#-đề-bài)
- [Yêu cầu chức năng (Functional Requirements)](#-yêu-cầu-chức-năng-functional-requirements)
- [Yêu cầu phi chức năng (Non-Functional Requirements)](#-yêu-cầu-phi-chức-năng-non-functional-requirements)
- [Phần 1 — Phân tích Domain & Bounded Context](#phần-1--phân-tích-domain--bounded-context)
- [Phần 2 — Decompose Services](#phần-2--decompose-services)
- [Phần 3 — Inter-Service Communication](#phần-3--inter-service-communication)
- [Phần 4 — Data Management & Patterns](#phần-4--data-management--patterns)
- [Phần 5 — Resilience & Reliability](#phần-5--resilience--reliability)
- [Phần 6 — Observability](#phần-6--observability)
- [Phần 7 — Security Architecture](#phần-7--security-architecture)
- [Phần 8 — Infrastructure & Deployment](#phần-8--infrastructure--deployment)
- [Phần 9 — So sánh các Solution Infrastructure](#phần-9--so-sánh-các-solution-infrastructure)
- [Phần 10 — Tổng kết Architecture Decision Records](#phần-10--tổng-kết-architecture-decision-records)

---

## 📝 Đề bài

### Bối cảnh

Công ty **ShopVN** đang vận hành một **Monolith E-Commerce** được xây dựng từ 5 năm trước. Hệ thống hiện tại gặp các vấn đề:

- **Scale khó**: Toàn bộ hệ thống phải scale cùng nhau dù chỉ có module thanh toán bị quá tải
- **Deploy rủi ro**: Mỗi lần deploy mất 2-3 giờ downtime, 1 bug nhỏ ảnh hưởng toàn hệ thống
- **Team bottleneck**: 30 developers làm chung 1 codebase, conflict liên tục
- **Tech stack cứng nhắc**: Toàn bộ viết bằng Java, không thể dùng Python cho ML recommendation

### Quy mô hệ thống

| Metric | Giá trị |
|--------|---------|
| Số user đăng ký | 2 triệu |
| DAU (Daily Active Users) | 200,000 |
| Số đơn hàng/ngày | 50,000 |
| Peak concurrent users | 20,000 (flash sale) |
| Số sản phẩm (SKU) | 500,000 |
| Số merchants/sellers | 5,000 |
| Uptime yêu cầu | 99.9% |
| Response time P95 | < 300ms |
| Vùng phục vụ | Việt Nam (single region) |

### Các module hiện tại trong Monolith

```
┌─────────────────────────────────────────────────────────┐
│                    MONOLITH SHOPVN                       │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │   User   │ │ Product  │ │  Order   │ │  Payment   │  │
│  │  Module  │ │  Module  │ │  Module  │ │   Module   │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │Inventory │ │ Shopping │ │Promotion │ │Notification│  │
│  │  Module  │ │   Cart   │ │  Module  │ │   Module   │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│  │ Shipping │ │  Review  │ │  Search  │                 │
│  │  Module  │ │  Module  │ │  Module  │                 │
│  └──────────┘ └──────────┘ └──────────┘                 │
│                                                         │
│              ┌──────────────────────┐                   │
│              │   Single Database    │                   │
│              │    (PostgreSQL)      │                   │
│              └──────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Yêu cầu chức năng (Functional Requirements)

| # | Chức năng | Mô tả |
|---|-----------|-------|
| F1 | **User Management** | Đăng ký, đăng nhập, profile, address book, OAuth (Google/Facebook) |
| F2 | **Product Catalog** | CRUD sản phẩm, categories, attributes, hình ảnh, seller quản lý sản phẩm |
| F3 | **Search & Discovery** | Full-text search, filter, faceted search, auto-suggest, ranking |
| F4 | **Shopping Cart** | Thêm/xóa/sửa giỏ hàng, persistent cart, merge cart (guest → login) |
| F5 | **Order Management** | Tạo đơn, theo dõi trạng thái, hủy đơn, order history |
| F6 | **Payment** | Thanh toán COD, ví điện tử (MoMo, ZaloPay), banking, refund |
| F7 | **Inventory** | Quản lý tồn kho, reserved stock khi đặt hàng, low-stock alert |
| F8 | **Promotion** | Voucher, flash sale, combo deal, tự động áp dụng khuyến mãi |
| F9 | **Notification** | Email, SMS, push notification, in-app notification |
| F10 | **Shipping** | Tính phí ship, tracking, tích hợp đối tác vận chuyển (GHN, GHTK) |
| F11 | **Review & Rating** | Đánh giá sản phẩm, rating, hình ảnh review |
| F12 | **Recommendation** | Gợi ý sản phẩm dựa trên hành vi, "Mua cùng", "Xem gần đây" |

---

## ⚡ Yêu cầu phi chức năng (Non-Functional Requirements)

| # | Yêu cầu | Chi tiết |
|---|---------|----------|
| NF1 | **Availability** | 99.9% uptime (~8.76h downtime/năm) |
| NF2 | **Scalability** | Handle 10x traffic trong flash sale (200K concurrent) |
| NF3 | **Performance** | API response P95 < 300ms, search < 200ms |
| NF4 | **Data Consistency** | Eventual consistency chấp nhận được cho catalog/search, Strong consistency cho payment/inventory |
| NF5 | **Security** | PCI-DSS compliance cho payment, OWASP Top 10 |
| NF6 | **Deployability** | Zero-downtime deployment, rollback < 5 phút |
| NF7 | **Observability** | Distributed tracing, centralized logging, real-time alerting |
| NF8 | **Cost** | Startup budget — tối ưu chi phí, scale dần |

---

## Phần 1 — Phân tích Domain & Bounded Context

> 🔗 Áp dụng kiến thức từ [02 — Single Responsibility & Bounded Context](02-single-responsibility-bounded-context.md) và [05 — Decomposition Strategies](05-decomposition-strategies.md)

*(Sẽ viết chi tiết: xác định domain, subdomain, bounded context map, context mapping patterns)*

---

## Phần 2 — Decompose Services

> 🔗 Áp dụng kiến thức từ [05 — Decomposition Strategies](05-decomposition-strategies.md) và [03 — Loose Coupling & High Cohesion](03-loose-coupling-high-cohesion.md)

*(Sẽ viết chi tiết: danh sách services, responsibility, API boundary, dependency graph, Strangler Fig migration plan)*

---

## Phần 3 — Inter-Service Communication

> 🔗 Áp dụng kiến thức từ [06 — Inter-Service Communication](06-inter-service-communication.md), [07 — API Gateway](07-api-gateway.md), [08 — Service Discovery](08-service-discovery.md)

*(Sẽ viết chi tiết: sync vs async cho từng flow, event taxonomy, API Gateway design, service mesh decision)*

---

## Phần 4 — Data Management & Patterns

> 🔗 Áp dụng kiến thức từ [09 — Data Management](09-data-management.md)

*(Sẽ viết chi tiết: database per service, loại DB cho từng service, Saga pattern cho Order flow, CQRS cho Search/Catalog, Event Sourcing decision)*

---

## Phần 5 — Resilience & Reliability

> 🔗 Áp dụng kiến thức từ [10 — Resilience Patterns](10-resilience-patterns.md)

*(Sẽ viết chi tiết: Circuit Breaker ở đâu, Retry policy, Bulkhead cho Payment, Rate Limiting, fallback strategies, chaos testing plan)*

---

## Phần 6 — Observability

> 🔗 Áp dụng kiến thức từ [11 — Observability & Evolvability](11-observability-evolvability.md)

*(Sẽ viết chi tiết: logging strategy, metrics quan trọng, tracing flow, alerting rules, dashboard design)*

---

## Phần 7 — Security Architecture

> 🔗 Áp dụng kiến thức từ [15 — Security](15-security.md)

*(Sẽ viết chi tiết: AuthN/AuthZ flow, service-to-service auth, API security, data encryption, network segmentation)*

---

## Phần 8 — Infrastructure & Deployment

> 🔗 Áp dụng kiến thức từ [12 — Containerization](12-containerization.md), [13 — Orchestration](13-orchestration.md), [14 — CI/CD](14-cicd-deployment.md)

*(Sẽ viết chi tiết: container strategy, orchestration choice, CI/CD pipeline design, deployment strategy per service, IaC)*

---

## Phần 9 — So sánh các Solution Infrastructure

*(Sẽ viết chi tiết: so sánh ít nhất 3 solutions — ECS Fargate / EKS / ECS+Lambda hybrid, bảng so sánh chi phí, độ phức tạp, team skill, migration path)*

| Tiêu chí | Solution A: ECS Fargate | Solution B: EKS | Solution C: Hybrid (ECS + Lambda) |
|----------|------------------------|-----------------|----------------------------------|
| Độ phức tạp vận hành | ... | ... | ... |
| Chi phí (estimate) | ... | ... | ... |
| Scaling | ... | ... | ... |
| Team skill yêu cầu | ... | ... | ... |
| Phù hợp cho | ... | ... | ... |

---

## Phần 10 — Tổng kết Architecture Decision Records

*(Sẽ viết chi tiết: tổng hợp tất cả quyết định kiến trúc dưới dạng ADR — lý do chọn, alternatives đã cân nhắc, trade-offs)*

| ADR # | Quyết định | Lý do | Alternatives |
|-------|-----------|-------|-------------|
| ADR-001 | ... | ... | ... |
| ADR-002 | ... | ... | ... |

---

## 🔗 Liên kết

- [01 — Microservice Overview](01-microservice-overview.md)
- [05 — Decomposition Strategies](05-decomposition-strategies.md)
- [06 — Inter-Service Communication](06-inter-service-communication.md)
- [09 — Data Management](09-data-management.md)
- [10 — Resilience Patterns](10-resilience-patterns.md)
- [17 — Design Patterns](17-design-patterns.md)
