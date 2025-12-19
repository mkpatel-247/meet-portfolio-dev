export interface IGitHubUser {
  login: string;
  name: string;
  bio: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
  created_at: string;
}

export interface IGitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
}

export interface IContributionDay {
  date: string;
  count: number;
  level: number; // 0 = no contributions, 4 = max
}

export interface IContributionStats {
  totalContributions: number;
  currentStreak: number;
  longestStreak: number;
  contributionsThisYear: number;
  contributionsByDay: IContributionDay[];
}

export interface IGitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface IGitHubStats {
  user: IGitHubUser;
  repos: IGitHubRepo[];
  totalStars: number;
  totalForks: number;
  topRepos: IGitHubRepo[];
  contributionStats?: IContributionStats;
  pullRequestsCount?: number;
}
