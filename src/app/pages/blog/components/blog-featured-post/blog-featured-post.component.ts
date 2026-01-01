import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FeaturedPost } from '../../models/blog.models';

@Component({
    selector: 'app-blog-featured-post',
    imports: [CommonModule, RouterLink],
    templateUrl: './blog-featured-post.component.html',
    styleUrl: './blog-featured-post.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogFeaturedPostComponent {
    @Input({ required: true }) post!: FeaturedPost;
}
