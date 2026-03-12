import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

function browserBuiltinShims() {
  return {
    name: 'browser-builtin-shims',
    resolveId(source) {
      if (source === 'fs' || source === 'node:fs') {
        return '\0browser-fs-shim';
      }
      if (source === 'path' || source === 'node:path') {
        return '\0browser-path-shim';
      }
      return null;
    },
    load(id) {
      if (id === '\0browser-fs-shim') {
        return `
const buildError = () => new Error('The fs module is not available in browser builds.');
export const promises = {
  readFile: async () => {
    throw buildError();
  }
};
export function readFileSync() {
  throw buildError();
}
export function statSync() {
  throw buildError();
}
export function existsSync() {
  return false;
}
export default { promises, readFileSync, statSync, existsSync };
`;
      }
      if (id === '\0browser-path-shim') {
        return `
export function resolve(...segments) {
  let resolved = segments
    .filter((segment) => typeof segment === 'string' && segment.length > 0)
    .join('/')
    .replaceAll('\\\\', '/');

  while (resolved.includes('//')) {
    resolved = resolved.replace('//', '/');
  }

  return resolved;
}
export default { resolve };
`;
      }
      return null;
    }
  };
}

export default {
  input: 'src/browser.ts',
  output: {
    file: 'dist-browser/velocits.umd.js',
    format: 'umd',
    name: 'Velocits',
    sourcemap: true
  },
  plugins: [
    browserBuiltinShims(),
    typescript({
      tsconfig: 'tsconfig.browser.json',
      declaration: false,
      declarationMap: false
    }),
    nodeResolve({
      browser: true,
      preferBuiltins: false
    })
  ],
  external: [],
  onwarn(warning, defaultHandler) {
    const ids = Array.isArray(warning.ids) ? warning.ids : [];
    const isChevrotainCircular = warning.code === 'CIRCULAR_DEPENDENCY' && ids.some((id) => id.includes('node_modules/chevrotain'));

    if (isChevrotainCircular) {
      return;
    }

    defaultHandler(warning);
  }
};
