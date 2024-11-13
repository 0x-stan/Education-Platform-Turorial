const { assert } = require("chai");
const { ethers } = require("hardhat");
describe("Token", () => {
  let token;

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy(
      "DappLearning Test Token",
      "DLT",
      18,
      10000
    );
  });

  describe("ERC20 Optional", () => {
    context("`name`", () => {
      it("should return the correct name", async () => {
        const name = await token.name();
        assert.isAtLeast(name.length, 1);
      });
    });

    context("`symbol`", () => {
      it("should return the correct symbol", async () => {
        const sym = await token.symbol();
        assert.equal(sym.length, 3);
      });
    });

    context("`decimals`", () => {
      it("should return the correct decimals", async () => {
        const decimals = await token.decimals();
        assert.equal(decimals, 18);
      });
    });
  });

  describe("ERC20 Standard", () => {
    context("totalSupply", () => {
      it("should return zero", async () => {
        const result = await token.totalSupply();
        assert.equal(result.toString(), ethers.parseEther("10000").toString());
      });
    });
  });
});
