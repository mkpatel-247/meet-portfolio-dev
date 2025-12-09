import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  IGitHubRepo,
  IGitHubStats,
  IGitHubUser,
} from '../interface/github.interface';

@Injectable({
  providedIn: 'root',
})
export class GitHubStatsService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.github.com';

  /**
   * Fetch GitHub user statistics
   * @param username GitHub username
   * @throws Error if username is invalid or API request fails
   */
  getGitHubStats(username: string): Observable<IGitHubStats> {
    if (!username || username.trim() === '') {
      return new Observable((observer) => {
        observer.error(new Error('GitHub username is required'));
      });
    }

    return forkJoin({
      user: this.getUser(username),
      repos: this.getRepos(username),
    }).pipe(
      map(({ user, repos }) => {
        const totalStars = repos.reduce(
          (sum, repo) => sum + repo.stargazers_count,
          0
        );
        const totalForks = repos.reduce(
          (sum, repo) => sum + repo.forks_count,
          0
        );

        // Calculate language statistics
        const languages: Record<string, number> = {};
        repos.forEach((repo) => {
          if (repo.language) {
            languages[repo.language] = (languages[repo.language] || 0) + 1;
          }
        });

        // Get top 6 repos by stars
        const topRepos = [...repos]
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 6);

        return {
          user,
          repos,
          totalStars,
          totalForks,
          languages,
          topRepos,
        };
      }),
      catchError((error) => {
        console.error('Error fetching GitHub stats:', error);
        const errorMessage =
          error?.error?.message ||
          error?.message ||
          'Failed to fetch GitHub statistics';
        throw new Error(errorMessage);
      })
    );
  }

  /**
   * Fetch GitHub user information
   * @param username GitHub username
   * @throws Error if user not found or API request fails
   */
  private getUser(username: string): Observable<IGitHubUser> {
    return this.http.get<IGitHubUser>(`${this.apiUrl}/users/${username}`).pipe(
      catchError((error) => {
        console.error('Error fetching GitHub user:', error);
        const errorMessage =
          error?.status === 404
            ? `User "${username}" not found`
            : error?.error?.message ||
              error?.message ||
              'Failed to fetch user information';
        throw new Error(errorMessage);
      })
    );
  }

  /**
   * Fetch all repositories for a user
   */
  private getRepos(username: string): Observable<IGitHubRepo[]> {
    return this.http
      .get<IGitHubRepo[]>(
        `${this.apiUrl}/users/${username}/repos?sort=updated&per_page=100`
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching GitHub repos:', error);
          return of([]);
        })
      );
  }

  /**
   * Get contribution stats (requires GitHub token for private repos)
   * This is a placeholder - you can extend this with GitHub GraphQL API
   */
  getContributionStats(
    username: string
  ): Observable<{ totalContributions: number; streak: number }> {
    // Note: This would require GitHub GraphQL API or a proxy server
    // For now, we'll return basic stats
    return of({
      totalContributions: 0,
      streak: 0,
    });
  }
}
