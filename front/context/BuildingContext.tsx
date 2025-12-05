/**
 * Building Context - Global state for selected building
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useBuildings } from '../hooks/useApi';
import type { Building } from '../api/types';

interface BuildingContextType {
  buildings: Building[];
  selectedBuilding: Building | null;
  selectedBuildingId: string;
  setSelectedBuildingId: (id: string) => void;
  loading: boolean;
  error: Error | null;
}

const BuildingContext = createContext<BuildingContextType | undefined>(undefined);

const DEFAULT_BUILDING_ID = 'pleiades-a';

interface BuildingProviderProps {
  children: ReactNode;
}

export function BuildingProvider({ children }: BuildingProviderProps) {
  const { data, loading, error } = useBuildings();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(DEFAULT_BUILDING_ID);

  const buildings = data?.buildings ?? [];
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId) ?? null;

  // Auto-select first building if current selection is invalid
  useEffect(() => {
    if (buildings.length > 0 && !selectedBuilding) {
      setSelectedBuildingId(buildings[0].id);
    }
  }, [buildings, selectedBuilding]);

  return (
    <BuildingContext.Provider
      value={{
        buildings,
        selectedBuilding,
        selectedBuildingId,
        setSelectedBuildingId,
        loading,
        error,
      }}
    >
      {children}
    </BuildingContext.Provider>
  );
}

export function useBuildingContext() {
  const context = useContext(BuildingContext);
  if (context === undefined) {
    throw new Error('useBuildingContext must be used within a BuildingProvider');
  }
  return context;
}
