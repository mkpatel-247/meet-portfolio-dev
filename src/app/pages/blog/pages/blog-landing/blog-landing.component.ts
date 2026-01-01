import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogHeroComponent } from '../../components/blog-hero/blog-hero.component';
import { BlogFeaturedPostComponent } from '../../components/blog-featured-post/blog-featured-post.component';
import { BlogArticleCardComponent } from '../../components/blog-article-card/blog-article-card.component';
import { BlogService } from '../../services/blog.service';
import { BlogArticle, FeaturedPost } from '../../models/blog.models';

@Component({
    selector: 'app-blog-landing',
    imports: [
        CommonModule,
        BlogHeroComponent,
        BlogFeaturedPostComponent,
        BlogArticleCardComponent,
    ],
    templateUrl: './blog-landing.component.html',
    styleUrl: './blog-landing.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogLandingComponent implements OnInit {
    private readonly blogService = inject(BlogService);

    featuredPost!: FeaturedPost;
    articles: BlogArticle[] = [];

    ngOnInit(): void {
        this.featuredPost = this.blogService.getFeaturedPost();
        this.articles = this.blogService.getArticles();
    }
}
