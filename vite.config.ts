import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// `base: './'` gera caminhos relativos: o build funciona em qualquer subcaminho
// (ex.: https://usuario.github.io/vortex-cam/) sem precisar configurar nada.
export default defineConfig(({ mode }) => ({
  base: './',
  // `npm run dev:https` sobe um certificado local para testar a câmera no celular via rede.
  plugins: [react(), ...(mode === 'https' ? [basicSsl()] : [])],
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Three.js só é baixado quando a tela do efeito é carregada (code splitting).
        manualChunks: {
          three: ['three'],
          gsap: ['gsap'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
}));
