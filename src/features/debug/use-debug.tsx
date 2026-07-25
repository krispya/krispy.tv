export function useDebug() {
  return { enabled: getDebugEnabled() };
}

function getDebugEnabled() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  if (!params.has('debug')) return false;

  const value = params.get('debug')?.toLowerCase() ?? '';
  return value === '' || !['0', 'false', 'off'].includes(value);
}
