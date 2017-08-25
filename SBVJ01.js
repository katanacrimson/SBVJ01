//
// SBVJ01 - JS library for working with Starbound Versioned JSON format.
// ---
// @copyright (c) 2017 Damian Bushong <katana@odios.us>
// @license MIT license
// @url <https://github.com/damianb/>
// @reddit <https://reddit.com/u/katana__>
//
/*jslint node: true, asi: true */
'use strict'

const fs = require('fs-extra')
const ConsumableBuffer = require('ConsumableBuffer')
const ConsumableFile = require('ConsumableFile')
const SBON = require('SBON')

//
// SBVJ01 - provides an abstraction around reading/interacting with SBVJ01 encoded files (used for Starbound "player" files)
//
module.exports = class SBVJ01 {
	/**
	 * SBVJ01 Constructor
	 *
	 * @param  {String} path - The filepath for the entity file we're going to work with.
	 * @return {SBVJ01}
	 */
	constructor(path) {
		this.path = path
		this.file = this.data = null
	}

	/**
	 * Loads the file, verifies the header and then loads the versioned JSON payload and returns it.
	 * This is a convenience method for the common workflow of loading the file.
	 *
	 * @return {Promise:object} - An object containing the versioned JSON payload.
	 */
	async load() {
		// first, open the file up
		this.file = new ConsumableFile(this.path)
		await this.file.open()

		// read/verify the header
		await SBVJ01._readHeader(this.file)

		// return the SBVJ01 data payload.
		return (this.data = await SBVJ01._readData(this.file))
	}

	/**
	 * Reads the header of a file and identifies if it is SBVJ01 format.
	 * @access private
	 *
	 * @param {ConsumableBuffer|ConsumableFile} sbuf - The stream to read from.
	 * @return {Promise:undefined} - Returns undefined.
	 */
	static async _readHeader(sbuf) {
		if(!(sbuf instanceof ConsumableBuffer || sbuf instanceof ConsumableFile)) {
			throw new TypeError('SBVJ01._readHeader expects a ConsumableBuffer or ConsumableFile.')
		}

		// grab the first 6 bytes - this should be a standard SBVJ01 pak header
		// we'll compare it to what we expect to verify that this *is* an SBVJ01 file

		if(Buffer.compare(await sbuf.read(6), Buffer.from('SBVJ01')) !== 0) {
			throw new Error('File does not appear to be SBVJ01 format.')
		}

		return undefined
	}

	/**
	 * Reads the versioned JSON object.
	 * @access private
	 *
	 * @param  {ConsumableBuffer|ConsumableFile} sbuf - The stream to read from.
	 * @return {Promise:Object} - An Object that contains the metadata and fileTable of the archive.
	 */
	static async _readData(sbuf) {
		if(!(sbuf instanceof ConsumableBuffer || sbuf instanceof ConsumableFile)) {
			throw new TypeError('SBVJ01._readData expects a ConsumableBuffer or ConsumableFile.')
		}

		// ensure we're at the SBON object payload before trying to read it out
		await sbuf.aseek(6)

		// vJSON starts with the ent name, a single 0x01 byte, the version (a signed Int32BE), then the data structure
		const entityName = await SBON.readString(sbuf)

		const weirdByte = await sbuf.read(1)
		if(Buffer.compare(weirdByte, Buffer.from([0x01])) !== 0) {
			console.log('Encountered a non-0x01 "weird byte".')
			console.log('Please submit this sample to the developer!')
		}

		const version = (await sbuf.read(4)).readInt32BE(0)
		const entityData = await SBON.readDynamic(sbuf)

		// grab and return what we've obtained
		return {
			name: entityName,
			entity: entityData,
			version: version
		}
	}
}
