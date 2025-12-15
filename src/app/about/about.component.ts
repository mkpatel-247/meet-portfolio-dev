import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ABOUT_ME_DATA } from '../shared/data/portfolio-data';
import { CursorHoverDirective } from '../../app/shared/directives/cursor-hover.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CursorHoverDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  aboutMe = ABOUT_ME_DATA;
}
