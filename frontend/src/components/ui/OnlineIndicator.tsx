interface OnlineIndicatorProps {
  online: boolean;
  size?: 'sm' | 'md';
}

export function OnlineIndicator({ online, size = 'sm' }: OnlineIndicatorProps) {
  const dim = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  return (
    <span
      className={`${dim} rounded-full border-2 border-gray-800 ${online ? 'bg-green-500' : 'bg-gray-500'} flex-shrink-0`}
    />
  );
}
