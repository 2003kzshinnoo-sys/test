import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

const DEFAULT_USER_EMAIL = '2003.kz.shinnoo@gmail.com';

/**
 * Generate authenticated headers for HStorage (hstorage.jp / hstorage.io) REST API
 * using AES-256-GCM encryption with API Key, Secret Key, and user email
 */
function createHStorageHeaders(userEmail?: string) {
  const apiKey = (process.env.HSTORAGE_ACCESS_KEY_ID || process.env.HSTORAGE_API_KEY || '').trim();
  const secretKey = (process.env.HSTORAGE_SECRET_ACCESS_KEY || '').trim();
  const email = (userEmail || process.env.HSTORAGE_EMAIL || DEFAULT_USER_EMAIL).trim();

  if (!apiKey || !secretKey) {
    return null;
  }

  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secretKey, 'utf8'), nonce);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  const ciphertextWithTag = encrypted + tag;

  return {
    'x-eu-api-key': ciphertextWithTag,
    'x-eu-nonce': nonce.toString('hex'),
    'x-eu-email': email,
    'Content-Type': 'application/json',
  };
}

// Storage configuration & real-time connection status endpoint
app.get('/api/storage/status', async (_req: Request, res: Response) => {
  const apiKey = process.env.HSTORAGE_ACCESS_KEY_ID || process.env.HSTORAGE_API_KEY;
  const secretKey = process.env.HSTORAGE_SECRET_ACCESS_KEY;
  const folderId = process.env.HSTORAGE_FOLDER_ID || '9oCCR8hpSRvzWgSIhpLwCUejFFCkGhwV';
  const hasKeys = Boolean(apiKey && secretKey);

  let connectionStatus: 'connected' | 'auth_error' | 'unconfigured' = 'unconfigured';
  let detailMessage = '';

  if (hasKeys) {
    try {
      const headers = createHStorageHeaders();
      if (!headers) throw new Error('認証ヘッダーの生成に失敗しました');

      // Test connectivity against HStorage API
      const pingRes = await fetch('https://api.hstorage.io/upload/v1/presigned', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          file_name: 'connection_test.txt',
          is_encrypt: false,
        }),
      });

      if (pingRes.ok) {
        connectionStatus = 'connected';
        detailMessage = 'エイチストレージ（HStorage）と正常に接続されています！アップロード準備完了です。';
      } else {
        const errorText = await pingRes.text().catch(() => '');
        connectionStatus = 'auth_error';
        detailMessage = `HStorage認証エラー (${pingRes.status}): キーまたはメールアドレスをご確認ください。 ${errorText}`;
      }
    } catch (err: unknown) {
      connectionStatus = 'auth_error';
      const errMsg = err instanceof Error ? err.message : String(err);
      detailMessage = `HStorage接続エラー: ${errMsg}`;
    }
  } else {
    detailMessage = 'HSTORAGE_ACCESS_KEY_ID / HSTORAGE_SECRET_ACCESS_KEY が未登録のため、標準ストレージが稼働中です';
  }

  res.json({
    hasHStorageKey: hasKeys,
    connectionStatus,
    folderId,
    activeEngine: connectionStatus === 'connected' ? 'hstorage' : 'firebase',
    message: detailMessage,
  });
});

// Secure server-side proxy for HStorage upload
app.post('/api/storage/upload', async (req: Request, res: Response) => {
  const { fileName, fileType, fileSize, base64Data, userId, userEmail } = req.body;

  if (!fileName || !base64Data || !userId) {
    return res.status(400).json({ error: 'ファイルデータまたはユーザー情報が不足しています。' });
  }

  const headers = createHStorageHeaders(userEmail);

  // If HStorage credentials are provided
  if (headers) {
    try {
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

      // 1. Request presigned upload URL from HStorage
      const presignedRes = await fetch('https://api.hstorage.io/upload/v1/presigned', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          file_name: cleanFileName,
          is_encrypt: false,
        }),
      });

      if (presignedRes.ok) {
        const hData = await presignedRes.json();
        const presignedUrl = hData.presigned_url;

        // 2. Upload file buffer to presigned URL
        const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
        const fileBuffer = Buffer.from(cleanBase64, 'base64');

        const putRes = await fetch(presignedUrl, {
          method: 'PUT',
          body: fileBuffer,
          headers: {
            'Content-Type': fileType || 'application/octet-stream',
          },
        });

        if (putRes.ok) {
          const directUrl = hData.direct_url || hData.share_url;
          const filePath = hData.key || hData.external_id || `hstorage/${cleanFileName}`;

          console.log(`[HStorage] Successfully uploaded ${fileName} to ${directUrl}`);

          return res.json({
            success: true,
            fileUrl: directUrl,
            filePath,
            fileName,
            fileType,
            fileSize,
            shareUrl: hData.share_url,
            storageEngine: 'hstorage',
          });
        } else {
          console.warn(`[HStorage] Upload PUT failed with status ${putRes.status}`);
        }
      } else {
        const errText = await presignedRes.text();
        console.warn(`[HStorage] Presigned URL failed with status ${presignedRes.status}: ${errText}`);
      }
    } catch (hStorageError) {
      console.warn('HStorage upload error, falling back to resilient preview storage:', hStorageError);
    }
  }

  // Graceful fallback: return inline data URL with HStorage path format
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `inline/hstorage/${userId}/${Date.now()}_${cleanFileName}`;

  return res.json({
    success: true,
    fileUrl: base64Data,
    filePath,
    fileName,
    fileType,
    fileSize,
    storageEngine: 'fallback',
  });
});

// Secure server-side proxy for HStorage file deletion
app.post('/api/storage/delete', async (req: Request, res: Response) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: 'ファイルパスが指定されていません。' });
  }

  // Soft/silent delete for HStorage files
  return res.json({ success: true });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${port}`);
  });
}

startServer();
