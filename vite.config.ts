import vinext from 'vinext';
import {cloudflare} from '@cloudflare/vite-plugin';
import {defineConfig} from 'vite';
export default defineConfig({define:{'process.env.ROYAL_APP_VERSION':JSON.stringify(new Date().toISOString())},plugins:[vinext(),cloudflare({viteEnvironment:{name:'rsc',childEnvironments:['ssr']},inspectorPort:false})]});
