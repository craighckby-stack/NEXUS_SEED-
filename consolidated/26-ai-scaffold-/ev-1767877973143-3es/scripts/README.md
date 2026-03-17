# Deployment Scripts

## 🚀 Overview

This directory contains the optimized and automated scripts necessary for deploying, managing, and tearing down the application infrastructure across different environments (e.g., `staging`, `production`). Scripts are designed to be idempotent and adhere to zero-downtime deployment principles.

## ✅ Prerequisites

Before running any deployment script, ensure the following components are installed and properly authenticated:

1. **Docker (v20+):** For building and pushing container images.
2. **AWS CLI (v2):** Configured with programmatic access and the necessary IAM permissions.
3. **Terraform (v1.x):** Required for Infrastructure as Code (IaC) management.
4. **`make`:** Used to leverage simplified, chained deployment commands.

## ⚙️ Configuration (Environment Variables)

Deployment behavior is dynamically controlled by environment variables. Define these in your CI/CD system or locally via an exported `.env` file.

| Variable | Description | Mandatory | Default |
| :--- | :--- | :--- | :--- |
| `ENV` | Target environment identifier (`staging`, `production`). | Yes | - |
| `REGION` | AWS Region for resource deployment. | Yes | `us-west-2` |
| `IMAGE_TAG` | Specific Docker image tag to be deployed. | Yes | `latest` |
| `SKIP_BUILD` | Set to `true` to skip local image build and push stages. | No | `false` |

## 🏃 Usage and Optimization Targets

The deployment workflow is consolidated into `make` targets for speed and reliability.

### 1. Full Optimized Deployment

This single command executes the entire chain: build, push image, and apply infrastructure/service configuration changes for the specified environment.

```bash
make deploy ENV=production IMAGE_TAG=v1.2.3
```

### 2. Infrastructure Only

If the application image is already pushed and only infrastructure configuration needs updating (e.g., scaling changes):

```bash
scripts/infra/terraform_apply.sh ${ENV}
```

### 3. Cleanup / Teardown

To completely destroy all provisioned cloud resources for a specific environment:

```bash
make destroy ENV=staging
```

***
*Note: Optimization is achieved by centralizing complex commands into idempotent Make targets, reducing manual steps and ensuring consistent execution across environments.*