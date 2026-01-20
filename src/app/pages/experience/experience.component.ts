import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { IExperienceDetails } from '../../core/interface/experience.interface';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { EXPERIENCE_DATA } from '../../shared/data/portfolio-data';

/**
 * Experience component displays professional work history in a timeline format
 * Uses signals for reactive state management
 */
@Component({
  selector: 'app-experience',
  imports: [SectionTitleComponent],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceComponent {
  /**
   * Professional experience data for the experience timeline
   */
  protected readonly experienceDetails = signal<IExperienceDetails[]>(EXPERIENCE_DATA);
}
