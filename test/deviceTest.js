"use strict";


describe('devices', () => {
    describe('#createDevice', () => {
        it('creates a device with tags!', (createDone) => {
            let testTag = randomstring(8);
            var bb = new BigBang.Client(TEST_HOST);
            let tags = ['test', testTag];

            bb.createDevice(tags, false, (err, createResult) => {
                assert.notOk(err);
                createDeviceOk(tags, createResult);

                bb.queryDevices([testTag], (queryErr, r) => {
                    assert.notOk(err);
                    assert.ok(r);
                    assert.ok(r.devices);
                    assert.equal(1, r.devices.length);
                    var nd = r.devices[0];
                    assert.equal(createResult.id, nd.id);
                    assert.deepEqual(createResult.tags, nd.tags);
                    createDone();
                })
            })
        });

        it('connects with a created device', (connectDone) => {
            let client = new BigBang.Client(TEST_HOST);
            let tags = ['test1', 'test2'];
            client.createDevice(tags, false, (err, createResult) => {
                assert.notOk(err);
                createDeviceOk(tags, createResult)
                client.connectAsDevice(createResult.id, createResult.secret, (connectErr) => {
                    assert.notOk(connectErr);

                    client.getDeviceChannel((deviceChannel) => {
                        assert.ok(deviceChannel);
                        let sent = {"foo": "bar"};

                        deviceChannel.on('message', (msg) => {
                            var json = msg.payload.getBytesAsJSON();
                            assert.ok(json);
                            assert.deepEqual(json, sent);
                            connectDone();
                        })

                        deviceChannel.publish(sent);
                    });
                })
            })
        })

        it('fails to connect with a bogus device', (done) => {
            let client = new BigBang.Client(TEST_HOST);
            client.connectAsDevice(randomstring(), randomstring(), (err) => {
                assert.ok(err);
                done();
            });
        })
    });
});

function createDeviceOk(tags, result) {
    assert.ok(result);
    assert.ok(result.id);
    assert.ok(result.secret);
    assert.ok(result.tags);
    assert.deepEqual(tags, result.tags);
}


function randomstring(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz';
    length = length ? length : 32;

    var string = '';

    for (var i = 0; i < length; i++) {
        var randomNumber = Math.floor(Math.random() * chars.length);
        string += chars.substring(randomNumber, randomNumber + 1);
    }

    return string;
}

