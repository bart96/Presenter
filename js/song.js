const SONG_CUSTOM_NUMBER_LIMIT = 10000;
const SONG_SEPARATOR = '---';
const SONG_UNKNOWN_TITLE = 'UNKNOWN';
const SONG_UNKNOWN_AUTHOR = 'UNKNOWN';
const SONG_UNKNOWN_COPYRIGHT = '';

class Song {
	constructor(obj) {
		obj = Object.assign({
			title: SONG_UNKNOWN_TITLE,
			authors: SONG_UNKNOWN_AUTHOR,
			copyright: SONG_UNKNOWN_COPYRIGHT,
			songNumber: -Date.now(),
			blocks: {},
			initialOrder: [],
			order: []
		}, obj);

		this.changeListener = [];

		this.title = obj.title;
		this.authors = obj.authors;
		this.copyright = obj.copyright;
		this.songNumber = obj.songNumber;
		this.blocks = obj.blocks;
		this.initialOrder = obj.initialOrder;
		this.order = obj.order;
	}

	toJSON() {
		const obj = {... this};
		delete obj.changeListener;
		return obj;
	}

	set id(id) {
		const old = this.songNumber;
		this.songNumber = id;

		this.notify('songId', this, old);
	}

	get id() {
		return this.songNumber;
	}

	get text() {
		let text = [];

		this.order.forEach(order => {
			text = text.concat(this.blocks[order]);
		});

		return text;
	}

	get initialBlocks() {
		let blocks = {};

		this.initialOrder.forEach(order => {
			blocks[order] = [... this.blocks[order]];
		});

		return blocks;
	}

	get info() {
		const info = [];

		if(this.title === SONG_UNKNOWN_TITLE) {
			info.push(`<strong>(#${this.id})</strong>`);
		}
		else {
			info.push(`<strong>(#${this.id}) ${this.title}</strong>`);
		}

		if(this.authors !== SONG_UNKNOWN_AUTHOR) {
			info.push(`${Config.get('Authors', 'Autoren')}: ${this.authors}`);
		}

		if(this.copyright !== SONG_UNKNOWN_COPYRIGHT) {
			if(this.copyright.length > 300) {
				info.push(`<small>${this.copyright}</small>`);
			}
			else {
				info.push(this.copyright);
			}
		}

		return info;
	}

	addSubscriber(fn) {
		this.changeListener.push(fn);
		return this;
	}

	notify(message, ... params) {
		this.changeListener.forEach(fn => {
			fn(message, ... params);
		});
	}

	hasBlock(type) {
		return Object.keys(type).includes(type);
	}

	setTitle(title) {
		let old = this.title;
		this.title = title;

		this.notify('songTitle', this, old);
	}

	setAuthors(authors) {
		let old = this.authors;
		this.authors = authors;

		this.notify('authors', this, old);
	}

	setCopyright(copyright) {
		let old = this.copyright;
		this.copyright = copyright;

		this.notify('copyright', this, old);
	}

	setBlock(type, block) {
		if(!Array.isArray(block)) {
			throw new Error('"block" needs to be an array');
		}

		type = type.replaceAll(',', '');

		if(!this.initialOrder.includes(type)) {
			this.initialOrder.push(type);
		}

		this.blocks[type] = block;

		this.notify('songBlockAdd', this, type);

		return this;
	}

	removeBlock(type) {
		if(delete this.blocks[type]) {
			let filter = e => e !== type;

			this.initialOrder = this.initialOrder.filter(filter);
			this.order = this.order.filter(filter);

			this.notify('songBlockRemove', this, type);
		}

		return this;
	}

	saveOrder(order) {
		this.order = order;
		return this;
	}

	exists() {
		return new Promise((_, reject) => {
			reject('Child class needs to implement the method "exists"')
		});
	}

	upload() {
		return new Promise((_, reject) => {
			reject('child class needs to implement the method "upload"')
		});
	}
}

class CCLISong extends Song {
	static parse(content) {
		const song = new CCLISong();

		const blocks = content.trim().split('\r\n\r\nCCLI-');
		const text = blocks.shift();

		if(blocks.length === 1) {
			const info = blocks.shift();
			const rows = info.trim().split('\r\n');

			song.songNumber = parseInt(rows.shift().replace(/\D/g, ''));
			song.authors = rows.shift().trim();
			if(song.authors.toUpperCase() === SONG_UNKNOWN_AUTHOR) {
				song.authors = SONG_UNKNOWN_AUTHOR;
			}

			song.account = parseInt(rows.pop().replace(/\D/g, ''));
			const url = rows.pop().trim(); // url
			if(url !== 'www.ccli.com') {
				rows.push(url);
			}

			const licenseNotes = rows.pop().trim();
			if(!licenseNotes.includes('SongSelect®')) {
				rows.push(licenseNotes);
			}

			const copyright = [];
			while(!rows[0].startsWith('© ')) {
				rows.shift();
			}
			rows.forEach(row => {
				row = row.trim();
				if(row && !row.includes('Public Domain')) {
					copyright.push(row);
				}
			});

			song.copyright = copyright.join(' | ');
		}

		const rows = text.trim().split('\r\n');
		let duplicates = 0;

		song.title = rows.splice(0, 3).shift();

		rows.join('\n').split('\n\n\n').forEach(block => {
			const row = block.split('\n').filter(e => e !== '');
			let type = row.shift();

			if(song.initialOrder.includes(type)) {
				type += ` [${++duplicates}]`;
			}

			song.order.push(type);
			song.initialOrder.push(type);
			song.blocks[type] = row;
		});

		return song;
	}

	static download(songNumber) {
		return new Promise((resolve, reject) => {
			AJAX.get(`rest/Song/${songNumber}`).then(song => resolve(new CCLISong(song))).catch(reject);
		});
	}

	constructor(obj) {
		obj = Object.assign({
			account: Account.license,
		}, obj);

		super(obj);

		this.account = parseInt(obj.account);
	}

	get info() {
		let lines = super.info;

		if(this.id > SONG_CUSTOM_NUMBER_LIMIT) {
			lines.push(`${Config.get('CCLILicensenumber', 'CCLI-Lizenznummer')}: ${this.account}`);
		}

		return lines;
	}

	exists() {
		return new Promise((resolve, reject) => {
			AJAX.get(`rest/SongExists/${this.id}`).then(({exists, order}) => {
				if(exists) {
					this.order = order;
				}

				resolve({exists, song: this});
			}).catch(reject);
		});
	}

	upload(overwrite) {
		return new Promise((resolve, reject) => {
			let success = (song) => {
				//const {account, songNumber, title, initialOrder, order, blocks} = song;
				const {songNumber, title} = song;

				if(songNumber < 0 || isNaN(songNumber)) {
					reject('could not update song number properly', song);
				}
				else {
					this.id = parseInt(songNumber);

					if(Config.get('showSongUploadNotifications', true)) {
						Notification.success(`Song #${songNumber} "${title}" successfully uploaded`);
					}

					resolve(song);
				}
			};

			if(overwrite) {
				AJAX.put('rest/Song', this).then(success).catch(reject);
			}
			else {
				AJAX.post('rest/Song', this).then(success).catch(reject);
			}
		});
	}
}