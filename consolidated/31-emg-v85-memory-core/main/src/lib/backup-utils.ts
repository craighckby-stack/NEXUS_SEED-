export interface BackupMetadata {
  id: string
  fileName: string
  messageCount: number
  version: string
  fileSize: number
  description?: string
  createdAt: string
  updatedAt: string
}

export interface BackupData extends BackupMetadata {
  binaryData: string
}

export interface ConversationMessage {
  role: 'user' | 'ai' | 'system'
  text: string
  isReflective?: boolean
  timestamp?: string
}

export interface BinaryExportData {
  version: string
  timestamp: string
  conversationHistory: ConversationMessage[]
  metadata: {
    messageCount: number
    generatedBy: string
  }
}

/**
 * Convert conversation history to binary format
 */
export function conversationToBinary(
  conversationHistory: ConversationMessage[],
  version = '8.5'
): string {
  const data: BinaryExportData = {
    version,
    timestamp: new Date().toISOString(),
    conversationHistory,
    metadata: {
      messageCount: conversationHistory.length,
      generatedBy: 'EMG_CORE_v8.5'
    }
  }

  const json = JSON.stringify(data)
  let binary = ''
  for (let i = 0; i < json.length; i++) {
    binary += json.charCodeAt(i).toString(2).padStart(8, '0')
  }
  return binary
}

/**
 * Convert binary string to Uint8Array
 */
export function binaryToUint8Array(binaryString: string): Uint8Array {
  const bytes = new Uint8Array(binaryString.length / 8)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(binaryString.substring(i * 8, i * 8 + 8), 2)
  }
  return bytes
}

/**
 * Convert Uint8Array to binary string
 */
export function uint8ArrayToBinary(bytes: Uint8Array): string {
  return Array.from(bytes)
    .reduce((str, byte) => str + byte.toString(2).padStart(8, '0'), '')
}

/**
 * Convert Uint8Array to conversation data
 */
export function binaryToConversation(
  bytes: Uint8Array
): { success: boolean; data?: ConversationMessage[]; error?: string } {
  try {
    const binaryString = uint8ArrayToBinary(bytes)
    let text = ''
    for (let i = 0; i < binaryString.length; i += 8) {
      const byte = binaryString.substring(i, i + 8)
      text += String.fromCharCode(parseInt(byte, 2))
    }

    const data = JSON.parse(text)
    const history = Array.isArray(data) ? data :
      data.messages || data.conversationHistory ||
      []

    return {
      success: true,
      data: history as ConversationMessage[]
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Convert binary string to base64
 */
export function binaryToBase64(binaryString: string): string {
  const bytes = binaryToUint8Array(binaryString)
  return Buffer.from(bytes).toString('base64')
}

/**
 * Convert base64 to binary string
 */
export function base64ToBinary(base64: string): string {
  const bytes = Buffer.from(base64, 'base64')
  return uint8ArrayToBinary(bytes)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString()
}
