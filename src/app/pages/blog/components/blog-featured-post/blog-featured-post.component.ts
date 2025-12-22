import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeaturedPost } from '../../models/blog.models';

@Component({
    selector: 'app-blog-featured-post',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './blog-featured-post.component.html',
    styleUrl: './blog-featured-post.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogFeaturedPostComponent {
    @Input({ required: true }) post!: FeaturedPost;
}
