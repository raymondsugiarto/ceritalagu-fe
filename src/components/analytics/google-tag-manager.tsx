"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { GTM_ID } from "@/lib/analytics";

/**
 * Google Tag Manager. The dataLayer bootstrap is defined before the container script so
 * `window.dataLayer` always exists when gtm.js runs. The admin area is skipped: internal traffic
 * would otherwise show up in the conversion numbers.
 */
export function GoogleTagManager() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) return null;

  return (
    <>
      <Script id="gtm-data-layer" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`}
      </Script>
      <Script
        id="gtm-loader"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          className="hidden"
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
