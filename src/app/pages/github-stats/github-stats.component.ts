
import {
  Component,
  inject,
  PLATFORM_ID,
  DestroyRef,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GitHubStatsService } from '../../core/services/github-stats.service';
import { ThemeService } from '../../core/services/theme.service';
import { CursorHoverDirective } from '../../shared/directives/cursor-hover.directive';
import { IGitHubStats } from '../../core/interface/github.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { LANGUAGE_COLORS } from '../../shared/constants/language-colors.constant';

/**
 * GitHub Stats component displays user statistics, contribution graph, and top repositories
 * Uses signals for reactive state management and computed values for performance
 */
@Component({
  selector: 'app-github-stats',
  imports: [CursorHoverDirective, SectionTitleComponent],
  templateUrl: './github-stats.component.html',
  styleUrl: './github-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GitHubStatsComponent {
  private readonly githubStatsService = inject(GitHubStatsService);
  private readonly themeService = inject(ThemeService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  // Configuration
  protected readonly githubUsername = 'mkpatel-247';

  // State signals
  protected readonly stats = signal<IGitHubStats | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  // Computed values - only recalculate when dependencies change
  protected readonly contributionWeeks = computed(() =>
    this.calculateContributionWeeks()
  );
  protected readonly monthLabels = computed(() =>
    this.calculateMonthLabels()
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadGitHubStats();
    }
  }

  /**
   * Load GitHub statistics for the configured username
   */
  private loadGitHubStats(): void {
    if (!this.githubUsername || this.githubUsername.trim() === '') {
      this.error.set('Please set your GitHub username in the component');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.githubStatsService
      .getGitHubStats(this.githubUsername)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.stats.set(stats);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load GitHub stats:', err);
          this.error.set(
            'Failed to load GitHub statistics. Please check your username and try again.'
          );
          this.loading.set(false);
        },
      });
  }

  /**
   * Get the date from one year ago for display in tooltip
   */
  protected getOneYearAgoDate(): string {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    return oneYearAgo.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Format number with k suffix for thousands
   */
  protected formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  /**
   * Get language color from predefined color map
   */
  protected getLanguageColor(language: string): string {
    return LANGUAGE_COLORS[language] || LANGUAGE_COLORS['Other'];
  }

  /**
   * Calculate contribution graph organized by weeks
   * Shows only the exact 365 days without padding at the end
   */
  private calculateContributionWeeks(): Array<
    Array<{ date: string; count: number; level: number }>
  > {
    const currentStats = this.stats();
    if (!currentStats?.contributionStats) return [];

    const days = currentStats.contributionStats.contributionsByDay;
    if (days.length === 0) return [];

    const weeks: Array<Array<{ date: string; count: number; level: number }>> =
      [];
    let currentWeek: Array<{ date: string; count: number; level: number }> = [];

    // Process days without adding padding at the beginning
    days.forEach((day, index) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();

      // Add the current day to the current week
      currentWeek.push({
        date: day.date,
        count: day.count,
        level: day.level,
      });

      // If it's Saturday (end of week) or the last day, push the week
      if (dayOfWeek === 6 || index === days.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return weeks;
  }

  /**
   * Get contribution color based on level
   * Theme-aware: uses different colors for light/dark themes
   */
  protected getContributionColor(level: number): string {
    const isDark = this.themeService.isDarkTheme();

    if (isDark) {
      // Dark theme colors - increased opacity for better visibility
      const darkColors = [
        'rgba(255, 255, 255, 0.15)', // 0 - no contributions (much more visible)
        'rgba(255, 140, 0, 0.5)', // 1 - low
        'rgba(255, 140, 0, 0.7)', // 2 - medium
        'rgba(255, 140, 0, 0.85)', // 3 - high
        'rgba(255, 140, 0, 1)', // 4 - very high (bright orange)
      ];
      return darkColors[level] || darkColors[0];
    } else {
      // Light theme colors - stronger colors for visibility
      const lightColors = [
        'rgba(0, 0, 0, 0.1)', // 0 - no contributions (more visible)
        'rgba(255, 140, 0, 0.4)', // 1 - low
        'rgba(255, 140, 0, 0.6)', // 2 - medium
        'rgba(255, 140, 0, 0.8)', // 3 - high
        'rgba(255, 140, 0, 1)', // 4 - very high
      ];
      return lightColors[level] || lightColors[0];
    }
  }

  /**
   * Calculate month labels for contribution graph
   * Returns an array with month labels positioned at the start of each month
   */
  private calculateMonthLabels(): Array<{ label: string; position: number }> {
    const weeks = this.contributionWeeks();
    if (weeks.length === 0) return [];

    const monthLabels: Array<{ label: string; position: number }> = [];
    const seenMonths = new Set<string>();

    // Find first day of each month in the weeks
    weeks.forEach((week, weekIndex) => {
      for (const day of week) {
        if (!day.date) continue;

        const date = new Date(day.date);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        const dayOfMonth = date.getDate();

        // Show month label on the first occurrence (day 1-7) of each month
        if (dayOfMonth <= 7 && !seenMonths.has(monthKey)) {
          monthLabels.push({ label: monthKey, position: weekIndex });
          seenMonths.add(monthKey);
          break; // Only one label per week
        }
      }
    });

    return monthLabels;
  }

  /**
   * Format date for tooltip
   */
  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
