export function formatPostDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(`${date}T00:00:00`));
}
