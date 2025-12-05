/**
 * Buildings API Service
 */

import { fetchAPI, buildQueryString } from './client';
import type {
  BuildingListResponse,
  BuildingResponse,
  EnergyDataResponse,
  EquipmentListResponse,
  AlertListResponse,
  HVACStatusResponse,
  IAQStatusResponse,
  KPIsResponse,
  SetpointUpdateRequest,
  SetpointResponse,
} from './types';

const BASE_PATH = '/api/v1/buildings';

export const buildingsApi = {
  /**
   * Get list of all buildings
   */
  list: (): Promise<BuildingListResponse> => {
    return fetchAPI<BuildingListResponse>(BASE_PATH);
  },

  /**
   * Get building details by ID
   */
  get: (buildingId: string): Promise<BuildingResponse> => {
    return fetchAPI<BuildingResponse>(`${BASE_PATH}/${buildingId}`);
  },

  /**
   * Get energy consumption data
   */
  getEnergy: (
    buildingId: string,
    options?: {
      from?: Date;
      to?: Date;
      resolution?: 'hourly' | 'daily' | 'monthly';
    }
  ): Promise<EnergyDataResponse> => {
    const query = buildQueryString({
      from: options?.from,
      to: options?.to,
      resolution: options?.resolution,
    });
    return fetchAPI<EnergyDataResponse>(`${BASE_PATH}/${buildingId}/energy${query}`);
  },

  /**
   * Get equipment list
   */
  getEquipment: (buildingId: string): Promise<EquipmentListResponse> => {
    return fetchAPI<EquipmentListResponse>(`${BASE_PATH}/${buildingId}/equipment`);
  },

  /**
   * Get alerts
   */
  getAlerts: (buildingId: string): Promise<AlertListResponse> => {
    return fetchAPI<AlertListResponse>(`${BASE_PATH}/${buildingId}/alerts`);
  },

  /**
   * Get HVAC status
   */
  getHvac: (buildingId: string): Promise<HVACStatusResponse> => {
    return fetchAPI<HVACStatusResponse>(`${BASE_PATH}/${buildingId}/hvac`);
  },

  /**
   * Get Indoor Air Quality data
   */
  getIaq: (buildingId: string): Promise<IAQStatusResponse> => {
    return fetchAPI<IAQStatusResponse>(`${BASE_PATH}/${buildingId}/iaq`);
  },

  /**
   * Get KPIs
   */
  getKpis: (
    buildingId: string,
    period?: 'today' | 'week' | 'month' | 'year'
  ): Promise<KPIsResponse> => {
    const query = buildQueryString({ period });
    return fetchAPI<KPIsResponse>(`${BASE_PATH}/${buildingId}/kpis${query}`);
  },

  /**
   * Update zone setpoints
   */
  updateSetpoint: (
    buildingId: string,
    data: SetpointUpdateRequest
  ): Promise<SetpointResponse> => {
    return fetchAPI<SetpointResponse>(`${BASE_PATH}/${buildingId}/setpoints`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
