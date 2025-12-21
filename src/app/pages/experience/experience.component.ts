import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IExperienceDetails } from '../../core/interface/experience.interface';
import { CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule, SectionTitleComponent],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceComponent {
  experienceDetails: IExperienceDetails[] = [
    {
      organization: 'Webcodegenie Technology Pvt. Ltd.',
      role: 'Software Engineer',
      startDate: 'Oct 2024',
      endDate: 'Present',
      description: [
        'Working on multiple projects from various domains, including automation workflows, logistics, medical, and multi-tenant platforms.',
        'Experienced in implementing authentication, authorization, JWT, RBAC, and secure API communication.',
        'Improved code quality using TypeScript best practices, reusable components, services, guards, and interceptors.',
      ],
    },
    {
      organization: 'Webcodegenie Technology Pvt. Ltd.',
      role: 'Software Engineer Intern',
      startDate: 'Apr 2024',
      endDate: 'Sep 2024',
      description: [
        'Built complete Angular CRUD applications using components, services, routing, and clean UI patterns.',
        'Recognized for strong performance during Angular training, which led to early exposure to backend technologies.',
        'Worked with Node.js, Express, and MongoDB to develop REST APIs and connect frontend modules with scalable backend services.',
      ],
    },
    {
      organization: 'Alhansat Solution',
      role: 'Software Engineer Intern',
      startDate: 'Sep 2023',
      endDate: 'Oct 2023',
      description: [
        'Assisted in developing invoice generators mini project to integrate with the company website as tools for real users.',
        'Gained foundational knowledge in working in team experience in remote culture and version control (Git).',
      ],
    },
  ];
}
