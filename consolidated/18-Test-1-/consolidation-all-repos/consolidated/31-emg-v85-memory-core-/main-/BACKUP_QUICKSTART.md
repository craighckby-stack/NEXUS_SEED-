# Quick Start Guide - EMG Binary Backup System

## 5-Minute Setup

### Step 1: Verify Database
```bash
bun run db:push
```

### Step 2: Start Application
```bash
# Already running at http://localhost:3000
```

### Step 3: Enable Auto-Save
1. Click **Backups** button in the header (green button)
2. Toggle **Auto-Save** to **ON**
3. Set interval to **5 minutes**
4. Done! Your conversations are now automatically backed up

### Step 4: Create First Manual Backup
1. Click **Backups** button
2. Enter filename: `my-first-backup.bin`
3. Enter description: `Initial backup`
4. Click **Save**

### Step 5: Test Restore
1. Click the **Restore** icon (🔄) next to your backup
2. Your conversation will be restored
3. Check the chat area for confirmation message

## Essential Features

### 🔄 Auto-Save
- **Location**: Backup Manager dialog
- **Toggle**: ON/OFF button
- **Interval**: 1-60 minutes
- **Status**: Shows "Every X min" when enabled

### 💾 Manual Save
- **Filename**: Optional (auto-generated if empty)
- **Description**: Optional (for easy identification)
- **Action**: Click "Save" button

### 📥 Download Backup
- Click **Download** icon (⬇️)
- Saves as .bin file to your device
- Compatible with original EMG format

### 🗑️ Delete Backup
- Click **Delete** icon (🗑️)
- Confirm deletion in dialog
- Cannot be undone

### 📊 Backup List
- Shows all backups
- Displays: filename, message count, size, age
- Sorted by newest first
- Refresh button to update list

## File Locations

### Database
```
/home/z/my-project/db/custom.db
```

### Backup API
```
/home/z/my-project/src/app/api/backups/
├── route.ts              # CRUD operations
└── [id]/
    └── download/route.ts  # File download
```

### Utilities
```
/home/z/my-project/src/lib/backup-utils.ts
```

### Components
```
/home/z/my-project/src/components/backup-manager.tsx
```

## Common Tasks

### Export to File
1. Open Backup Manager
2. Find your backup
3. Click **Download**
4. File saved to Downloads folder

### Load from File
1. Click **LOAD BINARY HISTORY** button
2. Select your .bin file
3. Conversation loaded automatically

### Restore from Database
1. Open Backup Manager
2. Find backup in list
3. Click **Restore** (🔄 icon)
4. Done!

### Clean Up Old Backups
1. Open Backup Manager
2. Find old backups
3. Click **Delete** (🗑️ icon)
4. Confirm deletion

## Backup Format

Backups use binary encoding:
- **Format**: Base64 in database
- **Structure**: JSON with version, timestamp, messages
- **Version**: v8.5
- **Compatible**: Works with original EMG format

### File Size Example
- 10 messages: ~2 KB
- 50 messages: ~10 KB
- 100 messages: ~20 KB

## Keyboard Shortcuts

Coming soon! Planned shortcuts:
- `Ctrl/Cmd + S` - Quick save
- `Ctrl/Cmd + B` - Open backup manager
- `Ctrl/Cmd + R` - Quick restore

## Tips

### Best Performance
- Set auto-save to 5-10 minutes
- Delete old backups regularly
- Use descriptive names for important backups

### Data Safety
- Enable auto-save for important conversations
- Download critical backups as files
- Keep multiple versions of key conversations

### Storage Management
- Monitor backup count
- Review backup sizes
- Clean up unnecessary backups

## Troubleshooting

### "Failed to save backup"
1. Check database is running: `bun run db:push`
2. Check browser console for errors
3. Verify API endpoint is accessible

### "Failed to restore backup"
1. Verify backup is not corrupted
2. Check version matches (v8.5)
3. Try downloading and re-uploading

### "Auto-save not working"
1. Confirm auto-save is ON
2. Check interval is set (1-60 min)
3. Ensure you have new messages

### "Database errors"
1. Run: `bun run db:push`
2. Check database file exists: `db/custom.db`
3. Verify Prisma schema is correct

## Next Steps

1. ✅ Enable auto-save
2. ✅ Create first backup
3. ✅ Test restore functionality
4. ✅ Download backup file
5. ✅ Explore backup manager

## Support

For detailed documentation, see: `BACKUP_SYSTEM.md`

For issues, check:
- Browser console (F12)
- System logs (in application)
- Database status (Prisma)
