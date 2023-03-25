// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
 


// contract Roulette {
//     // uint public numberOfFunders;
//     // mapping(address => bool) private funders;
//     // mapping(uint => address) private lutFunders;
//     // mapping(address => uint) private lastFundAmount;
//     // address public owner;



//     // constructor() {
//     //     owner = msg.sender;
//     // }  

//     // modifier onlyOwner(){
//     //     require(msg.sender==owner, "Only the owner can do that");
//     //     _;

//     // }   

//     // function transferOwnership(address newOwner) external onlyOwner{
//     //     owner = newOwner;

                 
//     // }           

//     // function addFunds() external payable{
//     //    address funder = msg.sender;
//     //    if(!funders[funder]){
//     //     uint index = numberOfFunders++;
//     //     funders[funder] = true;
//     //     lutFunders[index] = funder;
//     //     }
//     //     lastFundAmount[funder] += msg.value;
//     // }
//     // function getAllFunders() external view returns(address[] memory){
//     //     address[] memory _funders = new address[](numberOfFunders);
//     //     for(uint i=0; i<numberOfFunders; i++){
//     //         _funders[i] = lutFunders[i];
//     //     }
//     // return _funders;
//     // }


//     // function withdraw(uint withdrawAmount) external {
//     //     require(withdrawAmount >= 1000000000000000000 || msg.sender==owner, "You cannot withdraw more than 1 Ether");
//     //     payable (msg.sender).transfer(withdrawAmount);
//     // }


//     address public owner;
//     uint public balance;
//     uint public minBet;
    
//     struct Bet {
//         address player;
//         uint amount;
//         uint number;
//     }
    
//     Bet[] public bets;
    
//     event Win(address indexed player, uint amount);
//     event Lose(address indexed player, uint amount);
    
//     constructor() {
//         owner = msg.sender;
//         minBet = 1 ether;
//         balance = 10 ether;
//     }
   
//     function spinWheel(uint number) public payable {
//         require(msg.value >= minBet, "You must bet an amount greater than or equal to the minimum bet.");
        
//         Bet memory newBet = Bet(msg.sender, msg.value, number);
//         bets.push(newBet);
        
//         balance += msg.value;
//     }
    
//     function payout(uint winningNumber) public {
//         require(msg.sender == owner, "Only the owner can trigger a payout.");
        
//         uint totalWinnings = 0;
        
//         for(uint i = 0; i < bets.length; i++) {
//             if(bets[i].number == winningNumber) {
//                 uint winnings = bets[i].amount * 36;
//                 payable(bets[i].player).transfer(winnings);
//                 totalWinnings += winnings;
//                 emit Win(bets[i].player, winnings);
//             } else {
//                 emit Lose(bets[i].player, bets[i].amount);
//             }
//         }
        
//         balance -= totalWinnings;
//     }
    
//     function withdrawBalance() public {
//         require(msg.sender == owner, "Only the owner can withdraw the balance.");
        
//         payable(owner).transfer(balance);
//         balance = 0;
//     }
// }
    



//}
//const instance = await Roulette.deployed()
//instance.addFunds({value: "500000000000000000", from: accounts[0]})
//instance.addFunds({value: "500000000000000000", from: accounts[1]})
//const funds = instance.funds()
//instance.getAllFunders()
//instance.withdraw("1000000000000000000", {from: accounts[1]})
// pragma solidity >=0.4.22 <0.9.0;

contract Roulette {
  
  uint betAmount;
  uint necessaryBalance;
  uint nextRoundTimestamp;
  address creator;
  uint256 maxAmountAllowedInTheBank;
  mapping (address => uint256) winnings;
  uint8[] payouts;
  uint8[] numberRange;
  
  /*
    BetTypes are as follow:
      0: color
      1: column
      2: dozen
      3: eighteen
      4: modulus
      5: number
      
    Depending on the BetType, number will be:
      color: 0 for black, 1 for red
      column: 0 for left, 1 for middle, 2 for right
      dozen: 0 for first, 1 for second, 2 for third
      eighteen: 0 for low, 1 for high
      modulus: 0 for even, 1 for odd
      number: number
  */
  
  struct Bet {
    address player;
    uint8 betType;
    uint8 number;
  }
  Bet[] public bets;
  
  constructor()  payable {
    creator = msg.sender;
    necessaryBalance = 0;
    nextRoundTimestamp = block.timestamp;
    payouts = [2,3,3,2,2,36];
    numberRange = [1,2,2,1,1,36];
    betAmount = 10000000000000000; /* 0.01 ether */
    maxAmountAllowedInTheBank = 2000000000000000000; /* 2 ether */
  }

  event RandomNumber(uint256 number);
  
  function getStatus() public view returns(uint, uint, uint, uint, uint) {
    return (
      bets.length,             // number of active bets
      bets.length * betAmount, // value of active bets
      nextRoundTimestamp,      // when can we play again
      address(this).balance,   // roulette balance
      winnings[msg.sender]     // winnings of player
    ); 
  }


    
  function addEther() payable public {}

  function bet(uint8 number, uint8 betType) payable public {
    /* 
       A bet is valid when:
       1 - the value of the bet is correct (=betAmount)
       2 - betType is kblock.timestampn (between 0 and 5)
       3 - the option betted is valid (don't bet on 37!)
       4 - the bank has sufficient funds to pay the bet
    */
    require(msg.value == betAmount);                               // 1
    require(betType >= 0 && betType <= 5);                         // 2
    require(number >= 0 && number <= numberRange[betType]);        // 3
    uint payoutForThisBet = payouts[betType] * msg.value;
    uint provisionalBalance = necessaryBalance + payoutForThisBet;
    require(provisionalBalance < address(this).balance);           // 4
    /* we are good to go */
    necessaryBalance += payoutForThisBet;
    bets.push(Bet({
      betType: betType,
      player: msg.sender,
      number: number
    }));
  }

  function spinWheel() public {
    /* are there any bets? */
    require(bets.length > 0);
    /* are we allowed to spin the wheel? */
    require(block.timestamp > nextRoundTimestamp);
    /* next time we are allowed to spin the wheel again */
    nextRoundTimestamp = block.timestamp;
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
        won = (b.betType == 5 && b.number == 0);                   /* bet on 0 */
      } else {
        if (b.betType == 5) { 
          won = (b.number == number);                              /* bet on number */
        } else if (b.betType == 4) {
          if (b.number == 0) won = (number % 2 == 0);              /* bet on even */
          if (b.number == 1) won = (number % 2 == 1);              /* bet on odd */
        } else if (b.betType == 3) {            
          if (b.number == 0) won = (number <= 18);                 /* bet on low 18s */
          if (b.number == 1) won = (number >= 19);                 /* bet on high 18s */
        } else if (b.betType == 2) {                               
          if (b.number == 0) won = (number <= 12);                 /* bet on 1st dozen */
          if (b.number == 1) won = (number > 12 && number <= 24);  /* bet on 2nd dozen */
          if (b.number == 2) won = (number > 24);                  /* bet on 3rd dozen */
        } else if (b.betType == 1) {               
          if (b.number == 0) won = (number % 3 == 1);              /* bet on left column */
          if (b.number == 1) won = (number % 3 == 2);              /* bet on middle column */
          if (b.number == 2) won = (number % 3 == 0);              /* bet on right column */
        } else if (b.betType == 0) {
          if (b.number == 0) {                                     /* bet on black */
            if (number <= 10 || (number >= 20 && number <= 28)) {
              won = (number % 2 == 0);
            } else {
              won = (number % 2 == 1);
            }
          } else {                                                 /* bet on red */
            if (number <= 10 || (number >= 20 && number <= 28)) {
              won = (number % 2 == 1);
            } else {
              won = (number % 2 == 0);
            }
          }
        }
      }
      /* if winning bet, add to player winnings balance */
      if (won) {
        winnings[b.player] += betAmount * payouts[b.betType];
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
  
  function creatorKill() public {
    require(msg.sender == creator);
    address payable payableCreator = payable(creator);
    selfdestruct(payableCreator);

  }

  uint public numberOfFunders;
    mapping(address => bool) private funders;
    mapping(uint => address) private lutFunders;
    mapping(address => uint) private lastFundAmount;
    address public owner;



    modifier onlyOwner(){
        require(msg.sender==owner, "Only the owner can do that");
        _;

    }   

    function transferOwnership(address newOwner) external onlyOwner{
        owner = newOwner;

                 
    }           

    function addFunds() external payable{
       address funder = msg.sender;
       if(!funders[funder]){
        uint index = numberOfFunders++;
        funders[funder] = true;
        lutFunders[index] = funder;
        }
        lastFundAmount[funder] += msg.value;
    }
    function getAllFunders() external view returns(address[] memory){
        address[] memory _funders = new address[](numberOfFunders);
        for(uint i=0; i<numberOfFunders; i++){
            _funders[i] = lutFunders[i];
        }
    return _funders;
    }


    function withdraw(uint withdrawAmount) external {
        require(withdrawAmount >= 1000000000000000000 || msg.sender==owner, "You cannot withdraw more than 1 Ether");
        payable (msg.sender).transfer(withdrawAmount);
    }
 
}

