import type { PlatformId } from '@/types';

export const PLATFORM_CONFIG: Record<PlatformId, {
  name: string;
  color: string;
  glowColor: string;
  maxTitleLength: number;
  maxDescriptionLength: number;
}> = {
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    glowColor: 'rgba(255, 0, 0, 0.4)',
    maxTitleLength: 100,
    maxDescriptionLength: 5000,
  },
  instagram: {
    name: 'Instagram',
    color: '#E4405F',
    glowColor: 'rgba(228, 64, 95, 0.4)',
    maxTitleLength: 0,
    maxDescriptionLength: 2200,
  },
  threads: {
    name: 'Threads',
    color: '#000000',
    glowColor: 'rgba(0, 0, 0, 0.3)',
    maxTitleLength: 0,
    maxDescriptionLength: 500,
  },
  tiktok: {
    name: 'TikTok',
    color: '#00F2EA',
    glowColor: 'rgba(0, 242, 234, 0.4)',
    maxTitleLength: 0,
    maxDescriptionLength: 2200,
  },
  x: {
    name: '(Twitter)',
    color: '#000000',
    glowColor: 'rgba(0, 0, 0, 0.3)',
    maxTitleLength: 0,
    maxDescriptionLength: 280,
  },
};

export const NAV_ITEMS = [
  { label: '대시보드', href: '/', icon: 'LayoutDashboard' },
  { label: '트렌드 탐색', href: '/trend', icon: 'TrendingUp' },
  { label: '콘텐츠 발행', href: '/publish', icon: 'Upload' },
  { label: '예약 발행', href: '/calendar', icon: 'Calendar' },
  { label: '영상 편집', href: '/edit', icon: 'Film' },
  { label: '발행/예약 현황', href: '/history', icon: 'History' },
  { label: 'SNS 계정 연결', href: '/accounts', icon: 'Link' },
] as const;

export const YOUTUBE_CATEGORIES = [
  '전체',
  '음악',
  '게임',
  '엔터테인먼트',
  '스포츠',
  '뉴스',
  '교육',
  '과학기술',
  '여행',
  '음식',
] as const;

export const INSTAGRAM_CATEGORIES = [
  '전체',
  '일상',
  '음식',
  '뷰티',
  '패션',
  '여행',
  '운동',
  '반려동물',
] as const;
