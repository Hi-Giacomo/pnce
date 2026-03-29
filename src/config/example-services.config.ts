export interface ServiceConfig {
  name: string;
  port: number;
  description: string;
  endpoints?: string[];
}

/**
 * Level 1 microservices configuration
 */
export const level1Services: ServiceConfig[] = [
  {
    name: 'user-service',
    port: 3001,
    description: 'User management microservice',
    endpoints: ['/api/users', '/api/users/:id'],
  },
  {
    name: 'product-service',
    port: 3002,
    description: 'Product management microservice',
    endpoints: ['/api/products', '/api/products/:id'],
  },
];

/**
 * Level 2 microservices configuration
 */
export const level2Services: Array<ServiceConfig & { parent: string }> = [
  {
    name: 'order-service',
    parent: 'user-service',
    port: 3011,
    description: 'Order management microservice (nested in user-service)',
  },
  {
    name: 'inventory-service',
    parent: 'product-service',
    port: 3012,
    description: 'Inventory management microservice (nested in product-service)',
  },
];

/**
 * Level 3 microservices configuration
 */
export const level3Services: Array<ServiceConfig & { parent: string; grandParent: string }> = [
  {
    name: 'payment-service',
    parent: 'order-service',
    grandParent: 'user-service',
    port: 3021,
    description: 'Payment processing microservice (deeply nested)',
  },
];
