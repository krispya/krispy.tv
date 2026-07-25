import { useLocation } from 'wouter';
import { routes } from '../../routes.js';
import { ArticleFullscreen } from './article.js';

export function ArticleRoute({ slug }: { slug: string }) {
  const [, navigate] = useLocation();

  function exitFullscreen() {
    navigate(routes.desk.href());
  }

  return <ArticleFullscreen onExitFullscreen={exitFullscreen} slug={slug} />;
}
