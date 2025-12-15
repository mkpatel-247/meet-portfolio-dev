import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IExperienceDetails } from '../shared/interface/experience.interface';
import { EXPERIENCE_DATA } from '../shared/data/portfolio-data';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceComponent {
  experienceDetails: IExperienceDetails[] = EXPERIENCE_DATA;
}
