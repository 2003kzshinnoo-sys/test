import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Check, 
  Copy, 
  ExternalLink, 
  Server, 
  AlertCircle,
  FolderOpen,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { checkStorageStatus, StorageStatus } from '../lib/storage';

interface StorageSecretsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageSecretsModal: React.FC<StorageSecretsModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const targetFolderId = '9oCCR8hpSRvzWgSIhpLwCUejFFCkGhwV';
  const targetFolderUrl = `https://hstorage.jp/ja/dashboard?folder=${targetFolderId}`;

  const fetchStatus = async () => {
    setIsRefreshing(true);
    const result = await checkStorageStatus();
    setStatus(result);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">エイチストレージ (HStorage) API & Secrets 連携</h2>
              <p className="text-xs text-slate-400">hstorage.jp S3互換APIの安全な登録手順</p>
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
          {/* Target Folder Link Card */}
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">保存先HStorageフォルダー</div>
                <div className="text-slate-400 font-mono text-[11px] truncate max-w-[260px] sm:max-w-xs">
                  ID: {targetFolderId}
                </div>
              </div>
            </div>

            <a
              href={targetFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white border border-slate-700 transition"
            >
              <span>HStorageを開く</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            </a>
          </div>

          {/* Current Server Detection Status */}
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                status?.connectionStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : status?.connectionStatus === 'auth_error'
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {status?.connectionStatus === 'connected' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : status?.connectionStatus === 'auth_error' ? (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                ) : (
                  <Server className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">接続ステータス</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    status?.connectionStatus === 'connected'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : status?.connectionStatus === 'auth_error'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {status?.connectionStatus === 'connected'
                      ? 'HStorage S3 接続成功'
                      : status?.connectionStatus === 'auth_error'
                      ? 'キー認証エラー（要確認）'
                      : 'Secrets 未登録 (待機中)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {status?.message}
                </p>
              </div>
            </div>

            <button
              onClick={fetchStatus}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="状態を再チェック"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Important Security Notice: Secrets vs in-page form */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-1">
                  APIキーの安全な登録について
                </p>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Webブラウザの入力フォームに直接APIキーを入力すると、第三者やブラウザのソースコードから漏洩する危険があります。
                  安全な本番運用基準に基づき、キーは<strong>Google AI Studioの「Secrets」機能（鍵アイコン 🔑）</strong>に登録してください。サーバー（<code>server.ts</code>）が安全にキーを受け取ってHStorageと通信します。
                </p>
              </div>
            </div>
          </div>

          {/* Step by Step Guide */}
          <div className="space-y-3">
            <h3 className="font-bold text-white">Google AI Studio の Secrets に登録する3ステップ</h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1.5">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 inline-flex items-center justify-center text-[11px] font-bold">1</span>
                  <span>HStorage（hstorage.jp）でS3互換キーを発行</span>
                </div>
                <p className="text-slate-400 leading-relaxed pl-6.5">
                  <a href="https://hstorage.jp/ja/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">
                    HStorageの管理画面
                  </a>
                  を開き、<strong>「設定」→「S3 互換 API」</strong>（またはAPIキー設定）からアクセスキーとシークレットキーを発行します。
                </p>
              </div>

              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2.5">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 inline-flex items-center justify-center text-[11px] font-bold">2</span>
                  <span>Google AI Studio の Secrets（鍵アイコン 🔑）に追加</span>
                </div>
                <p className="text-slate-400 pl-6.5">
                  AI Studio画面の左メニューにある <strong>「Secrets」</strong> を開き、以下の変数名を追加して発行したキー値を貼り付けます：
                </p>

                <div className="pl-6.5 space-y-2">
                  {/* Access Key ID */}
                  <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-500">APIキー / アクセスキーID（変数名）</div>
                      <div className="font-mono text-emerald-300 font-bold">HSTORAGE_ACCESS_KEY_ID</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard('HSTORAGE_ACCESS_KEY_ID', 'key1')}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-850 hover:bg-slate-800 transition"
                    >
                      {copiedKey === 'key1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'key1' ? 'コピー済' : 'コピー'}</span>
                    </button>
                  </div>

                  {/* Secret Access Key */}
                  <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-500">暗号鍵 / シークレットキー（変数名）</div>
                      <div className="font-mono text-emerald-300 font-bold">HSTORAGE_SECRET_ACCESS_KEY</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard('HSTORAGE_SECRET_ACCESS_KEY', 'key2')}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-850 hover:bg-slate-800 transition"
                    >
                      {copiedKey === 'key2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'key2' ? 'コピー済' : 'コピー'}</span>
                    </button>
                  </div>

                  {/* Folder ID */}
                  <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-500">フォルダーID（設定済み既定値: 9oCCR8hpSRvzWgSIhpLwCUejFFCkGhwV）</div>
                      <div className="font-mono text-slate-300 font-bold">HSTORAGE_FOLDER_ID</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard('9oCCR8hpSRvzWgSIhpLwCUejFFCkGhwV', 'folder')}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-850 hover:bg-slate-800 transition"
                    >
                      {copiedKey === 'folder' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'folder' ? 'コピー済' : 'フォルダーIDをコピー'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 inline-flex items-center justify-center text-[11px] font-bold">3</span>
                  <span>自動的にHStorageへアップロード開始</span>
                </div>
                <p className="text-slate-400 leading-relaxed pl-6.5">
                  Secretsに登録すると、領収書アップロード時に自動で <code>s3.hstorage.jp</code> の指定フォルダーへファイルが転送され、FirestoreデータベースにはそのファイルURLとパスが記録されます。
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
