# 🌌 Test-1- : AGI-Governance & Recursive Evolution Kernel

![Maturity](https://img.shields.io/badge/Maturity-Functional_Prototype-orange?style=for-the-badge) ![Version](https://img.shields.io/badge/Kernel_v7.12.1-Evolutionary-blueviolet?style=for-the-badge) ![Status](https://img.shields.io/badge/System_Status-Active-green?style=for-the-badge)

A high-fidelity experimental framework designed to simulate autonomous agent governance, recursive software evolution, and policy-driven system orchestration. This repository consolidates a multi-agent ecosystem (GAX, VMO, FIA) with a central React-based AGI Kernel for real-time lifecycle monitoring.

## 🛠 Factual Audit

**Classification:** **Functional Prototype / Architectural Simulation**

While this repository contains production-grade utility scripts (e.g., Python-based OpenXML manipulation), the primary "AGI Kernel" and "Governance Protocol" logic are **simulated environments**. 
- **Evidence:** `KERNAL/V1.js` contains a `CYCLE_DELAY` and `MILESTONE_STEP` (50) to trigger "recursive updates," which are state-machine simulations of an evolving AI. 
- **Persistence:** Uses Firebase Firestore as a live-synced "global memory" rather than local hardcoding, making it a functional networked prototype.

## 🚀 Technical Highlights

### 1. Dynamic Synergy Manager (Hot-Swapping)
Found in `KERNAL/V1.js`, this class implements a runtime plugin system that fetches executable code from Firestore and injects it into the kernel's capability window.

javascript
hotSwap(data) {
  if (!data || !data.interfaceName || !data.code) return false;
  try {
    // Evaluation factory for dynamic tool loading
    const factory = new Function('return ' + data.code);
    const plugin = factory();
    
    this.registry.set(data.interfaceName, { 
      execute: plugin.execute || plugin, 
      meta: data 
    });
    
    if (typeof window !== 'undefined') {
      window.KERNEL_SYNERGY_CAPABILITIES[data.interfaceName] = plugin;
    }
    return true;
  } catch (e) { console.error("HotSwap Failed:", e); return false; }
}


### 2. Low-Level OOXML Manifest Editor
Located in `skills/docx/scripts/document.py`, this snippet shows senior-level handle of XML namespaces and RSID (Revision Save ID) tracking for Microsoft Word document synthesis.

python
def _inject_attributes_to_nodes(self, nodes):
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    def add_rsid_to_p(elem):
        if not elem.hasAttribute("w:rsidR"):
            elem.setAttribute("w:rsidR", self.rsid)
        if not elem.hasAttribute("w14:paraId"):
            self._ensure_w14_namespace()
            elem.setAttribute("w14:paraId", _generate_hex_id())


### 3. Evolutionary Log Analysis
`Learning-by-death-logs.json` manages a "Trial and Error" dataset for a simulated agent named "Grog," tracking memory errors and recursion depths as evolutionary selection pressures.

## 🏗 Architecture & Data Flow

1.  **Frontend (React/Vite):** Orchestrates the `AGI-KERNEL`. It provides a dashboard for monitoring "Evolutionary Cycles" and manually triggering policy overrides.
2.  **State Management (useReducer):** Uses a complex core reducer to handle system booting, metric normalization, and milestone completion.
3.  **Governance Layer:** A massive collection of JSON schemas (`GACR`, `VSEC`) defines the constraints under which the simulated agents (GAX) must operate.
4.  **Database (Firebase):** Acts as the Source of Truth (SoT) for agent telemetry and live-swapping scripts.

## 🔍 Truth in Advertising
- **Backend:** The AGI logic is not a black-box neural network; it is a **Structured State Machine** that interacts with the Gemini 2.5 Flash API for content generation (see `CONFIG.GEMINI_ENDPOINT`).
- **Governance:** Policies defined in `/Governance/Protocol/` are schema-validated but require the user to provide the enforcement engine (or use the provided `ConstraintAdherenceValidator.js`).
- **Evolution:** The system "re-writes" its own versioning to Firestore; it does not yet physically refactor its own React components on disk without external script assistance (`.zscripts/`).

## 📦 Setup

bash
# 1. Initialize simulation scripts
chmod +x .zscripts/*.sh
./.zscripts/mini-services-install.sh

# 2. Configure Environment
# Ensure __firebase_config and __app_id are provided via environment variables.

# 3. Start Kernel
npm run dev # If using the Vite-based UI
