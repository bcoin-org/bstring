/*!
 * bstr
 * Copyright (c) 2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bstr
 */

'use strict';

exports.base58 = require('./base58');
exports.bech32 = require('./bech32');

/**
 * Test whether a string is base58 (note that you
 * may get a false positive on a hex string).
 * @param {String?} str
 * @returns {Boolean}
 */

exports.isBase58 = function isBase58(str) {
  return typeof str === 'string' && /^[1-9A-Za-z]+$/.test(str);
};

/**
 * Test whether a string is bech32 (note that
 * this doesn't guarantee address is bech32).
 * @param {String?} str
 * @returns {Boolean}
 */

exports.isBech32 = function isBech32(str) {
  if (typeof str !== 'string')
    return false;

  if (str.toUpperCase() !== str && str.toLowerCase() !== str)
    return false;

  if (str.length < 8 || str.length > 90)
    return false;

  // it's unlikely any network will have hrp other than a-z symbols.
  return /^[a-zA-Z]{1,3}1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/i.test(str);
};
