# Loose Coupling & High Cohesion trong Microservice

## 📋 Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
- [2. Loose Coupling — Liên kết lỏng](#2-loose-coupling--liên-kết-lỏng)
  - [2.1. Loose Coupling là gì?](#21-loose-coupling-là-gì)
  - [2.2. Tại sao Loose Coupling quan trọng?](#22-tại-sao-loose-coupling-quan-trọng)
  - [2.3. Các loại Coupling trong Microservice](#23-các-loại-coupling-trong-microservice)
  - [2.4. Kỹ thuật đạt Loose Coupling](#24-kỹ-thuật-đạt-loose-coupling)
  - [2.5. Ví dụ thực tế — Tight vs Loose Coupling](#25-ví-dụ-thực-tế--tight-vs-loose-coupling)
- [3. High Cohesion — Tính gắn kết cao](#3-high-cohesion--tính-gắn-kết-cao)
  - [3.1. High Cohesion là gì?](#31-high-cohesion-là-gì)
  - [3.2. Các mức độ Cohesion](#32-các-mức-độ-cohesion)
  - [3.3. Kỹ thuật đạt High Cohesion](#33-kỹ-thuật-đạt-high-cohesion)
  - [3.4. Ví dụ thực tế — Low vs High Cohesion](#34-ví-dụ-thực-tế--low-vs-high-cohesion)
- [4. Mối quan hệ giữa Coupling và Cohesion](#4-mối-quan-hệ-giữa-coupling-và-cohesion)
  - [4.1. Ma trận Coupling–Cohesion](#41-ma-trận-couplingcohesion)
  - [4.2. Trade-off trong thực tế](#42-trade-off-trong-thực-tế)
- [5. Các Anti-patterns phổ biến](#5-các-anti-patterns-phổ-biến)
  - [5.1. Distributed Monolith](#51-distributed-monolith)
  - [5.2. Chatty Services](#52-chatty-services)
  - [5.3. Shared Database](#53-shared-database)
  - [5.4. God Service](#54-god-service)
- [6. Đo lường Coupling và Cohesion](#6-đo-lường-coupling-và-cohesion)
  - [6.1. Metrics cho Coupling](#61-metrics-cho-coupling)
  - [6.2. Metrics cho Cohesion](#62-metrics-cho-cohesion)
  - [6.3. Công cụ hỗ trợ đo lường](#63-công-cụ-hỗ-trợ-đo-lường)
- [7. Áp dụng trong thực tế — Case Study](#7-áp-dụng-trong-thực-tế--case-study)
  - [7.1. E-Commerce Platform](#71-e-commerce-platform)
  - [7.2. Banking System](#72-banking-system)
- [8. Best Practices](#8-best-practices)
- [9. Tổng kết](#9-tổng-kết)
- [10. Liên kết liên quan](#10-liên-kết-liên-quan)

---

## 1. Giới thiệu

**Loose Coupling** (liên kết lỏng) và **High Cohesion** (tính gắn kết cao) là hai nguyên tắc nền tảng quyết định chất lượng thiết kế của một hệ thống Microservice. Chúng không phải là khái niệm mới — đã xuất hiện từ thời lập trình module hóa (structured programming) với Larry Constantine năm 1968 — nhưng trong bối cảnh Microservice, tầm quan trọng của chúng được nâng lên một cấp độ hoàn toàn khác.

Nếu **Bounded Context** ([xem doc 02](02-single-responsibility-bounded-context.md)) giúp xác định **ranh giới** của mỗi service, thì Loose Coupling & High Cohesion giúp xác định **chất lượng** của ranh giới đó:
- Service có **thực sự độc lập** không? → Loose Coupling
- Service có **tập trung đúng việc** không? → High Cohesion

```d2 title="1. Giới thiệu"
direction: right
a: Service A { a: a; b: b; c: c; a -- c: Tight; b -- c: Tight }
b: Service B { d: d; e: e; f: f; d -- f: Tight; e -- f: Tight }
a -> b: Loose {style.stroke-dash: 5}
```

Bên trong service: High Cohesion; giữa các service: Loose Coupling.

---

## 2. Loose Coupling — Liên kết lỏng

### 2.1. Loose Coupling là gì?

**Loose Coupling** là đặc tính của hệ thống mà trong đó các thành phần (service) có **mức phụ thuộc tối thiểu** vào nhau. Khi một service thay đổi, các service khác **không cần phải thay đổi theo** hoặc chỉ cần thay đổi rất ít.

```d2 title="2.1. Loose Coupling là gì?"
direction: right
n2: "Loose Coupling ✅" {}
n1: "Tight Coupling ❌" {}
n1.n3: "Order Service"
n1.n4: "Inventory Service"
n1.n5: "Shared DB" {
  shape: cylinder
}
n2.n6: "Order Service"
n2.n7: "Message Queue"
n2.n8: "Inventory Service"
n2.n9: "Order DB" {
  shape: cylinder
}
n2.n10: "Inventory DB" {
  shape: cylinder
}
n1.n3 -> n1.n4: "gọi trực tiếp\nbiết internal logic"
n1.n3 -> n1.n5: "chia sẻ DB"
n1.n4 -> n1.n5: "chia sẻ DB"
n2.n6 -> n2.n7: "event: OrderCreated"
n2.n7 -> n2.n8: "consume event"
n2.n6 -> n2.n9: "own DB"
n2.n8 -> n2.n10: "own DB"
```

**Định nghĩa chính thức**: Hai service A và B là loosely coupled nếu:
1. A có thể thay đổi implementation mà **không ảnh hưởng** đến B
2. A và B có thể **deploy độc lập** nhau
3. A và B có thể **scale độc lập** nhau
4. Khi A gặp sự cố, B **vẫn hoạt động** được (có thể với chức năng giảm)

### 2.2. Tại sao Loose Coupling quan trọng?

| Lợi ích | Mô tả | Ví dụ |
|---------|--------|-------|
| **Independent Deployment** | Deploy service A mà không cần deploy B | Update logic tính giá mà không cần update Order Service |
| **Independent Scaling** | Scale riêng từng service theo nhu cầu | Scale Payment Service x10 vào Black Friday |
| **Fault Isolation** | Lỗi service A không lan sang B | Payment Service chết, User vẫn duyệt sản phẩm được |
| **Team Autonomy** | Mỗi team tự quyết công nghệ, release cycle | Team A dùng Java, Team B dùng Go |
| **Faster Development** | Giảm coordination giữa các team | Không cần họp sync deploy giữa 5 team |
| **Easier Testing** | Test từng service một cách độc lập | Mock external dependencies, test nhanh hơn |

### 2.3. Các loại Coupling trong Microservice

Coupling không chỉ có một loại. Dưới đây là phân loại từ **nguy hiểm nhất** (nên tránh) đến **chấp nhận được**:

#### 2.3.1. Implementation Coupling (🔴 Nguy hiểm nhất)

Service A phụ thuộc vào **chi tiết cài đặt bên trong** của Service B.

```
❌ Service A gọi trực tiếp class/method nội bộ của Service B
❌ Service A đọc trực tiếp database của Service B
❌ Service A phụ thuộc vào cấu trúc bảng DB của Service B
```

**Ví dụ vi phạm**:
```d2 title="Implementation Coupling — truy cập chéo database"
direction: right
order: Order Service
inventory: Inventory Service
db: "Inventory DB\nproducts" {shape: cylinder}
order -> db: "SELECT * FROM inventory.products WHERE stock > 0\nTruy cập chéo — coupling vào schema"
inventory -> db: Sở hữu
```

Khi Inventory Service đổi schema (ví dụ rename `stock` → `quantity`), Order Service sẽ **lỗi ngay lập tức**.

#### 2.3.2. Temporal Coupling (🟠 Nguy hiểm)

Service A **yêu cầu** Service B phải **đang hoạt động** tại thời điểm gọi.

```d2 title="2.3.2. Temporal Coupling (🟠 Nguy hiểm)"
shape: sequence_diagram
"O": "Order Service"
"P": "Payment Service"
"I": "Inventory Service"
"O".note1: "[Order Service — Inventory Service]\nTemporal Coupling ❌"
"O" -> "P": "POST /payments (sync)"
"P" -> "O": "200 OK" { style.stroke-dash: 5 }
"O" -> "I": "PUT /inventory/reserve (sync)"
"I".note2: "⚡ Service bị down!"
"I" -> "O": "503 Service Unavailable" { style.stroke-dash: 5 }
"O".note3: "❌ Toàn bộ order thất bại!"
"O".note4: "[Order Service — Inventory Service]\nGiải pháp ✅"
"O" -> "O": "Publish event: OrderCreated"
"P".note5: "Consume async"
"I".note6: "Consume async (khi phục hồi)"
```

#### 2.3.3. Deployment Coupling (🟠 Nguy hiểm)

Phải deploy **nhiều service cùng lúc** để hệ thống hoạt động đúng.

```
❌ Phải deploy Order Service v2.0 VÀ Payment Service v3.0 cùng lúc
   vì chúng phụ thuộc vào API version mới của nhau

✅ Order Service v2.0 tương thích ngược với Payment Service v2.0 VÀ v3.0
   → Deploy từng cái riêng, bất kỳ thời điểm nào
```

#### 2.3.4. Domain Coupling (🟢 Chấp nhận được)

Service A cần **thông tin nghiệp vụ** từ Service B để hoàn thành công việc. Đây là coupling **tự nhiên** và không thể tránh hoàn toàn.

```d2 title="Domain Coupling qua API công khai"
direction: right
order: Order Service
product: Product Service API
shipping: Shipping Service
customer: Customer Service API
order -> product: Cần giá sản phẩm
shipping -> customer: Cần địa chỉ giao hàng
```

**Quan trọng**: Domain Coupling là chấp nhận được, nhưng cần **giảm thiểu** và **quản lý tốt**.

#### 2.3.5. Contract Coupling (🟢 Chấp nhận được)

Service A phụ thuộc vào **API contract** (interface) của Service B, không phải implementation.

```
✅ Order Service gọi: GET /api/v1/products/{id}
   → Chỉ biết URL, request/response format
   → Không biết Product Service dùng Java hay Go, PostgreSQL hay MongoDB
```

### 2.4. Kỹ thuật đạt Loose Coupling

#### 2.4.1. Asynchronous Communication (Giao tiếp bất đồng bộ)

Sử dụng **message broker** (Kafka, RabbitMQ, NATS) thay vì gọi HTTP trực tiếp.

```d2 title="2.4.1. Asynchronous Communication (Giao tiếp bất đồng bộ)"
direction: down
n2: "Asynchronous ✅" {}
n1: "Synchronous ❌" {}
n1.n3: "Order"
n1.n4: "Payment"
n1.n5: "Inventory"
n1.n6: "Notification"
n2.n7: "Order"
n2.n8: "Event Bus"
n2.n9: "Payment"
n2.n10: "Inventory"
n2.n11: "Notification"
n1.n3 -> n1.n4: "HTTP POST"
n1.n4 -> n1.n5: "HTTP PUT"
n1.n5 -> n1.n6: "HTTP POST"
n2.n7 -> n2.n8: "Publish: OrderCreated"
n2.n8 -> n2.n9: "Subscribe"
n2.n8 -> n2.n10: "Subscribe"
n2.n8 -> n2.n11: "Subscribe"
```

**Ưu điểm**:
- Service **không cần biết** ai sẽ xử lý event
- Service consumer có thể **offline tạm thời**, xử lý sau khi phục hồi
- Dễ dàng **thêm consumer mới** mà không ảnh hưởng producer

**Nhược điểm**:
- Tăng **complexity** (quản lý message broker, xử lý duplicate, ordering)
- **Eventual consistency** — dữ liệu không đồng bộ ngay lập tức
- Khó **debug** và trace hơn

#### 2.4.2. API Contract & Versioning

Định nghĩa API contract rõ ràng và áp dụng **backward-compatible versioning**.

```
# Backward Compatible (không breaking) ✅
- Thêm field mới vào response
- Thêm endpoint mới
- Thêm optional parameter

# Breaking Change (cần version mới) ⚠️
- Xóa hoặc rename field trong response
- Thay đổi kiểu dữ liệu của field
- Xóa endpoint
```

**Chiến lược versioning**:

| Chiến lược | Cách dùng | Ưu điểm | Nhược điểm |
|-----------|-----------|----------|------------|
| **URL Path** | `/api/v1/orders` | Đơn giản, rõ ràng | URL dài, nhiều version phải maintain |
| **Header** | `Accept: application/vnd.api+json;version=1` | URL sạch | Khó test bằng browser |
| **Query Param** | `/api/orders?version=1` | Dễ test | Dễ quên, không chuẩn |

**Điều kiện tương thích:** ví dụ dưới đây thêm `fullName` nhưng giữ `name`. Chỉ an toàn với consumer chấp nhận unknown fields; consumer dùng strict schema vẫn cần kiểm thử.

```code-diff
title: Thêm field khác với đổi tên field trong public contract
language: json
view: split
wordDiff: true
before:
  label: Response v1
  code: |-
    {
      "id": 123,
      "name": "Nguyễn An"
    }
after:
  label: Response chuyển tiếp
  code: |-
    {
      "id": 123,
      "name": "Nguyễn An",
      "fullName": "Nguyễn An"
    }
annotations:
  - id: keep
    side: after
    title: Không xóa field cũ ngay
    description: Giữ contract cho consumer cũ trong migration window; tên và ý nghĩa của field cũ phải được giữ ổn định.
    ranges:
      - - 3
        - 4
```

- **Không xóa field cũ ngay** (bản sau, dòng 3–4): Giữ contract cho consumer cũ trong migration window; tên và ý nghĩa của field cũ phải được giữ ổn định.

#### 2.4.3. Event-Driven Architecture

Thay vì service A **yêu cầu** service B làm gì (command), service A **thông báo** điều gì đã xảy ra (event), và các service khác tự quyết định phản ứng.

```d2 title="Command trực tiếp và event broadcast"
direction: down
command: "Command — producer chỉ định việc phải làm" {
  order: Order Service
  payment: Payment Service
  order -> payment: "Hãy trừ tiền khách hàng 100\$"
}
event: "Event — producer thông báo việc đã xảy ra" {
  order: Order Service
  bus: Event Bus
  payment: "Payment Service\nTự quyết định thanh toán"
  inventory: "Inventory Service\nTự quyết định reserve hàng"
  email: "Email Service\nTự quyết định gửi xác nhận"
  order -> bus: "OrderCreated #123 — tổng 100\$"
  bus -> payment: Subscribe
  bus -> inventory: Subscribe
  bus -> email: Subscribe
}
```

Các consumer phản ứng độc lập; các nhánh fan-out không thể hiện thứ tự xử lý hoặc một distributed transaction.

#### 2.4.4. Database per Service

Mỗi service sở hữu **riêng** database của mình. Không service nào được đọc/ghi trực tiếp vào database của service khác.

```d2 title="Mỗi service sở hữu database riêng"
direction: down
order: Order Service
product: Product Service
user: User Service
od: "Order DB\nPostgreSQL" {shape: cylinder}
pd: "Product DB\nMongoDB" {shape: cylinder}
ud: "User DB\nPostgreSQL" {shape: cylinder}
order -> od: Own
product -> pd: Own
user -> ud: Own
# Icons: https://icons.d2lang.com/
od.icon: "https://icons.d2lang.com/dev/postgresql.svg"
pd.icon: "https://icons.d2lang.com/dev/mongodb.svg"
ud.icon: "https://icons.d2lang.com/dev/postgresql.svg"
```

> 📖 Chi tiết về Database per Service → [09-data-management.md](09-data-management.md)

#### 2.4.5. Interface Segregation (Tách biệt giao diện)

Mỗi consumer chỉ nên biết về **phần API mà nó cần**, không phải toàn bộ API của provider.

```d2 title="2.4.5. Interface Segregation (Tách biệt giao diện)"
direction: down
n2: "Segregated Interface ✅" {}
n1: "Fat Interface ❌" {}
n1.n3: "Product Service\ngetAllProducts\ngetProduct\nupdateStock\nsetPricing\ngetReviews\naddImage"
n1.n4: "Order Service"
n1.n5: "Catalog Service"
n2.n6: "Product Service"
n2.n7: "pricing-api" {
  shape: parallelogram
}
n2.n8: "inventory-api" {
  shape: parallelogram
}
n2.n9: "catalog-api" {
  shape: parallelogram
}
n2.n10: "Order Service"
n2.n11: "Catalog Service"
n2.n12: "Inventory Service"
n1.n4 -> n1.n3: "biết tất cả API"
n1.n5 -> n1.n3: "biết tất cả API"
n2.n6 -> n2.n7: "Pricing API"
n2.n6 -> n2.n8: "Inventory API"
n2.n6 -> n2.n9: "Catalog API"
n2.n10 -> n2.n7: "chỉ dùng"
n2.n11 -> n2.n9: "chỉ dùng"
n2.n12 -> n2.n8: "chỉ dùng"
```

### 2.5. Ví dụ thực tế — Tight vs Loose Coupling

#### Bài toán: Xử lý đơn hàng trong E-Commerce

**Tight Coupling ❌**:

> Playback dưới đây minh họa thứ tự các bước do tác giả chọn; không gửi request thật, không mô phỏng concurrency và tốc độ phát không phải latency. Bạn có thể chạy hoặc xem từng bước.

```d2 title="Bài toán: Xử lý đơn hàng trong E-Commerce" mode=flow interactive=true
# @flow
# scenarios:
#   - id: main
#     label: "Kịch bản minh họa"
#     steps:
#       - edge: "(C -> O)[0]"
#         description: "Client → Order Service: Tạo đơn hàng"
#       - edge: "(O -> P)[0]"
#         description: "Order Service → Payment Service: POST /payments/charge (sync)"
#       - edge: "(P -> O)[0]"
#         description: "Payment Service → Order Service: Payment OK"
#       - edge: "(O -> I)[0]"
#         description: "Order Service → Inventory Service: PUT /inventory/reserve (sync)"
#       - edge: "(I -> O)[0]"
#         description: "Inventory Service → Order Service: Reserved OK"
#       - edge: "(O -> N)[0]"
#         description: "Order Service → Notification Service: POST /notifications/send (sync)"
#       - edge: "(N -> O)[0]"
#         description: "Notification Service → Order Service: Sent OK"
#       - edge: "(O -> C)[0]"
#         description: "Order Service → Client: Đơn hàng thành công"
# @endflow
shape: sequence_diagram
"C": "Client"
"O": "Order Service"
"P": "Payment Service"
"I": "Inventory Service"
"N": "Notification Service"
"C" -> "O": "Tạo đơn hàng"
"O" -> "P": "POST /payments/charge (sync)"
"O".note1: "[Order Service — Payment Service]\nOrder Service chờ Payment"
"P" -> "O": "Payment OK" { style.stroke-dash: 5 }
"O" -> "I": "PUT /inventory/reserve (sync)"
"O".note2: "[Order Service — Inventory Service]\nOrder Service chờ Inventory"
"I" -> "O": "Reserved OK" { style.stroke-dash: 5 }
"O" -> "N": "POST /notifications/send (sync)"
"O".note3: "[Order Service — Notification Service]\nOrder Service chờ Notification"
"N" -> "O": "Sent OK" { style.stroke-dash: 5 }
"O" -> "C": "Đơn hàng thành công" { style.stroke-dash: 5 }
"O".note4: "❌ Vấn đề:\n1. Nếu 1 service chết → tất cả fail\n2. Latency = sum(P + I + N)\n3. Order Service biết tất cả downstream services\n4. Thêm service mới = sửa Order Service"
```

**Loose Coupling ✅**:

```d2 title="Bài toán: Xử lý đơn hàng trong E-Commerce"
direction: right
client: "Client — tạo đơn hàng"
order: "Order Service\nLưu DB: PENDING"
bus: "Event Bus — Kafka\nPublish OrderCreated"
accepted: "Client nhận 202 Accepted"
payment: "Payment consumer\nXử lý thanh toán\nPublish PaymentCompleted"
inventory: "Inventory consumer\nReserve hàng\nPublish InventoryReserved"
notification: "Notification consumer\nGửi email xác nhận"
client -> order
order -> bus
order -> accepted
bus -> payment: "PAR — độc lập"
bus -> inventory: "PAR — độc lập"
bus -> notification: "PAR — độc lập"
```

Các consumer chạy song song; không có thứ tự bắt buộc giữa Payment, Inventory và Notification. Fault isolation, không cần chờ tất cả consumer để trả `202`; thêm consumer không phải sửa Order Service.

---

## 3. High Cohesion — Tính gắn kết cao

### 3.1. High Cohesion là gì?

**High Cohesion** (tính gắn kết cao) nghĩa là mọi thành phần bên trong một service đều **liên quan chặt chẽ** đến nhau và cùng phục vụ **một mục đích duy nhất**. Nói cách khác: mọi thứ thay đổi cùng nhau thì **nên ở cùng nhau**.

```d2 title="3.1. High Cohesion là gì?"
direction: right
high: "High Cohesion — Payment Service" { model: "processPayment() • refundPayment()\ngetPaymentHistory() • validateCard()\ncalculateFees() • generateReceipt()" }
low: "Low Cohesion — Utility Service" { model: "processPayment() — Thanh toán\nsendEmail() — Email\nresizeImage() — Xử lý ảnh\ngenerateReport() — Báo cáo\nvalidateAddress() — Địa lý\nconvertCurrency() — Tài chính" }
```

Payment gom chức năng liên quan tới thanh toán; Utility gom các lý do thay đổi không liên quan.

### 3.2. Các mức độ Cohesion

Từ **tốt nhất** → **tệ nhất**:

| Mức độ | Tên | Mô tả | Ví dụ |
|--------|-----|--------|-------|
| 🟢 1 | **Functional Cohesion** | Mọi thành phần cùng thực hiện **1 chức năng** rõ ràng | Payment Service chỉ xử lý thanh toán |
| 🟢 2 | **Sequential Cohesion** | Output của phần A là input của phần B trong **1 pipeline** | Data Processing: Parse → Validate → Transform → Store |
| 🟡 3 | **Communicational Cohesion** | Các phần cùng thao tác trên **1 tập dữ liệu** | Customer Service: CRUD trên customer data |
| 🟡 4 | **Procedural Cohesion** | Các phần thực hiện theo **1 trình tự** nhưng không chia sẻ data | Wizard steps: Step1 → Step2 → Step3 |
| 🟠 5 | **Temporal Cohesion** | Các phần chạy **cùng thời điểm** nhưng không liên quan logic | Init module: load config + init logger + warm cache |
| 🔴 6 | **Logical Cohesion** | Gom vì **cùng loại** nhưng khác chức năng | Utils: stringUtils, dateUtils, fileUtils |
| 🔴 7 | **Coincidental Cohesion** | Gom **ngẫu nhiên**, không liên quan | "MiscService" chứa đủ thứ |

**Mục tiêu**: Đạt **Functional Cohesion** hoặc **Sequential Cohesion** cho mỗi Microservice.

### 3.3. Kỹ thuật đạt High Cohesion

#### 3.3.1. Thiết kế theo Domain (DDD Alignment)

Mỗi service tương ứng với **1 Bounded Context** trong domain model.

```d2 title="3.3.1. Thiết kế theo Domain (DDD Alignment)"
direction: down
n4: "E-Commerce Domain" {}
n4.n3: "Bounded Context: Payment" {}
n4.n2: "Bounded Context: Ordering" {}
n4.n1: "Bounded Context: Catalog" {}
n4.n1.n5: "Catalog Service\n─────────────\nlistProducts\nsearchProducts\ngetProductDetail\nmanageCategories"
n4.n2.n6: "Order Service\n─────────────\ncreateOrder\ncancelOrder\ntrackOrder\ngetOrderHistory"
n4.n3.n7: "Payment Service\n─────────────\nprocessPayment\nrefundPayment\ngetPaymentStatus\nmanageBilling"
```

#### 3.3.2. Single Responsibility Principle (SRP)

Một service chỉ nên có **1 lý do để thay đổi**.

```
✅ Order Service thay đổi khi:
   → Logic xử lý đơn hàng thay đổi

❌ Order Service KHÔNG nên thay đổi khi:
   → Cách gửi email thay đổi (→ Notification Service)
   → Cách tính thuế thay đổi (→ Tax Service)
   → Cách xử lý thanh toán thay đổi (→ Payment Service)
```

> 📖 Chi tiết SRP → [02-single-responsibility-bounded-context.md](02-single-responsibility-bounded-context.md)

#### 3.3.3. Cohesive Data Ownership

Service sở hữu **tất cả data** liên quan đến domain của nó, và **chỉ** data đó.

```d2 title="3.3.3. Cohesive Data Ownership"
direction: right
product: Product Service owns {
 products: "products\nname • description • SKU"
 categories: "categories\nname • hierarchy"
 images: "product_images\nurl • alt_text"
 attributes: "product_attributes\ncolor • size • etc."
}
review: Review Service owns product_reviews
pricing: Pricing Service owns product_pricing
inventory: Inventory Service owns product_inventory
```

#### 3.3.4. "Change Together" Heuristic

Đặt câu hỏi: **"Những thứ nào thường thay đổi cùng nhau?"** → Chúng nên ở cùng 1 service.

```
Ví dụ: Khi thay đổi business rule về "discount":
   → calculateDiscount()     🔄 thay đổi
   → validateCoupon()        🔄 thay đổi
   → applyPromotion()        🔄 thay đổi
   → getDiscountHistory()    🔄 thay đổi
   → Tất cả nên ở CÙNG Promotion Service ✅

   → sendEmail()             ⬜ không thay đổi
   → updateInventory()       ⬜ không thay đổi
   → Không nên ở Promotion Service ✅
```

### 3.4. Ví dụ thực tế — Low vs High Cohesion

#### Bài toán: Hệ thống quản lý người dùng

**Low Cohesion ❌ — "Super User Service"**:

```d2 title="Bài toán: Hệ thống quản lý người dùng"
direction: right
user: User Service — Monolithic {
 profile: "User Management\ncreateUser() • updateProfile() • deleteUser()"
 auth: "Authentication\nlogin() • logout() • refreshToken() • manageMFA()"
 authz: "Authorization\ncheckPermission() • assignRole() • managePolicies()"
 notification: "Notification\nsendWelcomeEmail() • sendPasswordReset() • sendLoginAlert()"
 analytics: "Analytics\ntrackLogin() • generateUserReport() • calculateDAU()"
}
```

Năm lý do thay đổi khác nhau tạo team lớn khó phối hợp, deploy rủi ro, và phải scale toàn bộ khi chỉ authentication cần thêm capacity.

**High Cohesion ✅ — Tách đúng domain**:

```d2 title="Bài toán: Hệ thống quản lý người dùng"
direction: right
profile: "Profile Service — User profile đổi" { model: "createUser() • updateProfile()\ndeleteUser() • getProfile()" }
auth: "Auth Service — Auth logic đổi" { model: "login() • logout() • refreshToken()\nmanageMFA() • validateToken()" }
authz: "AuthZ Service — Permission rules đổi" { model: "checkPermission() • assignRole()\nmanagePolicies() • evaluateAccess()" }
notification: "Notification Service — Notification logic đổi" { model: "sendEmail() • sendSMS()\nsendPush() • manageTemplates()" }
```

Mỗi service gom một nhóm trách nhiệm cùng lý do thay đổi.

---

## 4. Mối quan hệ giữa Coupling và Cohesion

### 4.1. Ma trận Coupling–Cohesion

Coupling và Cohesion có **mối quan hệ nghịch đảo** tự nhiên: khi bạn tăng Cohesion (gom đúng thứ vào cùng nhau), Coupling tự nhiên giảm (ít phụ thuộc chéo giữa các service).

```
              High Cohesion          Low Cohesion
            ┌──────────────────┬──────────────────┐
            │                  │                  │
  Loose     │   ✅ LÝ TƯỞNG    │   ⚠️ NANO        │
  Coupling  │                  │   SERVICES       │
            │  Mỗi service tập │  Quá nhiều       │
            │  trung, ít phụ   │  service nhỏ,    │
            │  thuộc bên ngoài │  thiếu logic     │
            │                  │                  │
            ├──────────────────┼──────────────────┤
            │                  │                  │
  Tight     │   ⚠️ BIG BALL    │   ❌ TỆ NHẤT     │
  Coupling  │   OF MUD         │   DISTRIBUTED    │
            │                  │   MONOLITH       │
            │  Service lớn,    │  Tệ hơn          │
            │  gắn kết nhưng   │  monolith:       │
            │  quá phụ thuộc   │  phức tạp +      │
            │  lẫn nhau        │  chậm + khó      │
            │                  │  maintain        │
            └──────────────────┴──────────────────┘
```

| Trạng thái | Cohesion | Coupling | Đánh giá |
|-----------|----------|----------|----------|
| ✅ Lý tưởng | High | Loose | Mỗi service tập trung, ít phụ thuộc bên ngoài |
| ⚠️ Nano Services | Low | Loose | Quá nhiều service nhỏ, thiếu nghiệp vụ, overhead cao |
| ⚠️ Big Ball of Mud | High | Tight | Service gắn kết nhưng phụ thuộc chéo quá nhiều |
| ❌ Distributed Monolith | Low | Tight | Tệ nhất: phức tạp của distributed + không lợi ích gì |

### 4.2. Trade-off trong thực tế

**Không có giải pháp hoàn hảo** — luôn có trade-off:

```d2 title="4.2. Trade-off trong thực tế"
direction: down
n1: "Tách nhỏ service hơn"
n2: "✅ High Cohesion hơn"
n3: "⚠️ Nhiều service hơn"
n4: "⚠️ Inter-service communication tăng"
n5: "⚠️ Coupling có thể tăng"
n6: "⚠️ Latency tăng"
n7: "Gom lớn service hơn"
n8: "✅ Ít communication"
n9: "✅ Đơn giản hơn"
n10: "⚠️ Cohesion giảm"
n11: "⚠️ Khó scale riêng"
n12: "⚠️ Deploy rủi ro hơn"
n1 -> n2
n1 -> n3
n3 -> n4
n4 -> n5
n5 -> n6
n7 -> n8
n7 -> n9
n7 -> n10
n10 -> n11
n11 -> n12
```

**Nguyên tắc thực tế**:
1. **Bắt đầu lớn hơn** — Dễ tách service hơn là gom lại
2. **Tách khi có lý do rõ ràng** — Khác team, khác scaling requirement, khác release cycle
3. **Chấp nhận một ít coupling** — Domain coupling là tự nhiên và OK
4. **Đo lường** — Dùng metrics để quyết định tách hay gom

---

## 5. Các Anti-patterns phổ biến

### 5.1. Distributed Monolith

**Đặc điểm**: Tách thành nhiều service nhưng vẫn phải **deploy cùng nhau**, **share database**, và **gọi đồng bộ chéo** liên tục.

```d2 title="Distributed Monolith — coupling qua call và schema"
direction: right
a: Service A
b: Service B
c: Service C
db: Shared Database { a: Table A; b: Table B; c: Table C }
a <-> b <-> c
a -> db
b -> db
c -> db
```

Triệu chứng: deploy một service phải deploy service khác; đổi một table ảnh hưởng cả ba; một service chậm kéo chậm cả chain; mỗi release phải họp coordination.

**Cách fix**: 
- Tách database cho từng service
- Dùng async communication
- Thiết kế API contract rõ ràng

### 5.2. Chatty Services

**Đặc điểm**: Service A phải gọi Service B **quá nhiều lần** để hoàn thành 1 tác vụ, tạo ra **network overhead** lớn.

```d2 title="5.2. Chatty Services" mode=flow interactive=true
# @flow
# scenarios:
#   - id: chatty
#     label: "N call riêng lẻ"
#     steps:
#       - edge: "(O -> P)[0]"
#         description: "Order Service → Product Service: GET /products/1"
#       - edge: "(P -> O)[0]"
#         description: "Product Service → Order Service: Product 1"
#       - edge: "(O -> P)[1]"
#         description: "Order Service → Product Service: GET /products/2"
#       - edge: "(P -> O)[1]"
#         description: "Product Service → Order Service: Product 2"
#       - edge: "(O -> P)[2]"
#         description: "Order Service → Product Service: GET /products/3"
#       - edge: "(P -> O)[2]"
#         description: "Product Service → Order Service: Product 3"
#   - id: batch
#     label: "Một batch request"
#     steps:
#       - edge: "(O -> P)[3]"
#         description: "Order Service → Product Service: POST /products/batch {\"ids\": [1,2,3]}"
#       - edge: "(P -> O)[3]"
#         description: "Product Service → Order Service: [Product 1, Product 2, Product 3]"
# @endflow
shape: sequence_diagram
"O": "Order Service"
"P": "Product Service"
"O".note1: "[Order Service — Product Service]\nChatty ❌ (N+1 calls)"
"O" -> "P": "GET /products/1"
"P" -> "O": "Product 1" { style.stroke-dash: 5 }
"O" -> "P": "GET /products/2"
"P" -> "O": "Product 2" { style.stroke-dash: 5 }
"O" -> "P": "GET /products/3"
"P" -> "O": "Product 3" { style.stroke-dash: 5 }
"O".note2: "N sản phẩm = N calls! 🐌"
"O".note3: "[Order Service — Product Service]\nBatch ✅ (1 call)"
"O" -> "P": "POST /products/batch {\"ids\": [1,2,3]}"
"P" -> "O": "[Product 1, Product 2, Product 3]" { style.stroke-dash: 5 }
"O".note4: "1 call cho N sản phẩm! 🚀"
```

Chọn một cách lấy cùng bộ dữ liệu: chatty thực hiện nhiều call; batch gom thành một request. Không chạy batch sau toàn bộ call lẻ.

**Cách fix**:
- Thiết kế **batch API** (lấy nhiều items trong 1 request)
- Sử dụng **data replication** (lưu copy dữ liệu cần thiết tại consumer)
- Dùng **BFF pattern** (Backend for Frontend gom nhiều calls)
- Cân nhắc **merge 2 service** nếu chatty quá nhiều

### 5.3. Shared Database

**Đặc điểm**: Nhiều service **đọc/ghi cùng 1 database**, phá vỡ encapsulation.

```d2 title="5.3. Shared Database"
direction: down
shared: Shared Database {
 order: Order Service
 payment: Payment Service
 shipping: Shipping Service
 db: "orders table\nCRUD orders • payment_status • ship_status" {shape: cylinder}
 order -> db: CRUD
 payment -> db: Update payment_status
 shipping -> db: Update ship_status
}
owned: Database per Service {
 order: Order Service
 payment: Payment Service
 shipping: Shipping Service
 od: Order DB {shape: cylinder}
 pd: Payment DB {shape: cylinder}
 sd: Shipping DB {shape: cylinder}
 order -> od
 payment -> pd
 shipping -> sd
}
```

Shared table gây xung đột schema ownership, row locks và DB bottleneck. Database per Service giao tiếp qua API/events, không đọc database của nhau.

### 5.4. God Service

**Đặc điểm**: Một service **biết quá nhiều**, **làm quá nhiều**, trở thành **điểm tắc nghẽn** cho toàn bộ hệ thống.

```d2 title="5.4. God Service"
direction: down
bad: "God Service — Order" {
 responsibilities: "Order • Validate sản phẩm • Giá / discount\nPayment • Inventory reserve\nPhí ship • Email • Report\nRefund • Delivery tracking"
}
good: Tách business capability {
 order: Order — Tạo / quản lý đơn
 pricing: Pricing — Giá / discount
 payment: Payment — Thanh toán
 inventory: Inventory — Kho
 shipping: Shipping — Phí / tracking
 notification: Notification — Email / SMS
 reporting: Reporting — Báo cáo
}
```

God Service trong ví dụ có 10 lý do thay đổi, 8 team phải coordinate, chỉ dám deploy một lần/tháng. Tách boundary nhằm giảm coordination, không phải số lượng service càng nhiều càng tốt.

---

## 6. Đo lường Coupling và Cohesion

### 6.1. Metrics cho Coupling

| Metric | Cách đo | Ngưỡng tốt |
|--------|---------|-------------|
| **Afferent Coupling (Ca)** | Số service **phụ thuộc vào** service này | < 5 |
| **Efferent Coupling (Ce)** | Số service mà service này **phụ thuộc** | < 3 |
| **Instability (I)** | I = Ce / (Ca + Ce). 0 = ổn định, 1 = không ổn định | Phụ thuộc context |
| **Change Failure Rate** | % deploy gây incident ở **service khác** | < 5% |
| **Deploy Coupling Rate** | % deploy yêu cầu deploy **cùng service khác** | 0% (lý tưởng) |
| **Sync Call Depth** | Chiều sâu chuỗi gọi đồng bộ A→B→C→D | ≤ 2 |

```
Ví dụ đo Instability:

Payment Service:
  Ca = 4 (Order, Refund, Subscription, Billing phụ thuộc)
  Ce = 1 (chỉ phụ thuộc External Payment Gateway)
  I  = 1 / (4 + 1) = 0.2 → Khá ổn định ✅

Notification Service:
  Ca = 0 (không ai phụ thuộc kết quả)
  Ce = 3 (phụ thuộc Email, SMS, Push providers)
  I  = 3 / (0 + 3) = 1.0 → Không ổn định (nhưng OK vì nó là leaf service)
```

### 6.2. Metrics cho Cohesion

| Metric | Cách đo | Ngưỡng tốt |
|--------|---------|-------------|
| **LCOM (Lack of Cohesion)** | Số cặp method không chia sẻ instance variables | Càng thấp càng tốt |
| **Relatedness of Changes** | Khi thay đổi 1 feature, bao nhiêu % files trong service bị thay đổi | > 60% |
| **Domain Purity** | Bao nhiêu % endpoints thuộc cùng 1 bounded context | > 90% |
| **Reason to Change** | Service có bao nhiêu lý do khác nhau để thay đổi | 1-2 |

### 6.3. Công cụ hỗ trợ đo lường

| Công cụ | Đo gì | Loại |
|---------|-------|------|
| **SonarQube** | Coupling metrics trong code | Static Analysis |
| **Jaeger / Zipkin** | Service dependency graph, call depth | Distributed Tracing |
| **Prometheus + Grafana** | Deploy frequency, failure rate | Monitoring |
| **Git analysis** | Co-change patterns (files thường thay đổi cùng nhau) | VCS Analysis |
| **Backstage** | Service catalog, dependency visualization | Developer Portal |

```
# Ví dụ: Dùng git log phát hiện co-change patterns
# Nếu 2 service thường xuyên commit cùng thời điểm → có thể coupled

$ git log --name-only --pretty=format: | sort | uniq -c | sort -rn
     45 order-service/src/OrderController.java
     43 payment-service/src/PaymentHandler.java    ← Cùng thay đổi!
     42 order-service/src/OrderRepository.java
     
# → Order Service và Payment Service có thể bị coupled!
```

---

## 7. Áp dụng trong thực tế — Case Study

### 7.1. E-Commerce Platform

**Bài toán**: Xây dựng hệ thống e-commerce từ monolith sang microservice.

```d2 title="7.1. E-Commerce Platform"
direction: right
catalog: "Catalog\nProducts • Search • Category"
order: "Order\nOrders • Cart • Pricing"
payment: "Payment\nPayments • Refunds • Billing"
shipping: "Shipping\nShipments • Tracking • Rates"
notification: Notification
es: Elasticsearch {shape: cylinder}
od: PostgreSQL — Order {shape: cylinder}
pd: PostgreSQL — Payment {shape: cylinder}
sd: MongoDB — Shipping {shape: cylinder}
catalog -> es
order -> od
payment -> pd
shipping -> sd
catalog -> order: ProductUpdated — cache price
order -> payment: OrderCreated
order -> shipping: OrderCreated
order -> notification: OrderCreated
payment -> order: PaymentCompleted — update status
shipping -> order: ShipmentDelivered
shipping -> notification: ShipmentDelivered
# Icons: https://icons.d2lang.com/
od.icon: "https://icons.d2lang.com/dev/postgresql.svg"
pd.icon: "https://icons.d2lang.com/dev/postgresql.svg"
sd.icon: "https://icons.d2lang.com/dev/mongodb.svg"
```

Event-driven communication qua Kafka giúp loose coupling; mỗi service gom một Bounded Context để high cohesion. Elasticsearch ở hình là store cho search/catalog trong ví dụ; nếu cần transactional source of truth, dùng primary DB phù hợp thay vì mặc định xem search index là dữ liệu gốc.

**Phân tích Coupling**:

| Quan hệ | Loại Coupling | Mức độ | Giải pháp |
|---------|--------------|--------|-----------|
| Order → Product price | Domain | 🟢 Chấp nhận | Cache giá tại Order Service, sync qua event |
| Order → Payment | Domain | 🟢 Chấp nhận | Async event (OrderCreated) |
| Payment → External Gateway | Contract | 🟢 Chấp nhận | API contract, adapter pattern |
| Shipping → Order status | Domain | 🟢 Chấp nhận | Event (ShipmentDelivered) |

**Phân tích Cohesion**:

| Service | Chức năng | Cohesion Level | Đánh giá |
|---------|-----------|---------------|----------|
| Catalog | Quản lý sản phẩm, tìm kiếm, danh mục | Functional | ✅ |
| Order | Quản lý đơn hàng, giỏ hàng, tính giá | Functional | ✅ |
| Payment | Xử lý thanh toán, hoàn tiền, billing | Functional | ✅ |
| Shipping | Quản lý vận chuyển, tracking, tính phí | Functional | ✅ |

### 7.2. Banking System

**Bài toán**: Hệ thống ngân hàng — yêu cầu cao về **consistency** và **security**.

```d2 title="7.2. Banking System"
direction: down
n1: "Banking Microservices" {}
n1.n2: "Account Service\n─────────────\ncreateAccount\ngetBalance\nfreezeAccount\nupdateKYC" {
  style.fill: "#4CAF50"
  style.font-color: "#fff"
}
n1.n3: "Transaction Service\n─────────────\ntransfer\ndeposit\nwithdraw\ngetHistory" {
  style.fill: "#2196F3"
  style.font-color: "#fff"
}
n1.n4: "Loan Service\n─────────────\napplyLoan\ncalculateEMI\nprocessRepayment\ncheckEligibility" {
  style.fill: "#FF9800"
  style.font-color: "#fff"
}
n1.n5: "Notification Service\n─────────────\nsendSMS\nsendEmail\nsendPush\nmanagePreferences" {
  style.fill: "#9C27B0"
  style.font-color: "#fff"
}
n1.n6: "Fraud Detection\n─────────────\nanalyzeTransaction\nscoreRisk\nblockSuspicious\nreportFraud" {
  style.fill: "#f44336"
  style.font-color: "#fff"
}
n7: "Event Bus"
n1.n3 -> n7: "event: TransferInitiated"
n7 -> n1.n6: "subscribe"
n7 -> n1.n5: "subscribe"
n1.n3 -> n1.n2: "sync call: validate balance"
n1.n4 -> n1.n2: "sync call: check account"
```

**Lưu ý đặc biệt cho Banking**:
- **Transaction Service → Account Service**: Dùng **sync call** (không phải async) vì cần **strong consistency** khi validate balance
- **Fraud Detection**: Nhận event **async** — không block transaction flow, phân tích sau (nếu phát hiện fraud → gọi sync để block)
- **Saga Pattern**: Dùng cho cross-service transaction (transfer giữa 2 account ở 2 service khác nhau)

---

## 8. Best Practices

### Checklist cho Loose Coupling

```
□ Mỗi service có database riêng
□ Giao tiếp qua API contract hoặc events, không gọi internal
□ Service có thể deploy độc lập (không cần deploy cùng service khác)
□ Service có thể scale độc lập
□ Khi 1 service down, các service khác vẫn hoạt động (graceful degradation)
□ API versioning được áp dụng (backward compatible)
□ Không share code library chứa business logic giữa các service
□ Ưu tiên async communication cho non-critical flows
□ Sync call depth ≤ 2 (A → B → C là tối đa)
□ Mỗi service có thể test độc lập (không cần start service khác)
```

### Checklist cho High Cohesion

```
□ Mỗi service có tối đa 1-2 lý do để thay đổi
□ Tất cả endpoints trong service thuộc cùng 1 bounded context
□ Service sở hữu toàn bộ data liên quan đến domain của nó
□ Khi thay đổi 1 business rule, chỉ cần sửa 1 service
□ Team size cho mỗi service: 3-8 người (2-pizza team)
□ Service name mô tả rõ ràng domain (không có "UtilService", "CommonService")
□ Không có "feature envy" (service A chứa logic lẽ ra thuộc service B)
□ Database schema phản ánh đúng domain model của service
```

### Nguyên tắc đặt tên service

| ❌ Tên xấu | ✅ Tên tốt | Lý do |
|-----------|-----------|-------|
| UtilityService | - | Không mô tả domain nào |
| DataService | CustomerService, OrderService | "Data" quá chung |
| ProcessingService | PaymentProcessingService | "Processing" không rõ nghĩa |
| HelperService | - | Nên gom logic vào service chính |
| MicroService1 | InventoryService | Tên phải mô tả nghiệp vụ |

---

## 9. Tổng kết

```
┌─────────────────────────────────────────────────────────────┐
│                      TÓM TẮT                                │
│                                                             │
│  LOOSE COUPLING                   HIGH COHESION             │
│  ─────────────                   ─────────────              │
│  • Giảm phụ thuộc giữa          • Gom logic liên quan       │
│    các service                    vào cùng 1 service        │
│  • Async > Sync                  • 1 service = 1 domain     │
│  • Database per Service          • SRP: 1 lý do thay đổi    │
│  • API Contract                  • "Change together =       │
│  • Event-Driven                    Stay together"           │
│                                                             │
│  ANTI-PATTERNS cần tránh:                                   │
│  ─────────────────────                                      │
│  • Distributed Monolith (tight coupling + low cohesion)     │
│  • Chatty Services (gọi chéo quá nhiều)                     │
│  • Shared Database (chia sẻ DB)                             │
│  • God Service (1 service làm quá nhiều việc)               │
│                                                             │
│  METRICS:                                                   │
│  ────────                                                   │
│  • Deploy Coupling Rate → 0%                                │
│  • Sync Call Depth ≤ 2                                      │
│  • Change Failure Rate < 5%                                 │
│  • Reason to Change = 1-2 per service                       │
│                                                             │
│  NGUYÊN TẮC VÀNG:                                           │
│  "Liên kết lỏng ở bên ngoài,                                │
│   gắn kết chặt ở bên trong"                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Liên kết liên quan

- ⬅️ [02 - Single Responsibility & Bounded Context](02-single-responsibility-bounded-context.md) — SRP và cách xác định ranh giới service
- ➡️ [04 - Autonomy & Independence](04-autonomy-independence.md) — Service autonomy, independent deployment
- 📖 [06 - Inter-Service Communication](06-inter-service-communication.md) — Chi tiết về sync vs async communication
- 📖 [09 - Data Management](09-data-management.md) — Database per Service, Saga Pattern
- 📖 [10 - Resilience Patterns](10-resilience-patterns.md) — Circuit Breaker, Fallback khi service khác không available
- 📖 [17 - Design Patterns](17-design-patterns.md) — Anti-patterns chi tiết
