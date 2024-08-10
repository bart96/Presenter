const SONG_CUSTOM_NUMBER_LIMIT = 10000;
const SONG_SEPARATOR = '---';
const SONG_TRANSLATION_LINE_REGEX = /^\[(\w{2})] (.*)$/;
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
			info.push(`${Config.get('AUTHORS')}: ${this.authors}`);
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

	generateBlockName(type) {
		if(this.initialOrder.includes(type)) {
			let counter = 1;
			while(this.initialOrder.includes(`${type} [${counter}]`)) {
				counter++;
			}

			return `${type} [${counter}]`;
		}

		return type;
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
	static parse(content, filename) {
		const song = new CCLISong();

		// format 2023-07
		if(filename.endsWith('-lyrics.txt')) {
			const blocks = content.trim().split('\n\n');

			song.title = blocks.shift().trim();

			const info = blocks.pop().split('\n');
			song.authors = info.shift().trim();
			song.songNumber = parseInt(info.shift().replace(/\D/g, ''));
			song.account = parseInt(info.pop().replace(/\D/g, ''));

			const copyright = [];
			while(info[0] && !info[0].startsWith('© ')) {
				info.shift();
			}
			while(info[0] && !info[0].endsWith('www.ccli.com')) {
				const line = info.shift().trim();
				if(line && !line.includes('Public Domain')) {
					copyright.push(line);
				}
			}

			song.copyright = copyright.join(' | ');

			blocks.forEach(block => {
				const row = block.split('\n').filter(e => e !== '');
				let type = song.generateBlockName(row.shift());

				song.order.push(type);
				song.initialOrder.push(type);
				song.blocks[type] = row;
			});
		}
		else {
			const blocks = content.trim().split('\r\n\r\nCCLI-');
			const text = blocks.shift();

			if(blocks.length === 1) {
				const info = blocks.shift();
				const rows = info.trim().split('\r\n');

				song.songNumber = parseInt(rows.shift().replace(/\D/g, ''));
				song.authors = rows.shift().trim();

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
			song.title = rows.splice(0, 3).shift();

			rows.join('\n').split('\n\n\n').forEach(block => {
				const row = block.split('\n').filter(e => e !== '');
				let type = song.generateBlockName(row.shift());

				song.order.push(type);
				song.initialOrder.push(type);
				song.blocks[type] = row;
			});
		}

		if(song.authors.toUpperCase() === SONG_UNKNOWN_AUTHOR) {
			song.authors = SONG_UNKNOWN_AUTHOR;
		}

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
			lines.push(`${Config.get('CCLI_LICENSE_NUMBER')}: ${this.account}`);
		}

		return lines;
	}

	exists() {
		return new Promise((resolve, reject) => {
			if(Account.isLoggedIn) {
				AJAX.get(`rest/SongExists/${this.id}`).then(({exists, order}) => {
					if(exists) {
						this.order = order;
					}

					resolve({exists, song: this});
				}).catch(reject);
			}
			else {
				resolve({exists: false, song: this});
			}
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

					if(Config.get('SHOW_SONG_UPLOAD_NOTIFICATIONS')) {
						Notification.success(`Song #${songNumber} "${title}" successfully uploaded`);
					}

					resolve(song);
				}
			};

			if(Account.isLoggedIn) {
				if(overwrite) {
					AJAX.put('rest/Song', this).then(success).catch(reject);
				}
				else {
					AJAX.post('rest/Song', this).then(success).catch(reject);
				}
			}
			else {
				resolve(this);
			}
		});
	}
}