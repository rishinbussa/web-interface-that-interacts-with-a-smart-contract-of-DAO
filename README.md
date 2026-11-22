# SimpleDAO Web Interface

A minimal proposal and voting smart contract (`SimpleDAO`) with a plain HTML and JavaScript front end. The page connects to MetaMask through ethers.js v5 and lets the connected account submit a proposal, vote on a proposal by ID, and look up a proposal's description by ID. There is no build step and no backend: the page calls the contract directly through the wallet.

## How it works

**Contract (`contract.sol`).** Proposals are stored in a `mapping(uint256 => Proposal)` keyed by a sequential ID that starts at 0. Each `Proposal` holds a description, a vote count and an `exists` flag. A second mapping, `hasVoted`, records for each proposal which addresses have already voted.

| Function | Kind | Behavior |
| --- | --- | --- |
| `submitProposal(string)` | transaction | Stores a new proposal with 0 votes under ID `proposalCount`, then increments `proposalCount`. |
| `vote(uint256)` | transaction | Reverts with "Proposal does not exist." for an unknown ID and with "You have already voted on this proposal." if the caller has voted on it before. Otherwise marks the caller in `hasVoted` and adds 1 to the proposal's vote count. |
| `getProposalStatus(uint256)` | view | Reverts for an unknown ID, otherwise returns the proposal's description. |
| `proposals(uint256)` | view | Public getter that returns description, vote count and `exists`. |
| `proposalCount()` | view | Number of proposals submitted so far. |
| `hasVoted(uint256, address)` | view | Public getter that returns whether an address has voted on a proposal. |

**Front end (`dao-interface/`).** `index.html` loads the ethers 5.6.0 UMD build from jsDelivr, then `app.js`, which holds the contract address and ABI and wires up four buttons:

- **Connect Wallet** requests accounts with `eth_requestAccounts`, wraps `window.ethereum` in `ethers.providers.Web3Provider`, and creates an `ethers.Contract` bound to the signer.
- **Submit Proposal** and **Vote** read the current gas price, send the transaction with that price plus 10%, and wait for it to be mined (`tx.wait()`) before showing an alert. **Vote** first calls `hasVoted` for the connected account and shows "You have already voted on this proposal." instead of sending a transaction that would fail.
- **Check Status** reads `proposalCount()` to reject out-of-range IDs, then calls `getProposalStatus(id)` and prints the result on the page.

The page uses whichever network MetaMask is connected to, and the code does not check the chain ID, so the address in `app.js` has to be a `SimpleDAO` deployment on that network.

## Tech stack

Solidity 0.8, ethers.js 5.6 (loaded from a CDN), MetaMask, HTML and vanilla JavaScript.

## Run it locally

You need MetaMask with test ETH on the network you deploy to (for example Sepolia) and Python 3, or any other static file server.

1. Open [Remix](https://remix.ethereum.org), add `contract.sol` and compile it with a Solidity 0.8.x compiler.
2. In Deploy & Run, choose **Injected Provider - MetaMask**, deploy `SimpleDAO` and copy the deployed address.
3. Replace the value of `contractAddress` at the top of `dao-interface/app.js` with that address.
4. Serve the folder over HTTP. MetaMask does not inject into `file://` pages unless the extension is allowed to access file URLs.

   ```bash
   cd dao-interface
   python3 -m http.server 8000
   ```

5. Open http://localhost:8000, click **Connect Wallet** and approve the connection in MetaMask.

## Project structure

```
contract.sol           SimpleDAO contract
dao-interface/
  index.html           page markup; loads ethers 5.6.0 and app.js
  app.js               wallet connection, contract address and ABI, button handlers
```

## Limitations and next steps

- `getProposalStatus` returns the description rather than a status or vote count, and the page never calls `proposals(id)`, so vote totals are not shown in the UI.
- There is no membership, voting period, quorum or execution step. The contract is a proposal registry with a vote counter.
- The contract emits no events, so the page cannot report the ID of a proposal it just submitted (IDs are sequential from 0).
- The contract address is hard-coded, and there are no tests or deployment scripts; deployment is manual through Remix.
