/** One media clip, as written by the pipeline into data/media.json. */
export interface MediaEntry {
  id: string;
  title: string;
  section: 'hero' | 'background' | 'card';
  prompt?: string;
  src: string;
  poster?: string;
  aspectRatio?: string;
  createdAt?: string;
  /** Optional CTA for hero/background sections. */
  ctaLabel?: string;
  ctaHref?: string;
  /** Optional subtitle/eyebrow text. */
  subtitle?: string;
}
