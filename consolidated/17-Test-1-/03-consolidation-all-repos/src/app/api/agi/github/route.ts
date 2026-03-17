import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const GITHUB_TOKEN = '${GITHUB_TOKEN}'
const GITHUB_API = 'https://api.github.com'

// Default repository
const DEFAULT_REPO = {
  owner: 'craighckby-stack',
  repo: 'Test-1',
  branch: 'master'
}

interface GitHubFile {
  path: string
  content?: string
  sha?: string
}

// Helper: GitHub API request
async function ghRequest(
  endpoint: string, 
  method: string = 'GET', 
  body?: object
): Promise<{ ok: boolean; data: unknown; status: number }> {
  const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API}${endpoint}`
  
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })

  const data = res.status !== 204 ? await res.json().catch(() => ({})) : {}
  return { ok: res.ok, data, status: res.status }
}

// Helper: Get file SHA
async function getFileSha(owner: string, repo: string, path: string, branch: string): Promise<string | null> {
  const { ok, data } = await ghRequest(
    `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
  )
  return ok ? (data as { sha?: string }).sha || null : null
}

// Helper: Get default branch
async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  const { ok, data } = await ghRequest(`/repos/${owner}/${repo}`)
  return ok ? (data as { default_branch?: string }).default_branch || 'main' : 'main'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    const owner = body.owner || DEFAULT_REPO.owner
    const repo = body.repo || DEFAULT_REPO.repo
    const branch = body.branch || await getDefaultBranch(owner, repo)

    switch (action) {
      // ==================== FILE OPERATIONS ====================
      
      case 'push':
      case 'create':
      case 'edit': {
        // Create or update a file
        const { path, content, message } = body
        
        if (!path || content === undefined) {
          return NextResponse.json({ error: 'Path and content required' }, { status: 400 })
        }

        const sha = await getFileSha(owner, repo, path, branch)
        const commitMessage = message || `NEXUS AGI: ${sha ? 'Update' : 'Create'} ${path}`

        const { ok, data, status } = await ghRequest(
          `/repos/${owner}/${repo}/contents/${path}`,
          'PUT',
          {
            message: commitMessage,
            content: Buffer.from(content).toString('base64'),
            branch,
            ...(sha && { sha })
          }
        )

        if (!ok) {
          return NextResponse.json({ 
            success: false, 
            error: (data as { message?: string }).message || 'Failed to push file',
            details: data
          }, { status })
        }

        return NextResponse.json({
          success: true,
          action: sha ? 'updated' : 'created',
          path,
          branch,
          commit: (data as { commit?: unknown }).commit,
          url: (data as { content?: { html_url?: string } }).content?.html_url
        })
      }

      case 'delete': {
        // Delete a file
        const { path, message } = body
        
        if (!path) {
          return NextResponse.json({ error: 'Path required' }, { status: 400 })
        }

        const sha = await getFileSha(owner, repo, path, branch)
        if (!sha) {
          return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        const { ok, data, status } = await ghRequest(
          `/repos/${owner}/${repo}/contents/${path}`,
          'DELETE',
          {
            message: message || `NEXUS AGI: Delete ${path}`,
            sha,
            branch
          }
        )

        if (!ok) {
          return NextResponse.json({ 
            success: false, 
            error: (data as { message?: string }).message || 'Failed to delete file'
          }, { status })
        }

        return NextResponse.json({
          success: true,
          action: 'deleted',
          path,
          branch
        })
      }

      case 'read': {
        // Read a file
        const { path } = body
        
        if (!path) {
          return NextResponse.json({ error: 'Path required' }, { status: 400 })
        }

        const { ok, data, status } = await ghRequest(
          `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
        )

        if (!ok) {
          return NextResponse.json({ 
            success: false, 
            error: 'File not found' 
          }, { status })
        }

        const file = data as { content?: string; encoding?: string; sha?: string; size?: number }
        const content = file.content && file.encoding === 'base64' 
          ? Buffer.from(file.content, 'base64').toString('utf-8')
          : file.content || ''

        return NextResponse.json({
          success: true,
          path,
          content,
          sha: file.sha,
          size: file.size
        })
      }

      case 'list': {
        // List files in a directory
        const { path: dirPath } = body
        const dir = dirPath || ''

        const { ok, data, status } = await ghRequest(
          `/repos/${owner}/${repo}/contents/${dir}?ref=${branch}`
        )

        if (!ok) {
          return NextResponse.json({ 
            success: false, 
            error: 'Directory not found' 
          }, { status })
        }

        const files = Array.isArray(data) ? data : [data]

        return NextResponse.json({
          success: true,
          path: dir || '/',
          files: files.map((f: { name: string; path: string; type: string; size?: number; sha?: string }) => ({
            name: f.name,
            path: f.path,
            type: f.type,
            size: f.size,
            sha: f.sha
          }))
        })
      }

      // ==================== BRANCH OPERATIONS ====================

      case 'createBranch': {
        // Create a new branch
        const { newBranch, sourceBranch } = body
        
        if (!newBranch) {
          return NextResponse.json({ error: 'newBranch required' }, { status: 400 })
        }

        const source = sourceBranch || await getDefaultBranch(owner, repo)
        
        // Get source branch SHA
        const { ok: refOk, data: refData, status } = await ghRequest(
          `/repos/${owner}/${repo}/git/ref/heads/${source}`
        )

        if (!refOk) {
          return NextResponse.json({ 
            success: false, 
            error: 'Source branch not found',
            details: refData
          }, { status })
        }

        const sha = (refData as { object?: { sha?: string } }).object?.sha

        // Create new branch
        const { ok: createOk, data: createData, status: createStatus } = await ghRequest(
          `/repos/${owner}/${repo}/git/refs`,
          'POST',
          {
            ref: `refs/heads/${newBranch}`,
            sha
          }
        )

        if (!createOk) {
          // Check if branch already exists
          const existsMsg = (createData as { message?: string }).message || ''
          if (existsMsg.includes('already exists')) {
            return NextResponse.json({ 
              success: true, 
              action: 'exists',
              branch: newBranch,
              message: 'Branch already exists'
            })
          }
          
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to create branch',
            details: createData
          }, { createStatus })
        }

        return NextResponse.json({
          success: true,
          action: 'created',
          branch: newBranch,
          source: source
        })
      }

      case 'deleteBranch': {
        // Delete a branch
        const { targetBranch } = body
        
        if (!targetBranch) {
          return NextResponse.json({ error: 'targetBranch required' }, { status: 400 })
        }

        const { ok, data, status } = await ghRequest(
          `/repos/${owner}/${repo}/git/refs/heads/${targetBranch}`,
          'DELETE'
        )

        if (!ok) {
          return NextResponse.json({ 
            success: false, 
            error: (data as { message?: string }).message || 'Failed to delete branch'
          }, { status })
        }

        return NextResponse.json({
          success: true,
          action: 'deleted',
          branch: targetBranch
        })
      }

      case 'listBranches': {
        // List all branches
        const { ok, data, status } = await ghRequest(
          `/repos/${owner}/${repo}/branches`
        )

        if (!ok) {
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to list branches' 
          }, { status })
        }

        return NextResponse.json({
          success: true,
          branches: (data as Array<{ name: string; commit?: { sha?: string } }>).map(b => ({
            name: b.name,
            sha: b.commit?.sha
          }))
        })
      }

      // ==================== REPOSITORY OPERATIONS ====================

      case 'createRepo': {
        // Create a new repository
        const { name, description, private: isPrivate, autoInit } = body
        
        if (!name) {
          return NextResponse.json({ error: 'Repository name required' }, { status: 400 })
        }

        const { ok, data, status } = await ghRequest(
          '/user/repos',
          'POST',
          {
            name,
            description: description || `Created by NEXUS AGI`,
            private: isPrivate || false,
            auto_init: autoInit !== false
          }
        )

        if (!ok) {
          return NextResponse.json({ 
            success: false, 
            error: (data as { message?: string }).message || 'Failed to create repository',
            details: data
          }, { status })
        }

        const repoData = data as { full_name?: string; html_url?: string; clone_url?: string }
        
        return NextResponse.json({
          success: true,
          action: 'created',
          name,
          fullName: repoData.full_name,
          url: repoData.html_url,
          cloneUrl: repoData.clone_url
        })
      }

      case 'deleteRepo': {
        // Delete a repository (DANGEROUS!)
        const { confirmName } = body
        
        // Require confirmation
        if (confirmName !== repo) {
          return NextResponse.json({ 
            error: 'Confirmation required: confirmName must match repo name' 
          }, { status: 400 })
        }

        const { ok, data, status } = await ghRequest(
          `/repos/${owner}/${repo}`,
          'DELETE'
        )

        if (!ok) {
          return NextResponse.json({ 
            success: false, 
            error: (data as { message?: string }).message || 'Failed to delete repository'
          }, { status })
        }

        return NextResponse.json({
          success: true,
          action: 'deleted',
          fullName: `${owner}/${repo}`
        })
      }

      case 'listRepos': {
        // List user's repositories
        const { user, perPage } = body
        const targetUser = user || owner

        const { ok, data, status } = await ghRequest(
          `/users/${targetUser}/repos?per_page=${perPage || 30}`
        )

        if (!ok) {
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to list repositories' 
          }, { status })
        }

        return NextResponse.json({
          success: true,
          repos: (data as Array<{
            name: string
            full_name: string
            description?: string
            private: boolean
            html_url: string
            default_branch: string
            size: number
          }>).map(r => ({
            name: r.name,
            fullName: r.full_name,
            description: r.description,
            private: r.private,
            url: r.html_url,
            defaultBranch: r.default_branch,
            size: r.size
          }))
        })
      }

      // ==================== PRUNE OPERATIONS ====================

      case 'prune': {
        // Prune old/unused files based on patterns
        const { patterns, dryRun, olderThanDays } = body
        
        if (!patterns || !Array.isArray(patterns)) {
          return NextResponse.json({ error: 'patterns array required' }, { status: 400 })
        }

        // Get all files via tree
        const { ok: treeOk, data: treeData } = await ghRequest(
          `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
        )

        if (!treeOk) {
          return NextResponse.json({ error: 'Failed to get file tree' }, { status: 500 })
        }

        const tree = (treeData as { tree?: Array<{ path: string; type: string }> }).tree || []
        const files = tree.filter(f => f.type === 'blob')

        // Match files against patterns
        const toDelete: string[] = []
        for (const file of files) {
          for (const pattern of patterns) {
            const regex = new RegExp(pattern, 'i')
            if (regex.test(file.path)) {
              toDelete.push(file.path)
              break
            }
          }
        }

        if (dryRun) {
          return NextResponse.json({
            success: true,
            dryRun: true,
            filesToDelete: toDelete,
            count: toDelete.length
          })
        }

        // Delete files
        const deleted: string[] = []
        const errors: { path: string; error: string }[] = []

        for (const path of toDelete.slice(0, 50)) { // Limit to 50 at a time
          const sha = await getFileSha(owner, repo, path, branch)
          if (sha) {
            const { ok } = await ghRequest(
              `/repos/${owner}/${repo}/contents/${path}`,
              'DELETE',
              {
                message: `NEXUS AGI: Prune ${path}`,
                sha,
                branch
              }
            )
            if (ok) {
              deleted.push(path)
            } else {
              errors.push({ path, error: 'Failed to delete' })
            }
          }
        }

        return NextResponse.json({
          success: true,
          action: 'pruned',
          deleted,
          errors,
          deletedCount: deleted.length
        })
      }

      // ==================== BULK OPERATIONS ====================

      case 'bulkEdit': {
        // Edit multiple files at once
        const { files, message } = body as { files: GitHubFile[]; message?: string }
        
        if (!files || !Array.isArray(files)) {
          return NextResponse.json({ error: 'files array required' }, { status: 400 })
        }

        const results: { path: string; success: boolean; error?: string }[] = []

        for (const file of files.slice(0, 20)) { // Limit to 20 at a time
          const sha = await getFileSha(owner, repo, file.path, branch)
          
          const { ok, data } = await ghRequest(
            `/repos/${owner}/${repo}/contents/${file.path}`,
            'PUT',
            {
              message: message || `NEXUS AGI: Update ${file.path}`,
              content: Buffer.from(file.content || '').toString('base64'),
              branch,
              ...(sha && { sha })
            }
          )

          results.push({
            path: file.path,
            success: ok,
            error: ok ? undefined : (data as { message?: string }).message
          })
        }

        const successCount = results.filter(r => r.success).length

        return NextResponse.json({
          success: successCount > 0,
          results,
          successCount,
          failCount: results.length - successCount
        })
      }

      // ==================== NEXUS SPECIFIC ====================

      case 'pushEvolution': {
        // Push evolved AGI code
        const { code: evolutionCode } = body
        
        if (!evolutionCode) {
          return NextResponse.json({ error: 'No code to push' }, { status: 400 })
        }

        // Get current state from DB
        const coreState = await db.agiCoreState.findFirst({
          orderBy: { updatedAt: 'desc' }
        })

        const generation = coreState?.generation || 1
        const capabilities = {
          language: coreState?.languageCap || 0,
          coding: coreState?.codingCap || 0,
          execution: coreState?.executionCap || 0,
          learning: coreState?.learningCap || 0,
          overall: coreState?.overallCap || 0
        }

        // Try to push to nexus/kernel.js
        const kernelPath = 'nexus/kernel.js'
        const sha = await getFileSha(owner, repo, kernelPath, branch)

        const commitMessage = `NEXUS AGI v7.0 - Evolution #${generation}

Capabilities: ${(capabilities.overall * 100).toFixed(0)}% overall
- Language: ${(capabilities.language * 100).toFixed(0)}%
- Coding: ${(capabilities.coding * 100).toFixed(0)}%
- Execution: ${(capabilities.execution * 100).toFixed(0)}%
- Learning: ${(capabilities.learning * 100).toFixed(0)}%`

        const { ok, data, status } = await ghRequest(
          `/repos/${owner}/${repo}/contents/${kernelPath}`,
          'PUT',
          {
            message: commitMessage,
            content: Buffer.from(evolutionCode).toString('base64'),
            branch,
            ...(sha && { sha })
          }
        )

        if (!ok) {
          return NextResponse.json({
            success: false,
            error: (data as { message?: string }).message || 'Failed to push evolution',
            details: data
          }, { status })
        }

        return NextResponse.json({
          success: true,
          action: 'pushed',
          path: kernelPath,
          branch,
          generation,
          capabilities,
          commit: (data as { commit?: unknown }).commit,
          url: (data as { content?: { html_url?: string } }).content?.html_url
        })
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Available: push, create, edit, delete, read, list, createBranch, deleteBranch, listBranches, createRepo, deleteRepo, listRepos, prune, bulkEdit, pushEvolution' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('GitHub API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const owner = searchParams.get('owner') || DEFAULT_REPO.owner
  const repo = searchParams.get('repo') || DEFAULT_REPO.repo

  // Get repository status
  const { ok, data, status } = await ghRequest(`/repos/${owner}/${repo}`)

  if (!ok) {
    return NextResponse.json({ 
      success: false, 
      error: 'Repository not found',
      details: data
    }, { status })
  }

  const repoData = data as {
    name: string
    full_name: string
    default_branch: string
    private: boolean
    size: number
    html_url: string
    description?: string
  }

  // Get branches
  const { data: branchesData } = await ghRequest(`/repos/${owner}/${repo}/branches`)
  const branches = (branchesData as Array<{ name: string }>).map(b => b.name)

  return NextResponse.json({
    success: true,
    repo: {
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description,
      defaultBranch: repoData.default_branch,
      private: repoData.private,
      size: repoData.size,
      url: repoData.html_url,
      branches
    }
  })
}
