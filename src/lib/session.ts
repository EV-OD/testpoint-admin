import 'server-only';
import type { IronSessionOptions } from 'iron-session';
import type { User } from './types';

if (!process.env.SECRET_COOKIE_PASSWORD) {
    throw new Error('SECRET_COOKIE_PASSWORD is not set');
}

export const sessionOptions: IronSessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'testpoint-session',
  // secure: true should be used in production (HTTPS) but can be false for development (HTTP).
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

// This is where we specify the session data that we want to store.
declare module 'iron-session' {
  interface IronSessionData {
    user?: Omit<User, 'password'>;
  }
}
