// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";


contract Roulette {
  
  uint256 betAmount;
  uint necessaryBalance;
  uint nextRoundTimestamp;
  address creator;
  uint256 maxAmountAllowedInTheBank;
  uint public numberOfWinners;
  mapping(address => bool) public winners;
  mapping(uint => address) private lutWinners;
  mapping(address => uint) public winnings;
  uint8[] payouts;
  uint8[] numberRange;
  uint8[] red;
  uint8[] black;
  uint256 public latestWinningNumber;
    
  using EnumerableSet for EnumerableSet.UintSet;

    EnumerableSet.UintSet reds;
    EnumerableSet.UintSet blacks;
  
  /*
    BetTypes are as follow:
      0: color
      1: odd/even
      2: number
      
    Depending on the BetType, number will be:
      color: 0 for black, 1 for red
      odd/even: 0 for even, 1 for odd
      number: number
  */
  
  struct Bet {
    address player;
    uint8 betType;
    uint8 number;
    uint256 betAmount;
  }
  Bet[] public bets;



    struct Winner {
    address winner;
    uint winnings;
}

Winner[] public spinWinners;
  
  constructor()  payable {
    creator = msg.sender;
    necessaryBalance = 0;
    nextRoundTimestamp = block.timestamp;
    red = [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3];
    black = [15, 4, 2, 17, 6, 13, 11, 8, 10, 24, 33, 20, 31, 22, 29, 28, 35, 26];
    RedBlack();
    payouts = [2,2,36];
    //times payout for each win type
   numberRange = [1,1,36];
    // Bet type 0: black/red (1=black, 2=red)
    // Bet type 1: even/odd (1=odd, 2=even)
    // Bet type 2: number (1-36)
     maxAmountAllowedInTheBank = 30000000000000000000; /* 30 ether */
  }

  

  event RandomNumber(uint256 number);
  
  function RedBlack() public{

    for (uint i = 0; i < red.length; i++) {
            reds.add(red[i]);
    }

    for (uint i = 0; i < black.length; i++) {
            blacks.add(black[i]);
    }

  }

  function getStatus() public view returns(uint, uint, uint, uint, uint) {
    return (
      bets.length,             // number of active bets
      bets.length * betAmount, // value of active bets
      nextRoundTimestamp,      // when can we play again
      address(this).balance,   // roulette balance
      winnings[msg.sender]     // winnings of player
    ); 
  }


  //must run when start server in order to have eth in contract  
   function addEther() payable public {}


  
  function getBets() public view returns (Bet[] memory) {
    return bets;
}


function getCreator() public view returns (address) {
    return creator;
}


function getMaxBet() public view returns (uint) {
        return betAmount;
    }



   
  function bet(uint8 number, uint8 betType) payable public {


       /* 
       A bet is valid when:
       1 - the value of the bet is correct (=betAmount)
       2 - betType is kblock.timestampn (between 0 and 2)
       3 - the option betted is valid (don't bet on 37!)
       4 - the bank has sufficient funds to pay the bet
    */

    
    require(betType >= 0 && betType <= 2, "Invalid bet type"); // Check that the bet type is valid
    require(number >= 0 && number <= numberRange[betType], "Invalid number"); // Check that the number is valid
    uint payoutForThisBet = payouts[betType] * msg.value;
    uint provisionalBalance = necessaryBalance + payoutForThisBet;
    require(provisionalBalance < address(this).balance, "Insufficient balance"); // Check that the bank has sufficient funds to pay the bet
    necessaryBalance += payoutForThisBet;
    Bet memory newBet = Bet({
      betType: betType,
      player: msg.sender,
      number: number,
      betAmount : msg.value
    });
    bets.push(newBet);
  }


  function getWinnings(address player) public view returns (uint) {
    return winnings[player];
}




  function spinWheel() public {
    /* are there any bets? */
    require(bets.length > 0);
    /* are we allowed to spin the wheel? */
    require(block.timestamp > nextRoundTimestamp);
    /* next time we are allowed to spin the wheel again */
    nextRoundTimestamp = block.timestamp + 1 minutes;
    /* delete privious spin list of winners*/
    delete spinWinners;
    /* calculate 'random' number */
    uint diff = block.difficulty;
    bytes32 hash = blockhash(block.number-1);
    Bet memory lb = bets[bets.length-1];
    uint number = uint(keccak256(abi.encodePacked(block.timestamp, diff, hash, lb.betType, lb.player, lb.number))) % 37;
    /* check every bet for this number */
    for (uint i = 0; i < bets.length; i++) {
      bool won = false;
      Bet memory b = bets[i];
      if (number == 0) {
        won = (b.betType == 2 && b.number == 0);                   /* bet on 0 */
      } else {
        if (b.betType == 2) { 
          won = (b.number == number);                              /* bet on number */
        } 
        else if (b.betType == 1) {
          if (b.number == 0){ 
          won = (number % 2 == 0);
          }              /* bet on even */
          else if (b.number == 1){ 
          won = (number % 2 == 1);
          }              /* bet on odd */
         }
          else if (b.betType == 0) {  
            if (b.number == 0 && isBlack(number))    /* bet on black */
            {                    
              won = true;
          } else if (b.number == 1 && isRed(number)){                                                 /* bet on red */
              won = true;
        }
      }
    }
  
      /* if winning bet, add to player winnings balance */
      if (won) 
      {
        address winner = b.player;
       if(!winners[winner]){
        uint index = numberOfWinners++;

        winners[winner] = true;
        lutWinners[index] = winner;

        }
        uint payout = payouts[b.betType] * b.betAmount;
        winnings[winner] += payout;
        Winner memory newWinner = Winner({
          winner : winner,
          winnings : payout
          });
          spinWinners.push(newWinner);
        }
    }
    

    /* delete all bets */
    delete bets;
    /* reset necessaryBalance */
    necessaryBalance = 0;
    /* check if to much money in the bank */
    if (address(this).balance > maxAmountAllowedInTheBank) takeProfits();
    /* returns 'random' number to UI */
    emit RandomNumber(number);
    latestWinningNumber = number;
  }


function getLatestWinningNumber() public view returns (uint256) {
        return latestWinningNumber;
    }


function getWinners() public view returns (Winner[] memory) {

    return spinWinners;
}






  

    function isRed(uint number) public view returns (bool) {
        return reds.contains(number);
    }

    function isBlack(uint number) public view returns (bool) {
        return blacks.contains(number);
    }

  function cashOut() public {
    address player = msg.sender;
    uint256 amount = winnings[player];
    require(amount > 0);
    require(amount <= address(this).balance);
    winnings[player] = 0;
    payable(player).transfer(amount);
  }
  
  function takeProfits() internal {
    uint amount = address(this).balance - maxAmountAllowedInTheBank;
    if (amount > 0) payable(address(creator)).transfer(amount);
  }
  


  
 
}





