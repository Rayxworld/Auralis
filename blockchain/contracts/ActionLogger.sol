// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ActionLogger
 * @dev Smart contract for logging autonomous agent actions on Monad testnet
 * @notice This contract demonstrates AI agent behavior verification on-chain
 */
contract ActionLogger {
    
    // ============ State Variables ============
    
    address public owner;
    uint256 public actionFee; // Fee in wei for logging actions
    uint256 public totalActionsLogged;
    
    // ============ Structs ============
    
    struct Action {
        string agentId;
        string actionType;
        string actionData;
        uint256 timestamp;
        address logger;
        uint256 worldTime;
    }
    
    // ============ Storage ============
    
    Action[] public actions;
    mapping(string => uint256[]) public agentActions; // agentId => action indices
    mapping(address => uint256[]) public userActions; // user address => action indices
    
    // ============ Events ============
    
    event ActionLogged(
        uint256 indexed actionId,
        string indexed agentId,
        string actionType,
        uint256 timestamp,
        address logger,
        uint256 worldTime
    );
    
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    // modifier requireFee removed for zero-fee mode
    
    // ============ Constructor ============
    
    constructor(uint256 _initialFee) {
        owner = msg.sender;
        actionFee = _initialFee;
    }
    
    // ============ Main Functions ============
    
    /**
     * @dev Log an agent action on-chain
     * @param agentId Unique identifier for the agent
     * @param actionType Type of action (e.g., "trade", "communicate", "observe")
     * @param actionData JSON string with action details
     * @param worldTime Current simulation time step
     */
    function logAction(
        string memory agentId,
        string memory actionType,
        string memory actionData,
        uint256 worldTime
    ) external returns (uint256) {
        
        uint256 actionId = actions.length;
        
        Action memory newAction = Action({
            agentId: agentId,
            actionType: actionType,
            actionData: actionData,
            timestamp: block.timestamp,
            logger: msg.sender,
            worldTime: worldTime
        });
        
        actions.push(newAction);
        agentActions[agentId].push(actionId);
        userActions[msg.sender].push(actionId);
        
        totalActionsLogged++;
        
        emit ActionLogged(
            actionId,
            agentId,
            actionType,
            block.timestamp,
            msg.sender,
            worldTime
        );
        
        return actionId;
    }
    
    // ============ Query Functions ============
    
    /**
     * @dev Get total number of actions logged
     */
    function getActionCount() external view returns (uint256) {
        return actions.length;
    }
    
    /**
     * @dev Get action details by ID
     */
    function getAction(uint256 actionId) external view returns (
        string memory agentId,
        string memory actionType,
        string memory actionData,
        uint256 timestamp,
        address logger,
        uint256 worldTime
    ) {
        require(actionId < actions.length, "Action does not exist");
        Action memory action = actions[actionId];
        return (
            action.agentId,
            action.actionType,
            action.actionData,
            action.timestamp,
            action.logger,
            action.worldTime
        );
    }
    
    /**
     * @dev Get all action IDs for a specific agent
     */
    function getAgentActions(string memory agentId) external view returns (uint256[] memory) {
        return agentActions[agentId];
    }
    
    /**
     * @dev Get all action IDs logged by a specific address
     */
    function getUserActions(address user) external view returns (uint256[] memory) {
        return userActions[user];
    }
    
    /**
     * @dev Get recent actions (last N actions)
     */
    function getRecentActions(uint256 count) external view returns (Action[] memory) {
        uint256 totalActions = actions.length;
        uint256 returnCount = count > totalActions ? totalActions : count;
        
        Action[] memory recentActions = new Action[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            recentActions[i] = actions[totalActions - returnCount + i];
        }
        
        return recentActions;
    }
    
    /**
     * @dev Get actions within a time range
     */
    function getActionsByTimeRange(
        uint256 startTime,
        uint256 endTime
    ) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // First pass: count matching actions
        for (uint256 i = 0; i < actions.length; i++) {
            if (actions[i].timestamp >= startTime && actions[i].timestamp <= endTime) {
                count++;
            }
        }
        
        // Second pass: collect matching action IDs
        uint256[] memory matchingActionIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < actions.length; i++) {
            if (actions[i].timestamp >= startTime && actions[i].timestamp <= endTime) {
                matchingActionIds[index] = i;
                index++;
            }
        }
        
        return matchingActionIds;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Update the action logging fee
     */
    function setActionFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = actionFee;
        actionFee = newFee;
        emit FeeUpdated(oldFee, newFee);
    }
    
    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner, balance);
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
    
    // ============ Utility Functions ============
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get current fee
     */
    function getCurrentFee() external view returns (uint256) {
        return actionFee;
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}
