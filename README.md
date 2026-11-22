# SimpleDAO Web Interface

A minimal proposal and voting smart contract (`SimpleDAO`) with a plain HTML and JavaScript front end. The page connects to MetaMask through ethers.js v5 and lets the connected account submit a proposal, vote on a proposal by ID, and look up a proposal's description and vote count by ID. There is no build step and no backend: the page calls the contract directly through the wallet.

## How it works

**Contract (`contract.sol`).** Proposals are stored in a `mapping(uint256 => Proposal)` keyed by a sequential ID that starts at 0. Each `Proposal` holds a description, a vote count and an `exists` flag. A second mapping, `hasVoted`, records for each proposal which addresses have already voted.

| Function | Kind | Behavior |
| --- | --- | --- |
| `submitProposal(string)` | transaction | Stores a new proposal with 0 votes under ID `proposalCount`, then increments `proposalCount`. |
| `vote(uint256)` | transaction | Reverts with "Proposal does not exist." for an unknown ID and with "You have already voted on this proposal." if the caller has voted on it before. Otherwise marks the caller in `hasVoted` and adds 1 to the proposal's vote count. |
| `getProposalStatus(uint256)` | view | Reverts for an unknown ID, otherwise returns the proposal's description and vote count. |
| `proposals(uint256)` | view | Public getter that returns description, vote count and `exists`. |
| `proposalCount()` | view | Number of proposals submitted so far. |
| `hasVoted(uint256, address)` | view | Public getter that returns whether an address has voted on a proposal. |

**Front end (`dao-interface/`).** `index.html` loads the ethers 5.6.0 UMD build from jsDelivr, then `app.js`, which holds the contract address (`CONTRACT_ADDRESS`, the only place to set it) and the ABI and wires up four buttons:

- **Connect Wallet** requests accounts with `eth_requestAccounts`, wraps `window.ethereum` in `ethers.providers.Web3Provider`, checks that MetaMask is on Sepolia and that `CONTRACT_ADDRESS` holds the fixed contract, and only then creates an `ethers.Contract` bound to the signer. Until that has happened, the other three buttons only show a message saying what is missing, such as "Please connect your wallet first."
- **Submit Proposal** and **Vote** read the current gas price, send the transaction with that price plus 10%, and wait for it to be mined (`tx.wait()`) before showing an alert. **Vote** first calls `hasVoted` for the connected account and shows "You have already voted on this proposal." instead of sending a transaction that would fail.
- **Check Status** reads `proposalCount()` to reject out-of-range IDs, then calls `getProposalStatus(id)` and shows the description and the vote count on the page.

The page only works on Sepolia (chain ID 11155111). If MetaMask is on another network when you connect, the page says so, asks MetaMask to switch with `wallet_switchEthereumChain`, and the other buttons only repeat that message. When the network changes, the page reloads (as MetaMask recommends) and you click **Connect Wallet** again.

On connect the page also checks `CONTRACT_ADDRESS`. If it is empty, if there is no contract at that address on Sepolia, or if the contract there does not answer `hasVoted` (an older `SimpleDAO` deployment), the page shows a message saying so and the buttons stay blocked, rather than calling functions the contract does not have.

## Tech stack

Solidity 0.8, ethers.js 5.6 (loaded from a CDN), MetaMask, HTML and vanilla JavaScript.

## Run it locally

You need MetaMask with some Sepolia test ETH (from a Sepolia faucet) and Python 3, or any other static file server.

The contract has to be deployed again. The address that `app.js` used before (`0x5FD6eB55D12E759a21C09eF703fe0CBa1DC9d88D`) is a deployment of the old contract, without `hasVoted` or vote counts, so `CONTRACT_ADDRESS` now starts empty and the page asks for an address until you set one.

1. In MetaMask, switch to the **Sepolia** network and select the account that will pay for the deployment.
2. Open [Remix](https://remix.ethereum.org). In the **File explorer**, create a file named `SimpleDAO.sol` and paste the contents of `contract.sol` into it.
3. Open the **Solidity compiler** tab, select compiler version 0.8.30 (the version the tests use; any 0.8.x release works) and click **Compile SimpleDAO.sol**.
4. Open the **Deploy & run transactions** tab and set **Environment** to **Injected Provider - MetaMask**. Approve the connection in MetaMask and check that Remix shows your account and Sepolia (chain ID 11155111).
5. Select `SimpleDAO` in the **Contract** list, click **Deploy** and confirm the transaction in MetaMask.
6. When the transaction is mined, the contract appears under **Deployed Contracts**. Click the copy icon next to it to copy its address.
7. In `dao-interface/app.js`, paste the address into `CONTRACT_ADDRESS` at the top of the file: `const CONTRACT_ADDRESS = '0x...';`. The ABI in `app.js` already matches `contract.sol`; if you change the contract, copy the new ABI from the **ABI** button in the compiler tab.
8. Serve the folder over HTTP. MetaMask does not inject into `file://` pages unless the extension is allowed to access file URLs.

   ```bash
   cd dao-interface
   python3 -m http.server 8000
   ```

9. Open http://localhost:8000, click **Connect Wallet** and approve the connection in MetaMask. The line under the button should read `Connected: <your address> (Sepolia)`.

## Project structure

```
contract.sol           SimpleDAO contract
dao-interface/
  index.html           page markup; loads ethers 5.6.0 and app.js
  app.js               CONTRACT_ADDRESS setting, ABI, wallet and network checks, button handlers
```

## Limitations and next steps

- There is no membership, voting period, quorum or execution step. The contract is a proposal registry with a vote counter.
- The contract emits no events, so the page cannot report the ID of a proposal it just submitted (IDs are sequential from 0).
- There are no tests or deployment scripts; deployment is manual through Remix.
