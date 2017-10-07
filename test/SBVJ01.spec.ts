//
// SBVJ01 - JS library for working with Starbound Versioned JSON format.
// ---
// @copyright (c) 2017 Damian Bushong <katana@odios.us>
// @license MIT license
// @url <https://github.com/damianb/SBVJ01>
//
/* eslint-env mocha */
'use strict'

import * as fs from 'fs-extra'
import * as path from 'path'
import { expect } from 'chai'
import { ConsumableBuffer } from 'ConsumableBuffer'
import { ExpandingBuffer } from 'ExpandingBuffer'
import { SBVJ01 } from './../src/SBVJ01'

describe('SBVJ01', () => {
  const tmpDir = path.join(__dirname, '/tmp')

  describe('SBVJ01.load', () => {
    it('should be able to read a sample SBVJ01 file (slow running test)', async function () {
      // this is a lot of parsing - trying to parse an entire player file takes a little bit
      //   so, we'll adjust slow/timeout accordingly
      this.slow(5000)
      this.timeout(20000)

      const filename = path.join(__dirname, '/samples/7bb55a32b4a5fb530273d4b954f39d20.player')
      const expected = JSON.parse(await fs.readFile(path.join(__dirname, '/samples/Misty.player'), { encoding: 'utf8', flag: 'r' }))
      let player = new SBVJ01(filename)

      let res = await player.load()

      expect(res.version).to.equal(30)
      expect(res.entity).to.deep.equal(expected)
      expect(res.name).to.equal('PlayerEntity')
    })
  })

  describe('SBVJ01.save', () => {
    afterEach(async () => {
      let files = await fs.readdir(tmpDir + '/')
      for (const file of files) {
        if (file === '.gitkeep') {
          continue
        }

        await fs.unlink(path.join(tmpDir, file))
      }
    })

    it('should throw if no entity name was specified', async () => {
      const filename = tmpDir + '/test.player'
      let player = new SBVJ01(filename)

      player.name = null
      player.version = 3
      player.entity = {
        testEntity: 100
      }

      let res = null
      try {
        await player.save()
      } catch (err) {
        res = err
      }
      expect(res).to.be.an.instanceof(Error)
      expect(res.message).to.equal('An entity name must be specified before attempting to save an SBVJ01 file.')
    })

    it('should work as expected when writing a sample SBVJ01 file', async () => {
      const filename = tmpDir + '/test.player'
      let player = new SBVJ01(filename)

      let name = player.name = 'TestEntity'
      let version = player.version = 5
      let entity = player.entity = {
        crazyTest: [1, 2, 'a']
      }
      let expectedBuffer = Buffer.from([
        0x53, 0x42, 0x56, 0x4a, 0x30, 0x31, 0x0a, 0x54,
        0x65, 0x73, 0x74, 0x45, 0x6e, 0x74, 0x69, 0x74,
        0x79, 0x01, 0x00, 0x00, 0x00, 0x05, 0x07, 0x01,
        0x09, 0x63, 0x72, 0x61, 0x7a, 0x79, 0x54, 0x65,
        0x73, 0x74, 0x06, 0x03, 0x04, 0x02, 0x04, 0x04,
        0x05, 0x01, 0x61
      ])

      let res = await player.save()

      expect(res.name).to.equal(name)
      expect(res.version).to.equal(version)
      expect(res.entity).to.deep.equal(entity)

      expect(Buffer.compare(await fs.readFile(filename), expectedBuffer)).to.equal(0)
    })

    it('should work as expected when modifying a sample SBVJ01 file (slow running test)', async function () {
      this.slow(5000)
      this.timeout(20000)

      const filename = tmpDir + '/7bb55a32b4a5fb530273d4b954f39d20.player'
      await fs.copy(path.join(__dirname, '/samples/7bb55a32b4a5fb530273d4b954f39d20.player'), filename)
      let player = new SBVJ01(filename)
      await player.load()

      // rename the character!
      player.entity.identity.name = 'Julie'

      let res = await player.save()

      expect(res.entity.identity.name).to.equal('Julie')
      // final verification would be to load the .player file in Starbound itself and verify the player's name...
    })
  })

  describe('SBVJ01._readHeader', () => {
    it('should throw if the file does not appear to be an SBVJ01 formatted archive', async () => {
      const buf = Buffer.from('LOLNOTTHATFILETYPE')
      const sbuf = new ConsumableBuffer(buf)

      let res = null
      try {
        await SBVJ01._readHeader(sbuf)
      } catch (err) {
        res = err
      }
      expect(res).to.be.an.instanceof(Error)
      expect(res.message).to.equal('File does not appear to be SBVJ01 format.')
    })

    it('should not throw when it finds the correct header', async () => {
      const buf = Buffer.from([
        0x53, 0x42, 0x56, 0x4A, 0x30, 0x31, 0x54, 0x45,
        0x53, 0x54
      ])
      const sbuf = new ConsumableBuffer(buf)

      const res = await SBVJ01._readHeader(sbuf)
      expect(res).to.equal(undefined)
    })
  })

  describe('SBVJ01._readData', () => {
    it('should correctly return a JS Object from a versioned JSON payload', async () => {
      // todo
      const buf = Buffer.from([
        0x53, 0x42, 0x56, 0x4A, 0x30, 0x31, 0x04, 0x54,
        0x65, 0x73, 0x74, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x07, 0x02, 0x04, 0x6B, 0x65, 0x79, 0x32, 0x05,
        0x04, 0x76, 0x61, 0x6C, 0x32, 0x03, 0x6B, 0x65,
        0x79, 0x05, 0x03, 0x76, 0x61, 0x6C
      ])
      const sbuf = new ConsumableBuffer(buf)
      const expected = {
        key: 'val',
        key2: 'val2'
      }

      const res = await SBVJ01._readData(sbuf)
      expect(res.entity).to.deep.equal(expected)
      expect(res.name).to.equal('Test')
      expect(res.version).to.equal(1)
    })
  })

  describe('SBVJ01._writeEntity', () => {
    it('should throw if passed something other than an integer for the entity version', async () => {
      let res: Error = new Error() // because typescript is stupid.
      let sbuf = new ExpandingBuffer()

      try {
        await SBVJ01._writeEntity(sbuf, 'test', 0.5, null)
      } catch (err) {
        res = err
      }
      expect(res).to.be.an.instanceof(TypeError)
      expect(res.message).to.equal('SBVJ01._writeEntity expects the provided entity version to be an integer or null.')
    })

    it('should correctly write a versioned SBVJ01 entity', async () => {
      let sbuf = new ExpandingBuffer()
      let expectedBuffer = Buffer.from([
        0x53, 0x42, 0x56, 0x4a, 0x30, 0x31, 0x0a, 0x54,
        0x65, 0x73, 0x74, 0x45, 0x6e, 0x74, 0x69, 0x74,
        0x79, 0x01, 0x00, 0x00, 0x00, 0x05, 0x07, 0x01,
        0x09, 0x63, 0x72, 0x61, 0x7a, 0x79, 0x54, 0x65,
        0x73, 0x74, 0x06, 0x03, 0x04, 0x02, 0x04, 0x04,
        0x05, 0x01, 0x61
      ])

      await SBVJ01._writeEntity(sbuf, 'TestEntity', 5, {
        crazyTest: [1, 2, 'a']
      })

      expect(Buffer.compare(sbuf.buf, expectedBuffer)).to.equal(0)
    })

    it('should correctly write an unversioned SBVJ01 entity', async () => {
      let sbuf = new ExpandingBuffer()
      let expectedBuffer = Buffer.from([
        0x53, 0x42, 0x56, 0x4a, 0x30, 0x31, 0x0a, 0x54,
        0x65, 0x73, 0x74, 0x45, 0x6e, 0x74, 0x69, 0x74,
        0x79, 0x00, 0x07, 0x01, 0x09, 0x63, 0x72, 0x61,
        0x7a, 0x79, 0x54, 0x65, 0x73, 0x74, 0x06, 0x03,
        0x04, 0x02, 0x04, 0x04, 0x05, 0x01, 0x61
      ])

      await SBVJ01._writeEntity(sbuf, 'TestEntity', null, {
        crazyTest: [1, 2, 'a']
      })

      expect(Buffer.compare(sbuf.buf, expectedBuffer)).to.equal(0)
    })
  })
})
