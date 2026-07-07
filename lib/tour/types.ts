// Data model for the onboarding tour engine. A TourDef is an ordered list of
// steps; each step spotlights a real UI element (by CSS selector) and shows a
// localized tooltip with an animated arrow. Steps are pure data + optional
// side-effect hooks (onEnter) so the same engine drives every tour. Text is
// localized up-front (see lib/tour/tours.ts) — the engine is text-agnostic.

export type Placement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStep {
  /** CSS selector of the element to spotlight. Omit for a centered card. */
  target?: string;
  title: string;
  body: string;
  /** Preferred tooltip side; the engine flips it if it would overflow. */
  placement?: Placement;
  /** Draw the glowing ring + arrow around the target (default true when target). */
  highlight?: boolean;
  /** Show a pulsing "click here" arrow + label (for actionable steps). */
  pointer?: boolean;
  /** Side-effect run when the step becomes active (e.g. switch a tab so the
   *  next target is visible). Runs client-side, before measuring the target. */
  onEnter?: () => void;
}

export interface TourDef {
  id: string;
  steps: TourStep[];
}

export type TourId = 'studio-builder' | 'site-content' | 'dashboard-sites' | 'dashboard-overview';
