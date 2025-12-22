import { Injectable } from '@angular/core';
import { BlogArticle, FeaturedPost } from '../models/blog.models';

/**
 * Service to provide blog data.
 * Currently uses static data, can be extended for API integration.
 */
@Injectable({ providedIn: 'root' })
export class BlogService {
    /**
     * Returns the featured blog post
     */
    getFeaturedPost(): FeaturedPost {
        return {
            id: 'featured-1',
            title: 'The Art of Debouncing in React',
            excerpt:
                'A deep dive into implementing effective debouncing and throttling hooks to prevent unnecessary re-renders in large-scale Next.js applications.',
            category: 'Performance',
            categoryColor: 'accent',
            date: 'Oct 26, 2025',
            readTime: '12 min read',
            slug: 'debouncing-in-react',
            visualIcon: '{ }',
        };
    }

    /**
     * Returns all blog articles
     */
    getArticles(): BlogArticle[] {
        return [
            {
                id: 'article-1',
                title: 'Migrating from Thunks to RTK Query',
                excerpt:
                    'Why the boilerplate reduction was worth the migration effort in our production app.',
                category: 'Redux Toolkit',
                categoryColor: 'accent',
                date: 'Sept 15, 2025',
                slug: 'thunks-to-rtk-query',
            },
            {
                id: 'article-2',
                title: 'Understanding V8 Hidden Classes',
                excerpt:
                    'Writing JavaScript that keeps the JIT compiler happy for maximum execution speed.',
                category: 'V8 Engine',
                categoryColor: 'green',
                date: 'Aug 28, 2025',
                slug: 'v8-hidden-classes',
            },
            {
                id: 'article-3',
                title: 'Resilient API Error Handling',
                excerpt:
                    'A centralized strategy for handling 400s and 500s in Express applications.',
                category: 'Node.js',
                categoryColor: 'red',
                date: 'July 10, 2025',
                slug: 'api-error-handling',
            },
            {
                id: 'article-4',
                title: 'Mastering CSS Grid Layout',
                excerpt:
                    'Moving beyond Flexbox: When and how to use Grid for complex 2D layouts.',
                category: 'CSS',
                categoryColor: 'yellow',
                date: 'June 15, 2025',
                slug: 'css-grid-layout',
            },
            {
                id: 'article-5',
                title: 'Database Indexing Strategies',
                excerpt:
                    'How B-Trees work and how to optimize your SQL queries for scale.',
                category: 'System Design',
                categoryColor: 'purple',
                date: 'May 22, 2025',
                slug: 'database-indexing',
            },
        ];
    }
}
