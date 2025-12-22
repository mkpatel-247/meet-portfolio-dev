import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogArticle } from '../../models/blog.models';

@Component({
    selector: 'app-blog-article-card',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './blog-article-card.component.html',
    styleUrl: './blog-article-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogArticleCardComponent {
    @Input({ required: true }) article!: BlogArticle;

    /**
     * Returns the Tailwind color class for the category based on categoryColor
     */
    getCategoryColorClass(): string {
        const colorMap: Record<string, string> = {
            accent: 'text-[var(--accent-color)]',
            green: 'text-green-600 dark:text-green-400',
            red: 'text-red-600 dark:text-red-400',
            yellow: 'text-yellow-600 dark:text-yellow-400',
            purple: 'text-purple-600 dark:text-purple-400',
        };
        return colorMap[this.article.categoryColor] || colorMap['accent'];
    }
}
