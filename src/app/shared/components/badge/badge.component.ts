import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  @Input() label = '';
  @Input() iconUrl = '';
  @Input() highlighted = false;
}
