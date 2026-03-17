import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Safe execution sandbox for testing AGI capabilities
const SAFE_GLOBALS = {
  console: { log: () => {}, error: () => {}, warn: () => {} },
  Math: Math,
  JSON: JSON,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Date: Date,
  RegExp: RegExp,
  Error: Error,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  isFinite: isFinite,
  encodeURIComponent: encodeURIComponent,
  decodeURIComponent: decodeURIComponent,
}

// Blocked patterns for security
const BLOCKED_PATTERNS = [
  /require\s*\(/gi,
  /import\s+/gi,
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /process/gi,
  /global/gi,
  /window/gi,
  /document/gi,
  /fetch\s*\(/gi,
  /child_process/gi,
  /fs\./gi,
  /path\./gi,
  /os\./gi,
  /crypto/gi,
  /http/gi,
  /https/gi,
  /net/gi,
  /dns/gi,
  /readFile/gi,
  /writeFile/gi,
  /exec\s*\(/gi,
  /spawn/gi,
  /\.env/gi,
]

function isSafeCode(code: string): { safe: boolean; reason?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(code)) {
      return { safe: false, reason: `Blocked pattern detected: ${pattern.source}` }
    }
  }
  return { safe: true }
}

function safeExecute(code: string, input: any, timeout = 5000): { success: boolean; output: any; error?: string; ms: number } {
  const start = Date.now()
  
  // Security check
  const safety = isSafeCode(code)
  if (!safety.safe) {
    return { success: false, output: null, error: safety.reason, ms: 0 }
  }
  
  try {
    // Create a sandboxed function
    const wrappedCode = `
      "use strict";
      return (function(input) {
        ${code}
      })(input);
    `
    
    // Create function with restricted globals
    const fn = new Function('input', ...Object.keys(SAFE_GLOBALS), wrappedCode)
    
    // Execute with timeout simulation (Note: true timeout needs worker threads)
    const result = fn(input, ...Object.values(SAFE_GLOBALS))
    
    return { success: true, output: result, ms: Date.now() - start }
  } catch (error) {
    return { 
      success: false, 
      output: null, 
      error: error instanceof Error ? error.message : 'Execution failed',
      ms: Date.now() - start
    }
  }
}

// Test cases for each capability
const CAPABILITY_TESTS = {
  language: [
    {
      name: 'Intent Recognition',
      description: 'Parse user intent from natural language',
      input: { text: 'Create a function that adds two numbers' },
      test: (code: string) => {
        // Check if code has intent parsing logic
        const hasIntent = /intent|understand|parse|meaning|extract/i.test(code)
        const hasAction = /action|task|operation/i.test(code)
        return hasIntent && hasAction ? 0.7 : hasIntent ? 0.4 : 0
      }
    },
    {
      name: 'Entity Extraction',
      description: 'Extract entities from text',
      input: { text: 'Sort the array [3,1,2] in descending order' },
      test: (code: string) => {
        const hasEntity = /entity|extract|param|argument|value/i.test(code)
        const hasArray = /array|list|collection/i.test(code)
        return hasEntity && hasArray ? 0.6 : hasEntity ? 0.3 : 0
      }
    },
    {
      name: 'Context Understanding',
      description: 'Maintain context across inputs',
      input: { history: ['Add 2 and 3', 'Now multiply by 4'], current: 'What is the result?' },
      test: (code: string) => {
        const hasContext = /context|history|previous|memory|state/i.test(code)
        return hasContext ? 0.8 : 0
      }
    }
  ],
  coding: [
    {
      name: 'Function Generation',
      description: 'Generate working functions',
      input: { task: 'Create a function to reverse a string' },
      test: (code: string) => {
        // Try to execute and test the code
        const result = safeExecute(code, 'hello')
        if (result.success && result.output) {
          // Check if it could be a reversed string
          return typeof result.output === 'string' ? 0.8 : 0.4
        }
        // Check for function definitions
        const hasFunction = /function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|=>\s*{/i.test(code)
        const hasReturn = /return\s+/i.test(code)
        return hasFunction && hasReturn ? 0.5 : hasFunction ? 0.2 : 0
      }
    },
    {
      name: 'Algorithm Implementation',
      description: 'Implement algorithms correctly',
      input: { task: 'Implement binary search' },
      test: (code: string) => {
        const hasLoop = /for|while|recursive/i.test(code)
        const hasCondition = /if|switch|condition/i.test(code)
        const hasArray = /array|\[\]|\.length/i.test(code)
        return hasLoop && hasCondition && hasArray ? 0.7 : (hasLoop || hasCondition) ? 0.3 : 0
      }
    },
    {
      name: 'Error Handling',
      description: 'Proper error handling in code',
      input: { task: 'Divide two numbers safely' },
      test: (code: string) => {
        const hasTryCatch = /try\s*{[\s\S]*}\s*catch/i.test(code)
        const hasValidation = /if\s*\([^)]*\)\s*(throw|return|error)/i.test(code)
        return hasTryCatch ? 0.8 : hasValidation ? 0.5 : 0
      }
    }
  ],
  execution: [
    {
      name: 'Code Execution',
      description: 'Execute generated code',
      input: { code: 'return 2 + 2', params: {} },
      test: (code: string) => {
        const hasExec = /execute|run|eval|invoke|call/i.test(code)
        const hasResult = /result|output|return/i.test(code)
        const hasTryCatch = /try\s*{[\s\S]*catch/i.test(code)
        return hasExec && hasResult && hasTryCatch ? 0.8 : hasExec ? 0.4 : 0
      }
    },
    {
      name: 'Output Validation',
      description: 'Validate execution results',
      input: { result: 5, expected: 5 },
      test: (code: string) => {
        const hasValidate = /valid|check|verify|compare|expect/i.test(code)
        const hasSuccess = /success|pass|fail|error/i.test(code)
        return hasValidate && hasSuccess ? 0.7 : hasValidate ? 0.4 : 0
      }
    },
    {
      name: 'Sandbox Safety',
      description: 'Safe code execution',
      input: { code: 'process.exit(1)' },
      test: (code: string) => {
        const hasSandbox = /sandbox|safe|block|restrict|allow/i.test(code)
        const hasBlacklist = /block|forbid|prevent|dangerous/i.test(code)
        return hasSandbox && hasBlacklist ? 0.8 : hasSandbox ? 0.5 : 0
      }
    }
  ],
  learning: [
    {
      name: 'Pattern Recognition',
      description: 'Identify patterns in data',
      input: { results: [{ task: 'sort', success: true }, { task: 'sort', success: true }] },
      test: (code: string) => {
        const hasPattern = /pattern|trend|analy|recognize|detect/i.test(code)
        const hasMemory = /memory|store|save|record|history/i.test(code)
        return hasPattern && hasMemory ? 0.7 : hasPattern ? 0.4 : 0
      }
    },
    {
      name: 'Feedback Integration',
      description: 'Learn from feedback',
      input: { feedback: 'The sort function was slow', previousResult: { time: 500 } },
      test: (code: string) => {
        const hasFeedback = /feedback|improve|adapt|adjust|learn/i.test(code)
        const hasUpdate = /update|modify|change|evolve/i.test(code)
        return hasFeedback && hasUpdate ? 0.8 : hasFeedback ? 0.4 : 0
      }
    },
    {
      name: 'Knowledge Persistence',
      description: 'Store and retrieve learned knowledge',
      input: { pattern: 'arrays are best sorted with quicksort', context: 'sorting task' },
      test: (code: string) => {
        const hasStore = /store|save|persist|record|write/i.test(code)
        const hasRetrieve = /retrieve|get|recall|load|fetch/i.test(code)
        const hasKnowledge = /knowledge|learning|memory|experience/i.test(code)
        return hasStore && hasRetrieve && hasKnowledge ? 0.8 : (hasStore || hasRetrieve) ? 0.4 : 0
      }
    }
  ]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, code, testType, input } = body
    
    switch (action) {
      case 'execute': {
        // Execute code safely
        const result = safeExecute(code, input)
        
        // Store execution result
        await db.codeExecution.create({
          data: {
            code: code.slice(0, 5000),
            language: 'javascript',
            input: JSON.stringify(input),
            output: JSON.stringify(result.output),
            error: result.error,
            success: result.success,
            executionMs: result.ms,
            safe: !result.error?.includes('Blocked')
          }
        })
        
        return NextResponse.json({ success: true, result })
      }
      
      case 'testCapabilities': {
        // Run all capability tests
        const results: Record<string, { score: number; tests: { name: string; score: number }[] }> = {}
        let totalScore = 0
        let testCount = 0
        
        for (const [category, tests] of Object.entries(CAPABILITY_TESTS)) {
          const testResults = tests.map(test => ({
            name: test.name,
            score: test.test(code)
          }))
          
          const avgScore = testResults.reduce((sum, t) => sum + t.score, 0) / testResults.length
          results[category] = { score: avgScore, tests: testResults }
          totalScore += avgScore
          testCount++
        }
        
        const overall = totalScore / testCount
        
        return NextResponse.json({
          success: true,
          results,
          overall,
          summary: {
            language: results.language?.score || 0,
            coding: results.coding?.score || 0,
            execution: results.execution?.score || 0,
            learning: results.learning?.score || 0,
            overall
          }
        })
      }
      
      case 'runSpecificTest': {
        // Run a specific test
        const tests = CAPABILITY_TESTS[testType as keyof typeof CAPABILITY_TESTS]
        if (!tests) {
          return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
        }
        
        const results = tests.map(test => ({
          name: test.name,
          description: test.description,
          score: test.test(code),
          input: test.input
        }))
        
        return NextResponse.json({ success: true, results })
      }
      
      case 'saveResult': {
        // Save a task result
        const { sessionId, generation, taskType, taskInput, output, success, error, verified } = body
        
        await db.taskResult.create({
          data: {
            sessionId,
            generation,
            taskType,
            input: JSON.stringify(taskInput),
            output: JSON.stringify(output),
            success,
            error,
            verified
          }
        })
        
        return NextResponse.json({ success: true })
      }
      
      case 'saveLearning': {
        // Save a learning pattern
        const { category, pattern, context } = body
        
        await db.learningMemory.create({
          data: {
            category,
            pattern,
            context
          }
        })
        
        return NextResponse.json({ success: true })
      }
      
      case 'getLearnings': {
        // Retrieve all learnings
        const learnings = await db.learningMemory.findMany({
          orderBy: { successRate: 'desc' },
          take: 50
        })
        
        return NextResponse.json({ success: true, learnings })
      }
      
      case 'saveCoreState': {
        // Save AGI core state
        const { name, code: stateCode, capabilities, generation } = body
        
        await db.agiCoreState.upsert({
          where: { name },
          create: {
            name,
            code: stateCode,
            languageCap: capabilities.language,
            codingCap: capabilities.coding,
            executionCap: capabilities.execution,
            learningCap: capabilities.learning,
            overallCap: capabilities.overall,
            generation
          },
          update: {
            code: stateCode,
            languageCap: capabilities.language,
            codingCap: capabilities.coding,
            executionCap: capabilities.execution,
            learningCap: capabilities.learning,
            overallCap: capabilities.overall,
            generation
          }
        })
        
        return NextResponse.json({ success: true })
      }
      
      case 'getCoreState': {
        // Get AGI core state
        const { name } = body
        const state = await db.agiCoreState.findUnique({
          where: { name }
        })
        
        return NextResponse.json({ success: true, state })
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Execute API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
