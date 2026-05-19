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
  const { destroyPapers, spawnDesk, spawnPaper } = useActions(actions);

  useEffect(() => {
    const featuredItem = items.find((item) => item.openable !== false);

    const desk = spawnDesk();

    items.forEach(({ id }) => {
      spawnPaper({ id, centered: id === featuredItem?.id });
    });

    return () => {
      destroyPapers();
      desk.destroy();
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- mount-only initial spawn
  }, []);

  return null;
}
