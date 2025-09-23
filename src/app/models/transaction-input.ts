import { TransactionOutput } from './transaction-output';

export interface TransactionInput {
  transactionId: string;
  index: number;
  signatureScript: string;
  sigOpCount: number;
  previousOutput: TransactionOutput;
}
