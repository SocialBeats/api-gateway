import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticateRequest } from './authentication.js';
import {
  HEADER_USER_ID,
  HEADER_ROLES,
  HEADER_GATEWAY_AUTHENTICATED,
  AUTH_BEARER_PREFIX,
} from '../config/constants.js';

vi.mock('../../logger.js', () => ({
  default: {
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../utils/response.js', () => ({
  sendError: vi.fn(),
}));

describe('authenticateRequest Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {},
      path: '/api/test',
    };
    res = {};
    next = vi.fn();
  });

  it('should set headers correctly when valid token is provided', () => {
    const payload = {
      userId: '123',
      roles: ['admin', 'user'],
    };
    // Use the default secret from authentication.js to avoid env var sync issues
    const secret = 'your-secret-key-change-in-production';
    const token = jwt.sign(payload, secret);
    req.headers.authorization = `${AUTH_BEARER_PREFIX}${token}`;

    authenticateRequest(req, res, next);

    expect(req.headers[HEADER_USER_ID]).toBe('123');
    expect(req.headers[HEADER_GATEWAY_AUTHENTICATED]).toBe('true');
    expect(req.headers[HEADER_ROLES]).toBe(JSON.stringify(['admin', 'user']));
    expect(next).toHaveBeenCalled();
  });

  it('should not set roles header if roles are missing in token', () => {
    const payload = {
      userId: '123',
    };
    const secret = 'your-secret-key-change-in-production';
    const token = jwt.sign(payload, secret);
    req.headers.authorization = `${AUTH_BEARER_PREFIX}${token}`;

    authenticateRequest(req, res, next);

    expect(req.headers[HEADER_USER_ID]).toBe('123');
    expect(req.headers[HEADER_GATEWAY_AUTHENTICATED]).toBe('true');
    expect(req.headers[HEADER_ROLES]).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
