const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { toWei, fromWei, getBalance, getGasFeeFromTx } = require("./utils");

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
      await expect(() =>
        pool.removeLiquidity(toWei(25))
      ).to.changeTokenBalance(pool, owner, toWei(-25));

      expect(fromWei(await pool.totalSupply())).to.closeTo(
        initLP - 25,
        10e-6
      );
    });

    it("doesn't allow invalid amount", async () => {
      const totalSupply = await pool.totalSupply();
      await expect(pool.removeLiquidity(totalSupply + BigInt(1)))
        .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
        .withArgs(owner.address, totalSupply, totalSupply + BigInt(1));
    });
  });
});
