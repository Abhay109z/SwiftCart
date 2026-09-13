export type {
  DarkStore,
  Product,
  ProductBatch,
  CartItem,
  Rider,
  OrderStatus,
  OrderItem,
  Order,
  KafkaEvent,
  DLQMessage,
  SurgeZone,
  ConcurrencyTestResult,
  DeliveryPartnerApplication
} from '../backend/types.js';

export type AppView = 'storefront' | 'tracking' | 'architecture' | 'darkstore-ops' | 'partner-join';
