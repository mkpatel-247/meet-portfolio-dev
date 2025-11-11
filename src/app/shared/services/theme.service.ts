import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private renderer: Renderer2;
  private darkThemeClass = 'dark';
  private lightThemeClass = 'light';

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  enableDarkTheme(): void {
    this.renderer.removeClass(document.body, this.lightThemeClass);
    this.renderer.addClass(document.body, this.darkThemeClass);
    localStorage.setItem('theme', 'dark');
  }

  enableLightTheme(): void {
    this.renderer.removeClass(document.body, this.darkThemeClass);
    this.renderer.addClass(document.body, this.lightThemeClass);
    localStorage.setItem('theme', 'light');
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
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.enableDarkTheme();
    } else {
      this.enableLightTheme();
    }
  }

  /**
   * Check if the current theme is dark.
   * @return {boolean} true if the current theme is dark, false otherwise
   */
  isDarkTheme(): boolean {
    return document.body.classList.contains(this.darkThemeClass);
  }
}
