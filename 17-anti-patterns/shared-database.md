# Shared Database Anti-pattern trong Microservice

## Mục lục

- [Tổng quan](#tổng-quan)
- [Nhận diện Shared Database](#nhận-diện-shared-database)
  - [Dấu hiệu](#dấu-hiệu)
  - [Shared schema và shared table](#shared-schema-và-shared-table)
  - [Các loại coupling](#các-loại-coupling)
- [Nguyên nhân gốc](#nguyên-nhân-gốc)
- [Hậu quả](#hậu-quả)
- [Ví dụ: Shipping và Order](#ví-dụ-shipping-và-order)
  - [Topology tạo ra coupling](#topology-tạo-ra-coupling)
  - [Điểm coupling trong ví dụ](#điểm-coupling-trong-ví-dụ)
  - [Biên giới dữ liệu phù hợp hơn](#biên-giới-dữ-liệu-phù-hợp-hơn)
- [Data ownership và lộ trình migration](#data-ownership-và-lộ-trình-migration)
  - [Quy tắc ownership](#quy-tắc-ownership)
  - [Các mức độ tách dữ liệu](#các-mức-độ-tách-dữ-liệu)
  - [Migration từng phase](#migration-từng-phase)
- [Remediation theo từng bước](#remediation-theo-từng-bước)
  - [Inventory và chỉ định owner](#inventory-và-chỉ-định-owner)
  - [Chặn ghi chéo rồi chặn đọc chéo](#chặn-ghi-chéo-rồi-chặn-đọc-chéo)
  - [Thay thế query xuyên domain](#thay-thế-query-xuyên-domain)
  - [Thay distributed transaction bằng Saga](#thay-distributed-transaction-bằng-saga)
  - [Đồng bộ trong giai đoạn chuyển tiếp](#đồng-bộ-trong-giai-đoạn-chuyển-tiếp)
- [Trade-off](#trade-off)
- [Khi nào cần tránh và khi nào có thể chấp nhận](#khi-nào-cần-tránh-và-khi-nào-có-thể-chấp-nhận)
  - [Khi cần tránh](#khi-cần-tránh)
  - [Trường hợp có thể chấp nhận](#trường-hợp-có-thể-chấp-nhận)
- [Vận hành](#vận-hành)
  - [Phân quyền và isolation](#phân-quyền-và-isolation)
  - [Migration backup và restore](#migration-backup-và-restore)
  - [Observability và xử lý sự cố](#observability-và-xử-lý-sự-cố)
  - [Tiêu chí kết thúc migration](#tiêu-chí-kết-thúc-migration)
- [Checklist](#checklist)
- [Liên kết liên quan](#liên-kết-liên-quan)

---

## Tổng quan

**Shared Database** xảy ra khi nhiều service cùng coi một database, schema hoặc table là implementation chung. Các service có thể cùng đọc/ghi trực tiếp dữ liệu của nhau, hoặc cùng phụ thuộc vào các cột và quan hệ nội bộ của một service khác.

Vấn đề cốt lõi không phải là nhiều service chạy trên cùng một database server. Vấn đề là **data ownership** (quyền sở hữu dữ liệu) bị phá vỡ. Khi service A có thể tự ý sửa table do service B quản lý, schema trở thành contract công khai nhưng không có versioning, owner hoặc compatibility policy rõ ràng.

Một database server dùng chung vẫn có thể là lựa chọn chuyển tiếp nếu mỗi service có schema, quyền truy cập và owner rõ ràng. Ngược lại, chỉ cần một service đọc hoặc ghi trực tiếp table của service khác là đã xuất hiện coupling nguy hiểm, dù hạ tầng đã được chia thành nhiều database server.

Tài liệu này tập trung vào cách nhận diện Shared Database, các dạng coupling, ví dụ Shipping–Order, data ownership, remediation, migration và vận hành. Phần này không lặp lại decision aid cấp nhóm trong [Bản tổng hợp Anti-patterns](../17-anti-patterns.md).

## Nhận diện Shared Database

### Dấu hiệu

Hãy xem các dấu hiệu dưới đây cùng với quyền truy cập và lịch sử thay đổi. Một dấu hiệu đơn lẻ chưa đủ cho mọi kết luận, nhưng nhiều dấu hiệu xuất hiện đồng thời cho thấy data boundary đang không rõ.

| Dấu hiệu quan sát được                                           | Coupling có thể đang tồn tại                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| Nhiều service có credential ghi cùng một table                   | Quyền sở hữu write và business invariant không rõ                  |
| Migration một table cần hỏi hoặc chờ nhiều team                  | Deployment coupling qua schema                                     |
| Code service có truy vấn `JOIN` xuyên domain                     | Implementation coupling vào schema nội bộ của service khác         |
| Không xác định được ai chịu trách nhiệm cho một column           | Không có data owner duy nhất                                       |
| Service dùng foreign key trực tiếp tới table của service khác    | Ranh giới dữ liệu bị kéo vào cùng một persistence model            |
| Một query, lock hoặc sự cố database ảnh hưởng nhiều capability   | Các service chung resource và failure domain                       |
| Đổi schema nhưng API của service không đổi vẫn làm consumer hỏng | Table/schema đang đóng vai trò public contract không được quản trị |

Ví dụ, `Shipping Service` không nên tự cập nhật `orders.shipping_status` chỉ vì nó cần ghi nhận trạng thái giao hàng. Quyền truy cập trực tiếp khiến thay đổi ở Order Service có thể phá Shipping Service mà không có breaking change nào trên API.

### Shared schema và shared table

Cần phân biệt ba tình huống sau:

| Tình huống                                                                | Mức ranh giới                               | Nhận định                                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| Nhiều service cùng đọc/ghi một table trong cùng schema                    | Ranh giới gần như không được enforce        | Đây là Shared Database rõ ràng; schema và ownership bị chia sẻ                      |
| Nhiều service dùng cùng database server nhưng mỗi service có schema riêng | Có thể giới hạn bằng database permission    | Không tự động là anti-pattern; vẫn chung CPU, RAM, I/O và failure domain của server |
| Mỗi service có database instance/server riêng                             | Cách ly resource và quyền truy cập chặt hơn | Chi phí cấp credential, backup, monitoring và vận hành cao hơn                      |

Mô hình `Private tables` với convention đặt tên như `order_orders` và `product_products` có thể phù hợp với team nhỏ hoặc giai đoạn đầu. Tuy nhiên, cùng schema thường không có cơ chế database enforce ownership. Một developer vẫn có thể vô tình tạo `JOIN` sang bảng của service khác.

Mục tiêu của **Database per Service** không nhất thiết là mỗi service phải có một máy chủ vật lý riêng. Mục tiêu trước hết là mỗi nhóm dữ liệu có một service sở hữu, chỉ owner được ghi và truy cập chéo đi qua API hoặc events. Cấp độ server có thể tăng dần theo nhu cầu isolation.

```text
❌ Shared schema/table: implementation bị dùng chung

  Order Service ───────┐
                       ├──> public.orders
  Shipping Service ────┘       └── shipping_status

  Shipping Service có thể UPDATE cột nội bộ của Order Service.

✅ Data ownership: cùng server vẫn có boundary

  Order Service ───> order_schema.orders ───> Order DB server
  Shipping Service ─> shipping_schema.shipments ─> Order DB server

  Mỗi service chỉ có quyền trên schema của mình.
  Nhu cầu liên service đi qua API, event hoặc read model.
```

Dùng chung server và dùng chung implementation là hai chuyện khác nhau. Điều cần kiểm tra là schema/permission có ngăn được truy cập sai hay chỉ dựa vào convention của team.

### Các loại coupling

**Coupling** là mức độ một thành phần phụ thuộc vào thành phần khác. Shared Database thường tạo ra nhiều loại coupling cùng lúc:

| Loại coupling                                  | Biểu hiện                                                                  | Điều bị mất                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------- |
| **Schema coupling**                            | Service biết tên table, column, index hoặc quan hệ của service khác        | Quyền tự thay đổi persistence model          |
| **Data coupling**                              | Service đọc/ghi dữ liệu không thuộc mình                                   | Data ownership và trách nhiệm với invariant  |
| **Deployment coupling**                        | Migration phải tương thích với nhiều codebase trong cùng release window    | Independent deployment                       |
| **Resource coupling**                          | Query nặng, lock hoặc connection pool của service này chiếm resource chung | Independent scaling và giới hạn blast radius |
| **Failure coupling / Single Point of Failure** | Database server hoặc storage lỗi làm nhiều service mất khả năng phục vụ    | Fault isolation                              |
| **Ownership coupling**                         | Nhiều team cùng quyết định một table hoặc một column                       | Team autonomy và quyết định thay đổi rõ ràng |

Một service có thể vẫn gọi API của service khác mà không trở thành Shared Database. Coupling nguy hiểm ở đây là service bỏ qua biên giới đó và phụ thuộc trực tiếp vào implementation data store.

## Nguyên nhân gốc

| Nguyên nhân                                        | Cách nó tạo ra Shared Database                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Tách service từ Monolith nhưng chưa tách dữ liệu   | Process và repository được chia ra, nhưng các service vẫn dùng chung table và transaction boundary |
| Cần báo cáo hoặc query liên domain ngay            | Team chọn `JOIN` trực tiếp vì nhanh hơn thiết kế API, event hoặc read model                        |
| Muốn dùng transaction ACID xuyên capability        | Shared database được giữ lại để có cảm giác như một transaction chung                              |
| Chi phí hạ tầng hoặc năng lực vận hành còn hạn chế | Nhóm dùng chung server nhưng không tạo schema/role riêng, rồi dần cho phép truy cập chéo           |
| Data ownership chưa được xác định                  | Không biết service nào nên ghi một column nên nhiều service cùng cập nhật                          |
| Migration legacy chưa có điểm kết thúc             | Quyền truy cập tạm thời tồn tại lâu hơn dự kiến và trở thành dependency chính thức                 |

Các nguyên nhân này thường có động cơ hợp lý trong ngắn hạn. Anti-pattern xuất hiện khi giải pháp tạm thời không có owner, thời hạn hoặc hàng rào quyền truy cập, rồi trở thành cách giao tiếp mặc định giữa các service.

## Hậu quả

| Hậu quả                                              | Cách nó xuất hiện                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Schema trở thành public contract không kiểm soát** | Consumer phụ thuộc vào column và quan hệ nội bộ dù không có API contract hoặc deprecation path |
| **Migration rủi ro**                                 | Đổi tên, xóa hoặc đổi nghĩa một column có thể làm nhiều service và báo cáo hỏng                |
| **Ảnh hưởng rộng khi query hoặc lock lỗi**           | Một query nặng, lock kéo dài hoặc database outage tác động tới nhiều capability                |
| **Không scale độc lập**                              | Product workload tăng nhưng phải scale database chung, kéo theo các service khác               |
| **Không chọn persistence theo nhu cầu**              | Các service bị buộc theo engine, schema và transaction model của database chung                |
| **Independent deployment suy giảm**                  | Service không thể deploy hoặc rollback mà không kiểm tra consumer của table                    |
| **Ownership bị tranh chấp**                          | Không rõ ai chịu trách nhiệm chất lượng, invariant và incident của một column                  |
| **Dễ hình thành Distributed Monolith**               | Nhiều process tồn tại nhưng thay đổi, dữ liệu và vận hành vẫn phụ thuộc lẫn nhau               |

Shared Database có thể làm một thao tác ban đầu trông đơn giản hơn. Chi phí thực sự xuất hiện khi hệ thống cần thay đổi schema, scale workload, khôi phục sự cố hoặc giao ownership cho nhiều team.

## Ví dụ: Shipping và Order

### Topology tạo ra coupling

Giả sử Order Service và Shipping Service đã có codebase riêng nhưng cùng truy cập một schema. Shipping Service cập nhật trực tiếp trạng thái giao hàng trong table của order để màn hình tracking đọc được dữ liệu nhanh.

```text
❌ Cùng dùng một table

  Order Service ────────────────┐
       │                        │
       │ reads/writes orders    ▼
       └──────────────────> orders table
                                ▲
       ┌────────────────────────┘
       │ UPDATE orders.shipping_status
  Shipping Service
```

Đoạn ghi dưới đây minh họa việc Shipping Service phụ thuộc trực tiếp vào table của Order Service:

```sql
-- Shipping Service: phụ thuộc vào schema nội bộ của Order Service
UPDATE orders
SET shipping_status = 'IN_TRANSIT'
WHERE id = :order_id;
```

Sau đó Order Service đổi cách biểu diễn status. Shipping Service và các báo cáo cũ bị lỗi, dù API của Order Service không thay đổi. Một migration tưởng như nội bộ của Order Service vì thế cần phối hợp với mọi consumer đang đọc hoặc ghi `orders`.

### Điểm coupling trong ví dụ

| Lớp                | Hành vi trong ví dụ                                  | Rủi ro                                                             |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------------------------ |
| **Data**           | Shipping Service ghi `orders.shipping_status`        | Order Service không thể thay đổi schema mà không kiểm tra Shipping |
| **Implementation** | Shipping biết table và column nội bộ                 | API không còn là biên giới duy nhất của service                    |
| **Deployment**     | Migration status cần nhiều codebase cùng tương thích | Release window và rollback phải phối hợp                           |
| **Ownership**      | Không rõ Order hay Shipping chịu trách nhiệm column  | Validation, invariant và xử lý incident bị tranh chấp              |
| **Resource**       | Cùng query vào một database                          | Lock hoặc tải cao ở một flow có thể ảnh hưởng flow khác            |

Đổi tên database hoặc tách thêm repository không giải quyết điểm coupling. Cần chuyển ownership của dữ liệu và thay đường truy cập trực tiếp bằng contract có kiểm soát.

### Biên giới dữ liệu phù hợp hơn

Nếu trạng thái shipment thuộc Shipping capability, Shipping Service nên sở hữu dữ liệu shipment của mình. Order Service chỉ cập nhật trạng thái order hoặc một projection local dựa trên contract đã thống nhất.

```text
✅ Tách ownership, không tách nghĩa vụ phối hợp

  Shipping Service ──> Shipping DB
        │
        └── ShipmentStatusChanged event hoặc API response
                                      │
                                      ▼
                           Order Service ──> Order DB
                           (cập nhật dữ liệu local nếu use case cần)
```

Có hai cách thường dùng khi Order cần hiển thị thông tin từ Shipping:

- Gọi Shipping API nếu cần dữ liệu hiện tại và chấp nhận runtime dependency.
- Nhận event để tạo read model/local copy nếu cần đọc nhanh và chấp nhận eventual consistency.

Bản sao của Order Service không biến Order Service thành owner của shipment. Shipping Service vẫn là source of truth cho dữ liệu shipment mà nó sở hữu.

## Data ownership và lộ trình migration

### Quy tắc ownership

**Data ownership** là trách nhiệm end-to-end đối với dữ liệu: định nghĩa ý nghĩa, kiểm tra invariant, ghi thay đổi hợp lệ, quản lý schema và xử lý vòng đời dữ liệu.

Các quy tắc cần được ghi rõ trong service catalog hoặc tài liệu boundary:

1. Mỗi table hoặc tập dữ liệu có một service owner duy nhất.
2. Chỉ owner được ghi dữ liệu và quyết định các thay đổi làm thay đổi invariant của dữ liệu.
3. Tên table, column, index và quan hệ nội bộ không phải contract cho service khác.
4. Service khác truy cập dữ liệu hiện tại qua API, hoặc nhận events để xây dựng bản sao cho use case của mình.
5. Bản sao, cache và read model không thay thế source of truth. Consumer của bản sao cần biết độ trễ và cách rebuild.
6. Schema migration thuộc trách nhiệm của owner và không nên yêu cầu service khác chạy migration nội bộ thay.

Nếu một business fact cần xuất hiện ở nhiều nơi, hãy tách **source of truth** khỏi các projection phục vụ đọc. Đừng biến mọi bản sao thành table dùng chung chỉ vì nhiều service cùng muốn query nó.

### Các mức độ tách dữ liệu

Tách ownership có thể tiến hành theo nhiều cấp độ. Cấp độ cao hơn thường tăng isolation nhưng cũng tăng chi phí vận hành.

| Cấp độ                      | Triển khai                                        | Hàng rào chính                           | Giới hạn                                             |
| --------------------------- | ------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| **Private tables**          | Cùng database và schema; đặt tên theo service     | Convention, review và quy trình          | Database khó enforce quyền; dễ phát sinh `JOIN` chéo |
| **Private schema**          | Cùng database server; mỗi service có schema riêng | Database role và schema permission       | Vẫn chung CPU, RAM, I/O và failure domain            |
| **Private database server** | Mỗi service có database instance/server riêng     | Network, credential và resource boundary | Nhiều database cần backup, monitor và xử lý sự cố    |

`Private tables` không đồng nghĩa với Shared Database nếu quyền ownership được kiểm soát trong giai đoạn chuyển tiếp, nhưng đây là mức dễ trượt trở lại truy cập chéo nhất. Khi chưa thể tách server, `Private schema` thường tạo hàng rào kỹ thuật rõ hơn mà vẫn giữ chi phí hạ tầng có thể kiểm soát.

### Migration từng phase

Không nên migrate Shared Database bằng một lần big-bang nếu hệ thống đang phục vụ business. Một lộ trình có thể kiểm soát thường gồm các phase sau:

| Phase                  | Mục tiêu                                                                     | Bằng chứng cần có                                              |
| ---------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1. Baseline            | Lập inventory table, reader, writer, credential và owner hiện tại            | Dependency map và danh sách đường truy cập chéo                |
| 2. Chọn slice          | Chọn một capability có business value và boundary đủ rõ                      | Owner, tiêu chí thành công và rollback path                    |
| 3. Tạo data path mới   | Thêm schema/database hoặc local model của owner mới                          | API/event contract và kế hoạch backfill                        |
| 4. Đồng bộ chuyển tiếp | Copy/backfill dữ liệu và bắt thay đổi mới qua outbox/CDC hoặc cơ chế phù hợp | Số liệu đối chiếu và độ trễ đồng bộ                            |
| 5. Chuyển consumer     | Đưa reader sang API, event-carried state transfer hoặc read model            | Không còn query trực tiếp từ consumer đã chuyển                |
| 6. Chặn access cũ      | Chặn write chéo trước, sau đó chặn read chéo bằng role/policy                | Query audit và permission test không còn đường cũ              |
| 7. Dọn dẹp             | Xóa route, credential, code, bảng hoặc column cũ khi không còn consumer      | Exit criteria được xác nhận và technical debt không bị bỏ quên |

Giai đoạn chuyển tiếp có thể để Monolith hoặc service cũ cùng tồn tại. Tuy nhiên, mọi quyền truy cập tạm thời cần có owner, ngày xem xét và điều kiện xóa. Nếu không, database chung sẽ trở thành kiến trúc đích ngoài ý muốn.

## Remediation theo từng bước

### Inventory và chỉ định owner

Bắt đầu bằng dữ liệu thực tế, không chỉ bằng sơ đồ service:

1. Liệt kê table, schema, column quan trọng và các database credential.
2. Ghi reader/writer theo service, job, report và migration script.
3. Tìm query `JOIN` xuyên domain, foreign key chéo và các lệnh `UPDATE` ngoài owner.
4. Đối chiếu lịch sử migration, release và incident để tìm thay đổi cần phối hợp.
5. Chỉ định một owner cho từng table hoặc tập dữ liệu. Nếu ownership chưa rõ, đó là việc cần giải quyết trước khi tách hạ tầng.

Inventory này giúp phân biệt một database server dùng chung có boundary với một implementation thực sự bị chia sẻ. Nó cũng cho biết nên bắt đầu migration ở slice nào.

### Chặn ghi chéo rồi chặn đọc chéo

Ưu tiên chặn **cross-owner write** trước. Một service ghi trực tiếp dữ liệu của owner khác có thể phá invariant mà owner không quan sát được.

- Tạo database credential riêng cho từng service.
- Dùng role và schema permission để chỉ owner có quyền ghi table của mình.
- Khi chưa thể tách schema, dùng policy, review query và audit để giảm rủi ro của `Private tables`.
- Sau khi write chéo đã được loại bỏ, chuyển reader sang contract rồi thu hồi quyền đọc chéo.
- Không cấp quyền đọc toàn bộ database chỉ vì một use case cần vài field.

Có thể tiến hành chặn theo từng table hoặc capability. Mỗi lần thu hồi quyền cần có query audit và rollback path để phát hiện consumer còn sót.

### Thay thế query xuyên domain

Một query xuyên domain cần được phân loại theo yêu cầu freshness và availability. Ba hướng chính là:

| Cách tiếp cận                    | Khi phù hợp                                                        | Chi phí hoặc giới hạn                                                         |
| -------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **API Composition**              | Cần dữ liệu hiện tại và traffic/read path có thể chịu network call | Runtime dependency và latency cao hơn; upstream lỗi có thể ảnh hưởng response |
| **Event-Carried State Transfer** | Cần đọc nhanh và chấp nhận eventual consistency                    | Có storage duplication; phải quản lý event contract và rebuild                |
| **Local read model/projection**  | Một use case cần query theo hình dạng riêng, thường xuyên          | Cần đồng bộ dữ liệu và theo dõi staleness/drift                               |

Không nên thay `JOIN` trực tiếp bằng một API call cho mọi row mà không kiểm tra N+1 call và latency. Nếu cần nhiều bản ghi, cân nhắc batch API, projection hoặc API Composition có chủ đích.

CDC có thể hỗ trợ đồng bộ trong giai đoạn chuyển tiếp. Tuy nhiên, consumer đọc CDC trực tiếp từ schema database nguồn vẫn biết chi tiết implementation của schema đó. Khi có thể, hãy biến đường chuyển tiếp thành event contract ổn định và đặt tiêu chí xóa CDC sau migration.

### Thay distributed transaction bằng Saga

Shared Database thường được giữ lại vì một workflow muốn cập nhật nhiều capability trong một transaction ACID. Khi data ownership được tách, một transaction local không còn bao phủ nhiều database.

Nếu business chấp nhận trạng thái trung gian và **eventual consistency**, **Saga** thay distributed transaction bằng chuỗi local transaction. Khi một bước thất bại, service chạy **compensating action** (hành động bù) cho các bước đã commit. Compensation là transaction mới, không phải rollback chung.

Ví dụ đặt hàng:

```text
Happy path:
  Order tạo PENDING ──> Payment charge ──> Inventory reserve ──> CONFIRMED

Inventory thất bại:
  Order PENDING ──> Payment đã charge ──> Inventory FAIL
                                  │
                                  └──> Refund payment ──> Cancel order
```

Mỗi participant cần có state và identity ổn định để xử lý retry. Các bước charge, refund hoặc reserve phải có **idempotency** (xử lý lặp lại không tạo thêm side effect sai). Nếu workflow không chấp nhận eventual consistency hoặc compensation, cần xem xét lại boundary nghiệp vụ thay vì quay lại cho nhiều service ghi chung table.

Chi tiết về các lựa chọn Choreography và Orchestration nằm trong [Saga Pattern](../17-data-patterns/saga.md). Tài liệu này chỉ dùng Saga như hướng xử lý cho coupling transaction của Shared Database.

### Đồng bộ trong giai đoạn chuyển tiếp

Khi business vẫn chạy trong lúc migrate, cần tránh tình huống database mới và database cũ cùng nhận write mà không có quy tắc rõ. Một hướng an toàn hơn là:

1. Xác định một nơi ghi nhận chính cho từng giai đoạn.
2. Backfill dữ liệu ban đầu vào data store mới.
3. Đồng bộ thay đổi mới qua event, outbox hoặc CDC theo kế hoạch.
4. Đối chiếu số lượng, trạng thái và các record quan trọng giữa hai phía.
5. Chuyển từng reader rồi mới thu hồi quyền truy cập cũ.
6. Đặt thời hạn xóa đường đồng bộ và đường truy cập cũ.

Nếu service vừa ghi business data vừa publish event, [Transactional Outbox](../17-data-patterns/transactional-outbox.md) giúp lưu business data và event intent trong cùng một local transaction. Outbox không biến hai database thành một transaction chung; nó chỉ làm reliable event publishing cho đường đồng bộ.

Dùng **Expand and Contract** khi cần thay đổi schema hoặc contract trong lúc hai phiên bản còn cùng tồn tại: thêm đường mới, chạy song song, migrate consumer, rồi mới xóa đường cũ. Tránh big-bang rewrite khi chưa có safety net, quan sát và rollback.

## Trade-off

Khắc phục Shared Database không làm mọi thao tác trở nên đơn giản hơn ngay lập tức. Team đổi coupling schema khó nhìn thấy lấy những contract, bản sao và workflow cần vận hành rõ ràng hơn.

| Lựa chọn                           | Lợi ích                                                                               | Chi phí hoặc giới hạn                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Giữ một database/schema dùng chung | Chi phí hạ tầng thấp hơn; query liên domain và transaction ACID có thể trông đơn giản | Schema coupling, migration phối hợp, scale/failure chung và ownership không rõ      |
| Cùng server, private schema        | Enforce quyền theo schema mà chưa phải vận hành nhiều server                          | Vẫn chung CPU, RAM, I/O và failure domain; cần quản lý grants                       |
| Private database server            | Cách ly resource, scaling và lịch bảo trì tốt hơn                                     | Nhiều database cần cấp credential, backup, monitor và xử lý sự cố                   |
| API Composition                    | Dữ liệu runtime mới và không duplicate storage                                        | Network dependency, latency và failure path của upstream                            |
| Event hoặc local read model        | Giảm runtime dependency và query local nhanh                                          | Eventual consistency, storage duplication, retry, idempotency và theo dõi staleness |
| Saga cho workflow nhiều database   | Giữ data ownership, tránh distributed transaction/2PC                                 | Cần trạng thái trung gian, compensation, retry và reconciliation                    |
| Migration từng phase               | Blast radius nhỏ hơn, có thể dừng hoặc rollback theo slice                            | Monolith/service và data path cũ mới cùng tồn tại; cần dọn nợ kỹ thuật              |

Mục tiêu không phải là tách database bằng mọi giá. Mục tiêu là chọn mức coupling phù hợp với business, làm coupling đó rõ ràng, có owner và có khả năng quan sát.

## Khi nào cần tránh và khi nào có thể chấp nhận

### Khi cần tránh

Nên tránh Shared Database như kiến trúc đích khi:

- Nhiều team cần deploy và scale capability độc lập.
- Service cần chọn persistence hoặc lịch bảo trì khác nhau.
- Một query, lock hoặc database outage có thể làm nhiều capability cùng mất khả năng phục vụ.
- Không xác định được owner duy nhất cho table, column hoặc invariant.
- Service phải đọc/ghi trực tiếp table của service khác để hoàn thành workflow.
- Migration đang tạo ra coordinated release và release window chung như một điều kiện mặc định.

Không nên tách database chỉ vì muốn có nhiều database hơn. Nếu team còn rất nhỏ, domain chưa ổn định và các phần luôn thay đổi cùng nhau, một modular monolith hoặc private schema có ownership rõ có thể ít rủi ro hơn việc dựng nhiều database instance.

### Trường hợp có thể chấp nhận

Shared Database hoặc database server dùng chung có thể là lựa chọn có kiểm soát trong các trường hợp sau:

1. **Migration từ Monolith:** service mới chưa tách data store xong nhưng có kế hoạch ownership, quyền truy cập và thời hạn thoát.
2. **Reporting hoặc Analytics:** dùng read-only replica cho mục đích báo cáo, không cho service nghiệp vụ ghi trực tiếp vào data của owner.
3. **Team rất nhỏ:** team 2–3 người có thể chọn separate schema trong cùng database server để giảm overhead, đồng thời vẫn giới hạn quyền truy cập.
4. **Legacy integration:** hệ thống cũ bắt buộc dùng shared DB và chưa có resource để refactor ngay.

Trong mọi trường hợp, hãy coi đây là technical debt hoặc constraint đã biết. Tài liệu hóa owner, quyền truy cập, rủi ro, tiêu chí xem xét lại và kế hoạch tách nếu đây không phải trạng thái cuối.

## Vận hành

### Phân quyền và isolation

Mỗi service nên dùng credential riêng và chỉ có quyền trên dữ liệu mà nó sở hữu. Hàng rào nên được kiểm tra bằng cơ chế kỹ thuật thay vì chỉ nhắc trong tài liệu:

- `Private schema`: cấp role chỉ được đọc/ghi schema tương ứng.
- `Private database server`: kết hợp network policy với credential boundary.
- `Private tables`: bổ sung query review, convention, audit và kiểm tra quyền thường xuyên vì database có thể chưa enforce được table ownership.
- Không dùng credential của service khác để tránh thiết kế API hoặc bản sao.
- Ghi nhận mọi quyền truy cập tạm thời và ngày thu hồi trong migration plan.

Khi có nhu cầu khẩn cấp, không nên chữa cháy bằng cách mở quyền đọc/ghi toàn bộ database cho một service. Cách đó có thể làm incident hiện tại dịu đi nhưng biến quyền tạm thời thành coupling lâu dài.

### Migration backup và restore

Schema migration phải do data owner quản lý. Trước khi thay đổi, cần biết service nào còn đọc contract hoặc bản sao liên quan. Với migration nhiều phase:

1. Backup và kiểm tra khả năng restore trước khi chuyển dữ liệu.
2. Dùng Expand and Contract khi schema cũ và mới cùng tồn tại.
3. Chạy backfill theo batch có thể theo dõi, không che giấu lỗi bằng cách bỏ qua record.
4. Đối chiếu dữ liệu trước và sau cutover.
5. Chỉ xóa table, column, role hoặc route cũ sau khi xác nhận không còn consumer hợp lệ.

Backup phải gắn với owner và data store cụ thể. Nếu local read model có thể rebuild từ event hoặc source of truth, ghi rõ quy trình rebuild và ngưỡng chấp nhận được. Nếu không thể rebuild, nó cần chính sách backup riêng.

### Observability và xử lý sự cố

Shared Database cần được quan sát ở cả database layer và boundary service. Các tín hiệu hữu ích gồm:

| Tín hiệu                                      | Điều cần phát hiện                                     |
| --------------------------------------------- | ------------------------------------------------------ |
| Query latency, error và timeout theo service  | Workload nào đang suy giảm hoặc tạo dependency runtime |
| Lock, deadlock và connection pool             | Một service có làm nghẽn resource chung không          |
| CPU, RAM, I/O, storage và tốc độ tăng trưởng  | Database server có sắp thành bottleneck chung không    |
| Query audit và permission denial              | Có service nào tiếp tục đọc/ghi ngoài owner không      |
| Số migration hoặc release cần nhiều team      | Deployment coupling có giảm sau remediation không      |
| Outbox/CDC lag và tuổi dữ liệu chưa đồng bộ   | Đường chuyển tiếp hoặc local copy có bị stale không    |
| Data drift giữa source of truth và projection | Consumer có bỏ lỡ event hoặc mapping sai không         |
| Backup success và lần restore gần nhất        | Có thể khôi phục dữ liệu thật hay chỉ có file backup   |

Khi database chung gặp sự cố, ưu tiên cô lập workload, áp dụng degraded mode nếu business cho phép và khôi phục theo runbook. Không mở quyền cross-owner để service này đọc trực tiếp database của service khác trong lúc xử lý incident.

Với local copy hoặc projection, cần có `owner`, `source`, thời điểm cập nhật và cách đồng bộ lại. Với workflow dùng Saga, cần liên kết `saga_id` hoặc `correlation_id` trong log để điều tra các local transaction và compensating action. [Distributed Tracing](../17-observability-patterns/distributed-tracing.md) hữu ích khi cần nối các hop API hoặc event trong quá trình migration.

### Tiêu chí kết thúc migration

Một phase không hoàn tất chỉ vì service mới đã nhận traffic. Có thể coi phase đã kết thúc khi:

- Một service owner duy nhất đã được xác nhận cho mỗi tập dữ liệu liên quan.
- Cross-owner write đã bị chặn bằng role, schema permission hoặc cơ chế tương đương.
- Reader đã chuyển sang API, event hoặc local read model; query audit không còn đường truy cập cũ.
- Dữ liệu mới và dữ liệu chuyển tiếp đã được đối chiếu trong khoảng thời gian đã thống nhất.
- Migration và rollback không còn yêu cầu coordinated release mặc định.
- Outbox/CDC, projection lag, error rate và các chỉ số liên quan nằm trong tiêu chí chấp nhận.
- Quyền database, credential, route, code và schema cũ đã được xóa hoặc có owner cùng deadline rõ ràng.

Nếu còn đường truy cập cũ vì một legacy consumer chưa thể chuyển, hãy ghi nhận đó là technical debt có owner và mốc rà soát. Đừng gọi migration hoàn tất khi Shared Database vẫn là dependency không được kiểm soát.

## Checklist

- [ ] Mỗi table hoặc tập dữ liệu có một service owner duy nhất.
- [ ] Chỉ owner được ghi và thay đổi invariant của dữ liệu.
- [ ] Không có `SELECT`, `JOIN`, foreign key hoặc `UPDATE` trực tiếp xuyên owner.
- [ ] Đã phân biệt dùng chung database server với dùng chung schema/table.
- [ ] Mỗi service có credential và database role phù hợp với ownership.
- [ ] Nhu cầu đọc liên domain có API, event-carried state transfer hoặc local read model rõ ràng.
- [ ] Bản sao có source of truth, cơ chế đồng bộ, ngưỡng staleness và cách rebuild.
- [ ] Workflow nhiều database đã đánh giá Saga, compensation và idempotency khi phù hợp.
- [ ] Migration có backfill, đồng bộ chuyển tiếp, Expand and Contract và rollback path.
- [ ] Có deadline và tiêu chí xóa quyền truy cập, route, code hoặc schema cũ.
- [ ] Dashboard theo dõi query/lock/resource, permission, data lag, drift và backup/restore.
- [ ] Runbook không yêu cầu mở quyền cross-owner để xử lý incident.

## Liên kết liên quan

- [Database per Service Pattern](../17-data-patterns/database-per-service.md) — data ownership, private tables/schema/server và các cách lấy dữ liệu xuyên service.
- [Saga Pattern](../17-data-patterns/saga.md) — local transaction, compensating action, eventual consistency và idempotency.
- [Transactional Outbox Pattern](../17-data-patterns/transactional-outbox.md) — đồng bộ business data với event intent trong migration.
- [Data Management](../09-data-management.md) — phần Shared Database, Database per Service, Saga, CDC và Outbox trong tài liệu nền tảng.
- [Autonomy & Independence](../04-autonomy-independence.md) — independent deployment, team ownership và data locality.
- [Inter-Service Communication](../06-inter-service-communication.md) — API, events và các lựa chọn giao tiếp khi không còn `JOIN` trực tiếp.
- [Decomposition Strategies](../05-decomposition-strategies.md) — xác định boundary và migration từ Monolith.
- [Distributed Tracing Pattern](../17-observability-patterns/distributed-tracing.md) — theo dõi dependency và flow trong quá trình tách dữ liệu.
- [Bản tổng hợp Anti-patterns](../17-anti-patterns.md) — bối cảnh các anti-pattern khác ở cấp hệ thống.
