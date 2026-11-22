// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleDAO {
    struct Proposal {
        string description;
        uint256 voteCount;
        bool exists;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    // hasVoted[proposalId][voter] becomes true once that address has voted on that proposal.
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    function submitProposal(string memory _description) public {
        proposals[proposalCount] = Proposal({
            description: _description,
            voteCount: 0,
            exists: true
        });
        proposalCount++;
    }

    function vote(uint256 _proposalId) public {
        require(proposals[_proposalId].exists, "Proposal does not exist.");
        require(!hasVoted[_proposalId][msg.sender], "You have already voted on this proposal.");
        hasVoted[_proposalId][msg.sender] = true;
        proposals[_proposalId].voteCount++;
    }

    function getProposalStatus(uint256 _proposalId) public view returns (string memory description, uint256 voteCount) {
        require(proposals[_proposalId].exists, "Proposal does not exist.");
        Proposal storage proposal = proposals[_proposalId];
        return (proposal.description, proposal.voteCount);
    }
}