import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  PLATFORM_ID,
  DestroyRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GitHubStatsService } from '../shared/services/github-stats.service';
import { CursorHoverDirective } from '../shared/directives/cursor-hover.directive';
import { IGitHubStats } from '../shared/interface/github.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-github-stats',
  standalone: true,
  imports: [CommonModule, CursorHoverDirective],
  templateUrl: './github-stats.component.html',
  styleUrl: './github-stats.component.scss',
})
export class GitHubStatsComponent implements OnInit {
  private readonly githubStatsService = inject(GitHubStatsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

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
      return;
    }

    this.loading = true;
    this.error = null;

    this.githubStatsService
      .getGitHubStats(this.githubUsername)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load GitHub stats:', err);
          this.error =
            'Failed to load GitHub statistics. Please check your username and try again.';
          this.loading = false;
        },
      });
  }

  getTopLanguages(): Array<{ name: string; count: number }> {
    if (!this.stats) return [];

    return Object.entries(this.stats.languages)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
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
}
