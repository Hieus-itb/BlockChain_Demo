// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ShippingInsurance {
    enum Status { ACTIVE, CLAIMED, PAID, EXPIRED }
    struct Policy {
        address payable insured;
        uint256 premium;
        uint256 payoutAmount;
        uint256 expiry;
        Status status;
    }

    uint256 public nextPolicyId;
    mapping(uint256 => Policy) public policies;
    address public owner;
    address public oracle;

    event PolicyCreated(uint256 indexed policyId, address indexed insured, uint256 payoutAmount);
    event DamageReported(uint256 indexed policyId, string evidence);
    event PayoutExecuted(uint256 indexed policyId, address to, uint256 amount);
    event OracleUpdated(address newOracle);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "not oracle");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    // Create a policy by sending premium value with the call.
    // For demo purposes payoutAmount is set to premium * 10 (adjust logic as needed).
    function createPolicy(address payable _insured, uint256 _expiry) external payable returns (uint256) {
        require(msg.value > 0, "premium required");
        uint256 payout = msg.value * 10;
        uint256 id = nextPolicyId++;
        policies[id] = Policy({insured: _insured, premium: msg.value, payoutAmount: payout, expiry: _expiry, status: Status.ACTIVE});
        emit PolicyCreated(id, _insured, payout);
        return id;
    }

    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
        emit OracleUpdated(_oracle);
    }

    // Oracle reports damage and triggers immediate payout if conditions met.
    function reportDamage(uint256 policyId, string calldata evidence) external onlyOracle {
        Policy storage p = policies[policyId];
        require(p.status == Status.ACTIVE, "not active");
        require(block.timestamp <= p.expiry, "policy expired");
        require(address(this).balance >= p.payoutAmount, "insufficient funds");

        // Mark before transfer to prevent reentrancy issues
        p.status = Status.PAID;

        (bool ok, ) = p.insured.call{value: p.payoutAmount}("");
        require(ok, "transfer failed");

        emit DamageReported(policyId, evidence);
        emit PayoutExecuted(policyId, p.insured, p.payoutAmount);
    }

    // Owner can withdraw leftover funds
    function withdraw(uint256 amount, address payable to) external onlyOwner {
        require(address(this).balance >= amount, "insuff funds");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "withdraw failed");
    }
}
