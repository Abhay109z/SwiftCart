import { Rider } from '../types.js';

export const mockRiders: Rider[] = [
  {
    id: 'rider-01',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    vehicle: 'Ather 450X EV Scooter',
    vehicleNumber: 'KA-01-EQ-9412',
    rating: 4.92,
    deliveriesCompleted: 1840,
    lat: 12.9360,
    lng: 77.6250,
    status: 'idle',
    speedKmph: 26
  },
  {
    id: 'rider-02',
    name: 'Priya Nair',
    phone: '+91 98451 12345',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    vehicle: 'Ola S1 Pro EV',
    vehicleNumber: 'KA-03-JJ-8219',
    rating: 4.88,
    deliveriesCompleted: 1210,
    lat: 12.9340,
    lng: 77.6230,
    status: 'idle',
    speedKmph: 28
  },
  {
    id: 'rider-03',
    name: 'Amit Patel',
    phone: '+91 97123 98765',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    vehicle: 'Honda Activa 6G',
    vehicleNumber: 'KA-05-MM-3104',
    rating: 4.95,
    deliveriesCompleted: 2430,
    lat: 12.9710,
    lng: 77.6405,
    status: 'idle',
    speedKmph: 24
  },
  {
    id: 'rider-04',
    name: 'Vikram Singh',
    phone: '+91 98200 45678',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    vehicle: 'TVS iQube Electric',
    vehicleNumber: 'KA-51-AB-1902',
    rating: 4.89,
    deliveriesCompleted: 980,
    lat: 12.9110,
    lng: 77.6435,
    status: 'idle',
    speedKmph: 25
  }
];
