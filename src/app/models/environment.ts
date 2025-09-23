export interface Environment {
  production: boolean;
  name: string;
  uiUrl: string;
  apiUrl: string;
  kasFyiUrl: (hash: string) => string;
  kaspaOrgUrl: (hash: string) => string;
  turnstileSiteKey: string;
}
