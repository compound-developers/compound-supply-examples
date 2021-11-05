/**
 * Executes our contract's `supplyEthToCompound` function
 * 
 * ## run the localhost fork and deploy script prior to this one
 * npx hardhat run scripts/deploy.js --network localhost
 * 
 */
const Compound = require('@compound-finance/compound-js');

const ethDecimals = Compound.decimals[Compound.ETH];
const providerUrl = 'http://localhost:8545';

// Your Ethereum wallet and private key
const myWalletAddress = '0xa0df350d2637096571F7A701CBc1C5fdE30dF76A';
const privateKey = 'b8c1b5c1d81f9475fdf2e334517d29f733bdfa40682207571b12fc1142cbf329';

// `myContractAddress` is logged when running the deploy script.
// Run the deploy script prior to running this one.
const myContractAddress = '0x0Bb909b7c3817F8fB7188e8fbaA2763028956E30';

// Mainnet contract address for cETH, which can be found in the mainnet
// tab on this page: https://compound.finance/developers
const compoundCEthContractAddress = '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5';

const main = async function() {
  const ethersProvider = new Compound._ethers.providers.JsonRpcProvider(providerUrl);
  const contractIsDeployed = (await ethersProvider.getCode(myContractAddress)) !== '0x';

  if (!contractIsDeployed) {
    throw Error('MyContract is not deployed! Deploy it by running the deploy script.');
  }

  // Mint some cETH by sending ETH to the Compound Protocol
  let tx = await _supplyEthToCompound(Compound._ethers.utils.parseUnits('1', 'ether'));
  let supplyResult = await tx.wait(1);

  console.log('Supplied ETH to Compound via MyContract');
  // Uncomment this to see the solidity logs
  // console.log(supplyResult.events);

  const balanceOfUnderlying = await _balanceOfUnderlying(Compound.cETH, myContractAddress);

  console.log("ETH supplied to the Compound Protocol:", +balanceOfUnderlying / 1e18);

  let cTokenBalance = await _balanceOf(Compound.cETH, myContractAddress);
  console.log("MyContract's cETH Token Balance:", cTokenBalance);

  // Call redeem based on a cToken amount
  const amount = cTokenBalance * 1e8;
  const redeemType = true; // true for `redeem`

  // Call redeemUnderlying based on an underlying amount
  // const amount = balanceOfUnderlying;
  // const redeemType = false; //false for `redeemUnderlying`

  // Retrieve your asset by exchanging cTokens
  console.log('Redeeming the cETH for ETH...');
  tx = await _redeemCEth(amount, redeemType);
  let redeemResult = await tx.wait(1);

  cTokenBalance = await _balanceOf(Compound.cETH, myContractAddress);
  cTokenBalance = +cTokenBalance / 1e8;
  console.log("MyContract's cETH Token Balance:", cTokenBalance);

  ethBalance = await Compound.eth.getBalance(myContractAddress, providerUrl);
  ethBalance = ethBalance / 1e18;
  console.log("MyContract's ETH Balance:", ethBalance);
}

main().catch((err) => {
  console.error(err);
});

async function _balanceOfUnderlying(cToken, account) {
  const cTokenAddress = Compound.util.getAddress(cToken);
  let balance;
  try {
    balance = await Compound.eth.read(
      cTokenAddress,
      'function balanceOfUnderlying(address) returns (uint)',
      [ account ],
      { provider: providerUrl }
    );
  } catch(error) {
    console.error(error);
  }

  return balance;
}

async function _balanceOf(asset, account) {
  const assetAddress = Compound.util.getAddress(Compound[asset]);
  let balance;
  try {
    balance = await Compound.eth.read(
      assetAddress,
      'function balanceOf(address) returns (uint)',
      [ account ],
      { provider: providerUrl }
    );
  } catch(error) {
    console.error(error);
  }

  return +balance / Math.pow(10, Compound.decimals[asset]);
}

async function _exchangeRateCurrent(cToken) {
  const cTokenAddress = Compound.util.getAddress(Compound[cToken]);
  let exchangeRate;
  try {
    exchangeRate = await Compound.eth.read(
      cTokenAddress,
      'function exchangeRateCurrent() returns (uint)',
      [],
      { provider: providerUrl }
    );
  } catch(error) {
    console.error(error);
  }

  return exchangeRate;
}

async function _supplyEthToCompound(amount) {
  let tx;
  try {
    tx = await Compound.eth.trx(
      myContractAddress,
      'function supplyEthToCompound(address) public payable returns (bool)',
      [ compoundCEthContractAddress ],
      {
        provider: providerUrl,
        privateKey,
        value: amount
      }
    );
  } catch(error) {
    console.error(error);
  }

  return tx;
}

async function _redeemCEth(amount, redeemType) {
  let tx;
  try {
    tx = await Compound.eth.trx(
      myContractAddress,
      'function redeemCEth(uint256, bool, address) public returns (bool)',
      [ amount, redeemType, compoundCEthContractAddress ],
      {
        provider: providerUrl,
        privateKey
      }
    );
  } catch(error) {
    console.error(error);
  }

  return tx;
}