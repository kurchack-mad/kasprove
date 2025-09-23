export interface TransactionOutput {
  transactionId: string;
  index: number;
  amount: string;
  scriptPublicKey: string;
  scriptPublicKeyAddress: string;
  scriptPublicKeyType: string;
}
