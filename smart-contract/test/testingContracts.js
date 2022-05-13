const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Testing MOK Contract Deployent", function () {
  it("Testing MOK Contract Deployent", async function () {
    const accounts = await ethers.getSigners();
    const owner = accounts[0];

    const MOK = await ethers.getContractFactory("MOKToken");

    const MOKToken = await MOK.deploy(100000);

    const ownerBalance = await MOKToken.balanceOf(owner.address);
    expect(await MOKToken.totalSupply()).to.equal(ownerBalance);
  });
});


describe("Testing Lottery Contract Deployent", function () {
  it("Testing Lottery Contract Deployent", async function () {
    const MOKToken = await ethers.getContractFactory("MOKToken");
    const MOK = await MOKToken.deploy(100000);

    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy(MOK.address);
    await lottery.deployed();
    expect(await lottery.address != null);
  });
});

describe("Lottery", function () {
  let MOK;
  let lottery;
  let accounts;


  beforeEach(async function () {
    accounts = await ethers.getSigners();

    let MOKToken = await ethers.getContractFactory("MOKToken");
    MOK = await MOKToken.deploy(100000);

    let Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy(MOK.address);

    await MOK.connect(accounts[0]);
    await MOK.transfer(accounts[1].address, 100);
    await MOK.transfer(accounts[2].address, 100);
  });

  it("adding 1 Manager", async function () {
      await lottery.addManager(accounts[1].address);
      expect(await lottery.hasRole(await lottery.MANAGER(), accounts[1].address)).to.be.true;
  });

  it("adding 2 Manager", async function () {
    await lottery.addManager(accounts[1].address);
    await lottery.addManager(accounts[2].address);
    expect((await lottery.hasRole(await lottery.MANAGER(), accounts[1].address)) && (await lottery.hasRole(await lottery.MANAGER(), accounts[2].address))).to.be.true;
  });

  it("adding 3 Manager", async function () {
    await lottery.addManager(accounts[1].address);
    await lottery.addManager(accounts[2].address);
    await expect(lottery.addManager(accounts[3].address)).to.be.revertedWith("reverted with reason string 'Only 2 managers allowed'");
  });

  it("removing Managers", async function () {
    await lottery.addManager(accounts[1].address);
    await lottery.addManager(accounts[2].address);
    await lottery.removeManager(accounts[2].address);
    await lottery.removeManager(accounts[1].address);
    await expect(lottery.removeManager(accounts[3].address)).to.be.revertedWith("reverted with reason string 'User is not a manager!'");
  });

  it("Testing not owner adding a manager", async function () {
    await expect(lottery.connect(accounts[1]).addManager(accounts[2].address)).to.be.revertedWith("reverted with reason string 'Caller is not the owner'");
  });

  it("Testing not owner removing a manager", async function () {
    await lottery.addManager(accounts[2].address);
    await expect(lottery.connect(accounts[1]).removeManager(accounts[2].address)).to.be.revertedWith("reverted with reason string 'Caller is not the owner'");
  });

  it("Testing 1 person entry", async function () {
    await MOK.connect(accounts[1]).approve(lottery.address, 20);
    await lottery.connect(accounts[1]).enter();
    expect(await lottery.players(0)).to.equal(accounts[1].address);
  });

  it("Testing 2 people entry", async function () {
    await MOK.connect(accounts[1]).approve(lottery.address, 20);
    await lottery.connect(accounts[1]).enter();
    await MOK.connect(accounts[2]).approve(lottery.address, 20);
    await lottery.connect(accounts[2]).enter();

    expect(await lottery.players(0)).to.equal(accounts[1].address);
    expect(await lottery.players(1)).to.equal(accounts[2].address);
  });

  it("Testing entry with insufficient funds", async function () {
    await MOK.connect(accounts[3]).approve(lottery.address, 20);
    await expect(lottery.connect(accounts[3]).enter()).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("Testing entry with funds not approved", async function () {
    await expect(lottery.connect(accounts[1]).enter()).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("Testing 1 player to pick from", async function () {
    await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
    await lottery.connect(accounts[1]).enter();
    await lottery.pickWinner();
    expect(await lottery.winner()).to.equal(accounts[1].address);
  });

  it("Testing picking winner from two enteries", async function () {
    await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
    await lottery.connect(accounts[1]).enter();
    await MOK.connect(accounts[2]).approve(lottery.address, ethers.utils.parseEther("20"));
    await lottery.connect(accounts[2]).enter();
    await lottery.pickWinner();
    expect(await lottery.winner()).to.satisfy(function(address) { 
      return (address === accounts[1].address || address === accounts[2].address); 
    });
  });

  it("Testing on cooldown", async function () {
    await MOK.connect(accounts[1]).approve(lottery.address, 20);
    await lottery.connect(accounts[1]).enter();
    await lottery.pickWinner();
    await expect(lottery.pickWinner()).to.be.revertedWith("reverted with reason string 'Still on cooldown'");
  });

  it("Testing pick winner with no players to pick from", async function () {
    await expect(lottery.pickWinner()).to.be.revertedWith("reverted with panic code 0x12 (Division or modulo division by zero)");
  });

});