# 🏗️ Microservice Architecture - Tài liệu học tập

> Repository chứa tài liệu chi tiết về kiến trúc Microservice — từ khái niệm cơ bản đến triển khai nâng cao.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MICROSERVICE ARCHITECTURE                       │
│                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │ Service A│  │ Service B│  │ Service C│  │ Service D│            │
│   │  ┌────┐  │  │  ┌────┐  │  │  ┌────┐  │  │  ┌────┐  │            │
│   │  │ DB │  │  │  │ DB │  │  │  │ DB │  │  │  │ DB │  │            │
│   │  └────┘  │  │  └────┘  │  │  └────┘  │  │  └────┘  │            │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│        │             │             │             │                  │
│   ─────┴─────────────┴─────────────┴─────────────┴─────────         │
│                    Message Bus / API Gateway                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Mục lục

- [Roadmap học tập](#-roadmap-học-tập)
- [1. Khái niệm cơ bản](#1-khái-niệm-cơ-bản)
- [2. Communication & Integration](#2-communication--integration)
- [3. Data Management](#3-data-management)
- [4. Resilience & Reliability](#4-resilience--reliability)
- [5. Observability & Evolvability](#5-observability--evolvability)
- [6. Deployment & Infrastructure](#6-deployment--infrastructure)
- [7. Security](#7-security)
- [8. Configuration Management](#8-configuration-management)
- [9. Design Patterns tổng hợp](#9-design-patterns-tổng-hợp)
- [10. Triển khai Microservice trên AWS](#10-triển-khai-microservice-trên-aws)
- [11. Case Study — Thiết kế kiến trúc Microservice từ đầu](#11-case-study--thiết-kế-kiến-trúc-microservice-từ-đầu)
- [Website docs và quy ước D2 / SourceExplorer](#website-docs-và-quy-ước-d2--sourceexplorer)
  - [D2 — sơ đồ dạng text, render lúc build](#d2--sơ-đồ-dạng-text-render-lúc-build)
  - [Icon D2 — AWS và công nghệ được hỗ trợ](#icon-d2--aws-và-công-nghệ-được-hỗ-trợ)
  - [D2 tương tác — zoom, steps và liên kết source](#d2-tương-tác--zoom-steps-và-liên-kết-source)
  - [SourceExplorer — đối chiếu nhiều đoạn code trong cùng bài](#sourceexplorer--đối-chiếu-nhiều-đoạn-code-trong-cùng-bài)
  - [Component học tập docs-kit 0.7.0](#component-học-tập-docs-kit-070)
- [Tham khảo](#-tham-khảo)

---

## 🚀 Roadmap học tập

| Giai đoạn | Nội dung | Tài liệu |
|---|---|---|
| Foundation | Nền tảng Microservice | 01 → 05 |
| Integration | Giao tiếp và tích hợp | 06 → 08 |
| Data & Reliability | Dữ liệu, chịu lỗi, quan sát | 09 → 11 |
| Platform | Container, Orchestration, CI/CD, Security | 12 → 17 |
| AWS | Triển khai Microservice trên AWS | 18 → 24 |
| End-to-End | Case study tổng hợp | 25, 26, 31 |

---

## 1. Khái niệm cơ bản

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 01 | [Microservice Overview](01-microservice-overview.md) | Microservice là gì, Monolith vs Microservice vs SOA, ưu/nhược điểm | ✅ |
| 02 | [Single Responsibility & Bounded Context](02-single-responsibility-bounded-context.md) | SRP trong Microservice, Bounded Context (DDD), cách xác định ranh giới service | ✅ |
| 03 | [Loose Coupling & High Cohesion](03-loose-coupling-high-cohesion.md) | Loose Coupling, High Cohesion, cách đo lường và áp dụng trong Microservice | ✅ |
| 04 | [Autonomy & Independence](04-autonomy-independence.md) | Service autonomy, independent deployment, team ownership, self-contained service | ✅ |
| 05 | [Decomposition Strategies](05-decomposition-strategies.md) | Phân tách service theo Business Capability, DDD, Strangler Fig | ✅ |

## 2. Communication & Integration

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 06 | [Inter-Service Communication](06-inter-service-communication.md) | REST vs gRPC vs GraphQL, Sync vs Async, Event-Driven | ✅ |
| 07 | [API Gateway](07-api-gateway.md) | API Gateway Pattern, BFF, Rate Limiting, Load Balancing | ✅ |
| 08 | [Service Discovery](08-service-discovery.md) | Client-side vs Server-side, Consul, Eureka, DNS-based | ✅ |

## 3. Data Management

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 09 | [Data Management](09-data-management.md) | Database per Service, Saga, CQRS, Event Sourcing, CAP Theorem | ✅ |

## 4. Resilience & Reliability

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 10 | [Resilience Patterns](10-resilience-patterns.md) | Circuit Breaker, Retry, Bulkhead, Rate Limiter, Fallback | ✅ |

## 5. Observability & Evolvability

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 11 | [Observability & Evolvability](11-observability-evolvability.md) | Logs, Metrics, Traces, Evolvability, ELK, Prometheus, Grafana, Jaeger | ✅ |

## 6. Deployment & Infrastructure

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 12 | [Containerization](12-containerization.md) | Docker, Docker Compose, multi-stage build, best practices | ✅ |
| 13 | [Orchestration](13-orchestration.md) | Kubernetes, Service Mesh (Istio/Linkerd), Helm Charts | ✅ |
| 14 | [CI/CD & Deployment](14-cicd-deployment.md) | Pipeline, Blue-Green, Canary, Rolling, GitOps | ✅ |
| 29 | [Deployment Compatibility & Rollback](29-deployment-compatibility-and-rollback.md) | Backward compatibility khi nhiều version cùng chạy, Expand-Contract migration, rollback database, event, cache, config và business side effect | ✅ |

## 7. Security

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 15 | [Security](15-security.md) | OAuth2, JWT, mTLS, API Security, Zero Trust | ✅ |

## 8. Configuration Management

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 16 | [Configuration & Secrets Management](16-configuration-secrets-management.md) | External Config, Config Server, Secrets Management, Vault, Environment Variables | ✅ |

## 9. Design Patterns tổng hợp

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 17 | [Design Patterns — Index & Decision Guide](17-design-patterns.md) | Bản đồ 8 nhóm pattern, decision matrix theo vấn đề và giai đoạn, ví dụ kết hợp E-Commerce, checklist tổng hợp | ✅ |
| 17.01 | [Sidecar Pattern](17-structural-patterns/sidecar.md) | Sidecar, lifecycle, resource isolation và cách tổ chức cross-cutting concern cạnh service | ✅ |
| 17.02 | [Ambassador Pattern](17-structural-patterns/ambassador.md) | Local proxy cho outbound call, service discovery, retry, TLS và observability | ✅ |
| 17.03 | [Adapter Pattern](17-structural-patterns/adapter.md) | Contract translation, Anti-corruption Layer và compatibility với hệ thống bên ngoài | ✅ |
| 17.04 | [Strangler Fig Pattern](17-decomposition-patterns/strangler-fig.md) | Tách dần capability khỏi monolith bằng routing facade, migration phases và rollback | ✅ |
| 17.05 | [Branch by Abstraction Pattern](17-decomposition-patterns/branch-by-abstraction.md) | Thay implementation an toàn qua abstraction layer, feature flag và rollout từng bước | ✅ |
| 17.06 | [Vine Pattern](17-decomposition-patterns/vine.md) | Viết lại song song, parallel run, cutover có kiểm soát và đồng bộ dữ liệu | ✅ |
| 17.07 | [Database per Service Pattern](17-data-patterns/database-per-service.md) | Data ownership, ranh giới truy cập và các cấp độ tách database cho từng service | ✅ |
| 17.08 | [Transactional Outbox Pattern](17-data-patterns/transactional-outbox.md) | Ghi business data và ý định phát event atomic bằng local transaction | ✅ |
| 17.09 | [Saga Pattern](17-data-patterns/saga.md) | Distributed transaction qua chuỗi local transaction và compensating action | ✅ |
| 17.10 | [CQRS Pattern](17-data-patterns/cqrs.md) | Tách command/query, read model và các mức độ áp dụng CQRS | ✅ |
| 17.11 | [Event Sourcing Pattern](17-data-patterns/event-sourcing.md) | Lưu event bất biến, replay state, snapshot và projection read model | ✅ |
| 17.12 | [API Gateway Pattern](17-communication-patterns/api-gateway.md) | Single entry point, routing, authentication, rate limiting và API aggregation | ✅ |
| 17.13 | [Backend for Frontend (BFF) Pattern](17-communication-patterns/backend-for-frontend.md) | API shape riêng cho Web, Mobile và các loại client khác | ✅ |
| 17.14 | [Service Mesh Pattern](17-communication-patterns/service-mesh.md) | Data Plane, Control Plane, traffic management, mTLS và observability | ✅ |
| 17.15 | [Event-Driven Architecture Pattern](17-communication-patterns/event-driven-architecture.md) | Giao tiếp qua event, fan-out, delivery semantics và loose coupling | ✅ |
| 17.16 | [Async Request-Reply Pattern](17-communication-patterns/async-request-reply.md) | Xử lý tác vụ dài qua job, queue, polling, webhook hoặc WebSocket | ✅ |
| 17.17 | [Timeout Pattern](17-reliability-patterns/timeout.md) | Giới hạn thời gian chờ, deadline propagation và time budget | ✅ |
| 17.18 | [Retry with Backoff và Jitter Pattern](17-reliability-patterns/retry-with-backoff.md) | Retry lỗi tạm thời với exponential backoff, jitter, idempotency và retry budget | ✅ |
| 17.19 | [Circuit Breaker Pattern](17-reliability-patterns/circuit-breaker.md) | Fail fast, state machine và ngăn cascading failure từ dependency lỗi | ✅ |
| 17.20 | [Bulkhead Pattern](17-reliability-patterns/bulkhead.md) | Cô lập thread, connection, concurrency và queue giữa các dependency | ✅ |
| 17.21 | [Health Check / Heartbeat Pattern](17-reliability-patterns/health-check-heartbeat.md) | Heartbeat, TTL, active check và hành động khi instance không khỏe | ✅ |
| 17.22 | [Rolling Update Pattern](17-deployment-patterns/rolling-update.md) | Rollout tuần tự, readiness, compatibility và rollback cho nhiều version | ✅ |
| 17.23 | [Blue-Green Deployment Pattern](17-deployment-patterns/blue-green.md) | Hai môi trường song song, switch traffic nhanh và rollback về version cũ | ✅ |
| 17.24 | [Canary Deployment Pattern](17-deployment-patterns/canary.md) | Progressive rollout, traffic splitting, metrics gate và abort canary | ✅ |
| 17.25 | [Feature Toggle Pattern](17-deployment-patterns/feature-toggle.md) | Tách deploy khỏi release, targeting, rollout và quản lý flag debt | ✅ |
| 17.26 | [Log Aggregation Pattern](17-observability-patterns/log-aggregation.md) | Centralized logging, structured log, retention và truy vấn log phân tán | ✅ |
| 17.27 | [Distributed Tracing Pattern](17-observability-patterns/distributed-tracing.md) | Trace, span, context propagation, sampling và phân tích latency | ✅ |
| 17.28 | [Correlation ID Pattern](17-observability-patterns/correlation-id.md) | Propagation ID qua HTTP/message và liên kết log giữa các service | ✅ |
| 17.29 | [Health Check API Pattern](17-observability-patterns/health-check-api.md) | Contract liveness, readiness, startup, dependency check và probes | ✅ |
| 17.30 | [Distributed Monolith](17-anti-patterns/distributed-monolith.md) | Nhận diện coupling chặt, synchronous chain và remediation | ✅ |
| 17.31 | [Shared Database Anti-pattern](17-anti-patterns/shared-database.md) | Phân tích data ownership bị phá vỡ và lộ trình tách dữ liệu | ✅ |
| 17.32 | [Mega Service](17-anti-patterns/mega-service.md) | Nhận diện boundary quá rộng, trách nhiệm trộn lẫn và cách tách hợp lý | ✅ |
| 17.33 | [Chatty Services](17-anti-patterns/chatty-services.md) | Nhận diện N+1 calls, round-trip dày đặc và coarse-grained API | ✅ |
| 17.34 | [No API Versioning](17-anti-patterns/no-api-versioning.md) | Compatibility, tolerant reader, adapter và consumer-driven contract testing | ✅ |
| 17.35 | [Hardcoded Configuration](17-anti-patterns/hardcoded-configuration.md) | Configuration drift, secrets exposure và remediation bằng artifact bất biến | ✅ |
| 17.36 | [Sync Chain / Death Star Architecture](17-anti-patterns/sync-chain-death-star.md) | Latency chồng dồn, temporal coupling, cascading failure và blast radius | ✅ |
| 17.37 | [Over-engineering](17-anti-patterns/over-engineering.md) | Nhận diện complexity không cần thiết, pattern hype và cách tối giản | ✅ |

## 10. Triển khai Microservice trên AWS

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 18 | [Triển khai & Kiến trúc tổng quan](18-aws-deployment-architecture.md) | Kiến trúc reference trên AWS, ECS vs EKS vs Lambda — chọn khi nào, IaC (CDK/Terraform), multi-account strategy | ✅ |
| 19 | [Communication & Service Discovery trên AWS](19-aws-communication-discovery.md) | API Gateway, Service Connect, Cloud Map, VPC Lattice, ALB/NLB routing, SQS/SNS/EventBridge cho async, so sánh sync vs async trên AWS | ✅ |
| 20 | [Data Management trên AWS](20-aws-data-management.md) | Database per Service (RDS/DynamoDB), Saga pattern với Step Functions, CQRS + Event Sourcing với EventBridge/DynamoDB Streams, data consistency | ✅ |
| 21 | [Resilience & Auto Scaling trên AWS](21-aws-resilience.md) | Auto Scaling (ECS/EKS/Lambda), Multi-AZ/Multi-Region, Circuit Breaker (app-level/service mesh), Health Check, Chaos Engineering, disaster recovery | ✅ |
| 22 | [Observability trên AWS](22-aws-observability.md) | Distributed Tracing (X-Ray), Centralized Logging (CloudWatch Logs), Metrics & Alerting, Container Insights, cost monitoring | ✅ |
| 23 | [Security & Zero Trust trên AWS](23-aws-security.md) | IAM Roles cho service-to-service, Cognito cho AuthN/AuthZ, TLS/mTLS service-to-service, Secrets Manager, network isolation (VPC/Security Groups) | ✅ |
| 24 | [CI/CD & Deployment Strategies trên AWS](24-aws-cicd-deployment.md) | CodePipeline/GitHub Actions, Blue-Green (ECS+ALB), Canary (Lambda/EKS), Rolling Update, GitOps với ArgoCD trên EKS, cost optimization | ✅ |

## 11. Case Study — Thiết kế kiến trúc Microservice từ đầu

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 25 | [Case Study: E-Commerce Platform](25-case-study-ecommerce.md) | Đề bài → phân tích domain → decompose services → chọn patterns → thiết kế infra → so sánh nhiều solutions | ✅ |
| 26 | [Case Study: Food Delivery Platform](26-case-study-food-delivery.md) | Đề bài → domain/BC → service decomposition → dispatch flow → data/resilience/security → execution plan | ✅ |
| 31 | [Case Study: Dropbox System Design](31-case-study-dropbox-system-design.md) | Requirements → estimation → direct upload/download → metadata/versioning → multi-device sync → chunking/deduplication → reliability/security | ✅ |
| 27 | [Bảng thuật ngữ (Glossary)](27-glossary.md) | Tổng hợp thuật ngữ Microservice: cơ bản, communication, patterns, infra, observability, security, AWS | ✅ |

## 12. Cheat Sheet & Tham khảo nhanh

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 28 | [Cheat Sheet](28-cheat-sheet.md) | Microservice vs Monolith, communication matrix, data/resilience/deployment/AWS decision tables, security & observability checklist | ✅ |

## 12. Chủ đề nâng cao

| # | Tài liệu | Mô tả | Trạng thái |
|---|----------|--------|:----------:|
| 30 | [Event-Driven Architecture vs Event Sourcing](30-event-driven-architecture-vs-event-sourcing.md) | Phân biệt kiến trúc giao tiếp EDA với mô hình persistence Event Sourcing; Outbox, idempotency, replay, projection và cách kết hợp | ✅ |
| 27 | [Shared Code Strategy](27-shared-code-strategy.md) | Cái gì nên/không nên share, Shared Library vs Code Gen vs Sidecar, versioning, anti-patterns, best practices | ✅ |

---

## 📖 Quy ước

| Ký hiệu | Ý nghĩa |
|:--------:|---------|
| ⬜ | Chưa viết |
| 🟡 | Đang viết |
| ✅ | Hoàn thành |

Mỗi tài liệu đều có:
- 📋 **Mục lục** với anchor links tới từng phần
- 📊 **Diagrams** (D2 cho kiến trúc/flow; Mermaid cho sơ đồ chuyên biệt; text cho cây thư mục/log; tables cho so sánh)
- 💡 **Ví dụ thực tế** và use cases
- 🔗 **Liên kết** tới các tài liệu liên quan

---

## Website docs và quy ước D2 / SourceExplorer

Website dùng Next.js + Fumadocs và [`@vanhiep99w/docs-kit`](https://www.npmjs.com/package/@vanhiep99w/docs-kit) **0.7.1**. Yêu cầu **Node.js 22+**.

```bash
npm ci
npm run dev
# Kiểm tra trước khi deploy:
npm test
npm run check-diagrams
npm run build
npm run typecheck # Sau build để có Next.js generated types
```

**Chỉnh tài liệu gốc** ở thư mục gốc hoặc `17-*/`, không chỉnh `content/docs/`. `prepare-content` tự sinh frontmatter, routes, sidebar và assets cho SourceExplorer; được chạy trước `dev`/`build`.

### D2 — sơ đồ dạng text, render lúc build

````markdown
```d2 title="Luồng đặt hàng"
direction: right
client: Client
order: Order Service
db: Order DB {shape: cylinder}
client -> order -> db
```
````

- Ưu tiên D2 cho kiến trúc, dependency graph, flowchart và sequence đơn giản. SVG light/dark được render lúc build; browser không phải tải D2/WASM.
- Chuyển sang D2 khi thể hiện tương đương được: state transition có điều kiện rõ ràng; ER dùng `sql_table` giữ fields, constraints và cardinality; flow rẽ nhánh/fan-out có điều kiện và điểm hợp nhất tường minh. Không đổi một `par` thành chuỗi gọi tuần tự chỉ để bỏ Mermaid.
- Timeline lịch sử / các mốc phát triển có thể dùng D2: `direction: down`, các mốc nối dọc, mỗi mốc là một thẻ nội dung; không dùng `sequence_diagram`. Khoảng cách giữa các mốc không tự biểu thị thời lượng. Nếu cần trục thời gian thẳng và thẻ căn chỉnh chính xác như infographic, ưu tiên SVG/HTML.
- Giữ Mermaid khi cần semantics chuyên biệt chưa chuyển tương đương: Gantt migration trong hai case study và Multipart Upload có `loop` + `par` trong bài Dropbox. Giữ text cho cây thư mục, logs, payloads, công thức, bảng căn cột và timing trace cần bảo toàn trục thời gian định lượng; sơ đồ đầu README giữ ASCII để đọc trực tiếp trên GitHub.
- D2 fenced blocks được render trên website; GitHub chỉ hiển thị source D2. Dùng nhãn ngắn, tách sơ đồ lớn thành các phần. Escape ký tự `$` thành `\$` trong nhãn D2 để không bị hiểu là substitution.
- `npm run check-diagrams` render và kiểm tra tất cả D2 trong tài liệu gốc, kể cả các bài tổng hợp không publish riêng. Cache dùng `.next/cache/docs-kit/d2`, không commit vào Git.
- `npm run diagrams:inventory` liệt kê các block Mermaid / ASCII candidate theo file, dòng và heading; `npm run diagrams:inventory -- --json` xuất toàn bộ inventory kèm source hash. Candidate chỉ là gợi ý rà soát: cây thư mục, bảng và prose có mũi tên cũng có thể được nhận diện, không nên tự động chuyển hàng loạt.

### Icon D2 — AWS và công nghệ được hỗ trợ

Các sơ đồ dùng icon từ [catalog chính thức của D2](https://icons.d2lang.com/) cho thành phần có danh tính rõ ràng: AWS compute/network/data/security/observability/CI-CD, PostgreSQL, Redis, MongoDB, MySQL, Docker, Kubernetes, GitHub, NGINX và một số thành phần generic như mobile/server/database.

````markdown
```d2 title="AWS lưu trữ object"
client: Client
bucket: S3 Bucket {shape: cylinder}
client -> bucket: Upload
bucket.icon: "https://icons.d2lang.com/aws/Storage/Amazon-Simple-Storage-Service-S3.svg"
```
````

- Giữ URL catalog trong tài liệu gốc để source D2 vẫn dùng được ngoài website. Chỉ thêm thuộc tính `node.icon`; không thay nhãn, shape, ranh giới hay chiều mũi tên vì mục đích trang trí.
- Build dùng `remarkD2Icons` trước `remarkD2`: chuyển URL đã đăng ký sang file local trong `diagrams/icons/`, rồi docs-kit nhúng **data URL vào SVG light/dark** qua `assetsRoot`. Đọc trang và tải SVG không cần gọi icon CDN; build không tải icon từ mạng.
- [Manifest icon](diagrams/icons/manifest.json) ghi URL nguồn, file local và SHA-256. Một số icon nét mảnh/đơn sắc có nền trắng để rõ ở dark mode, không đổi đường nét/màu logo; manifest ghi thêm thay đổi và hash bản nguồn. Muốn thêm icon mới: chọn đúng URL trong catalog, tải SVG tin cậy vào thư mục này, thêm manifest tương ứng rồi chạy tests/check-diagrams/build/typecheck. URL D2 catalog chưa được vendor sẽ làm build thất bại thay vì âm thầm phụ thuộc mạng.
- Không gán logo AWS cho API Gateway/database generic, không dùng logo MSK cho Kafka tự quản, không chọn một logo đại diện cho node gộp nhiều sản phẩm hoặc lựa chọn. Catalog có tên sản phẩm cũ; không tự suy ra chúng tương đương dịch vụ mới. Kubernetes dùng logo `azure/_Companies/Kubernetes.svg` trong catalog, không biểu thị triển khai trên Azure.
- Icon là tài nguyên bên thứ ba, không phải source code của repository. Giữ nguyên nhận diện và quyền của chủ sở hữu: [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/), [Devicon](https://github.com/devicons/devicon), [Azure Architecture Icons](https://learn.microsoft.com/azure/architecture/icons/). URL nguồn từng asset nằm trong manifest. Chỉ dùng SVG đã review; không nhận SVG/icon URL từ input công khai.
- Tests kiểm tra hash, file/URL trùng, nội dung SVG chủ động hoặc tham chiếu ảnh ngoài; các bản render được kiểm tra có icon nhúng sẵn. Không đổi cây thư mục/logs/payload sang diagram chỉ để gắn icon.

### D2 tương tác — zoom, steps và liên kết source

Từ docs-kit 0.6.0, website đăng ký cả `D2Diagram` và `D2InteractiveDiagram`. **Mặc định vẫn là sơ đồ tĩnh**; chỉ thêm viewer ở nơi giúp đọc rõ hơn:

| Tính năng | Đã áp dụng |
|---|---|
| `interactive`: zoom/pan, fit/reset, mở rộng, xem/copy D2 và tải SVG theo theme | [Dependency graph E-Commerce](25-case-study-ecommerce.md#23-service-dependency-graph), [kiến trúc Dropbox](31-case-study-dropbox-system-design.md#5-high-level-architecture), [quan hệ Kubernetes Objects](13-orchestration.md#48-tổng-hợp-quan-hệ-giữa-các-objects) |
| `mode=steps`: trạng thái kế thừa qua từng bước, Previous/Next và Play/Pause | [Saga compensation khi hết hàng](17-data-patterns/saga.md#luồng-thành-công-và-thất-bại) |
| `D2SourceLinks`: click node mở code tại chỗ | Các node YAML trong sơ đồ Kubernetes Objects ở mục 4.8 |

Thêm `interactive` vào fence hiện có:

````markdown
```d2 interactive title="Đọc kiến trúc và mở code"
direction: right
client: Client
order: Order Service {
  tooltip: "Mở YAML Deployment minh họa"
  link: "./?source=13-orchestration&snapshot=article&file=snippets%2F4-3-deployment.yaml"
}
client -> order
```
````

- Bấm **Explore diagram** để tải controls; chưa bấm vẫn đọc được SVG. Không đưa D2 compiler/WASM vào browser. Toolbar hiện dùng tiếng Anh, chưa có API dịch nhãn.
- `mode=steps` tự bật tương tác. Root là trạng thái ban đầu; mỗi entry trong `steps: { ... }` kế thừa bước trước. Không autoplay khi mở bài. Bàn phím canvas: `+`, `-`, `0`; trái/phải để chuyển bước.
- Không có JavaScript vẫn có SVG, **All views** cho các board còn lại và **D2 source**. Giữ giải thích bằng prose để tài liệu gốc vẫn có ý nghĩa khi đọc trên GitHub.
- Source links dùng `link: "./?source=..."` hoặc `node.link: "./?source=..."`, đặt URL trong dấu nháy kép, dùng cùng `project/snapshot/file/lines` như SourceRef. Pipeline validate các query links này trước khi sinh assets; adapter mở drawer không reload ở cùng trang. Dùng prefix `./?source=` cho D2: SDK hiện tại bỏ mất link chỉ có `?source=` khi compile. Website dùng trailing slash nên `./` vẫn trỏ đúng bài hiện tại. Giữ query URL percent-encoded, không nhúng secrets.
- `mode=tabs` (scenarios độc lập), `mode=explorer` (layers/drill-down), `mode=animation`, override layout/theme theo fence, imports và TTF fonts cũng đã có trong package. Chưa bật đại trà vì chưa cần cho các ví dụ hiện tại; nhiều board làm tăng HTML/MDX và thời gian build. Icons local được dùng như hướng dẫn phía trên. Khi thêm, xem [API và giới hạn D2 0.6.0](https://github.com/vanhiep99w/docs-kit/blob/main/docs/d2.md), dùng roots tài nguyên chuyên biệt và chạy đầy đủ kiểm tra.

### SourceExplorer — đối chiếu nhiều đoạn code trong cùng bài

Đánh dấu code fence bằng đường dẫn artifact ổn định. Artifact là **trích đoạn minh họa**, không phải một project có thể chạy độc lập:

````markdown
```yaml source="snippets/order-deployment.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
```

[Đối chiếu source](?source=13-orchestration&snapshot=article&file=snippets%2Forder-deployment.yaml)
````

- `source` trong query là tên file tài liệu, bỏ `.md`; `snapshot=article`. `file` phải trùng đường dẫn `source="..."` của code fence. Tên artifact trong ví dụ cần được thêm vào bài tương ứng trước khi reference.
- Có thể thêm `&lines=1-4` để highlight một vùng. Hiện pipeline sinh trích đoạn nguyên bản, chưa khai báo named regions.
- Markdown link được remark plugin chuyển thành component **`SourceRef`** của docs-kit. Provider dùng chung mở drawer, file tree, copy, deep link và Back/Forward; đổi pathname sẽ reset drawer.
- `prepare-content` sinh manifest và JSON highlight light/dark tại `public/source-examples/`, rồi kiểm tra project/snapshot/file/line references. Reference sai làm build thất bại. Assets được tái tạo, không commit; **không đưa secrets thật hoặc HTML không tin cậy vào source**.
- Giữ code quan trọng inline để bài vẫn đọc được trên GitHub. SourceExplorer bổ sung khả năng đọc chéo, không thay thế giải thích trong bài.

### Component học tập docs-kit 0.7.0

Đã rà soát 77 tài liệu gốc (69 trang publish và 8 bài pattern tổng hợp). Áp dụng **51 ví dụ trên 47 bài**, không bật tương tác hoặc thay mọi code fence trên toàn site. Các bài overview, glossary, cheat sheet và bảng quyết định vẫn giữ dạng hiện tại khi không cần khám phá code, payload hoặc diễn tiến.

| Fence | Dùng khi | Ví dụ đã áp dụng |
|---|---|---|
| `annotated` | Chú thích gắn với dòng code/config quan trọng | [Deployment](13-orchestration.md#43-deployment), [Adapter](17-structural-patterns/adapter.md#52-mapping-sang-provider), [Secrets Manager](23-aws-security.md#51-aws-secrets-manager) |
| `code-walkthrough` | Đọc các snapshot theo giai đoạn, không thực thi code | [Expand-Contract](29-deployment-compatibility-and-rollback.md#32-quy-trình-expand-contract-an-toàn) |
| `terminal-session` | Lệnh theo bước có context, warning và expected result | [Discovery](08-service-discovery.md#91-kubernetes-dns), [Rollback](17-deployment-patterns/rolling-update.md#cách-rollback-rolling-update) |
| `code-diff` | Đối chiếu trước/sau và giải thích compatibility | [API contract](03-loose-coupling-high-cohesion.md#242-api-contract--versioning), [Shared library](27-shared-code-strategy.md#43-backward-compatibility) |
| `data-inspector` | JSON lồng nhau cần đọc, tìm và copy từng field | [Event envelope](17-communication-patterns/event-driven-architecture.md#event-envelope-và-payload), [Chunk manifest](31-case-study-dropbox-system-design.md#114-chunk-manifest) |
| `protocol-exchange` | HTTP request/response, headers và body cần đọc cùng nhau | [REST](06-inter-service-communication.md#21-rest-httpjson), [Rate limit](07-api-gateway.md#34-rate-limiting--throttling) |
| `span-waterfall` | Span có thời điểm/thời lượng, cần nhìn overlap | [Distributed tracing](11-observability-evolvability.md#42-distributed-tracing-là-gì), [Timeout không tự hủy downstream](17-reliability-patterns/timeout.md#checklist) |
| `concurrency-lanes` | Nhiều actor, khoảng chờ và cửa sổ lỗi | [Outbox crash](09-data-management.md#10-transactional-outbox-pattern), [Full Jitter](10-resilience-patterns.md#33-exponential-backoff-với-jitter), [Projection lag](20-aws-data-management.md#43-sync-data-giữa-write-db-và-read-db) |
| `marble` | Thứ tự notification trên các lane dùng chung cột logic | [FIFO message groups](19-aws-communication-discovery.md#55-fifo-vs-standard-queue) |
| `state-transition` | Người đọc chọn nhánh, xem guard và trạng thái trước/sau | [Circuit Breaker](17-reliability-patterns/circuit-breaker.md#tổng-quan) |

**Giao diện 0.7.1:** UI gọn được áp dụng mặc định, không cần đổi plugin, MDX map hoặc descriptor. Diff caption, session description/expected và walkthrough description nằm trong mục thu gọn. Điều kiện an toàn phải viết trong prose ngay trước ví dụ hoặc `TerminalStep.warning` để luôn hiện trước thao tác; không chỉ đặt trong metadata. Xem `node_modules/@vanhiep99w/docs-kit/docs/compact-ui.md`.

**Quy ước authoring:**

- Descriptor bên trong fence là YAML tin cậy của tác giả. `code`, `json`, command, body và snapshot chỉ được hiển thị; không chạy shell, gọi API, mô phỏng broker hoặc tự kiểm chứng business contract.
- Dùng `code: |-` / `json: |-` để giữ nội dung và bỏ newline cuối ngoài ý muốn. Annotation code dùng ranges từ **1**, inclusive; Inspector dùng JSON Pointer, không dùng JavaScript dot notation.
- Timeline phải khai báo `provenance`; dữ liệu tự biên soạn dùng `kind: illustrative`. Nêu rõ đơn vị, giả định, overlap và khoảng chưa mô hình hóa. Marble dùng cột logic, không mặc định ms hoặc cú pháp RxJS TestScheduler.
- Walkthrough và state explorer không autoplay. Guard/effects chỉ là text; chọn nhánh không chạy validation, timer, retry hay side effect thật. D2 vẫn dùng cho graph/kiến trúc, không thay mọi diagram bằng explorer.
- Chỉ dùng `view: split` / `wordDiff: true` cho diff ngắn cần đối chiếu. Marble zoom vẫn opt-in, chưa bật ở ví dụ FIFO ngắn.
- Nội dung và reference vẫn có HTML server-rendered khi tắt JavaScript; các thao tác chọn/copy/search cần hydration. Disclosure đóng vẫn được publish: chỉ dùng credential giả và dữ liệu đã lọc.

Ví dụ chú thích code:

````markdown
```annotated
title: Retry budget minh họa
language: typescript
code: |-
  const maxAttempts = 3;
annotations:
  - id: budget
    title: Retry hữu hạn
    description: Chọn theo deadline và idempotency contract, không lấy 3 làm mặc định cho mọi hệ thống.
    ranges: [[1, 1]]
```
````

**Giữ SourceExplorer khi nâng cấp ví dụ:**

- Fence `annotated source="snippets/tên-file.ext"` publish **`code` với `language` gốc**, không publish YAML descriptor. Có thể thêm field `source: { project, snapshot, file }` trong descriptor để hiện nút mở source; reference phải trỏ tới artifact đã đăng ký, được pipeline validate như Markdown/D2 links.
- Fence `data-inspector source="snippets/event.json"` publish chuỗi **`json` nguyên bản**. Inspector không có field `source` trong descriptor; giữ Markdown SourceRef kế bên khi cần mở drawer.
- Không gắn metadata `source="..."` lên `code-diff` hoặc `code-walkthrough`: nhiều phiên bản không đại diện cho một artifact. Publish code gốc riêng rồi reference qua `before.source` / `after.source` hoặc `snapshots[].source`; pipeline kiểm tra cả những reference này.
- Đối chiếu đã xác nhận **213 artifacts cũ giữ nguyên code và ngôn ngữ** sau chuyển đổi. Các snippets vẫn là trích đoạn độc lập, không phải project chạy được.

Plugin đăng ký ở `source.config.ts`, MDX components ở `src/app/[[...slug]]/page.tsx`, CSS ở `src/app/globals.css`. Không import parser, Shiki hay D2 renderer vào client component. `scripts/learning-components.test.mjs` validate/compile/server-render mọi ví dụ của cả 10 nhóm, kiểm tra artifact gốc và source references. Chạy đủ `npm test`, `npm run check-diagrams`, `npm run build`, `npm run typecheck` khi thay component hoặc descriptor.

API chi tiết: [docs-kit 0.7.0](https://www.npmjs.com/package/@vanhiep99w/docs-kit/v/0.7.0), tài liệu từng component tại `node_modules/@vanhiep99w/docs-kit/docs/`.

## 📚 Tham khảo

- [Microservices.io](https://microservices.io/) — Patterns & best practices
- [Martin Fowler — Microservices](https://martinfowler.com/articles/microservices.html)
- [Microsoft — Microservices Architecture](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices)
- [The Twelve-Factor App](https://12factor.net/)
- [Building Microservices — Sam Newman](https://www.oreilly.com/library/view/building-microservices-2nd/9781492034018/)

---

> 💡 **Tip**: Đọc theo thứ tự từ 01 → 17 cho kiến thức nền tảng, 18 → 24 cho triển khai trên AWS, và 25, 26, 31 cho các case study tổng hợp!
