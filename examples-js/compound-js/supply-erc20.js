const Compound = require('@compound-finance/compound-js');

const providerUrl = 'http://localhost:8545';

// Your Ethereum wallet and private key
const myWalletAddress = '0xa0df350d2637096571F7A701CBc1C5fdE30dF76A';
const privateKey = 'b8c1b5c1d81f9475fdf2e334517d29f733bdfa40682207571b12fc1142cbf329';

const compound = new Compound(providerUrl, { privateKey });

// Strings of token names
const assetName = Compound.DAI;
const cTokenName = Compound.cDAI;

// Number of decimals defined in this ERC20 token's contract
const underlyingDecimals = Compound.decimals[assetName];

const main = async function() {
  // See how many underlying ERC-20 tokens are in my wallet before we supply
  const tokenBalance = await _balanceOf(assetName, myWalletAddress);
  console.log(`My wallet's ${assetName} Token Balance:`, tokenBalance);

  // 10 tokens
  const underlyingTokensToSupply = 10;

  console.log(`Approving and then supplying ${assetName} to the Compound Protocol...`, '\n');

  // Mint cTokens by supplying underlying tokens to the Compound Protocol
  tx = await compound.supply(assetName, underlyingTokensToSupply.toString());
  await tx.wait(1); // wait until the transaction has 1 confirmation on the blockchain

  console.log(`c${assetName} "Mint" operation successful.`, '\n');

  const bal = await _balanceOfUnderlying(cTokenName, myWalletAddress);
  const balanceOfUnderlying = +bal / Math.pow(10, underlyingDecimals);

  console.log(`${assetName} supplied to the Compound Protocol:`, balanceOfUnderlying, '\n');

  let cTokenBalance = await _balanceOf(cTokenName, myWalletAddress);
  console.log(`My wallet's c${assetName} Token Balance:`, cTokenBalance);

  let underlyingBalance = await _balanceOf(assetName, myWalletAddress);
  console.log(`My wallet's ${assetName} Token Balance:`, underlyingBalance, '\n');

  let erCurrent = await _exchangeRateCurrent(cTokenName);
  let exchangeRate = +erCurrent / Math.pow(10, 18 + underlyingDecimals - 8);
  console.log(`Current exchange rate from c${assetName} to ${assetName}:`, exchangeRate, '\n');

  console.log(`Redeeming the c${assetName} for ${assetName}...`);

  // redeem (based on cTokens)
  console.log(`Exchanging all c${assetName} based on cToken amount...`, '\n');
  tx = await compound.redeem(cTokenName, cTokenBalance);
  await tx.wait(1); // wait until the transaction has 1 confirmation on the blockchain

  // redeem (based on underlying)
  // console.log(`Exchanging all c${assetName} based on underlying ${assetName} amount...`);
  // let underlyingAmount = balanceOfUnderlying * Math.pow(10, underlyingDecimals);
  // tx = await compound.redeem(assetName, underlyingAmount);
  // await tx.wait(1); // wait until the transaction has 1 confirmation on the blockchain

  cTokenBalance = await _balanceOf(cTokenName, myWalletAddress);
  console.log(`My wallet's c${assetName} Token Balance:`, cTokenBalance);

  underlyingBalance = await _balanceOf(assetName, myWalletAddress);
  console.log(`My wallet's ${assetName} Token Balance:`, underlyingBalance, '\n');
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