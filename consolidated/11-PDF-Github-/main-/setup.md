# ⚙️ Core Documentation Genesis System (DocGen Catalyst) v94.1

This project leverages the hyper-optimized Sovereign DocGen Catalyst (`SDGC`), migrating documentation management from archaic manual creation to dynamic, configuration-driven generation. `setup.md` outlines the necessary steps for absolute synchronization of documentation artifacts with the Sovereign Architectural Baseline.

## 1. System Overview: Manifest & Baseline Enforced Architecture

SDGC mandates strict architectural conformity. It operates exclusively through a centralized templating engine (Jinja2) governed by the **Project Manifest** (`/.sdgc/manifest.json`). Compliance is achieved through a direct linkage to the Architectural Baseline Registry (ABR), ensuring documentation precisely reflects the codified state of the Sovereign Architecture, rendering divergence impossible.

## 2. SDGC Toolchain Initialization and AGI Vetted Generation Cycle

Access requires the official `sdgc-cli` toolchain, provisioned via the secure Sentry Tap deployment system.

```bash
# 1. Baseline Synchronization: Download and synchronize the mandated ABR state 
#    and global templates, populating the internal configuration cache.
sdgc-cli sync --registry=ABR --force-hydrate

# 2. Component Attestation & Validation (MANDATORY AGI GATE):
#    Validate manifest schema and formally register the Component ID (derived
#    from the Bazel Target Path). This stage fails if the AGI Pre-Deployment
#    Layer (PDL) does not confirm compliance and classification.
sdgc-cli attest --component-id --pdl-check

# 3. Artifact Rendering: Produce foundational documentation artifacts 
#    (READMEs, LICENSES, SERVICE_CONTRACTS.md).
# The --strict-reconcile flag enforces strict idempotency and content immutability 
# within SDGC management tags (<!-- SDGC-START/END -->).
sdgc-cli render --all --scope=monorepo --strict-reconcile
```

## 3. Mandatory Architectural Configuration State

The synchronization and attestation steps automatically configure mandatory environment context variables required for automated governance and CI authorization. Manual interaction with `~/.sdgc/local_env.yaml` is deprecated in favor of AGI-driven derivation.

| Variable | Importance | AGI Derivation Source Requirement | Status |
| :--- | :--- | :--- | :--- |
| `COMPONENT_ID` | CRITICAL: Master Component Registry (MCR) tracking. | Derived ONLY from canonical Bazel Target Path. | Immutable |
| `MAINTAINER_GROUP` | Ownership transfers and CI Authorization. | Must reference a valid entity in the centralized IAM directory. | Sync-Locked |
| `DEPENDENCY_TREE_LOCK` | Canonical path for vulnerability scanning documentation. | Defined relative to the component root. | Inherited |

## 4. Post-Generation Quality Assurance (DQA 94.1)

Upon successful rendering, the Documentation Quality Assurance (DQA) module automatically executes. DQA uses contextual deep learning models to assess documentation complexity, clarity, and consistency against established Sovereign Style Guides, outputting a numerical Compliance Score (`DQA-SCORE`). Artifacts failing to meet the `DQA-SCORE > 0.98` threshold are blocked from merger.

```bash
# Automatically invoked post-render, verifies compliance.
sdgc-cli score --artifact=README.md --check-threshold
```