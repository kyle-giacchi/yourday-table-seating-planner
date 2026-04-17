import { useEffect, useRef } from 'react';
import type { Table, Guest } from '@/types/seating';
import type { EntityRefs } from './types';

export const useEntityRefs = (tables: Table[], guests: Guest[]): EntityRefs => {
  const tablesRef = useRef(tables);
  const guestsRef = useRef(guests);
  useEffect(() => {
    tablesRef.current = tables;
  }, [tables]);
  useEffect(() => {
    guestsRef.current = guests;
  }, [guests]);
  return { tablesRef, guestsRef };
};
