
#include <stdint.h>
#include "hookapi.h"

#define DONE(x)\
    return accept(SBUF(x), __LINE__)

#define NOPE(x)\
    return rollback(SBUF(x), __LINE__)

#define ASSERT(x)\
{\
    if (!(x))\
        rollback(0,0,__LINE__);\
}

#define ACCID_SIZE 20U

int64_t hook(uint32_t r)
{
    _g(1,1);

    uint8_t hook_accid[32];
    hook_account(hook_accid + 12, ACCID_SIZE);
    
    uint8_t otxn_accid[32];
    otxn_field(otxn_accid + 12, ACCID_SIZE, sfAccount);

    if (BUFFER_EQUAL_20(hook_accid + 12, otxn_accid + 12))
        DONE("guard.c: passing outgoing txn");

    ASSERT(otxn_slot(1) == 1);
    ASSERT(slot_subfield(1, sfBlob, 2) == 2);
    uint8_t buffer[2800];
    ASSERT(slot(SBUF(buffer), 2) > 0);
    uint16_t len = (uint16_t)buffer[0];
    TRACEVAR(len);
    uint8_t* ptr = buffer + 1;
    if (len > 192)
    {
        len = 193 + ((len - 193) * 256) + ((uint16_t)(buffer[1]));
        ptr++;
    }

    uint8_t* end = ptr + len;
    int64_t count = 0;
    while (ptr < end)
    {
        GUARD(100);
        ASSERT(state_set(ptr + 1U + ACCID_SIZE, 8U, ptr + 1U, ACCID_SIZE) == 8U);
        ptr += 1U + ACCID_SIZE + 8U;
        count++;
        TRACEVAR(count);
    }
    DONE("guard: Accounts Added.");
    return 0;
}