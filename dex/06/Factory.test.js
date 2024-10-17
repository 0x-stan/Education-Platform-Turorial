const { expect, assert } = require("chai");
const hre = require("hardhat");
const ethers = hre.ethers;
const { toWei } = require("./utils");

describe("Factory", () => {
  let owner;
  let factory;
  let token;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("DL TEST Token", "DLTT", toWei(1000000));
    await token.waitForDeployment();

    const Factory = await ethers.getContractFactory("Factory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();
  });

  it("is deployed", async () => {
    expect(factory.target).to.not.equal("");
  });

  describe("createPool", () => {
    it("deploys an pool", async () => {
      const poolAddress = await factory.createPool.staticCall(token.target);
      await factory.createPool(token.target);

      expect(await factory.getPool(token.target)).to.equal(poolAddress);

      const Pool = await ethers.getContractFactory("Pool");
      const pool = Pool.attach(poolAddress);
      assert.isAtLeast((await pool.name()).length, 1);
      assert.isAtLeast((await pool.symbol()).length, 1);
      expect(await pool.factoryAddress()).to.equal(factory.target);
    });

    it("doesn't allow zero address", async () => {
      await expect(
        factory.createPool("0x0000000000000000000000000000000000000000")
      ).to.be.revertedWith("invalid token address");
    });

    it("fails when pool exists", async () => {
      await factory.createPool(token.target);

      await expect(factory.createPool(token.target)).to.be.revertedWith(
        "pool already exists"
      );
    });
  });

  describe("getPool", () => {
    it("returns pool address by token address", async () => {
      const poolAddress = await factory.createPool.staticCall(token.target);
      await factory.createPool(token.target);

      expect(await factory.getPool(token.target)).to.equal(poolAddress);
    });
  });
});
