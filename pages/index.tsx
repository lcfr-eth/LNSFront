import React from 'react';
import Image from 'next/image';
import { ethers } from 'ethers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import type { NextPage } from 'next';
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from 'wagmi';

import contractInterface from '../contract-abi.json';
import searchInterface from '../search-abi.json';
import LNRInterface from '../LNR-abi.json';

const contractConfig = {
  addressOrName: '0x706284BC704AcB38bfEEe68E136569799Abb691D',
  contractInterface: contractInterface,
};

const searchContractConfig = {
  addressOrName: '0x078e87e8cf56c87a0c8d0019b0aab2affacdc63d',
  contractInterface: searchInterface,
};

const LNRContractConfig = {
  addressOrName: '0x5564886ca2C518d1964E5FCea4f423b41Db9F561',
  contractInterface: LNRInterface,
};

const Home: NextPage = () => {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [totalMinted, setTotalMinted] = React.useState(0);
  
  const [input, setInput] = useState("");
  const [ret, setRet] = useState("");
  const [transfer, setTransfer] = useState("");
  const [checkOwner, setCheckOwner] = useState("");

  const { address, isConnecting, isDisconnected } = useAccount();


  const names_local = input.split("\n");

  const { config: contractMintWriteConfig } = usePrepareContractWrite({
    ...contractConfig,
    functionName: 'LNSWrappedMint',
    args: [names_local],
  });

  const { config: contractWrapWriteConfig } = usePrepareContractWrite({
    ...contractConfig,
    functionName: 'wrap',
    args: [names_local],
  });

  const { config: contractSearchConfig } = usePrepareContractWrite({
    ...searchContractConfig,
    functionName: 'owner',
    args: [names_local]
  });

  const { config: contractLNRConfig } = usePrepareContractWrite({
    ...LNRContractConfig,
    functionName: 'transfer',
    args: [
      transfer,
      '0x706284BC704AcB38bfEEe68E136569799Abb691D',
    ],
  });

  const { config: contractOwnerConfig } = usePrepareContractWrite({
    ...LNRContractConfig,
    functionName: 'owner',
    args: transfer
  });


  const {
    data: mintData,
    write: mint,
    isLoading: isMintLoading,
    isSuccess: isMintStarted,
    error: mintError,
  } = useContractWrite(contractMintWriteConfig);

  const {
    data: wrapData,
    write: wrap,
    isLoading: isWrapLoading,
    isSuccess: isWrapStarted,
    error: wrapError,
  } = useContractWrite(contractWrapWriteConfig);

  const {
    data: transData,
    write: sendNames,
    isLoading: isTransLoading,
    isSuccess: isTransStarted,
    error: transError,
  } = useContractWrite(contractLNRConfig);

  const { data: totalSupplyData } = useContractRead({
    ...contractConfig,
    functionName: 'totalSupply',
    watch: true,
  });

  const { refetch } = useContractRead({
    ...contractOwnerConfig,
    functionName: 'owner',
    args: [transfer],
    watch: true,
  });
  //console.log(ownerData);
  
  const { data: searchData } = useContractRead({
    ...contractSearchConfig,
    args: [
      names_local
    ],
    watch: true,
  });

  //console.log(searchData);

  const {
    data: txData,
    isSuccess: txSuccess,
    error: txError,
  } = useWaitForTransaction({
    hash: mintData?.hash,
  });

  React.useEffect(() => {
    if (totalSupplyData) {
      setTotalMinted(totalSupplyData.toNumber());
    }
  }, [totalSupplyData]);

  const isMinted = txSuccess;

  const results = () => {
    let intersection = names_local.filter(x => searchData?.includes(x));
    //let difference = names_local.filter(x => !searchData?.includes(x));
    var O = intersection.map( (e) => (e) ).join(' ');
    console.log(O);
    setRet("Not Available: " + O);
  }

  // checking ownership sucks - i suck at react thx
  // takes two clicks on first page load because the setTransfer
  const trans = async () => {
    if (input === "") { console.log("nope"); return;}

    const names_local2 = input.split("\n")
    for (let i = 0; i < names_local2.length; i++ ){
      if (names_local2[i] === "") { return}

      setTransfer(ethers.utils.formatBytes32String(names_local2[i]));

      const owner = await refetch();
      //console.log('owner: '+owner.data);
      if (owner.data !== address){
        console.log("not owner of name: "+names_local2[i])
        return;
      }
      sendNames?.();
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div style={{ flex: '1 1 auto' }}>
          <div style={{ padding: '24px 24px 24px 0' }}>
            <h1>LNS(R) .OG Name Wrapper</h1>
            <p style={{ margin: '12px 0 24px' }}>
              {totalMinted} minted so far!
            </p>
            <ConnectButton />

            {mintError && (
              <p style={{ marginTop: 24, color: '#FF6257' }}>
                Error: {mintError.message}
              </p>
            )}
            {txError && (
              <p style={{ marginTop: 24, color: '#FF6257' }}>
                Error: {txError.message}
              </p>
            )}
          <div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value.split(" ").join(""))}
            />
          </div>
            {mounted && (
              <button
                style={{ marginTop: 24 }}
                //disabled={!mint || isMintLoading || isMintStarted}
                className="button"
                //data-mint-loading={isMintLoading}
                //data-mint-started={isMintStarted}
                onClick={() => console.log(results())}
              >
                {'Bulk Search'}
              </button>
            )}
            <br></br>
            {ret}
            <br></br>
            {mounted && (
              <button
                style={{ marginTop: 24 }}
                className="button"
                data-mint-loading={isMintLoading}
                data-mint-started={isMintStarted}
                onClick={() => mint?.()}
              >
                {isMintLoading && 'Waiting for approval'}
                {isMintStarted && 'Minting...'}
                {!isMintLoading && !isMintStarted && 'Mint New Wrapped Names'}
              </button>
            )}
            <br></br>
            {mounted && (
              <button
                style={{ marginTop: 24 }}
                //disabled={!mint || isMintLoading || isMintStarted}
                className="button"
                data-mint-loading={isWrapLoading}
                data-mint-started={isWrapStarted}
                onClick={() => wrap?.()}
              >
                {isWrapLoading && 'Waiting for approval'}
                {isWrapStarted && 'Wrapping...'}
                {!isWrapLoading && !isWrapStarted && 'Wrap Your Existing Names'}
              </button>
            )}
            <br></br>
            {mounted && (
              <button
                style={{ marginTop: 24 }}
                //disabled={!mint || isMintLoading || isMintStarted}
                className="button"
                data-mint-loading={isTransLoading}
                data-mint-started={isTransStarted}
                onClick={() => trans()}
              >
                {isTransLoading && 'Waiting for approval'}
                {isTransStarted && 'Sending..'}
                {!isTransLoading && !isTransStarted && 'Deposit Names to Wrapper'}
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
  );
};

export default Home;
