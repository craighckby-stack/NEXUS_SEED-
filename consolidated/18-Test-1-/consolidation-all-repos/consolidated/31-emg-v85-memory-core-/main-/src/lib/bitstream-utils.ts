export interface BitstreamFile {
  name: string
  size: number
  rawContent: string
  decodedContent?: string
  isValid: boolean
  parseError?: string
}

export interface Anomaly {
  type: 'WORD' | 'EQUATION' | 'CODE' | 'ENTITY' | 'UNKNOWN'
  item: string
  reason: string
  position?: number
  line?: number
  severity: 'low' | 'medium' | 'high'
}

export interface AuditReport {
  generated: string
  model: string
  anomalies: Anomaly[]
  total: number
  bufferSize: number
  systemStatus?: {
    bridgeStatus: string
    bufferLength: number
    timestamp: string
  }
  customNotes?: string
}

/**
 * Parse binary or text file and extract content
 */
export async function parseBitstreamFile(file: File): Promise<BitstreamFile> {
  const result: BitstreamFile = {
    name: file.name,
    size: file.size,
    rawContent: '',
    isValid: false
  }

  try {
    // Read file as text
    result.rawContent = await file.text()

    // Try to decode if it appears to be binary string
    const bits = result.rawContent.replace(/[^01]/g, '')
    let decoded = ''
    if (bits.length >= 8) {
      for (let i = 0; i < bits.length; i += 8) {
        const byte = bits.substring(i, i + 8)
        if (byte.length === 8) {
          decoded += String.fromCharCode(parseInt(byte, 2))
        }
      }
    }

    // Use decoded content if it's valid, otherwise use raw
    result.decodedContent = decoded.length > 50 ? decoded : result.rawContent
    result.isValid = result.decodedContent.length > 0

    return result
  } catch (error: any) {
    result.parseError = error instanceof Error ? error.message : 'Unknown error'
    return result
  }
}

/**
 * Decode bitstream format to text
 */
export function decodeBitstream(content: string): string {
  // Remove non-binary characters
  const bits = content.replace(/[^01]/g, '')

  // Convert to text
  let text = ''
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.substring(i, i + 8)
    if (byte.length === 8) {
      text += String.fromCharCode(parseInt(byte, 2))
    }
  }

  return text.trim()
}

/**
 * Detect anomalies in content using heuristics
 */
export function detectAnomalies(content: string): Anomaly[] {
  const anomalies: Anomaly[] = []
  const lines = content.split('\n')

  // Patterns for different types of anomalies
  const patterns = {
    undefinedWords: /\b(undefined|unknown_variable|unknown_constant|null_reference|void_parameter)\b/gi,
    undefinedEquations: /(Delta-[a-z]+|Unknown-[A-Z]+|undefined_[a-z0-9]+|unknown_[A-Z]+|\?[a-z]+\st)/gi,
    undefinedCode: /(function\s+[a-z0-9]*\s*\(\s*\)\s*\{\s*\}|class\s+[A-Z][a-z]+\s*\{\s*\}.*\n.*\{\s*}|for\s*\(\s*;\s*\))/gi,
    undefinedEntities: /\b(ENTITY_[0-9]+|SYSTEM_[A-Z]+|UNDEF_\w+)\b/gi
  }

  // Scan line by line
  lines.forEach((line, lineIndex) => {
    // Check for undefined words
    const words = patterns.undefinedWords.exec(line)
    if (words) {
      anomalies.push({
        type: 'WORD',
        item: words[0],
        reason: 'Jargon or term used without proper definition',
        position: content.indexOf(line),
        line: lineIndex + 1,
        severity: 'low'
      })
    }

    // Check for undefined equations
    const equations = patterns.undefinedEquations.exec(line)
    if (equations) {
      anomalies.push({
        type: 'EQUATION',
        item: equations[0],
        reason: 'Mathematical variable or constant not properly defined',
        position: content.indexOf(line),
        line: lineIndex + 1,
        severity: 'high'
      })
    }

    // Check for anomalous code
    const code = patterns.undefinedCode.exec(line)
    if (code) {
      anomalies.push({
        type: 'code',
        item: code[0],
        reason: 'Code fragment appears incomplete or improperly structured',
        position: content.indexOf(line),
        line: lineIndex + 1,
        severity: 'high'
      })
    }

    // Check for undefined entities
    const entities = patterns.undefinedEntities.exec(line)
    if (entities) {
      anomalies.push({
        type: 'ENTITY',
        item: entities[0],
        reason: 'Named entity or concept without clear definition',
        position: content.indexOf(line),
        line: lineIndex + 1,
        severity: 'medium'
      })
    }
  })

  return anomalies
}

