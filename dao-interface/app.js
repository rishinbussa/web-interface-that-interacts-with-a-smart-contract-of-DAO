const { ethers } = window;

const contractAddress = '0x5FD6eB55D12E759a21C09eF703fe0CBa1DC9d88D'; // Replace with your contract address

// The page only works on the Sepolia test network.
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';
const contractABI = [
    {
        "inputs": [
            { "internalType": "uint256", "name": "_proposalId", "type": "uint256" }
        ],
        "name": "getProposalStatus",
        "outputs": [
            { "internalType": "string", "name": "description", "type": "string" },
            { "internalType": "uint256", "name": "voteCount", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" },
            { "internalType": "address", "name": "", "type": "address" }
        ],
        "name": "hasVoted",
        "outputs": [
            { "internalType": "bool", "name": "", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "proposalCount",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "name": "proposals",
        "outputs": [
            { "internalType": "string", "name": "description", "type": "string" },
            { "internalType": "uint256", "name": "voteCount", "type": "uint256" },
            { "internalType": "bool", "name": "exists", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "string", "name": "_description", "type": "string" }
        ],
        "name": "submitProposal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "_proposalId", "type": "uint256" }
        ],
        "name": "vote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

let provider;
let signer;
let contract;
// What the user has to do before the buttons work. connectWallet() changes it.
let notReadyMessage = 'Please connect your wallet first.';

// Called at the start of every action. Until connectWallet() has created
// the contract object, it shows notReadyMessage and returns false.
function isReady() {
    if (!contract) {
        alert(notReadyMessage);
        return false;
    }
    return true;
}

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            const address = await signer.getAddress();

            const { chainId } = await provider.getNetwork();
            if (chainId !== SEPOLIA_CHAIN_ID) {
                notReadyMessage = 'This page works on the Sepolia test network. Switch MetaMask to Sepolia, then click Connect Wallet again.';
                document.getElementById('walletInfo').innerText = `Connected: ${address} on chain ID ${chainId}. ${notReadyMessage}`;
                // Ask MetaMask to switch. If the user accepts, the chainChanged
                // listener at the bottom of this file reloads the page.
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
                });
                return;
            }

            contract = new ethers.Contract(contractAddress, contractABI, signer);
            document.getElementById('walletInfo').innerText = `Connected: ${address} (Sepolia)`;
            console.log("Connected to wallet:", address);
        } catch (error) {
            console.error("Error connecting to wallet:", error);
            alert(`An error occurred while connecting: ${error.message}`);
        }
    } else {
        alert('Please install MetaMask!');
    }
}

async function submitProposal() {
    if (!isReady()) return;

    const description = document.getElementById('proposalDescription').value;
    if (!description) {
        alert('Please enter a proposal description.');
        return;
    }

    try {
        const gasPrice = await provider.getGasPrice();
        const tx = await contract.submitProposal(description, {
            gasPrice: gasPrice.add(gasPrice.div(10)) // Adding 10% to current gas price
        });
        console.log("Submitting proposal:", description);
        await tx.wait();
        alert('Proposal submitted!');
        document.getElementById('proposalDescription').value = ''; // Clear the input field
    } catch (error) {
        console.error("Error submitting proposal:", error);
        alert('An error occurred while submitting the proposal: ' + error.message);
    }
}

async function voteOnProposal() {
    if (!isReady()) return;

    const proposalId = document.getElementById('proposalId').value;
    if (!proposalId) {
        alert('Please enter a proposal ID.');
        return;
    }

    try {
        // The contract rejects a second vote from the same address. Checking
        // first gives a clear message instead of a failed transaction.
        if (await contract.hasVoted(proposalId, await signer.getAddress())) {
            alert('You have already voted on this proposal.');
            return;
        }

        const gasPrice = await provider.getGasPrice();
        const tx = await contract.vote(proposalId, {
            gasPrice: gasPrice.add(gasPrice.div(10)) // Adding 10% to current gas price
        });
        console.log("Voting on proposal ID:", proposalId);
        await tx.wait();
        alert('Vote cast!');
        document.getElementById('proposalId').value = ''; // Clear the input field
    } catch (error) {
        console.error("Error casting vote:", error);
        alert('An error occurred while casting the vote: ' + error.message);
    }
}

async function checkProposalStatus() {
    if (!isReady()) return;

    const proposalId = document.getElementById('checkProposalId').value;
    if (!proposalId) {
        alert('Please enter a proposal ID.');
        return;
    }

    try {
        const totalProposals = await contract.proposalCount();
        if (proposalId >= totalProposals.toNumber()) {
            alert('Invalid proposal ID. Please enter a valid one.');
            return;
        }

        const [description, voteCount] = await contract.getProposalStatus(proposalId);
        console.log("Checking status for proposal ID:", proposalId, description, voteCount.toString());
        document.getElementById('proposalStatus').innerText =
            `Proposal ${proposalId}: ${description}\nVotes: ${voteCount.toString()}`;
    } catch (error) {
        console.error("Error checking proposal status:", error);
        alert('An error occurred while checking the proposal status: ' + error.message);
    }
}

window.addEventListener('load', () => {
    document.getElementById('connectButton').addEventListener('click', connectWallet);
    document.getElementById('submitProposalButton').addEventListener('click', submitProposal);
    document.getElementById('voteButton').addEventListener('click', voteOnProposal);
    document.getElementById('checkStatusButton').addEventListener('click', checkProposalStatus);

    if (window.ethereum && window.ethereum.on) {
        // MetaMask recommends reloading the page when the network changes,
        // so the page never keeps using a provider for the old network.
        window.ethereum.on('chainChanged', () => window.location.reload());
    }
});