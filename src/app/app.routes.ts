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
            import('./pages/blog/blog-landing.component').then(
                (m) => m.BlogLandingComponent
            ),
        title: 'Blog | Meet Patel',
    },
];
