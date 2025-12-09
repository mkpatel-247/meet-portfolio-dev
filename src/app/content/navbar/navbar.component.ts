import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  HostListener,
  inject,
  DestroyRef,
} from '@angular/core';
import { ThemeService } from '../../shared/services/theme.service';

interface NavbarRoute {
  label: string;
  route: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
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

  constructor() {
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
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isBrowser) {
      this.updateBodyScrollLock();
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    if (this.isBrowser) {
      this.updateBodyScrollLock();
    }
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
      // Close mobile menu first if open
      if (this.isMobileMenuOpen) {
        this.closeMobileMenu();
        // Small delay to allow menu to close before scrolling
        setTimeout(() => {
          this.performScroll(element);
        }, 100);
      } else {
        this.performScroll(element);
      }
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

  @HostListener('window:resize', ['$event'])
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
