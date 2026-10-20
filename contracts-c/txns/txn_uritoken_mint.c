/**
 * URITokenMint Txn
 */
#include "hookapi.h"

#define DONE(x)\
    return accept(SBUF(x), __LINE__)

#define NOPE(x)\
    return rollback(SBUF(x), __LINE__)


#define VL_TO_BUF(buf_raw, vl, len_bytes)\
{\
    unsigned char* buf = (unsigned char*)buf_raw;\
    for (int i = 0; GUARD(32), i < 32; ++i) \
        *(((uint64_t*)buf) + i) = *(((uint64_t*)vl) + i); \
}

#define ENCODE_VL(len_bytes, buf_raw, vl_len)\
{\
    unsigned char* buf = (unsigned char*)buf_raw; \
    if (vl_len <= 193) \
    {\
        len_bytes = 1;\
        buf[0] = vl_len;\
    }\
    else if (vl_len <= 12480) \
    {\
        len_bytes = 2;\
        vl_len -= 193;\
        int byte1 = (vl_len >> 8) + 193;\
        int byte2 = vl_len & 0xFFU;\
        buf[0] = byte1;\
        buf[1] = byte2;\
    }\
    else if (vl_len > 12480) \
    {\
        len_bytes = 3;\
        vl_len -= 193;\
        int byte1 = (vl_len >> 8) + 193;\
        int byte2 = vl_len & 0xFFU;\
        buf[0] = byte1;\
        buf[1] = byte2;\
        buf[2] = byte2;\
    }\
}

// clang-format off 
uint8_t txn[1024] =
{
/* size,upto */
/* 3,    0, tt = URITokenMint     */   0x12U, 0x00U, 0x2DU,
/* 5,    3, sequence              */   0x24U, 0x00U, 0x00U, 0x00U, 0x00U,
/* 6,    8, firstledgersequence   */   0x20U, 0x1AU, 0x00U, 0x00U, 0x00U, 0x00U,
/* 6,   14, lastledgersequence    */   0x20U, 0x1BU, 0x00U, 0x00U, 0x00U, 0x00U,
/* 9,   20, fee                   */   0x68U, 0x40U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U,
/* 35,  29, signingpubkey         */   0x73U, 0x21U, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
/* 22,  64, account               */   0x81U, 0x14U, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
/* 116, 86  emit details          */   0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                                       0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                                       0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
/* 1,  202, uri                   */   0x75U,
/* 0,  203                        */ 
};
// clang-format on

// TX BUILDER
#define BYTES_LEN 203U
#define FLS_OUT (txn + 10U) // + leading bytes (2)
#define LLS_OUT (txn + 16U) // + leading bytes (2)
#define URI_OUT (txn + 203U) // + leading bytes (1)
#define FEE_OUT (txn + 21U) // + leading bytes (1)
#define ACCOUNT_OUT (txn + 66U) // + leading bytes (2)
#define EMIT_OUT (txn + 86U) // + leading bytes (0)

#define MAX_URI_LEN 256

int64_t hook(uint32_t reserved) {
    _g(1,1);
    TRACESTR("txn_uritoken_mint.c: Called.");
    
    uint8_t hook_acc[20];
    hook_account(ACCOUNT_OUT, 20);

    uint8_t uri[MAX_URI_LEN];
    uint64_t uri_len = otxn_param(SBUF(uri), "URI", 3);

    uint32_t padding;
    ENCODE_VL(padding, URI_OUT, uri_len);

    // TXN: PREPARE: Init
    etxn_reserve(1);

    // TXN PREPARE: FirstLedgerSequence
    uint32_t fls = (uint32_t)ledger_seq() + 1;
    *((uint32_t *)(FLS_OUT)) = FLIP_ENDIAN_32(fls);

    // TXN PREPARE: LastLedgerSequense
    uint32_t lls = fls + 4;
    *((uint32_t *)(LLS_OUT)) = FLIP_ENDIAN_32(lls);

    VL_TO_BUF(URI_OUT + padding, uri, padding);

    // TXN PREPARE: Emit Metadata
    etxn_details(EMIT_OUT, 116U);

    // TXN PREPARE: Fee
    {
        int64_t fee = etxn_fee_base(txn, BYTES_LEN + padding + uri_len);
        uint8_t *b = FEE_OUT;
        *b++ = 0b01000000 + ((fee >> 56) & 0b00111111);
        *b++ = (fee >> 48) & 0xFFU;
        *b++ = (fee >> 40) & 0xFFU;
        *b++ = (fee >> 32) & 0xFFU;
        *b++ = (fee >> 24) & 0xFFU;
        *b++ = (fee >> 16) & 0xFFU;
        *b++ = (fee >> 8) & 0xFFU;
        *b++ = (fee >> 0) & 0xFFU;
    }

    // TRACEHEX(txn); // <- final tx blob

    // // TXN: Emit/Send Txn
    uint8_t emithash[32];
    int64_t emit_result = emit(SBUF(emithash), txn, BYTES_LEN + padding + uri_len);
    if (emit_result > 0)
         DONE("txn_uritoken_mint.c: Tx emitted success.");
    NOPE("txn_uritoken_mint.c: Tx emitted failure.");
}