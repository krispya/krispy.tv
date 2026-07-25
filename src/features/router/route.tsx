import { Activity, Suspense, useContext, useId, useState, type ReactNode } from 'react';
import {
  matchRoute,
  Route as WouterRoute,
  useLocation,
  useRouter,
  type DefaultParams,
  type Match,
  type PathPattern,
  type RouteProps as WouterRouteProps,
} from 'wouter';
import { SwitchRouteContext } from './switch-context.js';

export type RouteProps<
  T extends DefaultParams | undefined = undefined,
  RoutePath extends PathPattern = PathPattern,
> = WouterRouteProps<T, RoutePath> & {
  /** Wrap route content in `<Suspense>` with this fallback while lazy content loads. */
  fallback?: ReactNode;
  /**
   * Cache the route content after it first matches, hiding it with
   * React `<Activity>` instead of unmounting. State is preserved and effects
   * are cleaned up while hidden. Content is only mounted after the route
   * matches for the first time.
   */
  cache?: boolean;
};

// wouter's Route accepts an (untyped) internal `match` prop used by `Switch`
// to pass down the match result and skip double matching.
const RouteImpl = WouterRoute as (props: WouterRouteProps & { match?: Match }) => ReactNode;

export function Route<
  T extends DefaultParams | undefined = undefined,
  RoutePath extends PathPattern = PathPattern,
>(routeProps: RouteProps<T, RoutePath>) {
  const { cache, fallback, ...props } = routeProps;
  const routeId = useId();
  const router = useRouter();
  const [routerLocation] = useLocation();
  const switchRoute = useContext(SwitchRouteContext);
  const location = switchRoute?.location ?? routerLocation;

  const routeMatch = matchRoute(router.parser, props.path ?? '*', location, props.nest);
  const currentMatch = switchRoute?.claim(routeId, routeMatch) ?? routeMatch;
  const [matches] = currentMatch;

  // Remember the last matched location so hidden content keeps its params.
  const [lastMatchedLocation, setLastMatchedLocation] = useState<string | null>(null);
  if (matches && location !== lastMatchedLocation) setLastMatchedLocation(location);

  const renderContent = (routeMatch: Match) => {
    const content = <RouteImpl {...(props as WouterRouteProps)} match={routeMatch} />;

    return fallback !== undefined ? <Suspense fallback={fallback}>{content}</Suspense> : content;
  };

  if (!cache) return renderContent(currentMatch);

  const renderMatch: Match = matches
    ? currentMatch
    : lastMatchedLocation !== null
      ? matchRoute(router.parser, props.path ?? '*', lastMatchedLocation, props.nest)
      : [false, null];

  // Only mount content after the route has matched at least once.
  if (!renderMatch[0]) return null;

  return <Activity mode={matches ? 'visible' : 'hidden'}>{renderContent(renderMatch)}</Activity>;
}
