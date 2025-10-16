'use client';

import {
  airdropFactory,
  appendTransactionMessageInstructions,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import React from "react";
import { PublicKey } from "@solana/web3.js";
import Swal from 'sweetalert2';

export default function Transfer() {
  var [solInUSD, setSolInUSD] = React.useState(0);
  var [amount, setAmount] = React.useState(1);
  var [currencyType, setCurrencyType] = React.useState("SOL");
  var [address, setAddress] = React.useState("");

  const rpc = createSolanaRpc("https://devnet.helius-rpc.com/?api-key=0f803376-0189-4d72-95f6-a5f41cef157d"); // https://api.devnet.solana.com
  const rpcSubscriptions = createSolanaRpcSubscriptions("ws://devnet.helius-rpc.com/?api-key=0f803376-0189-4d72-95f6-a5f41cef157d"); // ws://api.devnet.solana.com


  async function handleSetSolAmount(e: any) {
    var solAmount = e?.target?.value;

    if(currencyType == 'SOL'){
      setAmount(solAmount);
    } else {
      setAmount(convertUsdToSol(solAmount))
    }
  }

  async function handleSetAddress(e){
    var val = e?.target?.value;
    setAddress(val)
  }

  function convertSolToUsd(sol: number): number {
    return sol * solInUSD;
  }

  function convertUsdToSol(usd: number): number {
    return usd / solInUSD;
  }

  function handleSetCurrencyType(){
    if(currencyType == 'Dollar'){
      setAmount(convertUsdToSol(amount));
    } else {
      setAmount(convertSolToUsd(amount));
    }
    setCurrencyType(currencyType == 'SOL' ? 'Dollar' : 'SOL')
  }

  React.useEffect(() => {
    fetchKursSOLvsDollar();
  },[])

  async function fetchKursSOLvsDollar(){
    try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { next: { revalidate: 60 } }
    );

    if (!res.ok) {
      throw new Error('Failed to fetch from CoinGecko');
    }

    const data = await res.json();
    setSolInUSD(data.solana.usd);
  } catch (error) {
    // 
  }
  }

  async function generateAddress(){
    const recipient = await generateKeyPairSigner();

    setAddress(recipient.address.toString())
  }

  async function sendSol() {
    var amountSOL = 0;

    if(currencyType == 'SOL'){
      amountSOL = amount;
    } else {
      amountSOL = await convertUsdToSol(amount);
    }

    const sender = await generateKeyPairSigner();
    //const recipient = await generateKeyPairSigner();

    if(amount <= 0 || !amount){
       Swal.fire({
        title: 'Failed!',
        text: 'Amount must be more than 0!',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    try {
       new PublicKey(address);
    } catch {
      Swal.fire({
        title: 'Failed!',
        text: 'Address not valid!',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    const LAMPORTS_PER_SOL = 1_000_000_000n;
    const transferAmount = lamports(LAMPORTS_PER_SOL / BigInt(amountSOL * 100)); // 0.01 SOL

    try {
      await airdropFactory({ rpc, rpcSubscriptions })({
        recipientAddress: sender.address,
        lamports: lamports(LAMPORTS_PER_SOL), // 1 SOL
        commitment: "confirmed"
      });


      const transferInstruction = getTransferSolInstruction({
        source: sender,
        destination: address,
        amount: transferAmount
      });

      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(sender, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstructions([transferInstruction], tx)
      );

      const signedTransaction =
        await signTransactionMessageWithSigners(transactionMessage);
      await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(
        signedTransaction,
        { commitment: "confirmed" }
      );
      const transactionSignature = getSignatureFromTransaction(signedTransaction);

      if (transactionSignature) {
        Swal.fire({
          title: 'Success!',
          text: `You already success transfer SOL!\n your transaction signature:\n\n ${transactionSignature}`,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        });
      }
    } catch {
      Swal.fire({
        title: 'Failed!',
        text: 'Transfer SOL failed!',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6',
      });
    }
  }

  return (
    <div className="p-6" >
      <div className="grid grid-rows-2 mb-4" >
        <div className="row-6" >
          <h1 className="text-xl font-bold mb-3">Transfer</h1>
        </div>
        <div className="row-6 flex justify-end" />
      </div>
      <div className="max-w-sm mx-auto">
        <div>
          <h1 className="text-xl font-bold mb-3">Transfer SOL</h1>
        </div>
        <div className="mb-5">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Amount (in {currencyType})</label>
          <div className="flex flex-row " >
            <input type="number" value={amount} onInput={handleSetSolAmount} id="amount" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="enter SOL Amount" required />
            <button className="ml-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-2 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button" onClick={() => handleSetCurrencyType()} >{currencyType}</button>
          </div>
        </div>
        <div className="mb-5">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Address (Recipient)</label>
           <div className="flex flex-row " >
          <input value={address} onInput={handleSetAddress} type="address" id="address" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required />
           <button className="ml-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-2 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button" onClick={() => generateAddress()} >Generate Address</button>
           </div>
        </div>
        <button disabled={solInUSD <= 0 ? true : false} onClick={sendSol} type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Send</button>
      </div>

    </div>
  )
}