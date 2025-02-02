import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: "./",
    build: {
        outDir: "dist-react",
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html'),
                loading: path.resolve(__dirname, 'src/loading.html')
            }
        }
    },
    server: {
        port: 5131,
        strictPort: true,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@/ui": path.resolve(__dirname, "./src/app"),
            "@/components": path.resolve(__dirname, "./src/components"),
        },
    },
});
