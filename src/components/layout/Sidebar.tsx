'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Upload,
  Calendar,
  Film,
  History,
  Link as LinkIcon,
} from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';
import SidebarMascot from '@/components/layout/SidebarMascot';
import clsx from 'clsx';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  LayoutDashboard,
  TrendingUp,
  Upload,
  Calendar,
  Film,
  History,
  Link: LinkIcon,
};

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed top-20 left-0 w-72 h-[calc(100vh-5rem)] bg-white border-r border-pearl-200 flex flex-col z-40">
      <nav className="flex-1 px-4 py-5 space-y-1.5">
        {NAV_ITEMS.map((item, index) => {
          const Icon = ICON_MAP[item.icon];
          const active = isActive(item.href);

          return (
            <div key={item.href}>
              {index === 5 && (
                <div className="my-3 mx-2 border-t border-pearl-200" />
              )}
              <Link
                href={item.href}
                className={clsx(
                  'flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200',
                  active
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                    : 'text-gray-500 hover:bg-pearl-50 hover:text-gray-700'
                )}
              >
                {active && (
                  <div className="absolute left-0 w-1 h-7 rounded-r bg-gradient-to-b from-indigo-400 to-violet-500" />
                )}
                {Icon && <Icon className={clsx('w-6 h-6', active ? 'text-indigo-500' : 'text-gray-400')} />}
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      <SidebarMascot />
    </aside>
  );
}
