import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for composing Tailwind class names. Use this instead of string
// concatenation to avoid duplicates and enable conditional merging.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default cn;