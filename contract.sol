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
        proposals[_proposalId].voteCount++;
    }

    function getProposalStatus(uint256 _proposalId) public view returns (string memory) {
        require(proposals[_proposalId].exists, "Proposal does not exist.");
        return proposals[_proposalId].description;
    }
}