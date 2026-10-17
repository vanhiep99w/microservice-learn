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

> 📌 Lưu ý: Các ước tính chi phí trong tài liệu là **tham khảo theo thời điểm viết**. Giá thực tế phụ thuộc region, mức sử dụng, và có thể thay đổi; luôn đối chiếu AWS Pricing trước khi triển khai.

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

```d2 title="AWS-native CI/CD — CodePipeline điều phối"
direction: right
pipeline: "CodePipeline — Orchestrator\nSource → Build → Test → Deploy\nManual approval • Cross-account" {
 source: CodeCommit / GitHub / GitLab
 build: "CodeBuild\nBuild • Test • Scan • Push image\nManaged compute • Docker support\nPay per minute"
 deploy: "CodeDeploy\nDeployment automation\nBlue-Green / Canary theo target\nAuto rollback"
 source -> build -> deploy
}
# Icons: https://icons.d2lang.com/
pipeline.icon: "https://icons.d2lang.com/aws/Developer%20Tools/AWS-CodePipeline.svg"
pipeline.build.icon: "https://icons.d2lang.com/aws/Developer%20Tools/AWS-CodeBuild.svg"
pipeline.deploy.icon: "https://icons.d2lang.com/aws/Developer%20Tools/AWS-CodeDeploy.svg"
```

Deployment strategy phụ thuộc compute target. Ví dụ ECS rolling update do ECS scheduler quản lý, không phải CodeDeploy ECS blue-green.

### 2.2. GitHub Actions + AWS — Hybrid Approach

Nhiều team chọn **GitHub Actions** cho CI/CD thay vì AWS-native stack — linh hoạt hơn, ecosystem lớn hơn, developer experience tốt hơn.

```d2 title="GitHub Actions và AWS — Hybrid Stack"
direction: down
github: GitHub {
 repo: "Repository — .github/workflows\nci.yml — Build + Test\ndeploy-staging.yml\ndeploy-prod.yml"
 runners: "GitHub Actions Runners\nGitHub-hosted / Self-hosted EC2"
 repo -> runners
}
aws: AWS {
 ecr: ECR
 ecs: ECS
 eks: EKS
 lambda: Lambda
 ecr -> ecs
 ecr -> eks
 ecr -> lambda
}
github.runners -> aws.ecr: OIDC — không lưu access keys
# Icons: https://icons.d2lang.com/
github.icon: "https://icons.d2lang.com/dev/github.svg"
github.runners.icon: "https://icons.d2lang.com/dev/github.svg"
aws.ecr.icon: "https://icons.d2lang.com/aws/Compute/Amazon-EC2-Container-Registry.svg"
aws.ecs.icon: "https://icons.d2lang.com/aws/Compute/Amazon-Elastic-Container-Service.svg"
aws.eks.icon: "https://icons.d2lang.com/aws/Compute/Amazon-Elastic-Kubernetes-Service.svg"
aws.lambda.icon: "https://icons.d2lang.com/aws/Compute/AWS-Lambda.svg"
aws.icon: "https://icons.d2lang.com/dev/amazonwebservices.svg"
```

GitHub Actions đảm nhiệm CI/CD; AWS đảm nhiệm hạ tầng deployment.

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

```d2 title="3.1. CodePipeline Architecture"
direction: right
s0: "1. Source — Push main\nGitHub connection"
s1: "2. CodeBuild\nBuild / Unit / Integration tests\nPush ECR / Scan registry artifact\nOutput imageDetail.json theo action needs"
s2: "3. Deploy ECS Staging\nECS Rolling Update / Deployment gates"
s3: "4. CodeBuild E2E + Smoke Tests\nAgainst staging"
s4: "5. Manual Approval — Tech lead / SRE\nSNS/Slack notification + Review link"
s5: "6. CodeDeploy ECS Production Blue-Green\nSupported canary/linear traffic policy\nCloudWatch auto-rollback"
s0 -> s1
s1 -> s2
s2 -> s3
s3 -> s4
s4 -> s5
```

ECS rolling update do ECS scheduler triển khai, không dùng CodeDeploy ECS blue-green action như một rolling strategy. Traffic10→50→100% mỗi10phút là custom rollout intent, không mặc định là mọi CodeDeploy preset; artifact formats phụ thuộc action/provider.

