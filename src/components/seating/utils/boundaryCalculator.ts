export interface CanvasBoundaries {
  width: number;
  height: number;
  padding: number;
}

export interface TableDimensions {
  width: number;
  height: number;
}

export const calculateCanvasBoundaries = (canvasDimensions: {
  width: number;
  height: number;
}): CanvasBoundaries => {
  // Ensure we have valid dimensions
  const safeWidth = Math.max(canvasDimensions.width, 400);
  const safeHeight = Math.max(canvasDimensions.height, 300);

  const padding = Math.min(safeWidth, safeHeight) * 0.02; // 2% padding
  return {
    width: safeWidth,
    height: safeHeight,
    padding: Math.max(padding, 10), // Minimum 10px padding
  };
};

export const constrainPosition = (
  newX: number,
  newY: number,
  tableDimensions: TableDimensions,
  boundaries: CanvasBoundaries,
): { x: number; y: number } => {
  const { width: canvasWidth, height: canvasHeight, padding } = boundaries;
  const { width: tableWidth, height: tableHeight } = tableDimensions;

  const constrainedX = Math.max(padding, Math.min(newX, canvasWidth - tableWidth - padding));
  const constrainedY = Math.max(padding, Math.min(newY, canvasHeight - tableHeight - padding));

  return { x: constrainedX, y: constrainedY };
};
