import { Component, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './content/navbar/navbar.component';
import { FooterComponent } from './content/footer/footer.component';
import { HeroComponent } from './hero/hero.component';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, HeroComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'meet-portfolio';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async ngAfterViewInit() {
    // run only in browser
    if (!isPlatformBrowser(this.platformId)) return;

    // dynamic import so 'aos' code runs only in browser
    const AOS = (await import('aos')).default;
    AOS.init({ duration: 600, once: false });
  }
}
