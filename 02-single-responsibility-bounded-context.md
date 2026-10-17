# Single Responsibility & Bounded Context

## Mục lục

- [Tại sao cần hiểu SRP và Bounded Context?](#tại-sao-cần-hiểu-srp-và-bounded-context)
- [Single Responsibility Principle (SRP)](#single-responsibility-principle-srp)
  - [SRP trong OOP vs Microservice](#srp-trong-oop-vs-microservice)
  - [Ví dụ: Service vi phạm SRP](#ví-dụ-service-vi-phạm-srp)
  - [Ví dụ: Service tuân thủ SRP](#ví-dụ-service-tuân-thủ-srp)
  - [Làm sao biết service đang vi phạm SRP?](#làm-sao-biết-service-đang-vi-phạm-srp)
- [Domain-Driven Design (DDD) — Tổng quan nhanh](#domain-driven-design-ddd--tổng-quan-nhanh)
  - [DDD là gì?](#ddd-là-gì)
  - [Ubiquitous Language](#ubiquitous-language)
  - [Domain, Subdomain và Bounded Context](#domain-subdomain-và-bounded-context)
- [Bounded Context — Chi tiết](#bounded-context--chi-tiết)
  - [Bounded Context là gì?](#bounded-context-là-gì)
  - [Ví dụ: Cùng khái niệm "Product" nhưng khác ngữ cảnh](#ví-dụ-cùng-khái-niệm-product-nhưng-khác-ngữ-cảnh)
  - [Context Map — Mối quan hệ giữa các Bounded Context](#context-map--mối-quan-hệ-giữa-các-bounded-context)
  - [Các pattern quan hệ giữa Bounded Context](#các-pattern-quan-hệ-giữa-bounded-context)
- [Từ Bounded Context đến Microservice](#từ-bounded-context-đến-microservice)
  - [1 Bounded Context = 1 Microservice?](#1-bounded-context--1-microservice)
  - [Ví dụ thực tế: Hệ thống E-Commerce](#ví-dụ-thực-tế-hệ-thống-e-commerce)
  - [Ví dụ thực tế: Hệ thống quản lý Bệnh viện](#ví-dụ-thực-tế-hệ-thống-quản-lý-bệnh-viện)
  - [Ví dụ thực tế: Grab — Super App](#ví-dụ-thực-tế-grab--super-app-chi-tiết-từng-bước)
- [Cách xác định ranh giới service](#cách-xác-định-ranh-giới-service)
  - [Bước 1: Xác định Domain và Subdomain](#bước-1-xác-định-domain-và-subdomain)
  - [Bước 2: Tìm Bounded Context](#bước-2-tìm-bounded-context)
  - [Bước 3: Định nghĩa model riêng cho mỗi context](#bước-3-định-nghĩa-model-riêng-cho-mỗi-context)
  - [Bước 4: Xác định giao tiếp giữa các context](#bước-4-xác-định-giao-tiếp-giữa-các-context)
- [Anti-patterns — Những sai lầm thường gặp](#anti-patterns--những-sai-lầm-thường-gặp)
- [Tổng kết](#tổng-kết)
- [Links liên quan](#links-liên-quan)

---

## Tại sao cần hiểu SRP và Bounded Context?

Trong [doc 01](01-microservice-overview.md), ta biết Microservice cần:
- Mỗi service **làm 1 việc** (Single Responsibility)
- Mỗi service **có ranh giới rõ ràng** (Bounded Context)

Nhưng câu hỏi thực tế là: **"Làm sao biết nên tách thành bao nhiêu service? Ranh giới ở đâu?"**

Đó chính là lúc cần **SRP** và **Bounded Context** — 2 công cụ tư duy giúp bạn xác định ranh giới service đúng đắn.

```
❌ Tách sai → service quá lớn (distributed monolith)
                hoặc quá nhỏ (nano-service hell)

✅ Tách đúng → service vừa phải, độc lập, dễ maintain

            SRP + Bounded Context = Kim chỉ nam để tách đúng
```

---

## Single Responsibility Principle (SRP)

**SRP** (Single Responsibility Principle — Nguyên tắc đơn trách nhiệm) ban đầu là 1 trong 5 nguyên tắc **SOLID** trong lập trình hướng đối tượng (OOP), được đề xuất bởi **Robert C. Martin (Uncle Bob)**.

> *"A module should have one, and only one, reason to change."*
> — Robert C. Martin

### SRP trong OOP vs Microservice

| | SRP trong OOP | SRP trong Microservice |
|--|--------------|----------------------|
| **Áp dụng cho** | Class / Module | Service |
| **"1 việc" nghĩa là** | 1 class chỉ có 1 lý do để thay đổi | 1 service chỉ phụ trách **1 business capability** |
| **Ví dụ** | Class `UserRepository` chỉ lo truy xuất DB user | `User Service` chỉ lo quản lý user (CRUD, profile, authentication) |
| **Vi phạm** | Class `UserManager` vừa query DB, vừa gửi email, vừa generate PDF | `Order Service` vừa quản lý đơn hàng, vừa xử lý thanh toán, vừa gửi notification |

### Ví dụ: Service vi phạm SRP

```d2 title="Ví dụ: Service vi phạm SRP"
direction: down
order: Order Service — God Service {
 responsibilities: "Tạo / sửa / xóa order\nTính giá • Mã giảm giá\nThanh toán Stripe / VNPay\nTồn kho • Email xác nhận\nVận đơn • Báo cáo doanh thu"
 db: "Shared Database\norders • payments • inventory • shipments" {shape: cylinder}
 responsibilities -> db
}
```

Đổi payment phải test lại Order; thêm gateway payment phải deploy cả service; hai team coordinate liên tục; bug Notification có thể kéo sập đặt hàng.

### Ví dụ: Service tuân thủ SRP

```d2 title="Ví dụ: Service tuân thủ SRP"
direction: right
order: "Order Service" {
 model: "Tạo • Sửa • Hủy • Trạng thái order"
 db: "Order DB" {shape: cylinder}
 model -> db
}
payment: "Payment Service" {
 model: "Thanh toán • Hoàn tiền • Lịch sử TT"
 db: "Payment DB" {shape: cylinder}
 model -> db
}
inventory: "Inventory Service" {
 model: "Kiểm tồn • Cập nhật • Cảnh báo hết hàng"
 db: "Inventory DB" {shape: cylinder}
 model -> db
}
shipping: "Shipping Service" {
 model: "Vận đơn • Tracking • Đối soát"
 db: "Shipping DB" {shape: cylinder}
 model -> db
}
notification: "Notification Service" {
 model: "Email • SMS • Push"
 db: "Notification DB" {shape: cylinder}
 model -> db
}
```

Thay cổng thanh toán chỉ sửa Payment; tách notification giảm blast radius; mỗi team có thể deploy riêng khi contracts tương thích.

### Làm sao biết service đang vi phạm SRP?

Đặt các câu hỏi sau:

| Dấu hiệu | Câu hỏi kiểm tra | Vi phạm nếu... |
|-----------|-------------------|-----------------|
| **Nhiều lý do thay đổi** | "Service này thay đổi khi nào?" | Trả lời được > 1 lý do nghiệp vụ khác nhau |
| **Nhiều team cùng sửa** | "Bao nhiêu team cần sửa service này?" | > 1 team thường xuyên sửa |
| **Quá nhiều bảng DB** | "Service này sở hữu bao nhiêu bảng?" | > 5-7 bảng không liên quan chặt chẽ |
| **Tên quá chung chung** | "Tên service có mô tả rõ ràng không?" | Tên kiểu `CommonService`, `UtilityService`, `MainService` |
| **Deploy sợ hãi** | "Có sợ deploy service này không?" | Phải test rất nhiều thứ không liên quan khi deploy |

> 💡 **Quy tắc ngón tay cái:** Nếu bạn không thể mô tả service trong **1 câu ngắn** mà không dùng từ "và" — nó có thể đang vi phạm SRP.
>
> ✅ "Order Service **quản lý vòng đời đơn hàng**"
> ❌ "Order Service **quản lý đơn hàng VÀ thanh toán VÀ giao hàng**"

---

## Domain-Driven Design (DDD) — Tổng quan nhanh

### DDD là gì?

**DDD** (Domain-Driven Design — Thiết kế hướng miền) là một phương pháp thiết kế phần mềm do **Eric Evans** giới thiệu năm 2003, tập trung vào việc **mô hình hóa phần mềm theo nghiệp vụ thực tế**.

```
Truyền thống:  Dev nghĩ về database, table, API trước
               → Phần mềm xa rời nghiệp vụ

DDD:           Dev + Business Expert cùng trao đổi
               → Mô hình phần mềm phản ánh đúng thực tế
```

DDD rất rộng, nhưng trong Microservice, ta chủ yếu quan tâm đến **Strategic DDD** — bao gồm:

```d2 title="DDD là gì?"
direction: down
n1: "🎯 Domain-Driven Design"
n2: "📐 Strategic DDD\n(Quan trọng cho Microservice)"
n3: "🔧 Tactical DDD\n(Chi tiết implementation)"
n4: "Ubiquitous Language\nNgôn ngữ chung"
n5: "Domain & Subdomain\nMiền nghiệp vụ"
n6: "Bounded Context\nRanh giới ngữ cảnh"
n7: "Context Map\nBản đồ quan hệ"
n8: "Entity"
n9: "Value Object"
n10: "Aggregate"
n11: "Repository"
n1 -> n2
n1 -> n3
n2 -> n4
n2 -> n5
n2 -> n6
n2 -> n7
n3 -> n8
n3 -> n9
n3 -> n10
n3 -> n11
```

### Ubiquitous Language

**Ubiquitous Language** (ngôn ngữ chung) là nguyên tắc: **Dev và Business phải dùng cùng một thuật ngữ**.

```
❌ Không có Ubiquitous Language:

Business nói:  "Khách hàng đặt đơn"
Dev hiểu:      "User tạo record trong bảng transactions"
Tester nói:    "Account submit request"

→ 3 người nói 3 kiểu → hiểu nhầm → bug

✅ Có Ubiquitous Language:

Business nói:  "Customer places an Order"
Dev code:      customer.placeOrder(order)
Tester test:   "Customer places Order → Order created"
DB schema:     table: customers, table: orders

→ Tất cả nói cùng 1 ngôn ngữ → ít hiểu nhầm
```

> 💡 **Tại sao quan trọng cho Microservice?** Vì mỗi Bounded Context sẽ có Ubiquitous Language **riêng** — cùng 1 từ nhưng ở context khác sẽ mang ý nghĩa khác.

### Domain, Subdomain và Bounded Context

Hình dung đơn giản nhất:

- **Domain** = toàn bộ bài toán kinh doanh (cả công ty)
- **Subdomain** = từng mảng nghiệp vụ (từng phòng ban)
- **Bounded Context** = ranh giới mà thuật ngữ có nghĩa riêng → cơ sở để tách Microservice

```
Ví dụ: Bạn mở công ty bán hàng online (Tiki)

🏢 Domain = "Tiki" (toàn bộ hoạt động kinh doanh)

Hỏi: "Công ty cần những phòng ban nào?"

⭐ Core (tạo lợi thế cạnh tranh - không ai làm thay được):
   → Phòng "Gợi ý sản phẩm" (thuật toán AI riêng của Tiki)
   → Phòng "Flash Sale" (chiến lược giảm giá riêng)

🔧 Supporting (hỗ trợ, tự xây):
   → Phòng "Đơn hàng"
   → Phòng "Kho hàng"
   → Phòng "Giao vận"

📦 Generic (thuê ngoài được):
   → Phòng "Thanh toán" (dùng VNPay, Momo)
   → Phòng "Gửi email/SMS" (dùng SendGrid)
```

Bounded Context — mỗi phòng ban hiểu 1 từ theo cách riêng:

```
Từ "Khách hàng" trong công ty Tiki:

📦 Phòng Kho:      "Khách hàng? Tôi chỉ cần biết ĐỊA CHỈ GIAO"
💰 Phòng Kế toán:  "Khách hàng? Tôi cần MÃ SỐ THUẾ, CÔNG NỢ"
🎯 Phòng Marketing:"Khách hàng? Tôi cần TUỔI, SỞ THÍCH, HÀNH VI MUA"
🛒 Phòng Bán hàng: "Khách hàng? Tôi cần TÊN, SĐT, LỊCH SỬ MUA"

→ Cùng 1 từ "Khách hàng" nhưng mỗi phòng hiểu KHÁC NHAU
→ Mỗi phòng = 1 Bounded Context
→ Mỗi phòng giữ RIÊNG thông tin nó cần, không cần biết phòng khác
```

Biểu đồ tổng quan:

```d2 title="Domain, Subdomain và Bounded Context"
direction: down
n4: "🏢 Domain: E-Commerce" {}
n4.n3: "📦 Generic Subdomain\n(Chung chung, mua/dùng SaaS)" {}
n4.n2: "🔧 Supporting Subdomain\n(Hỗ trợ core, tự build)" {}
n4.n1: "⭐ Core Subdomain\n(Lợi thế cạnh tranh)" {}
n4.n1.n5: "Pricing & Promotion\nChiến lược giá thông minh"
n4.n1.n6: "Recommendation\nGợi ý sản phẩm"
n4.n2.n7: "Order Management\nQuản lý đơn hàng"
n4.n2.n8: "Inventory\nQuản lý tồn kho"
n4.n3.n9: "Payment\nThanh toán (Stripe)"
n4.n3.n10: "Email/SMS\nThông báo (SendGrid)"
n4.n3.n11: "Auth\nXác thực (Auth0)"
```

| Loại Subdomain | Đặc điểm | Chiến lược | Ví dụ |
|---------------|-----------|------------|-------|
| **Core** | Tạo ra lợi thế cạnh tranh, khác biệt với đối thủ | **Đầu tư mạnh**, team giỏi nhất, tự phát triển | Thuật toán gợi ý của Netflix, matching của Tinder |
| **Supporting** | Hỗ trợ core, không có trên thị trường | Tự build, nhưng **không cần phức tạp** | Order management, Inventory |
| **Generic** | Chung chung, ai cũng cần | **Mua SaaS hoặc dùng open-source** | Auth, Email, Payment gateway |

---

## Bounded Context — Chi tiết

### Bounded Context là gì?

**Bounded Context** (ngữ cảnh có ranh giới) là **ranh giới rõ ràng** trong đó một model nghiệp vụ có ý nghĩa nhất quán. Bên trong ranh giới, mọi thuật ngữ đều có **1 định nghĩa duy nhất**.

Nói đơn giản: **Bounded Context = "Trong phạm vi này, từ X có nghĩa là Y"**.

### Ví dụ: Cùng khái niệm "Product" nhưng khác ngữ cảnh

Đây là ví dụ kinh điển để hiểu Bounded Context:

```d2 title='Ví dụ: Cùng khái niệm "Product" nhưng khác ngữ cảnh'
direction: right
catalog: "Catalog Context" { model: "Product\nname • description • images[]\ncategory • specifications" }
pricing: "Pricing Context" { model: "Product\nbasePrice • discount • taxRate\nfinalPrice() • currency" }
inventory: "Inventory Context" { model: "Product\nsku • quantity • warehouse • reorderLevel" }
shipping: "Shipping Context" { model: "Product\nweight • dimensions • isFragile • shippingClass" }
```

Cùng từ Product, khác model theo Bounded Context; không dùng một shared model cho mọi ngữ cảnh.

**Nếu KHÔNG có Bounded Context** — dùng chung 1 model:

```
❌ Shared "God Model" — 1 model cho tất cả

class Product {
    // Catalog cần
    name, description, images[], category, specifications

    // Pricing cần
    basePrice, discount, taxRate, currency

    // Inventory cần
    sku, quantity, warehouse, reorderLevel

    // Shipping cần
    weight, dimensions, isFragile, shippingClass

    // → 20+ fields, ai cũng phụ thuộc vào
    // → Sửa 1 field cho Shipping có thể break Catalog
    // → Đây chính là vấn đề Monolith!
}
```

**Có Bounded Context** — mỗi context có model riêng:

```
✅ Mỗi context định nghĩa "Product" theo cách riêng

// Catalog Context
class CatalogProduct {
    name, description, images[], category
    // Chỉ có gì Catalog cần, không biết gì về giá hay tồn kho
}

// Inventory Context  
class InventoryItem {
    sku, quantity, warehouse
    // Thậm chí không gọi là "Product" mà là "InventoryItem"!
    // Vì trong kho, người ta nghĩ về "mặt hàng tồn kho"
}

→ Mỗi context ĐỘC LẬP, sửa 1 context không ảnh hưởng context khác
```

### Context Map — Mối quan hệ giữa các Bounded Context

Các Bounded Context không hoàn toàn cô lập — chúng cần **trao đổi dữ liệu** với nhau. **Context Map** là bản đồ mô tả cách chúng tương tác.

```d2 title="Context Map — Mối quan hệ giữa các Bounded Context"
direction: right
n1: "📦 Catalog\nContext"
n2: "💰 Pricing\nContext"
n3: "📊 Inventory\nContext"
n4: "🛒 Order\nContext" {
  style.fill: "#1a1a2e"
  style.stroke: "#00d9ff"
  style.font-color: "#fff"
}
n5: "🚚 Shipping\nContext"
n6: "💳 Payment\nContext"
n1 -> n4: "productId,\nname"
n2 -> n4: "finalPrice"
n3 -> n4: "isAvailable"
n4 -> n5: "orderId,\nitems"
n4 -> n6: "totalAmount"
n3 -> n5: "weight,\ndimensions"
```

> 💡 **Lưu ý:** Mỗi context chỉ chia sẻ **dữ liệu cần thiết**, không phải toàn bộ model. Order Context chỉ cần `productId` + `name` từ Catalog, không cần `images[]` hay `specifications`.

### Các pattern quan hệ giữa Bounded Context

Khi 2 Bounded Context cần tương tác, có nhiều cách thiết kế mối quan hệ:

| Pattern | Mô tả | Khi nào dùng | Ví dụ |
|---------|--------|-------------|-------|
| **Shared Kernel** | 2 context chia sẻ 1 phần model chung | Khi 2 context thuộc cùng team, cần sync chặt | User ID dùng chung giữa Auth và Profile |
| **Customer-Supplier** | Context "nhà cung cấp" cung cấp API cho context "khách hàng" | Khi 1 context phụ thuộc context khác | Order (customer) gọi Inventory (supplier) |
| **Conformist** | Context downstream chấp nhận hoàn toàn model của upstream | Khi dùng API bên ngoài, không thể thay đổi | Dùng Stripe API → tuân theo model của Stripe |
| **Anti-corruption Layer (ACL)** | Lớp chuyển đổi giữa 2 context để chúng không ảnh hưởng nhau | Khi tích hợp hệ thống cũ (legacy) hoặc bên thứ 3 | Adapter chuyển đổi XML từ hệ thống cũ sang JSON |
| **Open Host Service** | Context public hóa API rõ ràng cho nhiều consumer | Khi nhiều context cần dùng | Product Catalog cung cấp REST API public |
| **Published Language** | Dùng format chung để trao đổi (JSON, Protobuf, Avro) | Khi cần interoperability | Event dùng Avro schema trên Kafka |

```d2 title="Anti-corruption Layer — JSON và Legacy SOAP"
direction: right
order: "Order Service\nNew • JSON"
acl: "ACL / Adapter\nJSON ↔ XML"
legacy: "Legacy ERP\nOld • XML / SOAP"
order <-> acl
acl <-> legacy
```

Order Service không cần biết Legacy dùng XML. Legacy thay đổi format thì chỉ sửa ACL, không sửa Order Service.

---

## Từ Bounded Context đến Microservice

### 1 Bounded Context = 1 Microservice?

**Thường thì đúng, nhưng không phải luôn luôn.**

```d2 title="1 Bounded Context = 1 Microservice?"
direction: down
n1: "Quy tắc chuyển đổi" {}
n1.n2: "1 Bounded Context\n= 1 Microservice ✅\n(trường hợp phổ biến nhất)"
n1.n3: "1 Bounded Context\n= N Microservices ✅\n(khi context quá lớn)"
n1.n4: "N Bounded Contexts\n= 1 Microservice ⚠️\n(khi context quá nhỏ,\nnên gộp lại)"
```

| Trường hợp | Khi nào | Ví dụ |
|-----------|---------|-------|
| **1 BC = 1 Service** | Context có kích thước vừa phải | Order Context → Order Service |
| **1 BC = N Services** | Context lớn, có thể tách nhỏ thêm | User Context → Auth Service + Profile Service + Preferences Service |
| **N BC = 1 Service** | Context quá nhỏ, overhead không đáng | Currency Context + Tax Context → Pricing Service |

> 💡 **Quy tắc thực tế:** Bắt đầu với **1 BC = 1 Service**. Chỉ tách nhỏ hơn khi service **thực sự quá lớn** (> 2 team cùng sửa, deploy quá chậm). Chỉ gộp khi service **quá nhỏ** (chỉ có 1-2 API, traffic rất ít).

### Ví dụ thực tế: Hệ thống E-Commerce

Từ phân tích domain → subdomain → bounded context → microservice:

```d2 title="Ví dụ thực tế: Hệ thống E-Commerce"
direction: down
n4: "🏢 Domain: E-Commerce Platform" {}
n4.n3: "📦 Generic Subdomain" {}
n4.n2: "🔧 Supporting Subdomain" {}
n4.n1: "⭐ Core Subdomain" {}
n4.n1.n5: "📦 Catalog Context\n→ Catalog Service"
n4.n1.n6: "💰 Pricing Context\n→ Pricing Service"
n4.n1.n7: "🎯 Recommendation Context\n→ Recommendation Service"
n4.n2.n8: "🛒 Order Context\n→ Order Service"
n4.n2.n9: "📊 Inventory Context\n→ Inventory Service"
n4.n2.n10: "🚚 Shipping Context\n→ Shipping Service"
n4.n2.n11: "👤 Customer Context\n→ Customer Service"
n4.n3.n12: "💳 Payment Context\n→ Payment Service\n(wrap Stripe)"
n4.n3.n13: "📧 Notification Context\n→ Notification Service\n(wrap SendGrid)"
n4.n3.n14: "🔐 Auth Context\n→ Auth Service\n(wrap Auth0)"
```

Mỗi service có **model riêng** cho khái niệm "Customer":

```d2 title="Ví dụ thực tế: Hệ thống E-Commerce"
direction: right
customer: "Customer Context" { model: "Customer\nid • fullName • email • phone\ndateOfBirth • preferences\nloyaltyPoints • addresses[]" }
order: "Order Context" { model: "OrderCustomer\ncustomerId • name • shippingAddress" }
payment: "Payment Context" { model: "Payer\ncustomerId • billingAddress • paymentMethods[]" }
notification: "Notification Context" { model: "Recipient\ncustomerId • email • phone\npreferences: email / SMS / push" }
```

Model và cả tên gọi thay đổi theo ngữ cảnh: Order chỉ giữ thông tin cho đơn hàng, Payment gọi đối tượng là Payer.

### Ví dụ thực tế: Hệ thống quản lý Bệnh viện

Đi qua từng bước từ Domain → Subdomain → Bounded Context → Microservice.

**Bước 1: Xác định Domain và Subdomain**

```
🏥 Domain = "Hệ thống quản lý Bệnh viện"

Hỏi: "Bệnh viện có những mảng nghiệp vụ nào?"

⭐ Core Subdomain (lõi, tạo giá trị chính):
   → Khám chữa bệnh (Clinical)
   → Hồ sơ bệnh án (Medical Records)

🔧 Supporting Subdomain (hỗ trợ, tự xây):
   → Đặt lịch khám (Appointment)
   → Quản lý giường bệnh (Ward/Bed Management)
   → Quản lý thuốc & kho dược (Pharmacy)
   → Xét nghiệm (Laboratory)
   → Thanh toán viện phí (Billing)
   → Nhân sự (Staff Management)

📦 Generic Subdomain (thuê ngoài):
   → Xác thực đăng nhập (Auth — dùng Keycloak)
   → Gửi SMS/Email nhắc lịch (Notification — dùng Twilio)
   → Thanh toán online (Payment Gateway — dùng VNPay)
```

**Bước 2: Tìm Bounded Context — phân tích ngôn ngữ**

Cùng từ **"Bệnh nhân" (Patient)** — mỗi phòng ban hiểu khác nhau:

```
🗓️ Appointment Context:
   Patient = { name, phone, appointmentDate, doctorId }
   → "Bệnh nhân? Tôi cần TÊN, SĐT, NGÀY HẸN, BÁC SĨ NÀO"

🩺 Clinical Context:
   Patient = { medicalHistory, allergies, symptoms, vitalSigns }
   → "Bệnh nhân? Tôi cần TRIỆU CHỨNG, TIỀN SỬ BỆNH, DỊ ỨNG"

💊 Pharmacy Context:
   PrescriptionOwner = { patientId, prescriptions[], drugAllergies[] }
   → "Bệnh nhân? Tôi chỉ cần ĐƠN THUỐC, DỊ ỨNG THUỐC"
   → Thậm chí gọi là "Prescription Owner" chứ không phải "Patient"!

🧪 Laboratory Context:
   TestSubject = { sampleId, testType, results[] }
   → "Bệnh nhân? Tôi cần MẪU XÉT NGHIỆM, KẾT QUẢ, CHỈ SỐ"
   → Gọi là "Test Subject" — vì phòng lab nghĩ về mẫu xét nghiệm

💰 Billing Context:
   AccountHolder = { patientId, servicesUsed[], insuranceInfo, totalDue }
   → "Bệnh nhân? Tôi cần DỊCH VỤ ĐÃ DÙNG, BẢO HIỂM, CÔNG NỢ"
   → Gọi là "Account Holder"

🛏️ Ward Context:
   Inpatient = { patientId, bedNumber, roomNumber, admissionDate, dietaryNeeds }
   → "Bệnh nhân? Tôi cần GIƯỜNG NÀO, PHÒNG NÀO, NGÀY NHẬP VIỆN"
   → Gọi là "Inpatient" (bệnh nhân nội trú)
```

Tương tự, từ **"Bác sĩ" (Doctor)** cũng khác nhau ở mỗi context:

```
🗓️ Appointment:  Doctor = { name, specialty, availableSlots[] }
🩺 Clinical:     Doctor = { licenseNumber, qualifications, treatmentHistory[] }
💰 Billing:      Doctor = { consultationFee, revenueShare }
👥 Staff Mgmt:   Doctor = { salary, workingHours, leaveBalance, department }

→ Cùng 1 "Bác sĩ Nguyễn Văn A" nhưng mỗi context lưu thông tin KHÁC NHAU
```

**Bước 3: Mapping Bounded Context → Microservice**

```
Bounded Context → Microservice:
═══════════════════════════════════════════════

⭐ Core:
   Clinical Context        → Clinical Service
   Medical Records Context → Medical Records Service

🔧 Supporting:
   Appointment Context     → Appointment Service
   Ward Context            → Ward Service
   Pharmacy Context        → Pharmacy Service
   Laboratory Context      → Laboratory Service
   Billing Context         → Billing Service
   Staff Context           → Staff Service

📦 Generic:
   Auth Context            → Auth Service (Keycloak)
   Notification Context    → Notification Service (Twilio)
   Payment Context         → Payment Service (VNPay)
```

Cân nhắc gộp:

| Gộp? | Lý do |
|------|-------|
| Clinical + Medical Records → **Clinical Service** | Liên quan chặt, cùng team bác sĩ quản lý |
| Laboratory giữ riêng ✅ | Phòng xét nghiệm vận hành độc lập, tech khác |
| Pharmacy giữ riêng ✅ | Kho dược phức tạp, quy định riêng biệt |
| Auth + Notification → **dùng SaaS** | Không cần tự build, thuê ngoài |

**Bước 4: Luồng giao tiếp — "Bệnh nhân đi khám bệnh"**

```d2 title="Ví dụ thực tế: Hệ thống quản lý Bệnh viện"
shape: sequence_diagram
"APP": "🗓️ Appointment"
"CLI": "🩺 Clinical"
"LAB": "🧪 Laboratory"
"PHA": "💊 Pharmacy"
"BIL": "💰 Billing"
"NOTI": "📧 Notification"
"APP".note1: "Bệnh nhân đặt lịch khám"
"APP" -> "CLI": "patientId, appointmentId (sync)"
"CLI".note2: "Bác sĩ khám, chẩn đoán"
"CLI" -> "LAB": "Yêu cầu xét nghiệm máu (sync)"
"LAB" -> "CLI": "Kết quả: chỉ số bình thường ✅" { style.stroke-dash: 5 }
"CLI".note3: "Bác sĩ kê đơn thuốc"
"CLI" -> "PHA": "Event: PrescriptionCreated (async)" { style.stroke-dash: 5; target-arrowhead.style.filled: false }
"CLI" -> "BIL": "Event: ConsultationCompleted (async)" { style.stroke-dash: 5; target-arrowhead.style.filled: false }
"PHA".note4: "Chuẩn bị thuốc"
"PHA" -> "BIL": "Event: MedicineDispensed (async)" { style.stroke-dash: 5; target-arrowhead.style.filled: false }
"BIL".note5: "Tổng hợp viện phí"
"BIL" -> "NOTI": "Event: InvoiceReady (async)" { style.stroke-dash: 5; target-arrowhead.style.filled: false }
"NOTI".note6: "Gửi SMS hóa đơn cho bệnh nhân"
```

**Bước 5: Mỗi service giữ data riêng**

```d2 title="Ví dụ thực tế: Hệ thống quản lý Bệnh viện"
direction: right
appointment: "Appointment Service" {
 model: "patient: name, phone, doctorId, timeSlot"
 db: "Appointment DB — PostgreSQL" {shape: cylinder}
 model -> db
}
clinical: "Clinical Service" {
 model: "patient: history, allergies, symptoms, diagnosis"
 db: "Clinical DB — MongoDB" {shape: cylinder}
 model -> db
}
lab: "Laboratory Service" {
 model: "testSubject: sampleId, testType, results[]"
 db: "Lab DB — PostgreSQL" {shape: cylinder}
 model -> db
}
pharmacy: "Pharmacy Service" {
 model: "prescOwner: patientId, drugs[], drugAllerg"
 db: "Pharmacy DB — PostgreSQL" {shape: cylinder}
 model -> db
}
billing: "Billing Service" {
 model: "acctHolder: patientId, services[], insurance, totalDue"
 db: "Billing DB — PostgreSQL" {shape: cylinder}
 model -> db
}
ward: "Ward Service" {
 model: "inpatient: patientId, bed 3A, room 201, diet"
 db: "Ward DB — Redis" {shape: cylinder}
 model -> db
}
# Icons: https://icons.d2lang.com/
appointment.db.icon: "https://icons.d2lang.com/dev/postgresql.svg"
clinical.db.icon: "https://icons.d2lang.com/dev/mongodb.svg"
lab.db.icon: "https://icons.d2lang.com/dev/postgresql.svg"
pharmacy.db.icon: "https://icons.d2lang.com/dev/postgresql.svg"
billing.db.icon: "https://icons.d2lang.com/dev/postgresql.svg"
ward.db.icon: "https://icons.d2lang.com/dev/redis.svg"
```

Cùng bệnh nhân Nguyễn Văn A nhưng mỗi service chỉ lưu phần cần thiết, không service nào buộc biết toàn bộ hồ sơ.

### Ví dụ thực tế: Grab — Super App (chi tiết từng bước)

Ví dụ phức tạp hơn — app gọi xe, giao đồ ăn.

**Bước 1: Xác định Domain và Subdomain**

```
🏢 Domain = "Grab — Super App"

"Grab kiếm tiền bằng cách nào?"
→ Kết nối người cần di chuyển/đặt đồ ăn với tài xế/nhà hàng
  và thu phí mỗi giao dịch

⭐ Core Subdomain (lợi thế cạnh tranh, đối thủ không copy được):
   → Matching — ghép rider ↔ driver gần nhất, thông minh nhất
   → Pricing — tính giá theo demand, surge pricing, khuyến mãi
   → ETA — ước tính thời gian đến (dùng AI/ML)

🔧 Supporting Subdomain (tự build, hỗ trợ core):
   → Ride Management — quản lý chuyến đi
   → Driver Management — quản lý tài xế, tài liệu, xe
   → Rider Management — quản lý khách hàng
   → Food Delivery — đặt đồ ăn
   → Restaurant Management — quản lý nhà hàng, menu
   → Rating & Review — đánh giá
   → Wallet — ví điện tử GrabPay
   → Promotion — mã khuyến mãi, voucher

📦 Generic Subdomain (thuê ngoài / dùng SaaS):
   → Auth — đăng nhập OTP, Google, Facebook
   → Payment Gateway — liên kết thẻ, chuyển khoản
   → Notification — push, SMS, email
   → Map & Routing — bản đồ, tìm đường (Google Maps API)
   → Chat — nhắn tin rider ↔ driver
```

**Bước 2: Tìm Bounded Context — phân tích ngôn ngữ**

Từ **"USER"** — mỗi context hiểu hoàn toàn khác:

```
👤 Rider Context:
   User = Rider (người đi xe)
   { name, phone, savedAddresses[], rideHistory[] }

🚗 Driver Context:
   User = Driver (tài xế)
   { name, phone, licensePlate, vehicleType,
     documents[], onlineStatus, currentLocation }

🍔 Restaurant Context:
   User = Restaurant Owner (chủ nhà hàng)
   { restaurantName, address, openingHours, menuItems[] }

💰 Billing Context:
   User = Account (tài khoản tài chính)
   { balance, bankAccount, commissionRate, payoutHistory[] }

⭐ Rating Context:
   User = Rateable (đối tượng được đánh giá)
   { averageRating, totalTrips, reviews[] }

→ 5 context khác nhau, cùng từ "User" nhưng nghĩa hoàn toàn khác!
```

Từ **"TRIP" / "ORDER"** — cũng khác ở mỗi context:

```
🚗 Ride Context:
   Trip = { pickupLocation, dropoffLocation, distance,
            riderId, driverId, status, route[] }

💰 Pricing Context:
   Trip = PriceCalculation
   { distance, duration, surgeMultiplier, promoCode,
     baseFare, finalFare }
   → Không care route hay driver, chỉ care TIỀN

📊 Analytics Context:
   Trip = TripMetric
   { completionTime, waitTime, cancellationReason,
     customerSatisfaction }
   → Không care chi tiết, chỉ care SỐ LIỆU

🍔 Food Delivery Context:
   Trip = Delivery
   { restaurantLocation, customerLocation, items[],
     preparationTime, deliveryTime }
   → Gọi là "Delivery" không phải "Trip"!

💳 Wallet Context:
   Trip = Transaction
   { amount, type: "ride_payment", from, to, timestamp }
   → Chỉ là 1 dòng giao dịch, không biết gì về route
```

Từ **"LOCATION"** — khác biệt rất rõ:

```
🚗 Ride Context:
   Location = { lat, lng, address, landmark }
   → Điểm đón / trả khách

🗺️ Map Context:
   Location = GeoPoint
   { lat, lng, roadSegmentId, trafficDensity }
   → Dữ liệu bản đồ, giao thông

🔍 Matching Context:
   Location = DriverPosition
   { lat, lng, heading, speed, lastUpdated }
   → Vị trí real-time của tài xế, cập nhật mỗi 3 giây

📊 Analytics Context:
   Location = HotZone
   { areaId, demandLevel, avgWaitTime, driverSupply }
   → Vùng nóng, thống kê cung-cầu
```

**Bước 3: Mapping Bounded Context → Microservice**

```d2 title="Ví dụ thực tế: Grab — Super App (chi tiết từng bước)"
direction: down
n3: "📦 Generic — Dùng SaaS / wrap API" {}
n2: "🔧 Supporting — Tự build" {}
n1: "⭐ Core — Tự build, team giỏi nhất" {}
n1.n4: "🔍 Matching Service\nGhép rider ↔ driver\nTech: Go + Redis"
n1.n5: "💰 Pricing Service\nTính giá, surge pricing\nTech: Go + Redis"
n1.n6: "⏱️ ETA Service\nƯớc tính thời gian\nTech: Python + ML Model"
n2.n7: "🚗 Ride Service\nQuản lý chuyến đi\nTech: Java + PostgreSQL"
n2.n8: "👤 Rider Service\nQuản lý khách hàng\nTech: Node.js + PostgreSQL"
n2.n9: "🚙 Driver Service\nQuản lý tài xế\nTech: Java + PostgreSQL"
n2.n10: "🍔 Food Service\nĐặt đồ ăn\nTech: Java + MongoDB"
n2.n11: "🏪 Restaurant Service\nQuản lý nhà hàng\nTech: Node.js + PostgreSQL"
n2.n12: "⭐ Rating Service\nĐánh giá\nTech: Node.js + MongoDB"
n2.n13: "👛 Wallet Service\nVí GrabPay\nTech: Java + PostgreSQL"
n2.n14: "🎁 Promotion Service\nVoucher, mã giảm giá\nTech: Go + Redis"
n3.n15: "🔐 Auth Service\nwrap Firebase Auth"
n3.n16: "💳 Payment Gateway\nwrap Stripe/VNPay"
n3.n17: "📧 Notification Service\nwrap Twilio + FCM"
n3.n18: "🗺️ Map Service\nwrap Google Maps API"
n3.n19: "💬 Chat Service\nwrap SendBird"
```

**Bước 4: Luồng giao tiếp — "Khách gọi xe GrabBike"**

```d2 title="Ví dụ thực tế: Grab — Super App (chi tiết từng bước)"
shape: sequence_diagram
"R": "👤 Rider App"
"RIDE": "🚗 Ride Service"
"PRICE": "💰 Pricing Service"
"ETA": "⏱️ ETA Service"
"MATCH": "🔍 Matching Service"
"DRIVER": "🚙 Driver Service"
"NOTI": "📧 Notification"
"WALLET": "👛 Wallet"
"RATE": "⭐ Rating"
"R" -> "RIDE": "Đặt xe (pickup, dropoff)"
"RIDE" -> "PRICE": "Tính giá? (distance, time)"
"PRICE" -> "RIDE": "35.000đ (surge x1.2)" { style.stroke-dash: 5 }
"RIDE" -> "ETA": "Ước tính thời gian?"
"ETA" -> "RIDE": "~15 phút" { style.stroke-dash: 5 }
"RIDE" -> "R": "Hiển thị: 35.000đ, ~15 phút" { style.stroke-dash: 5 }
"R" -> "RIDE": "Xác nhận đặt xe ✅"
"RIDE" -> "MATCH": "Tìm tài xế gần nhất"
"MATCH" -> "DRIVER": "Lấy vị trí tài xế online"
"DRIVER" -> "MATCH": "[Driver A: 1.2km, Driver B: 2.5km]" { style.stroke-dash: 5 }
"MATCH" -> "RIDE": "Driver A được chọn" { style.stroke-dash: 5 }
"RIDE" -> "NOTI": "Event: DriverAssigned (async)" { style.stroke-dash: 5; target-arrowhead.style.filled: false }
"NOTI".note1: "Push notification cho cả rider + driver"
"RIDE".note2: "... Tài xế đón khách, chạy, trả khách ..."
"RIDE" -> "WALLET": "Event: RideCompleted (async)" { style.stroke-dash: 5; target-arrowhead.style.filled: false }
"WALLET".note3: "Trừ 35.000đ từ rider\nCộng 28.000đ cho driver (trừ 20% phí)"
"RIDE" -> "RATE": "Event: RideCompleted (async)" { style.stroke-dash: 5; target-arrowhead.style.filled: false }
"RATE".note4: "Hiển thị form đánh giá"
"RIDE" -> "NOTI": "Event: RideCompleted (async)" { style.stroke-dash: 5; target-arrowhead.style.filled: false }
"NOTI".note5: "Gửi hóa đơn qua email"
```

**Bước 5: Mỗi service giữ data riêng**

Cùng 1 chuyến đi **"Ride #12345"**, mỗi service lưu KHÁC NHAU:

```
🚗 Ride Service (source of truth cho chuyến đi):
   ride: {
     id: 12345, status: "completed",
     riderId: "R001", driverId: "D055",
     pickup: "123 Nguyễn Huệ", dropoff: "456 Lê Lợi",
     startTime: "10:00", endTime: "10:25"
   }

💰 Pricing Service (chỉ biết về giá):
   priceCalculation: {
     rideId: 12345,
     baseFare: 12000, distanceFare: 18000,
     surgeMultiplier: 1.2, promoDiscount: -5000,
     finalFare: 35000
   }

👛 Wallet Service (chỉ biết về tiền):
   transactions: [
     { type: "ride_payment", rideId: 12345,
       from: "R001", amount: -35000 },
     { type: "driver_earning", rideId: 12345,
       to: "D055", amount: +28000 },
     { type: "platform_fee", rideId: 12345,
       amount: +7000 }
   ]

⭐ Rating Service (chỉ biết về đánh giá):
   review: {
     rideId: 12345,
     riderRating: 5, riderComment: "Tài xế thân thiện",
     driverRating: 4, driverComment: "Khách OK"
   }

🔍 Matching Service (chỉ biết vị trí real-time):
   → Dữ liệu trong Redis, hết chuyến thì XÓA
   driverPositions: {
     "D055": { lat: 10.78, lng: 106.69, updated: "10:02" }
   }

→ KHÔNG CÓ service nào biết TẤT CẢ thông tin
→ Mỗi service chỉ giữ đúng phần nó cần
→ Đây chính là sức mạnh của Bounded Context!
```

**Bước 6: Tổng kết — từ Domain đến Microservice**

```d2 title="Ví dụ thực tế: Grab — Super App (chi tiết từng bước)"
direction: right
grab: Domain Grab {
 core: Core Subdomain {
  matching: Matching Context → Service — Go + Redis
  pricing: Pricing Context → Service — Go + Redis
  eta: ETA Context → Service — Python + ML
 }
 support: Supporting Subdomain {
  ride: Ride Context → Service — Java + PostgreSQL
  rider: Rider Context → Service — Node + PostgreSQL
  driver: Driver Context → Service — Java + PostgreSQL
  food: Food Context → Service — Java + MongoDB
  restaurant: Restaurant Context → Service — Node + PostgreSQL
  rating: Rating Context → Service — Node + MongoDB
  wallet: Wallet Context → Service — Java + PostgreSQL
  promotion: Promotion Context → Service — Go + Redis
 }
 generic: Generic Subdomain {
  auth: Auth Context → Service — Firebase Auth
  payment: Payment Context → Service — Stripe
  notification: Notification Context → Service — Twilio + FCM
  map: Map Context → Service — Google Maps
  chat: Chat Context → Service — SendBird
 }
}
```

Ví dụ phân rã gồm 16 microservices, mỗi service có database, deployment và ownership riêng; đây là mô hình minh họa, không phải khẳng định mọi chi tiết triển khai nội bộ của Grab.

---

## Cách xác định ranh giới service

### Bước 1: Xác định Domain và Subdomain

Phỏng vấn business expert, trả lời các câu hỏi:

```
1. "Công ty kiếm tiền bằng cách nào?"
   → Xác định Core Subdomain

2. "Những chức năng nào hỗ trợ cho hoạt động chính?"
   → Xác định Supporting Subdomain

3. "Những chức năng nào công ty nào cũng cần?"
   → Xác định Generic Subdomain
```

**Ví dụ với Shopee:**

| Câu hỏi | Trả lời | Loại |
|---------|---------|------|
| Shopee kiếm tiền bằng gì? | Kết nối người mua - người bán, flash sale, gợi ý sản phẩm | **Core**: Marketplace Matching, Promotion, Recommendation |
| Chức năng hỗ trợ? | Quản lý đơn hàng, đánh giá, chat | **Supporting**: Order, Review, Chat |
| Chức năng chung? | Thanh toán, gửi thông báo, xác thực | **Generic**: Payment (ShopeePay), Notification, Auth |

### Bước 2: Tìm Bounded Context

Dùng các kỹ thuật sau:

**Kỹ thuật 1: Tìm "đường nứt" trong ngôn ngữ**

```
Khi business expert dùng cùng 1 từ nhưng nghĩa khác nhau
→ Đó là ranh giới giữa 2 Bounded Context

VD: "Account" trong ngân hàng:
  - Phòng mở tài khoản: Account = hồ sơ khách hàng (tên, CMND, địa chỉ)
  - Phòng giao dịch:    Account = số dư, lịch sử giao dịch
  - Phòng IT:           Account = username, password, quyền truy cập

→ 3 Bounded Context: Customer Onboarding, Transaction, Identity
```

**Kỹ thuật 2: Event Storming (đơn giản hóa)**

```d2 title="Bước 2: Tìm Bounded Context"
direction: right
order: "Order Context tiềm năng\nOrderPlaced • OrderCancelled • OrderUpdated"
payment: "Payment Context tiềm năng\nPaymentReceived • RefundIssued"
shipping: "Shipping Context tiềm năng\nItemShipped • Delivered • Returned"
```

Bắt đầu liệt kê domain events như OrderPlaced, PaymentReceived, ItemShipped, InventoryUpdated, CustomerRegistered rồi nhóm theo ngữ nghĩa. Mỗi nhóm là một Bounded Context tiềm năng, cần tiếp tục kiểm chứng boundary.

### Bước 3: Định nghĩa model riêng cho mỗi context

Sau khi xác định context, tạo model **riêng** cho mỗi context — không share model.

```
Sai ❌:  Tất cả service import chung "shared-models" package
         → Thay đổi model = phải deploy lại tất cả

Đúng ✅: Mỗi service tự định nghĩa model của mình
         → Dùng API / Event để trao đổi dữ liệu cần thiết
```

### Bước 4: Xác định giao tiếp giữa các context

```d2 title="Bước 4: Xác định giao tiếp giữa các context"
shape: sequence_diagram
"OC": "🛒 Order Context"
"IC": "📊 Inventory Context"
"PC": "💳 Payment Context"
"NC": "📧 Notification Context"
"OC".note1: "Customer đặt hàng"
"OC" -> "IC": "Kiểm tra tồn kho? (sync - REST/gRPC)"
"IC" -> "OC": "Còn hàng ✅" { style.stroke-dash: 5 }
"OC" -> "PC": "Xử lý thanh toán (sync)"
"PC" -> "OC": "Thanh toán OK ✅" { style.stroke-dash: 5 }
"OC".note2: "Publish event"
"OC" -> "IC": "Event: OrderPlaced (async - Kafka)" { style.stroke-dash: 5; target-arrowhead.style.filled: false }
"OC" -> "NC": "Event: OrderPlaced (async - Kafka)" { style.stroke-dash: 5; target-arrowhead.style.filled: false }
"IC".note3: "Giảm tồn kho"
"NC".note4: "Gửi email xác nhận"
```

**Nguyên tắc chọn sync vs async:**

| Sync (REST/gRPC) | Async (Event/Message Queue) |
|-------------------|-----------------------------|
| Cần kết quả **ngay lập tức** | Không cần kết quả ngay |
| VD: Kiểm tra tồn kho trước khi đặt | VD: Gửi email sau khi đặt thành công |
| Coupling **cao hơn** | Coupling **thấp hơn** |

---

## Anti-patterns — Những sai lầm thường gặp

### 1. Distributed Monolith

```d2 title="Anti-pattern — tách service nhưng chia sẻ database"
direction: down
a: Service A
b: Service B
c: Service C
db: "Shared DB\nĐổi schema có thể break tất cả" {shape: cylinder}
a -> db
b -> db
c -> db
```

Đây có thể trở thành Distributed Monolith: service vẫn phụ thuộc schema chung và khó deploy độc lập.

### 2. Nano-service (tách quá nhỏ)

```d2 title="Nano-services — chia nhỏ quá mức"
direction: right
validate: Validate Email Svc
save: Save Email Svc
format: Format Email Svc
send: Send Email Svc
log: Log Email Svc
validate -> save -> format -> send -> log
```

Mỗi service chỉ làm một bước gây nhiều network overhead và khó debug. Nên gộp thành một **Email Notification Service**.

### 3. Chia theo layer thay vì business capability

```d2 title="Technical layer và Business Capability"
direction: right
horizontal: "Sai — Technical Layer" {
 ui: "UI Service\nAll UI"
 business: "Business Logic Service\nAll logic"
 data: "Data Access Service\nAll DB"
}
vertical: "Đúng — Business Capability" {
 user: "User Service\nUI + Logic + DB"
 order: "Order Service\nUI + Logic + DB"
 product: "Product Service\nUI + Logic + DB"
}
```

Tách theo layer: một feature có thể phải sửa cả ba service, ownership không rõ. Tách theo capability: feature Order chủ yếu đổi Order Service; team Order sở hữu từ UI đến DB.

---

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────┐
│                     KIM CHỈ NAM TÁCH SERVICE                    │
│                                                                 │
│  1. SRP: Mỗi service chỉ có 1 lý do để thay đổi                 │
│                                                                 │
│  2. Bounded Context: Ranh giới nơi model có nghĩa nhất quán     │
│                                                                 │
│  3. Ubiquitous Language: Cùng từ + khác nghĩa = khác context    │
│                                                                 │
│  4. Vertical slice: Tách theo business, không theo layer        │
│                                                                 │
│  5. Database per service: Không share DB                        │
│                                                                 │
│  6. Start big, split later: Bắt đầu lớn, tách khi cần           │
│                                                                 │
│  7. Tránh: Distributed Monolith, Nano-service, Layer-based      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Links liên quan

- Trước đó: [Microservice Overview](01-microservice-overview.md) — Tổng quan Microservice, Monolith, SOA
- Tiếp theo: [Loose Coupling & High Cohesion](03-loose-coupling-high-cohesion.md) — Nguyên tắc kết nối lỏng, gắn kết cao
- [Autonomy & Independence](04-autonomy-independence.md) — Tự chủ và độc lập trong Microservice
- [Decomposition Strategies](05-decomposition-strategies.md) — Chiến lược cụ thể để phân tách service
- [Data Management](09-data-management.md) — Database per Service, Saga pattern
- [Inter-Service Communication](06-inter-service-communication.md) — Cách các service giao tiếp
- [Design Patterns tổng hợp](17-design-patterns.md) — Anti-corruption Layer, Strangler Fig và các pattern khác
