/* shadcn/ui-style primitives (copy-in components built on Tailwind + CVA),
   kept in one file for the MVP. */
import { forwardRef, useEffect, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, Loader2, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-teal text-white hover:bg-teal-600 shadow-sm',
        secondary: 'bg-white text-navy border border-line hover:bg-bg',
        ghost: 'text-navy-500 hover:bg-bg hover:text-navy',
        danger: 'bg-error text-white hover:opacity-90',
        outline: 'border border-teal text-teal hover:bg-teal-50',
        dark: 'bg-navy text-white hover:bg-navy-700',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-[15px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, loading, children, disabled, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {children}
  </button>
));
Button.displayName = 'Button';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-line bg-white shadow-[var(--shadow-card)]', className)} {...props} />;
}
export function CardHeader({ title, subtitle, action, icon }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="flex items-start gap-3 min-w-0">
        {icon && <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal">{icon}</div>}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-navy">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[13px] text-navy-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold', {
  variants: {
    tone: {
      teal: 'bg-teal-50 text-teal',
      cyan: 'bg-cyan-50 text-[#137F8A]',
      navy: 'bg-navy text-white',
      gray: 'bg-bg text-navy-500 border border-line',
      success: 'bg-[#E3F5F1] text-success',
      warning: 'bg-[#FDF3DF] text-[#9A6B12]',
      error: 'bg-[#FBE7E9] text-error',
    },
  },
  defaultVariants: { tone: 'teal' },
});
export function Badge({ className, tone, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

const field = 'w-full rounded-xl border border-line bg-white px-3.5 text-sm text-navy placeholder:text-navy-300 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/15';
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(field, 'h-10', className)} {...props} />
));
Input.displayName = 'Input';
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(field, 'min-h-24 py-2.5', className)} {...props} />
));
Textarea.displayName = 'Textarea';
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(field, 'h-10 pr-8', className)} {...props} />
));
Select.displayName = 'Select';

export function Label({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[13px] font-medium text-navy-700">
      {children} {hint && <span className="font-normal text-navy-300">{hint}</span>}
    </label>
  );
}

export function Field({ label, hint, error, children }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label hint={hint}>{label}</Label>
      {children}
      {error && <p className="text-[12px] text-error">{error}</p>}
    </div>
  );
}

export function Progress({ value, className, tone = 'teal' }: { value: number; className?: string; tone?: 'teal' | 'success' | 'warning' }) {
  const v = Math.max(0, Math.min(100, value));
  const bar = tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-gradient-to-r from-teal to-cyan';
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-[#E8EEF4]', className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-[width] duration-500', bar)} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-navy-500">
      <Loader2 className="h-5 w-5 animate-spin text-teal" /> {label}
    </div>
  );
}

export function EmptyState({ title, text, action, icon }: { title: string; text?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-bg text-navy-300">{icon ?? <Inbox className="h-6 w-6" />}</div>
      <p className="font-semibold text-navy">{title}</p>
      {text && <p className="mt-1 max-w-md text-sm text-navy-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Dialog({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div role="dialog" aria-modal className={cn('animate-fade-up w-full rounded-2xl bg-white shadow-[var(--shadow-lift)]', wide ? 'max-w-3xl' : 'max-w-lg')} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-navy-500 hover:bg-bg" aria-label="close"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5 scrollbar-thin">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode }[] }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-white p-1">
      {items.map((it) => (
        <button key={it.value} onClick={() => onChange(it.value)}
          className={cn('rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors', value === it.value ? 'bg-navy text-white' : 'text-navy-500 hover:text-navy')}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, tone = 'teal' }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: 'teal' | 'cyan' | 'navy' | 'warning' }) {
  const toneCls = { teal: 'bg-teal-50 text-teal', cyan: 'bg-cyan-50 text-[#137F8A]', navy: 'bg-[#E8EEF4] text-navy', warning: 'bg-[#FDF3DF] text-[#9A6B12]' }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-navy-500">{label}</span>
        {icon && <span className={cn('grid h-8 w-8 place-items-center rounded-lg', toneCls)}>{icon}</span>}
      </div>
      <div className="mt-2 text-[26px] font-bold tracking-tight text-navy">{value}</div>
      {hint && <div className="mt-1 text-[12px] text-navy-500">{hint}</div>}
    </Card>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1 text-[12px] font-semibold uppercase tracking-wider text-teal">{eyebrow}</div>}
        <h1 className="text-[26px] font-bold tracking-tight text-navy">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-[14px] text-navy-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Mandatory educational-use label for medical content. */
export function EduNotice({ className }: { className?: string }) {
  const { t } = useT();
  return (
    <div className={cn('rounded-xl border border-[#F4D99B] bg-[#FFF9EC] px-4 py-2.5 text-[12.5px] text-[#7A5410]', className)}>
      {t('app.eduOnly')}
    </div>
  );
}
