import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IExperienceDetails } from '../../core/interface/experience.interface';
import { CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { EXPERIENCE_DATA } from '../../shared/data/portfolio-data';

@Component({
  selector: 'app-experience',
  imports: [CommonModule, SectionTitleComponent],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperienceComponent {
  experienceDetails: IExperienceDetails[] = EXPERIENCE_DATA;
}
