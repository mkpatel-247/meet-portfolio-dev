import { Component } from '@angular/core';
import { CursorHoverDirective } from '../../app/shared/directives/cursor-hover.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CursorHoverDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {}
