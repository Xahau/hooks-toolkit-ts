/**
 * Export (xport) round trip.
 *
 * hook: on Invoke, exports a Payment (1 drop to a fixed account) for the other network.
 * cbak: runs when the export comes back as an Import of an XPOP; returns the
 *       TransactionResult the transaction had on the other network.
 */
#include "hookapi.h"

// Only what the hook decides is here. xport() fills in Account, SigningPubKey,
// Sequence (0), OperationLimit and Fee (from the signer count), and the ledger
// the TicketSequence, when the export applies.
// clang-format off
uint8_t txn[34] =
{
/*  3,  0 */ 0x12U, 0x00U, 0x00U,                                           /* tt = Payment */
/*  9,  3 */ 0x61U, 0x40U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x01U, /* amount = 1 drop */
/* 22, 12 */ 0x83U, 0x14U,                                                  /* destination */
             0x01U, 0x02U, 0x03U, 0x04U, 0x05U, 0x06U, 0x07U, 0x08U, 0x09U, 0x0AU,
             0x0BU, 0x0CU, 0x0DU, 0x0EU, 0x0FU, 0x10U, 0x11U, 0x12U, 0x13U, 0x14U
};
// clang-format on

int64_t cbak(uint32_t what)
{
    _g(1, 1);

    // 2: the export came back from the other network; 1: it could not be exported
    if (what != 2)
        return accept(SBUF("xport.c: export failed."), what);

    // the XPOP's transaction in slot 1 and its metadata in slot 2
    if (xpop_slot(1, 2) < 0)
        return rollback(SBUF("xport.c: xpop_slot failed."), __LINE__);

    if (slot_subfield(2, sfTransactionResult, 3) != 3)
        return rollback(SBUF("xport.c: no TransactionResult."), __LINE__);

    uint8_t tr;
    if (slot(SVAR(tr), 3) != 1)
        return rollback(SBUF("xport.c: no TransactionResult."), __LINE__);

    // tesSUCCESS = 0, tec codes are 100+
    return accept(SBUF("xport.c: export returned."), tr);
}

int64_t hook(uint32_t reserved)
{
    _g(1, 1);

    if (otxn_type() != ttINVOKE)
        return accept(SBUF("xport.c: not an Invoke."), __LINE__);

    etxn_reserve(1);

    uint8_t hash[32];
    int64_t result = xport(SBUF(hash), SBUF(txn));
    if (result < 0)
        return rollback(SBUF("xport.c: xport failed."), result);

    return accept(SBUF("xport.c: export emitted."), result);
}
