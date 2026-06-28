import React from 'react';
import type { CSSProperties, ReactNode } from 'react';

export const TYPEWRITER_TAKUMI_FONT_FAMILY = 'Type Machine';

export type TypewriterTakumiArticle = {
  title: string;
  date: string;
};

type TakumiElementProps = {
  children?: ReactNode;
  style?: CSSProperties;
  tw?: string;
};

const TakumiDiv = 'div' as unknown as (props: TakumiElementProps) => ReactNode;
const TakumiSpan = 'span' as unknown as (props: TakumiElementProps) => ReactNode;

export function TypewriterTakumi({
  article,
  body,
  formatDate,
  width,
  height,
  padding,
  backgroundColor,
}: {
  article: TypewriterTakumiArticle;
  body: ReactNode;
  formatDate: (date: string) => string;
  width: number;
  height: number;
  padding: number;
  backgroundColor: string;
}) {
  return (
    <TakumiDiv
      tw="flex flex-col"
      style={{
        width,
        height,
        padding: 92,
        backgroundColor,
        fontFamily: TYPEWRITER_TAKUMI_FONT_FAMILY,
      }}
    >
      <TakumiDiv tw="mt-8">
        <TakumiSpan tw="text-xl text-gray-950 leading-tight">{article.title}</TakumiSpan>
      </TakumiDiv>
      <TakumiDiv tw="mt-8 flex flex-col text-[15px] text-gray-800 leading-7">
        {body}
        <TakumiDiv tw="h-7" />
        <TakumiDiv tw="h-7" />
        <TakumiSpan>{formatDate(article.date)}</TakumiSpan>
      </TakumiDiv>
    </TakumiDiv>
  );
}
