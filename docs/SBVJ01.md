# SBVJ01

SBVJ01 is a class which abstracts and provides a solid library for parsing and working with SBVJ01 formatted entity files
 (usually found in Starbound .player files).

All methods are async functions that return promises. This entire library depends on async/await and thus requires node 7.6+.

## Usage

``` js
const SBVJ01  = require('SBVJ01')

// you can work with it like normal promises...
const filepath = '/path/to/00000000000a0a0a12093123.player'
let player = new SBVJ01(filepath)

player.load().then((contents) => {
	const { entity, name, version } = contents

	// version is the entity version (Starbound has lua which handles upconverting between entity versions),
	//   name is a string with the entity name (think type),
	//   and entity which contains the entire data structure.
	console.log(entity.data)
})

// or, with async/await...
// ...

let player = new SBVJ01(filepath)

const readPlayer = async (player) => {
	const { entity, name, version } = await player.load()

	// same as above
	console.log(entity.data)
}
readPlayer(player)
```

## Properties

### SBVJ01.version

An integer (specifically within Int32 range) identifying the version of the entity, or null if the entity is not versioned.

### SBVJ01.name

A UTF-8 string providing the name of the entity.

See also: /versioning/ directory within Starbound unpacked assets

### SBVJ01.entity

The data structure for the entity; should be compatible with SBON.writeDynamic, which should cover almost anything that can be expressed with JSON.

## Methods

### new SBVJ01(path)

SBVJ01 Constructor

* @param  {String} path - The filepath for the entity file we're going to work with.
* @return {SBVJ01}

See usage above.

### SBVJ01.load()

Loads the file, verifies the header and then loads the versioned JSON payload and returns it.

* @return {Promise:object} - An object containing the versioned JSON entity, the name of the entity, and the entity version.

``` js
async () => {
	const filepath = '/path/to/sbvj01/file.player'
	const player = new SBVJ01(filepath)
	const { entity, name, version } = await player.load()
	// you know have access to all the entity information. yay!
}
```

### SBVJ01.save()

Saves the current entity to disk, then reloads the currently loaded entity data.

* @return {Promise:object} - An object containing the versioned JSON payload.

``` js
	const filepath = '/path/to/sbvj01/file.player'
	const player = new SBVJ01(filepath)
	let { entity, name, version } = await player.load()
	player.entity.name = 'MyNewName'
	{ entity, name, version } = await player.save()
	// entity, name, version now contain the latest changes...as does the file.player file itself.
```
