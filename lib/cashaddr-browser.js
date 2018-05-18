/*!
 * cashaddr.js - cashaddr for bcash
 * Copyright (c) 2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 *
 * Implementation of CashAddr
 * https://github.com/bitcoincashorg/spec/blob/master/cashaddr.md
 *
 * Parts of this software are based on "bitcoin-abc".
 * https://github.com/Bitcoin-ABC/bitcoin-abc
 *
 * Parts of this software are based on "bech32".
 * https://github.com/sipa/bech32
 *
 * Copyright (c) 2017 Pieter Wuille
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

const assert = require('assert');
const {U64} = require('n64');

/**
 * Constants
 */

const POOL105 = Buffer.allocUnsafe(105);
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

const TABLE = [
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  15, -1, 10, 17, 21, 20, 26, 30,  7,  5, -1, -1, -1, -1, -1, -1,
  -1, 29, -1, 24, 13, 25,  9,  8, 23, -1, 18, 22, 31, 27, 19, -1,
   1,  0,  3, 16, 11, 28, 12, 14,  6,  4,  2, -1, -1, -1, -1, -1,
  -1, 29, -1, 24, 13, 25,  9,  8, 23, -1, 18, 22, 31, 27, 19, -1,
   1,  0,  3, 16, 11, 28, 12, 14,  6,  4,  2, -1, -1, -1, -1, -1
];

const encodedSize = {
  20: 0,
  24: 1,
  28: 2,
  32: 3,
  40: 4,
  48: 5,
  56: 6,
  64: 7
};

const CHECKSUM_MASK = U64.fromNumber(0x07ffffffff);
const GENERATOR = [
  U64.fromNumber(0x98f2bc8e61),
  U64.fromNumber(0x79b76d99e2),
  U64.fromNumber(0xf33e5fb3c4),
  U64.fromNumber(0xae2eabe2a8),
  U64.fromNumber(0x1e4f43e470)
];

/**
 * Update checksum
 * @ignore
 * @param {U64} chk
 * @returns {U64} -- new checksum
 */

function polymod(pre) {
  const c = pre.clone();
  const b = c.ushrn(35).lo;

  c.iand(CHECKSUM_MASK).ishln(5);

  for (let i = 0; i < GENERATOR.length; i++) {
    if ((b >> i) & 1)
      c.ixor(GENERATOR[i]);
  }
  return c;
}

/**
 * Serialize data to cashaddr.
 * @param {String} prefix
 * @param {Buffer} data - 5bit serialized
 * @returns {String}
 */

function serialize(prefix, data) {
  let chk = U64.fromNumber(1);
  let str = '';

  for (let i = 0; i < prefix.length; i++) {
    const ch = prefix.charCodeAt(i);

    if ((ch & 0xff00) || (ch >> 5) === 0)
      throw new Error('Invalid cashaddr character.');

    chk = polymod(chk).ixorn(ch & 0x1f);
    str += prefix[i];
  }

  chk = polymod(chk);
  str += ':';

  for (let i = 0; i < data.length; i++) {
    const ch = data[i];

    if ((ch >> 5) !== 0)
      throw new Error('Invalid cashaddr value.');

    chk = polymod(chk).ixorn(ch);
    str += CHARSET[ch];
  }

  for (let i = 0; i < 8; i++)
    chk = polymod(chk);

  chk.ixorn(1);

  for (let i = 0; i < 8; i++) {
    const v = chk.shrn((7 - i) * 5).lo & 0x1f;

    str += CHARSET[v];
  }

  return str;
}

/**
 * Decode CashAddr string.
 * @param {String} str
 * @param {String} defaultPrefix
 * @returns {Array} [prefix, data]
 */

function deserialize(str, defaultPrefix) {
  if (str.length < 8)
    throw new Error('Invalid cashaddr string length.');

  let lower = false;
  let upper = false;
  let hasNumber = false;
  let prefixSize = 0;

  // process lower/upper, make sure we have prefix
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);

    if (ch >= 0x61 && ch <= 0x7a) {
      lower = true;
      continue;
    }

    if (ch >= 0x41 && ch <= 0x5a) {
      upper = true;
      continue;
    }

    if (ch >= 0x30 && ch <= 0x39) {
      hasNumber = true;
      continue;
    }

    if (ch === 0x3a) { // :
      if (hasNumber)
        throw new Error('Numbers are not allowed in prefix.');

      if (i === 0)
        throw new Error('Empty cashaddr prefix.');

      if (prefixSize !== 0)
        throw new Error('There must not be two separators.');

      prefixSize = i;
      break;
    }

    throw new Error('Invalid cashaddr charater.');
  }

  if (upper && lower)
    throw new Error('Invalid cashaddr casing.');

  // process checksum
  let chk = U64.fromNumber(1);
  let prefix;

  if (prefixSize === 0)
    prefix = defaultPrefix;
  else {
    prefix = str.slice(0, prefixSize);
    prefixSize++;
  }

  // process prefix
  for (let i = 0; i < prefix.length; i++) {
    const ch = prefix.charCodeAt(i);

    chk = polymod(chk).ixorn((ch | 0x20) & 0x1f);
  }

  chk = polymod(chk);

  const data = Buffer.allocUnsafe(str.length - prefixSize);

  for (let i = prefixSize; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    const v = (ch & 0xff80) ? -1 : TABLE[ch];

    if (v === -1)
      throw new Error('Invalid cashaddr character.');

    chk = polymod(chk).ixorn(v);

    if (i + 8 < str.length)
      data[i - prefixSize] = v;
  }

  if (!chk.eqn(1))
    throw new Error('Invalid cashaddr checksum.');

  return [prefix, data.slice(0, -8)];
}

