import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";
import { GoogleTagManager } from "@/components/analytics/google-tag-manager";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SITE } from "@/lib/site";

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-fira-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  // No canonical here: it would be inherited by every page. Indexable pages set their own.
  return {
    metadataBase: new URL(SITE.url),
    applicationName: SITE.name,
    title: { default: t("homeTitle"), template: t("titleTemplate") },
    description: t("description"),
    creator: SITE.name,
    publisher: SITE.name,
    category: "music",
    formatDetection: { telephone: false, email: false, address: false },
    openGraph: {
      siteName: SITE.name,
      title: t("homeTitle"),
      description: t("description"),
      url: "/",
      locale: locale === "id" ? "id_ID" : "en_US",
      alternateLocale: locale === "id" ? ["en_US"] : ["id_ID"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("homeTitle"),
      description: t("description"),
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={firaSans.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            {children}
            <Toaster />
            <GoogleTagManager />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
