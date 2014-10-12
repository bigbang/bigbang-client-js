// Export modules to global scope as necessary (only for testing)
if (typeof process !== 'undefined' && process.title === 'node') {
    // We are in node. Require modules.
    assert = require('chai').assert;
    BigBang = require('../lib/NodeBigBangClient');
    isBrowser = false;
} else {
    // We are in the browser. Set up variables like above using served js files.
    assert = chai.assert;
    isBrowser = true;
}
