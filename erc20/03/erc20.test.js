const { assert, expect } = require("chai");
const { ethers } = require("hardhat");
describe("Token", () => {
  let token;
  const totalSupply = "10000";

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy(
      "DappLearning Test Token",
      "DLT",
      18,
      totalSupply
    );

    const accounts = await ethers.getSigners();
    owner = accounts[0];
    a1 = accounts[1];
  });

  describe("ERC20 Standard", () => {
    context("transfer", () => {
      describe("the owner transfers a value of 1 to the recipient", () => {
        let transferEvent;
        beforeEach(async () => {
          const tx = await token.connect(owner).transfer(a1.address, "1");
          receipt = await tx.wait();
          filter = token.filters.Transfer;
          const events = await token.queryFilter(filter, -1);
          transferEvent = events[0];
        });

        it("should emit the event", () => {
          expect(transferEvent.fragment.name).to.equal("Transfer");

          const sender = transferEvent.args[0];
          const recipient = transferEvent.args[1];
          const amount = transferEvent.args[2];
          assert.equal(
            sender,
            owner.address,
            "Expected the sender address to be the first argument in Transfer"
          );
          assert.equal(
            recipient,
            a1.address,
            "Expected the recipient address to be the second argument in Transfer"
          );
          assert.equal(
            amount.toString(),
            "1",
            "Expected the transfer amount to be the third argument in Transfer"
          );
        });

        it("should decrease the owner's balance by 1", async () => {
          const balance = await token.balanceOf(owner);
          assert.equal(
            balance.toString(),
            (ethers.parseEther(totalSupply) - 1n).toString()
          );
        });

        it("should increase the recipient's balance to 1", async () => {
          const balance = await token.balanceOf(a1);
          assert.equal(balance.toString(), "1");
        });

        describe("second transfer", async () => {
          let transferEvent;
          beforeEach(async () => {
            const tx = await token.connect(owner).transfer(a1, "1");
            receipt = await tx.wait();
            filter = token.filters.Transfer;
            const events = await token.queryFilter(filter, -1);
            transferEvent = events[0];
          });

          it("should emit the event", () => {
            expect(transferEvent.fragment.name).to.equal("Transfer");

            const sender = transferEvent.args[0];
            const recipient = transferEvent.args[1];
            const amount = transferEvent.args[2];
            assert.equal(
              sender,
              owner.address,
              "Expected the sender address to be the first argument in Transfer"
            );
            assert.equal(
              recipient,
              a1.address,
              "Expected the recipient address to be the second argument in Transfer"
            );
            assert.equal(
              amount.toString(),
              "1",
              "Expected the transfer amount to be the third argument in Transfer"
            );
          });

          it("should decrease the owner's balance by 1", async () => {
            const balance = await token.balanceOf(owner);
            assert.equal(
              balance.toString(),
              (ethers.parseEther(totalSupply) - 2n).toString()
            );
          });

          it("should increase the recipient's balance by 1", async () => {
            const balance = await token.balanceOf(a1);
            assert.equal(balance.toString(), "2");
          });
        });
      });

      describe("transferring without the funds", () => {
        it("should not be allowed", async () => {
          let ex;
          try {
            await token.connect(s1).transfer(owner, "1");
          } catch (_ex) {
            ex = _ex;
          }
          assert(
            ex,
            "The account should not have any funds. Expected this transaction to revert!"
          );
        });
      });
    });

    context("balanceOf", () => {
      it("should return zero for any address other than the contract creator", async () => {
        const balance = await token.balanceOf(a1);
        assert.equal(balance.toString(), "0");
      });

      it("should return the total supply for the contract creator", async () => {
        const balance = await token.balanceOf(owner);
        assert.equal(
          balance.toString(),
          ethers.parseEther(totalSupply).toString()
        );
      });
    });

    context("totalSupply", () => {
      it("should return 10000", async () => {
        const result = await token.totalSupply();
        assert.equal(
          result.toString(),
          ethers.parseEther(totalSupply).toString()
        );
      });
    });
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
});
