export const getCapacityStatus = (
  currentGuests: number,
  defaultChairs: number,
  maxChairs: number,
) => {
  if (currentGuests > maxChairs) return { status: 'Over Maximum', color: 'destructive' as const };
  if (currentGuests === maxChairs) return { status: 'Full', color: 'destructive' as const };
  if (currentGuests > defaultChairs) return { status: 'Over Default', color: 'secondary' as const };
  if (currentGuests > 0) return { status: 'Occupied', color: 'default' as const };
  return { status: 'Available', color: 'outline' as const };
};
