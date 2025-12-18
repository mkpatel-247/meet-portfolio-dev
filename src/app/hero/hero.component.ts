import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CursorService } from '../core/services/cursor.service';

interface IFloatIcons {
  name: string;
  class: string;
  icon: string;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent implements OnInit {
  readonly isBrowser: boolean;
  private readonly cursorService = inject(CursorService, { optional: true });
  floatingIconsDetails: IFloatIcons[] | undefined;

  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Initialize any animations or effects here
    this.floatingIcons();
  }

  onHover(type: 'link' | 'button' | 'image' | 'text'): void {
    if (this.isBrowser && this.cursorService) {
      this.cursorService.setHover(
        true,
        type,
        type === 'button' ? 1.8 : type === 'image' ? 1.5 : 1.3
      );
    }
  }

  onLeave(): void {
    if (this.isBrowser && this.cursorService) {
      this.cursorService.reset();
    }
  }

  floatingIcons() {
    this.floatingIconsDetails = [
      {
        class: 'top-[8%] right-[-8%]',
        name: 'Angular',
        icon: 'angular',
      },
      {
        class: 'top-1/2 right-[-12%] [animation-delay:-1.5s]',
        name: 'Docker',
        icon: 'docker',
      },
      {
        class: 'bottom-[18%] right-[-8%] [animation-delay:-3s]',
        name: 'Node.js',
        icon: 'nodejs',
      },
      {
        class: 'top-[18%] left-[-8%] [animation-delay:-4.5s] ',
        name: 'MongoDB',
        icon: 'mongodb',
      },
      {
        class: 'bottom-[8%] left-[-12%] [animation-delay:-6s]',
        name: 'TypeScript',
        icon: 'ts',
      },
    ];
  }

  scrollToNextSection(): void {
    if (!this.isBrowser) return;

    const aboutSection =
      document.getElementById('about') || document.getElementById('skills');
    if (aboutSection) {
      const headerOffset = 100;
      const elementPosition = aboutSection.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    } else {
      // Fallback: scroll down by viewport height
      window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth',
      });
    }
  }
}
