# Security & Zero Trust trên AWS

## 📋 Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
- [2. IAM — Service-to-Service Identity](#2-iam--service-to-service-identity)
  - [2.1. IAM Roles cho ECS Tasks / EKS Pods / Lambda](#21-iam-roles-cho-ecs-tasks--eks-pods--lambda)
  - [2.2. Least Privilege — Cách viết IAM Policy đúng](#22-least-privilege--cách-viết-iam-policy-đúng)
  - [2.3. Cross-Account Access](#23-cross-account-access)
- [3. Authentication & Authorization với Amazon Cognito](#3-authentication--authorization-với-amazon-cognito)
  - [3.1. Cognito User Pools — Authentication](#31-cognito-user-pools--authentication)
  - [3.2. Cognito Identity Pools — Federated Identity](#32-cognito-identity-pools--federated-identity)
  - [3.3. JWT & Token Management](#33-jwt--token-management)
  - [3.4. Cognito + API Gateway Integration](#34-cognito--api-gateway-integration)
  - [3.5. So sánh Cognito vs Keycloak vs Auth0 trên AWS](#35-so-sánh-cognito-vs-keycloak-vs-auth0-trên-aws)
- [4. mTLS & Service-to-Service Security trên AWS](#4-mtls--service-to-service-security-trên-aws)
  - [4.1. Các lựa chọn triển khai mTLS](#41-các-lựa-chọn-triển-khai-mtls)
  - [4.2. Mẫu cấu hình mTLS (tham khảo)](#42-mẫu-cấu-hình-mtls-tham-khảo)
  - [4.3. Authorization policy giữa services](#43-authorization-policy-giữa-services)
  - [4.4. Service Connect vs Istio vs App Mesh (legacy)](#44-service-connect-vs-istio-vs-app-mesh-legacy)
- [5. Secrets Management trên AWS](#5-secrets-management-trên-aws)
  - [5.1. AWS Secrets Manager](#51-aws-secrets-manager)
  - [5.2. AWS Systems Manager Parameter Store](#52-aws-systems-manager-parameter-store)
  - [5.3. Tích hợp Secrets vào ECS / EKS / Lambda](#53-tích-hợp-secrets-vào-ecs--eks--lambda)
  - [5.4. KMS — Encryption at Rest & in Transit](#54-kms--encryption-at-rest--in-transit)
- [6. Network Security — VPC & Isolation](#6-network-security--vpc--isolation)
  - [6.1. VPC Design cho Microservice](#61-vpc-design-cho-microservice)
  - [6.2. Security Groups — Stateful Firewall](#62-security-groups--stateful-firewall)
  - [6.3. NACLs — Network Access Control Lists](#63-nacls--network-access-control-lists)
  - [6.4. VPC Endpoints — PrivateLink](#64-vpc-endpoints--privatelink)
  - [6.5. AWS WAF & Shield](#65-aws-waf--shield)
- [7. Zero Trust Architecture trên AWS](#7-zero-trust-architecture-trên-aws)
  - [7.1. Zero Trust Principles áp dụng cho AWS](#71-zero-trust-principles-áp-dụng-cho-aws)
  - [7.2. Triển khai Zero Trust — Từng Layer](#72-triển-khai-zero-trust--từng-layer)
  - [7.3. AWS Verified Access](#73-aws-verified-access)
- [8. Audit & Compliance](#8-audit--compliance)
  - [8.1. AWS CloudTrail — API Activity Logging](#81-aws-cloudtrail--api-activity-logging)
  - [8.2. AWS Config — Configuration Compliance](#82-aws-config--configuration-compliance)
  - [8.3. AWS Security Hub](#83-aws-security-hub)
  - [8.4. Amazon GuardDuty — Threat Detection](#84-amazon-guardduty--threat-detection)
- [9. Ví dụ thực tế — E-Commerce Security Architecture](#9-ví-dụ-thực-tế--e-commerce-security-architecture)
- [10. Anti-patterns](#10-anti-patterns)
- [11. Checklist triển khai](#11-checklist-triển-khai)
- [12. Tổng kết](#12-tổng-kết)
- [13. Liên kết liên quan](#13-liên-kết-liên-quan)

---

## 1. Giới thiệu

Trong [doc 15 — Security](15-security.md), chúng ta đã hiểu lý thuyết về Authentication, Authorization, mTLS, JWT, Zero Trust, Secrets Management, và Network Security trong kiến trúc Microservice. Doc này **áp dụng tất cả kiến thức đó vào thực tế trên AWS** — mapping từng khái niệm bảo mật sang AWS service cụ thể, từ cấu hình chi tiết đến best practices.

Doc này trả lời câu hỏi: **IAM Roles cho service-to-service auth cấu hình thế nào? Cognito dùng ra sao cho AuthN/AuthZ? mTLS service-to-service triển khai bằng cách nào trên AWS? Secrets Manager vs Parameter Store chọn khi nào? VPC/Security Groups thiết kế thế nào cho Microservice? Zero Trust áp dụng trên AWS ra sao?**

> 💡 Giả định: Bạn đã đọc [doc 15](15-security.md) và hiểu lý thuyết. Doc này tập trung vào **cách AWS hiện thực hóa** các khái niệm đó.

```
MAPPING: LÝ THUYẾT SECURITY → AWS SERVICES
─────────────────────────────────────────────

  Lý thuyết (doc 15)              AWS Service
  ─────────────────               ───────────
  Authentication (AuthN)     →    Amazon Cognito User Pools
  Authorization (AuthZ)      →    IAM Policies, Cognito Groups
  OAuth 2.0 / OIDC           →    Cognito + API Gateway Authorizer
  JWT Validation             →    API Gateway, Lambda Authorizer
  mTLS                       →    Service Connect / Istio / legacy App Mesh
  Service Identity (SPIFFE)  →    IAM Roles (Task Role, IRSA)
  Secrets Management         →    Secrets Manager, Parameter Store
  Network Security           →    VPC, Security Groups, NACLs
  WAF                        →    AWS WAF
  Zero Trust                 →    Verified Access, IAM + VPC + mTLS
  Audit & Compliance         →    CloudTrail, Config, Security Hub
  Threat Detection           →    GuardDuty, Detective

  ┌──────────────────────────────────────────────────────────────┐
  │                    AWS SECURITY LAYERS                       │
  │                                                              │
  │   ┌─── Edge ──────────────────────────────────────────────┐  │
  │   │  CloudFront + WAF + Shield                            │  │
  │   └───────────────────────┬───────────────────────────────┘  │
  │   ┌─── API ───────────────▼───────────────────────────────┐  │
  │   │  API Gateway + Cognito Authorizer                     │  │
  │   └───────────────────────┬───────────────────────────────┘  │
  │   ┌─── Network ───────────▼───────────────────────────────┐  │
  │   │  VPC + Security Groups + NACLs + PrivateLink          │  │
  │   └───────────────────────┬───────────────────────────────┘  │
  │   ┌─── Service ───────────▼───────────────────────────────┐  │
  │   │  IAM Roles + service-to-service TLS/mTLS              │  │
  │   └───────────────────────┬───────────────────────────────┘  │
  │   ┌─── Data ──────────────▼───────────────────────────────┐  │
  │   │  KMS + Secrets Manager + RDS Encryption               │  │
  │   └───────────────────────────────────────────────────────┘  │
  │                                                              │
  │   ┌─── Audit (cross-cutting) ─────────────────────────────┐  │
  │   │  CloudTrail + Config + Security Hub + GuardDuty       │  │
  │   └───────────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────────────┘
```

> 📖 Tham khảo thêm: [doc 16 — Configuration & Secrets Management](16-configuration-secrets-management.md) cho lý thuyết config/secrets, [doc 19 — Communication trên AWS](19-aws-communication-discovery.md) cho Service Connect/VPC Lattice và App Mesh (legacy).

---

## 2. IAM — Service-to-Service Identity

Trong [doc 15](15-security.md), ta đã nói về **Service Identity** (SPIFFE) — mỗi service cần có danh tính riêng. Trên AWS, **IAM Roles** đóng vai trò này — mỗi service (ECS Task, EKS Pod, Lambda Function) có một IAM Role riêng, xác định chính xác service đó được phép làm gì.

### 2.1. IAM Roles cho ECS Tasks / EKS Pods / Lambda

```d2 title="2.1. IAM Roles cho ECS Tasks / EKS Pods / Lambda"
direction: down
ecs: ECS Task Definition {
 app: App Container
 agent: ECS Agent / Infrastructure
 task: Task Role — Business AWS API permissions
 execution: Task Execution Role — Pull image / Inject secrets / Logs
 app -> task
 agent -> execution
}
eks: EKS IRSA {
 pod: Pod
 sa: Kubernetes ServiceAccount
 sts: OIDC Federation / STS
 role: IAM Role + Policies
 pod -> sa -> sts -> role
}
lambda: Lambda Function { code: Function Code; role: Execution Role — AWS APIs / Logs; code -> role }
# Icons: https://icons.d2lang.com/
ecs.icon: "https://icons.d2lang.com/aws/Compute/Amazon-Elastic-Container-Service.svg"
eks.icon: "https://icons.d2lang.com/aws/Compute/Amazon-Elastic-Kubernetes-Service.svg"
eks.sa.icon: "https://icons.d2lang.com/azure/_Companies/Kubernetes.svg"
lambda.icon: "https://icons.d2lang.com/aws/Compute/AWS-Lambda.svg"
eks.role.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Identify-and-Access-Management_IAM.svg"
```

Role permissions và trust policy khác nhau. IRSA role chỉ được assume khi token/trust conditions match SA/namespace/audience; EKS Pod Identity là một lựa chọn khác. Prefer least-privilege role theo workload, không dùng chung node role rộng cho mọi Pod.

**ECS — Task Role vs Task Execution Role:**

| Thuộc tính | Task Role | Task Execution Role |
|-----------|-----------|-------------------|
| **Ai dùng?** | Application code trong container | ECS Agent (infrastructure) |
| **Dùng để làm gì?** | Gọi AWS APIs (S3, DynamoDB, SQS...) | Pull image từ ECR, lấy secrets |
| **Scope** | Khác nhau theo từng service | Có thể share giữa nhiều services |
| **Ví dụ permission** | `s3:GetObject`, `dynamodb:Query` | `ecr:GetAuthorizationToken`, `secretsmanager:GetSecretValue` |

```json source="snippets/2-1-iam-roles-cho-ecs-tasks-eks-pods-lambda.json"
// Task Role — Order Service chỉ được đọc/ghi DynamoDB table "orders"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:ap-southeast-1:123456789:table/orders"
    },
    {
      "Effect": "Allow",
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:ap-southeast-1:123456789:order-events"
    }
  ]
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F2-1-iam-roles-cho-ecs-tasks-eks-pods-lambda.json)

```json source="snippets/2-1-iam-roles-cho-ecs-tasks-eks-pods-lambda-2.json"
// Task Execution Role — Chung cho nhiều services
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:ap-southeast-1:123456789:log-group:/ecs/*"
    },
    {
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:ap-southeast-1:123456789:secret:prod/*"
    }
  ]
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F2-1-iam-roles-cho-ecs-tasks-eks-pods-lambda-2.json)

**EKS — IRSA (IAM Roles for Service Accounts):**

IRSA là cơ chế cho phép **từng Pod** trong EKS cluster có IAM Role riêng, thay vì dùng chung Node Role (anti-pattern).

```yaml source="snippets/2-1-iam-roles-cho-ecs-tasks-eks-pods-lambda-3.yaml"
# 1. Tạo Kubernetes ServiceAccount liên kết với IAM Role
apiVersion: v1
kind: ServiceAccount
metadata:
  name: order-service-sa
  namespace: production
  annotations:
    # Liên kết SA này với IAM Role
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/order-service-role

---
# 2. Pod spec reference ServiceAccount
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: production
spec:
  template:
    spec:
      serviceAccountName: order-service-sa  # ← Pod dùng SA này
      containers:
      - name: order-service
        image: 123456789.dkr.ecr.ap-southeast-1.amazonaws.com/order-service:latest
        # AWS SDK tự động dùng IRSA credentials — KHÔNG cần config gì thêm
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F2-1-iam-roles-cho-ecs-tasks-eks-pods-lambda-3.yaml)

> ⚠️ **Anti-pattern**: Dùng EC2 Instance Role (Node Role) cho tất cả Pods — mọi Pod đều có cùng quyền. IRSA cho phép **Pod-level isolation**, đúng tinh thần Least Privilege.

### 2.2. Least Privilege — Cách viết IAM Policy đúng

**Nguyên tắc Least Privilege** (quyền tối thiểu): Mỗi service chỉ được cấp **đúng quyền cần thiết**, không hơn.

```
LEAST PRIVILEGE EVOLUTION
──────────────────────────

  ❌ Level 0: "Cho hết quyền"
  ┌─────────────────────────────┐
  │  "Action": "*"              │  ← NGUY HIỂM!
  │  "Resource": "*"            │  Mọi service làm được mọi thứ
  └─────────────────────────────┘

  🟡 Level 1: "Giới hạn Action"
  ┌─────────────────────────────┐
  │  "Action": "s3:GetObject"   │  ← Tốt hơn, nhưng...
  │  "Resource": "*"            │  Đọc được MỌI S3 bucket
  └─────────────────────────────┘

  ✅ Level 2: "Giới hạn Action + Resource"
  ┌─────────────────────────────────────────┐
  │  "Action": "s3:GetObject"               │  ← Đúng!
  │  "Resource": "arn:aws:s3:::my-bucket/*" │  Chỉ đọc 1 bucket cụ thể
  └─────────────────────────────────────────┘

  ✅✅ Level 3: "+ Conditions"
  ┌─────────────────────────────────────────┐
  │  "Action": "s3:GetObject"               │
  │  "Resource": "arn:aws:s3:::my-bucket/*" │
  │  "Condition": {                         │  ← Tuyệt!
  │    "StringEquals": {                    │  Chỉ từ VPC cụ thể
  │      "aws:SourceVpc": "vpc-abc123"      │
  │    }                                    │
  │  }                                      │
  └─────────────────────────────────────────┘
```

**IAM Access Analyzer — Tự động phát hiện quyền thừa:**

```d2 title="2.2. Least Privilege — Cách viết IAM Policy đúng"
direction: right
trail: "CloudTrail — logs trong window ví dụ30–90ngày"
analyzer: "IAM Access Analyzer — Analyze observed API usage"
policy: "Generated / Recommended IAM Policy"
review: "Review missing/rare paths / Test / Apply least privilege"
trail -> analyzer
analyzer -> policy
policy -> review
# Icons: https://icons.d2lang.com/
trail.icon: "https://icons.d2lang.com/aws/Management%20%26%20Governance/AWS-CloudTrail.svg"
analyzer.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Identify-and-Access-Management_IAM.svg"
```

Observed calls không bao phủ mọi disaster/rare path. Không cần cố cấp admin quyền rộng30–90ngày để tạo logs; bắt đầu bằng permissions tối thiểu dự kiến và refine trong môi trường phù hợp.

**Permission Boundaries — Giới hạn quyền tối đa:**

```json source="snippets/2-2-least-privilege-cach-viet-iam-policy-dung.json"
// Permission Boundary — Giới hạn tối đa cho mọi service role
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "dynamodb:*",
        "sqs:*",
        "sns:*",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Deny",
      "Action": [
        "iam:*",
        "organizations:*",
        "account:*"
      ],
      "Resource": "*"
    }
  ]
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F2-2-least-privilege-cach-viet-iam-policy-dung.json)

> 💡 **Permission Boundary** = "trần nhà" — dù Role có policy rộng đến mấy, cũng không vượt qua boundary. Kết hợp Identity Policy ∩ Permission Boundary = quyền thực tế.

### 2.3. Cross-Account Access

Trong kiến trúc multi-account (xem [doc 18](18-aws-deployment-architecture.md)), services ở account khác nhau cần giao tiếp. AWS dùng **AssumeRole** pattern.

```d2 title="2.3. Cross-Account Access"
shape: sequence_diagram
order: Account A — Order Task Role A
sts: AWS STS
role: Account B — Cross-account Role B
s3: Account B — Shared S3 Bucket
order -> sts: 1. AssumeRole Role B
sts -> role: Evaluate trust + caller permissions
sts -> order: 2. Temporary credentials scoped theo Role B {style.stroke-dash: 5}
order -> s3: 3. Access S3 với temporary credentials
# Icons: https://icons.d2lang.com/
sts.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Identity-and-Access-Management-IAM_AWS-STS_light-bg.svg"
```

Role B trust phải chỉ định principal/conditions thích hợp; access có thể cần cả identity/resource/KMS policies, không chỉ một `s3:Get*` rộng.

```json source="snippets/2-3-cross-account-access.json"
// Role B — Trust Policy (cho phép Account A assume)
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::111111111111:role/order-service-task-role"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "order-service-cross-account"
        }
      }
    }
  ]
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F2-3-cross-account-access.json)

---

## 3. Authentication & Authorization với Amazon Cognito

Trong [doc 15](15-security.md), ta đã nói về **Centralized Authentication** với Identity Provider. Trên AWS, **Amazon Cognito** là managed IdP — cung cấp user management, OAuth 2.0, OIDC, và tích hợp sẵn với API Gateway.

### 3.1. Cognito User Pools — Authentication

**Cognito User Pool** là user directory — quản lý sign-up, sign-in, MFA, password policies.

```d2 title="3.1. Cognito User Pools — Authentication"
shape: sequence_diagram
client: SPA / Mobile
pool: Cognito User Pool
client -> pool: Sign Up
pool -> client: Confirmation / Verification challenge theo flow {style.stroke-dash: 5}
client -> pool: Confirm / Sign In
pool.note: Email/Phone verification • Password policy • MFA TOTP/SMS theo cấu hình
pool -> client: ID / Access / Refresh tokens theo auth flow {style.stroke-dash: 5}
# Icons: https://icons.d2lang.com/
pool.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/Amazon-Cognito.svg"
```

User Pools có thể tích hợp Google/Facebook/Apple hoặc SAML/OIDC providers; signup verification và MFA là hai mục đích khác nhau, không gọi mọi confirmation code là MFA.

**Cấu hình Cognito User Pool (Terraform):**

```hcl source="snippets/3-1-cognito-user-pools-authentication.tf"
resource "aws_cognito_user_pool" "main" {
  name = "ecommerce-user-pool"

  # Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # MFA
  mfa_configuration = "OPTIONAL"  # OFF, OPTIONAL, ON
  software_token_mfa_configuration {
    enabled = true
  }

  # Email verification
  auto_verified_attributes = ["email"]
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
  }

  # Schema — custom attributes
  schema {
    name                = "tenant_id"
    attribute_data_type = "String"
    mutable             = true
    required            = false
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

# App Client
resource "aws_cognito_user_pool_client" "web" {
  name         = "web-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # OAuth 2.0 flows
  allowed_oauth_flows = ["code"]  # Authorization Code Grant
  allowed_oauth_scopes = ["openid", "email", "profile"]
  allowed_oauth_flows_user_pool_client = true

  # Callback URLs
  callback_urls = ["https://app.example.com/callback"]
  logout_urls   = ["https://app.example.com/logout"]

  # Token expiration
  access_token_validity  = 1   # 1 hour
  id_token_validity      = 1   # 1 hour
  refresh_token_validity = 30  # 30 days

  # Không generate client secret cho SPA (public client)
  generate_secret = false
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F3-1-cognito-user-pools-authentication.tf)

### 3.2. Cognito Identity Pools — Federated Identity

**Cognito Identity Pool** khác với User Pool — nó cấp **AWS credentials tạm thời** cho authenticated/unauthenticated users, cho phép truy cập trực tiếp AWS services.

```d2 title="3.2. Cognito Identity Pools — Federated Identity"
shape: sequence_diagram
client: Client
user: Cognito User Pool — User Directory
identity: Cognito Identity Pool — Credential Broker
aws: AWS Services — S3 / DynamoDB
client -> user: Sign in
user -> client: JWT tokens {style.stroke-dash: 5}
client -> identity: Present federated token
identity -> client: Temporary AccessKeyId / SecretAccessKey / SessionToken qua IAM role mapping {style.stroke-dash: 5}
client -> aws: Authorized AWS API calls bằng temporary credentials
# Icons: https://icons.d2lang.com/
user.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/Amazon-Cognito.svg"
identity.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/Amazon-Cognito.svg"
```

User Pool cung cấp user authentication/tokens; Identity Pool map federated identity tới AWS credential permissions. IAM/resource policies quyết định thực sự được làm gì, không phải client tự chọn quyền.

**Use case**: Mobile app cần upload ảnh trực tiếp lên S3 — thay vì đi qua backend API, client dùng Identity Pool credentials để upload trực tiếp, giảm latency.

### 3.3. JWT & Token Management

Cognito trả về 3 loại token sau khi authenticate thành công:

| Token | Mục đích | Chứa gì | Dùng ở đâu |
|-------|---------|---------|-----------|
| **ID Token** | Xác minh danh tính user | User attributes (name, email, custom claims) | Frontend, API Gateway |
| **Access Token** | Authorize API calls | Scopes, groups, client_id | API Gateway, Backend services |
| **Refresh Token** | Lấy token mới khi hết hạn | Opaque (không decode được) | Client → Cognito |

```d2 title="3.3. JWT & Token Management"
shape: sequence_diagram
client: Client
cognito: Cognito
gw: API Gateway
client -> cognito: 1. Sign In
cognito -> client: ID + Access + Refresh tokens {style.stroke-dash: 5}
client -> gw: 2. API Call — Access Token trong Authorization header
gw.note: Validate JWT / Claims / Scope rồi forward
gw -> client: Response {style.stroke-dash: 5}
client.note: Token hết hạn — ví dụ1giờ theo configuration
client -> cognito: 3. Refresh bằng Refresh Token
cognito -> client: New ID / Access tokens, Refresh rotation nếu bật {style.stroke-dash: 5}
# Icons: https://icons.d2lang.com/
cognito.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/Amazon-Cognito.svg"
gw.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-API-Gateway.svg"
```

### 3.4. Cognito + API Gateway Integration

Có 2 cách tích hợp Cognito với API Gateway:

```d2 title="3.4. Cognito + API Gateway Integration"
direction: down
managed: Managed Cognito / JWT Authorizer {
 client: Client
 gw: API Gateway
 auth: Managed Authorizer — Signature / Expiry / Issuer / Audience / Scopes
 backend: Backend — verified context
 client -> gw: Access Token
 gw -> auth
 auth -> backend: Valid / Authorized
}
custom: Lambda Authorizer {
 client: Client
 gw: API Gateway
 auth: Lambda — custom identity / Tenant / DB lookup
 backend: Backend
 client -> gw: Token
 gw -> auth
 auth -> backend: Allow theo authorizer response/API type
}
# Icons: https://icons.d2lang.com/
managed.gw.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-API-Gateway.svg"
custom.icon: "https://icons.d2lang.com/aws/Compute/AWS-Lambda.svg"
custom.gw.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-API-Gateway.svg"
```

Deny/invalid phải bị chặn ở Gateway. REST API Cognito authorizer, HTTP API JWT authorizer và Lambda authorizer response/caching models khác nhau. Per-user rate limiting cần cơ chế rate enforcement riêng, không mặc định có chỉ vì dùng Lambda Authorizer.

| Tiêu chí | Cognito Authorizer | Lambda Authorizer |
|----------|-------------------|-------------------|
| **Setup** | Zero code, config-only | Cần viết Lambda function |
| **Logic** | JWT validation chuẩn | Custom business logic |
| **Performance** | Nhanh (built-in cache) | Cần cấu hình cache riêng |
| **Use case** | Standard AuthN/AuthZ | Multi-tenant, custom claims, external IdP |
| **Cost** | Free (chỉ pay API GW) | + Lambda invocation cost |
| **Caching** | Tự động | TTL configurable (300s default) |

**Lambda Authorizer — Ví dụ multi-tenant:**

```python source="snippets/3-4-cognito-api-gateway-integration.py"
# Lambda Authorizer cho multi-tenant SaaS
import jwt
import json

def handler(event, context):
    token = event['authorizationToken'].replace('Bearer ', '')
    
    try:
        # Decode và validate JWT
        decoded = jwt.decode(
            token, 
            algorithms=['RS256'],
            options={"verify_signature": True}  # Verify với Cognito public key
        )
        
        tenant_id = decoded.get('custom:tenant_id')
        user_role = decoded.get('cognito:groups', [])
        
        # Generate IAM Policy dựa trên tenant
        return {
            'principalId': decoded['sub'],
            'policyDocument': {
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'execute-api:Invoke',
                    'Effect': 'Allow',
                    'Resource': event['methodArn']
                }]
            },
            'context': {
                'tenant_id': tenant_id,
                'user_role': ','.join(user_role),
                'user_email': decoded.get('email', '')
            }
        }
    except Exception as e:
        raise Exception('Unauthorized')
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F3-4-cognito-api-gateway-integration.py)

### 3.5. So sánh Cognito vs Keycloak vs Auth0 trên AWS

| Tiêu chí | Amazon Cognito | Keycloak (self-hosted) | Auth0 (SaaS) |
|----------|---------------|----------------------|-------------|
| **Loại** | Managed (AWS) | Self-hosted (trên ECS/EKS) | SaaS |
| **Cost** | $0.0055/MAU (50K free) | Infra cost only (~$100-300/mo) | $23/1000 MAU |
| **Setup** | Nhanh, Terraform/CDK | Cần deploy + maintain | Nhanh, dashboard UI |
| **Customization** | Hạn chế (Lambda triggers) | Rất cao (Java SPI) | Cao (Actions/Rules) |
| **Social Login** | Google, FB, Apple, SAML | Mọi provider | Mọi provider + 50+ social |
| **Multi-tenancy** | Khó (1 User Pool per tenant) | Realms | Organizations |
| **Hosted UI** | Cơ bản, khó customize | Theming system | Đẹp, dễ customize |
| **AWS Integration** | Native (API GW, ALB, IAM) | Manual | Marketplace integration |
| **Vendor lock-in** | Cao | Không | Trung bình |
| **Phù hợp** | AWS-native, đơn giản | Full control, complex AuthZ | Startup, MVP nhanh |

> 💡 **Recommendation**: Cognito nếu đã all-in AWS và yêu cầu đơn giản. Keycloak nếu cần full control và tránh vendor lock-in. Auth0 nếu cần ship nhanh và budget cho phép.

---

## 4. mTLS & Service-to-Service Security trên AWS

Trong [doc 15](15-security.md), ta đã hiểu mTLS cho phép 2 services **xác thực lẫn nhau** và **mã hóa traffic**. Trên AWS, có nhiều lựa chọn để bảo vệ service-to-service communication; App Mesh chỉ nên xem là lựa chọn legacy.

### 4.1. Các lựa chọn triển khai mTLS

> ⚠️ **Lưu ý thời gian:** AWS App Mesh có mốc **End of Support ngày 30/09/2026**. Không nên chọn App Mesh cho workload mới.

```d2 title="4.1. Các lựa chọn triển khai mTLS"
direction: right
workload: ECS Task / EKS Pod {
 app: Application — HTTP
 envoy: Envoy Proxy — TLS termination / Identity
 app -- envoy
}
other: Other Services
ca: ACM Private CA — PKI issuance
provision: Certificate provisioning / Rotation integration
ca -> provision -> workload.envoy
workload.envoy <-> other: mTLS — Encrypted / Mutual identity
# Icons: https://icons.d2lang.com/
ca.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Certificate-Manager.svg"
```

Mô hình Envoy/App Mesh legacy được minh họa để hiểu trách nhiệm certificate. Rotation/provisioning cần integration phù hợp; CA không tự đẩy mọi certificate tới ứng dụng nếu chưa có controller/agent/policy.

> 📖 So sánh với [doc 15](15-security.md): Istio dùng **built-in CA** (istiod) cấp cert. App Mesh (legacy) có thể dùng **ACM Private CA**.

### 4.2. Mẫu cấu hình mTLS (tham khảo)

```json source="snippets/4-2-mau-cau-hinh-mtls-tham-khao.json"
// Virtual Node — Bật mTLS cho Order Service
{
  "meshName": "ecommerce-mesh",
  "spec": {
    "listeners": [
      {
        "portMapping": {
          "port": 8080,
          "protocol": "http"
        },
        "tls": {
          "mode": "STRICT",
          "certificate": {
            "acm": {
              "certificateArn": "arn:aws:acm:ap-southeast-1:123456789:certificate/abc-123"
            }
          },
          "validation": {
            "trust": {
              "acm": {
                "certificateAuthorityArns": [
                  "arn:aws:acm-pca:ap-southeast-1:123456789:certificate-authority/xyz-789"
                ]
              }
            }
          }
        }
      }
    ],
    "serviceDiscovery": {
      "dns": {
        "hostname": "order-service.production.local"
      }
    }
  },
  "virtualNodeName": "order-service-vn"
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F4-2-mau-cau-hinh-mtls-tham-khao.json)

**TLS Mode options:**

| Mode | Mô tả | Use case |
|------|--------|----------|
| **DISABLED** | Không TLS | Dev/test (không recommend cho prod) |
| **PERMISSIVE** | Chấp nhận cả TLS và plaintext | Migration period (chuyển dần sang TLS) |
| **STRICT** | Bắt buộc TLS | Production — mọi traffic phải encrypted |

### 4.3. Authorization policy giữa services

Service mesh có thể kiểm soát service nào được gọi service nào thông qua policy/backends:

```json source="snippets/4-3-authorization-policy-giua-services.json"
// Order Service chỉ được gọi Payment Service và Inventory Service
{
  "virtualNodeName": "order-service-vn",
  "spec": {
    "backends": [
      {
        "virtualService": {
          "virtualServiceName": "payment-service.production.local"
        }
      },
      {
        "virtualService": {
          "virtualServiceName": "inventory-service.production.local"
        }
      }
    ]
    // ← Notification Service KHÔNG có trong backends
    //   → Order Service KHÔNG THỂ gọi Notification Service
  }
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F4-3-authorization-policy-giua-services.json)

### 4.4. Service Connect vs Istio vs App Mesh (legacy)

| Tiêu chí | ECS Service Connect | Istio (EKS) | App Mesh (legacy) |
|----------|---------------------|-------------|-------------------|
| **Complexity** | Đơn giản | Trung bình-cao | Cao |
| **mTLS** | TLS tự động (không mutual) | Full mTLS | Full mTLS |
| **Observability** | CloudWatch metrics tự động | OTel + Prometheus/Grafana/X-Ray | Envoy + X-Ray/CloudWatch |
| **Authorization** | Hạn chế | Fine-grained qua policy | Backend-level control |
| **Cross-cluster** | Chủ yếu ECS | Mạnh cho K8s multi-cluster | Cross ECS + EKS |
| **Tình trạng** | Active | Active | Legacy (EoS 30/09/2026) |
| **Phù hợp** | Services đơn giản, team nhỏ | Production lớn trên EKS cần policy sâu | Hệ thống cũ đang vận hành |

> 💡 **Recommendation**: Bắt đầu với **ECS Service Connect** (ECS) hoặc **Istio/Linkerd** (EKS). Chỉ giữ App Mesh cho hệ thống legacy có kế hoạch migration.

---

## 5. Secrets Management trên AWS

Trong [doc 16 — Configuration & Secrets Management](16-configuration-secrets-management.md), ta đã hiểu tại sao secrets (database passwords, API keys, certificates) **không được hardcode** trong source code. Trên AWS, có 2 service chính: **Secrets Manager** và **Systems Manager Parameter Store**.

### 5.1. AWS Secrets Manager

```d2 title="5.1. AWS Secrets Manager"
direction: right
app: Application
sm: "Secrets Manager\nSecret prod/db/orders\nUsername/password — dữ liệu minh họa" {shape: cylinder}
rotation: Rotation Lambda — schedule ví dụ30ngày
rds: RDS
app -> sm: GetSecretValue
sm -> app: Authorized secret value
sm -> rotation: Trigger rotation
rotation -> rds: Set / Test credentials
rotation -> sm: Promote version theo rotation protocol
# Icons: https://icons.d2lang.com/
sm.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Secrets-Manager.svg"
rotation.icon: "https://icons.d2lang.com/aws/Compute/AWS-Lambda.svg"
rds.icon: "https://icons.d2lang.com/aws/Database/Amazon-RDS.svg"
```

App phải refresh cache/pool/credentials theo policy mới nhận secret mới; không tự động luôn dùng latest password chỉ vì gọi SDK một lần lúc startup.

**Tạo secret + auto rotation (Terraform):**

```annotated source="snippets/5-1-aws-secrets-manager.tf"
title: "Secrets Manager: mã hóa, secret value và rotation"
language: hcl
code: |-
  resource "aws_secretsmanager_secret" "db_password" {
    name = "prod/db/orders"
    
    # KMS key cho encryption
    kms_key_id = aws_kms_key.secrets.arn
  }

  resource "aws_secretsmanager_secret_version" "db_password" {
    secret_id     = aws_secretsmanager_secret.db_password.id
    secret_string = jsonencode({
      username = "admin"
      password = random_password.db.result
      engine   = "mysql"
      host     = aws_rds_cluster.orders.endpoint
      port     = 3306
      dbname   = "orders"
    })
  }

  # Auto rotation mỗi 30 ngày
  resource "aws_secretsmanager_secret_rotation" "db_password" {
    secret_id           = aws_secretsmanager_secret.db_password.id
    rotation_lambda_arn = aws_lambda_function.rotate_secret.arn
    
    rotation_rules {
      automatically_after_days = 30
    }
  }
annotations:
  - id: note-1
    title: Chọn KMS key
    description: KMS key mã hóa secret; policy của key và quyền IAM vẫn phải cho phép đúng principal đọc.
    ranges: [[1, 6]]
  - id: note-2
    title: Secret value vẫn có thể đi vào Terraform state
    description: Không commit state. Cần backend được bảo vệ; dùng random_password không làm state tự hết nhạy cảm.
    ranges: [[8, 18]]
  - id: note-3
    title: Lịch rotation không phải toàn bộ cơ chế
    description: Lambda rotation phải được triển khai và có quyền cập nhật credential ở cả database lẫn Secrets Manager.
    ranges: [[20, 28]]
source:
  project: 23-aws-security
  snapshot: article
  file: snippets/5-1-aws-secrets-manager.tf
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F5-1-aws-secrets-manager.tf)

### 5.2. AWS Systems Manager Parameter Store

**Parameter Store** đơn giản và rẻ hơn Secrets Manager, phù hợp cho config values và secrets ít cần rotation.

| Tiêu chí | Secrets Manager | Parameter Store (Standard) | Parameter Store (Advanced) |
|----------|----------------|--------------------------|--------------------------|
| **Cost** | $0.40/secret/month + $0.05/10K API calls | **Free** (up to 10K params) | $0.05/param/month |
| **Auto Rotation** | ✅ Built-in (Lambda) | ❌ Phải tự implement | ❌ |
| **Max Size** | 64 KB | 4 KB | 8 KB |
| **Encryption** | ✅ Bắt buộc (KMS) | ✅ Optional (SecureString) | ✅ Optional |
| **Cross-account** | ✅ Resource policy | ❌ | ✅ |
| **Versioning** | ✅ | ✅ | ✅ |
| **RDS Integration** | ✅ Native rotation | ❌ | ❌ |
| **Best for** | DB passwords, API keys (cần rotate) | Feature flags, config values | Config + secrets (cost-sensitive) |

```d2 title="5.2. AWS Systems Manager Parameter Store"
direction: right
need: "Cần rotation/integration quản lý secret?"
sm: "Secrets Manager\nVí dụ database credentials / Rotation / Secret sharing"
config: "Config value hoặc feature flag?"
ssm: "Parameter Store hoặc AppConfig theo dynamic rollout needs"
need -> sm: "Có"
need -> config: "Không"
config -> ssm: "Config, không secret lifecycle đặc thù"
# Icons: https://icons.d2lang.com/
sm.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Secrets-Manager.svg"
```

So sánh cross-account sharing, tiers, KMS, rotation và pricing theo tính năng/version hiện hành; không dùng quy tắc mọi cross-account value đều chỉ có Secrets Manager hoặc mọi feature flag đều nên là Parameter Store Free tier.

### 5.3. Tích hợp Secrets vào ECS / EKS / Lambda

**ECS — Inject secrets vào container:**

```json source="snippets/5-3-tich-hop-secrets-vao-ecs-eks-lambda.json"
// ECS Task Definition — secrets từ Secrets Manager + Parameter Store
{
  "containerDefinitions": [
    {
      "name": "order-service",
      "image": "123456789.dkr.ecr.ap-southeast-1.amazonaws.com/order-service:latest",
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:123456789:secret:prod/db/orders:password::"
        },
        {
          "name": "DB_HOST",
          "valueFrom": "arn:aws:ssm:ap-southeast-1:123456789:parameter/prod/db/host"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:ssm:ap-southeast-1:123456789:parameter/prod/redis/url"
        }
      ],
      "environment": [
        {
          "name": "APP_ENV",
          "value": "production"
        }
      ]
    }
  ]
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F5-3-tich-hop-secrets-vao-ecs-eks-lambda.json)

> ⚠️ `secrets` vs `environment`: Dùng `secrets` cho sensitive values (inject lúc runtime từ Secrets Manager / Parameter Store). Dùng `environment` cho non-sensitive config. **Không bao giờ** đặt password trong `environment` — nó visible trong Task Definition!

**EKS — External Secrets Operator:**

```yaml source="snippets/5-3-tich-hop-secrets-vao-ecs-eks-lambda-2.yaml"
# ExternalSecret — Sync từ AWS Secrets Manager vào K8s Secret
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: order-service-secrets
  namespace: production
spec:
  refreshInterval: 1h  # Poll mỗi 1 giờ
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: order-service-secrets  # K8s Secret name
    creationPolicy: Owner
  data:
  - secretKey: DB_PASSWORD
    remoteRef:
      key: prod/db/orders
      property: password
  - secretKey: DB_HOST
    remoteRef:
      key: prod/db/orders
      property: host

---
# Pod mount secret
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  template:
    spec:
      containers:
      - name: order-service
        envFrom:
        - secretRef:
            name: order-service-secrets
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F5-3-tich-hop-secrets-vao-ecs-eks-lambda-2.yaml)

**Lambda — Environment variables với KMS:**

```hcl source="snippets/5-3-tich-hop-secrets-vao-ecs-eks-lambda-3.tf"
resource "aws_lambda_function" "order_processor" {
  function_name = "order-processor"
  runtime       = "nodejs18.x"
  handler       = "index.handler"
  role          = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      # Non-sensitive
      TABLE_NAME = "orders"
      REGION     = "ap-southeast-1"
    }
  }

  # Encrypt environment variables với CMK
  kms_key_arn = aws_kms_key.lambda_env.arn
}

# Lambda code lấy secret lúc runtime (không qua env var)
# const secret = await secretsManager.getSecretValue({ SecretId: 'prod/db/orders' });
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F5-3-tich-hop-secrets-vao-ecs-eks-lambda-3.tf)

### 5.4. KMS — Encryption at Rest & in Transit

**AWS KMS (Key Management Service)** quản lý encryption keys cho mọi thứ trên AWS.

```d2 title="5.4. KMS — Encryption at Rest & in Transit"
direction: right
key: "KMS Key — Key Encryption Key"
datakey: "Data Key — plaintext chỉ ở encrypting process theo SDK"
data: "Encrypt actual S3/EBS/DynamoDB data"
wrapped: "Encrypted Data Key — lưu cùng ciphertext"
decrypt: "KMS decrypt data key khi principal được authorize"
key -> datakey: "GenerateDataKey theo access policy"
datakey -> data
key -> wrapped: "Wrap / Encrypt data key"
wrapped -> decrypt
# Icons: https://icons.d2lang.com/
key.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Key-Management-Service.svg"
decrypt.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Key-Management-Service.svg"
```

KMS key material được bảo vệ bởi KMS; data-key usage/caching/reuse phụ thuộc dịch vụ/client. Không mặc định một data key luôn chỉ dùng đúng một object; blast radius phụ thuộc envelope-encryption design. Xóa plaintext key khỏi memory khi không còn cần.

| Loại Key | Mô tả | Cost | Rotation |
|----------|--------|------|----------|
| **AWS Managed** (`aws/s3`, `aws/rds`) | AWS tạo & quản lý | Free | Auto (yearly) |
| **Customer Managed (CMK)** | Bạn tạo & control policy | $1/mo/key | Configurable |
| **Customer Managed + Imported** | Bạn import key material | $1/mo/key | Manual |
| **CloudHSM** | Dedicated hardware | $$$ ($1.50/hr) | Manual |

> 💡 **Best practice**: Dùng **CMK** cho production data. Key Policy kiểm soát ai được dùng key → thêm 1 layer protection ngoài IAM.

---

## 6. Network Security — VPC & Isolation

### 6.1. VPC Design cho Microservice

```d2 title="6.1. VPC Design cho Microservice"
direction: right
vpc: VPC — 10.0.0.0/16 {
 a: AZ-a {
  public: Public10.0.1.0/24 { alb: ALB node; nat: NAT Gateway }
  private: Private10.0.3.0/24 { order: Order; user: User }
  isolated: Isolated10.0.5.0/24 { rds: RDS Primary; cache: ElastiCache }
 }
 b: AZ-b {
  public: Public10.0.2.0/24 { alb: ALB node; nat: NAT Gateway }
  private: Private10.0.4.0/24 { order: Order; user: User }
  isolated: Isolated10.0.6.0/24 { rds: RDS Replica; cache: ElastiCache }
 }
 a.public.alb -> a.private
 b.public.alb -> b.private
 a.private -> a.isolated: Allowed DB traffic
 b.private -> b.isolated: Allowed DB traffic
}
# Icons: https://icons.d2lang.com/
vpc.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-VPC.svg"
vpc.a.public.alb.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Elastic-Load-Balancing-ELB_Application-load-balancer_light-bg.svg"
vpc.a.isolated.rds.icon: "https://icons.d2lang.com/aws/Database/Amazon-RDS.svg"
vpc.a.isolated.cache.icon: "https://icons.d2lang.com/aws/Database/Amazon-ElastiCache.svg"
vpc.b.public.alb.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Elastic-Load-Balancing-ELB_Application-load-balancer_light-bg.svg"
vpc.b.isolated.rds.icon: "https://icons.d2lang.com/aws/Database/Amazon-RDS.svg"
vpc.b.isolated.cache.icon: "https://icons.d2lang.com/aws/Database/Amazon-ElastiCache.svg"
vpc.a.public.nat.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-VPC_NAT-Gateway_light-bg.svg"
vpc.b.public.nat.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-VPC_NAT-Gateway_light-bg.svg"
```

Một logical ALB có nodes ở nhiều subnets/AZs, không bắt buộc là2 ALBs độc lập. Public subnet có route Internet Gateway; private có outbound NAT theo policy; isolated không route Internet. Routes/SG/NACL quyết định reachability, không chỉ tên subnet.

### 6.2. Security Groups — Stateful Firewall

**Security Groups** hoạt động ở **instance/ENI level** — là tường lửa stateful cho từng resource.

```d2 title="Security Groups — Chain Pattern"
direction: down
internet: Internet
alb: "alb-sg\nInbound 443 from 0.0.0.0/0\nOutbound 8080 to svc-sg"
svc: "svc-sg\nInbound 8080 from alb-sg / svc-sg\nOutbound 3306 db-sg\n6379 cache-sg • 443 external APIs"
db: "db-sg\nInbound 3306 from svc-sg\nResponse stateful — không cần outbound rule riêng"
cache: cache-sg
external: External HTTPS APIs
internet -> alb: 443
alb -> svc: 8080
svc -> svc: 8080
svc -> db: 3306
svc -> cache: 6379
svc -> external: 443
```

> ⚠️ **Key insight**: Security Groups reference **nhau** (không dùng IP) — khi service scale up/down, rules vẫn đúng. Rule `8080 from sg-abc123` = "cho phép mọi ENI thuộc SG sg-abc123".

**Terraform example:**

```hcl source="snippets/6-2-security-groups-stateful-firewall.tf"
# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "alb-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Internet
  }

  egress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.services.id]
  }
}

# Services Security Group
resource "aws_security_group" "services" {
  name_prefix = "svc-"
  vpc_id      = aws_vpc.main.id

  # Từ ALB
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Service-to-service
  ingress {
    from_port = 8080
    to_port   = 8080
    protocol  = "tcp"
    self      = true  # Cho phép SG tự gọi chính mình
  }
}

# Database Security Group
resource "aws_security_group" "database" {
  name_prefix = "db-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.services.id]  # CHỈ từ services
  }
  # Không cần egress — stateful
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F6-2-security-groups-stateful-firewall.tf)

### 6.3. NACLs — Network Access Control Lists

| Tiêu chí | Security Groups | NACLs |
|----------|----------------|-------|
| **Level** | ENI (instance/task) | Subnet |
| **Stateful?** | ✅ Stateful | ❌ Stateless |
| **Rules** | Allow only | Allow + Deny |
| **Evaluation** | Tất cả rules cùng lúc | Theo thứ tự (rule number) |
| **Default** | Deny all inbound | Allow all |
| **Use case** | Primary firewall | Thêm layer deny (block IP ranges) |

> 💡 **Best practice**: Dùng **Security Groups** làm primary firewall. Dùng **NACLs** chỉ khi cần **deny** specific IP ranges hoặc comply với security policy yêu cầu defense-in-depth.

### 6.4. VPC Endpoints — PrivateLink

**VPC Endpoints** cho phép services truy cập AWS services (S3, DynamoDB, Secrets Manager...) **không qua Internet** — traffic đi qua AWS private network.

```d2 title="6.4. VPC Endpoints — PrivateLink"
direction: down
nat: Public Service Endpoint Path {
 task: ECS Task
 nat: NAT Gateway
 endpoint: S3 Public Endpoint
 task -> nat -> endpoint
}
private: Gateway Endpoint Path {
 task: ECS Task
 vpce: S3 Gateway VPC Endpoint
 s3: S3
 task -> vpce -> s3
}
# Icons: https://icons.d2lang.com/
nat.task.icon: "https://icons.d2lang.com/aws/Compute/Amazon-Elastic-Container-Service.svg"
nat.endpoint.icon: "https://icons.d2lang.com/aws/Storage/Amazon-Simple-Storage-Service-S3.svg"
private.task.icon: "https://icons.d2lang.com/aws/Compute/Amazon-Elastic-Container-Service.svg"
private.vpce.icon: "https://icons.d2lang.com/aws/Storage/Amazon-Simple-Storage-Service-S3.svg"
private.s3.icon: "https://icons.d2lang.com/aws/Storage/Amazon-Simple-Storage-Service-S3.svg"
nat.nat.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-VPC_NAT-Gateway_light-bg.svg"
```

NAT path có processing cost phụ thuộc region/pricing; S3/DynamoDB Gateway Endpoints không có endpoint hourly/data-processing charge như Interface Endpoints. Không khẳng định AWS-to-AWS traffic qua NAT bắt buộc rời AWS backbone hay endpoint luôn nhanh hơn; VPC endpoint giảm phụ thuộc NAT/public endpoint routing và hỗ trợ policy boundary.

| Loại | Services | Cost | Protocol |
|------|----------|------|----------|
| **Gateway Endpoint** | S3, DynamoDB | **Free** | Route table entry |
| **Interface Endpoint** | 100+ services (Secrets Manager, SQS, ECR, KMS...) | $0.01/hr/AZ + $0.01/GB | Private IP (ENI) |

> 💡 **Cost tip**: Gateway Endpoints cho S3 và DynamoDB là **miễn phí** và giảm NAT Gateway cost → luôn luôn tạo!

### 6.5. AWS WAF & Shield

**AWS WAF** bảo vệ API Gateway / ALB / CloudFront khỏi web attacks. **AWS Shield** bảo vệ khỏi DDoS.

```d2 title="AWS Shield và WAF — Defense in Depth"
direction: down
internet: Internet
shield: "AWS Shield Standard\nLayer 3/4 DDoS protection" {
 edge: "CloudFront / ALB" {
  waf: "AWS WAF — Layer 7\nSQL injection • XSS\nRate-based rules • IP blacklist\nGeo blocking • Bot control"
 }
}
services: API Gateway / Services
internet -> shield.edge.waf -> services
# Icons: https://icons.d2lang.com/
shield.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Shield.svg"
shield.edge.waf.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-WAF.svg"
```

**WAF Rule Groups phổ biến:**

```hcl source="snippets/6-5-aws-waf-shield.tf"
resource "aws_wafv2_web_acl" "api" {
  name  = "api-protection"
  scope = "REGIONAL"  # REGIONAL cho ALB/API GW, CLOUDFRONT cho CF

  default_action {
    allow {}
  }

  # AWS Managed Rules — SQL Injection
  rule {
    name     = "aws-managed-sql-injection"
    priority = 1
    override_action { none {} }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLInjectionRule"
    }
  }

  # Rate-based rule — Max 2000 requests / 5 minutes per IP
  rule {
    name     = "rate-limit"
    priority = 2
    action { block {} }
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
    }
  }

  visibility_config {
    sampled_requests_enabled   = true
    cloudwatch_metrics_enabled = true
    metric_name                = "APIWebACL"
  }
}
```

[Đối chiếu đoạn này với các ví dụ khác trong SourceExplorer](?source=23-aws-security&snapshot=article&file=snippets%2F6-5-aws-waf-shield.tf)

| Feature | Shield Standard | Shield Advanced |
|---------|----------------|-----------------|
| **Cost** | **Free** | $3,000/month |
| **DDoS Protection** | Layer 3/4 | Layer 3/4/7 |
| **Response Team** | ❌ | ✅ AWS DRT (24/7) |
| **Cost Protection** | ❌ | ✅ (AWS credits nếu bị DDoS) |
| **WAF included** | ❌ | ✅ WAF free |
| **Phù hợp** | Hầu hết workloads | Finance, healthcare, gaming |

---

## 7. Zero Trust Architecture trên AWS

### 7.1. Zero Trust Principles áp dụng cho AWS

Trong [doc 15](15-security.md), ta đã hiểu **Zero Trust = "Never trust, always verify"**. Trên AWS, Zero Trust áp dụng qua nhiều layers:

```d2 title="7.1. Zero Trust Principles áp dụng cho AWS"
direction: right
zero: Zero Trust Layers {
 identity: IAM Role/workload identity / Cognito / MFA cho human users
 network: VPC / Private Subnets / SG allow-lists / VPC Endpoints
 application: mTLS / Token validation / Input validation / WAF
 data: KMS at rest / TLS in transit / Sensitive-field encryption
 monitoring: CloudTrail / GuardDuty / Security Hub / Config / Detective / Macie
}
```

Map nguyên tắc: verify mỗi request/identity, least privilege IAM + permission boundaries, assume breach và continuous monitoring. MFA áp dụng cho interactive identity phù hợp, không mặc định mọi machine-to-machine request phải nhập MFA.

### 7.2. Triển khai Zero Trust — Từng Layer

**Step-by-step migration sang Zero Trust:**

```d2 title="7.2. Triển khai Zero Trust — Từng Layer"
direction: down
n5: "Phase 5 — Monitoring (Week 9-10)" {}
n4: "Phase 4 — Service Security (Week 7-8)" {}
n3: "Phase 3 — Encryption (Week 5-6)" {}
n2: "Phase 2 — Identity (Week 3-4)" {}
n1: "Phase 1 — Foundation (Week 1-2)" {}
n1.n6: "IAM Role per service"
n1.n7: "VPC + Private Subnets"
n1.n8: "Security Groups chain"
n2.n9: "Cognito User Pool"
n2.n10: "API GW Authorizer"
n2.n11: "JWT validation in services"
n3.n12: "KMS for data at rest"
n3.n13: "ACM for TLS in transit"
n3.n14: "Secrets Manager"
n4.n15: "Service mesh / Service Connect"
n4.n16: "mTLS between services"
n4.n17: "Service-level AuthZ"
n5.n18: "CloudTrail everywhere"
n5.n19: "GuardDuty enabled"
n5.n20: "Security Hub + Config Rules"
n1.n6 -> n1.n7
n1.n7 -> n1.n8
n2.n9 -> n2.n10
n2.n10 -> n2.n11
n3.n12 -> n3.n13
n3.n13 -> n3.n14
n4.n15 -> n4.n16
n4.n16 -> n4.n17
n5.n18 -> n5.n19
n5.n19 -> n5.n20
n1.n8 -> n2.n9
n2.n11 -> n3.n12
n3.n14 -> n4.n15
n4.n17 -> n5.n18
# Icons: https://icons.d2lang.com/
n1.n6.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Identify-and-Access-Management_IAM.svg"
n2.n9.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/Amazon-Cognito.svg"
n3.n12.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Key-Management-Service.svg"
n3.n13.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Certificate-Manager.svg"
n3.n14.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Secrets-Manager.svg"
n5.n18.icon: "https://icons.d2lang.com/aws/Management%20%26%20Governance/AWS-CloudTrail.svg"
n5.n19.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/Amazon-GuardDuty.svg"
n1.n7.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-VPC.svg"
```

### 7.3. AWS Verified Access

**AWS Verified Access** là dịch vụ Zero Trust network access — cho phép truy cập ứng dụng **không cần VPN**, dựa trên identity và device trust.

```d2 title="7.3. AWS Verified Access"
direction: down
vpn: VPN — mô hình network access rộng trong ví dụ {
 employee: Employee Laptop
 network: VPC / Internal Services
 employee -> network: VPN tunnel — phạm vi do routes/policies quyết định
}
verified: Verified Access — Per-application Policy {
 employee: Employee Laptop — identity / device posture / context
 policy: Verified Access Policy Evaluation
 a: App A — Allowed
 b: App B — Denied
 c: App C — Denied
 employee -> policy
 policy -> a: Allow
 policy -- b: Deny {style.stroke-dash: 5}
 policy -- c: Deny {style.stroke-dash: 5}
}
```

VPN cũng có thể enforce least privilege, không mặc định cho full VPC access. Verified Access cần supported trust providers và policy/configuration; không giả định Cognito là device/user trust integration mặc định.

**Use case**: DevOps cần truy cập internal dashboard — thay vì VPN, dùng Verified Access với Cognito + device trust check.

---

## 8. Audit & Compliance

### 8.1. AWS CloudTrail — API Activity Logging

**CloudTrail** ghi lại **MỌI API call** trên AWS — ai làm gì, lúc nào, từ đâu.

```d2 title="8.1. AWS CloudTrail — API Activity Logging"
direction: right
calls: "AWS API activity trong logging scope"
trail: "CloudTrail Event\neventTime2024-01-15T10:30Z\nRole order-service-role • GetSecretValue\nsourceIP10.0.3.45 • Secret prod/db/orders"
s3: "S3 — long-term log storage"
cw: "CloudWatch Logs — query/metric integration"
event: "EventBridge — event-driven alerts theo support"
calls -> trail
trail -> s3
trail -> cw
trail -> event
# Icons: https://icons.d2lang.com/
trail.icon: "https://icons.d2lang.com/aws/Management%20%26%20Governance/AWS-CloudTrail.svg"
s3.icon: "https://icons.d2lang.com/aws/Storage/Amazon-Simple-Storage-Service-S3.svg"
cw.icon: "https://icons.d2lang.com/aws/Management%20%26%20Governance/Amazon-CloudWatch.svg"
event.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-EventBridge.svg"
```

Management/data/network events có configuration/support khác nhau; CloudTrail không tự ghi mọi API/data event nếu logging scope chưa bật. ARNs trong hình cũ rút gọn để minh họa, không phải deployment-ready ARN literals.

| Event Type | Mô tả | Cost | Ví dụ |
|-----------|--------|------|-------|
| **Management Events** | Control plane operations | Free (1 copy) | CreateBucket, RunInstances, PutRolePolicy |
| **Data Events** | Data plane operations | $0.10/100K events | S3 GetObject, Lambda Invoke, DynamoDB GetItem |
| **Insights Events** | Anomaly detection | $0.35/100K events | Unusual API call volume |

> 💡 **Best practice**: Tạo **Organization Trail** ghi management events cho TẤT CẢ accounts. Bật data events chỉ cho sensitive resources (S3 buckets chứa PII, KMS key usage).

### 8.2. AWS Config — Configuration Compliance

**AWS Config** theo dõi **cấu hình** của AWS resources và kiểm tra compliance rules.

```d2 title="8.2. AWS Config — Configuration Compliance"
direction: right
public: "S3 Public Bucket"
s3rule: "Config rule s3-bucket-public-read-prohibited"
s3fix: "Non-compliant → Remediation block public access"
rds: "RDS Encrypted"
rdsrule: "rds-storage-encrypted"
ok: "Compliant"
sg: "SG mở SSH22 rộng"
sgrule: "restricted-ssh"
sgfix: "Non-compliant → Remove/Restrict rule"
public -> s3rule
s3rule -> s3fix
rds -> rdsrule
rdsrule -> ok
sg -> sgrule
sgrule -> sgfix
# Icons: https://icons.d2lang.com/
public.icon: "https://icons.d2lang.com/aws/Storage/Amazon-Simple-Storage-Service-S3.svg"
rds.icon: "https://icons.d2lang.com/aws/Database/Amazon-RDS.svg"
```

Config evaluates compliance; auto-fix cần remediation configuration/SSM role/guardrails, không tự diễn ra vì bật rule.

**Config Rules quan trọng cho Microservice:**

| Rule | Kiểm tra gì | Severity |
|------|-------------|----------|
| `ecs-task-definition-nonroot-user` | Container chạy non-root | High |
| `ecs-containers-readonly-access` | Read-only root filesystem | Medium |
| `rds-storage-encrypted` | RDS encryption at rest | Critical |
| `secretsmanager-rotation-enabled-check` | Secret rotation bật | High |
| `vpc-sg-open-only-to-authorized-ports` | SG không mở quá rộng | High |
| `cloudtrail-enabled` | CloudTrail đang bật | Critical |
| `kms-cmk-not-scheduled-for-deletion` | CMK không bị xóa | Critical |

### 8.3. AWS Security Hub

**Security Hub** tổng hợp security findings từ **nhiều nguồn** vào một dashboard duy nhất.

```d2 title="8.3. AWS Security Hub"
direction: right
guard: "GuardDuty — Threats"
inspector: "Inspector — Vulnerabilities"
config: "Config — Compliance"
macie: "Macie — Sensitive data in S3"
third: "Third-party findings — Prowler / Checkov integration"
hub: "Security Hub\nAggregate / Prioritize findings\nCIS / AWS best-practice checks / Score"
event: "EventBridge → Configured remediation"
guard -> hub
inspector -> hub
config -> hub
macie -> hub
third -> hub
hub -> event
# Icons: https://icons.d2lang.com/
guard.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/Amazon-GuardDuty.svg"
macie.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/Amazon-Macie.svg"
hub.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/AWS-Security-Hub.svg"
inspector.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/Amazon-Inspector.svg"
```

Findings/integration standards và security scores phụ thuộc service version, enabled standards và account/region settings.

### 8.4. Amazon GuardDuty — Threat Detection

**GuardDuty** dùng machine learning phát hiện threats tự động — không cần config rules.

**GuardDuty findings categories:**

| Category | Ví dụ | Severity |
|----------|-------|----------|
| **Recon** | Port scan, DNS probing | Low-Medium |
| **UnauthorizedAccess** | API call từ known malicious IP | High |
| **CryptoCurrency** | EC2 đang mining Bitcoin | High |
| **Trojan** | Instance communicating với C&C server | Critical |
| **Exfiltration** | Unusual S3 data transfer | High |
| **PrivilegeEscalation** | IAM user tạo admin policy cho mình | Critical |

```d2 title="GuardDuty — Auto-response qua EventBridge"
direction: right
guard: "GuardDuty Finding\nCryptomining trên EC2"
event: "EventBridge Rule\nSeverity HIGH"
lambda: "Lambda — Auto-isolate\nĐổi SG sang isolation SG\nSNS alert"
pager: SNS → PagerDuty
guard -> event -> lambda
event -> pager
# Icons: https://icons.d2lang.com/
guard.icon: "https://icons.d2lang.com/aws/Security%2C%20Identity%2C%20%26%20Compliance/Amazon-GuardDuty.svg"
event.icon: "https://icons.d2lang.com/aws/Application%20Integration/Amazon-EventBridge.svg"
lambda.icon: "https://icons.d2lang.com/aws/Compute/AWS-Lambda.svg"
```

Isolation SG hạn chế kết nối mới; Security Group là stateful nên không được giả định mọi established connection sẽ bị cắt ngay lập tức.

---

## 9. Ví dụ thực tế — E-Commerce Security Architecture

```d2 title="9. Ví dụ thực tế — E-Commerce Security Architecture"
direction: down
client: Users / Mobile / Third-party clients
edge: CloudFront + WAF + Shield — DDoS / SQLi / XSS / Rate / Geo rules
api: API Gateway + Cognito — MFA login / JWT / orders read-write scopes
vpc: VPC10.0.0.0/16 {
 apps: Private Services {
  order: Order — orders-role
  payment: Payment — payment-role
  inventory: Inventory — inv-role
  order <-> payment: mTLS + AuthZ
  payment <-> inventory: mTLS + AuthZ
 }
 data: Isolated Subnets {
  order: RDS Orders — KMS encrypted
  payment: RDS Payments — KMS encrypted
 }
 endpoints: VPC Endpoints — S3 / Secrets Manager / KMS / ECR / SQS
 apps.order -> data.order: SG db allows authorized app / Encrypted channel
 apps.payment -> data.payment: SG db allows authorized app / Encrypted channel
}
dynamo: DynamoDB Inventory — AWS managed service / KMS
secrets: Secrets Manager Rotation / Parameter Store Config / KMS / ACM integrations
audit: Organization CloudTrail / GuardDuty / Security Hub / Config
client -> edge -> api -> vpc.apps
vpc.apps.inventory -> dynamo: Authorized AWS API qua endpoint/route phù hợp
secrets -> vpc.apps: Scoped credentials/config
vpc.apps -- audit: Audit / Detection / Compliance
# Icons: https://icons.d2lang.com/
vpc.data.order.icon: "https://icons.d2lang.com/aws/Database/Amazon-RDS.svg"
vpc.data.payment.icon: "https://icons.d2lang.com/aws/Database/Amazon-RDS.svg"
vpc.icon: "https://icons.d2lang.com/aws/Networking%20%26%20Content%20Delivery/Amazon-VPC.svg"
```

DynamoDB không phải instance nằm trong isolated subnet và không dùng `db-sg` như RDS; dùng IAM/resource policies và endpoints phù hợp. Ví dụ rate2.000req/5phút/IP, rotation30ngày và15+compliance rules là policy minh họa. GuardDuty auto-isolation chỉ xảy ra khi event/remediation workflow được cấu hình, không phải default finding behavior.

---

## 10. Anti-patterns

| # | Anti-pattern | Vấn đề | Giải pháp |
|---|-------------|--------|-----------|
| 1 | **Shared IAM Role cho mọi service** | Mọi service có cùng quyền → blast radius lớn | IAM Role per service (Task Role / IRSA) |
| 2 | **Hardcode secrets trong code / env vars** | Secrets trong Git history, Task Definition visible | Secrets Manager / Parameter Store |
| 3 | **Security Groups mở 0.0.0.0/0** | Mọi IP đều truy cập được services | SG chain: ALB → Services → DB, reference SG ID |
| 4 | **Không encryption at rest** | Data breach = đọc được plaintext | KMS CMK cho tất cả storage (RDS, S3, DynamoDB) |
| 5 | **Không bật CloudTrail** | Không biết ai làm gì → không thể forensics | Organization Trail, bật cho tất cả regions |
| 6 | **IAM User + Access Key cho service** | Long-lived credentials, dễ leak | IAM Roles only (no users cho services) |
| 7 | **Dùng Node Role cho EKS Pods** | Mọi Pod có cùng quyền = shared role | IRSA — Pod-level IAM |
| 8 | **Không rotate secrets** | Password leak → access vĩnh viễn | Auto-rotation 30-90 ngày |
| 9 | **Services trong Public Subnet** | Exposed trực tiếp ra internet | Private Subnet + ALB/API GW |
| 10 | **Không dùng VPC Endpoints** | Traffic qua internet, tốn NAT cost | Gateway Endpoints (S3, DynamoDB) + Interface Endpoints |

---

## 11. Checklist triển khai

### Identity & Access

- [ ] Mỗi service có IAM Role riêng (Task Role / IRSA / Lambda Role)
- [ ] IAM Policies follow Least Privilege (specific Action + Resource)
- [ ] Permission Boundaries cho tất cả service roles
- [ ] Không dùng IAM Users / Access Keys cho services
- [ ] Cross-account access dùng AssumeRole + ExternalId
- [ ] IAM Access Analyzer enabled — review unused permissions

### Authentication

- [ ] Cognito User Pool (hoặc IdP khác) cho user authentication
- [ ] MFA enabled (ít nhất OPTIONAL)
- [ ] API Gateway + Authorizer (Cognito / Lambda)
- [ ] Token expiration hợp lý (Access: 1hr, Refresh: 30 days)

### Service-to-Service Security

- [ ] Service-to-service TLS/mTLS strategy đã chọn (Service Connect / Istio / legacy App Mesh)
- [ ] mTLS enabled (STRICT mode) cho production khi workload yêu cầu mutual auth
- [ ] Certificate lifecycle được quản lý rõ (ACM/ACM PCA/mesh CA theo stack đã chọn)

### Secrets & Encryption

- [ ] Secrets Manager cho DB passwords (auto-rotate)
- [ ] Parameter Store cho config values
- [ ] KMS CMK cho encryption at rest (RDS, S3, DynamoDB, SQS)
- [ ] TLS everywhere (ACM certificates cho ALB, CloudFront)
- [ ] Không hardcode secrets — kiểm tra với git-secrets

### Network

- [ ] VPC với Public / Private / Isolated subnets
- [ ] Security Groups chain (ALB → Services → DB)
- [ ] VPC Endpoints cho S3, DynamoDB (Gateway), Secrets Manager, ECR, KMS (Interface)
- [ ] WAF trên API Gateway / ALB / CloudFront
- [ ] Shield Standard enabled (default)

### Audit & Compliance

- [ ] CloudTrail Organization Trail (all accounts, all regions)
- [ ] GuardDuty enabled + auto-response (EventBridge + Lambda)
- [ ] Security Hub + CIS Benchmark enabled
- [ ] AWS Config + compliance rules
- [ ] S3 access logging cho audit trail bucket

---

## 12. Tổng kết

```
┌───────────────────────────────────────────────────────────────────┐
│             SECURITY DECISION GUIDE trên AWS                      │
│                                                                   │
│  Identity:                                                        │
│  • IAM Role per service (Task Role / IRSA / Lambda Role)          │
│  • Least Privilege + Permission Boundaries                        │
│  • IAM Access Analyzer để tối ưu policies                         │
│                                                                   │
│  Authentication:                                                  │
│  • Cognito User Pool (simple) hoặc Keycloak (full control)        │
│  • API Gateway + Cognito Authorizer (zero-code)                   │
│  • Lambda Authorizer cho custom logic (multi-tenant)              │
│                                                                   │
│  Service-to-Service:                                              │
│  • Chọn mTLS stack phù hợp: Service Connect (đơn giản), Istio (policy sâu), App Mesh chỉ legacy │
│  • ECS Service Connect cho đơn giản                               │
│                                                                   │
│  Secrets:                                                         │
│  • Secrets Manager cho DB passwords (auto-rotate)                 │
│  • Parameter Store (Free) cho config values                       │
│  • KMS CMK cho encryption — KHÔNG dùng AWS managed keys           │
│                                                                   │
│  Network:                                                         │
│  • Private Subnets cho services, Isolated cho databases           │
│  • Security Groups chain — reference SG ID, không IP              │
│  • VPC Endpoints — S3/DynamoDB (free), others ($0.01/hr)          │
│  • WAF + Shield Standard cho edge protection                      │
│                                                                   │
│  Audit:                                                           │
│  • CloudTrail = must have (ai làm gì, lúc nào)                    │
│  • GuardDuty = must have (threat detection tự động)               │
│  • Security Hub = nice to have (centralized view)                 │
│  • Config Rules = nice to have (continuous compliance)            │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Key takeaways:**

1. **IAM Role per service là nền tảng** — mỗi service có danh tính riêng, quyền riêng, blast radius nhỏ
2. **Cognito + API Gateway = AuthN zero-code** — đủ cho 80% use cases, Lambda Authorizer cho 20% còn lại
3. **Secrets KHÔNG BAO GIỜ hardcode** — Secrets Manager (auto-rotate) cho passwords, Parameter Store (free) cho config
4. **Network isolation = defense in depth** — Private Subnets + SG chains + VPC Endpoints
5. **Encrypt everything** — KMS CMK cho at-rest, ACM cho in-transit, và service-to-service TLS/mTLS
6. **Audit from day 1** — CloudTrail + GuardDuty bật ngay từ đầu, không đợi incident mới bật

---

## 13. Liên kết liên quan

- [15 — Security](15-security.md) — Lý thuyết Authentication, Authorization, mTLS, JWT, Zero Trust
- [16 — Configuration & Secrets Management](16-configuration-secrets-management.md) — Lý thuyết Config Server, Vault, Secrets Management
- [18 — Triển khai & Kiến trúc tổng quan](18-aws-deployment-architecture.md) — Multi-account strategy, ECS vs EKS vs Lambda
- [19 — Communication & Service Discovery trên AWS](19-aws-communication-discovery.md) — Service Connect, VPC Lattice, API Gateway, App Mesh (legacy)
- [21 — Resilience & Auto Scaling trên AWS](21-aws-resilience.md) — Health Check, Auto Scaling
- [22 — Observability trên AWS](22-aws-observability.md) — CloudWatch, X-Ray, audit logging
- [24 — CI/CD & Deployment trên AWS](24-aws-cicd-deployment.md) — Pipeline security, deployment strategies
- [25 — Case Study: E-Commerce](25-case-study-ecommerce.md) — Áp dụng tổng hợp
