import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [dts({ insertTypesEntry: true })],
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'QRLayoutUI',
            fileName: (format) => `qrlayout-ui.${format === 'es' ? 'js' : 'umd.js'}`,
            formats: ['es', 'umd']
        },
        rollupOptions: {
            external: ['@amethc/qrlayout-core', 'qrlayout-core'],
            output: {
                globals: {
                    '@amethc/qrlayout-core': 'QRLayoutCore',
                    'qrlayout-core': 'QRLayoutCore'
                }
            }
        }
    },
    resolve: {
        alias: {
            '@amethc/qrlayout-core': path.resolve(__dirname, '../core/src/index.ts'),
            'qrlayout-core': path.resolve(__dirname, '../core/src/index.ts')   // ← 改成这个
        }
    },
    server: {
        fs: {
            allow: ['..']
        }
    }
});