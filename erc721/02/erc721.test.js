const { assert } = require("chai");
describe("ERC721", () => {
  let erc721;

  beforeEach(async () => {
    const ERC721 = await ethers.getContractFactory("ERC721Token");
    erc721 = await ERC721.deploy("My NFT Token", "MNFT");
  });

  context("`name`", () => {
    it("should return the correct name", async () => {
      const name = await erc721.name();
      assert.isAtLeast(name.length, 1);
    });
  });

  context("`symbol`", () => {
    it("should return the correct symbol", async () => {
      const sym = await erc721.symbol();
      assert.equal(sym.length, 4);
    });
  });
});
