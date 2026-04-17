/** Shape of the client-computed banquet summary view model. */
export interface BanquetSummaryData {
  tableTypeSummary: Array<{ type: string; count: number; totalSeats: number; shape: string }>;
  extraSeatTables: Array<{
    tableNumber: number;
    tableName: string;
    defaultSeats: number;
    currentSeats: number;
    extraSeats: number;
  }>;
  foodSummary: Array<{ mealType: string; count: number; percentage: number }>;
  tableAssignments: Array<{
    tableNumber: number;
    tableName: string;
    tableSize: string;
    shape: 'round' | 'rectangle';
    capacity: number;
    defaultChairs: number;
    isHeadTable?: boolean;
    guests: Array<{
      name: string;
      mealSelection: string;
      allergyFlags?: string[];
      dietaryNotes?: string;
    }>;
  }>;
  totalTables: number;
  totalChairs: number;
  totalGuests: number;
  assignedGuests: number;
  unassignedGuests: number;
}
