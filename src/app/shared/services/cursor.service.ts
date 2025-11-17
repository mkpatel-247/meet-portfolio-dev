import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CursorState {
  x: number;
  y: number;
  isHovering: boolean;
  hoverType?: 'link' | 'button' | 'image' | 'text';
  scale: number;
}

@Injectable({
  providedIn: 'root',
})
export class CursorService {
  private cursorState$ = new BehaviorSubject<CursorState>({
    x: 0,
    y: 0,
    isHovering: false,
    scale: 1,
  });

  public cursorState = this.cursorState$.asObservable();
  
  private rafId: number | null = null;
  private mouseX = 0;
  private mouseY = 0;
  private targetX = 0;
  private targetY = 0;
  private isInitialized = false;

  constructor(private ngZone: NgZone) {
    if (typeof window !== 'undefined') {
      this.initMouseTracking();
    }
  }

  private initMouseTracking(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Use NgZone.runOutsideAngular to avoid triggering change detection
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('mousemove', this.onMouseMove, { passive: true });
      this.animate();
    });
  }

  private onMouseMove = (event: MouseEvent): void => {
    this.targetX = event.clientX;
    this.targetY = event.clientY;
  };

  private animate = (): void => {
    // Smooth interpolation for better performance
    this.mouseX += (this.targetX - this.mouseX) * 0.15;
    this.mouseY += (this.targetY - this.mouseY) * 0.15;

    const current = this.cursorState$.value;
    
    // Only update if position changed significantly (reduces unnecessary emissions)
    const dx = Math.abs(current.x - this.mouseX);
    const dy = Math.abs(current.y - this.mouseY);
    
    if (dx > 0.5 || dy > 0.5) {
      this.ngZone.run(() => {
        this.cursorState$.next({
          ...current,
          x: this.mouseX,
          y: this.mouseY,
        });
      });
    }

    this.rafId = requestAnimationFrame(this.animate);
  };

  updatePosition(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  setHover(
    isHovering: boolean,
    hoverType?: 'link' | 'button' | 'image' | 'text',
    scale: number = 1.5
  ): void {
    const current = this.cursorState$.value;
    
    // Only update if state actually changed
    if (
      current.isHovering !== isHovering ||
      current.hoverType !== hoverType ||
      current.scale !== (isHovering ? scale : 1)
    ) {
      this.cursorState$.next({
        ...current,
        isHovering,
        hoverType,
        scale: isHovering ? scale : 1,
      });
    }
  }

  reset(): void {
    this.setHover(false);
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousemove', this.onMouseMove);
    }
    this.isInitialized = false;
  }
}
