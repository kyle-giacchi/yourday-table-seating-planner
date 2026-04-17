import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEntityReducer } from '@/hooks/useEntityReducer';

interface TestEntity {
  id: string;
  name: string;
  count: number;
}

const make = (id: string, name: string, count = 0): TestEntity => ({ id, name, count });

describe('useEntityReducer', () => {
  it('initializes with the given entities', () => {
    const initial = [make('a', 'Alpha'), make('b', 'Beta')];
    const { result } = renderHook(() => useEntityReducer<TestEntity>(initial));
    expect(result.current.entities).toHaveLength(2);
    expect(result.current.entities[0].name).toBe('Alpha');
  });

  it('addEntity appends to the list (immutably)', () => {
    const { result } = renderHook(() => useEntityReducer<TestEntity>([make('a', 'Alpha')]));
    const before = result.current.entities;

    act(() => {
      result.current.addEntity(make('b', 'Beta'));
    });

    expect(result.current.entities).toHaveLength(2);
    expect(result.current.entities).not.toBe(before); // new array reference
    expect(result.current.entities.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('removeEntity drops the matching id and leaves others alone', () => {
    const { result } = renderHook(() =>
      useEntityReducer<TestEntity>([make('a', 'Alpha'), make('b', 'Beta'), make('c', 'Gamma')]),
    );

    act(() => {
      result.current.removeEntity('b');
    });

    expect(result.current.entities.map((e) => e.id)).toEqual(['a', 'c']);
  });

  it('removeEntity is a no-op when the id is not found', () => {
    const initial = [make('a', 'Alpha')];
    const { result } = renderHook(() => useEntityReducer<TestEntity>(initial));

    act(() => {
      result.current.removeEntity('does-not-exist');
    });

    expect(result.current.entities.map((e) => e.id)).toEqual(['a']);
  });

  it('updateEntity with an object payload merges shallow updates onto the matching entity only', () => {
    const { result } = renderHook(() =>
      useEntityReducer<TestEntity>([make('a', 'Alpha'), make('b', 'Beta', 5)]),
    );

    act(() => {
      result.current.updateEntity('b', { name: 'Beta-Renamed' });
    });

    const a = result.current.entities.find((e) => e.id === 'a')!;
    const b = result.current.entities.find((e) => e.id === 'b')!;
    expect(a.name).toBe('Alpha'); // untouched
    expect(b.name).toBe('Beta-Renamed');
    expect(b.count).toBe(5); // existing fields preserved
  });

  it('updateEntity accepts a function payload that receives the previous entity', () => {
    const { result } = renderHook(() => useEntityReducer<TestEntity>([make('a', 'Alpha', 1)]));

    act(() => {
      result.current.updateEntity('a', (prev) => ({ count: prev.count + 10 }));
    });

    expect(result.current.entities[0].count).toBe(11);
  });

  it('updateEntity is a no-op when the id is not found', () => {
    const initial = [make('a', 'Alpha')];
    const { result } = renderHook(() => useEntityReducer<TestEntity>(initial));

    act(() => {
      result.current.updateEntity('ghost', { name: 'Boo' });
    });

    expect(result.current.entities[0].name).toBe('Alpha');
  });

  it('setEntities replaces the entire list', () => {
    const { result } = renderHook(() =>
      useEntityReducer<TestEntity>([make('a', 'Alpha'), make('b', 'Beta')]),
    );

    act(() => {
      result.current.setEntities([make('c', 'Gamma')]);
    });

    expect(result.current.entities).toHaveLength(1);
    expect(result.current.entities[0].id).toBe('c');
  });

  it('action creators have stable identities across renders (no infinite loops in consumers)', () => {
    const { result, rerender } = renderHook(() =>
      useEntityReducer<TestEntity>([make('a', 'Alpha')]),
    );
    const firstAdd = result.current.addEntity;
    const firstUpdate = result.current.updateEntity;
    const firstRemove = result.current.removeEntity;
    const firstSet = result.current.setEntities;

    rerender();

    expect(result.current.addEntity).toBe(firstAdd);
    expect(result.current.updateEntity).toBe(firstUpdate);
    expect(result.current.removeEntity).toBe(firstRemove);
    expect(result.current.setEntities).toBe(firstSet);
  });
});
