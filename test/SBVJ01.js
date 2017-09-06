//
// SBVJ01 - JS library for working with Starbound Versioned JSON format.
// ---
// @copyright (c) 2017 Damian Bushong <katana@odios.us>
// @license MIT license
// @url <https://github.com/damianb/SBVJ01>
//
/*jslint node: true, asi: true */
'use strict'

const fs = require('fs-extra')
const { expect } = require('chai')
const SBVJ01 = require('./../SBVJ01')
const ConsumableBuffer = require('ConsumableBuffer')

describe('SBVJ01', () => {
	describe('SBVJ01._readHeader', () => {
		it('should throw if passed something other than a ConsumableBuffer or ConsumableFile', async () => {
			let res = null
			try {
				await SBVJ01._readHeader(null)
			} catch(err) {
				res = err
			}
			expect(res).to.be.an.instanceof(TypeError)
			expect(res.message).to.equal('SBVJ01._readHeader expects a ConsumableBuffer or ConsumableFile.')
		})

		it('should throw if the file does not appear to be an SBVJ01 formatted archive', async () => {
			const buf = Buffer.from('LOLNOTTHATFILETYPE')
			const sbuf = new ConsumableBuffer(buf)

			let res = null
			try {
				await SBVJ01._readHeader(sbuf)
			} catch(err) {
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
			expect(res).to.be.undefined
		})
	})

	describe('SBVJ01._readData', () => {
		it('should throw if passed something other than a ConsumableBuffer or ConsumableFile', async () => {
			let res = null
			try {
				await SBVJ01._readData(null)
			} catch(err) {
				res = err
			}
			expect(res).to.be.an.instanceof(TypeError)
			expect(res.message).to.equal('SBVJ01._readData expects a ConsumableBuffer or ConsumableFile.')
		})

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
})

describe('SBVJ01 integration test', () => {
	it('should work as expected on a sample SBVJ01 file (slow)', async function() {
		// this is a lot of parsing - trying to parse an entire player file takes a little bit
		//   so, we'll adjust slow/timeout accordingly
		this.slow(1000)
		this.timeout(5000)

		const filename = __dirname + '/samples/7bb55a32b4a5fb530273d4b954f39d20.player'
		const player = new SBVJ01(filename)
		const expected = JSON.parse(await fs.readFile(__dirname + '/samples/Misty.player', { encoding: 'utf8', flag: 'r' }))

		let res = await player.load()

		expect(res.version).to.equal(30)
		expect(res.entity).to.deep.equal(expected)
		expect(res.name).to.equal('PlayerEntity')
	})
})