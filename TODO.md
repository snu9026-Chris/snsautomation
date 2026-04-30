# LoopDrop — 남은 작업

> 마지막 업데이트: 2026-04-30

## 🚨 리팩토링 직후 사용자 검증 필요 (2026-04-30)
- [ ] 인증 추가 후 재로그인 (loopdrop-session 쿠키 새로 받기)
- [ ] 5개 플랫폼 OAuth 재연결 — state 쿠키 검증 동작 확인
- [ ] `/publish` 영상 즉시 발행 (YouTube/Instagram)
- [ ] `/calendar` 예약 생성/수정/취소
- [ ] `/history` 두 탭 데이터 표시
- [ ] AI 추천 (캡션/뮤직 프롬프트) 실행
- [ ] Google Photos 가져오기 동작
- [ ] Upload MIME whitelist에 빠진 형식 발견되면 추가 (`api/upload/route.ts`)

## Phase 1 마무리
- [x] 로그인 UI 변경 (Basic Auth 팝업 → 보라 테마 모달 + 쿠키 인증)
- [x] 영상 업로드 시 X 플랫폼 숨기기
- [x] YouTube 고정 댓글 → 일반 댓글로 변경 (API 미지원)
- [x] Threads 토큰 자동 갱신 로직 추가
- [x] 히스토리 영상 썸네일 처리 (video 태그)
- [x] API 할당량 추적 (발행 시 quota_used 증가, GPT 토큰 추적)
- [x] API 할당량 대시보드 개선 (플랫폼별 한도/주기, GPT 원화 환산)
- [x] Vercel Cron Job — 일단위 quota 리셋 (vercel.json)
- [x] package.json name → loopdrop
- [x] 폴더명 spread → loopdrop 변경 — 2026-04-18 완료
- [x] 영상 발행 테스트 (YouTube Shorts, Instagram 릴스) — 2026-04-18 완료
- [ ] TikTok 영상 발행 테스트 (Production 앱 리뷰 통과 후)
- [ ] X 크레딧 리셋 후 텍스트 발행 재테스트 (매월 초 리셋)
- [x] Threads 재연결 (토큰 만료) — 2026-04-18 완료

## Phase 2
- [x] TikTok Production 앱 리뷰 제출 — 2026-04-18 제출 완료, 리뷰 대기 중
- [x] 영상 편집 섹션 (ffmpeg.wasm 브라우저 전용) — 2026-04-18 완료
- [x] 예약 발행 + Vercel Cron Jobs — 2026-04-18 완료
  - 캘린더 UI, 시간 선택, 수동 발행 트리거, 발행/예약 현황 탭 분리
- [x] GitHub 레포 푸시 — 2026-04-18 완료 (백업/클론 용도)
- [x] 사이드바 마스코트 — 페이지별 다른 캐릭터 + 기능 설명 말풍선
- [x] 헤더/사이드바/히어로 크기 확대
- [x] 예약 발행에서 영상 시 X 플랫폼 숨김 규칙 적용

## 리팩토링 (2026-04-30 완료)
- [x] Phase A — 보안 (lib/auth.ts, OAuth state 검증, MIME whitelist, 9개 API에 requireAuth)
- [x] Phase B — 인프라 레이어 (token-refresh.ts, api.ts wrapper, PlatformsContext)
- [x] Phase C — 훅/컴포넌트 추출 (useFileUpload/usePublishForm/useAiRecommendation, 5개 컴포넌트)
- [x] Phase D — 정리 (silent fail 제거, 타입 안전성 강화)
- [x] publish/page.tsx 725→191줄, calendar/page.tsx 595→347줄

## 추가 가능한 후속 리팩토링 (낮은 우선순위)
- [ ] `trend/page.tsx` (404줄) — `<TrendPanel>` 추출, `useTrendVideos` 훅
- [ ] `edit/page.tsx` (359줄) — 드래그 정렬 로직을 `useDragDrop` 훅으로
- [ ] 기존 lint 에러 6개 정리 (SidebarMascot, SlideshowPreview, MusicSelector, trend, accounts:45, GooglePhotoPicker 미사용 import)
- [ ] React Query 또는 SWR 도입 검토 (스케줄/로그 자동 refetch + caching)
- [ ] Playwright E2E 테스트 작성 (회귀 자동화)

## 외부 대기
- [ ] TikTok 앱 리뷰 통과 → 영상 발행 테스트
- [ ] X 크레딧 리셋 (5월 초) → 텍스트 발행 재테스트
