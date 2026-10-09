import {readFile,writeFile} from 'node:fs/promises';
import {createInterface} from 'node:readline/promises';
const rl=createInterface({input:process.stdin,output:process.stdout});
try{
 const c=JSON.parse(await readFile('wrangler.json','utf8'));
 const id=(await rl.question('D1 database ID: ')).trim();
 if(!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))throw Error('Invalid database ID');
 c.d1_databases[0].database_id=id;
 const team=(await rl.question('Access team domain (https://NAME.cloudflareaccess.com), or Enter for initial deployment: ')).trim();
 if(team){const url=new URL(team);if(url.protocol!=='https:'||!url.hostname.endsWith('.cloudflareaccess.com')||url.pathname!=='/'||url.username||url.password)throw Error('Invalid Access domain');
 const aud=(await rl.question('Access application AUD: ')).trim();if(!aud)throw Error('AUD required');
 const email=(await rl.question('Client login email: ')).trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw Error('Invalid email');
 c.vars={ACCESS_TEAM_DOMAIN:url.origin,ACCESS_AUD:aud,ALLOWED_EMAILS:email};}
 await writeFile('wrangler.json',JSON.stringify(c,null,2));
 try{const built=JSON.parse(await readFile('dist/server/wrangler.json','utf8'));built.d1_databases[0].database_id=id;built.vars=c.vars;delete built.configPath;delete built.userConfigPath;await writeFile('dist/server/wrangler.json',JSON.stringify(built,null,2));}catch(e){if(e.code!=='ENOENT')throw e;}
 console.log('Saved. Run database migrations, then deploy. Without Access configuration the app stays locked.');
}finally{rl.close();}
