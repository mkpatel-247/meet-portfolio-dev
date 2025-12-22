import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/home/home.component').then((m) => m.HomeComponent),
        title: 'Meet Patel | Full Stack Developer',
    },
    {
        path: 'blog',
        loadComponent: () =>
            import('./pages/blog/pages/blog-landing/blog-landing.component').then(
                (m) => m.BlogLandingComponent
            ),
        title: 'Blog | Meet Patel',
    },
    {
        path: 'blog/:slug',
        loadComponent: () =>
            import('./pages/blog/pages/blog-detail/blog-detail.component').then(
                (m) => m.BlogDetailComponent
            ),
        title: 'Blog | Meet Patel',
    },
];
