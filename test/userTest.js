"use strict"
describe('users', function () {
    describe('#createUser', function () {
        it('create a user!', function (done) {
            const bb = new BigBang.Client(TEST_HOST);
            var email = 'unittest_' + randomstring(8) + "@bigbang.io";
            bb.createUser(email, '1aZ' + randomstring(10), function (createErr) {
                assert(!createErr);

                bb.resetPassword(email, function (resetErr) {
                    assert(!resetErr);
                    done();
                });
            })
        })

        it('connects with a created user', (done)=> {
            const bb = new BigBang.Client(TEST_HOST);
            const email = 'unittest_' + randomstring(8) + "@bigbang.io";
            const pass = '1aZ' + randomstring(10);
            bb.createUser(email, pass, (createErr) => {
                assert(!createErr);
                bb.connectAsUser(email, pass, (err) => {
                    assert.equal(err, null);
                    done();
                })
            })
        });

        it('fails to connect with bogus credentials', (done)=> {
            const bb = new BigBang.Client(TEST_HOST);
            const email = 'unittest_' + randomstring(8) + "@bigbang.io";
            const pass = '1aZ' + randomstring(10);
            bb.connectAsUser(email, pass, (err) => {
                assert(err);
                done();
            })
        })
    });
});


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


