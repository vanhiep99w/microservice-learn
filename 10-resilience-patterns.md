# Resilience Patterns — Các mẫu thiết kế chịu lỗi trong Microservice

## 📋 Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
  - [1.1. Tại sao Resilience quan trọng?](#11-tại-sao-resilience-quan-trọng)
  - [1.2. Các loại lỗi trong hệ thống phân tán](#12-các-loại-lỗi-trong-hệ-thống-phân-tán)
  - [1.3. Tổng quan các Resilience Patterns](#13-tổng-quan-các-resilience-patterns)
- [2. Timeout](#2-timeout)
  - [2.1. Tại sao cần Timeout?](#21-tại-sao-cần-timeout)
  - [2.2. Các loại Timeout](#22-các-loại-timeout)
  - [2.3. Cách chọn giá trị Timeout](#23-cách-chọn-giá-trị-timeout)
  - [2.4. Ví dụ thực tế](#24-ví-dụ-thực-tế)
- [3. Retry Pattern](#3-retry-pattern)
  - [3.1. Khi nào nên Retry?](#31-khi-nào-nên-retry)
  - [3.2. Các chiến lược Retry](#32-các-chiến-lược-retry)
  - [3.3. Exponential Backoff với Jitter](#33-exponential-backoff-với-jitter)
  - [3.4. Idempotency — Điều kiện tiên quyết](#34-idempotency--điều-kiện-tiên-quyết)
  - [3.5. Retry Storm — Khi Retry trở thành vấn đề](#35-retry-storm--khi-retry-trở-thành-vấn-đề)
- [4. Circuit Breaker](#4-circuit-breaker)
  - [4.1. Bài toán thực tế](#41-bài-toán-thực-tế)
  - [4.2. Circuit Breaker là gì?](#42-circuit-breaker-là-gì)
  - [4.3. Ba trạng thái của Circuit Breaker](#43-ba-trạng-thái-của-circuit-breaker)
  - [4.4. Cấu hình Circuit Breaker](#44-cấu-hình-circuit-breaker)
  - [4.5. Ví dụ thực tế — Payment Service gọi Bank API](#45-ví-dụ-thực-tế--payment-service-gọi-bank-api)
  - [4.6. Circuit Breaker + Retry — Kết hợp](#46-circuit-breaker--retry--kết-hợp)
  - [4.7. Các thư viện phổ biến](#47-các-thư-viện-phổ-biến)
- [5. Bulkhead Pattern](#5-bulkhead-pattern)
  - [5.1. Ý tưởng từ đóng tàu](#51-ý-tưởng-từ-đóng-tàu)
  - [5.2. Bulkhead trong Microservice](#52-bulkhead-trong-microservice)
  - [5.3. Các loại Bulkhead](#53-các-loại-bulkhead)
  - [5.4. Ví dụ thực tế — E-Commerce Service](#54-ví-dụ-thực-tế--e-commerce-service)
  - [5.5. Bulkhead + Circuit Breaker](#55-bulkhead--circuit-breaker)
- [6. Rate Limiter](#6-rate-limiter)
  - [6.1. Tại sao cần Rate Limiting?](#61-tại-sao-cần-rate-limiting)
  - [6.2. Các thuật toán Rate Limiting](#62-các-thuật-toán-rate-limiting)
  - [6.3. Rate Limiting ở đâu?](#63-rate-limiting-ở-đâu)
  - [6.4. Ví dụ thực tế — Public API](#64-ví-dụ-thực-tế--public-api)
- [7. Fallback Pattern](#7-fallback-pattern)
  - [7.1. Fallback là gì?](#71-fallback-là-gì)
  - [7.2. Các chiến lược Fallback](#72-các-chiến-lược-fallback)
  - [7.3. Ví dụ thực tế — Recommendation Service](#73-ví-dụ-thực-tế--recommendation-service)
  - [7.4. Graceful Degradation vs Fail Fast](#74-graceful-degradation-vs-fail-fast)
- [8. Các Pattern bổ trợ](#8-các-pattern-bổ-trợ)
  - [8.1. Health Check](#81-health-check)
  - [8.2. Deadlines / Distributed Timeout](#82-deadlines--distributed-timeout)
  - [8.3. Load Shedding](#83-load-shedding)
  - [8.4. Chaos Engineering](#84-chaos-engineering)
- [9. Kết hợp các Pattern — Defense in Depth](#9-kết-hợp-các-pattern--defense-in-depth)
  - [9.1. Thứ tự áp dụng](#91-thứ-tự-áp-dụng)
  - [9.2. Ví dụ tổng hợp — Order Service](#92-ví-dụ-tổng-hợp--order-service)
- [10. Anti-patterns](#10-anti-patterns)
- [11. Tổng kết](#11-tổng-kết)
- [12. Liên kết liên quan](#12-liên-kết-liên-quan)

---

## 1. Giới thiệu

Trong các doc trước, chúng ta đã tìm hiểu cách **giao tiếp giữa các service** ([doc 06](06-inter-service-communication.md)), thiết kế **API Gateway** ([doc 07](07-api-gateway.md)), và **quản lý data** ([doc 09](09-data-management.md)). Nhưng trong hệ thống phân tán, **lỗi là điều chắc chắn sẽ xảy ra** — không phải "nếu" mà là "khi nào".

> **"Everything fails, all the time."** — Werner Vogels, CTO Amazon

Resilience (khả năng chịu lỗi) là khả năng hệ thống **tiếp tục hoạt động** (có thể ở mức giảm chất lượng) khi một phần của hệ thống gặp sự cố.

### 1.1. Tại sao Resilience quan trọng?

Trong monolith, khi ứng dụng lỗi → toàn bộ hệ thống dừng. Trong microservice, vấn đề **phức tạp hơn nhiều**:

```d2 title="1.1. Tại sao Resilience quan trọng?"
direction: down
user: "User"
gw: "API Gateway"
order: "Order Service"
payment: "Payment DOWN"
wait: "Order call chờ / Thread pool cạn"
orderdown: "Order DOWN"
gwdown: "Gateway DOWN"
outage: "Toàn bộ hệ thống gián đoạn"
user -> gw
gw -> order
order -> payment
payment -> wait
wait -> orderdown
orderdown -> gwdown
gwdown -> outage
```

Một **Payment Service** lỗi có thể kéo theo **toàn bộ hệ thống** sập — đây gọi là **Cascading Failure** (lỗi lan truyền dây chuyền).

| Đặc điểm | Monolith | Microservice |
|-----------|----------|--------------|
| Điểm lỗi | Ít, nhưng mỗi lỗi ảnh hưởng toàn bộ | Nhiều, nhưng có thể cô lập |
| Giao tiếp | In-process (nhanh, tin cậy) | Network (chậm, không tin cậy) |
| Cascading Failure | Ít xảy ra | Rất dễ xảy ra |
| Partial Failure | Không hỗ trợ | Có thể thiết kế |

### 1.2. Các loại lỗi trong hệ thống phân tán

| Loại lỗi | Mô tả | Ví dụ |
|-----------|--------|-------|
| **Transient** (tạm thời) | Lỗi xảy ra trong thời gian ngắn, tự khôi phục | Network timeout, DNS lookup fail, connection reset |
| **Intermittent** (gián đoạn) | Lỗi xuất hiện rồi biến mất không theo quy luật | Flaky connection, memory pressure |
| **Permanent** (vĩnh viễn) | Lỗi không tự khôi phục, cần can thiệp | Service crash, disk full, bug trong code |

```d2 title="1.2. Các loại lỗi trong hệ thống phân tán"
direction: right
n3: "Permanent" {}
n2: "Intermittent" {}
n1: "Transient" {}
n1.n4: "Network blip" {
  style.fill: "#2d5016"
  style.stroke: "#4ade80"
  style.font-color: "#bbf7d0"
}
n1.n5: "Tự khôi phục" {
  style.fill: "#2d5016"
  style.stroke: "#4ade80"
  style.font-color: "#bbf7d0"
}
n2.n6: "Lỗi ngẫu nhiên" {
  style.fill: "#713f12"
  style.stroke: "#facc15"
  style.font-color: "#fef9c3"
}
n2.n7: "Khó dự đoán" {
  style.fill: "#713f12"
  style.stroke: "#facc15"
  style.font-color: "#fef9c3"
}
n3.n8: "Service crash" {
  style.fill: "#7f1d1d"
  style.stroke: "#f87171"
  style.font-color: "#fecaca"
}
n3.n9: "Cần can thiệp" {
  style.fill: "#7f1d1d"
  style.stroke: "#f87171"
  style.font-color: "#fecaca"
}
n1.n4 -> n1.n5
n2.n6 -> n2.n7
n3.n8 -> n3.n9
```

**Quan trọng**: Resilience Pattern phù hợp phụ thuộc vào **loại lỗi**:
- **Transient** → Retry có hiệu quả
- **Intermittent** → Circuit Breaker phát hiện tốt
- **Permanent** → Fallback + alerting

### 1.3. Tổng quan các Resilience Patterns

```d2 title="1.3. Tổng quan các Resilience Patterns"
direction: right
patterns: Resilience Patterns {
 timeout: "Timeout — Giới hạn chờ"
 retry: "Retry — Lỗi tạm thời"
 cb: "Circuit Breaker — Ngắt khi lỗi liên tục"
 bulkhead: "Bulkhead — Cô lập tài nguyên"
 limiter: "Rate Limiter — Giới hạn tần suất"
 fallback: "Fallback — Phương án dự phòng"
}
```

---

## 2. Timeout

Timeout là pattern đơn giản nhất nhưng **quan trọng nhất** — nó là nền tảng cho tất cả các pattern khác.

### 2.1. Tại sao cần Timeout?

Không có Timeout, một request có thể **chờ vô hạn** khi service đích không phản hồi:

```d2 title="2.1. Tại sao cần Timeout?"
direction: down
without: Không Timeout {
 client: Client
 a: Service A
 b: Service B — treo
 exhausted: Chờ 5–10 phút → giữ threads / connections → pool cạn
 client -> a -> b
 a -> exhausted
}
with: Timeout 3 giây {
 client: Client
 a: Service A
 b: Service B — treo
 fallback: Timeout → Lỗi / Fallback → giải phóng tài nguyên
 client -> a -> b
 a -> fallback: Sau 3 giây
}
```

Timeout của caller không tự bảo đảm dependency dừng work; cần cancellation/deadline propagation nếu protocol hỗ trợ.

### 2.2. Các loại Timeout

| Loại | Mô tả | Giá trị thường dùng |
|------|--------|---------------------|
| **Connection Timeout** | Thời gian tối đa để thiết lập kết nối TCP | 1-5 giây |
| **Read/Response Timeout** | Thời gian tối đa chờ phản hồi sau khi kết nối | 3-30 giây |
| **Idle Timeout** | Thời gian tối đa kết nối không hoạt động trước khi bị đóng | 30-300 giây |
| **Overall/Request Timeout** | Tổng thời gian tối đa cho toàn bộ request (bao gồm retry) | Tùy nghiệp vụ |

```d2 title="2.2. Các loại Timeout"
shape: sequence_diagram
"C": "Client"
"S": "Server"
"C".note1: "[Client — Server]\nConnection Timeout (1-5s)"
"C" -> "S": "SYN"
"S" -> "C": "SYN-ACK" { style.stroke-dash: 5 }
"C" -> "S": "ACK"
"C".note2: "[Client — Server]\nRead Timeout (3-30s)"
"C" -> "S": "HTTP Request"
"S" -> "C": "HTTP Response" { style.stroke-dash: 5 }
"C".note3: "[Client — Server]\nIdle Timeout (30-300s)"
"C".note4: "[Client — Server]\nKhông có traffic..."
"C" -> "S": "Connection đóng" { target-arrowhead.shape: cross }
# Icons: https://icons.d2lang.com/
S.icon: "https://icons.d2lang.com/tech/022-server.svg"
```

### 2.3. Cách chọn giá trị Timeout

#### Percentile (Phân vị) là gì?

Khi service xử lý nhiều request, mỗi request mất thời gian khác nhau. **Percentile** giúp hiểu phân bố thời gian phản hồi:

- **P50** (median): 50% requests nhanh hơn giá trị này
- **P95**: 95% requests nhanh hơn, chỉ 5% chậm hơn
- **P99**: 99% requests nhanh hơn, chỉ 1% chậm hơn

```
Ví dụ: Payment Service xử lý 100 requests, sắp xếp theo thời gian:

  Nhanh nhất                                      Chậm nhất
  ├───────────────────────────────────────────────────────┤
  │■■■■■■■■■■■■■■■■■■■■■■■■■■│■■■■■■■■■■■■■■■■■■■│■■■│■│
  │         50 req           │      45 req       │4  │1│
  │      < 200ms             │   200ms - 500ms   │~1.5s│3s│
  │                          │                   │   │ │
  └──────────── P50=200ms ───┘                   │   │ │
  └──────────────────────── P95=500ms ───────────┘   │ │
  └──────────────────────────────── P99=1.5s ────────┘ │
  └──────────────────────────────────── P100=3s ───────┘

  → 99 trong 100 requests xong trong ≤ 1.5s
  → Chỉ 1 request "xui" mất tới 3s (outlier)
```

#### Công thức chọn Timeout

**Nguyên tắc**: Dùng **P99 latency** làm cơ sở, nhân hệ số buffer để chừa chỗ cho dao động, cộng thêm thời gian mạng.

```
Timeout = P99_latency × 1.5 + network_overhead
           │            │        │
           │            │        └─ Thời gian truyền qua mạng
           │            │           (thường 50-100ms nội bộ,
           │            │            nhiều hơn nếu cross-region)
           │            │
           │            └─ Hệ số buffer: chừa thêm 50% cho
           │               trường hợp chậm hơn bình thường
           │               (GC pause, CPU spike, v.v.)
           │
           └─ Giá trị P99: 99% requests nhanh hơn mốc này
```

**Tính cụ thể cho Payment Service** (P99 = 1.5s, network_overhead ≈ 100ms):

```
Timeout = 1.5s × 1.5 + 0.1s
        = 2.25s + 0.1s
        = 2.35s
        → Làm tròn: 3s

Ý nghĩa:
- 99% requests xong trong 1.5s → chắc chắn dưới 3s ✅
- Nếu chờ quá 3s → gần như chắc chắn service đang có vấn đề
  → Timeout, giải phóng tài nguyên, không chờ vô ích
```

**Tại sao dùng P99 mà không dùng P50 hay max?**

| Dùng | Timeout | Vấn đề |
|------|---------|--------|
| P50 (200ms) | ~400ms | Quá thấp! ~50% requests bị timeout oan |
| P95 (500ms) | ~850ms | Vẫn hơi thấp, ~5% requests bị timeout |
| **P99 (1.5s)** | **~3s** | **Tốt! Chỉ ~1% outlier bị timeout** |
| P100/max (3s) | ~5s | Quá cao, chờ lâu cho trường hợp bất thường |

| Service | P50 | P95 | P99 | Tính timeout | Timeout gợi ý |
|---------|-----|-----|-----|--------------|----------------|
| User Service | 20ms | 80ms | 150ms | 150×1.5+100 = 325ms | 300-500ms |
| Payment Service | 200ms | 500ms | 1.5s | 1500×1.5+100 = 2350ms | 3s |
| Report Service | 1s | 5s | 10s | 10000×1.5+100 = 15100ms | 15s |
| External Bank API | 500ms | 2s | 5s | 5000×1.5+200 = 7700ms | 8-10s |

**Lưu ý quan trọng — Timeout Propagation**:

```d2 title="Công thức chọn Timeout"
direction: right
client: "Client timeout 10s"
gateway: "API Gateway timeout 8s"
order: "Order timeout 5s"
payment: "Payment timeout 3s"
bank: "Bank API timeout 2s"
client -> gateway
gateway -> order
order -> payment
payment -> bank
```

Timeout phải **giảm dần** theo chuỗi gọi. Nếu Client timeout 10s nhưng Bank API timeout 15s → vô nghĩa vì Client đã timeout trước.

### 2.4. Ví dụ thực tế

**Adaptive Timeout** — Tự điều chỉnh timeout dựa trên latency thực tế:

```
┌───────────────────────────────────────────────────────┐
│               ADAPTIVE TIMEOUT                        │
│                                                       │
│   Latency gần đây:                                    │
│   [120ms, 135ms, 110ms, 500ms, 125ms, 140ms]          │
│                                                       │
│   P99 hiện tại: ~500ms                                │
│   Timeout động: 500ms × 1.5 = 750ms                   │
│                                                       │
│   ┌──────────────────────────────────────────┐        │
│   │ Latency ▲                                │        │
│   │    500ms │          ●                    │        │
│   │    400ms │                               │        │
│   │    300ms │                               │        │
│   │    200ms │                               │        │
│   │    100ms │ ● ●  ●      ● ●               │        │
│   │         ─┼─────────────────────▶ Time    │        │
│   └──────────────────────────────────────────┘        │
│                                                       │
│   → Phát hiện outlier, không tăng timeout quá cao     │
└───────────────────────────────────────────────────────┘
```

---

## 3. Retry Pattern

Retry Pattern tự động **thử lại** request khi gặp lỗi tạm thời (transient failure). Đây là pattern phổ biến nhất để xử lý network hiccups.

### 3.1. Khi nào nên Retry?

| Nên Retry ✅ | KHÔNG nên Retry ❌ |
|-------------|-------------------|
| HTTP 500 (Internal Server Error) | HTTP 400 (Bad Request) |
| HTTP 502, 503, 504 (Server Error) | HTTP 401, 403 (Auth Error) |
| Connection timeout | HTTP 404 (Not Found) |
| Connection reset | HTTP 409 (Conflict) — tùy trường hợp |
| DNS resolution failure tạm thời | Business logic error |
| Network unreachable tạm thời | Validation error |

**Quy tắc vàng**: Chỉ retry khi **có khả năng thành công** nếu thử lại. Lỗi do input sai → retry 100 lần cũng sai.

### 3.2. Các chiến lược Retry

```d2 title="3.2. Các chiến lược Retry"
direction: down
n1: "Request thất bại" {
  style.fill: "#7f1d1d"
  style.stroke: "#f87171"
  style.font-color: "#fecaca"
}
n2: "Lỗi có retry được?" {
  shape: diamond
}
n3: "Trả về lỗi ngay" {
  style.fill: "#7f1d1d"
  style.stroke: "#f87171"
  style.font-color: "#fecaca"
}
n4: "Còn retry attempts?" {
  shape: diamond
}
n5: "Trả về lỗi sau max retries" {
  style.fill: "#7f1d1d"
  style.stroke: "#f87171"
  style.font-color: "#fecaca"
}
n6: "Chọn chiến lược chờ"
n7: "Immediate Retry"
n8: "Fixed Delay"
n9: "Exponential Backoff"
n10: "Exponential Backoff + Jitter" {
  style.fill: "#2d5016"
  style.stroke: "#4ade80"
  style.font-color: "#bbf7d0"
}
n11: "Thử lại ngay"
n1 -> n2
n2 -> n3: "Không"
n2 -> n4: "Có"
n4 -> n5: "Không"
n4 -> n6: "Có"
n6 -> n7
n6 -> n8
n6 -> n9
n6 -> n10
n7 -> n11
n8 -> n11
n9 -> n11
n10 -> n11
n11 -> n1
```

| Chiến lược | Delay giữa các lần | Ưu điểm | Nhược điểm |
|------------|-------------------|----------|------------|
| **Immediate** | 0 | Nhanh | Có thể làm quá tải service đích |
| **Fixed Delay** | Cố định (vd: 1s) | Đơn giản | Nhiều client retry cùng lúc |
| **Exponential Backoff** | 1s, 2s, 4s, 8s... | Giảm tải dần | Vẫn có thể đồng bộ |
| **Exp. Backoff + Jitter** | Random trong khoảng | Phân tán đều | Phức tạp hơn một chút |

### 3.3. Exponential Backoff với Jitter

Đây là chiến lược **được khuyến nghị** trong hệ thống phân tán.

```
Không có Jitter — Thundering Herd:
──────────────────────────────────────────────────────
  t=0s    100 clients gửi request → Service lỗi
  t=1s    100 clients retry lần 1 → Service vẫn lỗi
  t=2s    100 clients retry lần 2 → Service quá tải!
  t=4s    100 clients retry lần 3 → Service sập!

Có Jitter — Phân tán đều:
──────────────────────────────────────────────────────
  t=0s    100 clients gửi request → Service lỗi
  t=0.5-1.5s  ~33 clients retry → Service xử lý được
  t=1.5-3.5s  ~33 clients retry → Service xử lý được
  t=3.5-7.5s  ~34 clients retry → Service xử lý được ✅
```

**Công thức**:

```
# Full Jitter (khuyến nghị)
delay = random(0, base_delay × 2^attempt)

# Equal Jitter
temp = base_delay × 2^attempt
delay = temp/2 + random(0, temp/2)

# Decorrelated Jitter
delay = random(base_delay, previous_delay × 3)
```

**Ví dụ cụ thể** (base_delay = 1s, max_delay = 30s):

| Lần retry | Exponential | Full Jitter (random) |
|-----------|-------------|---------------------|
| 1 | 1s | random(0, 1s) = 0.7s |
| 2 | 2s | random(0, 2s) = 1.3s |
| 3 | 4s | random(0, 4s) = 2.8s |
| 4 | 8s | random(0, 8s) = 5.1s |
| 5 | 16s | random(0, 16s) = 11.2s |
| 6 | 30s (capped) | random(0, 30s) = 22.7s |

Các lần thử đều dùng cùng operation identity. Tổng thời gian phải nằm trong deadline; hết budget thì dừng thay vì cố đủ số lần retry.

```concurrency-lanes
title: Retry với một lịch Full Jitter minh họa
unit: ms
provenance:
  kind: illustrative
  description: Giả định base 100 ms, attempt index bắt đầu từ 0. Hai lần chờ được tác giả chọn là 60 ms và 150 ms, không phải kết quả chạy random.
lanes:
  - id: caller
    label: Caller
  - id: dependency
    label: Dependency
events:
  - id: a1
    lane: caller
    at: 0
    label: Attempt 1
  - id: f1
    lane: dependency
    at: 20
    label: Lỗi transient
  - id: a2
    lane: caller
    at: 80
    label: Attempt 2
  - id: f2
    lane: dependency
    at: 100
    label: Lỗi transient
  - id: a3
    lane: caller
    at: 250
    label: Attempt 3
  - id: ok
    lane: dependency
    at: 270
    label: Thành công
intervals:
  - id: wait1
    lane: caller
    start: 20
    end: 80
    kind: wait
    label: Jitter 60 ms trong [0, 100]
  - id: wait2
    lane: caller
    start: 100
    end: 250
    kind: wait
    label: Jitter 150 ms trong [0, 200]
```

### 3.4. Idempotency — Điều kiện tiên quyết

**Retry chỉ an toàn khi operation là idempotent** (thực hiện nhiều lần cho cùng kết quả).

```
Idempotent ✅ — An toàn để retry:
──────────────────────────────────────────
GET  /users/123           → Đọc user (bao nhiêu lần cũng như nhau)
PUT  /users/123 {name: "Alice"}  → Set name (kết quả giống nhau)
DELETE /users/123         → Xóa user (xóa lần 2 → 404, không ảnh hưởng)

KHÔNG Idempotent ❌ — Nguy hiểm khi retry:
──────────────────────────────────────────
POST /orders              → Tạo đơn hàng mới (retry → tạo 2 đơn!)
POST /payments            → Thanh toán (retry → trừ tiền 2 lần!)
PATCH /accounts/balance   → Cộng tiền (retry → cộng 2 lần!)
```

**Giải pháp**: Sử dụng **Idempotency Key**:

```d2 title="3.4. Idempotency — Điều kiện tiên quyết"
direction: right
client: "Client tạo key pay_abc123"
request: "POST /payments\nIdempotency-Key pay_abc123"
server: "Server xử lý / persist key + result"
timeout: "Response thất lạc — client timeout"
retry: "Retry cùng POST + cùng key"
saved: "Key đã có → trả kết quả cũ\nKhông charge lại"
client -> request
request -> server
server -> timeout
timeout -> retry
retry -> saved
```

Deduplication key/result phải được lưu atomic với business effect theo thiết kế; thời hạn key, payload mismatch và concurrent requests cần policy rõ.

### 3.5. Retry Storm — Khi Retry trở thành vấn đề

```d2 title="3.5. Retry Storm — Khi Retry trở thành vấn đề"
direction: right
a: "Service A — 3 attempts"
b: "Service B — 3 attempts"
db: "DB — tối đa 9 calls / user request"
a -> b: "Retry ở A"
b -> db: "Retry ở B"
```

Ví dụ nhân retry: 4 tầng × 3 attempts/tầng = 81 calls; 1.000 users → 81.000 calls. Số attempts phải phân biệt với số retries (3 retries thường thành 4 attempts).

**Giải pháp**:

| Giải pháp | Mô tả |
|-----------|--------|
| **Retry budget** | Giới hạn % requests được retry (vd: chỉ 20% traffic được retry) |
| **Chỉ retry ở tầng ngoài cùng** | Tầng gần client nhất retry, các tầng trong trả lỗi ngay |
| **Circuit Breaker** | Ngắt mạch khi lỗi quá nhiều (xem section 4) |
| **Max retries nhỏ** | Thường 2-3 lần là đủ |

---

## 4. Circuit Breaker

Circuit Breaker là pattern **quan trọng nhất** để ngăn Cascading Failure. Tên gọi lấy cảm hứng từ **cầu dao điện** — khi quá tải, tự động ngắt mạch để bảo vệ hệ thống.

### 4.1. Bài toán thực tế

```
Tình huống: Order Service gọi Payment Service

Không có Circuit Breaker:
──────────────────────────────────────────────────────
Payment Service bị chậm (latency 30s thay vì 200ms)
→ Order Service chờ 30s cho mỗi request
→ Thread pool (200 threads) đầy sau 200 requests
→ Order Service không xử lý được request mới
→ Inventory Service gọi Order Service cũng bị chờ
→ Cascading Failure → Toàn bộ hệ thống sập

Có Circuit Breaker:
──────────────────────────────────────────────────────
Payment Service bị chậm
→ Circuit Breaker phát hiện: 50% requests thất bại
→ Circuit OPEN: Ngắt mạch, không gọi Payment nữa
→ Trả về fallback ngay lập tức (< 1ms)
→ Order Service vẫn hoạt động bình thường ✅
→ Sau 30s, thử gọi lại Payment (Half-Open)
→ Payment đã khôi phục → Circuit CLOSED ✅
```

### 4.2. Circuit Breaker là gì?

Circuit Breaker hoạt động như **proxy** giữa caller và callee, theo dõi tỷ lệ lỗi và tự động ngắt mạch khi vượt ngưỡng.

```d2 title="4.2. Circuit Breaker là gì?"
direction: right
caller: "Caller"
cb: "Circuit Breaker\nĐếm lỗi • Sliding window / Tỷ lệ\nCho qua hoặc chặn"
callee: "Callee — Dependency"
reject: "Reject / Fallback ngay"
caller -> cb
cb -> callee: "CLOSED / HALF-OPEN cho probe"
cb -> reject: "OPEN"
```

### 4.3. Ba trạng thái của Circuit Breaker

```d2 title="4.3. Ba trạng thái của Circuit Breaker"
direction: down
initial1: "Bắt đầu" {shape: circle; width: 40; height: 40}
Closed: "Closed"
initial1 -> Closed
Open: "Open"
Closed -> Open: "Tỷ lệ lỗi > ngưỡng"
HalfOpen: "HalfOpen"
Open -> HalfOpen: "Hết thời gian chờ"
HalfOpen -> Closed: "Request thử thành công"
HalfOpen -> Open: "Request thử thất bại"
Closed: "Closed" {
initial2: "Bắt đầu" {shape: circle; width: 40; height: 40}
Monitoring: "Monitoring"
initial2 -> Monitoring
Monitoring -> Monitoring: "Đếm success/failure"
}
Open: "Open" {
initial3: "Bắt đầu" {shape: circle; width: 40; height: 40}
Rejecting: "Rejecting"
initial3 -> Rejecting
Rejecting -> Rejecting: "Reject tất cả request"
}
HalfOpen: "HalfOpen" {
initial4: "Bắt đầu" {shape: circle; width: 40; height: 40}
Testing: "Testing"
initial4 -> Testing
Testing -> Testing: "Cho 1-N request thử qua"
}
```

**Chi tiết từng trạng thái**:

| Trạng thái | Hành vi | Chuyển sang |
|------------|---------|-------------|
| **🟢 CLOSED** | Cho tất cả request qua, đếm lỗi trong cửa sổ thời gian | → OPEN khi tỷ lệ lỗi > threshold (vd: 50%) |
| **🔴 OPEN** | Reject tất cả request ngay lập tức (fail fast), trả về lỗi hoặc fallback | → HALF-OPEN sau thời gian chờ (vd: 30s) |
| **🟡 HALF-OPEN** | Cho một số request thử qua (vd: 5 requests) | → CLOSED nếu thành công, → OPEN nếu thất bại |

### 4.4. Cấu hình Circuit Breaker

| Tham số | Mô tả | Giá trị gợi ý |
|---------|--------|---------------|
| **Failure Rate Threshold** | % lỗi để mở circuit | 50% |
| **Minimum Calls** | Số call tối thiểu trước khi đánh giá | 10-20 |
| **Sliding Window Size** | Kích thước cửa sổ theo dõi (count hoặc time) | 10 calls hoặc 10s |
| **Wait Duration in Open** | Thời gian chờ ở trạng thái OPEN | 30-60s |
| **Permitted Calls in Half-Open** | Số request thử ở HALF-OPEN | 3-5 |
| **Slow Call Duration** | Ngưỡng để coi là slow call | 2-5s |
| **Slow Call Rate Threshold** | % slow call để mở circuit | 80% |

**Hai loại Sliding Window**:

```
Count-based Window (size=10):
────────────────────────────────────────
Theo dõi 10 requests gần nhất:
[✅, ✅, ❌, ✅, ❌, ❌, ❌, ❌, ✅, ❌]
Failure rate = 6/10 = 60% > 50% → OPEN!

Time-based Window (size=10s):
────────────────────────────────────────
Theo dõi tất cả requests trong 10 giây gần nhất:
Tổng: 25 requests, 15 thất bại
Failure rate = 15/25 = 60% > 50% → OPEN!
```

### 4.5. Ví dụ thực tế — Payment Service gọi Bank API

```
┌──────────────────────────────────────────────────────────────┐
│         PAYMENT SERVICE → BANK API (Circuit Breaker)         │
│                                                              │
│  Timeline:                                                   │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  t=0s   🟢 CLOSED — Bank API bình thường                     │
│         Request 1: ✅ 200ms                                  │
│         Request 2: ✅ 180ms                                  │
│         Request 3: ✅ 220ms                                  │
│                                                              │
│  t=10s  Bank API bắt đầu lỗi                                 │
│         Request 4: ❌ timeout 5s                             │
│         Request 5: ❌ timeout 5s                             │
│         Request 6: ❌ 500 error                              │
│         Request 7: ❌ timeout 5s                             │
│         Request 8: ✅ 300ms                                  │
│         → Failure rate: 4/5 = 80% > 50%                      │
│                                                              │
│  t=30s  🔴 OPEN — Ngắt mạch!                                 │
│         Request 9-100: Reject ngay (< 1ms)                   │
│         → Trả về: "Payment pending, try later"               │
│         → Hoặc: Queue payment để xử lý sau                   │
│                                                              │
│  t=60s  🟡 HALF-OPEN — Thử lại                               │
│         Request 101: ✅ 200ms → Bank đã OK!                  │
│         Request 102: ✅ 190ms                                │
│         Request 103: ✅ 210ms                                │
│                                                              │
│  t=61s  🟢 CLOSED — Hoạt động bình thường                    │
└──────────────────────────────────────────────────────────────┘
```

### 4.6. Circuit Breaker + Retry — Kết hợp

**Thứ tự quan trọng**: Retry nằm **bên trong** Circuit Breaker.

Nghĩa là: Circuit Breaker **bọc ngoài**, kiểm tra trạng thái trước. Nếu mạch đóng → mới cho Retry thực hiện bên trong.

```d2 title="4.6. Circuit Breaker + Retry — Kết hợp"
direction: down
n1: "Request đến" {
  style.fill: "#1e293b"
  style.stroke: "#94a3b8"
  style.font-color: "#e2e8f0"
}
n2: "Circuit Breaker\nMạch đang mở?" {
  shape: diamond
  style.fill: "#4c1d95"
  style.stroke: "#a78bfa"
  style.font-color: "#ede9fe"
}
n3: "Reject ngay / Fallback" {
  style.fill: "#7f1d1d"
  style.stroke: "#f87171"
  style.font-color: "#fecaca"
}
n4: "Cho request đi qua"
n5: "Gọi Service"
n6: "Trả kết quả" {
  style.fill: "#2d5016"
  style.stroke: "#4ade80"
  style.font-color: "#bbf7d0"
}
n7: "Retry còn\nlượt không?" {
  shape: diamond
  style.fill: "#713f12"
  style.stroke: "#facc15"
  style.font-color: "#fef9c3"
}
n8: "Chờ backoff rồi thử lại"
n9: "Báo lỗi cho Circuit Breaker"
n10: "CB đếm thêm 1 failure"
n1 -> n2
n2 -> n3: "🔴 OPEN"
n2 -> n4: "🟢 CLOSED"
n4 -> n5
n5 -> n6: "✅ Thành công"
n5 -> n7: "❌ Thất bại"
n7 -> n8: "Còn"
n8 -> n5
n7 -> n9: "Hết lượt"
n9 -> n10
n10 -> n3
```

**Ví dụ cụ thể — 1 request đi qua cả 2 lớp**:

```d2 title="4.6. Circuit Breaker + Retry — Kết hợp"
direction: down
request: "Thanh toán đơn 456"
cb: "Outer Circuit Breaker\nFailure rate 30% < threshold 50% — CLOSED"
one: "Inner Retry — Attempt 1 timeout 3s"
two: "Backoff 500ms → Attempt 2 trả 500"
three: "Backoff 1000ms → Attempt 3"
success: "200ms OK → CB ghi 1 success"
failure: "Hết attempts vẫn fail → CB ghi 1 failure"
open: "Failure rate vượt 50% → OPEN"
request -> cb
cb -> one
one -> two
two -> three
three -> success: "Success"
three -> failure: "Failure"
failure -> open: "Vượt threshold"
```

Wrapper order trong ví dụ là CB ngoài Retry nên CB thấy kết quả cuối của một logical operation, không đếm riêng hai attempts lỗi. Đảo thứ tự wrappers sẽ thay đổi cách ghi nhận failures và admission của từng attempt.

**Tại sao KHÔNG đặt Retry bên ngoài Circuit Breaker?**

```
❌ SAI: Retry bọc ngoài Circuit Breaker
────────────────────────────────────────────────────────

  Retry lần 1 → Circuit Breaker → Gọi Service → ❌ Fail
                 CB đếm: 1 failure
  Retry lần 2 → Circuit Breaker → Gọi Service → ❌ Fail
                 CB đếm: 2 failures
  Retry lần 3 → Circuit Breaker → Gọi Service → ❌ Fail
                 CB đếm: 3 failures

  Vấn đề: 1 request thật → CB đếm 3 failures!
  → Circuit mở quá sớm (vì failure count bị thổi phồng)
  → Các request khác bị reject oan

✅ ĐÚNG: Circuit Breaker bọc ngoài Retry
────────────────────────────────────────────────────────

  Circuit Breaker → Retry 3 lần → ❌ Tất cả fail
                    CB đếm: 1 failure (đúng thực tế)

  → Circuit chỉ mở khi THẬT SỰ có nhiều request thất bại
  → Không bị thổi phồng bởi retry
```

### 4.7. Các thư viện phổ biến

| Ngôn ngữ | Thư viện | Đặc điểm |
|-----------|----------|-----------|
| **Java** | Resilience4j | Lightweight, modular, hỗ trợ nhiều pattern |
| **Java** | Hystrix (Netflix) | Deprecated, nhưng ý tưởng vẫn quan trọng |
| **.NET** | Polly | Fluent API, hỗ trợ tất cả patterns |
| **Go** | sony/gobreaker | Đơn giản, hiệu quả |
| **Go** | afex/hystrix-go | Port của Hystrix |
| **Node.js** | opossum | Đơn giản, hỗ trợ Prometheus metrics |
| **Python** | pybreaker | Nhẹ, dễ dùng |
| **Service Mesh** | Istio / Linkerd | Circuit breaker ở tầng infrastructure |

---

## 5. Bulkhead Pattern

### 5.1. Ý tưởng từ đóng tàu

Bulkhead (vách ngăn) trong đóng tàu chia thân tàu thành **các khoang riêng biệt**. Nếu một khoang bị thủng và ngập nước, các khoang khác **không bị ảnh hưởng** — tàu vẫn nổi.

```d2 title="5.1. Ý tưởng từ đóng tàu"
direction: down
without: "Không Bulkhead — tàu chìm" { hull: Toàn bộ khoang ngập }
with: "Có Bulkhead — chỉ một khoang ngập, tàu vẫn nổi" {
 one: Khoang 1 — NGẬP
 two: Khoang 2 — KHÔ
 three: Khoang 3 — KHÔ
 four: Khoang 4 — KHÔ
}
```

### 5.2. Bulkhead trong Microservice

Áp dụng cùng ý tưởng: **cô lập tài nguyên** để lỗi ở một phần không ảnh hưởng phần khác.

**Bulkhead không chỉ là chia thread pool** — bất kỳ tài nguyên nào cũng có thể áp dụng Bulkhead:

| Tài nguyên cô lập | Cách làm | Ví dụ |
|-------------------|----------|-------|
| **Thread Pool** | Mỗi dependency có pool riêng | Payment pool 50 threads, Inventory pool 50 threads |
| **Connection Pool** | Mỗi DB/service có connection pool riêng | Order DB max 20 conn, Product DB max 10 conn |
| **Semaphore** | Giới hạn số concurrent calls bằng counter | Max 50 concurrent requests tới Payment |
| **Process / Container** | Tách process hoặc pod riêng | Pod Payment có CPU/RAM limit riêng |
| **Infrastructure** | Tách cluster, AZ, region | Critical services chạy cluster riêng |

Dù cô lập loại tài nguyên nào, **ý tưởng đều giống nhau**:

```d2 title="5.2. Bulkhead trong Microservice"
direction: down
shared: "Không Bulkhead — 200 threads chung" {
 pool: Pool 200 threads
 payment: Payment chậm 30s/request — chiếm hết 200
 inventory: Inventory — không còn threads
 notification: Notification — không còn threads
 pool -> payment
 pool -> inventory
 pool -> notification
}
isolated: Order Service — Isolated Pools {
 payment: Payment max50
 inventory: Inventory max50
 notification: Notification max20
 other: Other max80
}
```

Bình thường Payment/Inventory/Notification dùng khoảng 10/10/5 threads trong ví dụ. Khi Payment chậm chỉ pool Payment bị chiếm; Inventory và Notification vẫn có capacity riêng, tránh một dependency làm tê liệt toàn Order.

**Ví dụ Connection Pool Bulkhead** — không liên quan tới thread:

```d2 title="5.2. Bulkhead trong Microservice"
direction: down
shared: "Chung 30 connections — Product DB chậm có thể chiếm hết" {
 pool: Shared Pool — 30
 product: Product DB
 order: Order DB
 user: User DB
 pool -> product
 pool -> order
 pool -> user
}
separate: Separate Pools {
 product: Product Pool max10 → Product DB chậm
 order: Order Pool max15 → Order DB vẫn còn capacity
 user: User Pool max5 → User DB vẫn còn capacity
}
```

**Ví dụ Kubernetes Resource Bulkhead** — cô lập ở tầng infrastructure:

```
Không Bulkhead:
  Payment + Order chạy chung node (8 CPU, 16GB RAM)
  → Payment bị memory leak → node hết RAM → cả 2 chết ❌

Có Bulkhead (resource limits):
  Pod Payment:  requests: CPU 250m, RAM 256Mi
                limits:   CPU 500m, RAM 512Mi
  Pod Order:    requests: CPU 250m, RAM 256Mi
                limits:   CPU 500m, RAM 512Mi

  → Payment memory leak → chỉ OOMKill pod Payment
  → Pod Order không bị ảnh hưởng ✅
```

### 5.3. Các loại Bulkhead

#### Thread Pool Isolation

Mỗi dependency có **thread pool riêng**:

```d2 title="Thread Pool Isolation"
direction: down
order: Order Service {
 pay: Payment Pool — used40 / max50
 inv: Inventory Pool — used10 / max50
 noti: Notification Pool — used8 / max20
}
payment: Payment Service
inventory: Inventory Service
notification: Notification Service
order.pay -> payment
order.inv -> inventory
order.noti -> notification
```

**Ưu điểm**: Cô lập hoàn toàn, thread bị block không ảnh hưởng pool khác
**Nhược điểm**: Tốn tài nguyên (nhiều thread), overhead context switching

#### Semaphore Isolation

Dùng **semaphore (counter)** giới hạn số lượng concurrent calls:

```d2 title="Semaphore Isolation"
direction: right
order: Order Service — caller thread pool dùng chung {
 pay: Payment Semaphore — current40 / max50
 inv: Inventory Semaphore — current10 / max50
 noti: Notification Semaphore — current8 / max20
}
```

Semaphore isolation chỉ giới hạn concurrent calls, không tự cấp một thread pool độc lập cho mỗi dependency.

**Ưu điểm**: Nhẹ, ít overhead
**Nhược điểm**: Không cô lập hoàn toàn, nếu thread bị block → ảnh hưởng shared pool

| Tiêu chí | Thread Pool | Semaphore |
|----------|-------------|-----------|
| Isolation | Hoàn toàn | Một phần |
| Overhead | Cao (thread) | Thấp |
| Phù hợp | Network calls (blocking I/O) | In-memory, non-blocking |
| Timeout | Có thể cancel | Không tự cancel |

### 5.4. Ví dụ thực tế — E-Commerce Service

```d2 title="5.4. Ví dụ thực tế — E-Commerce Service"
direction: down
request: "Incoming Requests — 1.000 req/s"
handler: "Request Handler Pool — 200 threads"
payment: "Payment Pool 50 — CRITICAL"
inventory: "Inventory Pool 50 — CRITICAL"
shipping: "Shipping Pool 30 — MEDIUM"
rec: "Recommendation Pool 20 — LOW"
request -> handler
handler -> payment
handler -> inventory
handler -> shipping
handler -> rec
```

Mỗi pool gọi dependency tương ứng. Khi overload giảm/tắt LOW trước, giữ capacity CRITICAL.

### 5.5. Bulkhead + Circuit Breaker

Bulkhead và Circuit Breaker **bổ sung cho nhau**:

| Pattern | Vai trò |
|---------|---------|
| **Bulkhead** | Giới hạn **số lượng** concurrent calls → cô lập tài nguyên |
| **Circuit Breaker** | Giới hạn **tỷ lệ lỗi** → ngắt mạch khi quá nhiều lỗi |

```d2 title="5.5. Bulkhead + Circuit Breaker"
direction: right
request: "Request"
bulkhead: "Bulkhead — còn slot?"
cb: "Circuit Breaker — mạch cho phép?"
reject: "BulkheadFull — Reject"
fallback: "CircuitOpen — Fallback"
call: "Service Call"
request -> bulkhead
bulkhead -> reject: "Hết slot"
bulkhead -> cb: "Có slot"
cb -> fallback: "OPEN"
cb -> call: "CLOSED / Probe"
```

---

## 6. Rate Limiter

### 6.1. Tại sao cần Rate Limiting?

Rate Limiting giới hạn **số lượng request** mà client có thể gửi trong một khoảng thời gian. Khác với Bulkhead (giới hạn concurrent), Rate Limiter giới hạn **throughput**.

| Mục đích | Ví dụ |
|----------|-------|
| **Bảo vệ service** | Service chỉ xử lý được 1000 req/s, cần giới hạn |
| **Công bằng** | Không cho 1 client chiếm hết bandwidth |
| **Chống abuse** | DDoS, brute-force, scraping |
| **Cost control** | Giới hạn gọi tới API trả phí (vd: OpenAI, Twilio) |
| **Compliance** | SLA quy định tối đa X requests/phút |

### 6.2. Các thuật toán Rate Limiting

#### Token Bucket

```d2 title="Token Bucket"
direction: right
refill: "Refill 2 tokens/giây"
bucket: "Token Bucket\nCapacity10 • Hiện có8"
request: "Request đến"
check: "Có token?"
accept: "Lấy 1 token → Xử lý"
reject: "429 Too Many Requests"
refill -> bucket
request -> check
bucket -> check
check -> accept: "Có"
check -> reject: "Hết"
```

Cho phép burst trong giới hạn số token tích lũy.

#### Leaky Bucket

```d2 title="Leaky Bucket"
direction: right
request: "Requests đến"
check: "Bucket / Queue đầy?"
queue: "Bounded Queue"
reject: "Reject"
process: "Processed — tốc độ cố định 5 req/s"
request -> check
check -> queue: "Chưa đầy"
check -> reject: "Đầy"
queue -> process
```

Leaky Bucket ở dạng queue làm output rate đều hơn, smooth input bursts.

#### Fixed Window Counter

```
┌──────────────────────────────────────────────────────┐
│            FIXED WINDOW COUNTER                      │
│                                                      │
│   Window: 1 phút, Limit: 100 requests                │
│                                                      │
│   12:00:00 ─────────── 12:01:00 ─────────── 12:02:00 │
│   │  count: 0→95      │  count: 0→...      │         │
│   │  ✅ cho qua       │  ✅ reset counter  │         │
│   │                   │                    │         │
│   │  count: 96→100    │                    │         │
│   │  ❌ reject (101+) │                    │         │
│                                                      │
│   ⚠️ Vấn đề: Boundary burst                          │
│   12:00:50 — 50 requests (trong window 1)            │
│   12:01:05 — 50 requests (trong window 2)            │
│   → 100 requests trong 15 giây! Vượt rate thực tế    │
└──────────────────────────────────────────────────────┘
```

#### Sliding Window Log

```
┌──────────────────────────────────────────────────────┐
│            SLIDING WINDOW LOG                        │
│                                                      │
│   Lưu timestamp mỗi request                          │
│   Window: 1 phút, Limit: 100                         │
│                                                      │
│   Timestamps: [12:00:05, 12:00:10, ..., 12:00:58]    │
│                                                      │
│   Request mới lúc 12:01:02:                          │
│   → Xóa timestamps < 12:00:02 (quá 1 phút)           │
│   → Đếm timestamps còn lại                           │
│   → Nếu < 100 → cho qua ✅                           │
│   → Nếu >= 100 → reject ❌                           │
│                                                      │
│   ✅ Chính xác, không có boundary burst              │
│   ❌ Tốn bộ nhớ (lưu mọi timestamp)                  │
└──────────────────────────────────────────────────────┘
```

#### Sliding Window Counter

Kết hợp Fixed Window + trọng số:

```
┌──────────────────────────────────────────────────────┐
│         SLIDING WINDOW COUNTER                       │
│                                                      │
│   Window trước (12:00-12:01): 80 requests            │
│   Window hiện tại (12:01-12:02): 30 requests         │
│   Thời điểm: 12:01:15 (25% vào window hiện tại)      │
│                                                      │
│   Estimated count = 80 × (1 - 0.25) + 30             │
│                   = 80 × 0.75 + 30                   │
│                   = 60 + 30 = 90                     │
│                                                      │
│   Limit = 100 → 90 < 100 → Cho qua ✅                │
│                                                      │
│   ✅ Gần chính xác, ít tốn bộ nhớ                    │
└──────────────────────────────────────────────────────┘
```

**So sánh các thuật toán**:

| Thuật toán | Bộ nhớ | Chính xác | Cho phép burst | Phức tạp |
|------------|--------|-----------|----------------|----------|
| Token Bucket | O(1) | Cao | Có | Thấp |
| Leaky Bucket | O(N) | Cao | Không | Trung bình |
| Fixed Window | O(1) | Thấp | Có (boundary) | Thấp |
| Sliding Window Log | O(N) | Rất cao | Không | Cao |
| Sliding Window Counter | O(1) | Cao | Một phần | Trung bình |

### 6.3. Rate Limiting ở đâu?

```d2 title="6.3. Rate Limiting ở đâu?"
direction: right
client: "Client"
edge: "CDN / LB\nIP-based • DDoS protection"
gw: "API Gateway\nAPI-key / Per-user / Per-tier"
service: "Service\nPer-dependency • Self-protection\nConnection pool / Query limit"
db: "Database"
client -> edge
edge -> gw
gw -> service
service -> db
# Icons: https://icons.d2lang.com/
db.icon: "https://icons.d2lang.com/essentials/117-database.svg"
```

### 6.4. Ví dụ thực tế — Public API

```
┌──────────────────────────────────────────────────────────────┐
│              API RATE LIMITING TIERS                         │
│                                                              │
│   ┌────────────────────────────────────────────────┐         │
│   │  Tier        │ Rate Limit   │ Burst │ Price    │         │
│   │──────────────│──────────────│───────│──────────│         │
│   │  Free        │ 100 req/hr   │ 10    │ $0       │         │
│   │  Basic       │ 1000 req/hr  │ 50    │ $29/mo   │         │
│   │  Pro         │ 10000 req/hr │ 200   │ $99/mo   │         │
│   │  Enterprise  │ Custom       │ Custom│ Custom   │         │
│   └────────────────────────────────────────────────┘         │
│                                                              │
│   Response Headers:                                          │
│   ┌──────────────────────────────────────────┐               │
│   │  X-RateLimit-Limit: 1000                 │               │
│   │  X-RateLimit-Remaining: 742              │               │
│   │  X-RateLimit-Reset: 1640995200           │               │
│   │  Retry-After: 30           (khi bị 429)  │               │
│   └──────────────────────────────────────────┘               │
│                                                              │
│   Khi vượt limit → HTTP 429 Too Many Requests                │
│   {                                                          │
│     "error": "rate_limit_exceeded",                          │
│     "message": "Too many requests. Retry after 30 seconds.", │
│     "retry_after": 30                                        │
│   }                                                          │
└──────────────────────────────────────────────────────────────┘
```

**Rate Limiting trong distributed system** — Cần shared storage:

```d2 title="Distributed Rate Limiter dùng Redis"
direction: down
a: Instance 1
b: Instance 2
c: Instance 3
redis: "Redis\nkey user:123 • count 85 • TTL 55s" {shape: cylinder}
a -> redis
b -> redis
c -> redis
# Icons: https://icons.d2lang.com/
redis.icon: "https://icons.d2lang.com/dev/redis.svg"
```

Dùng Lua script hoặc thao tác atomic phù hợp để việc tăng counter và thiết lập expiry không bị tách rời.

---

## 7. Fallback Pattern

### 7.1. Fallback là gì?

Fallback cung cấp **phương án dự phòng** khi service chính không hoạt động. Thay vì trả lỗi cho user, hệ thống trả về **kết quả thay thế** (có thể không hoàn hảo nhưng vẫn hữu ích).

```d2 title="7.1. Fallback là gì?"
direction: right
request: "Request"
primary: "Primary Service"
result: "Return result"
fallback: "Fallback theo business policy"
cache: "Cache data"
default: "Default value"
alt: "Alternative service"
simple: "Simplified response"
queue: "Queue for later"
request -> primary
primary -> result: "Success"
primary -> fallback: "Failure"
fallback -> cache
fallback -> default
fallback -> alt
fallback -> simple
fallback -> queue
```

### 7.2. Các chiến lược Fallback

| Chiến lược | Mô tả | Ví dụ |
|------------|--------|-------|
| **Cache** | Trả về data từ cache (có thể cũ) | Hiển thị giá sản phẩm cached |
| **Default Value** | Trả về giá trị mặc định | Shipping = "3-5 ngày" khi không tính được chính xác |
| **Alternative Service** | Gọi service backup | Gọi Bank B khi Bank A lỗi |
| **Graceful Degradation** | Giảm chất lượng/tính năng | Tắt recommendation, giữ search & checkout |
| **Queue for Later** | Lưu request để xử lý sau | Queue email notification để gửi sau |
| **Static Content** | Trả về nội dung tĩnh | Hiển thị "popular products" thay vì personalized |

### 7.3. Ví dụ thực tế — Recommendation Service

```d2 title="Product Page — Fallback Chain"
direction: down
user: "User xem iPhone 15"
recommendation: "1. Recommendation Service\nGợi ý cá nhân hóa"
personal: Hiển thị personalized
cache: "2. Cache\nGợi ý từ hai giờ trước"
cached: Hiển thị cached data
popular: "3. Popular Items\nTop 10 bán chạy cùng danh mục"
popular_result: Hiển thị popular items
static: "4. Static Default\nPhụ kiện iPhone — luôn có dữ liệu tĩnh"
user -> recommendation
recommendation -> personal: Success
recommendation -> cache: Failure
cache -> cached: Hit
cache -> popular: Miss
popular -> popular_result: Có data
popular -> static: Không có data
```

User vẫn thấy gợi ý khi dependency lỗi thay vì một lỗi của toàn bộ trang.

### 7.4. Graceful Degradation vs Fail Fast

| | Graceful Degradation | Fail Fast |
|---|---------------------|-----------|
| **Ý tưởng** | Giảm chất lượng nhưng vẫn hoạt động | Trả lỗi ngay để client xử lý |
| **Khi nào** | Feature không critical | Feature critical, không có thay thế |
| **Ví dụ** | Tắt recommendation, giữ checkout | Payment fail → báo lỗi ngay |
| **UX** | User ít nhận thấy | User thấy lỗi |

```
E-Commerce khi Payment Service lỗi:

  ┌─────────────────────────────────────────────────┐
  │  Graceful Degradation:                          │
  │  ✅ Xem sản phẩm           — vẫn hoạt động      │
  │  ✅ Thêm vào giỏ hàng      — vẫn hoạt động      │
  │  ✅ Tìm kiếm               — vẫn hoạt động      │
  │  🟡 Gợi ý sản phẩm         — hiển thị popular   │
  │  ❌ Thanh toán              — "Tạm thời lỗi,    │
  │                              thử lại sau"       │
  │                                                 │
  │  → 80% tính năng vẫn hoạt động                  │
  └─────────────────────────────────────────────────┘
```

---

## 8. Các Pattern bổ trợ

### 8.1. Health Check

Health Check cho phép hệ thống **tự kiểm tra** trạng thái của mình và các dependency.

```
┌──────────────────────────────────────────────────────┐
│              HEALTH CHECK PATTERN                    │
│                                                      │
│   GET /health/liveness                               │
│   → Service có đang chạy?                            │
│   → Response: { "status": "UP" }                     │
│   → Dùng bởi: Kubernetes liveness probe              │
│                                                      │
│   GET /health/readiness                              │
│   → Service có sẵn sàng nhận traffic?                │
│   → Kiểm tra: DB connection, cache, dependencies     │
│   → Response:                                        │
│   {                                                  │
│     "status": "UP",                                  │
│     "checks": {                                      │
│       "database": "UP",                              │
│       "redis": "UP",                                 │
│       "payment-service": "DOWN"  ← dependency lỗi    │
│     }                                                │
│   }                                                  │
│   → Dùng bởi: Kubernetes readiness probe,            │
│               Load Balancer, Service Discovery       │
└──────────────────────────────────────────────────────┘
```

### 8.2. Deadlines / Distributed Timeout

Trong chuỗi gọi dài, truyền **deadline** (thời điểm hết hạn) thay vì timeout:

```d2 title="8.2. Deadlines / Distributed Timeout"
direction: right
client: "Client t=0 — deadline t+5s"
a: "Service A nhận t+0.2s — còn 4.8s"
b: "Service B nhận t+1s — còn 4s"
c: "Service C nhận t+2s — còn 3s"
db: "DB nhận t+3s — còn 2s"
client -> a
a -> b
b -> c
c -> db
```

Propagate deadline để các tầng biết budget còn lại và dừng work khi hết; gRPC có metadata/deadline support, cần cancellation-aware handlers.

### 8.3. Load Shedding

Khi quá tải, **chủ động từ chối** một phần request để bảo vệ hệ thống:

```
┌──────────────────────────────────────────────────────┐
│              LOAD SHEDDING                           │
│                                                      │
│   Capacity: 1000 req/s                               │
│   Current load: 1500 req/s                           │
│                                                      │
│   Chiến lược:                                        │
│   ├── Random: Reject random 33% requests             │
│   ├── Priority: Reject low-priority trước            │
│   │   ├── Priority 1 (checkout): Luôn xử lý          │
│   │   ├── Priority 2 (search): Reject 20%            │
│   │   └── Priority 3 (recommendation): Reject 100%   │
│   └── LIFO: Reject requests cũ nhất (likely timeout) │
│                                                      │
│   → Xử lý 1000 req/s thành công                      │
│   → Tốt hơn xử lý 1500 req/s với 80% timeout         │
└──────────────────────────────────────────────────────┘
```

### 8.4. Chaos Engineering

**Chủ động inject lỗi** vào production để kiểm tra resilience:

```
┌──────────────────────────────────────────────────────┐
│              CHAOS ENGINEERING                       │
│                                                      │
│   "Thay vì đợi lỗi xảy ra, chủ động tạo lỗi          │
│    để kiểm tra hệ thống có chịu được không"          │
│                                                      │
│   Các thí nghiệm:                                    │
│   ├── Kill random service instance                   │
│   ├── Inject network latency (3s delay)              │
│   ├── Inject network packet loss (10%)               │
│   ├── Fill disk space                                │
│   ├── Spike CPU usage                                │
│   └── Block network giữa 2 service                   │
│                                                      │
│   Công cụ:                                           │
│   ├── Chaos Monkey (Netflix)                         │
│   ├── Litmus (Kubernetes)                            │
│   ├── Gremlin (SaaS)                                 │
│   └── Chaos Mesh (CNCF)                              │
│                                                      │
│   Quy trình:                                         │
│   1. Định nghĩa "steady state" (hệ thống OK)         │
│   2. Giả thuyết: "Hệ thống chịu được X"              │
│   3. Inject lỗi X                                    │
│   4. Quan sát: Steady state có bị phá không?         │
│   5. Fix nếu cần, lặp lại                            │
└──────────────────────────────────────────────────────┘
```

---

## 9. Kết hợp các Pattern — Defense in Depth

### 9.1. Thứ tự áp dụng

Các pattern nên được áp dụng **theo thứ tự từ ngoài vào trong**:

```d2 title="9.1. Thứ tự áp dụng"
direction: right
n1: "Request" {
  style.fill: "#1e293b"
  style.stroke: "#94a3b8"
  style.font-color: "#e2e8f0"
}
n2: "Rate Limiter" {
  style.fill: "#4c1d95"
  style.stroke: "#a78bfa"
  style.font-color: "#ede9fe"
}
n3: "Bulkhead" {
  style.fill: "#1e3a5f"
  style.stroke: "#60a5fa"
  style.font-color: "#dbeafe"
}
n4: "Circuit Breaker" {
  style.fill: "#713f12"
  style.stroke: "#facc15"
  style.font-color: "#fef9c3"
}
n5: "Retry + Backoff" {
  style.fill: "#164e63"
  style.stroke: "#22d3ee"
  style.font-color: "#cffafe"
}
n6: "Timeout" {
  style.fill: "#3b0764"
  style.stroke: "#c084fc"
  style.font-color: "#f3e8ff"
}
n7: "Service Call" {
  style.fill: "#1e293b"
  style.stroke: "#94a3b8"
  style.font-color: "#e2e8f0"
}
n8: "Fallback" {
  style.fill: "#7f1d1d"
  style.stroke: "#f87171"
  style.font-color: "#fecaca"
}
n9: "Response" {
  style.fill: "#2d5016"
  style.stroke: "#4ade80"
  style.font-color: "#bbf7d0"
}
n1 -> n2
n2 -> n3
n3 -> n4
n4 -> n5
n5 -> n6
n6 -> n7
n7 -> n8: "Fail"
n7 -> n9: "Success"
n8 -> n9
```

```d2 title="9.1. Thứ tự áp dụng"
direction: down
request: "Request"
rate: "1. Rate Limiter — quá nhiều?"
bulk: "2. Bulkhead — hết slot?"
cb: "3. Circuit Breaker — OPEN?"
retry: "4. Retry — lỗi transient / an toàn?"
timeout: "5. Per-try Timeout"
call: "6. Service Call"
response: "Success → Response"
reject: "Reject — 429 / BulkheadFull"
fallback: "7. Fallback / Terminal failure"
backoff: "Retry budget còn → Backoff"
request -> rate
rate -> reject: "Quá limit"
rate -> bulk: "Cho qua"
bulk -> reject: "Hết slot"
bulk -> cb: "Có slot"
cb -> fallback: "OPEN"
cb -> retry: "Cho phép"
retry -> timeout
timeout -> call
call -> response: "Success"
call -> backoff: "Transient safe failure"
backoff -> retry
call -> fallback: "Terminal / Hết budget"
timeout -> fallback: "Timeout / Deadline"
```

Đây là thứ tự wrapper minh họa, cần chọn theo admission/cancellation và cách tính CB statistics. Retry/backoff/per-try timeouts phải nằm trong overall deadline.

### 9.2. Ví dụ tổng hợp — Order Service

```d2 title="9.2. Ví dụ tổng hợp — Order Service"
direction: down
user: "User đặt iPhone 15"
rate: "Rate Limiter — 100 orders/phút/user"
validate: "Order Service — Validate order"
inventory: "Check Inventory\nBulkhead50 • CB50%\nRetry2 / Backoff500ms • Timeout3s\nFallback last-known-stock cache"
payment: "Reserve Payment\nBulkhead50 • CB40%\nRetry1 với Idempotency-Key • Timeout5s\nFallback queue payment"
noti: "Send Notification\nBulkhead20 • CB60%\nKhông retry inline • Timeout2s\nFallback queue for later"
result: "Return order confirmation / pending theo contract"
user -> rate
rate -> validate
validate -> inventory
inventory -> payment
payment -> noti
noti -> result
```

Payment/Notification lỗi có thể được retry từ queue. Không dùng cached stock như quyết định reserve có thẩm quyền, và không xác nhận thanh toán thành công khi chỉ mới enqueue: trả trạng thái pending/degraded đúng business contract.

---

## 10. Anti-patterns

| Anti-pattern | Mô tả | Giải pháp |
|-------------|--------|-----------|
| **Retry without backoff** | Retry liên tục không delay → làm quá tải service | Dùng exponential backoff + jitter |
| **Retry non-idempotent** | Retry POST tạo đơn hàng → tạo trùng | Dùng idempotency key |
| **No timeout** | Không set timeout → thread bị treo vĩnh viễn | Luôn set timeout cho mọi external call |
| **Timeout quá lớn** | Timeout = 60s → chờ quá lâu, lãng phí tài nguyên | Dựa trên P99 latency |
| **Circuit Breaker cho mọi thứ** | Áp dụng CB cho in-memory calls | CB chỉ dùng cho remote calls |
| **Không có fallback** | Circuit open → trả lỗi trực tiếp cho user | Luôn có fallback cho non-critical features |
| **Retry storm** | Retry ở mọi tầng → số request nhân lên exponential | Chỉ retry ở tầng ngoài cùng, dùng retry budget |
| **Ignoring partial failure** | Coi 1 dependency lỗi = toàn bộ request lỗi | Graceful degradation |
| **No monitoring** | Có CB nhưng không monitor trạng thái | Dashboard cho CB state, failure rate, latency |
| **Hardcoded config** | Timeout, threshold cố định trong code | External config, có thể thay đổi runtime |

---

## 11. Tổng kết

```
┌──────────────────────────────────────────────────────────────┐
│                RESILIENCE PATTERNS SUMMARY                   │
│                                                              │
│   Pattern          │ Bảo vệ khỏi            │ Cơ chế         │
│   ─────────────────│────────────────────────│────────────────│
│   Timeout          │ Chờ vô hạn             │ Giới hạn thời  │
│                    │                        │ gian chờ       │
│   ─────────────────│────────────────────────│────────────────│
│   Retry            │ Lỗi tạm thời           │ Thử lại với    │
│                    │                        │ backoff        │
│   ─────────────────│────────────────────────│────────────────│
│   Circuit Breaker  │ Cascading failure      │ Ngắt mạch khi  │
│                    │                        │ lỗi liên tục   │
│   ─────────────────│────────────────────────│────────────────│
│   Bulkhead         │ Resource exhaustion    │ Cô lập tài     │
│                    │                        │ nguyên         │
│   ─────────────────│────────────────────────│────────────────│
│   Rate Limiter     │ Overload, abuse        │ Giới hạn       │
│                    │                        │ throughput     │
│   ─────────────────│────────────────────────│────────────────│
│   Fallback         │ Service failure        │ Phương án      │
│                    │                        │ dự phòng       │
│   ─────────────────│────────────────────────│────────────────│
│   Health Check     │ Routing to bad nodes   │ Tự kiểm tra    │
│   ─────────────────│────────────────────────│────────────────│
│   Load Shedding    │ Quá tải                │ Chủ động reject│
│   ─────────────────│────────────────────────│────────────────│
│   Chaos Eng.       │ Unknown failures       │ Inject lỗi     │
│                    │                        │ để kiểm tra    │
└──────────────────────────────────────────────────────────────┘
```

**Nguyên tắc quan trọng**:

1. **Design for failure** — Giả sử mọi thứ đều có thể lỗi
2. **Fail fast** — Khi lỗi, thất bại nhanh thay vì chờ đợi
3. **Graceful degradation** — Giảm chất lượng tốt hơn sập hoàn toàn
4. **Defense in depth** — Kết hợp nhiều pattern, không dựa vào 1 pattern duy nhất
5. **Monitor everything** — Không thể fix những gì không nhìn thấy

---

## 12. Liên kết liên quan

- [06 - Inter-Service Communication](06-inter-service-communication.md) — Giao tiếp giữa các service (context cho resilience)
- [07 - API Gateway](07-api-gateway.md) — Gateway thường tích hợp Rate Limiting, Circuit Breaker
- [09 - Data Management](09-data-management.md) — Saga pattern cũng cần resilience
- [11 - Observability & Evolvability](11-observability-evolvability.md) — Monitoring cho resilience patterns
- [17 - Design Patterns](17-design-patterns.md) — Các pattern bổ sung
