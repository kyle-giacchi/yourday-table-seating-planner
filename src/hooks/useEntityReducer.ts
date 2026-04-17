import { useReducer, useCallback } from 'react';

interface EntityState<T> {
  entities: T[];
}

type EntityAction<T> =
  | { type: 'ADD_ENTITY'; payload: T }
  | {
      type: 'UPDATE_ENTITY';
      payload: { id: string; updates: Partial<T> | ((entity: T) => Partial<T>) };
    }
  | { type: 'REMOVE_ENTITY'; payload: string }
  | { type: 'SET_ENTITIES'; payload: T[] };

function createEntityReducer<T extends { id: string }>() {
  return (state: EntityState<T>, action: EntityAction<T>): EntityState<T> => {
    switch (action.type) {
      case 'ADD_ENTITY':
        return { entities: [...state.entities, action.payload] };
      case 'UPDATE_ENTITY':
        return {
          entities: state.entities.map((entity) => {
            if (entity.id === action.payload.id) {
              const updates =
                typeof action.payload.updates === 'function'
                  ? action.payload.updates(entity)
                  : action.payload.updates;
              return { ...entity, ...updates };
            }
            return entity;
          }),
        };
      case 'REMOVE_ENTITY':
        return {
          entities: state.entities.filter((entity) => entity.id !== action.payload),
        };
      case 'SET_ENTITIES':
        return { entities: action.payload };
      default:
        return state;
    }
  };
}

export const useEntityReducer = <T extends { id: string }>(initialEntities: T[]) => {
  const entityReducer = createEntityReducer<T>();
  const [state, dispatch] = useReducer(entityReducer, { entities: initialEntities });

  const addEntity = useCallback((entity: T) => {
    dispatch({ type: 'ADD_ENTITY', payload: entity });
  }, []);

  const updateEntity = useCallback(
    (id: string, updates: Partial<T> | ((entity: T) => Partial<T>)) => {
      dispatch({ type: 'UPDATE_ENTITY', payload: { id, updates } });
    },
    [],
  );

  const removeEntity = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ENTITY', payload: id });
  }, []);

  const setEntities = useCallback((entities: T[]) => {
    dispatch({ type: 'SET_ENTITIES', payload: entities });
  }, []);

  return {
    entities: state.entities,
    addEntity,
    updateEntity,
    removeEntity,
    setEntities,
  };
};
