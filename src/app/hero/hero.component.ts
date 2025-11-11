import { Component, OnInit, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CursorService } from '../shared/services/cursor.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements OnInit {
  isBrowser: boolean;
  private cursorService = inject(CursorService, { optional: true });

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Initialize any animations or effects here
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
}
