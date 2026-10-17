# Decomposition Strategies — Chiến lược phân tách Microservice

## 📋 Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
- [2. Tại sao Decomposition khó?](#2-tại-sao-decomposition-khó)
  - [2.1. Tách quá nhỏ vs quá lớn](#21-tách-quá-nhỏ-vs-quá-lớn)
  - [2.2. Service Granularity — Kích thước phù hợp](#22-service-granularity--kích-thước-phù-hợp)
- [3. Decompose by Business Capability](#3-decompose-by-business-capability)
  - [3.1. Business Capability là gì?](#31-business-capability-là-gì)
  - [3.2. Cách xác định Business Capability](#32-cách-xác-định-business-capability)
  - [3.3. Ví dụ thực tế — E-Commerce](#33-ví-dụ-thực-tế--e-commerce)
  - [3.4. Ưu và nhược điểm](#34-ưu-và-nhược-điểm)
- [4. Decompose by Subdomain (DDD)](#4-decompose-by-subdomain-ddd)
  - [4.1. Tổng quan DDD Decomposition](#41-tổng-quan-ddd-decomposition)
  - [4.2. Core / Supporting / Generic Subdomain](#42-core--supporting--generic-subdomain)
  - [4.3. Ví dụ thực tế — Online Banking](#43-ví-dụ-thực-tế--online-banking)
  - [4.4. Business Capability vs Subdomain](#44-business-capability-vs-subdomain)
- [5. Strangler Fig Pattern](#5-strangler-fig-pattern)
  - [5.1. Strangler Fig là gì?](#51-strangler-fig-là-gì)
  - [5.2. Các bước thực hiện](#52-các-bước-thực-hiện)
  - [5.3. Ví dụ thực tế — Migrate E-Commerce Monolith](#53-ví-dụ-thực-tế--migrate-e-commerce-monolith)
  - [5.4. Kỹ thuật hỗ trợ Strangler Fig](#54-kỹ-thuật-hỗ-trợ-strangler-fig)
  - [5.5. Ưu và nhược điểm](#55-ưu-và-nhược-điểm)
- [6. Các chiến lược Decomposition khác](#6-các-chiến-lược-decomposition-khác)
  - [6.1. Decompose by Use Case / User Story](#61-decompose-by-use-case--user-story)
  - [6.2. Decompose by Resource / Entity](#62-decompose-by-resource--entity)
  - [6.3. Decompose by Volatility](#63-decompose-by-volatility)
  - [6.4. Decompose by Team](#64-decompose-by-team)
- [7. Quy trình phân tách step-by-step](#7-quy-trình-phân-tách-step-by-step)
  - [7.1. Framework 6 bước](#71-framework-6-bước)
  - [7.2. Ví dụ áp dụng — Hệ thống Food Delivery](#72-ví-dụ-áp-dụng--hệ-thống-food-delivery)
- [8. Anti-patterns khi Decompose](#8-anti-patterns-khi-decompose)
- [9. Checklist trước khi tách service](#9-checklist-trước-khi-tách-service)
- [10. Tổng kết](#10-tổng-kết)
- [11. Liên kết liên quan](#11-liên-kết-liên-quan)

---

## 1. Giới thiệu

Trong các doc trước, chúng ta đã tìm hiểu:
- **Ranh giới** service qua SRP & Bounded Context ([doc 02](02-single-responsibility-bounded-context.md))
- **Chất lượng** ranh giới qua Loose Coupling & High Cohesion ([doc 03](03-loose-coupling-high-cohesion.md))
- **Mức độ độc lập** cần đạt ([doc 04](04-autonomy-independence.md))

Bài này trả lời câu hỏi thực tế nhất: **"OK, tôi hiểu lý thuyết rồi — vậy cụ thể tách service bằng cách nào?"**

```d2 title="1. Giới thiệu"
direction: right
system: "Monolith hoặc ý tưởng hệ thống"
choose: "Chọn chiến lược phân tách"
capability: "Business Capability — Greenfield"
ddd: "DDD Subdomain — Greenfield"
strangler: "Strangler Fig — Brownfield Migration"
other: "Khác — Use Case / Volatility / Team"
system -> choose
choose -> capability
choose -> ddd
choose -> strangler
choose -> other
```

Greenfield là dự án mới; Brownfield là migration từ hệ thống đang tồn tại.

> **Lưu ý quan trọng**: Không có chiến lược "đúng nhất" — mỗi chiến lược phù hợp với **bối cảnh** và **giai đoạn** khác nhau. Thực tế, nhiều tổ chức **kết hợp** nhiều chiến lược.

---

## 2. Tại sao Decomposition khó?

### 2.1. Tách quá nhỏ vs quá lớn

```d2 title="2.1. Tách quá nhỏ vs quá lớn"
direction: down
nano: Nano-services {
 s1: S1; s2: S2; s3: S3; s4: S4; s5: S5; s6: S6
 s1 -> s2 -> s3 -> s4 -> s5 -> s6
}
large: Mini-monoliths {
 a: "Service A\nUser management • Auth • Profile • Social • Notification"
 b: Service B — tất cả business logic còn lại
}
fit: Sweet Spot — Business Capability {
 user: User Service
 order: Order Service
 payment: Payment Service
 catalog: Catalog Service
}
```

Nano-services: network latency chồng chất, distributed transactions/debug phức tạp, feature đụng nhiều services, 30 services quá tải team 5 người. Mini-monoliths: coupling nội bộ, khó scale một phần, team lớn/coordination và deploy chậm. Sweet spot minh họa: team 3–8 người own 1–3 services, ít cross-service calls.

### 2.2. Service Granularity — Kích thước phù hợp

Không có quy tắc cứng, nhưng có **heuristics** (quy tắc ngón tay cái):

| Heuristic | Mô tả | Ví dụ |
|-----------|--------|-------|
| **Two-Pizza Team** | 1 team (6-8 người) có thể own & vận hành service | Team quá lớn → tách service |
| **Single Responsibility** | Service chỉ có 1 lý do để thay đổi | Order Service đổi khi logic đơn hàng đổi, không đổi khi thanh toán đổi |
| **Bounded Context** | Service nằm trong 1 Bounded Context | "Product" trong Catalog ≠ "Product" trong Inventory |
| **Change Frequency** | Phần nào thay đổi thường xuyên → tách riêng | Pricing thay đổi hàng tuần → tách khỏi Catalog |
| **Autonomous Function** | Service hoàn thành 1 chức năng mà không cần gọi nhiều service khác | Nếu Service A luôn phải gọi B, C, D → có thể nên gộp |
| **Data Ownership** | Service own 1 tập dữ liệu rõ ràng | User Service own bảng users, profiles |

```d2 title="2.2. Service Granularity — Kích thước phù hợp"
direction: down
n1: "Đang cân nhắc tách service"
n2: "Service hiện tại có\nnhiều hơn 1 lý do\nđể thay đổi?" {
  shape: diamond
}
n3: "✅ Giữ nguyên\nChưa cần tách"
n4: "Các phần có thể\ndeploy & scale\nđộc lập?" {
  shape: diamond
}
n5: "⚠️ Refactor nội bộ trước\nChưa tách service"
n6: "Team có đủ\nbandwidth vận hành\nthêm service?" {
  shape: diamond
}
n7: "⚠️ Chưa tách\nTập trung ổn định trước"
n8: "✅ Tách service\nÁp dụng strategy phù hợp"
n1 -> n2
n2 -> n3: "Không"
n2 -> n4: "Có"
n4 -> n5: "Không"
n4 -> n6: "Có"
n6 -> n7: "Không"
n6 -> n8: "Có"
```

---

## 3. Decompose by Business Capability

### 3.1. Business Capability là gì?

**Business Capability** (năng lực kinh doanh) là **những gì doanh nghiệp làm** để tạo ra giá trị, bất kể cách triển khai kỹ thuật.

```
Phân biệt:
────────────

Business Capability              ≠  Technical Function
(Doanh nghiệp LÀM GÌ)              (Kỹ thuật TRIỂN KHAI THẾ NÀO)

• Quản lý đơn hàng                   • REST API
• Xử lý thanh toán                   • Database CRUD
• Quản lý kho hàng                   • Message Queue
• Hỗ trợ khách hàng                  • Caching layer

→ Tách theo Business Capability      → KHÔNG tách theo Technical Function
```

> **Nguyên tắc**: Service boundary nên phản ánh **ranh giới nghiệp vụ**, không phải ranh giới kỹ thuật.

### 3.2. Cách xác định Business Capability

```d2 title="3.2. Cách xác định Business Capability"
direction: right
org: "Phân tích tổ chức\nSales • Marketing • Kho vận • Tài chính"
sales: "Sales Capabilities\nCustomer / Order Management • Pricing"
logistics: "Kho vận Capabilities\nInventory / Shipping / Supplier Management"
customer: "Customer Service"
order: "Order Service"
pricing: "Pricing Service"
inventory: "Inventory Service"
shipping: "Shipping Service"
org -> sales
org -> logistics
sales -> customer
sales -> order
sales -> pricing
logistics -> inventory
logistics -> shipping
```

Bắt đầu từ câu hỏi doanh nghiệp có chức năng gì, liệt kê capability rồi map candidates; sơ đồ không bắt buộc mỗi phòng ban hiện tại phải trở thành một service.

### 3.3. Ví dụ thực tế — E-Commerce

```d2 title="3.3. Ví dụ thực tế — E-Commerce"
direction: right
ecommerce: E-Commerce Capability Map {
 core: Core {
  product: Product Management — CRUD / Phân loại / Giá
  order: Order Management — Tạo / Trạng thái / Hủy
  payment: Payment Processing — Thu / Hoàn / Ví / Đối soát
 }
 supporting: Supporting {
  inventory: Inventory — Tồn kho / Reserve / Nhập hàng
  shipping: Shipping — Phí / Tracking
  support: Customer Support — Ticket / Live chat / FAQ
 }
 generic: Generic {
  identity: User Identity — Đăng ký / Login / Phân quyền
  notification: Notification — Email / SMS / Push
  search: Search — Full-text / Filter
 }
}
```

Ví dụ map một capability thành một service, tổng 9 candidates. Core/supporting/generic phụ thuộc lợi thế và context doanh nghiệp; không phải mọi tổ chức đều phải xếp Payment/Search như hình.

### 3.4. Ưu và nhược điểm

| | Ưu điểm | Nhược điểm |
|---|---------|-----------|
| ✅ | Dễ hiểu — service phản ánh cách doanh nghiệp hoạt động | Cần hiểu sâu nghiệp vụ, dev thuần kỹ thuật sẽ khó |
| ✅ | Ổn định — business capability ít thay đổi hơn kỹ thuật | Một số capability mờ ranh giới (Pricing thuộc Sales hay Product?) |
| ✅ | Dễ assign team — mỗi team own 1 capability | Có thể tạo service quá lớn nếu capability quá rộng |
| ✅ | Phù hợp Conway's Law — tổ chức team = tổ chức service | |

---

## 4. Decompose by Subdomain (DDD)

### 4.1. Tổng quan DDD Decomposition

Chiến lược này dùng **Domain-Driven Design** (xem chi tiết tại [doc 02](02-single-responsibility-bounded-context.md)) để phân tách service:

```d2 title="4.1. Tổng quan DDD Decomposition"
direction: right
domain: "Domain — toàn hệ thống"
core: "Core Subdomain\nService quan trọng — tự build, đầu tư nhiều"
support: "Supporting Subdomain\nService hỗ trợ — có thể outsource một phần"
generic: "Generic Subdomain\nPhổ thông — SaaS / Open-source"
domain -> core
domain -> support
domain -> generic
```

### 4.2. Core / Supporting / Generic Subdomain

| Loại | Đặc điểm | Chiến lược | Ví dụ (E-Commerce) |
|------|-----------|------------|---------------------|
| **Core** | Tạo lợi thế cạnh tranh, phức tạp, thay đổi thường xuyên | **Tự build**, đội ngũ giỏi nhất, đầu tư nhiều nhất | Recommendation Engine, Pricing Algorithm, Order Fulfillment |
| **Supporting** | Cần thiết nhưng không tạo lợi thế cạnh tranh | Tự build hoặc **customize** giải pháp có sẵn | Inventory, Shipping, Customer Support |
| **Generic** | Bài toán phổ biến, mọi công ty đều giống nhau | **Mua SaaS** hoặc dùng open-source | Auth (Auth0), Email (SendGrid), Payment gateway (Stripe) |

```d2 title="4.2. Core / Supporting / Generic Subdomain"
direction: down
n3: "📦 Generic Subdomain — Mua/dùng sẵn" {}
n2: "⚙️ Supporting Subdomain — Vừa phải" {}
n1: "🏆 Core Subdomain — Đầu tư NHIỀU" {}
n1.n4: "Recommendation Engine"
n1.n5: "Dynamic Pricing"
n1.n6: "Order Fulfillment"
n2.n7: "Inventory"
n2.n8: "Shipping"
n2.n9: "Customer Support"
n3.n10: "Auth (Auth0)"
n3.n11: "Email (SendGrid)"
n3.n12: "Payment (Stripe)"
n13: "Best engineers"
n14: "Standard team"
n15: "Integrate only"
n1 -- n13: "build in-house"
n2 -- n14: "build or buy"
n3 -- n15: "buy SaaS"
```

### 4.3. Ví dụ thực tế — Online Banking

```d2 title="4.3. Ví dụ thực tế — Online Banking"
direction: right
bank: Online Banking {
 core: Core — tự build / Senior team / Security-first {
  transactions: Transaction Processing — Chuyển tiền / Thanh toán / Đối soát
  loans: Loan Origination — Đánh giá / Tính lãi / Giải ngân
  risk: Risk Assessment — Fraud / Credit scoring
 }
 support: Supporting — tự build / Tận dụng thư viện {
  customer: Customer Management — KYC / eKYC / Profile / Preferences
  account: Account Management — Mở / Đóng tài khoản
 }
 generic: Generic — SaaS / Open-source integration {
  identity: Identity / Auth — Keycloak / OAuth2 / OIDC
  notification: Notification — Firebase / Twilio SMS
  reporting: Reporting — Metabase / Grafana
 }
}
```

### 4.4. Business Capability vs Subdomain

Hai chiến lược rất giống nhau, khác ở **góc nhìn**:

| Tiêu chí | Business Capability | Subdomain (DDD) |
|----------|---------------------|------------------|
| **Góc nhìn** | Từ tổ chức doanh nghiệp (phòng ban, chức năng) | Từ domain model (ngôn ngữ, nghiệp vụ) |
| **Xuất phát** | "Doanh nghiệp LÀM GÌ?" | "Domain có những KHÁI NIỆM gì?" |
| **Phân loại** | Không phân loại ưu tiên | Chia thành Core / Supporting / Generic |
| **Chiến lược đầu tư** | Không chỉ ra nên build hay buy | Rõ ràng: Core → build, Generic → buy |
| **Khi nào dùng** | Khi nghiệp vụ rõ ràng, tổ chức ổn định | Khi domain phức tạp, cần strategic design |
| **Kết quả** | Thường giống nhau ở level service boundary | Thường giống nhau, nhưng DDD cho thêm insight về đầu tư |

> **Thực tế**: Hầu hết team dùng **kết hợp** cả hai. Dùng Business Capability để xác định ranh giới ban đầu, rồi dùng DDD để đi sâu vào core domain.

---

## 5. Strangler Fig Pattern

### 5.1. Strangler Fig là gì?

**Strangler Fig** (cây đa bóp nghẹt) là pattern migrate **dần dần** từ monolith sang microservice, thay vì rewrite toàn bộ (big-bang migration).

Tên lấy từ loại cây tropical vine bọc quanh cây chủ, dần dần thay thế hoàn toàn:

```d2 title="5.1. Strangler Fig là gì?"
direction: right
start: "Giai đoạn 1\n100% Monolith"
middle: "Giai đoạn 2\nMS1 thay một phần\n30% Microservice / 70% Monolith"
end: "Giai đoạn 3\nMS1 / MS2 / MS3 / MS4 / MS5\n100% Microservices / 0% Monolith"
start -> middle: "Strangle dần"
middle -> end: "Tách phần còn lại"
```

> **Tại sao không rewrite toàn bộ?** Vì big-bang rewrite là **rủi ro cực cao**: dự án kéo dài hàng năm, business tiếp tục thay đổi trên monolith cũ, đến khi xong thì requirements đã khác. Joel Spolsky gọi đây là "điều tệ nhất một công ty phần mềm có thể làm".

### 5.2. Các bước thực hiện

```d2 title="5.2. Các bước thực hiện"
direction: down
n1: "1. Xác định module\ncần tách trước"
n2: "2. Đặt Proxy/Facade\ntrước monolith"
n3: "3. Build microservice\ncho module đó"
n4: "4. Chuyển traffic\nsang microservice"
n5: "5. Xóa code cũ\ntrong monolith"
n6: "Còn module\ncần tách?" {
  shape: diamond
}
n7: "✅ Migration hoàn tất\nTắt monolith"
n1 -> n2
n2 -> n3
n3 -> n4
n4 -> n5
n5 -> n6
n6 -> n1: "Có"
n6 -> n7: "Không"
```

**Chi tiết từng bước:**

```d2 title="5.2. Các bước thực hiện"
direction: down
before: Ban đầu {
 client: Client
 proxy: Proxy / API Gateway
 monolith: Monolith — tất cả traffic
 client -> proxy -> monolith
}
after: Chuyển module A {
 client: Client
 proxy: Proxy / API Gateway
 micro: Microservice — Module A
 monolith: Monolith — phần còn lại
 client -> proxy
 proxy -> micro: Route module A
 proxy -> monolith: Route khác
}
```

Các bước: (1) chọn module đổi thường xuyên, low coupling, business value và data boundary rõ; không chọn phần phức tạp/nhiều dependencies nhất trước; (2) đặt proxy; (3) implement service, migrate/sync data, test unit/integration/contract; (4) chuyển traffic; (5) xóa code module A khỏi monolith.

### 5.3. Ví dụ thực tế — Migrate E-Commerce Monolith

```d2 title="5.3. Ví dụ thực tế — Migrate E-Commerce Monolith"
direction: down
start: "Monolith\nUser / Product / Order / Payment / Inventory / Search\nShared PostgreSQL"
p1: "Tháng 1–2: Search → Elasticsearch\nLow coupling • Scale riêng\nMonolith events → consume & index"
p2: "Tháng 3–4: User / Auth\nSSO • OAuth2 • Dùng lại cho app khác"
p3: "Tháng 5–7: Payment\nPCI-DSS • Security boundary"
p4: "Tháng 8–10: Order + Inventory\nCoupling cao — migration cùng đợt"
p5: "Tháng 11–12: Product\nXóa monolith"
start -> p1
p1 -> p2
p2 -> p3
p3 -> p4
p4 -> p5
```

Timeline minh họa 12 tháng, so với 18–24 tháng big-bang trong ví dụ. Giảm rủi ro nhờ rollback từng phase, không phải bảo đảm migration luôn nhanh/an toàn hơn.

### 5.4. Kỹ thuật hỗ trợ Strangler Fig

| Kỹ thuật | Mô tả | Khi nào dùng |
|----------|--------|--------------|
| **Branch by Abstraction** | Tạo abstraction layer trong monolith, swap implementation giữa code cũ và service mới | Khi module cần tách nằm **sâu** trong monolith, không dễ route ở tầng HTTP |
| **Event Interception** | Monolith publish event, microservice mới subscribe & xử lý | Khi cần **sync data** giữa monolith và service mới |
| **Asset Capture** | Microservice mới bắt đầu xử lý **write** trước, monolith chỉ còn xử lý **read** từ data cũ | Khi migrate data lớn, không thể chuyển 1 lần |
| **Dark Launch** | Service mới chạy nhận traffic thật nhưng **không trả response** cho user, chỉ so sánh kết quả với monolith | Khi cần validate service mới trước khi chuyển traffic |
| **Feature Toggle** | Bật/tắt route traffic giữa monolith và microservice | Khi cần rollback nhanh |

```d2 title="5.4. Kỹ thuật hỗ trợ Strangler Fig"
direction: down
before: Trước {
 controller: OrderController
 service: OrderService
 repo: OrderRepository
 db: DB
 controller -> service -> repo -> db
}
abstraction: Thêm abstraction {
 controller: OrderController
 interface: IOrderService — Interface / Feature flag
 old: OldOrderService
 new: NewOrderService
 db: DB
 micro: Order Microservice
 controller -> interface
 interface -> old: Flag false
 interface -> new: Flag true
 old -> db
 new -> micro
}
# Icons: https://icons.d2lang.com/
before.db.icon: "https://icons.d2lang.com/essentials/117-database.svg"
abstraction.db.icon: "https://icons.d2lang.com/essentials/117-database.svg"
```

Switch `use_new_order_service=true` sau kiểm chứng. Khi hết rollback window và mọi caller đã migrate: xóa Old implementation/abstraction không còn cần, giữ implementation mới.

### 5.5. Ưu và nhược điểm

| | Ưu điểm | Nhược điểm |
|---|---------|-----------|
| ✅ | Rủi ro thấp — migrate dần, rollback từng phần | Cần duy trì cả monolith + microservice trong thời gian dài |
| ✅ | Business tiếp tục chạy — không downtime | Data consistency giữa monolith và service mới phức tạp |
| ✅ | Team học dần — không cần biết microservice ngay từ đầu | Tổng thời gian dài hơn big-bang (nếu big-bang thành công) |
| ✅ | Có thể dừng bất kỳ lúc nào — không bắt buộc migrate hết | Proxy layer thêm latency |

---

## 6. Các chiến lược Decomposition khác

### 6.1. Decompose by Use Case / User Story

Tách service dựa trên **user journey** hoặc **use case**:

```d2 title="6.1. Decompose by Use Case / User Story"
direction: right
user: "User"
browse: "Browse Products\nCatalog Service"
cart: "Add to Cart\nCart Service"
checkout: "Checkout\nOrder Service"
pay: "Pay\nPayment Service"
user -> browse
browse -> cart
cart -> checkout
checkout -> pay
```

**Khi nào dùng**: Khi hệ thống **user-facing** rõ ràng, các journey không chồng chéo nhiều.

**Cẩn thận**: Dễ tạo service quá nhỏ (ví dụ: "Cart Service" riêng có thể overkill nếu cart chỉ là 1 list tạm).

### 6.2. Decompose by Resource / Entity

Tách service theo **resource / entity** chính:

```
Entities:
  • User      → User Service
  • Product   → Product Service
  • Order     → Order Service
  • Review    → Review Service
```

**Cẩn thận**: Đây là cách đơn giản nhất nhưng dễ sai nhất. Nó dẫn đến **CRUD services** (service chỉ làm Create/Read/Update/Delete) — thiếu business logic, coupling cao vì logic nằm ở caller.

```
❌ Anti-pattern: Anemic Services (CRUD only)

  Order Service:          Caller (API Gateway / BFF):
  • createOrder()         • Gọi Inventory.check()
  • getOrder()            • Gọi Order.create()
  • updateOrder()         • Gọi Payment.charge()
  • deleteOrder()         • Gọi Notification.send()
                          • Xử lý error, rollback...
  
  → Business logic nằm ở caller, không ở service
  → Order Service chỉ là CRUD wrapper quanh database
  → Caller phải biết quá nhiều → tight coupling

✅ Nên: Order Service chứa business logic

  Order Service:
  • placeOrder()          ← Tự gọi Inventory, Payment bên trong
  • cancelOrder()         ← Tự xử lý hoàn tiền, hoàn kho
  • getOrderStatus()
  
  → Business logic nằm trong service
  → Caller chỉ cần biết: "placeOrder với data này"
```

### 6.3. Decompose by Volatility

Tách các phần **thay đổi thường xuyên** ra khỏi phần **ổn định**:

```d2 title="6.3. Decompose by Volatility"
direction: right
volatile: "Thay đổi tuần/ngày\nVí dụ deploy 10 lần/tuần • Canary / Feature flags" {
 pricing: Pricing — theo mùa / đối thủ / demand
 promotion: Promotion — campaign mới mỗi tuần
}
stable: "Ổn định tháng/năm\nVí dụ deploy 1 lần/tháng" {
 user: User — đăng ký / đăng nhập
}
```

**Khi nào dùng**: Khi bạn nhận thấy 1 module trong monolith **liên tục gây conflict khi merge**, hoặc **block** các team khác deploy.

### 6.4. Decompose by Team

Tách service theo **cấu trúc team** (áp dụng Conway's Law — xem [doc 04, section 6](04-autonomy-independence.md)):

```d2 title="Team Ownership và service boundary"
direction: right
alpha: "Team Alpha\n5 developers"
beta: "Team Beta\n4 developers"
gamma: "Team Gamma\n3 developers"
catalog: Catalog + Search Service
order: Order + Payment Service
user: User + Notification Service
alpha -> catalog: Owns
beta -> order: Owns
gamma -> user: Owns
```

**Khi nào dùng**: Khi bạn đã có team structure ổn định và muốn giảm cross-team dependency.

**Cẩn thận**: Tổ chức team sai → kiến trúc service sai. Phải đảm bảo team structure phản ánh **nghiệp vụ**, không phải kỹ thuật.

---

## 7. Quy trình phân tách step-by-step

### 7.1. Framework 6 bước

```d2 title="7.1. Framework 6 bước"
direction: down
n1: "1️⃣ Identify Domain\nXác định domain\n& subdomains"
n2: "2️⃣ Map Capabilities\nLiệt kê business\ncapabilities"
n3: "3️⃣ Define Boundaries\nVẽ ranh giới\nBounded Context"
n4: "4️⃣ Evaluate Dependencies\nXác định coupling\ngiữa các boundaries"
n5: "5️⃣ Design Communication\nChọn sync/async\ncho mỗi interaction"
n6: "6️⃣ Validate & Iterate\nReview với team\nĐiều chỉnh ranh giới"
n1 -> n2
n2 -> n3
n3 -> n4
n4 -> n5
n5 -> n6
n6 -> n3: "Không ổn" { style.stroke-dash: 5 }
```

```
Chi tiết:

1️⃣ IDENTIFY DOMAIN
   • Liệt kê tất cả chức năng hệ thống
   • Phân loại: Core / Supporting / Generic
   • Output: Domain map

2️⃣ MAP CAPABILITIES
   • Mỗi subdomain → liệt kê capabilities
   • Group capabilities liên quan
   • Output: Capability map

3️⃣ DEFINE BOUNDARIES
   • Mỗi group → 1 service candidate
   • Xác định data ownership
   • Xác định API boundary
   • Output: Service candidates

4️⃣ EVALUATE DEPENDENCIES
   • Vẽ dependency graph giữa các service candidates
   • Kiểm tra: có circular dependency không?
   • Kiểm tra: service A gọi B quá nhiều → nên gộp?
   • Output: Dependency graph đã optimize

5️⃣ DESIGN COMMUNICATION
   • Sync (REST/gRPC) cho query cần response ngay
   • Async (Event/Message) cho command không cần response ngay
   • Xác định data sync strategy
   • Output: Communication diagram

6️⃣ VALIDATE & ITERATE
   • Review với domain expert & team
   • Prototype 2-3 service trước
   • Điều chỉnh ranh giới dựa trên feedback thực tế
   • Output: Final service architecture
```

### 7.2. Ví dụ áp dụng — Hệ thống Food Delivery

```d2 title="7.2. Ví dụ áp dụng — Hệ thống Food Delivery"
direction: right
core: Core {
 order: Order — Tạo / Hủy / Theo dõi
 delivery: Delivery — Assign driver / Tracking / ETA
 matching: Restaurant Matching — Nearby / Ranking / Recommendation
}
supporting: Supporting {
 menu: Menu — CRUD / Giá theo giờ / Khuyến mãi
 customer: Customer Profile
 driver: Driver Management
}
generic: Generic {
 auth: Auth — Firebase
 payment: Payment — Stripe
 notification: Notification
 geo: Geo — Google Maps API
}
odb: Order DB {shape: cylinder}
ddb: Delivery DB {shape: cylinder}
rdb: Restaurant DB {shape: cylinder}
core.order -> odb
core.delivery -> ddb
core.matching -> rdb
core.order -> supporting.menu: Sync gRPC — menu / giá
core.order -> generic.payment: Sync REST — charge
core.order -> core.delivery: Async — assign driver
core.order -> generic.notification: Async — thông báo
core.delivery -> core.order: Event — status update
core.delivery <-> generic.geo: gRPC streaming / WebSocket — tracking
```

Team 1 (5 devs): Order + Payment integration; Team 2 (4): Delivery + Driver + Geo; Team 3 (3): Restaurant + Menu; Platform: Auth, Notification, Infra. Order gọi nhiều dependency vì điều phối use case đặt hàng; vẫn cần timeouts/contracts và tránh coupling quá mức.

---

## 8. Anti-patterns khi Decompose

| Anti-pattern | Mô tả | Triệu chứng | Cách fix |
|-------------|--------|-------------|----------|
| **Entity Trap** | Tách 1 entity = 1 service (CRUD services) | Service chỉ có CRUD, business logic ở caller | Tách theo business capability, không theo entity |
| **Premature Decomposition** | Tách quá sớm khi chưa hiểu domain | Ranh giới sai, phải merge lại rồi tách lại | Bắt đầu với monolith hoặc modular monolith, tách sau khi hiểu domain |
| **Distributed Monolith** | Tách service nhưng vẫn deploy cùng, share DB | Deploy 1 service = deploy N service | Tách DB, async communication, xem [doc 04](04-autonomy-independence.md) |
| **Big Bang Migration** | Rewrite toàn bộ monolith → microservice cùng lúc | Dự án 2 năm, cuối cùng cancel | Dùng Strangler Fig, migrate dần |
| **Nano-services** | Tách quá nhỏ, mỗi function 1 service | Latency cao, debug khó, overhead vận hành lớn | Gộp lại theo business capability |
| **Tech-Driven Split** | Tách theo layer kỹ thuật (UI service, Logic service, Data service) | Cross-service call cho mọi request, latency cao | Tách theo vertical slice (business capability), không horizontal layer |

```d2 title="Horizontal Split và Vertical Slice"
direction: down
horizontal: "Tech-Driven Split — sai" {
 ui: UI Layer Service
 business: Business Logic Service
 data: Data Access Service
 ui -> business -> data
}
vertical: "Business-Driven Split — đúng" {
 order: "Order\nUI + Logic + Data"
 payment: "Payment\nUI + Logic + Data"
 catalog: "Catalog\nUI + Logic + Data"
}
```

Horizontal split buộc request đi qua ba services. Vertical slice tự chứa UI logic, business logic và data access.

---

## 9. Checklist trước khi tách service

```
TRƯỚC KHI TÁCH — Hỏi những câu này:

Về Business:
  □ Service có 1 business capability rõ ràng?
  □ Service có thể hoạt động ĐỘC LẬP (không gọi 5 service khác)?
  □ Có team riêng (3-8 người) sẵn sàng own service này?
  □ Business value của việc tách > chi phí vận hành thêm?

Về Data:
  □ Service own data riêng? Có thể tách DB?
  □ Data consistency strategy đã rõ (eventual OK hay cần strong)?
  □ Migration plan cho data hiện có?

Về Technical:
  □ CI/CD pipeline riêng đã sẵn sàng?
  □ Monitoring, logging, tracing đã có?
  □ API contract đã được định nghĩa?
  □ Failure mode đã được xem xét (service chết thì sao)?

Về Communication:
  □ Sync hay async? Đã chọn xong?
  □ Có circular dependency với service khác không?
  □ Latency budget có chấp nhận được không?

Nếu có > 3 câu trả lời "Không" → CHƯA NÊN TÁCH
```

---

## 10. Tổng kết

```
┌─────────────────────────────────────────────────────────────────┐
│                    DECOMPOSITION CHEAT SHEET                    │
│                                                                 │
│  Bạn đang ở đâu?          → Chiến lược nào?                     │
│  ──────────────────          ─────────────────                  │
│                                                                 │
│  Dự án mới (Greenfield)   → Business Capability                 │
│                              hoặc DDD Subdomain                 │
│                                                                 │
│  Migrate monolith          → Strangler Fig Pattern              │
│  (Brownfield)                + chọn module theo Volatility      │
│                                                                 │
│  Domain phức tạp           → DDD Subdomain                      │
│                              (Core/Supporting/Generic)          │
│                                                                 │
│  Domain đơn giản           → Business Capability                │
│                                                                 │
│  Chưa hiểu domain rõ      → Modular Monolith trước              │
│                              → tách sau khi hiểu                │
│                                                                 │
│  ─────────────────────────────────────────────────              │
│                                                                 │
│  Quy tắc vàng:                                                  │
│  1. Tách theo NGHIỆP VỤ, không theo KỸ THUẬT                    │
│  2. Bắt đầu với SỐ ÍT service, tách thêm khi CẦN                │
│  3. Nếu không chắc → CHƯA TÁCH                                  │
│  4. Modular Monolith luôn là bước đệm tốt                       │
│  5. Strangler Fig > Big Bang rewrite                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Liên kết liên quan

| Doc | Liên quan |
|-----|-----------|
| [01 - Microservice Overview](01-microservice-overview.md) | Monolith vs Microservice — tại sao cần tách |
| [02 - SRP & Bounded Context](02-single-responsibility-bounded-context.md) | DDD Bounded Context — nền tảng cho Decompose by Subdomain |
| [03 - Loose Coupling & High Cohesion](03-loose-coupling-high-cohesion.md) | Đánh giá chất lượng ranh giới sau khi tách |
| [04 - Autonomy & Independence](04-autonomy-independence.md) | Mức độ độc lập cần đạt, Conway's Law & team ownership |
| [06 - Inter-Service Communication](06-inter-service-communication.md) | Sync vs Async — quyết định communication sau khi tách |
| [09 - Data Management](09-data-management.md) | Database per Service, Saga — xử lý data sau khi tách |
