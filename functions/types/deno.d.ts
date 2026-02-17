/**
 * Deno Namespace Type Definitions
 * Provides TypeScript support for Deno-specific APIs
 */

declare namespace Deno {
  interface RequestEvent {
    request: Request;
    respondWith(response: Response | Promise<Response>): Promise<void>;
  }

  interface ServeOptions {
    port?: number;
    hostname?: string;
    onListen?: (params: { hostname: string; port: number }) => void;
    onError?: (error: Error) => Response | Promise<Response>;
  }

  interface ServeHandler {
    (request: Request): Response | Promise<Response>;
  }

  export function serve(handler: ServeHandler): Promise<void>;
  export function serve(options: ServeOptions, handler: ServeHandler): Promise<void>;
  export function serve(handler: ServeHandler, options: ServeOptions): Promise<void>;

  // Environment
  export const env: {
    get(name: string): string | undefined;
    set(name: string, value: string): void;
    delete(name: string): void;
    toObject(): { [key: string]: string };
  };

  // File system
  export function readFile(path: string): Promise<Uint8Array>;
  export function readTextFile(path: string): Promise<string>;
  export function writeFile(path: string, data: Uint8Array): Promise<void>;
  export function writeTextFile(path: string, data: string): Promise<void>;

  // Process
  export const pid: number;
  export const ppid: number;
  export function exit(code?: number): never;
  
  // Permissions
  export namespace permissions {
    interface PermissionDescriptor {
      name: string;
    }
    export function query(desc: PermissionDescriptor): Promise<{ state: 'granted' | 'denied' | 'prompt' }>;
  }
}

declare interface Performance {
  now(): number;
}

declare var performance: Performance;
