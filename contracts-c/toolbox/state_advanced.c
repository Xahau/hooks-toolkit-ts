/**
 * 
 */
#include "hookapi.h"

#define MODEL_SIZE 72U

int64_t hook(uint32_t reserved) {
    TRACESTR("state_advanced: Start.");

    // ACCOUNT: Origin Tx Account
    uint8_t otx_acc[20];
    otxn_field(otx_acc, 20, sfAccount);
    
    // ACCOUNT: Hook Account
    uint8_t hook_acc[20];
    hook_account(SBUF(hook_acc));

    // FILTER ON: ACCOUNT
    if (!BUFFER_EQUAL_20(hook_acc, otx_acc))
        DONE("state_advanced: incoming tx on `Account`.");

    uint8_t model_buffer[MODEL_SIZE];
    uint8_t m_key[4] = {'T', 'E', 'S', 'T'};
    int64_t model_size = otxn_param(SBUF(model_buffer), SBUF(m_key));
    TRACEHEX(model_size);

    uint8_t model[MODEL_SIZE];
    state(SBUF(model), hook_acc, 20);

    state_set(SBUF(model_buffer), hook_acc, 20);

    TRACEVAR(model) // <- value

    // Your code here...

    TRACESTR("state_advanced: End.");
    accept(SBUF(model), __LINE__);
    _g(1,1);   // every hook needs to import guard function and use it at least once
    // unreachable
    return 0;
}