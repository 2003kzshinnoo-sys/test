import React, { useState, useRef, useEffect } from 'react';
import { 
  CATEGORIES, 
  ExpenseReport, 
  ExpenseReportFormData, 
  ReportCategory 
} from '../types/report';
import { 
  validateReceiptFile, 
  MAX_FILE_SIZE, 
  fileToDataUrl 
} from '../lib/storage';
import { 
  X, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  FileIcon, 
  Trash2,
  Camera,
  Loader2
} from 'lucide-react';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: ExpenseReportFormData) => Promise<void>;
  editReport?: ExpenseReport | null;
}

export const ReportFormModal: React.FC<ReportFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editReport
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ReportCategory>('消耗品費');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form when modal opens or editReport changes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setUploadProgress(0);
      if (editReport) {
        setTitle(editReport.title);
        setDate(editReport.date);
        setAmount(editReport.amount.toString());
        setCategory(editReport.category as ReportCategory);
        setMerchant(editReport.merchant);
        setDescription(editReport.description);
        setSelectedFile(null);
        setPreviewUrl(editReport.fileUrl);
        setIsPdf(
          editReport.fileType === 'application/pdf' || 
          editReport.fileName.toLowerCase().endsWith('.pdf')
        );
      } else {
        // Defaults for new report
        setTitle('');
        setDate(new Date().toISOString().split('T')[0]);
        setAmount('');
        setCategory('交通費');
        setMerchant('');
        setDescription('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsPdf(false);
      }
    }
  }, [isOpen, editReport]);

  if (!isOpen) return null;

  const handleFileSelection = async (file: File) => {
    setErrorMsg(null);
    const validation = validateReceiptFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || '無効なファイルです');
      return;
    }

    setSelectedFile(file);
    const pdfCheck = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setIsPdf(pdfCheck);

    if (pdfCheck) {
      setPreviewUrl(null);
    } else {
      try {
        const dataUrl = await fileToDataUrl(file);
        setPreviewUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate preview:', err);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const addAmountPreset = (increment: number) => {
    const current = Number(amount) || 0;
    setAmount((current + increment).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Form item validations
    if (!title.trim()) {
      setErrorMsg('タイトルを入力してください。');
      return;
    }

    if (!date) {
      setErrorMsg('日付を選択してください。');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('有効な金額（1円以上）を入力してください。');
      return;
    }

    if (!merchant.trim()) {
      setErrorMsg('支払先または店舗名を入力してください。');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('本文（経費の用途・備考）を入力してください。');
      return;
    }

    if (!selectedFile && !editReport?.fileUrl) {
      setErrorMsg('領収書またはレシートのファイル（画像/PDF）を添付してください。');
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(10);

      await onSubmit({
        title: title.trim(),
        date,
        amount: numAmount,
        category,
        merchant: merchant.trim(),
        description: description.trim(),
        file: selectedFile,
        existingFile: editReport ? {
          fileUrl: editReport.fileUrl,
          filePath: editReport.filePath,
          fileName: editReport.fileName,
          fileType: editReport.fileType,
          fileSize: editReport.fileSize,
        } : undefined,
      });

      onClose();
    } catch (err: unknown) {
      console.error('Submission failed:', err);
      const message = err instanceof Error ? err.message : '送信に失敗しました。';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-white">
              {editReport ? '経費領収書を編集' : '新規領収書・経費報告'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              必要事項を入力し、領収書（画像またはPDF）を添付してください
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-950/50 border border-rose-800/80 rounded-2xl flex items-start gap-3 text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              タイトル <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="例: 東京出張 新幹線チケット代、取引先打ち合わせ飲食費"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Date & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                利用日 <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                金額（税込 円） <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                  ¥
                </span>
                <input
                  type="number"
                  required
                  min={1}
                  max={100000000}
                  placeholder="12800"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white font-semibold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
              {/* Quick Amount presets */}
              <div className="flex items-center gap-1.5 mt-1.5">
                {[1000, 5000, 10000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => addAmountPreset(val)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    +{val.toLocaleString()}円
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category & Merchant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                カテゴリー <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                支払先 / 店舗名 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="例: JR東日本、スターバックス、アマゾン"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              本文 / 経費の用途・詳細 <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              maxLength={1000}
              placeholder="例: 新規クライアントとの要件定義打ち合わせのため利用。参加者3名。"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none leading-relaxed"
            />
            <div className="text-[10px] text-slate-500 text-right mt-0.5">
              {description.length} / 1000 文字
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                領収書ファイル（画像またはPDF） <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-emerald-400 font-medium">
                JPG, PNG, WebP, PDF（最大 5MB）
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* If file is selected or already exists */}
            {(selectedFile || previewUrl || isPdf) ? (
              <div className="relative border border-slate-700 bg-slate-800/60 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 overflow-hidden">
                  {isPdf ? (
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                      <FileIcon className="w-6 h-6" />
                    </div>
                  ) : previewUrl ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-600 shrink-0 bg-slate-900">
                      <img src={previewUrl} alt="プレビュー" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {selectedFile ? selectedFile.name : editReport?.fileName || '添付領収書'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(0)} KB • ${selectedFile.type || '添付'}`
                        : editReport ? `${Math.round(editReport.fileSize / 1024)} KB` : '添付済み'}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{selectedFile ? '新規ファイル選択中' : '現在の保存ファイル'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs text-white rounded-lg transition"
                  >
                    変更
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setIsPdf(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="ファイルを削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Drag and Drop Zone */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">
                  領収書をドラッグ＆ドロップ、またはクリックして選択
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  スマートフォンのカメラ写真やスキャンPDFをそのままアップロードできます
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ファイルを選択 (JPG / PNG / PDF • 5MB以内)</span>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress Bar if submitting */}
          {isSubmitting && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-emerald-400 font-medium">
                <span>ストレージへのアップロードとデータベース保存中...</span>
                <span>処理中</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 animate-pulse"
                  style={{ width: `${Math.max(uploadProgress, 60)}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>保存中...</span>
                </>
              ) : (
                <span>{editReport ? '変更を保存する' : '報告を送信する'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
