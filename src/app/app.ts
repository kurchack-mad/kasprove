import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from './shared/shared.module';
import { environment } from '../environments/environment';
import { NgxTurnstileModule } from "ngx-turnstile";
import { KaspaService } from './services/kaspa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SharedModule, RouterModule, NgxTurnstileModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {
  year = new Date().getFullYear();
  donationAddress = 'kaspa:qr4nttauujymttrc6yhajhn0jzvn65z6tuwye0ma6shzsm7u4z6mqd36hqa85';
  copiedDonation: boolean = false;
  turnstileSiteKey = environment.turnstileSiteKey;

  constructor(private kaspaService: KaspaService) { }

  get captchaValue(): string | null {
    return this.kaspaService.recaptchaToken;
  }

  onCaptchaResponse(token: string | null) {
    this.kaspaService.recaptchaToken = token;
  }

  copyDonationAddress() {
    navigator.clipboard.writeText(this.donationAddress);
    this.copiedDonation = true;
    setTimeout(() => {
      this.copiedDonation = false;
    }, 3000);
  }
}
