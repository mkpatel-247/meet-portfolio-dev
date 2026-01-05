import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  HostListener,
  inject,
  DestroyRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { LoaderService } from '../../shared/services/loader.service';

interface NavbarRoute {
  label: string;
  route: string;
  isRouterLink?: boolean;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit, OnDestroy {
  systemTheme = 'light';
  readonly isBrowser: boolean;
  isMobileMenuOpen = false;
  isScrolled = false;
  private scrollListener?: () => void;
  navbarRoute: NavbarRoute[] = [];

  private readonly platformId = inject(PLATFORM_ID);
  private readonly themeService = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  constructor(private loaderService: LoaderService) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Initialize routes immediately (no browser check needed)
    this.preparedNavbarRoute();

    if (this.isBrowser) {
      // Use requestAnimationFrame for smoother initialization
      requestAnimationFrame(() => {
        this.themeService.initTheme();
        this.systemTheme = this.themeService.isDarkTheme() ? 'dark' : 'light';
        this.setupScrollListener();
        this.cdr.markForCheck();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      if (this.scrollListener) {
        window.removeEventListener('scroll', this.scrollListener);
      }
      // Clean up body scroll lock if menu is still open
      if (this.isMobileMenuOpen) {
        this.isMobileMenuOpen = false;
        this.updateBodyScrollLock();
      }
    }
  }

  setupScrollListener(): void {
    if (this.isBrowser) {
      let ticking = false;
      this.scrollListener = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.isScrolled = window.scrollY > 50;
            this.cdr.markForCheck();
            ticking = false;
          });
          ticking = true;
        }
      };
      window.addEventListener('scroll', this.scrollListener, { passive: true });
    }
  }

  toggleTheme(): void {
    if (this.isBrowser) {
      this.themeService.toggleTheme();
      this.systemTheme = this.themeService.isDarkTheme() ? 'dark' : 'light';
      this.cdr.markForCheck();
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isBrowser) {
      this.updateBodyScrollLock();
    }
    this.cdr.markForCheck();
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    if (this.isBrowser) {
      this.updateBodyScrollLock();
    }
    this.cdr.markForCheck();
  }

  private updateBodyScrollLock(): void {
    if (this.isBrowser) {
      const body = document.body;
      const html = document.documentElement;

      if (this.isMobileMenuOpen) {
        // Prevent body scroll when menu is open
        const scrollY = window.scrollY;
        body.style.position = 'fixed';
        body.style.top = `-${scrollY}px`;
        body.style.width = '100%';
        body.style.overflow = 'hidden';
        html.style.overflow = 'hidden';
        // Store scroll position for restoration
        body.setAttribute('data-scroll-y', scrollY.toString());
      } else {
        // Restore body scroll
        const scrollY = body.getAttribute('data-scroll-y');
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
        body.style.overflow = '';
        html.style.overflow = '';
        body.removeAttribute('data-scroll-y');

        // Restore scroll position
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY, 10));
        }
      }
    }
  }

  smoothScrollTo(target: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const element = document.querySelector(target);

    if (element && this.isBrowser) {
      // Element exists in DOM - scroll to it
      if (this.isMobileMenuOpen) {
        this.closeMobileMenu();
        setTimeout(() => {
          this.performScroll(element);
        }, 100);
      } else {
        this.performScroll(element);
      }
    } else if (this.isBrowser) {
      // Element not in DOM (e.g., on blog page) - navigate to home with fragment
      const fragment = target.replace('#', '');

      // Close mobile menu first if open
      if (this.isMobileMenuOpen) {
        this.closeMobileMenu();
      }
      this.loaderService.show();
      // Navigate to home page with fragment
      this.router.navigate(['/'], { fragment }).then(() => {
        // After navigation, wait for DOM to update and scroll
        setTimeout(() => {
          const targetElement = document.querySelector(target);
          if (targetElement) {
            this.performScroll(targetElement);
            this.loaderService.hide();
          }
        }, 100);
      });
    }
  }

  private performScroll(element: Element): void {
    const headerOffset = 100; // Account for navbar height
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    // Close mobile menu on resize to desktop
    if (this.isBrowser && window.innerWidth >= 768 && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close mobile menu when clicking outside
    if (!this.isMobileMenuOpen) return;

    const target = event.target as HTMLElement;
    const menuButton = target.closest('#mobile-menu-toggle');
    const mobileMenu = target.closest('#mobile-menu');
    const mobileMenuContent = target.closest('.mobile-menu-content');
    const mobileThemeToggle = target.closest('.mobile-theme-toggle-btn');

    // Don't close if clicking on menu button, theme toggle, or inside mobile menu content
    if (menuButton || mobileThemeToggle || mobileMenuContent) {
      return;
    }

    // Close if clicking on backdrop (mobileMenu but not content) or outside entirely
    this.closeMobileMenu();
  }

  private preparedNavbarRoute() {
    this.navbarRoute = [
      {
        label: 'About',
        route: '#about',
      },
      {
        label: 'Skills',
        route: '#skills',
      },
      {
        label: 'Work',
        route: '#work',
      },
      {
        label: 'Contact',
        route: '#contact',
      },
    ];
  }
}
