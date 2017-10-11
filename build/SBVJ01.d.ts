import { ConsumableBuffer } from 'ConsumableBuffer';
import { ConsumableFile } from 'ConsumableFile';
import { ExpandingBuffer } from 'ExpandingBuffer';
import { ExpandingFile } from 'ExpandingFile';
export declare class SBVJ01 {
    path: string;
    version: number | null;
    name: string | null;
    entity: any;
    /**
     * SBVJ01 Constructor
     *
     * @param  {String} path - The filepath for the entity file we're going to work with.
     * @return {SBVJ01}
     */
    constructor(path: string);
    /**
     * Reads the header of a file and identifies if it is SBVJ01 format.
     * @access private
     *
     * @param {ConsumableBuffer|ConsumableFile} sbuf - The stream to read from.
     * @return {Promise:void}
     */
    static _readHeader(sbuf: ConsumableBuffer | ConsumableFile): Promise<void>;
    /**
     * Reads the versioned JSON object.
     * @access private
     *
     * @param  {ConsumableBuffer|ConsumableFile} sbuf - The stream to read from.
     * @return {Promise:Object} - An Object that contains the metadata and fileTable of the archive.
     */
    static _readData(sbuf: ConsumableBuffer | ConsumableFile): Promise<{
        [index: string]: any;
    }>;
    /**
     * Write the currently defined entity to the originally specified file location.
     *
     * @param  {ExpandingBuffer|ExpandingFile} sbuf - The stream to write to.
     * @param  {String} entityName - The name of the entity (think more in terms of an entity *class*).
     * @param  {Number|null} entityVersion - The version of the entity. Must be an integer.
     * @param  {mixed} entityData - The data payload to write for the entity.
     * @return {Promise:Number} - The return value of SBON.writeDynamic()
     */
    static _writeEntity(sbuf: ExpandingBuffer | ExpandingFile, entityName: string, entityVersion: number | null, entityData: any): Promise<number>;
    /**
     * Loads the file, verifies the header and then loads the versioned JSON payload and returns it.
     *
     * @return {Promise:Object} - An object containing the versioned JSON payload.
     */
    load(): Promise<{
        [index: string]: any;
    }>;
    /**
     * Saves the current entity to disk, then reloads the currently loaded entity data.
     *
     * @return {Promise:Object} - An object containing the versioned JSON payload.
     */
    save(): Promise<{
        [index: string]: any;
    }>;
}
