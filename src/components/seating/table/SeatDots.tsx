import React, { useMemo } from 'react';
import type { Guest } from '@/types/seating';
import { calculateRoundTableSeats, calculateRectangleTableSeats } from '@/utils/seatPositioning';
import { getPositionColor } from '@/utils/positionColors';

export interface SeatDotsProps {
  tableWidth: number;
  tableHeight: number;
  isRound: boolean;
  guestCount: number;
  defaultChairs: number;
  guests: Guest[];
  recentlyAssigned: boolean;
  highlightedSeatIndex?: number | null;
  showPositions?: boolean;
  /** Snapshot map of guestId → colorIndex for stable colors during reorder */
  guestPositionColorMap?: Record<string, number>;
}

// Half the seat dot diameter — used to centre the 12 px circles on their
// computed position coordinates.
const SEAT_RADIUS = 6;

const EMPTY_COLOR_MAP: Record<string, number> = {};

export const SeatDots = ({
  tableWidth,
  tableHeight,
  isRound,
  guestCount,
  defaultChairs,
  guests,
  recentlyAssigned,
  highlightedSeatIndex,
  showPositions = false,
  guestPositionColorMap = EMPTY_COLOR_MAP,
}: SeatDotsProps) => {
  const { occupiedSeats, availableSeats } = useMemo(() => {
    const totalSeatsToShow = Math.max(guestCount, defaultChairs);

    const allPositions = isRound
      ? calculateRoundTableSeats(tableWidth, tableHeight, totalSeatsToShow)
      : calculateRectangleTableSeats(tableWidth, tableHeight, totalSeatsToShow);

    const occupied = allPositions.slice(0, guestCount).map((pos, index) => ({
      ...pos,
      occupied: true,
      guestName: guests[index]?.fullName ?? 'Guest',
      seatNumber: index + 1,
    }));

    // Only show empty seat dots for seats below the default capacity
    const available =
      guestCount < defaultChairs
        ? allPositions.slice(guestCount, defaultChairs).map((pos, index) => ({
            ...pos,
            seatNumber: guestCount + index + 1,
          }))
        : [];

    return { occupiedSeats: occupied, availableSeats: available };
  }, [tableWidth, tableHeight, isRound, guestCount, defaultChairs, guests]);

  // Flash only the last filled seat when a guest was just assigned
  const lastFilledIndex = recentlyAssigned && guestCount > 0 ? guestCount - 1 : -1;

  return (
    <>
      {occupiedSeats.map((seat, index) => {
        const guest = guests[index];
        const colorIndex =
          showPositions && guest && guestPositionColorMap[guest.id] != null
            ? guestPositionColorMap[guest.id]
            : index;
        const posColor = getPositionColor(colorIndex);
        return (
          <div
            key={seat.id}
            className="pointer-events-none absolute"
            style={{
              left: seat.x - SEAT_RADIUS,
              top: seat.y - SEAT_RADIUS,
              width: 12,
              height: 12,
              zIndex: 1,
            }}
          >
            <div
              className={`h-3 w-3 rounded-full transition-all ${
                !showPositions ? 'bg-primary border-primary/80 border' : ''
              } ${index === lastFilledIndex ? 'animate-seat-flash' : ''} ${
                highlightedSeatIndex === index ? 'animate-seat-highlight' : ''
              }`}
              style={
                showPositions
                  ? {
                      backgroundColor: posColor.dot,
                      border: `1px solid ${posColor.dot}`,
                      boxShadow: `0 0 0 3px ${posColor.ring}`,
                    }
                  : undefined
              }
              title={`#${seat.seatNumber} ${seat.guestName}`}
            />
          </div>
        );
      })}

      {availableSeats.map((seat) => (
        <div
          key={seat.id}
          className="pointer-events-none absolute"
          style={{
            left: seat.x - SEAT_RADIUS,
            top: seat.y - SEAT_RADIUS,
            width: 12,
            height: 12,
            zIndex: 1,
          }}
        >
          <div className="bg-muted border-muted-foreground/40 h-3 w-3 rounded-full border transition-colors" />
        </div>
      ))}
    </>
  );
};
