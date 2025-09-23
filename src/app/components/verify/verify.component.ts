import { Component, ViewChild } from '@angular/core';
import { HashInputComponent } from '../hash-input/hash-input.component';
import { ActivatedRoute } from '@angular/router';
import { KaspaService } from '../../services/kaspa.service';
import { SharedModule } from '../../shared/shared.module';
import { environment } from '../../../environments/environment';
import { Transaction } from '../../models/transaction';
import { BlockData } from '../../models/block-data';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [HashInputComponent, SharedModule],
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss'],
})
export class VerifyComponent {
  @ViewChild(HashInputComponent, { static: false }) hashInputComponent!: HashInputComponent;
  txid: string = '';
  transaction: Transaction | null = null;
  blockData: BlockData | null = null;
  uploadedHash: string | null = null;
  inputType: 'file' | 'text' = 'file';
  match: boolean | null = null;
  loading: boolean = false;
  archivalNode: string = 'kas.fyi';

  constructor(private route: ActivatedRoute, private kaspaService: KaspaService) {
    this.route.queryParams.subscribe(params => {
      this.txid = params['txid'] || '';
      this.inputType = params['inputType'] || 'file';
      if (this.inputType !== 'file' && this.inputType !== 'text') {
        this.inputType = 'file';
      }
      this.archivalNode = params['archivalNode'];
      if (this.archivalNode !== 'kas.fyi' && this.archivalNode !== 'kaspa.org') {
        this.archivalNode = 'kas.fyi';
      }
      this.checkHash();
    });
  }

  async checkHash() {
    this.loading = true;
    try {
      this.transaction = await this.kaspaService.getTransaction(this.txid, this.archivalNode);
      this.blockData = {
        txid: this.txid,
        timestamp: new Date(this.transaction.blockTime).toISOString(),
        hash: this.transaction.payload,
        accepted: this.transaction.isAccepted,
      };
    } catch (err) {
      console.error('Error fetching transaction:', err);
    }
    this.loading = false;
  }

  async onHashGenerated(hash: string | null) {
    this.uploadedHash = hash;
    this.match = this.blockData ? this.blockData.hash === hash : false;
  }

  changeArchivalNode(node: string) {
    // reload the page with the new archival node
    const queryParams: any = { txid: this.txid, inputType: this.inputType };
    queryParams.archivalNode = node;
    const queryString = new URLSearchParams(queryParams).toString();
    window.location.href = `/verify?${queryString}`;
  }

  get getTxUrl(): string {
    if (!this.blockData) return '';
    if (this.archivalNode === 'kas.fyi') {
      return environment.kasFyiUrl(this.blockData.txid);
    }
    return environment.kaspaOrgUrl(this.blockData.txid);
  }
}
