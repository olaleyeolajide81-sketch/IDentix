import * as StellarSdk from '@stellar/stellar-sdk';
import { freighterApi } from '@stellar/freighter-api';

export const STELLAR_NETWORK = 'TESTNET';
export const STELLAR_SERVER_URL = 'https://horizon-testnet.stellar.org';

let stellarServer: StellarSdk.Horizon.Server;

export function getStellarServer(): StellarSdk.Horizon.Server {
  if (!stellarServer) {
    stellarServer = new StellarSdk.Horizon.Server(STELLAR_SERVER_URL);
  }
  return stellarServer;
}

export async function connectStellarWallet(): Promise<string> {
  try {
    const isConnected = await freighterApi.isConnected();
    if (!isConnected) {
      throw new Error('Freighter wallet is not installed or connected');
    }

    const publicKey = await freighterApi.getPublicKey();
    if (!publicKey) {
      throw new Error('Failed to get public key from wallet');
    }

    return publicKey;
  } catch (error) {
    console.error('Error connecting to Stellar wallet:', error);
    throw error;
  }
}

export async function disconnectStellarWallet(): Promise<void> {
  // Freighter doesn't have a direct disconnect method
  // We'll handle this at the component level
  return Promise.resolve();
}

export async function signTransaction(transactionXdr: string): Promise<string> {
  try {
    const signedXdr = await freighterApi.signTransaction(transactionXdr, STELLAR_NETWORK);
    return signedXdr;
  } catch (error) {
    console.error('Error signing transaction:', error);
    throw error;
  }
}

export async function getAccountBalance(publicKey: string): Promise<StellarSdk.Horizon.BalanceLine[]> {
  try {
    const server = getStellarServer();
    const account = await server.loadAccount(publicKey);
    return account.balances;
  } catch (error) {
    console.error('Error getting account balance:', error);
    throw error;
  }
}

export async function sendPayment(
  fromPublicKey: string,
  toPublicKey: string,
  amount: string,
  asset: StellarSdk.Asset = StellarSdk.Asset.native()
): Promise<string> {
  try {
    const server = getStellarServer();
    const account = await server.loadAccount(fromPublicKey);
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: toPublicKey,
          asset,
          amount,
        })
      )
      .setTimeout(30)
      .build();

    const transactionXdr = transaction.toXDR();
    const signedXdr = await signTransaction(transactionXdr);
    
    const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET);
    const result = await server.submitTransaction(signedTransaction);
    
    return result.hash;
  } catch (error) {
    console.error('Error sending payment:', error);
    throw error;
  }
}

export function createContractTransaction(
  contractId: string,
  functionName: string,
  args: any[],
  publicKey: string
): StellarSdk.Transaction {
  const server = getStellarServer();
  
  // This is a simplified example - you'll need to implement the actual
  // contract invocation logic based on your specific smart contract
  
  const transaction = new StellarSdk.TransactionBuilder(
    { publicKey, sequence: 0, balances: [] },
    {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    }
  )
    .addOperation(
      StellarSdk.Operation.invokeHostFunction({
        hostFunction: StellarSdk.HostFunctionType.invokeContract,
        args: [
          new StellarSdk.Address(contractId).toScVal(),
          StellarSdk.xdr.ScVal.scvSymbol(functionName),
          ...args.map(arg => StellarSdk.xdr.ScVal.scvObject(arg)),
        ],
      })
    )
    .setTimeout(30)
    .build();

  return transaction;
}
