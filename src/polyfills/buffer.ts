import { Buffer } from 'buffer';

// Make Buffer available globally for libraries that expect it
// (e.g., isomorphic-git)
;(globalThis as any).Buffer = Buffer;
