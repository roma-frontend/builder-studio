/**
 * Animated "beams" background: rotating conic light rays + a soft radial core,
 * both tinted with the theme --primary. Pure CSS. Place absolutely behind
 * content in a `relative` container.
 */
export function Beams({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}>
      <div className="beams-rays" />
      <div className="beams-core" />
    </div>
  );
}
