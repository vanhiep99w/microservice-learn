# CI/CD & Deployment Strategies cho Microservice

## 📋 Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
- [2. CI — Continuous Integration](#2-ci--continuous-integration)
  - [2.1. CI là gì?](#21-ci-là-gì)
  - [2.2. CI Pipeline cho Microservice](#22-ci-pipeline-cho-microservice)
  - [2.3. Mono-repo vs Multi-repo CI](#23-mono-repo-vs-multi-repo-ci)
  - [2.4. Ví dụ — GitHub Actions CI Pipeline](#24-ví-dụ--github-actions-ci-pipeline)
- [3. CD — Continuous Delivery vs Continuous Deployment](#3-cd--continuous-delivery-vs-continuous-deployment)
  - [3.1. Phân biệt Delivery vs Deployment](#31-phân-biệt-delivery-vs-deployment)
  - [3.2. CD Pipeline cho Microservice](#32-cd-pipeline-cho-microservice)
- [4. Deployment Strategies](#4-deployment-strategies)
  - [4.1. Recreate](#41-recreate)
  - [4.2. Rolling Update](#42-rolling-update)
  - [4.3. Blue-Green Deployment](#43-blue-green-deployment)
  - [4.4. Canary Deployment](#44-canary-deployment)
  - [4.5. A/B Testing](#45-ab-testing)
  - [4.6. Rolling Update vs Blue-Green — Khác nhau thế nào?](#46-rolling-update-vs-blue-green--khác-nhau-thế-nào)
  - [4.7. So sánh tổng hợp các Deployment Strategies](#47-so-sánh-tổng-hợp-các-deployment-strategies)
- [5. GitOps](#5-gitops)
  - [5.1. GitOps là gì? Tại sao cần?](#51-gitops-là-gì-tại-sao-cần)
  - [5.2. Push-based vs Pull-based — 2 cách deploy](#52-push-based-vs-pull-based--2-cách-deploy)
  - [5.3. ArgoCD](#53-argocd)
  - [5.4. FluxCD](#54-fluxcd)
  - [5.5. So sánh ArgoCD vs FluxCD](#55-so-sánh-argocd-vs-fluxcd)
- [6. Pipeline Design cho Microservice](#6-pipeline-design-cho-microservice)
  - [6.1. Pipeline tổng quan](#61-pipeline-tổng-quan)
  - [6.2. Artifact Management](#62-artifact-management)
  - [6.3. Environment Promotion](#63-environment-promotion)
  - [6.4. Database Migration trong CI/CD](#64-database-migration-trong-cicd)
- [7. Testing trong CI/CD Pipeline](#7-testing-trong-cicd-pipeline)
  - [7.1. Testing Pyramid](#71-testing-pyramid)
  - [7.2. Contract Testing](#72-contract-testing)
  - [7.3. Smoke Test & Acceptance Test sau deploy](#73-smoke-test--acceptance-test-sau-deploy)
- [8. CI/CD Tools phổ biến](#8-cicd-tools-phổ-biến)
  - [8.1. Jenkins — CI/CD Server lâu đời nhất](#81-jenkins--cicd-server-lâu-đời-nhất)
- [9. Ví dụ thực tế — E-Commerce CI/CD](#9-ví-dụ-thực-tế--e-commerce-cicd)
- [10. Anti-patterns](#10-anti-patterns)
- [11. Checklist CI/CD cho Microservice](#11-checklist-cicd-cho-microservice)
- [12. Tổng kết](#12-tổng-kết)
- [13. Liên kết liên quan](#13-liên-kết-liên-quan)

---

## 1. Giới thiệu

Trong [doc 12](12-containerization.md) và [doc 13](13-orchestration.md), chúng ta đã biết cách đóng gói microservice thành container và triển khai lên Kubernetes. Nhưng câu hỏi quan trọng là: **Làm sao để đưa code từ developer → production một cách nhanh, an toàn và tự động?**

Với hệ thống microservice gồm 10-50+ services, mỗi service được deploy độc lập bởi team riêng — **CI/CD** (Continuous Integration / Continuous Deployment) trở thành **hạ tầng bắt buộc**, không phải optional.

```d2 title="1. Giới thiệu"
direction: down
manual: Không CI/CD {
 commit: Commit
 build: SSH server — Build / Test tay hoặc skip
 image: Build / Push image thủ công
 prod: SSH production — Pull / Restart
 commit -> build -> image -> prod
}
auto: CI/CD {
 push: Push code
 ci: Lint / Format → Unit / Integration → Security scans
 image: Build image / Push registry
 stage: Deploy Staging / Acceptance tests
 approval: Manual approval hoặc automatic gates
 prod: Production Blue-Green / Canary
 verify: Smoke test / Monitor / Auto-rollback theo policy
 push -> ci -> image -> stage -> approval -> prod -> verify
}
```

Ví dụ monolith 1 repo/1 pipeline/deploy tuần; microservices 20 repos/pipelines, 50 deploys/ngày. Manual deployment minh họa 2–3 giờ, khó truy vết image để rollback; automation minh họa 10–15 phút. Không phải cam kết thời gian cho mọi hệ thống.

---

## 2. CI — Continuous Integration

### 2.1. CI là gì?

**Continuous Integration** (Tích hợp liên tục) là practice trong đó developers **thường xuyên merge code vào shared branch** (main/develop), mỗi lần merge đều được **tự động build và test** để phát hiện lỗi sớm.

```d2 title="2.1. CI là gì?"
direction: right
s0: "Developer commit"
s1: "Push Git"
s2: "CI tự động\nCompile/Build • Unit tests\nLint/Format • Static analysis • Security scan"
s3: "Feedback Pass / Fail"
s0 -> s1
s1 -> s2
s2 -> s3
```

Commit thường xuyên; fix broken build là ưu tiên; mục tiêu build nhanh dưới10phút; test trên environment tương đồng production theo mức phù hợp.

### 2.2. CI Pipeline cho Microservice

```d2 title="2.2. CI Pipeline cho Microservice"
direction: down
s0: "Trigger Push branch / Pull Request"
s1: "1. Checkout code"
s2: "2. Install dependencies"
s3: "3. Lint + Format check"
s4: "4. Unit tests — fast / no external dependencies"
s5: "5. Integration tests — DB / API / Testcontainers"
s6: "6. Security scan — SAST / Dependencies / Secret leaks"
s7: "7. Build Docker image"
s8: "8. Push Registry — ECR / GCR / Docker Hub"
s9: "9. Notify Slack / Teams"
s0 -> s1
s1 -> s2
s2 -> s3
s3 -> s4
s4 -> s5
s5 -> s6
s6 -> s7
s7 -> s8
s8 -> s9
```

| Bước | Mục đích | Tools |
|------|----------|-------|
| Lint + Format | Đảm bảo code style nhất quán | ESLint, Prettier, checkstyle, golangci-lint |
| Unit Tests | Test logic nghiệp vụ, nhanh (< 2 phút) | JUnit, Jest, pytest, Go test |
| Integration Tests | Test với DB, queue, external APIs | Testcontainers, docker-compose |
| Security Scan | Phát hiện vulnerabilities, leaked secrets | Trivy, Snyk, SonarQube, gitleaks |
| Build Image | Tạo Docker image (multi-stage) | Docker, Buildah, kaniko |
| Push Registry | Lưu image có tag (commit SHA, version) | ECR, GCR, DockerHub, Harbor |

### 2.3. Mono-repo vs Multi-repo CI

```d2 title="2.3. Mono-repo vs Multi-repo CI"
direction: down
multi: Multi-repo {
 order: Order Repo
 product: Product Repo
 payment: Payment Repo
 oc: Order CI
 pc: Product CI
 payc: Payment CI
 order -> oc
 product -> pc
 payment -> payc
}
mono: Monorepo e-commerce {
 services: services — order / product / payment
 libs: libs — shared-utils
 infra: infra
 detect: Git diff — detect changed files / dependencies
 affected: Trigger affected-service pipelines
 services -> detect -> affected
 libs -> detect
 infra -> detect
}
```

Multi-repo: CI đơn giản, độc lập nhưng nhiều repos và share code khó. Monorepo: atomic changes/share code/một repo, nhưng cần affected-build tooling như Nx, Turborepo, Bazel, Pants; không đồng nghĩa phải deploy tất cả services cùng lúc.

| Tiêu chí | Multi-repo | Mono-repo |
|----------|-----------|-----------|
| CI complexity | Đơn giản — mỗi repo 1 pipeline | Phức tạp — cần detect changes |
| Build speed | Nhanh — chỉ build 1 service | Cần tooling (cache, affected) |
| Code sharing | Khó — cần publish packages | Dễ — import trực tiếp |
| Atomic changes | Khó — cross-repo PRs | Dễ — 1 commit thay đổi nhiều services |
| Team independence | Cao | Trung bình (shared CI config) |
| Tools | GitHub Actions, GitLab CI | Nx, Turborepo, Bazel, Pants |

### 2.4. Ví dụ — GitHub Actions CI Pipeline

```yaml source="snippets/2-4-vi-du-github-actions-ci-pipeline.yaml"
# .github/workflows/ci.yml — CI Pipeline cho Order Service
name: Order Service CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'services/order-service/**'   # Chỉ trigger khi order-service thay đổi
  pull_request:
    branches: [main]
    paths:
      - 'services/order-service/**'

env:
  SERVICE_NAME: order-service
  REGISTRY: 123456789.dkr.ecr.ap-southeast-1.amazonaws.com
  IMAGE_NAME: order-service

jobs:
  # ───────────────────────────────────────────
  # Job 1: Lint + Unit Tests
  # ───────────────────────────────────────────
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: services/order-service

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
          cache: gradle

      - name: Lint
        run: ./gradlew checkstyleMain

      - name: Unit Tests
        run: ./gradlew test

      - name: Integration Tests
        run: ./gradlew integrationTest
        # Testcontainers tự động start Postgres, Kafka

      - name: Upload test reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-reports
          path: services/order-service/build/reports/

  # ───────────────────────────────────────────
  # Job 2: Security Scan (chạy song song)
  # ───────────────────────────────────────────
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Secret Detection
        uses: gitleaks/gitleaks-action@v2

      - name: Dependency Vulnerability Scan
        uses: snyk/actions/gradle@master
        with:
          args: --project-name=order-service
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  # ───────────────────────────────────────────
  # Job 3: Build + Push Docker Image
  # ───────────────────────────────────────────
  build:
    needs: [test, security]   # Chỉ chạy khi test + security PASS
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'   # Chỉ build image trên main

    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ap-southeast-1

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=semver,pattern={{version}}

      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: services/order-service
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=14-cicd-deployment&snapshot=article&file=snippets%2F2-4-vi-du-github-actions-ci-pipeline.yaml)

---

## 3. CD — Continuous Delivery vs Continuous Deployment

### 3.1. Phân biệt Delivery vs Deployment

```d2 title="3.1. Phân biệt Delivery vs Deployment"
direction: down
delivery: Continuous Delivery {
 code: Code
 build: Build
 test: Test
 stage: Staging
 approval: Manual Approval
 prod: Production
 code -> build -> test -> stage -> approval -> prod
}
deployment: Continuous Deployment {
 code: Code
 build: Build
 test: Test
 stage: Staging
 verify: Acceptance / Metrics Gates
 prod: Production — Automatic
 code -> build -> test -> stage -> verify -> prod
}
```

Delivery giữ code sẵn sàng deploy nhưng có approval trước prod, thường gặp hệ thống regulated/critical. Deployment tự promote commits đã qua gates, cần test/monitoring/rollback mạnh; lựa chọn còn phụ thuộc risk policy, không chỉ loại doanh nghiệp.

| Tiêu chí | Continuous Delivery | Continuous Deployment |
|----------|--------------------|-----------------------|
| Approval | Manual (1 click) | Automatic |
| Deploy frequency | Khi cần (daily/weekly) | Mỗi commit (nhiều lần/ngày) |
| Risk | Thấp (có human check) | Cần monitoring + auto-rollback |
| Test coverage yêu cầu | Cao | Rất cao |
| Phù hợp | Banking, healthcare, enterprise | SaaS, startup, consumer apps |
| Ví dụ công ty | Capital One, Target | Netflix, Amazon, Etsy |

### 3.2. CD Pipeline cho Microservice

```d2 title="CD Pipeline — Image tới Production"
direction: right
ci: "CI đã pass\nImage order-service:a1b2c3d"
staging: "1. Deploy Staging\nUpdate image tag / manifests\nApply → Wait rollout"
test: "2. Acceptance Tests\nAPI integration • E2E\nCypress / Playwright\nk6 / Gatling • Pact"
approval: "3. Manual Approval — Delivery\nhoặc Auto — Deployment"
prod: "4. Production\nBlue-Green / Canary / Rolling\nProgressive rollout"
verify: "5. Post-deploy Verification\nSmoke tests\nError rate • Latency • Throughput\nAuto-rollback khi vượt threshold"
ci -> staging -> test -> approval -> prod -> verify
```

---

## 4. Deployment Strategies

### 4.1. Recreate

```d2 title="4.1. Recreate"
direction: right
s0: "Stop tất cả3 v1 instances"
s1: "DOWNTIME — không instance phục vụ"
s2: "Start tất cả3 v2 instances"
s0 -> s1
s1 -> s2
```

Recreate đơn giản, tránh mixed app versions nhưng có downtime. Phù hợp dev/staging hoặc workload chấp nhận gián đoạn; database/state compatibility vẫn cần xem xét.

```yaml source="snippets/4-1-recreate.yaml"
# Kubernetes — Recreate Strategy
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  strategy:
    type: Recreate       # Tắt hết cũ → bật hết mới
  template:
    spec:
      containers:
        - name: order-service
          image: order-service:v2.0
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=14-cicd-deployment&snapshot=article&file=snippets%2F4-1-recreate.yaml)

### 4.2. Rolling Update

```d2 title="4.2. Rolling Update"
direction: right
s0: "3 × v1 ready"
s1: "3 × v1 + 1 × v2 starting"
s2: "v2 ready → 2 × v1 + 1 × v2"
s3: "Lặp lại → 1 × v1 + 2 × v2"
s4: "3 × v2 ready"
s0 -> s1
s1 -> s2
s2 -> s3
s3 -> s4
```

Rolling là default Deployment strategy K8s. Tốn thêm surge capacity ít hơn blue-green; v1/v2 cùng tồn tại nên cần backward compatibility. Rollback rolling có thể mất vài phút; readiness/draining/capacity mới quyết định downtime, không có bảo đảm zero downtime tự động.

```yaml source="snippets/4-2-rolling-update.yaml"
# Kubernetes — Rolling Update Strategy (MẶC ĐỊNH)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # Tối đa thêm 1 pod mới (tổng 4 pods tạm thời)
      maxUnavailable: 0    # Không cho phép pod nào unavailable (zero downtime)
  template:
    spec:
      containers:
        - name: order-service
          image: order-service:v2.0
          readinessProbe:         # BẮT BUỘC — K8s dùng để biết v2 ready
            httpGet:
              path: /actuator/health/readiness
              port: 8082
            initialDelaySeconds: 10
            periodSeconds: 5
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=14-cicd-deployment&snapshot=article&file=snippets%2F4-2-rolling-update.yaml)

```bash source="snippets/4-2-rolling-update-2.sh"
# Deploy + monitoring
kubectl set image deployment/order-service order-service=order-service:v2.0
kubectl rollout status deployment/order-service    # Watch progress
kubectl rollout history deployment/order-service   # Xem revision history

# Rollback nếu có vấn đề
kubectl rollout undo deployment/order-service                    # Về revision trước
kubectl rollout undo deployment/order-service --to-revision=3    # Về revision cụ thể
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=14-cicd-deployment&snapshot=article&file=snippets%2F4-2-rolling-update-2.sh)

### 4.3. Blue-Green Deployment

```d2 title="4.3. Blue-Green Deployment"
direction: down
before: Trước switch {
 lb: Load Balancer / Ingress
 blue: BLUE v1 — 3 instances LIVE
 green: GREEN v2 — 3 instances IDLE / Test
 lb -> blue: 100%
 lb -- green: 0% production {style.stroke-dash: 5}
}
after: Green test pass {
 lb: Load Balancer / Ingress
 blue: BLUE v1 — IDLE giữ rollback
 green: GREEN v2 — 3 instances LIVE
 lb -> green: 100%
 lb -- blue: 0% production {style.stroke-dash: 5}
}
```

Rollback bằng switch về Blue thường nhanh, cần giữ khoảng gấp đôi app capacity và DB backward compatibility. Traffic propagation, in-flight requests, caches và connections có thể khiến v1/v2 overlap ngắn; không khẳng định không bao giờ lẫn versions.

```yaml source="snippets/4-3-blue-green-deployment.yaml"
# Blue-Green trên Kubernetes bằng Service selector
# ───────────────────────────────────────────────

# Deployment BLUE (v1 — đang live)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
      version: blue
  template:
    metadata:
      labels:
        app: order-service
        version: blue
    spec:
      containers:
        - name: order-service
          image: order-service:v1.0

---
# Deployment GREEN (v2 — deploy mới)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
      version: green
  template:
    metadata:
      labels:
        app: order-service
        version: green
    spec:
      containers:
        - name: order-service
          image: order-service:v2.0

---
# Service — Switch traffic bằng selector
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
    version: blue        # ← Đổi thành "green" để switch traffic
  ports:
    - port: 80
      targetPort: 8082
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=14-cicd-deployment&snapshot=article&file=snippets%2F4-3-blue-green-deployment.yaml)

```bash source="snippets/4-3-blue-green-deployment-2.sh"
# Switch traffic: Blue → Green
kubectl patch service order-service \
  -p '{"spec":{"selector":{"version":"green"}}}'

# Rollback: Green → Blue (instant!)
kubectl patch service order-service \
  -p '{"spec":{"selector":{"version":"blue"}}}'

# Cleanup Blue sau khi Green stable
kubectl delete deployment order-service-blue
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=14-cicd-deployment&snapshot=article&file=snippets%2F4-3-blue-green-deployment-2.sh)

### 4.4. Canary Deployment

```d2 title="4.4. Canary Deployment"
direction: right
s0: "Canary5%: stable v1 95%, v2 5%\nVí dụ9 stable /1 canary instances"
s1: "Monitor error rate / Latency / Success rate"
s2: "Metrics OK → stable75%, v2 25%\nVí dụ7 stable /3 canary instances"
s3: "Metrics OK → 50% → 75% → 100%"
s4: "100% v2 — ví dụ10 instances, remove v1"
s0 -> s1
s1 -> s2
s2 -> s3
s3 -> s4
```

Traffic weights và replica counts là hai cấu hình khác nhau; số replicas trong hình không tự tạo đúng tỷ lệ routing. Canary giảm blast radius, cần monitoring/alerting và compatibility dài hơn; auto-abort khi metrics xấu.

```yaml source="snippets/4-4-canary-deployment.yaml"
# Canary với Istio VirtualService
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
    - order-service
  http:
    - route:
        - destination:
            host: order-service
            subset: stable
          weight: 95
        - destination:
            host: order-service
            subset: canary
          weight: 5              # 5% traffic → canary

---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: order-service
spec:
  host: order-service
  subsets:
    - name: stable
      labels:
        version: v1
    - name: canary
      labels:
        version: v2
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=14-cicd-deployment&snapshot=article&file=snippets%2F4-4-canary-deployment.yaml)

**Progressive Delivery với Flagger** — tự động hóa Canary:

```yaml source="snippets/4-4-canary-deployment-2.yaml"
# Flagger — Auto Canary Deployment
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: order-service
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  service:
    port: 80
    targetPort: 8082
  analysis:
    interval: 1m               # Check mỗi phút
    threshold: 5               # Max 5 lần failed → rollback
    maxWeight: 50              # Tối đa 50% traffic cho canary
    stepWeight: 10             # Tăng 10% mỗi bước
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99              # Yêu cầu success rate >= 99%
        interval: 1m
      - name: request-duration
        thresholdRange:
          max: 500             # Latency p99 <= 500ms
        interval: 1m
    webhooks:
      - name: smoke-test
        type: pre-rollout
        url: http://flagger-loadtester/
        metadata:
          cmd: "curl -s http://order-service-canary/actuator/health"
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=14-cicd-deployment&snapshot=article&file=snippets%2F4-4-canary-deployment-2.yaml)

### 4.5. A/B Testing

```d2 title="4.5. A/B Testing"
direction: right
lb: "LB / Ingress — Targeting Rules"
beta: "v2 — Beta users"
us: "v2 — US users"
stable: "v1 — Default"
lb -> beta: "X-Beta=true"
lb -> us: "Cookie region=US"
lb -> stable: "Còn lại"
```

A/B/targeted routing tách metrics theo cohort, đánh giá business outcome. Canary cũng có thể dùng deterministic cohorts, không bắt buộc routing ngẫu nhiên.

```yaml source="snippets/4-5-a-b-testing.yaml"
# A/B Testing với Istio — Route dựa trên header
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
    - order-service
  http:
    # Rule 1: Beta users → v2
    - match:
        - headers:
            x-beta-user:
              exact: "true"
      route:
        - destination:
            host: order-service
            subset: v2-beta
    # Rule 2: Default → v1
    - route:
        - destination:
            host: order-service
            subset: v1-stable
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=14-cicd-deployment&snapshot=article&file=snippets%2F4-5-a-b-testing.yaml)

### 4.6. Rolling Update vs Blue-Green — Khác nhau thế nào?

Hai strategy này đều **zero downtime** nên dễ nhầm. Điểm khác biệt cốt lõi:

```
ROLLING UPDATE — Thay TỪNG CON, v1 + v2 LẪN LỘN:
──────────────────────────────────────────────────

  Thời điểm 1:  [v1] [v1] [v2]    ← User A gọi v1, User B gọi v2
  Thời điểm 2:  [v1] [v2] [v2]    ← Vẫn lẫn lộn
  Thời điểm 3:  [v2] [v2] [v2]    ← Xong

  → Trong quá trình rollout, CÓ LÚC v1 + v2 chạy cùng
  → API phải backward compatible
  → Rollback = rolling lại từng pod → CHẬM (vài phút)
  → Resource: chỉ cần thêm 1-2 pod tạm


BLUE-GREEN — Deploy FULL BỘ V2, rồi SWITCH 1 LẦN:
───────────────────────────────────────────────────

  Thời điểm 1:  [v1] [v1] [v1] ← 100% traffic
                [v2] [v2] [v2] ← 0% traffic (đang test)

  Thời điểm 2:  [v1] [v1] [v1] ← 0% traffic (giữ lại phòng rollback)
                [v2] [v2] [v2] ← 100% traffic ← SWITCH!

  → KHÔNG BAO GIỜ lẫn lộn — 100% users trên cùng 1 version
  → Rollback = switch traffic về v1 → INSTANT (vài giây)
  → Resource: cần GẤP ĐÔI (giữ cả Blue + Green)
```

| Điểm so sánh | Rolling Update | Blue-Green |
|---------------|----------------|------------|
| v1 + v2 lẫn lộn? | ⚠️ **Có** — trong quá trình rollout | ✅ **Không** — switch 1 lần |
| Tốc độ rollback | Chậm (vài phút, rolling lại) | **Instant** (vài giây, switch traffic) |
| Resource cần | ~1× (thêm 1-2 pod) | **2×** (giữ 2 bộ full) |
| Khi nào dùng? | Hầu hết services, API backward compatible | Service critical, cần instant rollback, hoặc v1/v2 không thể chạy cùng |

### 4.7. So sánh tổng hợp các Deployment Strategies

| Strategy | Downtime | Rollback | Resource cần | Complexity | Use case |
|----------|:--------:|----------|:------------:|:----------:|----------|
| **Recreate** | ❌ Có | Chậm (redeploy v1) | 1× | ⭐ | Dev/staging, batch jobs |
| **Rolling Update** | ✅ Không | Nhanh (rollout undo) | 1.x× | ⭐⭐ | Default, hầu hết services |
| **Blue-Green** | ✅ Không | Instant (switch) | 2× | ⭐⭐⭐ | Critical services, DB migration |
| **Canary** | ✅ Không | Nhanh (stop canary) | 1.x× | ⭐⭐⭐⭐ | High-traffic, data-driven |
| **A/B Testing** | ✅ Không | Nhanh | 1.x× | ⭐⭐⭐⭐⭐ | Feature testing, UX experiments |

```d2 title="4.7. So sánh tổng hợp các Deployment Strategies"
direction: down
n1: "Chọn Deployment Strategy"
n2: "Service critical?" {
  shape: diamond
}
n3: "Cần zero downtime?" {
  shape: diamond
}
n4: "Recreate"
n5: "Rolling Update"
n6: "Cần instant rollback?" {
  shape: diamond
}
n7: "Blue-Green"
n8: "Cần progressive rollout?" {
  shape: diamond
}
n9: "Dựa trên user group?" {
  shape: diamond
}
n10: "A/B Testing"
n11: "Canary"
n1 -> n2
n2 -> n3: "Không"
n3 -> n4: "Không"
n3 -> n5: "Có"
n2 -> n6: "Có"
n6 -> n7: "Có"
n6 -> n8: "Không"
n8 -> n9: "Có"
n9 -> n10: "Có"
n9 -> n11: "Không"
n8 -> n5: "Không"
```

---

## 5. GitOps

### 5.1. GitOps là gì? Tại sao cần?

Trước khi hiểu GitOps, hãy xem **vấn đề thực tế** khi không có nó:

```
❌ VẤN ĐỀ KHI KHÔNG CÓ GITOPS:
────────────────────────────────

  20 microservices, 3 environments (dev, staging, prod)
  = 60 deployments cần quản lý

  Tình huống thường gặp:

  1. "Cluster đang chạy version nào?"
     → SSH vào cluster, kubectl get pods, đọc image tag
     → Mỗi service 1 version khác nhau → tra cứu MỆT
     → Không ai nhớ ai deploy gì, lúc nào 😰

  2. "Ai đã sửa config trên production?"
     → DevOps A chạy: kubectl edit deployment ... (sửa trực tiếp)
     → Không ai biết, không có record
     → 2 tuần sau bug → "ai sửa cái này?" → không ai nhận 🤷

  3. "Rollback production về trạng thái hôm qua"
     → Trạng thái hôm qua là gì? Image tag gì? Config gì?
     → Không ai nhớ → tra CI logs → thiếu thông tin 😫

  4. "Staging và Production khác nhau thế nào?"
     → Không biết — phải SSH vào 2 cluster, diff thủ công
     → Thường khác nhau do sửa tay → "staging OK, prod lỗi" 🤯

  TÓM LẠI: Không có 1 NƠI TRUNG TÂM nào
  cho biết hệ thống ĐANG ở trạng thái nào.
```

**GitOps** giải quyết bằng 1 ý tưởng đơn giản: **Ghi tất cả trạng thái mong muốn của hệ thống vào Git. Ai muốn thay đổi gì → sửa trong Git. Có agent tự động đảm bảo cluster luôn giống với Git.**

```
✅ CÓ GITOPS — GIT LÀ "SỔ CHÂN LÝ":
──────────────────────────────────────

  Mọi thứ về hệ thống đều nằm trong 1 Git repo:

  k8s-manifests/              ← "Sổ chân lý"
  ├── order-service/
  │   ├── deployment.yaml     ← image: order-service:v2.1.0, replicas: 3
  │   ├── service.yaml
  │   └── configmap.yaml
  ├── product-service/
  │   └── ...
  └── payment-service/
      └── ...

  Giờ mọi câu hỏi đều TRẢ LỜI ĐƯỢC:

  1. "Cluster đang chạy version nào?"
     → Mở Git repo → xem deployment.yaml → thấy image tag
     → git log → ai đổi, lúc nào, vì sao (commit message)

  2. "Ai đã sửa config trên production?"
     → git log -- configmap.yaml
     → Rõ ràng: ai, lúc nào, PR nào, ai approve

  3. "Rollback production về trạng thái hôm qua"
     → git revert <commit> → Agent tự động apply → DONE!

  4. "Staging vs Production khác nhau thế nào?"
     → diff overlays/staging/ overlays/production/ → rõ ràng
```

```d2 title="5.1. GitOps là gì? Tại sao cần?"
direction: right
s0: "Developer đổi image order-service:v2.1 trong deployment.yaml"
s1: "PR → Review / Approve → Merge main"
s2: "ArgoCD phát hiện Git thay đổi"
s3: "Compare desired Git state với actual Cluster"
s4: "Sync / Reconcile Cluster khi policy cho phép"
s5: "Tiếp tục drift detection / Self-heal theo cấu hình"
s0 -> s1
s1 -> s2
s2 -> s3
s3 -> s4
s4 -> s5
```

Ví dụ polling mỗi3phút, có thể kết hợp webhooks. Auto-sync/self-heal phải được bật theo policy; không mặc định mọi thay đổi tay đều tự revert.

Tóm lại: **"Muốn thay đổi gì trên cluster? Đừng SSH vào sửa — hãy sửa trong Git, có PR review, rồi agent tự deploy."**

> **❓ "Deploy xong rồi, sao agent vẫn cần check Git liên tục?"**
>
> Vì agent không chỉ deploy — mà còn **canh gác** cluster. Vấn đề là sau khi deploy, vẫn có người **sửa tay trực tiếp** trên cluster bằng `kubectl`, làm cluster **lệch khỏi Git** (gọi là "drift"). Agent liên tục kiểm tra để **tự động revert** những thay đổi tay đó.

> **❓ "Nhưng tại sao có người lại sửa tay trên cluster? Sửa Git rồi để agent deploy không được à?"**
>
> Đúng là **nên** làm vậy. Nhưng thực tế không phải lúc nào cũng được:

```
TẠI SAO CÓ NGƯỜI SỬA TAY TRÊN CLUSTER?
────────────────────────────────────────

  1. 🔥 DEBUG KHẨN CẤP — 3AM production sập, users la hét
     → Tạo PR → chờ review → merge → ArgoCD sync = 15-30 phút
     → kubectl scale / kubectl set env = 5 GIÂY
     → Lúc cháy nhà, ai cũng chọn cách nhanh nhất
     → Fix xong, nói "mai clean up" → rồi QUÊN 😅

  2. 🧪 THỬ NGHIỆM NHANH — Debug trên staging
     → "Tăng memory lên xem hết OOM không"
     → kubectl set resources ... → test xong → quên revert

  3. 👴 THÓI QUEN CŨ — Team chưa quen GitOps
     → DevOps quen thời chưa GitOps: SSH vào sửa
     → "kubectl edit nhanh hơn tạo PR mà"

  4. 👥 NHIỀU NGƯỜI CÓ QUYỀN — Team 20 người đều có kubectl
     → Dev A sửa replicas, Dev B sửa env, Dev C sửa resources
     → Không ai kiểm soát, không ai biết ai sửa gì

  → GitOps agent KHÔNG CẤM người ta sửa tay
  → Nhưng agent SẼ REVERT lại — như "bảo vệ" cho cluster
  → Muốn thay đổi thật? Sửa trong Git, tạo PR — cách DUY NHẤT
```

```
VÍ DỤ CỤ THỂ:
──────────────

  9:00 AM — ArgoCD deploy từ Git: order-service:v2.1, replicas: 3 ✅

  11:00 AM — DevOps Minh debug lỗi, chạy kubectl trực tiếp:
     kubectl scale deployment order-service --replicas=5
     kubectl set env deployment/order-service LOG_LEVEL=DEBUG

     → Cluster bây giờ: replicas=5, LOG_LEVEL=DEBUG
     → Git vẫn ghi:     replicas=3, không có LOG_LEVEL
     → DRIFT! Cluster ≠ Git

  Minh fix xong bug, quên revert lại. Đi ăn trưa 🍜

  ❌ KHÔNG CÓ AGENT:
     → Cluster chạy replicas=5 + DEBUG log mãi mãi
     → Tháng sau: "Sao bill server tăng?" "Log đầy disk?"
     → Không ai nhớ ai sửa gì 😰

  ✅ CÓ AGENT (ArgoCD reconcile mỗi 3 phút):
     → 11:03 AM: ArgoCD phát hiện cluster ≠ Git
     → Tự động revert: replicas=3, xóa LOG_LEVEL=DEBUG
     → Cluster luôn giống Git ✅
     → Minh muốn đổi replicas=5 thật?
       → Sửa deployment.yaml trong Git, tạo PR, được approve → ArgoCD apply
       → Có record rõ ràng: ai đổi, lúc nào, vì sao
```

```
GITOPS — 4 NGUYÊN TẮC:
───────────────────────

  1. DECLARATIVE — Mô tả hệ thống bằng file (K8s YAML, Helm)
     "Tôi muốn 3 pods order-service v2.1" — KHÔNG phải "chạy lệnh X, Y, Z"

  2. VERSIONED — Tất cả lưu trong Git
     → Ai sửa gì, lúc nào, vì sao → git log cho biết hết

  3. AUTOMATED — Agent tự động apply
     → Merge PR xong → ArgoCD/Flux tự deploy, không cần chạy lệnh

  4. RECONCILED — Agent liên tục đồng bộ
     → Ai sửa tay trên cluster → agent phát hiện → revert về Git
     → Cluster LUÔN giống Git — không bao giờ "drift"

```

> **❓ "Khoan — merge vào main thì CI/CD trigger rồi kubectl apply vào cluster luôn chứ? Cần agent làm gì?"**
>
> Đúng! Cách đó gọi là **Push-based** — hoạt động tốt và rất nhiều team dùng. GitOps (Pull-based) là **cách khác**, giải quyết 3 vấn đề mà Push-based gặp phải khi hệ thống lớn lên.

### 5.2. Push-based vs Pull-based — 2 cách deploy

```d2 title="5.2. Push-based vs Pull-based — 2 cách deploy"
direction: down
push: Push-based {
 git: Git — Merge PR
 ci: Jenkins / GitHub Actions
 apply: kubectl apply — CI credentials
 cluster: Cluster
 git -> ci -> apply -> cluster
}
pull: Pull-based GitOps {
 git: Git — desired state
 cluster: Cluster {
  agent: ArgoCD / Flux
  resources: Workloads — actual state
  agent -> resources: Apply / Reconcile
 }
 cluster.agent -> git: Pull / Watch
}
```

Push-based có thể vận hành tốt, không bắt buộc thêm ArgoCD/Flux. Pull-based chuyển cluster mutation quyền sang agent, CI chỉ cập nhật config repo; vẫn cần bảo vệ agent/repo credentials và rollout gates.

```
VẬY TẠI SAO CẦN GITOPS? PUSH-BASED CÓ 3 VẤN ĐỀ:
──────────────────────────────────────────────────

  VẤN ĐỀ 1: SECURITY — CI/CD cần credentials truy cập cluster
  ┌──────────────────────────────────────────────────────────┐
  │  Jenkins/GitHub Actions phải lưu:                        │
  │  • kubeconfig / Service Account token / AWS credentials  │
  │                                                          │
  │  → Credentials nằm ở CI server (BÊN NGOÀI cluster)       │
  │  → Bị hack CI = hack được cluster production 😱          │
  │  → 20 pipelines = 20 chỗ lưu credentials = 20 rủi ro     │
  │                                                          │
  │  GitOps: Agent chạy TRONG cluster                        │
  │  → Không cần expose credentials ra ngoài                 │
  │  → Agent chỉ cần READ access tới Git repo                │
  └──────────────────────────────────────────────────────────┘

  VẤN ĐỀ 2: DRIFT — CI/CD không phát hiện ai sửa tay
  ┌──────────────────────────────────────────────────────────┐
  │  CI/CD chỉ chạy KHI CÓ TRIGGER (push, merge)             │
  │  Giữa 2 lần deploy → không ai canh cluster               │
  │                                                          │
  │  → Ai đó kubectl edit trên cluster                       │
  │  → CI/CD KHÔNG BIẾT — không có gì trigger                │
  │  → Cluster drift — không ai phát hiện                    │
  │                                                          │
  │  GitOps: Agent check LIÊN TỤC (mỗi 3 phút)               │
  │  → Phát hiện drift → tự revert                           │
  │  → Kể cả không ai deploy gì mới                          │
  └──────────────────────────────────────────────────────────┘

  VẤN ĐỀ 3: TRẠNG THÁI THẬT — "Cluster đang chạy cái gì?"
  ┌──────────────────────────────────────────────────────────┐
  │  CI/CD: "kubectl apply thành công" ✅                    │
  │  Nhưng: Pod có chạy không? OOMKill? CrashLoop?           │
  │  → CI/CD push xong là xong, KHÔNG theo dõi tiếp          │
  │                                                          │
  │  GitOps (ArgoCD UI):                                     │
  │  → Dashboard realtime:                                   │
  │    ✅ Synced — cluster = Git                             │
  │    ⚠️ OutOfSync — ai đó sửa tay / deploy pending         │
  │    ❌ Degraded — pod crash, lỗi                          │
  │  → Luôn biết cluster THỰC SỰ đang ở trạng thái nào       │
  └──────────────────────────────────────────────────────────┘
```

**Cả 2 cách đều đúng** — Push-based không sai. GitOps là bước tiến hóa khi hệ thống lớn hơn:

| | Push-based (CI/CD truyền thống) | Pull-based (GitOps) |
|---|---|---|
| Ai apply vào cluster? | CI/CD pipeline push vào | Agent trong cluster tự pull |
| Credentials | CI cần quyền truy cập cluster ⚠️ | Agent trong cluster, không expose ✅ |
| Phát hiện drift? | ❌ Không — chỉ chạy khi trigger | ✅ Có — check liên tục |
| Biết cluster đang chạy gì? | Phải SSH vào check | ArgoCD UI realtime |
| Audit trail | CI logs (có thể mất) | Git history (vĩnh viễn) |
| Phù hợp | Team nhỏ, bắt đầu, hệ thống đơn giản | Production lớn, cần security + kiểm soát |
| Tools | Jenkins, GitHub Actions, GitLab CI | ArgoCD, FluxCD, Rancher Fleet |

### 5.3. ArgoCD

```d2 title="ArgoCD — GitOps Controller"
direction: right
git: "Git Repo\nk8s-manifests/base\nk8s-manifests/staging\nk8s-manifests/prod"
ui: ArgoCD UI / CLI
cluster: Kubernetes Cluster {
 argo: "ArgoCD\nAPI Server • Repo Server\nApplication Controller • Redis cache\nSynced / OutOfSync / Degraded"
}
cluster.argo -> git: Pull
ui -- cluster.argo: Dashboard / Sync status
# Icons: https://icons.d2lang.com/
cluster.icon: "https://icons.d2lang.com/azure/_Companies/Kubernetes.svg"
```

```yaml source="snippets/5-3-argocd.yaml"
# ArgoCD Application — Deploy order-service
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: order-service
  namespace: argocd
spec:
  project: default

  source:
    repoURL: https://github.com/company/k8s-manifests.git
    targetRevision: main
    path: services/order-service/overlays/production
    # Hoặc Helm:
    # path: charts/order-service
    # helm:
    #   valueFiles:
    #     - values-production.yaml

  destination:
    server: https://kubernetes.default.svc
    namespace: production

  syncPolicy:
    automated:
      prune: true           # Xóa resources không còn trong Git
      selfHeal: true         # Tự sửa nếu ai đó manual edit cluster
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        maxDuration: 3m
        factor: 2
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=14-cicd-deployment&snapshot=article&file=snippets%2F5-3-argocd.yaml)

```bash
# ArgoCD CLI
argocd app list                                    # List applications
argocd app get order-service                       # Status chi tiết
argocd app sync order-service                      # Force sync
argocd app rollback order-service                  # Rollback
argocd app diff order-service                      # Xem diff Git vs Cluster
argocd app history order-service                   # Deployment history
```

### 5.4. FluxCD

```
FLUXCD — LIGHTWEIGHT GITOPS:
────────────────────────────

  FluxCD v2 chạy như set of controllers trên K8s.
  Nhẹ hơn ArgoCD, không có UI mặc định.

  Core Components:
  ┌────────────────────────────────────────────────────┐
  │  Source Controller   — Watch Git repos, Helm repos │
  │  Kustomize Controller — Apply Kustomize overlays   │
  │  Helm Controller     — Manage Helm releases        │
  │  Notification Controller — Alerts (Slack, Teams)   │
  │  Image Automation    — Auto update image tags      │
  └────────────────────────────────────────────────────┘
```

```yaml source="snippets/5-4-fluxcd.yaml"
# FluxCD — GitRepository + Kustomization
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: k8s-manifests
  namespace: flux-system
spec:
  interval: 1m           # Check Git mỗi phút
  url: https://github.com/company/k8s-manifests.git
  ref:
    branch: main

---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: order-service
  namespace: flux-system
spec:
  interval: 5m
  path: ./services/order-service/overlays/production
  prune: true
  sourceRef:
    kind: GitRepository
    name: k8s-manifests
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: order-service
      namespace: production
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=14-cicd-deployment&snapshot=article&file=snippets%2F5-4-fluxcd.yaml)

### 5.5. So sánh ArgoCD vs FluxCD

| Tiêu chí | ArgoCD | FluxCD |
|----------|--------|--------|
| UI | ✅ Web UI đẹp, trực quan | ❌ Không có (cần Weave GitOps UI) |
| CLI | Mạnh | Mạnh |
| Multi-cluster | ✅ Quản lý từ 1 ArgoCD | ⚠️ Mỗi cluster cần Flux riêng |
| Helm support | ✅ | ✅ |
| Kustomize | ✅ | ✅ |
| RBAC | ✅ Fine-grained | ⚠️ Dùng K8s RBAC |
| Image auto-update | Plugin | ✅ Built-in |
| Resource usage | Cao hơn | Nhẹ hơn |
| Learning curve | Trung bình | Thấp |
| Community | Lớn hơn, CNCF Graduated | CNCF Graduated |
| Phù hợp | Enterprise, multi-cluster, cần UI | Lightweight, đơn giản, CI/CD native |

---

## 6. Pipeline Design cho Microservice

### 6.1. Pipeline tổng quan

```d2 title="6.1. Pipeline tổng quan"
direction: down
s0: "Developer push Feature Branch → PR → Main"
s1: "Per-service CI\nLint → Tests → Security Scan → Build Docker → Push Registry"
s2: "Image order-service:a1b2c3d"
s3: "Bot/CI cập nhật image tag trong GitOps Config Repo\nAuto PR → Review / Merge"
s4: "ArgoCD / Flux sync Staging"
s5: "Acceptance Tests"
s6: "Promote Production theo gates"
s0 -> s1
s1 -> s2
s2 -> s3
s3 -> s4
s4 -> s5
s5 -> s6
```

### 6.2. Artifact Management

```
ARTIFACT MANAGEMENT — IMAGE TAGGING STRATEGY:
──────────────────────────────────────────────

  ❌ KHÔNG dùng :latest — không biết đang chạy version nào

  ✅ Strategies:

  1. Git SHA (commit hash):
     order-service:a1b2c3d
     → Traceability: image → commit → code changes

  2. Semantic Versioning:
     order-service:2.1.0
     → Human-readable, rõ ràng major/minor/patch

  3. Kết hợp:
     order-service:2.1.0-a1b2c3d
     → Cả version lẫn commit

  4. Build number:
     order-service:build-1234
     → CI build ID

  Best practice:
  ┌────────────────────────────────────────────────────────┐
  │  • IMMUTABLE tags — không push lại cùng tag            │
  │  • Scan image trước khi push (Trivy, Grype)            │
  │  • Sign image (cosign, Notary) — verify integrity      │
  │  • Retention policy — xóa images cũ (giữ 30 ngày)      │
  │  • Multi-arch build (amd64, arm64)                     │
  └────────────────────────────────────────────────────────┘
```

### 6.3. Environment Promotion

```d2 title="6.3. Environment Promotion"
direction: right
s0: "DEV — Auto deploy"
s1: "STAGING — Auto deploy"
s2: "UAT — Manual approval"
s3: "PROD — Manual / Auto theo policy"
s0 -> s1
s1 -> s2
s2 -> s3
```

Cùng một immutable image qua mọi environment; chỉ config/env/ConfigMaps/Secrets khác nhau. Cấu trúc GitOps giữ dạng text:

```text
┌────────────────────────────────────────────┐
  │  k8s-manifests/                            │
  │  └── services/                             │
  │      └── order-service/                    │
  │          ├── base/                         │
  │          │   ├── deployment.yaml           │
  │          │   ├── service.yaml              │
  │          │   └── kustomization.yaml        │
  │          └── overlays/                     │
  │              ├── dev/                      │
  │              │   └── kustomization.yaml    │
  │              ├── staging/                  │
  │              │   └── kustomization.yaml    │
  │              └── production/               │
  │                  └── kustomization.yaml    │
  └────────────────────────────────────────────┘
```

### 6.4. Database Migration trong CI/CD

```d2 title="6.4. Database Migration trong CI/CD"
direction: right
s0: "Expand trước app\nADD full_name nullable\nBackfill từ customer_name"
s1: "Deploy compatible app v2\nĐọc fallback / Dual-write cũ+mới\nCùng chạy với v1"
s2: "Verify backfill / Chuyển reads / Hết rollback window"
s3: "Contract\nApp không còn đọc/ghi cột cũ\nDROP customer_name"
s0 -> s1
s1 -> s2
s2 -> s3
```

Rename cột ngay sẽ làm v1 `SELECT customer_name` lỗi. Trước khi drop cột, phải chắc chắn không còn app/query/job cũ tham chiếu cột đó; không drop khi v2 vẫn dual-write.

---

## 7. Testing trong CI/CD Pipeline

### 7.1. Testing Pyramid

```d2 title="7.1. Testing Pyramid"
direction: up
unit: "Unit Tests — đáy rộng\nJUnit / Jest / pytest / Go\nNhiều • Nhanh • Rẻ • CI"
integration: "Integration / Contract\nTestcontainers • Pact • REST-assured\nDB / API / Messaging"
e2e: "E2E — đỉnh hẹp\nCypress / Playwright\nÍt • Chậm • Đắt • Staging"
unit -> integration -> e2e: Phạm vi test rộng hơn
```

Tỷ lệ ví dụ70% unit /20% integration /10% E2E; mục tiêu thời gian tương ứng <2/<5/<15phút. Đây là guideline minh họa, không quota bắt buộc cho mọi codebase.

### 7.2. Contract Testing

```d2 title="7.2. Contract Testing"
direction: right
order: "Order — Consumer\nExpect {id:number, name:string, price:number}"
broker: "Pact Broker — contract artifact"
product: "Product — Provider\nVerify API against consumer contract"
pass: "Pass → đủ điều kiện deploy"
fail: "Breaking → CI FAIL trước production"
order -> broker: "Publish contract"
broker -> product
product -> pass: "Match"
product -> fail: "Mismatch"
```

### 7.3. Smoke Test & Acceptance Test sau deploy

```
POST-DEPLOY TESTING:
────────────────────

  ┌─────────────────────────────────────────────────────────┐
  │  1. SMOKE TEST (ngay sau deploy — 1-2 phút):            │
  │     • Health check endpoint: GET /actuator/health       │
  │     • Basic API call: GET /api/orders?limit=1           │
  │     • Verify DB connection                              │
  │     • Verify messaging (Kafka/SQS) connection           │
  │                                                         │
  │  2. ACCEPTANCE TEST (sau smoke — 5-10 phút):            │
  │     • Critical business flows:                          │
  │       - Tạo order                                       │
  │       - Thanh toán                                      │
  │       - Cancel order                                    │
  │     • Performance baseline check                        │
  │                                                         │
  │  3. MONITORING (liên tục — 15-30 phút):                 │
  │     • Error rate < threshold (< 1%)                     │
  │     • Latency p99 < threshold (< 500ms)                 │
  │     • Throughput stable                                 │
  │     • Nếu FAIL → AUTO ROLLBACK                          │
  └─────────────────────────────────────────────────────────┘
```

---

## 8. CI/CD Tools phổ biến

| Tool | Loại | Hosting | Đặc điểm | Phù hợp |
|------|------|---------|-----------|---------|
| **GitHub Actions** | CI/CD | Cloud (GitHub) | YAML workflow, marketplace, free cho public repo | Teams dùng GitHub |
| **GitLab CI** | CI/CD | Cloud / Self-hosted | Built-in GitLab, Auto DevOps, container registry | Teams dùng GitLab |
| **Jenkins** | CI/CD | Self-hosted | Extensible (1800+ plugins), Jenkinsfile, mature | Enterprise, legacy |
| **CircleCI** | CI/CD | Cloud | Fast, Docker-first, caching mạnh | Startup, mid-size |
| **ArgoCD** | CD (GitOps) | Self-hosted (K8s) | Pull-based, UI đẹp, multi-cluster | K8s GitOps |
| **FluxCD** | CD (GitOps) | Self-hosted (K8s) | Lightweight, CNCF, image automation | K8s GitOps |
| **Tekton** | CI/CD | Self-hosted (K8s) | K8s-native pipelines, cloud-agnostic | K8s-native CI/CD |
| **Spinnaker** | CD | Self-hosted | Multi-cloud, advanced deployment strategies | Netflix-style CD |
| **AWS CodePipeline** | CI/CD | Cloud (AWS) | AWS native, tích hợp CodeBuild/CodeDeploy | AWS-centric teams |

### 8.1. Jenkins — CI/CD Server lâu đời nhất

**Jenkins** là CI/CD server **self-hosted**, mã nguồn mở, ra đời từ 2011. Dù GitHub Actions / GitLab CI đang phổ biến hơn cho dự án mới, Jenkins vẫn được **rất nhiều enterprise** sử dụng vì tính linh hoạt và hệ sinh thái plugin khổng lồ.

```d2 title="8.1. Jenkins — CI/CD Server lâu đời nhất"
direction: right
controller: "Jenkins Controller\nJobs • UI • Scheduling"
a: "Agent1 — Worker jobs"
b: "Agent2 — Worker jobs"
c: "Agent3 — Worker jobs"
controller -> a
controller -> b
controller -> c
```

Pipeline dùng Jenkinsfile/Groovy DSL; quản trị qua Web UI hoặc JCasC. Plugin ecosystem mở rộng integration, cần quản lý compatibility và security.

```groovy source="snippets/8-1-jenkins-ci-cd-server-lau-doi-nhat.groovy"
// Jenkinsfile — Declarative Pipeline cho Order Service
pipeline {
    agent {
        kubernetes {
            yaml '''
                apiVersion: v1
                kind: Pod
                spec:
                  containers:
                  - name: gradle
                    image: gradle:8-jdk21
                    command: ['sleep', 'infinity']
                  - name: docker
                    image: docker:24-dind
                    securityContext:
                      privileged: true
            '''
        }
    }

    environment {
        REGISTRY = '123456789.dkr.ecr.ap-southeast-1.amazonaws.com'
        IMAGE_NAME = 'order-service'
    }

    stages {
        stage('Test') {
            steps {
                container('gradle') {
                    sh './gradlew checkstyleMain'    // Lint
                    sh './gradlew test'              // Unit tests
                    sh './gradlew integrationTest'   // Integration tests
                }
            }
            post {
                always {
                    junit 'build/test-results/**/*.xml'
                }
            }
        }

        stage('Security Scan') {
            parallel {                              // Chạy song song
                stage('Secret Detection') {
                    steps {
                        sh 'gitleaks detect --source=.'
                    }
                }
                stage('Dependency Scan') {
                    steps {
                        container('gradle') {
                            sh './gradlew dependencyCheckAnalyze'
                        }
                    }
                }
            }
        }

        stage('Build & Push Image') {
            when {
                branch 'main'                       // Chỉ build trên main
            }
            steps {
                container('docker') {
                    script {
                        def commitSha = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                        def image = "${REGISTRY}/${IMAGE_NAME}:${commitSha}"

                        sh "docker build -t ${image} ."
                        sh "docker push ${image}"

                        // Update GitOps repo
                        sh """
                            git clone https://github.com/company/k8s-manifests.git
                            cd k8s-manifests
                            sed -i 's|image: .*order-service.*|image: ${image}|' services/order-service/deployment.yaml
                            git commit -am 'chore: update order-service to ${commitSha}'
                            git push
                        """
                    }
                }
            }
        }
    }

    post {
        failure {
            slackSend channel: '#ci-alerts',
                      message: "❌ Order Service build FAILED: ${env.BUILD_URL}"
        }
        success {
            slackSend channel: '#ci-alerts',
                      message: "✅ Order Service build #${env.BUILD_NUMBER} passed"
        }
    }
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=14-cicd-deployment&snapshot=article&file=snippets%2F8-1-jenkins-ci-cd-server-lau-doi-nhat.groovy)

```
JENKINS vs GITHUB ACTIONS — KHI NÀO DÙNG GÌ?
──────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────┐
  │  CHỌN JENKINS KHI:                                       │
  │                                                          │
  │  • Enterprise lớn, đã có Jenkins chạy nhiều năm          │
  │  • Cần self-hosted (data không ra ngoài, compliance)     │
  │  • Pipeline phức tạp, cần Groovy scripting               │
  │  • Cần tích hợp tools nội bộ (plugin tự viết)            │
  │  • Multi-branch, multi-repo pipeline phức tạp            │
  └──────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────┐
  │  CHỌN GITHUB ACTIONS KHI:                                │
  │                                                          │
  │  • Dự án mới, code trên GitHub                           │
  │  • Muốn setup nhanh (YAML, không cần server)             │
  │  • Team nhỏ-vừa, không muốn maintain CI server           │
  │  • Open source (free cho public repos)                   │
  │  • Marketplace có sẵn actions cho hầu hết use cases      │
  └──────────────────────────────────────────────────────────┘
```

| Tiêu chí | Jenkins | GitHub Actions |
|----------|---------|----------------|
| Hosting | Self-hosted (tự quản lý server) | Cloud (GitHub quản lý) |
| Config | Jenkinsfile (Groovy) | YAML workflow |
| Setup | Phức tạp (cài server, agents, plugins) | Đơn giản (tạo file YAML) |
| Plugins | 1800+ plugins | Marketplace actions |
| Maintenance | Cao (update server, plugins, security) | Thấp (GitHub lo) |
| Cost | Server cost + ops effort | Free (public) / $$ (private, tính theo minutes) |
| Linh hoạt | Rất cao (Groovy = code bất kỳ) | Trung bình (YAML + shell) |
| UI | Web dashboard (cũ hơn) | Tích hợp GitHub (modern) |
| Community | Rất lớn, mature | Đang phát triển nhanh |

---

## 9. Ví dụ thực tế — E-Commerce CI/CD

```d2 title="9. Ví dụ thực tế — E-Commerce CI/CD"
direction: down
teams: Developer Teams { order: Team A — Order; product: Team B — Product; payment: Team C — Payment }
source: GitHub Source Repos — order / product / payment
ci: GitHub Actions — Lint / Test / Scan / Build / Push ECR
config: GitHub GitOps Repo — manifests / infrastructure
cluster: Kubernetes {
 argo: ArgoCD
 staging: Staging Namespace
 production: Production — Canary / Flagger
 monitoring: Prometheus / Grafana / Alertmanager
 traces: Jaeger
 logs: ELK
 argo -> staging
 staging -> production: Acceptance / Promotion Gates
}
teams -> source: Push / PR
source -> ci: Webhook
ci -> config: Update image tag qua reviewed PR
cluster.argo -> config: Pull desired state
# Icons: https://icons.d2lang.com/
cluster.icon: "https://icons.d2lang.com/azure/_Companies/Kubernetes.svg"
```

**Luồng deploy chi tiết:**

1. Developer push code lên `feature/add-discount` branch
2. Tạo PR → GitHub Actions CI trigger:
   - Lint, Unit test, Integration test (Testcontainers)
   - Security scan (Snyk, gitleaks)
   - Build Docker image, push to ECR: `order-service:a1b2c3d`
3. PR approved + merged vào `main`
4. CI pipeline (on main):
   - Build image: `order-service:a1b2c3d`
   - Push to ECR
   - Bot tạo PR trên GitOps repo: update image tag
5. GitOps PR auto-merge (staging) / manual approve (production)
6. ArgoCD detect changes → sync staging
7. Acceptance tests pass trên staging
8. ArgoCD sync production (Canary via Flagger):
   - 5% → 25% → 50% → 100%
   - Flagger monitor metrics mỗi phút
   - Auto-rollback nếu error rate > 1%
9. Post-deploy smoke test pass → **Done ✅**

---

## 10. Anti-patterns

```
CI/CD ANTI-PATTERNS — TRÁNH NHỮNG LỖI NÀY:
───────────────────────────────────────────

  ❌ 1. "Works on my machine" — Không có CI
     → Code chỉ test trên laptop developer
     → Push thẳng production
     ✅ Fix: CI pipeline BẮT BUỘC, block merge nếu CI fail

  ❌ 2. Snowflake environments
     → Dev, staging, prod khác nhau hoàn toàn
     → "Staging pass, prod fail"
     ✅ Fix: Infrastructure as Code, cùng Docker image mọi env

  ❌ 3. Manual deployment steps
     → "Nhớ chạy DB migration trước khi deploy"
     → "Nhớ update config trên server X"
     ✅ Fix: Automate MỌI THỨ trong pipeline

  ❌ 4. Big bang deployments
     → Gom 2 tuần code, deploy 1 lần vào thứ 6 đêm
     → Fail → rollback mất cả đêm
     ✅ Fix: Deploy thường xuyên, small batches

  ❌ 5. Skip tests để deploy nhanh
     → "Test chạy lâu quá, skip đi"
     → Bug lọt production
     ✅ Fix: Optimize test speed (parallel, cache, testcontainers)

  ❌ 6. Shared CI/CD credentials
     → Tất cả services dùng chung 1 service account
     → Breach 1 pipeline → compromise tất cả
     ✅ Fix: Least privilege, mỗi service riêng credentials

  ❌ 7. No rollback plan
     → Deploy fail → panic → fix forward dưới áp lực
     ✅ Fix: Automated rollback, Blue-Green, revision history

  ❌ 8. Docker image tag :latest
     → Không biết đang chạy version nào
     → Không rollback được
     ✅ Fix: Immutable tags (git SHA, semver)

  ❌ 9. Coupling deployments
     → "Deploy Order service trước, rồi Product, rồi Payment"
     → Mất tính independent deployment
     ✅ Fix: Backward compatible APIs, contract testing

  ❌ 10. No monitoring after deploy
     → Deploy xong → "done!" → đi về
     → Bugs âm thầm ảnh hưởng users
     ✅ Fix: Post-deploy monitoring, auto-rollback on metrics
```

---

## 11. Checklist CI/CD cho Microservice

```
✅ CI/CD CHECKLIST:
───────────────────

  CI Pipeline:
  □ Lint + format check tự động
  □ Unit tests (coverage > 80%)
  □ Integration tests (Testcontainers)
  □ Security scan (SAST, dependency check)
  □ Docker image build (multi-stage)
  □ Image push to registry (immutable tags)
  □ Pipeline chạy < 10 phút

  CD Pipeline:
  □ Deploy staging tự động
  □ Acceptance tests trên staging
  □ Manual approval hoặc auto-promote
  □ Production deploy strategy (Rolling/Canary/Blue-Green)
  □ Post-deploy smoke test
  □ Auto-rollback on failure

  GitOps:
  □ Config repo tách biệt code repo
  □ Declarative manifests (K8s YAML / Helm)
  □ ArgoCD hoặc FluxCD cho pull-based sync
  □ Drift detection + self-heal

  Testing:
  □ Testing pyramid (Unit > Integration > E2E)
  □ Contract testing (Pact) giữa services
  □ Performance testing trên staging

  Security:
  □ Secret scanning (gitleaks)
  □ Image vulnerability scanning (Trivy)
  □ RBAC cho pipeline credentials
  □ Image signing (cosign)

  Database:
  □ Migration tự động trong pipeline
  □ Backward compatible migrations
  □ Expand-Contract pattern cho breaking changes

  Monitoring:
  □ Deploy metrics (frequency, lead time, MTTR)
  □ Error rate monitoring post-deploy
  □ Alerting khi deploy fail
```

---

## 12. Tổng kết

```
TÓM TẮT CI/CD & DEPLOYMENT CHO MICROSERVICE:
──────────────────────────────────────────────

  ┌───────────────────────────────────────────────────────────┐
  │                                                           │
  │  CI: Build → Test → Scan → Image                          │
  │      Tự động, nhanh (< 10 phút), block on failure         │
  │                                                           │
  │  CD: Stage → Test → Approve → Prod                        │
  │      Delivery (manual approve) hoặc                       │
  │      Deployment (auto, cần monitoring mạnh)               │
  │                                                           │
  │  Deploy Strategy:                                         │
  │      Rolling (default) → Canary (critical)                │
  │      → Blue-Green (instant rollback)                      │
  │                                                           │
  │  GitOps:                                                  │
  │      Git = Source of Truth                                │
  │      ArgoCD / FluxCD = Pull-based sync                    │
  │      Drift detection + Self-heal                          │
  │                                                           │
  │  Testing:                                                 │
  │      Unit (70%) → Integration (20%) → E2E (10%)           │
  │      Contract Testing giữa services                       │
  │      Post-deploy smoke + monitoring                       │
  │                                                           │
  │  KEY METRICS (DORA):                                      │
  │  ┌────────────────────────────┬──────────────────────┐    │
  │  │ Deployment Frequency       │ Nhiều lần / ngày     │    │
  │  │ Lead Time for Changes      │ < 1 giờ              │    │
  │  │ Change Failure Rate        │ < 5%                 │    │
  │  │ Mean Time to Recovery      │ < 1 giờ              │    │
  │  └────────────────────────────┴──────────────────────┘    │
  │                                                           │
  └───────────────────────────────────────────────────────────┘
```

---

## 13. Liên kết liên quan

- [12. Containerization](12-containerization.md) — Docker, image build (CI cần)
- [13. Orchestration](13-orchestration.md) — Kubernetes, Helm (CD target)
- [10. Resilience Patterns](10-resilience-patterns.md) — Circuit Breaker trong Canary/Rolling
- [11. Observability & Evolvability](11-observability-evolvability.md) — Monitoring post-deploy
- [15. Security](15-security.md) — Pipeline security, image scanning
- [16. Configuration & Secrets Management](16-configuration-secrets-management.md) — Config trong CD pipeline
