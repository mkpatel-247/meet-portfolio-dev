import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CursorHoverDirective } from '../../app/shared/directives/cursor-hover.directive';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, CursorHoverDirective],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss',
})
export class SkillsComponent {
  skillsData = [
    {
      label: 'HTML',
      value: 'html',
    },
    {
      label: 'CSS',
      value: 'css',
    },
    {
      label: 'JavaScript',
      value: 'js',
    },
    {
      label: 'TypeScript',
      value: 'ts',
    },
    {
      label: 'Angular',
      value: 'angular',
    },
    {
      label: 'GitHub',
      value: 'github',
    },
    {
      label: 'GitLab',
      value: 'gitlab',
    },
    {
      label: 'Tailwind CSS',
      value: 'tailwind',
    },
    {
      label: 'Bootstrap',
      value: 'bootstrap',
    },
    {
      label: 'Vite',
      value: 'vite',
    },
    {
      label: 'Redux',
      value: 'redux',
    },
    {
      label: 'RxJS',
      value: 'rxjs',
    },
    {
      label: 'Postman',
      value: 'postman',
    },
    {
      label: 'VS Code',
      value: 'vscode',
    },
    {
      label: 'Linux',
      value: 'linux',
    },
    {
      label: 'Bash',
      value: 'bash',
    },
    {
      label: 'Docker',
      value: 'docker',
    },
    {
      label: 'Nginx',
      value: 'nginx',
    },
    {
      label: 'Java',
      value: 'java',
    },
    {
      label: 'jQuery',
      value: 'jquery',
    },
    {
      label: 'Node.js',
      value: 'nodejs',
    },
    {
      label: 'Nest.js',
      value: 'nestjs',
    },
    {
      label: 'React',
      value: 'react',
    },
    {
      label: 'Express.js',
      value: 'expressjs',
    },
    {
      label: 'MongoDB',
      value: 'mongodb',
    },
    {
      label: 'MySQL',
      value: 'mysql',
    },
    {
      label: 'Go',
      value: 'golang',
    },
    {
      label: 'Python',
      value: 'python',
    },
    {
      label: 'Redis',
      value: 'redis',
    },
    {
      label: 'Django',
      value: 'django',
    },
    {
      label: 'Spring',
      value: 'spring',
    },
  ];
}
