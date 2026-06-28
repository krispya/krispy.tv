export function getBookDepthMeters(book: {
  coverThickness: number;
  pageCount: number;
  pageThickness: number;
}) {
  // Content page counts are printed pages; the physical stack is paper leaves.
  const leafCount = Math.ceil(book.pageCount / 2);
  return book.coverThickness * 2 + leafCount * book.pageThickness;
}
