import { cssPixelsToMeters } from './physics-units.js';

export const US_LETTER_INCHES = {
  width: 8.5,
  height: 11,
} as const;

export const DESK_PIXELS_PER_INCH = 380 / US_LETTER_INCHES.width;

export const DEFAULT_BOOK_COVER_THICKNESS_INCHES = 0.03;
export const DEFAULT_BOOK_PAGE_THICKNESS_INCHES = 0.0031;

export function inchesToDeskPixels(inches: number) {
  return inches * DESK_PIXELS_PER_INCH;
}

export function inchesToDeskMeters(inches: number) {
  return cssPixelsToMeters(inchesToDeskPixels(inches));
}
