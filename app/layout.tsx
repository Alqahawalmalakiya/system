import './globals.css';
import {PwaInstall} from './pwa-install';
export const metadata={title:'القهوة الملكية | الحجوزات',description:'حجوزاتك ومناسباتك ودفعاتك في مكان واحد',applicationName:'القهوة الملكية',manifest:'/manifest.webmanifest',icons:{icon:[{url:'/icons/icon-192.png',sizes:'192x192',type:'image/png'},{url:'/icons/icon-512.png',sizes:'512x512',type:'image/png'}],apple:[{url:'/icons/apple-touch-icon.png',sizes:'180x180',type:'image/png'}]},appleWebApp:{capable:true,title:'القهوة الملكية',statusBarStyle:'default'}};
export const viewport={width:'device-width',initialScale:1,themeColor:'#7d5638'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body>{children}<PwaInstall/></body></html>}
