import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

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

  constructor() {
    if (typeof window !== 'undefined') {
      this.initMouseTracking();
    }
  }

  private initMouseTracking(): void {
    fromEvent<MouseEvent>(document, 'mousemove')
      .pipe(throttleTime(16)) // ~60fps
      .subscribe((event) => {
        this.updatePosition(event.clientX, event.clientY);
      });
  }

  updatePosition(x: number, y: number): void {
    const current = this.cursorState$.value;
    this.cursorState$.next({
      ...current,
      x,
      y,
    });
  }

  setHover(
    isHovering: boolean,
    hoverType?: 'link' | 'button' | 'image' | 'text',
    scale: number = 1.5
  ): void {
    const current = this.cursorState$.value;
    this.cursorState$.next({
      ...current,
      isHovering,
      hoverType,
      scale: isHovering ? scale : 1,
    });
  }

  reset(): void {
    this.setHover(false);
  }
}
