import Lottie from 'lottie-react';
import { useReducedMotion } from '../lib/useReducedMotion';

/** Animation Lottie : figée sur sa première image si l'utilisateur réduit les animations. */
export function LottiePlayer({ data, size, loop = true }: { data: unknown; size: number; loop?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <Lottie
      animationData={data}
      loop={reduced ? false : loop}
      autoplay={!reduced}
      style={{ width: size, height: size, margin: '0 auto' }}
      aria-hidden
    />
  );
}