/**
 * Serialize data to cashaddr
 * @param {String} prefix
 * @param {Number} type - (0 = P2PKH, 1 = P2SH)
 * @param {Buffer} hash
 * @returns {String}
 */

function encode(prefix, type, hash) {
  assert(typeof prefix === 'string');
  assert((type & 0xff) === type);
  assert(Buffer.isBuffer(hash));

  if (type < 0 || type > 1)
    throw new Error('Invalid cashaddr type.');

  const size = encodedSize[hash.length];

  if (size == null)
    throw new Error('Non standard length.');

  const data = Buffer.allocUnsafe(hash.length + 1);
  data[0] = (type << 3) | size;
  hash.copy(data, 1);

  const output = POOL105;
  const converted = convert(data, output, 8, 5, true, 0);

  return serialize(prefix, converted);
}

/**
 * Deserialize data from CashAddr address.
 * @param {String} str
 * @param {String} defaultPrefix
 * @returns {Object}
 */

function decode(str, defaultPrefix) {
  assert(typeof str === 'string');

  const [prefix, data] = deserialize(str, defaultPrefix);
  const extrabits = (data.length * 5) % 8;

  if (extrabits >= 5)
    throw new Error('Invalid padding in data.');

  const last = data[data.length - 1];
  const mask = (1 << extrabits) - 1;

  if (last & mask)
    throw new Error('Non zero padding.');

  const output = data;
  const converted = convert(data, output, 5, 8, false, 0);

  const type = (converted[0] >> 3) & 0x1f;
  const hash = converted.slice(1);

  let size = 20 + 4 * (converted[0] & 0x03);

  if (converted[0] & 0x04)
    size *= 2;

  if (size !== hash.length)
    throw new Error('Invalid cashaddr data length.');

  return new AddrResult(prefix, type, hash);
}

/**
 * Test whether a string is a cashaddr string.
 * @param {String} str
 * @returns {Boolean}
 */

function test(str) {
  try {
    decode(str);
  } catch (e) {
    return false;
  }

  return true;
}

/**
 * AddrResult
 * @private
 * @property {String} prefix
 * @property {Number} type (0 = P2PKH, 1 = P2SH)
 * @property {Buffer} hash
 */
class AddrResult {
  /**
   * @param {String} prefix
   * @param {Number} type
   * @param {Buffer} hash
   */

  constructor(prefix, type, hash) {
    this.prefix = prefix;
    this.type = type;
    this.hash = hash;
  }
}

/*
 * Helpers
 */

/**
 * Convert serialized data to bits,
 * @param {Buffer} data
 * @param {Buffer} output
 * @param {Number} frombits
 * @param {Number} tobits
 * @param {Boolean} pad
 * @param {Number} off
 * @returns {Buffer}
 */

function convert(data, output, frombits, tobits, pad, off) {
  const maxv = (1 << tobits) - 1;

  let acc = 0;
  let bits = 0;
  let j = 0;

  for (let i = off; i < data.length; i++) {
    const value = data[i];

    if ((value >> frombits) !== 0)
      throw new Error('Invalid cashaddr bits.');

    acc = (acc << frombits) | value;
    bits += frombits;

    while (bits >= tobits) {
      bits -= tobits;
      output[j++] = (acc >>> bits) & maxv;
    }
  }

  if (pad) {
    if (bits > 0)
      output[j++] = (acc << (tobits - bits)) & maxv;
  } else {
    if (bits >= frombits || ((acc << (tobits - bits)) & maxv))
      throw new Error('Invalid cashaddr bits.');
  }

  return output.slice(0, j);
}

/*
 * Expose
 */

exports.encode = encode;
exports.decode = decode;
exports.test = test;

exports.serialize = serialize;
exports.deserialize = deserialize;
