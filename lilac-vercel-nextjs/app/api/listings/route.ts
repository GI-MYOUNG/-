export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import catalog from '@/data/listings.json';
export async function GET(){return Response.json({provider:catalog.provider,version:catalog.version,updatedAt:catalog.updatedAt,counts:catalog.counts,total:catalog.stocks.length,api:catalog.api},{headers:{'Cache-Control':'public, max-age=3600'}});}
