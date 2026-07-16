export type SingleSelectionKey = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" | "Home" | "End";

export function nextSingleSelectionIndex(currentIndex: number, key: SingleSelectionKey, count: number, columns = 1): number {
  if (count <= 0) return -1;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  if (key === "ArrowRight") return (currentIndex + 1) % count;
  if (key === "ArrowLeft") return (currentIndex - 1 + count) % count;
  if (key === "ArrowDown") return (currentIndex + columns) % count;
  return (currentIndex - columns + count) % count;
}
