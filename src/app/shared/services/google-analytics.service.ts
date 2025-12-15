import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleAnalyticsService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  init(): void {
    if (
      !this.isBrowser ||
      !environment.production ||
      !environment.gaMeasurementId
    ) {
      return;
    }

    // Prevent duplicate initialization
    if (window.dataLayer) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', environment.gaMeasurementId, {
      send_page_view: false,
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${environment.gaMeasurementId}`;
    document.head.appendChild(script);
  }

  trackPageView(url: string): void {
    if (!this.isBrowser || !window.gtag) return;

    window.gtag('event', 'page_view', {
      page_path: url,
    });
  }
}
