import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

import BlockChainContext from "../context/blockchain"; 
import lotteryAbi from '../abis/lotteryAbi.json'
import MOKTokenAbi from '../abis/MOKTokenAbi.json'

function Lottery() {
  const { LotteryAdd, MOKTokenAdd } = React.useContext(BlockChainContext);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("0x0000000000000000000000000000000000000000");
  const [lastWonBy, setLastWonBy] = useState("0x0000000000000000000000000000000000000000");
  const [totalPool, setTotalPool] = useState(0);

  const getTotalPool = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    let contract = new ethers.Contract(
      LotteryAdd,
      lotteryAbi,
      provider
    );
    setTotalPool(parseInt((await contract.pool())._hex, 16));
  };

  const getAccount = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []); // <- this promps user to connect metamask
    const signer = provider.getSigner();
    try {
      const accounts = await signer.getAddress();
      setCurrentAddress(accounts);
    } catch (err) {
      console.log(err);
    }
  };

  const getPerm = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    let contract = new ethers.Contract(
      LotteryAdd,
      lotteryAbi,
      provider
    );
    let ownerAdd =  await contract.owner();
    if (ownerAdd === currentAddress) {
      setIsAdmin(true);
      setIsOwner(true);
    }
  };

  const getLastWinner = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    let contract = new ethers.Contract(
      LotteryAdd,
      lotteryAbi,
      provider
    );
    setLastWonBy(await contract.winner());
  };

  useEffect(() => {
    getTotalPool();
    getAccount();
    getPerm();
    getLastWinner();
  });

  async function handleEnter() {
    console.log('here');
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    let MOKContract = new ethers.Contract(
      MOKTokenAdd,
      MOKTokenAbi,
      signer
    );
    let lotteryContract = new ethers.Contract(
      LotteryAdd,
      lotteryAbi,
      signer
    );
    await MOKContract.approve(
      LotteryAdd,
      '20'
    );
    try {
      await lotteryContract.enter();
      console.log("Entered!!");
    } catch (err) {
      console.log("You have not approved the transaction, please do that first!");
    }
  }

  async function handlePickWinner() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    let lotteryContract = new ethers.Contract(
      LotteryAdd,
      lotteryAbi,
      signer
    );
    try {
      await lotteryContract.pickWinner();
      console.log("Winner!!");
    } catch (err) {
      console.log("You have not approved the transaction, please do that first!");
    }
  }

  async function handleFees() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    let lotteryContract = new ethers.Contract(
      LotteryAdd,
      lotteryAbi,
      signer
    );
    try {
      await lotteryContract.withdraw();
      console.log("Fees!!");
    } catch (err) {
      console.log("You have not approved the transaction, please do that first!");
    }
  }

  return (
    <form className="form-container" onSubmit={(e) => e.preventDefault()}>
      <div className="total-pool">Total Pool: {totalPool} MOK</div>
      <div className="last-won-by">Last Won By: {lastWonBy} </div>
      <div className="enter-lottery btn" onClick={() => handleEnter()}>Enter Lottery</div>
      {isAdmin && <div className="pick-winner btn" onClick={() => handlePickWinner()}>Pick Winner</div>}
      {isOwner && <div className="get-fees btn" onClick={() => handleFees()}>Get Fees</div>}
      <div className="current-address">Current Address Is: {currentAddress}</div>
    </form>
  );
}

export default Lottery;
