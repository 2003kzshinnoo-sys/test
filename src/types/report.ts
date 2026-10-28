export type ReportCategory = 
  | '交通費'
  | '飲食・接待費'
  | '消耗品費'
  | '会議費'
  | '旅費宿泊費'
  | '通信費'
  | '図書研修費'
  | 'その他';

export const CATEGORIES: ReportCategory[] = [
  '交通費',
  '飲食・接待費',
  '消耗品費',
  '会議費',
  '旅費宿泊費',
  '通信費',
  '図書研修費',
  'その他'
];

export type ReportStatus = 'pending' | 'approved' | 'rejected';

export interface ExpenseReport {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  merchant: string;
  description: string;
  status: ReportStatus;
  fileUrl: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  userId: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseReportFormData {
  title: string;
  date: string;
  amount: number;
  category: ReportCategory;
  merchant: string;
  description: string;
  file: File | null;
  existingFile?: {
    fileUrl: string;
    filePath: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  };
}

export interface ReportFilterOptions {
  searchQuery: string;
  category: string;
  month: string; // 'all' or 'YYYY-MM'
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}
