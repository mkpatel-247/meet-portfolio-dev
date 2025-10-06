import { Component } from '@angular/core';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [],
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
  ];
}
