const { expect, assert } = require("chai");
const hre = require("hardhat");
const { setBalance } = require("@nomicfoundation/hardhat-network-helpers");
const ethers = hre.ethers;
const {
  ETHAddress,
  toWei,
  fromWei,
  getBalance,
  getAmountExpect,
  getGasFeeFromTx,
} = require("./utils");

describe("Router", () => {
  let owner;
  let user;
  let factory;
  let router;
  let tokenA;
  let tokenB;
  let poolA;
  let poolB;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    await setBalance(owner.address, toWei(5000));

    const Token = await ethers.getContractFactory("Token");
    tokenA = await Token.deploy("DL TEST Token A", "DLTTA", toWei(1000000));
    await tokenA.waitForDeployment();
    tokenB = await Token.deploy("DL TEST Token B", "DLTTB", toWei(1000000));
    await tokenB.waitForDeployment();

    const Factory = await ethers.getContractFactory("Factory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();

    const Router = await ethers.getContractFactory("Router");
    router = await Router.deploy(factory.target);
    await router.waitForDeployment();

    const Pool = await ethers.getContractFactory("Pool");

    const poolAAddress = await factory.createPool.staticCall(tokenA.target);
    await factory.createPool(tokenA.target);
    poolA = Pool.attach(poolAAddress);
    await tokenA.approve(poolA.target, toWei(10000));
    await poolA.addLiquidity(toWei(2000), { value: toWei(1000) });

    const poolBAddress = await factory.createPool.staticCall(tokenB.target);
    await factory.createPool(tokenB.target);
    poolB = Pool.attach(poolBAddress);
    await tokenB.approve(poolB.target, toWei(10000));
    await poolB.addLiquidity(toWei(4000), { value: toWei(1000) });
  });

  it("is deployed", async () => {
    expect(router.target).to.not.equal("");
  });

  it("factory address is correct.", async () => {
    expect(await router.factoryAddress()).to.eq(factory.target);
  });

  it("getPool address is correct.", async () => {
    expect(await router.getPool(tokenA.target)).to.eq(poolA.target);
    expect(await router.getPool(tokenB.target)).to.eq(poolB.target);
  });

  describe("getTokenAmount", async () => {
    it("returns correct token amount", async () => {
      for (let amountIn of [1, 8, 20, 88]) {
        const amountOut = await router.getAmountOut(
          tokenA.target,
          tokenB.target,
          toWei(amountIn)
        );
        expect(fromWei(amountOut)).to.closeTo(
          // ETH -> tokenB
          getAmountExpect(
            // tokenA -> ETH
            getAmountExpect(amountIn, 2000, 1000),
            1000,
            4000
          ),
          10e-6
        );
      }
    });
  });

  describe("Swap", async () => {
    beforeEach(async () => {
      await tokenA.transfer(user.address, toWei(1000));
      await tokenA.connect(user).approve(router.target, toWei(1000));

      await tokenB.transfer(user.address, toWei(1000));
      await tokenB.connect(user).approve(router.target, toWei(1000));
    });

    it("TokenA for ETH", async () => {
      const userETHBefore = await getBalance(user.address);
      const userTokenBalance = await tokenA.balanceOf(user.address);
      const amountIn = 5.88;
      const expectAmountOut = getAmountExpect(amountIn, 2000, 1000);

      const tx = await router
        .connect(user)
        .swap(tokenA.target, ETHAddress, toWei(amountIn), 0, user.address);
      const gasFee = await getGasFeeFromTx(tx.hash);

      const userTokenAfter = await tokenA.balanceOf(user.address);
      expect(userTokenBalance - userTokenAfter).to.equal(toWei(amountIn));

      const userETHBalance = await getBalance(user.address);
      expect(fromWei(userETHBalance - userETHBefore + gasFee)).to.closeTo(
        expectAmountOut,
        10e-6
      );
    });

    it("TokenA for TokenB", async () => {
      const userTokenABalanceBefore = await tokenA.balanceOf(user.address);
      const userTokenBBalanceBefore = await tokenB.balanceOf(user.address);
      const amountIn = 5.88;

      let expectAmountOut = await router.getAmountOut(
        tokenA.target,
        tokenB.target,
        toWei(amountIn)
      );

      await router
        .connect(user)
        .swap(
          tokenA.target,
          tokenB.target,
          toWei(amountIn),
          expectAmountOut,
          user.address
        );

      expect(
        userTokenABalanceBefore - (await tokenA.balanceOf(user.address))
      ).to.equal(toWei(amountIn));

      expect(
        fromWei(
          (await tokenB.balanceOf(user.address)) - userTokenBBalanceBefore
        )
      ).to.closeTo(fromWei(expectAmountOut), 10e-6);
    });

    it("fails when output amount is less than min amount", async () => {
      const amountIn = 5.88;

      let expectAmountOut = await router.getAmountOut(
        tokenA.target,
        tokenB.target,
        toWei(amountIn)
      );

      await expect(
        router
          .connect(user)
          .swap(
            tokenA.target,
            tokenB.target,
            toWei(amountIn),
            expectAmountOut + 1n,
            user.address
          )
      ).to.be.revertedWith("insufficient output amount");
    });
  });
});
