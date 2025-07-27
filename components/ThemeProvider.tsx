'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

/*
 * Provides dark/light theme switching using next-themes. This wrapper can be
 * extended with additional props but currently just forwards everything
 * through to the underlying provider.
 */
export function ThemeProvider({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: any;
}) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export default ThemeProvider;