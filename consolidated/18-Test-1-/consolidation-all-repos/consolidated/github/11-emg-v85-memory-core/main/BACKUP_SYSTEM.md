# EMG v8.5 - Binary Backup System Documentation

## Overview

The EMG v8.5 Memory Core now includes a comprehensive **Binary Backup System** for persistent memory management of conversation history. This system ensures your conversations are safely stored and can be restored at any time.

## Features

### 1. **Automatic Backups**
- Configurable auto-save intervals (1-60 minutes)
- Automatic background saving of conversation history
- No data loss even if browser crashes
- Toggle on/off from the Backup Manager

### 2. **Manual Backups**
- Create backups on demand with custom filenames
- Add descriptions for easy identification
- Store multiple versions of your conversations

### 3. **Backup Management**
- View all backup history with metadata
- See file size, message count, and timestamps
- Download backups as binary files
- Delete unwanted backups
- Restore any backup instantly

### 4. **Binary Format**
- Compact binary encoding for efficient storage
- Base64 encoded for database storage
- Version tracking (v8.5 format)
- Full conversation history preservation

## Database Schema

```prisma
model MemoryBackup {
  id            String   @id @default(cuid())
  fileName      String
  binaryData    String   // Base64 encoded binary data
  messageCount  Int
  version       String   @default("8.5")
  fileSize      Int
  description   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## API Endpoints

### GET /api/backups
List all backups
```typescript
const response = await fetch('/api/backups')
const data = await response.json()
// Returns: { success: true, backups: [...] }
```

### GET /api/backups?id={backupId}
Load specific backup
```typescript
const response = await fetch('/api/backups?id=abc123')
const data = await response.json()
// Returns: { success: true, backup: {...} }
```

### POST /api/backups
Create new backup
```typescript
const response = await fetch('/api/backups', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    binaryData: base64Data,
    fileName: 'EMG_BACKUP_1234567890.bin',
    messageCount: 50,
    version: '8.5',
    description: 'Manual backup'
  })
})
```

### DELETE /api/backups?id={backupId}
Delete backup
```typescript
const response = await fetch(`/api/backups?id=${backupId}`, {
  method: 'DELETE'
})
```

### GET /api/backups/{id}/download
Download backup as binary file
```typescript
// Opens download in new tab
window.open('/api/backups/abc123/download', '_blank')
```

## Utility Functions

### Conversation to Binary
```typescript
import { conversationToBinary } from '@/lib/backup-utils'

const binaryString = conversationToBinary(
  conversationHistory,
  version
)
```

### Binary to Conversation
```typescript
import { binaryToConversation } from '@/lib/backup-utils'

const result = binaryToConversation(uint8Array)
// Returns: { success: boolean, data?: Message[], error?: string }
```

### Format File Size
```typescript
import { formatFileSize } from '@/lib/backup-utils'

formatFileSize(1024)      // "1.0 KB"
formatFileSize(1048576)   // "1.00 MB"
```

### Format Timestamp
```typescript
import { formatTimestamp } from '@/lib/backup-utils'

formatTimestamp('2024-01-01T00:00:00.000Z')  // "1d ago"
formatTimestamp('2024-01-01T12:00:00.000Z')  // "Just now"
```

## Usage Guide

### Creating a Backup

1. Click the **Backups** button in the header
2. Enter a custom filename (optional)
3. Add a description (optional)
4. Click **Save**

### Enabling Auto-Save

1. Open the Backup Manager
2. Find the Auto-Save section
3. Toggle the ON/OFF button
4. Set the interval (1-60 minutes)
5. System will automatically save your conversations

### Restoring a Backup

1. Open the Backup Manager
2. Find the backup you want to restore
3. Click the **Restore** button (refresh icon)
4. Conversation history will be loaded

### Downloading a Backup

1. Open the Backup Manager
2. Find the backup to download
3. Click the **Download** button
4. Binary file will be saved to your device

### Deleting a Backup

1. Open the Backup Manager
2. Find the backup to delete
3. Click the **Delete** button (trash icon)
4. Confirm deletion in the dialog

## Backup File Format

Binary files contain:
- Version information (v8.5)
- Timestamp
- Conversation history (array of messages)
- Metadata (message count, generator)

Example structure:
```json
{
  "version": "8.5",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "conversationHistory": [
    {
      "role": "user",
      "text": "Hello",
      "timestamp": "2024-01-01T12:00:00.000Z"
    },
    {
      "role": "ai",
      "text": "Hi! How can I help you?",
      "timestamp": "2024-01-01T12:00:01.000Z"
    }
  ],
  "metadata": {
    "messageCount": 2,
    "generatedBy": "EMG_CORE_v8.5"
  }
}
```

## Storage Location

Backups are stored in the SQLite database at:
- File: `db/custom.db`
- Table: `MemoryBackup`
- Encoded as Base64 strings

## Performance Considerations

### Database Size
- Each backup stores conversation history as Base64
- Backup size depends on message count and content length
- Regular cleanup of old backups recommended

### Auto-Save Impact
- Minimal performance impact (background process)
- Only saves when conversation has changes
- Configurable interval to balance frequency

### Backup Limits
- No hard limit on number of backups
- Consider database size when maintaining many backups
- Delete old backups regularly to maintain performance

## Best Practices

1. **Regular Backups**: Enable auto-save for important conversations
2. **Descriptive Names**: Use meaningful descriptions for manual backups
3. **Clean Up**: Periodically delete old or unnecessary backups
4. **Export Important**: Download critical backups as files for safekeeping
5. **Version Control**: Keep multiple versions of important conversations

## Troubleshooting

### Backup Not Saving
- Check database connection
- Verify Prisma schema is up to date: `bun run db:push`
- Check browser console for errors

### Restore Failed
- Verify backup file is not corrupted
- Check that version matches (v8.5)
- Ensure binary data is valid Base64

### Auto-Save Not Working
- Confirm auto-save is enabled in Backup Manager
- Check interval is set (1-60 minutes)
- Ensure conversation has new messages

## Migration from v8.4 or Earlier

Old binary files are compatible with v8.5:
- Load old .bin files normally
- System will parse and convert
- No data loss during migration

## Future Enhancements

- [ ] Backup compression for reduced storage
- [ ] Differential backups (store only changes)
- [ ] Cloud backup integration
- [ ] Backup sharing between users
- [ ] Automatic cleanup of old backups
- [ ] Backup scheduling (specific times)
- [ ] Backup encryption
- [ ] Multi-device sync

## Support

For issues or questions about the backup system:
1. Check this documentation
2. Review system logs in the application
3. Check browser console for errors
4. Verify database schema is current
