'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PlatformId } from '@/types';
import { PLATFORM_CONFIG } from '@/lib/constants';
import clsx from 'clsx';

interface DayInfo {
  count: number;
  platforms: PlatformId[];
}

interface Props {
  currentMonth: Date;
  scheduledDates: Map<string, DayInfo>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onMonthChange: (date: Date) => void;
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarGrid({
  currentMonth, scheduledDates, selectedDate, onSelectDate, onMonthChange,
}: Props) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const today = new Date();
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => onMonthChange(new Date(year, month - 1, 1));
  const nextMonth = () => onMonthChange(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-pearl-100 text-gray-400 cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">
          {year}년 {month + 1}월
        </h2>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-pearl-100 text-gray-400 cursor-pointer">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-xs font-medium text-gray-400 py-2">
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;

          const dateKey = formatDateKey(year, month, day);
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDate;
          const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const dayInfo = scheduledDates.get(dateKey);

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              className={clsx(
                'relative flex flex-col items-center py-2 rounded-lg cursor-pointer transition-all min-h-[52px]',
                isSelected
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm'
                  : isToday
                    ? 'ring-2 ring-indigo-300 bg-white'
                    : isPast
                      ? 'text-gray-300 hover:bg-pearl-50'
                      : 'text-gray-700 hover:bg-pearl-50'
              )}
            >
              <span className={clsx('text-sm font-medium', isSelected && 'text-white')}>
                {day}
              </span>
              {dayInfo && dayInfo.count > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {dayInfo.platforms.slice(0, 5).map((pid) => (
                    <div
                      key={pid}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: isSelected ? '#fff' : PLATFORM_CONFIG[pid]?.color || '#9ca3af',
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
