import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
import config from '../app.json';

export default function Html({ children }: PropsWithChildren) {
  const base = config.expo.experiments.baseUrl;
  return <html lang="ko">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#436857" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="암송말씀" />
      <link rel="manifest" href={`${base}/manifest.webmanifest`} />
      <link rel="apple-touch-icon" href={`${base}/icon.png`} />
      <ScrollViewStyleReset />
    </head>
    <body>{children}</body>
  </html>;
}
