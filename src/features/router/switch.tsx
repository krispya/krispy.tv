import { type ReactNode } from 'react';
import { useLocation, type Match, type SwitchProps } from 'wouter';
import { SwitchRouteContext, type SwitchRouteState } from './switch-context.js';

const noMatch: Match = [false, null];

function createSwitchRouteState(location: string): SwitchRouteState {
  let selectedRouteId: string | null = null;

  return {
    claim(routeId, match) {
      if (!match[0]) {
        if (selectedRouteId === routeId) selectedRouteId = null;
        return noMatch;
      }

      if (selectedRouteId !== null && selectedRouteId !== routeId) return noMatch;

      selectedRouteId = routeId;
      return match;
    },
    location,
  };
}

export function Switch({ children, location }: SwitchProps): ReactNode {
  const [originalLocation] = useLocation();
  const switchLocation = location ?? originalLocation;

  return (
    <SwitchRouteContext.Provider value={createSwitchRouteState(switchLocation)}>
      {children}
    </SwitchRouteContext.Provider>
  );
}
