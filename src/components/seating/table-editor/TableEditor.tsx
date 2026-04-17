import React from 'react';
import { useSeating } from '@/hooks/useSeating';
import { TableListView } from './TableListView';
import { TableDetailView } from './TableDetailView';

export const TableEditor = () => {
  const { selectedTableId, seatingData, selectTable, clearSelection } = useSeating();

  const selectedTable = selectedTableId
    ? seatingData.tables.find((t) => t.id === selectedTableId)
    : null;

  const handleTableSelect = (tableId: string) => {
    selectTable(tableId);
  };

  const handleClose = () => {
    clearSelection();
  };

  if (selectedTable) {
    return <TableDetailView table={selectedTable} onClose={handleClose} />;
  }

  return <TableListView onTableSelect={handleTableSelect} />;
};