### 3.2. Multi-Service Pipeline Design

```d2 title="3.2. Multi-Service Pipeline Design"
direction: down
per_service: Independent Service Pipelines {
 order: Order — Source / Build / Stage / Prod
 payment: Payment — Source / Build / Stage / Prod
 user: User — Source / Build / Stage / Prod
}
mono: Monorepo + Change Detection {
 source: Source / Changed files + Dependency graph
 order: Build + Deploy Order
 payment: Build + Deploy Payment
 dependents: Build + Deploy affected dependents
 source -> order: services/order changed
 source -> payment: services/payment changed
 source -> dependents: shared/lib changed
}
```

Per-service pipelines có ownership và failure isolation. Monorepo giảm config/repos nhưng cần affected detection; pipeline failure có block mọi service hay không phụ thuộc DAG/gates thiết kế, không phải đặc tính bắt buộc của monorepo.

### 3.3. Cross-Account Pipeline

Trong multi-account strategy (xem [doc 18](18-aws-deployment-architecture.md)), pipeline chạy ở **Tooling Account**, deploy sang **Staging/Prod Account**.

```d2 title="3.3. Cross-Account Pipeline"
direction: down
tooling: Tooling Account111111111111 {
 source: Source
 build: CodeBuild
 ecr: ECR
 source -> build -> ecr
}
staging: Staging222222222222 { role: Deploy Role; ecs: ECS Cluster; role -> ecs }
prod: Prod333333333333 { role: Deploy Role; ecs: ECS Cluster; role -> ecs }
dr: DR444444444444 { role: Deploy Role; ecs: ECS Cluster; role -> ecs }
tooling.build -> staging.role: AssumeRole
tooling.build -> prod.role: AssumeRole
tooling.build -> dr.role: AssumeRole
# Icons: https://icons.d2lang.com/
tooling.build.icon: "https://icons.d2lang.com/aws/Developer%20Tools/AWS-CodeBuild.svg"
tooling.ecr.icon: "https://icons.d2lang.com/aws/Compute/Amazon-EC2-Container-Registry.svg"
staging.ecs.icon: "https://icons.d2lang.com/aws/Compute/Amazon-Elastic-Container-Service.svg"
prod.ecs.icon: "https://icons.d2lang.com/aws/Compute/Amazon-Elastic-Container-Service.svg"
dr.ecs.icon: "https://icons.d2lang.com/aws/Compute/Amazon-Elastic-Container-Service.svg"
```

Account IDs minh họa; trust/resource/artifact-KMS policies và environment approvals phải giới hạn đúng pipeline principal.

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

```yaml source="snippets/4-2-buildspec-yml-chi-tiet.yaml"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F4-2-buildspec-yml-chi-tiet.yaml)

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

```d2 title="5.1. CodeDeploy cho ECS"
direction: down
test: Bước1 — Install Green / Test {
 prod: ALB Listener443 — production
 test: ALB Listener8443 — optional test
 blue: Blue Target Group v1
 green: Green Target Group v2
 prod -> blue: 100%
 test -> green: Test traffic
}
shift: Bước2 — Shift Canary {
 prod: ALB Listener443
 blue: Blue v1
 green: Green v2
 alarm: CloudWatch Alarm
 prod -> blue: 90%
 prod -> green: 10%
 alarm -> blue: Rollback100% nếu configured alarm breach
}
complete: Bước3 — 100%Green / Blue0% giữ tới termination window
# Icons: https://icons.d2lang.com/
test.prod.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Elastic-Load-Balancing-ELB_Application-load-balancer_light-bg.svg"
test.test.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Elastic-Load-Balancing-ELB_Application-load-balancer_light-bg.svg"
shift.prod.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Elastic-Load-Balancing-ELB_Application-load-balancer_light-bg.svg"
shift.alarm.icon: "https://icons.d2lang.com/aws/Management%20%26%20Governance/Amazon-CloudWatch.svg"
```

Tiếp tục shifting khi metrics/gates đạt; terminate Blue theo deployment policy/rollback window chứ không luôn xóa ngay tại thời điểm100%Green.

**AppSpec cho ECS Blue-Green:**

```yaml source="snippets/5-1-codedeploy-cho-ecs.yaml"
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

