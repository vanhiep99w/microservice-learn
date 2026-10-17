# 🛒 Case Study: Thiết kế kiến trúc Microservice cho E-Commerce Platform

## 📋 Mục lục

- [Đề bài](#-đề-bài)
  - [Bối cảnh](#bối-cảnh)
  - [Quy mô hệ thống](#quy-mô-hệ-thống)
  - [Các module hiện tại trong Monolith](#các-module-hiện-tại-trong-monolith)
- [Yêu cầu chức năng (Functional Requirements)](#-yêu-cầu-chức-năng-functional-requirements)
- [Yêu cầu phi chức năng (Non-Functional Requirements)](#-yêu-cầu-phi-chức-năng-non-functional-requirements)
- [Phần 1 — Phân tích Domain & Bounded Context](#phần-1--phân-tích-domain--bounded-context)
  - [1.1. Xác định Domain và Subdomain](#11-xác-định-domain-và-subdomain)
  - [1.2. Xác định Bounded Context](#12-xác-định-bounded-context)
  - [1.3. Ubiquitous Language](#13-ubiquitous-language)
  - [1.4. Context Mapping](#14-context-mapping)
  - [1.5. Event Storming — Checkout Flow](#15-event-storming--checkout-flow)
  - [1.6. Ownership Matrix theo Team](#16-ownership-matrix-theo-team)
  - [1.7. Domain Invariants (Bất biến nghiệp vụ)](#17-domain-invariants-bất-biến-nghiệp-vụ)
- [Phần 2 — Decompose Services](#phần-2--decompose-services)
  - [2.1. Nguyên tắc Decomposition](#21-nguyên-tắc-decomposition)
  - [2.2. Danh sách Services chi tiết](#22-danh-sách-services-chi-tiết)
  - [2.3. Service Dependency Graph](#23-service-dependency-graph)
  - [2.4. Strangler Fig Migration Plan](#24-strangler-fig-migration-plan)
  - [2.5. Service API Contracts quan trọng](#25-service-api-contracts-quan-trọng)
  - [2.6. Team Topology và Release Ownership](#26-team-topology-và-release-ownership)
- [Phần 3 — Inter-Service Communication](#phần-3--inter-service-communication)
  - [3.1. Quy tắc chọn Sync vs Async](#31-quy-tắc-chọn-sync-vs-async)
  - [3.2. Communication Matrix](#32-communication-matrix)
  - [3.3. Event Taxonomy & Catalog](#33-event-taxonomy--catalog)
  - [3.4. API Gateway Design](#34-api-gateway-design)
  - [3.5. Service Discovery](#35-service-discovery)
  - [3.6. Sequence Diagram — Complete Checkout Flow](#36-sequence-diagram--complete-checkout-flow)
  - [3.7. Sequence Diagram — Flash Sale Flow](#37-sequence-diagram--flash-sale-flow)
  - [3.8. Idempotency & Exactly-Once Semantics](#38-idempotency--exactly-once-semantics-thực-tế)
  - [3.9. Message Broker Design (Kafka/SQS)](#39-message-broker-design-kafkasqs)
- [Phần 4 — Data Management & Patterns](#phần-4--data-management--patterns)
  - [4.1. Database per Service — Polyglot Persistence](#41-database-per-service--polyglot-persistence)
  - [4.2. Saga Pattern cho Order Flow](#42-saga-pattern-cho-order-flow)
  - [4.3. CQRS — Áp dụng ở đâu?](#43-cqrs--áp-dụng-ở-đâu)
  - [4.4. Event Sourcing — Decision](#44-event-sourcing--decision)
  - [4.5. Transactional Outbox Pattern](#45-transactional-outbox-pattern)
  - [4.6. Data Consistency Rules](#46-data-consistency-rules)
  - [4.7. Schema chi tiết cho Order & Inventory](#47-schema-chi-tiết-cho-order--inventory-thực-chiến)
  - [4.8. Concurrency Control & Reconciliation Jobs](#48-concurrency-control--reconciliation-jobs)
- [Phần 5 — Resilience & Reliability](#phần-5--resilience--reliability)
  - [5.1. Mục tiêu Resilience](#51-mục-tiêu-resilience)
  - [5.2. Circuit Breaker — Áp dụng ở đâu?](#52-circuit-breaker--áp-dụng-ở-đâu)
  - [5.3. Retry Policy](#53-retry-policy)
  - [5.4. Bulkhead Pattern](#54-bulkhead-pattern)
  - [5.5. Rate Limiting](#55-rate-limiting)
  - [5.6. Timeout Configuration](#56-timeout-configuration)
  - [5.7. Fallback Strategies](#57-fallback-strategies)
  - [5.8. Chaos Engineering Plan](#58-chaos-engineering-plan)
  - [5.9. Defense in Depth — Thứ tự áp dụng](#59-defense-in-depth--thứ-tự-áp-dụng)
  - [5.10. Capacity Planning cho Flash Sale](#510-capacity-planning-cho-flash-sale)
  - [5.11. Runbook SEV-1: Checkout Down](#511-runbook-sev-1-checkout-down)
- [Phần 6 — Observability](#phần-6--observability)
  - [6.1. Mục tiêu Observability cho ShopVN](#61-mục-tiêu-observability-cho-shopvn)
  - [6.2. Kiến trúc Telemetry tổng thể](#62-kiến-trúc-telemetry-tổng-thể)
  - [6.3. Logging Strategy](#63-logging-strategy)
  - [6.4. Metrics Framework (RED + USE)](#64-metrics-framework-red--use)
  - [6.5. SLI/SLO và Error Budget](#65-slislo-và-error-budget)
  - [6.6. Distributed Tracing](#66-distributed-tracing)
  - [6.7. Alerting Rules theo mức độ](#67-alerting-rules-theo-mức-độ)
  - [6.8. Dashboard Design](#68-dashboard-design)
  - [6.9. Runbook mẫu: Payment error tăng đột biến](#69-runbook-mẫu-payment-error-tăng-đột-biến)
  - [6.10. Log Retention, Sampling, và Cost Control](#610-log-retention-sampling-và-cost-control)
- [Phần 7 — Security Architecture](#phần-7--security-architecture)
  - [7.1. Security Principles](#71-security-principles)
  - [7.2. AuthN/AuthZ cho người dùng cuối](#72-authnauthz-cho-người-dùng-cuối)
  - [7.3. Service-to-Service Security](#73-service-to-service-security)
  - [7.4. API Security Controls](#74-api-security-controls)
  - [7.5. Data Protection](#75-data-protection)
  - [7.6. Secrets Management](#76-secrets-management)
  - [7.7. Threat Modeling (STRIDE) cho Checkout](#77-threat-modeling-stride-cho-checkout)
  - [7.8. Security Testing Pipeline](#78-security-testing-pipeline)
  - [7.9. Incident Response](#79-incident-response)
  - [7.10. Compliance Checklist (PCI-DSS, OWASP ASVS)](#710-compliance-checklist-pci-dss-owasp-asvs)
- [Phần 8 — Infrastructure & Deployment](#phần-8--infrastructure--deployment)
  - [8.1. Mục tiêu nền tảng hạ tầng](#81-mục-tiêu-nền-tảng-hạ-tầng)
  - [8.2. Topology môi trường](#82-topology-môi-trường)
  - [8.3. Compute Strategy theo loại workload](#83-compute-strategy-theo-loại-workload)
  - [8.4. Network & Edge Architecture](#84-network--edge-architecture)
  - [8.5. Container Standards](#85-container-standards)
  - [8.6. Autoscaling Policy](#86-autoscaling-policy)
  - [8.7. CI/CD Pipeline chi tiết](#87-cicd-pipeline-chi-tiết)
  - [8.8. Deployment Strategy theo service](#88-deployment-strategy-theo-service)
  - [8.9. Backup, DR, và BCP](#89-backup-dr-và-bcp)
  - [8.10. IaC Structure & Environment Promotion](#810-iac-structure--environment-promotion)
- [Phần 9 — So sánh các Solution Infrastructure](#phần-9--so-sánh-các-solution-infrastructure)
  - [9.1. 3 phương án cho ShopVN](#91-3-phương-án-cho-shopvn)
  - [9.2. So sánh định tính](#92-so-sánh-định-tính)
  - [9.3. Ước lượng chi phí tương đối (tham chiếu)](#93-ước-lượng-chi-phí-tương-đối-tham-chiếu)
  - [9.4. Decision đề xuất cho ShopVN](#94-decision-đề-xuất-cho-shopvn)
  - [9.5. Migration Path 3 giai đoạn](#95-migration-path-3-giai-đoạn)
  - [9.6. Weighted Decision Matrix](#96-weighted-decision-matrix)
- [Phần 10 — Tổng kết Architecture Decision Records](#phần-10--tổng-kết-architecture-decision-records)
  - [10.1. Danh sách ADR chính](#101-danh-sách-adr-chính)
  - [10.2. ADR template đề xuất](#102-adr-template-đề-xuất)
  - [10.3. Trade-off tổng thể](#103-trade-off-tổng-thể)
  - [10.4. KPI đánh giá thành công sau migration](#104-kpi-đánh-giá-thành-công-sau-migration)
  - [10.5. Kết luận case study](#105-kết-luận-case-study)
  - [10.6. Backlog thực thi 90 ngày đầu](#106-backlog-thực-thi-90-ngày-đầu)

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

```d2 title="Các module hiện tại trong Monolith"
direction: down
monolith: ShopVN Monolith {
 modules: Modules {
  m0: "User"
  m1: "Product"
  m2: "Order"
  m3: "Payment"
  m4: "Inventory"
  m5: "Shopping Cart"
  m6: "Promotion"
  m7: "Notification"
  m8: "Shipping"
  m9: "Review"
  m10: "Search"
 }
 db: Single PostgreSQL {shape: cylinder}
 modules -> db
}
# Icons: https://icons.d2lang.com/
monolith.db.icon: "https://icons.d2lang.com/dev/postgresql.svg"
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

### 1.1. Xác định Domain và Subdomain

**E-Commerce** là domain chính của ShopVN. Theo phương pháp Domain-Driven Design (DDD), ta phân tích domain thành các **Subdomain** với 3 loại:

- **Core Domain** — Tạo lợi thế cạnh tranh trực tiếp, cần đầu tư nhiều nhất
- **Supporting Domain** — Hỗ trợ Core Domain, tùy chỉnh theo đặc thù business
- **Generic Domain** — Không tạo khác biệt, có thể dùng SaaS hoặc thư viện có sẵn

| Subdomain | Loại | Lý do phân loại | Hướng đầu tư |
|-----------|------|-----------------|--------------|
| **Order Management** | 🔴 Core | Quy trình đặt hàng là trải nghiệm cốt lõi, cần tối ưu cho thị trường VN (COD chiếm ~60%) | Team senior, tự phát triển 100% |
| **Payment** | 🔴 Core | Tích hợp MoMo, ZaloPay, VNPay — hệ sinh thái thanh toán đặc thù VN | Team senior, ACL wrapper cho providers |
| **Inventory** | 🔴 Core | Quản lý 500K SKU, flash sale cần xử lý race condition, tránh oversell | Team senior, Redis + DB locking |
| **Product Catalog** | 🟡 Supporting | Quản lý sản phẩm, category — cần tùy chỉnh cho 5K merchants VN | Team mid-senior |
| **Search & Discovery** | 🟡 Supporting | Tìm kiếm tiếng Việt có dấu, gợi ý thông minh — đặc thù ngôn ngữ | Elasticsearch + custom analyzer |
| **Promotion** | 🟡 Supporting | Voucher, flash sale, combo — chiến lược marketing đặc thù | Rule engine tự phát triển |
| **Review & Rating** | 🟡 Supporting | Nội dung UGC tạo niềm tin cho buyer VN | Moderation pipeline |
| **Recommendation** | 🟡 Supporting | Gợi ý sản phẩm dựa trên hành vi — tăng conversion rate | ML model + feature store |
| **Shopping Cart** | 🟡 Supporting | Session-based, merge khi login — cần hiệu năng cao | Redis-backed |
| **Shipping/Fulfillment** | 🟡 Supporting | Tích hợp GHN, GHTK, Viettel Post — đối tác vận chuyển VN | Adapter pattern cho từng carrier |
| **Notification** | ⚪ Generic | Email, SMS, push — không tạo khác biệt cạnh tranh | SES, Firebase FCM, eSMS |
| **User & Auth** | ⚪ Generic | Đăng nhập, OAuth, quản lý profile — bài toán đã có lời giải | Cognito / Keycloak + custom profile |

```d2 title="1.1. Xác định Domain và Subdomain"
direction: down
n3: "⚪ Generic Domain" {}
n2: "🟡 Supporting Domain" {}
n1: "🔴 Core Domain" {}
n1.n4: "Order Management"
n1.n5: "Payment"
n1.n6: "Inventory"
n2.n7: "Product Catalog"
n2.n8: "Search & Discovery"
n2.n9: "Promotion"
n2.n10: "Review & Rating"
n2.n11: "Recommendation"
n2.n12: "Shopping Cart"
n2.n13: "Shipping/Fulfillment"
n3.n14: "Notification"
n3.n15: "User & Auth"
n1.n4 -> n1.n5
n1.n4 -> n1.n6
n2.n7 -> n2.n8
n2.n12 -> n1.n4
n1.n4 -> n2.n13
n1.n4 -> n3.n14
n2.n11 -> n2.n7
```

### 1.2. Xác định Bounded Context

Mỗi **Bounded Context (BC)** đại diện cho một ranh giới ngữ nghĩa rõ ràng. Từ 12 functional requirements, ta xác định 12 BC:

| # | Bounded Context | Functional Req | Aggregate chính | Ranh giới dữ liệu |
|---|----------------|----------------|-----------------|-------------------|
| 1 | **Identity & Access** | User Management | `User`, `Role`, `Session` | Credentials, OAuth tokens, profile |
| 2 | **Catalog** | Product Catalog | `Product`, `Category`, `Attribute` | Product info, media, category tree |
| 3 | **Discovery** | Search & Discovery | `SearchIndex`, `Suggestion` | Search index (derived), ranking |
| 4 | **Cart** | Shopping Cart | `Cart`, `CartItem` | Cart state, item snapshots |
| 5 | **Order** | Order Management | `Order`, `OrderItem`, `Return` | Order lifecycle, history |
| 6 | **Payment** | Payment | `Payment`, `Transaction`, `Refund` | Payment records, transactions |
| 7 | **Inventory** | Inventory | `Stock`, `Reservation` | Stock levels, reservations |
| 8 | **Promotion** | Promotion | `Voucher`, `Campaign`, `FlashSale` | Promotion rules, usage tracking |
| 9 | **Fulfillment** | Shipping | `Shipment`, `Tracking`, `Carrier` | Shipping records, tracking events |
| 10 | **Engagement** | Notification | `Notification`, `Template` | Notification logs, preferences |
| 11 | **Trust & UGC** | Review & Rating | `Review`, `Rating`, `Report` | Reviews, moderation queue |
| 12 | **Personalization** | Recommendation | `Signal`, `Model` | Behavioral data, ML features |

**Nguyên tắc mapping:**
- **1 BC = 1 Service** (khởi đầu). Khi service quá lớn, có thể tách tiếp
- Mỗi BC sở hữu **database riêng** — không chia sẻ schema
- Giao tiếp giữa BC qua **API** hoặc **Domain Event**

### 1.3. Ubiquitous Language

| Thuật ngữ | Bounded Context | Định nghĩa chính xác |
|-----------|----------------|----------------------|
| `User` | Identity & Access | Người dùng đã đăng ký, có credentials |
| `Buyer` | Order | Người đặt hàng (user logged in hoặc guest) |
| `Merchant` | Catalog | Nhà bán hàng đã xác minh |
| `Product` | Catalog | Đơn vị sản phẩm gồm mô tả, hình ảnh, thuộc tính, giá gốc |
| `SKU` | Catalog / Inventory | Stock Keeping Unit — biến thể cụ thể (size, color) |
| `CartItem` | Cart | Snapshot của SKU tại thời điểm thêm vào giỏ + quantity |
| `Order` | Order | Đơn hàng đã xác nhận, gồm items, tổng tiền, trạng thái |
| `Payment` | Payment | Giao dịch thanh toán cho một Order |
| `Stock` | Inventory | Số lượng tồn kho khả dụng (available) của một SKU |
| `Reservation` | Inventory | Giữ chỗ tạm cho stock khi checkout — TTL 15 phút |
| `Voucher` | Promotion | Mã giảm giá có điều kiện (min order, thời hạn) |
| `FlashSale` | Promotion | Bán giá sốc trong khung giờ cố định, giới hạn số lượng |
| `Shipment` | Fulfillment | Đơn vận chuyển gửi tới carrier, có tracking number |
| `Review` | Trust & UGC | Đánh giá text + hình ảnh của buyer, cần moderation |

> ⚠️ **Lưu ý:** `Product` trong **Catalog BC** là source of truth. Trong **Cart BC** và **Order BC**, ta chỉ lưu **snapshot** — tránh bị ảnh hưởng khi merchant cập nhật giá.

### 1.4. Context Mapping

```d2 title="1.4. Context Mapping"
direction: down
n1: "Identity & Access"
n2: "Catalog"
n3: "Discovery"
n4: "Cart"
n5: "Order"
n6: "Payment"
n7: "Inventory"
n8: "Promotion"
n9: "Fulfillment"
n10: "Engagement"
n11: "Trust & UGC"
n12: "Personalization"
n13: "External Payment"
n14: "External Shipping"
n2 -> n3: "Published Language\nProductUpdated event"
n3 -> n2: "Conformist\nConsume Catalog data" { style.stroke-dash: 5 }
n4 -> n5: "Customer-Supplier"
n5 -> n6: "Customer-Supplier"
n5 -> n7: "Customer-Supplier\nReserve stock"
n5 -> n8: "Customer-Supplier"
n5 -> n9: "Customer-Supplier"
n6 -> n13: "ACL\nWrap MoMo/ZaloPay" { style.stroke-dash: 5 }
n9 -> n14: "ACL\nWrap GHN/GHTK" { style.stroke-dash: 5 }
n5 -> n10: "Published Language\nOrderPlaced event"
n5 -> n12: "Published Language"
n11 -> n2: "Published Language\nReviewApproved"
n1 -> n5: "Open Host Service\nJWT validation"
n1 -> n4: "Open Host Service"
```

**Chi tiết Context Mapping Patterns:**

| Upstream (U) | Downstream (D) | Pattern | Mô tả |
|-------------|----------------|---------|-------|
| Catalog | Discovery | **Conformist** | Discovery chấp nhận hoàn toàn model của Catalog, re-index khi nhận event |
| Order | Inventory | **Customer-Supplier** | Order yêu cầu reserve stock, Inventory cung cấp API theo nhu cầu |
| Order | Payment | **Customer-Supplier** | Order khởi tạo payment request, Payment callback kết quả |
| Payment | MoMo/ZaloPay | **Anti-Corruption Layer** | Wrap API bên ngoài bằng Adapter, model nội bộ thống nhất |
| Fulfillment | GHN/GHTK | **Anti-Corruption Layer** | Chuẩn hóa thành `Shipment` + `TrackingEvent` nội bộ |
| Identity & Access | Tất cả BC | **Open Host Service** | JWT validation endpoint chuẩn cho mọi service |
| Trust & UGC | Catalog | **Published Language** | ReviewApproved → Catalog cập nhật average rating |

### 1.5. Event Storming — Checkout Flow

```d2 title="1.5. Event Storming — Checkout Flow"
direction: right
place: "🟦 PlaceOrder"
cart: "🟨 Cart"
checked: "🟧 CartCheckedOut"
create: "🟦 CreateOrder"
order: "🟨 Order"
created: "🟧 OrderCreated"
voucher: "🟦 ApplyVoucher"
promotion: "🟨 Promotion"
applied: "🟧 VoucherApplied"
rejected: "🟧 VoucherRejected"
pay: "🟦 InitiatePayment"
payment: "🟨 Payment"
paid: "🟧 PaymentCompleted"
failed: "🟧 PaymentFailed"
compensation: "🟪 Release stock / Restore voucher"
confirmed: "🟧 OrderConfirmed"
reserve: "🟦 ReserveStock"
inventory: "🟨 Inventory"
reserved: "🟧 StockReserved"
stockfailed: "🟧 StockReservationFailed"
shipment: "🟦 CreateShipment"
notify: "🟪 Notify buyer — Đơn xác nhận / Merchant — Có đơn mới"
place -> cart
cart -> checked
checked -> create
create -> order
order -> created
created -> voucher
voucher -> promotion
promotion -> applied: "Thành công"
promotion -> rejected: "Thất bại"
created -> pay
pay -> payment
payment -> paid: "Thành công"
payment -> failed: "Thất bại"
failed -> compensation
paid -> confirmed
created -> reserve
reserve -> inventory
inventory -> reserved: "Thành công"
inventory -> stockfailed: "Thất bại"
confirmed -> shipment
confirmed -> notify
```

Legend: 🟦 Command · 🟨 Aggregate · 🟧 Domain Event · 🟪 Policy. Đây là bản đồ Event Storming; fan-out không có nghĩa các bước luôn chạy đồng thời hoặc chỉ PaymentCompleted đã đủ mọi điều kiện confirm.

**Key takeaways:**

1. **Saga Pattern cần thiết** — Flow span qua 5 BC, cần Orchestration Saga cho compensating actions
2. **Stock Reservation có TTL** — Payment không hoàn thành trong 15 phút → reservation tự động release
3. **Price snapshot tại checkout** — Giá "đóng băng" khi buyer đặt hàng
4. **COD flow khác biệt** — `PaymentCompleted` chỉ xảy ra khi shipper thu tiền thành công

### 1.6. Ownership Matrix theo Team

| Team | Services sở hữu | On-call | KPI chính |
|------|------------------|---------|-----------|
| Team Core Commerce | Order, Inventory, Promotion | 24/7 | Checkout success, oversell rate |
| Team Payment | Payment, Refund | 24/7 | Payment success, callback latency |
| Team Discovery | Catalog, Search, Recommendation | Giờ hành chính + trực sự kiện | Search latency, CTR |
| Team Experience | Gateway, Cart, User | 24/7 | API error rate, login success |
| Team Engagement | Notification, Review | Giờ hành chính | Delivery success, moderation SLA |
| Platform/SRE | CI/CD, Observability, Security baseline | 24/7 | MTTR, SLO compliance |

**Quy tắc ownership:**

- Service chỉ có **một owner chính**.
- Shared library phải có versioning và backward compatibility.
- Incident SEV-1 bắt buộc có Incident Commander từ team owning service lỗi.

### 1.7. Domain Invariants (Bất biến nghiệp vụ)

| Invariant | Mô tả | Enforced tại |
|----------|-------|--------------|
| Không oversell | `available_stock >= 0` mọi thời điểm commit | Inventory Service |
| Mỗi order có đúng 1 trạng thái tại 1 thời điểm | State machine không cho transition sai | Order Service |
| Mỗi payment callback xử lý tối đa 1 lần | Idempotency theo `payment_provider_txn_id` | Payment Service |
| Voucher usage không vượt quota | `used_count <= quota` | Promotion Service |
| Review chỉ được tạo sau khi giao hàng thành công | Chỉ mở API review sau `shipment.delivered` | Review Service |
| Snapshot giá order bất biến | Không thay đổi `unit_price_snapshot` sau confirm | Order DB |

---

## Phần 2 — Decompose Services

> 🔗 Áp dụng kiến thức từ [05 — Decomposition Strategies](05-decomposition-strategies.md) và [03 — Loose Coupling & High Cohesion](03-loose-coupling-high-cohesion.md)

### 2.1. Nguyên tắc Decomposition

| Nguyên tắc | Mô tả | Ví dụ ShopVN |
|------------|-------|-------------|
| **1:1 BC → Service** | Mỗi BC map thành 1 microservice | Order BC → Order Service |
| **Single Responsibility** | Mỗi service chỉ có một lý do để thay đổi | Payment Service chỉ thay đổi khi logic thanh toán đổi |
| **Own Your Data** | Service sở hữu database riêng | Order có `order_db`, Inventory có `inventory_db` |
| **High Cohesion** | Chức năng liên quan chặt nằm cùng service | Product CRUD + Category + Attribute → Catalog Service |
| **Loose Coupling** | Thay đổi A không yêu cầu đổi B | Payment thêm VNPay không ảnh hưởng Order |
| **Team Ownership** | 1 team sở hữu 1-2 services (2-pizza team) | Team 4-6 người/service |

### 2.2. Danh sách Services chi tiết

| # | Service | Trách nhiệm chính | API chính | Data Owned | Tech Stack |
|---|---------|-------------------|-----------|------------|------------|
| 0 | **API Gateway** | Auth verify, routing, rate limiting, SSL termination | `/*` (proxy) | Rate limit counters | Kong / AWS ALB |
| 1 | **Auth Service** | Đăng ký, đăng nhập, OAuth, JWT issue/refresh | `POST /auth/login`<br/>`POST /auth/refresh` | Credentials, sessions, OAuth tokens | Node.js, PostgreSQL, Redis |
| 2 | **User Service** | Profile, address book, merchant registration | `GET/PUT /users/{id}`<br/>`POST /merchants/register` | Profiles, addresses, merchant info | Node.js, PostgreSQL |
| 3 | **Catalog Service** | Product CRUD, category tree, media upload | `GET/POST /products`<br/>`GET /categories` | Products, categories, attributes | Java/Spring, PostgreSQL, S3 |
| 4 | **Search Service** | Full-text search, faceted search, autosuggest | `GET /search?q=`<br/>`GET /suggest?q=` | Search index (derived) | Python/FastAPI, OpenSearch |
| 5 | **Cart Service** | Add/remove items, merge guest→user cart | `GET/POST /carts/{userId}/items` | Cart state (Redis) | Node.js, Redis, DynamoDB |
| 6 | **Order Service** | Order creation, lifecycle, Saga orchestrator | `POST /orders`<br/>`GET /orders/{id}` | Orders, order_items, saga_state | Java/Spring, PostgreSQL |
| 7 | **Payment Service** | Payment initiation, callback, refund | `POST /payments/initiate`<br/>`POST /payments/callback` | Payments, transactions | Java/Spring, PostgreSQL |
| 8 | **Inventory Service** | Stock management, reservation (hold/commit/release) | `POST /inventory/reserve`<br/>`POST /inventory/commit` | Stocks, reservations | Go, PostgreSQL, Redis |
| 9 | **Promotion Service** | Voucher CRUD, flash sale, rule engine | `POST /promotions/validate`<br/>`GET /flash-sales/active` | Vouchers, campaigns | Java/Spring, PostgreSQL, Redis |
| 10 | **Shipping Service** | Shipping fee calc, carrier selection, tracking | `POST /shipping/calculate`<br/>`POST /shipments` | Shipments, tracking_events | Node.js, PostgreSQL |
| 11 | **Notification Service** | Multi-channel notification (push, SMS, email) | `POST /notifications/send` | Notifications, templates | Node.js, MongoDB, SQS |
| 12 | **Review Service** | Submit review, moderation, rating aggregation | `POST /reviews`<br/>`GET /products/{id}/reviews` | Reviews, ratings | Node.js, MongoDB |
| 13 | **Recommendation Service** | Gợi ý sản phẩm dựa trên hành vi, "Mua cùng" | `GET /recommendations/{userId}` | Behavioral data, ML features | Python, Redis, PostgreSQL |

### 2.3. Service Dependency Graph

Trên website, bấm **Explore diagram** để zoom/pan, mở rộng hoặc tải SVG; sơ đồ vẫn đọc được khi chưa bật tương tác.

```d2 interactive title="2.3. Service Dependency Graph"
direction: down
n1: "API Gateway"
n2: "Auth Service"
n3: "User Service"
n4: "Catalog Service"
n5: "Search Service"
n6: "Cart Service"
n7: "Order Service"
n8: "Inventory Service"
n9: "Payment Service"
n10: "Promotion Service"
n11: "Shipping Service"
n12: "MoMo/ZaloPay/VNPay" {
  style.fill: "#f9f"
  style.stroke: "#333"
}
n13: "GHN/GHTK" {
  style.fill: "#f9f"
  style.stroke: "#333"
}
n14: "Recommendation"
n15: "Notification Service"
n16: "Review Service"
n1 -> n2
n1 -> n3
n1 -> n4
n1 -> n5
n1 -> n6
n1 -> n7
n7 -> n8
n7 -> n9
n7 -> n10
n7 -> n11
n9 -> n12
n11 -> n13
n4 -> n5: "CDC events"
n4 -> n14: "events"
n7 -> n15: "events"
n7 -> n16: "events"
```

**Quy tắc dependency:**
- **User/Catalog** là upstream (ít dependency)
- **Order** là orchestrator (có nhiều downstream nhất)
- **Notification** chỉ subscribe events (không ai phụ thuộc vào nó)
- **Không có circular dependency** — nếu A → B thì B không → A (qua event nếu cần)

### 2.4. Strangler Fig Migration Plan

Migrate từ Monolith sang Microservices theo từng phase, **không big-bang rewrite**:

```mermaid
gantt
    title Strangler Fig Migration — ShopVN
    dateFormat  YYYY-MM
    axisFormat  %Y-%m

    section Phase 0 - Foundation
    API Gateway + Auth facade     :p0, 2025-01, 2M
    
    section Phase 1 - Read-heavy
    Search Service (low risk)     :p1, after p0, 2M
    
    section Phase 2 - Catalog
    Catalog + CDC → Search        :p2, after p1, 3M
    
    section Phase 3 - Cart
    Cart Service (Redis)          :p3, after p2, 1M
    
    section Phase 4 - Core
    Order + Payment + Inventory   :p4, after p3, 4M
    
    section Phase 5 - Supporting
    Promotion + Shipping + Notif  :p5, after p4, 3M
    
    section Phase 6 - Enhance
    Review + Recommendation       :p6, after p5, 3M
```

| Phase | Services | Duration | Risk Level | Rollback Strategy |
|-------|----------|----------|------------|-------------------|
| **Phase 0** | API Gateway, Auth facade | 2 tháng | 🟢 Low | Bypass gateway, direct to monolith |
| **Phase 1** | Search Service | 2 tháng | 🟢 Low | Fallback to monolith search module |
| **Phase 2** | Catalog + CDC | 3 tháng | 🟡 Medium | Feature flag toggle old/new catalog |
| **Phase 3** | Cart Service | 1 tháng | 🟢 Low | Fallback to session-based cart |
| **Phase 4** | Order + Payment + Inventory | 4 tháng | 🔴 High | Parallel run + shadow traffic |
| **Phase 5** | Promotion, Shipping, Notification | 3 tháng | 🟡 Medium | Feature flag per module |
| **Phase 6** | Review, Recommendation | 3 tháng | 🟢 Low | Disable features, no business impact |

**Tổng thời gian: ~18 tháng** — Monolith vẫn chạy song song trong suốt quá trình migrate.

### 2.5. Service API Contracts quan trọng

**`POST /orders` (Order Service):**

```json source="snippets/2-5-service-api-contracts-quan-trong.json"
{
  "userId": "USR-9821",
  "items": [
    { "skuId": "SKU-RED-42", "qty": 1 },
    { "skuId": "SKU-BLACK-38", "qty": 2 }
  ],
  "voucherCode": "SALE50",
  "shippingAddressId": "ADDR-102",
  "paymentMethod": "vnpay"
}
```

**Payload tạo order: đọc contract theo field — các field cần chú ý:**

- **Người dùng trong ví dụ** (`/userId`): Không tin userId do client gửi nếu chưa đối chiếu identity đã xác thực.

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=25-case-study-ecommerce&snapshot=article&file=snippets%2F2-5-service-api-contracts-quan-trong.json)

**Response:**

```json
{
  "orderId": "ORD-20260227-8891",
  "status": "PAYMENT_PENDING",
  "paymentUrl": "https://sandbox.vnpay.vn/....",
  "expiresAt": "2026-02-27T10:30:00Z"
}
```

| Quy tắc contract | Mục tiêu |
|------------------|----------|
| Version theo URL (`/v1`) + schema registry cho event | Tránh breaking change |
| Field mới phải optional ở version cũ | Backward compatible |
| Error code chuẩn hóa liên service | Dễ xử lý phía client |
| Có `x-request-id` và `idempotency-key` | Truy vết + chống double submit |

### 2.6. Team Topology và Release Ownership

| Loại thay đổi | Team quyết định | Team review bắt buộc |
|--------------|------------------|----------------------|
| Checkout logic | Core Commerce | Payment + Platform |
| Payment provider integration | Payment | Security + Core Commerce |
| Search ranking | Discovery | Product + Data |
| Gateway policy/rate limit | Experience | Security + SRE |
| CI/CD template chuẩn | Platform | Tất cả service owners |

**Release cadence đề xuất:**

- Core services (`Order`, `Payment`, `Inventory`): 2-3 lần/tuần.
- Supporting services: 1-2 lần/tuần.
- Hạ tầng shared: theo change window cố định để giảm blast radius.

---

## Phần 3 — Inter-Service Communication

> 🔗 Áp dụng kiến thức từ [06 — Inter-Service Communication](06-inter-service-communication.md), [07 — API Gateway](07-api-gateway.md), [08 — Service Discovery](08-service-discovery.md)

### 3.1. Quy tắc chọn Sync vs Async

```d2 title="3.1. Quy tắc chọn Sync vs Async"
direction: down
waiting: User cần response ngay? {shape: diamond}
sync: Sync — REST / gRPC với deadline
immediate: Cần kết quả ngay? {shape: diamond}
sideeffect: Side effect / Fan-out? {shape: diamond}
eventual: Eventual consistency chấp nhận được? {shape: diamond}
async: Async Event
strong: Thiết kế consistency / Transaction boundary cần thiết
waiting -> sync: Có
waiting -> immediate: Không
immediate -> sync: Có
immediate -> sideeffect: Không
sideeffect -> async: Có
sideeffect -> eventual: Không
eventual -> async: Có
eventual -> strong: Không
```

Sync không tự tạo strong consistency giữa nhiều service. Tác vụ dài có thể trả202 + Status URL dù người dùng khởi tạo từ UI; chọn theo contract và business invariants.

### 3.2. Communication Matrix

| Flow | Bước | Sync/Async | Protocol | Lý do |
|------|------|------------|----------|-------|
| **Browse Products** | Gateway → Catalog/Search | Sync | REST | User-facing, P95 < 200ms |
| **Add to Cart** | Gateway → Cart | Sync | REST | Confirm ngay cho user |
| **Cart price check** | Cart → Catalog | Sync | gRPC | Cần giá hiện tại, internal call |
| **Checkout** | Order → Inventory reserve | Sync | gRPC | Cần quyết định ngay (còn hàng?) |
| **Create Payment** | Order → Payment | Sync | gRPC | Cần payment_url trả cho user |
| **Payment captured** | Payment → Order | **Async** | Event | Decouple, webhook-based, reliable |
| **Create shipment** | Order → Shipping | **Async** | Event | Có thể delay, không block user |
| **Notification** | Order/Payment → Notification | **Async** | Event | Fan-out, không critical path |
| **Search index update** | Catalog → Search | **Async** | Event+CDC | Eventual consistency OK |
| **Rating update** | Review → Catalog | **Async** | Event | Aggregate tính toán async |
| **Recommendation** | Order → Recommendation | **Async** | Event | ML pipeline, batch process |
| **Flash sale stock check** | Cart → Inventory | Sync | gRPC | Cần real-time stock, atomic |

### 3.3. Event Taxonomy & Catalog

**Phân loại event:**
- **Domain Event** — Sự kiện nội bộ BC: `OrderPlaced`, `StockReserved`
- **Integration Event** — Public, versioned schema: `order.placed.v1`
- **Command** — Yêu cầu hành động: `ReserveStockCommand`

**Naming convention:** Past tense, aggregate + action, versioned

| Event | Producer | Consumers | Key Payload | Ordering Key |
|-------|----------|-----------|-------------|-------------|
| `order.created.v1` | Order | Inventory, Promotion | orderId, userId, items[] | orderId |
| `order.confirmed.v1` | Order | Shipping, Notification, Recommendation | orderId, items, address | orderId |
| `order.cancelled.v1` | Order | Inventory, Promotion, Notification | orderId, reason | orderId |
| `payment.initiated.v1` | Payment | Order | paymentId, orderId, amount | orderId |
| `payment.captured.v1` | Payment | Order, Notification | paymentId, orderId, amount | orderId |
| `payment.failed.v1` | Payment | Order, Notification | paymentId, orderId, reason | orderId |
| `payment.refunded.v1` | Payment | Order, Notification | paymentId, orderId, refundAmount | orderId |
| `stock.reserved.v1` | Inventory | Order | reservationId, orderId, expiresAt | orderId |
| `stock.released.v1` | Inventory | Order | reservationId, orderId | orderId |
| `stock.low.v1` | Inventory | Notification, Catalog | skuId, currentStock, threshold | skuId |
| `product.created.v1` | Catalog | Search, Recommendation | productId, name, category, price | productId |
| `product.updated.v1` | Catalog | Search, Cart | productId, changedFields | productId |
| `product.price_changed.v1` | Catalog | Search, Cart, Promotion | productId, oldPrice, newPrice | productId |
| `review.approved.v1` | Review | Catalog (rating update) | reviewId, productId, rating | productId |
| `shipment.created.v1` | Shipping | Order, Notification | shipmentId, orderId, tracking | orderId |
| `shipment.delivered.v1` | Shipping | Order, Notification, Review | shipmentId, orderId | orderId |
| `voucher.applied.v1` | Promotion | Order | voucherId, orderId, discount | orderId |
| `user.registered.v1` | Auth | User, Notification | userId, email | userId |
| `flash_sale.started.v1` | Promotion | Search, Catalog, Notification | campaignId, products[], startTime | campaignId |
| `flash_sale.ended.v1` | Promotion | Search, Catalog | campaignId | campaignId |

### 3.4. API Gateway Design

```d2 title="3.4. API Gateway Design"
direction: right
internet: "Internet"
cdn: "CloudFront CDN"
alb: "ALB"
gateway: "Application API Gateway"
internet -> cdn
cdn -> alb
alb -> gateway
# Icons: https://icons.d2lang.com/
cdn.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-CloudFront.svg"
alb.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Elastic-Load-Balancing-ELB_Application-load-balancer_light-bg.svg"
```

Sơ đồ dùng application API Gateway sau ALB; không ngụ ý đây là thứ tự bắt buộc của Amazon API Gateway managed. TLS nội bộ vẫn có thể dùng HTTPS/mTLS theo threat model.

| Responsibility | Chi tiết |
| --- | --- |

| Path pattern | Target service |
| --- | --- |

### 3.5. Service Discovery

> 🔗 Kiến thức nền tảng: [08 — Service Discovery](08-service-discovery.md)

#### Service Discovery là gì và tại sao cần?

Trong môi trường containerized (ECS, Kubernetes), mỗi service instance được cấp **IP động** — thay đổi mỗi khi container restart, scale, hoặc deploy phiên bản mới. Không thể hardcode IP address trong config.

**Service Discovery** giải quyết bài toán: **"Service A muốn gọi Service B — gọi đến đâu?"**

```
❌ Không có Service Discovery:
   Order Service → http://10.0.3.47:3003  ← IP cứng, container restart = mất kết nối

✅ Có Service Discovery:
   Order Service → http://order-service.shopvn.local:3003  ← DNS tự resolve đúng IP
```

#### Hai hướng tiếp cận chính

| Tiêu chí | Client-side Discovery | Server-side / Platform-based Discovery |
|----------|----------------------|----------------------------------------|
| **Cách hoạt động** | Service tự query registry (Consul, Eureka) rồi chọn instance | Platform (ECS, K8s) tự quản lý DNS/load balancing |
| **Library cần thiết** | Cần SDK/client library trong mỗi service | Không cần — transparent cho application code |
| **Load balancing** | Client tự chọn (round-robin, weighted) | Platform managed (ALB, kube-proxy, Envoy) |
| **Ví dụ** | Netflix Eureka, HashiCorp Consul client | AWS Cloud Map + ECS Service Connect, Kubernetes DNS |
| **Ưu điểm** | Linh hoạt, tuỳ chỉnh routing logic | Đơn giản, không coupling vào library, ít ops overhead |
| **Nhược điểm** | Mỗi service phải tích hợp SDK, thêm complexity | Ít kiểm soát routing logic ở application level |

**ShopVN chọn: DNS-based (Server-side) với AWS Cloud Map + ECS Service Connect**

Lý do:
- **Polyglot tech stack** — ShopVN có Node.js, Java/Spring, Go, Python. Client-side discovery yêu cầu mỗi ngôn ngữ đều có SDK tương thích → tăng maintenance burden
- **Team size nhỏ** — 6 team, không muốn mỗi team phải hiểu và vận hành service registry
- **AWS-native** — Toàn bộ infra trên AWS ECS → Cloud Map tích hợp sẵn, zero-config
- **Giảm failure domain** — Không có thêm thành phần (Consul cluster, Eureka server) cần quản lý HA

#### Service Registry — DNS Mapping

Tất cả services đăng ký trong **AWS Cloud Map** namespace: `shopvn.local`

| # | Service | DNS Name | Port | Protocol | Ghi chú |
|---|---------|----------|------|----------|---------|
| 0 | API Gateway | `gateway.shopvn.local` | 443 | HTTPS | Entry point, public-facing |
| 1 | Auth Service | `auth-service.shopvn.local` | 3001 | HTTP | Internal only |
| 2 | User Service | `user-service.shopvn.local` | 3002 | HTTP | Internal only |
| 3 | Catalog Service | `catalog-service.shopvn.local` | 3003 | HTTP | Internal only |
| 4 | Search Service | `search-service.shopvn.local` | 3004 | HTTP | Internal only |
| 5 | Cart Service | `cart-service.shopvn.local` | 3005 | HTTP | Internal only |
| 6 | Order Service | `order-service.shopvn.local` | 3006 | HTTP | Saga orchestrator |
| 7 | Payment Service | `payment-service.shopvn.local` | 3007 | HTTP | PCI-DSS isolated subnet |
| 8 | Inventory Service | `inventory-service.shopvn.local` | 3008 | gRPC | High-throughput, gRPC cho perf |
| 9 | Promotion Service | `promotion-service.shopvn.local` | 3009 | HTTP | Internal only |
| 10 | Shipping Service | `shipping-service.shopvn.local` | 3010 | HTTP | Internal only |
| 11 | Notification Service | `notification-service.shopvn.local` | 3011 | HTTP | Async consumer chính |
| 12 | Review Service | `review-service.shopvn.local` | 3012 | HTTP | Internal only |
| 13 | Recommendation Service | `recommendation-service.shopvn.local` | 3013 | HTTP | ML inference endpoint |

> 💡 Service gọi nhau qua DNS name, không bao giờ dùng IP trực tiếp. Ví dụ: Order Service gọi Inventory bằng `inventory-service.shopvn.local:3008`

#### Health Check — Cơ chế giám sát sức khoẻ

Mỗi service expose endpoint `/health` (hoặc `/healthz`) để Cloud Map + ECS kiểm tra:

```
GET /health HTTP/1.1
Host: order-service.shopvn.local:3006

Response 200 OK:
{
  "status": "healthy",
  "uptime": 84329,
  "checks": {
    "database": "connected",
    "kafka": "connected",
    "redis": "connected"
  }
}
```

**Cấu hình Health Check:**

| Tham số | Giá trị | Ý nghĩa |
|---------|---------|---------|
| **Path** | `/health` | Endpoint kiểm tra |
| **Interval** | 10 giây | Tần suất kiểm tra |
| **Timeout** | 5 giây | Thời gian chờ response tối đa |
| **Healthy threshold** | 2 lần liên tiếp | Số lần pass liên tiếp để đánh dấu healthy |
| **Unhealthy threshold** | 3 lần liên tiếp | Số lần fail liên tiếp để đánh dấu unhealthy |
| **Deregister delay** | 30 giây | Thời gian chờ trước khi xoá khỏi DNS |

**Quy trình Health Check:**

```d2 title="Health Check — Cơ chế giám sát sức khoẻ"
direction: down
tick: "ECS Agent — mỗi 10 giây"
probe: "GET /health tới Service Instance"
check: "Response trong 5 giây?"
healthy: "200 OK\nReport HEALTHY tới Cloud Map"
unhealthy: "Timeout / 5xx\nReport UNHEALTHY • count++"
count: "3 lần UNHEALTHY liên tiếp?"
remove: "Cloud Map deregister instance khỏi DNS\nTheo flow minh họa: yêu cầu ECS replacement"
tick -> probe
probe -> check
check -> healthy: "200 trong 5s"
check -> unhealthy: "Timeout / 5xx"
healthy -> tick: "Chu kỳ tiếp theo"
unhealthy -> count
count -> tick: "Chưa đủ"
count -> remove: "Đủ 3 lần"
# Icons: https://icons.d2lang.com/
tick.icon: "https://icons.d2lang.com/aws/Compute/Amazon-Elastic-Container-Service.svg"
remove.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/AWS-Cloud-Map.svg"
```

Sơ đồ thể hiện vòng kiểm tra và ngưỡng của ví dụ. Khi triển khai thật, ECS Service scheduler chịu trách nhiệm thay task; Cloud Map quản lý registration/health, không tự gọi ECS để tạo task thay thế.

#### Khi một Service Instance gặp sự cố

Khi một instance bị crash, OOM, hoặc treo (hang), hệ thống tự động xử lý **không cần can thiệp thủ công**:

```
Thời điểm    Sự kiện
──────────────────────────────────────────────────────────────
T+0s         Instance #2 của Order Service bị OOM killed
T+10s        Health check lần 1 — FAIL
T+20s        Health check lần 2 — FAIL
T+30s        Health check lần 3 — FAIL → đánh dấu UNHEALTHY
T+30s        Cloud Map xoá IP của instance #2 khỏi DNS record
T+30s        Traffic tự động route sang instance #1 và #3
T+35s        ECS khởi động instance #4 thay thế (desired count = 3)
T+55s        Instance #4 healthy → Cloud Map đăng ký vào DNS
T+55s        Traffic phân phối đều cho instance #1, #3, #4
```

**Minh hoạ luồng failover:**

```d2 title="Khi một Service Instance gặp sự cố"
direction: right
before: "Cloud Map — order-service.shopvn.local\nInstance1 10.0.1.10 / Instance2 10.0.2.20 / Instance3 10.0.3.30"
after: "Deregister Instance2 crash\nInstance1 10.0.1.10 / Instance3 10.0.3.30"
recovery: "Recovery — Register Instance4 mới\nInstance1 10.0.1.10 / Instance3 10.0.3.30 / Instance4 10.0.4.40"
before -> after
after -> recovery
# Icons: https://icons.d2lang.com/
before.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/AWS-Cloud-Map.svg"
```

Deregistration không xóa cache DNS đã cấp ngay lập tức; còn TTL/client caching và cơ chế health/discovery của workload.

**Điểm quan trọng:**
- Caller (ví dụ: API Gateway) **không cần biết** instance nào bị lỗi — DNS tự trả về danh sách instance healthy
- **DNS TTL thấp (5-10s)** đảm bảo caller nhận IP mới nhanh chóng
- Kết hợp với **Retry + Circuit Breaker** (xem [Phần 5](#phần-5--resilience--reliability)) để xử lý request đang in-flight tại thời điểm instance crash
- ECS **desired count** đảm bảo luôn có đủ số instance tối thiểu — tự động thay thế instance bị xoá

### 3.6. Sequence Diagram — Complete Checkout Flow

```d2 title="3.6. Sequence Diagram — Complete Checkout Flow"
shape: sequence_diagram
"User": "User" {shape: person}
"GW": "API Gateway"
"OS": "Order Service"
"INV": "Inventory"
"PRM": "Promotion"
"PAY": "Payment"
"K": "Kafka"
"NTF": "Notification"
"User" -> "GW": "1. POST /api/v1/checkout"
"GW" -> "GW": "2. Validate JWT, Rate Limit"
"GW" -> "OS": "3. createOrder(userId, items, voucher)"
"OS".note1: "Step 1 — Create Order (PENDING)"
"OS" -> "OS": "4. Save order to DB + Outbox"
"OS".note2: "[Order Service — Inventory]\nStep 2 — Reserve Stock (Sync)"
"OS" -> "INV": "5. reserveStock(orderId, items)"
"INV" -> "INV": "6. Check availability + Lock"
"INV" -> "OS": "7. reservationId, TTL=15min" { style.stroke-dash: 5 }
"OS".note3: "[Order Service — Promotion]\nStep 3 — Apply Voucher (Sync)"
"OS" -> "PRM": "8. applyVoucher(orderId, \"SALE50\", total)"
"PRM" -> "OS": "9. discount=50000, finalTotal=450000" { style.stroke-dash: 5 }
"OS".note4: "[Order Service — Payment]\nStep 4 — Create Payment (Sync)"
"OS" -> "PAY": "10. createPaymentIntent(orderId, 450000, \"vnpay\")"
"PAY" -> "OS": "11. paymentUrl, paymentIntentId" { style.stroke-dash: 5 }
"OS" -> "GW": "12. {orderId, paymentUrl, status=PAYMENT_PENDING}" { style.stroke-dash: 5 }
"GW" -> "User": "13. Redirect to VNPay" { style.stroke-dash: 5 }
"User".note5: "[User — Payment]\nUser completes payment on VNPay"
"PAY" -> "PAY": "14. Receive VNPay webhook"
"PAY" -> "K": "15. payment.captured.v1"
"K" -> "OS": "16. Consume payment.captured"
"OS" -> "INV": "17. confirmReservation(reservationId)"
"OS" -> "OS": "18. Update order status=CONFIRMED"
"OS" -> "K": "19. order.confirmed.v1"
"K" -> "NTF": "20. Consume order.confirmed"
"NTF" -> "User": "21. Push + Email \"Đơn hàng đã xác nhận!\""
```

### 3.7. Sequence Diagram — Flash Sale Flow

```d2 title="3.7. Sequence Diagram — Flash Sale Flow"
direction: down
user: "User → Gateway\nPOST /cart/items\nRate limit 100 req/s/user • Flash Sale 20K users"
cart: "Cart Service addToCart(userId, skuId, qty=1)"
stock: "Inventory checkAvailability(skuId)\nAtomic stock check — Redis DECR"
available: "available=true, remaining=42\nCart → Gateway → User: Item added"
empty: "available=false, remaining=0\nCart → Gateway → User: Hết hàng"
checkout: "User POST /checkout\nGateway → Order: createOrder(userId, items)"
reserve: "Order → Inventory: reserveStock\nLua script atomic • TTL 5min"
payment: "Order → Payment: createPaymentIntent\nPayment trả paymentUrl"
redirect: "Order → User: Redirect to payment"
user -> cart
cart -> stock
stock -> available: "Stock available"
stock -> empty: "Stock exhausted"
available -> checkout
checkout -> reserve
reserve -> payment
payment -> redirect
```

### 3.8. Idempotency & Exactly-Once Semantics (thực tế)

| Use case | Idempotency key | TTL | Nơi lưu |
|----------|------------------|-----|---------|
| Checkout submit | `userId + cartChecksum` | 30 phút | Redis |
| Payment initiate | `orderId + paymentMethod` | 24 giờ | Payment DB |
| Payment callback | `providerTxnId` | 7 ngày | Payment DB unique index |
| Shipment create | `orderId` | 7 ngày | Shipping DB |

**Quy tắc vận hành:**

- HTTP `POST` critical bắt buộc header `Idempotency-Key`.
- Consumer event ghi bảng `processed_events(event_id)` trước side-effect.
- Nếu duplicate event: ACK bỏ qua, không chạy logic lần hai.

### 3.9. Message Broker Design (Kafka/SQS)

| Thành phần | Thiết kế đề xuất |
|------------|------------------|
| Topic naming | `{domain}.{event}.v{n}` (ví dụ: `order.confirmed.v1`) |
| Partition key | `orderId` cho order/payment/inventory flow |
| Retention | 7 ngày với domain event, 14 ngày cho audit topics |
| DLQ | Mỗi consumer group có DLQ riêng |
| Retry | 3 lần với exponential backoff trước khi đưa DLQ |
| Schema | Avro/JSON Schema + compatibility check CI |

**Ví dụ thiết kế topic:**

| Topic | Partitions | Throughput mục tiêu |
|-------|------------|---------------------|
| `order.created.v1` | 48 | 8K msg/s peak |
| `payment.captured.v1` | 24 | 3K msg/s peak |
| `stock.reserved.v1` | 48 | 10K msg/s peak flash sale |
| `notification.requested.v1` | 32 | 15K msg/s burst |

---

## Phần 4 — Data Management & Patterns

> 🔗 Áp dụng kiến thức từ [09 — Data Management](09-data-management.md)

### 4.1. Database per Service — Polyglot Persistence

Mỗi service **sở hữu database riêng**, không service nào truy cập trực tiếp DB của service khác.

| # | Service | Primary DB | Secondary Store | Lý do chọn | Data Volume ước tính |
|---|---------|-----------|----------------|-------------|---------------------|
| 1 | **User** | PostgreSQL | Redis (cache) | ACID cho account. Redis giảm latency | ~2M records, ~50GB |
| 2 | **Catalog** | PostgreSQL | OpenSearch (CDC sync) | Product master cần ACID. OpenSearch cho search | ~500K SKUs, ~100GB |
| 3 | **Search** | OpenSearch | Redis (query cache) | Read-only derived data, optimized cho full-text | ~20GB index |
| 4 | **Cart** | Redis (primary) | DynamoDB (backup) | Key-value + TTL. Sub-ms latency | ~200K active carts, ~2GB |
| 5 | **Order** | PostgreSQL | Read Replica | ACID bắt buộc cho state machine. Replica cho reporting | ~18M orders/năm, ~200GB |
| 6 | **Payment** | PostgreSQL | — | ACID + audit trail (PCI-DSS). Không cache để tránh stale state | ~150GB/năm |
| 7 | **Inventory** | PostgreSQL | Redis (stock cache) | Strong consistency cho stock count (tránh oversell) | ~500K SKU records, ~10GB |
| 8 | **Promotion** | PostgreSQL | Redis (rule cache + counter) | ACID cho voucher codes. Redis compiled rules + usage counter | ~5GB |
| 9 | **Notification** | MongoDB | — | Flexible schema cho đa dạng template (email, SMS, push) | ~100GB/năm |
| 10 | **Review** | MongoDB | — | Flexible content: text + images + ratings | ~50GB/năm |
| 11 | **Recommendation** | Redis (feature store) | PostgreSQL (metadata) | Real-time feature serving + model metadata | ~5GB Redis |

```d2 title="4.1. Database per Service — Polyglot Persistence"
direction: right
stores: Database per Service {
 s0: "User" {
  db: "PostgreSQL + Redis" {shape: cylinder}
 }
 s1: "Catalog" {
  db: "PostgreSQL + OpenSearch" {shape: cylinder}
 }
 s2: "Order" {
  db: "PostgreSQL + Replica" {shape: cylinder}
 }
 s3: "Payment" {
  db: "PostgreSQL — PCI-DSS boundary" {shape: cylinder}
 }
 s4: "Cart" {
  db: "Redis + DynamoDB" {shape: cylinder}
 }
 s5: "Inventory" {
  db: "PostgreSQL + Redis" {shape: cylinder}
 }
 s6: "Promotion" {
  db: "PostgreSQL + Redis" {shape: cylinder}
 }
 s7: "Search" {
  db: "OpenSearch + Redis" {shape: cylinder}
 }
 s8: "Notification" {
  db: "MongoDB" {shape: cylinder}
 }
 s9: "Review" {
  db: "MongoDB" {shape: cylinder}
 }
}
bus: "Kafka — orders.* / payments.* / catalog.*"
s3: "S3 — Images / Media"
# Icons: https://icons.d2lang.com/
stores.s3.db.icon: "https://icons.d2lang.com/dev/postgresql.svg"
stores.s8.db.icon: "https://icons.d2lang.com/dev/mongodb.svg"
stores.s9.db.icon: "https://icons.d2lang.com/dev/mongodb.svg"
```

Mỗi service sở hữu dữ liệu riêng; chọn PostgreSQL không tự bảo đảm PCI-DSS compliance cho Payment.

### 4.2. Saga Pattern cho Order Flow

**Chọn Orchestration Saga** (Order Service là orchestrator):

| Tiêu chí | Orchestration ✅ | Choreography |
|----------|-----------------|-------------|
| Flow control | Centralized, dễ quản lý | Distributed, khó theo dõi |
| Debug/Monitor | Dễ — xem state machine | Khó — phải correlate events |
| Onboarding | Team dễ hiểu flow | Phải đọc event chain |

**Saga State Machine:**

```d2 title="4.2. Saga Pattern cho Order Flow"
direction: down
initial1: "Bắt đầu" {shape: circle; width: 40; height: 40}
PENDING: "PENDING"
initial1 -> PENDING: "Create Order"
STOCK_RESERVED: "STOCK_RESERVED"
PENDING -> STOCK_RESERVED: "Reserve Stock ✓"
CANCELLED: "CANCELLED"
PENDING -> CANCELLED: "Reserve Stock ✗"
PROMO_APPLIED: "PROMO_APPLIED"
STOCK_RESERVED -> PROMO_APPLIED: "Apply Promo ✓"
PAYMENT_PENDING: "PAYMENT_PENDING"
STOCK_RESERVED -> PAYMENT_PENDING: "No Promo (skip)"
CANCELLING: "CANCELLING"
STOCK_RESERVED -> CANCELLING: "Apply Promo ✗"
PROMO_APPLIED -> PAYMENT_PENDING: "Create Payment ✓"
PAID: "PAID"
PAYMENT_PENDING -> PAID: "Payment Captured ✓"
PAYMENT_PENDING -> CANCELLING: "Payment Failed/Timeout"
CONFIRMED: "CONFIRMED"
PAID -> CONFIRMED: "Deduct Stock ✓"
FULFILLING: "FULFILLING"
CONFIRMED -> FULFILLING: "Create Shipment"
SHIPPED: "SHIPPED"
FULFILLING -> SHIPPED: "Picked Up"
DELIVERED: "DELIVERED"
SHIPPED -> DELIVERED: "Delivered"
COMPLETED: "COMPLETED"
DELIVERED -> COMPLETED: "Auto-complete 7 days"
CANCELLING -> CANCELLED: "Compensations done"
final2: "Kết thúc" {shape: circle; style.double-border: true; width: 40; height: 40}
CANCELLED -> final2
final3: "Kết thúc" {shape: circle; style.double-border: true; width: 40; height: 40}
COMPLETED -> final3
```

**Chi tiết từng bước:**

| Step | Action | Compensating Action | Timeout |
|------|--------|--------------------:|---------|
| 1. Create Order | Save order (PENDING) | — | — |
| 2. Reserve Stock | `POST /inventory/reserve` | Release reservation | 5s |
| 3. Apply Promotion | `POST /promotions/apply` | Reverse voucher usage | 3s |
| 4. Create Payment | `POST /payments/initiate` | Cancel payment intent | 10s |
| 5. Wait Payment | Webhook: payment.captured | Release stock + reverse promo | **15 min** |
| 6. Confirm Order | Deduct stock, update status | Refund + restore (manual review) | 5s |
| 7. Create Shipment | Async event | Retry via DLQ | 30s |

**Failure Sequence — Payment Failed:**

```d2 title="4.2. Saga Pattern cho Order Flow"
shape: sequence_diagram
"OS": "Order Saga"
"PAY": "Payment"
"PRM": "Promotion"
"INV": "Inventory"
"K": "Kafka"
"OS".note1: "Payment timeout/failed"
"PAY" -> "K": "payment.failed.v1"
"K" -> "OS": "consume payment.failed"
"OS".note2: "Compensating Transactions"
"OS" -> "PRM": "reverseVoucherUsage(orderId)"
"PRM" -> "OS": "reversed ✓" { style.stroke-dash: 5 }
"OS" -> "INV": "releaseReservation(reservationId)"
"INV" -> "OS": "released ✓" { style.stroke-dash: 5 }
"OS" -> "OS": "Update order status=CANCELLED"
"OS" -> "K": "order.cancelled.v1"
"K".note3: "→ Notification: \"Thanh toán thất bại\""
```

### 4.3. CQRS — Áp dụng ở đâu?

| Service | Cần CQRS? | Write Model | Read Model | Sync Mechanism |
|---------|-----------|-------------|------------|----------------|
| **Catalog** | ✅ Có | PostgreSQL (normalized) | OpenSearch (denormalized) | CDC (Debezium) → Kafka |
| **Search** | ✅ Full CQRS | — (derived) | OpenSearch | Kafka consumer |
| **Order** | ✅ Có | PostgreSQL | Read Replica + materialized views | PostgreSQL replication |
| **Inventory** | ⚠️ Từng phần | PostgreSQL (SoT) | Redis cache (stock level) | Write-through cache |
| **User** | ❌ Không | PostgreSQL + Redis cache | — | Đơn giản, không cần tách |
| **Cart** | ❌ Không | Redis | — | Đã là key-value, đủ nhanh |
| **Payment** | ❌ Không | PostgreSQL | — | Security concern, ít duplicate data |

**Lý do chọn Read Model cụ thể cho từng service:**

| Service | Read Model | Tại sao chọn? | Tại sao KHÔNG dùng cách khác? |
|---------|------------|---------------|-------------------------------|
| **Catalog → OpenSearch** | OpenSearch | Cần full-text search tiếng Việt, faceted filter (giá, màu, size, brand), ranking theo relevance — đây là thế mạnh của search engine | Redis chỉ lookup theo key, không hỗ trợ full-text search hay faceted filter cho 500K sản phẩm |
| **Order → PG Read Replica** | PostgreSQL Read Replica + materialized views | Cần SQL JOIN phức tạp (order → items → product snapshot), aggregate báo cáo (doanh thu, top sản phẩm), đảm bảo durability cao — mất đơn hàng là mất tiền | Redis không hỗ trợ JOIN/aggregate; OpenSearch không phù hợp cho transactional data cần consistency cao |
| **Inventory → Redis** | Redis cache | Dữ liệu đơn giản dạng key-value (`sku_id → stock_level`), chỉ cần tra cứu "còn bao nhiêu?", tốc độ đọc cực nhanh (sub-ms) | OpenSearch/PG Replica overkill cho lookup đơn giản; Redis là best-effort cho hiển thị, **source of truth vẫn là PostgreSQL + locking** khi checkout thật |

> ⚠️ **Lưu ý về Inventory + Redis:** Redis cache stock chỉ phục vụ **hiển thị gần đúng** trên UI ("còn hàng" / "hết hàng"). Khi checkout thật, Inventory Service dùng **PostgreSQL + optimistic locking** (`version` column) để đảm bảo không bao giờ oversell. Trade-off: user có thể thấy "còn hàng" nhưng checkout báo "hết" (UX không đẹp nhưng không mất tiền/hàng).

**CQRS Flow cho Catalog/Search:**

```d2 title="4.3. CQRS — Áp dụng ở đâu?"
direction: right
n3: "Query Side (Read)" {}
n2: "Event Bus" {}
n1: "Command Side (Write)" {}
n1.n4: "Merchant Portal"
n1.n5: "Catalog Write API"
n1.n6: "PostgreSQL" {
  shape: cylinder
}
n1.n7: "Debezium CDC"
n2.n8: "Kafka"
n3.n9: "Search Consumer"
n3.n10: "OpenSearch Index" {
  shape: cylinder
}
n3.n11: "User App"
n3.n12: "Search API"
n1.n4 -> n1.n5
n1.n5 -> n1.n6
n1.n6 -> n1.n7
n1.n7 -> n2.n8
n2.n8 -> n3.n9
n3.n9 -> n3.n10
n3.n11 -> n3.n12
n3.n12 -> n3.n10
# Icons: https://icons.d2lang.com/
n1.n6.icon: "https://icons.d2lang.com/dev/postgresql.svg"
```

### 4.4. Event Sourcing — Decision

**Khuyến nghị: KHÔNG dùng full Event Sourcing ở giai đoạn đầu**

| Tiêu chí | Event Sourcing | Traditional + Outbox ✅ |
|----------|---------------|----------------------|
| Complexity | Cao (event replay, snapshot, schema evolution) | Trung bình |
| Team learning curve | 3-6 tháng | 2-4 tuần |
| Audit trail | Tuyệt vời — mọi thay đổi đều là event | Đủ tốt — audit table + Outbox events |
| Debugging | Khác biệt (replay events) | Quen thuộc (query DB state) |
| Phù hợp ShopVN | Phase 3+ nếu cần | ✅ Phase 1-2 |

### 4.5. Transactional Outbox Pattern

Giải quyết **Dual Write** problem (ghi DB + publish event phải atomic):

```d2 title="4.5. Transactional Outbox Pattern"
direction: right
n1: "Service\nDB Transaction"
n2: "Business Tables"
n3: "Outbox Table"
n4: "Outbox Relay\n(Polling/CDC)"
n5: "Kafka"
n6: "Consumers"
n1 -> n2
n1 -> n3
n4 -> n3
n4 -> n5
n5 -> n6
```

**Service nào cần Outbox?**

| Service | Cần Outbox? | Events phát ra | Lý do |
|---------|------------|----------------|-------|
| **Order Service** | ✅ | `order.created`, `order.confirmed`, `order.cancelled` | Saga orchestrator — cần đảm bảo event tới Inventory, Payment, Notification |
| **Payment Service** | ✅ | `payment.completed`, `payment.failed`, `payment.refunded` | Order cần biết kết quả để chuyển trạng thái |
| **Inventory Service** | ✅ | `stock.reserved`, `stock.committed`, `stock.released` | Order Saga cần biết kết quả reserve |
| **Promotion Service** | ✅ | `voucher.applied`, `voucher.released` | Order Saga cần biết kết quả validate voucher |
| **Catalog Service** | ❌ | Dùng **CDC (Debezium)** đọc trực tiếp từ DB WAL | Debezium đã giải quyết dual write bằng cách khác, không cần outbox table riêng |

> 💡 Mỗi service có outbox table **trong cùng database của nó**. Business data + outbox event được ghi trong **cùng 1 DB transaction** → cả 2 đều thành công hoặc đều rollback, không bao giờ mất event.

**Outbox table schema:**

```sql source="snippets/4-5-transactional-outbox-pattern.sql"
CREATE TABLE outbox_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100) NOT NULL,  -- 'Order', 'Payment'
    aggregate_id   VARCHAR(100) NOT NULL,  -- 'ORD-001'
    event_type     VARCHAR(100) NOT NULL,  -- 'order.created.v1'
    payload        JSONB NOT NULL,
    created_at     TIMESTAMP DEFAULT NOW(),
    published_at   TIMESTAMP NULL          -- NULL = chưa publish
);
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=25-case-study-ecommerce&snapshot=article&file=snippets%2F4-5-transactional-outbox-pattern.sql)

### 4.6. Data Consistency Rules

| Data | Consistency Level | Pattern | Lý do |
|------|------------------|---------|-------|
| Payment capture | **Strong** | Sync + DB transaction | Không được mất tiền |
| Inventory deduct | **Strong** | Atomic operation + locking | Tránh oversell |
| Order state | **Strong** | Saga orchestrator | Business-critical lifecycle |
| Search index | **Eventual** | CDC + async reindex | Delay 1-5s chấp nhận |
| Recommendation | **Eventual** | Batch ML pipeline | Delay phút-giờ OK |
| Notification | **Eventual** | Async event + DLQ | Retry nếu fail |
| Review rating aggregate | **Eventual** | Event → recalculate avg | Delay vài giây OK |

### 4.7. Schema chi tiết cho Order & Inventory (thực chiến)

**Order tables:**

```sql source="snippets/4-7-schema-chi-tiet-cho-order-inventory-thuc-chien.sql"
CREATE TABLE orders (
  order_id            VARCHAR(40) PRIMARY KEY,
  user_id             VARCHAR(40) NOT NULL,
  status              VARCHAR(30) NOT NULL,
  subtotal_amount     BIGINT NOT NULL,
  discount_amount     BIGINT NOT NULL DEFAULT 0,
  shipping_fee        BIGINT NOT NULL DEFAULT 0,
  total_amount        BIGINT NOT NULL,
  payment_method      VARCHAR(20) NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  order_id            VARCHAR(40) NOT NULL,
  line_no             INT NOT NULL,
  product_id          VARCHAR(40) NOT NULL,
  sku_id              VARCHAR(40) NOT NULL,
  qty                 INT NOT NULL,
  unit_price_snapshot BIGINT NOT NULL,
  item_discount       BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (order_id, line_no)
);
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=25-case-study-ecommerce&snapshot=article&file=snippets%2F4-7-schema-chi-tiet-cho-order-inventory-thuc-chien.sql)

**Inventory tables:**

```sql source="snippets/4-7-schema-chi-tiet-cho-order-inventory-thuc-chien-2.sql"
CREATE TABLE stocks (
  sku_id              VARCHAR(40) PRIMARY KEY,
  available_qty       INT NOT NULL,
  reserved_qty        INT NOT NULL DEFAULT 0,
  version             BIGINT NOT NULL DEFAULT 0,
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_reservations (
  reservation_id      VARCHAR(40) PRIMARY KEY,
  order_id            VARCHAR(40) NOT NULL,
  sku_id              VARCHAR(40) NOT NULL,
  qty                 INT NOT NULL,
  expires_at          TIMESTAMP NOT NULL,
  status              VARCHAR(20) NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=25-case-study-ecommerce&snapshot=article&file=snippets%2F4-7-schema-chi-tiet-cho-order-inventory-thuc-chien-2.sql)

### 4.8. Concurrency Control & Reconciliation Jobs

| Bài toán | Cách xử lý |
|----------|------------|
| Race condition reserve stock | Atomic SQL update hoặc Redis Lua script |
| Lost update | Optimistic locking (`version`) |
| Payment callback đến muộn | Kiểm tra order status + idempotency |
| Event mất/consumer down | Replay từ offset + reconciliation jobs |

**Chi tiết từng case:**

**① Race condition reserve stock**

Scenario: Flash sale, 1000 user cùng mua 1 SKU chỉ còn 5 sản phẩm.

```sql source="snippets/4-8-concurrency-control-reconciliation-jobs.sql"
-- ❌ Cách sai — đọc rồi ghi riêng lẻ → oversell
SELECT available_qty FROM stocks WHERE sku_id = 'SKU-001';  -- 5
-- 100 request cùng đọc = 5 → đều nghĩ còn hàng
UPDATE stocks SET available_qty = available_qty - 1 WHERE sku_id = 'SKU-001';

-- ✅ Cách đúng — Atomic conditional update (1 câu SQL duy nhất)
UPDATE stocks
SET available_qty = available_qty - :qty,
    reserved_qty  = reserved_qty + :qty,
    version       = version + 1
WHERE sku_id = :sku_id
  AND available_qty >= :qty;
-- Nếu affected_rows = 0 → hết hàng, trả lỗi ngay. Không có cửa oversell.
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=25-case-study-ecommerce&snapshot=article&file=snippets%2F4-8-concurrency-control-reconciliation-jobs.sql)

Với Redis (dùng cho pre-check trước khi vào DB):

```lua
-- Redis Lua script — atomic decrement, chạy single-threaded
local stock = tonumber(redis.call('GET', KEYS[1]))
if stock >= tonumber(ARGV[1]) then
    redis.call('DECRBY', KEYS[1], ARGV[1])
    return 1  -- success
end
return 0  -- out of stock
```

**② Lost update (Cập nhật bị ghi đè)**

Scenario: 2 admin cùng sửa thông tin sản phẩm, người sau ghi đè thay đổi của người trước.

```
Admin A đọc product (version = 3), sửa giá
Admin B đọc product (version = 3), sửa mô tả
Admin A save → version 3→4 ✓
Admin B save → version 3→4 ✗ CONFLICT! (version đã là 4)
```

```sql
-- Optimistic locking — kiểm tra version khi update
UPDATE products
SET price = :new_price, version = version + 1
WHERE product_id = :id AND version = :expected_version;
-- affected_rows = 0 → conflict → trả 409 Conflict, yêu cầu client reload
```

> Dùng cho: Catalog (product update), Inventory (stock adjust), Order (status transition).

**③ Payment callback đến muộn**

Scenario: User thanh toán MoMo thành công, nhưng callback về ShopVN bị delay 5 phút (do network, queue provider). Lúc đó reservation đã hết hạn (TTL 15 phút gần hết) hoặc order đã bị cancel.

```
T+0:00  User checkout → Order PENDING, stock reserved (TTL 15min)
T+0:01  Redirect MoMo → User thanh toán thành công
T+0:06  Callback từ MoMo đến muộn (delay 5 phút)
        → Payment Service nhận callback
        → Kiểm tra: Order vẫn PENDING? → OK, xử lý bình thường
        → Nếu Order đã CANCELLED (do timeout) → Trigger refund tự động
```

```
-- Xử lý trong Payment Service:
1. Lookup order by order_id → check status
2. Nếu status = PENDING → confirm payment → order → CONFIRMED
3. Nếu status = CANCELLED → auto refund → notify user
4. Idempotency: check payment_provider_txn_id đã xử lý chưa
   → Nếu đã xử lý → return success (không xử lý lại)
```

**④ Event mất / Consumer down**

Scenario: Order Service publish `order.created` nhưng Inventory consumer đang deploy/crash → event không được xử lý.

```
Giải pháp multi-layer:
1. Kafka consumer group — khi consumer restart, đọc tiếp từ last committed offset
   → Event không mất, chỉ delay xử lý

2. Dead Letter Queue (DLQ) — event xử lý fail 3 lần → chuyển vào DLQ
   → Alert team để investigate manually

3. Reconciliation job — safety net cuối cùng (xem bên dưới)
```

**Reconciliation jobs (chạy định kỳ):**

| Job | Tần suất | Logic | Phát hiện vấn đề gì? |
|-----|----------|-------|----------------------|
| **Order ↔ Payment** | Mỗi giờ | So khớp `orders(status=CONFIRMED)` với `payments(status=CAPTURED)` | Order confirmed nhưng chưa có payment (event mất) hoặc payment captured nhưng order vẫn pending (callback bị miss) |
| **Stock ↔ Reservation** | Mỗi 30 phút | So khớp `stocks.reserved_qty` với `SUM(reservations.qty) WHERE status='ACTIVE'` | reserved_qty bị lệch do race condition hoặc bug → tự động correct |
| **Reservation cleanup** | Mỗi 5 phút | Quét `reservations WHERE expires_at < NOW() AND status='ACTIVE'` | Reservation quá hạn chưa được release (consumer down khi xử lý timeout event) → release stock về lại |
| **Payment ↔ Provider** | Mỗi ngày | Gọi API đối soát MoMo/VNPay, so với `payments` nội bộ | Phát hiện giao dịch thành công ở provider nhưng ShopVN chưa ghi nhận → trigger bù trừ |

---

## Phần 5 — Resilience & Reliability

> 🔗 Áp dụng kiến thức từ [10 — Resilience Patterns](10-resilience-patterns.md)

### 5.1. Mục tiêu Resilience

- **99.9% uptime** (~8.76h downtime/năm)
- Flash sale: **200K concurrent** (10x normal)
- **Graceful degradation** > hard failure
- **No cascading failures** — 1 service chết không kéo theo hệ thống

### 5.2. Circuit Breaker — Áp dụng ở đâu?

| Caller → Callee | Failure Threshold | Open Duration | Fallback |
|----------------|-------------------|---------------|----------|
| Order → Payment | 5 lỗi / 30s | 30s | Mark order "payment pending", retry later |
| Payment → Bank API | 3 lỗi / 10s | 60s | Return "bank unavailable", queue for retry |
| Search → OpenSearch | 5 lỗi / 30s | 20s | Return cached popular products |
| Shipping → GHN/GHTK | 3 lỗi / 20s | 45s | Queue shipment creation, retry |
| Gateway → Any Service | 10 lỗi / 60s | 30s | Return 503 with retry-after header |

```d2 title="5.2. Circuit Breaker — Áp dụng ở đâu?"
direction: down
initial1: "Bắt đầu" {shape: circle; width: 40; height: 40}
CLOSED: "CLOSED"
initial1 -> CLOSED: "Normal operation"
OPEN: "OPEN"
CLOSED -> OPEN: "Failure threshold exceeded"
HALF_OPEN: "HALF_OPEN"
OPEN -> HALF_OPEN: "After timeout (30-60s)"
HALF_OPEN -> CLOSED: "Probe request succeeds"
HALF_OPEN -> OPEN: "Probe request fails"
```

### 5.3. Retry Policy

| Service Call | Max Retries | Base Delay | Max Delay | Điều kiện |
|-------------|-------------|------------|-----------|-----------|
| Order → Inventory | 1 | 100ms | 500ms | Chỉ retry network error, KHÔNG retry "out of stock" |
| Payment → VNPay | 2 | 500ms | 5s | Retry timeout/5xx. KHÔNG retry 4xx |
| Outbox relay | 5 | 1s | 30s | Exponential backoff + jitter |
| Kafka consumer | 3 | 1s | 10s | Retry, sau đó → DLQ |
| Search → OpenSearch | 1 | 50ms | 200ms | Chỉ retry connection error |

> ⚠️ **Idempotency là tiên quyết** — Mọi operation được retry phải có idempotency key.

### 5.4. Bulkhead Pattern

**Tại sao cần Bulkhead khi các service đã tách riêng?**

Payment, Inventory, Promotion là các service độc lập với DB riêng — chúng không ảnh hưởng trực tiếp đến nhau. Nhưng vấn đề nằm ở **Order Service — service gọi tất cả chúng**. Khi checkout, Order Service phải gọi lần lượt Inventory, Payment, Promotion. Nếu dùng chung 1 thread/connection pool:

```
Ví dụ: Order Service có 100 threads, dùng chung cho mọi outbound call

Bank API của MoMo bị chậm (timeout 10s mỗi request)
→ 80 threads đang chờ Payment Service trả về (vì Payment chờ MoMo)
→ Chỉ còn 20 threads cho cả Inventory + Promotion + Shipping
→ Các request checkout mới không có thread để gọi Inventory
→ Toàn bộ checkout CHẾT — dù Inventory và Promotion vẫn hoạt động bình thường!
```

> 💡 **Bulkhead không bảo vệ giữa các downstream service** — nó bảo vệ **bên trong caller (Order Service)**, đảm bảo 1 downstream chậm/chết không chiếm hết resource, kéo theo các downstream khác không gọi được. Giống tàu thuỷ chia khoang kín nước — 1 khoang thủng thì các khoang khác vẫn an toàn.

**Giải pháp: Tách thread pool riêng cho từng downstream**

```d2 title="ShopVN — Bulkhead Isolation"
direction: right
order: Order Service {
 payment: "Payment Pool\nMax 20 threads • Queue 10\nBank API chậm chỉ block pool này"
 inventory: "Inventory Pool\nMax 30 threads • Queue 20\nDB lock wait không chiếm Payment pool"
 other: "Other Pool\nMax 50 threads • Queue 30\nPromotion / Shipping vẫn chạy"
}
```

### 5.5. Rate Limiting

| Endpoint | Rate Limit | Algorithm | Action khi exceed |
|----------|-----------|-----------|-------------------|
| `POST /auth/login` | 5 req/min per IP | Sliding window | 429 + block 15min |
| `GET /search` | 100 req/min per IP | Token bucket | 429 + retry-after |
| `POST /checkout` | 10 req/min per user | Fixed window | 429 + "Vui lòng thử lại" |
| `POST /reviews` | 5 req/hour per user | Sliding window | 429 |
| Flash sale endpoints | 200 req/s global | Leaky bucket | 503 + queue position |

### 5.6. Timeout Configuration

| Service Call | Connect Timeout | Read Timeout | Total Timeout |
|-------------|----------------|-------------|---------------|
| Gateway → Any | 1s | 5s | 10s |
| Order → Inventory | 500ms | 2s | 3s |
| Payment → Bank API | 2s | 10s | 15s |
| Search → OpenSearch | 500ms | 1s | 2s |
| Shipping → GHN API | 2s | 5s | 10s |
| Kafka producer | — | — | 5s (ack timeout) |

### 5.7. Fallback Strategies

**Fallback là gì?**

Khi một downstream service bị lỗi hoặc phản hồi quá chậm, thay vì trả lỗi trực tiếp cho user, hệ thống sẽ trả về một **kết quả thay thế** — chất lượng thấp hơn nhưng vẫn hoạt động được (degraded but functional). Mục tiêu là giữ cho core flow (browse, checkout, payment) **không bị gián đoạn** dù một số service phụ trợ đang down.

**Mối quan hệ Circuit Breaker → Fallback:**

```d2 title="5.7. Fallback Strategies"
direction: right
n1: "Service Call"
n2: "Response?" {
  shape: diamond
}
n3: "Return result"
n4: "Circuit Breaker state?" {
  shape: diamond
}
n5: "Retry nếu còn quota"
n6: "Bỏ qua call, vào Fallback ngay"
n7: "Thành công?" {
  shape: diamond
}
n8: "Trả kết quả thay thế cho user"
n1 -> n2
n2 -> n3: "Success"
n2 -> n4: "Timeout / Error"
n4 -> n5: "CLOSED: lỗi chưa vượt threshold"
n4 -> n6: "OPEN: quá nhiều lỗi liên tiếp"
n4 -> n7: "HALF-OPEN: thử 1 request"
n7 -> n3: "Yes"
n7 -> n6: "No"
n6 -> n8
```

Fallback chỉ được kích hoạt trong 2 trường hợp:
- **Circuit Breaker ở trạng thái OPEN** — service đã lỗi quá nhiều, không gọi nữa, trả fallback ngay lập tức (không tốn thêm latency)
- **Timeout xảy ra** — service phản hồi quá chậm, Circuit Breaker vẫn CLOSED nhưng request hiện tại đã quá hạn

**Bảng tổng hợp Fallback:**

| Service Down | Fallback Behavior | User Experience |
|-------------|-------------------|----------------|
| Search | Show popular products + cached results | "Kết quả phổ biến" |
| Recommendation | Show top sellers / recently viewed | Vẫn có gợi ý, ít personalized |
| Promotion (timeout) | Checkout without voucher | "Voucher tạm thời không khả dụng" |
| Notification | Retry via DLQ (async) | User không biết, nhận muộn |
| Review | Disable submit, show cached ratings | "Tạm thời không thể đánh giá" |
| Shipping (fee calc) | Use cached fee hoặc flat rate | "Phí ship ước tính" |

**Chi tiết một số case quan trọng:**

#### Case 1: Search Service Down

```d2 title="Case 1: Search Service Down"
direction: right
user: "User tìm iPhone15"
gateway: "Gateway"
search: "Search Service — OpenSearch / CB OPEN"
fallback: "Fallback Handler"
redis: "Redis — search:popular:{cat}"
result: "Popular products / Banner kết quả phổ biến"
user -> gateway
gateway -> search
search -> fallback: "Dependency call bị từ chối"
fallback -> redis
redis -> result
# Icons: https://icons.d2lang.com/
redis.icon: "https://icons.d2lang.com/dev/redis.svg"
```

**Cách chuẩn bị cache (pre-warm):**
- Một **scheduled job chạy mỗi giờ** query top 100 sản phẩm phổ biến theo từng category (Electronics, Fashion, Home...) và lưu vào Redis với TTL = 2 giờ
- Khi Search down, fallback handler lấy popular products từ Redis theo category mà user đang browse
- Nếu user đang ở trang chủ (không có category context), trả về top 50 sản phẩm bán chạy nhất toàn sàn
- User thấy: danh sách sản phẩm phổ biến + thông báo nhỏ *"Hiển thị kết quả phổ biến — tìm kiếm sẽ hoạt động lại sớm"*. User vẫn browse và mua hàng được, chỉ không search chính xác theo keyword

#### Case 2: Promotion Service Timeout

```d2 title="Case 2: Promotion Service Timeout"
direction: right
user: "User nhập SALE50"
checkout: "Checkout"
promotion: "Promotion — Timeout2s"
fallback: "Fallback — Bỏ qua voucher"
result: "Thông báo giá gốc cho user"
user -> checkout
checkout -> promotion
promotion -> fallback
fallback -> result
```

Chỉ tiếp tục charge sau khi user xác nhận tổng tiền mới. Nếu apply-voucher có side effect, phải đối soát/idempotency thay vì mặc định timeout nghĩa là chưa áp dụng.

- Checkout **vẫn hoạt động bình thường** — chỉ không áp dụng được voucher giảm giá
- User nhận thông báo: *"Voucher tạm thời không khả dụng. Bạn có thể tiếp tục thanh toán với giá gốc, hoặc thử lại sau."*
- User có 2 lựa chọn: (1) tiếp tục checkout không voucher, (2) quay lại thử nhập voucher sau khi Promotion Service hồi phục
- **Không bao giờ** tự fake kết quả giảm giá — luôn trả giá gốc khi Promotion không xác nhận được

#### Case 3: Shipping Fee Calculation Down

```d2 title="Case 3: Shipping Fee Calculation Down"
direction: right
user: "User xem Checkout"
order: "Order"
shipping: "Shipping / GHN API — CB OPEN"
fallback: "Fallback flat rate30.000đ"
result: "Hiển thị phí ship ước tính30.000đ\nshipping_fee_estimated=true"
user -> order
order -> shipping
shipping -> fallback
fallback -> result
```

- Khi Shipping Service hoặc API của đối tác vận chuyển (GHN, GHTK) bị down, hệ thống áp dụng **phí ship mặc định 30,000đ** (flat rate tính trung bình từ dữ liệu lịch sử)
- User thấy: *"Phí ship ước tính: 30,000đ (sẽ được điều chỉnh chính xác sau)"*
- Order được lưu với flag `shipping_fee_estimated = true`
- Khi Shipping Service hồi phục, một **reconciliation job** chạy lại tính phí chính xác cho các order có flag này:
  - Nếu phí thực tế **thấp hơn** 30,000đ → hoàn tiền chênh lệch cho user
  - Nếu phí thực tế **cao hơn** 30,000đ → sàn chịu phần chênh lệch (chấp nhận lỗ nhỏ để giữ UX tốt)

> ⚠️ **Những service KHÔNG BAO GIỜ được có fallback:**
>
> | Service | Lý do không fallback |
> |---------|---------------------|
> | **Payment** | Không bao giờ fake kết quả thanh toán. Nếu Payment gateway down → **dừng checkout**, thông báo user thử lại sau. Trả kết quả sai (thành công khi thực tế thất bại, hoặc ngược lại) sẽ gây mất tiền hoặc mất hàng |
> | **Inventory Reserve** | Không bao giờ bỏ qua bước check tồn kho. Nếu Inventory Service down → **dừng checkout**. Bỏ qua stock check sẽ gây **oversell** — bán nhiều hơn hàng có, dẫn tới phải hủy đơn hàng loạt và mất uy tín |
>
> Nguyên tắc: **Fallback chỉ áp dụng cho service mà kết quả sai/thiếu không gây thiệt hại tài chính trực tiếp**. Với Payment và Inventory, "fail fast + thông báo rõ ràng" tốt hơn "fail silently + hậu quả nghiêm trọng".

### 5.8. Chaos Engineering Plan

| # | Experiment | Target | Expected Behavior | Success Criteria |
|---|-----------|--------|-------------------|-----------------|
| 1 | Kill Payment pod | Payment Service | Circuit breaker opens, orders marked "pending" | No cascading failure, other services OK |
| 2 | Inject 2s latency | Inventory Service | Timeout → fast fail checkout | P95 checkout < 5s, no hang |
| 3 | Stop Kafka consumer | Order consumer | Messages queue up, DLQ for failures | No data loss, resume OK |
| 4 | Network partition | Order ↔ Payment | Saga compensating transaction triggers | Stock released, order cancelled |
| 5 | Flash sale 10x load | All services | Auto-scaling triggers, rate limiting | SLO met for core flows |

**Tools:** Chaos Monkey (K8s), tc (traffic control), k6/Locust (load test)

### 5.9. Defense in Depth — Thứ tự áp dụng

**Defense in Depth là gì?**

Defense in Depth (phòng thủ nhiều lớp) là chiến lược kết hợp **nhiều resilience pattern thành một chuỗi tuần tự**, trong đó mỗi lớp đảm nhận một nhiệm vụ riêng và **bắt những lỗi mà lớp trước bỏ sót**. Không có pattern nào đứng một mình là đủ — chúng phải phối hợp như một pipeline:

- **Rate Limit** chặn traffic bất thường → nhưng không xử lý được service chậm
- **Timeout** ngắt request chờ quá lâu → nhưng không biết nên thử lại hay không
- **Retry** thử lại lỗi tạm thời → nhưng nếu service chết hẳn thì retry chỉ làm tệ hơn
- **Circuit Breaker** ngắt mạch khi service lỗi liên tục → nhưng không cách ly resource
- **Bulkhead** cách ly thread pool → nhưng không cung cấp response thay thế
- **Fallback** trả kết quả degraded → lớp cuối cùng, đảm bảo user luôn nhận response

```d2 title="5.9. Defense in Depth — Thứ tự áp dụng"
direction: right
request: "Request"
rate: "Rate Limit — Quá nhiều request →429"
timeout: "Overall Timeout / Deadline — Hết hạn → Timeout response"
retry: "Bounded Retry — Retryable / Budget còn"
cb: "Circuit Breaker — Quá nhiều lỗi → OPEN"
bulkhead: "Bulkhead — Pool isolation"
fallback: "Fallback — Result thay thế / Graceful Degradation"
request -> rate
rate -> timeout
timeout -> retry
retry -> cb
cb -> bulkhead
bulkhead -> fallback
```

Sơ đồ giữ thứ tự minh họa của ví dụ, không phải decorator order bắt buộc. CB bên trong Retry đo từng attempt; CB bên ngoài đo logical request. Fallback là đường xử lý lỗi, không phải dependency call tiếp theo khi thành công. Cần per-try timeout ngoài deadline tổng.

**Chi tiết từng lớp trong ShopVN:**

| Lớp | Chức năng | Cấu hình ở đâu | Khi trigger thì sao? | Ví dụ ShopVN |
|-----|-----------|-----------------|----------------------|--------------|
| **Rate Limit** | Giới hạn số request/giây, chặn traffic bất thường (DDoS, bot, abuse) trước khi vào hệ thống | API Gateway (Kong/Nginx) | Trả `429 Too Many Requests`, request bị reject ngay tại gateway, không tốn resource backend | Flash sale: mỗi user tối đa 10 req/s cho checkout, 50 req/s cho browse. Bot spam add-to-cart bị chặn ngay |
| **Timeout** | Đặt thời gian chờ tối đa cho mỗi lần gọi downstream, tránh thread bị treo vô hạn | Client-side (caller service) — config trong HTTP client hoặc gRPC channel | Request bị cancel sau thời gian timeout, thread được giải phóng, trả lỗi `504 Gateway Timeout` hoặc exception | Order Service gọi Payment Service với timeout 3s. Nếu Payment chậm > 3s → fail fast, không block 50 threads chờ |
| **Retry** | Thử lại request khi gặp lỗi tạm thời (network blip, 503 tạm), tăng tỉ lệ thành công | Client-side (caller service) — retry policy với exponential backoff + jitter | Gửi lại request (tối đa N lần), mỗi lần chờ lâu hơn. **Bắt buộc**: downstream phải idempotent | Payment timeout lần 1 → retry sau 200ms → thành công lần 2. Idempotency key đảm bảo không charge 2 lần |
| **Circuit Breaker** | Theo dõi tỉ lệ lỗi, khi vượt ngưỡng → ngắt mạch (OPEN), ngừng gọi service đang chết | Client-side (caller service) — Resilience4j hoặc Istio | Trạng thái OPEN: mọi request fail ngay (fast-fail), không gửi tới downstream. Sau thời gian → HALF-OPEN, thử vài request | Payment Service lỗi 60% trong 30s → circuit OPEN. Order Service ngừng gọi Payment, không tạo thêm áp lực lên service đang chết |
| **Bulkhead** | Cách ly thread pool / connection pool theo từng downstream, ngăn một service chậm "nuốt" hết resource | Caller service — separate thread pool per downstream | Thread pool đầy → request mới bị reject ngay, nhưng các thread pool khác (gọi service khác) không bị ảnh hưởng | Order Service: 20 threads cho Payment, 10 threads cho Inventory. Payment chậm → 20 threads Payment đầy, nhưng 10 threads Inventory vẫn hoạt động bình thường |
| **Fallback** | Cung cấp response thay thế (degraded) khi tất cả lớp trên đều fail, đảm bảo user luôn nhận được kết quả | Caller service — fallback handler trong code | Trả response degraded thay vì lỗi 500. Có thể dùng cache, giá trị mặc định, hoặc thông báo thân thiện | Payment fail → Order đặt trạng thái "pending_payment", trả cho user: "Đơn hàng đã tạo, thanh toán đang xử lý. Chúng tôi sẽ thông báo qua email trong 5 phút" |

**Ví dụ thực tế: User checkout khi Payment Service bị chậm**

Tình huống: Nguyễn Văn A checkout đơn hàng 500K VND trên ShopVN. Lúc này Payment Service đang bị quá tải, response time tăng từ 200ms → 8s, rồi bắt đầu trả lỗi 503.

```
Bước 1 — Rate Limit (Gateway):
  Request checkout của user A đến Gateway.
  ✅ PASS — user A mới gửi 2 req/s, dưới ngưỡng 10 req/s.
  → Request được forward tới Order Service.

Bước 2 — Timeout (Order Service → Payment Service):
  Order Service gọi Payment Service, timeout = 3s.
  ❌ TRIGGER — Payment response mất 8s > timeout 3s.
  → Request bị cancel sau 3s, thread được giải phóng.

Bước 3 — Retry (Order Service):
  Retry policy: max 2 lần, backoff 200ms, 400ms.
  Lần 1 (sau 200ms): Payment vẫn chậm → timeout 3s → fail.
  Lần 2 (sau 400ms): Payment trả 503.
  ❌ TRIGGER — Hết retry, cả 2 lần đều fail.
  → Idempotency key = "order-12345-payment" đảm bảo không charge trùng.

Bước 4 — Circuit Breaker (Order Service):
  Đã tích lũy 60% failure rate trong 30s gần nhất (nhiều user cùng checkout fail).
  ❌ TRIGGER — Circuit chuyển sang OPEN.
  → Các request checkout tiếp theo fail ngay lập tức (fast-fail trong <10ms),
    không gửi tới Payment nữa → giảm áp lực lên Payment để nó recovery.

Bước 5 — Bulkhead (Order Service):
  Thread pool "payment-pool" (20 threads) đã đầy vì các request trước đang chờ timeout.
  ✅ KHÔNG LAN TRÀN — Thread pool "inventory-pool" (10 threads) vẫn hoạt động bình thường.
  → User vẫn browse sản phẩm, xem tồn kho, thêm giỏ hàng được.

Bước 6 — Fallback (Order Service):
  ❌ TRIGGER — Payment fail hoàn toàn.
  → Order Service tạo đơn hàng với trạng thái "pending_payment".
  → Publish event OrderCreatedPendingPayment lên Kafka.
  → Trả response cho user A:
     "✅ Đơn hàng #12345 đã được tạo thành công!
      💳 Thanh toán đang được xử lý. Bạn sẽ nhận email xác nhận trong 5 phút.
      Nếu không nhận được, vui lòng vào Lịch sử đơn hàng để thử thanh toán lại."

Sau 2 phút — Circuit Breaker HALF-OPEN:
  Cho 3 request thử gọi Payment → 2/3 thành công.
  → Circuit chuyển về CLOSED, checkout hoạt động bình thường trở lại.
  → Background job xử lý các đơn "pending_payment" tồn đọng.
```

> 💡 **Nguyên tắc quan trọng:** Mỗi lớp bảo vệ một khía cạnh khác nhau. Rate Limit bảo vệ **gateway**, Timeout bảo vệ **thread**, Retry xử lý **lỗi tạm thời**, Circuit Breaker bảo vệ **downstream**, Bulkhead bảo vệ **resource isolation**, Fallback bảo vệ **user experience**. Thiếu bất kỳ lớp nào đều tạo ra lỗ hổng.

### 5.10. Capacity Planning cho Flash Sale

**Capacity Planning là gì?**

Là quá trình **tính toán trước** hệ thống cần bao nhiêu resource (pod, CPU, memory, DB connection) để chịu được traffic flash sale, rồi **chuẩn bị sẵn trước** khi sale bắt đầu. Không thể dựa hoàn toàn vào auto-scale vì auto-scale cần 2-5 phút để thêm pod mới, trong khi flash sale traffic tăng từ 0 → peak trong **vài giây** (200K user đồng loạt click lúc 12:00:00).

**Cách tính số liệu từ business metrics:**

```
Đầu vào business:
  - DAU bình thường: 200,000
  - Flash sale: 10x traffic → 2,000,000 lượt truy cập
  - Concurrent users peak: 200,000 (tập trung trong 5 phút đầu)

Ước lượng RPS:
  - Gateway:    200K concurrent × 1 req/10s = 20,000 RPS
  - Checkout:   ~6% user thực sự checkout = 12,000 user → 1,200 RPS (mỗi user 1 checkout/10s)
  - Inventory:  mỗi checkout trung bình 2.5 SKU = 1,200 × 2.5 = 3,000 QPS
  - Payment:    ~83% user hoàn tất payment (17% bỏ giữa chừng) = 1,000 QPS
  - Kafka:      mỗi event ~1KB × 45,000 events/s = ~45 MB/s
```

| Hạng mục | Baseline | Peak Flash Sale (10x) | Cách tính |
|----------|----------|------------------------|-----------|
| Gateway RPS | 2,000 | 20,000 | 200K concurrent ÷ 10s/req, có CDN cache static |
| Checkout RPS | 120 | 1,200 | ~6% conversion rate từ browse → checkout |
| Inventory reserve QPS | 200 | 3,000 | Checkout RPS × 2.5 SKU/order, burst cao 5 phút đầu |
| Payment initiate QPS | 80 | 1,000 | ~83% checkout hoàn tất payment (17% drop-off) |
| Kafka ingress | 5 MB/s | 45 MB/s | Tổng events từ Order + Inventory + Payment |

**Pre-scale cụ thể từng service:**

| Service | Baseline pods | Pre-scale Flash Sale | CPU/pod | Memory/pod | Lý do |
|---------|--------------|---------------------|---------|------------|-------|
| API Gateway | 3 | 10 | 1 vCPU | 1 GB | Nhận toàn bộ 20K RPS, SSL termination tốn CPU |
| Cart Service | 2 | 6 | 0.5 vCPU | 512 MB | User thêm/xóa giỏ hàng liên tục trước giờ sale |
| Order Service | 3 | 10 | 1 vCPU | 1 GB | Saga orchestrator, mỗi checkout gọi 4 downstream |
| Inventory Service | 2 | 8 | 1 vCPU | 512 MB | Hot path — 3,000 QPS reserve, cần nhiều DB connections |
| Payment Service | 2 | 6 | 0.5 vCPU | 512 MB | Phụ thuộc bank API, cần nhiều threads chờ callback |
| Promotion Service | 2 | 6 | 0.5 vCPU | 512 MB | Validate voucher mỗi checkout, flash sale rule check |
| Search Service | 3 | 4 | 0.5 vCPU | 1 GB | Ít tăng — user đã biết sản phẩm sale, ít search |
| Notification Service | 2 | 4 | 0.25 vCPU | 256 MB | Async qua Kafka, có thể delay vài phút OK |

> 💡 Redis và PostgreSQL cũng cần pre-scale: tăng connection pool, read replica, Redis memory.

**Timeline hành động trước/trong/sau Flash Sale:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLASH SALE TIMELINE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  T-7 ngày   📋 Planning                                            │
│  ├── Xác nhận campaign: sản phẩm nào, số lượng, khung giờ          │
│  ├── Tính toán capacity dựa trên dự kiến traffic                   │
│  └── Chuẩn bị flash sale data trong Promotion Service               │
│                                                                     │
│  T-1 ngày   🔧 Pre-scale & Verify                                  │
│  ├── Scale pods lên theo bảng pre-scale ở trên                     │
│  ├── Warm up Redis cache (product info, stock level)                │
│  ├── Pre-warm DB connection pools                                   │
│  ├── Load test với traffic giả lập 80% peak                        │
│  └── Verify monitoring dashboards & alerting rules                  │
│                                                                     │
│  T-30 phút  🚦 Final check                                         │
│  ├── Code freeze — không deploy bất kỳ service nào                 │
│  ├── On-call team vào war-room (Slack channel/Zoom)                │
│  ├── Verify tất cả pods healthy, zero error rate                   │
│  └── Bật high-priority alerting (PagerDuty)                        │
│                                                                     │
│  T=0        🔥 Flash Sale bắt đầu                                   │
│  ├── Monitor real-time: RPS, error rate, latency, queue lag        │
│  ├── Nếu error rate > 5% → xem xét bật degraded mode              │
│  ├── Nếu queue lag > 5 phút → scale Kafka consumers                │
│  └── Nếu 1 service chết → Circuit Breaker + fallback               │
│                                                                     │
│  T+2 giờ    📉 Kết thúc Flash Sale                                  │
│  ├── Chờ 30 phút để traffic giảm tự nhiên                          │
│  ├── Scale down pods dần (không scale xuống đột ngột)              │
│  ├── Chạy reconciliation jobs kiểm tra dữ liệu                    │
│  └── Thu thập metrics cho postmortem                                │
│                                                                     │
│  T+1 ngày   📝 Postmortem                                          │
│  ├── So sánh actual vs predicted traffic                           │
│  ├── Phân tích bottleneck nếu có                                   │
│  └── Cập nhật capacity model cho lần sale tiếp theo                │
└─────────────────────────────────────────────────────────────────────┘
```

**Degraded Mode — tắt gì, giữ gì:**

| Khi bật degraded mode | Hành động | Lý do |
|----------------------|-----------|-------|
| ✅ **Giữ** | Checkout flow (Order → Inventory → Payment) | Core business, mất = mất doanh thu |
| ✅ **Giữ** | Cart add/remove | User cần thêm giỏ hàng để checkout |
| ✅ **Giữ** | Product detail page (từ cache) | User cần xem sản phẩm trước khi mua |
| ⚠️ **Giảm** | Search — trả kết quả từ cache, tắt auto-suggest | Giảm load OpenSearch |
| ⚠️ **Giảm** | Recommendation — trả static "Top bán chạy" | Tắt ML inference, giảm CPU |
| ❌ **Tắt** | Review write — tạm không cho submit review | Không urgent, giảm DB write |
| ❌ **Tắt** | Notification email/SMS — queue lại, gửi sau | Delay 30 phút chấp nhận được |
| ❌ **Tắt** | Non-essential API (user profile edit, address update) | Không ai sửa profile lúc flash sale |

**Headroom policy:**

| Tình huống | Headroom | Hành động |
|-----------|----------|-----------|
| Bình thường | 40% | Auto-scale handle được |
| Trước flash sale (T-1 ngày) | Pre-scale 2-3x | Scale thủ công theo bảng trên |
| Kafka queue lag > 5 phút | — | Scale consumers + xem xét degraded mode |
| CPU > 80% bất kỳ service | — | Scale thêm pods ngay |

### 5.11. Runbook SEV-1: Checkout Down

**Runbook là gì?** Là **sổ tay hướng dẫn xử lý sự cố**, viết sẵn trước khi sự cố xảy ra. Khi hệ thống chết lúc 2 giờ sáng, engineer on-call không cần suy nghĩ — chỉ cần mở runbook và **làm theo từng bước**. Giống quy trình sơ cứu y tế — viết sẵn lúc bình yên, dùng lúc khẩn cấp.

**SEV-1 (Severity 1)** = sự cố nghiêm trọng nhất. "Checkout Down" nghĩa là user không thể đặt hàng → **mất doanh thu trực tiếp**, đặc biệt nguy hiểm trong flash sale.

**Quy trình xử lý 7 bước:**

**Bước 1 — Xác nhận phạm vi (2-5 phút đầu)**

Mở dashboard Grafana, xác định lỗi ở đâu:

| Triệu chứng trên dashboard | Nguyên nhân có thể | Hướng xử lý |
|----------------------------|--------------------|--------------| 
| Gateway 5xx tăng đột biến | Gateway quá tải hoặc misconfiguration | Xem bước 5 (rollback) hoặc scale gateway |
| Order Service timeout | Order hoặc downstream (Inventory/Payment) chậm | Xem trace → xác định downstream nào chậm |
| Payment callback fail rate tăng | Provider bên ngoài (MoMo/VNPay) lỗi | Xem bước 4 (chuyển provider) |
| Inventory reserve timeout | DB lock hoặc Inventory Service quá tải | Scale Inventory pods + kiểm tra DB connections |

**Bước 2 — Kích hoạt War-room (5 phút)**

```
- Tạo Slack channel: #incident-checkout-YYYYMMDD
- Chỉ định Incident Commander (IC): 1 người DUY NHẤT ra quyết định
  → IC là senior engineer on-call của team sở hữu service lỗi
  → IC KHÔNG tự fix — IC điều phối người khác fix
- Gọi thêm engineer liên quan:
  → Payment team nếu lỗi payment provider
  → SRE nếu lỗi infra (DB, Kafka, network)
  → Core Commerce nếu lỗi Order/Inventory logic
```

**Bước 3 — Bật Degraded Mode (ngay lập tức)**

Tắt bớt thứ không cần thiết để giải phóng resource cho checkout:

```
- Tắt: Recommendation Service, Review write, Notification email/SMS
- Giảm: Search chuyển sang cached results
- GIỮ NGUYÊN: Checkout flow (Order → Inventory → Payment → Shipping)
→ Mục tiêu: user vẫn mua được hàng, dù trải nghiệm kém hơn bình thường
```

**Bước 4 — Xử lý lỗi external payment provider**

```
Nếu MoMo chết:
  → Tắt option MoMo trên checkout UI (feature flag)
  → Chuyển traffic sang VNPay hoặc bank transfer
  → Bật option COD (thanh toán khi nhận hàng)
  → User vẫn checkout được bằng phương thức khác

Nếu TẤT CẢ provider chết:
  → Chỉ cho phép COD
  → Thông báo: "Thanh toán online tạm thời gián đoạn, vui lòng chọn COD"
```

**Bước 5 — Rollback nếu lỗi do deploy mới**

```
Kiểm tra: Có deploy nào trong 2 giờ gần nhất không?
  → Có → Rollback ngay về version trước:
    - Blue-Green: chuyển traffic về bản cũ (< 1 phút)
    - Canary: route 100% về stable version
  → Không → Lỗi không do deploy, tiếp tục debug
```

**Bước 6 — Cập nhật Status Page (mỗi 15 phút)**

```
- Cập nhật status page công khai: https://status.shopvn.vn
- Template thông báo:
  "[HH:MM] Hệ thống đang gặp sự cố với chức năng thanh toán.
   Đội ngũ kỹ thuật đang khắc phục. Cập nhật tiếp theo lúc [HH:MM+15]."
- Khi fix xong:
  "[HH:MM] Sự cố đã được khắc phục. Chức năng thanh toán hoạt động bình thường."
```

**Bước 7 — Postmortem (trong 24-48 giờ sau khi ổn định)**

```
Viết báo cáo postmortem gồm:
- Timeline chi tiết: phút nào xảy ra gì, ai làm gì
- Root cause: nguyên nhân gốc (không phải triệu chứng)
- Impact: bao nhiêu user bị ảnh hưởng, mất bao nhiêu đơn hàng
- Action items: việc cần làm để không tái diễn
  → Mỗi item phải có OWNER + DEADLINE
  → Ví dụ: "Thêm circuit breaker cho Order → Payment" — @payment-team — 2026-03-15
```

**Ví dụ timeline thực tế:**

```
02:00  PagerDuty alert: "Checkout error rate > 50%"
02:02  On-call engineer xác nhận → mở dashboard → Payment callback fail 90%
02:05  Tạo #incident-checkout-20260228, IC = Minh (Payment team lead)
02:07  Bật degraded mode, tắt recommendation + review
02:10  Xác nhận MoMo API trả 503 → lỗi phía MoMo
02:12  Bật feature flag: tắt MoMo, chuyển sang VNPay + COD
02:15  Checkout error rate giảm về 3% → hệ thống ổn định
02:15  Cập nhật status page: "Thanh toán MoMo tạm gián đoạn, VNPay và COD hoạt động bình thường"
02:30  Tắt degraded mode, bật lại recommendation + review
06:00  MoMo thông báo đã khắc phục → bật lại option MoMo
09:00  Postmortem meeting → 3 action items có owner/deadline
```

---

## Phần 6 — Observability

> 🔗 Áp dụng kiến thức từ [11 — Observability & Evolvability](11-observability-evolvability.md)

### 6.1. Mục tiêu Observability cho ShopVN

Observability trả lời 3 câu hỏi quan trọng:

- **Hệ thống có đang khỏe không?** (Metrics)
- **Lỗi đang xảy ra ở đâu?** (Logs + Traces)
- **Tại sao lại lỗi?** (Correlation giữa Logs, Metrics, Traces)

| Mục tiêu | Ngưỡng |
|----------|--------|
| API availability | >= 99.9% |
| P95 latency (core APIs) | < 300ms |
| MTTR (Mean Time To Recovery) | < 30 phút |
| MTTD (Mean Time To Detect) | < 5 phút |
| Trace sampling (prod) | 10-20% bình thường, 100% khi incident |

### 6.2. Kiến trúc Telemetry tổng thể

```d2 title="6.2. Kiến trúc Telemetry tổng thể"
direction: right
n4: "Visualization & Alerting" {}
n3: "Storage/Backend Layer" {}
n2: "Collection Layer" {}
n1: "Application Layer" {}
n1.n5: "Services: Gateway, Order, Payment, Inventory, Catalog, Search"
n2.n6: "Fluent Bit (logs)"
n2.n7: "Prometheus Scraper (metrics)"
n2.n8: "OpenTelemetry Collector (traces)"
n3.n9: "CloudWatch Logs"
n3.n10: "Amazon Managed Prometheus"
n3.n11: "AWS X-Ray / Jaeger"
n4.n12: "Grafana Dashboards"
n4.n13: "Alertmanager / Managed Alerting"
n4.n14: "PagerDuty / Slack / Email"
n1.n5 -> n2.n6: "stdout/stderr JSON logs"
n1.n5 -> n2.n7: "/metrics"
n1.n5 -> n2.n8: "OTLP spans"
n2.n6 -> n3.n9
n2.n7 -> n3.n10
n2.n8 -> n3.n11
n3.n9 -> n4.n12
n3.n10 -> n4.n12
n3.n11 -> n4.n12
n3.n10 -> n4.n13
n4.n13 -> n4.n14
# Icons: https://icons.d2lang.com/
n3.n9.icon: "https://icons.d2lang.com/aws/Management%20%26%20Governance/Amazon-CloudWatch.svg"
```

**Luồng đúng theo tín hiệu:**

- **Logs**: Service -> Fluent Bit -> CloudWatch Logs -> Grafana (query datasource).
- **Metrics**: Prometheus scrape `/metrics` -> AMP/Prometheus -> Grafana + Alertmanager.
- **Traces**: Service instrumentation (OTLP) -> OpenTelemetry Collector -> X-Ray/Jaeger -> Grafana.

### 6.3. Logging Strategy

**Nguyên tắc:**

- Log theo định dạng **JSON** để dễ query.
- Mọi log phải có `trace_id`, `span_id`, `request_id`, `user_id` (nếu có).
- Tuyệt đối không log `password`, `card_number`, `cvv`, access token full.
- Phân mức log rõ ràng: `DEBUG`, `INFO`, `WARN`, `ERROR`.

**Schema log chuẩn:**

| Field | Bắt buộc | Ví dụ | Ý nghĩa |
|-------|----------|-------|---------|
| `timestamp` | ✅ | `2026-02-27T10:12:45.123Z` | Thời điểm phát sinh |
| `service` | ✅ | `order-service` | Tên service |
| `env` | ✅ | `prod` | Môi trường |
| `level` | ✅ | `ERROR` | Mức log |
| `trace_id` | ✅ | `4bf92f...` | Correlate trace |
| `span_id` | ✅ | `00f067...` | Span hiện tại |
| `request_id` | ✅ | `req-7f39...` | ID request từ gateway |
| `user_id` | ⚠️ | `USR-9821` | Người dùng (nếu authenticated) |
| `message` | ✅ | `payment callback timeout` | Nội dung chính |
| `error_code` | ⚠️ | `PAYMENT_TIMEOUT` | Mã lỗi chuẩn hóa |

**Ví dụ log thực tế (checkout timeout):**

```json source="snippets/6-3-logging-strategy.json"
{
  "timestamp": "2026-02-27T10:12:45.123Z",
  "service": "order-service",
  "env": "prod",
  "level": "ERROR",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "request_id": "req-4c1d-93ae",
  "user_id": "USR-9821",
  "order_id": "ORD-20260227-8891",
  "error_code": "PAYMENT_TIMEOUT",
  "message": "Payment service timeout after 10s"
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=25-case-study-ecommerce&snapshot=article&file=snippets%2F6-3-logging-strategy.json)

### 6.4. Metrics Framework (RED + USE)

ShopVN áp dụng kết hợp:

- **RED** (Rate, Errors, Duration) cho HTTP/gRPC endpoints.
- **USE** (Utilization, Saturation, Errors) cho hạ tầng (CPU, memory, queue, connection pool).

| Service | Golden Metrics chính | Ngưỡng cảnh báo |
|---------|----------------------|-----------------|
| API Gateway | RPS, 4xx/5xx rate, P95 latency | 5xx > 1% trong 5 phút |
| Order | checkout success rate, saga timeout | success < 97% trong 10 phút |
| Payment | callback delay, failed charge rate | failed charge > 2% |
| Inventory | lock wait time, reserve success | reserve fail > 3% |
| Search | P95 query latency, zero-result ratio | P95 > 250ms |
| Kafka | consumer lag, DLQ size | lag > 10,000 messages |
| Database | CPU, connections, slow query count | CPU > 80% trong 10 phút |

### 6.5. SLI/SLO và Error Budget

| User Journey | SLI | SLO | Error Budget (tháng) |
|-------------|-----|-----|----------------------|
| Login | Successful login ratio | 99.95% | 0.05% |
| Search product | P95 latency | < 200ms | 5% request có thể > 200ms |
| Checkout | Success ratio | 99.5% | 0.5% |
| Payment capture | Success ratio | 99.9% | 0.1% |
| Order tracking | Availability | 99.9% | 43.8 phút/tháng |

**Quy tắc vận hành Error Budget:**

- Nếu burn rate > 2x trong 1 giờ: dừng release tính năng mới.
- Ưu tiên fix reliability bug trước feature.
- Chỉ mở lại release khi burn rate trở lại ngưỡng an toàn.

### 6.6. Distributed Tracing

```d2 title="6.6. Distributed Tracing"
shape: sequence_diagram
"U": "User"
"G": "API Gateway"
"O": "Order"
"I": "Inventory"
"P": "Payment"
"K": "Kafka"
"N": "Notification"
"U" -> "G": "POST /checkout"
"G" -> "O": "Forward (traceparent)"
"O" -> "I": "reserveStock (child span)"
"I" -> "O": "reserved" { style.stroke-dash: 5 }
"O" -> "P": "initiatePayment (child span)"
"P" -> "O": "payment_pending" { style.stroke-dash: 5 }
"O" -> "K": "publish order.created"
"K" -> "N": "consume event"
"N" -> "U": "email/sms confirmation" { style.stroke-dash: 5 }
```

**Trace tags bắt buộc:**

| Tag | Ví dụ |
|-----|-------|
| `order.id` | `ORD-20260227-8891` |
| `payment.provider` | `momo` |
| `inventory.reservation_id` | `RSV-7781` |
| `user.tier` | `gold` |
| `http.status_code` | `200` |

### 6.7. Alerting Rules theo mức độ

| Severity | Điều kiện | Kênh | SLA phản hồi |
|----------|-----------|------|--------------|
| `SEV-1` | Checkout down toàn hệ thống > 5 phút | PagerDuty + Phone | 5 phút |
| `SEV-2` | Payment fail rate > 5% | PagerDuty + Slack | 15 phút |
| `SEV-3` | Search latency tăng cao | Slack | 30 phút |
| `SEV-4` | Storage > 80% | Email + ticket | 4 giờ |

**Alert anti-noise:**

- Dùng **multi-window, multi-burn-rate** cho SLO alert.
- Alert chỉ bắn khi vi phạm liên tục (không bắn spike ngắn).
- Gom alert theo service owner để tránh duplicate.

### 6.8. Dashboard Design

| Dashboard | Đối tượng | Nội dung |
|-----------|-----------|----------|
| Executive Health | CTO/Product | GMV theo giờ, conversion rate, total errors |
| Platform SRE | SRE/DevOps | SLI/SLO, infra saturation, incident timeline |
| Checkout Deep Dive | Team Order/Payment | step timing, failure point, provider success |
| Search Quality | Team Discovery | latency, click-through rate, zero-result rate |

### 6.9. Runbook mẫu: Payment error tăng đột biến

1. Xác nhận scope qua dashboard (`payment failed rate`, `provider breakdown`).
2. Mở trace của các request fail gần nhất.
3. Kiểm tra xem lỗi nội bộ hay lỗi từ provider bên ngoài.
4. Nếu provider lỗi:
   - Mở circuit breaker.
   - Chuyển traffic sang provider dự phòng (nếu có).
   - Hiển thị thông báo thanh toán thay thế.
5. Tạo incident note + timeline.
6. Postmortem trong 24 giờ.

### 6.10. Log Retention, Sampling, và Cost Control

| Loại telemetry | Retention | Sampling | Ghi chú chi phí |
|----------------|-----------|----------|-----------------|
| Access logs | 30 ngày hot, 180 ngày cold | 100% | Bắt buộc audit |
| Application logs | 14 ngày hot, 90 ngày cold | 100% ERROR, 20% INFO | Giảm chi phí lưu trữ |
| Traces | 7 ngày | 10-20% bình thường, 100% khi incident | Tail-based sampling |
| Metrics | 15 tháng | N/A | Dùng downsampling cho long-term |

**Nguyên tắc tối ưu chi phí observability:**

- Gắn nhãn service/team để chargeback.
- Cắt log debug ở production sau 24 giờ kể từ release.
- Archive logs sang object storage lifecycle policy.

---

## Phần 7 — Security Architecture

> 🔗 Áp dụng kiến thức từ [15 — Security](15-security.md)

### 7.1. Security Principles

- **Zero Trust**: không tin tưởng mặc định bất kỳ request nội bộ nào.
- **Least Privilege**: mỗi service chỉ có quyền tối thiểu cần thiết.
- **Defense in Depth**: nhiều lớp bảo vệ từ edge đến data.
- **Secure by Default**: bật TLS, bật auth, tắt truy cập public không cần thiết.

### 7.2. AuthN/AuthZ cho người dùng cuối

```d2 title="7.2. AuthN/AuthZ cho người dùng cuối"
direction: right
n1: "User App"
n2: "API Gateway"
n3: "Identity Service / IdP"
n4: "JWT Access Token"
n5: "Order Service"
n6: "Cart Service"
n7: "Policy Engine"
n1 -> n2
n2 -> n3
n3 -> n4
n4 -> n2
n2 -> n5
n2 -> n6
n5 -> n7
n6 -> n7
```

**Luồng chuẩn:**

1. User login qua `Identity Service` (OAuth2/OIDC).
2. Nhận `access_token` (JWT, TTL ngắn 15 phút) + `refresh_token`.
3. Gateway xác thực chữ ký token.
4. Gateway forward claims cần thiết (`sub`, `role`, `scope`, `tenant_id`).
5. Service kiểm tra quyền theo policy (RBAC/ABAC).

### 7.3. Service-to-Service Security

| Control | Áp dụng | Mục đích |
|--------|---------|----------|
| mTLS | Internal traffic | Xác thực 2 chiều giữa services |
| SPIFFE/SPIRE hoặc service identity | Runtime identity | Gán identity ngắn hạn cho workload |
| IAM Role per service | Truy cập AWS resource | Không dùng static credential |
| Network Policy | K8s/ECS SG | Chặn east-west traffic không hợp lệ |
| API allowlist | Gateway/WAF | Chỉ cho endpoint cần thiết |

**Ví dụ policy:** `order-service` chỉ được gọi `inventory-service:reserve`, không được đọc DB của `payment-service`.

### 7.4. API Security Controls

| Mối đe dọa | Control |
|-----------|---------|
| Brute force login | Rate limit + CAPTCHA + lockout |
| Token theft | TLS everywhere + token TTL ngắn + rotate refresh token |
| Injection | Parameterized query + input validation |
| Broken object-level authorization | Check ownership theo `user_id` ở mọi endpoint |
| Replay payment callback | HMAC signature + nonce + timestamp check |
| DDoS/L7 flood | AWS WAF + CDN + autoscaling + rate limiting |

### 7.5. Data Protection

| Loại dữ liệu | At Rest | In Transit | Ghi chú |
|-------------|---------|------------|---------|
| User PII | AES-256 (KMS) | TLS 1.2+ | Mask log |
| Payment metadata | AES-256 | TLS 1.2+ | Không lưu PAN/CVV |
| Secrets/API keys | Secrets Manager | TLS 1.2+ | Auto-rotation 30-90 ngày |
| Backup | Encrypted snapshot | Private network | Cross-account copy |

**Phân loại dữ liệu:**

- `Public`: catalog public data.
- `Internal`: metrics, logs nghiệp vụ thường.
- `Confidential`: user profile, địa chỉ, phone.
- `Restricted`: payment token, security events.

### 7.6. Secrets Management

| Loại secret | Nơi lưu | Rotation | Owner |
|------------|---------|----------|-------|
| DB password | AWS Secrets Manager | 30 ngày | Platform team |
| Payment provider key | Secrets Manager + KMS | 30 ngày | Payment team |
| JWT signing key | KMS/HSM | 90 ngày | Security team |
| TLS cert nội bộ | ACM/Cert Manager | 60 ngày | Platform team |

**Nguyên tắc vận hành:**

- Không hard-code secret trong source code.
- Không truyền secret qua env var nếu runtime hỗ trợ file mount tạm thời.
- Audit toàn bộ truy cập secret.

### 7.7. Threat Modeling (STRIDE) cho Checkout

| STRIDE | Ví dụ rủi ro | Mitigation |
|--------|---------------|------------|
| Spoofing | Giả mạo callback từ payment gateway | HMAC + IP allowlist + cert pinning |
| Tampering | Sửa amount trên đường truyền | TLS + server-side amount revalidation |
| Repudiation | User chối giao dịch | Audit log immutable + transaction ID |
| Information Disclosure | Lộ PII qua logs | Data masking + DLP scan |
| Denial of Service | Flood `POST /checkout` | Rate limit + queue + WAF |
| Elevation of Privilege | User thường gọi admin API | RBAC + policy engine |

### 7.8. Security Testing Pipeline

| Giai đoạn | Kiểm thử |
|----------|----------|
| PR | SAST (Semgrep/CodeQL), secret scan |
| Build | Dependency scan (SCA), container image scan |
| Pre-prod | DAST (OWASP ZAP), API fuzzing |
| Prod định kỳ | Pen-test, cloud config audit (CIS benchmark) |

### 7.9. Incident Response

#### Bảng phân loại mức độ nghiêm trọng (Severity Classification)

| Mức độ | Mô tả | Người chịu trách nhiệm | Thời gian phản hồi | Ví dụ |
|--------|--------|------------------------|---------------------|-------|
| **SEV-1** | Data breach, dữ liệu thanh toán bị lộ | Incident Commander + Security Team + CTO | ≤ 15 phút | Rò rỉ PAN/CVV, database bị exfiltrate |
| **SEV-2** | Unauthorized access được phát hiện | Security Team + Team Lead liên quan | ≤ 30 phút | Tài khoản admin bị chiếm, privilege escalation |
| **SEV-3** | Hoạt động đáng ngờ (brute force, scanning) | Security Team | ≤ 2 giờ | Brute force login, port scanning nội bộ |
| **SEV-4** | Vi phạm policy nhỏ | Tạo ticket, assign owner | Ngày làm việc tiếp theo | Secret không rotate đúng hạn, TLS cert sắp hết hạn |

#### Quy trình 7 bước Incident Response

**Bước 1 — Phát hiện bất thường qua SIEM/alerts**

- **Ai:** Security Team (on-call rotation 24/7).
- **Cách thực hiện:** SIEM (ví dụ: AWS Security Hub, Splunk, Elastic SIEM) tổng hợp log từ CloudTrail, VPC Flow Logs, WAF, GuardDuty. Alert rules tự động trigger khi phát hiện anomaly (ví dụ: số lần login fail > 50/phút, outbound traffic bất thường).
- **Công cụ:** AWS GuardDuty, CloudWatch Alarms, PagerDuty/Opsgenie cho on-call notification.

**Bước 2 — Phân loại mức độ ảnh hưởng (SEV-1..SEV-4)**

- **Ai:** On-call engineer đánh giá ban đầu → Security Lead xác nhận severity.
- **Cách thực hiện:** Dựa vào bảng severity ở trên, xác định phạm vi ảnh hưởng (số user, loại dữ liệu, service nào bị tác động). Nếu liên quan đến dữ liệu thanh toán → tự động escalate lên SEV-1.
- **Công cụ:** Incident management platform (PagerDuty, Jira Service Management) với workflow tự động phân loại.

**Bước 3 — Cô lập thành phần bị compromise**

- **Ai:** DevOps/Platform Engineer dưới sự chỉ đạo của Incident Commander.
- **Cách thực hiện:**
  - Revoke IAM credentials/session tokens của thành phần bị compromise.
  - Cập nhật Security Group/NACL để block traffic đáng ngờ.
  - Nếu container bị compromise: drain node, terminate pod nhưng **giữ lại snapshot** để forensic.
  - Nếu cần: tạm thời disable API endpoint hoặc feature flag liên quan.
- **Công cụ:** AWS IAM, Security Groups, kubectl cordon/drain, feature flag system (LaunchDarkly/Unleash).

**Bước 4 — Rotate toàn bộ credentials liên quan**

- **Ai:** Security Team + DevOps.
- **Cách thực hiện:**
  - Rotate tất cả API keys, database passwords, JWT signing keys có khả năng bị ảnh hưởng.
  - Invalidate toàn bộ active sessions/tokens liên quan.
  - Cập nhật secrets trong AWS Secrets Manager/Parameter Store.
  - Verify các service đã pick up credentials mới thành công.
- **Công cụ:** AWS Secrets Manager (automatic rotation), Vault, CI/CD pipeline cho secret deployment.

**Bước 5 — Thu thập forensic logs**

- **Ai:** Security Team.
- **Cách thực hiện:**
  - Export và archive toàn bộ logs liên quan trong khoảng thời gian incident (CloudTrail, application logs, access logs).
  - Snapshot EBS volumes, memory dump nếu cần.
  - Tạo timeline chi tiết: thời điểm xâm nhập, lateral movement, dữ liệu bị truy cập.
  - Lưu evidence vào S3 bucket riêng với **write-once policy** (Object Lock) để đảm bảo tính toàn vẹn.
- **Công cụ:** AWS CloudTrail, S3 Object Lock, CloudWatch Logs Insights, Athena cho log query.

**Bước 6 — Thông báo stakeholder theo quy định**

- **Ai:** Incident Commander phối hợp với Legal/Compliance.
- **Cách thực hiện:** Theo ma trận thông báo bên dưới, thông báo đúng người, đúng thời điểm. Với SEV-1 liên quan dữ liệu cá nhân: tuân thủ quy định báo cáo vi phạm dữ liệu (72 giờ theo GDPR nếu áp dụng).
- **Công cụ:** Slack war room, email template chuẩn bị sẵn, status page (Statuspage.io).

**Bước 7 — Post-incident review + hardening action items**

- **Ai:** Toàn bộ team liên quan, điều phối bởi Engineering Manager.
- **Cách thực hiện:**
  - Tổ chức blameless post-mortem trong vòng 48 giờ sau incident.
  - Viết Incident Report: timeline, root cause, impact, action items.
  - Tạo hardening tickets với deadline cụ thể (ví dụ: thêm rate limiting, cải thiện monitoring rule).
  - Cập nhật runbook và alert rules dựa trên bài học rút ra.
- **Công cụ:** Confluence/Notion cho Incident Report, Jira cho action items tracking.

#### Ma trận thông báo (Communication Matrix)

| Mức độ | Team Lead | CTO | Legal/Compliance | Khách hàng bị ảnh hưởng | Toàn bộ công ty |
|--------|-----------|-----|------------------|------------------------|-----------------|
| **SEV-1** | Ngay lập tức | Ngay lập tức | Trong 1 giờ | Trong 24 giờ (sau khi có đánh giá impact) | Sau post-mortem |
| **SEV-2** | Ngay lập tức | Trong 1 giờ | Trong 4 giờ (nếu liên quan dữ liệu) | Nếu cần | Sau post-mortem |
| **SEV-3** | Trong 2 giờ | Báo cáo hàng tuần | Không bắt buộc | Không | Không |
| **SEV-4** | Qua ticket | Không | Không | Không | Không |

#### Ví dụ thực tế: Phát hiện API Key bị leak trên GitHub

Kịch bản: Bot tự động phát hiện một API key của Payment Service xuất hiện trong commit trên GitHub public repository.

```
Timeline:

T+0 min    │ GitHub Secret Scanning / GitGuardian alert → PagerDuty trigger
           │ On-call engineer nhận notification.
           │
T+3 min    │ On-call xác nhận: API key thuộc Payment Service (Stripe secret key).
           │ → Phân loại SEV-1 (liên quan payment credentials).
           │ → Tạo Slack war room #inc-20260228-api-key-leak.
           │
T+5 min    │ Incident Commander (Engineering Manager) join war room.
           │ Thông báo CTO, Security Lead.
           │
T+8 min    │ CÔ LẬP:
           │ - Revoke API key bị leak trên Stripe Dashboard.
           │ - Kiểm tra Stripe audit log: key có bị sử dụng trái phép không?
           │
T+12 min   │ ROTATE:
           │ - Tạo API key mới trên Stripe.
           │ - Cập nhật vào AWS Secrets Manager.
           │ - Restart Payment Service pods để pick up key mới.
           │ - Verify: test transaction thành công.
           │
T+20 min   │ FORENSIC:
           │ - Xác định commit nào chứa key (git log --all -p -S 'sk_live_xxx').
           │ - Xác nhận key chưa bị sử dụng bởi bên thứ ba (qua Stripe logs).
           │ - Archive toàn bộ evidence.
           │
T+30 min   │ THÔNG BÁO:
           │ - Cập nhật CTO: key đã bị revoke, không có unauthorized usage.
           │ - Legal confirm: không cần thông báo khách hàng (không có data breach).
           │
T+45 min   │ Incident resolved. Downgrade status.
           │
T+48 giờ   │ POST-MORTEM:
           │ - Root cause: Developer commit file .env vào repo,
           │   .gitignore không cover đúng path.
           │ - Action items:
           │     ✅ Thêm pre-commit hook chặn secret (gitleaks/detect-secrets).
           │     ✅ Enable GitHub push protection cho org.
           │     ✅ Audit toàn bộ repo khác trong org.
           │     ✅ Training team về secret hygiene.
```

### 7.10. Compliance Checklist (PCI-DSS, OWASP ASVS)

| Nhóm kiểm soát | Trạng thái mục tiêu |
|----------------|---------------------|
| Không lưu PAN/CVV | Bắt buộc |
| Tokenization với provider | Bắt buộc |
| Vulnerability scan định kỳ | Hàng tuần |
| Pen-test độc lập | Ít nhất 1 lần/năm |
| MFA cho tài khoản admin | Bắt buộc |
| Audit log immutable | Bắt buộc |
| Secret rotation tự động | Bắt buộc |

**Scope reduction cho PCI:**

- Payment UI redirect sang hosted page của provider.
- Hệ thống nội bộ chỉ xử lý `payment_token` và metadata.
- Tách network segment cho payment components.

---

## Phần 8 — Infrastructure & Deployment

> 🔗 Áp dụng kiến thức từ [12 — Containerization](12-containerization.md), [13 — Orchestration](13-orchestration.md), [14 — CI/CD](14-cicd-deployment.md)

### 8.1. Mục tiêu nền tảng hạ tầng

- Triển khai độc lập từng service.
- Scale ngang theo tải thực tế.
- Tự động hóa hạ tầng bằng IaC.
- Quan sát và bảo mật built-in.
- Tối ưu chi phí theo từng giai đoạn tăng trưởng.

### 8.2. Topology môi trường

```d2 title="8.2. Topology môi trường"
direction: right
account: AWS Account ShopVN — Minh họa {
 dev: Dev — Lower cost / Small dataset
 staging: Staging — Pre-release / Prod-like traffic
 prod: Prod — HA / SLO / Full scale
}
```

Production isolation thường nên dùng account riêng theo multi-account strategy; ba environment cùng account chỉ là sơ đồ đơn giản hóa.

### 8.3. Compute Strategy theo loại workload

| Workload | Runtime khuyến nghị | Lý do |
|----------|---------------------|-------|
| Core API (Order, Payment, Inventory) | ECS Fargate hoặc EKS | Cần runtime ổn định, control scaling |
| Search API | ECS/EKS | CPU/memory burst, cần tuning |
| Async consumers (Kafka/SQS) | ECS/EKS | Chạy liên tục, cần batch control |
| Event-driven nhẹ (thumbnail, email worker) | Lambda | Pay-per-use, scale nhanh |
| ML inference recommendation | ECS GPU hoặc endpoint riêng | Cần resource profile đặc thù |

### 8.4. Network & Edge Architecture

```d2 title="8.4. Network & Edge Architecture"
direction: right
n1: "Users"
n2: "CloudFront"
n3: "AWS WAF"
n4: "API Gateway / ALB"
n5: "Microservices in Private Subnets"
n6: "RDS / DynamoDB" {
  shape: cylinder
}
n7: "Kafka / SQS"
n1 -> n2
n2 -> n3
n3 -> n4
n4 -> n5
n5 -> n6
n5 -> n7
# Icons: https://icons.d2lang.com/
n2.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-CloudFront.svg"
n3.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-WAF.svg"
```

**Thiết kế mạng:**

- Public subnet chỉ chứa edge components (ALB/NAT nếu cần).
- Tất cả service nghiệp vụ chạy private subnet.
- DB, cache chỉ cho phép inbound từ security group của service liên quan.
- Egress outbound bị kiểm soát qua NAT + firewall policy.

### 8.5. Container Standards

| Tiêu chí | Chuẩn áp dụng |
|----------|---------------|
| Base image | Distroless/Alpine tối giản |
| Build | Multi-stage Docker build |
| Security | Run as non-root, read-only filesystem |
| Health check | `/healthz`, `/readyz` rõ ràng |
| Resource limit | CPU/memory request-limit bắt buộc |
| Artifact | Immutable tag theo commit SHA |

### 8.6. Autoscaling Policy

| Service | Metric scale-out | Min/Max replica | Cooldown |
|---------|------------------|-----------------|----------|
| Gateway | CPU > 60% hoặc RPS | 4/50 | 60s |
| Order | RPS + queue lag | 6/80 | 90s |
| Payment | in-flight request | 4/40 | 120s |
| Search | P95 latency + CPU | 4/60 | 60s |
| Consumers | consumer lag | 2/100 | 45s |

### 8.7. CI/CD Pipeline chi tiết

```d2 title="8.7. CI/CD Pipeline chi tiết"
direction: right
n1: "Git Push"
n2: "CI: test + lint + scan"
n3: "Build image"
n4: "Push ECR"
n5: "Deploy Staging"
n6: "Integration + contract test"
n7: "Approval Gate"
n8: "Canary/Blue-Green Prod"
n9: "Post-deploy verification"
n1 -> n2
n2 -> n3
n3 -> n4
n4 -> n5
n5 -> n6
n6 -> n7
n7 -> n8
n8 -> n9
```

**Gate bắt buộc trước production:**

- Unit test pass >= 90% success.
- Contract test pass 100%.
- Security scan không có lỗ hổng Critical/High chưa waive.
- Smoke test pass sau deploy.

### 8.8. Deployment Strategy theo service

| Service | Strategy | Lý do |
|---------|----------|-------|
| Gateway | Canary 5% -> 25% -> 100% | Rủi ro cao, cần quan sát lỗi sớm |
| Order/Payment/Inventory | Blue-Green | Tránh downtime, rollback nhanh |
| Catalog/Search | Rolling update | Chấp nhận rolling vì read-heavy |
| Consumers | Rolling + drain graceful | Tránh mất message đang xử lý |
| Lambda workers | Alias weighted canary | Native deployment control |

### 8.9. Backup, DR, và BCP

| Thành phần | RPO | RTO | Chiến lược |
|-----------|-----|-----|------------|
| Order DB | 5 phút | 30 phút | PITR + multi-AZ |
| Payment DB | < 1 phút | 15 phút | Synchronous replica + PITR |
| Catalog DB | 15 phút | 60 phút | Snapshot định kỳ |
| Kafka topics | 5 phút | 30 phút | Replication + mirror topic |
| Object storage | gần 0 | 15 phút | Versioning + cross-region replication |

**BCP thực tế cho flash sale:**

- Freeze deploy trước sự kiện 24 giờ.
- Pre-scale capacity lên 2-3 lần baseline.
- War-room trực chiến (Product + Eng + SRE + Security).
- Chuẩn bị runbook rollback trong 1 lệnh.

### 8.10. IaC Structure & Environment Promotion

| Thành phần | Công cụ | Quy tắc |
|------------|---------|---------|
| VPC, subnet, SG, IAM | Terraform/CDK | Tách module reusable |
| ECS/EKS services | Terraform/CDK + Helm (nếu EKS) | Mỗi service 1 module/chart |
| Database/cache | Terraform | Backup policy bắt buộc |
| CI/CD pipelines | Terraform + GitHub Actions templates | Chuẩn hóa theo service type |

**Promotion flow:**

1. Merge vào `main` -> deploy `dev` tự động.
2. Tag release -> deploy `staging`.
3. Sau khi test + approval -> deploy `prod` theo canary/blue-green.
4. Artifact immutable, tuyệt đối không rebuild giữa các môi trường.

---

## Phần 9 — So sánh các Solution Infrastructure

### 9.1. 3 phương án cho ShopVN

#### Solution A: ECS Fargate-first

**Kiến trúc tổng quan:** Tất cả microservices (Order, Payment, Inventory, Catalog, Notification, User…) đều chạy trên **Amazon ECS với launch type Fargate**. AWS hoàn toàn quản lý infrastructure layer — không cần provision hay patch EC2 instance. Mỗi service được đóng gói thành Docker container, định nghĩa Task Definition với CPU/Memory, và deploy qua ECS Service với ALB phía trước.

```d2 title="Solution A: ECS Fargate-first"
direction: down
ingress: ALB / API Gateway
core: ECS Fargate {
 s0: "Order Service"
 s1: "Payment Service"
 s2: "Catalog Service"
 s3: "Notification Service"
}
ingress -> core.s0
ingress -> core.s1
ingress -> core.s2
ingress -> core.s3
# Icons: https://icons.d2lang.com/
core.icon: "https://icons.d2lang.com/aws/Compute/AWS-Fargate.svg"
```

- **Ưu điểm:**
  - Đơn giản vận hành — không quản lý cluster node, không lo patching OS, không capacity planning cho EC2
  - Thời gian go-live nhanh — team chỉ cần biết Docker + ECS Task Definition là đủ deploy
  - Auto Scaling tích hợp sẵn ở mức task, kết hợp CloudWatch metrics
  - Bảo mật tốt — mỗi task chạy isolated, có riêng ENI (Elastic Network Interface)

- **Nhược điểm:**
  - Chi phí cao hơn EC2 15-30% cho workload stable, chạy liên tục 24/7 (không tận dụng được Reserved Instance hay Spot hiệu quả như EC2)
  - Ít flexibility về networking và runtime — không can thiệp sâu vào host OS, không mount arbitrary volumes dễ dàng
  - Không phù hợp cho workload cần GPU hoặc custom kernel module
  - Vendor lock-in cao hơn so với Kubernetes

#### Solution B: EKS-first

**Kiến trúc tổng quan:** Tất cả microservices chạy trên **Amazon EKS** (Elastic Kubernetes Service). Team quản lý Kubernetes cluster, sử dụng Helm charts để package và deploy services. Mỗi service là một Deployment + Service + Ingress trong K8s, với HPA (Horizontal Pod Autoscaler) để auto-scale.

```d2 title="Solution B: EKS-first"
direction: down
ingress: Ingress Controller — ALB / Nginx
core: EKS — Managed Node Groups {
 s0: "Order Pod"
 s1: "Payment Pod"
 s2: "Catalog Pod"
 s3: "Notification Pod"
}
ingress -> core.s0
ingress -> core.s1
ingress -> core.s2
ingress -> core.s3
# Icons: https://icons.d2lang.com/
core.icon: "https://icons.d2lang.com/aws/Compute/Amazon-Elastic-Kubernetes-Service.svg"
```

- **Ưu điểm:**
  - Linh hoạt cao nhất — toàn quyền kiểm soát networking (Service Mesh, Network Policy), scheduling, resource management
  - Ecosystem cực lớn — Helm charts, Operators (database operator, cert-manager, external-secrets…), CNCF tooling
  - Portable — có thể migrate sang GKE, AKS hoặc on-premise K8s khi cần multi-cloud
  - Chi phí compute có thể tối ưu sâu với Spot Instances, Karpenter auto-provisioner, bin-packing pods hiệu quả

- **Nhược điểm:**
  - Cần team platform có kinh nghiệm Kubernetes — ít nhất 2-3 người hiểu sâu K8s networking, RBAC, troubleshooting
  - Chi phí control plane cố định (~$73/tháng/cluster), cộng thêm chi phí nhân sự vận hành
  - Learning curve cao — YAML manifests phức tạp, debugging pod failures khó hơn ECS
  - Thời gian go-live chậm hơn — setup cluster, configure add-ons (CoreDNS, metrics-server, Ingress controller…) mất 2-4 tuần

#### Solution C: Hybrid (ECS cho core + Lambda cho event-driven)

**Kiến trúc tổng quan:** Phân loại workload và chọn compute phù hợp nhất cho từng loại. **Core API services** (request-response, cần low latency, chạy liên tục) deploy trên **ECS Fargate**. **Event-driven và burst workloads** (xử lý bất đồng bộ, traffic không đều) chạy trên **AWS Lambda**. Khi team platform trưởng thành, có thể migrate dần sang EKS nếu cần.

```d2 title="Solution C: Hybrid (ECS cho core + Lambda cho event-driven)"
direction: down
ingress: ALB / API Gateway
core: ECS Fargate {
 s0: "Order Service"
 s1: "Payment Service"
 s2: "Catalog Service"
}
ingress -> core.s0
ingress -> core.s1
ingress -> core.s2
triggers: SQS / SNS / EventBridge triggers
lambda: Lambda { notification: Notification; image: Image Resize }
triggers -> lambda.notification
triggers -> lambda.image
# Icons: https://icons.d2lang.com/
core.icon: "https://icons.d2lang.com/aws/Compute/AWS-Fargate.svg"
lambda.icon: "https://icons.d2lang.com/aws/Compute/AWS-Lambda.svg"
```

- **Ưu điểm:**
  - Tối ưu chi phí theo từng loại workload — Lambda chỉ tính tiền khi thực thi, rất phù hợp cho burst/sporadic tasks
  - Balance giữa simplicity (ECS Fargate cho core) và cost-efficiency (Lambda cho event-driven)
  - Giảm operational overhead so với EKS nhưng vẫn linh hoạt hơn ECS thuần túy
  - Lộ trình migration rõ ràng — bắt đầu đơn giản, phức tạp hóa khi cần

- **Nhược điểm:**
  - Phải quản lý 2 compute platform (ECS + Lambda) — cần chuẩn hóa CI/CD cho cả hai
  - Lambda có cold start latency (100-500ms), không phù hợp cho real-time API cần p99 < 50ms
  - Governance phức tạp hơn — cần decision framework rõ ràng để team biết khi nào dùng ECS, khi nào dùng Lambda

### 9.2. So sánh định tính

| Tiêu chí | Solution A: ECS Fargate | Solution B: EKS | Solution C: Hybrid (ECS + Lambda) |
|----------|--------------------------|-----------------|------------------------------------|
| Độ phức tạp vận hành | Thấp-Trung bình | Cao | Trung bình |
| Chi phí nền tảng ban đầu | Trung bình | Cao (team + control plane) | Trung bình |
| Tốc độ go-live | Nhanh | Chậm hơn | Nhanh-Trung bình |
| Khả năng custom networking/runtime | Trung bình | Rất cao | Cao |
| Học tập cho team | Dễ hơn | Khó hơn | Trung bình |
| Phù hợp team 30 dev | ✅ tốt | ⚠️ cần team platform mạnh | ✅ tốt nếu governance tốt |
| Phù hợp phase 1 | ✅ | ⚠️ | ✅ |
| Phù hợp scale rất lớn dài hạn | ⚠️ | ✅ | ✅ |

### 9.3. Ước lượng chi phí tương đối (tham chiếu)

| Thành phần | A: ECS Fargate | B: EKS | C: Hybrid |
|-----------|-----------------|--------|-----------|
| Compute core APIs | 1.0x | 0.8x-1.1x (tùy tối ưu node) | 0.9x |
| Ops overhead nhân sự | 1.0x | 1.4x | 1.2x |
| Event workloads | 1.0x | 1.0x | 0.6x-0.9x (Lambda phù hợp burst) |
| Tổng giai đoạn đầu | **1.0x (baseline)** | **1.2x-1.4x** | **0.95x-1.15x** |

> Ghi chú: Đây là estimate tương đối để ra quyết định kiến trúc ban đầu. Cost thực tế phụ thuộc traffic, data transfer, reserved plans, và mức tối ưu workload.

### 9.4. Decision đề xuất cho ShopVN

**Khuyến nghị:** chọn **Solution C (Hybrid)** — ECS Fargate cho core APIs + Lambda cho event-driven workloads.

#### Tại sao Hybrid phù hợp nhất với bối cảnh ShopVN?

ShopVN là startup với **team 30 developers**, phần lớn có kinh nghiệm backend nhưng **chưa có chuyên môn Kubernetes**. Trong bối cảnh này:

| Yếu tố bối cảnh | Ảnh hưởng tới quyết định |
|------------------|--------------------------|
| Team 30 dev, chưa có K8s experience | Loại bỏ Solution B (EKS) ở giai đoạn đầu — learning curve quá cao, mất 2-3 tháng chỉ để team làm quen |
| Startup budget, cần tối ưu chi phí | Hybrid cho phép dùng Lambda (pay-per-invocation) cho burst workloads thay vì chạy Fargate tasks 24/7 |
| Cần go-live nhanh (target < 3 tháng cho Phase 1) | ECS Fargate setup nhanh hơn EKS 2-4 tuần, team tập trung vào business logic thay vì infrastructure |
| Traffic pattern không đều — peak giờ trưa/tối, thấp lúc 2-5h sáng | Lambda auto-scale to zero cho event workloads, Fargate auto-scale cho core APIs |

#### Chi tiết mapping Service → Compute Platform

| Service | Compute | Lý do |
|---------|---------|-------|
| **Order Service** | ECS Fargate | Core business flow, cần low latency ổn định (p99 < 200ms), chạy liên tục |
| **Payment Service** | ECS Fargate | Xử lý giao dịch tài chính, cần connection pool tới Payment Gateway, không chấp nhận cold start |
| **Inventory Service** | ECS Fargate | Real-time stock check khi đặt hàng, cần giữ connection tới database luôn sẵn sàng |
| **Catalog Service** | ECS Fargate | Đọc nhiều (read-heavy), serve qua cache layer (ElastiCache), cần response time ổn định cho UX |
| **User/Auth Service** | ECS Fargate | Authentication flow cần latency thấp, session management liên tục |
| **Notification Service** | Lambda | Event-driven (trigger từ SQS khi order created/updated), burst traffic, không cần chạy 24/7 |
| **Image Processing** | Lambda | Resize/optimize ảnh sản phẩm khi upload, workload sporadic, phù hợp Lambda timeout 15 phút |
| **Search Enrichment** | Lambda | Đồng bộ data vào Elasticsearch khi product thay đổi, trigger từ DynamoDB Streams hoặc EventBridge |
| **Report Generation** | Lambda | Tạo báo cáo doanh thu theo schedule (cron), chạy vài lần/ngày, không cần container chạy liên tục |
| **Webhook Handler** | Lambda | Nhận webhook từ Payment Gateway (VNPay, Momo), traffic không dự đoán được, auto-scale tự nhiên |

#### Lộ trình triển khai theo 3 phase

**Phase 1 (tháng 0-3):** Deploy core services lên ECS Fargate, Notification + Image Processing lên Lambda. CI/CD pipeline dùng CodePipeline cho cả hai compute platform.

**Phase 2 (tháng 3-9):** Tách thêm services, hoàn thiện event-driven architecture với EventBridge + SQS. Lambda xử lý thêm Search Enrichment, Report, Webhook.

**Phase 3 (tháng 9-18):** Tối ưu chi phí, đánh giá lại kiến trúc. Nếu đủ điều kiện, bắt đầu pilot EKS cho một vài services.

#### Khi nào ShopVN nên cân nhắc migrate sang EKS?

Không cần migrate sang EKS trừ khi gặp **ít nhất 2 trong 4 triggers** sau:

| Trigger | Mô tả | Ngưỡng cụ thể |
|---------|--------|----------------|
| **Số lượng services lớn** | Quản lý hàng trăm ECS services trở nên khó khăn, cần namespace/label-based management | > 100 microservices |
| **Cần custom operators** | Yêu cầu tự động hóa phức tạp: database provisioning, canary deployment nâng cao, custom autoscaler | Khi built-in ECS/Lambda không đáp ứng được |
| **Multi-cloud requirement** | Business yêu cầu chạy trên nhiều cloud provider để tránh vendor lock-in hoặc compliance | Có yêu cầu rõ ràng từ stakeholder |
| **Team platform trưởng thành** | Đã có team platform 3-5 người với production K8s experience, sẵn sàng own Kubernetes cluster | Team platform ≥ 3 người có CKA/CKAD |

> **Lưu ý quan trọng:** Migration sang EKS không phải là mục tiêu — mà là công cụ khi ECS/Lambda không còn đáp ứng được nhu cầu. Nhiều tổ chức chạy thành công hàng trăm services trên ECS Fargate mà không cần EKS.

### 9.5. Migration Path 3 giai đoạn

| Giai đoạn | Thời gian | Trọng tâm | Kết quả |
|-----------|-----------|-----------|---------|
| Phase 1 | 0-3 tháng | Strangler Fig + tách core services | Monolith giảm tải 40-60% |
| Phase 2 | 3-9 tháng | Event-driven, observability, security hardening | Scale độc lập cho core flow |
| Phase 3 | 9-18 tháng | Tối ưu cost/perf, cân nhắc EKS cho workload phù hợp | Nền tảng ổn định dài hạn |

### 9.6. Weighted Decision Matrix

| Tiêu chí | Trọng số | ECS Fargate | EKS | Hybrid |
|----------|----------|-------------|-----|--------|
| Time-to-market | 25% | 9 | 6 | 8 |
| Vận hành dài hạn | 20% | 7 | 9 | 8 |
| Chi phí giai đoạn đầu | 20% | 8 | 6 | 8 |
| Khả năng mở rộng cực lớn | 15% | 7 | 9 | 8 |
| Năng lực hiện tại của team | 20% | 8 | 6 | 8 |
| **Điểm tổng** | **100%** | **7.95** | **7.10** | **8.00** |

Kết quả định lượng phù hợp với khuyến nghị chọn **Hybrid** cho bối cảnh hiện tại của ShopVN.

---

## Phần 10 — Tổng kết Architecture Decision Records

### 10.1. Danh sách ADR chính

| ADR # | Quyết định | Lý do | Alternatives đã cân nhắc |
|-------|------------|-------|---------------------------|
| ADR-001 | Decompose theo Business Capability + Bounded Context | Ranh giới nghiệp vụ rõ, phù hợp team ownership | Tách theo technical layer |
| ADR-002 | Database per Service | Giảm coupling dữ liệu, tăng autonomy | Shared database |
| ADR-003 | Saga Orchestration cho checkout | Luồng nhiều bước, cần compensating rõ ràng | Choreography thuần event |
| ADR-004 | Transactional Outbox | Tránh dual-write inconsistency | 2PC, publish trực tiếp sau commit |
| ADR-005 | Sync + Async hybrid communication | Cân bằng độ trễ và độ tin cậy | Sync-only hoặc async-only |
| ADR-006 | CQRS cho Catalog/Search | Read-heavy, cần query tối ưu | Single model duy nhất |
| ADR-007 | Event Sourcing chưa áp dụng phase đầu | Giảm complexity, tăng tốc delivery | Full Event Sourcing từ đầu |
| ADR-008 | Defense-in-depth resilience stack | Ngăn cascading failure | Chỉ dùng retry cơ bản |
| ADR-009 | Zero Trust + mTLS + IAM per service | Tăng security posture nội bộ | Shared static credentials |
| ADR-010 | Hybrid ECS + Lambda | Go-live nhanh + tối ưu burst cost | ECS-only, EKS-only |

### 10.2. ADR template đề xuất

| Trường | Nội dung cần có |
|--------|-----------------|
| `Title` | Tên quyết định |
| `Status` | Proposed / Accepted / Deprecated |
| `Context` | Bối cảnh nghiệp vụ và kỹ thuật |
| `Decision` | Quyết định cụ thể |
| `Consequences` | Lợi ích, trade-off, rủi ro |
| `Alternatives` | Các phương án đã loại |
| `Date` | Ngày quyết định |
| `Owners` | Team/phụ trách |

### 10.3. Trade-off tổng thể

| Quyết định | Lợi ích | Trade-off |
|-----------|---------|-----------|
| Tách nhiều services ngay từ đầu | Autonomy cao | Tăng vận hành và quan sát |
| Saga thay vì transaction phân tán | Scale tốt, linh hoạt | Eventual consistency + debug khó hơn |
| Hybrid compute | Tối ưu chi phí/tính linh hoạt | Governance phức tạp hơn |
| CQRS có chọn lọc | Tối ưu read path | Tăng đồng bộ dữ liệu |

### 10.4. KPI đánh giá thành công sau migration

| KPI | Trước migration | Mục tiêu sau migration |
|-----|-----------------|------------------------|
| Deploy frequency | 2 lần/tháng | >= 20 lần/tháng |
| Lead time for change | 7-14 ngày | < 1 ngày |
| MTTR | 4 giờ | < 30 phút |
| Checkout success rate | 96-97% peak | >= 99.5% |
| P95 API latency | 450-700ms peak | < 300ms |
| Downtime mỗi lần release | 2-3 giờ | ~0 (zero-downtime) |

### 10.5. Kết luận case study

Thiết kế này giúp ShopVN:

- Chuyển từ monolith sang kiến trúc microservice có lộ trình, giảm rủi ro big-bang.
- Tập trung đầu tư vào core domain (`Order`, `Payment`, `Inventory`) nơi tạo khác biệt cạnh tranh.
- Đảm bảo scale cho flash sale bằng event-driven, autoscaling và resilience patterns.
- Tăng độ tin cậy vận hành thông qua observability đầy đủ và SLO-driven operations.
- Đáp ứng bảo mật thực chiến với Zero Trust, mTLS, secrets rotation và security testing liên tục.

### 10.6. Backlog thực thi 90 ngày đầu

| Tuần | Deliverable | Owner |
|------|-------------|-------|
| 1-2 | Chuẩn hóa logging/metrics/tracing SDK cho tất cả services | Platform |
| 3-4 | Triển khai API Gateway policy chuẩn + idempotency middleware | Experience |
| 5-6 | Hoàn thiện Order Saga orchestration + outbox relay | Core Commerce |
| 7-8 | Payment ACL + callback verification + reconciliation job | Payment |
| 9-10 | Inventory atomic reserve + expiry worker | Core Commerce |
| 11-12 | SLO dashboard + alert burn-rate + runbook SEV-1 | SRE |

**Definition of Done cho mỗi service migration:**

- Contract test pass.
- SLO và alert đã bật.
- Runbook + on-call ownership rõ ràng.
- Rollback verified trong staging.

---

## 🔗 Liên kết

- [01 — Microservice Overview](01-microservice-overview.md)
- [02 — Single Responsibility & Bounded Context](02-single-responsibility-bounded-context.md)
- [05 — Decomposition Strategies](05-decomposition-strategies.md)
- [06 — Inter-Service Communication](06-inter-service-communication.md)
- [07 — API Gateway](07-api-gateway.md)
- [08 — Service Discovery](08-service-discovery.md)
- [09 — Data Management](09-data-management.md)
- [10 — Resilience Patterns](10-resilience-patterns.md)
- [11 — Observability & Evolvability](11-observability-evolvability.md)
- [12 — Containerization](12-containerization.md)
- [13 — Orchestration](13-orchestration.md)
- [14 — CI/CD Deployment](14-cicd-deployment.md)
- [15 — Security](15-security.md)
- [16 — Configuration & Secrets Management](16-configuration-secrets-management.md)
- [17 — Design Patterns](17-design-patterns.md)
- [18 — AWS Deployment Architecture](18-aws-deployment-architecture.md)
- [19 — AWS Communication & Discovery](19-aws-communication-discovery.md)
- [20 — AWS Data Management](20-aws-data-management.md)
- [21 — AWS Resilience](21-aws-resilience.md)
- [22 — AWS Observability](22-aws-observability.md)
- [23 — AWS Security](23-aws-security.md)
- [24 — AWS CI/CD Deployment](24-aws-cicd-deployment.md)
