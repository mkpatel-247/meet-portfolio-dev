import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ThemeService } from '../../../shared/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  systemTheme = 'light';
  isBrowser: any;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private themeService: ThemeService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.themeService.initTheme();
    }
  }

  toggleTheme(): void {
    if (this.isBrowser) {
      this.themeService.toggleTheme();
      this.systemTheme = this.themeService.isDarkTheme() ? 'dark' : 'light';
    }
  }
}
