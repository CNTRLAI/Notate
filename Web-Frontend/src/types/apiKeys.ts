export type ApiKey = {
  id: number;
  key: string;
  provider: string;
};

export type DevApiKey = {
  id: number;
  key: string;
  name: string;
  expiration: string | null;
};
