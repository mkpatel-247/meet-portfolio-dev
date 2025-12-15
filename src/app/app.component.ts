import {
  Component,
  PLATFORM_ID,
  OnInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './content/navbar/navbar.component';
import { FooterComponent } from './content/footer/footer.component';
import { HeroComponent } from './hero/hero.component';
import { isPlatformBrowser } from '@angular/common';
import * as AOS from 'aos';
import { AboutComponent } from './about/about.component';
import { SkillsComponent } from './skills/skills.component';
import { ExperienceComponent } from './experience/experience.component';
import { ContactComponent } from './contact/contact.component';
import { CustomCursorComponent } from './shared/components/custom-cursor/custom-cursor.component';
import { GitHubStatsComponent } from './github-stats/github-stats.component';
import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    HeroComponent,
    AboutComponent,
    SkillsComponent,
    ExperienceComponent,
    GitHubStatsComponent,
    ContactComponent,
    CustomCursorComponent,
    ChatComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit {
  readonly title = 'meet-portfolio';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    // AOS initialization moved to ngAfterViewInit to avoid duplicate initialization
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize AOS immediately after view init for faster loading
      requestAnimationFrame(() => {
        AOS.init({
          once: true,
          duration: 800,
          offset: 50,
          delay: 0,
        });
        this.cdr.markForCheck();
      });
    }
  }
}
