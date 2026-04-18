import clsx from 'clsx';
import type { PublishStatus, ConnectionStatus } from '@/types';

type BadgeVariant = 'success' | 'error' | 'pending' | 'default';

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  error: 'bg-red-50 text-red-600 border-red-200',
  pending: 'bg-gray-50 text-gray-500 border-gray-200',
  default: 'bg-gray-50 text-gray-500 border-gray-200',
};

const statusToVariant: Record<PublishStatus, BadgeVariant> = {
  success: 'success',
  failed: 'error',
  pending: 'pending',
};

const connectionToVariant: Record<ConnectionStatus, BadgeVariant> = {
  connected: 'success',
  expired: 'error',
  disconnected: 'pending',
};

const statusLabels: Record<PublishStatus, string> = {
  success: '성공',
  failed: '실패',
  pending: '대기',
};

const connectionLabels: Record<ConnectionStatus, string> = {
  connected: '연결됨',
  expired: '만료됨',
  disconnected: '미연결',
};

interface PublishBadgeProps {
  status: PublishStatus;
  className?: string;
}

export function PublishBadge({ status, className }: PublishBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[statusToVariant[status]],
        className
      )}
    >
      <span
        className={clsx('w-1.5 h-1.5 rounded-full', {
          'bg-emerald-500': status === 'success',
          'bg-red-500': status === 'failed',
          'bg-gray-400': status === 'pending',
        })}
      />
      {statusLabels[status]}
    </span>
  );
}

interface ConnectionBadgeProps {
  status: ConnectionStatus;
  className?: string;
}

export function ConnectionBadge({ status, className }: ConnectionBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[connectionToVariant[status]],
        className
      )}
    >
      <span
        className={clsx('w-1.5 h-1.5 rounded-full', {
          'bg-emerald-500': status === 'connected',
          'bg-red-500': status === 'expired',
          'bg-gray-400': status === 'disconnected',
        })}
      />
      {connectionLabels[status]}
    </span>
  );
}
