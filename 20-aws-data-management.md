# Data Management trên AWS

## 📋 Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
- [2. Database per Service trên AWS](#2-database-per-service-trên-aws)
  - [2.1. Tổng quan Database Services trên AWS](#21-tổng-quan-database-services-trên-aws)
  - [2.2. Amazon RDS & Aurora](#22-amazon-rds--aurora)
  - [2.3. Amazon DynamoDB](#23-amazon-dynamodb)
  - [2.4. Amazon ElastiCache (Redis / Memcached)](#24-amazon-elasticache-redis--memcached)
  - [2.5. Amazon OpenSearch (Elasticsearch)](#25-amazon-opensearch-elasticsearch)
  - [2.6. Polyglot Persistence trên AWS — Chọn DB cho từng service](#26-polyglot-persistence-trên-aws--chọn-db-cho-từng-service)
- [3. Saga Pattern với AWS Step Functions](#3-saga-pattern-với-aws-step-functions)
  - [3.1. Tại sao Step Functions phù hợp cho Saga?](#31-tại-sao-step-functions-phù-hợp-cho-saga)
  - [3.2. Orchestration Saga — Order Workflow chi tiết](#32-orchestration-saga--order-workflow-chi-tiết)
  - [3.3. Compensation (Rollback) trong Step Functions](#33-compensation-rollback-trong-step-functions)
  - [3.4. Choreography Saga với EventBridge](#34-choreography-saga-với-eventbridge)
  - [3.5. Orchestration vs Choreography trên AWS — Khi nào chọn gì?](#35-orchestration-vs-choreography-trên-aws--khi-nào-chọn-gì)
- [4. CQRS trên AWS](#4-cqrs-trên-aws)
  - [4.1. CQRS với DynamoDB + OpenSearch](#41-cqrs-với-dynamodb--opensearch)
  - [4.2. CQRS với Aurora + ElastiCache](#42-cqrs-với-aurora--elasticache)
  - [4.3. Sync data giữa Write DB và Read DB](#43-sync-data-giữa-write-db-và-read-db)
- [5. Event Sourcing trên AWS](#5-event-sourcing-trên-aws)
  - [5.1. Event Store trên AWS — Chọn gì?](#51-event-store-trên-aws--chọn-gì)
  - [5.2. Event Sourcing với DynamoDB](#52-event-sourcing-với-dynamodb)
  - [5.3. Event Sourcing kết hợp CQRS trên AWS](#53-event-sourcing-kết-hợp-cqrs-trên-aws)
  - [5.4. Snapshot Strategy trên DynamoDB](#54-snapshot-strategy-trên-dynamodb)
- [6. Data Consistency & Cross-Service Data](#6-data-consistency--cross-service-data)
  - [6.1. Outbox Pattern trên AWS](#61-outbox-pattern-trên-aws)
  - [6.2. Change Data Capture (CDC) trên AWS](#62-change-data-capture-cdc-trên-aws)
  - [6.3. Event-Carried State Transfer với EventBridge](#63-event-carried-state-transfer-với-eventbridge)
  - [6.4. API Composition với AppSync](#64-api-composition-với-appsync)
- [7. Data Migration & Schema Evolution](#7-data-migration--schema-evolution)
  - [7.1. Schema Migration cho RDS](#71-schema-migration-cho-rds)
  - [7.2. DynamoDB Schema Evolution](#72-dynamodb-schema-evolution)
  - [7.3. Blue-Green Database Migration](#73-blue-green-database-migration)
- [8. Ví dụ thực tế — E-Commerce Data Architecture trên AWS](#8-ví-dụ-thực-tế--e-commerce-data-architecture-trên-aws)
- [9. Anti-patterns](#9-anti-patterns)
- [10. Checklist triển khai](#10-checklist-triển-khai)
- [11. Tổng kết](#11-tổng-kết)
- [12. Liên kết liên quan](#12-liên-kết-liên-quan)

---

## 1. Giới thiệu

Trong [doc 09 — Data Management](09-data-management.md), chúng ta đã hiểu các pattern quản lý data trong Microservice: Database per Service, Saga, CQRS, Event Sourcing, Outbox Pattern. Doc này **áp dụng tất cả kiến thức đó vào thực tế trên AWS** — mapping từng pattern lý thuyết sang AWS service cụ thể.

Doc này trả lời câu hỏi: **Dùng database nào trên AWS cho từng service? Saga pattern triển khai với Step Functions ra sao? CQRS + Event Sourcing hiện thực hóa thế nào với DynamoDB Streams, EventBridge? Đảm bảo data consistency xuyên service bằng cách nào?**

> 💡 Giả định: Bạn đã đọc [doc 09](09-data-management.md) và hiểu lý thuyết. Doc này tập trung vào **cách AWS hiện thực hóa** các khái niệm đó.

> 📌 Lưu ý: Các con số về pricing trong tài liệu là **giá tham khảo theo thời điểm viết** và có thể thay đổi theo region/thời gian. Luôn kiểm tra trang AWS Pricing chính thức trước khi ra quyết định.

```d2 title="1. Giới thiệu"
direction: right
db: Database per Service {
 aurora: RDS / Aurora PostgreSQL-MySQL — Relational / ACID
 dynamo: DynamoDB — Key-Value / Serverless
 cache: ElastiCache — Cache / Session
 search: OpenSearch — Search / Analytics
 graph: Neptune — Graph
 document: DocumentDB — MongoDB-compatible
}
consistency: Data Consistency Patterns {
 orchestration: Step Functions — Saga Orchestration
 choreography: EventBridge — Saga Choreography transport
 cdc: DynamoDB Streams — CDC / Event processing
 streaming: MSK / Kinesis — Event Streaming
 migration: DMS — CDC from RDS
}
cross: Cross-Service Data {
 composition: AppSync GraphQL — API Composition
 state: EventBridge — Event-Carried State
 pipeline: DMS + Kinesis — CDC Pipeline
}
```

DynamoDB Streams là change stream có retention hữu hạn, không tự là authoritative Event Store. Event Sourcing cần lưu domain events bền vững; Streams có thể phân phối thay đổi từ Event Store table.

---

## 2. Database per Service trên AWS

### 2.1. Tổng quan Database Services trên AWS

> 🔗 Lý thuyết Database per Service tại [doc 09 — Section 2](09-data-management.md#2-database-per-service)

AWS cung cấp **purpose-built databases** — mỗi loại tối ưu cho 1 use case. Đây chính là nền tảng cho **Polyglot Persistence** trong Microservice.

```d2 title="2.1. Tổng quan Database Services trên AWS"
direction: right
catalog: AWS Purpose-Built Databases {
 relational: Relational {
  rds: RDS — PostgreSQL / MySQL / MariaDB / Oracle / SQL Server
  aurora: Aurora — MySQL-PostgreSQL / Auto storage / Multi-AZ / Read replicas
 }
 keyvalue: Key-Value / Cache {
  dynamo: DynamoDB — Serverless / Autoscale / Key-value + Document / Low latency
  cache: ElastiCache — Redis / Memcached / In-memory / Low latency
 }
 document: DocumentDB — MongoDB-compatible / Managed / Scalable
 search: OpenSearch — Full-text / Log analytics / Dashboards
 graph: Neptune — Property Graph / RDF
 time: Timestream — IoT / DevOps Metrics / Storage tiering
 ledger: QLDB — Ledger / Verifiable history trong ví dụ lịch sử
 warehouse: Redshift — Columnar OLAP / Large-scale Analytics
}
```

Danh mục thể hiện nhóm use case, không bảo đảm mọi offering còn mở cho tài khoản mới: kiểm tra lifecycle, region và engine support trước khi chọn. Các mức latency và claim Aurora “5x MySQL” phụ thuộc workload/benchmark, không phải cam kết cho mọi ứng dụng.

### 2.2. Amazon RDS & Aurora

**Amazon RDS** (Relational Database Service) — managed relational database. **Aurora** — engine của AWS tương thích MySQL/PostgreSQL, tối ưu cho cloud.

```d2 title="2.2. Amazon RDS & Aurora"
direction: down
aurora: Aurora PostgreSQL {
 writer: Writer — db.r6g.large / Write + Read
 readers: Readers — db.r6g.large / tối đa15 replicas theo topology
 storage: Shared Aurora Storage — replicated across3 AZs {shape: cylinder}
 writer -> storage
 readers -> storage
}
```

Mô hình storage có6copies/3AZ. Storage growth/upper limits, Serverless v2 ACU range, retention tối đa35ngày và failover/cross-region lag phụ thuộc engine/version/region/config; các số128TB,0.5–128ACU,<30s,<1s trong ví dụ cũ không phải SLA phổ quát. Có continuous backup/PITR, reader autoscaling, Global Database, IAM DB auth, KMS at-rest và TLS khi cấu hình.

**RDS vs Aurora — Chọn gì?**

| Tiêu chí | RDS (PostgreSQL/MySQL) | Aurora |
|----------|----------------------|--------|
| **Giá** | Rẻ hơn ~20% | Đắt hơn nhưng performance/GB tốt hơn |
| **Performance** | Chuẩn | 5x MySQL, 3x PostgreSQL (theo AWS) |
| **Storage** | Manual provisioning, max 64TB | Auto-grow, max 128TB, 6 copies/3 AZs |
| **Failover** | 60-120s | < 30s |
| **Read Replicas** | Max 5 (MySQL), 5 (PostgreSQL) | Max 15, auto-scaling |
| **Serverless** | Không | Aurora Serverless v2 |
| **Recommend** | Dev/test, budget-constrained | Production, critical workloads |

```
Decision:
─────────
  Budget nhỏ, non-production     → RDS (PostgreSQL/MySQL)
  Production, cần HA              → Aurora
  Traffic biến động (spiky)       → Aurora Serverless v2
  Multi-region DR                 → Aurora Global Database
```

**Aurora Serverless v2 — Khi nào dùng?**

```
Aurora Serverless v2:
─────────────────────
  • Auto-scale compute: 0.5 ACU → 128 ACU (1 ACU ≈ 2GB RAM)
  • Scale up trong vài giây, scale down khi idle
  • Trả tiền theo ACU-hours thực tế sử dụng

  ✅ Phù hợp:
     • Dev/staging environments (scale-to-near-zero ban đêm)
     • Workload spiky (flash sale: 10x traffic trong 1 giờ)
     • Microservice mới — chưa biết traffic pattern

  ❌ Không phù hợp:
     • Workload ổn định 24/7 → Provisioned rẻ hơn
     • Cần predictable pricing
```

### 2.3. Amazon DynamoDB

**DynamoDB** — fully managed NoSQL (key-value + document), serverless, single-digit millisecond performance.

```
┌───────────────────────────────────────────────────────────────────┐
│                      DYNAMODB                                     │
│                                                                   │
│  ┌─── Table Design ─────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Table: orders                                               │ │
│  │  ┌────────────────┬───────────────────┬────────────────────┐ │ │
│  │  │ PK (userId)    │ SK (orderId)      │ Attributes         │ │ │
│  │  │────────────────│───────────────────│────────────────────│ │ │
│  │  │ USER#123       │ ORDER#2024-001    │ status, total, ... │ │ │
│  │  │ USER#123       │ ORDER#2024-002    │ status, total, ... │ │ │
│  │  │ USER#456       │ ORDER#2024-003    │ status, total, ... │ │ │
│  │  └────────────────┴───────────────────┴────────────────────┘ │ │
│  │                                                              │ │
│  │  GSI: status-index (PK: status, SK: createdAt)               │ │
│  │  → Query: "Tất cả orders đang PENDING"                       │ │
│  │                                                              │ │
│  │  GSI: date-index (PK: date, SK: orderId)                     │ │
│  │  → Query: "Tất cả orders hôm nay"                            │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─── Capacity Modes ──────────────────────────────────────────┐  │
│  │                                                             │  │
│  │  On-Demand Mode:                                            │  │
│  │  • Pay per request ($1.25/triệu WRU, $0.25/triệu RRU)       │  │
│  │  • Auto-scale instantly                                     │  │
│  │  • Phù hợp: traffic không dự đoán được, service mới         │  │
│  │                                                             │  │
│  │  Provisioned Mode:                                          │  │
│  │  • Set RCU/WCU (Read/Write Capacity Units)                  │  │
│  │  • Auto-scaling với target tracking                         │  │
│  │  • Reserved Capacity: giảm 53-76% cost                      │  │
│  │  • Phù hợp: traffic ổn định, predictable                    │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─── Key Features ────────────────────────────────────────────┐  │
│  │  • DynamoDB Streams    → CDC, trigger Lambda, Event Sourcing│  │
│  │  • TTL                 → Auto-delete expired items (session)│  │
│  │  • Global Tables       → Multi-region, active-active        │  │
│  │  • DAX (Accelerator)   → In-memory cache, microsecond read  │  │
│  │  • Transactions        → ACID across multiple items/tables  │  │
│  │  • Point-in-time Recovery → Restore to any second (35 ngày) │  │
│  │  • Encryption at rest  → AWS owned / customer managed KMS   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**DynamoDB Single-Table Design — Phong cách Microservice:**

```
Trong Microservice, mỗi service thường có 1 DynamoDB table
với single-table design (nhiều entity types trong 1 table):

Table: cart-service
┌──────────────┬─────────────────────┬────────────────────────────┐
│ PK           │ SK                  │ Attributes                 │
│──────────────│─────────────────────│────────────────────────────│
│ CART#u123    │ METADATA            │ userId, createdAt, total   │
│ CART#u123    │ ITEM#p456           │ productId, qty, price      │
│ CART#u123    │ ITEM#p789           │ productId, qty, price      │
│ CART#u456    │ METADATA            │ userId, createdAt, total   │
│ CART#u456    │ ITEM#p123           │ productId, qty, price      │
└──────────────┴─────────────────────┴────────────────────────────┘

→ GetItem (PK=CART#u123, SK=METADATA) → cart info
→ Query  (PK=CART#u123, SK begins_with "ITEM#") → all items in cart
→ 1 table, 1 query → cực nhanh, không cần JOIN
```

**RDS/Aurora vs DynamoDB — Khi nào chọn gì?**

| Tiêu chí | RDS/Aurora | DynamoDB |
|----------|-----------|----------|
| **Data model** | Relational, cần JOIN, complex queries | Key-value, document, access patterns biết trước |
| **Consistency** | Strong (ACID) | Eventual (default), Strong (optional, 2x cost) |
| **Query flexibility** | SQL — bất kỳ query nào | Chỉ query theo PK/SK/GSI — phải thiết kế trước |
| **Scaling** | Vertical (instance size) + Read Replicas | Horizontal, automatic, "infinite" |
| **Ops overhead** | Patching, sizing, monitoring | Near-zero (serverless) |
| **Giá** | Instance-based (chạy 24/7) | Pay-per-request hoặc provisioned |
| **Transaction** | Full ACID, multi-table | ACID (tối đa 100 items, 4MB) |
| **Use case** | Order, Payment, User — dữ liệu quan hệ phức tạp | Cart, Session, IoT, Catalog — access pattern đơn giản |

```
Decision:
─────────
  Cần JOIN, complex queries, ACID     → Aurora PostgreSQL
  Cần flexible queries, ad-hoc SQL    → Aurora PostgreSQL
  Key-value access, serverless        → DynamoDB
  Session, cache, cart, leaderboard   → DynamoDB (hoặc ElastiCache)
  Cả hai?                            → Polyglot! (Aurora cho Order, DynamoDB cho Cart)
```

### 2.4. Amazon ElastiCache (Redis / Memcached)

```d2 title="2.4. Amazon ElastiCache (Redis / Memcached)"
direction: right
service: "Service"
redis: "ElastiCache Redis — Cache lookup"
aurora: "Aurora — Source of truth"
cache: "Populate cache + TTL"
response: "Return result"
service -> redis
redis -> response: "Hit"
redis -> aurora: "Miss"
aurora -> cache
cache -> response
```

TTL ví dụ product5phút/user1giờ/config24giờ. Redis còn dùng session TTL24h, rate counter, locks và sorted-set leaderboard (`ZADD`, top10). INCR+EXPIRE đơn thuần không phải sliding-window algorithm; atomic scripts/expiry policy cần thiết. Lock `SET NX EX30` cần owner token/safe unlock/fencing tùy use case. Multi-AZ, sharding, encryption/auth cần cấu hình. Với kiến trúc cache này, order/payment gốc ở RDS/DynamoDB; không xem cache failure là mất source of truth, nhưng session/cart có durability trade-off riêng.

### 2.5. Amazon OpenSearch (Elasticsearch)

```d2 title="2.5. Amazon OpenSearch (Elasticsearch)"
direction: right
admin: "Admin"
write: "Product Service — Write"
aurora: "Aurora PostgreSQL — Primary"
cdc: "DMS / CDC consumer"
search: "OpenSearch — Derived search index"
user: "User Search"
read: "Product Service — Read"
admin -> write
write -> aurora
aurora -> cdc
cdc -> search
user -> read
read -> search: "Full-text / Fuzzy / Autocomplete / Facets / Sort"
```

Ví dụ tìm iPhone giá dưới20triệu. Trong kiến trúc này index là derived store/rebuildable, không thay primary transactional DB. Cũng dùng log analytics/APM với OpenSearch Dashboards; search visibility phụ thuộc refresh/indexing, không mặc định chính xác1giây.

### 2.6. Polyglot Persistence trên AWS — Chọn DB cho từng service

> 🔗 Lý thuyết Polyglot Persistence tại [doc 09 — Section 2.3](09-data-management.md#23-polyglot-persistence)

```
E-Commerce — Database cho từng service:
────────────────────────────────────────

┌───────────────────┬────────────────────┬────────────────────────────────┐
│ Service           │ Database           │ Lý do                          │
│───────────────────│────────────────────│────────────────────────────────│
│ User Service      │ Aurora PostgreSQL  │ Relational, ACID cho auth      │
│ Order Service     │ Aurora PostgreSQL  │ ACID transaction, JOIN         │
│ Payment Service   │ Aurora PostgreSQL  │ Financial data, ACID bắt buộc  │
│ Inventory Service │ Aurora PostgreSQL  │ Stock count, consistency       │
│ Product Service   │ Aurora + OpenSearch│ Aurora (write), OS (search)    │
│ Cart Service      │ DynamoDB           │ Key-value, TTL, serverless     │
│ Session Service   │ ElastiCache Redis  │ In-memory, TTL, fast           │
│ Notification Log  │ DynamoDB           │ Append-only, TTL, serverless   │
│ Recommendation    │ Neptune            │ Graph: "người mua X cũng mua Y"│
│ Analytics         │ Redshift           │ OLAP, aggregate từ nhiều src   │
└───────────────────┴────────────────────┴────────────────────────────────┘

→ 5 loại database khác nhau
→ Mỗi service chọn DB phù hợp nhất với use case
→ Đây chính là Polyglot Persistence trên AWS
```

**Chi phí ước tính các database:**

| Database | Spec | Chi phí ước tính/tháng |
|----------|------|----------------------|
| Aurora PostgreSQL (Multi-AZ) | db.r6g.large | ~$400 |
| Aurora Serverless v2 | 0.5-4 ACU (dev) | ~$50-150 |
| DynamoDB (On-Demand) | ~5M requests/ngày | ~$50 |
| ElastiCache Redis | cache.r6g.large, 2 nodes | ~$300 |
| OpenSearch | t3.medium.search, 2 nodes | ~$150 |
| Neptune | db.r5.large | ~$350 |
| Redshift Serverless | 8 RPU, ~100 queries/ngày | ~$50 |

---

## 3. Saga Pattern với AWS Step Functions

> 🔗 Lý thuyết Saga Pattern tại [doc 09 — Section 6](09-data-management.md#6-saga-pattern)

### 3.1. Tại sao Step Functions phù hợp cho Saga?

```
Saga cần gì?                        Step Functions có gì?
──────────────                       ────────────────────
Workflow multi-step              →   State machine (nhiều bước)
Gọi nhiều service theo thứ tự    →   Task states (invoke Lambda/ECS/API)
Xử lý lỗi từng bước              →   Catch + Retry per state
Compensation (rollback)          →   Fallback states, error handling
Parallel steps                   →   Parallel state
Timeout per step                 →   TimeoutSeconds per state
Audit trail                      →   Full execution history (Standard mode)
Visual monitoring                →   Step Functions Console — visual diagram
```

**Step Functions = managed Saga Execution Coordinator (SEC)**

Thay vì tự build orchestrator, Step Functions đã là SEC sẵn:
- **Durable execution** — state machine chạy bền vững, không mất progress khi crash
- **Built-in retry** — retry 3 lần mỗi step, configurable
- **Visual debugging** — xem từng step pass/fail trên console
- **Exactly-once** (Standard mode) — không duplicate execution

**Ngôn ngữ lập trình — Step Functions không phụ thuộc ngôn ngữ:**

Step Functions chỉ là **orchestrator** (điều phối) — nó gọi Lambda/ECS/API, còn business logic bên trong viết ngôn ngữ gì cũng được:

```d2 title="3.1. Tại sao Step Functions phù hợp cho Saga?"
direction: right
validate: "Step1 ValidateOrder — Lambda Java21"
reserve: "Step2 ReserveStock — Lambda Java21"
pay: "Step3 ProcessPayment — Lambda Java21"
confirm: "Step4 ConfirmOrder — Lambda Java21"
compensate: "Compensate ReleaseStock — Lambda Java21"
validate -> reserve
reserve -> pay
pay -> confirm: "Success"
pay -> compensate: "Failure sau reserve"
```

State machine định nghĩa bằng ASL JSON; công cụ IaC có thể dùng YAML/JSON theo workflow. Task implementations có thể là Java/Python/Node/.NET/custom runtime/container, hoặc ECS service; runtime versions cần kiểm tra lifecycle hiện hành.

> 💡 **Thực tế**: Step Functions + Java rất phổ biến trong enterprise — team đã quen Java ecosystem (Spring Boot, Maven) chỉ cần viết Lambda handler bằng Java, Step Functions lo phần orchestration.

**Tài liệu tham khảo & ví dụ thực tế:**

| Tài liệu | Mô tả | Link |
|----------|-------|------|
| **AWS Sample — Saga Pattern** | E-commerce: Order → Payment → Inventory với compensation (Go) | [GitHub](https://github.com/aws-samples/aws-step-functions-long-lived-transactions) |
| **AWS Docs — Saga Pattern Sample** | Official sample project có sẵn trong Step Functions Console | [AWS Docs](https://docs.aws.amazon.com/step-functions/latest/dg/sample-saga-pattern.html) |
| **AWS Prescriptive Guidance** | Hướng dẫn chi tiết implement Saga với Step Functions | [AWS Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/implement-the-saga-pattern-with-aws-step-functions.html) |
| **Serverless Land Patterns** | 100+ templates (CDK/SAM/Terraform) cho Step Functions | [serverlessland.com](https://serverlessland.com/patterns?services=sfn) |
| **AWS Use Cases** | Microservice Orchestration, ETL, Security automation | [aws.amazon.com](https://aws.amazon.com/step-functions/use-cases/) |

**Step Functions vs Self-hosted Orchestrator — So sánh thực tế:**

Trong thực tế, đặc biệt với team Java enterprise, nhiều team chọn **self-hosted orchestrator** thay vì Step Functions. Đây là so sánh:

| Tiêu chí | Step Functions | Self-hosted (Spring Boot / Temporal) |
|----------|---------------|--------------------------------------|
| **Vendor lock-in** | ❌ AWS only, không portable | ✅ Chạy anywhere (AWS, GCP, on-prem) |
| **Control** | Hạn chế — phải theo ASL rules | ✅ Full control, viết logic thoải mái |
| **Debugging** | Console visual, khó debug local | ✅ IDE breakpoint, local test bình thường |
| **Cost khi scale** | $25/triệu state transitions — đắt | ✅ Chỉ tốn instance cost |
| **Latency** | ~100-200ms overhead mỗi state transition | ✅ In-process, gần như 0 overhead |
| **Java cold start** | Lambda Java cold start ~3-5s 😬 | ✅ Spring Boot luôn warm |
| **Ops overhead** | ✅ AWS quản lý, zero ops | ❌ Phải tự quản lý HA, monitoring |
| **Durability** | ✅ Built-in, state persist tự động | ❌ Phải tự implement (DB + retry) |
| **Visual monitoring** | ✅ Console visual rất trực quan | ❌ Phải tự build dashboard |

**Các lựa chọn Saga Orchestrator phổ biến trong thực tế:**

```
┌──────────────────────────────────────────────────────────────────────┐
│         SAGA ORCHESTRATOR — CHỌN GÌ THEO CONTEXT?                    │
│                                                                      │
│  1. AWS Step Functions                                               │
│     ─────────────────                                                │
│     • Team serverless-first (Lambda + Python/Node.js)                │
│     • Workflow đơn giản (3-5 steps)                                  │
│     • Muốn zero ops, visual monitoring                               │
│     • Không quan tâm vendor lock-in                                  │
│     • Ví dụ: startup dùng full AWS serverless stack                  │
│                                                                      │
│  2. Self-built (Spring Boot + DB)                                    │
│     ──────────────────────────────                                   │
│     • Team Java enterprise, đã quen Spring ecosystem                 │
│     • Saga logic đơn giản, không cần framework riêng                 │
│     • Order Service tự quản lý saga state trong DB                   │
│     • Dùng @Transactional, @Scheduled cho retry                      │
│     • Ví dụ: order service tự track trạng thái saga trong bảng       │
│       orders (status: PENDING → STOCK_RESERVED → PAID → CONFIRMED)   │
│                                                                      │
│  3. Temporal.io ⭐ (recommended cho orchestrator chuyên dụng)        │
│     ─────────────                                                    │
│     • Open-source, chạy trên K8s/ECS                                 │
│     • Java/Go SDK, durable execution built-in                        │
│     • Uber, Netflix, Stripe, Snap dùng production                    │
│     • KHÔNG vendor lock-in, portable across clouds                   │
│     • Phù hợp: complex workflows, long-running, cần reliability      │
│                                                                      │
│  4. Axon Framework (Java-specific)                                   │
│     ──────────────────────────────                                   │
│     • Saga + Event Sourcing + CQRS built-in                          │
│     • Rất phổ biến trong Java/Spring ecosystem                       │
│     • Axon Server (open-source) hoặc Axon Cloud (managed)            │
│     • Phù hợp: team Java muốn full DDD + Event Sourcing              │
│                                                                      │
│  5. Camunda (BPMN-based)                                             │
│     ────────────────────                                             │
│     • BPMN workflow engine, visual designer                          │
│     • Java SDK, REST API                                             │
│     • Phù hợp: enterprise cần BPMN compliance, business process      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

```
Decision — Chọn Saga Orchestrator:
───────────────────────────────────
  Team serverless (Lambda, Python/Node.js)         → Step Functions
  Team Java, saga đơn giản (3-5 steps)              → Self-built (Spring Boot + DB)
  Team Java, saga phức tạp, cần reliability         → Temporal.io
  Team Java, muốn full DDD/Event Sourcing           → Axon Framework
  Enterprise, cần BPMN, business process            → Camunda
  Multi-cloud, không muốn vendor lock-in            → Temporal.io hoặc Camunda
```

> 💡 **Thực tế quan trọng**: Đa số team Java enterprise **KHÔNG** dùng Step Functions. Họ thường chọn self-built orchestrator (Spring Boot + saga state trong DB) cho case đơn giản, hoặc Temporal/Axon cho case phức tạp. Step Functions phổ biến hơn trong ecosystem serverless (Lambda + Python/Node.js).

### 3.2. Orchestration Saga — Order Workflow chi tiết

```d2 title="3.2. Orchestration Saga — Order Workflow chi tiết"
direction: down
input: "Input orderId / userId / items / totalAmount"
validate: "1. Validate Order — items / user"
reserve: "2. Reserve Stock\nInventory Lambda/ECS POST /inventory/reserve\nRetry3 theo policy • Timeout10s"
pay: "3. Process Payment\nRetry3 theo policy • Timeout30s"
confirm: "4. Confirm Order — CONFIRMED"
email: "5a. Send Email"
analytics: "5b. Update Analytics"
shipment: "5c. Create Shipment"
join: "JOIN — các nhánh parallel hoàn tất"
end: "End"
release: "Compensate — Release Stock"
failed: "Order Failed / Notify User"
input -> validate
validate -> reserve: "Success"
validate -> failed: "Failure"
reserve -> pay: "Success"
reserve -> failed: "Failure"
pay -> confirm: "Success"
pay -> release: "Failure"
release -> failed
confirm -> email: "PAR"
confirm -> analytics: "PAR"
confirm -> shipment: "PAR"
email -> join
analytics -> join
shipment -> join
join -> end
```

Reserve/charge retries cần idempotent contracts; timeout payment có thể là outcome chưa rõ, phải reconcile trước refund/retry. Failure/compensation của các bước sau confirmation cần business policy riêng.

**Step Functions ASL (Amazon States Language)** — trích đoạn:

```json
{
  "Comment": "Order Saga",
  "StartAt": "ValidateOrder",
  "States": {
    "ValidateOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:validate-order",
      "Next": "ReserveStock",
      "Catch": [{
        "ErrorEquals": ["ValidationError"],
        "Next": "OrderFailed"
      }]
    },
    "ReserveStock": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:reserve-stock",
      "TimeoutSeconds": 10,
      "Retry": [{
        "ErrorEquals": ["States.TaskFailed"],
        "MaxAttempts": 3,
        "IntervalSeconds": 2,
        "BackoffRate": 2.0
      }],
      "Next": "ProcessPayment",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "OrderFailed"
      }]
    },
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:process-payment",
      "TimeoutSeconds": 30,
      "Retry": [{
        "ErrorEquals": ["States.TaskFailed"],
        "MaxAttempts": 3,
        "IntervalSeconds": 5,
        "BackoffRate": 2.0
      }],
      "Next": "ConfirmOrder",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "ReleaseStock"
      }]
    },
    "ReleaseStock": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:release-stock",
      "Comment": "Compensation: undo ReserveStock",
      "Next": "OrderFailed"
    },
    "ConfirmOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:confirm-order",
      "Next": "NotifyAndShip"
    },
    "NotifyAndShip": {
      "Type": "Parallel",
      "Branches": [
        {
          "StartAt": "SendEmail",
          "States": {
            "SendEmail": { "Type": "Task", "Resource": "arn:aws:lambda:...:send-email", "End": true }
          }
        },
        {
          "StartAt": "CreateShipment",
          "States": {
            "CreateShipment": { "Type": "Task", "Resource": "arn:aws:lambda:...:create-shipment", "End": true }
          }
        }
      ],
      "Next": "OrderCompleted"
    },
    "OrderCompleted": { "Type": "Succeed" },
    "OrderFailed": { "Type": "Fail", "Error": "OrderSagaFailed" }
  }
}
```

### 3.3. Compensation (Rollback) trong Step Functions

```d2 title="3.3. Compensation (Rollback) trong Step Functions"
direction: down
validate: "Validate"
reserve: "Reserve Stock"
payment: "Charge Payment"
shipment: "Create Shipment"
driver: "Assign Driver"
confirm: "Confirm / DONE"
cancelship: "Cancel Shipment"
refund: "Refund Payment"
release: "Release Stock"
failed: "Order Failed / Notify User"
validate -> reserve
reserve -> payment
payment -> confirm: "Happy path đơn giản"
payment -> release: "Payment failure sau reserve"
release -> failed
payment -> shipment: "Workflow mở rộng — Payment OK"
shipment -> driver
driver -> cancelship: "Driver failure sau Shipment OK"
cancelship -> refund
refund -> release
```

Bù theo thứ tự ngược các bước đã thành công: Cancel Shipment → Refund Payment → Release Stock. Từng compensation cần idempotent và có recovery path nếu chính compensation lỗi.

### 3.4. Choreography Saga với EventBridge

> 🔗 Xem thêm EventBridge tại [doc 19 — Section 4.4](19-aws-communication-discovery.md#44-amazon-eventbridge--event-bus)

```d2 title="3.4. Choreography Saga với EventBridge"
direction: right
order: "Order Service — Create Order"
bus: "EventBridge"
inventory: "Inventory — Reserve Stock"
payment: "Payment — Charge Customer"
confirm: "Order — Confirm"
notification: "Notification — Email"
release: "Inventory — Release Stock"
cancel: "Order — Cancel"
order -> bus: "OrderCreated"
bus -> inventory: "OrderCreated rule"
inventory -> bus: "StockReserved"
bus -> payment: "StockReserved rule"
payment -> bus: "PaymentDone / PaymentFailed"
bus -> confirm: "PaymentDone"
bus -> notification: "PaymentDone"
bus -> release: "PaymentFailed"
bus -> cancel: "PaymentFailed"
```

Mỗi service handle events và failure local; dùng trace/correlation context để debug thay vì mặc định mọi nhánh có cùng synchronous stack.

### 3.5. Orchestration vs Choreography trên AWS — Khi nào chọn gì?

| Tiêu chí | Step Functions (Orchestration) | EventBridge (Choreography) |
|----------|-------------------------------|---------------------------|
| **Visibility** | Visual workflow, execution history | Phải trace qua CloudWatch + X-Ray |
| **Error handling** | Centralized: Catch, Retry, Compensate | Mỗi service tự handle |
| **Coupling** | Services → Step Functions | Loose — chỉ biết event, không biết nhau |
| **Complexity** | Tốt cho multi-step, branching, parallel | Tốt cho fan-out, broadcast |
| **Cost** | $25/triệu state transitions (Standard) | $1/triệu events |
| **Scalability** | 500 executions/s (Standard) | Rất cao (partition-based) |
| **Long-running** | Tối đa 1 năm (Standard) | Không giới hạn |

```
Decision:
─────────
  Order workflow (step-by-step, compensation)   → Step Functions
  Event broadcast (notification, analytics)     → EventBridge
  Approval flow (human-in-the-loop)             → Step Functions (Wait state)
  Loose coupling, nhiều consumer                → EventBridge
  Complex branching, parallel, error handling   → Step Functions
  Simple fan-out (1 event → nhiều consumer)     → EventBridge (hoặc SNS)
```

---

## 4. CQRS trên AWS

> 🔗 Lý thuyết CQRS tại [doc 09 — Section 7](09-data-management.md#7-cqrs--command-query-responsibility-segregation)

### 4.1. CQRS với DynamoDB + OpenSearch

```d2 title="4.1. CQRS với DynamoDB + OpenSearch"
direction: right
admin: "Admin — POST /products, PUT /products/id"
command: "Product Service — Command"
db: "DynamoDB products — Write Model"
stream: "DynamoDB Streams"
lambda: "Lambda sync worker\nTransform / Denormalize"
read: "OpenSearch — Read Model"
user: "User GET /products?q=iphone&category=phone"
admin -> command
command -> db
db -> stream
stream -> lambda
lambda -> read
user -> read: "Full-text / Facets / Autocomplete"
```

Ví dụ models khác nhau, cùng product:

```json
{
  "write": {"PK":"PROD#123","SK":"METADATA","name":"iPhone 15","price":999,"categoryId":"CAT#phone","brandId":"BRAND#apple","stock":50},
  "read": {"id":"PROD#123","name":"iPhone 15","price":999,"category":"Smartphone","brand":"Apple","stock":50,"avgRating":4.7,"totalReviews":1234,"searchKeywords":[]}
}
```

Write model normalized/write-oriented; projection read denormalized/search-oriented. Các đoạn là minh họa model, không phải một project chạy độc lập.

### 4.2. CQRS với Aurora + ElastiCache

```d2 title="CQRS — Aurora Write và Redis Read"
direction: right
client: Client
order: Order Service
aurora: Aurora PostgreSQL {shape: cylinder}
event: EventBridge
updater: Lambda — Cache updater
redis: ElastiCache Redis {shape: cylinder}
client -> order: POST /orders
order -> aurora: Write
order -> event: Publish sau DB write
event -> updater -> redis: Update / Invalidate
client -> order: "GET /orders/{id}"
order -> redis: Cache lookup
redis -> order: Hit — cached data
order -> aurora: Miss — query DB rồi cache
```

Cache-Aside: app lookup → miss → query DB → cache. Write-Through cập nhật DB và cache trên write path; Write-Behind ghi cache rồi async xuống DB nên rủi ro mất dữ liệu. Event-driven invalidation dùng event để vô hiệu hóa cache. Phù hợp read/write > 10:1, query đơn giản, không full-text search và cần cache latency thấp. Để tránh mất event sau DB commit, kết hợp Outbox/CDC thay vì coi DB write + publish là atomic.

### 4.3. Sync data giữa Write DB và Read DB

```d2 title="4.3. Sync data giữa Write DB và Read DB"
direction: down
dynamo: DynamoDB → Streams → Lambda → OpenSearch / Redis
event: Service → EventBridge → SQS → Lambda → Read DB
dms: Aurora → DMS CDC → Kinesis / Kafka → Consumer Lambda → OpenSearch
kinesis: Service → Kinesis Data Streams → Lambda → OpenSearch
```

Bốn pipeline là alternatives, không phải bốn bước nối tiếp. DynamoDB Streams/Lambda: serverless, at-least-once, retention24h cần recovery plan; Lambda invocation tối đa15phút. EventBridge/SQS: event filtering/DLQ, thêm queueing latency. DMS CDC: không cần sửa application code nhưng tăng infrastructure/DB log load. Kinesis: shard throughput/retention/EFO/cost theo chế độ/config; phù hợp replay/high throughput, cần idempotency và shard/partition-key planning. Các mốc latency1–3s hay<1s chỉ minh họa.

---

## 5. Event Sourcing trên AWS

> 🔗 Lý thuyết Event Sourcing tại [doc 09 — Section 8](09-data-management.md#8-event-sourcing)

### 5.1. Event Store trên AWS — Chọn gì?

| Option | Ưu điểm | Nhược điểm | Phù hợp |
|--------|---------|------------|---------|
| **DynamoDB** | Serverless, auto-scale, Streams built-in | Không có built-in event replay query | Hầu hết use cases |
| **MSK (Kafka)** | Append-only log, replay, consumer groups | Operational overhead, not serverless | High throughput, complex event processing |
| **Kinesis** | Managed streaming, replay | Shard management, 7-day default retention | Real-time event processing |
| **QLDB** | Immutable ledger, cryptographic verification | Limited query, higher cost | Audit trail, financial compliance |
| **Aurora** | Familiar SQL, strong consistency | Không phải append-only by default | Team đã quen SQL |

```
Recommend:
──────────
  Đa số trường hợp                → DynamoDB (simple, serverless, Streams)
  Cần event replay + multi-consumer → MSK (Kafka)
  Cần audit + cryptographic proof  → QLDB
  Team quen SQL, ít events          → Aurora (custom event table)
```

### 5.2. Event Sourcing với DynamoDB

```
┌────────────────────────────────────────────────────────────────────────┐
│          EVENT SOURCING với DynamoDB                                   │
│                                                                        │
│  Event Store Table: order-events                                       │
│  ┌───────────────┬──────────────────┬────────────────────────────────┐ │
│  │ PK            │ SK               │ Attributes                     │ │
│  │ (aggregateId) │ (version)        │                                │ │
│  │───────────────│──────────────────│────────────────────────────────│ │
│  │ ORDER#001     │ v#000001         │ type: OrderCreated             │ │
│  │               │                  │ data: {userId, items, total}   │ │
│  │               │                  │ timestamp: 2024-01-15T10:00    │ │
│  │               │                  │ metadata: {correlationId}      │ │
│  │───────────────│──────────────────│────────────────────────────────│ │
│  │ ORDER#001     │ v#000002         │ type: StockReserved            │ │
│  │               │                  │ data: {items, warehouseId}     │ │
│  │               │                  │ timestamp: 2024-01-15T10:01    │ │
│  │───────────────│──────────────────│────────────────────────────────│ │
│  │ ORDER#001     │ v#000003         │ type: PaymentProcessed         │ │
│  │               │                  │ data: {amount, txnId}          │ │
│  │               │                  │ timestamp: 2024-01-15T10:02    │ │
│  │───────────────│──────────────────│────────────────────────────────│ │
│  │ ORDER#001     │ v#000004         │ type: OrderConfirmed           │ │
│  │               │                  │ data: {confirmedAt}            │ │
│  │               │                  │ timestamp: 2024-01-15T10:03    │ │
│  └───────────────┴──────────────────┴────────────────────────────────┘ │
│                                                                        │
│  Rebuild current state:                                                │
│  ─────────────────────                                                 │
│  Query: PK = "ORDER#001", SK begins_with "v#"                          │
│  → Trả về tất cả events theo thứ tự version                            │
│  → Replay: OrderCreated → StockReserved → PaymentProcessed             │
│          → OrderConfirmed                                              │
│  → Current state: { status: CONFIRMED, total: 999, ... }               │
│                                                                        │
│  Optimistic Locking (tránh concurrent write):                          │
│  ─────────────────────────────────────────────                         │
│  ConditionExpression: "attribute_not_exists(SK)"                       │
│  → Nếu version đã tồn tại → ConditionalCheckFailed → retry             │
│  → Đảm bảo không có 2 events cùng version cho 1 aggregate              │
│                                                                        │ 
└────────────────────────────────────────────────────────────────────────┘
```

### 5.3. Event Sourcing kết hợp CQRS trên AWS

```d2 title="AWS — Event Sourcing kết hợp CQRS"
direction: down
client: Client
command: "Order Service — Command\nPOST /orders\nValidate → Append event"
store: "DynamoDB Event Store\nOrderCreated và history bất biến" {shape: cylinder}
streams: DynamoDB Streams
projector: Lambda — Projector
readmodels: Query Side {
 aurora: "Aurora PostgreSQL\nOrder history / Reporting" {shape: cylinder}
 redis: "ElastiCache Redis\nRecent orders / Dashboard" {shape: cylinder}
 search: "OpenSearch\nFull-text order search" {shape: cylinder}
}
query: "Order Service — Query\nGET /orders?..."
client -> command -> store -> streams -> projector
projector -> readmodels.aurora
projector -> readmodels.redis
projector -> readmodels.search
client -> query
query -> readmodels.aurora
query -> readmodels.redis
query -> readmodels.search
```

Projector xây dựng/cập nhật read models; query đọc store tối ưu cho nhu cầu cụ thể. Rebuild bằng cách đọc lại **Event Store** và replay theo đúng thứ tự từng stream, không dựa vào retention ngắn của DynamoDB Streams. Có thể tạo read model mới mà không đổi write side.

### 5.4. Snapshot Strategy trên DynamoDB

```
Vấn đề: Order có 1000 events → replay tất cả mỗi lần read = CHẬM
─────────────────────────────────────────────────────────────────────

Giải pháp: Snapshot — lưu state tại 1 thời điểm, replay từ snapshot

Event Store Table:
┌───────────────┬──────────────────┬───────────────────────────────┐
│ PK            │ SK               │ Attributes                    │
│───────────────│──────────────────│───────────────────────────────│
│ ORDER#001     │ v#000001         │ type: OrderCreated, ...       │
│ ORDER#001     │ v#000002         │ type: ItemAdded, ...          │
│ ...           │ ...              │ ... (998 events) ...          │
│ ORDER#001     │ v#001000         │ type: ItemUpdated, ...        │
│───────────────│──────────────────│───────────────────────────────│
│ ORDER#001     │ SNAPSHOT#v1000   │ state: { full current state } │
│               │                  │ version: 1000                 │
│───────────────│──────────────────│───────────────────────────────│
│ ORDER#001     │ v#001001         │ type: NoteAdded, ...          │
│ ORDER#001     │ v#001002         │ type: StatusChanged, ...      │
└───────────────┴──────────────────┴───────────────────────────────┘

Rebuild với Snapshot:
  1. Get latest snapshot: Query PK=ORDER#001, SK begins_with "SNAPSHOT#"
     → SNAPSHOT#v1000 → state tại version 1000
  2. Get events sau snapshot: Query PK=ORDER#001, SK > "v#001000"
     → v#001001, v#001002 (chỉ 2 events)
  3. Replay 2 events trên snapshot state → current state
  → Thay vì replay 1002 events → chỉ load 1 snapshot + 2 events

Khi nào tạo Snapshot?
  • Mỗi N events (VD: mỗi 100 events)
  • Hoặc khi aggregate accessed nhiều (lazy snapshot)
  • Background job tạo snapshots cho aggregates cũ
```

---

## 6. Data Consistency & Cross-Service Data

### 6.1. Outbox Pattern trên AWS

> 🔗 Lý thuyết Outbox Pattern tại [doc 09 — Section 10](09-data-management.md#10-transactional-outbox-pattern)
> 🔗 Outbox trên AWS tại [doc 19 — Section 5.3](19-aws-communication-discovery.md#53-outbox-pattern-trên-aws)

```d2 title="6.1. Outbox Pattern trên AWS"
direction: down
a: DynamoDB Transaction + Streams {
 tx: TransactWriteItems — PUT orders + outbox
 stream: Outbox Stream — NEW_IMAGE / filter phù hợp schema
 relay: Lambda Relayer
 target: EventBridge / SQS
 cleanup: Delete / TTL cleanup theo retention policy
 tx -> stream -> relay -> target
 target -> cleanup: Sau publish thành công / Recovery-safe
}
b: Aurora Transaction + Polling {
 tx: BEGIN / INSERT orders + outbox / COMMIT
 worker: Poll unpublished LIMIT100 — ví dụ interval5s
 target: EventBridge / SQS
 mark: Mark published / Cleanup
 tx -> worker -> target -> mark
}
c: Aurora Outbox + CDC {
 outbox: Aurora Outbox WAL / Binlog
 cdc: DMS hoặc Debezium MSK Connect
 stream: Kinesis / MSK
 relay: Consumer / Lambda
 target: EventBridge
 outbox -> cdc -> stream -> relay -> target
}
```

| Option | Complexity / Ops | Latency minh họa | Phù hợp |
|---|---|---|---|
| DynamoDB + Streams | Thấp, managed | Near-real-time | DynamoDB source |
| Aurora + Polling | Đơn giản, cần worker | Poll interval + processing | Aurora, ưu tiên dễ vận hành |
| Aurora + CDC | Thêm CDC infrastructure | Near-real-time khi hệ thống khỏe | Nhiều downstream, low-latency sync |

Reliability phụ thuộc retries, checkpoints, retention/recovery và idempotency; không xếp polling mặc định kém an toàn hay CDC mặc định không mất event. Lambda event filtering không có rule tùy ý `tableName contains outbox` nếu field đó không tồn tại; filter theo record/source thực tế. TTL không được xóa intent trước khi đảm bảo replay/publish recovery.

### 6.2. Change Data Capture (CDC) trên AWS

> 🔗 Lý thuyết CDC tại [doc 09 — Section 9.2](09-data-management.md#92-change-data-capture-cdc)

```d2 title="6.2. Change Data Capture (CDC) trên AWS"
direction: down
dynamo: DynamoDB CDC { db: DynamoDB Table; streams: DynamoDB Streams; consumer: Lambda Consumer; db -> streams -> consumer }
dms: DMS CDC { db: Aurora / RDS; dms: DMS; targets: Kinesis / Kafka / S3 / OpenSearch / Redshift / DynamoDB; db -> dms: Transaction log; dms -> targets }
debezium: MSK Connect { db: Aurora / RDS; connector: Debezium Connector; msk: MSK Kafka; consumers: Consumers độc lập; db -> connector -> msk -> consumers }
```

DynamoDB record types INSERT/MODIFY/REMOVE; view KEYS_ONLY/NEW_IMAGE/OLD_IMAGE/NEW_AND_OLD_IMAGES; retention24h, ordering theo item. DMS hỗ trợ full-load + ongoing replication theo source/target/engine; đọc WAL/binlog vẫn có overhead cần đo. Debezium là open-source CDC, MSK Connect là managed Kafka Connect; schema registry/checkpoints hữu ích nhưng không tự bảo đảm exactly-once external effects.

### 6.3. Event-Carried State Transfer với EventBridge

> 🔗 Lý thuyết tại [doc 09 — Section 9.3](09-data-management.md#93-event-carried-state-transfer)

```
Event-Carried State Transfer:
──────────────────────────────
Service publish event kèm DATA đầy đủ → consumer KHÔNG cần gọi lại service

Ví dụ — User Service publish UserUpdated:

EventBridge Event:
{
  "source": "user-service",
  "detail-type": "UserUpdated",
  "detail": {
    "userId": "USER#123",
    "name": "Nguyễn Văn Hiệp",        ← data đầy đủ
    "email": "hiep@example.com",       ← consumer không cần
    "phone": "+84123456789",           ← gọi API User Service
    "tier": "GOLD",                    ← để lấy thông tin này
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}

EventBridge Rules:
  Rule 1: detail-type = "UserUpdated" → SQS → Order Service
    → Order Service cập nhật local copy: user name, tier
  Rule 2: detail-type = "UserUpdated" → SQS → Notification Service
    → Notification Service cập nhật email, phone
  Rule 3: detail-type = "UserUpdated" → SQS → Recommendation Service
    → Recommendation Service cập nhật user preferences

Ưu điểm:
  ✅ Consumer không cần gọi lại User Service → giảm coupling + latency
  ✅ User Service chết → consumer vẫn có data cũ (cached locally)

Nhược điểm:
  ❌ Event payload lớn hơn
  ❌ Consumer data có thể stale (eventual consistency)
  ❌ Phải handle event ordering (nếu quan trọng → dùng FIFO)
```

### 6.4. API Composition với AppSync

> 🔗 Lý thuyết API Composition tại [doc 09 — Section 9.4](09-data-management.md#94-api-composition)

```d2 title="6.4. API Composition với AppSync"
direction: down
client: "Client GraphQL order ORDER#001"
appsync: "AppSync — Order resolver"
user: "Order.user HTTP resolver\nUser Service — name / email"
items: "Order.items DynamoDB resolver\nOrders table — productName / quantity / price"
ship: "Order.shipment Lambda resolver\nShipment Service — trackingNumber / estimatedDelivery"
merge: "GraphQL response\nstatus / user / items / shipment"
client -> appsync
appsync -> user
appsync -> items
appsync -> ship
user -> merge
items -> merge
ship -> merge
merge -> client
```

Model: `Order.id:ID!`, `status:String!`, `user:User!`, `items:[OrderItem!]`, `shipment:Shipment`. AppSync có subscriptions, resolver caching/pipelines và Cognito/IAM/API-key/OIDC auth theo API/config. Direct DB resolver phải thuộc ownership/authorization boundary thích hợp, không mở tùy tiện private DB của service khác. Chọn AppSync khi cần field selection/composition; API Gateway cho REST proxy/usage-plan requirements theo API type.

---

## 7. Data Migration & Schema Evolution

### 7.1. Schema Migration cho RDS

```d2 title="7.1. Schema Migration cho RDS"
direction: right
dev: "Developer viết V3__migration"
git: "Commit migration file"
ci: "CI/CD — Flyway / Liquibase"
db: "Apply Aurora Migration"
verify: "Verify compatibility / Backfill / Cutover / Contract"
dev -> git
git -> ci
ci -> db
db -> verify
```

Service owns schema migrations, vẫn có thể có DBA/platform hỗ trợ. Flyway SQL numbered versions, Liquibase XML/YAML/SQL. Không sửa migration đã chạy; expand nullable field trước app, dual-write/backfill/read-cutover theo plan, rồi dừng legacy writes và chỉ drop sau rollback window. Không rename/drop field đang được app cũ dùng.

### 7.2. DynamoDB Schema Evolution

```
DynamoDB — Schema-less nhưng vẫn cần quản lý:
──────────────────────────────────────────────

DynamoDB không có "ALTER TABLE" — schema implicit trong application code.
→ Schema evolution = thay đổi cách app đọc/ghi data.

Strategies:
──────────

1. Version attribute:
   Mỗi item có "schemaVersion" attribute
   
   v1: { PK, SK, name, price }
   v2: { PK, SK, name, price, category, tags }  ← thêm fields
   
   App code:
   if (item.schemaVersion === 1) {
     // handle v1 format
   } else {
     // handle v2 format
   }

2. Lazy migration:
   Khi đọc item v1 → transform sang v2 → ghi lại
   → Data dần dần migrate sang format mới
   → Không cần batch migration (which can be expensive on DynamoDB)

3. GSI changes:
   Thêm GSI mới → DynamoDB tự backfill existing items
   Xóa GSI cũ → sau khi app không còn query GSI đó
   ⚠️ Giới hạn 20 GSI per table, chỉ thêm 1 GSI tại 1 thời điểm
```

### 7.3. Blue-Green Database Migration

```d2 title="7.3. Blue-Green Database Migration"
direction: down
setup: Setup / Sync {
 service: Live Service
 blue: Blue Aurora PostgreSQL
 green: Green Aurora PostgreSQL v2
 service -> blue
 blue -> green: DMS full load + ongoing CDC
}
cutover: Sau validation / Cutover {
 service: Live Service
 blue: Blue DB — giữ theo rollback plan
 green: Green DB — nhận writes mới
 service -> green: Switch connection
}
```

Steps: tạo Green/clone hoặc full-load+CDC, kiểm chứng replication/schema/app, cutover có write-consistency plan, monitor24–48h theo yêu cầu rồi decommission Blue. **Không đơn giản switch ngược về Blue sau khi Green nhận writes**: Blue có thể stale, cần reverse-sync/reconciliation/rollback design.

---

## 8. Ví dụ thực tế — E-Commerce Data Architecture trên AWS

> 🔗 Tham khảo đề bài chi tiết tại [25 — Case Study: E-Commerce](25-case-study-ecommerce.md)

Áp dụng cho hệ thống **ShopVN** (200K DAU, 50K đơn/ngày):

```d2 title="8. Ví dụ thực tế — E-Commerce Data Architecture trên AWS"
direction: right
write: Write Paths {
 order: Order Service
 odb: Aurora — orders / order_items / outbox
 user: User Service
 udb: Aurora — users / addresses
 payment: Payment Service
 pdb: Separate Aurora — payments / refunds / PCI boundary
 inventory: Inventory Service
 idb: Aurora — stock / reservations / version locking
 product: Product Service
 prod: Aurora — products / categories
 cart: Cart Service
 cdb: DynamoDB cart — TTL30ngày
 notification: Notification Service
 ndb: DynamoDB log — TTL90ngày
 order -> odb
 user -> udb
 payment -> pdb
 inventory -> idb
 product -> prod
 cart -> cdb
 notification -> ndb
}
events: Durable Relay / Event Delivery {
 cdc: DMS / CDC consumer
 bridge: EventBridge
 sqs: SQS + DLQ
 consumers: Consumers
 cdc -> bridge -> sqs -> consumers
}
read: Read Paths {
 search: OpenSearch — Full-text / Facets
 cache: Redis Product Detail — TTL5phút
 session: Redis Sessions — TTL24giờ
 history: Aurora Read Replica — Order History
 reporting: Redshift — Dashboard / Reporting
}
write.odb -> events.cdc: Outbox CDC
write.udb -> events.bridge: User events qua reliable relay
write.prod -> read.search: CDC / Sync pipeline
write.cdb -> read.reporting: Streams → Lambda → Analytics
```

Sagas điều phối CreateOrder → ReserveStock → ProcessPayment → ConfirmOrder, bù đúng bước đã commit khi fail. EventBridge rules: OrderCreated → Inventory/Notification; PaymentCompleted → Order/Shipping; UserUpdated → Order cache/Notification; LowStock → SNS Ops. DMS cần target/consumer/relay hợp lệ để publish EventBridge, không mặc định hỗ trợ direct EventBridge destination. Các TTL là retention policy ví dụ; DynamoDB TTL cleanup không đúng tại một thời điểm tuyệt đối.

```d2 title="8. Ví dụ thực tế — E-Commerce Data Architecture trên AWS"
direction: down
n4: "Order Saga" {}
n3: "Read Path" {}
n2: "Data Sync" {}
n1: "Write Path" {}
n1.n5: "Order Service"
n1.n6: "Aurora - Orders" {
  shape: cylinder
}
n1.n7: "User Service"
n1.n8: "Aurora - Users" {
  shape: cylinder
}
n1.n9: "Product Service"
n1.n10: "Aurora - Products" {
  shape: cylinder
}
n1.n11: "Inventory Service"
n1.n12: "Aurora - Inventory" {
  shape: cylinder
}
n1.n13: "Cart Service"
n1.n14: "DynamoDB - Cart" {
  shape: cylinder
}
n2.n15: "EventBridge"
n2.n16: "OpenSearch" {
  shape: cylinder
}
n2.n17: "Lambda"
n3.n18: "Product Search"
n3.n19: "ElastiCache Redis" {
  shape: cylinder
}
n3.n20: "Product Cache"
n3.n21: "User Session"
n3.n22: "Aurora Read Replica" {
  shape: cylinder
}
n3.n23: "Order History"
n4.n24: "Step Functions"
n4.n25: "Payment Service"
n26: "SQS Queues"
n27: "Consumer Services"
n1.n5 -> n1.n6
n1.n7 -> n1.n8
n1.n9 -> n1.n10
n1.n11 -> n1.n12
n1.n13 -> n1.n14
n1.n6 -> n2.n15: "Outbox + DMS CDC"
n1.n10 -> n2.n16: "DMS CDC"
n1.n14 -> n2.n17: "Streams"
n2.n16 -> n3.n18
n3.n19 -> n3.n20
n3.n19 -> n3.n21
n3.n22 -> n3.n23
n4.n24 -> n1.n5
n4.n24 -> n1.n11
n4.n24 -> n4.n25
n2.n15 -> n26: "Events"
n26 -> n27
```

---

## 9. Anti-patterns

| Anti-pattern | Vấn đề | Nên làm |
|-------------|--------|---------|
| **Shared Database** | 3 services cùng đọc/ghi 1 DB → tight coupling | Database per Service, giao tiếp qua API/events |
| **Distributed Transaction (2PC)** | 2PC giữa Aurora + DynamoDB → blocking, single point of failure | Saga Pattern (Step Functions / EventBridge) |
| **Direct DB Access** | Order Service đọc thẳng User DB | Order Service gọi User Service API hoặc cache local copy |
| **One Database Type** | Ép tất cả service dùng Aurora | Polyglot: Aurora cho ACID, DynamoDB cho key-value, OpenSearch cho search |
| **Cache Without Strategy** | Cache không có TTL, không invalidate | Event-driven invalidation, TTL phù hợp, cache-aside pattern |
| **No Outbox** | Write DB + publish event không atomic → data inconsistency | Outbox Pattern (DynamoDB Transaction + Streams) |
| **Over-engineering Event Sourcing** | Dùng Event Sourcing cho CRUD đơn giản | Event Sourcing chỉ khi cần audit trail, temporal queries, undo |
| **DynamoDB Without Access Patterns** | Thiết kế DynamoDB table như SQL (normalize) | Single-table design, thiết kế GSI dựa trên access patterns |
| **Ignoring Eventual Consistency** | Assume strong consistency xuyên service | Design cho eventual consistency, UI hiển thị "đang xử lý" |
| **No DLQ** | Event processing fail → mất event → data inconsistent | DLQ cho mọi SQS queue, CloudWatch alarm khi DLQ có messages |

---

## 10. Checklist triển khai

### Database Selection
- [ ] Mỗi service có database riêng (hoặc separate schema tối thiểu)
- [ ] Chọn DB type phù hợp use case (Aurora cho ACID, DynamoDB cho key-value)
- [ ] DynamoDB access patterns thiết kế trước khi code
- [ ] Aurora Multi-AZ cho production
- [ ] Encryption at rest (KMS) và in transit (TLS) cho mọi database

### Data Consistency
- [ ] Outbox Pattern cho dual-write scenarios
- [ ] Saga Pattern (Step Functions) cho distributed transactions
- [ ] DLQ cho mọi async event processing
- [ ] Idempotency key cho mọi consumer (at-least-once delivery)
- [ ] Correlation ID xuyên suốt event chain (tracing)

### CQRS (nếu áp dụng)
- [ ] Write DB và Read DB tách biệt
- [ ] Sync mechanism: DynamoDB Streams / DMS CDC / EventBridge
- [ ] Read model rebuild procedure (từ event store / write DB)
- [ ] Monitor sync lag (delay giữa write và read)

### Caching
- [ ] ElastiCache Redis cho read-heavy services
- [ ] TTL phù hợp cho từng loại data
- [ ] Cache invalidation strategy (event-driven hoặc TTL)
- [ ] Cache stampede protection (lock hoặc early expiry)

### Backup & Recovery
- [ ] Aurora: automated backup + point-in-time restore
- [ ] DynamoDB: point-in-time recovery enabled
- [ ] ElastiCache: snapshot backup (cho persistent data)
- [ ] Cross-region backup cho disaster recovery
- [ ] Test restore procedure định kỳ (quarterly)

### Schema Management
- [ ] Migration tool (Flyway/Liquibase) cho RDS
- [ ] Backward-compatible migrations (expand-contract)
- [ ] DynamoDB schema versioning strategy
- [ ] Migration chạy trong CI/CD pipeline

---

## 11. Tổng kết

```
┌───────────────────────────────────────────────────────────────────┐
│              DATA MANAGEMENT DECISION SUMMARY                     │
│                                                                   │
│  Database Selection:                                              │
│  • ACID, relational, complex queries  → Aurora PostgreSQL         │
│  • Key-value, serverless, auto-scale  → DynamoDB                  │
│  • Cache, session, rate limiting      → ElastiCache Redis         │
│  • Full-text search, analytics        → OpenSearch                │
│  • Graph relationships                → Neptune                   │
│  • Data warehouse, OLAP               → Redshift                  │
│                                                                   │
│  Data Consistency:                                                │
│  • Distributed transaction    → Saga (Step Functions)             │
│  • Dual-write atomicity       → Outbox Pattern                    │
│  • Cross-service data sync    → CDC (DynamoDB Streams / DMS)      │
│  • Event broadcasting         → EventBridge                       │
│                                                                   │
│  CQRS:                                                            │
│  • Write: Aurora/DynamoDB → Read: OpenSearch/Redis                │
│  • Sync: DynamoDB Streams / DMS CDC / EventBridge                 │
│  • Khi nào: read/write ratio > 10:1, complex query patterns       │
│                                                                   │
│  Event Sourcing:                                                  │
│  • Event Store: DynamoDB (recommended) hoặc MSK (Kafka)           │
│  • CQRS projections: Lambda + Aurora/Redis/OpenSearch             │
│  • Khi nào: audit trail, temporal queries, undo, compliance       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Key takeaways:**

1. **Database per Service là bắt buộc** — mỗi service sở hữu data riêng, không shared DB
2. **Polyglot Persistence** — chọn DB phù hợp use case, không ép tất cả dùng 1 loại
3. **Step Functions = managed Saga** — không cần tự build orchestrator
4. **DynamoDB Streams là CDC miễn phí** — dùng cho CQRS sync, Event Sourcing
5. **Outbox Pattern giải quyết dual-write** — DynamoDB Transaction + Streams là cách đơn giản nhất
6. **Eventual consistency là bình thường** — design UI và UX cho phù hợp

---

## 12. Liên kết liên quan

- [09 — Data Management](09-data-management.md) — Lý thuyết Database per Service, Saga, CQRS, Event Sourcing
- [18 — Triển khai & Kiến trúc tổng quan](18-aws-deployment-architecture.md) — Kiến trúc reference trên AWS
- [19 — Communication & Service Discovery trên AWS](19-aws-communication-discovery.md) — EventBridge, SQS, Step Functions
- [21 — Resilience & Auto Scaling trên AWS](21-aws-resilience.md) — Auto Scaling, Multi-AZ, disaster recovery
- [22 — Observability trên AWS](22-aws-observability.md) — Monitoring data layer
- [25 — Case Study: E-Commerce](25-case-study-ecommerce.md) — Áp dụng tổng hợp
