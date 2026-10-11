export type Lang = 'es' | 'en';
export interface Dict {
  [key: string]: string | Dict;
}
