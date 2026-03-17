/**
 * Configuration for the automated simulation result validator.
 * This utility reads simulation traces and ensures that the final
 * state transitions match expected outcomes and only affect
 * addresses listed in dependencyMap.
 */
module.exports = {
  simulationConfigPath: '../../contracts/governance/ProposalSimulationEngine.json',
  validationMode: 'strict_diff',
  expectedStateChanges: [
    {
      address: '0xTargetGovernanceContract',
      slot: '0xParameterSlot',
      initialValue: '0xExpectedInitialValue',
      finalValue: '0xExpectedFinalValue'
    }
  ],
  gasUsageTolerance: 0.15, // 15% tolerance on gas estimates
  eventsEmitted: [
    { contract: '0xTargetA', signature: 'Transfer(address,address,uint256)' }
  ]
};