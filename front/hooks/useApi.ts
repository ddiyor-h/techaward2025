/**
 * React Hooks for API Data Fetching
 */

import { useState, useEffect, useCallback } from 'react';
import { buildingsApi } from '../api/buildings';
import type {
  BuildingListResponse,
  Building,
  EnergyDataResponse,
  EquipmentListResponse,
  AlertListResponse,
  HVACStatusResponse,
  IAQStatusResponse,
  KPIsResponse,
} from '../api/types';

// Generic API state
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// Generic hook for API calls
function useApiCall<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): ApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// Buildings list hook
export function useBuildings() {
  return useApiCall<BuildingListResponse>(() => buildingsApi.list(), []);
}

// Single building hook
export function useBuilding(buildingId: string) {
  return useApiCall<Building>(
    () => buildingsApi.get(buildingId),
    [buildingId]
  );
}

// Energy data hook
export function useEnergy(
  buildingId: string,
  options?: {
    from?: Date;
    to?: Date;
    resolution?: 'hourly' | 'daily' | 'monthly';
  }
) {
  return useApiCall<EnergyDataResponse>(
    () => buildingsApi.getEnergy(buildingId, options),
    [buildingId, options?.from?.getTime(), options?.to?.getTime(), options?.resolution]
  );
}

// Equipment hook
export function useEquipment(buildingId: string) {
  return useApiCall<EquipmentListResponse>(
    () => buildingsApi.getEquipment(buildingId),
    [buildingId]
  );
}

// Alerts hook
export function useAlerts(buildingId: string) {
  return useApiCall<AlertListResponse>(
    () => buildingsApi.getAlerts(buildingId),
    [buildingId]
  );
}

// HVAC status hook
export function useHvac(buildingId: string) {
  return useApiCall<HVACStatusResponse>(
    () => buildingsApi.getHvac(buildingId),
    [buildingId]
  );
}

// IAQ status hook
export function useIaq(buildingId: string) {
  return useApiCall<IAQStatusResponse>(
    () => buildingsApi.getIaq(buildingId),
    [buildingId]
  );
}

// KPIs hook
export function useKpis(
  buildingId: string,
  period?: 'today' | 'week' | 'month' | 'year'
) {
  return useApiCall<KPIsResponse>(
    () => buildingsApi.getKpis(buildingId, period),
    [buildingId, period]
  );
}
