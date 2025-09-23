import { TransactionInput } from "./transaction-input";
import { TransactionOutput } from "./transaction-output";

export interface Transaction {
  transactionId: string;
  blockTime: string;
  subnetworkId: string;
  hash: string;
  mass: string;
  blockHashes: string[];
  acceptingBlockHash: string;
  isAccepted: boolean;
  confirmations: number;
  payload: string;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
}
