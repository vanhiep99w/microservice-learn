# Data Management trong Microservice

## 📋 Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
- [2. Database per Service](#2-database-per-service)
  - [2.1. Tại sao mỗi service cần database riêng?](#21-tại-sao-mỗi-service-cần-database-riêng)
  - [2.2. Các mô hình triển khai](#22-các-mô-hình-triển-khai)
  - [2.3. Polyglot Persistence](#23-polyglot-persistence)
  - [2.4. Thách thức khi mỗi service có DB riêng](#24-thách-thức-khi-mỗi-service-có-db-riêng)
- [3. Shared Database — Anti-pattern](#3-shared-database--anti-pattern)
  - [3.1. Tại sao Shared Database là anti-pattern?](#31-tại-sao-shared-database-là-anti-pattern)
  - [3.2. Khi nào chấp nhận Shared Database?](#32-khi-nào-chấp-nhận-shared-database)
- [4. CAP Theorem](#4-cap-theorem)
  - [4.1. Ba thuộc tính CAP](#41-ba-thuộc-tính-cap)
  - [4.2. Tại sao chỉ chọn được 2/3?](#42-tại-sao-chỉ-chọn-được-23)
  - [4.3. CAP trong thực tế — Không đơn giản là chọn 2](#43-cap-trong-thực-tế--không-đơn-giản-là-chọn-2)
  - [4.4. BASE — Thay thế cho ACID trong hệ phân tán](#44-base--thay-thế-cho-acid-trong-hệ-phân-tán)
- [5. Quản lý Data Consistency xuyên service](#5-quản-lý-data-consistency-xuyên-service)
  - [5.1. Vấn đề: Distributed Transaction](#51-vấn-đề-distributed-transaction)
  - [5.2. Two-Phase Commit (2PC) — Và tại sao nên tránh](#52-two-phase-commit-2pc--và-tại-sao-nên-tránh)
- [6. Saga Pattern](#6-saga-pattern)
  - [6.1. Saga là gì?](#61-saga-là-gì)
  - [6.2. Choreography Saga](#62-choreography-saga)
  - [6.3. Orchestration Saga](#63-orchestration-saga)
  - [6.4. So sánh Choreography vs Orchestration](#64-so-sánh-choreography-vs-orchestration)
  - [6.5. Xử lý lỗi trong Saga — Compensating Transaction](#65-xử-lý-lỗi-trong-saga--compensating-transaction)
  - [6.6. Saga Execution Coordinator (SEC)](#66-saga-execution-coordinator-sec)
- [7. CQRS — Command Query Responsibility Segregation](#7-cqrs--command-query-responsibility-segregation)
  - [7.1. Vấn đề với CRUD truyền thống](#71-vấn-đề-với-crud-truyền-thống)
  - [7.2. CQRS là gì?](#72-cqrs-là-gì)
  - [7.3. Các mức độ áp dụng CQRS](#73-các-mức-độ-áp-dụng-cqrs)
  - [7.4. Ví dụ thực tế — E-Commerce Product Service](#74-ví-dụ-thực-tế--e-commerce-product-service)
  - [7.5. Khi nào nên / không nên dùng CQRS](#75-khi-nào-nên--không-nên-dùng-cqrs)
- [8. Event Sourcing](#8-event-sourcing)
  - [8.1. Ví dụ đời thực](#81-ví-dụ-đời-thực)
  - [8.2. Vấn đề mà Event Sourcing giải quyết](#82-vấn-đề-mà-event-sourcing-giải-quyết)
  - [8.3. Nguyên tắc hoạt động](#83-nguyên-tắc-hoạt-động)
  - [8.4. Ví dụ chi tiết — Đơn hàng từ đầu đến cuối](#84-ví-dụ-chi-tiết--đơn-hàng-từ-đầu-đến-cuối)
  - [8.5. Vấn đề hiệu năng — Snapshot](#85-vấn-đề-hiệu-năng--snapshot)
  - [8.6. Event Sourcing kết hợp CQRS](#86-event-sourcing-kết-hợp-cqrs)
  - [8.7. Các Event Store phổ biến](#87-các-event-store-phổ-biến)
  - [8.8. Khi nào nên / không nên dùng Event Sourcing](#88-khi-nào-nên--không-nên-dùng-event-sourcing)
- [9. Cross-Service Data — Lấy data từ service khác](#9-cross-service-data--lấy-data-từ-service-khác)
  - [9.1. Vấn đề: Service cần data không thuộc về mình](#91-vấn-đề-service-cần-data-không-thuộc-về-mình)
  - [9.2. Change Data Capture (CDC)](#92-change-data-capture-cdc)
  - [9.3. Event-Carried State Transfer](#93-event-carried-state-transfer)
  - [9.4. API Composition](#94-api-composition)
  - [9.5. So sánh các cách tiếp cận](#95-so-sánh-các-cách-tiếp-cận)
- [10. Transactional Outbox Pattern](#10-transactional-outbox-pattern)
  - [10.1. Vấn đề: Dual Write](#101-vấn-đề-dual-write)
  - [10.2. Outbox Pattern giải quyết thế nào?](#102-outbox-pattern-giải-quyết-thế-nào)
  - [10.3. Outbox + CDC — Giải pháp hoàn chỉnh](#103-outbox--cdc--giải-pháp-hoàn-chỉnh)
- [11. Tổng kết](#11-tổng-kết)
- [12. Liên kết liên quan](#12-liên-kết-liên-quan)

---

## 1. Giới thiệu

Trong kiến trúc Microservice, mỗi service nên **sở hữu data riêng** — đây là nguyên tắc nền tảng. Nhưng khi data bị phân tán, hàng loạt thách thức xuất hiện: làm sao giữ **consistency** xuyên service? Làm sao thực hiện **transaction** khi data nằm ở nhiều database? Làm sao **query** data khi nó thuộc về nhiều service khác nhau?

Document này sẽ đi qua các pattern và chiến lược quản lý data trong Microservice — từ nguyên tắc cơ bản (Database per Service) đến các pattern nâng cao (Saga, CQRS, Event Sourcing).

> 📌 Liên quan: [doc 04 — Autonomy & Independence](04-autonomy-independence.md) đã nói về service autonomy. Data independence chính là nền tảng để đạt autonomy.

---

## 2. Database per Service

### 2.1. Tại sao mỗi service cần database riêng?

```d2 title="Database per Service — data ownership"
direction: right
order: Order Service { db: Order DB {shape: cylinder} }
product: Product Service { db: Product DB {shape: cylinder} }
user: User Service { db: User DB {shape: cylinder} }
```

Mỗi service sở hữu data của mình. Service khác không được truy cập Order DB trực tiếp; muốn data Order thì gọi Order Service API.

**Lý do:**

| Lý do | Giải thích |
|-------|-----------|
| **Loose Coupling** | Service đổi schema DB mà không ảnh hưởng service khác |
| **Independent Deployment** | Deploy Order Service mà không sợ break Product Service |
| **Technology Freedom** | Order dùng PostgreSQL, Product dùng Elasticsearch — tùy nhu cầu |
| **Team Autonomy** | Team Order tự quyết định schema, indexing, migration — không cần "xin phép" |
| **Scalability** | Scale DB của service nào đang chịu tải cao, không cần scale cả hệ thống |
| **Fault Isolation** | Order DB chết → chỉ Order Service chết, Product Service vẫn chạy bình thường |

### 2.2. Các mô hình triển khai

```d2 title="2.2. Các mô hình triển khai"
direction: down
server: Separate Servers {
 order: Order Service
 product: Product Service
 user: User Service
 a: PostgreSQL Server A — 5432 {shape: cylinder}
 b: PostgreSQL Server B — 5433 {shape: cylinder}
 c: MySQL Server C — 3306 {shape: cylinder}
 order -> a
 product -> b
 user -> c
}
schemas: Separate Schemas — cùng PostgreSQL Server {
 order: Order Service
 product: Product Service
 user: User Service
 db: Shared Server { order: order_svc; product: product_svc; user: user_svc }
 order -> db.order
 product -> db.product
 user -> db.user
}
tables: Separate Tables — Schema public {
 order: order_orders / order_items
 product: product_products / product_categories
 user: user_users
}
# Icons: https://icons.d2lang.com/
server.a.icon: "https://icons.d2lang.com/dev/postgresql.svg"
server.b.icon: "https://icons.d2lang.com/dev/postgresql.svg"
server.c.icon: "https://icons.d2lang.com/dev/mysql.svg"
```

Separate server cách ly tốt hơn nhưng chi phí cao. Separate schema tiết kiệm và có thể enforce quyền theo schema, nhưng chia sẻ CPU/RAM/I/O và server failure. Separate table theo convention đơn giản cho team nhỏ, nhưng convention một mình không enforce ownership; cần quyền DB phù hợp để ngăn truy cập chéo/JOIN tùy tiện.

```
Khuyến nghị:
────────────
  Startup / MVP        → Mô hình 2 hoặc 3 (tiết kiệm)
  Growth / Scale-up    → Mô hình 2 (separate schema)
  Enterprise / Large   → Mô hình 1 (separate server)

  Bắt đầu đơn giản → tách ra khi cần. Đừng over-engineer từ đầu.
```

### 2.3. Polyglot Persistence

**Polyglot Persistence** (đa dạng công nghệ lưu trữ) = Mỗi service **chọn database phù hợp nhất** với use case của mình, thay vì ép tất cả dùng chung 1 loại DB.

```d2 title="2.3. Polyglot Persistence"
direction: right
primary: Primary Databases {
 order: Order Service
 pg: PostgreSQL — ACID / relational order-items {shape: cylinder}
 reviews: Product Reviews
 mongo: MongoDB — schema linh hoạt / ảnh / video / rating {shape: cylinder}
 recommend: Recommendation
 neo: Neo4j — graph traversal mua cùng {shape: cylinder}
 log: Notification Log
 cassandra: Cassandra — append-heavy / time-series {shape: cylinder}
 order -> pg
 reviews -> mongo
 recommend -> neo
 log -> cassandra
}
specialized: Specialized / Derived / Ephemeral {
 catalog: Product Catalog
 pg: PostgreSQL — primary {shape: cylinder}
 es: Elasticsearch — search {shape: cylinder}
 session: User Session
 redis: Redis — TTL {shape: cylinder}
 cart: Shopping Cart
 cartdb: Redis / DynamoDB {shape: cylinder}
 analytics: Analytics
 warehouse: ClickHouse / BigQuery — columnar aggregate {shape: cylinder}
 catalog -> pg -> es: Sync
 session -> redis
 cart -> cartdb
 analytics -> warehouse
}
# Icons: https://icons.d2lang.com/
specialized.pg.icon: "https://icons.d2lang.com/dev/postgresql.svg"
specialized.redis.icon: "https://icons.d2lang.com/dev/redis.svg"
```

Chọn store theo use case: session có thể chấp nhận login lại khi mất, cart cần policy durability rõ. Replica/partitioning không tự bảo đảm không mất dữ liệu hay không có failure; phải thiết kế cấu hình vận hành.

> ⚠️ **Primary DB vs Specialized Store — Phân biệt quan trọng:**
>
> Không phải DB nào cũng phù hợp làm **primary database** (source of truth). Cần phân biệt rõ:

```
Primary DB — Source of truth, data KHÔNG ĐƯỢC mất:
──────────────────────────────────────────────────
  ✅ PostgreSQL, MySQL     — ACID, durable, proven
  ✅ MongoDB               — Durable (với writeConcern: majority)
  ✅ Cassandra, DynamoDB   — Durable, distributed
  ✅ Neo4j                 — Durable graph store

Specialized Store — Secondary, derived, hoặc ephemeral:
───────────────────────────────────────────────────────
  ⚠️ Elasticsearch — KHÔNG NÊN làm primary DB
     • Near real-time (write → 1s mới searchable)
     • Không có transaction (không ACID)
     • Risk mất data khi split-brain
     • Thực tế: Luôn dùng kèm primary DB (PostgreSQL → CDC → ES)

  ⚠️ Redis — Chỉ làm primary cho EPHEMERAL data
     • Persistence có (AOF/RDB) nhưng durability không bằng RDBMS
     • Phù hợp: session, cache, cart, rate limit, leaderboard
     • KHÔNG phù hợp: order, payment, user profile (data quan trọng)
     • Thực tế: Shopping cart ở hệ thống lớn dùng DynamoDB hơn Redis

  ⚠️ ClickHouse / BigQuery — Read-only analytics
     • Data aggregated từ nhiều source, không phải source of truth
```

```d2 title="2.3. Polyglot Persistence"
direction: right
admin: "Admin"
write: "Product Service — Write"
pg: "PostgreSQL\nPrimary / Source of truth"
es: "Elasticsearch\nDerived search index"
user: "User search"
read: "Product Service — Search"
admin -> write
write -> pg: "Chỉ ghi primary"
pg -> es: "CDC / Event"
user -> read
read -> es: "Search read-only"
# Icons: https://icons.d2lang.com/
pg.icon: "https://icons.d2lang.com/dev/postgresql.svg"
```

Index có thể rebuild từ primary. Elasticsearch down làm search tạm lỗi nhưng không mất dữ liệu gốc ở PostgreSQL.

| DB Type | Phù hợp | Ví dụ DB | Làm Primary? |
|---------|---------|----------|:------------:|
| **Relational** | ACID, quan hệ phức tạp, JOIN | PostgreSQL, MySQL | ✅ Luôn được |
| **Document** | Schema linh hoạt, nested objects | MongoDB, CouchDB | ✅ Được |
| **Key-Value** | Cache, session, đọc/ghi nhanh | Redis, DynamoDB | ⚠️ Chỉ ephemeral data (Redis) / ✅ DynamoDB |
| **Graph** | Quan hệ phức tạp, traversal | Neo4j, Amazon Neptune | ✅ Được |
| **Search Engine** | Full-text search, filtering | Elasticsearch, OpenSearch | ❌ Không nên |
| **Column-family** | Write-heavy, time-series | Cassandra, HBase | ✅ Được |
| **Columnar** | Analytics, OLAP | ClickHouse, BigQuery | ❌ Secondary/derived |

> ⚠️ **Cẩn trọng**: Polyglot Persistence = nhiều DB → nhiều thứ phải vận hành, monitor, backup. Chỉ đa dạng hóa khi **thật sự cần**. Đừng dùng 7 loại DB cho 3 services.

### 2.4. Thách thức khi mỗi service có DB riêng

```
Database per Service → 3 thách thức lớn:
────────────────────────────────────────

  1. CROSS-SERVICE QUERIES
     ─────────────────────
     Monolith: SELECT * FROM orders JOIN users ON orders.user_id = users.id
     Microservice: ❌ Không thể JOIN — data ở 2 DB khác nhau!
     
     → Giải pháp: API Composition, CQRS (xem phần 7, 9)

  2. DISTRIBUTED TRANSACTIONS
     ────────────────────────
     Monolith: BEGIN → debit account → create order → COMMIT
     Microservice: ❌ 2 DB → không thể 1 transaction!
     
     → Giải pháp: Saga Pattern (xem phần 6)

  3. DATA CONSISTENCY
     ────────────────
     Monolith: ACID đảm bảo consistency
     Microservice: Eventual consistency — data có thể inconsistent tạm thời
     
     → Giải pháp: Event-driven, Saga, Outbox Pattern (xem phần 6, 10)
```

---

## 3. Shared Database — Anti-pattern

### 3.1. Tại sao Shared Database là anti-pattern?

```d2 title="Shared Database — coupling qua schema chung"
direction: down
order: Order Service
product: Product Service
user: User Service
db: Shared Database {shape: cylinder}
order -> db
product -> db
user -> db
```

Các vấn đề: **tight coupling** (đổi bảng `users` có thể làm Order lỗi); migration phải coordinate tất cả consumers; không scale DB độc lập cho Product; DB trở thành single point of failure; ownership của dữ liệu như `orders.product_name` không rõ ràng.

### 3.2. Khi nào chấp nhận Shared Database?

```
Có thể chấp nhận Shared Database khi:
──────────────────────────────────────

  1. Giai đoạn chuyển đổi (Monolith → Microservice)
     Đang tách service từ monolith, chưa tách DB xong
     → Tạm dùng shared DB, có kế hoạch tách sau

  2. Reporting / Analytics
     Read-only replica cho reporting
     → Không ghi, không coupling logic

  3. Team rất nhỏ (2-3 người)
     Overhead quản lý nhiều DB > benefit
     → Dùng separate schema trong cùng DB server (mô hình 2)

  4. Legacy system integration
     Hệ thống cũ dùng shared DB, chưa có resource refactor

  ⚠️ Coi đây là TECHNICAL DEBT — có kế hoạch trả nợ
```

---

## 4. CAP Theorem

### 4.1. Ba thuộc tính CAP

**CAP Theorem** (Eric Brewer, 2000) nói rằng: Trong một hệ thống phân tán (distributed system), bạn chỉ có thể **đảm bảo tối đa 2 trong 3** thuộc tính sau:

```d2 title="4.1. Ba thuộc tính CAP"
direction: down
cap: CAP trong mô hình distributed system {
 c: "C — Consistency\nRead quan sát write mới nhất hoặc lỗi\nLinearizability trong định lý CAP"
 a: "A — Availability\nRequest tới node không lỗi nhận response\nKhông bị buộc phải chờ partition phục hồi"
 p: "P — Partition\nMessages giữa các nhóm node có thể bị mất / trễ"
 c -- a: Không thể đảm bảo đồng thời khi partition
 p -- c: Lựa chọn CP
 p -- a: Lựa chọn AP
}
```

Không phải lúc nào cũng chọn tùy ý hai trong ba. Partition là tình huống mạng cần dự liệu; khi partition thực sự xảy ra, phải đánh đổi C hoặc A theo định nghĩa CAP.

| Thuộc tính | Ý nghĩa | Ví dụ |
|-----------|---------|-------|
| **Consistency (C)** | Mọi read đều trả về data mới nhất (hoặc lỗi) | Sau khi write, tất cả node đọc ra cùng giá trị |
| **Availability (A)** | Mọi request đều nhận response (không timeout, không lỗi) | Dù 1 node chết, hệ thống vẫn trả response |
| **Partition Tolerance (P)** | Hệ thống tiếp tục hoạt động khi network bị phân mảnh | Node A không liên lạc được Node B, nhưng cả 2 vẫn serve request |

### 4.2. Tại sao chỉ chọn được 2/3?

```d2 title="4.2. Tại sao chỉ chọn được 2/3?"
direction: down
normal: Không partition {
 a: Node A — data 5
 b: Node B — data 5
 a <-> b: Sync OK
}
partition: Khi mất kết nối {
 a: Node A — client muốn write 10
 b: Node B — vẫn data 5
 a -- b: Network DOWN {style.stroke-dash: 5}
 cp: "CP\nRefuse write hoặc không cho stale read\nGiữ consistency, giảm availability"
 ap: "AP\nA nhận write 10, B vẫn có thể trả 5\nGiữ availability, mất strong consistency"
 a -> cp: Chọn C
 a -> ap: Chọn A
}
```

Mô hình CA chỉ phù hợp mô tả điều kiện không partition; shutdown toàn hệ thống khi partition không đáp ứng availability của CAP. Không thể lấy shutdown làm cách vừa C vừa A trong tình huống mất mạng.

### 4.3. CAP trong thực tế — Không đơn giản là chọn 2

CAP Theorem nói về hệ thống **distributed** (nhiều node kết nối qua mạng). Trong thực tế, **mạng LUÔN có thể lỗi** — dây đứt, switch hỏng, packet mất, data center mất kết nối. Đây không phải "nếu" mà là "khi nào" xảy ra. Vì vậy, **Partition Tolerance không phải lựa chọn — mà là thực tế phải chấp nhận**.

Câu hỏi thực sự chỉ là: **Khi partition xảy ra, hy sinh Consistency hay Availability?**

```d2 title="4.3. CAP trong thực tế — Không đơn giản là chọn 2"
direction: right
a: "Node A — Hà Nội"
b: "Node B — Sài Gòn"
a -> b: "Network có thể mất kết nối"
b -> a: "Không thể loại trừ partition"
```

Nguyên nhân: dây/switch/router hỏng, DC mất kết nối, firewall chặn nhầm, congestion/timeouts, cô lập AZ. Hệ thống phân tán cần policy cho partition, thay vì giả định mạng luôn tốt.

```
Còn single-node database thì sao?
──────────────────────────────────

  Single-node (1 máy duy nhất) = KHÔNG PHẢI distributed system
  → Không có 2 node → không có network giữa các node
  → Không có partition → CAP KHÔNG ÁP DỤNG

  ┌───────────────────────────────────────────────────────────────┐
  │  Database            │ Hành vi                                │
  │──────────────────────│────────────────────────────────────────│
  │  PostgreSQL (1 node) │ ACID đầy đủ, Consistent + Available    │
  │  MySQL (1 node)      │ Nhưng 1 node chết = MẤT TẤT CẢ         │
  │  SQL Server (1 node) │ Không có HA, không scale được          │
  └───────────────────────────────────────────────────────────────┘

  Vậy khi nào single-node phải đối mặt CAP?
  → Khi bạn THÊM REPLICA (để HA hoặc scale read)
  → Lúc này có 2+ node → trở thành distributed → CAP áp dụng
  → Và TÙY CẤU HÌNH replication mà thành CP hay AP (xem dưới)

  Ví dụ:
    PostgreSQL 1 node  →  Không liên quan CAP (CA tầm thường)
    PostgreSQL + 2 replica  →  Distributed → phải chọn CP hay AP


  CP Systems (ưu tiên Consistency):
  ┌───────────────────────────────────────────────────────────────┐
  │  Database            │ Hành vi khi partition                  │
  │──────────────────────│────────────────────────────────────────│
  │  PostgreSQL          │ Synchronous replication: replica lag   │
  │  (sync replication)  │ → primary chờ replica ACK → nếu mất    │
  │                      │ kết nối → write bị block (unavailable) │
  │  MySQL Group         │ Single-primary mode: mất majority      │
  │  Replication         │ → partition bị reject write            │
  │  MongoDB (default)   │ Primary unavailable → lỗi write        │
  │  HBase               │ Reject request nếu không sync được     │
  │  Redis Cluster       │ Reject write nếu mất majority node     │
  │  Zookeeper           │ Unavailable nếu mất quorum             │
  │  etcd                │ Raft consensus → unavailable nếu       │
  │                      │ mất majority                           │
  └───────────────────────────────────────────────────────────────┘

  AP Systems (ưu tiên Availability):
  ┌───────────────────────────────────────────────────────────────┐
  │  Database            │ Hành vi khi partition                  │
  │──────────────────────│────────────────────────────────────────│
  │  PostgreSQL          │ Async replication: replica có thể đọc  │
  │  (async replication) │ data cũ (stale read), write vẫn OK     │
  │                      │ → Available nhưng inconsistent tạm     │
  │  MySQL (async        │ Tương tự — primary vẫn serve write,    │
  │   replication)       │ replica có thể lag                     │
  │  Cassandra           │ Vẫn serve, eventual consistency        │
  │  DynamoDB            │ Always available, conflict resolve     │
  │  CouchDB             │ Multi-master, merge conflicts later    │
  │  Riak                │ Available, vector clocks cho conflict  │
  └───────────────────────────────────────────────────────────────┘
```

```
Vậy SQL database thuộc loại nào?
────────────────────────────────

  SQL (single node):
  ──────────────────
    → CA — Consistent + Available, nhưng KHÔNG distributed
    → Node chết = hệ thống chết. Không có partition để xét.
    → Hầu hết ứng dụng nhỏ-vừa dùng cách này.

  SQL (distributed / replicated):
  ───────────────────────────────
    → TÙY CẤU HÌNH replication mà thành CP hoặc AP:

    ┌──────────────────────────────────────────────────────────────┐
    │  Cấu hình             │ CAP   │ Trade-off                    │
    │───────────────────────│───────│───────────────────────────── │
    │  Sync replication     │ CP    │ Write chậm hơn (chờ ACK      │
    │  (synchronous_commit) │       │ từ replica), nhưng data      │
    │                       │       │ không bao giờ stale          │
    │                       │       │                              │
    │  Async replication    │ AP    │ Write nhanh (không chờ),     │
    │  (default PostgreSQL) │       │ nhưng replica có thể lag     │
    │                       │       │ vài ms → stale read          │
    │                       │       │                              │
    │  Semi-sync            │ CP/AP │ Ở giữa — chờ ít nhất 1       │
    │  (MySQL semi-sync)    │       │ replica ACK, cho phép        │
    │                       │       │ còn lại async                │
    └──────────────────────────────────────────────────────────────┘

    Ví dụ PostgreSQL:
      primary ──sync──▶ replica-1 (đồng bộ, phải ACK) → CP
      primary ──async─▶ replica-2 (bất đồng bộ, có thể lag) → AP

      → Cùng 1 database, CÓ THỂ vừa CP vừa AP tùy cấu hình!
    
  SQL (NewSQL — distributed SQL):
  ────────────────────────────────
    → CP — Thiết kế để vừa distributed vừa strong consistency

    ┌────────────────────────────────────────────────────────────┐
    │  Database          │ Hành vi                               │
    │────────────────────│───────────────────────────────────────│
    │  CockroachDB       │ Raft consensus, serializable          │
    │                    │ → unavailable nếu mất majority        │
    │  Google Spanner    │ TrueTime + Paxos, externally          │
    │                    │ consistent → unavailable khi partition│
    │  YugabyteDB        │ Raft consensus, PostgreSQL-compatible │
    │  TiDB              │ Raft, MySQL-compatible                │
    └────────────────────────────────────────────────────────────┘

    → NewSQL = "distributed SQL with strong consistency"
    → Trade-off: latency cao hơn (consensus overhead)
  ```

```
Chọn CP hay AP tùy vào USE CASE:
─────────────────────────────────

  CP — Khi data SAI thì thà KHÔNG có:
    • Banking: Số dư tài khoản PHẢI chính xác
    • Inventory: Số lượng tồn kho phải đúng (tránh oversell)
    • Booking: Đặt vé máy bay không được trùng ghế

  AP — Khi service CHẾT thì tệ hơn data cũ:
    • Social feed: Hiện bài cũ 5 phút vẫn OK
    • Product catalog: Giá cũ vài giây không sao
    • Shopping cart: Giỏ hàng hiện data cũ > giỏ hàng lỗi 500
    • DNS: Trả IP cũ tốt hơn không trả gì
```

### 4.4. BASE — Thay thế cho ACID trong hệ phân tán

Trong monolith, chúng ta quen với **ACID** (Atomicity, Consistency, Isolation, Durability). Trong hệ phân tán, **BASE** là mô hình thực tế hơn:

| | ACID | BASE |
|---|------|------|
| **Viết tắt** | Atomicity, Consistency, Isolation, Durability | Basically Available, Soft state, Eventually consistent |
| **Consistency** | Strong — data luôn nhất quán | Eventual — data nhất quán **sau một khoảng thời gian** |
| **Availability** | Có thể unavailable để đảm bảo consistency | Basically Available — hệ thống luôn trả response |
| **Phù hợp** | Single database, transaction đơn giản | Distributed system, microservices |
| **Trade-off** | Hy sinh availability khi cần | Hy sinh consistency tạm thời |

Các mốc 50 ms và 200 ms chỉ là **minh họa**, không phải SLA. Khoảng cách trên sơ đồ không biểu thị thời lượng.

```d2 title="Eventual Consistency — các consumer cập nhật độc lập"
direction: right
order: Order Service
db: Order DB {shape: cylinder}
bus: Event Bus
inventory: "Inventory Service\nVí dụ cập nhật sau 50 ms"
inventorydb: Inventory DB {shape: cylinder}
notification: "Notification Service\nVí dụ gửi email sau 200 ms"
order -> db: Commit order
order -> bus: OrderCreated sau commit
bus -> inventory: Async delivery
bus -> notification: Async delivery
inventory -> inventorydb: Trừ tồn kho
```

Giữa commit order và consumer xử lý, các read model có thể chưa đồng bộ. Hai consumer không phải hai bước tuần tự; chỉ hội tụ khi delivery và xử lý thành công. Muốn không mất event giữa DB commit và publish, cần Outbox/CDC hoặc cơ chế tin cậy tương đương.

---

## 5. Quản lý Data Consistency xuyên service

### 5.1. Vấn đề: Distributed Transaction

```
Ví dụ: User đặt hàng — cần 3 bước atomic:
──────────────────────────────────────────

  1. Order Service:     Tạo order (status=CREATED)
  2. Payment Service:   Trừ tiền (debit $100)
  3. Inventory Service: Trừ tồn kho (stock -= 1)

  Trong Monolith:
  ───────────────
    BEGIN TRANSACTION
      INSERT INTO orders ...
      UPDATE accounts SET balance = balance - 100 ...
      UPDATE products SET stock = stock - 1 ...
    COMMIT    ← Tất cả thành công hoặc tất cả rollback

  Trong Microservice:
  ───────────────────
    Order DB:     INSERT → ✅
    Payment DB:   UPDATE → ✅
    Inventory DB: UPDATE → ❌ Hết hàng!

    Bước 3 lỗi, nhưng bước 1 và 2 đã COMMIT rồi!
    → Order đã tạo + tiền đã trừ + hàng không đủ = DATA INCONSISTENT 💥
    → Không có cơ chế ROLLBACK xuyên 3 databases!
```

### 5.2. Two-Phase Commit (2PC) — Và tại sao nên tránh

**Two-Phase Commit** (2PC) là cách truyền thống để đảm bảo distributed transaction:

```d2 title="5.2. Two-Phase Commit (2PC) — Và tại sao nên tránh"
direction: down
coordinator: "Coordinator — Transaction Manager"
order: "Order DB"
payment: "Payment DB"
inventory: "Inventory DB"
decision: "Thu thập PREPARE votes"
commit: "Tất cả YES → COMMIT mọi participant"
rollback: "Bất kỳ NO → ROLLBACK mọi participant"
coordinator -> order: "Phase 1 — PREPARE"
coordinator -> payment: "Phase 1 — PREPARE"
coordinator -> inventory: "Phase 1 — PREPARE"
order -> decision: "YES / NO"
payment -> decision: "YES / NO"
inventory -> decision: "YES / NO"
decision -> commit: "All YES"
decision -> rollback: "Có NO"
```

```
Tại sao TRÁNH 2PC trong Microservice:
──────────────────────────────────────

  1. BLOCKING — Tất cả participant bị lock cho đến khi coordinator quyết định
     → Latency cao, throughput thấp

  2. SINGLE POINT OF FAILURE — Coordinator chết giữa chừng
     → Participant không biết commit hay rollback → stuck!

  3. TIGHT COUPLING — Tất cả service phải implement XA protocol
     → Phụ thuộc vào cùng transaction manager

  4. KHÔNG SCALE — Lock resource xuyên service
     → Càng nhiều service tham gia → càng chậm

  5. HẠN CHẾ DB — Không phải DB nào cũng support XA
     → MongoDB, Cassandra, Redis → không support 2PC

  ❌ 2PC đi ngược lại tinh thần Microservice (autonomy, independence)
  ✅ Dùng Saga Pattern thay thế
```

---

## 6. Saga Pattern

### 6.1. Saga là gì?

**Saga** là pattern thay thế distributed transaction bằng **chuỗi local transaction** — mỗi service thực hiện transaction riêng, và nếu một bước fail thì thực hiện **compensating transaction** (giao dịch bù) để rollback các bước trước.

```d2 title="6.1. Saga là gì?"
direction: right
t1: "T1 — Local transaction"
t2: "T2 — Local transaction"
t3: "T3 — Local transaction"
done: "DONE"
c2: "C2 — Bù T2"
c1: "C1 — Bù T1"
rolled: "Compensated / Rolled back theo business"
t1 -> t2
t2 -> t3
t3 -> done: "Success"
t3 -> c2: "Fail"
c2 -> c1
c1 -> rolled
```

Saga là local transactions và compensating actions, không phải một DB transaction atomic xuyên services; compensation có thể cần retry/manual recovery.

Saga có 2 cách triển khai: **Choreography** và **Orchestration**.

### 6.2. Choreography Saga

Mỗi service **tự lắng nghe event** và quyết định bước tiếp theo — **không có coordinator trung tâm**.

```d2 title="6.2. Choreography Saga"
shape: sequence_diagram
"Client": "Client"
"Order": "Order Service"
"Payment": "Payment Service"
"Inventory": "Inventory Service"
"Notification": "Notification Service"
"Client" -> "Order": "Đặt hàng"
"Order" -> "Order": "T1: Tạo order (PENDING)"
"Order" -> "Payment": "Event: OrderCreated" { style.stroke-dash: 5 }
"Payment" -> "Payment": "T2: Trừ tiền"
"Payment" -> "Inventory": "Event: PaymentCompleted" { style.stroke-dash: 5 }
"Inventory" -> "Inventory": "T3: Trừ tồn kho"
"Inventory" -> "Order": "Event: InventoryReserved" { style.stroke-dash: 5 }
"Inventory" -> "Notification": "Event: InventoryReserved" { style.stroke-dash: 5 }
"Order" -> "Order": "Update order → CONFIRMED"
"Notification" -> "Notification": "Gửi email xác nhận"
```

```d2 title="6.2. Choreography Saga"
direction: right
order: "Order\nTạo order"
payment: "Payment\nT2 trừ tiền OK"
inventory: "Inventory\nT3 fail — hết hàng"
refund: "Payment\nC2 hoàn tiền"
cancel: "Order\nC1 update CANCELLED"
email: "Notification\nEmail đơn hủy do hết hàng"
order -> payment: "OrderCreated"
payment -> inventory: "PaymentCompleted"
inventory -> refund: "InventoryFailed"
refund -> cancel: "PaymentRefunded"
cancel -> email: "OrderCancelled"
```

```
Choreography — Ưu / Nhược:
───────────────────────────

  ✅ Loose coupling — service không biết nhau, chỉ biết events
  ✅ Simple — không cần orchestrator, mỗi service tự xử lý
  ✅ Phù hợp saga ít bước (2-4 services)

  ❌ Khó theo dõi flow — logic phân tán, không có nơi nào thấy toàn bộ saga
  ❌ Cyclic dependency — Service A listen event từ B, B listen từ A
  ❌ Khó debug — "Tại sao order bị cancel?" → phải trace qua nhiều services
  ❌ Không phù hợp saga phức tạp (5+ services)
```

### 6.3. Orchestration Saga

Có **1 Orchestrator** (điều phối viên) biết toàn bộ flow, ra lệnh cho từng service theo thứ tự.

> Playback dưới đây minh họa thứ tự các bước do tác giả chọn; không gửi request thật, không mô phỏng concurrency và tốc độ phát không phải latency. Bạn có thể chạy hoặc xem từng bước.

```d2 title="6.3. Orchestration Saga" mode=flow interactive=true
# @flow
# scenarios:
#   - id: main
#     label: "Kịch bản minh họa"
#     steps:
#       - edge: "(Client -> Orchestrator)[0]"
#         description: "Client → Order Saga Orchestrator: Đặt hàng"
#       - edge: "(Orchestrator -> Order)[0]"
#         description: "Order Saga Orchestrator → Order Service: Tạo order (PENDING)"
#       - edge: "(Order -> Orchestrator)[0]"
#         description: "Order Service → Order Saga Orchestrator: OK"
#       - edge: "(Orchestrator -> Payment)[0]"
#         description: "Order Saga Orchestrator → Payment Service: Trừ tiền"
#       - edge: "(Payment -> Orchestrator)[0]"
#         description: "Payment Service → Order Saga Orchestrator: OK"
#       - edge: "(Orchestrator -> Inventory)[0]"
#         description: "Order Saga Orchestrator → Inventory Service: Trừ tồn kho"
#       - edge: "(Inventory -> Orchestrator)[0]"
#         description: "Inventory Service → Order Saga Orchestrator: OK"
#       - edge: "(Orchestrator -> Order)[1]"
#         description: "Order Saga Orchestrator → Order Service: Update order → CONFIRMED"
# @endflow
shape: sequence_diagram
"Client": "Client"
"Orchestrator": "Order Saga\nOrchestrator"
"Order": "Order Service"
"Payment": "Payment Service"
"Inventory": "Inventory Service"
"Client" -> "Orchestrator": "Đặt hàng"
"Orchestrator" -> "Order": "Tạo order (PENDING)"
"Order" -> "Orchestrator": "OK" { style.stroke-dash: 5 }
"Orchestrator" -> "Payment": "Trừ tiền"
"Payment" -> "Orchestrator": "OK" { style.stroke-dash: 5 }
"Orchestrator" -> "Inventory": "Trừ tồn kho"
"Inventory" -> "Orchestrator": "OK" { style.stroke-dash: 5 }
"Orchestrator" -> "Order": "Update order → CONFIRMED"
```

```d2 title="6.3. Orchestration Saga"
direction: down
start: "STARTED"
create: "Order — CreateOrder"
created: "ORDER_CREATED"
charge: "Payment — ProcessPayment"
paid: "PAYMENT_COMPLETED"
reserve: "Inventory — ReserveInventory"
confirmed: "CONFIRMED → DONE"
refund: "Payment — RefundPayment C2"
cancel: "Order — CancelOrder C1"
cancelled: "CANCELLED → DONE compensated"
start -> create
create -> created: "Success"
created -> charge
charge -> paid: "Success"
charge -> cancel: "Failure"
paid -> reserve
reserve -> confirmed: "Success"
reserve -> refund: "Failure"
refund -> cancel
cancel -> cancelled
```

Orchestrator giữ Saga state machine. Ví dụ Inventory hết hàng sau khi Payment charge: hoàn tiền trước, rồi cancel order.

```
Orchestration — Ưu / Nhược:
────────────────────────────

  ✅ Dễ hiểu — toàn bộ flow ở 1 chỗ (orchestrator)
  ✅ Dễ debug — orchestrator log từng bước, biết saga đang ở state nào
  ✅ Phù hợp saga phức tạp (5+ services)
  ✅ Dễ thêm / bớt bước — chỉ sửa orchestrator
  ✅ Centralized error handling

  ❌ Single point of failure — orchestrator chết → saga stuck
     (giải pháp: persistent state + retry)
  ❌ Coupling vào orchestrator — orchestrator biết tất cả services
  ❌ Thêm 1 component phải maintain
```

### 6.4. So sánh Choreography vs Orchestration

| Tiêu chí | Choreography | Orchestration |
|----------|-------------|---------------|
| **Coordinator** | Không có — mỗi service tự quyết | Có orchestrator trung tâm |
| **Coupling** | Loose — chỉ biết events | Orchestrator biết tất cả services |
| **Visibility** | Khó — logic phân tán | Dễ — flow tập trung 1 chỗ |
| **Complexity** | Đơn giản cho 2-4 bước | Đơn giản cho 5+ bước |
| **Debug** | Khó — trace qua nhiều services | Dễ — xem state machine |
| **Single point of failure** | Không | Orchestrator (cần HA) |
| **Phù hợp** | Saga đơn giản, ít bước | Saga phức tạp, nhiều bước |

```
Chọn nhanh:
────────────

  2-4 services, flow đơn giản → Choreography
  5+ services, flow phức tạp  → Orchestration
  Cần visibility + audit log  → Orchestration
  Muốn maximum loose coupling → Choreography
```

### 6.5. Xử lý lỗi trong Saga — Compensating Transaction

**Compensating Transaction** (giao dịch bù) là transaction đảo ngược hiệu ứng của transaction trước đó. **Không phải rollback** — mà là **tạo transaction mới** để undo.

```d2 title="Local rollback không giống Saga compensation"
direction: down
rollback: "Rollback của local transaction" {
  begin: BEGIN
  insert: INSERT order chưa commit
  undo: ROLLBACK
  result: Không có committed order mới
  begin -> insert -> undo -> result
}
compensate: "Saga — transaction mới bù cho transaction đã commit" {
  create: "T1 · INSERT order CREATED\nCOMMITTED"
  cancel: "C1 · UPDATE order CANCELLED\nCOMMITTED"
  result: "Order vẫn tồn tại\nLưu audit trail tạo / hủy"
  create -> cancel -> result
}
```

```
Ví dụ — Compensating cho từng service:
──────────────────────────────────────

  ┌────────────────┬───────────────────────┬────────────────────────┐
  │ Service        │ Transaction (Ti)      │ Compensating (Ci)      │
  │────────────────│───────────────────────│────────────────────────│
  │ Order          │ Create order (PENDING)│ Cancel order           │
  │ Payment        │ Charge $100           │ Refund $100            │
  │ Inventory      │ Reserve 1 item        │ Release 1 item         │
  │ Shipping       │ Create shipment       │ Cancel shipment        │
  │ Loyalty        │ Add 100 points        │ Deduct 100 points      │
  │ Notification   │ Send confirmation email│ Send cancellation email│
  └────────────────┴───────────────────────┴────────────────────────┘

  ⚠️ Một số transaction KHÔNG THỂ compensate:
  ────────────────────────────────────────────
    • Email đã gửi → không thể "un-send"
      → Compensate = gửi email thông báo huỷ
    • SMS đã gửi → tương tự
    • 3rd party API đã gọi → tuỳ partner có support cancel không

  Thiết kế Saga phải tính trước compensating cho MỌI bước.
```

### 6.6. Saga Execution Coordinator (SEC)

Trong Orchestration Saga, orchestrator cần **persist state** để tránh mất trạng thái khi crash:

```
Saga Execution Coordinator — Persistent State:
──────────────────────────────────────────────

  Saga Log (trong DB):
  ┌────────┬────────────────┬───────────┬────────────┬───────────┐
  │ SagaID │ Step           │ Status    │ Timestamp  │ Data      │
  │────────│────────────────│───────────│────────────│───────────│
  │ S-001  │ CreateOrder    │ COMPLETED │ 10:00:01   │ {orderId} │
  │ S-001  │ ProcessPayment │ COMPLETED │ 10:00:02   │ {txnId}   │
  │ S-001  │ ReserveStock   │ FAILED    │ 10:00:03   │ {error}   │
  │ S-001  │ RefundPayment  │ COMPLETED │ 10:00:04   │ {refundId}│
  │ S-001  │ CancelOrder    │ COMPLETED │ 10:00:05   │ {}        │
  └────────┴────────────────┴───────────┴────────────┴───────────┘

  Khi orchestrator crash và restart:
  1. Đọc saga log từ DB
  2. Tìm saga đang IN_PROGRESS
  3. Xem bước cuối → quyết định tiếp tục hay compensate
  → Saga KHÔNG bị mất giữa chừng
```

---

## 7. CQRS — Command Query Responsibility Segregation

### 7.1. Vấn đề với CRUD truyền thống

```d2 title="7.1. Vấn đề với CRUD truyền thống"
direction: right
client: "Client"
service: "Service — một CRUD model\nCreate / Read / Update / Delete"
db: "Database products\nid • name • price • stock • desc • ..."
client -> service
service -> db
```

Write cần validation/business rules và ít fields; read có thể JOIN/aggregate nhiều bảng. Với read/write 90:10 trong ví dụ, một model/index khó tối ưu cho mọi query; scale read bằng replicas và write bằng partitioning/sharding có trade-off khác nhau.

### 7.2. CQRS là gì?

**CQRS** tách hệ thống thành 2 phần: **Command** (ghi) và **Query** (đọc) — mỗi phần có model, logic, và thậm chí database riêng.

```d2 title="7.2. CQRS là gì?"
direction: right
command: "Command Side\nCreate / Update / Delete\nBusiness rules • Validation" {
 model: Write Model
 db: Write DB — PostgreSQL {shape: cylinder}
 model -> db
}
query: "Query Side\nRead / Search / Filter / Report\nDenormalized • Read-optimized" {
 model: Read Model
 db: Read DB — Elasticsearch {shape: cylinder}
 model -> db
}
command.db -> query.db: Async event / CDC — eventual consistency
# Icons: https://icons.d2lang.com/
command.db.icon: "https://icons.d2lang.com/dev/postgresql.svg"
```

Đây là biến thể CQRS tách stores; CQRS cũng có thể chỉ tách logic/read-write models trên cùng một database.

### 7.3. Các mức độ áp dụng CQRS

```d2 title="7.3. Các mức độ áp dụng CQRS"
direction: right
command: "Command Handler"
write: "Write Logic"
query: "Query Handler"
read: "Read Logic"
db: "Cùng một DB"
command -> write
write -> db
query -> read
read -> db
```

CQRS mức1: tách code Command/Query, chưa tách datastore; đơn giản, ít overhead.

### 7.4. Ví dụ thực tế — E-Commerce Product Service

```d2 title="7.4. Ví dụ thực tế — E-Commerce Product Service"
direction: down
admin: Admin — POST /products
validate: Validate name required / price > 0
pg: PostgreSQL — Write normalized {
 products: "products\nid PK • name • price • description\nstock • created_at"
 joins: "product_categories\nproduct_id FK • category_id FK"
 categories: "categories\nid PK • name"
}
worker: Sync Worker — consume ProductCreated / CDC
transform: Transform / Denormalize
es: "Elasticsearch — Read Document\nid P-001 • name iPhone 15 Pro • price 999\nstock 50 • categories phone/apple/flagship\navgRating 4.7 • totalReviews 1234\nseller Apple Store / rating 4.9" {shape: cylinder}
user: "User — GET /products\nq=iphone&category=phone&sort=price"
admin -> validate -> pg
pg -> worker -> transform -> es
user -> es: Full-text / Faceted filtering — không JOIN lúc query
# Icons: https://icons.d2lang.com/
pg.icon: "https://icons.d2lang.com/dev/postgresql.svg"
```

Read document còn có `description`. Tất cả data phục vụ query được flatten/pre-join; publish sau write cần Outbox/CDC để xử lý dual-write gap, không mặc định atomic với DB commit.

### 7.5. Khi nào nên / không nên dùng CQRS

```
✅ NÊN dùng CQRS khi:
──────────────────────
  • Read/Write ratio chênh lệch lớn (90:10)
  • Query pattern phức tạp (search, filter, aggregate)
  • Cần scale read và write riêng
  • Read model cần denormalize (pre-join) cho performance
  • Kết hợp Event Sourcing

❌ KHÔNG NÊN dùng CQRS khi:
────────────────────────────
  • CRUD đơn giản, ít query pattern
  • Data cần strong consistency (real-time balance)
  • Team nhỏ, hệ thống đơn giản → over-engineering
  • Mới bắt đầu microservice → đừng thêm complexity
```

---

## 8. Event Sourcing

### 8.1. Ví dụ đời thực

Trước khi vào kỹ thuật, hãy xem 2 ví dụ đời thực mà ai cũng biết:

```
Ví dụ 1: SỔ TIẾT KIỆM NGÂN HÀNG
──────────────────────────────────

  Bạn ra ngân hàng hỏi: "Tài khoản tôi còn bao nhiêu tiền?"

  Cách 1 — Chỉ lưu SỐ DƯ (cách thông thường):
  ┌─────────────────────────────────┐
  │  Tài khoản: Hiep                │
  │  Số dư: 500.000đ                │
  └─────────────────────────────────┘
  → Biết còn 500k, nhưng KHÔNG biết 500k đến từ đâu
  → "Tại sao hôm qua còn 800k, hôm nay chỉ còn 500k?" → Không biết!

  Cách 2 — Lưu SỔ GIAO DỊCH (Event Sourcing):
  ┌────┬──────────────────────┬──────────┬───────────┐
  │ #  │ Giao dịch            │ Số tiền  │ Ngày      │
  │────│──────────────────────│──────────│───────────│
  │ 1  │ Mở tài khoản         │          │ 01/01     │
  │ 2  │ Nạp tiền             │ +1.000k  │ 01/01     │
  │ 3  │ Rút tiền ATM         │ -200k    │ 05/01     │
  │ 4  │ Chuyển cho Lan       │ -300k    │ 10/01     │
  └────┴──────────────────────┴──────────┴───────────┘
  Số dư = 0 + 1000 - 200 - 300 = 500k ✅

  → Biết chính xác 500k đến từ đâu
  → Biết hôm qua 800k vì chưa chuyển 300k cho Lan
  → Muốn biết số dư ngày 05/01? Tính: 0 + 1000 - 200 = 800k ✅
```

```
Ví dụ 2: GOOGLE DOCS
─────────────────────

  Khi bạn gõ trong Google Docs, nó KHÔNG lưu "nội dung hiện tại".
  Nó lưu MỌI THAO TÁC bạn làm:

  ┌────┬──────────────────────────────────┬───────────┐
  │ #  │ Thao tác                         │ Thời gian │
  │────│──────────────────────────────────│───────────│
  │ 1  │ Gõ "Xin"                         │ 10:00:01  │
  │ 2  │ Gõ " chào"                       │ 10:00:02  │
  │ 3  │ Gõ " các bạn"                    │ 10:00:03  │
  │ 4  │ Xoá " các bạn"                   │ 10:00:05  │
  │ 5  │ Gõ " mọi người"                  │ 10:00:06  │
  └────┴──────────────────────────────────┴───────────┘

  Nội dung hiện tại = replay tất cả thao tác = "Xin chào mọi người"
  
  Nhờ vậy mà Google Docs có thể:
  → Xem VERSION HISTORY — "ai sửa gì lúc nào?"
  → UNDO — quay lại bất kỳ thời điểm nào
  → COLLABORATION — nhiều người cùng sửa, merge thao tác
```

```
Tóm lại — Event Sourcing là gì?
────────────────────────────────

  Cách thông thường: Lưu TRẠNG THÁI HIỆN TẠI
    → UPDATE balance = 500   (ghi đè, mất lịch sử)

  Event Sourcing: Lưu MỌI SỰ KIỆN ĐÃ XẢY RA
    → Nạp 1000, Rút 200, Chuyển 300  (giữ lại tất cả)
    → Trạng thái hiện tại = tính lại từ sự kiện

  Giống sổ tiết kiệm ngân hàng:
    KHÔNG BAO GIỜ tẩy xoá dòng cũ
    Muốn sửa sai → GHI THÊM dòng mới (ví dụ: "Hoàn tiền 300k")
```

### 8.2. Vấn đề mà Event Sourcing giải quyết

Tại sao không đơn giản lưu state như bình thường? Vì **có những hệ thống mà lịch sử quan trọng hơn hiện tại**:

```
Cách thông thường — Lưu state (UPDATE/ghi đè):
──────────────────────────────────────────────

  Bước 1: INSERT order (status = PENDING,  total = 100)
  Bước 2: UPDATE order SET status = PAID
  Bước 3: UPDATE order SET status = SHIPPED
  Bước 4: UPDATE order SET status = DELIVERED

  Database hiện tại:
  ┌──────────┬───────────┬───────┐
  │ order_id │ status    │ total │
  │──────────│───────────│───────│
  │ O-123    │ DELIVERED │ 100   │  ← Chỉ có trạng thái cuối cùng
  └──────────┴───────────┴───────┘

  ❌ "Order này thanh toán lúc mấy giờ?" → Không biết
  ❌ "Ship lúc nào? Giao lúc nào?" → Không biết
  ❌ "Có ai sửa total từ 200 thành 100 không?" → Không biết
  ❌ "Khách claim chưa nhận hàng — chứng minh đã giao?" → Không chứng minh được
```

```
Event Sourcing — Lưu events (APPEND, không ghi đè):
───────────────────────────────────────────────────

  ┌─────┬──────────────────┬─────────────────────────┬───────────┐
  │ #   │ Sự kiện          │ Dữ liệu                │ Thời gian │
  │─────│──────────────────│─────────────────────────│───────────│
  │ 1   │ OrderCreated     │ {items: [...], total:100}│ 10:00:01 │
  │ 2   │ PaymentReceived  │ {method: "VISA", txn:T1}│ 10:00:05 │
  │ 3   │ OrderConfirmed   │ {}                      │ 10:00:06 │
  │ 4   │ ItemShipped      │ {tracking: "VN123"}     │ 10:02:00 │
  │ 5   │ OrderDelivered   │ {signature: "Hiep"}     │ 11:30:00 │
  └─────┴──────────────────┴─────────────────────────┴───────────┘

  Status hiện tại? → Đọc event cuối → DELIVERED ✅
  "Thanh toán lúc nào?" → Event #2 → 10:00:05 ✅
  "Ship lúc nào?" → Event #4 → 10:02:00, tracking VN123 ✅
  "Chứng minh đã giao?" → Event #5 → 11:30, có chữ ký ✅
  "Trạng thái lúc 10:01?" → Replay event 1-3 → CONFIRMED ✅

  ✅ Biết TẤT CẢ mọi thứ đã xảy ra
  ✅ Truy vết được bất kỳ thời điểm nào
  ✅ Không ai có thể "lén sửa" — events không xoá/sửa được
```

```
Ai cần Event Sourcing?
──────────────────────

  🏦 Ngân hàng / Tài chính
     "Tiền đi đâu? Ai chuyển? Lúc nào?" → BẮT BUỘC có audit trail

  🏥 Y tế
     "Bệnh nhân được kê thuốc gì, ai kê, lúc nào?" → Pháp lý yêu cầu

  🛒 E-Commerce (Order phức tạp)
     "Khách claim không nhận hàng" → cần chứng minh đã giao

  📊 Hệ thống cần "time travel"
     "Giá sản phẩm tuần trước là bao nhiêu?" → replay events

  ❌ Blog, landing page, CRUD đơn giản → KHÔNG CẦN Event Sourcing
```

### 8.3. Nguyên tắc hoạt động

```
3 nguyên tắc cốt lõi:
──────────────────────

  1. KHÔNG LƯU STATE — LƯU EVENTS
     ─────────────────────────────
     Thông thường: bảng orders có 1 dòng, UPDATE liên tục
     Event Sourcing: bảng events có NHIỀU dòng, chỉ INSERT thêm

  2. EVENTS KHÔNG THỂ SỬA / XOÁ (Immutable)
     ──────────────────────────────────────────
     Giống sổ kế toán — viết nhầm thì GHI THÊM bút toán điều chỉnh
     KHÔNG BAO GIỜ tẩy xoá dòng cũ

     Ví dụ: Charge nhầm $100
       ❌ Cách sai:  XOÁ event "PaymentReceived $100"
       ✅ Cách đúng: THÊM event "PaymentRefunded $100"

  3. STATE = TÍNH LẠI TỪ EVENTS
     ───────────────────────────
     Muốn biết trạng thái hiện tại?
     → Lấy tất cả events của entity đó
     → "Phát lại" (replay) từ đầu đến cuối
     → Kết quả = trạng thái hiện tại
```

### 8.4. Ví dụ chi tiết — Đơn hàng từ đầu đến cuối

Đi qua toàn bộ vòng đời 1 đơn hàng để thấy Event Sourcing hoạt động thế nào:

```
BƯỚC 1: Khách đặt hàng
───────────────────────
  → Hệ thống KHÔNG tạo row trong bảng orders
  → Hệ thống GHI 1 EVENT vào Event Store:

  Event Store (bảng events):
  ┌─────┬────────────────┬──────────────────────────────────┐
  │ #   │ event_type     │ data                             │
  │─────│────────────────│──────────────────────────────────│
  │ 1   │ OrderCreated   │ {orderId:"O-123", items:["iPhone"│
  │     │                │  ], total: 999, customer:"Hiep"} │
  └─────┴────────────────┴──────────────────────────────────┘

  Trạng thái hiện tại (tính từ events):
  → Replay event 1: order = {id:"O-123", status:"PENDING", total:999}


BƯỚC 2: Thanh toán thành công
─────────────────────────────
  → GHI THÊM 1 event (KHÔNG update row nào):

  ┌─────┬────────────────┬──────────────────────────────────┐
  │ 1   │ OrderCreated   │ {orderId:"O-123", ...}           │
  │ 2   │ PaymentReceived│ {method:"VISA", amount:999}      │ ← MỚI
  └─────┴────────────────┴──────────────────────────────────┘

  Trạng thái hiện tại (tính lại):
  → Replay event 1: status = PENDING
  → Replay event 2: status = PAID
  → Kết quả: {id:"O-123", status:"PAID", total:999}


BƯỚC 3: Giao hàng
──────────────────
  ┌─────┬────────────────┬──────────────────────────────────┐
  │ 1   │ OrderCreated   │ {orderId:"O-123", ...}           │
  │ 2   │ PaymentReceived│ {method:"VISA", amount:999}      │
  │ 3   │ ItemShipped    │ {tracking:"VN123", carrier:"GHN"}│ ← MỚI
  └─────┴────────────────┴──────────────────────────────────┘

  Trạng thái: replay 1→2→3 = {status:"SHIPPED", tracking:"VN123"}


BƯỚC 4: Khách đổi ý — huỷ đơn (sau khi đã ship!)
──────────────────────────────────────────────────
  ┌─────┬────────────────┬──────────────────────────────────┐
  │ 1   │ OrderCreated   │ {orderId:"O-123", ...}           │
  │ 2   │ PaymentReceived│ {method:"VISA", amount:999}      │
  │ 3   │ ItemShipped    │ {tracking:"VN123", carrier:"GHN"}│
  │ 4   │ OrderCancelled │ {reason:"Khách đổi ý"}          │ ← MỚI
  │ 5   │ PaymentRefunded│ {amount:999, refundId:"R-001"}   │ ← MỚI
  └─────┴────────────────┴──────────────────────────────────┘

  Trạng thái: replay 1→2→3→4→5 = {status:"CANCELLED", refunded:true}

  ⚠️ Lưu ý: KHÔNG XOÁ event 2 (PaymentReceived) và event 3 (ItemShipped)
     Mà THÊM event 4 (Cancel) và event 5 (Refund)
     → Lịch sử HOÀN CHỈNH: đã ship, rồi huỷ, rồi hoàn tiền
```

```
So sánh với cách thông thường:
──────────────────────────────

  Cách thông thường (chỉ lưu state):
  ┌──────────┬───────────┬───────┐
  │ order_id │ status    │ total │
  │──────────│───────────│───────│
  │ O-123    │ CANCELLED │ 999   │ ← Chỉ biết bị huỷ, KHÔNG biết đã từng ship
  └──────────┴───────────┴───────┘

  Event Sourcing (lưu events):
  → Biết: tạo lúc nào, pay lúc nào, ship lúc nào, huỷ lúc nào, hoàn tiền lúc nào
  → "Time travel": muốn biết trạng thái lúc 10:02? Replay event 1-3 → SHIPPED
```

### 8.5. Vấn đề hiệu năng — Snapshot

Nếu 1 entity có **hàng nghìn events** thì replay hết sẽ chậm. Giải pháp: **Snapshot** — lưu "ảnh chụp" state tại 1 thời điểm, chỉ replay events sau snapshot.

```d2 title="8.5. Vấn đề hiệu năng — Snapshot"
direction: right
all: "Không Snapshot\nReplay E1 … E10000 để tính số dư"
snapshot: "Snapshot gần nhất tại E9000\nBalance 5.000.000đ"
tail: "Replay E9001 … E10000\n1.000 events"
current: "State / Số dư hiện tại"
s1: "Snapshot minh họa E1000: 800k"
s2: "Snapshot minh họa E2000: 1.2M"
all -> current
snapshot -> tail
tail -> current
s1 -> s2: "Chụp định kỳ mỗi 1.000 events"
```

Giảm từ 10.000 xuống 1.000 events phải replay; không mặc định latency nhanh đúng 10 lần vì còn I/O, kích thước snapshot và chi phí apply events.

### 8.6. Event Sourcing kết hợp CQRS

Event Sourcing lưu events rất tốt cho **write**, nhưng **read thì chậm** (phải replay events mỗi lần query). Giải pháp: kết hợp với **CQRS** — tách read ra riêng.

```
Vấn đề: Query chậm khi dùng Event Sourcing
────────────────────────────────────────────

  "Cho tôi danh sách 100 đơn hàng mới nhất có status = SHIPPED"

  Với Event Sourcing thuần:
  → Phải load events của TẤT CẢ đơn hàng
  → Replay từng đơn để tính status
  → Filter những đơn SHIPPED
  → CỰC CHẬM khi có hàng triệu đơn ❌
```

```d2 title="8.6. Event Sourcing kết hợp CQRS"
direction: right
write: "Khách đặt hàng — Write"
store: "Event Store — append only\nOrderCreated O-123\nPaymentReceived O-123\nItemShipped O-123"
project: "Projection"
db: "Read DB — orders_view\nO-123 • SHIPPED • total 999 • Hiep"
read: "Khách xem đơn hàng — Query bảng tính sẵn"
write -> store
store -> project: "Mỗi event mới"
project -> db
read -> db
```

Events là source of truth/audit trail; read DB denormalized được cập nhật từ events để tối ưu truy vấn.

```
"Projection" là gì?
────────────────────

  Projection = chương trình lắng nghe events → cập nhật Read DB
  Nói đơn giản: nó "dịch" events thành bảng bình thường để query nhanh.

  Ví dụ đơn giản:
  ────────────────
  Khi nhận event OrderCreated:
    → INSERT INTO orders_view (order_id, status, total) VALUES ('O-123', 'PENDING', 999)

  Khi nhận event PaymentReceived:
    → UPDATE orders_view SET status = 'PAID' WHERE order_id = 'O-123'

  Khi nhận event ItemShipped:
    → UPDATE orders_view SET status = 'SHIPPED' WHERE order_id = 'O-123'

  → Projection "chuyển đổi" events thành bảng bình thường
  → Read DB luôn ở trạng thái mới nhất (hoặc gần mới nhất — eventual consistency)
```

#### Projection hoạt động thế nào?

Projection thực chất là 1 **consumer** (chương trình chạy nền) lắng nghe events từ Event Store. Mỗi khi có event mới, nó đọc event đó và cập nhật Read DB tương ứng.

```d2 title="Projection hoạt động thế nào?"
direction: right
store: "Event Store — events table"
projection: "Projection Consumer\nNhận event → xử lý → ghi read DB"
read: "Read DB\norders_view / products_view / dashboard"
poll: "Polling — ví dụ mỗi 100ms\nSELECT events WHERE sequence > 5 ORDER BY sequence"
stream: "Subscription / Streaming\nKafka • EventStoreDB • Debezium CDC"
store -> poll
store -> stream
poll -> projection
stream -> projection
projection -> read
```

Polling đơn giản nhưng thêm latency/query load. Streaming cần infrastructure và checkpoint/replay để reliable. PostgreSQL LISTEN/NOTIFY có thể đánh thức consumer, nhưng không thay thế durable event log hay tự phát thông báo mỗi INSERT nếu chưa cấu hình.

```d2 title="Projection hoạt động thế nào?"
direction: down
store: "Cùng một Event Store\n1 OrderCreated O-123 Hiep iPhone total999\n2 PaymentReceived O-123 VISA\n3 ItemShipped O-123 tracking VN123\n4 OrderCreated O-456 Lan AirPods total199\n5 PaymentReceived O-456 MoMo"
p1: "Projection 1 — Orders View"
p2: "Projection 2 — Dashboard"
p3: "Projection 3 — Search"
orders: "orders_view PostgreSQL / MySQL\nO-123 Hiep SHIPPED 999 VN123\nO-456 Lan PAID 199 null"
stats: "daily_stats PostgreSQL\n2025-02-24 • orders 2\nrevenue 1198 • top_product iPhone"
search: "Elasticsearch index\nO-123 • Hiep • iPhone • SHIPPED • VN123"
store -> p1
store -> p2
store -> p3
p1 -> orders
p2 -> stats
p3 -> search
```

Admin query `orders_view WHERE status=SHIPPED`; dashboard query `daily_stats` theo ngày; user search `q=iPhone&status=SHIPPED`. Mỗi projection tối ưu một use case. Có thể thêm read model không đổi write side và rebuild từ event history còn đầy đủ.

Chỉ rebuild được khi event stream còn đầy đủ, đọc được và projection code tái tạo state đúng. Event Store vẫn cần durability, backup và retention; không có bảo đảm “không bao giờ mất data” vô điều kiện.

```d2 title="Rebuild projection từ event stream còn được giữ đầy đủ"
direction: right
events: "Event Store\nNguồn sự thật còn đầy đủ" {shape: cylinder}
projector: Projection replay từ sequence đầu tiên
new: Read model mới {shape: cylinder}
verify: Đối chiếu kết quả / bắt kịp events mới
switch: Chuyển reader sang model đã verify
events -> projector -> new -> verify -> switch
```

Ví dụ index Elasticsearch hỏng: dựng index thay thế từ events, kiểm tra và catch up trước khi chuyển đọc. Không xóa read model production đang phục vụ chỉ để thử replay; thời gian rebuild phụ thuộc dung lượng, throughput và backlog. Read model có thể dựng lại, còn Event Store thì không phải dữ liệu disposable.

```
Công nghệ thường dùng cho Projection:
──────────────────────────────────────

  ┌───────────────────┬────────────────────────────────────────┐
  │ Thành phần        │ Công nghệ phổ biến                     │
  │───────────────────│────────────────────────────────────────│
  │ Event Store       │ PostgreSQL (bảng events), EventStoreDB,│
  │                   │ Kafka (topic = event stream)           │
  │                   │                                        │
  │ Projection chạy   │ • Kafka Consumer (Java/Spring, Node.js)│
  │ bằng gì?          │ • EventStoreDB built-in Projection     │
  │                   │ • Custom worker (cron polling DB)      │
  │                   │ • Debezium CDC → Kafka → Consumer      │
  │                   │                                        │
  │ Read DB           │ • PostgreSQL / MySQL (query thường)    │
  │ (output)          │ • Elasticsearch (full-text search)     │
  │                   │ • Redis (cache, real-time dashboard)   │
  │                   │ • MongoDB (flexible view)              │
  └───────────────────┴────────────────────────────────────────┘

  Ví dụ stack phổ biến:
  ─────────────────────
  Stack 1 (đơn giản):
    PostgreSQL (events table) → Polling Worker → PostgreSQL (read views)

  Stack 2 (phổ biến nhất):
    PostgreSQL (events) → Debezium CDC → Kafka → Consumer → Elasticsearch

  Stack 3 (chuyên dụng):
    EventStoreDB → Built-in Subscription → Consumer → MongoDB + Redis
```

### 8.7. Các Event Store phổ biến

| Event Store | Mô tả | Phù hợp |
|------------|-------|---------|
| **EventStoreDB** | Purpose-built cho event sourcing, có subscription + projection | Dự án cần event sourcing "chính quy" |
| **PostgreSQL** | Dùng bảng events thông thường, đơn giản nhất | Team quen PostgreSQL, bắt đầu nhỏ |
| **Apache Kafka** | Distributed log, dùng topic = event stream | Đã có Kafka, cần scale lớn |
| **Axon Server** | Framework + event store cho Java/Kotlin | Java ecosystem |

### 8.8. Khi nào nên / không nên dùng Event Sourcing

```
✅ NÊN dùng khi:
─────────────────
  • Cần LỊCH SỬ ĐẦY ĐỦ — "ai làm gì, lúc nào?" (finance, y tế, pháp lý)
  • Cần XEM LẠI trạng thái ở quá khứ — "giá sản phẩm tuần trước?"
  • Cần CHỨNG MINH — "đơn hàng đã giao, có chữ ký"
  • Domain phức tạp, nhiều bước — order, payment, shipping, refund
  • Đã dùng event-driven architecture

❌ KHÔNG NÊN dùng khi:
──────────────────────
  • CRUD đơn giản — blog, user profile, landing page
  • Không cần lịch sử — chỉ cần biết "bây giờ là gì"
  • Team chưa quen — learning curve cao, dễ làm sai
  • Data ít thay đổi — overhead không đáng

⚠️ Hầu hết ứng dụng KHÔNG CẦN Event Sourcing.
   Chỉ dùng khi lịch sử thật sự quan trọng với business.
   Nếu chỉ cần audit log đơn giản → dùng bảng audit_log là đủ,
   không cần Event Sourcing.
```

---

## 9. Cross-Service Data — Lấy data từ service khác

### 9.1. Vấn đề: Service cần data không thuộc về mình

Trong microservice, mỗi service có DB riêng (xem [phần 2](#2-database-per-service)). Nhưng thực tế, khi hiển thị cho user thì thường cần **ghép data từ nhiều service**:

```
Ví dụ: Trang "Chi tiết đơn hàng"
─────────────────────────────────

  User mở trang chi tiết đơn hàng, cần hiển thị:
  ┌──────────────────────────────────────────────┐
  │  Đơn hàng: O-123                             │
  │  Khách hàng: Hiep              ← User Service│
  │  Sản phẩm: iPhone 15        ← Product Service│
  │  Tổng tiền: 999đ              ← Order Service│
  │  Trạng thái giao: Đang ship ← Shipping Service│
  └──────────────────────────────────────────────┘

  Order Service chỉ có trong DB của mình:
  ┌──────────┬──────────┬───────┐
  │ order_id │ user_id  │ total │
  │──────────│──────────│───────│
  │ O-123    │ U-456    │ 999   │  ← Chỉ có user_id, KHÔNG có tên khách
  └──────────┴──────────┴───────┘

  → Tên khách "Hiep" nằm ở DB của User Service
  → Tên sản phẩm "iPhone 15" nằm ở DB của Product Service
  → KHÔNG THỂ JOIN — vì khác database!

  Vậy lấy data bằng cách nào?
```

```
3 cách lấy data từ service khác:
────────────────────────────────

  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Cách 1: GỌI API lúc cần (API Composition)                   │
  │  ──────────────────────────────────────────                  │
  │  Order Service gọi: GET /users/U-456 → lấy tên "Hiep"        │
  │  → Đơn giản, data mới nhất, nhưng chậm (network call)        │
  │                                                              │
  │  Cách 2: COPY data về local (Event-Carried State Transfer)   │
  │  ──────────────────────────────────────────────────────────  │
  │  User Service publish event: {userId: U-456, name: "Hiep"}   │
  │  Order Service nhận event → lưu vào bảng local_users         │
  │  → Nhanh (query local), nhưng data có thể cũ vài giây        │
  │                                                              │
  │  Cách 3: BẮT thay đổi từ DB nguồn (CDC)                      │
  │  ──────────────────────────────────────                      │
  │  Debezium đọc DB của User Service → đẩy thay đổi sang Kafka  │
  │  Order Service consume → cập nhật bảng local_users           │
  │  → Tương tự cách 2, nhưng không cần User Service sửa code    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 9.2. Change Data Capture (CDC)

**CDC** = Bắt **mọi thay đổi** (INSERT, UPDATE, DELETE) từ database nguồn và stream đến consumer — thường qua **database log** (WAL/binlog).

```d2 title="9.2. Change Data Capture (CDC)"
direction: right
product: "Product Service — INSERT / UPDATE / DELETE"
db: "PostgreSQL — products\nGhi WAL"
debezium: "Debezium Connector\nĐọc WAL / change log"
kafka: "Kafka topic product.changes"
order: "Order Service\nUpdate local copy"
product -> db
db -> debezium
debezium -> kafka
kafka -> order
# Icons: https://icons.d2lang.com/
db.icon: "https://icons.d2lang.com/dev/postgresql.svg"
```

Producer không cần biết consumer hay sửa business code để CDC. Đổi lại cần vận hành Kafka/Debezium và cẩn thận schema coupling/lộ DB internals. Near-real-time và delivery phụ thuộc WAL retention, offsets, connector recovery và consumer idempotency; không phải bảo đảm tuyệt đối không mất event.

### 9.3. Event-Carried State Transfer

Service publish **domain event** chứa đủ data — consumer lưu vào **local store** để query mà không cần gọi lại service gốc.

```d2 title="9.3. Event-Carried State Transfer"
direction: right
product: "Product Service\nProductUpdated {productId:P-001, name:iPhone 15 Pro, price:999, category:phone}"
order: "Order Service — consume"
cache: "order_product_cache\nP-001 | iPhone 15 Pro | 999"
query: "Order query local Product info"
product -> order: "Integration event chứa đủ state"
order -> cache
query -> cache: "Không gọi Product lúc request"
```

Không có synchronous runtime dependency cho dữ liệu đã cache; local query nhanh. Trade-off: stale data, storage duplication và cần contract chứa đủ fields cho consumers.

### 9.4. API Composition

Service gọi **API** của service khác tại **runtime** để lấy data cần thiết.

```d2 title="9.4. API Composition"
direction: down
client: "Client — GET /order-details/O-123"
composer: "Order Service — API Composer"
local: "Local DB — Order O-123"
user: "User Service — GET /users/U-456"
product: "Product Service — GET /products/P-001"
join: "Combine responses\norderId O-123 • customer Hiep\nproduct iPhone 15 • total 999"
client -> composer
composer -> local
composer -> user: "PAR"
composer -> product: "PAR"
local -> join
user -> join
product -> join
join -> client
```

Đơn giản, không cần event infrastructure hoặc duplicate stores; query lấy data tại request time nhưng không bảo đảm consistent snapshot xuyên services. Trade-off: runtime dependencies, network latency, khó scale high-traffic reads.

### 9.5. So sánh các cách tiếp cận

| Tiêu chí | API Composition | Event-Carried State Transfer | CDC |
|----------|----------------|------------------------------|-----|
| **Consistency** | Strong (real-time) | Eventual | Eventual |
| **Latency** | Cao (network call) | Thấp (local query) | Thấp (local query) |
| **Coupling** | Runtime dependency | Event contract | Schema coupling |
| **Availability** | Phụ thuộc upstream | Independent | Independent |
| **Complexity** | Thấp | Trung bình | Cao (Debezium, Kafka) |
| **Storage** | Không duplicate | Duplicate | Duplicate |
| **Phù hợp** | Low traffic, cần data mới | High traffic, chấp nhận stale | Cross-system sync, legacy |

---

## 10. Transactional Outbox Pattern

### 10.1. Vấn đề: Dual Write

```d2 title="Dual Write — đổi thứ tự không đóng được cửa sổ lỗi"
direction: down
dbfirst: "DB trước" {
  commit: INSERT order COMMITTED
  publish: Publish OrderCreated thất bại
  result: "Order tồn tại nhưng consumer không biết\nInventory không trừ kho; Payment không charge"
  commit -> publish: Broker down
  publish -> result
}
brokerfirst: "Broker trước" {
  publish: Publish OrderCreated thành công
  insert: INSERT order thất bại
  result: "Event đã tới consumer\nInventory có thể xử lý order không tồn tại"
  publish -> insert: DB error
  insert -> result
}
crash: "Crash giữa hai bước" {
  commit: INSERT order COMMITTED
  killed: Process crash
  result: Không có process publish event
  commit -> killed -> result
}
```

Ba container là các **kịch bản thay thế**, không nối tiếp nhau. Hai lời gọi ghi độc lập không atomic; đảo thứ tự không sửa được vấn đề. Outbox lưu business data và event intent cùng local transaction, rồi publish bất đồng bộ; không cần 2PC giữa DB và broker.

Có cần Outbox khi cả DB và Kafka đều HA? **Có**, nếu yêu cầu business write và event intent phải atomic. HA (High Availability) giảm gián đoạn hạ tầng, không ghép hai lời gọi của application thành một transaction.

```d2 title="HA không thay thế tính atomic của Dual Write"
direction: down
network: "Network lỗi dù DB và Kafka còn sống" {
  db: DB commit thành công
  send: "App publish timeout\nChưa biết broker đã nhận hay chưa"
  result: "Có thể thiếu event hoặc phát lại\nHA không đóng cửa sổ lỗi"
  db -> send -> result
}
process: "App lỗi dù hạ tầng còn sống" {
  db: DB commit thành công
  kill: Pod bị kill / OOM / deploy
  result: Chưa gửi event
  db -> kill -> result
}
order: "Publish trước cũng không an toàn" {
  send: Kafka nhận event
  db: DB từ chối INSERT do unique constraint
  result: Consumer nhận event cho order không tồn tại
  send -> db -> result
}
```

HA và Outbox bổ sung cho nhau. Outbox chỉ làm **business data + outbox record** atomic trong DB; publish và đánh dấu sent vẫn có cửa sổ redelivery. Timeout cũng không chứng minh chắc chắn broker chưa nhận event.

```
Khi nào CẦN Outbox Pattern?
────────────────────────────

  ✅ CẦN — Khi service vừa ghi DB vừa publish event:
     • Order Service: tạo order + publish OrderCreated
     • Payment Service: update payment + publish PaymentCompleted
     • Bất kỳ service nào cần: "ghi data XÀ publish event" atomic

  ❌ KHÔNG CẦN — Khi chỉ làm 1 trong 2:
     • Chỉ ghi DB, không publish event → không có dual write
     • Chỉ publish event, không ghi DB → không có dual write
     • Event Sourcing thuần → Event Store VỪA LÀ DB vừa là event log
       → chỉ có 1 write, không phải dual write
```

### 10.2. Outbox Pattern giải quyết thế nào?

**Outbox Pattern** = Ghi event vào **bảng outbox trong cùng database** với business data — trong **cùng 1 local transaction**. Sau đó, một process riêng đọc outbox và publish event ra message broker.

```d2 title="10.2. Outbox Pattern giải quyết thế nào?"
direction: right
order: "Order Service"
tx: "Một DB transaction\nBEGIN → INSERT orders + outbox → COMMIT"
outbox: "Outbox\nevt-1 OrderCreated O-123 published=false\nevt-2 OrderConfirmed O-124 published=true"
worker: "Publisher — polling 100ms hoặc CDC\nSELECT unpublished"
kafka: "Publish to Kafka"
mark: "UPDATE published=true theo event id"
order -> tx
tx -> outbox: "Atomic — cùng commit/rollback"
outbox -> worker
worker -> kafka
kafka -> mark: "Publish success"
mark -> worker: "Lặp lại"
```

Business row và outbox row atomic; publish + mark không atomic xuyên DB/broker nên có thể redeliver, consumer phải idempotent.

### 10.3. Outbox + CDC — Giải pháp hoàn chỉnh

Thay vì polling outbox table, dùng **CDC** (Debezium) để capture INSERT vào outbox table → publish event ngay lập tức:

```d2 title="10.3. Outbox + CDC — Giải pháp hoàn chỉnh"
direction: right
order: Order Service {
 tx: Một local transaction {
  orders: orders table {shape: cylinder}
  outbox: outbox table {shape: cylinder}
 }
}
debezium: Debezium — capture outbox INSERT từ WAL
kafka: Kafka topic order.events
inventory: Inventory — consume / trừ tồn kho
cleanup: Optional cleanup outbox sau publish / retention policy
order.tx.outbox -> debezium -> kafka -> inventory
order.tx.outbox -> cleanup
```

Tránh polling loop/DB scans, có thể giảm latency. Độ tin cậy dựa trên WAL retention, connector offsets/recovery và delivery semantics; không gọi đây là exactly-once hay guaranteed delivery vô điều kiện. Cleanup chỉ sau khi đủ điều kiện recovery/retention.

---

**Đọc cửa sổ lỗi của Outbox:** local transaction không làm broker và database trở thành một transaction chung.

Đây là lịch **minh họa** cho một event; các số 0–5 là bước logic, không phải thời gian đo được. Khoảng cách trên sơ đồ không biểu thị thời lượng và không chứng minh exactly-once.

```d2 title="Outbox vẫn có thể phát lại sau crash" mode=flow interactive=true
# @flow
# scenarios:
#   - id: main
#     label: "Kịch bản minh họa"
#     steps:
#       - edge: "(db -> db)[0]"
#         description: "Order DB → Order DB: 0 · Commit order + outbox"
#       - edge: "(relay -> broker)[0]"
#         description: "Outbox Relay → Message Broker: 1 · Publish e1 Broker chấp nhận"
#       - edge: "(broker -> consumer)[0]"
#         description: "Message Broker → Inventory Consumer: 2 · Delivery lần đầu"
#       - edge: "(consumer -> consumer)[0]"
#         description: "Inventory Consumer → Inventory Consumer: Áp dụng e1 + dedupe Cùng local transaction"
#       - edge: "(relay -> relay)[0]"
#         description: "Outbox Relay → Outbox Relay: 3 · Crash trước khi đánh dấu sent"
#       - edge: "(relay -> broker)[1]"
#         description: "Outbox Relay → Message Broker: 4 · Restart Publish lại e1"
#       - edge: "(broker -> consumer)[1]"
#         description: "Message Broker → Inventory Consumer: 5 · Delivery lặp"
#       - edge: "(consumer -> consumer)[1]"
#         description: "Inventory Consumer → Inventory Consumer: Dedupe e1 Không trừ kho lần hai"
# @endflow
shape: sequence_diagram
db: Order DB
relay: Outbox Relay
broker: Message Broker
consumer: Inventory Consumer
db -> db: "0 · Commit order + outbox"
relay -> broker: "1 · Publish e1\nBroker chấp nhận"
broker -> consumer: "2 · Delivery lần đầu"
consumer -> consumer: "Áp dụng e1 + dedupe\nCùng local transaction"
relay -> relay: "3 · Crash trước\nkhi đánh dấu sent"
relay -> broker: "4 · Restart\nPublish lại e1"
broker -> consumer: "5 · Delivery lặp"
consumer -> consumer: "Dedupe e1\nKhông trừ kho lần hai"
```

Các snapshot minh họa cùng cửa sổ lỗi phía trên cho event `e1`: tồn kho ban đầu là 10, event yêu cầu trừ 1. Root là lúc order và outbox **đã commit cùng local transaction**. Giả định Inventory commit thay đổi tồn kho và dedupe record trong cùng local transaction; relay dùng lại `e1` sau restart. Broker có thể chấp nhận hai lần publish, nhưng consumer nhận diện duplicate nên tồn kho vẫn là 9. Đây không phải bảo đảm exactly-once cho mọi side effect.

Trên website, bấm **Explore** rồi **Play** hoặc Previous/Next; không tự phát khi mở trang. Mỗi khung giữ 1.800 ms chỉ để đọc, không phải thời gian xử lý thực. Khoảng cách trong sơ đồ không tỷ lệ với thời lượng. Viewer chỉ hiển thị snapshot do tác giả biên soạn, không chạy request, timer hay business side effect. Không có JavaScript, mở **All views** để đọc mọi khung; có thể tải **Animated SVG** trong viewer. File tải xuống dùng animation native của D2, không mang theo controls hoặc thiết lập giảm chuyển động của website.

```d2 mode=animation interval=1800 title="Outbox — state còn lại sau publish, crash và redelivery"
grid-columns: 3
outbox: "Order DB / Outbox\nOrder đã commit\ne1 chưa đánh dấu sent"
relay: "Relay\nChuẩn bị publish e1"
broker: "Broker\nChưa nhận e1"
consumer: "Inventory Consumer\nChưa xử lý e1"
stock: "Tồn kho\n10"
dedupe: "Dedupe record\nChưa có e1"
steps: {
  "1 · Broker chấp nhận e1": {
    relay: "Relay\nPublish được broker chấp nhận\nChưa mark sent"
    broker: "Broker\nĐã chấp nhận e1 lần đầu"
  }
  "2 · Inventory commit effect và dedupe": {
    consumer: "Inventory Consumer\nÁp dụng e1 trong local transaction"
    stock: "Tồn kho\n9"
    dedupe: "Dedupe record\nĐã commit e1 cùng thay đổi tồn kho"
  }
  "3 · Relay crash trước mark sent": {
    relay: "Relay\nCRASH trước mark sent"
  }
  "4 · Restart, publish và delivery lặp": {
    relay: "Relay\nRestart, publish lại cùng e1"
    broker: "Broker\nChấp nhận lại e1, delivery lặp"
    consumer: "Inventory Consumer\nNhận diện e1 đã xử lý\nKhông trừ kho lần hai"
  }
  "5 · Relay đánh dấu sent": {
    relay: "Relay\nMark sent sau publish được chấp nhận"
    outbox: "Order DB / Outbox\nOrder vẫn đã commit\ne1 đã đánh dấu sent"
  }
}
```

Giả định consumer commit business change và dedupe record trong cùng local transaction. Relay phải dùng lại event ID khi publish lại; nếu không, consumer không thể nhận diện hai delivery này là cùng một event.

## 11. Tổng kết

```
Cheat Sheet — Data Management trong Microservice:
──────────────────────────────────────────────────

  ┌─────────────────────────┬──────────────────────────────────────┐
  │ Vấn đề                  │ Giải pháp                            │
  │─────────────────────────│──────────────────────────────────────│
  │ Service nào own data?   │ Database per Service                 │
  │ Chọn DB nào?            │ Polyglot Persistence                 │
  │ Distributed transaction?│ Saga (Choreography / Orchestration)  │
  │ Cross-service query?    │ API Composition / CQRS               │
  │ Read-heavy optimization?│ CQRS (tách Read/Write model)         │
  │ Full audit trail?       │ Event Sourcing                       │
  │ Data sync giữa service? │ CDC / Event-Carried State Transfer   │
  │ Atomic write + publish? │ Transactional Outbox Pattern         │
  │ Consistency model?      │ Eventual Consistency (BASE)          │
  └─────────────────────────┴──────────────────────────────────────┘
```

```
Bắt đầu từ đâu?
────────────────

  1. Database per Service (bắt buộc)
  2. Saga cho distributed transaction (Choreography trước, Orchestration khi phức tạp)
  3. Outbox Pattern cho reliable event publishing
  4. API Composition cho cross-service query (đơn giản)
  5. CQRS khi read pattern phức tạp
  6. Event Sourcing khi cần audit trail hoặc domain phức tạp

  Đừng áp dụng TẤT CẢ cùng lúc — thêm complexity chỉ khi CẦN.
```

---

## 12. Liên kết liên quan

- [doc 04 — Autonomy & Independence](04-autonomy-independence.md) — Service autonomy, data ownership
- [doc 06 — Inter-Service Communication](06-inter-service-communication.md) — Sync vs Async, Event-Driven
- [doc 07 — API Gateway](07-api-gateway.md) — API Composition tại Gateway
- [doc 10 — Resilience Patterns](10-resilience-patterns.md) — Circuit Breaker, Retry khi cross-service call
- [doc 17 — Design Patterns](17-design-patterns.md) — Saga, CQRS, Event Sourcing trong context tổng hợp
