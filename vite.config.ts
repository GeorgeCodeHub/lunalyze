/// <reference types="vitest/config" />
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // The app lives in frontend/; backend/public/ is served at / (so data at /data/) and copied into dist/.
  root: 'frontend',
  publicDir: '../backend/public',
  build: { outDir: '../dist', emptyOutDir: true },
  test: { root: '.' }, // Vitest would take Vite's root (frontend/) and miss backend/lib tests
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
});
