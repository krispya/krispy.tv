import { useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { posts } from '../../core/posts/index.js';
import { routes } from '../../routes.js';
import { DeskStage, type DeskStageItem } from './desk-stage.js';
import { getPostPaperStyle, PostPaper } from './post-paper.js';

const emptyPapers = [
  { id: 'empty-page-1', backgroundColor: '#fffdf7', borderColor: '#d8d1c4' },
  { id: 'empty-page-2', backgroundColor: '#f6f0df', borderColor: '#d4c49c' },
  { id: 'empty-page-3', backgroundColor: '#e9f1f5', borderColor: '#b8c8d0' },
];

export function DeskScene() {
  const [, navigate] = useLocation();
  const deskItems = useMemo<DeskStageItem[]>(
    () => [
      ...emptyPapers.map((paper) => ({
        id: paper.id,
        ariaLabel: 'Blank sheet of paper',
        openable: false,
        style: {
          backgroundColor: paper.backgroundColor,
          borderColor: paper.borderColor,
        },
      })),
      ...posts.map((post) => ({
        id: post.slug,
        ariaLabel: `Open ${post.title}`,
        style: getPostPaperStyle(post),
      })),
    ],
    []
  );
  const postBySlug = useMemo(() => new Map(posts.map((post) => [post.slug, post])), []);

  const handleOpenPost = useCallback(
    (slug: string) => {
      navigate(routes.blogPost.href({ slug }));
    },
    [navigate]
  );

  return (
    <DeskStage
      items={deskItems}
      onItemOpen={handleOpenPost}
      className="bg-[radial-gradient(circle_at_18%_20%,rgba(244,244,239,0.42),transparent_28%),linear-gradient(135deg,#879080,#b8b2a5_58%,#6f7b75)]"
      renderItem={(slug) => {
        const post = postBySlug.get(slug);

        return post ? <PostPaper post={post} /> : <BlankPaper />;
      }}
    />
  );
}

function BlankPaper() {
  return (
    <div className="flex h-full flex-col opacity-70" aria-hidden="true">
      <div className="h-8 border-b border-stone-300/70" />
      <div className="mt-8 space-y-4">
        <div className="h-px bg-stone-300/70" />
        <div className="h-px bg-stone-300/70" />
        <div className="h-px bg-stone-300/70" />
        <div className="h-px w-3/5 bg-stone-300/70" />
      </div>
      <div className="mt-auto h-20 border border-dashed border-stone-300/70" />
    </div>
  );
}
