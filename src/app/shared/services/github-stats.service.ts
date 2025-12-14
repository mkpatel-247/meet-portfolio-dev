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
      pullRequests: this.getPullRequests(username).pipe(
        catchError(() => of([]))
      ),
      contributionStats: this.getContributionStats(username).pipe(
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
   */
  private getContributionStats(
    username: string
  ): Observable<IContributionStats> {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    const contributionsApiUrl =
      'https://github-contributions-api.jogruber.de/v4';

    // Fetch both current and previous year to get full year of data
    type ContributionResponse = {
      total: { [year: string]: number };
      contributions: Array<{ date: string; count: number; level: number }>;
    };

    return forkJoin({
      currentYearData: this.http
        .get<ContributionResponse>(
          `${contributionsApiUrl}/${username}?y=${currentYear}`
        )
        .pipe(
          catchError(() =>
            of<ContributionResponse>({ total: {}, contributions: [] })
          )
        ),
      previousYearData: this.http
        .get<ContributionResponse>(
          `${contributionsApiUrl}/${username}?y=${previousYear}`
        )
        .pipe(
          catchError(() =>
            of<ContributionResponse>({ total: {}, contributions: [] })
          )
        ),
    }).pipe(
      map(({ currentYearData, previousYearData }) => {
        // Combine contributions from both years, but prioritize current year
        // Filter to get only the last 365 days
        const now = new Date();
        const oneYearAgo = new Date(now);
        oneYearAgo.setDate(oneYearAgo.getDate() - 365);

        // Filter to last 365 days and remove duplicates (keep current year data)
        const contributionsByDay: IContributionDay[] = [];
        const seenDates = new Set<string>();

        // Process current year first (to prioritize it)
        currentYearData.contributions.forEach((day) => {
          const date = new Date(day.date);
          if (date >= oneYearAgo && !seenDates.has(day.date)) {
            contributionsByDay.push({
              date: day.date,
              count: day.count,
              level: day.level,
            });
            seenDates.add(day.date);
          }
        });

        // Then add previous year data for dates not in current year
        previousYearData.contributions.forEach((day) => {
          const date = new Date(day.date);
          if (date >= oneYearAgo && !seenDates.has(day.date)) {
            contributionsByDay.push({
              date: day.date,
              count: day.count,
              level: day.level,
            });
            seenDates.add(day.date);
          }
        });

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
        const totalContributions =
          (currentYearData.total[String(currentYear)] || 0) +
          (previousYearData.total[String(previousYear)] || 0);

        return {
          totalContributions,
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
