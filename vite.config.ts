import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
    return {
      base: '/knitlab/', // Set this to your repository name
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
