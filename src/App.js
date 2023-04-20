import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

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
  const payouts = [2,2,36];
  const [balance, setBalance] = useState(null);
  const [account, setAccount] = useState(null);
  const [winnings, setWinnings] = useState(0);
  const [bets, setBets] = useState([]);
  const [winners,setWinners] =useState([])
  const [betAmount, setBetAmount] = useState('');
  const [betType, setBetType] = useState(0);
  const [number, setNumber] = useState(0);
  const [winningNumber , setWinningNumber] = useState('0')
  const [showWinningNumber, setShowWinningNumber] = useState(false);
  const [shouldRenderWinners, setshouldRenderWinners] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [necessaryBalance, setnecessaryBalance] = useState(0);
  const [winningColour,setWinningColour] = useState('')

  const red = [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3];
  const black = [15, 4, 2, 17, 6, 13, 11, 8, 10, 24, 33, 20, 31, 22, 29, 28, 35, 26];




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
        toast.error("Please install MetaMask")
      }
    }
    loadProvider()
  }, [])


  useEffect(() => {
    // Listen for changes in the selected account
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    // Cleanup function
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      } else {
        window.ethereum.off('accountsChanged', handleAccountsChanged);
      }
    }
  }, []);


  const handleAccountsChanged = (accounts) => {
    setAccount(accounts[0]);
  }



  useEffect(
    () => {
      const loadBalance = async () => {
        const {contract,web3} = web3Api
        const balance = await web3.eth.getBalance(contract.address)
        setBalance(web3.utils.fromWei(balance, "ether"))
      }
      web3Api.contract && loadBalance()
    },[web3Api, handleCashOut])


  useEffect(() => {
    const getAccount = async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      setAccount(accounts[0]);
    };
    web3Api.web3 && getAccount();
  }, [web3Api.web3]);

  
    useEffect(() => {
      const loadWinnigs = async () => {
        const {contract,web3} = web3Api
        const winnings = await contract.getStatus({from: account});
        setWinnings(web3.utils.fromWei(winnings[4], "ether"));
      };
  
      web3Api.contract && loadWinnigs();
    }, [web3Api,account,bets]);
  
    const handleBet = async (event) => {
      event.preventDefault();
      const {contract,web3} = web3Api
      const currentBalance = (parseFloat(await web3.eth.getBalance(contract.address))/1000000000000000000)
      setShowWinningNumber(false);
      setshouldRenderWinners(false);
      if (!/^\d+(\.\d+)?$/.test(betAmount)) {
          toast.error("Invalid bet amount. Please enter only numbers.");
          return;
      }
      const value = await web3.utils.toWei(betAmount, "ether");
      const payoutForThisBet = parseFloat(payouts[betType]) * (parseFloat(value)/1000000000000000000);
      let provisionalBalance = parseFloat(necessaryBalance) + parseFloat(payoutForThisBet) + parseFloat(winnings);
  
       if (provisionalBalance >= currentBalance) {
        toast.error("Insufficient contract balance, please enter new lower bet amount");
        provisionalBalance = 0;
        return; // Return early to cancel the submission
      }

      try {
      await contract.bet(number, betType,({
      from:account,
      value:value
    }));
    toast.success('Bet placed successfully!', {
      position: toast.POSITION.TOP_RIGHT
  });;
      } catch (err) {
        console.log(err)
        toast.error("Error placing bet.");
      }
      setnecessaryBalance(parseFloat(necessaryBalance)+parseFloat(payoutForThisBet));
    const balance = await web3.eth.getBalance(contract.address);
      setBalance(web3.utils.fromWei(balance, "ether"))
    };


      useEffect(() => {
        const loadBets = async () => {
          const {contract} = web3Api
          const bets = await contract.getBets();
          setBets(bets);
        };
    
        web3Api.contract && loadBets();
      }, [web3Api,account,balance,winners]);
    

    const handleSpin = async () => {
      const {contract,web3} = web3Api
      try {
        await contract.spinWheel({from: account});
        toast.success('Wheel spun successfully!', {
          position: toast.POSITION.TOP_RIGHT
      });
      } catch (err) {
        toast.error("Error spinning wheel.");
      }

      const winningNumber = await contract.getLatestWinningNumber();
      const winningColour = getLatestColour(winningNumber);
      setWinningColour(winningColour);
      setWinningNumber(winningNumber);
      
      setshouldRenderWinners(true);
      setShowWinningNumber(true);
      const balance = await web3.eth.getBalance(contract.address);
      setBalance(web3.utils.fromWei(balance, "ether"));
      const winners = await contract.getWinners();
      
      setWinners(mergeWinners(winners));
      setnecessaryBalance(0);
      

    };

    const startCountdown = () => {
      setRemainingTime(60);
      setIsButtonDisabled(true);
    };


    function getLatestColour(num){
      if (red.includes(parseInt(num)) ){
      return "red";
    } else if (black.includes(parseInt(num))) {
      return "black";
    } else  {
      return "green";
    }
    }


    function mergeWinners(winners) {
      const mergedWinners = [];
      const winnerL = {};
    
      winners.forEach(([winner, winnings]) => {
        if (winnerL[winner]) {
          // If the username already exists, add the amount to the existing entry
          winnerL[winner].winnings += parseFloat(winnings);
        } else {
          // If the username doesn't exist, create a new entry
          winnerL[winner] = { winner, winnings: parseFloat(winnings) };
          mergedWinners.push(winnerL[winner]);
        }
      });
    
      // Convert the winnings for each winner back to a string
      mergedWinners.forEach((winner) => {
        winner.winnings = winner.winnings.toString();
      });
    
      return mergedWinners;
    }



  
    useEffect(() => {
      let intervalId;
      if (remainingTime > 0) {
        intervalId = setInterval(() => {
          setRemainingTime((prevTime) => prevTime - 1);
        }, 1000);
      } else {
        setIsButtonDisabled(false);
      }
  
      return () => clearInterval(intervalId);
    }, [remainingTime]);
  


    const betsByPlayer = bets.reduce((acc, bet) => {
      if (!acc[bet.player]) {
        acc[bet.player] = [];
      }
      acc[bet.player].push(bet);
      return acc;
    }, {});

      
    
      async function handleCashOut() {
        const {contract} = web3Api
        try {
          
            await contract.cashOut({ from: account });
        } catch (error) {
          console.error(error);
        }
        setWinnings(0)

      }


      function BetInfo({ account, balance, winnings, handleCashOut, bets, maxBetAmount }) {
        return (
          <div>
            <div className='betting_account'>Betting account: {account}</div>
            {/* <br></br> */}
            <div className='summary'>
              <p className='contract_balance'>Contract Balance: {balance} ETH</p>
              <p className='your_winnings'>Your winnings: {winnings} ETH</p>
              <p className='numOfActvBets'>Number of active bets: {bets.length}</p>
            {winnings > 0 && (
              <button onClick={handleCashOut} className='ClaimWinBTN'>Claim winnings</button>
            )}
          </div>
          </div>
        );
      }
    
    return (
        <div className='main'>
        <h1 className='roulette' data-text='Roulette'>Roulette</h1>
        <BetInfo
    account={account}
    balance={balance}
    winnings={winnings}
    handleCashOut={handleCashOut}
    bets={bets}
  />
  
        <form onSubmit={handleBet} >
        <h2 className='placeBet'>Place a Bet</h2>
    <label className='amount'>
      Amount (in ETH):
      <input  value={betAmount} onChange={(e) => setBetAmount(e.target.value)}/>
    </label>
    <br />
    <label className='betType'>
      Bet Type:
      <select value={betType} onChange={(e) => {
        setBetType(parseInt(e.target.value))
        }
        }>
        <option value={0}>Color</option>
        <option value={1}>Even/Odd</option>
        <option value={2}>Number</option>
      </select>
    </label>
    {betType === 2 && (
      <label className='betTypePickNumber'>
        Number:
        <input type="number" min="0" max="36" value={number} onChange={(e) => setNumber(e.target.value)} />
      </label>
    )}
    {betType === 1 && (
      <label className='betTypePickOddEven'>
        Odd/Even:
        <select value={number} onChange={(e) => setNumber(e.target.value)}>
        <option value={1}>Odd</option>
        <option value={0}>Even</option>
        </select>
      </label>
    )}
    {betType === 0 && (
      <label className='betTypePickBlackRed'>
        Black/<span className='RedTitle'>Red</span>:
        <select value={number} onChange={(e) => setNumber(e.target.value)}>
        <option value={0} className='black'>Black</option>
        <option value={1} className='red'>Red</option>
        </select>
      </label>
    )}
    <br />
    <button type="submit" className='placeBetBTN'>Place Bet</button>
    <ToastContainer /> {/* <- add line */}
  </form>
  <br />
  <button onClick={() => {
          handleSpin();
          startCountdown();
        }} disabled={isButtonDisabled} className="spinBTN">Spin the Wheel</button>
  {isButtonDisabled && (
        <p className='SpinAgainTimer'>
          You will be able to spin again <span className='Timer'>{remainingTime}</span> second{remainingTime !== 1 && "s"}.
        </p>
      )}
  {showWinningNumber && <p className='winningNumberBottomText'>Winning number is {winningNumber.words[winningNumber.words.length-2]} {winningColour} </p>}
  <br />
  {Object.entries(betsByPlayer).map(([player, bets]) => (
  <div key={player}>
    <p className='betConfirm'>Bets made by {player}</p>
    <ul className='betLog'>
      {bets.map((bet, index) => (
        <li key={index}>
          Bet: {Web3.utils.fromWei(bet.betAmount, "ether")} ETH on{" "}
          {bet.betType === "2"
            ? `Number ${bet.number}`
            : bet.betType === "0" && bet.number === "1"
            ? "Red"
            : bet.betType === "0" && bet.number === "0"
            ? "Black"
            : bet.betType === "1" && bet.number === "0"
            ? "Even"
            : bet.betType === "1" && bet.number === "1"
            ? "Odd"
            : ""}
        </li>
      ))}
    </ul>
  </div>
))}
  {shouldRenderWinners && (
  <ul>
    {winners.map((winner, index) => (
      <li key={index}>
      {winner.winner} won!
      amount won {Web3.utils.fromWei(winner.winnings, "ether")}
      <br/>
      </li>
    ))}
  </ul>
)}
</div>);

    }
export default App;