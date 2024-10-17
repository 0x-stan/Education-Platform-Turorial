const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const {
  toWei,
  fromWei,
  getBalance,
  getGasFeeFromTx,
  getAmountExpect,
} = require("./utils");

describe("Pool", () => {
  let owner;
  let user;
  let pool;
  let token;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("DL TEST Token", "DLTT", toWei(1000000));

    const Pool = await ethers.getContractFactory("Pool");
    pool = await Pool.deploy(token.target);
  });

  it("is deployed", async () => {
    assert.isAtLeast((await pool.name()).length, 1);
    assert.isAtLeast((await pool.symbol()).length, 1);

    expect(await pool.totalSupply()).to.equal(toWei(0));
    // expect(await pool.factoryAddress()).to.equal(owner.address);
  });

  describe("addLiquidity", async () => {
    describe("empty reserves", async () => {
      it("adds liquidity", async () => {
        await token.approve(pool.target, toWei(200));
        await pool.addLiquidity(toWei(200), { value: toWei(100) });
        expect(await getBalance(pool.target)).to.equal(toWei(100));
        expect(await pool.getTokenReserve()).to.equal(toWei(200));
      });

      it("mints LP tokens", async () => {
        await token.approve(pool.target, toWei(200));
        await pool.addLiquidity(toWei(200), { value: toWei(100) });
        const liquidityAmount = Math.sqrt(100 * 200);
        expect(fromWei(await pool.balanceOf(owner.address))).to.closeTo(
          liquidityAmount,
          10e-6
        );
        expect(fromWei(await pool.totalSupply())).to.closeTo(
          liquidityAmount,
          10e-6
        );
      });

      it("allows zero amounts", async () => {
        await token.approve(pool.target, 0);
        await pool.addLiquidity(0, { value: 0 });

        expect(await ethers.provider.getBalance(pool.target)).to.equal(0);
        expect(await pool.getTokenReserve()).to.equal(0);
      });
    });

    describe("existing reserves", async () => {
      beforeEach(async () => {
        await token.approve(pool.target, toWei(300));
        await pool.addLiquidity(toWei(200), { value: toWei(100) });
      });

      it("preserves exchange rate", async () => {
        await pool.addLiquidity(toWei(200), { value: toWei(50) });

        expect(await getBalance(pool.target)).to.equal(toWei(150));
        expect(await pool.getTokenReserve()).to.equal(toWei(300));
      });

      it("mints LP tokens", async () => {
        await pool.addLiquidity(toWei(200), { value: toWei(50) });
        const liquidityAmount = Math.sqrt(200 * 100) * (1 + 50 / 100);

        expect(fromWei(await pool.balanceOf(owner.address))).to.closeTo(
          liquidityAmount,
          10e-6
        );
        expect(fromWei(await pool.totalSupply())).to.closeTo(
          liquidityAmount,
          10e-6
        );
      });

      it("fails when not enough tokens", async () => {
        await expect(
          pool.addLiquidity(toWei(50), { value: toWei(50) })
        ).to.be.revertedWith("insufficient token amount");
      });
    });
  });

  describe("removeLiquidity", async () => {
    let initLP;

    beforeEach(async () => {
      await token.approve(pool.target, toWei(300));
      await pool.addLiquidity(toWei(200), { value: toWei(100) });
      initLP = Math.sqrt(200 * 100);
    });

    it("removes some liquidity", async () => {
      const amount = 25;

      const userEtherBalanceBefore = await getBalance(owner.address);
      const userTokenBalanceBefore = await token.balanceOf(owner.address);

      const tx = await pool.removeLiquidity(toWei(amount));
      const gasFee = await getGasFeeFromTx(tx.hash);

      expect(fromWei(await pool.getTokenReserve())).to.closeTo(
        200 - (200 * amount) / initLP,
        10e-6
      );
      expect(fromWei(await getBalance(pool.target))).to.closeTo(
        100 - (100 * amount) / initLP,
        10e-6
      );

      const userEtherBalanceAfter = await getBalance(owner.address);
      const userTokenBalanceAfter = await token.balanceOf(owner.address);

      expect(
        fromWei(userEtherBalanceAfter - userEtherBalanceBefore + gasFee)
      ).to.closeTo((100 * amount) / initLP, 10e-6); // the balance of eth has been cost gas fees

      expect(
        fromWei(userTokenBalanceAfter - userTokenBalanceBefore)
      ).to.closeTo((200 * amount) / initLP, 10e-6);
    });

    it("removes all liquidity", async () => {
      const userEtherBalanceBefore = await getBalance(owner.address);
      const userTokenBalanceBefore = await token.balanceOf(owner.address);
      const totalSupply = await pool.totalSupply();
      const tx = await pool.removeLiquidity(totalSupply);
      const gasFee = await getGasFeeFromTx(tx.hash);

      expect(await pool.getTokenReserve()).to.equal(toWei(0));
      expect(await getBalance(pool.target)).to.equal(toWei(0));

      const userEtherBalanceAfter = await getBalance(owner.address);
      const userTokenBalanceAfter = await token.balanceOf(owner.address);

      expect(userEtherBalanceAfter - userEtherBalanceBefore).to.equal(
        toWei(100) - gasFee
      ); // 100 - gas fees

      expect(fromWei(userTokenBalanceAfter - userTokenBalanceBefore)).to.equal(
        200
      );
    });

    it("burns LP-tokens", async () => {
      await expect(() => pool.removeLiquidity(toWei(25))).to.changeTokenBalance(
        pool,
        owner,
        toWei(-25)
      );

      expect(fromWei(await pool.totalSupply())).to.closeTo(initLP - 25, 10e-6);
    });

    it("doesn't allow invalid amount", async () => {
      const totalSupply = await pool.totalSupply();
      await expect(pool.removeLiquidity(totalSupply + BigInt(1)))
        .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
        .withArgs(owner.address, totalSupply, totalSupply + BigInt(1));
    });
  });

  describe("getTokenAmount", async () => {
    it("returns correct token amount", async () => {
      await token.approve(pool.target, toWei(2000));
      await pool.addLiquidity(toWei(2000), { value: toWei(1000) });

      let amountOut;
      amountOut = await pool.getTokenAmount(toWei(1));
      expect(fromWei(amountOut)).to.closeTo(
        getAmountExpect(1, 1000, 2000),
        10e-6
      );

      amountOut = await pool.getTokenAmount(toWei(20));
      expect(fromWei(amountOut)).to.closeTo(
        getAmountExpect(20, 1000, 2000),
        10e-6
      );

      amountOut = await pool.getTokenAmount(toWei(100));
      expect(fromWei(amountOut)).to.closeTo(
        getAmountExpect(100, 1000, 2000),
        10e-6
      );
    });
  });

  describe("getEthAmount", async () => {
    it("returns correct ether amount", async () => {
      await token.approve(pool.target, toWei(2000));
      await pool.addLiquidity(toWei(2000), { value: toWei(1000) });

      let amountOut;
      amountOut = await pool.getEthAmount(toWei(1));
      expect(fromWei(amountOut)).to.closeTo(
        getAmountExpect(1, 2000, 1000),
        10e-6
      );

      amountOut = await pool.getEthAmount(toWei(20));
      expect(fromWei(amountOut)).to.closeTo(
        getAmountExpect(20, 2000, 1000),
        10e-6
      );

      amountOut = await pool.getEthAmount(toWei(100));
      expect(fromWei(amountOut)).to.closeTo(
        getAmountExpect(100, 2000, 1000),
        10e-6
      );
    });
  });

  describe("swap: ETH to Token", async () => {
    beforeEach(async () => {
      await token.approve(pool.target, toWei(2000));
      await pool.addLiquidity(toWei(2000), { value: toWei(1000) });
    });

    it("transfers at least min amount of tokens", async () => {
      const userBalanceBefore = await getBalance(user.address);
      const amountIn = 1.97;
      const expectAmountOut = getAmountExpect(amountIn, 1000, 2000);

      const tx = await pool
        .connect(user)
        .swap(toWei(amountIn), 0, true, user.address, {
          value: toWei(amountIn),
        });
      const gasFee = await getGasFeeFromTx(tx.hash);

      const userBalanceAfter = await getBalance(user.address);
      expect(userBalanceBefore - userBalanceAfter).to.equal(
        toWei(amountIn) + gasFee
      );

      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.closeTo(expectAmountOut, 10e-6);

      const poolEthBalance = await getBalance(pool.target);
      expect(fromWei(poolEthBalance)).to.equal(1000 + amountIn);

      const poolTokenBalance = await token.balanceOf(pool.target);
      expect(fromWei(poolTokenBalance)).to.closeTo(
        2000 - expectAmountOut,
        10e-6
      );
    });

    it("fails when output amount is less than min amount", async () => {
      await expect(
        pool
          .connect(user)
          .swap(toWei(1), toWei(2), true, user.address, { value: toWei(1) })
      ).to.be.revertedWith("insufficient output amount");
    });

    it("allows zero swaps", async () => {
      await pool.connect(user).swap(toWei(0), toWei(0), true, user.address, {
        value: toWei(0),
      });

      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.equal(0);

      const poolEthBalance = await getBalance(pool.target);
      expect(fromWei(poolEthBalance)).to.equal(1000);

      const poolTokenBalance = await token.balanceOf(pool.target);
      expect(fromWei(poolTokenBalance)).to.equal(2000);
    });
  });

  describe("swap: Token to ETH", async () => {
    beforeEach(async () => {
      await token.approve(pool.target, toWei(2000));
      await pool.addLiquidity(toWei(2000), { value: toWei(1000) });
      await token.transfer(user.address, toWei(2000));
      await token.connect(user).approve(pool.target, toWei(2000));
    });

    it("transfers at least min amount of tokens", async () => {
      const userETHBefore = await getBalance(user.address);
      const userTokenBalance = await token.balanceOf(user.address);
      const amountIn = 5.88;
      const expectAmountOut = getAmountExpect(amountIn, 2000, 1000);

      const tx = await pool
        .connect(user)
        .swap(toWei(amountIn), 0, false, user.address);
      const gasFee = await getGasFeeFromTx(tx.hash);

      const userTokenAfter = await token.balanceOf(user.address);
      expect(userTokenBalance - userTokenAfter).to.equal(toWei(amountIn));

      const userETHBalance = await getBalance(user.address);
      expect(fromWei(userETHBalance - userETHBefore + gasFee)).to.closeTo(
        expectAmountOut,
        10e-6
      );

      const poolEthBalance = await getBalance(pool.target);
      expect(fromWei(poolEthBalance)).to.equal(1000 - expectAmountOut);

      const poolTokenBalance = await token.balanceOf(pool.target);
      expect(fromWei(poolTokenBalance)).to.closeTo(2000 + amountIn, 10e-6);
    });
  });
});