**AppSpec ECS: task definition và lifecycle hooks — điểm cần đọc:**

- **Nối task definition với container nhận traffic** (dòng 4–12): Tên container và port phải khớp task definition. Placeholder TASK_DEFINITION được pipeline thay trước deploy.
- **Kiểm thử tại các mốc traffic** (dòng 14–19): Hooks là các Lambda do team cung cấp; khai báo tên không tự tạo hoặc kiểm chứng logic validation.

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F5-1-codedeploy-cho-ecs.yaml)

**Lifecycle hooks — Khi nào chạy test:**

```d2 title="5.1. CodeDeploy cho ECS"
direction: down
s0: "BeforeInstall — pre-install validation"
s1: "Install — ECS provision Green tasks"
s2: "AfterInstall — health / warm-up validation"
s3: "AllowTestTraffic — route optional test listener"
s4: "AfterAllowTestTraffic — E2E tests"
s5: "BeforeAllowTraffic — final validation"
s6: "AllowTraffic — shift production traffic"
s7: "AfterAllowTraffic — smoke tests"
s8: "Complete hoặc rollback theo result / alarms"
s0 -> s1
s1 -> s2
s2 -> s3
s3 -> s4
s4 -> s5
s5 -> s6
s6 -> s7
s7 -> s8
```

Các phase events và Lambda validation hooks khác nhau; không phải mỗi phase đều là hook tùy ý sửa. DB migration nên có dedicated compatible migration job/recovery plan, tránh destructive migration trong app deployment hook.

### 5.2. CodeDeploy cho Lambda

Lambda hỗ trợ **Canary** và **Linear** traffic shifting natively:

```d2 title="5.2. CodeDeploy cho Lambda"
direction: down
canary: Canary10Percent5Minutes {
 first: t0 — New10% / Old90%
 next: t5phút — New100% nếu gates OK
 first -> next
}
linear: Linear10PercentEvery1Minute {
 first: t0 — New10%
 second: t1phút — New20%
 third: t2phút — New30%
 end: t9phút — New100%
 first -> second -> third -> end
}
all: AllAtOnce { switch: t0 — New100% }
```

Trên Lambda deployment cần version/alias và supported CodeDeploy configuration. Các con số mô tả traffic policy, không phải đảm bảo end-to-end deployment/rollback hoàn tất đúng ở mỗi timestamp.

```yaml source="snippets/5-2-codedeploy-cho-lambda.yaml"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F5-2-codedeploy-cho-lambda.yaml)

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

Giả định ECS Service có `desiredCount: 4`, `minimumHealthyPercent: 50` (ít nhất 2 healthy tasks) và `maximumPercent: 200` (tối đa 8 tasks trong deployment, theo scheduler). Các node là snapshot **minh họa**, không phải một lịch cố định ECS cam kết.

```d2 title="ECS Rolling Update — ví dụ desired count bốn tasks"
direction: down
initial: "1 · v1 ×4"
surge1: "2 · v1 ×4 + v2 ×2\nChờ v2 healthy"
drain1: "3 · v1 ×2 + v2 ×2"
surge2: "4 · v1 ×2 + v2 ×4\nChờ v2 mới healthy"
done: "5 · v2 ×4\nDrain hết v1 — 100% v2"
initial -> surge1: Thêm tasks trong maximumPercent
surge1 -> drain1: Drain hai v1 khi đủ healthy tasks
 drain1 -> surge2: Thêm hai v2
surge2 -> done: Drain hai v1 cuối
```

```hcl source="snippets/6-1-rolling-update-ecs-default.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F6-1-rolling-update-ecs-default.tf)

### 6.2. Blue-Green Deployment — ECS + ALB

**Blue-Green** dùng **CodeDeploy** + 2 Target Groups trên ALB — instant rollback, zero downtime.

```hcl source="snippets/6-2-blue-green-deployment-ecs-alb.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F6-2-blue-green-deployment-ecs-alb.tf)

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

```hcl source="snippets/6-3-canary-deployment-lambda-eks.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F6-3-canary-deployment-lambda-eks.tf)

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

