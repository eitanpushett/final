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
  const [winnings, setWinnings] = useState(0);
  const [bets, setBets] = useState([]);
  const [winners,setWinners] =useState([])
  const [betAmount, setBetAmount] = useState(0.01);
  const [betType, setBetType] = useState(0);
  const [number, setNumber] = useState(0);
  const [status, setStatus] = useState("");
  const [winningNumber , setWinningNumber] = useState('0')
  const [showWinningNumber, setShowWinningNumber] = useState(false);
  const [shouldRenderWinners, setshouldRenderWinners] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);




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
    },[web3Api])


  useEffect(() => {
    const getAccount = async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      setAccount(accounts[0]);
    };
    web3Api.web3 && getAccount();
  }, [web3Api.web3,]);

  
    useEffect(() => {
      const loadWinnigs = async () => {
        const {contract,web3} = web3Api
        const winnings = await contract.getStatus({from: account});
        setWinnings(web3.utils.fromWei(winnings[4], "ether"));
      };
  
      web3Api.contract && loadWinnigs();
    }, [web3Api,account,bets]);
  
    const handleBet = async (e) => {
      const {contract,web3} = web3Api
      e.preventDefault();
      setShowWinningNumber(false);
      setshouldRenderWinners(false);
      const value = web3.utils.toWei(betAmount.toString(), "ether");
      try {
      await contract.bet(number, betType,({
      from:account,
      value:value
    }));
        setStatus("Bet placed successfully!");
      } catch (err) {
        console.log(err)
        setStatus("Error placing bet.");
      }
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
        setStatus("Wheel spun successfully!");
      } catch (err) {
        setStatus("Error spinning wheel.");
      }

      const winningNumber = await contract.getLatestWinningNumber();
      setWinningNumber(winningNumber);
      
      setshouldRenderWinners(true);
      setShowWinningNumber(true);
      const balance = await web3.eth.getBalance(contract.address);
      setBalance(web3.utils.fromWei(balance, "ether"));
      const winners = await contract.getWinners();
      setWinners(winners);
      

    };

    const startCountdown = () => {
      setRemainingTime(60);
      setIsButtonDisabled(true);
    };
  
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


      function BetInfo({ account, balance, winnings, handleCashOut, bets }) {
        return (
          <div>
            <div>Betting account: {account}</div>
            <p>Contract Balance: {balance} ETH</p>
            <p>Your winnings: {winnings} ETH</p>
            {winnings > 0 && (
              <button onClick={handleCashOut}>Claim winnings</button>
            )}
            <p>Number of active bets: {bets.length}</p>
          </div>
        );
      }
      

  
    return (
      <div>
        <h1>Roulette</h1>
        <BetInfo
    account={account}
    balance={balance}
    winnings={winnings}
    handleCashOut={handleCashOut}
    bets={bets}
  />
        <form onSubmit={handleBet}>
    <h2>Place a Bet</h2>
    <label>
      Amount (in ETH):
      <input type="number" step="0.01" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} />
    </label>
    <br />
    <label>
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
      <label>
        Number:
        <input type="number" min="0" max="36" value={number} onChange={(e) => setNumber(e.target.value)} />
      </label>
    )}
    {betType === 1 && (
      <label>
        Odd/Even:
        <select value={number} onChange={(e) => setNumber(e.target.value)}>
        <option value={0}>Odd</option>
        <option value={1}>Even</option>
        </select>
      </label>
    )}
    {betType === 0 && (
      <label>
        Black/Red:
        <select value={number} onChange={(e) => setNumber(e.target.value)}>
        <option value={0}>Black</option>
        <option value={1}>Red</option>
        </select>
      </label>
    )}
    <br />
    <button type="submit">Place Bet</button>
  </form>
  <br />
  <button onClick={() => {
          handleSpin();
          startCountdown();
        }} disabled={isButtonDisabled}>Spin the Wheel</button>
  {isButtonDisabled && (
        <p>
          You will be able to spin again in {remainingTime} second{remainingTime !== 1 && "s"}.
        </p>
      )}
  {showWinningNumber && <p>Winning number is {winningNumber.words[winningNumber.words.length-2]}</p>}
  <br />
  <p>{status}</p>
  {Object.entries(betsByPlayer).map(([player, bets]) => (
  <div key={player}>
    <p>Bets made by {player}</p>
    <ul>
      {bets.map((bet, index) => (
        <li key={index}>
          Bet: {Web3.utils.fromWei(bet.betAmount, "ether")} ETH on{" "}
          {bet.betType === "2"
            ? `Number ${bet.number}`
            : bet.betType === "0" && bet.number === "1"
            ? "Red"
            : bet.betType === "0" && bet.number === "0"
            ? "Black"
            : bet.betType === "1" && bet.number === "1"
            ? "Even"
            : bet.betType === "1" && bet.number === "0"
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
        Winners are {winner.winner} amount won {Web3.utils.fromWei(winner.winnings, "ether")}
      </li>
    ))}
  </ul>
)}
</div>);

    }
export default App;