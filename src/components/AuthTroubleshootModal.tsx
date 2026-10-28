import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  ExternalLink, 
  Copy, 
  Check, 
  Globe, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface AuthTroubleshootModalProps {
  isOpen: boolean;
  errorMessage: string | null;
  onClose: () => void;
}

export const AuthTroubleshootModal: React.FC<AuthTroubleshootModalProps> = ({
  isOpen,
  errorMessage,
  onClose,
}) => {
  const [copiedHost, setCopiedHost] = useState(false);
  const [copiedRunApp, setCopiedRunApp] = useState(false);

  if (!isOpen || !errorMessage) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'run.app';
  const isUnauthorizedDomain = errorMessage.includes('承認済みドメイン') || errorMessage.includes('unauthorized-domain');
  const isPopupBlocked = errorMessage.includes('ポップアップ') || errorMessage.includes('popup-blocked');

  const authSettingsUrl = 'https://console.firebase.google.com/u/0/project/gen-lang-client-0080148697/authentication/settings';

  const copyText = (text: string, type: 'host' | 'runApp') => {
    navigator.clipboard.writeText(text);
    if (type === 'host') {
      setCopiedHost(true);
      setTimeout(() => setCopiedHost(false), 2000);
    } else {
      setCopiedRunApp(true);
      setTimeout(() => setCopiedRunApp(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-rose-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Googleログイン エラーの解決手順</h2>
              <p className="text-xs text-rose-300">Firebaseのセキュリティ設定が必要です</p>
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
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          {/* Error Message Box */}
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/60 text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-xs">
              {errorMessage}
            </div>
          </div>

          {/* Root cause 1: Unauthorized domain */}
          {isUnauthorizedDomain && (
            <div className="space-y-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>解決方法: Firebase に現在のドメインを追加（1分で完了）</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Firebase Authentication では、不正ログイン防止のため**「承認済みドメイン」**に登録されたURLからのみGoogleログインを許可しています。現在のAI StudioのプレビューURLをFirebase Consoleに追加してください。
              </p>

              <div className="space-y-2 pt-1">
                {/* Step 1 */}
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-semibold">追加するドメイン名（おすすめ）:</span>
                    <span className="font-mono text-emerald-400 text-xs font-bold truncate block">{currentHost}</span>
                  </div>
                  <button
                    onClick={() => copyText(currentHost, 'host')}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shrink-0"
                  >
                    {copiedHost ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHost ? 'コピー済' : 'コピー'}</span>
                  </button>
                </div>

                {/* Step 2 Link */}
                <div className="pt-2">
                  <a
                    href={authSettingsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition"
                  >
                    <span>Firebase Console「承認済みドメイン」設定を開く</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    「承認済みドメイン」セクションの「ドメインを追加」をクリックして貼り付けてください。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Root cause 2: Popup blocked */}
          {isPopupBlocked && (
            <div className="space-y-2.5">
              <h3 className="font-bold text-white">ポップアップブロックの解除</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                AI Studioのプレビュー画面（iframe）内からのログイン画面表示がブラウザによって防がれた可能性があります。
              </p>
              <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pl-1">
                <li>ブラウザのアドレスバーの右側にある「ポップアップがブロックされました」アイコンをクリックして「常に許可」を選択してください。</li>
                <li>または、ブラウザの別タブでアプリを開いてログインをお試しください。</li>
              </ul>
            </div>
          )}

          <div className="flex items-center justify-end pt-2 border-t border-slate-800">
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
