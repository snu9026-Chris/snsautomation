import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  // OpenAI 잔액 조회 — /v1/dashboard/billing/credit_grants는 폐지됨
  // 대신 /v1/organization/costs 또는 /dashboard API 사용
  try {
    // 방법 1: organization subscription 조회
    const res = await fetch('https://api.openai.com/v1/organization/subscription', {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        hardLimit: data.hard_limit_usd || 0,
        softLimit: data.soft_limit_usd || 0,
        usedUsd: data.system_hard_limit_usd ? data.system_hard_limit_usd - (data.hard_limit_usd || 0) : null,
      });
    }

    // 방법 2: billing/usage 조회 (이번 달 사용량)
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const usageRes = await fetch(
      `https://api.openai.com/v1/dashboard/billing/usage?start_date=${startDate}&end_date=${endDate}`,
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );

    if (usageRes.ok) {
      const usageData = await usageRes.json();
      return NextResponse.json({
        totalUsageCents: usageData.total_usage || 0,
        totalUsageUsd: (usageData.total_usage || 0) / 100,
      });
    }

    return NextResponse.json({ error: 'OpenAI billing API unavailable' }, { status: 502 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
