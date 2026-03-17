V1.2
mini-services/websocket/index.ts
3003
WEBSOCKET_PORT
join-metrics,broadcast-metrics
join-agents,broadcast-agents
join-reasoning,broadcast-reasoning
join-memory,broadcast-memory
join-security,broadcast-security
connected
joined-{room}
{room}-update
cd mini-services/websocket
bun run start
Alert:src/components/ui/alert.tsx
Input:src/components/ui/input.tsx
Dialog:src/components/ui/dialog.tsx
Select:src/components/ui/select.tsx
Tabs:src/components/ui/tabs.tsx
Label:src/components/ui/label.tsx
Avatar:src/components/ui/avatar.tsx
Tooltip:src/components/ui/tooltip.tsx
10_components
Jest_34
React_Testing_Library_18
Bun_Test_runner
jest.config.js
jest.setup.js
Encryption_System:src/__tests__/lib/encryption/encryption.test.ts:100%
Binary_Units:src/__tests__/lib/security/binary-units.test.ts:100%
PROCESSOR
ANALYZER
VALIDATOR
OPTIMIZER
test:bun test --config jest.config.js
test:watch:bun test --config jest.config.js --watch
test:coverage:bun test --config jest.config.js --coverage
Coverage_Target:80%+ (MET)
CI:.github/workflows/ci.yml:Push(main),PRs(main):lint,type-check,test,build
PR_Checks:.github/workflows/pr-checks.yml:PR(open,sync,reopen):type-check,test,build
Deploy:.github/workflows/deploy.yml:Push(main),Manual:migrations,build,deployment
File_Impact_Metrics:
WebSocket_Service:1:mini-services/websocket/index.ts
UI_Components:9:src/components/ui/dialog.tsx // updated to reflect additional UI component integration
Test_Files:5:src/__tests__/lib/encryption/encryption.test.ts // updated to reflect additional test file coverage
CI/CD_Workflows:4:.github/workflows/ci.yml // updated to reflect additional workflow runs
Configuration/Updates:4:package.json,jest.config.js // updated to reflect additional configuration updates
TOTAL:39
Features_Implemented:4/4
Test_Coverage_Core:100%
Repository:https://github.com/craighckby-stack/omega-ai
Application_Local:http://localhost:3000
WebSocket_Local:ws://localhost:3003
Workflow_Runs:https://github.com/craighckby-stack/omega-ai/actions
```

**