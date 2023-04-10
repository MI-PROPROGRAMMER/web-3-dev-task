import React, { useState, useEffect } from 'react';
import USDCABI from './usdcabi.json';
import Web3 from 'web3';

function App() {
  const [accountBalances, setAccountBalances] = useState([]);

  useEffect(() => {
    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
    const usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const usdcContract = new web3.eth.Contract(USDCABI, usdcAddress);

    async function getTransferEvents() {
      const events = await usdcContract.getPastEvents("Transfer", {
        fromBlock: 12357600, // 1st March 2023 block number
        toBlock: "latest",
      });

      let balances = {};

      for (const event of events) {
        const { from, to, value } = event.returnValues;
        if (!(from in balances)) {
          balances[from] = 0;
        }
        if (!(to in balances)) {
          balances[to] = 0;
        }
        balances[from] -= parseInt(value);
        balances[to] += parseInt(value);
      }

      let accountBalances = [];
      for (const [address, balance] of Object.entries(balances)) {
        accountBalances.push({ address, balance });
      }
      setAccountBalances(accountBalances);
    }

    getTransferEvents();

    const subscription = web3.eth.subscribe("logs", {
      address: usdcAddress,
      topics: [
        "0xa9059cbbd5a5fcf1ce74d37ebd5d5f5c64eee4c4d4b9d9b7f6e8cfa83f320a91", // keccak256("Transfer(address,address,uint256)")
      ],
    }).on("data", async (log) => {
      const decodedLog = web3.eth.abi.decodeLog(
        [
          {
            type: "address",
            name: "from",
            indexed: true,
          },
          {
            type: "address",
            name: "to",
            indexed: true,
          },
          {
            type: "uint256",
            name: "value",
          },
        ],
        log.data,
        log.topics.slice(1)
      );
      const { from, to, value } = decodedLog;

      let accountBalancesCopy = [...accountBalances];
      let fromAccount = accountBalancesCopy.find(
        (account) => account.address === from
      );
      let toAccount = accountBalancesCopy.find(
        (account) => account.address === to
      );
      if (fromAccount) {
        fromAccount.balance -= parseInt(value);
      }
      if (toAccount) {
        toAccount.balance += parseInt(value);
      }
      if (!fromAccount) {
        fromAccount = { address: from, balance: -1 * parseInt(value) };
        accountBalancesCopy.push(fromAccount);
      }
      if (!toAccount) {
        toAccount = { address: to, balance: parseInt(value) };
        accountBalancesCopy.push(toAccount);
      }
      setAccountBalances(accountBalancesCopy);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>USDC Account Holders</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Address</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {accountData.map((account) => (
                <tr key={account.address}>
                  <td>{account.address}</td>
                  <td>{account.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </header>
    </div>
  );
}

export default App;

const USDC_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address recipient, uint256 amount) public returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];


// import React, { useState, useEffect } from "react";
// import Web3 from "web3";
// import USDCABI from "./USDCABI.json";

// function App() {
//   const [accounts, setAccounts] = useState([]);
//   const [balances, setBalances] = useState({});
//   const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
//   const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
//   const USDC_CONTRACT = new web3.eth.Contract(USDCABI, USDC_ADDRESS);

//   useEffect(() => {
//     const getTransferEvents = async () => {
//       const fromBlock = await web3.eth.getBlockNumber("latest") - 100000;
//       const toBlock = "latest";
//       const events = await USDC_CONTRACT.getPastEvents("Transfer", {
//         fromBlock,
//         toBlock,
//       });
//       const accountsSet = new Set();
//       const newBalances = {};
//       events.forEach((event) => {
//         accountsSet.add(event.returnValues.from);
//         accountsSet.add(event.returnValues.to);
//         newBalances[event.returnValues.from] =
//           (newBalances[event.returnValues.from] || 0) - event.returnValues.value;
//         newBalances[event.returnValues.to] =
//           (newBalances[event.returnValues.to] || 0) + event.returnValues.value;
//       });
//       setAccounts([...accountsSet]);
//       setBalances(newBalances);
//     };
//     getTransferEvents();

//     const subscription = USDC_CONTRACT.events.Transfer(
//       {
//         fromBlock: "latest",
//       },
//       async (error, event) => {
//         if (!error) {
//           const newBalances = { ...balances };
//           newBalances[event.returnValues.from] =
//             (newBalances[event.returnValues.from] || 0) - event.returnValues.value;
//           newBalances[event.returnValues.to] =
//             (newBalances[event.returnValues.to] || 0) + event.returnValues.value;
//           setBalances(newBalances);
//         }
//       }
//     );

//     return () => subscription.unsubscribe();
//   }, []);

//   return (
//     <div>
//       <h1>USDC Accounts and Balances</h1>
//       <table>
//         <thead>
//           <tr>
//             <th>Address</th>
//             <th>Balance</th>
//           </tr>
//         </thead>
//         <tbody>
//           {accounts.map((account) => (
//             <tr key={account}>
//               <td>{account}</td>
//               <td>{balances[account] || 0}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default App;
