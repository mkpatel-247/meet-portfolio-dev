import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-blog-hero',
    standalone: true,
    imports: [],
    templateUrl: './blog-hero.component.html',
    styleUrl: './blog-hero.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogHeroComponent { }
