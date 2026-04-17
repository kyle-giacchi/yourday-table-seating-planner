export enum CapacityStatus {
  WITHIN_DEFAULT = 'within_default',
  EXCEEDS_DEFAULT = 'exceeds_default',
  EXCEEDS_MAXIMUM = 'exceeds_maximum',
}

export interface CapacityCheckResult {
  status: CapacityStatus;
  currentCount: number;
  newCount: number;
  defaultCapacity: number;
  maxCapacity: number;
  assignmentSize: number;
}

export const checkCapacityStatus = (
  table: { guests: { id: string }[]; defaultChairs: number; maxChairs: number },
  assignmentSize: number,
): CapacityCheckResult => {
  const currentCount = table.guests.length;
  const newCount = currentCount + assignmentSize;
  const defaultCapacity = table.defaultChairs;
  const maxCapacity = table.maxChairs;

  let status: CapacityStatus;

  if (newCount <= defaultCapacity) {
    status = CapacityStatus.WITHIN_DEFAULT;
  } else if (newCount <= maxCapacity) {
    status = CapacityStatus.EXCEEDS_DEFAULT;
  } else {
    status = CapacityStatus.EXCEEDS_MAXIMUM;
  }

  return {
    status,
    currentCount,
    newCount,
    defaultCapacity,
    maxCapacity,
    assignmentSize,
  };
};
