import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Transaction } from '../models/transaction';

@Injectable({ providedIn: 'root' })
export class KaspaService {
  recaptchaToken: string | null = null;

  constructor(private httpClient: HttpClient) { }

  async inscribeHash(hash: string): Promise<string> {
    return firstValueFrom(
      this.httpClient.post<{ txid: string }>(
        `${environment.apiUrl}/api/v1/inscribe`,
        { hash },
        this.getTurnstileHeaders()
      ).pipe(
        map(response => response.txid)
      )
    );
  }

  async getTransaction(txid: string, archivalNode: string): Promise<Transaction> {
    return firstValueFrom(
      this.httpClient.get<Transaction>(
        `${environment.apiUrl}/api/v1/transactions/${txid}?archivalNode=${archivalNode}`,
        this.getTurnstileHeaders()
      )
    );
  }

  private getTurnstileHeaders(): { headers?: Record<string, string> } {
    return this.recaptchaToken ? { headers: { 'cf-turnstile-response': this.recaptchaToken } } : {};
  }
}
