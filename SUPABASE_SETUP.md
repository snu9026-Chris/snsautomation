# Loopdrop · Supabase 셋업 가이드

새 환경(다른 PC, 새로 클론한 상태 등)에서 Loopdrop(SNS Automation)을 돌릴 때, **Supabase 쪽에서 무엇을 준비해야 하는지** 정리한 체크리스트.

> 원본 저자(@snu9026-Chris)는 본인 Supabase 프로젝트를 그대로 쓰지만, **외부 클론 사용자는 본인의 새 Supabase 프로젝트를 만들어** 아래 SQL을 적용하면 된다.

---

## TL;DR — Vercel vs Supabase 자동화

| 항목 | Vercel | Supabase |
|---|---|---|
| 가입 | 자동으로 personal team 생성 | 자동으로 personal organization 생성 |
| **프로젝트 생성** | ✅ CLI/MCP가 자동 (`vercel deploy` 첫 호출 시 폴더 기준 새 프로젝트 생성) | ❌ **수동 1회** (대시보드에서 New Project 클릭) |
| 환경변수 등록 | ✅ `vercel env add` 또는 대시보드 | (해당 없음) |
| 테이블 / 인덱스 / RLS / Storage 정책 | (해당 없음) | ✅ MCP `apply_migration` 또는 SQL Editor에 SQL 붙여넣기 |
| TypeScript 타입 / Edge Function | (해당 없음) | ✅ MCP 자동 |

**결론**:
- **Vercel**: 가입만 하면 0 → 배포까지 풀 자동.
- **Supabase**: 가입 + **프로젝트 1번 수동 클릭** + project_ref 연결까지 한 번 해두면, 그 후엔 MCP가 다 처리.

새 환경에서 Supabase는 **딱 한 번 대시보드 들렀다 오는 단계**가 있다고 생각하면 됨.

---

## 0. 프로젝트 생성 (수동 1회, 5분)

> ⚠️ 자동화 안 되는 유일한 단계. 그 후엔 모든 게 SQL/MCP로 자동.

