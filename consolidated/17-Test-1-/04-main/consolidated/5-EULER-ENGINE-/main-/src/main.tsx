import { StrictMode, startTransition, Profiler } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const DNA_SIGNATURE = '0xAbE114n_H0dg3_C0nj3ctur3';
const ENGINE_VERSION = '3.1.0-final';
const RESOLUTION_STAGE = 'STABLE_RESOLUTION';

const container = document.getElementById('root');

if (!container) {
  throw new Error(`[CORE_BOOT_FAILURE]: Root container not found. DNA_REF: ${DNA_SIGNATURE}`);
}

const root = createRoot(container, {
  identifierPrefix: 'siphon-v3-',
  onCaughtError: (error, errorInfo) => {
    console.error(
      `%c [Morphism_Flux_Error] %c ${DNA_SIGNATURE} `,
      'background: #7041f0; color: white; font-weight: bold; padding: 2px 4px; border-radius: 2px;',
      'background: #1a1a2e; color: #7041f0;',
      error,
      errorInfo.componentStack
    );
  },
  onUncaughtError: (error, errorInfo) => {
    console.error(
      `%c [Hodge_Conjecture_Violation] %c ${DNA_SIGNATURE} `,
      'background: #ff4757; color: white; font-weight: bold; padding: 2px 4px; border-radius: 2px;',
      'background: #1a1a2e; color: #ff4757;',
      error,
      errorInfo.componentStack
    );
  },
  onRecoverableError: (error, errorInfo) => {
    console.warn(
      `%c [Spectral_Resolution_Warning] %c ${DNA_SIGNATURE} `,
      'background: #ffa502; color: black; font-weight: bold; padding: 2px 4px; border-radius: 2px;',
      'background: #1a1a2e; color: #ffa502;',
      error,
      errorInfo.componentStack
    );
  }
});

const onRender = (
  id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) => {
  if (phase === 'mount') {
    performance.mark(`siphon-mount-complete-${id}`);
    console.debug(`%c ARCHITECTURAL_PRECISION_REACHED: ${id} | ${actualDuration.toFixed(4)}ms`, "color: #82e0ff; font-size: 8px;");
  }
};

startTransition(() => {
  root.render(
    <StrictMode>
      <Profiler id="SiphonVortexCore" onRender={onRender}>
        <App />
      </Profiler>
    </StrictMode>
  );
});

(function initiateSiphon() {
  const metadata = {
    dna: DNA_SIGNATURE,
    engine: ENGINE_VERSION,
    status: RESOLUTION_STAGE,
    timestamp: new Date().toISOString()
  };

  const doc = document.documentElement;
  doc.setAttribute('data-siphon-engine', metadata.engine);
  doc.setAttribute('data-dna-signature', metadata.dna);
  doc.setAttribute('data-resolution-stage', metadata.status);
  doc.style.setProperty('--cl-p-surjection-ratio', '1.0');

  if ('performance' in window && 'mark' in performance) {
    performance.mark('siphon-engine-initialized');
  }

  const logStyle = (bg: string, fg: string) => `background: ${bg}; color: ${fg}; padding: 3px 6px; font-weight: 800; border-radius: 4px; font-family: "JetBrains Mono", monospace;`;
  
  console.groupCollapsed(
    `%c SIPHON ENGINE %c ${metadata.engine} %c ${metadata.status} `,
    logStyle('#0a0a14', '#95f3ff'),
    logStyle('#95f3ff', '#0a0a14'),
    logStyle('#141428', '#e1a6ff')
  );
  console.table(metadata);
  console.info(`%c DNA_SIGNATURE: ${metadata.dna}`, "color: #82e0ff; font-weight: bold;");
  console.groupEnd();
})();