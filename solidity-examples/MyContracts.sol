pragma solidity ^0.5.12;

contract Erc20 {
  function approve(address, uint) external returns (bool);
  function transfer(address, uint) external returns (bool);
}

contract CErc20 {
  function mint(uint) external returns (uint);
}

contract CEth {
  function mint() external payable;
}

contract MyContract {
  function supplyEthToCompound(address payable _cEtherContract)
  public payable returns (bool)
  {
    CEth(_cEtherContract).mint.value(msg.value).gas(250000)();
    return true;
  }

  function supplyErc20ToCompound(
    address _erc20Contract,
    address _cErc20Contract,
    uint256 _numTokensToSupply
  ) public returns (uint) {
    // Create a reference to the underlying asset contract, like DAI.
    Erc20 underlying = Erc20(_erc20Contract);

    // Create a reference to the corresponding cToken contract, like cDAI
    CErc20 cToken = CErc20(_cErc20Contract);

    // Approve transfer on the ERC20 contract
    underlying.approve(_cErc20Contract, _numTokensToSupply);

    // Mint cTokens and assert there is no error
    uint mintResult = cToken.mint(_numTokensToSupply);
    return mintResult;
  }
}
