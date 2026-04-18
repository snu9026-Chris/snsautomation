-- LoopDrop DB Schema
-- Supabase SQL Editor에서 실행

-- ============================================
-- 1. platforms — SNS 계정 연동 정보
-- ============================================
CREATE TABLE IF NOT EXISTS platforms (
  id TEXT PRIMARY KEY, -- 'youtube', 'instagram', 'threads', 'tiktok', 'x'
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'expired', 'disconnected')),
  account_name TEXT,
  oauth_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  quota_used INTEGER NOT NULL DEFAULT 0,
  quota_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 초기 플랫폼 데이터 삽입
INSERT INTO platforms (id, name, status, quota_total) VALUES
  ('youtube', 'YouTube', 'disconnected', 10000),
  ('instagram', 'Instagram', 'disconnected', 200),
  ('threads', 'Threads', 'disconnected', 500),
  ('tiktok', 'TikTok', 'disconnected', 1000),
  ('x', 'X', 'disconnected', 300)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. posts — 발행 원본 콘텐츠
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  first_comment TEXT,
  media_urls TEXT[] DEFAULT '{}', -- 영상/사진 URL 배열 (Supabase Storage)
  media_type TEXT NOT NULL DEFAULT 'video' CHECK (media_type IN ('video', 'image', 'mixed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 3. publish_logs — 플랫폼별 발행 이력
-- ============================================
CREATE TABLE IF NOT EXISTS publish_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL REFERENCES platforms(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  platform_post_url TEXT,
  platform_data JSONB DEFAULT '{}', -- 플랫폼별 세부 설정 (공개 상태 등)
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publish_logs_post_id ON publish_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_publish_logs_platform ON publish_logs(platform);
CREATE INDEX IF NOT EXISTS idx_publish_logs_status ON publish_logs(status);
CREATE INDEX IF NOT EXISTS idx_publish_logs_published_at ON publish_logs(published_at DESC);

-- ============================================
-- 4. templates — 첫 댓글 등 템플릿
-- ============================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'first_comment' CHECK (type IN ('first_comment', 'description')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 5. trending_videos — 유튜브 트렌드 캐시
-- ============================================
CREATE TABLE IF NOT EXISTS trending_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL DEFAULT 'youtube',
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  channel_name TEXT,
  thumbnail_url TEXT,
  view_count BIGINT NOT NULL DEFAULT 0,
  category TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(platform, video_id)
);

CREATE INDEX IF NOT EXISTS idx_trending_fetched_at ON trending_videos(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_category ON trending_videos(category);

-- ============================================
-- 6. scheduled_posts — 예약 발행 (Phase 2)
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  n8n_workflow_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'cancelled', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 7. api_usage — API 사용량 추적
-- ============================================
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL, -- 'claude', 'gpt', 'youtube', 'instagram' 등
  used INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ, -- 할당량 리셋 시점
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(service)
);

-- 초기 API 사용량 데이터
INSERT INTO api_usage (service, used, total) VALUES
  ('claude', 0, 100000),
  ('gpt', 0, 50000)
ON CONFLICT (service) DO NOTHING;

-- ============================================
-- RLS 정책 (anon 키로 접근 허용)
-- 현재 1인 사용이므로 전체 허용, 추후 Auth 연동 시 제한
-- ============================================
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- 모든 테이블에 anon 읽기/쓰기 허용 (1인 사용)
CREATE POLICY "Allow all for anon" ON platforms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON publish_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON trending_videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON scheduled_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON api_usage FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER platforms_updated_at
  BEFORE UPDATE ON platforms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER api_usage_updated_at
  BEFORE UPDATE ON api_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
