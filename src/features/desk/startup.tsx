import { useActions } from 'koota/react';
import { useEffect } from 'react';
import { actions } from './actions.js';

type StartupProps = {
  items: readonly {
    id: string;
    openable?: boolean;
  }[];
};

export function Startup({ items }: StartupProps) {
  const { resetDeskItems, spawnDeskItem } = useActions(actions);

  useEffect(() => {
    const featuredItem = items.find((item) => item.openable !== false);

    items.forEach(({ id }) => {
      spawnDeskItem({ id, centered: id === featuredItem?.id });
    });

    return () => resetDeskItems();
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- mount-only initial spawn
  }, []);

  return null;
}
