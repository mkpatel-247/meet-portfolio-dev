/**
 * Blog data models for the blog landing page
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
