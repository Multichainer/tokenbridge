require('../env')

module.exports = {
  id: 'tx-approval',
  name: 'tx-approval',
  validatorAddress: process.env.ORACLE_VALIDATOR_ADDRESS || 'approval'
}
