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
  const { destroyPapers, spawnDesk, spawnPaper, throwPaperOntoDesk } = useActions(actions);

  useEffect(() => {
    const desk = spawnDesk();

    items.forEach(({ id }, index) => {
      const centered = index === 0;
      const stackIndex = items.length - index - 1;
      const paper = spawnPaper({ id, stackIndex, centered });

      throwPaperOntoDesk(paper, { centered });
    });

    return () => {
      destroyPapers();
      desk.destroy();
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- mount-only initial spawn
  }, []);

  return null;
}
