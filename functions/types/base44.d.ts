/**
 * Base44 SDK Type Definitions
 */

declare module 'npm:@base44/sdk@*' {
  export interface Base44Client {
    collection(name: string): Collection;
    auth: AuthClient;
    me?: User;
    asServiceRole?: ServiceRoleClient;
    entities?: Record<string, EntityCollection>;
    functions?: {
      invoke(name: string, data?: Record<string, unknown>): Promise<unknown>;
    };
  }

  export interface ServiceRoleClient {
    entities: Record<string, EntityCollection>;
  }

  export interface EntityCollection {
    findOne<T = Record<string, unknown>>(query: Record<string, unknown>): Promise<T | null>;
    find<T = Record<string, unknown>>(query?: Record<string, unknown>): Promise<T[]>;
    create<T = Record<string, unknown>>(data: T): Promise<T>;
    update<T = Record<string, unknown>>(id: string, data: Partial<T>): Promise<T>;
    delete(id: string): Promise<void>;
    count(query?: Record<string, unknown>): Promise<number>;
    aggregate(pipeline: unknown[]): Promise<unknown[]>;
    insertOne?<T = Record<string, unknown>>(data: T): Promise<T>;
    updateOne?<T = Record<string, unknown>>(filter: Record<string, unknown>, update: Partial<T>): Promise<T>;
    deleteOne?(filter: Record<string, unknown>): Promise<void>;
  }

  export interface Collection {
    findOne<T = Record<string, unknown>>(query: Record<string, unknown>): Promise<T | null>;
    find<T = Record<string, unknown>>(query?: Record<string, unknown>): Promise<T[]>;
    create<T = Record<string, unknown>>(data: T): Promise<T>;
    update<T = Record<string, unknown>>(id: string, data: Partial<T>): Promise<T>;
    delete(id: string): Promise<void>;
    count(query?: Record<string, unknown>): Promise<number>;
    aggregate(pipeline: unknown[]): Promise<unknown[]>;
    insertOne?<T = Record<string, unknown>>(data: T): Promise<T>;
    updateOne?<T = Record<string, unknown>>(filter: Record<string, unknown>, update: Partial<T>): Promise<T>;
    deleteOne?(filter: Record<string, unknown>): Promise<void>;
  }

  export interface AuthClient {
    getUser(): Promise<User | null>;
    getSession(): Promise<Session | null>;
    signIn(credentials: { email: string; password: string }): Promise<{ user: User; session: Session }>;
    signUp(credentials: { email: string; password: string; metadata?: Record<string, unknown> }): Promise<{ user: User; session: Session }>;
    signOut(): Promise<void>;
    me?: User;
  }

  export interface User {
    id: string;
    email: string;
    role?: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
    tenant_id?: string;
  }

  export interface Session {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    user: User;
  }

  export function createClientFromRequest(req: Request): Base44Client;
  export function createClient(token?: string): Base44Client;
}

declare module '@base44/sdk' {
  export * from 'npm:@base44/sdk@*';
}
