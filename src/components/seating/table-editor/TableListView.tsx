import React from 'react';
import { useSeating } from '@/hooks/useSeating';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table } from 'lucide-react';
import { getCapacityStatus } from './capacityUtils';

export const TableListView = ({ onTableSelect }: { onTableSelect: (tableId: string) => void }) => {
  const { seatingData } = useSeating();

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Table className="h-4 w-4" />
          All Tables ({seatingData.tables.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="overflow-y-auto">
        <div className="space-y-2" role="list" aria-label="Tables">
          {seatingData.tables.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <Table className="mx-auto mb-2 h-8 w-8 opacity-50" aria-hidden="true" />
              <p className="text-sm">No tables created yet</p>
            </div>
          ) : (
            seatingData.tables.map((table) => {
              const currentGuests = table.guests.length;
              const capacityStatus = getCapacityStatus(
                currentGuests,
                table.defaultChairs,
                table.maxChairs,
              );
              const tableNumber = table.tableNumber || table.id.split('-')[1]?.slice(-2) || '1';
              const tableName = table.name || `Table ${tableNumber}`;

              return (
                <div
                  key={table.id}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`${tableName}: ${currentGuests} of ${table.maxChairs} guests, ${capacityStatus.status}`}
                  onClick={() => onTableSelect(table.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onTableSelect(table.id);
                    }
                  }}
                  className="hover:bg-accent focus-visible:ring-primary cursor-pointer rounded-lg border p-3 transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-hidden"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Table {tableNumber}</span>
                      <span className="text-sm font-medium">{tableName}</span>
                    </div>
                    <Badge variant={capacityStatus.color} className="text-xs">
                      {capacityStatus.status}
                    </Badge>
                  </div>

                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>
                      {currentGuests}/{table.maxChairs} guests
                    </span>
                    <div className="bg-muted h-1 w-16 rounded-full">
                      <div
                        className={`h-1 rounded-full transition-all ${
                          currentGuests > table.defaultChairs ? 'bg-warning' : 'bg-primary'
                        }`}
                        style={{
                          width: `${Math.min((currentGuests / table.maxChairs) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
