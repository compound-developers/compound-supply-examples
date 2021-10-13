const Compound = require('@compound-finance/compound-js');

const ethDecimals = Compound.decimals[Compound.ETH];
const providerUrl = 'http://localhost:8545';

// Your Ethereum wallet and private key
const myWalletAddress = '0xa0df350d2637096571F7A701CBc1C5fdE30dF76A';
const privateKey = 'b8c1b5c1d81f9475fdf2e334517d29f733bdfa40682207571b12fc1142cbf329';

const compound = new Compound(providerUrl, { privateKey });

const main = async function() {
  let ethBalance = await Compound.eth.getBalance(myWalletAddress, providerUrl);
  console.log("My wallet's ETH balance:", +ethBalance / Math.pow(10, ethDecimals), '\n');

  console.log('Supplying ETH to the Compound Protocol...', '\n');
  // Mint some cETH by supplying ETH to the Compound Protocol
  let tx = await compound.supply(Compound.ETH, 1);
  await tx.wait(1); // wait until the transaction has 1 confirmation on the blockchain

  console.log('cETH "Mint" operation successful.', '\n');

  const bal = await _balanceOfUnderlying(Compound.cETH, myWalletAddress);
  const balanceOfUnderlying = +bal / 1e18;

  console.log("ETH supplied to the Compound Protocol:", balanceOfUnderlying, '\n');

  let cTokenBalance = await _balanceOf(Compound.cETH, myWalletAddress);

  console.log("My wallet's cETH Token Balance:", cTokenBalance, '\n');

  let exchangeRateCurrent = await _exchangeRateCurrent(Compound.cETH);
  exchangeRateCurrent = exchangeRateCurrent / Math.pow(10, 18 + ethDecimals - 8);
  console.log("Current exchange rate from cETH to ETH:", exchangeRateCurrent, '\n');

  console.log('Redeeming the cETH for ETH...', '\n');

  console.log('Exchanging all cETH based on cToken amount...', '\n');
  tx = await compound.redeem(Compound.cETH, cTokenBalance);
  await tx.wait(1); // wait until the transaction has 1 confirmation on the blockchain

  // console.log('Exchanging all cETH based on underlying ETH amount...', '\n');
  // let ethAmount = (balanceOfUnderlying * Math.pow(10, ethDecimals)).toString()
  // tx = await compound.redeem(Compound.ETH, ethAmount);
  // await tx.wait(1); // wait until the transaction has 1 confirmation on the blockchain

  cTokenBalance = await _balanceOf(Compound.cETH, myWalletAddress);
  console.log("My wallet's cETH Token Balance:", cTokenBalance);

  ethBalance = await Compound.eth.getBalance(myWalletAddress, providerUrl);
  console.log("My wallet's ETH balance:", +ethBalance / Math.pow(10, ethDecimals), '\n');
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
