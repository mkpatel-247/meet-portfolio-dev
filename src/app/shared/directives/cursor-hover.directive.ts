import { Directive, HostListener, Input, inject } from '@angular/core';
import { CursorService } from '../services/cursor.service';

@Directive({
  selector: '[appCursorHover]',
  standalone: true,
})
export class CursorHoverDirective {
  @Input() appCursorHover: 'link' | 'button' | 'image' | 'text' = 'link';
  @Input() hoverScale: number = 1.5;

  private get scale(): number {
    return this.hoverScale;
  }

  private cursorService = inject(CursorService, { optional: true });

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.cursorService) {
      this.cursorService.setHover(true, this.appCursorHover, this.hoverScale);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.cursorService) {
      this.cursorService.reset();
    }
  }
}
