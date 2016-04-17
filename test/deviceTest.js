"use strict";

describe('devices', () => {
    describe('#createDevice', ()  => {
        it('creates a device with tags!', (createDone) => {
            var bb = new BigBang.Client(TEST_HOST);
            let tags = ['clientTest1', 'clientTest2'];

            bb.createDevice(tags, (err, createResult) => {
                assert.notOk(err);
                createDeviceOk(tags, createResult);
                createDone();
            })
        });

        it('connects with a created device', (connectDone) => {
            let client = new BigBang.Client(TEST_HOST);
            let tags = ['clientTest1', 'clientTest2'];
            client.createDevice(tags, (err, createResult) => {
                assert.notOk(err);
                createDeviceOk(tags, createResult)
                client.connectAsDevice(createResult.id, createResult.secret, (connectErr, connectResult) => {
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

    });
});

function createDeviceOk(tags, result) {
    assert.ok(result);
    assert.ok(result.id);
    assert.ok(result.secret);
    assert.ok(result.tags);
    assert.deepEqual(tags, result.tags);
}

