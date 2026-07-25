import { Spinner } from './spinner.js';

export function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Spinner />
    </div>
  );
}
