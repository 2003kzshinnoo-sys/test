import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { ExpenseReport, ExpenseReportFormData } from '../types/report';
import { uploadReceiptFile, deleteReceiptFile } from './storage';

const REPORTS_COLLECTION = 'reports';

// Generate a random valid ID matching ^[a-zA-Z0-9_\-]+$
function generateReportId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `rep_${timestamp}_${randomStr}`;
}

/**
 * Subscribe to the current user's reports in real-time
 */
export function subscribeUserReports(
  userId: string,
  onUpdate: (reports: ExpenseReport[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const q = query(
    collection(db, REPORTS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const reports: ExpenseReport[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        reports.push({
          id: docSnap.id,
          title: data.title,
          date: data.date,
          amount: Number(data.amount) || 0,
          category: data.category || 'その他',
          merchant: data.merchant || '',
          description: data.description || '',
          status: data.status || 'pending',
          fileUrl: data.fileUrl || '',
          filePath: data.filePath || '',
          fileName: data.fileName || '',
          fileType: data.fileType || '',
          fileSize: Number(data.fileSize) || 0,
          userId: data.userId,
          userEmail: data.userEmail || '',
          createdAt: data.createdAt || '',
          updatedAt: data.updatedAt || '',
        });
      });

      // Sort client-side by date descending
      reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(reports);
    },
    (error) => {
      console.error('Snapshot error for reports:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, REPORTS_COLLECTION);
    }
  );
}

/**
 * Create a new expense report with file upload
 */
export async function createReport(
  formData: ExpenseReportFormData,
  userId: string,
  userEmail: string,
  onUploadProgress?: (percent: number) => void
): Promise<ExpenseReport> {
  if (!formData.file && !formData.existingFile) {
    throw new Error('領収書ファイルの添付は必須です。');
  }

  // Upload receipt file
  let fileData = formData.existingFile;
  if (formData.file) {
    fileData = await uploadReceiptFile(formData.file, userId, onUploadProgress, userEmail);
  }

  if (!fileData) {
    throw new Error('ファイルのアップロードに失敗しました。');
  }

  const reportId = generateReportId();
  const now = new Date().toISOString();

  const reportData = {
    title: formData.title.trim(),
    date: formData.date,
    amount: Number(formData.amount),
    category: formData.category,
    merchant: formData.merchant.trim(),
    description: (formData.description || '').trim(),
    status: 'pending' as const,
    fileUrl: fileData.fileUrl,
    filePath: fileData.filePath,
    fileName: fileData.fileName,
    fileType: fileData.fileType,
    fileSize: fileData.fileSize,
    userId,
    userEmail: userEmail || 'user@example.com',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const reportRef = doc(db, REPORTS_COLLECTION, reportId);
    await setDoc(reportRef, reportData);

    return {
      id: reportId,
      ...reportData,
    };
  } catch (error) {
    // If saving document failed and we uploaded a new file, clean up storage
    if (formData.file && fileData.filePath) {
      deleteReceiptFile(fileData.filePath).catch(() => {});
    }
    handleFirestoreError(error, OperationType.CREATE, `${REPORTS_COLLECTION}/${reportId}`);
  }
}

/**
 * Update an existing report
 */
export async function updateReport(
  reportId: string,
  formData: ExpenseReportFormData,
  currentReport: ExpenseReport,
  userId: string,
  onUploadProgress?: (percent: number) => void
): Promise<void> {
  let fileData = {
    fileUrl: currentReport.fileUrl,
    filePath: currentReport.filePath,
    fileName: currentReport.fileName,
    fileType: currentReport.fileType,
    fileSize: currentReport.fileSize,
  };

  // If a new file is uploaded, upload it and remove the old one
  if (formData.file) {
    const newFile = await uploadReceiptFile(formData.file, userId, onUploadProgress, currentReport.userEmail);
    if (currentReport.filePath && currentReport.filePath !== newFile.filePath) {
      deleteReceiptFile(currentReport.filePath).catch(() => {});
    }
    fileData = newFile;
  }

  const now = new Date().toISOString();
  const updatePayload = {
    title: formData.title.trim(),
    date: formData.date,
    amount: Number(formData.amount),
    category: formData.category,
    merchant: formData.merchant.trim(),
    description: (formData.description || '').trim(),
    status: currentReport.status,
    fileUrl: fileData.fileUrl,
    filePath: fileData.filePath,
    fileName: fileData.fileName,
    fileType: fileData.fileType,
    fileSize: fileData.fileSize,
    updatedAt: now,
  };

  try {
    const reportRef = doc(db, REPORTS_COLLECTION, reportId);
    await updateDoc(reportRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REPORTS_COLLECTION}/${reportId}`);
  }
}

/**
 * Delete a report along with its attached file in Storage
 */
export async function deleteReport(report: ExpenseReport): Promise<void> {
  const path = `${REPORTS_COLLECTION}/${report.id}`;
  
  // 1. Delete associated file from Firebase Storage
  if (report.filePath) {
    try {
      await deleteReceiptFile(report.filePath);
    } catch (err) {
      console.warn('File deletion warning:', err);
    }
  }

  // 2. Delete document from Firestore
  try {
    const reportRef = doc(db, REPORTS_COLLECTION, report.id);
    await deleteDoc(reportRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
