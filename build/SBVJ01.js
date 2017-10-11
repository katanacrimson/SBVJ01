//
// SBVJ01 - JS library for working with Starbound Versioned JSON format.
// ---
// @copyright (c) 2017 Damian Bushong <katana@odios.us>
// @license MIT license
// @url <https://github.com/damianb/SBVJ01>
//
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const ConsumableFile_1 = require("ConsumableFile");
const ExpandingFile_1 = require("ExpandingFile");
const SBON_1 = require("SBON");
//
// SBVJ01 - provides an abstraction around reading/interacting with SBVJ01 encoded files (used for Starbound "player" files)
//
class SBVJ01 {
    /**
     * SBVJ01 Constructor
     *
     * @param  {String} path - The filepath for the entity file we're going to work with.
     * @return {SBVJ01}
     */
    constructor(path) {
        this.path = path;
        this.version = this.name = this.entity = null;
    }
    /**
     * Reads the header of a file and identifies if it is SBVJ01 format.
     * @access private
     *
     * @param {ConsumableBuffer|ConsumableFile} sbuf - The stream to read from.
     * @return {Promise:void}
     */
    static async _readHeader(sbuf) {
        // grab the first 6 bytes - this should be a standard SBVJ01 pak header
        // we'll compare it to what we expect to verify that this *is* an SBVJ01 file
        if (Buffer.compare(await sbuf.read(6), Buffer.from('SBVJ01')) !== 0) {
            throw new Error('File does not appear to be SBVJ01 format.');
        }
        return;
    }
    /**
     * Reads the versioned JSON object.
     * @access private
     *
     * @param  {ConsumableBuffer|ConsumableFile} sbuf - The stream to read from.
     * @return {Promise:Object} - An Object that contains the metadata and fileTable of the archive.
     */
    static async _readData(sbuf) {
        // ensure we're at the SBON object payload before trying to read it out
        await sbuf.aseek(6);
        // vJSON starts with the ent name, a single 0x01 byte, the version (a signed Int32BE), then the data structure
        const entityName = await SBON_1.SBON.readString(sbuf);
        const isVersioned = await sbuf.read(1);
        let entityVersion = null;
        if (Buffer.compare(isVersioned, Buffer.from([0x01])) === 0) {
            entityVersion = (await sbuf.read(4)).readInt32BE(0);
        }
        const entityData = await SBON_1.SBON.readDynamic(sbuf);
        // grab and return what we've obtained
        return {
            name: entityName,
            entity: entityData,
            version: entityVersion
        };
    }
    /**
     * Write the currently defined entity to the originally specified file location.
     *
     * @param  {ExpandingBuffer|ExpandingFile} sbuf - The stream to write to.
     * @param  {String} entityName - The name of the entity (think more in terms of an entity *class*).
     * @param  {Number|null} entityVersion - The version of the entity. Must be an integer.
     * @param  {mixed} entityData - The data payload to write for the entity.
     * @return {Promise:Number} - The return value of SBON.writeDynamic()
     */
    static async _writeEntity(sbuf, entityName, entityVersion, entityData) {
        if ((typeof entityVersion !== 'number' || !Number.isInteger(entityVersion)) && entityVersion !== null) {
            throw new TypeError('SBVJ01._writeEntity expects the provided entity version to be an integer or null.');
        }
        // write the header
        await sbuf.write('SBVJ01');
        // entity name followed by 0x01
        await SBON_1.SBON.writeString(sbuf, entityName);
        if (entityVersion !== null) {
            await sbuf.write([0x01]);
            // version int32
            const versionBuffer = Buffer.alloc(4);
            versionBuffer.writeInt32BE(entityVersion, 0);
            await sbuf.write(versionBuffer);
        }
        else {
            await sbuf.write([0x00]);
        }
        return SBON_1.SBON.writeDynamic(sbuf, entityData);
    }
    /**
     * Loads the file, verifies the header and then loads the versioned JSON payload and returns it.
     *
     * @return {Promise:Object} - An object containing the versioned JSON payload.
     */
    async load() {
        // first, open the file up
        let sbuf = new ConsumableFile_1.ConsumableFile(this.path);
        await sbuf.open();
        // read/verify the header
        // technically, we *don't* need to do this, as _readData will aseek() to where data should begin,
        //   but we probably want to verify that it's an SBVJ01 file anyways; _readHeader() will throw if it isn't.
        await SBVJ01._readHeader(sbuf);
        const data = await SBVJ01._readData(sbuf);
        this.version = data.version;
        this.name = data.name;
        this.entity = data.entity;
        await sbuf.close();
        return data;
    }
    /**
     * Saves the current entity to disk, then reloads the currently loaded entity data.
     *
     * @return {Promise:Object} - An object containing the versioned JSON payload.
     */
    async save() {
        if (this.name === null) {
            throw new Error('An entity name must be specified before attempting to save an SBVJ01 file.');
        }
        // TODO: see if Starbound cares whether or not an entity's contents are null...
        //
        // if (this.entity === null) {
        //  throw new Error('Entity contents/data must be specified before attempting to save an SBVJ01 file.')
        // }
        let sbuf = new ExpandingFile_1.ExpandingFile(this.path);
        await sbuf.open();
        await SBVJ01._writeEntity(sbuf, this.name, this.version, this.entity);
        await sbuf.close();
        return this.load();
    }
}
exports.SBVJ01 = SBVJ01;
