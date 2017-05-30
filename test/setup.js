// Export modules to global scope as necessary (only for testing)
if (typeof process !== 'undefined' && process.release.name === 'node') {
    // We are in node. Require modules.
    assert = require('chai').assert;
    BigBang = require('../lib/NodeBigBangClient');
    isBrowser = false;
} else {
    assert = chai.assert;
    isBrowser = true;
}
//Test env variables.
TEST_HOST = process.env.TEST_HOST;
SECURE_TEST_HOST = process.env.SECURE_TEST_HOST;
BB_ACCESS_KEY = process.env.BB_ACCESS_KEY;

