import { createContext, useContext, type ReactNode } from 'react';

type DebugContextValue = {
  enabled: boolean;
};

const DebugContext = createContext<DebugContextValue | null>(null);

export function DebugProvider({
  enabled = false,
  children,
}: {
  enabled?: boolean;
  children: ReactNode;
}) {
  return <DebugContext value={{ enabled }}>{children}</DebugContext>;
}

export function useDebug(): DebugContextValue {
  const context = useContext(DebugContext);

  if (!context) {
    throw new Error('useDebug must be used within DebugProvider');
  }

  return context;
}