/**
 * Determine anomaly severity based on type
 */
export function getAnomalySeverity(type: string): 'low' | 'medium' | 'high' {
  const severityMap: Record<string, 'low' | 'medium' | 'high'> = {
    'WORD': 'low',
    'ENTITY': 'medium',
    'EQUATION': 'high',
    'CODE': 'high',
    'UNKNOWN': 'low'
  }
  return severityMap[type] || 'low'
}

/**
 * Generate anomaly summary statistics
 */
export function generateAnomalyStats(anomalies: Anomaly[]) {
  const stats = {
    total: anomalies.length,
    byType: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>
  }

  anomalies.forEach((anomaly) => {
    stats.byType[anomaly.type] = (stats.byType[anomaly.type] || 0) + 1
    stats.bySeverity[anomaly.severity] = (stats.bySeverity[anomaly.severity] || 0) + 1
  })

  return stats
}

/**
 * Format file size for display
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Extract entities from text using regex
 */
export function extractEntities(text: string): string[] {
  const entityPatterns = [
    /\b[A-Z][a-z]+(?:System|Network|Data|Core|Vessel|Bridge|Memory|Database|API|UI|Component|Library|Model|Agent|Bot|Server|Client|State|Status|Action|Event|Handler|Controller|Service|Provider|Repository|File|Directory|Path|Route|Endpoint|Response|Request|Query|Parameter|Argument|Return|Error|Warning|Message|Log|Debug|Test|Build|Deploy|Config|Setting|Option|Flag|Tag|Label|Title|Description|Note|Comment|Code|Function|Class|Interface|Type|Property|Value|Object|Array|String|Number|Boolean|Null|Undefined|Unknown|Error|Warn|Info|Success|Fail|Pass|Skip|Ignore|Include|Exclude|Filter|Sort|Map|Reduce|Find|Search|Match|Index|Key|Value|Item|List|Queue|Stack|Trace|Dump|Export|Import|Save|Load|Delete|Update|Create|Read|Write|Seek|Tell|Get|Post|Put|Patch|Merge|Diff|Compare|Sync|Async|Wait|Timeout|Retry|Cancel|Close|Open|Start|Stop|Pause|Resume|Clear|Reset|Init|Run|Exec|Call|Invoke|Apply|Render|Parse|Validate|Verify|Check|Test|Mock|Stub|Proxy|Adapter|Driver|Client|Server|Database|File|Stream|Buffer|Cache|Store|Session|Token|Auth|Login|Logout|User|Admin|Role|Permission|Scope|Context|State|Data|Config|Setting|Option|Flag|Tag|Label|Title|Description|Note|Comment|Code|Function|Class|Interface|Type|Property|Value|Object|Array|String|Number|Boolean|Null|Undefined|Unknown|Error|Warn|Info|Success|Fail|Pass|Skip|Ignore|Include|Exclude|Filter|Sort|Map|Reduce|Find|Search|Match|Index|Key|Value|Item|List|Queue|Stack|Trace|Dump|Export|Import|Save|Load|Delete|Update|Create|Read|Write|Seek|Tell|Get|Post|Put|Patch|Merge|Diff|Compare|Sync|Async|Wait|Timeout|Retry|Cancel|Close|Open|Start|Stop|Pause|Resume|Clear|Reset|Init|Run|Exec|Call|Invoke|Apply|Render|Parse|Validate|Verify|Check|Test|Mock|Stub|Proxy|Adapter|Driver|Client|Server|Database|File|Stream|Buffer|Cache|Store|Session|Token|Auth|Login|Logout|User|Admin|Role|Permission|Scope|Context|State|Data|Config|Setting|Option|Flag|Tag|Label|Title|Description|Note|Comment|Code|Function|Class|Interface|Type|Property|Value|Object|Array|String|Number|Boolean|Null|Undefined|Unknown|Error|Warn|Info|Success|Fail|Pass|Skip|Ignore|Include|Exclude|Filter|Sort|Map|Reduce|Find|Search|Match|Index|Key|Value|Item|List|Queue|Stack|Trace|Dump|Export|Import|Save|Load|Delete|Update|Create|Read|Write|Seek|Tell|Get|Post|Put|Patch|Merge|Diff|Compare|Sync|Async|Wait|Timeout|Retry|Cancel|Close|Open|Start|Stop|Pause|Resume|Clear|Reset|Init|Run|Exec|Call|Invoke|Apply|Render|Parse|Validate|Verify|Check|Test|Mock|Stub|Proxy|Adapter|Driver|Client|Server|Database|File|Stream|Buffer|Cache|Store|Session|Token|Auth|Login|Logout|User|Admin|Role|Permission|Scope|Context|State|Data|Config|Setting|Option|Flag|Tag|Label|Title|Description|Note|Comment|Code|Function|Class|Interface|Type|Property|Value|Object|Array|String|Number|Boolean|Null|Undefined|Unknown|Error|Warn|Info|Success|Fail|Pass|Skip|Ignore|Include|Exclude|Filter|Sort|Map|Reduce|Find|Search|Match|Index|Key|Value|Item|List|Queue|Stack|Trace|Dump|Export|Import|Save|Load|Delete|Update|Create|Read|Write|Seek|Tell|Get|Post|Put|Patch|Merge|Diff|Compare|Sync|Async|Wait|Timeout|Retry|Cancel|Close|Open|Start|Stop|Pause|Resume|Clear|Reset|Init|Run|Exec|Call|Invoke|Apply|Render|Parse|Validate|Verify|Check|Test|Mock|Stub|Proxy|Adapter|Driver|Client|Server|Database|File|Stream|Buffer|Cache|Store|Session|Token|Auth|Login|Logout|User|Admin|Role|Permission|Scope|Context|State|Data|Config|Setting|Option|Flag|Tag|Label|Title|Description|Note|Comment|Code|Function|Class|Interface|Type|Property|Value|Object|Array|String|Number|Boolean|Null|Undefined|Unknown|Error|Wait|Info|Success|Fail|Pass|Skip|Ignore|Include|Exclude|Filter|Sort|Map|Reduce|Find|Search|Match|Index|Key|Value|Item|List|Queue|Stack|Trace|Dump|Export|Import|Save|Load|Delete|Update|Create|Read|Write|Seek|Tell|Get|Post|Put|Patch|Merge|Diff|Compare|Sync|Async|Wait|Timeout|Retry|Cancel|Close|Open|Start|Stop|Pause|Resume|Clear|Reset|Init|Run|Exec|Call|Invoke|Apply|Render|Parse|Validate|Verify|Check|Test|Mock|Stub|Proxy|Adapter|Driver|Client|Server|Database|File|Stream|Buffer|Cache|Store|Session|Token|Auth|Login|Logout|User|Admin|Role|Permission|Scope|Context|State|Data|Config|Setting|Option|Flag|Tag|Label|Title|Description|Note|Comment|Code|Function|Class|Interface|Type|Property|Value|Object|Array|String|Number|Boolean|Null|Undefined|Unknown|Error|Warn|Info|Success|Fail|Pass|Skip|Ignore|Include|Exclude|Filter|Sort|Map|Reduce|Find|Search|Match|Index|Key|Value|Item|List|Queue|Stack|Trace|Dump|Export|Import|Save|Load|Delete|Update|Create|Read|Write|Seek|Tell|Get|Post|Put|Patch|Merge|Diff|Compare|Sync|Async|Wait|Timeout|Retry|Cancel|Close|Open|Start|Stop|Pause|Resume|Clear|Reset|Init|Run|Exec|Call|Invoke|Apply|Render|Parse|Validate|Verify|Check|Test|Mock|Stub|Proxy|Adapter|Driver|Client|Server|Database|File|Stream|Buffer|Cache|Store|Session|Token|Auth|Login|Logout|User|Admin|Role|Permission|Scope|Context|State|Data|Config|Setting|Option|Flag|Tag|Label|Title|Description|Note|Comment|Code|Function|Class|Interface|Type|Property|Value|Object|Array|String|Number|Boolean|Null|Undefined|Unknown|Error|Warn|Info|Success|Fix|Pass|Skip|Ignore|Include|Exclude|Filter|Sort|Map|Reduce|Find|Search|Match|Index|Key|Value|Item|List|Queue|Stack|Trace|Dump|Export|Import|Save|Load|Delete|Update|Create|Read|Write|Seek|Tell|Get|Post|Put|Patch|Merge|Diff|Compare|Sync|Async|Wait|Timeout|Retry|Cancel|Close|Open|Start|Stop|Pause|Resume|Clear|Reset|Init|Run|Exec|Call|Invoke|Apply|Render|Parse|Validate|Verify|Analyze|Diagnose|Debug|Test|Mock|Stub|Proxy|Adapter|Driver|Client|Server|Database|File|Stream|Buffer|Cache|Store|Session|Token|Auth|Login|Logout|User|Admin|Role|Permission|Scope|Context|State|Data|Config|Setting|Option|Flag|Tag|Label|Title|Description|Note|Comment|Code|Function|Class|Interface|Type|Property|Value|Object|Array|String|Number|Boolean|Null|Undefined|Unknown|Error|Warn|Info|Success|Fail|Pass|Skip|Ignore|Include|Exclude|Filter|Sort|Map|Reduce|Find|Search|Match|Index|Key|Value|Item|List|Queue|Stack|Trace|Dump|Export|Import|Save|Load|Delete|Update|Create|Read|Write|Seek|Tell|Get|Post|Put|Patch|Merge|Diff|Compare|Sync|Async|Wait|Timeout|Retry|Cancel|Close|Open|Start|Stop|Pause|Resume|Clear|Reset|Init|Run|Exec|Call|Invoke|Apply|Render|Parse|Validate|Verify|Check|Test|Mock|Stub|Proxy|Adapter|Driver|Client|Server|Database|File|Stream|Buffer|Cache|Store|Session|Token|Auth|Login|Logout|User|Admin|Role|Permission|Scope|Context|State|Data|Config|Setting|Option|Flag|Tag|Label|Title|Description|Note|Comment|Code|Function|Class|Interface|Type|Property|Value|Object|Array|String|Number|Boolean|Null|Undefined|Unknown|Error|Warn|Info|Success|Fail|Pass|Skip|Ignore|Include|Exclude|Filter|Sort|Map|Add|Remove|Insert|Update|Delete|Query|Select|Choose|Toggle|Switch|Flip|Toggle|Enable|Disable|Start|Stop|Pause|Resume|Clear|Reset|Init|Run|Exec|Call|Invoke|Apply|Render|Parse|Validate|Verify|Check|Test|Mock|Stub|Proxy|Adapter|Driver|Client|Server|Database|File|Stream|Buffer|Cache|Store|Session|Token|Auth|Login|Logout|User|Admin|Role|Permission|Scope|Context|Status: undefined)\b/gi
  ]
  return entities.filter(Boolean)
}

