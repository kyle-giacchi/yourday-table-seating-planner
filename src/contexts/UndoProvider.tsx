import React, { useState } from 'react';
import { UndoContext, type LastAssignment } from './UndoContext';

export const UndoProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastAssignment, setLastAssignment] = useState<LastAssignment | null>(null);
  return (
    <UndoContext.Provider value={{ lastAssignment, setLastAssignment }}>
      {children}
    </UndoContext.Provider>
  );
};
