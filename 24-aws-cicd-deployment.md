# CI/CD & Deployment Strategies trên AWS

## 📋 Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
- [2. CI/CD Pipeline trên AWS — Tổng quan](#2-cicd-pipeline-trên-aws--tổng-quan)
  - [2.1. AWS-native CI/CD Stack](#21-aws-native-cicd-stack)
  - [2.2. GitHub Actions + AWS — Hybrid Approach](#22-github-actions--aws--hybrid-approach)
  - [2.3. So sánh CodePipeline vs GitHub Actions vs GitLab CI](#23-so-sánh-codepipeline-vs-github-actions-vs-gitlab-ci)
- [3. AWS CodePipeline — Orchestrator](#3-aws-codepipeline--orchestrator)
  - [3.1. CodePipeline Architecture](#31-codepipeline-architecture)
  - [3.2. Multi-Service Pipeline Design](#32-multi-service-pipeline-design)
  - [3.3. Cross-Account Pipeline](#33-cross-account-pipeline)
- [4. AWS CodeBuild — CI Engine](#4-aws-codebuild--ci-engine)
  - [4.1. CodeBuild cho Microservice](#41-codebuild-cho-microservice)
  - [4.2. Buildspec.yml — Chi tiết](#42-buildspecyml--chi-tiết)
  - [4.3. Caching & Performance Optimization](#43-caching--performance-optimization)
- [5. AWS CodeDeploy — Deployment Engine](#5-aws-codedeploy--deployment-engine)
  - [5.1. CodeDeploy cho ECS](#51-codedeploy-cho-ecs)
  - [5.2. CodeDeploy cho Lambda](#52-codedeploy-cho-lambda)
  - [5.3. CodeDeploy cho EKS](#53-codedeploy-cho-eks)
- [6. Deployment Strategies trên AWS](#6-deployment-strategies-trên-aws)
  - [6.1. Rolling Update — ECS Default](#61-rolling-update--ecs-default)
  - [6.2. Blue-Green Deployment — ECS + ALB](#62-blue-green-deployment--ecs--alb)
  - [6.3. Canary Deployment — Lambda & EKS](#63-canary-deployment--lambda--eks)
  - [6.4. So sánh Deployment Strategies trên AWS](#64-so-sánh-deployment-strategies-trên-aws)
- [7. GitHub Actions + AWS — Pipeline thực tế](#7-github-actions--aws--pipeline-thực-tế)
  - [7.1. OIDC Authentication — Không cần Access Keys](#71-oidc-authentication--không-cần-access-keys)
  - [7.2. CI/CD Pipeline hoàn chỉnh cho ECS](#72-cicd-pipeline-hoàn-chỉnh-cho-ecs)
  - [7.3. Matrix Build cho Multi-Service Monorepo](#73-matrix-build-cho-multi-service-monorepo)
- [8. GitOps trên AWS — ArgoCD + EKS](#8-gitops-trên-aws--argocd--eks)
  - [8.1. ArgoCD trên EKS — Setup](#81-argocd-trên-eks--setup)
  - [8.2. ApplicationSet — Multi-Service GitOps](#82-applicationset--multi-service-gitops)
  - [8.3. Image Updater — Auto-deploy on new image](#83-image-updater--auto-deploy-on-new-image)
  - [8.4. GitOps vs Push-based trên AWS](#84-gitops-vs-push-based-trên-aws)
- [9. Pipeline Security](#9-pipeline-security)
  - [9.1. IAM Roles cho Pipeline](#91-iam-roles-cho-pipeline)
  - [9.2. Image Scanning — ECR + Trivy](#92-image-scanning--ecr--trivy)
  - [9.3. Policy as Code — OPA / Kyverno](#93-policy-as-code--opa--kyverno)
  - [9.4. Secrets trong Pipeline](#94-secrets-trong-pipeline)
- [10. Cost Optimization cho CI/CD](#10-cost-optimization-cho-cicd)
  - [10.1. CI/CD Cost Breakdown](#101-cicd-cost-breakdown)
  - [10.2. Chiến lược giảm chi phí](#102-chiến-lược-giảm-chi-phí)
- [11. Ví dụ thực tế — E-Commerce CI/CD trên AWS](#11-ví-dụ-thực-tế--e-commerce-cicd-trên-aws)
- [12. Anti-patterns](#12-anti-patterns)
- [13. Checklist triển khai](#13-checklist-triển-khai)
- [14. Tổng kết](#14-tổng-kết)
- [15. Liên kết liên quan](#15-liên-kết-liên-quan)

---

## 1. Giới thiệu

Trong [doc 14 — CI/CD & Deployment Strategies](14-cicd-deployment.md), chúng ta đã hiểu lý thuyết về CI/CD Pipeline, Deployment Strategies (Rolling, Blue-Green, Canary), GitOps (ArgoCD, FluxCD), và Testing Pyramid. Doc này **áp dụng tất cả kiến thức đó vào thực tế trên AWS** — mapping từng khái niệm sang AWS service cụ thể, từ cấu hình pipeline chi tiết đến cost optimization.

Doc này trả lời câu hỏi: **CodePipeline vs GitHub Actions chọn khi nào? Blue-Green deploy ECS + ALB cấu hình thế nào? Canary deployment cho Lambda/EKS triển khai ra sao? GitOps với ArgoCD trên EKS setup thế nào? Chi phí CI/CD kiểm soát bằng cách nào?**

> 💡 Giả định: Bạn đã đọc [doc 14](14-cicd-deployment.md) và hiểu lý thuyết. Doc này tập trung vào **cách AWS hiện thực hóa** các khái niệm đó.

```
MAPPING: LÝ THUYẾT CI/CD → AWS SERVICES
──────────────────────────────────────────

  Lý thuyết (doc 14)               AWS Service
  ─────────────────                ───────────
  Source Control                →   CodeCommit / GitHub / GitLab
  CI — Build + Test             →   CodeBuild / GitHub Actions
  CD — Orchestration            →   CodePipeline / GitHub Actions
  Artifact Registry             →   ECR (Docker images)
  Deployment Engine             →   CodeDeploy / ECS Deploy / ArgoCD
  Rolling Update                →   ECS Rolling Update (default)
  Blue-Green                    →   CodeDeploy + ECS + ALB
  Canary                        →   CodeDeploy + Lambda / EKS
  GitOps                        →   ArgoCD / Flux trên EKS
  Environment Promotion         →   CodePipeline stages / Multi-account
  Secrets in Pipeline           →   Secrets Manager / Parameter Store
  Image Scanning                →   ECR Scan / Trivy / Snyk

  ┌───────────────────────────────────────────────────────────────┐
  │                  CI/CD PIPELINE TRÊN AWS                      │
  │                                                               │
  │  Source          Build           Test          Deploy         │
  │  ┌──────┐      ┌──────────┐    ┌───────┐     ┌──────────────┐ │
  │  │GitHub│─────▶│CodeBuild │───▶│Test   │────▶│ CodeDeploy   │ │
  │  │      │      │          │    │Stage  │     │ Blue-Green   │ │
  │  └──────┘      │• Build   │    │       │     │ Canary       │ │
  │                │• Test    │    │• E2E  │     │ Rolling      │ │
  │                │• Scan    │    │• Smoke│     └──────────────┘ │
  │                │• Push ECR│    └───────┘            │         │
  │                └──────────┘                         ▼         │
  │                                              ┌──────────┐     │
  │                                              │ ECS/EKS  │     │
  │                                              │ Lambda   │     │
  │                                              └──────────┘     │
  └───────────────────────────────────────────────────────────────┘
```

> 📖 Tham khảo thêm: [doc 18 — Kiến trúc tổng quan](18-aws-deployment-architecture.md) cho ECS vs EKS vs Lambda, [doc 23 — Security trên AWS](23-aws-security.md) cho pipeline security, IAM Roles.

---

## 2. CI/CD Pipeline trên AWS — Tổng quan

### 2.1. AWS-native CI/CD Stack

```
AWS-NATIVE CI/CD STACK
───────────────────────

  ┌── Source ──────────┐
  │  CodeCommit        │  ← AWS Git repository (hoặc GitHub/GitLab)
  └────────┬───────────┘
           │
  ┌────────▼───────────┐
  │  CodeBuild         │  ← Build, test, scan, push image
  │  • Managed compute │
  │  • Pay per minute  │
  │  • Docker support  │
  └────────┬───────────┘
           │
  ┌────────▼───────────┐
  │  CodeDeploy        │  ← Deployment automation
  │  • Blue-Green      │
  │  • Canary          │
  │  • Rolling         │
  │  • Auto rollback   │
  └────────┬───────────┘
           │
  ┌────────▼───────────┐
  │  CodePipeline      │  ← Orchestrator — kết nối tất cả stages
  │  • Source → Build  │
  │    → Test → Deploy │
  │  • Manual approval │
  │  • Cross-account   │
  └────────────────────┘
```

### 2.2. GitHub Actions + AWS — Hybrid Approach

Nhiều team chọn **GitHub Actions** cho CI/CD thay vì AWS-native stack — linh hoạt hơn, ecosystem lớn hơn, developer experience tốt hơn.

```
GITHUB ACTIONS + AWS — HYBRID STACK
──────────────────────────────────────

  ┌── GitHub ──────────────────────────────────────┐
  │                                                │
  │  Repository                                    │
  │  └── .github/workflows/                        │
  │       ├── ci.yml          ← Build + Test       │
  │       ├── deploy-staging.yml  ← Deploy staging │
  │       └── deploy-prod.yml     ← Deploy prod    │
  │                                                │
  │  GitHub Actions Runners                        │
  │  • GitHub-hosted (free for public repos)       │
  │  • Self-hosted on EC2 (private repos, faster)  │
  └──────────────┬─────────────────────────────────┘
                 │ OIDC (no access keys!)
                 ▼
  ┌── AWS ─────────────────────────────────────────┐
  │  ECR → ECS / EKS / Lambda                      │
  │  (chỉ dùng AWS cho infra, không cho CI/CD)     │
  └────────────────────────────────────────────────┘
```

### 2.3. So sánh CodePipeline vs GitHub Actions vs GitLab CI

| Tiêu chí | AWS CodePipeline + CodeBuild | GitHub Actions | GitLab CI |
|----------|---------------------------|---------------|-----------|
| **Setup** | Terraform/CDK, config nhiều | YAML trong repo, nhanh | YAML trong repo, nhanh |
| **AWS Integration** | Native (IAM roles, VPC) | Tốt (OIDC, official actions) | Tốt (AWS CLI, OIDC) |
| **Ecosystem** | Hạn chế | 15K+ marketplace actions | 1K+ templates |
| **Cost (10 builds/ngày)** | ~$30-50/mo | Free (public), $4/user (private) | Free (400 min), $10/user |
| **Self-hosted runners** | ❌ (CodeBuild managed only) | ✅ EC2, EKS | ✅ EC2, EKS |
| **Approval gates** | ✅ Manual approval stage | ✅ Environment protection | ✅ Manual job |
| **Cross-account** | ✅ Native (IAM AssumeRole) | ✅ OIDC per account | ✅ OIDC per account |
| **GitOps** | ❌ Push-based only | ❌ Push-based (+ ArgoCD) | ❌ Push-based (+ ArgoCD) |
| **Vendor lock-in** | Cao (AWS only) | Thấp (GitHub) | Thấp (GitLab) |
| **Best for** | All-in AWS, enterprise | Hầu hết teams | Self-hosted GitLab users |

> 💡 **Recommendation**: **GitHub Actions + AWS** cho hầu hết teams — developer experience tốt, ecosystem lớn, OIDC integration an toàn. **CodePipeline** khi yêu cầu enterprise compliance (all AWS, audit trail via CloudTrail).

---

## 3. AWS CodePipeline — Orchestrator

### 3.1. CodePipeline Architecture

```
CODEPIPELINE — MULTI-STAGE PIPELINE
──────────────────────────────────────

  ┌─── Stage 1: Source ────────────────────────────────────┐
  │  Trigger: Push to main branch                          │
  │  Source: GitHub (via CodeStar Connection)              │
  └────────────────────────┬───────────────────────────────┘
                           │
  ┌────────────────────────▼───────────────────────────────┐
  │  Stage 2: Build                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  CodeBuild Project                               │  │
  │  │  • docker build                                  │  │
  │  │  • unit tests + integration tests                │  │
  │  │  • ECR image scan                                │  │
  │  │  • push image to ECR                             │  │
  │  │  • output: imageDetail.json                      │  │
  │  └──────────────────────────────────────────────────┘  │
  └────────────────────────┬───────────────────────────────┘
                           │
  ┌────────────────────────▼───────────────────────────────┐
  │  Stage 3: Deploy Staging                               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  CodeDeploy → ECS (Staging)                      │  │
  │  │  Strategy: Rolling Update                        │  │
  │  │  Auto rollback: on alarm                         │  │
  │  └──────────────────────────────────────────────────┘  │
  └────────────────────────┬───────────────────────────────┘
                           │
  ┌────────────────────────▼───────────────────────────────┐
  │  Stage 4: Test Staging                                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  CodeBuild — E2E Tests + Smoke Tests             │  │
  │  │  Run against staging environment                 │  │
  │  └──────────────────────────────────────────────────┘  │
  └────────────────────────┬───────────────────────────────┘
                           │
  ┌────────────────────────▼───────────────────────────────┐
  │  Stage 5: Manual Approval                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  SNS → Slack notification                        │  │
  │  │  "Deploy to PROD? Review changes: [link]"        │  │
  │  │  Approver: tech-lead / SRE                       │  │
  │  └──────────────────────────────────────────────────┘  │
  └────────────────────────┬───────────────────────────────┘
                           │ ✅ Approved
  ┌────────────────────────▼───────────────────────────────┐
  │  Stage 6: Deploy Production                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  CodeDeploy → ECS (Production)                   │  │
  │  │  Strategy: Blue-Green                            │  │
  │  │  Auto rollback: on CloudWatch Alarm              │  │
  │  │  Traffic shift: 10% → 50% → 100% (10 min each)   │  │
  │  └──────────────────────────────────────────────────┘  │
  └────────────────────────────────────────────────────────┘
```

### 3.2. Multi-Service Pipeline Design

```
MULTI-SERVICE PIPELINE — 2 APPROACHES
────────────────────────────────────────

  Approach 1: Pipeline Per Service (Recommended)
  ─────────────────────────────────────────────
  ┌── order-service-pipeline ──────────┐
  │  Source → Build → Stage → Prod     │  ← Independent
  └────────────────────────────────────┘
  ┌── payment-service-pipeline ────────┐
  │  Source → Build → Stage → Prod     │  ← Independent
  └────────────────────────────────────┘
  ┌── user-service-pipeline ───────────┐
  │  Source → Build → Stage → Prod     │  ← Independent
  └────────────────────────────────────┘

  → ✅ Deploy independently
  → ✅ Mỗi team own pipeline
  → ✅ Failure isolation


  Approach 2: Monorepo + Change Detection
  ──────────────────────────────────────────
  ┌── monorepo-pipeline ────────────────────────────┐
  │  Source (detect changes)                        │
  │  ├── /services/order/ changed?                  │
  │  │   └── Build + Deploy order-service           │
  │  ├── /services/payment/ changed?                │
  │  │   └── Build + Deploy payment-service         │
  │  └── /shared/lib/ changed?                      │
  │      └── Build + Deploy ALL dependent services  │
  └─────────────────────────────────────────────────┘

  → ✅ 1 repo, 1 pipeline config
  → ❌ Phức tạp change detection
  → ❌ Shared failure (pipeline fail = block tất cả)
```

### 3.3. Cross-Account Pipeline

Trong multi-account strategy (xem [doc 18](18-aws-deployment-architecture.md)), pipeline chạy ở **Tooling Account**, deploy sang **Staging/Prod Account**.

```
CROSS-ACCOUNT PIPELINE
───────────────────────

  Tooling Account (111111111111)
  ┌──────────────────────────────────────────────┐
  │  CodePipeline                                │
  │  ┌──────┐    ┌──────────┐                    │
  │  │Source│───▶│CodeBuild │──▶ ECR (push image)│
  │  └──────┘    └──────────┘                    │
  │                    │                         │
  │              AssumeRole                      │
  └────────────────────┼─────────────────────────┘
                       │
          ┌────────────┼───────────────┐
          │            │               │
          ▼            ▼               ▼
  ┌── Staging ──┐  ┌── Prod ────┐  ┌── DR ──────┐
  │ Account     │  │ Account    │  │ Account    │
  │ 222222222222│  │333333333333│  │444444444444│
  │             │  │            │  │            │
  │ Cross-Acct  │  │ Cross-Acct │  │ Cross-Acct │
  │ Role:       │  │ Role:      │  │ Role:      │
  │ deploy-role │  │ deploy-role│  │ deploy-role│
  │             │  │            │  │            │
  │ ECS Cluster │  │ ECS Cluster│  │ ECS Cluster│
  └─────────────┘  └────────────┘  └────────────┘
```

---

## 4. AWS CodeBuild — CI Engine

### 4.1. CodeBuild cho Microservice

**CodeBuild** là managed build service — không cần quản lý build servers, pay per build minute.

| Feature | Chi tiết |
|---------|---------|
| **Compute** | 3 GB / 2 vCPU (small) → 145 GB / 72 vCPU (2xlarge) |
| **Timeout** | Max 8 hours |
| **Docker** | ✅ Privileged mode cho docker build |
| **VPC** | ✅ Chạy trong VPC (truy cập private resources) |
| **Cache** | S3 cache, Local cache (Docker layers, dependencies) |
| **Concurrent** | Default 60 builds, tăng được |
| **Cost** | $0.005/min (small Linux) — ~$7.20/mo cho 10 builds × 5 min/ngày |

### 4.2. Buildspec.yml — Chi tiết

```yaml
# buildspec.yml — Complete CI pipeline cho microservice
version: 0.2

env:
  variables:
    SERVICE_NAME: "order-service"
    ECR_REPO: "123456789.dkr.ecr.ap-southeast-1.amazonaws.com/order-service"
  parameter-store:
    SONAR_TOKEN: "/cicd/sonarqube/token"
  secrets-manager:
    DOCKER_HUB_TOKEN: "cicd/dockerhub:token"

phases:
  install:
    runtime-versions:
      java: corretto17
    commands:
      - echo "Installing dependencies..."

  pre_build:
    commands:
      # ECR login
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPO
      # Set image tag
      - IMAGE_TAG=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-8)
      - FULL_IMAGE="$ECR_REPO:$IMAGE_TAG"

  build:
    commands:
      # Unit tests
      - echo "Running unit tests..."
      - ./gradlew test

      # Build application
      - echo "Building application..."
      - ./gradlew bootJar

      # Docker build (multi-stage)
      - echo "Building Docker image..."
      - docker build -t $FULL_IMAGE .
      - docker tag $FULL_IMAGE $ECR_REPO:latest

  post_build:
    commands:
      # Push to ECR
      - echo "Pushing to ECR..."
      - docker push $FULL_IMAGE
      - docker push $ECR_REPO:latest

      # Generate artifacts cho CodeDeploy
      - echo "Generating deployment artifacts..."
      - printf '{"ImageURI":"%s"}' $FULL_IMAGE > imageDetail.json
      - echo "Build completed successfully!"

artifacts:
  files:
    - imageDetail.json
    - appspec.yaml
    - taskdef.json

cache:
  paths:
    - '/root/.gradle/caches/**/*'     # Gradle cache
    - '/root/.gradle/wrapper/**/*'
    - '/root/.docker/**/*'            # Docker layer cache

reports:
  junit-reports:
    files:
      - 'build/test-results/**/*.xml'
    file-format: JUNITXML
  coverage-reports:
    files:
      - 'build/reports/jacoco/test/jacocoTestReport.xml'
    file-format: JACOCOXML
```

### 4.3. Caching & Performance Optimization

```
BUILD PERFORMANCE — TRƯỚC VÀ SAU OPTIMIZATION
────────────────────────────────────────────────

  ❌ TRƯỚC: 12 phút mỗi build
  ┌──────────────────────────────────────────────┐
  │ Install deps:  3 min  ████████               │
  │ Unit tests:    2 min  █████                  │
  │ Docker build:  5 min  █████████████          │
  │ Push ECR:      2 min  █████                  │
  └──────────────────────────────────────────────┘

  ✅ SAU: 4 phút mỗi build
  ┌──────────────────────────────────────────────┐
  │ Install deps:  30s ██  (S3 cache)            │
  │ Unit tests:    2 min █████  (parallel)       │
  │ Docker build:  1 min ███  (layer cache)      │
  │ Push ECR:      30s ██  (only changed layers) │
  └──────────────────────────────────────────────┘

  Techniques:
  1. S3 Cache — cache dependencies (gradle, npm, pip)
  2. Docker Layer Cache — cache base image layers
  3. Multi-stage Build — smaller final image = faster push
  4. ECR Immutable Tags — skip push nếu tag đã tồn tại
```

---

## 5. AWS CodeDeploy — Deployment Engine

### 5.1. CodeDeploy cho ECS

**CodeDeploy** quản lý deployment cho ECS — hỗ trợ **Blue-Green** và **Canary** với auto rollback.

```
CODEDEPLOY + ECS — BLUE-GREEN FLOW
─────────────────────────────────────

  Step 1: Tạo Green Target Group + Tasks
  ┌───────────────────────────────────────────────────────┐
  │  ALB                                                  │
  │  ├── Listener :443 (production)                       │
  │  │   └── Target Group BLUE (v1) ← 100% traffic        │
  │  └── Listener :8443 (test)                            │
  │      └── Target Group GREEN (v2) ← test traffic       │
  └───────────────────────────────────────────────────────┘

  Step 2: Shift traffic dần dần
  ┌───────────────────────────────────────────────────────┐
  │  ALB :443                                             │
  │  ├── Target Group BLUE (v1) ← 90% traffic             │
  │  └── Target Group GREEN (v2) ← 10% traffic            │
  │                                                       │
  │  CloudWatch Alarm → monitoring error rate             │
  │  ❌ Alarm triggered → AUTO ROLLBACK (100% → BLUE)     │
  │  ✅ Alarm OK → continue shifting                      │
  └───────────────────────────────────────────────────────┘

  Step 3: Complete — 100% traffic to GREEN
  ┌───────────────────────────────────────────────────────┐
  │  ALB :443                                             │
  │  ├── Target Group BLUE (v1) ← 0% (terminate)          │
  │  └── Target Group GREEN (v2) ← 100% traffic           │
  └───────────────────────────────────────────────────────┘
```

**AppSpec cho ECS Blue-Green:**

```yaml
# appspec.yaml — ECS Blue-Green deployment
version: 0.0

Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: <TASK_DEFINITION>  # Replaced by CodePipeline
        LoadBalancerInfo:
          ContainerName: "order-service"
          ContainerPort: 8080
        PlatformVersion: "LATEST"

Hooks:
  - BeforeInstall: "LambdaFunctionToValidateBeforeInstall"
  - AfterInstall: "LambdaFunctionToValidateAfterInstall"
  - AfterAllowTestTraffic: "LambdaFunctionToRunIntegrationTests"
  - BeforeAllowTraffic: "LambdaFunctionToValidateBeforeTraffic"
  - AfterAllowTraffic: "LambdaFunctionToRunSmokeTests"
```

**Lifecycle hooks — Khi nào chạy test:**

```
CODEDEPLOY LIFECYCLE HOOKS (ECS)
──────────────────────────────────

  Install Green Tasks
       │
  ┌────▼──────────────────┐
  │ BeforeInstall         │ ← Validate config, DB migrations
  └────┬──────────────────┘
       │
  ┌────▼──────────────────┐
  │ Install               │ ← ECS provisions new tasks (GREEN)
  └────┬──────────────────┘
       │
  ┌────▼──────────────────┐
  │ AfterInstall          │ ← Health checks, warm-up
  └────┬──────────────────┘
       │
  ┌────▼──────────────────┐
  │ AllowTestTraffic      │ ← Route test listener to GREEN
  └────┬──────────────────┘
       │
  ┌────▼──────────────────┐
  │ AfterAllowTestTraffic │ ← 🧪 E2E tests trên test listener
  └────┬──────────────────┘
       │
  ┌────▼──────────────────┐
  │ BeforeAllowTraffic    │ ← Final validation trước khi shift prod
  └────┬──────────────────┘
       │
  ┌────▼──────────────────┐
  │ AllowTraffic          │ ← Shift production traffic to GREEN
  └────┬──────────────────┘
       │
  ┌────▼──────────────────┐
  │ AfterAllowTraffic     │ ← 🧪 Smoke tests trên prod traffic
  └────┬──────────────────┘
       │
       ▼
  Complete ✅ (or Rollback ❌)
```

### 5.2. CodeDeploy cho Lambda

Lambda hỗ trợ **Canary** và **Linear** traffic shifting natively:

```
LAMBDA DEPLOYMENT STRATEGIES
──────────────────────────────

  Canary10Percent5Minutes:
  ┌─────────────────────────────────────────────────┐
  │  t=0:   │██████████│          │ 10% new         │
  │         │  OLD 90% │ NEW 10%  │                 │
  │  t=5m:  │          │██████████│ 100% new        │
  │         │          │ NEW 100% │ (if no errors)  │
  └─────────────────────────────────────────────────┘

  Linear10PercentEvery1Minute:
  ┌─────────────────────────────────────────────────┐
  │  t=0:   │█████████ │ │  10% new                 │
  │  t=1m:  │████████  │██│  20% new                │
  │  t=2m:  │███████   │███│  30% new               │
  │  ...                                            │
  │  t=9m:  │          │██████████│  100% new       │
  └─────────────────────────────────────────────────┘

  AllAtOnce:
  ┌─────────────────────────────────────────────────┐
  │  t=0:   │██████████│           │ 100% new       │
  │         │  OLD     │ NEW 100%  │ (instant)      │
  └─────────────────────────────────────────────────┘
```

```yaml
# SAM template — Lambda Canary deployment
Resources:
  OrderFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      Runtime: nodejs18.x
      AutoPublishAlias: live   # ← Tự động tạo alias "live"
      DeploymentPreference:
        Type: Canary10Percent5Minutes   # ← Strategy
        Alarms:
          - !Ref OrderFunctionErrorsAlarm
          - !Ref OrderFunctionLatencyAlarm
        Hooks:
          PreTraffic: !Ref PreTrafficHookFunction
          PostTraffic: !Ref PostTrafficHookFunction

  # Alarm — trigger rollback nếu error rate tăng
  OrderFunctionErrorsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref OrderFunction
```

### 5.3. CodeDeploy cho EKS

CodeDeploy **không hỗ trợ trực tiếp EKS**. Cho EKS deployment, có 3 options:

| Option | Mô tả | Blue-Green | Canary | GitOps |
|--------|--------|:----------:|:------:|:------:|
| **kubectl apply** | Direct deployment | ❌ | ❌ | ❌ |
| **Helm upgrade** | Package manager | ❌ (manual) | ❌ | ❌ |
| **ArgoCD** | GitOps controller | ✅ (Argo Rollouts) | ✅ (Argo Rollouts) | ✅ |
| **Flagger + Istio** | Service mesh canary | ✅ | ✅ | ✅ |
| **AWS App Mesh + Controller** | AWS service mesh | ✅ | ✅ | ❌ |

> 💡 Cho EKS: **ArgoCD + Argo Rollouts** là best practice — xem [section 8](#8-gitops-trên-aws--argocd--eks).

---

## 6. Deployment Strategies trên AWS

### 6.1. Rolling Update — ECS Default

**Rolling Update** là strategy mặc định của ECS — thay thế tasks dần dần, **không cần** CodeDeploy.

```
ECS ROLLING UPDATE
────────────────────

  Cấu hình ECS Service:
  • desiredCount: 4
  • minimumHealthyPercent: 50%   → ít nhất 2 tasks luôn healthy
  • maximumPercent: 200%         → tối đa 8 tasks cùng lúc

  Step 1:  [v1] [v1] [v1] [v1]           ← 4 tasks v1
  Step 2:  [v1] [v1] [v1] [v1] [v2] [v2] ← Thêm 2 tasks v2
  Step 3:  [v1] [v1] [v2] [v2]           ← Drain 2 tasks v1
  Step 4:  [v1] [v1] [v2] [v2] [v2] [v2] ← Thêm 2 tasks v2
  Step 5:  [v2] [v2] [v2] [v2]           ← Drain 2 tasks v1 cuối
  Done!    [v2] [v2] [v2] [v2]           ← 100% v2 ✅
```

```hcl
# Terraform — ECS Service Rolling Update
resource "aws_ecs_service" "order" {
  name            = "order-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.order.arn
  desired_count   = 4

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  # Circuit Breaker — auto rollback nếu tasks fail liên tục
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.order.arn
    container_name   = "order-service"
    container_port   = 8080
  }
}
```

### 6.2. Blue-Green Deployment — ECS + ALB

**Blue-Green** dùng **CodeDeploy** + 2 Target Groups trên ALB — instant rollback, zero downtime.

```hcl
# Terraform — ECS Blue-Green với CodeDeploy
resource "aws_ecs_service" "order" {
  name            = "order-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.order.arn
  desired_count   = 4

  deployment_controller {
    type = "CODE_DEPLOY"  # ← Chuyển sang CodeDeploy (không dùng ECS rolling)
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "order-service"
    container_port   = 8080
  }

  lifecycle {
    ignore_changes = [task_definition, load_balancer]  # CodeDeploy quản lý
  }
}

# CodeDeploy Deployment Group
resource "aws_codedeploy_deployment_group" "order" {
  app_name               = aws_codedeploy_app.order.name
  deployment_group_name  = "order-service-prod"
  deployment_config_name = "CodeDeployDefault.ECSCanary10Percent5Minutes"
  service_role_arn       = aws_iam_role.codedeploy.arn

  ecs_service {
    cluster_name = aws_ecs_cluster.main.name
    service_name = aws_ecs_service.order.name
  }

  blue_green_deployment_config {
    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }
    terminate_blue_instances_on_deployment_success {
      action                           = "TERMINATE"
      termination_wait_time_in_minutes = 60  # Giữ BLUE 60 phút cho rollback
    }
  }

  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [aws_lb_listener.prod.arn]
      }
      test_traffic_route {
        listener_arns = [aws_lb_listener.test.arn]
      }
      target_group {
        name = aws_lb_target_group.blue.name
      }
      target_group {
        name = aws_lb_target_group.green.name
      }
    }
  }

  # Auto rollback on alarm
  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"]
  }

  alarm_configuration {
    alarms  = [aws_cloudwatch_metric_alarm.order_5xx.name]
    enabled = true
  }
}
```

### 6.3. Canary Deployment — Lambda & EKS

**Canary** shift traffic dần dần — phát hiện lỗi sớm trước khi ảnh hưởng toàn bộ users.

**CodeDeploy Canary configs có sẵn:**

| Config | Mô tả | Rollback time |
|--------|--------|:------------:|
| `ECSCanary10Percent5Minutes` | 10% → đợi 5 phút → 100% | 5 min |
| `ECSCanary10Percent15Minutes` | 10% → đợi 15 phút → 100% | 15 min |
| `ECSLinear10PercentEvery1Minutes` | +10% mỗi phút | 1-10 min |
| `ECSLinear10PercentEvery3Minutes` | +10% mỗi 3 phút | 3-30 min |
| `ECSAllAtOnce` | 100% ngay lập tức | Instant |

**Custom canary config:**

```hcl
# Custom: 5% traffic trong 10 phút, rồi 100%
resource "aws_codedeploy_deployment_config" "custom_canary" {
  deployment_config_name = "CustomCanary5Percent10Minutes"
  compute_platform       = "ECS"

  traffic_routing_config {
    type = "TimeBasedCanary"
    time_based_canary {
      interval   = 10   # 10 phút
      percentage = 5    # 5% traffic
    }
  }
}
```

### 6.4. So sánh Deployment Strategies trên AWS

| Tiêu chí | Rolling (ECS native) | Blue-Green (CodeDeploy) | Canary (CodeDeploy) |
|----------|:-------------------:|:----------------------:|:------------------:|
| **Zero downtime** | ✅ | ✅ | ✅ |
| **Rollback speed** | Chậm (re-deploy v1) | ⚡ Instant (swap TG) | ⚡ Instant (swap TG) |
| **Infra cost** | Thấp (tạm +50% tasks) | Cao (2× tasks trong deploy) | Cao (2× tasks) |
| **Test trước prod traffic** | ❌ | ✅ (test listener) | ✅ (test listener) |
| **Canary analysis** | ❌ | ❌ | ✅ |
| **Setup complexity** | Đơn giản | Trung bình | Trung bình |
| **Cần CodeDeploy** | ❌ | ✅ | ✅ |
| **Best for** | Non-critical services | Critical services | User-facing, high-traffic |

```
CHỌN STRATEGY NÀO? DECISION TREE
───────────────────────────────────

  Service critical?
  ├── Không → Rolling Update (đơn giản, rẻ)
  └── Có
      ├── Cần canary analysis?
      │   ├── Có → Canary (CodeDeploy)
      │   └── Không → Blue-Green (CodeDeploy)
      └── Cần rollback < 1 phút?
          └── Có → Blue-Green (instant swap)
```

---

## 7. GitHub Actions + AWS — Pipeline thực tế

### 7.1. OIDC Authentication — Không cần Access Keys

```
GITHUB ACTIONS OIDC + AWS
───────────────────────────

  ❌ OLD WAY: Stored Access Keys
  ┌────────────┐     Access Key / Secret    ┌─────────┐
  │  GitHub    │ ──────────────────────────▶│  AWS    │
  │  Secrets   │     (long-lived, risky!)   │         │
  └────────────┘                            └─────────┘

  ✅ NEW WAY: OIDC Federation (no stored secrets!)
  ┌────────────┐     1. JWT Token            ┌─────────┐
  │  GitHub    │ ──────────────────────────▶ │ AWS STS │
  │  Actions   │                             │         │
  │            │     2. Temp Credentials     │ IAM Role│
  │            │ ◀────────────────────────── │ (15 min)│
  │            │                             └─────────┘
  │            │     3. Use AWS APIs
  │            │ ──────────────────────────▶ ECR, ECS...
  └────────────┘
```

```hcl
# Terraform — IAM Role cho GitHub Actions OIDC
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions" {
  name = "github-actions-deploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # Chỉ cho phép repo cụ thể, branch main
            "token.actions.githubusercontent.com:sub" = "repo:myorg/order-service:ref:refs/heads/main"
          }
        }
      }
    ]
  })
}
```

### 7.2. CI/CD Pipeline hoàn chỉnh cho ECS

```yaml
# .github/workflows/deploy.yml — Complete CI/CD pipeline
name: Deploy to ECS

on:
  push:
    branches: [main]

permissions:
  id-token: write   # Cho OIDC
  contents: read

env:
  AWS_REGION: ap-southeast-1
  ECR_REPOSITORY: order-service
  ECS_CLUSTER: ecommerce-prod
  ECS_SERVICE: order-service

jobs:
  # ── Stage 1: Build & Test ──
  build:
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.build-image.outputs.image }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'corretto'
          cache: 'gradle'

      - name: Run tests
        run: ./gradlew test

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions-deploy-role
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

  # ── Stage 2: Deploy Staging ──
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging   # ← GitHub Environment (protection rules)
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (Staging Account)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::222222222222:role/github-actions-deploy-role
          aws-region: ${{ env.AWS_REGION }}

      - name: Update ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: order-service
          image: ${{ needs.build.outputs.image }}

      - name: Deploy to ECS (Staging — Rolling)
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ecommerce-staging
          wait-for-service-stability: true

      - name: Run E2E tests
        run: |
          npm run test:e2e -- --base-url=https://staging-api.example.com

  # ── Stage 3: Deploy Production ──
  deploy-prod:
    needs: [build, deploy-staging]
    runs-on: ubuntu-latest
    environment: production   # ← Requires manual approval
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (Prod Account)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::333333333333:role/github-actions-deploy-role
          aws-region: ${{ env.AWS_REGION }}

      - name: Update ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: order-service
          image: ${{ needs.build.outputs.image }}

      - name: Deploy to ECS (Prod — Blue-Green via CodeDeploy)
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
          codedeploy-appspec: appspec.yaml
          codedeploy-application: order-service-app
          codedeploy-deployment-group: order-service-prod
```

### 7.3. Matrix Build cho Multi-Service Monorepo

```yaml
# .github/workflows/ci.yml — Matrix build for monorepo
name: CI — Multi-Service

on:
  push:
    branches: [main]
    paths:
      - 'services/**'

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      services: ${{ steps.changes.outputs.services }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - id: changes
        run: |
          CHANGED=$(git diff --name-only HEAD~1 HEAD | grep '^services/' | cut -d/ -f2 | sort -u | jq -R -s -c 'split("\n") | map(select(. != ""))')
          echo "services=$CHANGED" >> $GITHUB_OUTPUT

  build:
    needs: detect-changes
    if: needs.detect-changes.outputs.services != '[]'
    strategy:
      matrix:
        service: ${{ fromJson(needs.detect-changes.outputs.services) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build ${{ matrix.service }}
        run: |
          cd services/${{ matrix.service }}
          docker build -t ${{ matrix.service }}:${{ github.sha }} .
      - name: Test ${{ matrix.service }}
        run: |
          cd services/${{ matrix.service }}
          docker run --rm ${{ matrix.service }}:${{ github.sha }} npm test
```

---

## 8. GitOps trên AWS — ArgoCD + EKS

### 8.1. ArgoCD trên EKS — Setup

Trong [doc 14](14-cicd-deployment.md), ta đã hiểu **GitOps = Git là Source of Truth**. Trên EKS, **ArgoCD** là GitOps controller phổ biến nhất.

```
ARGOCD TRÊN EKS — ARCHITECTURE
─────────────────────────────────

  ┌── Git Repository ───────────────────┐
  │  manifests/                         │
  │  ├── order-service/                 │
  │  │   ├── deployment.yaml            │
  │  │   ├── service.yaml               │
  │  │   └── kustomization.yaml         │
  │  ├── payment-service/               │
  │  │   └── ...                        │
  │  └── user-service/                  │
  │      └── ...                        │
  └──────────────┬──────────────────────┘
                 │ Poll (every 3 min)
                 │ hoặc Webhook (instant)
  ┌──────────────▼─────────────────────┐
  │  ArgoCD (chạy trên EKS)            │
  │                                    │
  │  ┌─────────────────────────────┐   │
  │  │  Application Controller     │   │
  │  │  • Detect drift             │   │
  │  │  • Sync Git → Cluster       │   │
  │  │  • Auto-heal (self-repair)  │   │
  │  └─────────────────────────────┘   │
  │                                    │
  │  ┌─────────────────────────────┐   │
  │  │  ArgoCD UI                  │   │
  │  │  • Visual app topology      │   │
  │  │  • Sync status              │   │
  │  │  • Diff view                │   │
  │  │  • Rollback (1-click)       │   │
  │  └─────────────────────────────┘   │
  └──────────────┬─────────────────────┘
                 │ Apply manifests
                 ▼
  ┌────────────────────────────────────┐
  │  EKS Cluster                       │
  │  ├── order-service (3 replicas)    │
  │  ├── payment-service (2 replicas)  │
  │  └── user-service (3 replicas)     │
  └────────────────────────────────────┘
```

**Install ArgoCD trên EKS:**

```bash
# 1. Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 2. Expose qua ALB (Ingress)
# Hoặc dùng kubectl port-forward cho dev
kubectl port-forward svc/argocd-server -n argocd 8080:443

# 3. Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

### 8.2. ApplicationSet — Multi-Service GitOps

**ApplicationSet** tự động tạo ArgoCD Application cho từng service — không cần config thủ công mỗi service.

```yaml
# ApplicationSet — Tự động tạo Application cho mọi service trong git
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: microservices
  namespace: argocd
spec:
  generators:
  # Tự động detect tất cả thư mục trong manifests/
  - git:
      repoURL: https://github.com/myorg/k8s-manifests.git
      revision: main
      directories:
      - path: 'services/*'
  
  template:
    metadata:
      name: '{{path.basename}}'   # order-service, payment-service, etc.
    spec:
      project: default
      source:
        repoURL: https://github.com/myorg/k8s-manifests.git
        targetRevision: main
        path: '{{path}}'           # services/order-service
      destination:
        server: https://kubernetes.default.svc
        namespace: production
      syncPolicy:
        automated:
          prune: true              # Xóa resources không còn trong Git
          selfHeal: true           # Auto-repair drift
        syncOptions:
        - CreateNamespace=true
        retry:
          limit: 3
          backoff:
            duration: 5s
            maxDuration: 3m0s
```

> 💡 Thêm thư mục mới `services/notification-service/` → ArgoCD **tự động** tạo Application và deploy — không cần chỉnh config gì!

### 8.3. Image Updater — Auto-deploy on new image

**ArgoCD Image Updater** theo dõi ECR registry — khi có image mới, tự động update manifest trong Git → trigger deploy.

```
CI/CD FLOW VỚI IMAGE UPDATER
──────────────────────────────

  ┌─── CI (GitHub Actions) ────────────────┐
  │  Code push → Build → Test → Push ECR   │
  │  (chỉ build & push image, KHÔNG deploy)│
  └──────────────────────┬─────────────────┘
                         │ New image: v1.2.3
                         ▼
  ┌─── ECR ────────────────────────────────┐
  │  order-service:v1.2.3 (new!)           │
  └──────────────────────┬─────────────────┘
                         │ Detect new image
  ┌──────────────────────▼─────────────────┐
  │  ArgoCD Image Updater                  │
  │  • Poll ECR every 2 min                │
  │  • Detect new tag matching semver      │
  │  • Update Git repo (write-back)        │
  └──────────────────────┬─────────────────┘
                         │ Commit: "update order-service to v1.2.3"
  ┌──────────────────────▼──────────────────┐
  │  Git Repository                         │
  │  deployment.yaml:                       │
  │    image: order-service:v1.2.3 (updated)│
  └──────────────────────┬──────────────────┘
                         │ Detect change
  ┌──────────────────────▼──────────────────┐
  │  ArgoCD                                 │
  │  Sync → Deploy to EKS                   │
  └─────────────────────────────────────────┘
```

```yaml
# ArgoCD Application with Image Updater annotations
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: order-service
  namespace: argocd
  annotations:
    # Image Updater config
    argocd-image-updater.argoproj.io/image-list: order=123456789.dkr.ecr.ap-southeast-1.amazonaws.com/order-service
    argocd-image-updater.argoproj.io/order.update-strategy: semver
    argocd-image-updater.argoproj.io/order.allow-tags: "regexp:^v\\d+\\.\\d+\\.\\d+$"
    argocd-image-updater.argoproj.io/write-back-method: git
spec:
  source:
    repoURL: https://github.com/myorg/k8s-manifests.git
    targetRevision: main
    path: services/order-service
  destination:
    server: https://kubernetes.default.svc
    namespace: production
```

### 8.4. GitOps vs Push-based trên AWS

| Tiêu chí | Push-based (GitHub Actions → ECS) | Pull-based (ArgoCD → EKS) |
|----------|----------------------------------|---------------------------|
| **Trigger** | CI pipeline push deploy | ArgoCD pull from Git |
| **Source of Truth** | Pipeline config | Git repository |
| **Drift detection** | ❌ (deploy & forget) | ✅ (continuous reconciliation) |
| **Self-heal** | ❌ | ✅ (auto-repair manual changes) |
| **Audit trail** | Pipeline logs | Git history (WHO changed WHAT, WHEN) |
| **Rollback** | Re-run old pipeline | `git revert` → auto-deploy |
| **Multi-cluster** | Cần config per cluster | 1 ArgoCD → N clusters |
| **ECS support** | ✅ Native | ❌ (EKS only) |
| **EKS support** | ✅ (kubectl/helm) | ✅ Native |
| **Complexity** | Thấp | Trung bình (cần ArgoCD setup) |
| **Best for** | ECS workloads | EKS workloads, multi-cluster |

> 💡 **Recommendation**: **ECS → Push-based** (GitHub Actions + CodeDeploy). **EKS → GitOps** (ArgoCD). Đừng dùng GitOps cho ECS — không phù hợp.

---

## 9. Pipeline Security

### 9.1. IAM Roles cho Pipeline

```
PIPELINE IAM — LEAST PRIVILEGE
─────────────────────────────────

  ❌ Anti-pattern: 1 role with AdministratorAccess

  ✅ Best practice: Role per stage, minimum permissions

  ┌── CodeBuild Role ──────────────────────┐
  │  • ecr:GetAuthorizationToken           │
  │  • ecr:BatchCheckLayerAvailability     │
  │  • ecr:PutImage                        │
  │  • s3:PutObject (artifacts bucket)     │
  │  • secretsmanager:GetSecretValue       │
  │    (chỉ CI secrets)                    │
  └────────────────────────────────────────┘

  ┌── CodeDeploy Role ─────────────────────┐
  │  • ecs:UpdateService                   │
  │  • ecs:DescribeServices                │
  │  • ecs:RegisterTaskDefinition          │
  │  • elasticloadbalancing:ModifyListener │
  │  • elasticloadbalancing:ModifyRule     │
  │  • iam:PassRole (task roles only)      │
  └────────────────────────────────────────┘

  ┌── GitHub Actions OIDC Role ────────────┐
  │  • Condition: repo + branch specific   │
  │  • ecr:* + ecs:* (scoped to services)  │
  │  • NO iam:*, organizations:*, account:*│
  └────────────────────────────────────────┘
```

### 9.2. Image Scanning — ECR + Trivy

```
IMAGE SCANNING PIPELINE
─────────────────────────

  ┌──── Build ─────────────────────────────────────┐
  │                                                │
  │  docker build                                  │
  │       │                                        │
  │  ┌────▼──────────────────┐                     │
  │  │ Trivy Scan (CI)       │ ← Scan TRƯỚC push   │
  │  │ • OS vulnerabilities  │                     │
  │  │ • App dependencies    │                     │
  │  │ • Dockerfile misconfig│                     │
  │  │ • Secrets in image    │                     │
  │  └────┬──────────────────┘                     │
  │       │                                        │
  │       ├── CRITICAL found? → ❌ BLOCK pipeline  │
  │       └── No CRITICAL → ✅ Continue            │
  │                                                │
  │  docker push ECR                               │
  │       │                                        │
  │  ┌────▼──────────────────┐                     │
  │  │ ECR Scan (registry)   │ ← Scan SAU push     │
  │  │ • Enhanced scanning   │   (continuous)      │
  │  │   (Inspector)         │                     │
  │  │ • Re-scan on new CVE  │                     │
  │  └──────────────────────┘                      │
  └────────────────────────────────────────────────┘
```

```yaml
# GitHub Actions — Trivy scan step
- name: Trivy vulnerability scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ steps.build.outputs.image }}
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'            # Fail pipeline on CRITICAL/HIGH

- name: Upload Trivy results
  uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: 'trivy-results.sarif'
```

### 9.3. Policy as Code — OPA / Kyverno

**Policy as Code** đảm bảo deployments tuân thủ security policies trước khi được apply lên cluster.

```yaml
# Kyverno Policy — Block privileged containers trên EKS
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-privileged-containers
spec:
  validationFailureAction: Enforce   # Block (không chỉ warn)
  rules:
  - name: validate-privileged
    match:
      any:
      - resources:
          kinds:
          - Pod
    validate:
      message: "Privileged containers are not allowed!"
      pattern:
        spec:
          containers:
          - securityContext:
              privileged: "false"

---
# Kyverno Policy — Bắt buộc resource limits
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-resource-limits
spec:
  validationFailureAction: Enforce
  rules:
  - name: validate-limits
    match:
      any:
      - resources:
          kinds:
          - Pod
    validate:
      message: "CPU and memory limits are required!"
      pattern:
        spec:
          containers:
          - resources:
              limits:
                memory: "?*"
                cpu: "?*"
```

### 9.4. Secrets trong Pipeline

```
SECRETS TRONG PIPELINE — ĐÚNG CÁCH
─────────────────────────────────────

  ❌ SAIIII:
  • Hardcode secrets trong workflow YAML
  • Commit .env file vào Git
  • Share Access Key giữa pipelines

  ✅ ĐÚNG — Layered approach:

  ┌── Layer 1: GitHub Secrets ───────────────────┐
  │  Cho CI-specific secrets (Sonar token, etc.) │
  │  • Encrypted at rest                         │
  │  • Not visible in logs                       │
  │  • Scoped per environment                    │
  └──────────────────────────────────────────────┘

  ┌── Layer 2: OIDC (no stored AWS secrets) ─────┐
  │  GitHub Actions → STS → Temp credentials     │
  │  • 15-minute session                         │
  │  • Scoped to repo + branch                   │
  │  • No Access Keys stored anywhere            │
  └──────────────────────────────────────────────┘

  ┌── Layer 3: AWS Secrets Manager ──────────────┐
  │  Cho runtime secrets (DB password, API keys) │
  │  • Accessed by CodeBuild via IAM Role        │
  │  • Auto-rotate                               │
  │  • Audit via CloudTrail                      │
  └──────────────────────────────────────────────┘
```

---

## 10. Cost Optimization cho CI/CD

### 10.1. CI/CD Cost Breakdown

```
CI/CD COST CHO 10 MICROSERVICES — TYPICAL
──────────────────────────────────────────

  ┌────────────────────────────────────────────────────┐
  │  Component          │ Cost/month │ Notes           │
  ├─────────────────────┼────────────┼─────────────────┤
  │  CodeBuild          │ $30-50     │ 10 svc × 5 min  │
  │  (hoặc GH Actions)  │            │ × 10 builds/day │
  │                     │            │                 │
  │  ECR Storage        │ $5-10      │ 10 svc × 20     │
  │                     │            │ images × 500MB  │
  │                     │            │                 │
  │  CodePipeline       │ $10        │ $1/pipeline ×10 │
  │  (nếu dùng)         │            │                 │
  │                     │            │                 │
  │  CodeDeploy         │ $0         │ Free cho ECS/   │
  │                     │            │ Lambda          │
  │                     │            │                 │
  │  Blue-Green extra   │ $50-100    │ 2× tasks during │
  │  compute            │            │ deployment      │
  │                     │            │(15-30min/deploy)│
  ├─────────────────────┼────────────┼─────────────────┤
  │  TOTAL              │ $95-170    │                 │
  └────────────────────────────────────────────────────┘

  So sánh nếu dùng GitHub Actions:
  ┌────────────────────────────────────────────────────┐
  │  GitHub Actions     │ $0-44      │ Free (public)   │
  │  (Team plan)        │            │$4/user (private)│
  │  ECR Storage        │ $5-10      │                 │
  │  Blue-Green compute │ $50-100    │                 │
  ├─────────────────────┼────────────┼─────────────────┤
  │  TOTAL              │ $55-154    │                 │
  └────────────────────────────────────────────────────┘
```

### 10.2. Chiến lược giảm chi phí

| Chiến lược | Tiết kiệm | Effort |
|-----------|-----------|--------|
| **ECR Lifecycle Policy** — tự xóa old images | $5-20/mo | Thấp |
| **CodeBuild caching** — S3 + Docker layer cache | $10-20/mo (faster builds) | Thấp |
| **Skip unchanged services** — monorepo change detection | 30-50% build cost | Trung bình |
| **Spot instances cho self-hosted runners** | 60-70% compute | Trung bình |
| **Right-size CodeBuild** — small thay vì medium | $10-15/mo | Thấp |
| **Rolling thay vì Blue-Green** cho non-critical | $30-50/mo (no 2× tasks) | Thấp |

```hcl
# ECR Lifecycle Policy — Giữ tối đa 20 images per service
resource "aws_ecr_lifecycle_policy" "cleanup" {
  repository = aws_ecr_repository.order_service.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep only 20 most recent images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 20
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
```

---

## 11. Ví dụ thực tế — E-Commerce CI/CD trên AWS

```
E-COMMERCE CI/CD ARCHITECTURE — PRODUCTION
─────────────────────────────────────────────

  ┌── Developer ─────────────────────────────────────────────────────┐
  │  git push → main branch                                          │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │
  ┌── GitHub ──────────────────────▼─────────────────────────────────┐
  │                                                                  │
  │  CI Workflow (.github/workflows/ci.yml)                          │
  │  ┌──────────────────────────────────────────────────────────┐    │
  │  │  1. Checkout code                                        │    │
  │  │  2. Run unit tests (parallel per service)                │    │
  │  │  3. Build Docker image                                   │    │
  │  │  4. Trivy scan (block on CRITICAL)                       │    │
  │  │  5. Push to ECR (OIDC — no stored keys)                  │    │
  │  │  6. Run integration tests                                │    │
  │  └──────────────────────────────────────────────────────────┘    │
  │                                                                  │
  │  Deploy Staging Workflow                                         │
  │  ┌──────────────────────────────────────────────────────────┐    │
  │  │  7. Deploy to ECS Staging (Rolling Update)               │    │
  │  │  8. Run E2E tests against staging                        │    │
  │  │  9. Run contract tests (Pact)                            │    │
  │  └──────────────────────────────────────────────────────────┘    │
  │                                                                  │
  │  Deploy Production Workflow                                      │
  │  ┌──────────────────────────────────────────────────────────┐    │
  │  │  10. Manual approval (GitHub Environment Protection)     │    │
  │  │  11. Deploy to ECS Prod (Blue-Green via CodeDeploy)      │    │
  │  │  12. Canary: 10% traffic → 5 min → 100%                  │    │
  │  │  13. Auto-rollback on CloudWatch Alarm (5xx > 1%)        │    │
  │  │  14. Smoke tests on prod                                 │    │
  │  └──────────────────────────────────────────────────────────┘    │
  └──────────────────────────────────────────────────────────────────┘

  ┌── AWS ───────────────────────────────────────────────────────────┐
  │                                                                  │
  │  Staging Account              Production Account                 │
  │  ┌──────────────────┐         ┌──────────────────┐               │
  │  │ ECS Cluster      │         │ ECS Cluster      │               │
  │  │ • Rolling Update │         │ • Blue-Green     │               │
  │  │ • 2 tasks/service│         │ • 4 tasks/service│               │
  │  │ • No approval    │         │ • Manual approval│               │
  │  └──────────────────┘         │ • CodeDeploy     │               │
  │                               │ • Auto-rollback  │               │
  │                               └──────────────────┘               │
  │                                                                  │
  │  Shared:                                                         │
  │  • ECR (images shared across accounts)                           │
  │  • Secrets Manager (per account, per env)                        │
  │  • CloudWatch Alarms → SNS → Slack                               │
  └──────────────────────────────────────────────────────────────────┘
```

**DORA Metrics mục tiêu:**

| Metric | Target | Đo bằng |
|--------|--------|---------|
| **Deployment Frequency** | Nhiều lần / ngày per service | GitHub Actions runs |
| **Lead Time for Changes** | < 30 phút (commit → prod) | GitHub → CloudWatch |
| **Change Failure Rate** | < 5% | CodeDeploy rollback rate |
| **Mean Time to Recovery** | < 15 phút | CodeDeploy rollback time |

---

## 12. Anti-patterns

| # | Anti-pattern | Vấn đề | Giải pháp |
|---|-------------|--------|-----------|
| 1 | **Stored AWS Access Keys trong CI** | Long-lived credentials, dễ leak | OIDC federation (GitHub → STS) |
| 2 | **1 pipeline cho tất cả services** | Shared failure, slow, blocking | Pipeline per service |
| 3 | **Không scan images** | Vulnerable containers lên production | Trivy (CI) + ECR scan (continuous) |
| 4 | **Deploy trực tiếp lên prod** | Không test, không safety net | Stage → Test → Approve → Prod |
| 5 | **Không auto-rollback** | Failed deploy = downtime kéo dài | CloudWatch Alarm + CodeDeploy rollback |
| 6 | **ECR không có lifecycle policy** | Image storage cost tăng vô hạn | Keep 20 images, xóa old |
| 7 | **Blue-Green cho mọi service** | Tốn 2× compute cost mỗi deploy | Rolling cho non-critical, B/G cho critical |
| 8 | **GitOps cho ECS** | Không có controller (ArgoCD = K8s only) | Push-based (GitHub Actions) cho ECS |
| 9 | **Manual kubectl apply** | Không audit trail, error-prone | ArgoCD / Helm + CI/CD pipeline |
| 10 | **Không cache builds** | Slow CI (12+ min per build) | S3 cache + Docker layer cache |

---

## 13. Checklist triển khai

### CI Pipeline

- [ ] Build tự động khi push to main branch
- [ ] Unit tests + integration tests chạy trong CI
- [ ] Docker image build với multi-stage (small final image)
- [ ] Image scanning (Trivy) — block on CRITICAL
- [ ] Push image to ECR với immutable tags (git SHA)
- [ ] Build cache enabled (S3 + Docker layers)
- [ ] Build time < 5 phút

### CD Pipeline

- [ ] Staging deploy tự động sau CI pass
- [ ] E2E tests chạy trên staging
- [ ] Manual approval trước production deploy
- [ ] Production deploy strategy phù hợp (Rolling / Blue-Green / Canary)
- [ ] Auto-rollback on CloudWatch Alarm
- [ ] Smoke tests sau production deploy
- [ ] Rollback time < 5 phút

### Security

- [ ] OIDC authentication (không stored access keys)
- [ ] IAM Role per pipeline stage (least privilege)
- [ ] Secrets từ Secrets Manager / Parameter Store (không hardcode)
- [ ] ECR image scanning enabled (Enhanced / Basic)
- [ ] Policy as Code (Kyverno / OPA) cho EKS

### Operations

- [ ] ECR Lifecycle Policy (giữ tối đa 20 images)
- [ ] Pipeline notifications → Slack/Teams
- [ ] DORA metrics tracking
- [ ] Pipeline documentation cho onboarding
- [ ] Disaster recovery plan cho CI/CD infrastructure

---

## 14. Tổng kết

```
┌───────────────────────────────────────────────────────────────────┐
│             CI/CD DECISION GUIDE trên AWS                         │
│                                                                   │
│  CI Tool:                                                         │
│  • GitHub Actions (recommended) — ecosystem lớn, OIDC, free       │
│  • CodeBuild — khi cần VPC access, all-in AWS                     │
│                                                                   │
│  CD Tool:                                                         │
│  • ECS: GitHub Actions + CodeDeploy (Blue-Green/Canary)           │
│  • EKS: ArgoCD (GitOps) + Argo Rollouts (advanced deploy)         │
│  • Lambda: SAM / CDK + CodeDeploy (Canary native)                 │
│                                                                   │
│  Deploy Strategy:                                                 │
│  • Non-critical → Rolling Update (simple, cheap)                  │
│  • Critical → Blue-Green (instant rollback)                       │
│  • User-facing → Canary (gradual, safe)                           │
│                                                                   │
│  GitOps:                                                          │
│  • EKS → ArgoCD + ApplicationSet + Image Updater                  │
│  • ECS → Push-based (GitHub Actions) — KHÔNG dùng GitOps          │
│                                                                   │
│  Security:                                                        │
│  • OIDC (no stored keys) + Trivy scan + ECR scan                  │
│  • Kyverno/OPA cho K8s policy enforcement                         │
│                                                                   │
│  Cost (10 services):                                              │
│  • GitHub Actions + ECR + CodeDeploy ≈ $55-154/mo                 │
│  • CodePipeline + CodeBuild + ECR ≈ $95-170/mo                    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Key takeaways:**

1. **GitHub Actions + OIDC = CI/CD tốt nhất cho hầu hết teams** — no stored credentials, ecosystem lớn, free cho public repos
2. **ECS dùng Push-based, EKS dùng GitOps** — mỗi platform có approach phù hợp riêng
3. **Blue-Green cho critical services, Rolling cho còn lại** — đừng over-engineer deployment strategy
4. **Image scanning là bắt buộc** — Trivy trong CI + ECR Enhanced Scanning cho continuous
5. **ArgoCD ApplicationSet = GitOps tự động** — thêm service mới chỉ cần thêm thư mục
6. **DORA metrics đo hiệu quả** — Lead Time < 30 min, Change Failure Rate < 5%

---

## 15. Liên kết liên quan

- [14 — CI/CD & Deployment Strategies](14-cicd-deployment.md) — Lý thuyết CI/CD, Rolling, Blue-Green, Canary, GitOps
- [12 — Containerization](12-containerization.md) — Docker build, multi-stage, image optimization
- [13 — Orchestration](13-orchestration.md) — Kubernetes, Helm, ArgoCD basics
- [18 — Triển khai & Kiến trúc tổng quan](18-aws-deployment-architecture.md) — ECS vs EKS vs Lambda, multi-account
- [22 — Observability trên AWS](22-aws-observability.md) — CloudWatch Alarms (dùng cho auto-rollback)
- [23 — Security trên AWS](23-aws-security.md) — IAM Roles, Secrets Manager, ECR scanning
- [25 — Case Study: E-Commerce](25-case-study-ecommerce.md) — Áp dụng tổng hợp
