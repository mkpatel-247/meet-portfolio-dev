import {
  Component,
  PLATFORM_ID,
  OnInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './layouts/navbar/navbar.component';
import { FooterComponent } from './layouts/footer/footer.component';
import { isPlatformBrowser } from '@angular/common';
import * as AOS from 'aos';
import { CustomCursorComponent } from './shared/components/custom-cursor/custom-cursor.component';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { GoogleAnalyticsService } from './core/services/google-analytics.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    CustomCursorComponent,
    LoaderComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, AfterViewInit {
  readonly title = 'meet-portfolio';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly gaService = inject(GoogleAnalyticsService);

  constructor(
    private googleAnalyticsService: GoogleAnalyticsService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.gaService.init();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.googleAnalyticsService.trackPageView(event.urlAfterRedirects);
      });
    // AOS initialization moved to ngAfterViewInit to avoid duplicate initialization
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize AOS immediately after view init for faster loading
      requestAnimationFrame(() => {
        AOS.init({
          once: true,
          duration: 800,
          offset: 50,
          delay: 0,
        });
        this.cdr.markForCheck();
      });
    }
  }
}
