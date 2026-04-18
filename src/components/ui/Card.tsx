import clsx from 'clsx';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  pearl?: boolean;
}

export default function Card({ children, className, pearl = true }: CardProps) {
  return (
    <div
      className={clsx(
        pearl ? 'pearl-card' : 'bg-white rounded-xl border border-gray-100',
        'p-5',
        className
      )}
    >
      {children}
    </div>
  );
}
