// Node 18 polyfills — loaded via --require before ESM modules resolve.
// Fixes: undici v6 / openai SDK requires File as a global (Node 20+).
'use strict';
if (typeof globalThis.File === 'undefined') {
  const { Blob } = require('buffer');
  globalThis.File = class File extends Blob {
    constructor(parts, name, options = {}) {
      super(parts, options);
      this.name = name;
      this.lastModified = options.lastModified ?? Date.now();
    }
  };
}
