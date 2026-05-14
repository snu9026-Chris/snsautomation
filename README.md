# LoopDrop

5개 SNS 플랫폼(YouTube · Instagram · Threads · TikTok · X) 동시 발행을 자동화하는 멀티플랫폼 콘텐츠 발행 대시보드.

---

## 셋업 — Clone 후 0에서 동작까지

> 가급적 Claude Code에게 이 README를 읽혀서 단계별로 따라가게 하세요.
> 막힐 때는 [`oauth-guide.md`](./oauth-guide.md)와 [`docs/oauth-document.md`](./docs/oauth-document.md)를 참고.

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 등록 (16개)

`.env.example`을 복사해서 `.env.local`로 만들고 값을 채우세요.

```bash
cp .env.example .env.local
```

각 키의 발급 위치는 [`oauth-guide.md`](./oauth-guide.md)의 "플랫폼별 가이드" 참고.

**⚠️ 모든 값은 끝에 개행/공백 없이** — [`oauth-guide.md` #1](./oauth-guide.md#1-vercel-환경변수-개행0a-주의)의 실제 사고 케이스 참고. Vercel UI에 paste할 때도 동일.

### 3. Supabase 셋업

[supabase.com](https://supabase.com)에서 새 프로젝트 만들고:

1. Project URL과 anon key를 `.env.local`에 등록 (`NEXT_PUBLIC_SUPABASE_*`)
2. SQL Editor 또는 MCP로 [`supabase/schema.sql`](./supabase/schema.sql) 실행 → 7개 테이블 + RLS 정책 생성
3. Storage에 **`media`** 버킷 생성 (Public). 코드가 자동 생성 시도하지만 권한 부족 시 수동 필요

### 4. OAuth Redirect URI 등록 (5개 콘솔)

각 플랫폼 개발자 콘솔에서 Redirect URI 추가:

```
https://YOUR-APP.vercel.app/api/auth/callback
http://localhost:3001/api/auth/callback   ← 로컬 개발용 (선택)
```

- **Google**: [console.cloud.google.com](https://console.cloud.google.com) → 사용자 인증 정보 → OAuth 클라이언트 → 승인된 리디렉션 URI
- **Meta (Instagram + Threads)**: [developers.facebook.com](https://developers.facebook.com) → 앱 → Facebook Login for Business / Threads → Settings → Redirect URIs
- **TikTok**: [developers.tiktok.com](https://developers.tiktok.com) → 앱 → Login Kit → Redirect URI (https만 허용 — 로컬 불가)
- **X**: [developer.x.com](https://developer.x.com) → 앱 → User authentication settings → Callback URI

플랫폼별 함정·필수 단계는 [`oauth-guide.md`](./oauth-guide.md) 참고.

### 5. 로컬 실행

```bash
npm run dev
```

→ http://localhost:3001 접속 → `AUTH_USER`/`AUTH_PASS`로 로그인 → 5개 플랫폼 연결 → 끝.

### 6. Vercel 배포

```bash
vercel --prod
```

또는 GitHub 연동으로 자동 배포. **Vercel Dashboard → Settings → Environment Variables**에 `.env.local`의 16개 변수 모두 등록.

**Vercel UI에 값 paste할 때 끝 개행 주의** — [`oauth-guide.md` #1 사고 케이스](./oauth-guide.md) 참고.

---

## 주요 디렉토리

- `src/app/api/auth/` — 5개 플랫폼 OAuth (시작 + 콜백)
- `src/app/api/publish/` — 5개 동시 발행 로직
- `src/lib/oauth-config.ts` — 플랫폼별 scope, authUrl, env 매핑
- `src/lib/publishers/` — 플랫폼별 발행 함수
- `supabase/schema.sql` — DB 스키마 (7개 테이블 + RLS)
- `vercel.json` — Cron 설정 (예약 발행 + quota 리셋)

## 참고 문서

- [`oauth-guide.md`](./oauth-guide.md) — 5개 플랫폼 OAuth 함정 가이드 + 실제 사고 케이스
- [`docs/oauth-document.md`](./docs/oauth-document.md) — 원본 OAuth 디버깅 노트
- [`CLAUDE.md`](./CLAUDE.md) / [`AGENTS.md`](./AGENTS.md) — Claude Code 작업 규칙
- [`TODO.md`](./TODO.md) — 진행 중인 작업
