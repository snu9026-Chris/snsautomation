'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { X, Loader2 } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');
    const err = await login(username, password);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 */}
      <div className="relative w-[420px] rounded-2xl overflow-hidden shadow-2xl">
        {/* 상단 그라데이션 헤더 */}
        <div className="relative bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 px-8 pt-8 pb-12 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <img
            src="/loopdrop-icon.png"
            alt="LoopDrop"
            className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg"
          />
          <h2 className="text-2xl font-bold text-white tracking-tight">LoopDrop</h2>
          <p className="text-white/70 text-sm mt-1">멀티플랫폼 콘텐츠 발행 커맨드 센터</p>
        </div>

        {/* 폼 영역 */}
        <div className="bg-white px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디를 입력하세요"
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-2.5 rounded-xl hover:from-indigo-600 hover:to-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 로그인 중...</>
              ) : (
                '로그인'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
