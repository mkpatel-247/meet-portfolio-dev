import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CursorHoverDirective } from '../../shared/directives/cursor-hover.directive';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { ABOUT_ME_DATA } from '../../shared/data/portfolio-data';

/**
 * About component displays personal information and background
 * Uses signals for reactive state management
 */
@Component({
  selector: 'app-about',
  imports: [CursorHoverDirective, SectionTitleComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  /**
   * About me content data for the about section
   */
  protected readonly aboutMe = signal(ABOUT_ME_DATA);
}
