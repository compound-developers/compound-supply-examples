/**
 * Executes our contract's `supplyErc20ToCompound` function
 * 
 * ## run the localhost fork and deploy script prior to this one
 * npx hardhat run scripts/deploy.js --network localhost
 * 
 */
const Compound = require('@compound-finance/compound-js');

const providerUrl = 'http://localhost:8545';

// Your Ethereum wallet and private key
const myWalletAddress = '0xa0df350d2637096571F7A701CBc1C5fdE30dF76A';
const privateKey = 'b8c1b5c1d81f9475fdf2e334517d29f733bdfa40682207571b12fc1142cbf329';

const compound = new Compound(providerUrl, { privateKey });

// Strings of token names
const assetName = Compound.DAI;
const cTokenName = Compound.cDAI;

const underlyingAddress = Compound.util.getAddress(assetName);
const underlyingDecimals = Compound.decimals[assetName];

const cTokenAddress = Compound.util.getAddress(cTokenName);

// `myContractAddress` is logged when running the deploy script.
// Run the deploy script prior to running this one.
const myContractAddress = '0x0Bb909b7c3817F8fB7188e8fbaA2763028956E30';

const main = async function() {
  const ethersProvider = new Compound._ethers.providers.JsonRpcProvider(providerUrl);
  const contractIsDeployed = (await ethersProvider.getCode(myContractAddress)) !== '0x';

  if (!contractIsDeployed) {
    throw Error('MyContract is not deployed! Deploy it by running the deploy script.');
  }

  console.log(`Now transferring ${assetName} from my wallet to MyContract...`);

  let tx = await _erc20Transfer(
    underlyingAddress,
    myContractAddress,
    (10 * Math.pow(10, underlyingDecimals)).toString() // 10 tokens to send to MyContract
  );
  await tx.wait(1); // wait until the transaction has 1 confirmation on the blockchain

  console.log(`MyContract now has ${assetName} to supply to the Compound Protocol.`);

  // Mint some cDAI by sending DAI to the Compound Protocol
  console.log(`MyContract is now minting c${assetName}...`);
  tx = await _supplyErc20ToCompound(
    underlyingAddress,
    cTokenAddress,
    (10 * Math.pow(10, underlyingDecimals)).toString() // 10 tokens to supply
  );
  let supplyResult = await tx.wait(1);

  console.log(`Supplied ${assetName} to Compound via MyContract`);
  // Uncomment this to see the solidity logs
  // console.log(supplyResult.events);

  let balanceOfUnderlying = await _balanceOfUnderlying(cTokenName, myContractAddress)
  balanceOfUnderlying /= Math.pow(10, underlyingDecimals);
  console.log(`${assetName} supplied to the Compound Protocol:`, balanceOfUnderlying);

  let cTokenBalance = await _balanceOf(cTokenName, myContractAddress);
  console.log(`MyContract's c${assetName} Token Balance:`, +cTokenBalance);

  // Call redeem based on a cToken amount
  const amount = cTokenBalance * 1e8;
  const redeemType = true; // true for `redeem`

  // Call redeemUnderlying based on an underlying amount
  // const amount = balanceOfUnderlying;
  // const redeemType = false; //false for `redeemUnderlying`

  // Retrieve your asset by exchanging cTokens
  console.log(`Redeeming the c${assetName} for ${assetName}...`);
  tx = await _redeemCErc20Tokens(
    amount,
    redeemType,
    cTokenAddress
  );
  let redeemResult = await tx.wait(1);

  cTokenBalance = await _balanceOf(cTokenName, myContractAddress);
  console.log(`MyContract's c${assetName} Token Balance:`, cTokenBalance);
}

main().catch((err) => {
  console.error(err);
});

async function _erc20Transfer(erc20Address, to, amount) {
  let tx;
  try {
    tx = await Compound.eth.trx(
      erc20Address,
      'function transfer(address, uint256) public returns (bool)',
      [ to, amount ],
      {
        provider: providerUrl,
        privateKey // this is the address that sends their tokens
      }
    );
  } catch(error) {
    console.error(error);
  }

  return tx;
}

async function _supplyErc20ToCompound(underlying, cToken, amount) {
  let tx;
  try {
    tx = await Compound.eth.trx(
      myContractAddress,
      'function supplyErc20ToCompound(address, address, uint256) public returns (uint)',
      [ underlying, cToken, amount ],
      {
        provider: providerUrl,
        privateKey // this is the address that sends their tokens
      }
    );
  } catch(error) {
    console.error(error);
  }

  return tx;
}

async function _redeemCErc20Tokens(amount, redeemType, cTokenAddress) {
  let tx;
  try {
    tx = await Compound.eth.trx(
      myContractAddress,
      'function redeemCErc20Tokens(uint256, bool, address) public returns (bool)',
      [ amount, redeemType, cTokenAddress ],
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