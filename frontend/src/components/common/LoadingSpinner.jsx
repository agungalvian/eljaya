import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Memuat data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 size={32} className="text-amber-500 animate-spin" />
      <p className="text-slate-500 text-sm font-medium">{message}</p>
    </div>
  );
}

export function InlineSpinner({ size = 16 }) {
  return <Loader2 size={size} className="animate-spin text-amber-500" />;
}
