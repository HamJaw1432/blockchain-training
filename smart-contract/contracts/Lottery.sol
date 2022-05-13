// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Lottery is AccessControl{

    IERC20 public ERC20Token;

    address public owner;
    bytes32 public constant MANAGER = keccak256("MANAGER_ROLE");
    uint public managers;

    address[] public players;

    uint public pool;
    uint public fees;

    uint public ticket_cost;
    uint public last_drawn;
    address public winner;

    constructor(address tokenAddress) {
        owner = msg.sender;
        pool = 0;
        fees = 0;
        ERC20Token = IERC20(tokenAddress);
        ticket_cost = 20;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier admin() {
        require(msg.sender == owner || hasRole(MANAGER, msg.sender), "You do not have access to this");
        _;  
    }

    modifier isOwner(){
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier timeCooldown(){
        require((block.timestamp > (last_drawn + 100)), "Still on cooldown");
        _;
    }

    function getMOK() public view returns(uint){
        return ERC20Token.balanceOf(msg.sender);
    }

    function pickWinner() public timeCooldown admin{
        uint index = random() % players.length;
        ERC20Token.approve(address(this), pool);
        ERC20Token.transferFrom(address(this), players[index], pool);
        winner = players[index];
        pool = 0;
        players = new address[](0);
        last_drawn = block.timestamp;
    }

    function withdraw() public isOwner {
        ERC20Token.approve(address(this), fees);
        ERC20Token.transferFrom(address(this), owner, fees);
        fees = 0;
    }

    function updateTicketCost(uint newTicketCost) public isOwner {
        ticket_cost = newTicketCost;
    }

    function random() private view returns(uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
    }

    function enter() public{
        ERC20Token.transferFrom(msg.sender, address(this), ticket_cost);
        uint poolShare = (95 * ticket_cost) / 100;
        pool = pool + poolShare;
        fees = fees + (ticket_cost - poolShare);
        players.push(msg.sender);
    }

    function addManager(address managerAddress) public isOwner {
        require(managers < 2, "Only 2 managers allowed");
        require(!hasRole(MANAGER, managerAddress), "User is already manager!");
        grantRole(MANAGER, managerAddress);
        managers++;
    }

    function removeManager(address managerAddress) public isOwner {
        require(hasRole(MANAGER, managerAddress), "User is not a manager!");
        revokeRole(MANAGER, managerAddress);
        managers--;
    }

}