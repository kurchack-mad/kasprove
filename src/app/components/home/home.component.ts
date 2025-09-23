import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { KaspaService } from '../../services/kaspa.service';
import { SharedModule } from '../../shared/shared.module';
import { HashInputComponent } from '../hash-input/hash-input.component';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HashInputComponent, SharedModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  @ViewChild(HashInputComponent, { static: false }) hashInputComponent!: HashInputComponent;
  hash: string | null = null;
  url: string | null = null;
  inscribing: boolean = false;
  copied: boolean = false;
  errorMessage: string = '';

  constructor(private kaspaService: KaspaService) { }

  onHashGenerated(hash: string | null) {
    if (this.url) {
      return;
    }
    this.hash = hash;
    this.url = null;
  }

  async inscribeHash() {
    if (!this.hash) return;
    this.inscribing = true;
    this.errorMessage = '';
    try {
      const txid = await this.kaspaService.inscribeHash(this.hash);
      let url = `${environment.uiUrl}/verify?txid=${txid}`;
      url += `&inputType=${this.hashInputComponent.inputType}`;
      this.url = url;
    } catch (err) {
      this.errorMessage = 'Failed to upload hash. Please try again.';
      console.error('Error inscribing hash:', err);
    }
    this.inscribing = false;
  }

  copyUrl() {
    if (this.url) {
      navigator.clipboard.writeText(this.url);
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    }
  }
}
