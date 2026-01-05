import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  IGitHubRepo,
  IGitHubStats,
  IGitHubUser,
  IGitHubPullRequest,
  IContributionStats,
  IContributionDay,
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
   * @param year Optional year to filter contributions (null for last 365 days)
   * @throws Error if username is invalid or API request fails
   */
  getGitHubStats(username: string, year: number | null = null): Observable<IGitHubStats> {
    if (!username || username.trim() === '') {
      return new Observable((observer) => {
        observer.error(new Error('GitHub username is required'));
      });
    }
    return forkJoin({
      user: this.getUser(username),
      repos: this.getRepos(username),
      pullRequests: this.getPullRequests(username).pipe(
        catchError(() => of([]))
      ),
      contributionStats: this.getContributionStats(username, year).pipe(
        catchError(() => of(undefined))
      ),
    }).pipe(
      map(({ user, repos, pullRequests, contributionStats }) => {
        const totalStars = repos.reduce(
          (sum, repo) => sum + repo.stargazers_count,
          0
        );
        const totalForks = repos.reduce(
          (sum, repo) => sum + repo.forks_count,
          0
        );

        // Get top 6 repos by stars
        const topRepos = [...repos]
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 6);

        return {
          user,
          repos,
          totalStars,
          totalForks,
          topRepos,
          contributionStats,
          pullRequestsCount: pullRequests.length,
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
   * Fetch pull requests for a user
   */
  private getPullRequests(username: string): Observable<IGitHubPullRequest[]> {
    return this.http
      .get<IGitHubPullRequest[]>(
        `${this.apiUrl}/search/issues?q=author:${username}+type:pr+is:merged&per_page=100`
      )
      .pipe(
        map((response: any) => response.items || []),
        catchError((error) => {
          console.error('Error fetching pull requests:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch contribution stats using github-contributions-api
   * API: https://github-contributions-api.jogruber.de
   * @param username GitHub username
   * @param year Optional year to filter (null for last 365 days)
   */
  private getContributionStats(
    username: string,
    year: number | null = null
  ): Observable<IContributionStats> {
    const currentYear = new Date().getFullYear();
    const contributionsApiUrl =
      'https://github-contributions-api.jogruber.de/v4';

    // Determine which years to fetch based on year parameter
    type ContributionResponse = {
      total: { [year: string]: number };
      contributions: Array<{ date: string; count: number; level: number }>;
    };

    if (year !== null) {
      // Fetch specific year data
      return this.http
        .get<ContributionResponse>(
          `${contributionsApiUrl}/${username}?y=${year}`
        )
        .pipe(
          catchError(() =>
            of<ContributionResponse>({ total: {}, contributions: [] })
          ),
          map((yearData) => {
            // Filter contributions to the selected year only
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = year === currentYear ? new Date() : new Date(year, 11, 31, 23, 59, 59);

            const contributionsByDay: IContributionDay[] = yearData.contributions
              .filter((day) => {
                const date = new Date(day.date);
                return date >= startOfYear && date <= endOfYear;
              })
              .map((day) => ({
                date: day.date,
                count: day.count,
                level: day.level,
              }));

            // Sort by date
            contributionsByDay.sort((a, b) => a.date.localeCompare(b.date));

            // Calculate streaks
            const { currentStreak, longestStreak } =
              this.calculateStreaks(contributionsByDay);

            // Calculate totals for the year
            const contributionsThisYear = contributionsByDay.reduce(
              (sum, day) => sum + day.count,
              0
            );

            return {
              totalContributions: yearData.total[String(year)] || contributionsThisYear,
              currentStreak,
              longestStreak,
              contributionsThisYear,
              contributionsByDay,
            };
          })
        );
    }

    // Default: Fetch last 365 days using 'y=last' parameter
    return this.http
      .get<ContributionResponse>(
        `${contributionsApiUrl}/${username}?y=last`
      )
      .pipe(
        catchError(() =>
          of<ContributionResponse>({ total: {}, contributions: [] })
        ),
        map((data) => {
          const contributionsByDay: IContributionDay[] = data.contributions.map(
            (day) => ({
              date: day.date,
              count: day.count,
              level: day.level,
            })
          );

          // Sort by date
          contributionsByDay.sort((a, b) => a.date.localeCompare(b.date));

          // Calculate streaks
          const { currentStreak, longestStreak } =
            this.calculateStreaks(contributionsByDay);

          // Calculate totals
          const contributionsThisYear = contributionsByDay.reduce(
            (sum, day) => sum + day.count,
            0
          );

          return {
            totalContributions: contributionsThisYear,
            currentStreak,
            longestStreak,
            contributionsThisYear,
            contributionsByDay,
          };
        }),
        catchError((error) => {
          console.error('Error fetching contribution stats:', error);
          throw error;
        })
      );
  }

  /**
   * Calculate current and longest streaks
   */
  private calculateStreaks(days: IContributionDay[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (days.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate from most recent day backwards
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) {
        if (currentStreak === 0) {
          currentStreak = 1;
        } else if (i < days.length - 1 && days[i + 1].count > 0) {
          currentStreak++;
        }
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (currentStreak > 0 && i < days.length - 1) {
          // Streak broken
          break;
        }
        tempStreak = 0;
      }
    }

    return { currentStreak, longestStreak };
  }
}
