const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleDAO", function () {
  // Deploys the contract and submits one proposal, which gets ID 0.
  async function deployWithProposal() {
    const [alice, bob, carol] = await ethers.getSigners();
    const dao = await ethers.deployContract("SimpleDAO");
    await dao.submitProposal("Fund the hackathon");
    return { dao, alice, bob, carol };
  }

  it("numbers proposals from 0 and starts them with no votes", async function () {
    const { dao } = await deployWithProposal();
    await dao.submitProposal("Buy pizza");

    expect(await dao.proposalCount()).to.equal(2n);
    const [description, voteCount] = await dao.getProposalStatus(1);
    expect(description).to.equal("Buy pizza");
    expect(voteCount).to.equal(0n);
  });

  it("counts one vote from each address", async function () {
    const { dao, alice, bob, carol } = await deployWithProposal();
    await dao.connect(alice).vote(0);
    await dao.connect(bob).vote(0);
    await dao.connect(carol).vote(0);

    const [description, voteCount] = await dao.getProposalStatus(0);
    expect(description).to.equal("Fund the hackathon");
    expect(voteCount).to.equal(3n);
  });

  it("rejects a second vote from the same address", async function () {
    const { dao, alice } = await deployWithProposal();
    await dao.connect(alice).vote(0);

    await expect(dao.connect(alice).vote(0)).to.be.revertedWith(
      "You have already voted on this proposal."
    );
    const [, voteCount] = await dao.getProposalStatus(0);
    expect(voteCount).to.equal(1n);
  });

  it("tracks voters separately for each proposal", async function () {
    const { dao, alice } = await deployWithProposal();
    await dao.submitProposal("Buy pizza");
    await dao.connect(alice).vote(0);

    expect(await dao.hasVoted(0, alice.address)).to.equal(true);
    expect(await dao.hasVoted(1, alice.address)).to.equal(false);

    // Voting on proposal 0 does not stop the same address voting on proposal 1.
    await dao.connect(alice).vote(1);
    const [, voteCount] = await dao.getProposalStatus(1);
    expect(voteCount).to.equal(1n);
  });

  it("rejects votes and status checks for proposals that do not exist", async function () {
    const { dao } = await deployWithProposal();
    await expect(dao.vote(5)).to.be.revertedWith("Proposal does not exist.");
    await expect(dao.getProposalStatus(5)).to.be.revertedWith("Proposal does not exist.");
  });
});
