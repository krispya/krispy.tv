import { CloseControl, ControlButton, ControlIcon, PageControls } from '../controls/index.js';

export function SketchControls({ onClear, onClose }: { onClear: () => void; onClose?: () => void }) {
  return (
    <PageControls label="Sketch controls">
      <ControlButton label="Clear drawing" onClick={onClear}>
        <ControlIcon>
          <path d="M4 5.5h12" />
          <path d="M8 5.5V3.5h4v2" />
          <path d="M5.5 5.5 6.5 17h7l1-11.5" />
        </ControlIcon>
      </ControlButton>

      <CloseControl onClose={onClose} />
    </PageControls>
  );
}
