//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Pool.sol";
import "./Factory.sol";

contract Router {
    address public factoryAddress;
    address public ETHAddress = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    constructor(address _factoryAddress) {
        factoryAddress = _factoryAddress;
    }
    
    receive() payable external {}

    function swap(
        address tokenA,
        address tokenB,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) public payable returns (uint256 amountOut) {
        Pool pool;

        // 交易输入是 ETH
        if (tokenA == ETHAddress) {
            require(msg.value >= amountIn, "insufficient input amount");
            pool = Pool(getPool(tokenB));

            amountOut = pool.swap{value: msg.value}(
                amountIn,
                minAmountOut,
                true,
                recipient
            );
        } else {
            // 交易输入不是 ETH
            pool = Pool(getPool(tokenA));
            ERC20(tokenA).transferFrom(msg.sender, address(this), amountIn);

            // 查询 TokenA Router 合约对 poolA 的授权数量，如果需要，调用approve授权
            if (
                ERC20(tokenA).allowance(address(this), address(pool)) < amountIn
            ) {
                ERC20(tokenA).approve(address(pool), type(uint256).max);
            }

            // 交易输出是 ETH，只需要使用一个pool
            if (tokenB == ETHAddress) {
                amountOut = pool.swap(amountIn, minAmountOut, false, recipient);
            } else {
                // 交易输出不是 ETH，需要使用两个pool

                // 第一次交易 TokenA -> ETH
                amountOut = pool.swap(
                    amountIn,
                    pool.getEthAmount(amountIn),
                    false,
                    address(this)
                );
                // 第二次交易 ETH -> TokenB
                pool = Pool(getPool(tokenB));
                amountOut = pool.swap{value: amountOut}(
                    amountOut,
                    minAmountOut,
                    true,
                    recipient
                );
            }
        }
    }

    function getAmountOut(
        address tokenA,
        address tokenB,
        uint256 amountIn
    ) public view returns (uint256 amountOut) {
        Pool pool;

        // 交易输入是 ETH
        if (tokenA == ETHAddress) {
            pool = Pool(getPool(tokenB));
            amountOut = pool.getTokenAmount(amountIn);
        } else {
            // 交易输入不是 ETH
            pool = Pool(getPool(tokenA));
            // 交易输出是 ETH，只需要使用一个pool
            amountOut = pool.getEthAmount(amountIn);

            if (tokenB != ETHAddress) {
                // 交易输出不是 ETH，需要使用两个pool
                // 第二次交易 ETH -> TokenB
                pool = Pool(getPool(tokenB));
                amountOut = pool.getTokenAmount(amountOut);
            }
        }
    }

    function getPool(address _tokenAddress) public view returns (address) {
        return Factory(factoryAddress).getPool(_tokenAddress);
    }

}
