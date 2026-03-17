# Schema Evolution: Encryption Key

## Model EncryptionKey
```prisma
model EncryptionKey {
  id          UUID             @id @default(cuid())
  data        Bytes            @db.Text
  publicKey   String           @db.Text
  privateKey  String           @db.Text
  algorithm   String           @default("AES-256-GCM")
  createdAt   DateTime         @default(now())
  expiresAt   DateTime?
  usage       String
  isActive    Boolean          @default(true)
}
```

## Explanation

- **id**: Replaced `String` with `UUID` for better uniqueness and identification.
- **data**: Changed `String` to `Bytes` to correctly represent binary data.
- **expires**: Removed and replaced with `expiresAt` (DateTime) to accurately store expiration dates.
- **active**: Renamed to `isActive` for clarity and consistency.
- **created**: Removed and replaced with `createdAt` (DateTime) to accurately store creation dates.
- **now()**: Updated to `now()` (without parentheses) to follow Prisma syntax.