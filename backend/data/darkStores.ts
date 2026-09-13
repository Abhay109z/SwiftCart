import { DarkStore } from '../types.js';

export const mockDarkStores: DarkStore[] = [
  {
    id: 'ds-blr-01',
    name: 'Koramangala 4th Block Hub',
    code: 'BLR-KRM-04',
    address: '80 Feet Rd, 4th Block, Koramangala, Bengaluru',
    lat: 12.9352,
    lng: 77.6245,
    coverageRadiusKm: 3.2,
    activePickers: 8,
    activeRiders: 14,
    capacityUtilization: 72,
    status: 'optimal'
  },
  {
    id: 'ds-blr-02',
    name: 'Indiranagar 100ft Hub',
    code: 'BLR-IND-02',
    address: '100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru',
    lat: 12.9719,
    lng: 77.6412,
    coverageRadiusKm: 3.0,
    activePickers: 12,
    activeRiders: 22,
    capacityUtilization: 88,
    status: 'surge'
  },
  {
    id: 'ds-blr-03',
    name: 'HSR Layout Sector 2 Hub',
    code: 'BLR-HSR-07',
    address: '27th Main Rd, Sector 2, HSR Layout, Bengaluru',
    lat: 12.9121,
    lng: 77.6446,
    coverageRadiusKm: 3.5,
    activePickers: 6,
    activeRiders: 10,
    capacityUtilization: 65,
    status: 'optimal'
  },
  {
    id: 'ds-blr-04',
    name: 'Bellandur EcoSpace Hub',
    code: 'BLR-BLD-09',
    address: 'Outer Ring Rd, Green Glen Layout, Bellandur, Bengaluru',
    lat: 12.9260,
    lng: 77.6762,
    coverageRadiusKm: 2.8,
    activePickers: 9,
    activeRiders: 16,
    capacityUtilization: 81,
    status: 'busy'
  }
];
