import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiService } from '../../src/services/api.service';
import axios from 'axios';

// Mock axios
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  };
});

// Mock axios-retry
vi.mock('axios-retry', () => ({
  __esModule: true,
  default: vi.fn(),
}));

describe('ApiService', () => {
  let apiService: ApiService;

  beforeEach(() => {
    apiService = new ApiService();
  });

  describe('getAuthHeaders', () => {
    it('TokenReturnAuthorization', () => {
      const headers = apiService['getAuthHeaders']();
      expect(headers).toEqual({});
    });
  });

  describe('getAxiosInstance', () => {
    it('Returnaxios', () => {
      const instance = apiService.getAxiosInstance();
      expect(instance).toBeDefined();
      expect(instance).toHaveProperty('get');
      expect(instance).toHaveProperty('post');
      expect(instance).toHaveProperty('delete');
    });
  });
});
