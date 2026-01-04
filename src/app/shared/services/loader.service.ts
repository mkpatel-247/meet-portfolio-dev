import { Injectable, signal } from '@angular/core';

/**
 * Service to manage global loading state.
 * Use this to show/hide loading indicators during async operations.
 *
 * Usage:
 * - inject(LoaderService).show() - Show the loader
 * - inject(LoaderService).hide() - Hide the loader
 * - inject(LoaderService).isLoading() - Check if loader is visible (signal)
 */
@Injectable({ providedIn: 'root' })
export class LoaderService {
    /**
     * Loading state as a signal for reactive updates
     */
    private readonly _isLoading = signal(false);

    /**
     * Counter to track nested loading calls
     * Prevents hiding when multiple operations are in progress
     */
    private loadingCount = 0;

    /**
     * Read-only signal for loading state
     */
    readonly isLoading = this._isLoading.asReadonly();

    /**
     * Show the loader.
     * Supports nested calls - loader stays visible until all show() calls have matching hide() calls.
     */
    show(): void {
        this.loadingCount++;
        this._isLoading.set(true);
    }

    /**
     * Hide the loader.
     * Only hides when all nested show() calls have been matched with hide().
     */
    hide(): void {
        if (this.loadingCount > 0) {
            this.loadingCount--;
        }
        if (this.loadingCount === 0) {
            this._isLoading.set(false);
        }
    }

    /**
     * Force hide the loader, resetting all nested calls.
     * Use sparingly - prefer hide() for proper nesting support.
     */
    forceHide(): void {
        this.loadingCount = 0;
        this._isLoading.set(false);
    }

    /**
     * Execute an async operation with automatic loader management.
     * Shows loader before, hides after (even on error).
     *
     * @param operation - The async operation to execute
     * @returns Promise resolving to the operation result
     *
     * @example
     * const data = await loaderService.withLoader(() => fetchData());
     */
    async withLoader<T>(operation: () => Promise<T>): Promise<T> {
        this.show();
        try {
            return await operation();
        } finally {
            this.hide();
        }
    }
}
