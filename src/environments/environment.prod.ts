import { Environment } from '../app/models/environment';

export const environment: Environment = {
  production: true,
  name: 'prod',
  uiUrl: 'https://kasprove.pages.dev',
  apiUrl: 'https://kasprove.vercel.app',
  kasFyiUrl: (id: string) => `https://kas.fyi/transaction/${id}`,
  kaspaOrgUrl: (id: string) => `https://explorer.kaspa.org/txs/${id}`,
  turnstileSiteKey: '0x4AAAAAABymzaXR-SvD3hQD'
};
