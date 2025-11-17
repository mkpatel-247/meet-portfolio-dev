import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CursorService } from '../../../shared/services/cursor.service';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

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
export class CustomCursorComponent implements OnInit, OnDestroy {
  x = 0;
  y = 0;
  isHovering = false;
  hoverType?: 'link' | 'button' | 'image' | 'text';
  scale = 1;
  isVisible = false;
  
  get transformStyle(): string {
    return `translate(-50%, -50%) scale(${this.scale})`;
  }

  private subscription?: Subscription;
  private isBrowser: boolean;

  constructor(
    private cursorService: CursorService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
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
    this.subscription = this.cursorService.cursorState
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
        })
      )
      .subscribe((state) => {
        this.x = state.x;
        this.y = state.y;
        this.isHovering = state.isHovering;
        this.hoverType = state.hoverType;
        this.scale = state.scale;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    
    if (this.isBrowser) {
      document.body.classList.remove('custom-cursor-active');
    }
  }
}
