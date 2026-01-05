import {
  Component,
  ChangeDetectionStrategy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CursorService } from '../../core/services/cursor.service';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private cursorService = inject(CursorService, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);
  isBrowser: boolean = false;

  contactForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['General Inquiry', [Validators.required]],
    message: ['', [Validators.required]],
  });

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  onSubmit() {
    if (this.contactForm.valid) {
      console.log('Form Submitted', this.contactForm.value);
      // Here you would typically handle the form submission, e.g., send to an API
      this.contactForm.reset({
        subject: 'General Inquiry',
      });
      alert('Message sent successfully!');
    } else {
      this.contactForm.markAllAsTouched();
    }
  }

  onHover(type: 'link' | 'button' | 'image' | 'text'): void {
    if (this.isBrowser && this.cursorService) {
      this.cursorService.setHover(
        true,
        type,
        type === 'button' ? 1.8 : type === 'image' ? 1.5 : 1.3
      );
    }
  }

  onLeave(): void {
    if (this.isBrowser && this.cursorService) {
      this.cursorService.reset();
    }
  }
}
