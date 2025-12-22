import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../services/loader.service';

/**
 * Global loader component that displays when LoaderService.isLoading is true.
 * Place this component once in your app.component template.
 *
 * Features:
 * - Full-screen overlay with blur backdrop
 * - Modern spinning animation
 * - Reactive to LoaderService state via signals
 */
@Component({
    selector: 'app-loader',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (loaderService.isLoading()) {
      <div class="loader-overlay" role="status" aria-live="polite" aria-label="Loading">
        <div class="loader-container">
          <div class="loader-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
          <span class="loader-text">Loading...</span>
        </div>
      </div>
    }
  `,
    styleUrl: './loader.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderComponent {
    readonly loaderService = inject(LoaderService);
}