### 0-1. 가입
[supabase.com](https://supabase.com) 가입 — GitHub 연동 권장. personal organization 자동 생성됨.

### 0-2. New Project 클릭
대시보드에서 **New Project**:

| 항목 | 권장 값 |
|---|---|
| Name | `loopdrop` (자유) |
| Database Password | 강한 비밀번호 (별도 저장 — 분실 시 곤란) |
| Region | `Northeast Asia (Seoul)` (한국 사용자 latency 최소) |
| Plan | `Free` (시작용 충분, 500MB DB + 1GB Storage) |

생성 ~2분 대기.

### 0-3. (선택) project_ref 메모
"project_ref"는 Supabase가 프로젝트마다 자동 발급하는 고유 식별자 (20자 랜덤 영소문자, 예: `itevyukhfollhuvvjqld`).

```
https://supabase.com/dashboard/project/itevyukhfollhuvvjqld
                                       ^^^^^^^^^^^^^^^^^^^^
                                       project_ref
```

**언제 쓰나**: Supabase MCP를 Claude Code에 등록할 때만 (`--project-ref=...`). 그 외엔 안 씀.
**Dashboard SQL Editor로만 셋업하면 신경 안 써도 됨.**

### 0-4. 그래서 프로젝트 안에서 뭘 만들어야 하나?
**아무것도.** 프로젝트(=빈 DB 인스턴스) 자체만 만들면 끝.
- 테이블, 인덱스, 트리거, RLS 정책 → 모두 아래 섹션 2의 `schema.sql` 한 방으로 끝남
- Storage `media` 버킷 → 앱이 첫 업로드 시 자동 생성 (코드가 만들어줌, 섹션 3 참고)
- 사람이 직접 만들 건 0개

### 0-5. 왜 프로젝트 생성만 수동인가
Supabase MCP 도구 목록을 보면:
- ✅ `apply_migration`, `execute_sql`, `list_tables`, `deploy_edge_function`, `list_branches` 등
- ❌ `create_project` **없음** (의도적)

이유: 프로젝트 생성에 들어가는 결정 — **리전 / DB 비밀번호 / 요금제 / billing** — 이 자동화에 부적합. Supabase가 의도적으로 사람 손을 거치게 함.

### 0-6. 진짜 풀 스텝 (Dashboard만 쓰는 경우)

| # | 어디서 | 무엇을 |
|---|---|---|
| 1 | supabase.com | 가입 (GitHub login 권장) |
| 2 | 대시보드 | **New Project** 클릭 |
| 3 | 폼 | Name / DB Password(저장!) / Region(Seoul) / Plan(Free) |
| 4 | 폼 | **Create new project** → 2분 대기 |
| 5 | SQL Editor | New Query → `supabase/schema.sql` 전체 복사·붙여넣고 **Run** |
| 6 | Settings → API | **Project URL** 복사 → `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL` |
| 7 | Settings → API | **anon public** 복사 → `.env.local`의 `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

**이게 전부.** 8단계 이후는 없음. 이 시점부터는 `npm run dev` 돌리면 동작.

---

## 🤖 Claude Code에 한 번에 시키는 방법 (클론 사용자용)

이 가이드를 직접 읽고 따라하기 귀찮다면, Claude Code(또는 Claude.ai)에 아래처럼 던지면 된다.

### 시나리오 A — Supabase MCP가 연결돼 있을 때 (Claude가 직접 적용)

> Supabase MCP 셋업: [공식 문서](https://supabase.com/docs/guides/getting-started/mcp) 참고. 본인 Supabase 프로젝트 access token을 Claude Code에 등록.

```
@SUPABASE_SETUP.md 보고 내 Supabase 프로젝트에 필요한
테이블·인덱스·RLS 정책·초기 데이터를 다 적용해줘.

먼저 list_tables로 현재 상태 확인하고,
이미 적용된 건 건너뛰고 빠진 것만 apply_migration으로 추가해.
적용 후 list_tables로 결과 보여줘.
```

### 시나리오 B — Supabase MCP 없이 (Dashboard에 직접 붙여넣기)

```
@SUPABASE_SETUP.md 보고, 내가 Supabase Dashboard SQL Editor에
붙여넣을 SQL을 정리해줘. supabase/schema.sql 한 파일이면 된다고 들었음.
```

### 시나리오 C — `.env.local` 템플릿만 만들고 싶을 때

```
@SUPABASE_SETUP.md 보고 .env.local 템플릿 파일을 만들어줘.
키 값은 빈 칸으로 두고, 각 키 옆에 어디서 받는지 한 줄 주석.
```

> 💡 `@` 멘션은 Claude Code에서 파일 첨부 syntax. 일반 Claude.ai에서는 이 파일 내용을 복사해서 붙여 넣으면 됨.

---

## 1. 필요한 환경변수 (`.env.local`)

레포 루트에 `.env.local`을 만들고 아래 2개 키를 채운다. (다른 키는 OAuth/API용 — 이 가이드 범위 밖)

| 키 | 어디서 받나 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → **Project URL** | 클라이언트/서버 공통 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → **anon public** | 모든 DB/Storage 접근 |

> ⚠️ `.env.local`은 `.gitignore`로 차단되어 있다. 절대 커밋하지 말 것.
> 💡 현재 Loopdrop은 **anon 키 한 개**로만 동작 (single-user 사이드 프로젝트 가정 — RLS가 anon 전체 허용). 다중 사용자로 확장하면 `service_role` 키 분리가 필요.

---

## 2. 필요한 테이블 (7개)

Loopdrop이 만드는 테이블 7개. 모두 `supabase/schema.sql` 단일 파일에 정의되어 있다.

| 테이블 | 역할 |
|---|---|
| `platforms` | 5개 SNS 플랫폼(YouTube/Instagram/Threads/TikTok/X) OAuth 토큰·할당량 |
| `posts` | 발행 원본 콘텐츠 (제목, 설명, 미디어 URL 배열) |
| `publish_logs` | 플랫폼별 발행 이력 (성공/실패, 결과 URL) |
| `templates` | 첫 댓글·설명 템플릿 |
| `trending_videos` | YouTube 트렌드 캐시 |
| `scheduled_posts` | 예약 발행 큐 (n8n 워크플로우 연동) |
| `api_usage` | Claude/GPT 등 외부 API 사용량 추적 |

### 적용 방법

Supabase Dashboard → **SQL Editor** → **New Query** → `supabase/schema.sql` 전체 복사 붙여넣기 → **Run**.

이 한 파일에 다음이 모두 들어 있다:
- 7개 테이블 `CREATE TABLE IF NOT EXISTS`
- 인덱스 (`publish_logs`, `trending_videos` 등)
- RLS 활성화 + anon 전체 허용 정책
- `platforms` 5행 / `api_usage` 2행 초기 데이터 (`ON CONFLICT DO NOTHING`)
- `updated_at` 자동 갱신 트리거 함수 + `platforms`, `api_usage` 트리거

> 모두 `IF NOT EXISTS` / `ON CONFLICT DO NOTHING`으로 멱등하게 작성되어 있어, 이미 적용된 환경에서 다시 돌려도 안전.

---

## 3. Storage 버킷

| 버킷명 | 공개 여부 | 용도 |
|---|---|---|
| `media` | **public** | 업로드된 영상/사진 (영상 최대 500MB) |

- **수동 생성 불필요.** `src/app/api/upload/route.ts`가 첫 업로드 시 버킷이 없으면 `createBucket('media', { public: true, fileSizeLimit: 500MB })`로 **자동 생성**한다.
- RLS 정책은 별도 설정 안 함 → anon 키로 업로드/다운로드 자유롭게 가능 (single-user 가정).
- 다중 사용자 확장 시 `auth.uid()` 기반 정책 추가 필요.

### 디렉토리 컨벤션 (코드에서 사용 중)
- `uploads/{timestamp}_{safe_filename}` — 일반 영상/이미지 업로드
- `uploads/{timestamp}_{filename}` — 외부 URL에서 가져온 사진 (`/api/photos`)

---

## 4. 코드에서 Supabase를 쓰는 곳 (참고용)

Loopdrop은 `src/lib/supabase.ts`의 단일 클라이언트로 접근.

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

주요 사용처 (변경 시 영향 범위 파악용):

| 영역 | 파일 |
|---|---|
| 공통 쿼리 모음 | `src/lib/queries.ts` |
| OAuth 토큰 자동 갱신 | `src/lib/services/token-refresh.ts` |
| 파일 업로드 (Storage) | `src/app/api/upload/route.ts`, `src/app/api/photos/route.ts` |
| 발행 (publish_logs) | `src/app/api/publish/**/*.ts` |
| 예약 발행 (scheduled_posts) | `src/app/api/schedule/**/*.ts`, `src/app/api/scheduled/publish/route.ts` |
| OAuth 콜백 (platforms) | `src/app/api/auth/callback/route.ts` |
| 트렌드 캐시 (trending_videos) | `src/app/api/instagram/trending/route.ts` |
| AI 사용량 (api_usage) | `src/app/api/ai/**/*.ts` |
| 할당량 리셋 | `src/app/api/quota/reset/route.ts` |

---

## 5. 셋업 검증 체크리스트

새 환경 셋업 후 동작 확인용:

- [ ] `npm run dev` 실행 시 `Supabase URL/Key undefined` 같은 에러 없음
- [ ] Supabase Dashboard → **Table Editor**에서 7개 테이블이 보임 (`platforms`, `posts`, `publish_logs`, `templates`, `trending_videos`, `scheduled_posts`, `api_usage`)
- [ ] `platforms` 테이블에 5행이 들어 있음 (youtube, instagram, threads, tiktok, x) — `status='disconnected'`
- [ ] `api_usage` 테이블에 2행 (claude, gpt)
- [ ] `/settings` (또는 OAuth 연결 페이지)에서 플랫폼 1개 연결 → `platforms.status='connected'`로 바뀜
- [ ] 영상 1개 업로드 → Supabase Dashboard → **Storage**에 `media` 버킷이 생기고, 안에 파일이 들어 있음
- [ ] 발행 1회 → `publish_logs`에 row 생김

---

## 6. 자주 막히는 포인트

- **`platforms` 5행이 비어 있음** → `schema.sql`의 `INSERT INTO platforms ...` 부분이 누락. SQL 전체를 다시 실행하면 `ON CONFLICT DO NOTHING`으로 멱등하게 채워진다.
- **Storage 업로드 시 `Bucket not found` 에러가 한 번 나고 자동 복구됨** → 정상 동작. `route.ts:64`의 retry 로직이 버킷을 만들고 재시도한다. 두 번째 업로드부터는 그냥 성공.
- **Storage 업로드 시 403/Permission denied** → Supabase Dashboard → Storage → `media` 버킷 → **Policies**에서 anon insert/select/delete 정책이 막혔는지 확인. 기본은 public 버킷이라 막힐 일은 없음.
- **OAuth 콜백 시 `platforms` row가 안 채워짐** → `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`이 잘못된 프로젝트를 가리키고 있는 경우가 많음. URL의 `project_ref`가 Dashboard URL과 일치하는지 확인.
- **`anon` 키로 service_role 권한이 필요한 작업을 하려는 경우** → Loopdrop은 현재 service_role을 안 쓴다. RLS가 anon 전체 허용이므로 anon 키로 모든 동작 가능. 만약 RLS를 좁히게 되면 `src/lib/supabase.ts`에 서버 전용 클라이언트를 추가하고 `SUPABASE_SERVICE_ROLE_KEY`를 별도 환경변수로 분리할 것.
- **새 Supabase 키 명칭 (`publishable` / `secret`)** → 최근 만든 프로젝트는 Dashboard에 `anon` 대신 `publishable`, `service_role` 대신 `secret`으로 표시될 수 있음. 같은 키니까 그대로 매핑하면 됨.
- **OAuth 연결이 안 됨** → Supabase 문제가 아니라 OAuth 설정 문제일 가능성이 높다. `docs/oauth-document.md` (5개 플랫폼 함정 모음) 먼저 확인.
