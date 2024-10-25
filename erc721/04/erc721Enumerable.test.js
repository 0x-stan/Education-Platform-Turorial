const { assert, expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC721Enumerable", () => {
  let erc721, owner, addr1, addr2;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const ERC721Enumerable = await ethers.getContractFactory("ERC721Enumerable");
    erc721 = await ERC721Enumerable.deploy("My NFT Token", "MNFT", "https://metadata-url.com/");
  });

  describe("Metadata", () => {
    it("should set and return the correct tokenURI", async () => {
      await erc721.connect(owner).mint(owner.address, 1);
      const uri = await erc721.tokenURI(1);
      assert.equal(uri, "https://metadata-url.com/1");
    });
  });

  describe("Enumerable", () => {
    beforeEach(async () => {
      await erc721.connect(owner).mint(owner.address, 1);
      await erc721.connect(owner).mint(addr1.address, 2);
      await erc721.connect(owner).mint(addr2.address, 3);
    });

    it("should return the correct total supply", async () => {
      const supply = await erc721.totalSupply();
      assert.equal(supply, 3);
    });

    it("should return the correct token by global index", async () => {
      const tokenId = await erc721.tokenByIndex(1);
      assert.equal(tokenId, 2);
    });

    it("should revert when querying a token by non-existent global index", async () => {
      await expect(erc721.tokenByIndex(10)).to.be.revertedWith("ERC721Enumerable: global index out of bounds");
    });

    it("should return the correct token by owner index", async () => {
      const tokenId = await erc721.tokenOfOwnerByIndex(addr1.address, 0);
      assert.equal(tokenId, 2);
    });

    it("should revert when querying a token by non-existent owner index", async () => {
      await expect(erc721.tokenOfOwnerByIndex(addr1.address, 2)).to.be.revertedWith("ERC721Enumerable: owner index out of bounds");
    });
  });
});
