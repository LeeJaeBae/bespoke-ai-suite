/**
 * Bespoke AI Suite - Microservices Configuration
 * Defines all service endpoints and expected responses
 */

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  port: number;
  healthEndpoint: string;
  expectedFields: string[];
  timeout: number;
  maxResponseTime: number; // milliseconds
}

export const SERVICES: Record<string, ServiceConfig> = {
  content: {
    name: 'Content Service',
    baseUrl: 'http://localhost',
    port: 8081,
    healthEndpoint: '/health',
    expectedFields: ['status', 'data'], // Nested structure: data.service, data.status, data.timestamp
    timeout: 10000,
    maxResponseTime: 2000
  },
  user: {
    name: 'User Service',
    baseUrl: 'http://localhost',
    port: 8084,
    healthEndpoint: '/health',
    expectedFields: ['service', 'status', 'timestamp'], // Direct structure
    timeout: 10000,
    maxResponseTime: 2000
  },
  campaign: {
    name: 'Campaign Service',
    baseUrl: 'http://localhost',
    port: 8085,
    healthEndpoint: '/health',
    expectedFields: ['service', 'status', 'version'], // No timestamp field
    timeout: 10000,
    maxResponseTime: 2000
  },
  analytics: {
    name: 'Analytics Service',
    baseUrl: 'http://localhost',
    port: 8086,
    healthEndpoint: '/api/v1/health',
    expectedFields: ['service', 'status', 'timestamp', 'version'], // No database field
    timeout: 10000,
    maxResponseTime: 2000
  }
};

export const SERVICE_NAMES = Object.keys(SERVICES);

export function getServiceUrl(serviceName: string): string {
  const service = SERVICES[serviceName];
  if (!service) {
    throw new Error(`Unknown service: ${serviceName}`);
  }
  return `${service.baseUrl}:${service.port}${service.healthEndpoint}`;
}