import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CursorHoverDirective } from '../../shared/directives/cursor-hover.directive';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, CursorHoverDirective],
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
        { label: 'React', value: 'react' },
        { label: 'Angular', value: 'angular' },
        { label: 'Node.js', value: 'nodejs' },
        { label: 'TypeScript', value: 'ts' },
      ],
      layout: 'horizontal', // Horizontal badges
      position: 'top-left', // Top left position
    },
    {
      title: 'AI & Machine Learning',
      icon: '🤖',
      description: 'Deep diving into models and integration.',
      skills: [
        { label: 'Python', value: 'python' },
        { label: 'TensorFlow', value: 'tensorflow' },
        { label: 'OpenAI API', value: 'openai' },
        { label: 'PyTorch', value: 'pytorch' },
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
        { label: 'Docker', value: 'docker' },
        { label: 'AWS', value: 'aws' },
        { label: 'Nginx', value: 'nginx' },
      ],
      layout: 'horizontal', // Horizontal badges
      position: 'bottom-left', // Bottom left position
    },
    {
      title: 'Essential Tools',
      icon: '🛠️',
      description: '', // No description for this card
      skills: [
        { label: 'Git / GitHub', value: 'github' },
        { label: 'Linux', value: 'linux' },
        { label: 'Postman', value: 'postman' },
      ],
      layout: 'vertical-right', // Vertical list with text on left, logo on right
      position: 'bottom-middle', // Bottom middle position
    },
  ];
}
