export interface ParsedDimensions {
  width: number;
  height: number;
}

export const parseTableDimensions = (tableSize: string, isRound: boolean): ParsedDimensions => {
  if (isRound) {
    // Extract diameter from size string (e.g., "60" diameter")
    const diameter = parseInt(tableSize.match(/\d+/)?.[0] || '60');
    return { width: diameter, height: diameter };
  } else {
    // Extract dimensions from size string (e.g., "72" x 30"")
    const matches = tableSize.match(/(\d+).*?x.*?(\d+)/);
    const width = parseInt(matches?.[1] || '72');
    const height = parseInt(matches?.[2] || '30');
    return { width, height };
  }
};

export const scaleTableDimensions = (
  dimensions: ParsedDimensions,
  scale: number,
): ParsedDimensions => {
  const validScale = typeof scale === 'number' && scale > 0 ? scale : 1;
  return {
    width: dimensions.width * validScale,
    height: dimensions.height * validScale,
  };
};
