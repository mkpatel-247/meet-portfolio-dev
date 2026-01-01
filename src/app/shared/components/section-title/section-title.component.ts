import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-section-title',
  imports: [],
  templateUrl: './section-title.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionTitleComponent {
  @Input() title = '';
  @Input() showBackground = true;
  @Input() backgroundText = '';
}
