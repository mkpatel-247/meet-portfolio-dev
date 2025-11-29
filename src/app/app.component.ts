import {
  Component,
  Inject,
  PLATFORM_ID,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './content/navbar/navbar.component';
import { FooterComponent } from './content/footer/footer.component';
import { HeroComponent } from './hero/hero.component';
import { isPlatformBrowser } from '@angular/common';
import Aos, * as AOS from 'aos';
import { AboutComponent } from './about/about.component';
import { SkillsComponent } from './skills/skills.component';
import { ExperienceComponent } from './experience/experience.component';
import { ContactComponent } from './contact/contact.component';
import { CustomCursorComponent } from './shared/components/custom-cursor/custom-cursor.component';

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
    ContactComponent,
    CustomCursorComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  title = 'meet-portfolio';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}
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
          delay: 0
        });
        this.cdr.markForCheck();
      });
    }
  }
}
