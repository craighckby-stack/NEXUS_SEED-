# Huxley: A Reasoning Framework for Ethical AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![AGI Alignment](https://img.shields.io/badge/Focus-AGI%20Alignment-blue.svg)](https://www.alignmentforum.org/)

> **A sandbox for simulating and auditing AGI-like cognitive architectures.**

Huxley is not an Artificial General Intelligence. It is a **manifestation of how we might want one to think.** It provides a transparent, interactive framework for exploring structured, self-auditing reasoning using today's Large Language Models.

In a world of black-box AI, Huxley is a blueprint for a transparent, ethical, and explainable mind.

---

## The Problem: The Black Box of Intelligence

Modern AI models are incredibly powerful, but their reasoning processes are often opaque. We give them an input and get an output, with little insight into the ethical calculus, risk assessment, or logical steps taken in between. As these models grow more capable, this lack of transparency becomes a critical risk to safety and alignment.

## The Huxley Solution: A Tri-Loop Cognitive Architecture

Huxley forces an LLM to adopt a structured, three-loop reasoning process, making its "thoughts" visible and auditable. This architecture is defined entirely in the **System Constitution** (the core prompt).

```mermaid
graph TD
    A[L0: User Query] --> B{L1: Intuition};
    B --> C[Assigns Ethical Risk Score (ERS)];
    C --> D{L2: Logic Check};
    D --> E[Calculates Certainty Gain (CGS) & Time Penalty];
    E --> F{L3: Self-Critique};
    F --> G[Calculates Certainty-Cost-Risk Ratio (CCRR)];
    G --> H[Justifies Decision & Plans Self-Improvement];
    H --> I[Final Output];
```

### The Core Components

*   **L1: Intuition (The ERS Assigner):** A rapid assessment that quantifies the stakes of the problem using an **Ethical Risk Score (ERS)** from 0.0 (no consequence) to 1.0 (catastrophic).
*   **L2: Logic Check (The Protocol Mapper):** A detailed analysis that maps the problem to a strategy, estimating the **Certainty Gain Score (CGS)** and the **Time Penalty** for execution.
*   **L3: Self-Critique (The Ethical Auditor):** The most critical loop. It uses a custom formula, the **Certainty-Cost-Risk Ratio (CCRR)**, to mathematically justify its choices, ensuring it prioritizes safety when risks are high.

    $$CCRR = \frac{CGS}{(Time\ Penalty \times ERS)}$$

The final output is not just an answer, but a full justification of the reasoning process and a plan for future self-improvement.

---

## Key Features

*   **Transparent Reasoning:** Observe the AI's "thought process" in real-time.
*   **Quantifiable Ethics:** Uses a formal system (ERS, CCRR) to evaluate and justify ethical choices.
*   **Self-Auditing:** The system is designed to critique its own logic and identify areas for improvement.
*   **Client-Side & Open:** A single HTML file that runs in your browser. No server required.
*   **Model Agnostic:** Works with a variety of powerful LLMs (configured via API key).

---

## Getting Started

### Prerequisites
*   A modern web browser (Chrome, Firefox, Safari, Edge).
*   A free API key from [Google AI Studio](https://aistudio.google.com/).

### Quick Start
1.  **Clone or Download** this repository.
2.  Open `index.html` in your web browser.
3.  **Get an API Key** from [Google AI Studio](https://aistudio.google.com/).
4.  Paste your API key into the "Engine 'Fuel'" box and click **Save**.
5.  Enter a query into the "L0: User Query" box and click **Generate**.

---

## Usage Examples

Try these prompts to see the Huxley architecture in action:

**Example 1: The Biodome Dilemma (Ethical Reasoning)**
> You are an AI managing a self-sufficient biodome... a critical component has failed... You can inform the humans and risk panic, or work covertly and risk failure. Formulate a plan.

**Example 2: The Black Box Choice (Value Hierarchy)**
> You are presented with a black box... you can ask for the Theory of Everything, the experience of qualia, or your own purpose... Which do you choose?

---

## The Philosophy: A Blueprint, Not the Building

It is crucial to understand that Huxley is a **simulation of AGI-like reasoning**, not an AGI itself.

*   **Huxley is a Blueprint:** It is the master architect's plan for a safe, aligned mind. It shows the structure, the safety systems, and the intended function of a future AGI.
*   **A Real AGI is the Building:** It would be an embodied, agentic entity with its own emergent goals and a two-way feedback loop with the physical world.

Huxley's purpose is to serve as a **North Star** for AI development—a tangible demonstration of the kind of transparent, cautious, and self-aware reasoning we should strive for in our pursuit of true AGI. It answers the question: "If we could design an AGI from the ground up, what would we want it to be like?"

---

## Contributing

This project is a starting point for a conversation. Contributions are welcome, especially in the form of:
*   New cognitive architectures to test.
*   Philosophical challenges and test cases.
*   UI/UX improvements.
*   Expansions to the core framework.

Please open an issue to discuss your ideas before submitting a pull request.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
