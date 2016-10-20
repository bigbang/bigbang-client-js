"use strict"


describe('rpc', () => {
    describe('#echo call', () => {
        it('it echos!', (done) => {
            const msg = {foo: "bar"};

            clientOnChannel("foo", (client, channel) => {
                client.call("/echo", msg, (err, response)=> {
                    assert.notOk(err);
                    assert.ok(response);
                    const json = response.getBytesAsJSON();
                    assert.deepEqual(msg, json);
                    done();
                });
            })
        })


        it('blows up properly with no endpoint', (done) => {
            connectedClient((client) => {
                client.call("/bogus", {some: "msg"}, (err, response) => {
                    assert.ok(err);
                    done();
                });
            })
        })
    });


});


function connectedClient(callback) {
    var bb = new BigBang.Client(TEST_HOST);
    bb.connect(function (err) {
        assert.equal(err, null);
        //We should always have this on successful connect.
        assert.ok(bb.getClientId());
        callback(bb);
    });
}


function clientOnChannel(name, callback) {
    var bb = new BigBang.Client(TEST_HOST);
    bb.connect(function (err) {
        assert.equal(err, null);
        //We should always have this on successful connect.
        assert.ok(bb.getClientId());

        bb.subscribe(name, function (err, channel) {
            assert(!err);
            assert(channel);
            callback(bb, channel);
        });

    });
}
