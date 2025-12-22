import { Injectable } from '@angular/core';
import {
    BlogArticle,
    FeaturedPost,
    BlogPost,
    BlogComment,
} from '../models/blog.models';

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

    /**
     * Returns a full blog post by slug
     */
    getPostBySlug(slug: string): BlogPost | null {
        const posts: Record<string, BlogPost> = {
            'debouncing-in-react': {
                id: 'featured-1',
                title: 'The Art of Debouncing in React: A Comprehensive Guide',
                excerpt:
                    'A deep dive into implementing effective debouncing and throttling hooks.',
                category: 'Performance',
                categoryColor: 'accent',
                categories: ['Performance', 'React'],
                date: 'October 26, 2025',
                readTime: '12 min read',
                slug: 'debouncing-in-react',
                author: {
                    name: 'Meet Patel',
                    initials: 'MP',
                    bio: 'Full Stack Developer passionate about building scalable systems. I write about React, Node.js, and Software Architecture.',
                    twitterUrl: 'https://twitter.com',
                },
                content: this.getDebounceArticleContent(),
                tags: ['#react', '#javascript', '#performance'],
                likes: 48,
                commentsCount: 2,
            },
        };
        return posts[slug] || null;
    }

    /**
     * Returns related posts (excluding the current slug)
     */
    getRelatedPosts(currentSlug: string, limit: number = 2): BlogArticle[] {
        return this.getArticles()
            .filter((article) => article.slug !== currentSlug)
            .slice(0, limit);
    }

    /**
     * Returns comments for a post
     */
    getComments(postSlug: string): BlogComment[] {
        return [
            {
                id: 'comment-1',
                authorName: 'Alex Chen',
                authorInitials: 'AC',
                authorColor: 'blue',
                content:
                    "Great explanation of debouncing! I've been using lodash for this, but seeing the hook implementation makes it much clearer how it works under the hood.",
                timestamp: '2 hours ago',
                helpfulCount: 5,
            },
            {
                id: 'comment-2',
                authorName: 'Jordan Smith',
                authorInitials: 'JS',
                authorColor: 'purple',
                content:
                    'Could you also cover `requestAnimationFrame` for scroll events? I find it sometimes works better than throttling for smooth animations.',
                timestamp: '5 hours ago',
                helpfulCount: 2,
            },
        ];
    }

    /**
     * Returns the HTML content for the debouncing article
     */
    private getDebounceArticleContent(): string {
        return `
      <p class="lead text-xl text-[var(--muted-dark)]">
        Optimizing performance is critical in modern web applications. One of the most common yet overlooked
        performance pitfalls occurs when handling high-frequency events like window resizing, scrolling, or user
        keystrokes.
      </p>

      <p>
        In this deep dive, we'll explore how to effectively implement <strong>Debouncing</strong> and
        <strong>Throttling</strong> hooks to manage state updates and prevent unnecessary re-renders in large-scale
        Next.js applications.
      </p>

      <h2>The Problem: Excessive Re-renders</h2>
      <p>
        Imagine a search bar that fetches data from an API as you type. If you attach a simple <code>onChange</code>
        handler, every single keystroke triggers an API call. For a user typing 60 words per minute, that's dozens of
        requests in seconds.
      </p>

      <div class="bg-[var(--card-dark)] border border-[var(--border-dark)] rounded-xl p-4 my-6 font-mono text-sm overflow-x-auto">
        <div class="flex gap-2 mb-2"><span class="text-red-500">REQ</span> <span class="text-[var(--muted-dark)]">GET /api/search?q=r</span></div>
        <div class="flex gap-2 mb-2"><span class="text-red-500">REQ</span> <span class="text-[var(--muted-dark)]">GET /api/search?q=re</span></div>
        <div class="flex gap-2 mb-2"><span class="text-red-500">REQ</span> <span class="text-[var(--muted-dark)]">GET /api/search?q=rea</span></div>
        <div class="flex gap-2"><span class="text-red-500">REQ</span> <span class="text-[var(--muted-dark)]">GET /api/search?q=reac</span></div>
      </div>

      <h2>The Solution: useDebounce Hook</h2>
      <p>
        Debouncing enforces that a function is not called again until a certain amount of time has passed since it was
        last called. Here is a robust TypeScript implementation of a <code>useDebounce</code> hook.
      </p>

      <pre><code class="language-tsx">import { useEffect, useState } from 'react';

export function useDebounce&lt;T&gt;(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}</code></pre>

      <h3>How to use it</h3>
      <p>
        You can now use this hook in your search component to delay the API call until the user has stopped typing for
        500ms.
      </p>

      <pre><code class="language-tsx">const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearch) {
    searchAPI(debouncedSearch);
  }
}, [debouncedSearch]);</code></pre>

      <h2>Throttling vs Debouncing</h2>
      <p>
        While debouncing waits for a pause, <strong>throttling</strong> ensures a function is called at most once in a
        specified time period. This is perfect for scroll events where you want continuous updates but at a controlled
        rate (e.g., checking scroll position every 100ms).
      </p>

      <ul>
        <li><strong>Debounce:</strong> Grouping a sudden burst of events (like typing).</li>
        <li><strong>Throttle:</strong> Guarantees a constant flow of executions (like scrolling).</li>
      </ul>

      <h2>Conclusion</h2>
      <p>
        By abstracting these logic patterns into reusable hooks, we keep our components clean and performant. In the
        next article, we will look at how <code>useTransition</code> in React 18 changes this landscape even further.
      </p>
    `;
    }
}
