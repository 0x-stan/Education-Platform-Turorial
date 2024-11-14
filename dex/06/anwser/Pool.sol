// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Pool is ERC20 {
    // `tokenAddress` ERC20 token 的地址
    address public tokenAddress;
    // `Factory` 的地址
    address public factoryAddress;

    // constructor
    constructor(address _token) ERC20("LP token", "LPT") {
        require(_token != address(0), "invalid token address");

        tokenAddress = _token;
        factoryAddress = msg.sender;
    }

    // `addLiquidity`
    function addLiquidity(
        uint256 _tokenAmount
    ) public payable returns (uint256 liquidity) {
        // 当合约没有 Token 时，认为是初始添加流动性
        if (getTokenReserve() == 0) {
            ERC20 token = ERC20(tokenAddress);
            token.transferFrom(msg.sender, address(this), _tokenAmount);

            liquidity = Math.sqrt(
                address(this).balance * token.balanceOf(address(this))
            );
            _mint(msg.sender, liquidity); //  ERC20._mint() 向流动性提供者发送 LP token

            return liquidity;
        } else {
            uint256 ethReserve = address(this).balance - msg.value;
            uint256 tokenReserve = getTokenReserve();
            uint256 tokenAmount = (msg.value * tokenReserve) / ethReserve;

            require(_tokenAmount >= tokenAmount, "insufficient token amount");

            ERC20 token = ERC20(tokenAddress);
            token.transferFrom(msg.sender, address(this), tokenAmount);

            // 根据注入的eth流动性 与 合约eth储备量 的比值分发 LP token
            liquidity = (msg.value * totalSupply()) / ethReserve;
            _mint(msg.sender, liquidity); //  ERC20._mint() 向流动性提供者发送 LP token

            return liquidity;
        }
    }

    // `removeLiquidity`
    function removeLiquidity(
        uint256 _amount
    ) public returns (uint256, uint256) {
        require(_amount > 0, "invalid amount");

        uint256 ethAmount = (address(this).balance * _amount) / totalSupply();
        uint256 tokenAmount = (getTokenReserve() * _amount) / totalSupply();

        // ERC20._burn() 销毁LP
        _burn(msg.sender, _amount);
        // 向用户返回 eth 和 token
        payable(msg.sender).transfer(ethAmount);
        ERC20(tokenAddress).transfer(msg.sender, tokenAmount);

        return (ethAmount, tokenAmount);
    }

    function getETHReserve() public view returns (uint256) {
        return address(this).balance;
    }

    function getTokenReserve() public view returns (uint256) {
        return ERC20(tokenAddress).balanceOf(address(this));
    }

    // This is a low-level function, so let it be private.
    // 基础公式 outputAmount = (inputAmount * outputReserve) / (inputReserve + inputAmount)
    function getAmount(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) private pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");

        // 收取1%的手续费
        // solidity 不支持浮点运算，所以分子和分母同时 × 100
        uint256 inputAmountWithFee = inputAmount * 99;
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = (inputReserve * 100) + inputAmountWithFee;

        return numerator / denominator;
    }

    function getTokenAmount(uint256 _ethSold) public view returns (uint256) {
        require(_ethSold > 0, "ethSold is too small");

        uint256 tokenReserve = getTokenReserve();

        return getAmount(_ethSold, address(this).balance, tokenReserve);
    }

    function getEthAmount(uint256 _tokenSold) public view returns (uint256) {
        require(_tokenSold > 0, "tokenSold is too small");

        uint256 tokenReserve = getTokenReserve();

        return getAmount(_tokenSold, tokenReserve, address(this).balance);
    }

    function swap(
        uint256 amountIn,
        uint256 minAmountOut,
        bool ETHForToken,
        address recipient
    ) public payable returns (uint256 amountOut) {
        uint256 x;
        uint256 y;
        // ETH in Token out
        if (ETHForToken) {
            x = address(this).balance - msg.value;
            y = getTokenReserve();
            amountOut = getAmount(msg.value, x, y);
            require(amountOut >= minAmountOut, "insufficient output amount");
            ERC20(tokenAddress).transfer(recipient, amountOut);
        } else {
            // Token in ETH out
            x = address(this).balance;
            y = getTokenReserve();
            amountOut = getAmount(amountIn, y, x);
            require(amountOut >= minAmountOut, "insufficient output amount");
            ERC20(tokenAddress).transferFrom(
                msg.sender,
                address(this),
                amountIn
            );
            payable(recipient).transfer(amountOut);
        }
    }
}

// a library for performing various math operations
library Math {
    // babylonian method (https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Babylonian_method)
    function sqrt(uint y) internal pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
