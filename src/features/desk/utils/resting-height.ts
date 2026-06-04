export function getBookDepthMeters(book: {
  coverThickness: number;
  pageCount: number;
  pageThickness: number;
}) {
  return book.coverThickness * 2 + book.pageCount * book.pageThickness;
}
