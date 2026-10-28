import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Database, 
  Cloud, 
  Key, 
  CheckCircle,
  FileCode,
  ExternalLink
} from 'lucide-react';

interface SecurityInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityInfoModal: React.FC<SecurityInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">セキュリティルール & RLS 保護設定</h2>
              <p className="text-xs text-slate-400">要件に基づいた安全なアクセス制御の仕組み</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs sm:text-sm">
          {/* Firestore Security Rules Section */}
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>1. Firestore データベース保護（RLSと同等）</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                デプロイ済
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              全件一括の閲覧・改ざん・削除を防止するため、Firestore セキュリティルールにより、各ユーザー（<code>request.auth.uid</code>）が作成した本人の経費データのみに読み取り・変更・削除が厳格に制限されています。
            </p>
            <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-emerald-400/90 overflow-x-auto border border-slate-800">
              <code>{`allow read, write: if isSignedIn() && resource.data.userId == request.auth.uid;`}</code>
            </div>
          </div>

          {/* Storage Security Rules Section */}
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white">
                <Cloud className="w-4 h-4 text-teal-400" />
                <span>2. ストレージ保護（ファイル種類・サイズ制限）</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold">
                5MB・画像/PDF限定
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              領収書ファイルは <code>receipts/{`{userId}`}/*</code> 配下に格納され、他人がアクセスできないよう所有者UIDと一致する場合のみアクセスを許可。さらに5MB上限および画像（JPG, PNG, WebP）とPDFのみをサーバーとクライアントの両側で検証しています。
            </p>
          </div>

          {/* Vercel Environment Variables Section */}
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <Key className="w-4 h-4 text-amber-400" />
              <span>3. Vercel 環境変数対応（ソースコードへの直書き防止）</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              FirebaseのAPIキーやプロジェクト設定情報は、<code>.env.example</code> に定義された <code>VITE_FIREBASE_*</code> 環境変数から動的に読み込まれます。Vercelなどのホスティング先ではプロジェクト設定の「Environment Variables」に登録して安全に運用できます。
            </p>
            <div className="bg-slate-950 p-2.5 rounded-xl font-mono text-[10px] text-slate-300 border border-slate-800">
              VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET...
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
            >
              理解しました
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
