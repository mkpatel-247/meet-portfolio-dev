import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import {
    BlogPost,
    BlogArticle,
    BlogComment,
} from '../../models/blog.models';

@Component({
    selector: 'app-blog-detail',
    imports: [RouterLink],
    templateUrl: './blog-detail.component.html',
    styleUrl: './blog-detail.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly blogService = inject(BlogService);

    post: BlogPost | null = null;
    relatedPosts: BlogArticle[] = [];
    comments: BlogComment[] = [];
    notFound = false;

    ngOnInit(): void {
        const slug = this.route.snapshot.paramMap.get('slug');
        if (slug) {
            this.post = this.blogService.getPostBySlug(slug);
            if (this.post) {
                this.relatedPosts = this.blogService.getRelatedPosts(slug, 2);
                this.comments = this.blogService.getComments(slug);
            } else {
                this.notFound = true;
            }
        } else {
            this.notFound = true;
        }
    }

    /**
     * Returns color classes for comment author avatars
     */
    getCommentColorClass(color: string): string {
        const colorMap: Record<string, string> = {
            blue: 'bg-blue-500/20 text-blue-500',
            purple: 'bg-purple-500/20 text-purple-500',
            green: 'bg-green-500/20 text-green-500',
            red: 'bg-red-500/20 text-red-500',
            yellow: 'bg-yellow-500/20 text-yellow-500',
        };
        return colorMap[color] || colorMap['blue'];
    }

    /**
     * Returns category color class for related posts
     */
    getCategoryColorClass(color: string): string {
        const colorMap: Record<string, string> = {
            accent: 'text-[var(--accent-color)]',
            green: 'text-green-600 dark:text-green-400',
            red: 'text-red-600 dark:text-red-400',
            yellow: 'text-yellow-600 dark:text-yellow-400',
            purple: 'text-purple-600 dark:text-purple-400',
        };
        return colorMap[color] || colorMap['accent'];
    }
}
