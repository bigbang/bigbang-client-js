var TEST_HOST = 'localhost:8888';

describe('client', function () {
    describe('#createUser', function () {
        it('create a user!', function (done) {
            var bb = new BigBang.Client('http://' + TEST_HOST);
            var email = 'unittest_' + randomstring(8) + "@bigbang.io";

            bb.createUser(email, '1aZ' + randomstring(10), function (createErr) {
                assert.equal(null, createErr);
                //done();

                bb.resetPassword(email, function (resetErr) {
                    assert.equal(null, resetErr);
                    done();
                });

            })
        })
    });
});


function clientOnChannel(name, callback) {
    var bb = new BigBang.Client('http://' + TEST_HOST);
    bb.connect(function (err) {
        assert.equal(err, null);

        bb.subscribe(name, function (err, channel) {
            assert(!err);
            assert(channel);
            callback(bb, channel);
        });

    });
}


var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz';

function randomstring(length) {
    length = length ? length : 32;

    var string = '';

    for (var i = 0; i < length; i++) {
        var randomNumber = Math.floor(Math.random() * chars.length);
        string += chars.substring(randomNumber, randomNumber + 1);
    }

    return string;
}


