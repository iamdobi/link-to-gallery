export function distributeMasonryItems<T>(items: readonly T[], columnCount: number): T[][] {
  const columns = Array.from({ length: Math.max(1, Math.floor(columnCount)) }, () => [] as T[]);
  items.forEach((item, index) => {
    columns[index % columns.length].push(item);
  });
  return columns;
}
