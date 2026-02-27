# AGENTS.md — Hướng dẫn cho AI Agent

## Mục đích của Repository

Repository này là tài liệu học tập về **Microservice Architecture**. Chỉ chứa các file markdown (`.md`) — không có source code.

## Cấu trúc thư mục

```
microservice-learn/
├── README.md              # Tổng quan, roadmap, links tới tất cả docs
├── AGENTS.md              # File hướng dẫn này
├── 01-microservice-overview.md
├── 02-single-responsibility-bounded-context.md
├── 03-loose-coupling-high-cohesion.md
├── 04-autonomy-independence.md
├── 05-decomposition-strategies.md
├── 06-inter-service-communication.md
├── 07-api-gateway.md
├── 08-service-discovery.md
├── 09-data-management.md
├── 10-resilience-patterns.md
├── 11-observability-evolvability.md
├── 12-containerization.md
├── 13-orchestration.md
├── 14-cicd-deployment.md
├── 15-security.md
├── 16-configuration-secrets-management.md
├── 17-design-patterns.md
├── 18-aws-deployment-architecture.md
├── 19-aws-communication-discovery.md
├── 20-aws-data-management.md
├── 21-aws-resilience.md
├── 22-aws-observability.md
├── 23-aws-security.md
├── 24-aws-cicd-deployment.md
└── 25-case-study-ecommerce.md
```

## Quy tắc viết tài liệu

### Format bắt buộc cho mỗi file doc

1. **Tiêu đề chính** — H1 (`#`), đặt ở dòng đầu tiên
2. **Mục lục (TOC)** — Ngay sau tiêu đề, sử dụng anchor links (`[text](#anchor)`) tới từng section H2/H3
3. **Nội dung** — Phân theo H2 (`##`) và H3 (`###`)
4. **Diagrams** — Sử dụng:
   - **Mermaid** (`mermaid` code block) cho flowchart, sequence diagram
   - **ASCII art** cho kiến trúc tổng quan
   - **Tables** cho so sánh, tổng hợp
5. **Ví dụ thực tế** — Mỗi khái niệm cần có ít nhất 1 ví dụ / use case
6. **Links liên quan** — Link tới các docs khác trong repo khi có liên quan

### Ngôn ngữ

- Viết bằng **tiếng Việt**
- Thuật ngữ kỹ thuật giữ nguyên **tiếng Anh** (ví dụ: Circuit Breaker, API Gateway, Service Discovery)
- Giải thích thuật ngữ tiếng Anh khi xuất hiện lần đầu

### Quy tắc đặt tên file

- Format: `{số thứ tự 2 chữ số}-{tên-viết-thường-nối-gạch}.md`
- Ví dụ: `01-microservice-overview.md`, `07-resilience-patterns.md`

### Khi cập nhật README

- Cập nhật trạng thái trong bảng:
  - `⬜` — Chưa viết
  - `🟡` — Đang viết
  - `✅` — Hoàn thành
- Đảm bảo tất cả links trong README trỏ đúng tới file

### Diagrams

```
# Mermaid — Dùng cho flow, sequence, class diagram
​```mermaid
graph LR
    A --> B --> C
​```

# ASCII Art — Dùng cho kiến trúc tổng quan
​```
┌──────────┐     ┌──────────┐
│ Service A│────▶│ Service B│
└──────────┘     └──────────┘
​```

# Tables — Dùng cho so sánh
| Tiêu chí | Option A | Option B |
|----------|----------|----------|
| Tốc độ   | Nhanh    | Chậm     |
```

### Khi thêm doc mới

1. Tạo file ở thư mục gốc theo format đặt tên
2. Thêm TOC ở đầu file
3. Cập nhật README.md — thêm vào bảng tương ứng
4. Đổi trạng thái thành `✅` khi hoàn thành
