//
// SBVJ01 - JS library for working with Starbound Versioned JSON format.
//
// @copyright (c) 2018 Damian Bushong <katana@odios.us>
// @license MIT license
// @url <https://github.com/damianb/SBVJ01>
//

import {
  ConsumableFile,
  ExpandingFile,
  ConsumableResource,
  ExpandingResource
} from 'byteaccordion'
import { SBON } from 'sbon'

export class SBVJ01 {
  /**
   * The path to the SBVJ01-encoded file.
   *
   * @private
   */
  public path: string

  /**
   * The version of the SBVJ01-encoded entity. If null, versioning is not used.
   *   This should specifically be an Int32-compatible integer.
   */
  public version: number | null

  /**
   * The name of the SBVJ01-encoded entity.
   *   Note that this behaves more as an entity "class" than an individual entity name.
   */
  public name: string | null

  /**
   * The payload of the SBVJ01-encoded entity.
   */
  public entity: any

  /**
   * SBVJ01 Constructor
   *
   * @param  path - The filepath for the entity file we're going to work with.
   * @return {SBVJ01}
   *
   * @example
   * ```
   * import { SBVJ01 } from 'sbvj01'
   * const filepath = '/path/to/00000000000a0a0a12093123.player'
   * const player = new SBVJ01(filepath)
   *
   * const { entity, name, version } = await player.load()
   *
   * // version is the entity version (Starbound has lua which handles upconverting between entity versions),
   * //   name is a string with the entity name (think type),
   * //   and entity which contains the entire data structure.
   * ```
   */
  constructor (path: string) {
    this.path = path
    this.version = this.name = this.entity = null
  }

  /**
   * Reads the header of a file and identifies if it is SBVJ01 format.
   *
   * @private
   *
   * @throws {Error} - Throws when the provided file does not appear to be an SBVJ01-encoded file.
   *
   * @param  sbuf - The stream to read from.
   * @return {Promise<void>}
   */
  public static async _readHeader (sbuf: ConsumableResource): Promise<void> {
    // grab the first 6 bytes - this should be a standard SBVJ01 pak header
    // we'll compare it to what we expect to verify that this *is* an SBVJ01 file
    if (Buffer.compare(await sbuf.read(6), Buffer.from('SBVJ01')) !== 0) {
      throw new Error('File does not appear to be SBVJ01 format.')
    }
  }

  /**
   * Reads the versioned JSON object.
   *
   * @private
   *
   * @param  sbuf - The stream to read from.
   * @return {Promise<Object>} - An Object that contains the metadata and fileTable of the archive.
   */
  public static async _readData (sbuf: ConsumableResource): Promise<{ [index: string]: any }> {
    // ensure we're at the SBON object payload before trying to read it out
    await sbuf.aseek(6)

    // vJSON starts with the ent name, a single 0x01 byte, the version (a signed Int32BE), then the data structure
    const entityName = await SBON.readString(sbuf)

    const isVersioned = await sbuf.read(1)
    let entityVersion = null
    if (Buffer.compare(isVersioned, Buffer.from([0x01])) === 0) {
      entityVersion = (await sbuf.read(4)).readInt32BE(0)
    }
    const entityData = await SBON.readDynamic(sbuf)

    // grab and return what we've obtained
    return {
      name: entityName,
      entity: entityData,
      version: entityVersion
    }
  }

  /**
   * Write the currently defined entity to the originally specified file location.
   *
   * @private
   *
   * @throws {TypeError} - Throws when the entity version is not a proper integer or null.
   *
   * @param  sbuf - The resource to write to.
   * @param  entityName - The name of the entity (think more in terms of an entity *class*).
   * @param  entityVersion - The version of the entity. Must be an integer.
   * @param  entityData - The data payload to write for the entity.
   * @return {Promise<number>} - The return value of SBON.writeDynamic()
   */
  public static async _writeEntity (sbuf: ExpandingResource, entityName: string, entityVersion: number | null, entityData: any): Promise<number> {
    if ((typeof entityVersion !== 'number' || !Number.isInteger(entityVersion) || isNaN(entityVersion) || !isFinite(entityVersion)) && entityVersion !== null) {
      throw new TypeError('SBVJ01._writeEntity expects the provided entity version to be an integer or null.')
    }

    // write the header
    await sbuf.write('SBVJ01')

    // entity name followed by 0x01
    await SBON.writeString(sbuf, entityName)
    if (entityVersion !== null) {
      await sbuf.write([0x01])

      // version int32
      const versionBuffer = Buffer.alloc(4)
      versionBuffer.writeInt32BE(entityVersion, 0)
      await sbuf.write(versionBuffer)
    } else {
      await sbuf.write([0x00])
    }

    return SBON.writeDynamic(sbuf, entityData)
  }

  /**
   * Loads the file, verifies the header and then loads the versioned JSON payload and returns it.
   *
   * @return {Promise<Object>} - An object containing the versioned JSON payload.
   *
   * @example
   * ```
   * const filepath = '/path/to/sbvj01/file.player'
   * const player = new SBVJ01(filepath)
   * const { entity, name, version } = await player.load()
   *
   * // you know have access to all the entity information. yay!
   * ```
   */
  public async load (): Promise<{ [index: string]: any }> {
    // first, open the file up
    const sbuf = new ConsumableFile(this.path)
    await sbuf.open()

    // read/verify the header
    // technically, we *don't* need to do this, as _readData will aseek() to where data should begin,
    //   but we probably want to verify that it's an SBVJ01 file anyways; _readHeader() will throw if it isn't.
    await SBVJ01._readHeader(sbuf)

    const data = await SBVJ01._readData(sbuf)

    this.version = data.version
    this.name = data.name
    this.entity = data.entity

    await sbuf.close()

    return data
  }

  /**
   * Saves the current entity to disk, then reloads the currently loaded entity data.
   *
   * @return {Promise<Object>} - An object containing the versioned JSON payload.
   *
   * @throws {Error} - Throws if no entity name was ever specified.
   *
   * @example
   * ```
   * const filepath = '/path/to/sbvj01/file.player'
   * const player = new SBVJ01(filepath)
   * let { entity, name, version } = await player.load()
   *
   * player.entity.name = 'MyNewName'
   *
   * { entity, name, version } = await player.save()
   * // entity, name, version now contain the latest changes...as does the file.player file itself.
   * ```
   */
  public async save (): Promise<{ [index: string]: any }> {
    if (this.name === null) {
      throw new Error('An entity name must be specified before attempting to save an SBVJ01 file.')
    }

    // TODO: see if Starbound cares whether or not an entity's contents are null...
    //
    // if (this.entity === null) {
    //  throw new Error('Entity contents/data must be specified before attempting to save an SBVJ01 file.')
    // }

    const sbuf = new ExpandingFile(this.path)

    await sbuf.open()
    await SBVJ01._writeEntity(sbuf, this.name, this.version, this.entity)
    await sbuf.close()

    return this.load()
  }
}