/**
 * Validate bitstream content
 */
export function validateBitstream(content: string): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  if (content.length === 0) {
    issues.push('Bitstream content is empty')
    return { valid: false, issues }
  }

  if (content.length > 100000) {
    issues.push('Bitstream content exceeds 100KB limit')
  }

  const nullMatches = content.match(/null|undefined|void|NaN|null_pointer|undefined_variable|unknown_constant)\b/gi)
  if (nullMatches && nullMatches.length > 5) {
    issues.push(`High frequency of null/undefined references: ${nullMatches.length} occurrences`)
  }

  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * Sanitize bitstream content
 */
export function sanitizeBitstream(content: string): string {
  return content
    // Remove excessive whitespace
    .replace(/\n{3,}/g, '\n\n')
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Trim
    .trim()
}

/**
 * Generate anomaly report text
 */
export function generateAuditReportText(anomalies: Anomaly[], model: string, bufferSize: number): string {
  let content = `EMG SYSTEM AUDIT REPORT\nGenerated: ${new Date().toLocaleString()}\n`
  content += `Model: ${model}\n`
  content += `Anomalies Isolated: ${anomalies.length}\n`
  content += `Buffer Size: ${formatBytes(bufferSize)}\n`
  content += `------------------------------------------\n\n`

  anomalies.forEach((anomaly, index) => {
    content += `${index + 1}. [${anomaly.type}] ${anomaly.item}\n`
    content += `   Severity: ${anomaly.severity.toUpperCase()}\n`
    content += `   Reason: ${anomaly.reason}\n\n`
  })

  content += `\nEnd of Report\n`
  content += `Generated by EMG Core v9.6 Anomaly Detection System\n`

  return content
}
