/**
 * @symbiosedb/auth - Authentication for SymbioseDB
 * Supports Email/Password, Web3 Wallets, and OAuth (Google, GitHub)
 */

export { EmailAuthProvider } from './email-provider';
export { Web3AuthProvider } from './web3-provider';
export { OAuthProvider } from './oauth-provider';
export { AuthManager } from './auth-manager';

export type {
  User,
  EmailCredentials,
  Web3Credentials,
  OAuthCredentials,
  AuthConfig,
  OAuthConfig,
  Session,
  AuthResult,
} from './types';
