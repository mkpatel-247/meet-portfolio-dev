import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  PLATFORM_ID,
  NgZone,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CursorService } from '../../../core/services/cursor.service';
import { distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-custom-cursor',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isVisible) {
    <div
      class="custom-cursor"
      [class.hovering]="isHovering"
      [class.hover-link]="hoverType === 'link'"
      [class.hover-button]="hoverType === 'button'"
      [class.hover-image]="hoverType === 'image'"
      [class.hover-text]="hoverType === 'text'"
      [style.left.px]="x"
      [style.top.px]="y"
      [style.transform]="transformStyle"
    >
      <div class="cursor-dot"></div>
      <div class="cursor-outline"></div>
    </div>
    }
  `,
  styleUrls: ['./custom-cursor.component.scss'],
})
export class CustomCursorComponent implements OnInit {
  x = 0;
  y = 0;
  isHovering = false;
  hoverType?: 'link' | 'button' | 'image' | 'text';
  scale = 1;
  isVisible = false;

  get transformStyle(): string {
    return `translate(-50%, -50%) scale(${this.scale})`;
  }

  private readonly cursorService = inject(CursorService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    // Only show custom cursor on devices with fine pointer (desktop)
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

    if (!hasFinePointer) {
      return;
    }

    // Hide default cursor by adding class to body
    document.body.classList.add('custom-cursor-active');
    this.isVisible = true;
    this.cdr.markForCheck();

    // Subscribe with distinctUntilChanged to avoid unnecessary change detection
    this.cursorService.cursorState
      .pipe(
        distinctUntilChanged((prev, curr) => {
          // Only trigger change detection if values actually changed
          return (
            Math.abs(prev.x - curr.x) < 1 &&
            Math.abs(prev.y - curr.y) < 1 &&
            prev.isHovering === curr.isHovering &&
            prev.hoverType === curr.hoverType &&
            Math.abs(prev.scale - curr.scale) < 0.01
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((state) => {
        this.x = state.x;
        this.y = state.y;
        this.isHovering = state.isHovering;
        this.hoverType = state.hoverType;
        this.scale = state.scale;
        this.cdr.markForCheck();
      });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.isBrowser) {
        document.body.classList.remove('custom-cursor-active');
      }
    });
  }
}
