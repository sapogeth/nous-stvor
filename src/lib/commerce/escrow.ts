import { contractQueries } from '../db/queries'

export type EscrowStatus = 'OPEN' | 'FUNDED' | 'SUBMITTED' | 'COMPLETE' | 'DISPUTED'

const VALID_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  OPEN:      ['FUNDED', 'DISPUTED'],
  FUNDED:    ['SUBMITTED', 'DISPUTED'],
  SUBMITTED: ['COMPLETE', 'DISPUTED'],
  COMPLETE:  [],
  DISPUTED:  [],
}

export function validateTransition(current: EscrowStatus, next: EscrowStatus): void {
  if (!VALID_TRANSITIONS[current].includes(next)) {
    throw new Error(`Invalid escrow transition: ${current} → ${next}`)
  }
}

export function transitionContract(contractId: string, newStatus: EscrowStatus, extra: Record<string, string> = {}) {
  const contract = contractQueries.getById(contractId)
  if (!contract) throw new Error(`Contract ${contractId} not found`)
  validateTransition(contract.status as EscrowStatus, newStatus)

  const timestamps: Record<string, string> = {}
  if (newStatus === 'FUNDED') timestamps.funded_at = new Date().toISOString()
  if (newStatus === 'COMPLETE') timestamps.completed_at = new Date().toISOString()

  contractQueries.updateStatus(contractId, newStatus, { ...timestamps, ...extra })
}
