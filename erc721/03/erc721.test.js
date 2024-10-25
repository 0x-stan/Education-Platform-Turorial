const { assert, expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC721Token", () => {
  let erc721, owner, addr1, addr2, addr3, nonERC721Receiver;

  beforeEach(async () => {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const ERC721 = await ethers.getContractFactory("ERC721Token");
    erc721 = await ERC721.deploy("My NFT Token", "MNFT");
    nonERC721Receiver = await (
      await ethers.getContractFactory("NonERC721Receiver")
    ).deploy();
  });

  context("`name` and `symbol`", () => {
    it("should return the correct name", async () => {
      const name = await erc721.name();
      assert.equal(name, "My NFT Token");
    });

    it("should return the correct symbol", async () => {
      const symbol = await erc721.symbol();
      assert.equal(symbol, "MNFT");
    });
  });

  describe("Token Transfers", () => {
    beforeEach(async () => {
      await erc721.connect(owner).mint(owner.address, 1);
    });

    it("should transfer a token from one address to another", async () => {
      await erc721.connect(owner).transferFrom(owner.address, addr1.address, 1);
      const ownerOfToken = await erc721.ownerOf(1);
      assert.equal(ownerOfToken, addr1.address);
    });

    it("should safely transfer token and check for ERC721Receiver", async () => {
      await erc721
        .connect(owner)
        .safeTransferFrom(owner.address, addr2.address, 1);
      const newOwner = await erc721.ownerOf(1);
      assert.equal(newOwner, addr2.address);
    });

    it("should fail safe transfer if receiver contract is non-compliant", async () => {
      await expect(
        erc721
          .connect(owner)
          .safeTransferFrom(owner.address, nonERC721Receiver.target, 1)
      ).to.be.revertedWith("Transfer to non ERC721Receiver implementer");
    });
  });

  describe("Approval", () => {
    beforeEach(async () => {
      await erc721.connect(owner).mint(owner.address, 1);
    });

    it("should approve another address to transfer token", async () => {
      await erc721.connect(owner).approve(addr1.address, 1);
      const approved = await erc721.tokenApprovals(1);
      assert.equal(approved, addr1.address);
    });

    it("should set and check approval for all tokens", async () => {
      await erc721.connect(owner).setApprovalForAll(addr1.address, true);
      const isApprovedForAll = await erc721.operatorApprovals(
        owner.address,
        addr1.address
      );
      assert.equal(isApprovedForAll, true);
    });

    it("should allow approved operator to transfer token on behalf of owner", async () => {
      await erc721.connect(owner).setApprovalForAll(addr1.address, true);
      await erc721.connect(addr1).transferFrom(owner.address, addr2.address, 1);
      const newOwner = await erc721.ownerOf(1);
      assert.equal(newOwner, addr2.address);
    });
  });

  describe("Minting and Initial Ownership", () => {
    it("should mint a new token and assign ownership", async () => {
      await erc721.connect(owner).mint(owner.address, 1);
      const ownerOfToken = await erc721.ownerOf(1);
      assert.equal(ownerOfToken, owner.address);
    });

    it("should fail minting to the zero address", async () => {
      await expect(
        erc721.connect(owner).mint(ethers.ZeroAddress, 1)
      ).to.be.revertedWith("Invalid recipient address");
    });
  });
});
