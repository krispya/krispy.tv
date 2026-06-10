/**
 * GPU warmup helpers. Decoding images only gets bitmaps into CPU memory; the
 * expensive raster + texture-upload work happens at first composite. These
 * helpers let the scene mount behind the loading screen and report when the
 * compositor has settled into a stable frame rate.
 */

/** Fetches and decodes an image off-DOM so first paint skips the decode cost. */
export function decodeImage(src: string): Promise<void> {
  const image = new Image();
  image.src = src;
  return image.decode().catch(() => {
    // A failed decode shouldn't block warmup; the renderer will surface it.
  });
}

export type StableFramesConfig = Partial<{
  /** Consecutive frames that must land within budget. */
  frameCount: number;
  /** Milliseconds. Per-frame budget; ~20ms allows headroom over 60hz. */
  budgetMs: number;
  /** Milliseconds. Bail out so slow devices aren't stuck on the loading screen. */
  timeoutMs: number;
}>;

/**
 * Resolves once `frameCount` consecutive frames render within `budgetMs`,
 * signalling that raster and texture-upload churn has settled.
 */
export function waitForStableFrames({
  frameCount = 3,
  budgetMs = 20,
  timeoutMs = 1500,
}: StableFramesConfig = {}): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    let last = start;
    let stableCount = 0;

    const probe = (now: number) => {
      const delta = now - last;
      last = now;

      stableCount = delta <= budgetMs ? stableCount + 1 : 0;

      if (stableCount >= frameCount || now - start >= timeoutMs) {
        resolve();
        return;
      }

      requestAnimationFrame(probe);
    };

    // Skip the first delta: it measures time-to-first-frame, not frame pacing.
    requestAnimationFrame((now) => {
      last = now;
      requestAnimationFrame(probe);
    });
  });
}
