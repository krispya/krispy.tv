type DeskLayoutConfig = {
  paperViewportScale: number;
  paperMinWidth: number;
  paperMaxWidth: number;
};

type PaperLayoutConfig = {
  aspectRatio: number;
};

export function getPaperBaseWidth(viewportWidth: number, config: DeskLayoutConfig) {
  return Math.min(
    Math.max(viewportWidth * config.paperViewportScale, config.paperMinWidth),
    config.paperMaxWidth
  );
}

export function getPaperSize(
  viewportWidth: number,
  deskConfig: DeskLayoutConfig,
  paperConfig: PaperLayoutConfig
) {
  const width = getPaperBaseWidth(viewportWidth, deskConfig);

  return {
    width,
    height: width / paperConfig.aspectRatio,
  };
}
