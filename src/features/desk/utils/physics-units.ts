const CSS_PIXELS_PER_INCH = 96;
const INCHES_PER_METER = 39.37007874015748;

export const GRAVITY_METERS_PER_SECOND_SQUARED = 9.80665;
export const CSS_PIXELS_PER_METER = CSS_PIXELS_PER_INCH * INCHES_PER_METER;

export function metersToCssPixels(meters: number) {
  return meters * CSS_PIXELS_PER_METER;
}

export function cssPixelsToMeters(cssPixels: number) {
  return cssPixels / CSS_PIXELS_PER_METER;
}
