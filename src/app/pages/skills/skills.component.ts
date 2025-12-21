import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CursorHoverDirective } from '../../shared/directives/cursor-hover.directive';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, CursorHoverDirective, SectionTitleComponent],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsComponent {
  skillCategories = [
    {
      title: 'Full Stack Architecture',
      icon: '🖥️',
      description:
        'Building end-to-end scalable solutions with modern reliable frameworks.',
      skills: [
        { label: 'Angular', value: 'angular', deviconClass: 'devicon-angularjs-plain colored' },
        { label: 'Node.js', value: 'nodejs', deviconClass: 'devicon-nodejs-plain colored' },
        { label: 'Tailwindcss', value: 'tailwind', deviconClass: 'devicon-tailwindcss-plain colored' },
        { label: 'TypeScript', value: 'ts', deviconClass: 'devicon-typescript-plain colored' },
      ],
      layout: 'horizontal', // Horizontal badges
      position: 'top-left', // Top left position
    },
    {
      title: 'AI & Machine Learning',
      icon: '🤖',
      description: 'Deep diving into models and integration.',
      skills: [
        { label: 'Python', value: 'python', deviconClass: 'devicon-python-plain colored' },
        { label: 'TensorFlow', value: 'tensorflow', deviconClass: 'devicon-tensorflow-original colored' },
        // { label: 'OpenAI API', value: 'openai' },
        { label: 'AWS', value: 'aws', deviconClass: 'devicon-amazonwebservices-plain-wordmark colored' },
        { label: 'PyTorch', value: 'pytorch', deviconClass: 'devicon-pytorch-original colored' },
      ],
      layout: 'horizontal', // Horizontal badges like other cards
      // highlighted: true, // This card should be highlighted with orange border
      position: 'right', // Right column, full height
    },
    {
      title: 'Backend & DevOps',
      icon: '⚙️',
      description: '', // No description for this card
      skills: [
        { label: 'Docker', value: 'docker', deviconClass: 'devicon-docker-plain colored' },
        { label: 'Github Actions', value: 'githubactions', deviconClass: 'devicon-githubactions-plain colored' },
        { label: 'Nginx', value: 'nginx', deviconClass: 'devicon-nginx-original colored' },
      ],
      layout: 'horizontal', // Horizontal badges
      position: 'bottom-left', // Bottom left position
    },
    {
      title: 'Essential Tools',
      icon: '🛠️',
      description: '', // No description for this card
      skills: [
        { label: 'Git / GitHub', value: 'github', deviconClass: 'devicon-github-original colored' },
        { label: 'Linux', value: 'linux', deviconClass: 'devicon-linux-plain colored' },
        { label: 'Postman', value: 'postman', deviconClass: 'devicon-postman-plain colored' },
      ],
      layout: 'vertical-right', // Vertical list with text on left, logo on right
      position: 'bottom-middle', // Bottom middle position
    },
  ];
}
