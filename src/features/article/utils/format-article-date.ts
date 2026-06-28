export function formatArticleDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(`${date}T00:00:00`));
}

export function formatTypewriterArticleDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  const year = String(parsed.getFullYear()).slice(-2);
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
}
