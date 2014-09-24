var bigbang = require('bigbang.io');
var bb = new bigbang.Client();
bb.connectAnonymous('demo.app.bigbang.io', function(res) {
    console.log(res);
});