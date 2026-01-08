import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Опрелеляем, является ли это сборкой специально для GitHub Pages
  const isGhPages = mode === 'gh-pages';

  return {
    plugins: [react()],
    // Если режим gh-pages, используем имя репозитория. В противном случае (Netlify/Local) используем корень.
    base: isGhPages ? '/Script-Modifier/' : '/',
    define: {
      // Безопасная замена глобальных переменных
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Заменяем process.env на пустой объект, чтобы библиотеки не падали при проверке
      'process.env': {}
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});