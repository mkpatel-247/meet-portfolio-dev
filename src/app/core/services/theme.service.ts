import { Injectable, Renderer2, RendererFactory2, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly rendererFactory = inject(RendererFactory2);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer: Renderer2;
  private readonly darkThemeClass = 'dark';
  private readonly lightThemeClass = 'light';

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  enableDarkTheme(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.renderer.removeClass(document.body, this.lightThemeClass);
    this.renderer.addClass(document.body, this.darkThemeClass);
    try {
      localStorage.setItem('theme', 'dark');
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  enableLightTheme(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.renderer.removeClass(document.body, this.darkThemeClass);
    this.renderer.addClass(document.body, this.lightThemeClass);
    try {
      localStorage.setItem('theme', 'light');
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  toggleTheme(): void {
    if (this.isDarkTheme()) {
      this.enableLightTheme();
    } else {
      this.enableDarkTheme();
    }
  }

  /**
   * Initialize the theme based on the saved theme in local storage.
   * If the saved theme is 'dark', enable dark theme. Otherwise, enable light theme.
   */
  initTheme(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        this.enableDarkTheme();
      } else {
        this.enableLightTheme();
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
      this.enableLightTheme();
    }
  }

  /**
   * Check if the current theme is dark.
   * @return {boolean} true if the current theme is dark, false otherwise
   */
  isDarkTheme(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return document.body.classList.contains(this.darkThemeClass);
  }
}
