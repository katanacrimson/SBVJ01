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

## Methods

### new SBVJ01(path)

SBVJ01 Constructor

* @param  {String} path - The filepath for the entity file we're going to work with.
* @return {SBVJ01}

See usage above.

### SBVJ01.load()

Loads the file, verifies the header and then loads the versioned JSON payload and returns it.
This is a convenience method for the common workflow of loading the file.

* @return {Promise:object} - An object containing the versioned JSON entity, the name of the entity, and the entity version.

``` js
async () => {
	const filepath = '/path/to/sbvj01/file.player'
	const player = new SBVJ01(filepath)
	const { entity, name, version } = await player.load()
	// you know have access to all the entity information. yay!
}
```
