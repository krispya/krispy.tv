export {
  DESK_FOAM_IMAGE,
  deskBackground,
  getDeskBaseStyle,
  getDeskFoamLayerStyle,
  type DeskBackgroundBase,
} from './background.js';
export {
  getSupportZPx,
  MESH_LIFT_SCALE_MAX,
  toMeshLiftScale,
  toTranslateZPx,
  toVisualLiftM,
  TRANSLATE_LIFT_SCALE,
} from './lift.js';
export { type DeskShadowStyle, toShadowStyle } from './shadow.js';
export {
  getPaperLineSrc,
  getPaperLineVariant,
  getPaperLinesBoilPhaseOffset,
  getPaperLinesBoilStartFrame,
  getPaperLinesFrameStyle,
  PAPER_LINES_COLOR,
  getPaperLinesTransform,
  PAPER_LINES_BOIL_CYCLE_SECONDS,
  PAPER_LINES_LAYOUT,
  US_LETTER_LINE_COUNT,
  type PaperLinesLayout,
} from './paper-lines.js';
export {
  getPolaroidCelGlossStripes,
  getPolaroidGlossGradientId,
  getPolaroidGlossPaths,
  POLAROID_GLOSS_OPACITY_BOTTOM,
  POLAROID_GLOSS_OPACITY_TOP,
  type CelGlossStripe,
  type PolaroidGlossPath,
} from './polaroid.js';
export {
  getStageFillScale,
  getStageFillTransform,
  getInverseStageTiltTransform,
  getStagePerspective,
  getStagePerspectiveOrigin,
  getStageTiltTransform,
  STAGE_FILL_OVERSCAN,
  STAGE_PERSPECTIVE_ENABLED,
  STAGE_PERSPECTIVE_ORIGIN_Y,
  STAGE_PERSPECTIVE_PX,
  STAGE_TILT_DEG,
} from './stage.js';
