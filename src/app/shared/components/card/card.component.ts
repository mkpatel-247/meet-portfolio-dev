import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @Input() position: 'top-left' | 'bottom-left' | 'bottom-middle' | 'right' =
    'top-left';
  @Input() layout: 'horizontal' | 'vertical-right' | 'vertical-left' =
    'horizontal';
  @Input() icon = '';
  @Input() title = '';
  @Input() description = '';
  @Input() highlighted = false;
}
