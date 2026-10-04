import { Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ticket-form',
  imports: [FormsModule],
  templateUrl: './ticket-form.html',
  styleUrl: './ticket-form.scss',
})
export class TicketForm {
  readonly saving = input(false);
  readonly error = input('');
  readonly success = input('');

  readonly submitted = output<{
    title: string;
    description: string;
  }>();

  title = '';
  description = '';
  validationError = '';

  constructor() {
    effect(() => {
      if (this.success()) {
        this.title = '';
        this.description = '';
        this.validationError = '';
      }
    });
  }

  submit(): void {
    if (this.saving()) {
      return;
    }

    const title = this.title.trim();
    const description = this.description.trim();

    if (!title || !description) {
      this.validationError = 'Fyll i både rubrik och beskrivning.';
      return;
    }

    this.validationError = '';
    this.submitted.emit({ title, description });
  }
}