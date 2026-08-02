import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateCleanSku(productName: string, size?: string, index = 0) {
  if (!productName) return `SKU-${1000 + index}`;
  const words = productName.trim().split(/\s+/).filter(Boolean);
  let initials = words.map((w) => w[0].toUpperCase()).join('').substring(0, 3);
  if (initials.length < 2 && words[0]) {
    initials = words[0].substring(0, 2).toUpperCase();
  }
  if (!initials) initials = 'PRD';

  let hash = 0;
  for (let i = 0; i < productName.length; i++) {
    hash = (hash * 31 + productName.charCodeAt(i)) & 0xffffffff;
  }
  const baseNum = (Math.abs(hash) % 8000) + 1000 + (index * 7);

  if (size) {
    return `${initials}-${size.toUpperCase()}-${baseNum}`;
  }
  return `${initials}-${baseNum}`;
}
