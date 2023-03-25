import './App.css';
import { useState } from 'react';
import { useEffect } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import { loadContract } from './utils/load-contract';
import Web3 from 'web3';

function App() {
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    web3: null,
    contract: null
  })

  const [balance, setBalance] = useState(null);
  const [account, setAccount] = useState(null);

  const [bets, setBets] = useState([]);

  const [winnings, setWinnings] = useState(0);
  const [betAmount, setBetAmount] = useState(0.01);
  const [betType, setBetType] = useState(0);
  const [number, setNumber] = useState(0);
  const [status, setStatus] = useState("");
  // const [minBet, setMinBet] = useState(null);
  // const [number, setNumber] = useState(0);
  // const [amount, setAmount] = useState(0);
  // const [message, setMessage] = useState("");
  // const [winningNumber, setWinningNumber] = useState(0);

  // const [deposit, setDeposit] = useState('');
  // const [withdrawAmount, setWithdrawAmount] = useState('');

  // function handelDeposit(e){
  //   setDeposit(e.target.value)
  // }

  // function handelWithdrawAmount(e){
  //   setWithdrawAmount(e.target.value)
  // }
  // const addFunds = async () => {
  //   const {contract,web3} = web3Api
  //   await contract.addFunds({
  //     from:account,
  //     value:web3.utils.toWei(deposit,"ether")
  //   })
  // }
  // const withDraw = async () => {
  //   const {contract,web3} = web3Api
  //   const withDrawAmount = web3.utils.toWei(withdrawAmount,"ether")
  //   await contract.withdraw(withDrawAmount, {from:account})
  // }

  useEffect(() => {
    const loadProvider = async () => {
      const provider = await detectEthereumProvider()
      const contract = await loadContract("Roulette", provider)

      if (provider) {
        setWeb3Api(
          {
            provider: provider,
            web3: new Web3(provider),
            contract: contract
          }
        )
      }
      else {
        console.log("Pleas install MetaMask")
      }
    }
    loadProvider()
  }, [])



  useEffect(
    () => {
      const loadBalance = async () => {
        const {contract,web3} = web3Api
        const balance = await web3.eth.getBalance(contract.address)
        setBalance(web3.utils.fromWei(balance, "ether"))
      }
      web3Api.contract && loadBalance()
    },[web3Api])

  useEffect(() => {
    const getAccount = async () => {
      const accounts = await web3Api.web3.eth.getAccounts();
      setAccount(accounts[0]);
    };
    web3Api.web3 && getAccount();
  }, [web3Api.web3]);

    
  
    useEffect(() => {
      const loadWinnigs = async () => {
        const {contract,web3} = web3Api
        const winnings = await contract.getStatus();
        //const winnings = await contract.winnings(account);
        setWinnings(web3.utils.fromWei(winnings[4], "ether"));
      };
  
      web3Api.contract && loadWinnigs();
    }, [web3Api,account]);
  
    const handleBet = async (e) => {
      const {contract,web3} = web3Api
      e.preventDefault();
  
      const value = web3.utils.toWei(betAmount.toString(), "ether");

     
  
      try {
        await contract.bet(number, betType).send(({
      from:account,
      value:web3.utils.toWei(value,"ether")
    })
);
        setStatus("Bet placed successfully!");
      } catch (err) {
        console.log(err)
        setStatus("Error placing bet.");
      }
  
      const bets = await contract.bets();
      setBets(bets);
      const balance = await web3.eth.getBalance(contract.address);
      setBalance(balance);
      const winnings = await contract.winnings(account);
      setWinnings(winnings);
    };
  
    const handleSpin = async () => {
      const {contract,web3} = web3Api
      try {
        await contract.spinWheel().send({ from: account });
        setStatus("Wheel spun successfully!");
      } catch (err) {
        setStatus("Error spinning wheel.");
      }
  
      const bets = await contract.bets();
      setBets(bets);
      const balance = await web3.eth.getBalance(contract.address);
      setBalance(balance);
      const winnings = await contract.winnings(account);
      setWinnings(winnings);
    };
  
    return (
      <div>
        <h1>Roulette</h1>

        <div>Check that your account is {account}</div>
        <p>Balance: {balance} ETH</p>
        <p>Winnings: {winnings} ETH</p>
        <form onSubmit={handleBet}>
    <h2>Place a Bet</h2>
    <label>
      Amount (in ETH):
      <input type="number" step="0.01" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} />
    </label>
    <br />
    <label>
      Bet Type:
      <select value={betType} onChange={(e) => setBetType(e.target.value)}>
        <option value={0}>Number</option>
        <option value={1}>Color</option>
        <option value={2}>Even/Odd</option>
      </select>
    </label>
    {betType === 0 && (
      <label>
        Number:
        <input type="number" min="0" max="36" value={number} onChange={(e) => setNumber(e.target.value)} />
      </label>
    )}
    <br />
    <button type="submit">Place Bet</button>
  </form>
  <br />
  <button onClick={handleSpin}>Spin the Wheel</button>
  <br />
  <p>{status}</p>
  <h2>Bets</h2>
  <ul>
    {bets.map((bet, index) => (
      <li key={index}>
        {bet.amount} ETH on {bet.number !== undefined ? `number ${bet.number}` : bet.color !== undefined ? `color ${bet.color}` : bet.evenOdd === 0 ? "even" : "odd"}
      </li>
    ))}
  </ul>
</div>);

       
  






  // return (
  //   <div>
  //     <h1>Roulette Contract</h1>
  //     <div>Check that your account is {account}</div>
  //     <p>Balance: {balance} Ether</p>






  //     /* <p>Number of active bets: {numberOfBets}</p>
  //     <p>Value of active bets: {valueOfBets}</p>
  //     <p>Roulette balance: {rouletteBalance}</p>
  //     <p>Player winnings: {playerWinnings}</p> */

  //     /* <h2>Place Your Bet</h2>
  //     <form onSubmit={(e) => { e.preventDefault(); placeBet(); }}>
  //       <label>
  //         Number (0-36):
  //         <input type="number" min="0" max="36" value={number} onChange={(e) => setNumber(e.target.value)} />
  //       </label>
  //       <br />
  //       <label>
  //         Amount (in Ether):
  //         <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
  //       </label>
  //       <br />
  //       <button type="submit">Place Bet</button>
  //     </form>
  //     <p>{message}</p>
  //     <h2>Trigger Payout</h2>
  //     <form onSubmit={(e) => { e.preventDefault(); triggerPayout(); }}>
  //       <label>
  //         Winning Number (0-36):
  //         <input type="number" min="0" max="36" value={winningNumber} onChange={(e) => setWinningNumber(e.target.value)} />
  //       </label>
  //       <br />
  //       <button type="submit">Trigger Payout</button>
  //     </form> */
  // //   </div>
  // // );

    }
export default App;