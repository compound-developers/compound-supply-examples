// First run Ganache locally with `cMKR` address unlocked
/*

ganache-cli \
  -f https://mainnet.infura.io/v3/$infuraApiKey \
  -m "clutch captain shoe salt awake harvest setup primary inmate ugly among become" \
  -i 1 \
  -u 0x95b4eF2869eBD94BEb4eEE400a99824BF5DC325b

*/

const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');

const erc20 = require('./abis/erc20-abi.json');

const name = 'MKR';
const ud = 18; // Underlying decimals of MKR

// addresses can be found here https://github.com/compound-finance/compound-config/blob/master/networks/mainnet.json
const underlyingMainnetAddress = '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2';
const cTokenMainnetAddress = '0x95b4eF2869eBD94BEb4eEE400a99824BF5DC325b';

const underlyingContract = new web3.eth.Contract(erc20, underlyingMainnetAddress);
const cTokenContract = new web3.eth.Contract(erc20, cTokenMainnetAddress);

let accounts;

web3.eth.getAccounts().then((ganacheAccounts) => {
  accounts = ganacheAccounts;

  // 1 token
  const numbTokensToMint = (1 * Math.pow(10, ud)).toString();

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
