import type { UserConfig } from 'vite';

export default {
  base: process.env.NODE_ENV === 'production' ? '/utmb-stories/' : '',
} satisfies UserConfig;
