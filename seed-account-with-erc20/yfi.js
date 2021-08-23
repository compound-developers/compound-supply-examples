// First run Ganache locally with `cYFI` address unlocked
/*

ganache-cli \
  -f https://mainnet.infura.io/v3/$infuraApiKey \
  -m "clutch captain shoe salt awake harvest setup primary inmate ugly among become" \
  -i 1 \
  -u 0x80a2ae356fc9ef4305676f7a3e2ed04e12c33946

*/

const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');

const erc20 = require('./abis/erc20-abi.json');

const name = 'YFI';
const ud = 18; // Underlying decimals of YFI

// addresses can be found here https://github.com/compound-finance/compound-config/blob/master/networks/mainnet.json
const underlyingMainnetAddress = '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e';
const cTokenMainnetAddress = '0x80a2ae356fc9ef4305676f7a3e2ed04e12c33946';

const underlyingContract = new web3.eth.Contract(erc20, underlyingMainnetAddress);
const cTokenContract = new web3.eth.Contract(erc20, cTokenMainnetAddress);

let accounts;

web3.eth.getAccounts().then((ganacheAccounts) => {
  accounts = ganacheAccounts;

  // 0.02 tokens
  const numbTokensToMint = (0.02 * Math.pow(10, ud)).toString();

  return underlyingContract.methods.transfer(accounts[0], numbTokensToMint).send({ 
    from: cTokenMainnetAddress,
    gasPrice: web3.utils.toHex(0),
    gas: 3000000
  });

}).then((result) => {
  console.log('Local test account successfully seeded with ' + name);
  return underlyingContract.methods.balanceOf(accounts[0]).call();
}).then((balanceOf) => {
  const tokens = +balanceOf / Math.pow(10, ud);
  console.log(name + ' amount in first Ganache account wallet:', tokens);
}).catch((err) => {
  console.error(err);
});
