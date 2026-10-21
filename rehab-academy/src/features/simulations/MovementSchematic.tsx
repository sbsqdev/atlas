import { useT } from '@/i18n';

/** Sagittal schematic of the knee: femur fixed, tibia rotates by `angle`
 *  degrees of flexion. Drawn from geometry, not from any copyrighted figure. */
export function MovementSchematic({ angle, onChange }: { angle: number; onChange: (a: number) => void }) {
  const { t } = useT();
  const knee = { x: 160, y: 150 };
  const hip = { x: 160, y: 20 };
  const rad = (angle * Math.PI) / 180;
  const legLen = 140;
  const ankle = { x: knee.x - Math.sin(rad) * legLen, y: knee.y + Math.cos(rad) * legLen };
  const tub = { x: knee.x + 10 * Math.cos(rad) - Math.sin(rad) * 22, y: knee.y + 10 * Math.sin(rad) + Math.cos(rad) * 22 };
  // Patella rides in front of the femoral condyles and slides down with flexion.
  const pr = (Math.min(angle, 120) * Math.PI) / 180 / 2;
  const patella = { x: knee.x + 16 * Math.cos(pr), y: knee.y - 4 + 16 * Math.sin(pr) };
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <svg viewBox="0 0 320 310" className="mx-auto h-64 w-full max-w-sm" role="img" aria-label={t('sim.movement')}>
        <line x1={hip.x} y1={hip.y} x2={knee.x} y2={knee.y} stroke="#E6DCC3" strokeWidth="18" strokeLinecap="round" />
        <path d={`M ${hip.x + 14} ${hip.y + 20} Q ${hip.x + 26} ${(hip.y + knee.y) / 2} ${patella.x} ${patella.y - 8}`} stroke="#B85C55" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.9" />
        <line x1={knee.x} y1={knee.y} x2={ankle.x} y2={ankle.y} stroke="#E6DCC3" strokeWidth="16" strokeLinecap="round" />
        <line x1={patella.x} y1={patella.y} x2={tub.x} y2={tub.y} stroke="#28B8C7" strokeWidth="4" strokeLinecap="round" />
        <circle cx={knee.x} cy={knee.y} r="13" fill="#F5F0E3" stroke="#C9BFA5" strokeWidth="2" />
        <ellipse cx={patella.x} cy={patella.y} rx="6" ry="9" fill="#087F8C" />
        <path d={`M ${knee.x} ${knee.y + 34} A 34 34 0 0 ${angle > 0 ? 1 : 0} ${knee.x - Math.sin(rad) * 34} ${knee.y + Math.cos(rad) * 34}`} stroke="#F2B84B" strokeWidth="2" fill="none" strokeDasharray="4 3" />
        <text x="196" y="80" fontSize="11" fill="#B85C55" fontWeight="600">{t('sim.lbl.quads')}</text>
        <text x="196" y="96" fontSize="11" fill="#087F8C" fontWeight="600">{t('sim.lbl.patella')}</text>
        <text x="196" y="112" fontSize="11" fill="#1C9AA8" fontWeight="600">{t('sim.lbl.patLig')}</text>
        <text x="96" y="98" fontSize="11" fill="#486581">{t('sim.lbl.femur')}</text>
        <text x={Math.min(250, ankle.x + 14)} y={Math.min(296, ankle.y)} fontSize="11" fill="#486581">{t('sim.lbl.tibia')}</text>
      </svg>
      <label className="mt-2 block text-center text-sm font-semibold">{t('sim.angle')}: {angle}°</label>
      <input type="range" min={0} max={135} value={angle} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-teal" aria-label={t('sim.angle')} />
      <div className="flex justify-between text-[11px] text-navy-500"><span>{t('sim.extension')} 0°</span><span>{t('sim.flexion')} 135°</span></div>
    </div>
  );
}
