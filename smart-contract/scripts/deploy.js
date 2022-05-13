const { ethers } = require("hardhat");
async function main () {
    console.log('Deploying...');
    const MOKToken = await ethers.getContractFactory('MOKToken');
    const mok = await MOKToken.deploy(100000);
    await mok.deployed();

    const Lottery = await ethers.getContractFactory('Lottery');
    const lottery = await Lottery.deploy(mok.address);
    await lottery.deployed();
    console.log('MOK deployed to:', mok.address);
    console.log('Lottery deployed to:', lottery.address);
    console.log('Deployment Done!! :) ');
}
  
main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});