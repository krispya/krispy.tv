import { createContext } from 'react';
import type { Match } from 'wouter';

export type SwitchRouteState = {
  claim: (routeId: string, match: Match) => Match;
  location: string;
};

export const SwitchRouteContext = createContext<SwitchRouteState | null>(null);
