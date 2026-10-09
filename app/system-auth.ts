import {headers} from 'next/headers';
export async function getSystemUser(){const h=await headers();const email=h.get('x-royal-user-email');return email?{email,userId:email,displayName:email}:null;}
export async function requireSystemUser(_returnTo:string){const u=await getSystemUser();if(!u)throw new Error('Authentication required');return u;}
