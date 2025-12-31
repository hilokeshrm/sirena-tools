
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Replace 'REPO_NAME' with your actual repository name, e.g., 'ls6-terminal'
  // If you are using a custom domain or a user-page (username.github.io), set this to '/'
  base: './',
  build: {
    outDir: 'dist',
  }
});
