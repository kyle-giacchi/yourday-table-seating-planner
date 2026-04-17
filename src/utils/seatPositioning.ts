export interface SeatPosition {
  x: number;
  y: number;
  id: string;
  occupied: boolean;
  guestName?: string;
}

export const calculateRoundTableSeats = (
  tableWidth: number,
  tableHeight: number,
  seatCount: number,
): SeatPosition[] => {
  const radius = tableWidth / 2;
  const centerX = tableWidth / 2;
  const centerY = tableHeight / 2;
  const seatRadius = 6;
  const spacing = 3;
  const outerRadius = radius + seatRadius + spacing;

  return Array.from({ length: seatCount }, (_, i) => {
    // Start at 12 o'clock (-π/2) and go clockwise
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / seatCount;
    return {
      x: centerX + outerRadius * Math.cos(angle),
      y: centerY + outerRadius * Math.sin(angle),
      id: `seat-${i}`,
      occupied: false,
    };
  });
};

export const calculateRectangleTableSeats = (
  tableWidth: number,
  tableHeight: number,
  seatCount: number,
): SeatPosition[] => {
  const seatRadius = 6;
  const spacing = 3;
  const seatsPerSide = Math.ceil(seatCount / 2);
  const positions: SeatPosition[] = [];

  // Calculate spacing along the long side (width)
  const seatSpacing = tableWidth / (seatsPerSide + 1);

  // Top side seats
  const topSeats = Math.ceil(seatCount / 2);
  for (let i = 0; i < topSeats; i++) {
    positions.push({
      x: seatSpacing * (i + 1),
      y: -seatRadius - spacing,
      id: `seat-top-${i}`,
      occupied: false,
    });
  }

  // Bottom side seats — reversed (R→L) so numbering wraps clockwise
  const bottomSeats = Math.floor(seatCount / 2);
  for (let i = bottomSeats - 1; i >= 0; i--) {
    positions.push({
      x: seatSpacing * (i + 1),
      y: tableHeight + seatRadius + spacing,
      id: `seat-bottom-${bottomSeats - 1 - i}`,
      occupied: false,
    });
  }

  return positions;
};
