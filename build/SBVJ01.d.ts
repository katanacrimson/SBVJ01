import { ConsumableResource, ExpandingResource } from 'byteaccordion';
export declare class SBVJ01 {
    /**
     * The path to the SBVJ01-encoded file.
     *
     * @private
     */
    path: string;
    /**
     * The version of the SBVJ01-encoded entity. If null, versioning is not used.
     *   This should specifically be an Int32-compatible integer.
     */
    version: number | null;
    /**
     * The name of the SBVJ01-encoded entity.
     *   Note that this behaves more as an entity "class" than an individual entity name.
     */
    name: string | null;
    /**
     * The payload of the SBVJ01-encoded entity.
     */
    entity: any;
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
    constructor(path: string);
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
    static _readHeader(sbuf: ConsumableResource): Promise<void>;
    /**
     * Reads the versioned JSON object.
     *
     * @private
     *
     * @param  sbuf - The stream to read from.
     * @return {Promise<Object>} - An Object that contains the metadata and fileTable of the archive.
     */
    static _readData(sbuf: ConsumableResource): Promise<{
        [index: string]: any;
    }>;
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
    static _writeEntity(sbuf: ExpandingResource, entityName: string, entityVersion: number | null, entityData: any): Promise<number>;
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
    load(): Promise<{
        [index: string]: any;
    }>;
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
    save(): Promise<{
        [index: string]: any;
    }>;
}
