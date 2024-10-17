const { ethers } = require("hardhat");

const ETHAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

const getGasFeeFromTx = async (txHash) => {
  const txReceipt = await ethers.provider.getTransactionReceipt(txHash);
  let gasFee = 0n;
  if (txReceipt) {
    gasFee = txReceipt.gasUsed * txReceipt.gasPrice;
  }
  return gasFee;
};

const toWei = (value) => ethers.parseEther(value.toString());

const fromWei = (value) =>
  Number(
    ethers.formatEther(typeof value === "string" ? value : value.toString())
  );

const getBalance = async (value) => await ethers.provider.getBalance(value);

const getAmountExpect = (inputAmount, inputReserve, outputReserve) => {
  const inputAmountWithFee = toWei(inputAmount * 99);
  return (
    Number(
      (inputAmountWithFee * toWei(outputReserve)) /
        (toWei(inputReserve * 100) + inputAmountWithFee)
    ) /
    10 ** 18
  );
};

module.exports = {
  ETHAddress,
  toWei,
  fromWei,
  getBalance,
  getGasFeeFromTx,
  getAmountExpect,
};
