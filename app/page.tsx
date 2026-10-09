import Dashboard from './dashboard';
import {requireSystemUser} from './system-auth';
export const dynamic='force-dynamic';
export default async function Page(){await requireSystemUser('/');return <Dashboard/>;}
