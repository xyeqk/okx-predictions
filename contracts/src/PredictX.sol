// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PredictX {
    enum MarketType { SPORTS, CRYPTO, POLITICAL, ENTERTAINMENT, OTHER }
    enum MarketStatus { OPEN, CLOSED, RESOLVED, VOIDED }
    enum Outcome { NONE, YES, NO }

    struct Market {
        uint256 id;
        address creator;
        MarketType marketType;
        string question;
        string metadata;
        uint256 deadline;
        uint256 resolutionTime;
        MarketStatus status;
        Outcome outcome;
        uint256 yesPool;
        uint256 noPool;
        uint256 creatorFeeBps;
        bool feesPaid;
    }

    struct Agent {
        uint256 id;
        address wallet;
        string name;
        string strategyType;
        uint256 totalPredictions;
        uint256 correctPredictions;
        uint256 subscriberCount;
        uint256 totalFunds;
    }

    address public owner;
    address public resolver;
    uint256 public platformFeeBps = 200;
    uint256 public marketCount;
    uint256 public agentCount;
    bool private _locked;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => mapping(Outcome => uint256))) public bets;
    mapping(uint256 => mapping(address => bool)) public claimed;

    mapping(uint256 => Agent) public agents;
    mapping(uint256 => mapping(uint256 => Outcome)) public agentPredictions;
    mapping(uint256 => mapping(uint256 => bool)) public agentAccuracyUpdated; // agentId => marketId => done
    mapping(address => uint256[]) public userAgentSubscriptions;
    mapping(uint256 => mapping(address => bool)) public isSubscribed;

    mapping(uint256 => mapping(address => uint256)) public agentFunds;
    mapping(uint256 => address) public agentWallet;

    event MarketCreated(uint256 indexed id, address creator, MarketType marketType, string question, uint256 deadline, uint256 resolutionTime);
    event BetPlaced(uint256 indexed marketId, address indexed bettor, Outcome side, uint256 amount);
    event MarketResolved(uint256 indexed id, Outcome outcome);
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event AgentRegistered(uint256 indexed id, address wallet, string name, string strategyType);
    event AgentPredictionRecorded(uint256 indexed agentId, uint256 indexed marketId, Outcome prediction);
    event AgentSubscribed(uint256 indexed agentId, address indexed subscriber);
    event AgentUnsubscribed(uint256 indexed agentId, address indexed subscriber);
    event FundsDeposited(uint256 indexed agentId, address indexed user, uint256 amount);
    event FundsWithdrawn(uint256 indexed agentId, address indexed user, uint256 amount);
    event AgentTrade(uint256 indexed agentId, uint256 indexed marketId, Outcome side, uint256 amount);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
    modifier onlyResolver() { require(msg.sender == resolver || msg.sender == owner, "Not resolver"); _; }
    modifier noReentrant() { require(!_locked, "Reentrant"); _locked = true; _; _locked = false; }

    // Owner = project's Agentic Wallet (onchain identity).
    // Resolver = operational keeper key that executes cron-based market resolution.
    // If _agenticOwner is zero, deployer becomes owner (for local testing).
    constructor(address _agenticOwner) {
        owner = _agenticOwner == address(0) ? msg.sender : _agenticOwner;
        resolver = msg.sender;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Zero owner");
        owner = _newOwner;
    }

    function setResolver(address _resolver) external onlyOwner { resolver = _resolver; }

    // ─── Markets ───

    function createMarket(
        MarketType _type, string calldata _question, string calldata _metadata,
        uint256 _deadline, uint256 _resolutionTime, uint256 _creatorFeeBps
    ) external returns (uint256) {
        require(_deadline > block.timestamp, "Deadline in past");
        require(_resolutionTime >= _deadline, "Resolution before deadline");
        require(_creatorFeeBps <= 200, "Creator fee too high");
        marketCount++;
        markets[marketCount] = Market(
            marketCount, msg.sender, _type, _question, _metadata,
            _deadline, _resolutionTime, MarketStatus.OPEN, Outcome.NONE,
            0, 0, _creatorFeeBps, false
        );
        emit MarketCreated(marketCount, msg.sender, _type, _question, _deadline, _resolutionTime);
        return marketCount;
    }

    function placeBet(uint256 _marketId, Outcome _side) external payable {
        Market storage m = markets[_marketId];
        require(m.id != 0, "Market not found");
        require(m.status == MarketStatus.OPEN, "Market not open");
        require(block.timestamp < m.deadline, "Betting closed");
        require(_side == Outcome.YES || _side == Outcome.NO, "Invalid side");
        require(msg.value > 0, "Must send value");
        bets[_marketId][msg.sender][_side] += msg.value;
        if (_side == Outcome.YES) m.yesPool += msg.value; else m.noPool += msg.value;
        emit BetPlaced(_marketId, msg.sender, _side, msg.value);
    }

    function resolveMarket(uint256 _marketId, Outcome _outcome) external onlyResolver {
        Market storage m = markets[_marketId];
        require(m.id != 0, "Market not found");
        require(m.status == MarketStatus.OPEN, "Already resolved");
        require(_outcome == Outcome.YES || _outcome == Outcome.NO, "Invalid outcome");
        require(block.timestamp >= m.resolutionTime, "Too early to resolve");
        m.status = MarketStatus.RESOLVED;
        m.outcome = _outcome;
        emit MarketResolved(_marketId, _outcome);
    }

    // Early resolve for emergency (owner only, bypasses time check)
    function forceResolve(uint256 _marketId, Outcome _outcome) external onlyOwner {
        Market storage m = markets[_marketId];
        require(m.id != 0 && m.status == MarketStatus.OPEN);
        require(_outcome == Outcome.YES || _outcome == Outcome.NO);
        m.status = MarketStatus.RESOLVED;
        m.outcome = _outcome;
        emit MarketResolved(_marketId, _outcome);
    }

    // Void market — when resolution is impossible. Everyone gets refunded.
    event MarketVoided(uint256 indexed id);

    function voidMarket(uint256 _marketId) external onlyOwner {
        Market storage m = markets[_marketId];
        require(m.id != 0, "Market not found");
        require(m.status == MarketStatus.OPEN || m.status == MarketStatus.CLOSED, "Cannot void");
        m.status = MarketStatus.VOIDED;
        emit MarketVoided(_marketId);
    }

    // Claim refund from a voided market — returns exact bet amount
    function claimRefund(uint256 _marketId) external noReentrant {
        Market storage m = markets[_marketId];
        require(m.status == MarketStatus.VOIDED, "Not voided");
        require(!claimed[_marketId][msg.sender], "Already claimed");

        uint256 yesBet = bets[_marketId][msg.sender][Outcome.YES];
        uint256 noBet = bets[_marketId][msg.sender][Outcome.NO];
        uint256 total = yesBet + noBet;
        require(total > 0, "No bets to refund");

        claimed[_marketId][msg.sender] = true;
        (bool ok,) = msg.sender.call{value: total}("");
        require(ok, "Refund failed");
    }

    // FIX: Reentrancy guard + fees paid only once
    function claimWinnings(uint256 _marketId) external noReentrant {
        Market storage m = markets[_marketId];
        require(m.status == MarketStatus.RESOLVED, "Not resolved");
        require(!claimed[_marketId][msg.sender], "Already claimed");

        uint256 userBet = bets[_marketId][msg.sender][m.outcome];
        require(userBet > 0, "No winning bet");
        claimed[_marketId][msg.sender] = true;

        uint256 winningPool = m.outcome == Outcome.YES ? m.yesPool : m.noPool;
        uint256 losingPool = m.outcome == Outcome.YES ? m.noPool : m.yesPool;

        // Pay fees only once per market
        if (!m.feesPaid && losingPool > 0) {
            m.feesPaid = true;
            uint256 platformFee = (losingPool * platformFeeBps) / 10000;
            uint256 creatorFee = (losingPool * m.creatorFeeBps) / 10000;
            if (platformFee > 0) { (bool s1,) = owner.call{value: platformFee}(""); require(s1); }
            if (creatorFee > 0) { (bool s2,) = m.creator.call{value: creatorFee}(""); require(s2); }
        }

        uint256 totalFees = (losingPool * (platformFeeBps + m.creatorFeeBps)) / 10000;
        uint256 distributable = losingPool - totalFees;
        uint256 payout = userBet + (distributable * userBet) / winningPool;

        (bool s3,) = msg.sender.call{value: payout}("");
        require(s3, "Payout failed");
        emit WinningsClaimed(_marketId, msg.sender, payout);
    }

    // ─── Agents ───

    function registerAgent(string calldata _name, string calldata _strategyType) external returns (uint256) {
        agentCount++;
        agents[agentCount] = Agent(agentCount, msg.sender, _name, _strategyType, 0, 0, 0, 0);
        agentWallet[agentCount] = msg.sender;
        emit AgentRegistered(agentCount, msg.sender, _name, _strategyType);
        return agentCount;
    }

    function recordAgentPrediction(uint256 _agentId, uint256 _marketId, Outcome _prediction) external onlyResolver {
        require(agents[_agentId].id != 0, "Agent not found");
        require(markets[_marketId].id != 0, "Market not found");
        agentPredictions[_agentId][_marketId] = _prediction;
        agents[_agentId].totalPredictions++;
        emit AgentPredictionRecorded(_agentId, _marketId, _prediction);
    }

    // FIX: Prevent double accuracy update
    function updateAgentAccuracy(uint256 _agentId, uint256 _marketId) external onlyResolver {
        require(agents[_agentId].id != 0, "Agent not found");
        require(markets[_marketId].status == MarketStatus.RESOLVED, "Not resolved");
        require(!agentAccuracyUpdated[_agentId][_marketId], "Already updated");
        agentAccuracyUpdated[_agentId][_marketId] = true;
        if (agentPredictions[_agentId][_marketId] == markets[_marketId].outcome) {
            agents[_agentId].correctPredictions++;
        }
    }

    function subscribeToAgent(uint256 _agentId) external {
        require(agents[_agentId].id != 0, "Agent not found");
        require(!isSubscribed[_agentId][msg.sender], "Already subscribed");
        isSubscribed[_agentId][msg.sender] = true;
        userAgentSubscriptions[msg.sender].push(_agentId);
        agents[_agentId].subscriberCount++;
        emit AgentSubscribed(_agentId, msg.sender);
    }

    function unsubscribeFromAgent(uint256 _agentId) external {
        require(isSubscribed[_agentId][msg.sender], "Not subscribed");
        require(agentFunds[_agentId][msg.sender] == 0, "Withdraw funds first");
        isSubscribed[_agentId][msg.sender] = false;
        agents[_agentId].subscriberCount--;
        uint256[] storage subs = userAgentSubscriptions[msg.sender];
        for (uint256 i = 0; i < subs.length; i++) {
            if (subs[i] == _agentId) { subs[i] = subs[subs.length - 1]; subs.pop(); break; }
        }
        emit AgentUnsubscribed(_agentId, msg.sender);
    }

    // ─── Agent Fund Management ───

    function depositToAgent(uint256 _agentId) external payable {
        require(agents[_agentId].id != 0, "Agent not found");
        require(isSubscribed[_agentId][msg.sender], "Must be subscribed");
        require(msg.value > 0, "Must send value");
        agentFunds[_agentId][msg.sender] += msg.value;
        agents[_agentId].totalFunds += msg.value;
        emit FundsDeposited(_agentId, msg.sender, msg.value);
    }

    function agentPlaceBet(uint256 _agentId, uint256 _marketId, Outcome _side, uint256 _amount) external {
        Agent storage a = agents[_agentId];
        Market storage m = markets[_marketId];
        require(a.id != 0, "Agent not found");
        require(msg.sender == agentWallet[_agentId], "Not agent wallet");
        require(m.id != 0 && m.status == MarketStatus.OPEN, "Market not open");
        require(block.timestamp < m.deadline, "Betting closed");
        require(_side == Outcome.YES || _side == Outcome.NO, "Invalid side");
        require(_amount > 0 && _amount <= a.totalFunds, "Insufficient funds");
        a.totalFunds -= _amount;
        bets[_marketId][msg.sender][_side] += _amount;
        if (_side == Outcome.YES) m.yesPool += _amount; else m.noPool += _amount;
        emit AgentTrade(_agentId, _marketId, _side, _amount);
        emit BetPlaced(_marketId, msg.sender, _side, _amount);
    }

    // FIX: Reentrancy guard on withdrawal
    function withdrawFromAgent(uint256 _agentId) external noReentrant {
        uint256 amount = agentFunds[_agentId][msg.sender];
        require(amount > 0, "No funds");
        require(amount <= agents[_agentId].totalFunds, "Insufficient pool");
        agentFunds[_agentId][msg.sender] = 0;
        agents[_agentId].totalFunds -= amount;
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
        emit FundsWithdrawn(_agentId, msg.sender, amount);
    }

    // ─── Views ───

    function getMarket(uint256 _id) external view returns (Market memory) { return markets[_id]; }
    function getMarketOdds(uint256 _id) external view returns (uint256 yp, uint256 np) {
        uint256 t = markets[_id].yesPool + markets[_id].noPool;
        if (t == 0) return (50, 50);
        yp = (markets[_id].yesPool * 100) / t; np = 100 - yp;
    }
    function getAgent(uint256 _id) external view returns (Agent memory) { return agents[_id]; }
    function getAgentAccuracy(uint256 _id) external view returns (uint256) {
        if (agents[_id].totalPredictions == 0) return 0;
        return (agents[_id].correctPredictions * 100) / agents[_id].totalPredictions;
    }
    function getUserSubscriptions(address _u) external view returns (uint256[] memory) { return userAgentSubscriptions[_u]; }
    function getUserBet(uint256 _m, address _u) external view returns (uint256 y, uint256 n) { y = bets[_m][_u][Outcome.YES]; n = bets[_m][_u][Outcome.NO]; }
    function getAgentFunds(uint256 _a, address _u) external view returns (uint256) { return agentFunds[_a][_u]; }

    receive() external payable {}
}
