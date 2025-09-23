import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-hash-input',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './hash-input.component.html',
  styleUrls: ['./hash-input.component.scss'],
})
export class HashInputComponent {
  @Input() hash: string | null = null;
  @Input() inputType: 'file' | 'text' = 'file';
  @Input() disableChangeInputType: boolean = false;
  @Output() hashGenerated = new EventEmitter<string | null>();
  form: FormGroup = new FormGroup({
    text: new FormControl(''),
  });
  fileName: string = '';
  errorMessage: string = '';

  constructor() {
    this.watchForm();
  }

  private watchForm() {
    this.form
      .get('text')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(async (text: string) => {
        this.errorMessage = '';
        if (this.inputType === 'text' && text) {
          const encoder = new TextEncoder();
          const data = encoder.encode(text);
          const hash = await this.calculateHash(data);
          this.hash = hash;
          this.hashGenerated.emit(hash);
        } else if (this.inputType === 'text') {
          this.hash = null;
          this.hashGenerated.emit(null);
        }
      });
  }

  ngOnChanges(changes: any) {
    if (changes.inputType && changes.inputType.currentValue) {
      this.toggleType(changes.inputType.currentValue);
    }
  }

  toggleType(type: 'file' | 'text') {
    this.inputType = type;
    this.fileName = '';
    this.form.reset();
    this.hash = null;
  }

  async onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const hash = await this.calculateHash(new Uint8Array(arrayBuffer));
      this.hash = hash;
      this.hashGenerated.emit(hash);
    }
  }

  async calculateHash(data: Uint8Array): Promise<string> {
    const array = new Uint8Array(data);
    const buffer = await crypto.subtle.digest('SHA-256', array);
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
