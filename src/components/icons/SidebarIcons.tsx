// 사이드바 전용 귀여운 컬러 아이콘 — 둥글둥글 통통 스타일

export function IconDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      {/* 4개 둥근 블록 */}
      <rect x="3" y="3" width="7.5" height="7.5" rx="2.5" fill="url(#dashA)" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2.5" fill="url(#dashB)" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2.5" fill="url(#dashC)" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.5" fill="url(#dashD)" />
      {/* 반사광 */}
      <rect x="4.5" y="4.5" width="3" height="1.5" rx="0.75" fill="white" opacity="0.4" />
      <rect x="15" y="4.5" width="3" height="1.5" rx="0.75" fill="white" opacity="0.4" />
      <defs>
        <linearGradient id="dashA" x1="3" y1="3" x2="10.5" y2="10.5"><stop stopColor="#818CF8"/><stop offset="1" stopColor="#6366F1"/></linearGradient>
        <linearGradient id="dashB" x1="13.5" y1="3" x2="21" y2="10.5"><stop stopColor="#A78BFA"/><stop offset="1" stopColor="#8B5CF6"/></linearGradient>
        <linearGradient id="dashC" x1="3" y1="13.5" x2="10.5" y2="21"><stop stopColor="#C4B5FD"/><stop offset="1" stopColor="#A78BFA"/></linearGradient>
        <linearGradient id="dashD" x1="13.5" y1="13.5" x2="21" y2="21"><stop stopColor="#818CF8"/><stop offset="1" stopColor="#6366F1"/></linearGradient>
      </defs>
    </svg>
  );
}

export function IconTrend({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#trendBg)" />
      {/* 차트 막대 */}
      <rect x="5.5" y="13" width="3" height="6" rx="1.5" fill="white" opacity="0.5" />
      <rect x="10.5" y="9" width="3" height="10" rx="1.5" fill="white" opacity="0.7" />
      <rect x="15.5" y="6" width="3" height="13" rx="1.5" fill="white" opacity="0.9" />
      {/* 별 */}
      <circle cx="17" cy="5" r="1.5" fill="#FDE68A" />
      <defs>
        <linearGradient id="trendBg" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#34D399"/><stop offset="1" stopColor="#059669"/></linearGradient>
      </defs>
    </svg>
  );
}

export function IconPublish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#pubBg)" />
      {/* 로켓 */}
      <path d="M12 6 L15 12 L12 11 L9 12Z" fill="white" opacity="0.9" />
      <path d="M12 11 L12 17" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      {/* 불꽃 */}
      <circle cx="12" cy="18" r="1.5" fill="#FDE68A" />
      <circle cx="10.5" cy="17.5" r="1" fill="#FDBA74" opacity="0.7" />
      <circle cx="13.5" cy="17.5" r="1" fill="#FDBA74" opacity="0.7" />
      {/* 반사 */}
      <rect x="5" y="4" width="4" height="1.5" rx="0.75" fill="white" opacity="0.3" />
      <defs>
        <linearGradient id="pubBg" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#A78BFA"/><stop offset="1" stopColor="#7C3AED"/></linearGradient>
      </defs>
    </svg>
  );
}

export function IconCalendar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="2" y="4" width="20" height="18" rx="5" fill="url(#calBg)" />
      {/* 상단 바 */}
      <rect x="2" y="4" width="20" height="6" rx="5" fill="#F59E0B" />
      {/* 고리 */}
      <rect x="7" y="2" width="2.5" height="5" rx="1.25" fill="#D97706" />
      <rect x="14.5" y="2" width="2.5" height="5" rx="1.25" fill="#D97706" />
      {/* 날짜 점 */}
      <circle cx="7.5" cy="14" r="1.5" fill="#F59E0B" />
      <circle cx="12" cy="14" r="1.5" fill="#FBBF24" />
      <circle cx="16.5" cy="14" r="1.5" fill="#F59E0B" />
      <circle cx="7.5" cy="18.5" r="1.5" fill="#FBBF24" />
      <circle cx="12" cy="18.5" r="1.5" fill="#F59E0B" />
      <circle cx="16.5" cy="18.5" r="1.5" fill="#FBBF24" />
      {/* 반사 */}
      <rect x="5" y="5.5" width="4" height="1.5" rx="0.75" fill="white" opacity="0.4" />
      <defs>
        <linearGradient id="calBg" x1="2" y1="4" x2="22" y2="22"><stop stopColor="#FEF3C7"/><stop offset="1" stopColor="#FDE68A"/></linearGradient>
      </defs>
    </svg>
  );
}

export function IconFilm({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#filmBg)" />
      {/* 필름 구멍 */}
      <circle cx="5.5" cy="6" r="1.2" fill="white" opacity="0.5" />
      <circle cx="5.5" cy="10" r="1.2" fill="white" opacity="0.5" />
      <circle cx="5.5" cy="14" r="1.2" fill="white" opacity="0.5" />
      <circle cx="5.5" cy="18" r="1.2" fill="white" opacity="0.5" />
      <circle cx="18.5" cy="6" r="1.2" fill="white" opacity="0.5" />
      <circle cx="18.5" cy="10" r="1.2" fill="white" opacity="0.5" />
      <circle cx="18.5" cy="14" r="1.2" fill="white" opacity="0.5" />
      <circle cx="18.5" cy="18" r="1.2" fill="white" opacity="0.5" />
      {/* 재생 버튼 */}
      <circle cx="12" cy="12" r="4.5" fill="white" opacity="0.3" />
      <path d="M10.5 9 L15.5 12 L10.5 15Z" fill="white" opacity="0.9" />
      <defs>
        <linearGradient id="filmBg" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#F472B6"/><stop offset="1" stopColor="#DB2777"/></linearGradient>
      </defs>
    </svg>
  );
}

export function IconHistory({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="10" fill="url(#histBg)" />
      {/* 시계 바늘 */}
      <path d="M12 7 L12 12 L16 14.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* 눈금 */}
      <circle cx="12" cy="4.5" r="1" fill="white" opacity="0.5" />
      <circle cx="19.5" cy="12" r="1" fill="white" opacity="0.5" />
      <circle cx="12" cy="19.5" r="1" fill="white" opacity="0.5" />
      <circle cx="4.5" cy="12" r="1" fill="white" opacity="0.5" />
      {/* 반사 */}
      <ellipse cx="9" cy="7" rx="3" ry="1.5" fill="white" opacity="0.2" />
      <defs>
        <linearGradient id="histBg" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#7DD3FC"/><stop offset="1" stopColor="#0EA5E9"/></linearGradient>
      </defs>
    </svg>
  );
}

export function IconAccounts({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#accBg)" />
      {/* 사람 */}
      <circle cx="12" cy="9" r="3.5" fill="white" opacity="0.9" />
      <path d="M6 19 Q6 14 12 14 Q18 14 18 19" fill="white" opacity="0.7" />
      {/* 연결 아이콘 */}
      <circle cx="18" cy="7" r="2.5" fill="#FDE68A" stroke="white" strokeWidth="1" />
      <path d="M17 7 L19 7 M18 6 L18 8" stroke="white" strokeWidth="1" strokeLinecap="round" />
      <defs>
        <linearGradient id="accBg" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#5EEAD4"/><stop offset="1" stopColor="#14B8A6"/></linearGradient>
      </defs>
    </svg>
  );
}
