import { verifySessionToken } from '../persistence/auth.js';

/**
 * @param {import('express').Request} req
 * @param {string} secret
 * @returns {string | null}
 */
export function getAccountIdFromRequest(req, secret) {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return verifySessionToken(header.slice(7), secret);
  }

  const cookie = req.headers.cookie;
  if (typeof cookie === 'string') {
    const match = cookie.match(/(?:^|;\s*)mmo_token=([^;]+)/);
    if (match) {
      return verifySessionToken(decodeURIComponent(match[1]), secret);
    }
  }

  return null;
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} secret
 */
export function registerSocketAuth(io, secret) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const accountId = verifySessionToken(token, secret);
    if (!accountId) {
      next(new Error('unauthorized'));
      return;
    }
    socket.data.accountId = accountId;
    next();
  });
}
