class Song {
	constructor(obj) {
		obj = Object.assign({
			title: SONG_UNKNOWN,
			songNumber: -Date.now(),
			blocks: {},
			initialOrder: [],
			order: []
		}, obj);

		this.changeListener = [];

		this.title = obj.title;
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

		this.changeListener.forEach(fn => {
			fn('songId', this, old);
		});
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

	get hasLicense() {
		return false;
	}

	get license() {
		return '';
	}

	addSubscriber(fn) {
		this.changeListener.push(fn);
		return this;
	}

	hasBlock(type) {
		return Object.keys(type).includes(type);
	}

	setTitle(title) {
		let old = this.title;
		this.title = title;

		this.changeListener.forEach(fn => {
			fn('songTitle', this, old);
		});
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

		this.changeListener.forEach(fn => {
			fn('songBlockAdd', this, type);
		});

		return this;
	}

	removeBlock(type) {
		if(delete this.blocks[type]) {
			let filter = e => e !== type;

			this.initialOrder = this.initialOrder.filter(filter);
			this.order = this.order.filter(filter);

			this.changeListener.forEach(fn => {
				fn('songBlockRemove', this, type);
			});
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
		let song = new CCLISong();
		let rows = content.trim().split('\r\n');
		let duplicates = 0;

		song.title = rows.splice(0, 3).shift();
		song.account = parseInt(rows.pop().replace(/\D/g, ''));
		do {
			song.songNumber = rows.pop();
		} while(!song.songNumber.startsWith('CCLI-'));

		song.id = parseInt(song.songNumber.replace(/\D/g, ''));

		rows.join('\n').split('\n\n\n').forEach(block => {
			let row = block.split('\n').filter(e => e !== '');
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

	get hasLicense() {
		return this.id >= CUSTOM_NUMBER_LIMIT;
	}

	get license() {
		return Config.get('CCLISongnumber', 'CCLI-Liednummer') + ` ${this.id}<br />`
			+ Config.get('CCLILicensenumber', 'CCLI-Lizenznummer') + ` ${this.account}`;
	}

	exists() {
		return new Promise((resolve, reject) => {
			AJAX.get(`rest/SongExists/${this.id}`).then(({exists}) => {
				resolve({exists, song: this});
			}).catch(reject);
		});
	}

	upload(overwrite) {
		return new Promise((resolve, reject) => {
			let success = (song) => {
				//const {account, songNumber, title, initialOrder, order, blocks} = song;
				const {songNumber, title} = song;

				console.log(song);

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