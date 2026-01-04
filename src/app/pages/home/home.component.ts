import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HeroComponent } from '../hero/hero.component';
import { AboutComponent } from '../about/about.component';
import { SkillsComponent } from '../skills/skills.component';
import { ExperienceComponent } from '../experience/experience.component';
import { GitHubStatsComponent } from '../github-stats/github-stats.component';
import { ContactComponent } from '../contact/contact.component';

@Component({
    selector: 'app-home',
    imports: [
        HeroComponent,
        AboutComponent,
        SkillsComponent,
        ExperienceComponent,
        GitHubStatsComponent,
        ContactComponent,
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent { }
