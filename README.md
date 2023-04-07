# Getting Started with Project

Run the following commands to install needed packages:
```
  npm install @openzeppelin/contracts
  
  npm install @metamask/detect-provider
  
  npm install react-toastify@7.0.4
  
```
Make sure your react version is v16.18.0 (run "node -v")

# Starting the contract

  Run the following commands:
  ```
  const instance = await Roulette.deployed() -> this will deploy your contract
  
  instance.addEther({value: "5000000000000000000", from: accounts[0]}) -> this will add 5 ETH to the contract 
```  
# Starting React UI

  Run the following command:
```  
  npm start
```
