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

// Convert File to Base64 Data URL as resilient fallback
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload receipt image or PDF to Firebase Storage.
 * Falls back safely to high-fidelity Data URL if storage bucket is unavailable.
 */
export async function uploadReceiptFile(
  file: File,
  userId: string,
  onProgress?: (percent: number) => void
): Promise<UploadedReceiptResult> {
  const validation = validateReceiptFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const filePath = `receipts/${userId}/${timestamp}_${cleanFileName}`;

  try {
    const storageRef = ref(storage, filePath);
    onProgress?.(30);

    // Upload to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        userId,
        originalName: file.name,
      }
    });

    onProgress?.(70);
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
    console.warn(
      'Firebase Storage upload encountered an issue (CORS or bucket inactive). Using resilient inline data storage fallback:',
      storageError
    );

    // Fallback: Convert to Data URL so user can seamlessly preview and store
    onProgress?.(50);
    const dataUrl = await fileToDataUrl(file);
    onProgress?.(100);

    return {
      fileUrl: dataUrl,
      filePath: `inline/${userId}/${timestamp}_${cleanFileName}`,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };
  }
}

/**
 * Delete receipt file from Firebase Storage
 */
export async function deleteReceiptFile(filePath: string): Promise<void> {
  if (!filePath || filePath.startsWith('inline/')) {
    return;
  }

  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.warn(`Could not delete file at ${filePath} from Storage (might already be deleted):`, error);
  }
}
