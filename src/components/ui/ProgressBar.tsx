import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
}

export default function ProgressBar({ value, max, className }: ProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className={clsx('w-full', className)}>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', {
            'bg-emerald-400': percent < 60,
            'bg-amber-400': percent >= 60 && percent < 85,
            'bg-red-400': percent >= 85,
          })}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>{value.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}
