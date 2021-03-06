const Buffer = require('safe-buffer').Buffer
const Client = require('bittorrent-tracker')
const common = require('./common')
const fixtures = require('webtorrent-fixtures')
const magnet = require('magnet-uri')
const test = require('tape')

const peerId = Buffer.from('01234567890123456789')

test('magnet: client.start/update/stop()', function (t) {
  t.plan(9)

  const parsedTorrent = magnet(fixtures.leaves.magnetURI)

  common.createServer(t, {}, function (server, announceUrl) {
    const client = new Client({
      infoHash: parsedTorrent.infoHash,
      announce: announceUrl,
      peerId: peerId,
      port: 6881,
      wrtc: {}
    })

    common.mockWebsocketTracker(client)

    client.on('error', function (err) { t.error(err) })
    client.on('warning', function (err) { t.error(err) })

    client.once('update', function (data) {
      t.equal(data.announce, announceUrl)
      t.equal(typeof data.complete, 'number')
      t.equal(typeof data.incomplete, 'number')

      client.update()

      client.once('update', function (data) {
        t.equal(data.announce, announceUrl)
        t.equal(typeof data.complete, 'number')
        t.equal(typeof data.incomplete, 'number')

        client.stop()

        client.once('update', function (data) {
          t.equal(data.announce, announceUrl)
          t.equal(typeof data.complete, 'number')
          t.equal(typeof data.incomplete, 'number')

          server.close()
          client.destroy()
        })
      })
    })

    client.start()
  })
})
