// Export modules to global scope as necessary (only for testing)
if (typeof process !== 'undefined' && process.release.name === 'node') {
    // We are in node. Require modules.
    assert = require('chai').assert;
    BigBang = require('../lib/NodeBigBangClient');
    isBrowser = false;
} else {
    // We are in the browser. Set up variables like above using served js files.
    assert = chai.assert;
    isBrowser = true;
}

//Set hosts for testing
//var TEST_HOST = 'http://demo.bigbang.io';
//var SECURE_TEST_HOST = 'https://demo.bigbang.io';

//Local option for bigbang.io developers
TEST_HOST = 'http://localhost:8888';
SECURE_TEST_HOST = 'http://localhost:8888';

