import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CursorHoverDirective } from '../../shared/directives/cursor-hover.directive';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { ABOUT_ME_DATA } from '../../shared/data/portfolio-data';

@Component({
  selector: 'app-about',
  imports: [CursorHoverDirective, SectionTitleComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent {
  aboutMe = ABOUT_ME_DATA;
}
