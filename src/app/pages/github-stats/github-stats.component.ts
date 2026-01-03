
import {
  Component,
  OnInit,
  inject,
  PLATFORM_ID,
  DestroyRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GitHubStatsService } from '../../core/services/github-stats.service';
import { ThemeService } from '../../core/services/theme.service';
import { CursorHoverDirective } from '../../shared/directives/cursor-hover.directive';
import { IGitHubStats } from '../../core/interface/github.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';

@Component({
  selector: 'app-github-stats',
  imports: [CursorHoverDirective, SectionTitleComponent],
  templateUrl: './github-stats.component.html',
  styleUrl: './github-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GitHubStatsComponent implements OnInit {
  private readonly githubStatsService = inject(GitHubStatsService);
  private readonly themeService = inject(ThemeService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // TODO: Replace with your GitHub username
  readonly githubUsername = 'mkpatel-247'; // Change this to your GitHub username

  stats: IGitHubStats | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadGitHubStats();
    }
  }

  loadGitHubStats(): void {
    if (!this.githubUsername || this.githubUsername.trim() === '') {
      this.error = 'Please set your GitHub username in the component';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.githubStatsService
      .getGitHubStats(this.githubUsername)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load GitHub stats:', err);
          this.error =
            'Failed to load GitHub statistics. Please check your username and try again.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Get the date from one year ago for display in tooltip
   */
  getOneYearAgoDate(): string {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    return oneYearAgo.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  getLanguageColor(language: string): string {
    const colors: { [key: string]: string } = {
      TypeScript: '#3178c6',
      JavaScript: '#f7df1e',
      Python: '#3776ab',
      Java: '#ed8b00',
      'C++': '#00599c',
      Go: '#00add8',
      Rust: '#000000',
      PHP: '#777bb4',
      Ruby: '#cc342d',
      Swift: '#fa7343',
      Kotlin: '#7f52ff',
      HTML: '#e34c26',
      CSS: '#1572b6',
      SCSS: '#c6538c',
      Vue: '#4fc08d',
      React: '#61dafb',
      Angular: '#dd0031',
      'C#': '#239120',
      Dart: '#0175c2',
      Shell: '#89e051',
      Dockerfile: '#384d54',
      Other: '#6e7681',
    };

    return colors[language] || colors['Other'];
  }

  /**
   * Get contribution graph organized by weeks
   * Shows only the exact 365 days without padding at the end
   */
  getContributionWeeks(): Array<
    Array<{ date: string; count: number; level: number }>
  > {
    if (!this.stats?.contributionStats) return [];

    const days = this.stats.contributionStats.contributionsByDay;
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
  getContributionColor(level: number): string {
    const isDark = this.themeService.isDarkTheme();

    if (isDark) {
      // Dark theme colors - increased opacity for better visibility
      const darkColors = [
        'rgba(255, 255, 255, 0.15)', // 0 - no contributions (much more visible)
        'rgba(255, 140, 0, 0.5)',    // 1 - low
        'rgba(255, 140, 0, 0.7)',    // 2 - medium
        'rgba(255, 140, 0, 0.85)',   // 3 - high
        'rgba(255, 140, 0, 1)',      // 4 - very high (bright orange)
      ];
      return darkColors[level] || darkColors[0];
    } else {
      // Light theme colors - stronger colors for visibility
      const lightColors = [
        'rgba(0, 0, 0, 0.1)',        // 0 - no contributions (more visible)
        'rgba(255, 140, 0, 0.4)',    // 1 - low
        'rgba(255, 140, 0, 0.6)',    // 2 - medium
        'rgba(255, 140, 0, 0.8)',    // 3 - high
        'rgba(255, 140, 0, 1)',      // 4 - very high
      ];
      return lightColors[level] || lightColors[0];
    }
  }

  /**
   * Get month labels for contribution graph
   * Returns an array with month labels positioned at the start of each month
   */
  getMonthLabels(): Array<{ label: string; position: number }> {
    if (!this.stats?.contributionStats) return [];

    const weeks = this.getContributionWeeks();
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
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
