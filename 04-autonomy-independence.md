# Autonomy & Independence trong Microservice

## 📋 Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
- [2. Service Autonomy — Tự chủ của Service](#2-service-autonomy--tự-chủ-của-service)
  - [2.1. Autonomy là gì?](#21-autonomy-là-gì)
  - [2.2. Bốn cấp độ Autonomy](#22-bốn-cấp-độ-autonomy)
  - [2.3. Tại sao Autonomy quan trọng?](#23-tại-sao-autonomy-quan-trọng)
- [3. Independent Deployment — Triển khai độc lập](#3-independent-deployment--triển-khai-độc-lập)
  - [3.1. Định nghĩa](#31-định-nghĩa)
  - [3.2. Yêu cầu để đạt Independent Deployment](#32-yêu-cầu-để-đạt-independent-deployment)
  - [3.3. Backward Compatibility — Tương thích ngược](#33-backward-compatibility--tương-thích-ngược)
    - [Khi nào giữ version cũ, khi nào không?](#khi-nào-giữ-version-cũ-khi-nào-không)
  - [3.4. Consumer-Driven Contract Testing](#34-consumer-driven-contract-testing)
  - [3.5. Ví dụ thực tế — Deploy Pipeline](#35-ví-dụ-thực-tế--deploy-pipeline)
- [4. Independent Scalability — Mở rộng độc lập](#4-independent-scalability--mở-rộng-độc-lập)
  - [4.1. Tại sao cần scale riêng từng service?](#41-tại-sao-cần-scale-riêng-từng-service)
  - [4.2. Horizontal vs Vertical Scaling](#42-horizontal-vs-vertical-scaling)
  - [4.3. Scaling Patterns](#43-scaling-patterns)
  - [4.4. Ví dụ thực tế — E-Commerce Black Friday](#44-ví-dụ-thực-tế--e-commerce-black-friday)
- [5. Technology Independence — Độc lập công nghệ](#5-technology-independence--độc-lập-công-nghệ)
  - [5.1. Polyglot Architecture](#51-polyglot-architecture)
  - [5.2. Polyglot Persistence](#52-polyglot-persistence)
  - [5.3. Khi nào nên / không nên đa công nghệ](#53-khi-nào-nên--không-nên-đa-công-nghệ)
- [6. Team Ownership — Sở hữu bởi Team](#6-team-ownership--sở-hữu-bởi-team)
  - [6.1. Conway's Law](#61-conways-law)
  - [6.2. Inverse Conway Maneuver](#62-inverse-conway-maneuver)
  - [6.3. Mô hình tổ chức team](#63-mô-hình-tổ-chức-team)
  - [6.4. "You Build It, You Run It"](#64-you-build-it-you-run-it)
- [7. Self-Contained Service](#7-self-contained-service)
  - [7.1. Định nghĩa](#71-định-nghĩa)
  - [7.2. Các thành phần của Self-Contained Service](#72-các-thành-phần-của-self-contained-service)
  - [7.3. Data Locality — Sao chép dữ liệu cần thiết](#73-data-locality--sao-chép-dữ-liệu-cần-thiết)
- [8. Fault Isolation — Cô lập lỗi](#8-fault-isolation--cô-lập-lỗi)
  - [8.1. Tại sao Fault Isolation quan trọng?](#81-tại-sao-fault-isolation-quan-trọng)
  - [8.2. Kỹ thuật Fault Isolation](#82-kỹ-thuật-fault-isolation)
  - [8.3. Graceful Degradation](#83-graceful-degradation)
- [9. Case Study thực tế](#9-case-study-thực-tế)
  - [9.1. Netflix — Ông tổ Microservice](#91-netflix--ông-tổ-microservice)
  - [9.2. Spotify — Squad Model](#92-spotify--squad-model)
  - [9.3. Amazon — Two-Pizza Team](#93-amazon--two-pizza-team)
- [10. Anti-patterns](#10-anti-patterns)
- [11. Checklist đánh giá Autonomy](#11-checklist-đánh-giá-autonomy)
- [12. Tổng kết](#12-tổng-kết)
- [13. Liên kết liên quan](#13-liên-kết-liên-quan)

---

## 1. Giới thiệu

Trong các doc trước, chúng ta đã tìm hiểu cách **xác định ranh giới** service ([doc 02](02-single-responsibility-bounded-context.md)) và đảm bảo **chất lượng ranh giới** qua Loose Coupling & High Cohesion ([doc 03](03-loose-coupling-high-cohesion.md)). Bài này đi vào câu hỏi tiếp theo: **Khi đã tách service rồi, mỗi service cần độc lập đến mức nào?**

**Autonomy & Independence** là mục tiêu cốt lõi của kiến trúc Microservice. Nếu các service không thực sự độc lập, bạn chỉ đang có một **Distributed Monolith** — phức tạp hơn monolith gốc mà không được lợi ích gì.

```d2 title="1. Giới thiệu"
direction: right
deploy: "Deploy Independently"
scale: "Scale Independently"
tech: "Technology Independently"
autonomy: "Service Autonomy"
team: "Team Ownership"
fault: "Fault Isolation"
data: "Data Ownership"
deploy -> autonomy
scale -> autonomy
tech -> autonomy
autonomy -> team
autonomy -> fault
autonomy -> data
```

---

## 2. Service Autonomy — Tự chủ của Service

### 2.1. Autonomy là gì?

**Service Autonomy** là khả năng của một service để **hoạt động, phát triển, và vận hành** mà **không cần sự cho phép hay phối hợp** với các service khác.

Một service được coi là **autonomous** khi:
- **Tự quyết định** cách thực hiện logic nghiệp vụ
- **Tự quản lý** dữ liệu của mình
- **Tự triển khai** mà không cần chờ service khác
- **Tự phục hồi** khi gặp sự cố
- **Tự scale** theo nhu cầu riêng

### 2.2. Bốn cấp độ Autonomy

```d2 title="2.2. Bốn cấp độ Autonomy"
direction: down
n4: "Level 1: Code Autonomy" {}
n3: "Level 2: Development Autonomy" {}
n2: "Level 3: Deployment Autonomy" {}
n1: "Level 4: Full Autonomy 🏆" {}
n1.n5: "Service tự vận hành hoàn toàn\nSelf-healing, auto-scaling\nZero coordination needed"
n2.n6: "Deploy bất kỳ lúc nào\nKhông cần sync với team khác\nCó CI/CD pipeline riêng"
n3.n7: "Team tự chọn tech stack\nTự thiết kế internal architecture\nNhưng deploy vẫn cần coordinate"
n4.n8: "Codebase riêng (separate repo)\nNhưng share DB, share deploy\nVẫn cần sync nhiều"
n4 -> n3
n3 -> n2
n2 -> n1
```

| Level | Tên | Đặc điểm | Ví dụ |
|-------|-----|-----------|-------|
| **1** | Code Autonomy | Repo riêng nhưng vẫn share DB, cùng deploy | Tách code nhưng chung database |
| **2** | Development Autonomy | Tự chọn tech, thiết kế nội bộ, nhưng deploy phối hợp | Team Java và team Go, nhưng deploy cùng lúc |
| **3** | Deployment Autonomy | Deploy độc lập, CI/CD riêng | Mỗi service tự deploy bất kỳ lúc nào |
| **4** | Full Autonomy | Tự vận hành, self-healing, auto-scaling | Netflix, Amazon — service tự xử lý mọi thứ |

**Mục tiêu**: Đạt ít nhất **Level 3** cho hầu hết các service.

### 2.3. Tại sao Autonomy quan trọng?

```d2 title="2.3. Tại sao Autonomy quan trọng?"
direction: down
without: "Không Autonomy — lead time 2 tuần, deploy 1 lần/tháng" {
 a: Team A muốn deploy feature
 b: Chờ Team B fix bug
 c: Team C cần update API
 window: Schedule deploy window chung
 deploy: Deploy sau 2 tuần chờ
 a -> b -> c -> window -> deploy
}
with: "Có Autonomy — ví dụ 15 phút, deploy 10 lần/ngày" {
 a: Team A deploy feature
 b: Không bị chặn bởi team khác
 ci: CI/CD tự động
 deploy: Deploy trong 15 phút
 a -> b -> ci -> deploy
}
```

Các con số minh họa lead time/deploy frequency; autonomy cần compatible contracts và ownership, không có nghĩa thay đổi không bao giờ tác động consumers.

**Số liệu thực tế** (theo DORA Research):

| Metric | Low Performer | Elite Performer |
|--------|--------------|-----------------|
| **Deploy Frequency** | 1 lần / tháng–6 tháng | Nhiều lần / ngày |
| **Lead Time for Changes** | 1–6 tháng | < 1 giờ |
| **Change Failure Rate** | 46–60% | 0–15% |
| **Time to Restore** | 1 tuần–1 tháng | < 1 giờ |

Autonomy là yếu tố then chốt giúp team đạt **Elite Performer** level.

---

## 3. Independent Deployment — Triển khai độc lập

### 3.1. Định nghĩa

**Independent Deployment** là khả năng deploy một service vào production mà **không cần deploy bất kỳ service nào khác** cùng lúc.

```d2 title="3.1. Định nghĩa"
direction: down
coordinated: "Coordinated — Thứ 7 02:00–06:00\nTổng minh họa 2h50 • Rủi ro cao" {
 order: Order v2.3 — 30 phút
 payment: Payment v1.8 — 20 phút
 inventory: Inventory v3.1 — 15 phút
 tests: Integration tests — 45 phút
 rollback: Nếu lỗi — rollback tất cả 60 phút
 order -> payment -> inventory -> tests -> rollback
}
independent: "Independent — Order v2.3\nTổng minh họa 24 phút kể cả rollback • Rủi ro thấp hơn" {
 push: Push code / CI tests — 10 phút
 build: Build / push image — 5 phút
 rolling: Rolling update — 5 phút
 health: Health / Smoke test — 2 phút
 rollback: Nếu lỗi — rollback chỉ Order 2 phút
 push -> build -> rolling -> health -> rollback
}
```

### 3.2. Yêu cầu để đạt Independent Deployment

```d2 title="3.2. Yêu cầu để đạt Independent Deployment"
direction: down
n1: "Independent Deployment"
n2: "API Backward\nCompatibility"
n3: "Database\nper Service"
n4: "Separate\nCI/CD Pipeline"
n5: "Contract\nTesting"
n6: "Feature\nFlags"
n7: "Independent\nConfig"
n8: "Không breaking changes\nVersioning API"
n9: "Không shared schema\nMigration riêng"
n10: "Build riêng\nDeploy riêng\nRollback riêng"
n11: "Consumer-Driven\nContract Test"
n12: "Deploy code trước\nEnable feature sau"
n13: "Mỗi service có\nconfig riêng"
n1 -> n2
n1 -> n3
n1 -> n4
n1 -> n5
n1 -> n6
n1 -> n7
n2 -> n8
n3 -> n9
n4 -> n10
n5 -> n11
n6 -> n12
n7 -> n13
```

| Yêu cầu | Mô tả | Tại sao cần |
|----------|--------|-------------|
| **API Backward Compatibility** | API version mới vẫn hỗ trợ client cũ | Consumer không buộc phải update cùng lúc |
| **Database per Service** | Mỗi service có DB riêng, migration riêng | Thay đổi schema không ảnh hưởng service khác |
| **Separate CI/CD** | Mỗi service có pipeline build/test/deploy riêng | Deploy không cần chờ service khác |
| **Contract Testing** | Test đảm bảo API contract không bị phá vỡ | Phát hiện breaking change trước khi deploy |
| **Feature Flags** | Bật/tắt feature mà không cần re-deploy | Deploy code anytime, enable khi sẵn sàng |
| **Independent Config** | Config riêng cho từng service và environment | Thay đổi config không ảnh hưởng service khác |

### 3.3. Backward Compatibility — Tương thích ngược

Đây là **yêu cầu quan trọng nhất** cho Independent Deployment. Khi bạn thay đổi API, phải đảm bảo **consumer cũ vẫn hoạt động**.

#### Expand and Contract Pattern (Parallel Change)

Thay vì thay đổi API một lần (breaking), chia thành **3 giai đoạn**:

```
Phase 1: EXPAND — Thêm API mới, giữ API cũ
─────────────────────────────────────────────
  Provider API:
    GET /api/v1/users/{id}          ← cũ (vẫn hoạt động)
    GET /api/v2/users/{id}          ← mới (thêm vào)
  
  Consumers: vẫn dùng v1, bắt đầu migrate sang v2

Phase 2: MIGRATE — Consumers chuyển sang API mới
─────────────────────────────────────────────
  Consumer A: đã dùng v2  ✅
  Consumer B: đã dùng v2  ✅
  Consumer C: đang migrate... ⏳

Phase 3: CONTRACT — Xóa API cũ khi tất cả đã migrate
─────────────────────────────────────────────
  Provider API:
    GET /api/v1/users/{id}          ← XÓA ❌
    GET /api/v2/users/{id}          ← giữ lại ✅
  
  Consumers: tất cả đã dùng v2
```

```d2 title="Expand and Contract Pattern (Parallel Change)"
shape: sequence_diagram
"P": "Provider"
"C1": "Consumer 1"
"C2": "Consumer 2"
"P".note1: "Phase 1: EXPAND"
"P" -> "P": "Thêm API v2 (giữ v1)"
"C1" -> "P": "GET /api/v1/users/1 (vẫn OK)"
"C2" -> "P": "GET /api/v1/users/1 (vẫn OK)"
"P".note2: "Phase 2: MIGRATE"
"C1" -> "P": "GET /api/v2/users/1 (migrate xong ✅)"
"C2" -> "P": "GET /api/v1/users/1 (chưa migrate)"
"C2" -> "P": "GET /api/v2/users/1 (migrate xong ✅)"
"P".note3: "Phase 3: CONTRACT"
"P" -> "P": "Xóa API v1"
"C1" -> "P": "GET /api/v2/users/1 ✅"
"C2" -> "P": "GET /api/v2/users/1 ✅"
```

#### Tolerant Reader Pattern

Consumer chỉ đọc **các field mình cần**, bỏ qua field không biết:

```
# API Response thêm field mới:
{
  "id": 123,
  "name": "John",
  "email": "john@example.com",
  "phone": "+84123456789"         ← field mới được thêm
}

# Consumer cũ (Tolerant Reader):
# Chỉ đọc id, name, email → bỏ qua phone → KHÔNG LỖI ✅

# Consumer cứng nhắc (Strict Reader):
# Thấy field lạ "phone" → throw exception → LỖI ❌
```

#### Khi nào giữ version cũ, khi nào không?

Expand & Contract hoạt động tốt khi API **chỉ thêm field** hoặc **đổi format response**. Nhưng nếu **logic nghiệp vụ thay đổi**, giữ version cũ có thể gây **sai logic**:

```
Ví dụ: API Create Order thay đổi logic

Version cũ (v1):
  POST /api/v1/orders
  Body: { "productId": 1, "quantity": 2 }
  Logic: Tạo đơn → trừ kho ngay lập tức

Version mới (v2):
  POST /api/v2/orders
  Body: { "productId": 1, "quantity": 2, "warehouseId": "HN-01" }
  Logic: Tạo đơn → kiểm kho theo warehouse → reserve → xác nhận sau

❌ Vấn đề: Nếu giữ v1, logic "trừ kho ngay" đã bị xóa ở tầng DB/domain
   → v1 chạy sai hoặc phải duplicate logic cũ → maintenance nightmare
```

**Quy tắc phân loại:**

| Loại thay đổi | Giữ version cũ? | Lý do | Ví dụ |
|----------------|:---:|--------|-------|
| **Thêm field mới** (optional) | ✅ Có | Consumer cũ gửi thiếu field → dùng default value | Thêm `phone` vào User, default = null |
| **Đổi format response** | ✅ Có | Adapter layer chuyển đổi format dễ dàng | `fullName` → tách thành `firstName` + `lastName` |
| **Thêm field bắt buộc** | ⚠️ Tùy | v1 handler tự fill default value nếu hợp lý | Thêm `warehouseId`, v1 tự fill warehouse mặc định |
| **Thay đổi business logic** | ❌ Không | Logic cũ không còn đúng, giữ lại gây inconsistency | Đổi flow thanh toán từ sync → async |
| **Thay đổi validation rules** | ❌ Không | Rule cũ cho phép data sai lọt vào | Trước cho phép `quantity = 0`, giờ bắt buộc `>= 1` |
| **Thay đổi data model** | ❌ Không | Schema mới không tương thích, v1 ghi data sai | Tách `address` string thành object có `city`, `district` |

**Khi KHÔNG giữ version cũ → dùng Breaking Change Strategy:**

```
┌──────────────────────────────────────────────────────────┐
│         BREAKING CHANGE — FORCED MIGRATION               │
│                                                          │
│  1. Thông báo trước (deprecation notice)                 │
│     • Gửi email / Slack cho tất cả consumer teams        │
│     • Ghi rõ deadline migrate                            │
│     • Cung cấp migration guide                           │
│                                                          │
│  2. Sunset period (2–4 tuần)                             │
│     • v1 vẫn chạy nhưng trả thêm header:                 │
│       Deprecation: true                                  │
│       Sunset: Sat, 01 Mar 2025 00:00:00 GMT              │
│     • Log tất cả request vào v1 để track ai chưa migrate │
│                                                          │
│  3. Force migrate                                        │
│     • Tắt v1 → trả 410 Gone                              │
│     • Hoặc: v1 tự redirect/proxy sang v2                 │
│       (nếu có thể map request)                           │
└──────────────────────────────────────────────────────────┘
```

```d2 title="Khi nào giữ version cũ, khi nào không?"
direction: down
n1: "API cần thay đổi"
n2: "Logic nghiệp vụ\ncó thay đổi?" {
  shape: diamond
}
n3: "Có thể giữ\nbackward compatible?" {
  shape: diamond
}
n4: "✅ Expand & Contract\nGiữ v1, thêm v2"
n5: "⚠️ Breaking change\nnhưng impact nhỏ"
n6: "Version cũ chạy\nlogic cũ có gây\nsai data không?" {
  shape: diamond
}
n7: "✅ Giữ v1 với logic cũ\nDeprecate dần"
n8: "❌ KHÔNG giữ v1\nForced migration"
n9: "Thông báo trước 2-4 tuần\nSunset header\nMigration guide"
n1 -> n2
n2 -> n3: "Không"
n3 -> n4: "Có"
n3 -> n5: "Không"
n2 -> n6: "Có"
n6 -> n7: "Không"
n6 -> n8: "Có"
n8 -> n9
```

> **Nguyên tắc vàng**: Nếu giữ version cũ mà có thể gây **data inconsistency** hoặc **sai logic nghiệp vụ** → **bắt buộc breaking change**. Đừng giữ API cũ chỉ vì sợ phá consumer — data sai còn nguy hiểm hơn API bị break.

### 3.4. Consumer-Driven Contract Testing

**Vấn đề**: Làm sao biết khi thay đổi API có phá vỡ consumer nào không?

**Giải pháp**: Mỗi consumer định nghĩa **contract** (hợp đồng) mô tả những gì nó cần từ provider. Provider chạy test với **tất cả contracts** trước khi deploy.

```d2 title="3.4. Consumer-Driven Contract Testing"
direction: right
order: "Order consumer contract\nGET /products/{id}: id, name, price"
search: "Search consumer contract\nGET /products/{id}: id, name, category"
product: "Product Provider CI\nUnit tests → Verify tất cả consumer contracts → Deploy"
order -> product
search -> product
```

Tools: Pact, Spring Cloud Contract, Dredd.

### 3.5. Ví dụ thực tế — Deploy Pipeline

```d2 title="Independent Deployment Pipeline"
direction: right
push: Developer push code
ci: "CI Pipeline\n1. Lint & Format\n2. Unit Tests — logic nội bộ\n3. Integration Tests — DB/MQ riêng\n4. Contract Tests — bảo vệ consumer\n5. Security Scan\n6. Build Image"
staging: "Staging Deploy\nDeploy → Smoke Tests\n→ Performance Tests"
prod: "Production Deploy\nCanary 5% → Monitor 15min\nExpand 25% → Monitor 15min\nFull rollout → Health check"
push -> ci -> staging -> prod
```

Tổng thời gian minh họa: khoảng 30–45 phút, không phải chờ team khác.

---

## 4. Independent Scalability — Mở rộng độc lập

### 4.1. Tại sao cần scale riêng từng service?

Trong một hệ thống, **không phải mọi service đều cần cùng lượng tài nguyên**. Ví dụ trong hệ thống e-commerce:

```
┌──────────────────────────────────────────────────────────┐
│              RESOURCE DEMAND KHÁC NHAU                   │
│                                                          │
│  Catalog Service:                                        │
│  ████████████████████████████████████ 90% READ           │
│  ██ 10% WRITE                                            │
│  → Cần nhiều RAM (cache), CPU thấp                       │
│  → Scale: 10 instances                                   │
│                                                          │
│  Payment Service:                                        │
│  ██████ 30% READ                                         │
│  ██████████████ 70% WRITE                                │
│  → Cần CPU cao (encryption), IO cao                      │
│  → Scale: 3 instances                                    │
│                                                          │
│  Image Processing Service:                               │
│  ████████████████████████████████████████ 100% COMPUTE   │
│  → Cần GPU hoặc CPU rất cao                              │
│  → Scale: 5 instances (burst khi upload)                 │
│                                                          │
│  Notification Service:                                   │
│  ████████████████████ BURSTY (spikes)                    │
│  → Scale from 2 → 20 instances vào giờ cao điểm          │
└──────────────────────────────────────────────────────────┘
```

Nếu là **monolith**, bạn phải scale **toàn bộ ứng dụng** — lãng phí tài nguyên. Với microservice, bạn chỉ scale **service nào cần thiết**.

### 4.2. Horizontal vs Vertical Scaling

```d2 title="4.2. Horizontal vs Vertical Scaling"
direction: down
vertical: Scale Up {
 server: "Một BIG SERVER\n32 CPU • 128GB RAM • 2TB SSD"
}
horizontal: Scale Out {
 lb: Load Balancer
 a: Service Copy 1 — 4 CPU / 8GB
 b: Service Copy 2 — 4 CPU / 8GB
 c: Service Copy 3 — 4 CPU / 8GB
 lb -> a
 lb -> b
 lb -> c
}
```

Scale Up đơn giản, ít đổi code nhưng có giới hạn máy, single point of failure và chi phí tăng. Scale Out có thể chịu lỗi replica và linh hoạt chi phí, nhưng cần stateless/session design, LB và vận hành phức tạp; vẫn bị giới hạn tài nguyên, data và downstream.

**Trong Microservice**: Luôn ưu tiên **Horizontal Scaling** vì tận dụng được fault tolerance và cost efficiency.

### 4.3. Scaling Patterns

#### 4.3.1. Auto-scaling dựa trên Metrics

```d2 title="4.3.1. Auto-scaling dựa trên Metrics"
direction: right
n1: "Auto-scaling Flow" {}
n1.n2: "Metrics\nCPU/Memory/RPS"
n1.n3: "Auto-scaler\nHPA / KEDA"
n1.n4: "Service\nReplica 1"
n1.n5: "Service\nReplica 2"
n1.n6: "Service\nReplica 3"
n1.n2 -> n1.n3: "threshold"
n1.n3 -> n1.n4: "scale up"
n1.n3 -> n1.n5: "scale up"
n1.n3 -> n1.n6: "scale up"
n1.n3 -> n1.n5: "scale down\nkhi load giảm"
```

| Metric | Scale Up khi | Scale Down khi | Phù hợp với |
|--------|-------------|----------------|-------------|
| **CPU** | > 70% | < 30% | CPU-intensive services |
| **Memory** | > 80% | < 40% | Cache-heavy services |
| **Request/sec** | > 1000 RPS | < 200 RPS | API services |
| **Queue depth** | > 100 messages | < 10 messages | Worker/consumer services |
| **Custom** | Business metric | Business metric | Domain-specific |

#### 4.3.2. Predictive Scaling

Scale **trước khi** traffic tăng, dựa trên pattern lịch sử:

```
Traffic Pattern hàng ngày:
    ▲
    │            ┌─────┐
    │      ┌─────┤     │
    │  ┌───┤     │     ├────┐
    │──┤   │     │     │    ├──
    │  │   │     │     │    │
    └──┴───┴─────┴─────┴────┴──► Giờ
    0  6   9    12    18   22  24

Predictive scaling: Biết traffic tăng lúc 9h
→ Scale up lúc 8:30 (trước 30 phút)
→ Không bị slow khi traffic spike
```

### 4.4. Ví dụ thực tế — E-Commerce Black Friday

```
Normal Day:
┌─────────────────────────────────────────┐
│  Catalog Service      : 3 instances     │
│  Order Service        : 2 instances     │
│  Payment Service      : 2 instances     │
│  Notification Service : 1 instance      │
│  Search Service       : 2 instances     │
│                                         │
│  Total: 10 instances                    │
│  Cost: $500/ngày                        │
└─────────────────────────────────────────┘

Black Friday:
┌─────────────────────────────────────────┐
│  Catalog Service      : 20 instances ⬆️ │  ← Nhiều người browse
│  Order Service        : 15 instances ⬆️ │  ← Nhiều đơn hàng
│  Payment Service      : 10 instances ⬆️ │  ← Nhiều thanh toán
│  Notification Service : 8 instances  ⬆️ │  ← Nhiều email
│  Search Service       : 15 instances ⬆️ │  ← Nhiều tìm kiếm
│                                         │
│  Total: 68 instances                    │
│  Cost: $3,400/ngày                      │
│                                         │
│  Nếu là monolith:                       │
│  → Scale toàn bộ: 68 × full app         │
│  → Cost: $10,000+/ngày 💸               │
└─────────────────────────────────────────┘

Tiết kiệm: ~65% chi phí so với monolith scaling
```

---

## 5. Technology Independence — Độc lập công nghệ

### 5.1. Polyglot Architecture

Mỗi service có thể chọn **ngôn ngữ lập trình** và **framework** phù hợp nhất với bài toán của nó.

```d2 title="5.1. Polyglot Architecture"
direction: right
polyglot: Polyglot Architecture {
 user: "User — Java / Spring Boot\nEcosystem • Team experience • Enterprise patterns"
 ml: "ML/Recommendation — Python / FastAPI\nscikit-learn • PyTorch • Rapid prototyping"
 chat: "Real-time Chat — Go / Goroutines\nConcurrency • Low latency • Low memory"
 admin: "Admin Dashboard — Node.js / Next.js\nFull-stack • Rapid dev • SSR"
 pipeline: "Data Pipeline — Scala / Spark\nBig data • Streaming"
 payment: "Payment — Kotlin / Spring Boot\nType safety • Coroutines • Java interop"
}
```

### 5.2. Polyglot Persistence

Tương tự, mỗi service chọn **loại database** phù hợp nhất:

| Service | Database | Lý do chọn |
|---------|----------|------------|
| User Service | **PostgreSQL** | Relational data, ACID transactions, complex queries |
| Product Catalog | **MongoDB** | Flexible schema, nested documents (variants, attributes) |
| Shopping Cart | **Redis** | In-memory, fast read/write, TTL (session expiry) |
| Search Service | **Elasticsearch** | Full-text search, faceted search, relevance scoring |
| Analytics | **ClickHouse** | Column-oriented, aggregate queries, time-series data |
| Social Graph | **Neo4j** | Graph relationships (friends, followers, recommendations) |
| File Storage | **S3** | Binary objects, CDN integration, cost-effective |
| Event Store | **Apache Kafka** | Event streaming, high throughput, replay capability |

```d2 title="5.2. Polyglot Persistence"
direction: down
n1: "Polyglot Persistence" {}
n1.n2: "User Service"
n1.n3: "PostgreSQL" {
  shape: cylinder
  style.fill: "#336791"
  style.font-color: "#fff"
}
n1.n4: "Catalog Service"
n1.n5: "MongoDB" {
  shape: cylinder
  style.fill: "#4DB33D"
  style.font-color: "#fff"
}
n1.n6: "Cart Service"
n1.n7: "Redis" {
  shape: cylinder
  style.fill: "#DC382D"
  style.font-color: "#fff"
}
n1.n8: "Search Service"
n1.n9: "Elasticsearch" {
  shape: cylinder
  style.fill: "#F0BF1A"
  style.font-color: "#000"
}
n1.n10: "Analytics Service"
n1.n11: "ClickHouse" {
  shape: cylinder
  style.fill: "#FFCC00"
  style.font-color: "#000"
}
n1.n2 -> n1.n3
n1.n4 -> n1.n5
n1.n6 -> n1.n7
n1.n8 -> n1.n9
n1.n10 -> n1.n11
```

### 5.3. Khi nào nên / không nên đa công nghệ

#### ✅ NÊN đa công nghệ khi:

```
• Bài toán khác nhau rõ ràng cần tool khác nhau
  → ML cần Python, real-time cần Go/Rust

• Team đã có expertise với tech đó
  → Không cần training, productive ngay

• Performance requirement đặc biệt
  → Low-latency: Go/Rust. High throughput: Java/Scala

• Tech hiện tại không đáp ứng được
  → Cần graph database nhưng đang dùng toàn SQL
```

#### ❌ KHÔNG NÊN đa công nghệ khi:

```
• "Vì nó cool" hoặc "muốn thử tech mới"
  → Resume-Driven Development ❌

• Team nhỏ (< 20 developers)
  → Overhead quản lý nhiều tech stack quá lớn

• Chưa có DevOps maturity
  → Mỗi tech cần CI/CD, monitoring, security riêng

• Chỉ khác nhau chút ít
  → Java vs Kotlin? Chọn 1 thôi
```

**Quy tắc thực tế**: Bắt đầu với **1–2 tech stack chính**, chỉ thêm khi có **lý do rõ ràng và cụ thể**.

---

## 6. Team Ownership — Sở hữu bởi Team

### 6.1. Conway's Law

> *"Organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations."*  
> — Melvin Conway, 1967

Tức là: **Kiến trúc phần mềm phản ánh cấu trúc tổ chức** của team xây dựng nó.

```d2 title="6.1. Conway's Law"
direction: down
by_layer: "Tổ chức theo layer — feature thường cần 3 team" {
 ft: Frontend Team
 bt: Backend Team
 dba: DBA Team
 fe: Frontend App
 api: Backend API
 db: Database
 ft -> fe
 bt -> api
 dba -> db
}
domains: "Theo domain — feature có thể nằm trong 1 team" {
 ot: Order Team — FE + BE + DB
 pt: Payment Team — FE + BE + DB
 ct: Catalog Team — FE + BE + DB
 os: Order Service
 ps: Payment Service
 cs: Catalog Service
 ot -> os
 pt -> ps
 ct -> cs
}
```

### 6.2. Inverse Conway Maneuver

**Ý tưởng**: Thay vì để tổ chức quyết định kiến trúc (Conway's Law), **thiết kế tổ chức** để ra đúng kiến trúc mong muốn.

```d2 title="6.2. Inverse Conway Maneuver"
direction: right
n2: "Inverse Conway Maneuver (chủ động)" {}
n1: "Conway's Law (tự nhiên)" {}
n1.n3: "Org Structure"
n1.n4: "Architecture"
n2.n5: "Desired Architecture"
n2.n6: "Org Structure"
n2.n7: "Architecture\n= Desired ✅"
n1.n3 -> n1.n4: "produces"
n2.n5 -> n2.n6: "design"
n2.n6 -> n2.n7: "produces"
```

**Ví dụ**: Muốn chuyển từ monolith sang microservice?
1. **Trước**: 1 team lớn → 1 monolith
2. **Inverse Conway**: Tách thành nhiều team nhỏ theo domain → Mỗi team tự nhiên xây 1 service

### 6.3. Mô hình tổ chức team

#### Cross-functional Team (Team đa chức năng)

Mỗi team có **đầy đủ skill** để phát triển, deploy, và vận hành service của mình:

```
┌─────────────────────────────────────────┐
│          ORDER TEAM (5-8 người)         │
│                                         │
│  👩‍💻 Backend Developer (2-3)             │
│  👨‍💻 Frontend Developer (1-2)            │
│  🧪 QA Engineer (1)                     │
│  🔧 DevOps/SRE (0.5-1)                  │
│  📋 Product Owner (1)                   │
│                                         │
│  Owns:                                  │
│  ├── Order Service (code)               │
│  ├── Order Database (schema, data)      │
│  ├── CI/CD Pipeline (deploy)            │
│  ├── Monitoring & Alerting              │
│  └── On-call rotation (production)      │
│                                         │
│  Tự quyết:                              │
│  ├── Tech stack choices                 │
│  ├── Release schedule                   │
│  ├── Internal architecture              │
│  └── Testing strategy                   │
└─────────────────────────────────────────┘
```

#### Platform Team (Team nền tảng)

Hỗ trợ các service team bằng cách cung cấp **shared infrastructure**:

```d2 title="Platform Team (Team nền tảng)"
direction: right
platform: "Platform Team\nKubernetes • CI/CD templates\nPrometheus / Grafana / Jaeger\nIstio / Linkerd • Vault • Backstage"
order: "Order Team"
payment: "Payment Team"
catalog: "Catalog Team"
shipping: "Shipping Team"
platform -> order: "Cung cấp platform services"
platform -> payment: "Cung cấp platform services"
platform -> catalog: "Cung cấp platform services"
platform -> shipping: "Cung cấp platform services"
```

Platform team không sở hữu business logic, service code và business data. Các product teams consume nền tảng, vẫn chịu trách nhiệm end-to-end cho services.

### 6.4. "You Build It, You Run It"

> *"You build it, you run it."*  
> — Werner Vogels, CTO of Amazon

Team chịu trách nhiệm **toàn bộ lifecycle** của service: từ design → develop → test → deploy → monitor → on-call.

```
Traditional Model:                    "You Build It, You Run It":
──────────────────                    ─────────────────────────

Dev Team → Code → "Throw over        Dev Team → Code → Deploy →
the wall" → Ops Team                  Monitor → On-call → Fix

Vấn đề:                              Lợi ích:
• Dev không biết production           • Dev hiểu production
  issues                                reality
• Ops không hiểu business             • Feedback loop ngắn
  logic                               • Quality tăng (phải
• Blame game khi có sự cố              chịu hậu quả ❌ → code
• Slow feedback loop                    tốt hơn ✅)
                                      • Empathy với end user
```

**Thực tế tại Amazon**: Mỗi team (6-8 người) sở hữu 1-2 service, chịu trách nhiệm on-call 24/7. Nếu service chết lúc 3 giờ sáng, chính team đó bị gọi dậy → Động lực viết code robust hơn.

---

## 7. Self-Contained Service

### 7.1. Định nghĩa

Một **Self-Contained Service** là service có thể **hoàn thành tác vụ nghiệp vụ** mà **không cần gọi đồng bộ** đến service khác tại thời điểm xử lý request.

```
Không Self-Contained ❌:
  Request → Order Service → gọi Product Service (sync)
                          → gọi Pricing Service (sync)
                          → gọi Inventory Service (sync)
                          → trả response
  
  Vấn đề: Nếu bất kỳ service nào down → Order Service fail

Self-Contained ✅:
  Request → Order Service → dùng cached product data (local)
                          → dùng cached pricing (local)
                          → dùng cached inventory (local)
                          → trả response
                          → publish event (async) để sync data sau
  
  Lợi ích: Order Service hoạt động ngay cả khi service khác down
```

### 7.2. Các thành phần của Self-Contained Service

```d2 title="Self-contained Service"
direction: down
service: Self-contained Service {
 api: "API Layer\nREST / gRPC / GraphQL endpoints"
 logic: "Business Logic\nDomain models, rules, workflows"
 primary: "Primary Database\nOwn data" {shape: cylinder}
 cache: "Local Cache\nRedis / In-memory\nCached data từ service khác" {shape: cylinder}
 outbox: "Event Store\nOutbox events" {shape: cylinder}
 events: "Event Publisher / Consumer\nPublish & consume từ/tới Event Bus"
 api -> logic
 logic -> primary
 logic -> cache
 logic -> outbox
 outbox -> events
}
```

### 7.3. Data Locality — Sao chép dữ liệu cần thiết

**Vấn đề**: Order Service cần thông tin product (name, price) khi tạo đơn hàng. Nếu gọi Product Service mỗi lần → **temporal coupling**.

**Giải pháp**: Sao chép (replicate) dữ liệu cần thiết vào local database.

```d2 title="7.3. Data Locality — Sao chép dữ liệu cần thiết"
shape: sequence_diagram
"PS": "Product Service"
"EB": "Event Bus"
"OS": "Order Service"
"LC": "Local Cache\n(Order DB)"
"PS".note1: "[Product Service — Local Cache\n(Order DB)]\nPhase 1: Data Sync (Background)"
"PS" -> "EB": "Publish: ProductUpdated\n{id:1, name:\"iPhone\", price:999}"
"EB" -> "OS": "Consume event"
"OS" -> "LC": "Lưu: product_cache\n{id:1, name:\"iPhone\", price:999}"
"PS".note2: "[Product Service — Local Cache\n(Order DB)]\nPhase 2: Handle Request (No sync call!)"
"OS" -> "LC": "Query: product_cache WHERE id=1"
"LC" -> "OS": "{name:\"iPhone\", price:999}" { style.stroke-dash: 5 }
"OS" -> "OS": "Tạo đơn hàng với cached data"
"OS".note3: "✅ Không cần gọi Product Service!"
```

**Trade-off**:

| | Sync Call (gọi trực tiếp) | Data Locality (cache local) |
|---|---|---|
| **Consistency** | ✅ Luôn mới nhất | ⚠️ Có thể stale (eventual) |
| **Availability** | ❌ Phụ thuộc service kia | ✅ Hoạt động độc lập |
| **Latency** | ⚠️ Network call | ✅ Local read (fast) |
| **Complexity** | ✅ Đơn giản | ⚠️ Phải sync data, handle conflict |

**Khi nào dùng**:
- **Sync call**: Dữ liệu phải chính xác real-time (balance tài khoản, inventory count)
- **Data locality**: Dữ liệu ít thay đổi hoặc chấp nhận stale vài giây (product name, customer address)

---

## 8. Fault Isolation — Cô lập lỗi

### 8.1. Tại sao Fault Isolation quan trọng?

Trong hệ thống distributed, lỗi là **chắc chắn sẽ xảy ra** (network failure, service crash, disk full...). Vấn đề không phải "có lỗi không?" mà là **"lỗi có lan ra không?"**.

```d2 title="8.1. Tại sao Fault Isolation quan trọng?"
direction: down
without: Không Fault Isolation {
 a: Service A
 b: Service B — CRASH
 c: Service C
 cascade: A timeout → A crash → Clients timeout → Hệ thống sụp
 a -> b -> c
 b -> cascade
}
with: Có Fault Isolation {
 a: Service A — Circuit Breaker
 b: Service B — CRASH
 c: Service C
 fallback: Cached response / Default value
 a -> b: Call bị giới hạn / fail fast
 b -> c
 a -> fallback: Trả degraded response cho client
}
```

### 8.2. Kỹ thuật Fault Isolation

| Kỹ thuật | Mô tả | Khi nào dùng |
|----------|--------|-------------|
| **Circuit Breaker** | Ngắt kết nối tới service lỗi, tránh gọi liên tục | Sync calls giữa services |
| **Bulkhead** | Cách ly tài nguyên (thread pool, connection pool) cho từng dependency | Khi 1 service chậm có thể hết resource |
| **Timeout** | Giới hạn thời gian chờ response | Mọi external calls |
| **Retry with Backoff** | Thử lại với khoảng cách tăng dần | Transient failures (network blip) |
| **Fallback** | Trả kết quả dự phòng khi service lỗi | Khi có alternative response hợp lý |
| **Async Communication** | Giao tiếp qua message queue, không cần service kia online | Non-critical flows |

```d2 title="Circuit Breaker — chuyển trạng thái"
direction: right
closed: "CLOSED\nNormal flow"
open: "OPEN\nReject all requests"
half: "HALF-OPEN\nTest với số request giới hạn"
closed -> open: Failure threshold reached
open -> half: Timeout
half -> closed: Success
```

> 📖 Chi tiết Circuit Breaker và Resilience patterns → [10-resilience-patterns.md](10-resilience-patterns.md)

### 8.3. Graceful Degradation

Khi một dependency service lỗi, service chính **vẫn hoạt động** nhưng với **chức năng giảm**.

```d2 title="8.3. Graceful Degradation"
direction: right
rec: "Recommendation Service DOWN"
bad: "Không Graceful Degradation\nProduct page trả 500 vì không load recommendations"
good: "Graceful Degradation\nProduct info / Price / Add to cart vẫn OK\nRecommendations dùng popular items cache/default"
rec -> bad: "Thiết kế cũ"
rec -> good: "Thiết kế có fallback"
```

**Ví dụ cụ thể — Fallback strategies**:

| Service lỗi | Fallback | Impact |
|-------------|----------|--------|
| Recommendation Service | Hiển thị "Top sellers" từ cache | Recommendations kém chính xác hơn |
| Review Service | Hiển thị "No reviews yet" | User không thấy reviews |
| Pricing Service | Dùng last known price từ cache | Giá có thể không cập nhật |
| Search Service | Redirect đến category browsing | Không tìm kiếm được, nhưng vẫn browse |
| Payment Gateway A | Chuyển sang Gateway B | Có thể fee khác |

---

## 9. Case Study thực tế

### 9.1. Netflix — Ông tổ Microservice

```
┌─────────────────────────────────────────────────────────────┐
│                    NETFLIX ARCHITECTURE                     │
│                                                             │
│  Số lượng microservices: 700+ (2023)                        │
│  Deploys per day: ~100                                      │
│  Region: Multi-region (US, EU, APAC)                        │
│                                                             │
│  Autonomy practices:                                        │
│  ─────────────────                                          │
│  ✅ Full Ownership: Mỗi team own 2-5 services               │
│  ✅ Freedom & Responsibility: Team tự chọn tech, tự deploy  │
│  ✅ Chaos Engineering: Chaos Monkey tắt service random      │
│     → Buộc service phải fault tolerant                      │
│  ✅ Polyglot: Java (chính), Python, Node.js, Go             │
│  ✅ Polyglot Persistence: Cassandra, MySQL, Redis,          │
│     Elasticsearch, S3                                       │
│                                                             │
│  Tools tự phát triển (sau thành open-source):               │
│  ├── Eureka — Service Discovery                             │
│  ├── Zuul — API Gateway                                     │
│  ├── Hystrix — Circuit Breaker                              │
│  ├── Ribbon — Client-side Load Balancer                     │
│  └── Chaos Monkey — Chaos Engineering                       │
└─────────────────────────────────────────────────────────────┘
```

### 9.2. Spotify — Squad Model

```d2 title="9.2. Spotify — Squad Model"
direction: right
spotify: Spotify Squad Model {
 music: Tribe — Music Player {
  playback: Squad — Playback { player: Player Service; codec: Codec Service }
  queue: Squad — Queue { queue: Queue Service; shuffle: Shuffle Service }
 }
 search: Tribe — Search { core: Squad — Search Core; ux: Squad — Search UX }
}
```

Tribe gom squads cùng domain; Squad 6–12 người cross-functional; Chapter gom specialization xuyên squads; Guild là cộng đồng quan tâm tự nguyện. Squad có Product Owner, quyết định what/how, own service end-to-end, release độc lập. Đây là mô hình minh họa, không phải công thức tổ chức phải sao chép nguyên xi.

### 9.3. Amazon — Two-Pizza Team

```
┌─────────────────────────────────────────────────────────────┐
│                AMAZON — TWO-PIZZA TEAM                      │
│                                                             │
│  Rule: Mỗi team đủ nhỏ để nuôi bằng 2 pizza (~6-8 người)    │
│                                                             │
│  Nguyên tắc:                                                │
│  ───────────                                                │
│  1. Mỗi team = 1 service (hoặc vài service liên quan)       │
│  2. Team own toàn bộ: code + data + deploy + operations     │
│  3. Giao tiếp giữa teams qua API (bắt buộc bởi Jeff Bezos,  │
│     2002 — "API Mandate")                                   │
│  4. Không shared DB, không internal interface               │
│  5. API phải designed để có thể expose ra ngoài (AWS!)      │
│                                                             │
│  Jeff Bezos API Mandate (2002):                             │
│  ──────────────────────────                                 │
│  "Từ hôm nay, tất cả teams phải expose data và              │
│   functionality qua service interfaces.                     │
│   Không được giao tiếp bằng cách khác: không shared         │
│   memory, không direct database access.                     │
│   Ai không tuân thủ sẽ bị sa thải."                         │
│                                                             │
│  Kết quả:                                                   │
│  • Amazon chuyển sang microservice thành công               │
│  • Internal services → Amazon Web Services (AWS)            │
│  • SQS, S3, EC2 đều là internal service được expose         │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Anti-patterns

| Anti-pattern | Mô tả | Triệu chứng | Cách fix |
|-------------|--------|-------------|----------|
| **Distributed Monolith** | Tách service nhưng vẫn deploy cùng nhau, share DB | Deploy 1 service = deploy 3 service | Tách DB, async communication, contract testing |
| **Shared Library Coupling** | Chia sẻ library chứa business logic | Update shared lib = deploy lại tất cả service dùng nó | Chỉ share utility (logging, tracing), không share domain logic |
| **Integration Database** | Nhiều service đọc/ghi cùng 1 database | Schema change → nhiều service lỗi | Database per service, API để truy cập data |
| **Orchestration Over-reliance** | 1 service trung tâm điều khiển tất cả service khác | "God orchestrator" là single point of failure | Dùng choreography (event-driven) thay orchestration khi có thể |
| **Resume-Driven Development** | Chọn tech vì "muốn thử" chứ không phải vì nhu cầu | Quá nhiều tech stack, không ai maintain được | Giới hạn 2-3 tech stack chính, cần justify rõ ràng |
| **Team Coupling** | Team phải sync meeting, code review chéo, shared backlog | Slow release, nhiều meeting, cross-team dependencies | Cross-functional team, clear API boundary |

---

## 11. Checklist đánh giá Autonomy

### Deployment Independence

```
□ Service có CI/CD pipeline riêng
□ Service có thể deploy mà không cần deploy service khác
□ Service có thể rollback mà không cần rollback service khác
□ API changes backward compatible
□ Database migration chạy độc lập
□ Configuration quản lý riêng (không shared config file)
□ Feature flags được sử dụng cho big changes
```

### Scalability Independence

```
□ Service có thể scale horizontal (stateless)
□ Auto-scaling dựa trên metrics riêng
□ Database có thể scale riêng (read replicas, sharding)
□ Không bottleneck bởi shared resource (shared DB, shared cache)
□ Load testing được thực hiện riêng cho từng service
```

### Technology Independence

```
□ Service có thể chọn tech stack riêng (nếu có lý do)
□ Service không phụ thuộc shared library chứa business logic
□ Database type phù hợp với use case (SQL vs NoSQL vs Graph)
□ Service communicate qua standard protocols (HTTP/gRPC/AMQP)
```

### Team Independence

```
□ Team có đầy đủ skill (FE, BE, QA, DevOps)
□ Team own toàn bộ lifecycle (build, deploy, monitor, on-call)
□ Team có Product Owner riêng
□ Team tự quyết release schedule (không shared deploy window)
□ Team size: 3-8 người (Two-Pizza Team)
□ Cross-team communication qua API contract, không qua code review chéo
```

### Fault Isolation

```
□ Service failure không cascade sang service khác
□ Circuit Breaker cho tất cả sync external calls
□ Timeout cho tất cả external calls
□ Graceful degradation khi dependency down
□ Chaos testing được thực hiện định kỳ
□ Health check endpoint được implement
□ Service có thể hoạt động (degraded) khi các dependency offline
```

---

## 12. Tổng kết

```
┌─────────────────────────────────────────────────────────────┐
│                        TÓM TẮT                              │
│                                                             │
│  SERVICE AUTONOMY = Khả năng hoạt động ĐỘC LẬP              │
│                                                             │
│  6 Chiều của Independence:                                  │
│  ════════════════════════                                   │
│  1. Deploy    → CI/CD riêng, rollback riêng                 │
│  2. Scale     → Auto-scale theo metrics riêng               │
│  3. Technology → Chọn tech phù hợp bài toán                 │
│  4. Data      → Database per Service                        │
│  5. Team      → Cross-functional, "You Build It, You Run It"│
│  6. Fault     → Fault isolation, graceful degradation       │
│                                                             │
│  Key Enablers:                                              │
│  ═════════════                                              │
│  • Backward Compatible API (Expand & Contract)              │
│  • Event-Driven Communication (Async)                       │
│  • Consumer-Driven Contract Testing                         │
│  • Self-Contained Service (Data Locality)                   │
│  • Conway's Law / Inverse Conway Maneuver                   │
│                                                             │
│  Real-world:                                                │
│  ═══════════                                                │
│  • Netflix: 700+ services, ~100 deploys/day                 │
│  • Spotify: Squad Model (autonomous mini-startups)          │
│  • Amazon: Two-Pizza Team + API Mandate → AWS               │
│                                                             │
│  NGUYÊN TẮC VÀNG:                                           │
│  "Mỗi service là một sản phẩm nhỏ,                          │
│   được sở hữu bởi một team nhỏ,                             │
│   có thể sống và chết độc lập."                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. Liên kết liên quan

- ⬅️ [03 - Loose Coupling & High Cohesion](03-loose-coupling-high-cohesion.md) — Nguyên tắc giảm phụ thuộc giữa services
- ➡️ [05 - Decomposition Strategies](05-decomposition-strategies.md) — Chiến lược tách monolith thành microservices
- 📖 [06 - Inter-Service Communication](06-inter-service-communication.md) — REST, gRPC, Event-Driven communication
- 📖 [08 - Service Discovery](08-service-discovery.md) — Cách services tìm thấy nhau
- 📖 [09 - Data Management](09-data-management.md) — Database per Service, Saga, CQRS
- 📖 [10 - Resilience Patterns](10-resilience-patterns.md) — Circuit Breaker, Retry, Bulkhead
- 📖 [14 - CI/CD & Deployment](14-cicd-deployment.md) — Pipeline, Blue-Green, Canary deployment
