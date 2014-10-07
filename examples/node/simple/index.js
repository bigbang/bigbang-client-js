var bigbang = require('bigbang.io');
var bb = new bigbang.Client();
bb.connect('http://demo.bigbang.io', function(err) {
    if (err) {
        return console.log('all is lost!');
    }
    console.log('connected');
});
