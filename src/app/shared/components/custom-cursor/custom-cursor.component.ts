import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CursorService } from '../../../shared/services/cursor.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-custom-cursor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="custom-cursor"
      [class.hovering]="isHovering"
      [class.hover-link]="hoverType === 'link'"
      [class.hover-button]="hoverType === 'button'"
      [class.hover-image]="hoverType === 'image'"
      [class.hover-text]="hoverType === 'text'"
      [style.left.px]="x"
      [style.top.px]="y"
      [style.transform]="'translate(-50%, -50%) scale(' + scale + ')'"
    >
      <div class="cursor-dot"></div>
      <div class="cursor-outline"></div>
    </div>
  `,
  styleUrls: ['./custom-cursor.component.scss'],
})
export class CustomCursorComponent implements OnInit, OnDestroy {
  x = 0;
  y = 0;
  isHovering = false;
  hoverType?: 'link' | 'button' | 'image' | 'text';
  scale = 1;
  private subscription?: Subscription;
  isBrowser: boolean;

  constructor(
    private cursorService: CursorService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Only show custom cursor on devices with fine pointer (desktop)
      const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
      if (hasFinePointer) {
        this.subscription = this.cursorService.cursorState.subscribe(
          (state) => {
            this.x = state.x;
            this.y = state.y;
            this.isHovering = state.isHovering;
            this.hoverType = state.hoverType;
            this.scale = state.scale;
          }
        );
        // Show cursor element
        document.body.style.cursor = 'none';
      } else {
        // Hide cursor component on touch devices
        const cursorEl = document.querySelector('app-custom-cursor');
        if (cursorEl) {
          (cursorEl as HTMLElement).style.display = 'none';
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isBrowser) {
      this.cursorService.updatePosition(event.clientX, event.clientY);
    }
  }
}
