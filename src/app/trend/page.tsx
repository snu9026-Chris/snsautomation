'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import PlatformIcon from '@/components/icons/PlatformIcon';
import { YOUTUBE_CATEGORIES, INSTAGRAM_CATEGORIES } from '@/lib/constants';
import { formatViewCount, formatRelativeTime } from '@/lib/utils';
import type { TrendingVideo } from '@/types';
import clsx from 'clsx';
import { Play, Eye, Heart, MessageCircle, Search, Link2 } from 'lucide-react';
import Image from 'next/image';

type PlatformTab = 'youtube' | 'instagram';

interface InstagramPost {
  id: string;
  caption: string;
  mediaType: string;
  mediaUrl: string;
  permalink: string;
  likeCount: number;
  commentsCount: number;
  timestamp: string;
  hashtag: string;
}

export default function TrendPage() {
  const [activeTab, setActiveTab] = useState<PlatformTab>('youtube');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">트렌드 탐색</h1>
        <p className="text-sm text-gray-400 mt-1">플랫폼별 인기 콘텐츠 탐색</p>
      </div>

      {/* 플랫폼 탭 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('youtube')}
          className={clsx(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
            activeTab === 'youtube'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <PlatformIcon platform="youtube" className="w-4 h-4" colored={activeTab !== 'youtube'} />
          YouTube
        </button>
        <button
          onClick={() => setActiveTab('instagram')}
          className={clsx(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
            activeTab === 'instagram'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <PlatformIcon platform="instagram" className="w-4 h-4" colored={activeTab !== 'instagram'} />
          Instagram
        </button>
      </div>

      {activeTab === 'youtube' ? <YouTubeTrend /> : <InstagramTrend />}
    </div>
  );
}

// ── YouTube 트렌드 ──
function YouTubeTrend() {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [videos, setVideos] = useState<TrendingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/youtube/trending?category=${encodeURIComponent(activeCategory)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setVideos([]);
        } else {
          setVideos(data.videos || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('데이터를 불러오지 못했습니다.');
        setLoading(false);
      });
  }, [activeCategory]);

  return (
    <>
      {/* 카테고리 필터 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {YOUTUBE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer',
              activeCategory === cat
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && (
        <Card className="text-center py-8">
          <p className="text-sm text-red-500">{error}</p>
        </Card>
      )}

      {loading && (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="p-0 overflow-hidden">
              <div className="aspect-video bg-gray-100 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 bg-gray-50 rounded w-2/3 animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-4 gap-4">
          {videos.map((video) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 p-0 overflow-hidden">
                <div className="relative aspect-video bg-gray-200 overflow-hidden">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 1280px) 25vw, 320px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-2">
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-1">{video.channelName}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatViewCount(video.viewCount)}
                    </span>
                    <span>·</span>
                    <span>{formatRelativeTime(video.publishedAt)}</span>
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}

      {!loading && !error && videos.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          해당 카테고리의 트렌드 영상이 없습니다.
        </div>
      )}
    </>
  );
}

// ── Instagram 해시태그 트렌드 ──
function InstagramTrend() {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [customTag, setCustomTag] = useState('');
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [activeHashtags, setActiveHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const fetchTrending = (category: string, hashtag?: string) => {
    setLoading(true);
    setError(null);
    setNeedsAuth(false);

    const params = new URLSearchParams();
    params.set('category', category);
    if (hashtag) params.set('hashtag', hashtag);

    fetch(`/api/instagram/trending?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.needsAuth) {
          setNeedsAuth(true);
          setPosts([]);
        } else if (data.error) {
          setError(data.error);
          setPosts([]);
        } else {
          setPosts(data.posts || []);
          setActiveHashtags(data.hashtags || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('데이터를 불러오지 못했습니다.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTrending(activeCategory);
  }, [activeCategory]);

  const handleSearch = () => {
    if (customTag.trim()) {
      fetchTrending('전체', customTag.trim().replace(/^#/, ''));
    }
  };

  // 인스타 계정 미연결
  if (needsAuth) {
    return (
      <Card className="text-center py-16">
        <PlatformIcon platform="instagram" className="w-12 h-12 mx-auto mb-4" colored />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Instagram 계정 연결이 필요합니다</h3>
        <p className="text-sm text-gray-400 mb-6">
          해시태그 기반 인기 게시물을 탐색하려면<br />
          Instagram 비즈니스 계정을 연결해주세요.
        </p>
        <a
          href="/accounts"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Link2 className="w-4 h-4" />
          계정 연결하러 가기
        </a>
      </Card>
    );
  }

  return (
    <>
      {/* 해시태그 검색 */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="해시태그 검색 (예: 숏폼, 브이로그)"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
        >
          검색
        </button>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {INSTAGRAM_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setCustomTag(''); }}
            className={clsx(
              'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer',
              activeCategory === cat && !customTag
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 활성 해시태그 표시 */}
      {activeHashtags.length > 0 && !loading && (
        <div className="flex gap-2 mb-4">
          {activeHashtags.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-xs font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {error && (
        <Card className="text-center py-8">
          <p className="text-sm text-red-500">{error}</p>
        </Card>
      )}

      {loading && (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="p-0 overflow-hidden">
              <div className="aspect-square bg-gray-100 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 bg-gray-50 rounded w-1/2 animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-4 gap-4">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 p-0 overflow-hidden">
                {/* 미디어 */}
                <div className="relative aspect-square bg-gray-200 overflow-hidden">
                  {post.mediaUrl ? (
                    post.mediaType === 'VIDEO' ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <Play className="w-10 h-10 text-white/80" />
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.mediaUrl}
                        alt={post.caption.substring(0, 50)}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlatformIcon platform="instagram" className="w-8 h-8" colored />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  {/* 해시태그 뱃지 */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded-full">
                    #{post.hashtag}
                  </span>
                </div>

                {/* 정보 */}
                <div className="p-3">
                  <p className="text-sm text-gray-800 line-clamp-2 leading-snug mb-2">
                    {post.caption || '(캡션 없음)'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {formatViewCount(post.likeCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {formatViewCount(post.commentsCount)}
                    </span>
                    <span>·</span>
                    <span>{formatRelativeTime(post.timestamp)}</span>
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}

      {!loading && !error && !needsAuth && posts.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          해당 카테고리의 인기 게시물이 없습니다.
        </div>
      )}
    </>
  );
}
