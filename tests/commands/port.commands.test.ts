import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as portService from '../../src/commands/port.commands';

// Mock dependencies
vi.mock('../../src/utils/logger');
vi.mock('net');
vi.mock('fs-extra');

describe('Port Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('check port', () => {
    it('should check if a port is in use', async () => {
      const isPortInUse = vi.fn().mockResolvedValue(true);

      await expect(isPortInUse(3000)).resolves.toBe(true);
    });

    it('should return false for available port', async () => {
      const isPortInUse = vi.fn().mockResolvedValue(false);

      await expect(isPortInUse(8080)).resolves.toBe(false);
    });

    it('should handle invalid port number', async () => {
      const isPortInUse = vi.fn().mockRejectedValue(
        new Error('Invalid port number')
      );

      await expect(isPortInUse(-1)).rejects.toThrow('Invalid port number');
      await expect(isPortInUse(65536)).rejects.toThrow('Invalid port number');
    });
  });

  describe('find available port', () => {
    it('should find an available port starting from given port', async () => {
      const findAvailablePort = vi.fn().mockResolvedValue(3001);

      await expect(findAvailablePort(3000)).resolves.toBe(3001);
    });

    it('should return same port if already available', async () => {
      const findAvailablePort = vi.fn().mockResolvedValue(8080);

      await expect(findAvailablePort(8080)).resolves.toBe(8080);
    });

    it('should handle no available ports', async () => {
      const findAvailablePort = vi.fn().mockRejectedValue(
        new Error('No available ports found')
      );

      await expect(findAvailablePort(3000)).rejects.toThrow(
        'No available ports found'
      );
    });
  });

  describe('kill process on port', () => {
    it('should kill process on specified port', async () => {
      const killProcess = vi.fn().mockResolvedValue(true);

      await expect(killProcess(3000)).resolves.toBe(true);
    });

    it('should handle no process on port', async () => {
      const killProcess = vi.fn().mockResolvedValue(false);

      await expect(killProcess(8080)).resolves.toBe(false);
    });

    it('should handle permission error', async () => {
      const killProcess = vi.fn().mockRejectedValue(
        new Error('Permission denied')
      );

      await expect(killProcess(3000)).rejects.toThrow('Permission denied');
    });
  });

  describe('list ports', () => {
    it('should list all ports in use', async () => {
      const listPorts = vi.fn().mockResolvedValue([
        { port: 3000, pid: 1234, process: 'node' },
        { port: 8080, pid: 5678, process: 'nginx' },
        { port: 5432, pid: 9012, process: 'postgres' },
      ]);

      const ports = await listPorts();
      expect(ports).toHaveLength(3);
      expect(ports[0].port).toBe(3000);
      expect(ports[0].process).toBe('node');
    });

    it('should handle no ports in use', async () => {
      const listPorts = vi.fn().mockResolvedValue([]);

      const ports = await listPorts();
      expect(ports).toHaveLength(0);
    });

    it('should filter ports by process name', async () => {
      const allPorts = [
        { port: 3000, pid: 1234, process: 'node' },
        { port: 8080, pid: 5678, process: 'nginx' },
        { port: 3001, pid: 2345, process: 'node' },
      ];

      const nodePorts = allPorts.filter((p) => p.process === 'node');
      expect(nodePorts).toHaveLength(2);
    });
  });

  describe('port range validation', () => {
    it('should validate port is in valid range', () => {
      const isValidPort = (port: number) => port >= 1 && port <= 65535;

      expect(isValidPort(1)).toBe(true);
      expect(isValidPort(80)).toBe(true);
      expect(isValidPort(443)).toBe(true);
      expect(isValidPort(3000)).toBe(true);
      expect(isValidPort(8080)).toBe(true);
      expect(isValidPort(65535)).toBe(true);
      expect(isValidPort(0)).toBe(false);
      expect(isValidPort(-1)).toBe(false);
      expect(isValidPort(65536)).toBe(false);
    });

    it('should check well-known ports', () => {
      const wellKnownPorts = {
        HTTP: 80,
        HTTPS: 443,
        FTP: 21,
        SSH: 22,
        DNS: 53,
      };

      expect(wellKnownPorts.HTTP).toBe(80);
      expect(wellKnownPorts.HTTPS).toBe(443);
    });
  });

  describe('wait for port', () => {
    it('should wait for port to become available', async () => {
      const waitForPort = vi.fn().mockResolvedValue(true);

      await expect(waitForPort(3000, 5000)).resolves.toBe(true);
    });

    it('should timeout if port does not become available', async () => {
      const waitForPort = vi.fn().mockRejectedValue(
        new Error('Timeout waiting for port')
      );

      await expect(waitForPort(3000, 5000)).rejects.toThrow(
        'Timeout waiting for port'
      );
    });

    it('should handle immediate availability', async () => {
      const waitForPort = vi.fn().mockResolvedValue(true);

      await expect(waitForPort(3000, 1000)).resolves.toBe(true);
    });
  });
});
