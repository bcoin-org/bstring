/*!
 * cashaddr.js - cashaddr for bcash
 * Copyright (c) 2017, Christopher Jeffrey (MIT License).
 * Copyright (c) 2018, bcash developers.
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

try {
  module.exports = require('./binding').cashaddr;
} catch (e) {
  module.exports = require('./cashaddr-browser');
}
