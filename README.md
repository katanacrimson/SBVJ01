# SBVJ01

[![Build Status](https://travis-ci.org/damianb/SBVJ01.svg?branch=master)](https://travis-ci.org/damianb/SBVJ01)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/standard/standard)

## A node.js library for working with the "SBVJ01" format (Starbound Versioned JSON).

### What is SBVJ01?

SBVJ01 is a proprietary binary format wrapping around an "SBON" data structure created by ChuckleFish for the game Starbound.

For some documentation, see the reverse engineering notes on SBVJ01, [available here](https://github.com/blixt/py-starbound/blob/master/FORMATS.md#sbvj01).

### How do I install this library?

Ensure you have at least node.js v7.6+, and then...

``` bash
$ npm i -s damianb/SBVJ01
```

### How do I use this library?

In brief:

``` js
'use strict'
const SBVJ01 = require('SBVJ01')
const ConsumableBuffer = require('ConsumableBuffer')

const player = new SBVJ01('/path/to/file/00077a7a7f7c1237127837123.player')
player.load().then(async (data) => {
	console.dir(data)
	// ^ gives you a native JS representation of the entity that SBVJ01 just read.
})
```

Full library documentation is available in the repository under the /docs/ directory.
