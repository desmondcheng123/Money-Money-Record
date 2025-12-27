
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: [
        'recharts',
        'lucide-react',
        'react',
        'react-dom'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'recharts': 'Recharts',
          'lucide-react': 'Lucide'
        }
      }
    }
  },
  server: {
    port: 3000
  }
});
