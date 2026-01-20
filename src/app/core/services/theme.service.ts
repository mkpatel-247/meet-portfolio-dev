import { Injectable, Renderer2, RendererFactory2, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly rendererFactory = inject(RendererFactory2);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly renderer: Renderer2;
  private readonly darkThemeClass = 'dark';
  private readonly lightThemeClass = 'light';
  private readonly themeKey = 'theme';

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  enableDarkTheme(save = true): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    // Apply to HTML tag (for Tailwind & Mobile Viewport)
    this.renderer.removeClass(this.document.documentElement, this.lightThemeClass);
    this.renderer.addClass(this.document.documentElement, this.darkThemeClass);

    // Apply to BODY tag (for Component SCSS & Legacy Overrides)
    this.renderer.removeClass(this.document.body, this.lightThemeClass);
    this.renderer.addClass(this.document.body, this.darkThemeClass);

    if (save) {
      this.saveTheme('dark');
    }
  }

  enableLightTheme(save = true): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Apply to HTML tag
    this.renderer.removeClass(this.document.documentElement, this.darkThemeClass);
    this.renderer.addClass(this.document.documentElement, this.lightThemeClass);

    // Apply to BODY tag
    this.renderer.removeClass(this.document.body, this.darkThemeClass);
    this.renderer.addClass(this.document.body, this.lightThemeClass);

    if (save) {
      this.saveTheme('light');
    }
  }

  toggleTheme(): void {
    if (this.isDarkTheme()) {
      this.enableLightTheme(true);
    } else {
      this.enableDarkTheme(true);
    }
  }

  /**
   * Initialize the theme based on the saved theme in local storage or system preference.
   */
  initTheme(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    try {
      const savedTheme = localStorage.getItem(this.themeKey);
      
      if (savedTheme) {
        if (savedTheme === 'dark') {
          this.enableDarkTheme(false);
        } else {
          this.enableLightTheme(false);
        }
      } else {
        // No saved preference -> Check System
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        
        if (prefersDark.matches) {
          this.enableDarkTheme(false);
        } else {
          this.enableLightTheme(false);
        }

        // Listen for system changes (only if no override)
        prefersDark.addEventListener('change', (e) => {
          if (!localStorage.getItem(this.themeKey)) {
            if (e.matches) {
              this.enableDarkTheme(false);
            } else {
              this.enableLightTheme(false);
            }
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
      this.enableLightTheme(false);
    }
  }

  /**
   * Check if the current theme is dark.
   */
  isDarkTheme(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    // Check HTML tag as source of truth for dual-target strategy
    return this.document.documentElement.classList.contains(this.darkThemeClass);
  }

  private saveTheme(theme: 'dark' | 'light'): void {
    try {
      localStorage.setItem(this.themeKey, theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }
}
