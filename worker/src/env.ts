export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  APP_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  DEV_BYPASS_AUTH?: string;
  DEV_AUTH_EMAIL?: string;
};

export type AppVariables = {
  userId: string;
};
