import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource/noto-serif-balinese/balinese-400.css';
import '../globals.css';

import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { routing } from '@/i18n/routing';
import { localeFromParams, resolveLocale } from '@/lib/locale';

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const locale = await localeFromParams(params);
  const t = await getTranslations({ locale, namespace: 'Meta' });
  return {
    title: { default: t('title'), template: '%s | Taksu Tech' },
    description: t('description'),
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0e1335',
};

export default async function LocaleLayout({ children, params }: Props) {
  const locale = await resolveLocale(params);
  return (
    <html lang={locale}>
      <body className="kiosk-surface bg-background text-foreground min-h-dvh">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
