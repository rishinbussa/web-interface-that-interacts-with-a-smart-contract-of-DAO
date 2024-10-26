const { ethers } = window;

const contractAddress = '0x5FD6eB55D12E759a21C09eF703fe0CBa1DC9d88D'; // Replace with your contract address
const contractABI = [
    {
        "inputs": [
            { "internalType": "uint256", "name": "_proposalId", "type": "uint256" }
        ],
        "name": "getProposalStatus",
        "outputs": [
            { "internalType": "string", "name": "", "type": "string" }
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

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            const address = await signer.getAddress();
            document.getElementById('walletInfo').innerText = `Connected: ${address}`;
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
    const proposalId = document.getElementById('proposalId').value;
    if (!proposalId) {
        alert('Please enter a proposal ID.');
        return;
    }

    try {
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

        const status = await contract.getProposalStatus(proposalId);
        console.log("Checking status for proposal ID:", proposalId, "Status:", status);
        document.getElementById('proposalStatus').innerText = `Proposal Status: ${status}`;
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
});