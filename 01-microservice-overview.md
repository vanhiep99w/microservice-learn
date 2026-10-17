# Microservice Overview

## Mục lục

- [Microservice là gì?](#microservice-là-gì)
- [Kiến trúc Monolithic](#kiến-trúc-monolithic)
  - [Đặc điểm của Monolith](#đặc-điểm-của-monolith)
  - [Ưu điểm của Monolith](#ưu-điểm-của-monolith)
  - [Nhược điểm của Monolith](#nhược-điểm-của-monolith)
- [Kiến trúc Microservice](#kiến-trúc-microservice)
  - [Đặc điểm của Microservice](#đặc-điểm-của-microservice)
  - [Ưu điểm của Microservice](#ưu-điểm-của-microservice)
  - [Nhược điểm của Microservice](#nhược-điểm-của-microservice)
- [SOA là gì? (Service-Oriented Architecture)](#soa-là-gì-service-oriented-architecture)
  - [Ý tưởng cốt lõi của SOA](#ý-tưởng-cốt-lõi-của-soa)
  - [ESB là gì? (Enterprise Service Bus)](#esb-là-gì-enterprise-service-bus)
  - [Ví dụ cụ thể: Luồng "Tạo đơn hàng" trong SOA](#ví-dụ-cụ-thể-luồng-tạo-đơn-hàng-trong-soa)
  - [Vấn đề của SOA — Tại sao cần Microservice?](#vấn-đề-của-soa--tại-sao-cần-microservice)
  - [Tóm lại: SOA dễ hiểu qua phép ẩn dụ](#tóm-lại-soa-dễ-hiểu-qua-phép-ẩn-dụ)
  - [Hiểu lầm thường gặp: "SOA chỉ là Microservice + Orchestrator?"](#hiểu-lầm-thường-gặp-soa-chỉ-là-microservice--orchestrator)
- [SOA vs Microservice — Bảng so sánh](#soa-vs-microservice--bảng-so-sánh)
- [So sánh tổng hợp: Monolith vs SOA vs Microservice](#so-sánh-tổng-hợp-monolith-vs-soa-vs-microservice)
- [Khi nào nên dùng Microservice?](#khi-nào-nên-dùng-microservice)
- [Khi nào KHÔNG nên dùng Microservice?](#khi-nào-không-nên-dùng-microservice)
- [Ví dụ thực tế](#ví-dụ-thực-tế)
  - [Ví dụ 1: Hệ thống E-Commerce](#ví-dụ-1-hệ-thống-e-commerce)
  - [Ví dụ 2: Netflix — Từ Monolith đến Microservice](#ví-dụ-2-netflix--từ-monolith-đến-microservice)
- [Các nguyên tắc cốt lõi của Microservice](#các-nguyên-tắc-cốt-lõi-của-microservice)
- [Links liên quan](#links-liên-quan)

---

## Microservice là gì?

**Microservice Architecture** (kiến trúc vi dịch vụ) là một phong cách kiến trúc phần mềm trong đó ứng dụng được xây dựng dưới dạng **tập hợp các service nhỏ, độc lập**, mỗi service:

- Chạy trong **process riêng** (own process)
- Giao tiếp qua các **giao thức nhẹ** (lightweight protocols) như HTTP/REST, gRPC, hoặc messaging
- Được **triển khai độc lập** (independently deployable)
- Tập trung vào **một nhiệm vụ nghiệp vụ cụ thể** (single business capability)

> 💡 Thuật ngữ "Microservice" được phổ biến rộng rãi bởi **Martin Fowler** và **James Lewis** trong bài viết năm 2014.

---

## Kiến trúc Monolithic

**Monolithic Architecture** (kiến trúc nguyên khối) là kiến trúc truyền thống, trong đó toàn bộ ứng dụng được xây dựng và triển khai **như một đơn vị duy nhất**.

```d2 title="Monolith — một đơn vị triển khai"
direction: down
app: Monolithic App {
 ui: UI Layer
 business: Business Logic
 data: Data Access Layer
 db: Shared Database {shape: cylinder}
}
deploy: "Deploy as ONE unit\nWAR / JAR / single binary"
app -> deploy
```

### Đặc điểm của Monolith

- Tất cả module nằm trong **một codebase**
- Chia sẻ **chung một database**
- Triển khai dưới dạng **một artifact** duy nhất (VD: WAR file, single binary)
- Các module giao tiếp qua **function call** trong cùng process

### Ưu điểm của Monolith

| Ưu điểm | Giải thích |
|----------|------------|
| **Đơn giản để phát triển** | Một codebase, dễ setup, dễ debug |
| **Dễ test** | End-to-end test trong cùng một process |
| **Dễ triển khai** | Chỉ cần deploy một artifact |
| **Hiệu suất cao** | Giao tiếp nội bộ qua function call, không qua network |
| **Consistency dễ đảm bảo** | ACID transaction trên cùng database |

### Nhược điểm của Monolith

| Nhược điểm | Giải thích |
|------------|------------|
| **Khó scale riêng lẻ** | Phải scale toàn bộ app dù chỉ một module cần |
| **Codebase phình to** | Khó hiểu, khó maintain khi hệ thống lớn |
| **Triển khai rủi ro** | Thay đổi nhỏ → deploy lại toàn bộ |
| **Technology lock-in** | Khó đổi tech stack cho từng phần |
| **Team coupling** | Nhiều team cùng sửa một codebase → conflict |

---

## Kiến trúc Microservice

```d2 title="Microservice — service và database độc lập"
direction: down
user: User Service { db: DB 1 {shape: cylinder} }
order: Order Service { db: DB 2 {shape: cylinder} }
product: Product Service { db: DB 3 {shape: cylinder} }
payment: Payment Service { db: DB 4 {shape: cylinder} }
bus: API Gateway / Message Bus
user -- bus
order -- bus
product -- bus
payment -- bus
```

### Đặc điểm của Microservice

- Mỗi service **có database riêng** (Database per Service)
- Giao tiếp qua **network** (HTTP, gRPC, Message Queue)
- **Triển khai độc lập** — mỗi service có CI/CD riêng
- Mỗi service có thể dùng **tech stack khác nhau** (Polyglot)
- Tổ chức team theo **service ownership** (mỗi team sở hữu một hoặc vài service)

### Ưu điểm của Microservice

| Ưu điểm | Giải thích |
|----------|------------|
| **Scale độc lập** | Chỉ scale service nào cần, tiết kiệm tài nguyên |
| **Triển khai độc lập** | Thay đổi một service không ảnh hưởng service khác |
| **Tự do công nghệ** | Mỗi service chọn tech phù hợp nhất (Java, Go, Node.js, ...) |
| **Fault isolation** | Một service lỗi không kéo sập toàn hệ thống |
| **Team autonomy** | Team nhỏ, độc lập, di chuyển nhanh |
| **Dễ hiểu từng phần** | Codebase nhỏ, tập trung vào một domain |

### Nhược điểm của Microservice

| Nhược điểm | Giải thích |
|------------|------------|
| **Phức tạp phân tán** | Network latency, partial failure, eventual consistency |
| **Khó debug & trace** | Request đi qua nhiều service → cần distributed tracing |
| **Data consistency** | Không còn ACID transaction đơn giản → cần Saga pattern |
| **Ops overhead** | Nhiều service = nhiều thứ phải monitor, deploy, quản lý |
| **Testing phức tạp** | Integration test giữa các service khó hơn |
| **Network overhead** | Giao tiếp qua mạng chậm hơn function call |

---

## SOA là gì? (Service-Oriented Architecture)

**SOA** (Service-Oriented Architecture — kiến trúc hướng dịch vụ) là một kiến trúc phần mềm xuất hiện từ **đầu những năm 2000**, chủ yếu được dùng trong các **doanh nghiệp lớn** (ngân hàng, bảo hiểm, viễn thông...).

### Dòng thời gian: SOA ra đời trước Microservice

```
Timeline kiến trúc phần mềm:
═══════════════════════════════════════════════════════════════

~1990s ──── Monolithic Architecture
            │  Tất cả trong 1 cục, deploy 1 lần
            │
~2000-2005 ── SOA ra đời
            │  Tách thành service, kết nối qua ESB
            │  Phổ biến trong enterprise (ngân hàng, viễn thông)
            │  Công cụ: IBM WebSphere, Oracle SOA Suite, TIBCO
            │
~2005-2010 ── SOA bộc lộ vấn đề
            │  ESB phình to, trở thành bottleneck
            │  SOAP/XML quá nặng nề
            │
~2011-2014 ── Microservice ra đời
            │  Netflix, Amazon, Spotify áp dụng thành công
            │  Martin Fowler & James Lewis đặt tên chính thức (2014)
            │  Lấy ý tưởng tách service từ SOA,
            │  nhưng BỎ ĐI sự tập trung (ESB)
            │
~2015+  ──── Microservice trở thành xu hướng chính
            Cloud-native, Docker, Kubernetes hỗ trợ mạnh

═══════════════════════════════════════════════════════════════
```

> 💡 **Microservice không phải phát minh mới hoàn toàn** — nó là bước tiến hóa từ SOA, giữ lại ý tưởng hay (tách service) và loại bỏ điểm yếu (ESB tập trung, shared DB).

### Ý tưởng cốt lõi của SOA

Trước SOA, doanh nghiệp lớn thường có nhiều hệ thống **rời rạc**, không nói chuyện được với nhau:

```d2 title="Trước SOA — các hệ thống silo"
direction: right
hr: "Hệ thống HR (Nhân sự)\nKhông kết nối được"
accounting: "Hệ thống Kế toán\nKhông kết nối được"
sales: "Hệ thống Bán hàng\nKhông kết nối được"
```

Muốn biết lương nhân viên phải vào hai hệ thống khác nhau và copy/paste thủ công.

SOA giải quyết bằng cách: **Mỗi hệ thống "bọc" chức năng của mình thành service**, rồi tất cả kết nối qua **một trung tâm điều phối gọi là ESB**.

### ESB là gì? (Enterprise Service Bus)

**ESB** là "bến xe trung tâm" — nơi mọi service gửi/nhận message. ESB chịu trách nhiệm:
- **Routing** — chuyển request đến đúng service
- **Transform** — chuyển đổi format dữ liệu (VD: XML → JSON)
- **Orchestration** — điều phối thứ tự gọi nhiều service
- **Protocol mediation** — dịch giữa các giao thức (SOAP, JMS, FTP...)

```d2 title="Sau SOA — kết nối qua ESB"
direction: down
esb: "ESB (Bến xe trung tâm)\nRouting • Data transformation\nOrchestration • Logging"
hr: "HR Service\ngetStaff • addStaff"
accounting: "Accounting Service\ngetSalary • payroll"
sales: "Sales Service\ngetOrders • getRevenue"
db: "Shared Database\nOracle / DB2" {shape: cylinder}
esb -> hr
esb -> accounting
esb -> sales
hr -- db
accounting -- db
sales -- db
```

HR lấy thông tin nhân viên → ESB chuyển cho Accounting → Accounting tính lương → ESB trả kết quả tự động.

### Ví dụ cụ thể: Luồng "Tạo đơn hàng" trong SOA

```d2 title="Ví dụ cụ thể: Luồng \"Tạo đơn hàng\" trong SOA"
shape: sequence_diagram
"Client": "🖥️ Ứng dụng"
"ESB": "📡 ESB (Trung tâm)"
"INV": "📦 Inventory Service"
"PAY": "💳 Payment Service"
"SHIP": "🚚 Shipping Service"
"Client" -> "ESB": "Tạo đơn hàng (SOAP/XML)"
"ESB".note1: "ESB nhận request\nvà ĐIỀU PHỐI thứ tự gọi"
"ESB" -> "INV": "1. Kiểm tra tồn kho"
"INV" -> "ESB": "Còn hàng ✅" { style.stroke-dash: 5 }
"ESB" -> "PAY": "2. Xử lý thanh toán"
"ESB".note2: "ESB chuyển XML → JSON\n(data transformation)"
"PAY" -> "ESB": "Thanh toán OK ✅" { style.stroke-dash: 5 }
"ESB" -> "SHIP": "3. Tạo vận đơn"
"SHIP" -> "ESB": "Vận đơn #12345 ✅" { style.stroke-dash: 5 }
"ESB" -> "Client": "Đơn hàng thành công!" { style.stroke-dash: 5 }
"ESB".note3: "Toàn bộ logic điều phối\nnằm TRONG ESB"
```

**Điểm quan trọng:** Logic nghiệp vụ "tạo đơn hàng gồm 3 bước" nằm **trong ESB**, không phải trong service. ESB trở thành **bộ não trung tâm**.

### Vấn đề của SOA — Tại sao cần Microservice?

| Vấn đề | Giải thích | Ảnh hưởng |
|--------|------------|-----------|
| **ESB là single point of failure** | ESB chết → toàn bộ hệ thống chết | Rủi ro cực lớn |
| **ESB phình to** | Càng nhiều logic đổ vào ESB → ESB trở thành "God Object" | Khó maintain, khó test |
| **Smart pipes, dumb endpoints** | ESB thông minh, service thụ động → service không tự chủ | Ngược với Microservice: "dumb pipes, smart endpoints" |
| **Shared database** | Nhiều service dùng chung DB → thay đổi schema ảnh hưởng tất cả | Coupling cao, sợ thay đổi |
| **Nặng nề** | SOAP/XML, WSDL, WS-* standards → phức tạp | Chậm, khó phát triển |
| **Vendor lock-in** | ESB thường là sản phẩm thương mại đắt đỏ (IBM, Oracle, TIBCO) | Chi phí cao, phụ thuộc vendor |

```d2 title="Smart Pipes và Smart Endpoints"
direction: down
soa: "SOA — Smart Pipes, Dumb Endpoints" {
 esb: ESB { logic: "Business logic\nRouting rules\nData transformation\nOrchestration" }
 a: "Service đơn giản\nChỉ nhận lệnh"
 b: "Service đơn giản\nChỉ nhận lệnh"
 esb -> a
 esb -> b
}
micro: "Microservice — Dumb Pipes, Smart Endpoints" {
 pipe: "API Gateway / MQ\nChỉ routing đơn giản"
 a: Service A { logic: Logic; db: DB {shape: cylinder} }
 b: Service B { logic: Logic; db: DB {shape: cylinder} }
 pipe -> a
 pipe -> b
}
```

### Tóm lại: SOA dễ hiểu qua phép ẩn dụ

| | SOA | Microservice |
|--|-----|-------------|
| **Ẩn dụ** | 🏭 **Nhà máy lớn** — có 1 quản đốc (ESB) điều phối mọi công nhân | 🏪 **Chuỗi cửa hàng nhỏ** — mỗi cửa hàng tự quản, tự quyết |
| **Giao tiếp** | Qua tổng đài trung tâm (ESB) | Gọi trực tiếp hoặc gửi tin nhắn (REST/gRPC/MQ) |
| **Dữ liệu** | Kho hàng chung (shared DB) | Mỗi cửa hàng có kho riêng (DB per service) |
| **Khi 1 phần lỗi** | Quản đốc bận → cả nhà máy đứng | Cửa hàng A đóng → cửa hàng B vẫn bán bình thường |

> 💡 **Tóm gọn:** SOA = "tách service nhưng vẫn phụ thuộc vào trung tâm (ESB)". Microservice = "tách service VÀ phi tập trung hoàn toàn".

### Hiểu lầm thường gặp: "SOA chỉ là Microservice + Orchestrator?"

Thoạt nhìn SOA giống Microservice dùng **Saga Orchestration pattern** — đều có một "bộ điều phối" ở giữa. Nhưng thực tế khác nhau rất nhiều:

| | ESB trong SOA | Saga Orchestrator trong Microservice |
|--|--------------|--------------------------------------|
| **Số lượng** | **1 ESB duy nhất** cho toàn hệ thống | **Nhiều orchestrator**, mỗi cái lo 1 workflow |
| **Phạm vi** | Làm **mọi thứ**: routing, transform data, orchestrate, protocol mediation, logging | **Chỉ điều phối** 1 business flow cụ thể |
| **Database** | Các service **dùng chung DB** | Mỗi service **có DB riêng** |
| **Khi lỗi** | ESB chết → **cả hệ thống chết** | Orchestrator A chết → chỉ flow A bị ảnh hưởng |
| **Service** | Service lớn, **thụ động** (chờ ESB gọi) | Service nhỏ, **tự chủ** (tự chứa logic) |
| **Tech** | Bắt buộc cùng stack (SOAP/XML) | Mỗi service tự chọn tech |

```d2 title="ESB tập trung và Saga chuyên biệt"
direction: down
soa: "SOA — một ESB quản hết" {
 a: Service A
 b: Service B
 c: Service C
 esb: "ESB — God Object\nRouting, transform, orchestrate\nLogging, protocol mediation"
 db: Shared DB {shape: cylinder}
 a -> esb
 b -> esb
 c -> esb
 esb -> db
}
saga: "Microservice + Saga — service tự chủ" {
 order: "Order Saga Orchestrator\nChỉ flow đặt hàng"
 payment: "Payment Saga Orchestrator\nChỉ flow thanh toán"
 refund: "Refund Saga Orchestrator\nChỉ flow hoàn tiền"
 a: Service A
 b: Service B
 c: Service C
 da: DB A {shape: cylinder}
 db: DB B {shape: cylinder}
 dc: DB C {shape: cylinder}
 a -> da
 b -> db
 c -> dc
}
```

> 💡 **Nói đơn giản:** ESB giống **1 ông giám đốc** quản hết mọi phòng ban. Saga Orchestrator giống **trưởng nhóm dự án** — mỗi dự án có 1 trưởng nhóm riêng, nhưng nhân viên (service) vẫn tự chủ trong công việc của mình.

---

## SOA vs Microservice — Bảng so sánh

| Tiêu chí | SOA | Microservice |
|----------|-----|-------------|
| **Kích thước service** | Lớn, có thể chứa nhiều function | Nhỏ, tập trung vào 1 business capability |
| **Giao tiếp** | ESB (Enterprise Service Bus) — nặng, tập trung | Lightweight protocol (REST, gRPC, MQ) |
| **Data** | Thường **share database** | **Database per service** |
| **Logic điều phối** | Nằm trong ESB (centralized) | Nằm trong service (decentralized) |
| **Governance** | Centralized governance | Decentralized governance |
| **Triển khai** | Thường deploy cùng nhau | Deploy **độc lập** |
| **Technology** | Thường đồng nhất (Java/SOAP) | Polyglot (đa ngôn ngữ, đa framework) |
| **Scope** | Enterprise-wide reuse | Bounded context (DDD) |
| **Coupling** | Cao (qua ESB) | Thấp (loose coupling) |
| **Chi phí** | Cao (license ESB thương mại) | Thấp hơn (open-source tools) |

---

## So sánh tổng hợp: Monolith vs SOA vs Microservice

```d2 title="So sánh tổng hợp: Monolith vs SOA vs Microservice"
direction: right
n1: "Tiến hóa kiến trúc" {}
n1.n2: "🏢 Monolith\nAll-in-one"
n1.n3: "🏭 SOA\nService + ESB"
n1.n4: "🔬 Microservice\nSmall & Independent"
n1.n2 -> n1.n3: "Tách service\n+ ESB"
n1.n3 -> n1.n4: "Lightweight\nDecentralized"
```

| Tiêu chí | Monolith | SOA | Microservice |
|----------|----------|-----|-------------|
| **Độ phức tạp ban đầu** | ⭐ Thấp | ⭐⭐⭐ Cao | ⭐⭐ Trung bình |
| **Khả năng scale** | Toàn bộ | Theo service group | Theo từng service |
| **Tốc độ phát triển** | Nhanh (ban đầu) | Chậm (ESB phức tạp) | Nhanh (khi đã setup) |
| **Team size phù hợp** | Nhỏ (< 10) | Lớn (enterprise) | Trung bình → Lớn |
| **Triển khai** | Đơn giản | Phức tạp | Tự động (CI/CD) |
| **Fault isolation** | Không | Một phần | Tốt |
| **Tech diversity** | Một tech stack | Hạn chế | Tự do |

---

## Khi nào nên dùng Microservice?

✅ **Nên dùng khi:**

1. **Hệ thống lớn, phức tạp** — nhiều domain nghiệp vụ riêng biệt
2. **Cần scale từng phần** — VD: search service cần scale nhiều hơn auth service
3. **Nhiều team phát triển song song** — giảm conflict, tăng autonomy
4. **Cần triển khai thường xuyên** — deploy service riêng lẻ, không ảnh hưởng toàn hệ thống
5. **Cần đa dạng công nghệ** — VD: ML service dùng Python, API service dùng Go
6. **Yêu cầu fault isolation** — lỗi một phần không được ảnh hưởng toàn bộ

## Khi nào KHÔNG nên dùng Microservice?

❌ **Không nên khi:**

1. **Ứng dụng nhỏ, đơn giản** — overhead quá lớn so với lợi ích
2. **Team nhỏ** (< 5 người) — không đủ người để vận hành nhiều service
3. **Chưa hiểu rõ domain** — chia sai boundary sẽ rất khó sửa
4. **Chưa có DevOps maturity** — cần CI/CD, monitoring, containerization
5. **Startup giai đoạn đầu** — nên bắt đầu bằng Monolith, tách sau khi hiểu rõ domain

> 💡 **Lời khuyên từ Martin Fowler**: *"Don't even consider microservices unless you have a system that's too complex to manage as a monolith."*
>
> **MonolithFirst** — Bắt đầu bằng Monolith, chuyển sang Microservice khi thực sự cần.

---

## Ví dụ thực tế

### Ví dụ 1: Hệ thống E-Commerce

**Monolith approach:**

```d2 title="E-Commerce Monolith"
direction: down
app: E-Commerce Monolith {
 user: User Module
 order: Order Module
 product: Product Module
 payment: Payment Module
 inventory: Inventory Module
 search: Search Module
 notification: Notification Module
 db: Shared PostgreSQL {shape: cylinder}
 product -> order
 order -> user
 search -> inventory
 inventory -> payment
 user <-> payment
 order <-> inventory
 payment <-> notification
}
```

**Microservice approach:**

```d2 title="Ví dụ 1: Hệ thống E-Commerce"
direction: down
n1: "🌐 Client"
n2: "API Gateway"
n3: "👤 User Service\nNode.js + PostgreSQL"
n4: "📦 Order Service\nJava + MongoDB"
n5: "🛍️ Product Service\nGo + PostgreSQL"
n6: "💳 Payment Service\nJava + PostgreSQL"
n7: "🔍 Search Service\nPython + Elasticsearch"
n8: "📨 Message Queue\n(Kafka)"
n9: "📊 Inventory Service\nGo + Redis"
n10: "🔔 Notification Service\nNode.js"
n1 -> n2
n2 -> n3
n2 -> n4
n2 -> n5
n2 -> n6
n2 -> n7
n4 -> n8: "event: order.created"
n8 -> n9: "consume"
n8 -> n10: "consume"
n6 -> n8: "event: payment.completed"
```

**Phân tích:**
- **User Service**: Quản lý đăng ký, đăng nhập, profile → dùng Node.js vì CRUD đơn giản
- **Order Service**: Logic phức tạp, cần transaction → dùng Java
- **Search Service**: Full-text search → dùng Python + Elasticsearch
- **Inventory Service**: Đọc/ghi nhanh, real-time → dùng Go + Redis
- Các service giao tiếp qua **Kafka** cho event-driven flow (order created → update inventory → gửi notification)

### Ví dụ 2: Netflix — Từ Monolith đến Microservice

Netflix là một trong những case study nổi tiếng nhất về chuyển đổi từ Monolith sang Microservice.

```d2 title="Netflix — Các mốc chuyển đổi từ Monolith sang Microservice"
direction: down

m2007: "2007 — Monolithic Architecture" {
  style.border-radius: 12
  details: "• Single Java WAR deployment\n• Shared Oracle database\n• Vertical scaling" {
    shape: text
  }
}

m2008: "2008 — Sự cố database" {
  style.border-radius: 12
  details: "• Database corruption: 3 ngày downtime\n• Quyết định chuyển sang Microservice" {
    shape: text
  }
}

migration: "2009–2011 — Migration phase" {
  style.border-radius: 12
  details: "• Tách từng module thành service\n• Chuyển sang AWS (cloud-native)\n• Xây dựng OSS tools:\nEureka, Zuul, Hystrix" {
    shape: text
  }
}

microservices: "2012+ — Full Microservice" {
  style.border-radius: 12
  details: "• 700+ microservices\n• 1 tỷ API calls/ngày\n• Deploy hàng nghìn lần/ngày" {
    shape: text
  }
}

m2007 -> m2008 -> migration -> microservices
```

> **Cách đọc:** Đây là timeline lịch sử, không phải sequence diagram của một transaction. Các mũi tên chỉ thứ tự các mốc; khoảng cách giữa các thẻ không biểu thị độ dài thời gian.

**Bài học từ Netflix:**
1. **Strangler Fig Pattern** — Dần dần thay thế từng phần của Monolith, không rewrite từ đầu
2. **Chaos Engineering** — Tạo ra Chaos Monkey để test fault tolerance
3. **Open Source** — Chia sẻ công cụ nội bộ: Eureka (Service Discovery), Zuul (API Gateway), Hystrix (Circuit Breaker)

---

## Các nguyên tắc cốt lõi của Microservice

```d2 title="Các nguyên tắc cốt lõi của Microservice"
direction: down
n1: "🔬 Microservice\nPrinciples"
n2: "1️⃣ Single Responsibility\nMỗi service làm 1 việc"
n3: "2️⃣ Loose Coupling\nService ít phụ thuộc nhau"
n4: "3️⃣ High Cohesion\nCode liên quan ở cùng nhau"
n5: "4️⃣ Database per Service\nMỗi service có DB riêng"
n6: "5️⃣ Independent Deployment\nDeploy không cần đồng bộ"
n7: "6️⃣ Decentralized Governance\nTeam tự quyết định tech"
n8: "7️⃣ Design for Failure\nGiả định mọi thứ sẽ lỗi"
n9: "8️⃣ API-First\nContract rõ ràng giữa services"
n1 -> n2
n1 -> n3
n1 -> n4
n1 -> n5
n1 -> n6
n1 -> n7
n1 -> n8
n1 -> n9
```

| Nguyên tắc | Mô tả | Ví dụ |
|------------|--------|-------|
| **Single Responsibility** | Mỗi service chỉ đảm nhận một business capability | User Service chỉ quản lý user, không xử lý payment |
| **Loose Coupling** | Thay đổi service A không cần sửa service B | Giao tiếp qua API contract, không share internal model |
| **High Cohesion** | Những thứ thay đổi cùng nhau nên ở cùng nhau | Order logic + Order DB nằm trong Order Service |
| **Database per Service** | Mỗi service sở hữu data riêng | User Service dùng PostgreSQL, Search dùng Elasticsearch |
| **Independent Deployment** | Deploy service không cần deploy service khác | CI/CD pipeline riêng cho mỗi service |
| **Decentralized Governance** | Team tự chọn ngôn ngữ, framework, tool | Team A dùng Java, Team B dùng Go |
| **Design for Failure** | Mọi network call đều có thể fail | Dùng Circuit Breaker, Retry, Fallback |
| **API-First** | Thiết kế API trước khi implement | OpenAPI spec, gRPC proto file |

---

## Links liên quan

- Tiếp theo: [Single Responsibility & Bounded Context](02-single-responsibility-bounded-context.md) — SRP và cách xác định ranh giới service
- [Loose Coupling & High Cohesion](03-loose-coupling-high-cohesion.md) — Nguyên tắc kết nối lỏng, gắn kết cao
- [Autonomy & Independence](04-autonomy-independence.md) — Tự chủ và độc lập trong Microservice
- [Decomposition Strategies](05-decomposition-strategies.md) — Cách phân tách Monolith thành Microservice
- [Inter-Service Communication](06-inter-service-communication.md) — Giao tiếp giữa các service
- [Resilience Patterns](10-resilience-patterns.md) — Xử lý lỗi trong hệ thống phân tán
- [Design Patterns tổng hợp](17-design-patterns.md) — Tất cả pattern quan trọng
