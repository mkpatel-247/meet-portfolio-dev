/**
 * Blog data models for the blog landing and detail pages
 */
export interface BlogArticle {
    id: string;
    title: string;
    excerpt: string;
    category: string;
    categoryColor: 'accent' | 'green' | 'red' | 'yellow' | 'purple';
    date: string;
    slug: string;
}

export interface FeaturedPost extends BlogArticle {
    readTime: string;
    visualIcon?: string;
}

/**
 * Full blog post content for the detail page
 */
export interface BlogPost extends FeaturedPost {
    categories: string[];
    author: BlogAuthor;
    content: string; // HTML content
    tags: string[];
    likes: number;
    commentsCount: number;
}

export interface BlogAuthor {
    name: string;
    initials: string;
    bio: string;
    twitterUrl?: string;
}

export interface BlogComment {
    id: string;
    authorName: string;
    authorInitials: string;
    authorColor: string;
    content: string;
    timestamp: string;
    helpfulCount: number;
}
