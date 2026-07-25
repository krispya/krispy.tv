import {
  CloseControl,
  EnterFullscreenControl,
  ExitFullscreenControl,
  PageControls,
} from '../controls/index.js';
import { routes } from '../../routes.js';

export function ArticleControls({
  onClose,
  onExitFullscreen,
  slug,
  variant = 'sheet',
}: {
  onClose?: () => void;
  onExitFullscreen?: () => Promise<void> | void;
  slug: string;
  variant?: 'sheet' | 'fullscreen';
}) {
  return (
    <PageControls anchor={variant === 'fullscreen' ? 'viewport' : 'page'} label="Article controls">
      {variant === 'sheet' ? (
        <EnterFullscreenControl href={routes.article.href({ slug })} />
      ) : (
        <ExitFullscreenControl onExitFullscreen={onExitFullscreen} />
      )}

      <CloseControl onClose={onClose} />
    </PageControls>
  );
}
