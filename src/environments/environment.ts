import { Environment } from '../app/models/environment';

export const environment: Environment = {
  production: false,
  name: 'local',
  uiUrl: 'http://localhost:9060',
  apiUrl: 'http://localhost:3000',
  kasFyiUrl: (id: string) => `https://kas.fyi/transaction/${id}`,
  kaspaOrgUrl: (id: string) => `https://explorer.kaspa.org/txs/${id}`,
  turnstileSiteKey: '1x00000000000000000000AA'
};
