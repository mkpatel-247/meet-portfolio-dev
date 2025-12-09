import { Component } from '@angular/core';
import { CursorHoverDirective } from '../../app/shared/directives/cursor-hover.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CursorHoverDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  aboutMe = [
    'A Software Engineer who builds scalable, secure, and high-performance applications using the MEAN stack. My journey began with small experiments and debugging sessions, but it quickly evolved into a deep interest in how real systems work, how users think, and how technology can solve meaningful problems. ',
    'Over the years, I’ve worked across SaaS, fintech, event platforms, automation workflows, and multi-tenant systems, which shaped my understanding of clean architecture and practical engineering. I enjoy designing modular APIs, optimizing backend performance, integrating modern tools like WebSockets, and creating reliable, production-ready systems.',
    'What drives me is the desire to think beyond code — to understand products, solve complex challenges, and create solutions that scale. My long-term goal is to become a Solution Architect and build impactful, tech-enabled businesses.',
    'This portfolio reflects my growth, curiosity, and the vision I’m working toward. <br> Let’s connect and build something meaningful together.',
  ];
}
