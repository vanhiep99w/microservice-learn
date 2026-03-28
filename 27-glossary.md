# 📖 Bảng thuật ngữ Microservice (Glossary)

> Tổng hợp các thuật ngữ quan trọng trong kiến trúc Microservice — giải thích ngắn gọn bằng tiếng Việt kèm link tới tài liệu chi tiết.

---

## 📋 Mục lục

- [1. Thuật ngữ cơ bản](#1-thuật-ngữ-cơ-bản)
- [2. Communication — Giao tiếp giữa các service](#2-communication--giao-tiếp-giữa-các-service)
- [3. Patterns — Các mẫu thiết kế](#3-patterns--các-mẫu-thiết-kế)
- [4. Infrastructure — Hạ tầng](#4-infrastructure--hạ-tầng)
- [5. Observability — Quan sát hệ thống](#5-observability--quan-sát-hệ-thống)
- [6. Security — Bảo mật](#6-security--bảo-mật)
- [7. AWS Services](#7-aws-services)
- [Ví dụ thực tế — Áp dụng thuật ngữ](#ví-dụ-thực-tế--áp-dụng-thuật-ngữ)
- [Links liên quan](#links-liên-quan)

---

## 1. Thuật ngữ cơ bản

| Thuật ngữ | Giải thích | Doc liên quan |
|-----------|------------|:-------------:|
| **Microservice** | Kiến trúc chia ứng dụng thành các service nhỏ, độc lập, mỗi service đảm nhận một chức năng nghiệp vụ cụ thể và có thể triển khai riêng biệt. | [01](01-microservice-overview.md) |
| **Monolith** | Kiến trúc truyền thống, toàn bộ ứng dụng được đóng gói và triển khai như một khối duy nhất. Đơn giản ban đầu nhưng khó mở rộng khi hệ thống lớn. | [01](01-microservice-overview.md) |
| **SOA** (Service-Oriented Architecture) | Kiến trúc hướng dịch vụ — tiền thân của Microservice, nhấn mạnh tái sử dụng service qua ESB (Enterprise Service Bus). Microservice là phiên bản tinh gọn hơn của SOA. | [01](01-microservice-overview.md) |
| **Bounded Context** | Ranh giới logic trong Domain-Driven Design, xác định phạm vi mà một model nghiệp vụ có ý nghĩa nhất quán. Mỗi Microservice thường tương ứng với một Bounded Context. | [02](02-single-responsibility-bounded-context.md) |
| **DDD** (Domain-Driven Design) | Phương pháp thiết kế phần mềm tập trung vào domain nghiệp vụ, sử dụng Ubiquitous Language và Bounded Context để phân chia hệ thống. | [02](02-single-responsibility-bounded-context.md) |
| **SRP** (Single Responsibility Principle) | Nguyên tắc mỗi service chỉ nên có một lý do để thay đổi — tức chỉ đảm nhận một trách nhiệm nghiệp vụ duy nhất. | [02](02-single-responsibility-bounded-context.md) |
| **Loose Coupling** | Các service liên kết lỏng lẻo — thay đổi một service không ảnh hưởng đến service khác. Đạt được qua API contract, async messaging. | [03](03-loose-coupling-high-cohesion.md) |
| **High Cohesion** | Các thành phần bên trong một service có liên quan chặt chẽ về mặt nghiệp vụ, cùng phục vụ một mục đích. | [03](03-loose-coupling-high-cohesion.md) |
| **Service Autonomy** | Mỗi service tự chủ hoàn toàn: có database riêng, triển khai độc lập, và được sở hữu bởi một team cụ thể. | [04](04-autonomy-independence.md) |
| **Strangler Fig Pattern** | Chiến lược chuyển đổi dần từ Monolith sang Microservice bằng cách "bóc" từng phần chức năng ra thành service mới. | [05](05-decomposition-strategies.md) |
| **Decomposition** | Quá trình phân tách hệ thống lớn thành các service nhỏ hơn, có thể theo Business Capability, Subdomain, hoặc Use Case. | [05](05-decomposition-strategies.md) |
| **Ubiquitous Language** | Ngôn ngữ chung giữa team kỹ thuật và domain expert, đảm bảo mọi người hiểu cùng một nghĩa cho mỗi thuật ngữ nghiệp vụ. | [02](02-single-responsibility-bounded-context.md) |
| **Database per Service** | Mỗi service sở hữu database riêng, không chia sẻ database với service khác. Đảm bảo tính tự chủ và giảm coupling. | [09](09-data-management.md) |
| **CAP Theorem** | Định lý phát biểu rằng một hệ thống phân tán chỉ có thể đảm bảo tối đa 2 trong 3 tính chất: Consistency, Availability, Partition Tolerance. | [09](09-data-management.md) |

---

## 2. Communication — Giao tiếp giữa các service

| Thuật ngữ | Giải thích | Doc liên quan |
|-----------|------------|:-------------:|
| **REST** (Representational State Transfer) | Giao thức giao tiếp đồng bộ qua HTTP, sử dụng JSON/XML. Đơn giản, phổ biến nhất cho service-to-service communication. | [06](06-inter-service-communication.md) |
| **gRPC** | Framework RPC hiệu năng cao của Google, sử dụng Protocol Buffers và HTTP/2. Nhanh hơn REST, hỗ trợ streaming, phù hợp cho internal communication. | [06](06-inter-service-communication.md) |
| **GraphQL** | Ngôn ngữ truy vấn API cho phép client yêu cầu chính xác dữ liệu cần thiết. Giảm over-fetching/under-fetching, thường dùng ở API Gateway layer. | [06](06-inter-service-communication.md) |
| **Event-Driven Architecture** | Kiến trúc nơi các service giao tiếp qua event (sự kiện). Service phát ra event khi trạng thái thay đổi, các service khác lắng nghe và phản ứng. | [06](06-inter-service-communication.md) |
| **Message Broker** | Thành phần trung gian nhận và chuyển tiếp message giữa các service (ví dụ: RabbitMQ, Apache Kafka, AWS SQS). Giúp decouple sender và receiver. | [06](06-inter-service-communication.md) |
| **Pub/Sub** (Publish/Subscribe) | Mô hình giao tiếp bất đồng bộ: publisher phát message lên topic, tất cả subscriber đăng ký topic đó sẽ nhận được message. | [06](06-inter-service-communication.md) |
| **API Gateway** | Điểm vào duy nhất (single entry point) cho tất cả client request. Xử lý routing, authentication, rate limiting, load balancing. | [07](07-api-gateway.md) |
| **BFF** (Backend for Frontend) | Biến thể của API Gateway — tạo một gateway riêng cho mỗi loại client (web, mobile, IoT) để tối ưu response cho từng frontend. | [07](07-api-gateway.md) |
| **Service Discovery** | Cơ chế để các service tự động tìm thấy nhau trong hệ thống phân tán, thay vì hard-code địa chỉ IP/port. | [08](08-service-discovery.md) |
| **Service Registry** | Nơi lưu trữ danh sách các service instance đang hoạt động (ví dụ: Consul, Eureka, AWS Cloud Map). Là thành phần cốt lõi của Service Discovery. | [08](08-service-discovery.md) |

---

## 3. Patterns — Các mẫu thiết kế

| Thuật ngữ | Giải thích | Doc liên quan |
|-----------|------------|:-------------:|
| **Circuit Breaker** | Mẫu ngắt mạch — ngừng gọi service lỗi sau một ngưỡng failure nhất định, tránh cascading failure lan ra toàn hệ thống. Có 3 trạng thái: Closed → Open → Half-Open. | [10](10-resilience-patterns.md) |
| **Retry** | Tự động thử lại request khi gặp lỗi tạm thời. Thường kết hợp với exponential backoff và jitter để tránh thundering herd. | [10](10-resilience-patterns.md) |
| **Bulkhead** | Mẫu cách ly tài nguyên — phân chia thread pool/connection pool riêng cho từng dependency, ngăn một service lỗi làm cạn kiệt tài nguyên chung. | [10](10-resilience-patterns.md) |
| **Fallback** | Cung cấp giá trị/hành vi thay thế khi service chính không khả dụng. Ví dụ: trả về dữ liệu cache khi service gốc lỗi. | [10](10-resilience-patterns.md) |
| **Saga Pattern** | Mẫu quản lý transaction phân tán qua chuỗi local transaction + compensating transaction. Có 2 dạng: Choreography (event-based) và Orchestration (coordinator). | [09](09-data-management.md) |
| **CQRS** (Command Query Responsibility Segregation) | Tách riêng model đọc (Query) và model ghi (Command). Cho phép tối ưu riêng biệt cho read và write workload. | [09](09-data-management.md) |
| **Event Sourcing** | Lưu trạng thái dưới dạng chuỗi event thay vì trạng thái hiện tại. Mỗi thay đổi là một event bất biến, có thể replay lại toàn bộ lịch sử. | [09](09-data-management.md) |
| **Sidecar Pattern** | Deploy thêm một container phụ bên cạnh service chính trong cùng pod/task. Sidecar xử lý các cross-cutting concern (logging, proxy, monitoring). | [17](17-design-patterns.md) |
| **Ambassador Pattern** | Một dạng sidecar đặc biệt hoạt động như proxy, xử lý kết nối ra bên ngoài (retry, circuit breaking, routing) thay cho service chính. | [17](17-design-patterns.md) |
| **Adapter Pattern** | Mẫu chuyển đổi interface — cho phép service giao tiếp với hệ thống bên ngoài có interface khác biệt thông qua một lớp chuyển đổi. | [17](17-design-patterns.md) |
| **Rate Limiting** | Giới hạn số lượng request trong một khoảng thời gian. Bảo vệ service khỏi quá tải và tấn công DDoS. | [07](07-api-gateway.md) |
| **Idempotency** | Tính chất đảm bảo rằng thực hiện cùng một operation nhiều lần cho kết quả giống như thực hiện một lần. Quan trọng khi có retry logic. | [06](06-inter-service-communication.md) |

---

## 4. Infrastructure — Hạ tầng

| Thuật ngữ | Giải thích | Doc liên quan |
|-----------|------------|:-------------:|
| **Docker** | Nền tảng container hóa phổ biến nhất, đóng gói ứng dụng cùng dependencies vào container image. Đảm bảo ứng dụng chạy nhất quán trên mọi môi trường. | [12](12-containerization.md) |
| **Docker Compose** | Công cụ định nghĩa và chạy multi-container application bằng file YAML. Phù hợp cho development và testing. | [12](12-containerization.md) |
| **Kubernetes** (K8s) | Nền tảng orchestration container hàng đầu — tự động hóa deployment, scaling, và quản lý container ở quy mô lớn. | [13](13-orchestration.md) |
| **Helm** | Package manager cho Kubernetes, sử dụng Charts để định nghĩa, cài đặt và nâng cấp ứng dụng trên K8s. | [13](13-orchestration.md) |
| **Service Mesh** | Lớp infrastructure chuyên xử lý service-to-service communication (mTLS, traffic management, observability). Ví dụ: Istio, Linkerd. | [13](13-orchestration.md) |
| **GitOps** | Phương pháp quản lý infrastructure và deployment thông qua Git. Trạng thái mong muốn được khai báo trong repo, công cụ như ArgoCD tự động đồng bộ. | [14](14-cicd-deployment.md) |
| **CI/CD** (Continuous Integration/Continuous Deployment) | Pipeline tự động: build → test → deploy. Cho phép release nhanh và đáng tin cậy. | [14](14-cicd-deployment.md) |
| **Blue-Green Deployment** | Chiến lược triển khai 2 môi trường song song (Blue = hiện tại, Green = phiên bản mới). Chuyển traffic khi Green sẵn sàng, rollback nhanh nếu lỗi. | [14](14-cicd-deployment.md) |
| **Canary Deployment** | Triển khai phiên bản mới cho một phần nhỏ traffic (ví dụ 5%), theo dõi metrics, rồi dần tăng lên 100% nếu ổn định. | [14](14-cicd-deployment.md) |
| **IaC** (Infrastructure as Code) | Quản lý hạ tầng bằng code thay vì thao tác thủ công. Ví dụ: Terraform, AWS CDK, Pulumi. | [18](18-aws-deployment-architecture.md) |

---

## 5. Observability — Quan sát hệ thống

| Thuật ngữ | Giải thích | Doc liên quan |
|-----------|------------|:-------------:|
| **Distributed Tracing** | Theo dõi một request xuyên suốt qua nhiều service. Mỗi request có một trace ID duy nhất để liên kết các span (đoạn xử lý) lại với nhau. | [11](11-observability-evolvability.md) |
| **Metrics** | Dữ liệu số đo lường hiệu năng hệ thống theo thời gian: latency, throughput, error rate, CPU/memory usage. | [11](11-observability-evolvability.md) |
| **Logs** | Bản ghi sự kiện (text/JSON) từ ứng dụng. Trong Microservice, cần centralized logging để gom log từ tất cả service về một nơi. | [11](11-observability-evolvability.md) |
| **ELK Stack** (Elasticsearch, Logstash, Kibana) | Bộ công cụ phổ biến cho centralized logging: Logstash thu thập, Elasticsearch lưu trữ & tìm kiếm, Kibana hiển thị dashboard. | [11](11-observability-evolvability.md) |
| **Prometheus** | Hệ thống monitoring mã nguồn mở, thu thập metrics theo mô hình pull. Hỗ trợ PromQL để truy vấn và alerting. | [11](11-observability-evolvability.md) |
| **Grafana** | Nền tảng visualization tạo dashboard từ nhiều data source (Prometheus, Elasticsearch, CloudWatch...). Hiển thị metrics trực quan và cảnh báo. | [11](11-observability-evolvability.md) |
| **Jaeger** | Công cụ distributed tracing mã nguồn mở, giúp theo dõi và phân tích latency của request qua nhiều service. | [11](11-observability-evolvability.md) |
| **Health Check** | Endpoint (`/health`, `/ready`) để kiểm tra trạng thái service. Orchestrator dùng health check để quyết định restart hoặc loại bỏ instance lỗi. | [10](10-resilience-patterns.md) |

---

## 6. Security — Bảo mật

| Thuật ngữ | Giải thích | Doc liên quan |
|-----------|------------|:-------------:|
| **OAuth2** | Framework ủy quyền (authorization) cho phép ứng dụng bên thứ ba truy cập tài nguyên thay mặt user mà không cần biết mật khẩu. | [15](15-security.md) |
| **JWT** (JSON Web Token) | Token dạng JSON tự chứa thông tin (claims), được ký số để xác thực. Dùng phổ biến để truyền identity giữa các service. | [15](15-security.md) |
| **mTLS** (Mutual TLS) | Cả client và server đều xác thực lẫn nhau bằng certificate. Đảm bảo mã hóa và trust cho service-to-service communication. | [15](15-security.md) |
| **Zero Trust** | Mô hình bảo mật "không tin ai" — mọi request đều phải được xác thực và ủy quyền, bất kể đến từ bên trong hay bên ngoài network. | [15](15-security.md) |
| **API Key** | Chuỗi ký tự bí mật dùng để xác thực client khi gọi API. Đơn giản nhưng kém an toàn hơn OAuth2/JWT cho các hệ thống phức tạp. | [15](15-security.md) |
| **RBAC** (Role-Based Access Control) | Kiểm soát truy cập dựa trên vai trò. User được gán role, mỗi role có tập permission xác định. | [15](15-security.md) |
| **Secrets Management** | Quản lý thông tin nhạy cảm (API keys, DB passwords, certificates) một cách an toàn. Tránh hard-code secrets trong source code. | [16](16-configuration-secrets-management.md) |

---

## 7. AWS Services

| Thuật ngữ | Giải thích | Doc liên quan |
|-----------|------------|:-------------:|
| **ECS** (Elastic Container Service) | Dịch vụ orchestration container của AWS, hỗ trợ Fargate (serverless) và EC2 launch type. Đơn giản hơn EKS, tích hợp sâu với AWS. | [18](18-aws-deployment-architecture.md) |
| **EKS** (Elastic Kubernetes Service) | Managed Kubernetes trên AWS. Phù hợp khi team đã quen Kubernetes hoặc cần multi-cloud portability. | [18](18-aws-deployment-architecture.md) |
| **Lambda** | Dịch vụ serverless compute — chạy code mà không cần quản lý server. Tính phí theo số lần gọi và thời gian thực thi. Phù hợp cho event-driven workload. | [18](18-aws-deployment-architecture.md) |
| **API Gateway** (AWS) | Dịch vụ managed API Gateway, hỗ trợ REST và WebSocket API. Xử lý throttling, authorization, caching, và request transformation. | [19](19-aws-communication-discovery.md) |
| **SQS** (Simple Queue Service) | Dịch vụ message queue fully managed. Hỗ trợ Standard Queue (at-least-once, high throughput) và FIFO Queue (exactly-once, đảm bảo thứ tự). | [19](19-aws-communication-discovery.md) |
| **SNS** (Simple Notification Service) | Dịch vụ pub/sub fully managed, phát message tới nhiều subscriber (SQS, Lambda, HTTP, Email). Phù hợp cho fan-out pattern. | [19](19-aws-communication-discovery.md) |
| **EventBridge** | Event bus serverless cho phép routing event giữa các service dựa trên rule. Hỗ trợ schema registry và event replay. | [19](19-aws-communication-discovery.md) |
| **DynamoDB** | NoSQL database fully managed, hiệu năng millisecond ở mọi quy mô. Hỗ trợ DynamoDB Streams cho event-driven architecture. | [20](20-aws-data-management.md) |
| **RDS** (Relational Database Service) | Managed relational database (MySQL, PostgreSQL, Aurora...). Hỗ trợ Multi-AZ, Read Replicas, automated backup. | [20](20-aws-data-management.md) |
| **Step Functions** | Dịch vụ serverless orchestration, dùng state machine để điều phối workflow phức tạp. Thường dùng để triển khai Saga pattern trên AWS. | [20](20-aws-data-management.md) |
| **X-Ray** | Dịch vụ distributed tracing của AWS, theo dõi request qua Lambda, ECS, API Gateway, SQS. Tạo service map và phân tích latency. | [22](22-aws-observability.md) |
| **CloudWatch** | Dịch vụ monitoring và logging trung tâm của AWS. Thu thập metrics, logs, tạo alarm, và dashboard cho toàn bộ hệ thống. | [22](22-aws-observability.md) |
| **Cognito** | Dịch vụ quản lý user identity (User Pools) và federated identity (Identity Pools). Hỗ trợ OAuth2, OIDC, social login. | [23](23-aws-security.md) |
| **Secrets Manager** | Dịch vụ quản lý secrets (DB credentials, API keys) với tự động rotation. Tích hợp với RDS, ECS, Lambda. | [23](23-aws-security.md) |
| **VPC Lattice** | Dịch vụ networking mới của AWS, đơn giản hóa service-to-service communication với built-in auth, monitoring, traffic management. | [19](19-aws-communication-discovery.md) |
| **Cloud Map** | Dịch vụ Service Discovery của AWS, cho phép đăng ký và tìm kiếm service bằng DNS hoặc API. Tích hợp với ECS Service Connect. | [19](19-aws-communication-discovery.md) |

---

## Ví dụ thực tế — Áp dụng thuật ngữ

### Kịch bản: Xử lý đặt hàng trong hệ thống E-Commerce

Khi user đặt hàng trên hệ thống e-commerce được xây dựng bằng Microservice, các thuật ngữ được áp dụng như sau:

```
┌────────┐     ┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│ Client │────▶│ API Gateway │────▶│ Order Service│────▶│ Payment Service│
└────────┘     │ (REST/JWT)  │     │  (gRPC)      │     │  (gRPC)       │
               └─────────────┘     └──────┬───────┘     └───────────────┘
                                          │ Event (Saga)
                                          ▼
                                   ┌──────────────┐     ┌───────────────┐
                                   │ Message Broker│────▶│Inventory Svc  │
                                   │ (SQS/SNS)   │     │(Event-Driven) │
                                   └──────────────┘     └───────────────┘
```

1. **Client** gửi request qua **API Gateway** — xác thực bằng **JWT** (**OAuth2**)
2. **API Gateway** route request tới **Order Service** — tìm service qua **Service Discovery** (**Cloud Map**)
3. **Order Service** gọi **Payment Service** bằng **gRPC** (đồng bộ), có **Circuit Breaker** bảo vệ
4. Sau khi thanh toán thành công, **Order Service** phát event qua **Message Broker** (**SNS** → **SQS**)
5. **Inventory Service** nhận event (mô hình **Pub/Sub**), trừ tồn kho — đây là một bước trong **Saga Pattern**
6. Nếu trừ kho thất bại, compensating transaction được kích hoạt (hoàn tiền qua **Step Functions**)
7. Toàn bộ flow được theo dõi bởi **Distributed Tracing** (**X-Ray**), **Metrics** (**CloudWatch**), và **Logs** (**ELK**)
8. Mỗi service chạy trong **Docker** container, orchestrate bởi **ECS**/**Kubernetes**, triển khai qua **CI/CD** pipeline

> Xem chi tiết thiết kế tại [Case Study: E-Commerce Platform](25-case-study-ecommerce.md)

---

## Links liên quan

| Nhóm | Tài liệu |
|------|----------|
| Khái niệm cơ bản | [01 - Overview](01-microservice-overview.md) · [02 - SRP & Bounded Context](02-single-responsibility-bounded-context.md) · [03 - Coupling & Cohesion](03-loose-coupling-high-cohesion.md) |
| Communication | [06 - Inter-Service Communication](06-inter-service-communication.md) · [07 - API Gateway](07-api-gateway.md) · [08 - Service Discovery](08-service-discovery.md) |
| Data & Resilience | [09 - Data Management](09-data-management.md) · [10 - Resilience Patterns](10-resilience-patterns.md) |
| Observability | [11 - Observability & Evolvability](11-observability-evolvability.md) |
| Infrastructure | [12 - Containerization](12-containerization.md) · [13 - Orchestration](13-orchestration.md) · [14 - CI/CD](14-cicd-deployment.md) |
| Security | [15 - Security](15-security.md) · [16 - Config & Secrets](16-configuration-secrets-management.md) |
| Patterns | [17 - Design Patterns](17-design-patterns.md) |
| AWS | [18](18-aws-deployment-architecture.md) · [19](19-aws-communication-discovery.md) · [20](20-aws-data-management.md) · [21](21-aws-resilience.md) · [22](22-aws-observability.md) · [23](23-aws-security.md) · [24](24-aws-cicd-deployment.md) |
| Case Study | [25 - E-Commerce](25-case-study-ecommerce.md) · [26 - Food Delivery](26-case-study-food-delivery.md) |

---

> 💡 **Tip**: Sử dụng `Ctrl+F` để tìm nhanh thuật ngữ cần tra cứu. Mỗi thuật ngữ đều có link tới tài liệu chi tiết tương ứng.
