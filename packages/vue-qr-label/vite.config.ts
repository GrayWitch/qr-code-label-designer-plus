import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    plugins: [
        vue(),
        dts({
            insertTypesEntry: true,
        }),
    ],
    build: {
        lib: {
            entry: {
                'vue-qr-label': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
                'pdf': fileURLToPath(new URL('./src/pdf.ts', import.meta.url))
            },
            formats: ['es', 'cjs']
        },
        rollupOptions: {
            external: [
                'vue',
                '@amethc/qrlayout-core',
                '@amethc/qrlayout-ui',
                '@amethc/qrlayout-core/pdf',
                '@amethc/qrlayout-ui/style.css',
                'qrlayout-core',
                'qrlayout-ui',
                'qrlayout-core/pdf',
                'qrlayout-ui/style.css',
            ],
            output: {
                globals: {
                    vue: 'Vue',
                    '@amethc/qrlayout-core': 'QRLayoutCore',
                    '@amethc/qrlayout-ui': 'QRLayoutUI',
                    'qrlayout-core': 'QRLayoutCore',
                    'qrlayout-ui': 'QRLayoutUI'
                }
            }
        }
    }
});
