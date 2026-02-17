import react from '@vitejs/plugin-react-swc'
import { defineConfig, loadEnv, type ConfigEnv, type UserConfig } from 'vite'

/** 目的: 開発サーバー設定を集約し、`/api` をbackendへ中継してJSON取得失敗を防ぐ。副作用: 開発時にViteプロキシを有効化する。前提: backendはHTTPで到達可能である。 */
function createViteConfig(configEnv: ConfigEnv): UserConfig {
  const environmentVariables = loadEnv(configEnv.mode, process.cwd(), '')
  const proxyTarget =
    environmentVariables.VITE_CHARA_BACKEND_PROXY_TARGET?.trim() || 'http://127.0.0.1:8080'

  return {
    plugins: [react()],
    publicDir: 'static',
    server: {
      port: 3401,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
}

export default defineConfig(createViteConfig)