```d2 title="6.4. So sánh Deployment Strategies trên AWS"
direction: right
critical: "Service critical?"
rolling: "Rolling Update — đơn giản/cost-efficient"
analysis: "Cần canary analysis / progressive exposure?"
canary: "Canary — supported CodeDeploy/Controller strategy"
fast: "Cần switchback nhanh và đủ capacity?"
bg: "Blue-Green — giữ old environment trong rollback window"
critical -> rolling: "Không / chấp nhận trade-off"
critical -> analysis: "Có"
analysis -> canary: "Có"
analysis -> fast: "Không"
fast -> bg: "Có"
```

Chọn theo risk/compatibility/resources/metrics gates. Yêu cầu rollback<1phút phải kiểm nghiệm trên routing/data/state thực, không coi Blue-Green là bảo đảm instant rollback của toàn hệ thống.

---

## 7. GitHub Actions + AWS — Pipeline thực tế

### 7.1. OIDC Authentication — Không cần Access Keys

```d2 title="GitHub Actions — OIDC Federation"
direction: right
old: "Cũ — Long-lived Keys" {
 secrets: GitHub Secrets
 aws: AWS
 secrets -> aws: Access Key / Secret — long-lived
}
new: "Mới — OIDC" {
 actions: GitHub Actions
 sts: AWS STS / IAM Role
 apis: ECR / ECS / AWS APIs
 actions -> sts: 1. JWT Token
 sts -> actions: 2. Temporary credentials
 actions -> apis: 3. Use AWS APIs
}
# Icons: https://icons.d2lang.com/
old.secrets.icon: "https://icons.d2lang.com/dev/github.svg"
new.actions.icon: "https://icons.d2lang.com/dev/github.svg"
old.aws.icon: "https://icons.d2lang.com/dev/amazonwebservices.svg"
```

Thời hạn temporary credentials phụ thuộc session configuration và giới hạn của STS/role; không luôn cố định 15 phút.

```hcl source="snippets/7-1-oidc-authentication-khong-can-access-keys.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F7-1-oidc-authentication-khong-can-access-keys.tf)

### 7.2. CI/CD Pipeline hoàn chỉnh cho ECS

```yaml source="snippets/7-2-ci-cd-pipeline-hoan-chinh-cho-ecs.yaml"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F7-2-ci-cd-pipeline-hoan-chinh-cho-ecs.yaml)

### 7.3. Matrix Build cho Multi-Service Monorepo

```yaml source="snippets/7-3-matrix-build-cho-multi-service-monorepo.yaml"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F7-3-matrix-build-cho-multi-service-monorepo.yaml)

---

## 8. GitOps trên AWS — ArgoCD + EKS

### 8.1. ArgoCD trên EKS — Setup

Trong [doc 14](14-cicd-deployment.md), ta đã hiểu **GitOps = Git là Source of Truth**. Trên EKS, **ArgoCD** là GitOps controller phổ biến nhất.

```d2 title="8.1. ArgoCD trên EKS — Setup"
direction: right
git: Git Manifests — Order / Payment / User deployment-service-kustomization
cluster: EKS {
 argo: ArgoCD {
  controller: Application Controller — Drift / Sync / Self-heal policy
  ui: UI — Topology / Sync / Diff / History
 }
 apps: Workloads {
  order: Order ×3
  payment: Payment ×2
  user: User ×3
 }
 argo.controller -> apps: Apply / Reconcile manifests
 argo.ui -- argo.controller
}
cluster.argo.controller -> git: Poll ví dụ3phút / Webhook trigger
# Icons: https://icons.d2lang.com/
cluster.icon: "https://icons.d2lang.com/aws/Compute/Amazon-Elastic-Kubernetes-Service.svg"
```

Webhook trigger không bảo đảm apply tức thời. Auto-sync/self-heal theo policy; rollback cần phối hợp source of truth (revert Git/desired version), không chỉ click UI rồi để controller sync lại revision mới.

**Install ArgoCD trên EKS:**

```bash source="snippets/8-1-argocd-tren-eks-setup.sh"
# 1. Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 2. Expose qua ALB (Ingress)
# Hoặc dùng kubectl port-forward cho dev
kubectl port-forward svc/argocd-server -n argocd 8080:443

# 3. Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F8-1-argocd-tren-eks-setup.sh)

### 8.2. ApplicationSet — Multi-Service GitOps

**ApplicationSet** tự động tạo ArgoCD Application cho từng service — không cần config thủ công mỗi service.

