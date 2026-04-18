<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 세션 시작 시 필독

새 세션을 시작하면 반드시 `TODO.md`를 먼저 읽으세요. 남은 작업 목록이 있습니다.
과거 맥락이 필요하면 `history.md`를 읽으세요.

# OAuth / 소셜 로그인 작업 시작 전 필독

이 프로젝트는 5개 플랫폼(YouTube, Instagram, Threads, TikTok, X) OAuth를 다룹니다. 플랫폼마다 quirk가 많아서 시행착오로 시간 낭비 하기 쉽습니다.

**OAuth 관련 작업(연결 추가/수정/디버깅)을 시작하기 전에 반드시 `docs/oauth-document.md` 를 읽으세요.** 플랫폼별 함정과 해결법이 정리되어 있습니다 (TikTok client_key, X PKCE 길이, Instagram Page 연동 필수, Threads Tester 등).
