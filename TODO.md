# LoopDrop — 남은 작업

> 마지막 업데이트: 2026-04-18

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
- [ ] 콘텐츠 캘린더 + Vercel Cron Jobs 예약 발행
- [ ] GitHub 레포 연동 → git push 자동 배포 전환
