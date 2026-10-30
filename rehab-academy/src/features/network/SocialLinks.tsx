import { Camera, Send, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { socialUrl } from './card';

/** Instagram / Telegram / Strava buttons of an athlete. */
export default function SocialLinks({ ig, tg, st, dark }: { ig?: string; tg?: string; st?: string; dark?: boolean }) {
  const item = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold';
  const tone = dark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-bg text-navy hover:bg-teal-50';
  return (
    <div className="flex flex-wrap gap-2">
      {ig && <a href={socialUrl('ig', ig)} target="_blank" rel="noreferrer" className={cn(item, tone)}><Camera className="h-4 w-4" /> Instagram</a>}
      {tg && <a href={socialUrl('tg', tg)} target="_blank" rel="noreferrer" className={cn(item, tone)}><Send className="h-4 w-4" /> Telegram</a>}
      {st && <a href={socialUrl('st', st)} target="_blank" rel="noreferrer" className={cn(item, tone)}><TrendingUp className="h-4 w-4" /> Strava</a>}
    </div>
  );
}
