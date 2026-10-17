# AGENTS.md — Hướng dẫn cho AI Agent

## Mục đích của Repository

Repository này là tài liệu học tập về **Microservice Architecture**. Tài liệu gốc là Markdown (`.md`), kèm website Next.js/Fumadocs và scripts sinh nội dung. Chỉnh các file Markdown gốc hoặc `17-*/`; không chỉnh `content/docs/` vì đây là output được sinh lại bởi `scripts/prepare-content.mjs`.

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
   - **D2** (`d2` code block có `title`) cho kiến trúc, dependency graph, flowchart và sequence đơn giản; render build-time qua `@vanhiep99w/docs-kit`
   - **Timeline lịch sử / các mốc phát triển** có thể dùng D2 với `direction: down`, mỗi mốc là một thẻ nội dung nối dọc; không dùng `sequence_diagram`. Ghi rõ khoảng cách không phản ánh thời lượng. Nếu cần căn chỉnh infographic chính xác, dùng SVG/HTML.
   - **Mermaid** cho sơ đồ chuyên biệt cần semantics chưa chuyển tương đương (parallel/alternative fragments, activation, state machine, ER, Gantt)
   - **Text / ASCII art** cho cây thư mục, logs, payloads và ví dụ phụ thuộc căn cột; không ưu tiên ASCII cho sơ đồ kiến trúc mới
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
# D2 — Ưu tiên cho kiến trúc và flow (fence có title)
​```d2 title="Giao tiếp giữa các service"
direction: right
client: Client
service: Order Service
db: Order DB {shape: cylinder}
client -> service -> db
​```

# Mermaid — Giữ cho sơ đồ chuyên biệt khi chuyển sẽ mất semantics
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

### SourceExplorer và kiểm tra website

- Bài cần đối chiếu nhiều code dùng code fence có metadata `source="snippets/tên-artifact.ext"` và link `[Đọc source](?source=tên-file-không-đuôi&snapshot=article&file=snippets%2Ftên-artifact.ext)`; remark plugin chuyển link thành `SourceRef` của docs-kit.
- Có thể thêm `&lines=1-4` để highlight. Không khai báo `region` nếu pipeline chưa có region đó.
- docs-kit 0.6.0: chỉ opt-in `interactive` cho sơ đồ lớn; `mode=steps` khi cần diễn tiến trạng thái. Mặc định vẫn tĩnh; không bật toàn site. Viewer lazy-load khi bấm Explore, không chạy compiler trong browser.
- Node D2 có thể dùng `link: "./?source=..."` hoặc `node.link: "./?source=..."` để mở SourceExplorer tại chỗ qua `D2SourceLinks`. Dùng query URL percent-encoded trong nháy kép; `prepare-content` validate cùng manifest như Markdown SourceRef.
- Trích đoạn phải giữ code nguyên bản, có language hợp lệ, không trùng artifact path trong một bài. Không ngụ ý các snippets độc lập là một project chạy được.
- `prepare-content` tự sinh/validate manifest và snapshots tại `public/source-examples/`. Không chỉnh/commit output hoặc cache `.next/cache/docs-kit/d2`.
- Chỉ publish source tin cậy, không chứa secrets thật. HTML highlight và SVG D2 được nhúng vào trang, không phải dữ liệu input công khai.
- Yêu cầu Node.js 22+. Chạy `npm test`, `npm run check-diagrams`, `npm run build` khi thay pipeline/component/diagram; thêm `npm run typecheck` sau khi build đã tạo types.
- Tham khảo hướng dẫn authoring trong README, mục “Website docs và quy ước D2 / SourceExplorer”.

### Khi thêm doc mới

1. Tạo file ở thư mục gốc theo format đặt tên
2. Thêm TOC ở đầu file
3. Cập nhật README.md — thêm vào bảng tương ứng
4. Đổi trạng thái thành `✅` khi hoàn thành
