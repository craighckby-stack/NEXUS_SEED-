import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Manual code injection API
// Allows injecting code directly into NEXUS's DNA or kernel

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, content, tags, source, code, name, fn, description, id } = body

    switch (action) {
      case 'inject': {
        // Inject code into DNA
        if (!content) {
          return NextResponse.json({ error: 'content required' }, { status: 400 })
        }

        const hash = `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`
        
        const chunk = await db.dnaChunk.create({
          data: {
            content: content.slice(0, 50000),
            tags: tags || 'manual,injected',
            source: source || `manual-injection-${Date.now()}`,
            hash,
            wordCount: content.split(/\s+/).length
          }
        })

        return NextResponse.json({ 
          success: true, 
          message: 'Code injected into DNA',
          id: chunk.id,
          wordCount: chunk.wordCount
        })
      }

      case 'injectKernel': {
        // Inject code as new kernel version
        if (!code) {
          return NextResponse.json({ error: 'code required' }, { status: 400 })
        }

        // Get current kernel state or create new
        const existing = await db.agiCoreState.findFirst({
          orderBy: { updatedAt: 'desc' }
        })

        if (existing) {
          const newCode = existing.code + '\n\n// === MANUAL INJECTION ===\n' + code
          await db.agiCoreState.update({
            where: { id: existing.id },
            data: { 
              code: newCode.slice(0, 100000)
            }
          })
        } else {
          await db.agiCoreState.create({
            data: {
              name: 'nexus-kernel',
              code: code.slice(0, 100000),
              languageCap: 0,
              codingCap: 0,
              executionCap: 0,
              learningCap: 0,
              overallCap: 0,
              generation: 1
            }
          })
        }

        // Also inject into DNA
        await db.dnaChunk.create({
          data: {
            content: code.slice(0, 50000),
            tags: 'kernel,manual,injection',
            source: 'kernel-injection',
            hash: `kernel-${Date.now()}`,
            wordCount: code.split(/\s+/).length
          }
        })

        return NextResponse.json({ 
          success: true, 
          message: 'Kernel code injected'
        })
      }

      case 'injectFunction': {
        // Inject a specific function into DNA
        if (!fn) {
          return NextResponse.json({ error: 'fn (function code) required' }, { status: 400 })
        }

        const wrappedCode = `// ${description || name || 'Injected Function'}
${fn}`

        await db.dnaChunk.create({
          data: {
            content: wrappedCode,
            tags: `function,manual,${name || 'injected'}`,
            source: `function-injection-${name || Date.now()}`,
            hash: `fn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            wordCount: wrappedCode.split(/\s+/).length
          }
        })

        return NextResponse.json({ 
          success: true, 
          message: `Function ${name || 'unknown'} injected`
        })
      }

      case 'listInjections': {
        // List all manually injected code
        const injections = await db.dnaChunk.findMany({
          where: {
            tags: { contains: 'manual' }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        })

        return NextResponse.json({
          success: true,
          injections: injections.map(i => ({
            id: i.id,
            source: i.source,
            tags: i.tags,
            wordCount: i.wordCount,
            preview: i.content.slice(0, 200),
            createdAt: i.createdAt
          }))
        })
      }

      case 'deleteInjection': {
        // Delete an injection
        if (!id) {
          return NextResponse.json({ error: 'id required' }, { status: 400 })
        }

        await db.dnaChunk.delete({ where: { id } })

        return NextResponse.json({ success: true, message: 'Injection deleted' })
      }

      case 'getDNA': {
        // Get specific DNA chunk by ID
        const chunk = await db.dnaChunk.findUnique({ where: { id } })
        
        if (!chunk) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          chunk: {
            ...chunk,
            preview: chunk.content.slice(0, 500)
          }
        })
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Available: inject, injectKernel, injectFunction, listInjections, deleteInjection, getDNA' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Inject API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  // Get injection stats
  const total = await db.dnaChunk.count({
    where: { tags: { contains: 'manual' } }
  })

  const recent = await db.dnaChunk.findMany({
    where: { tags: { contains: 'manual' } },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  return NextResponse.json({
    success: true,
    stats: {
      totalInjections: total,
      recent: recent.map(r => ({
        source: r.source,
        wordCount: r.wordCount,
        createdAt: r.createdAt
      }))
    }
  })
}
