import { useMemo } from 'react';
import { parseTableDimensions, scaleTableDimensions } from '../utils/dimensionParser';

interface UseTableDimensionsProps {
  tableSize: string;
  tableId: string;
  isRound: boolean;
  getTableScale: () => number;
}

export const useTableDimensions = ({
  tableSize,
  tableId: _tableId,
  isRound,
  getTableScale,
}: UseTableDimensionsProps) => {
  return useMemo(() => {
    const tableScale = getTableScale();

    // Parse base dimensions
    const baseDimensions = parseTableDimensions(tableSize, isRound);

    // Apply scale
    const scaledDimensions = scaleTableDimensions(baseDimensions, tableScale);

    return scaledDimensions;
  }, [tableSize, isRound, getTableScale]);
};
