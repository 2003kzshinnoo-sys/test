# Security Specification - SmartReceipt Expense Reports

## 1. Data Invariants
1. **Ownership Isolation**: Every expense report must belong strictly to the authenticated creator (`userId == request.auth.uid`). Users can NEVER read, query, update, or delete another user's reports.
2. **Strict Schema Integrity**: Reports must contain all required fields (`title`, `date`, `amount`, `category`, `merchant`, `description`, `status`, `fileUrl`, `filePath`, `fileName`, `fileType`, `fileSize`, `userId`, `userEmail`, `createdAt`, `updatedAt`).
3. **No Shadow Fields**: `hasOnly` must strictly reject unexpected fields to avoid ghost properties or privilege escalation.
4. **Boundary Limits**: Strings must enforce size limits (e.g. title <= 100, merchant <= 100, description <= 1000). Numerical amount must be >= 0. File size must be <= 5MB (5,242,880 bytes).
5. **Path Hardening**: Document IDs must conform to alphanumeric characters, hyphens, and underscores up to 128 characters (`isValidId`).
6. **Immutable Fields**: `userId`, `userEmail`, and `createdAt` cannot be modified on updates.
7. **Storage Alignment**: Deleted reports must be triggered by the owner, matching the owner's file path (`receipts/{userId}/...`).

## 2. The Dirty Dozen Payloads (Targeting Rejection)
1. **Unauthenticated Write**: An unauthenticated request attempting to create a report -> REJECTED.
2. **Identity Spoofing**: User A creating a report with `userId: 'user_B'` -> REJECTED.
3. **Cross-User Snooping**: User B attempting `get` or `list` on User A's report -> REJECTED.
4. **Cross-User Deletion**: User B attempting `delete` on User A's report -> REJECTED.
5. **Shadow Field Injection**: Injecting `{ "isAdmin": true, "superUser": true }` into a report -> REJECTED.
6. **Path Traversal / ID Poisoning**: Accessing doc with ID `../../secrets` -> REJECTED.
7. **Negative Amount**: Sending `amount: -5000` -> REJECTED.
8. **Oversized String / Denial of Wallet**: Sending 10MB string in `description` -> REJECTED.
9. **Oversized File Size**: Declaring `fileSize: 104857600` (> 5MB) -> REJECTED.
10. **Tampering with Immutable Creator**: Updating an existing document with a changed `userId` or `createdAt` -> REJECTED.
11. **Malformed Date**: Setting `date: "not-a-date"` violating `YYYY-MM-DD` regex -> REJECTED.
12. **Blanket Query Scraping**: Attempting a query without filtering by `userId == auth.uid` -> REJECTED.
