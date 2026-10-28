import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf'
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateReceiptFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: '領収書ファイルが選択されていません。' };
  }

  // Check file type
  const isAllowedType = ALLOWED_MIME_TYPES.includes(file.type) || 
    (file.type.startsWith('image/') && !file.type.includes('svg'));
    
  if (!isAllowedType) {
    return {
      valid: false,
      error: `対応していないファイル形式です（${file.type || file.name.split('.').pop()}）。画像（JPG, PNG, WebP）またはPDF形式を選択してください。`
    };
  }

  // Check file size (5MB)
  if (file.size > MAX_FILE_SIZE) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `ファイルサイズ（${sizeInMb}MB）が上限（5MB）を超えています。5MB以内のファイルを選択してください。`
    };
  }

  return { valid: true };
}

export interface UploadedReceiptResult {
  fileUrl: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface StorageStatus {
  hasHStorageKey: boolean;
  connectionStatus?: 'connected' | 'auth_error' | 'unconfigured';
  endpoint?: string;
  bucket?: string;
  folderId?: string;
  activeEngine: 'hstorage' | 'firebase';
  message: string;
}

/**
 * Check H-Storage Secrets status from the server
 */
export async function checkStorageStatus(): Promise<StorageStatus> {
  try {
    const res = await fetch('/api/storage/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not query storage status from server:', err);
  }
  return {
    hasHStorageKey: false,
    connectionStatus: 'unconfigured',
    activeEngine: 'firebase',
    message: 'Firebase Storage が標準ストレージとして有効です',
  };
}

// Convert File to Base64 Data URL
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload receipt image or PDF:
 * 1. Tries server-side H-Storage API proxy (/api/storage/upload) with Secrets
 * 2. Falls back smoothly to Firebase Storage or resilient data URL
 */
export async function uploadReceiptFile(
  file: File,
  userId: string,
  onProgress?: (percent: number) => void,
  userEmail?: string
): Promise<UploadedReceiptResult> {
  const validation = validateReceiptFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  onProgress?.(20);
  const base64Data = await fileToDataUrl(file);
  onProgress?.(40);

  // Try server proxy first (integrates H-Storage API key from Secrets)
  try {
    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        base64Data,
        userId,
        userEmail,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.fileUrl && data.filePath) {
        onProgress?.(100);
        return {
          fileUrl: data.fileUrl,
          filePath: data.filePath,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        };
      }
    }
  } catch (proxyError) {
    console.warn('Server storage proxy not reachable, attempting client Firebase Storage:', proxyError);
  }

  // Fallback to Firebase Storage
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const filePath = `receipts/${userId}/${timestamp}_${cleanFileName}`;

  try {
    const storageRef = ref(storage, filePath);
    onProgress?.(60);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        userId,
        originalName: file.name,
      }
    });

    onProgress?.(85);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    onProgress?.(100);

    return {
      fileUrl: downloadUrl,
      filePath,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };
  } catch (storageError) {
    console.warn('Firebase Storage direct upload error; using resilient fallback:', storageError);
    onProgress?.(100);
    return {
      fileUrl: base64Data,
      filePath: `inline/${userId}/${timestamp}_${cleanFileName}`,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };
  }
}

/**
 * Delete receipt file from H-Storage and Firebase Storage
 */
export async function deleteReceiptFile(filePath: string): Promise<void> {
  if (!filePath || filePath.startsWith('inline/')) {
    return;
  }

  // Call server proxy delete (for H-Storage)
  fetch('/api/storage/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath }),
  }).catch(() => {});

  // Call Firebase Storage delete
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.warn(`Could not delete file at ${filePath} from Storage:`, error);
  }
}
