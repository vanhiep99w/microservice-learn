# Inter-Service Communication — Giao tiếp giữa các Service

## 📋 Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
- [2. Synchronous Communication — Giao tiếp đồng bộ](#2-synchronous-communication--giao-tiếp-đồng-bộ)
  - [2.1. REST (HTTP/JSON)](#21-rest-httpjson)
  - [2.2. gRPC (HTTP/2 + Protobuf)](#22-grpc-http2--protobuf)
  - [2.3. GraphQL](#23-graphql)
  - [2.4. So sánh REST vs gRPC vs GraphQL](#24-so-sánh-rest-vs-grpc-vs-graphql)
- [3. Asynchronous Communication — Giao tiếp bất đồng bộ](#3-asynchronous-communication--giao-tiếp-bất-đồng-bộ)
  - [3.1. Tại sao cần Async?](#31-tại-sao-cần-async)
  - [3.2. Message Queue — Point-to-Point](#32-message-queue--point-to-point)
  - [3.3. Pub/Sub — Publish/Subscribe](#33-pubsub--publishsubscribe)
  - [3.4. Event Streaming — Event Log](#34-event-streaming--event-log)
  - [3.5. So sánh Message Queue vs Pub/Sub vs Event Streaming](#35-so-sánh-message-queue-vs-pubsub-vs-event-streaming)
- [4. Synchronous vs Asynchronous — Khi nào dùng gì?](#4-synchronous-vs-asynchronous--khi-nào-dùng-gì)
  - [4.1. Decision Framework](#41-decision-framework)
  - [4.2. Ví dụ thực tế — E-Commerce Order Flow](#42-ví-dụ-thực-tế--e-commerce-order-flow)
- [5. Event-Driven Architecture](#5-event-driven-architecture)
  - [5.1. Event-Driven là gì?](#51-event-driven-là-gì)
  - [5.2. Event types — Domain Event vs Integration Event](#52-event-types--domain-event-vs-integration-event)
  - [5.3. Choreography vs Orchestration — Phân biệt rõ ràng](#53-choreography-vs-orchestration--phân-biệt-rõ-ràng)
  - [5.4. Ví dụ thực tế — Food Delivery](#54-ví-dụ-thực-tế--food-delivery)
- [6. Communication Patterns nâng cao](#6-communication-patterns-nâng-cao)
  - [6.1. Request-Reply qua Message Queue](#61-request-reply-qua-message-queue)
  - [6.2. Saga Pattern (giới thiệu)](#62-saga-pattern-giới-thiệu)
  - [6.3. Outbox Pattern](#63-outbox-pattern)
  - [6.4. Dead Letter Queue](#64-dead-letter-queue)
- [7. Serialization Formats](#7-serialization-formats)
- [8. Anti-patterns](#8-anti-patterns)
- [9. Checklist chọn Communication Style](#9-checklist-chọn-communication-style)
- [10. Tổng kết](#10-tổng-kết)
- [11. Liên kết liên quan](#11-liên-kết-liên-quan)

---

## 1. Giới thiệu

Trong các doc trước, chúng ta đã tìm hiểu cách **tách service** ([doc 05](05-decomposition-strategies.md)) và đảm bảo **tính độc lập** ([doc 04](04-autonomy-independence.md)). Nhưng dù độc lập đến mấy, các service vẫn cần **giao tiếp** với nhau để hoàn thành nghiệp vụ.

Cách các service giao tiếp là **quyết định thiết kế quan trọng nhất** — nó ảnh hưởng trực tiếp đến **hiệu năng**, **reliability**, và **mức độ coupling** của hệ thống (xem [doc 03](03-loose-coupling-high-cohesion.md)).

```d2 title="1. Giới thiệu"
direction: right
sync: "Synchronous — Request/Response\nCaller chờ • Coupling cao hơn • Đơn giản hơn" {
 rest: REST — HTTP
 grpc: gRPC — HTTP/2
 graphql: GraphQL
}
async: "Asynchronous — Fire & Forget / Event\nCaller không chờ consumer • Phức tạp hơn" {
 queue: Message Queue
 pubsub: Pub/Sub
 stream: Event Stream
}
```

---

## 2. Synchronous Communication — Giao tiếp đồng bộ

Service A gọi Service B và **chờ response** trước khi tiếp tục. Giống như gọi điện thoại — hai bên phải **cùng online**.

```d2 title="2. Synchronous Communication — Giao tiếp đồng bộ"
shape: sequence_diagram
a: Service A
b: Service B
a -> b: Request
b.note1: Xử lý — A chờ response
b -> a: Response {style.stroke-dash: 5}
a.note2: Tiếp tục xử lý
```

### 2.1. REST (HTTP/JSON)

**REST** (Representational State Transfer) là phong cách giao tiếp phổ biến nhất trong microservice, sử dụng HTTP methods và JSON.

```
REST API — Các HTTP Methods:
────────────────────────────

GET    /api/products              → Lấy danh sách products
GET    /api/products/123          → Lấy product có id=123
POST   /api/products              → Tạo product mới
PUT    /api/products/123          → Cập nhật toàn bộ product 123
PATCH  /api/products/123          → Cập nhật 1 phần product 123
DELETE /api/products/123          → Xóa product 123
```

```protocol-exchange
title: Tạo order qua HTTP
variants:
  - id: created
    title: Order được tạo
    request:
      method: POST
      url: /api/orders
      headers:
        - id: content
          name: Content-Type
          value: application/json
        - id: auth
          name: Authorization
          value: Bearer DEMO_NOT_A_REAL_TOKEN
      body:
        kind: json
        json: |-
          {
            "productId": 123,
            "quantity": 2,
            "shippingAddress": "123 Nguyen Hue, HCM"
          }
    response:
      status: 201
      statusText: Created
      headers:
        - id: content
          name: Content-Type
          value: application/json
      body:
        kind: json
        json: |-
          {
            "id": 456,
            "status": "CREATED",
            "totalAmount": 500000,
            "createdAt": "2026-02-23T10:30:00Z"
          }
```

Request/response tĩnh, credential giả lập; component không gửi request.

**201 mô tả kết quả tạo mới:** Status và body là contract của API; viewer không thực thi validation hoặc tạo order.

**REST Maturity Model** (Richardson):

| Level | Tên | Mô tả | Ví dụ |
|-------|-----|--------|-------|
| **0** | The Swamp of POX | 1 URL, 1 method POST cho mọi thứ | `POST /api` với action trong body |
| **1** | Resources | URL riêng cho mỗi resource, nhưng chỉ dùng POST | `POST /api/orders`, `POST /api/products` |
| **2** | HTTP Verbs | Dùng đúng HTTP methods (GET, POST, PUT, DELETE) | `GET /api/orders/123`, `DELETE /api/orders/123` |
| **3** | HATEOAS | Response chứa links tới các action tiếp theo | Response có `"links": [{"rel": "cancel", "href": "/orders/123/cancel"}]` |

> **Thực tế**: Hầu hết microservice dùng REST **Level 2**. HATEOAS (Level 3) hiếm khi được implement vì overhead cao, lợi ích ít trong internal communication.

**Ưu và nhược:**

| ✅ Ưu điểm | ❌ Nhược điểm |
|------------|--------------|
| Đơn giản, mọi developer đều biết | Text-based (JSON) → payload lớn hơn binary |
| Tooling phong phú (Postman, Swagger) | HTTP/1.1 → 1 connection = 1 request tại 1 thời điểm |
| Stateless — dễ scale | Không có contract mạnh (schema optional) |
| Human-readable | Không hỗ trợ streaming natively |
| Firewall-friendly (port 80/443) | |

### 2.2. gRPC (HTTP/2 + Protobuf)

**gRPC** (Google Remote Procedure Call) sử dụng **HTTP/2** và **Protocol Buffers** (Protobuf) — binary serialization format.

```
gRPC vs REST — Khác biệt cốt lõi:
───────────────────────────────────

REST:                               gRPC:
  HTTP/1.1                            HTTP/2
  Text (JSON)                         Binary (Protobuf)
  Loose contract (OpenAPI optional)   Strict contract (.proto file BẮT BUỘC)
  Unary only                          Unary + Streaming
  Mọi ngôn ngữ đều hỗ trợ sẵn        Cần generate code từ .proto
```

**Protobuf definition file (.proto):**

```
// order_service.proto

syntax = "proto3";

package order;

service OrderService {
  // Unary RPC — giống REST: 1 request → 1 response
  rpc CreateOrder(CreateOrderRequest) returns (OrderResponse);
  rpc GetOrder(GetOrderRequest) returns (OrderResponse);
  
  // Server streaming — server gửi nhiều response
  rpc TrackOrder(TrackOrderRequest) returns (stream OrderStatus);
  
  // Client streaming — client gửi nhiều request
  rpc UploadOrderItems(stream OrderItem) returns (UploadSummary);
  
  // Bidirectional streaming — cả hai chiều
  rpc OrderChat(stream ChatMessage) returns (stream ChatMessage);
}

message CreateOrderRequest {
  int64 product_id = 1;
  int32 quantity = 2;
  string shipping_address = 3;
}

message OrderResponse {
  int64 id = 1;
  string status = 2;
  int64 total_amount = 3;
}
```

**4 loại RPC trong gRPC:**

```d2 title="2.2. gRPC (HTTP/2 + Protobuf)"
direction: down
unary: "1. Unary — 1:1" {
 client: Client
 server: Server
 client -> server: Request
 server -> client: Response
}
server_stream: "2. Server Streaming — 1:N" {
 client: Client
 server: Server
 client -> server: Request
 server -> client: Response 1, 2, ..., N
}
client_stream: "3. Client Streaming — N:1" {
 client: Client
 server: Server
 client -> server: Request 1, 2, ..., N
 server -> client: Response
}
bidi: "4. Bidirectional Streaming — N:N" {
 client: Client
 server: Server
 client <-> server: Cùng lúc — hai chiều độc lập
}
# Icons: https://icons.d2lang.com/
unary.server.icon: "https://icons.d2lang.com/tech/022-server.svg"
server_stream.server.icon: "https://icons.d2lang.com/tech/022-server.svg"
client_stream.server.icon: "https://icons.d2lang.com/tech/022-server.svg"
bidi.server.icon: "https://icons.d2lang.com/tech/022-server.svg"
```

Unary giống REST request/response. Server Streaming: real-time tracking, live feed. Client Streaming: upload batch data, log streaming. Bidirectional: chat, real-time collaboration.

**Ưu và nhược:**

| ✅ Ưu điểm | ❌ Nhược điểm |
|------------|--------------|
| Binary → nhanh hơn JSON **2-10x** | Không human-readable (debug khó hơn) |
| HTTP/2 → multiplexing, header compression | Browser support hạn chế (cần gRPC-Web proxy) |
| Strict contract (.proto) → ít lỗi integration | Cần generate code → thêm bước build |
| Streaming support native | Firewall/proxy có thể block HTTP/2 |
| Code generation cho nhiều ngôn ngữ | Learning curve cao hơn REST |

### 2.3. GraphQL

**GraphQL** cho phép client **chỉ lấy đúng data mình cần** thay vì nhận toàn bộ response cố định.

```
Vấn đề của REST — Over-fetching & Under-fetching:
──────────────────────────────────────────────────

Over-fetching: Lấy quá nhiều data
  GET /api/users/123
  Response: { id, name, email, phone, address, avatar, bio, 
              createdAt, settings, preferences, ... }
  → Client chỉ cần name và avatar → lãng phí bandwidth

Under-fetching: Phải gọi nhiều API
  GET /api/users/123           → lấy user info
  GET /api/users/123/orders    → lấy orders
  GET /api/orders/456/items    → lấy order items
  → 3 round-trips cho 1 trang → chậm

GraphQL giải quyết cả hai:
  POST /graphql
  {
    query {
      user(id: 123) {
        name
        avatar
        orders(last: 5) {
          id
          status
          items {
            productName
            price
          }
        }
      }
    }
  }
  → 1 request, chỉ lấy đúng fields cần → nhanh
```

**Ưu và nhược:**

| ✅ Ưu điểm | ❌ Nhược điểm |
|------------|--------------|
| Client quyết định data shape → flexible | Phức tạp ở server (resolver, N+1 query problem) |
| 1 endpoint, 1 request → giảm round-trips | Caching khó hơn REST (không dùng HTTP cache dễ dàng) |
| Strong typing (schema) | Security: phải giới hạn query depth, complexity |
| Self-documenting (introspection) | Overkill cho service-to-service đơn giản |

> **Trong Microservice**: GraphQL thường dùng ở **API Gateway / BFF layer** (client → gateway). Service-to-service thường dùng **REST hoặc gRPC**.

### 2.4. So sánh REST vs gRPC vs GraphQL

| Tiêu chí | REST | gRPC | GraphQL |
|----------|------|------|---------|
| **Protocol** | HTTP/1.1 (hoặc 2) | HTTP/2 | HTTP/1.1 (hoặc 2) |
| **Format** | JSON (text) | Protobuf (binary) | JSON (text) |
| **Contract** | OpenAPI (optional) | .proto (bắt buộc) | Schema (bắt buộc) |
| **Performance** | Trung bình | Cao nhất | Trung bình |
| **Streaming** | Không (cần WebSocket) | Có (4 loại) | Có (Subscription) |
| **Browser support** | Tốt nhất | Cần proxy (gRPC-Web) | Tốt |
| **Learning curve** | Thấp | Trung bình | Trung bình–Cao |
| **Tooling** | Rất phong phú | Đang phát triển | Phong phú |
| **Phù hợp cho** | Public API, CRUD services | Service-to-service nội bộ, high-perf | Client-facing API, BFF |
| **Khi nào chọn** | Mặc định, đơn giản nhất | Cần tốc độ, streaming, strict contract | Client cần flexible query |

```
Chọn nhanh:
────────────

Public API cho external clients?          → REST
Service-to-service nội bộ, cần nhanh?     → gRPC
Client cần flexible data fetching?        → GraphQL (ở API Gateway)
Không biết chọn gì?                       → REST (safe default)
```

---

## 3. Asynchronous Communication — Giao tiếp bất đồng bộ

### 3.1. Tại sao cần Async?

Service A gửi message và **không chờ** response. Giống như gửi email — bạn gửi xong rồi làm việc khác, người nhận xử lý khi nào tùy họ.

```d2 title="3.1. Tại sao cần Async?"
direction: down
sync: "Sync — tổng latency minh họa 350ms" {
 order: Order Service
 payment: Payment Service
 inventory: Inventory Service
 order -> payment: "Charge 100 USD — chờ 200ms"
 payment -> order: OK
 order -> inventory: Reserve stock — chờ 150ms
 inventory -> order: OK
}
async: "Async — publish minh họa 5ms, không chờ consumer" {
 order: Order Service
 broker: Message Broker
 payment: Payment Service
 inventory: Inventory Service
 notification: Notification Service
 order -> broker: OrderCreated
 broker -> payment
 broker -> inventory
 broker -> notification
}
```

Sync tạo temporal coupling: ba service phải online cùng lúc, Payment lỗi ảnh hưởng Order. Async cho phép message đợi trong queue khi Payment down và xử lý sau khi phục hồi; Order tiếp tục sau publish. Số latency là minh họa, không phải SLA.

### 3.2. Message Queue — Point-to-Point

**Message Queue**: Producer gửi message vào queue, **1 consumer** nhận và xử lý.

```d2 title="3.2. Message Queue — Point-to-Point"
direction: right
producer: "Producer"
queue: "Queue\nmsg1 • msg2 • msg3"
consumer: "Một consumer cho mỗi lần delivery"
order: "Order Service"
email: "email-queue\nGửi email xác nhận đơn 456"
worker: "Email Worker"
producer -> queue
queue -> consumer
consumer -> queue: "Acknowledge khi xử lý xong"
order -> email
email -> worker
```

Point-to-point phân phối mỗi lần delivery tới một consumer trong nhóm để load balance. Acknowledge/delete sau xử lý; ordering/FIFO tùy broker và cấu hình. Redelivery vẫn có thể xảy ra nên email worker cần chống trùng/idempotency. Tools: RabbitMQ, Amazon SQS, ActiveMQ.

### 3.3. Pub/Sub — Publish/Subscribe

**Pub/Sub**: Publisher gửi event vào topic, **tất cả subscribers** đều nhận được.

```d2 title="3.3. Pub/Sub — Publish/Subscribe"
direction: right
order: "Order Service — Publisher"
topic: "Topic order.created\nOrderCreated {orderId:456, userId:123, amount:500000}"
payment: "Payment — Charge tiền"
inventory: "Inventory — Reserve stock"
notification: "Notification — Email xác nhận"
analytics: "Analytics — Track conversion"
order -> topic
topic -> payment
topic -> inventory
topic -> notification
topic -> analytics
```

Một event tới nhiều subscribers; đọc ở một subscriber không đồng nghĩa các subscriber khác mất event. Cursor/offset riêng và retention phụ thuộc broker; thêm subscriber không phải sửa publisher. Tools: Kafka, Google Pub/Sub, SNS, Redis Streams.

### 3.4. Event Streaming — Event Log

**Event Streaming**: Giống Pub/Sub nhưng message được **lưu lại vĩnh viễn** (hoặc lâu dài) như một log. Consumer có thể **replay** từ bất kỳ thời điểm nào.

```d2 title="3.4. Event Streaming — Event Log"
direction: right
producer: "Producer"
log: "Topic orders — retained Event Log\n0: OrderCreated {id:1}\n1: OrderCreated {id:2}\n2: OrderPaid {id:1}\n3: OrderShipped {id:1}\n4: OrderCreated {id:3}"
a: "Consumer A — offset 4\nĐã đọc tới cuối ví dụ"
b: "Consumer B — offset 2\nĐang bắt kịp"
c: "Consumer C — offset 0\nMới join, replay từ đầu"
producer -> log
log -> a
log -> b
log -> c
```

Messages không bị xóa ngay khi consume; có thể replay từ offset trong retention. Retention có thể 7 ngày, 30 ngày hoặc lâu dài theo cấu hình. Use cases: Event Sourcing khi đáp ứng yêu cầu lưu trữ/order, ETL/analytics, audit log, rebuild state. Tools: Kafka, Kinesis, Redpanda, Pulsar.

### 3.5. So sánh Message Queue vs Pub/Sub vs Event Streaming

| Tiêu chí | Message Queue | Pub/Sub | Event Streaming |
|----------|---------------|---------|-----------------|
| **Consumer model** | 1 message → 1 consumer | 1 message → N subscribers | 1 message → N consumers + replay |
| **Message sau khi đọc** | Xóa (acknowledge) | Xóa sau TTL | Giữ lại (retention) |
| **Replay** | ❌ Không | ❌ Thường không | ✅ Có |
| **Ordering** | FIFO (queue level) | Không guarantee | Ordering trong partition |
| **Use case** | Task distribution, work queue | Event notification, fan-out | Event sourcing, data pipeline, audit |
| **Ví dụ tool** | RabbitMQ, SQS | Google Pub/Sub, SNS | Kafka, Kinesis |
| **Throughput** | Trung bình | Cao | Rất cao |

---

## 4. Synchronous vs Asynchronous — Khi nào dùng gì?

### 4.1. Decision Framework

```d2 title="4.1. Decision Framework"
direction: down
n1: "Service A cần giao tiếp\nvới Service B"
n2: "Caller CẦN response\nngay lập tức?" {
  shape: diamond
}
n3: "Response cần\ntrong bao lâu?" {
  shape: diamond
}
n4: "Sync: REST hoặc gRPC"
n5: "Async + Webhook/Polling\nhoặc WebSocket"
n6: "Cần đảm bảo\nmessage được xử lý?" {
  shape: diamond
}
n7: "Async: Message Queue\n(RabbitMQ, SQS)"
n8: "Có nhiều consumers\ncần nhận event?" {
  shape: diamond
}
n9: "Async: Pub/Sub hoặc\nEvent Streaming (Kafka)"
n1 -> n2
n2 -> n3: "Có"
n3 -> n4: "< 500ms"
n3 -> n5: "> 500ms"
n2 -> n6: "Không"
n6 -> n7: "Có"
n6 -> n8: "Không nhất thiết"
n8 -> n9: "Có"
n8 -> n7: "Không"
```

| Scenario | Chọn | Lý do |
|----------|------|-------|
| Lấy thông tin product để hiển thị | **Sync (REST/gRPC)** | Cần data ngay để render UI |
| Gửi email xác nhận đơn hàng | **Async (Queue)** | Không cần gửi ngay, retry nếu lỗi |
| Thông báo "đơn hàng đã tạo" cho nhiều service | **Async (Pub/Sub)** | Fan-out cho Payment, Inventory, Notification |
| Real-time order tracking | **Streaming (gRPC/WebSocket)** | Cần push update liên tục |
| Data pipeline từ order → analytics | **Event Streaming (Kafka)** | Cần replay, high throughput |
| Thanh toán (cần biết kết quả ngay) | **Sync (REST)** | User chờ xem thanh toán thành công hay không |
| Xử lý ảnh sau khi upload | **Async (Queue)** | Heavy processing, user không cần chờ |

### 4.2. Ví dụ thực tế — E-Commerce Order Flow

```d2 title="Order Flow — kết hợp Sync và Async"
direction: down
user: "User — đặt hàng"
gateway: API Gateway
order: Order Service
product: Product Service
payment: Payment Service
kafka: "Kafka\nTopic orders"
inventory: "Inventory Service\nReserve stock"
notification: "Notification Service\nGửi email xác nhận"
analytics: "Analytics Service\nTrack conversion"
user -> gateway
gateway -> order: REST sync
order -> product: "gRPC sync — giá, tồn kho"
product -> order: Kết quả
order -> payment: "REST sync — Charge \$100"
payment -> order: OK
order -> kafka: Publish OrderCreated
order -> user: Đơn hàng 456 đã được tạo
kafka -> inventory: Async
kafka -> notification: Async
kafka -> analytics: Async
```

---

## 5. Event-Driven Architecture

### 5.1. Event-Driven là gì?

**Event-Driven Architecture** (EDA) là kiến trúc mà các service giao tiếp bằng cách **phát ra events** (sự kiện) khi có thay đổi, thay vì gọi trực tiếp service khác.

```
Khác biệt tư duy:
──────────────────

Command-Driven (imperative):        Event-Driven (reactive):
"Hãy làm việc này"                  "Việc này ĐÃ XẢY RA"

Order Service:                      Order Service:
  → gọi Payment.charge()             → publish OrderCreated event
  → gọi Inventory.reserve()          
  → gọi Notification.send()         Payment Service: "Ồ, có order mới → charge"
                                    Inventory: "Ồ, có order mới → reserve"
                                    Notification: "Ồ, có order mới → email"

Order Service BIẾT về 3 service      Order Service KHÔNG BIẾT ai đang lắng nghe
→ Tight coupling                    → Loose coupling
```

### 5.2. Event types — Domain Event vs Integration Event

| | Domain Event | Integration Event |
|---|---|---|
| **Scope** | Bên trong 1 service (internal) | Giữa các services (external) |
| **Audience** | Các aggregate/module trong cùng service | Các service khác |
| **Transport** | In-memory (event bus nội bộ) | Message broker (Kafka, RabbitMQ) |
| **Schema** | Internal model, có thể thay đổi tự do | Public contract, phải backward compatible |
| **Ví dụ** | `OrderItemAdded` (internal) | `OrderCreated` (publish ra ngoài) |

```d2 title="5.2. Event types — Domain Event vs Integration Event"
direction: right
action: "User tạo đơn hàng"
internal: "Domain Events — xử lý nội bộ\nOrderItemAdded\nOrderPriceCalculated\nOrderValidated"
integration: "Integration Event\nOrderCreated"
kafka: "Kafka — thông báo cho service khác"
action -> internal
internal -> integration
integration -> kafka
```

### 5.3. Choreography vs Orchestration — Phân biệt rõ ràng

> ⚠️ **Lưu ý quan trọng**: Orchestration **KHÔNG phải** Event-Driven. Hai mô hình này có **tư duy hoàn toàn khác nhau**, chỉ thường bị nhầm lẫn vì cùng được nhắc khi nói về workflow coordination.

```
Bản chất khác nhau:
───────────────────

CHOREOGRAPHY (Event-Driven ✅):
  Tư duy: "Việc này ĐÃ XẢY RA" (past tense, fact)
  Service publish EVENT → không biết ai lắng nghe
  Mỗi service TỰ QUYẾT ĐỊNH phản ứng khi nhận event
  → Không ai điều khiển → Loose coupling

ORCHESTRATION (Command-Driven ❌ không phải EDA):
  Tư duy: "HÃY LÀM việc này" (imperative, command)
  Orchestrator gửi COMMAND → biết rõ gửi cho ai
  Orchestrator QUYẾT ĐỊNH service nào làm gì, khi nào
  → Có "ông chủ" điều khiển → Tight coupling tập trung
```

```d2 title="5.3. Choreography vs Orchestration — Phân biệt rõ ràng"
direction: down
choreography: "Choreography — không coordinator sở hữu toàn flow" {
 order: Order Service
 payment: Payment Service — tự charge
 inventory: Inventory Service — tự reserve
 notification: Notification Service — tự email
 shipping: Shipping Service — tự tạo shipment
 order -> payment: OrderCreated — Event
 order -> inventory: OrderCreated — Event
 order -> notification: OrderCreated — Event
 payment -> shipping: PaymentCompleted — Event
}
orchestration: "Orchestration — flow tập trung tại Orchestrator" {
 order: Order Orchestrator
 payment: Payment Service
 inventory: Inventory Service
 shipping: Shipping Service
 order -> payment: 1. Charge tiền — Command
 payment -> order: 2. OK
 order -> inventory: 3. Reserve stock — Command
 inventory -> order: 4. OK
 order -> shipping: 5. Tạo shipment — Command
 shipping -> order: 6. OK
}
```

Choreography: producer không biết subscribers; service tự chứa logic phản ứng; thêm consumer không đổi producer. Orchestration: coordinator biết đích và thứ tự, thêm bước phải sửa flow. Ví dụ command-driven này khác event choreography; orchestration vẫn có thể dùng messaging làm transport.

**Tại sao Orchestration phá vỡ Event-Driven?**

```
Event-Driven cốt lõi:                Orchestration vi phạm:
─────────────────────                ──────────────────────

1. Producer không biết               Orchestrator biết RÕ
   consumer là ai                    từng service

2. Loose coupling —                  Tight coupling —
   services độc lập                  orchestrator phụ thuộc
                                     TẤT CẢ services

3. Reactive — service                Imperative — orchestrator
   tự quyết phản ứng                 ra lệnh phải làm gì

4. Decentralized logic —             Centralized logic —
   mỗi service giữ logic            flow logic tập trung
   của mình                          1 chỗ

5. Thêm consumer KHÔNG               Thêm step PHẢI SỬA
   cần sửa producer                  orchestrator
```

```d2 title="5.3. Choreography vs Orchestration — Phân biệt rõ ràng"
direction: right
n2: "Orchestration — Command-Driven ❌" {}
n1: "Choreography — Event-Driven ✅" {}
n1.n3: "Order"
n1.n4: "Payment"
n1.n5: "Inventory"
n1.n6: "Shipping"
n2.n7: "Orchestrator\n(God service)"
n2.n8: "Payment"
n2.n9: "Inventory"
n2.n10: "Shipping"
n1.n3 -> n1.n4: "OrderCreated\n(event)"
n1.n4 -> n1.n5: "PaymentCompleted\n(event)"
n1.n5 -> n1.n6: "StockReserved\n(event)"
n2.n7 -> n2.n8: "ChargePayment\n(command)"
n2.n7 -> n2.n9: "ReserveStock\n(command)"
n2.n7 -> n2.n10: "CreateShipment\n(command)"
```

**Vậy Orchestration có xấu không? Khi nào vẫn nên dùng?**

Orchestration **không xấu** — nó chỉ không phải Event-Driven. Có những trường hợp orchestration là **lựa chọn thực tế hơn**:

| Tiêu chí | Choreography (EDA) | Orchestration (Command) |
|----------|-------------|---------------|
| **Tư duy** | Events (sự kiện đã xảy ra) | Commands (lệnh phải thực hiện) |
| **Coupling** | Rất loose | Tập trung ở orchestrator |
| **Flow đơn giản, linear** | ✅ Phù hợp nhất | Overkill |
| **Flow phức tạp, branching, conditions** | ❌ Logic phân tán, khó debug | ✅ Logic tập trung, dễ đọc |
| **Error handling / rollback** | Khó — compensating events phân tán | Dễ — orchestrator quản lý tập trung |
| **Visibility** | Khó thấy toàn cảnh (phải trace events) | Dễ — nhìn orchestrator là thấy flow |
| **Thêm service mới** | Dễ — chỉ subscribe | Phải sửa orchestrator |
| **Ví dụ phù hợp** | Notification, Analytics, Audit log | Saga (distributed transaction), phức tạp |

> **Nguyên tắc**: Ưu tiên **Choreography** (event-driven) làm mặc định. Chỉ dùng **Orchestration** khi flow **quá phức tạp** để mỗi service tự biết mình phải làm gì (ví dụ: Saga cần rollback nhiều bước). Và khi dùng Orchestration, hãy ý thức rằng bạn đang **trade-off** loose coupling để đổi lấy visibility và error handling dễ hơn.

### 5.4. Ví dụ thực tế — Food Delivery

```d2 title="5.4. Ví dụ thực tế — Food Delivery"
direction: down
user: "User đặt đồ ăn"
order: "Order Service"
event: "OrderCreated\norderId, userId, restaurantId, items, totalAmount"
restaurant: "Restaurant Service\nAccept / Reject order"
payment: "Payment Service\nCharge user"
notify_pending: "Notification\nPush: Đang xử lý"
accepted: "OrderAccepted"
paid: "PaymentCompleted"
join: "Đủ OrderAccepted VÀ PaymentCompleted"
delivery: "Delivery Service\nAssign driver gần nhất"
assigned: "DriverAssigned\ndriverId, ETA"
notify_driver: "Notification\nPush: Tài xế đang đến"
pickup: "DriverPickedUp"
delivered: "OrderDelivered"
release: "Payment Service\nRelease payment to restaurant"
notify_done: "Notification\nPush: Đã giao xong"
user -> order
order -> event: "Publish"
event -> restaurant
event -> payment
event -> notify_pending
restaurant -> accepted
payment -> paid
accepted -> join
paid -> join
join -> delivery
delivery -> assigned: "Publish"
assigned -> notify_driver
delivery -> pickup
pickup -> delivered
delivered -> release
delivered -> notify_done
```

---

## 6. Communication Patterns nâng cao

### 6.1. Request-Reply qua Message Queue

Khi cần **response** nhưng vẫn muốn **decouple** qua message broker:

```d2 title="6.1. Request-Reply qua Message Queue"
shape: sequence_diagram
a: Service A
broker: Broker
b: Service B
a -> broker: Request message — replyTo queue-A
broker -> b: Forward
b.note: Xử lý request
b -> broker: Reply message — to queue-A
broker -> a: Response {style.stroke-dash: 5}
a.note: Match request/response bằng Correlation ID
```

Dùng khi cần response nhưng muốn buffer, retry/resilience qua broker và chấp nhận latency cao hơn sync call. Service A lắng nghe reply queue; Service B gửi response đúng `replyTo`.

### 6.2. Saga Pattern (giới thiệu)

**Saga** quản lý distributed transaction qua chuỗi local transactions + compensating actions:

```
Saga — Place Order:
───────────────────

Happy path:
  1. Order Service:    Create order (PENDING)        ✅
  2. Payment Service:  Charge money                  ✅
  3. Inventory Service: Reserve stock                ✅
  4. Order Service:    Update order (CONFIRMED)      ✅

Failure (step 3 fails):
  1. Order Service:    Create order (PENDING)        ✅
  2. Payment Service:  Charge money                  ✅
  3. Inventory Service: Reserve stock                ❌ FAIL
  → Compensate:
  2'. Payment Service: REFUND money                  ↩️
  1'. Order Service:   Update order (CANCELLED)      ↩️
  
  Mỗi step thất bại → chạy compensating action ngược lại
```

> **Chi tiết**: Saga Pattern sẽ được trình bày kỹ trong [doc 09 — Data Management](09-data-management.md).

### 6.3. Outbox Pattern

**Vấn đề**: Khi service cần **cập nhật DB** VÀ **publish event** — làm sao đảm bảo cả hai đều xảy ra (hoặc đều không)?

```d2 title="Transactional Outbox — tránh Dual Write"
direction: right
service: Order Service {
 tx: "Một local DB transaction" {
  orders: "orders\nid 456 • status CREATED" {shape: cylinder}
  outbox: "outbox\nid 1 • type OrderCreated\npayload {id:456}\npublished false" {shape: cylinder}
 }
 publisher: "Outbox Publisher\nPoll → Publish → Mark published"
 tx.outbox -> publisher
}
kafka: Kafka Broker
service.publisher -> kafka
```

**Dual Write không an toàn:** save order thành công nhưng broker down có thể làm mất event. Outbox ghi `orders` và `outbox` trong cùng transaction; worker publish sau. Đây là **at-least-once delivery**, consumer vẫn phải idempotent; không phải một distributed transaction atomic với broker.

### 6.4. Dead Letter Queue

**Dead Letter Queue** (DLQ) chứa messages **không thể xử lý** sau nhiều lần retry:

```d2 title="6.4. Dead Letter Queue"
direction: down
producer: "Producer"
queue: "Main Queue"
consumer: "Consumer"
result: "Xử lý thành công?"
ack: "Acknowledge / Delete"
retry: "Lỗi — tăng số lần thử"
max: "Đạt giới hạn minh họa 3 lần?"
dlq: "Dead Letter Queue"
review: "Alert team → Manual review\nFix bug → Replay"
producer -> queue
queue -> consumer
consumer -> result
result -> ack: "Có"
result -> retry: "Không"
retry -> max
max -> queue: "Chưa đạt — retry"
max -> dlq: "Đạt"
dlq -> review
```

DLQ cô lập poison message, tránh block queue, giữ message để điều tra và replay sau khi fix.

---

## 7. Serialization Formats

Khi gửi data giữa services, cần **serialize** (chuyển object → bytes) và **deserialize** (bytes → object):

| Format | Loại | Size | Speed | Human-readable | Schema | Phù hợp |
|--------|------|------|-------|:--------------:|--------|---------|
| **JSON** | Text | Lớn | Chậm | ✅ | Optional (JSON Schema) | REST API, config, log |
| **Protobuf** | Binary | Nhỏ nhất | Nhanh nhất | ❌ | Bắt buộc (.proto) | gRPC, internal high-perf |
| **Avro** | Binary | Nhỏ | Nhanh | ❌ | Bắt buộc (JSON schema) | Kafka events, data pipeline |
| **MessagePack** | Binary | Nhỏ | Nhanh | ❌ | Không | Thay thế JSON khi cần nhanh hơn |
| **XML** | Text | Rất lớn | Chậm | ✅ | XSD | Legacy systems, SOAP |

```
So sánh kích thước cùng 1 data:
───────────────────────────────

JSON (95 bytes):
  {"id":123,"name":"iPhone 15","price":29990000,"inStock":true}

Protobuf (~30 bytes):
  08 7B 12 09 69 50 68 6F 6E 65 20 31 35 18 E0 C7 ...
  
  → Protobuf nhỏ hơn ~3x so với JSON

Avro (~35 bytes):
  (tương tự binary, schema lưu riêng trong Schema Registry)
```

> **Khuyến nghị**: JSON cho REST public API, Protobuf cho gRPC internal, Avro cho Kafka events.

---

## 8. Anti-patterns

| Anti-pattern | Mô tả | Triệu chứng | Cách fix |
|-------------|--------|-------------|----------|
| **Chatty Services** | Service gọi nhau quá nhiều lần cho 1 operation | 1 user request → 20+ internal calls, latency cao | Batch API, BFF pattern, hoặc gộp service |
| **Sync Chain** | Service A → B → C → D (sync chain dài) | Latency = tổng latency cả chain, 1 service down = cả chain down | Dùng async cho các bước không cần response ngay |
| **Temporal Coupling** | Tất cả services phải online cùng lúc | Hệ thống down khi 1 service down | Dùng message queue để decouple |
| **God Event** | 1 event chứa quá nhiều data | Event payload 10KB+, consumer phải parse nhiều field không cần | Tách thành nhiều events nhỏ, consumer chỉ subscribe events cần |
| **Event Versioning Ignored** | Thay đổi event schema không backward compatible | Consumer cũ parse lỗi event mới | Schema Registry (Avro), versioned events |
| **No Idempotency** | Consumer xử lý duplicate message 2 lần | Charge tiền 2 lần, gửi 2 email | Idempotency key, deduplication |
| **Distributed Monolith** | Sync calls everywhere, shared DB | Deploy 1 service → phải test lại tất cả | Async communication, database per service |

```d2 title="8. Anti-patterns"
direction: down
sync: "Sync Chain — ví dụ 430ms, Fraud down ảnh hưởng cả flow" {
 client: Client
 gw: API Gateway
 order: Order
 payment: Payment
 fraud: Fraud
 bank: Bank API
 client -> gw -> order -> payment -> fraud -> bank
}
hybrid: "Hybrid — ví dụ 150ms trên đường trả response" {
 client: Client
 gw: API Gateway
 order: Order
 payment: Payment
 fraud: Fraud Check — background
 notification: Notification
 analytics: Analytics
 client -> gw -> order
 order -> payment: Sync — cần kết quả
 order -> fraud: Async
 order -> notification: Async
 order -> analytics: Async
}
```

Latency minh họa của sync là 50 + 100 + 80 + 200 = 430ms, hybrid là 50 + 100 = 150ms. Chỉ chuyển fraud check sang background khi business/security policy cho phép; dependency down không còn chặn response không có nghĩa được bỏ kiểm soát rủi ro.

---

## 9. Checklist chọn Communication Style

```
TRƯỚC KHI CHỌN — Trả lời các câu hỏi:

Về tính chất giao tiếp:
  □ Caller có CẦN response ngay không?
    → Có: Sync (REST/gRPC)
    → Không: Async (Queue/Pub-Sub)
  
  □ Có nhiều consumers cần nhận cùng 1 event?
    → Có: Pub/Sub hoặc Event Streaming
    → Không: Point-to-Point Queue
  
  □ Consumer cần replay events từ quá khứ?
    → Có: Event Streaming (Kafka)
    → Không: Message Queue hoặc Pub/Sub

Về performance:
  □ Latency budget là bao nhiêu?
    → < 100ms: gRPC
    → < 500ms: REST
    → Không quan trọng: Async
  
  □ Throughput cần bao nhiêu?
    → < 1000 req/s: REST đủ
    → > 10000 req/s: gRPC hoặc Kafka

Về reliability:
  □ Message KHÔNG ĐƯỢC mất?
    → Dùng persistent queue + acknowledgment
    → Outbox pattern cho dual write
  
  □ Consumer có thể nhận duplicate?
    → Phải implement idempotency
  
  □ Service downstream có thể down?
    → Dùng async + retry + DLQ
```

---

## 10. Tổng kết

```
┌──────────────────────────────────────────────────────────────────┐
│           COMMUNICATION CHEAT SHEET                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                    SYNCHRONOUS                          │     │
│  │                                                         │     │
│  │  REST     → Default choice, public API, CRUD            │     │
│  │  gRPC     → Internal high-perf, streaming, strict type  │     │
│  │  GraphQL  → Client-facing, flexible queries (ở Gateway) │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                    ASYNCHRONOUS                         │     │
│  │                                                         │     │
│  │  Queue    → 1 producer → 1 consumer, task distribution  │     │
│  │  Pub/Sub  → 1 event → N subscribers, fan-out            │     │
│  │  Kafka    → Event streaming, replay, high throughput    │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                    QUY TẮC VÀNG                         │     │
│  │                                                         │     │
│  │  1. Mặc định dùng ASYNC trừ khi CẦN response ngay       │     │
│  │  2. Sync cho QUERY, Async cho COMMAND                   │     │
│  │  3. Tránh sync chain dài > 3 services                   │     │
│  │  4. Luôn implement IDEMPOTENCY cho async consumer       │     │
│  │  5. Dùng Outbox Pattern khi cần DB write + event        │     │
│  │  6. Dead Letter Queue cho mọi async consumer            │     │
│  └─────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 11. Liên kết liên quan

| Doc | Liên quan |
|-----|-----------|
| [03 - Loose Coupling & High Cohesion](03-loose-coupling-high-cohesion.md) | Communication style ảnh hưởng trực tiếp đến coupling |
| [04 - Autonomy & Independence](04-autonomy-independence.md) | Async giúp đạt autonomy cao hơn sync |
| [05 - Decomposition Strategies](05-decomposition-strategies.md) | Chọn communication sau khi tách service |
| [07 - API Gateway](07-api-gateway.md) | Gateway đứng trước services, xử lý routing & aggregation |
| [08 - Service Discovery](08-service-discovery.md) | Service cần tìm nhau trước khi giao tiếp (sync) |
| [09 - Data Management](09-data-management.md) | Saga Pattern, Event Sourcing, CQRS — liên quan chặt đến async communication |
| [10 - Resilience Patterns](10-resilience-patterns.md) | Circuit Breaker, Retry — bảo vệ sync calls |
