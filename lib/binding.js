/*!
 * bstr
 * Copyright (c) 2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bstr
 */

'use strict';

if (process.env.BSTR_BACKEND && process.env.BSTR_BACKEND !== 'native')
  throw new Error('Non-native backend selected.');

const binding = require('bindings')('bstr');
const DUMMY = Buffer.alloc(0);

class AddrResult {
  constructor() {
    this.hrp = '';
    this.version = 0;
    this.hash = DUMMY;
  }
}

exports.base58 = {
  encode: binding.base58_encode,
  decode: binding.base58_decode
};

exports.bech32 = {
  encode: binding.bech32_encode,
  decode(str) {
    return binding.bech32_decode(str, new AddrResult());
  }
};