```yaml source="snippets/8-2-applicationset-multi-service-gitops.yaml"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F8-2-applicationset-multi-service-gitops.yaml)

> 💡 Thêm thư mục mới `services/notification-service/` → ArgoCD **tự động** tạo Application và deploy — không cần chỉnh config gì!

### 8.3. Image Updater — Auto-deploy on new image

**ArgoCD Image Updater** theo dõi ECR registry — khi có image mới, tự động update manifest trong Git → trigger deploy.

```d2 title="8.3. Image Updater — Auto-deploy on new image"
direction: right
s0: "GitHub Actions — Push code / Build / Test"
s1: "Push ECR — order-service:v1.2.3"
s2: "ArgoCD Image Updater\nPoll ví dụ2phút / Detect semver tag"
s3: "Git write-back\nCommit image update theo policy"
s4: "ArgoCD detect Git revision"
s5: "Sync / Deploy EKS theo gates"
s0 -> s1
s1 -> s2
s2 -> s3
s3 -> s4
s4 -> s5
```

CI không trực tiếp deploy trong mô hình này. Bảo vệ registry trust, image immutability/digests, write-back permissions và production approval; không auto-promote mọi tag ngoài ý muốn.

```yaml source="snippets/8-3-image-updater-auto-deploy-on-new-image.yaml"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F8-3-image-updater-auto-deploy-on-new-image.yaml)

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

```d2 title="9.2. Image Scanning — ECR + Trivy"
direction: right
build: "Docker Build"
trivy: "Trivy CI Scan\nOS / App dependencies / Config / Secret scanning theo enabled scanners"
block: "CRITICAL → Block pipeline theo policy"
ecr: "Push ECR"
inspector: "ECR Enhanced Scanning — Inspector\nRegistry / Continuous findings theo configuration"
build -> trivy
trivy -> block: "Policy violation"
trivy -> ecr: "Pass"
ecr -> inspector
# Icons: https://icons.d2lang.com/
build.icon: "https://icons.d2lang.com/dev/docker.svg"
inspector.icon: "https://icons.d2lang.com/aws/Compute/Amazon-EC2-Container-Registry.svg"
```

Dockerfile/config/secret scanners có flags/input-specific support; không mặc định image scan tự bao phủ mọi repository/misconfiguration. Scan trước push và registry scan sau push là hai lớp khác nhau.

```yaml source="snippets/9-2-image-scanning-ecr-trivy.yaml"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F9-2-image-scanning-ecr-trivy.yaml)

### 9.3. Policy as Code — OPA / Kyverno

**Policy as Code** đảm bảo deployments tuân thủ security policies trước khi được apply lên cluster.

```yaml source="snippets/9-3-policy-as-code-opa-kyverno.yaml"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F9-3-policy-as-code-opa-kyverno.yaml)

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

```hcl source="snippets/10-2-chien-luoc-giam-chi-phi.tf"
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

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=24-aws-cicd-deployment&snapshot=article&file=snippets%2F10-2-chien-luoc-giam-chi-phi.tf)

---

## 11. Ví dụ thực tế — E-Commerce CI/CD trên AWS

```d2 title="11. Ví dụ thực tế — E-Commerce CI/CD trên AWS"
direction: right
s0: "Developer git push main"
s1: "GitHub CI\nCheckout → Parallel per-service unit tests → Build images\nTrivy block CRITICAL → OIDC Push ECR → Integration tests"
s2: "Staging Account\nECS rolling • 2tasks/service • E2E / Pact"
s3: "GitHub Environment Protection\nManual approval"
s4: "Production Account\nCodeDeploy ECS Blue-Green • 4tasks/service\nCanary10%/5phút→100% theo configuration"
s5: "CloudWatch alarm5xx>1% → Rollback policy\nProd Smoke Tests"
s0 -> s1
s1 -> s2
s2 -> s3
s3 -> s4
s4 -> s5
# Icons: https://icons.d2lang.com/
s1.icon: "https://icons.d2lang.com/dev/github.svg"
s3.icon: "https://icons.d2lang.com/dev/github.svg"
```

Shared ECR images theo cross-account policy; Secrets Manager tách account/environment; alarms qua SNS/Slack. Staging/prod nên promote cùng immutable artifact, không rebuild sau staging.

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
