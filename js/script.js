class Storage extends Storable {
	constructor() {
		super('data', {
			version: '1.0',
			songs: {},
			order: []
		});

		this.subscribers = [];
	}

	convert(data) {
		switch(data.version) {
			case '1.0':
				this.data.version = data.version;

				for(let i in data.songs) {
					let song = new CCLISong(data.songs[i]);
					song.addSubscriber((... params) => this.changeSong(... params));
					this.data.songs[i] = song;
				}

				for(let i in data.order) {
					this.data.order.push(data.order[i]);
					this.notifySubscriber('addSong', this.data.songs[data.order[i]]);
				}
				break;
			default:
				throw new Error('Version is invalid');
		}
	}

	validData() {
		return this.data && this.data.songs && Object.keys(this.data.songs).length > 0;
	}

	get songs() {
		return Object.values(this.data.songs).sort((a, b) => {
			return a.title - b.title;
		});
	}

	has({id}) {
		if(id) {
			return this.data.songs[id];
		}

		return false;
	}

	addSubscriber(fn) {
		if(fn) {
			this.subscribers.push(fn);
		}

		return this;
	}

	notifySubscriber() {
		this.subscribers.forEach(fn => fn(... arguments));
	}

	get changeHandler() {
		return (type, ... params) => {
			switch(type) {
				case 'newSong':
				case 'downloadSong':
					this.addSong(... params);
					break;
				case 'removeSong':
					this.removeSong(... params);
					break;
				case 'songOrder':
					this.songOrder(... params);
					break;
				case 'uploadShow':
					this.uploadShow(... params);
					break;
				case 'downloadShow':
					this.downloadShow(... params);
					break;
				case 'deleteShow':
					this.deleteShow(... params);
					break;
				//default: console.log(type);
			}
		};
	}

	addSong(song) {
		this.data.order.push(song.id);

		if(!(song instanceof Song) && this.has(song)) {
			song = this.data.songs[song.id];
		}
		else {
			this.data.songs[song.id] = song;
			song.addSubscriber((... params) => this.changeSong(... params));
		}

		this.notifySubscriber('addSong', song);
		this.save();

		return song;
	}

	changeSong(type, song, value) {
		switch(type) {
			case 'songId':
				this.data.order = this.data.order.map(o => o === value ? song.id : o);

				delete this.data.songs[value];
				this.data.songs[song.id] = song;

				this.save();
				break;
			default:
				//console.log(type, song, value);
		}

		this.notifySubscriber('changeSong', song, value);

		return song;
	}

	removeSong(index, song) {
		if(index < 0 || index >= this.data.order.length || !this.data.songs[song.id]) {
			return song;
		}

		song = this.data.songs[song.id];

		let number = this.data.order.splice(index, 1).pop();
		if(!this.data.order.includes(number)) {
			this.notifySubscriber('removeSong', song);
			delete this.data.songs[song.id];
		}

		return song;
	}

	songOrder(order) {
		this.data.order = order;
	}

	uploadShow({title}) {
		if(this.data.order.length < 1) {
			Notification.error('You\'ll need to add a song first');
			return;
		}

		AJAX.post('rest/Shows', {
			title: title,
			order: this.data.order
		})
		.then(e => Notification.success(e))
		.catch(e => Notification.error(e));
	}

	downloadShow(show) {
		let order = show.order.filter(songNumber => songNumber > 0);
		this.notifySubscriber('clearSongs');
		this.data.order = [];
		this.data.songs = {};

		let songs = Array.from(new Set(order));

		const downloadJob = _ => {
			if(songs.length < 1) {
				order.forEach(id => {
					if(this.has({id})) {
						this.addSong({id: id});
					}
				});

				this.save();
				return;
			}

			CCLISong.download(songs.shift()).then(song => {
				this.data.songs[song.id] = song;
				downloadJob();
			}).catch(e => {
				Notification.error(e);
				downloadJob();
			});
		}

		downloadJob();
	}

	deleteShow({title}) {
		AJAX.delete(`rest/Shows/`, {title}).catch(e => Notification.error(e));
	}
}

const Modal = new class {
	constructor() {
		this.isActive = false;
		this.modal = new element('div').class('modal');
		this.callback = null;

		new element('div').class('background').parent(this.modal).ignore('contextmenu');
		this.container = new element('div').class('container').parent(this.modal).ignore('contextmenu');
		let header = new element('header').parent(this.container);
		this.content = new element('div').class('content').parent(this.container);
		this.footer = new element('footer').parent(this.container);

		this.title = new element('h2').parent(header);
		new element('button').html('&times;').parent(header).on('click', _ => {
			this.close();
		});

		this.apply = new element('button').type('submit').text('OK').on('click', _ => {
			if(this.callback) {
				if(this.callback() === false) {
					return;
				}
			}

			this.close();
		})

		document.addEventListener("DOMContentLoaded", _ => {
			document.body.insertBefore(this.modal.element, document.body.firstChild);
		});
	}

	show(title, element, hideFooter) {
		this.isActive = true;
		this.title.text(title);
		this.callback = null;
		this.content.removeClass('resizable').height('auto').clear();
		this.footer.style('display', hideFooter ? 'none' : 'flex');

		this.footer.clear();
		this.apply.parent(this.footer);

		this.content.appendChild(element);
		this.modal.class('show');

		return this;
	}

	close() {
		this.isActive = false;
		this.modal.classList.remove('show');
	}

	onApply(fn) {
		this.callback = fn;
		return this;
	}

	width(width) {
		if(width.endsWith('px') && parseInt(width.slice(0, -2)) > window.innerWidth) {
			width = `${window.innerWidth}px`;
		}

		this.container.width(width);
		return this;
	}

	height(height) {
		if(height.endsWith('px') && parseInt(height.slice(0, -2)) > window.innerHeight) {
			height = `${window.innerHeight}px`;
		}

		this.content.height(height);
		return this;
	}

	resizable(initialHeight) {
		this.content.class('resizable');

		if(initialHeight) {
			this.height(initialHeight);
		}

		return this;
	}

	foot(... elements) {
		this.footer.clear();

		elements.forEach(element => {
			element.parent(this.footer);
		});

		return this;
	}
}

const Account = new class {
	constructor() {
		this.isLoggedIn = false;
		this.subscribers = [];
		this.data = Object.assign({
			mail: '',
			license: 0
		}, JSON.parse(localStorage.getItem('account') || '{}'));

		if(this.data.mail && this.data.license) {
			this.request();
		}
	}

	get license() {
		return this.data.license;
	}

	addSubscriber(fn) {
		if(fn) {
			this.subscribers.push(fn);
		}

		return this;
	}

	notifySubscriber(... params) {
		this.subscribers.forEach(fn => fn(... params));
	}

	request(success) {
		AJAX.post('rest/Session/', this.data).then(r => {
			this.isLoggedIn = true;
			localStorage.setItem('account', JSON.stringify(this.data));

			if(success) {
				success(r);
			}

			this.notifySubscriber('login', this.isLoggedIn);
		}).catch(e => {
			this.isLoggedIn = false;
			Notification.error(e);

			this.notifySubscriber('login', this.isLoggedIn);
		});
	}

	login() {
		let wrapper = new element('form').class('login');
		let mail = new element('input').type('mail').name('mail').placeholder('Mail ...').value(this.data.mail).parent(wrapper);
		let license = new element('input').type('text').name('license').placeholder('CCLI License ...').value(this.data.license).parent(wrapper);

		Modal.show('Login', wrapper).width('400px').onApply(_ => {
			this.data = {
				mail: mail.value().trim(),
				license: parseInt(license.value().trim()) || 0
			};

			this.request(e => {
				Notification.success(e);
				Modal.close();
			});
		});
	}
}

const Notification = new class extends Loadable {
	constructor() {
		super();
		this.container = new element('ul').id('alerts');

		this.addOnLoadListener(_ => {
			this.container.parent(document.body);
		});
	}

	message(message, type) {
		while(this.container.children.length > Config.get('NOTIFICATION_COUNT')) {
			this.container.popChild();
		}

		if(typeof message !== 'string') {
			if(message.message) {
				message = message.message;
			}
			else {
				message = JSON.stringify(message);
			}
		}

		let alert = new element('div').class('alert', type).text(message).parent(this.container).attribute('data-created', Date.now());
		new element('button').type('button').text('×').tooltip('close').parent(alert).on('click', _ => {
			alert.remove();
		});

		setTimeout(_ => {
			alert.remove();
		}, Config.get('NOTIFICATION_DISAPPEAR_TIME'));
	}

	success(message) {
		this.message(message, 'success');
	}

	warning(message) {
		this.message(message, 'warning');
	}

	error(message) {
		this.message(message, 'error');
	}
}

/**
 * @typedef { 'AUTHORS' | 'CCLI_LICENSE_NUMBER' | 'CONFIRM_PAGE_LEAVE' | 'CONFIRM_SHOW_DELETION' |
 * 'CONFIRM_SHOW_OVERWRITE' | 'CONFIRM_SONG_DELETE' | 'DEFAULT_NEW_VERSE_NAME' | 'DEFAULT_VERSE_NAME' |
 * 'HEADLINE_SMOOTH_SCROLL_BEHAVIOUR' | 'HIDE_MOUSE' | 'NOTIFICATION_COUNT' |
 * 'NOTIFICATION_DISAPPEAR_TIME' | 'OVERRIDE_SONG_BY_IMPORT' | 'POPUP_HEIGHT' |
 * 'POPUP_LEFT' | 'POPUP_MARGIN' | 'POPUP_PADDING' | 'POPUP_TOP' | 'POPUP_WIDTH' |
 * 'RELOAD_SONG_AFTER_EDIT' | 'RESET_BLACK_ON_SONG_SWITCH' | 'SHOW_HIDE_MOUSE' |
 * 'SHOW_LIMIT' | 'SHOW_NEXT_LINE_PREVIEW' | 'SHOW_NEXT_LINE_PREVIEW_TRANSLATION' |
 * 'SHOW_PREVIEW' | 'SHOW_REMOVE_SONG_FROM_DATABASE' | 'SHOW_SAVE_FORMAT' |
 * 'SHOW_SONG_UPLOAD_NOTIFICATIONS' | 'SHOWN_TRANSLATIONS' | 'SHRINK_SIDEBAR' |
 * 'SONG_CLICK_BEHAVIOUR' | 'SONG_OVERVIEW_ORDER' | 'THEME' | 'TOUCH_DURATION' |
 * 'USE_ARROWS_FOR_MOVING_BETWEEN_BLOCKS' | 'USE_ARROWS_FOR_MOVING_BETWEEN_LINES' |
 * 'VERSE_CLICK_BEHAVIOUR' } ConfigKey
 */

const Config = new class extends Storable {
	/**
	 * @type {Object.<ConfigKey, any>}
	 */
	options = {
		AUTHORS: 'Autoren',
		CCLI_LICENSE_NUMBER: 'CCLI-Lizenznummer',
		CONFIRM_PAGE_LEAVE: [true, false],
		CONFIRM_SHOW_DELETION: [true, false],
		CONFIRM_SHOW_OVERWRITE: [true, false],
		CONFIRM_SONG_DELETE: [true, false],
		DEFAULT_NEW_VERSE_NAME: 'Outro',
		DEFAULT_VERSE_NAME: 'Vers 1',
		HEADLINE_SMOOTH_SCROLL_BEHAVIOUR: [false, true],
		HIDE_MOUSE: [true, false],
		NOTIFICATION_COUNT: 4,
		NOTIFICATION_DISAPPEAR_TIME: 3500,
		OVERRIDE_SONG_BY_IMPORT: [false, true],
		POPUP_HEIGHT: 350,
		POPUP_LEFT: 0,
		POPUP_MARGIN: '1vw 0 .5vw',
		POPUP_PADDING: '20px 0',
		POPUP_TOP: 0,
		POPUP_WIDTH: 450,
		RELOAD_SONG_AFTER_EDIT: [false, true],
		RESET_BLACK_ON_SONG_SWITCH: [false, true],
		SHOW_HIDE_MOUSE: [false, true],
		SHOW_LIMIT: 10,
		SHOW_NEXT_LINE_PREVIEW: [true, false],
		SHOW_NEXT_LINE_PREVIEW_TRANSLATION: [true, false],
		SHOW_PREVIEW: [false, true],
		SHOW_REMOVE_SONG_FROM_DATABASE: [false, true],
		SHOW_SAVE_FORMAT: 'Show {dd}.{MM}.{yyyy}',
		SHOW_SONG_UPLOAD_NOTIFICATIONS: [true, false],
		SHOWN_TRANSLATIONS: 'none',
		SHRINK_SIDEBAR: [false, true],
		SONG_CLICK_BEHAVIOUR: ['dblclick', 'click'],
		SONG_OVERVIEW_ORDER: ['lexicographic', 'numeric'],
		THEME: ['boxed', 'list', 'calibration'],
		TOUCH_DURATION: 300,
		USE_ARROWS_FOR_MOVING_BETWEEN_BLOCKS: [true, false],
		USE_ARROWS_FOR_MOVING_BETWEEN_LINES: [true, false],
		VERSE_CLICK_BEHAVIOUR: ['dblclick', 'click']
	};

	constructor() {
		super('config', {});
	}

	/**
	 * @param {ConfigKey} key
	 * @returns {*}
	 */
	get(key) {
		const defaultValue = Array.isArray(this.options[key]) ? this.options[key][0] : this.options[key];

		if(typeof defaultValue === 'boolean' && typeof this.data[key] !== 'boolean') {
			return this.data[key] === 'true';
		}

		return this.data[key] === undefined ? defaultValue : this.data[key];
	}

	/**
	 * @param {ConfigKey} key
	 * @param value
	 * @returns {this}
	 */
	set(key, value) {
		const defaultValue = Array.isArray(this.options[key]) ? this.options[key][0] : this.options[key];

		if(value === '' || value === undefined) {
			this.data[key] = defaultValue;
		}
		else {
			switch(typeof defaultValue) {
				case 'number':
					this.data[key] = parseFloat(value.replace(/[^-+\d.]+|(?<=\..*)\./g, '') || 0);
					break;
				case 'boolean':
					this.data[key] = typeof value === 'boolean' ? value : value === 'true';
					break;
				default:
					this.data[key] = value;
			}
		}

		return this;
	}

	remove(item) {
		delete this.data[item];
		return this;
	}

	forEach(fn) {
		Object.keys(this.data).sort(Intl.Collator().compare).forEach(key => {
			fn(this.data[key], key, this.data, this.options[key]);
		});
	}

	convert(data) {
		this.data = {};

		for(const [key, value] of Object.entries(this.options)) {
			this.data[key] = data[key] ?? (Array.isArray(value) ? value[0] : value);
		}
	}

	load() {
		super.load();

		if(this.get('HIDE_MOUSE')) {
			document.body.classList.add('hide-mouse');
		}
		if(!this.get('SHOW_PREVIEW')) {
			document.body.classList.add('hide-preview');
		}

		const translations = this.get('SHOWN_TRANSLATIONS');

		if(translations !== 'none') {
			const style = new element('style').parent(document.head);

			this.get('SHOWN_TRANSLATIONS').split(',').forEach(language => {
				style.appendCSSRule(`p.translation.language.language_${language} {display: block}`);
			});
		}
	}
}

const PopUp = new class extends Loadable {
	constructor() {
		super();

		this.loadListener = [];
		this.changeListener = [];
		this.popup = null;

		this.addOnLoadListener(_ => {
			document.body.setAttribute('data-loaded', `${Date.now()}`);
		});
	}

	get inactive() {
		return !this.popup || this.popup.closed;
	}

	show() {
		if(this.inactive) {
			const params = Object.entries({
				scrollbars: 'no',
				resizable: 'no',
				status: 'no',
				location: 'no',
				toolbar: 'no',
				menubar: 'no',
				fullscreen: 'yes',
				top: Config.get('POPUP_TOP'),
				left: Config.get('POPUP_LEFT'),
				width: Config.get('POPUP_WIDTH'),
				height: Config.get('POPUP_HEIGHT')
			}).map(x => x.join('=')).join(',');

			this.popup = window.open('', '_blank', params);

			if(this.popup) {
				this.popup.document.open();
				// base64 content of view.php
				this.popup.document.write(atob('PCFET0NUWVBFIGh0bWw+DQo8aHRtbCBsYW5nPSJlbiI+DQo8aGVhZD4NCgk8bWV0YSBjaGFyc2V0PSJVVEYtOCI+DQoJPHRpdGxlPlByZXNlbnRlcjwvdGl0bGU+DQoNCgk8bGluayByZWw9InN0eWxlc2hlZXQiIGhyZWY9ImNzcy9zdHlsZS5jc3MiIG1lZGlhPSJhbGwiPg0KCTxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0iY3NzL2JhY2tncm91bmQuY3NzIiBtZWRpYT0iYWxsIj4NCgk8c3R5bGU+DQoJCWJvZHk6ZnVsbHNjcmVlbi5oaWRlLW1vdXNlIHsNCgkJCWN1cnNvcjogbm9uZTsNCgkJfQ0KDQoJCWJvZHkuaGlkZS1iYWNrZ3JvdW5kICNiYWNrZ3JvdW5kIHsNCgkJCW9wYWNpdHk6IDA7DQoJCX0NCg0KCQlib2R5LmhpZGUtcHJldmlldyAjY29udGVudCBwLnByZXZpZXcgew0KCQkJZGlzcGxheTogbm9uZTsNCgkJfQ0KDQoJCSNjb250ZW50IGJ1dHRvbiB7DQoJCQltYXJnaW4tdG9wOiAzMHZoOw0KCQkJcGFkZGluZzogMTBweCAxNXB4Ow0KCQkJZm9udC1zaXplOiA0dnc7DQoJCQlib3JkZXItcmFkaXVzOiAxNXB4Ow0KCQkJY29sb3I6IHZhcigtLWJyaWdodCk7DQoJCQliYWNrZ3JvdW5kOiB2YXIoLS1wcmltYXJ5KTsNCgkJCXZlcnRpY2FsLWFsaWduOiBtaWRkbGU7DQoJCQljdXJzb3I6IHBvaW50ZXI7DQoJCX0NCg0KCQkjY29udGVudCBidXR0b246aG92ZXIgew0KCQkJYmFja2dyb3VuZDogdmFyKC0taGlnaGxpZ2h0KTsNCgkJfQ0KCTwvc3R5bGU+DQo8L2hlYWQ+DQo8Ym9keT4NCgk8ZGl2IGlkPSJiYWNrZ3JvdW5kIj48L2Rpdj4NCgk8ZGl2IGlkPSJjb250ZW50Ij4NCgkJPGJ1dHRvbiB0eXBlPSJidXR0b24iPkFjdGl2YXRlIEZ1bGxzY3JlZW48L2J1dHRvbj4NCgk8L2Rpdj4NCg0KCTxzY3JpcHQ+DQoJCWNvbnN0IGNvbnRlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY29udGVudCcpOw0KCQljb25zdCBidXR0b24gPSBjb250ZW50LnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbicpOw0KCQlidXR0b24ub25jbGljayA9IF8gPT4gew0KCQkJZG9jdW1lbnQuYm9keS5yZXF1ZXN0RnVsbHNjcmVlbigpOw0KCQkJYnV0dG9uLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoYnV0dG9uKTsNCgkJfTsNCg0KCQljb25zdCByZXF1ZXN0RnVsbHNjcmVlbiA9ICgpID0+IHsNCgkJCWRvY3VtZW50LmJvZHkucmVxdWVzdEZ1bGxzY3JlZW4oKTsNCgkJCWlmKGJ1dHRvbi5wYXJlbnRFbGVtZW50KSB7DQoJCQkJYnV0dG9uLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoYnV0dG9uKTsNCgkJCX0NCgkJfTsNCg0KCQlkb2N1bWVudC5vbmtleWRvd24gPSAoZSkgPT4gew0KCQkJc3dpdGNoKGUuY29kZSkgew0KCQkJCWNhc2UgJ0tleUYnOg0KCQkJCQlpZighd2luZG93LmZ1bGxTY3JlZW4pIHsNCgkJCQkJCXJlcXVlc3RGdWxsc2NyZWVuKCk7DQoJCQkJCX0NCgkJCQkJYnJlYWs7DQoJCQl9DQoJCX07DQoNCgkJZG9jdW1lbnQuYm9keS5vbmRibGNsaWNrID0gXyA9PiB7DQoJCQlpZih3aW5kb3cuZnVsbFNjcmVlbikgew0KCQkJCWRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7DQoJCQl9DQoJCQllbHNlIHsNCgkJCQlyZXF1ZXN0RnVsbHNjcmVlbigpOw0KCQkJfQ0KCQl9Ow0KDQoJCWRvY3VtZW50LmJvZHkub25jb250ZXh0bWVudSA9IGUgPT4gew0KCQkJaWYod2luZG93LmZ1bGxTY3JlZW4gJiYgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoJ2hpZGUtbW91c2UnKSkgew0KCQkJCWUucHJldmVudERlZmF1bHQoKTsNCgkJCQllLnN0b3BQcm9wYWdhdGlvbigpOw0KCQkJfQ0KCQl9DQoNCgkJbGV0IHJlc2l6ZUhhbmRsZXJUaW1lb3V0ID0gZmFsc2U7DQoJCXdpbmRvdy5yZXNpemVIYW5kbGVyID0gbnVsbDsNCgkJZG9jdW1lbnQuYm9keS5vbnJlc2l6ZSA9IF8gPT4gew0KCQkJaWYod2luZG93LnJlc2l6ZUhhbmRsZXIpIHsNCgkJCQlpZihyZXNpemVIYW5kbGVyVGltZW91dCAhPT0gZmFsc2UpIHsNCgkJCQkJY2xlYXJUaW1lb3V0KHJlc2l6ZUhhbmRsZXJUaW1lb3V0KTsNCgkJCQl9DQoNCgkJCQlyZXNpemVIYW5kbGVyVGltZW91dCA9IHNldFRpbWVvdXQoXyA9PiB7DQoJCQkJCXdpbmRvdy5yZXNpemVIYW5kbGVyKHsNCgkJCQkJCXBvcHVwVG9wOiB3aW5kb3cuc2NyZWVuWSwNCgkJCQkJCXBvcHVwTGVmdDogd2luZG93LnNjcmVlblgsDQoJCQkJCQlwb3B1cFdpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aCwNCgkJCQkJCXBvcHVwSGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQNCgkJCQkJfSk7DQoNCgkJCQkJcmVzaXplSGFuZGxlclRpbWVvdXQgPSBmYWxzZTsNCgkJCQl9LCA5MDApOw0KCQkJfQ0KCQl9DQoNCgkJbGV0IGN1cnJlbnRBY3RpdmUgPSBudWxsOw0KCQl3aW5kb3cuaGFuZGxlciA9ICh0eXBlLCBjYWxsYmFjaywgLi4uIHBhcmFtcykgPT4gew0KCQkJc3dpdGNoKHR5cGUpIHsNCgkJCQljYXNlICdhY3RpdmUnOg0KCQkJCQlpZihjdXJyZW50QWN0aXZlICE9PSBwYXJhbXNbMF0pIHsNCgkJCQkJCWN1cnJlbnRBY3RpdmUgPSBwYXJhbXNbMF07DQoJCQkJCQljb25zdCBwcmV2aWV3ID0gcGFyYW1zWzFdOw0KDQoJCQkJCQl3aGlsZShjb250ZW50LmZpcnN0RWxlbWVudENoaWxkKSB7DQoJCQkJCQkJY29udGVudC5yZW1vdmVDaGlsZChjb250ZW50LmZpcnN0RWxlbWVudENoaWxkKTsNCgkJCQkJCX0NCg0KCQkJCQkJY29udGVudC5zdHlsZS5vcGFjaXR5ID0gY3VycmVudEFjdGl2ZS5jbGFzc0xpc3QuY29udGFpbnMoJ2NvcHlyaWdodCcpID8gJzAnIDogJyc7DQoJCQkJCQljb250ZW50LmNsYXNzTmFtZSA9IGN1cnJlbnRBY3RpdmUuY2xhc3NOYW1lOw0KDQoJCQkJCQlBcnJheS5mcm9tKGN1cnJlbnRBY3RpdmUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3AnKSkuZm9yRWFjaChjaGlsZCA9PiB7DQoJCQkJCQkJY29udGVudC5hcHBlbmQoY2hpbGQuY2xvbmVOb2RlKHRydWUpKTsNCgkJCQkJCX0pOw0KDQoJCQkJCQlpZihwcmV2aWV3KSB7DQoJCQkJCQkJcHJldmlldy5mb3JFYWNoKGxpbmUgPT4gew0KCQkJCQkJCQlsaW5lLmNsYXNzTGlzdC5hZGQoJ3ByZXZpZXcnKTsNCgkJCQkJCQkJY29udGVudC5hcHBlbmQobGluZSk7DQoJCQkJCQkJfSk7DQoJCQkJCQl9DQoNCgkJCQkJCWNvbnN0IGlzQmxhY2sgPSBjb250ZW50LmNsYXNzTGlzdC5jb250YWlucygnaGlkZS10ZXh0Jyk7DQoJCQkJCQlpZihpc0JsYWNrKSB7DQoJCQkJCQkJY29udGVudC5jbGFzc0xpc3QuYWRkKCdoaWRlLXRleHQnKTsNCgkJCQkJCX0NCgkJCQkJfQ0KCQkJCQlicmVhazsNCgkJCQljYXNlICdzb25nJzoNCgkJCQkJZG9jdW1lbnQuYm9keS5pZCA9IGBzb25nXyR7cGFyYW1zWzBdfWA7DQoJCQkJCWJyZWFrOw0KCQkJCWNhc2UgJ3RvZ2dsZVZpc2liaWxpdHknOg0KCQkJCQljYWxsYmFjayhwYXJhbXNbMF0sIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnRvZ2dsZShgaGlkZS0ke3BhcmFtc1swXX1gKSk7DQoJCQkJCWJyZWFrOw0KCQkJCWNhc2UgJ3Zpc2liaWxpdHknOg0KCQkJCQlpZihwYXJhbXNbMV0pIHsNCgkJCQkJCWRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZChgaGlkZS0ke3BhcmFtc1swXX1gKTsNCgkJCQkJfQ0KCQkJCQllbHNlIHsNCgkJCQkJCWRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShgaGlkZS0ke3BhcmFtc1swXX1gKTsNCgkJCQkJfQ0KCQkJCQlicmVhazsNCgkJCQljYXNlICdtYXJnaW4nOg0KCQkJCQljb250ZW50LnN0eWxlLm1hcmdpbiA9IHBhcmFtc1swXTsNCgkJCQkJYnJlYWs7DQoJCQkJY2FzZSAncGFkZGluZyc6DQoJCQkJCWNvbnRlbnQuc3R5bGUucGFkZGluZyA9IHBhcmFtc1swXTsNCgkJCQkJYnJlYWs7DQoJCQkJY2FzZSAndHJhbnNsYXRpb25zJzoNCgkJCQkJY29uc3QgdHJhbnNsYXRpb25zID0gcGFyYW1zWzBdOw0KDQoJCQkJCWlmKHRyYW5zbGF0aW9ucyAhPT0gJ25vbmUnKSB7DQoJCQkJCQljb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7DQoJCQkJCQlkb2N1bWVudC5oZWFkLmFwcGVuZChzdHlsZSk7DQoNCgkJCQkJCXRyYW5zbGF0aW9ucy5zcGxpdCgnLCcpLmZvckVhY2gobGFuZ3VhZ2UgPT4gew0KCQkJCQkJCXN0eWxlLnNoZWV0Lmluc2VydFJ1bGUoDQoJCQkJCQkJCWBwLnRyYW5zbGF0aW9uLmxhbmd1YWdlLmxhbmd1YWdlXyR7bGFuZ3VhZ2V9IHtkaXNwbGF5OiBibG9ja31gLA0KCQkJCQkJCQlzdHlsZS5zaGVldC5jc3NSdWxlcy5sZW5ndGgNCgkJCQkJCQkpOw0KCQkJCQkJfSk7DQoJCQkJCX0NCgkJCQkJYnJlYWs7DQoJCQkJY2FzZSAnY2xvc2luZyc6DQoJCQkJCWxldCBjb3VudGVyID0gNDA7DQoJCQkJCWNvbnN0IHBhcmVudExvYWRlZCA9IHBhcmFtc1swXTsNCgkJCQkJY29uc3Qgam9iID0gc2V0SW50ZXJ2YWwoXyA9PiB7DQoJCQkJCQl0cnkgew0KCQkJCQkJCWNvbnN0IGxvYWRlZCA9IHNlbGYub3BlbmVyLmRvY3VtZW50LmJvZHkuZ2V0QXR0cmlidXRlKCdkYXRhLWxvYWRlZCcpOw0KDQoJCQkJCQkJaWYocGFyZW50TG9hZGVkICE9PSBsb2FkZWQpIHsNCgkJCQkJCQkJd2luZG93LmNsb3NlKCk7DQoJCQkJCQkJfQ0KDQoJCQkJCQkJaWYoY291bnRlci0tIDwgMCkgew0KCQkJCQkJCQljbGVhckludGVydmFsKGpvYik7DQoJCQkJCQkJfQ0KCQkJCQkJfSBjYXRjaChlKSB7DQoJCQkJCQkJd2luZG93LmNsb3NlKCk7DQoJCQkJCQl9DQoJCQkJCX0sIDUwMCk7DQoJCQkJCWJyZWFrOw0KCQkJCWRlZmF1bHQ6DQoJCQkJCWNvbnNvbGUubG9nKHR5cGUsIC4uLiBwYXJhbXMpOw0KCQkJfQ0KCQl9DQoNCgkJd2luZG93Lm9uZXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlLCBzb3VyY2UsIGxpbmVubywgY29sbm8pIHsNCgkJCUFKQVgucG9zdCgncmVzdC9Mb2cnLCB7DQoJCQkJbWVzc2FnZTogYCR7c291cmNlfVske2xpbmVub306JHtjb2xub31dIC0gJHttZXNzYWdlfWANCgkJCX0pLmNhdGNoKGUgPT4gY29uc29sZS5lcnJvcihlKSk7DQoJCX0NCgk8L3NjcmlwdD4NCjwvYm9keT4NCjwvaHRtbD4='));
				this.popup.document.close();

				this.popup.onload = _ => {
					this.popup.resizeHandler = size => {
						for(const [key, value] of Object.entries(size)) {
							Config.set(key, value);
						}
					}

					this.loadListener.forEach(fn => fn(this.send));
				}
			}
		}

		return this;
	}

	onLoad(fn) {
		if(fn) {
			this.loadListener.push(fn);
		}

		return this;
	}

	onChange(fn) {
		if(fn) {
			this.changeListener.push(fn);
		}

		return this;
	}

	focus() {
		if(!this.inactive) {
			this.popup.focus();
		}

		return this;
	}

	close() {
		if(!this.inactive) {
			this.popup.close();
		}

		return this;
	}

	send(message, ... params) {
		if(!this.inactive) {
			this.popup.handler(message, (... params) => {
				this.changeListener.forEach(listener => {
					listener(message, ... params);
				});
			}, ... params);
		}

		return this;
	}
}

class GUI extends Loadable {
	constructor(rootElement) {
		if(!rootElement) {
			throw new Error('missing "rootElement"');
		}

		super();
		this.subscribers = [];

		rootElement.on('contextmenu', e => {
			if(Config.get('HIDE_MOUSE')) {
				e.preventDefault();
			}
		});

		this.elementNav = new element('ul').id('nav').parent(rootElement);

		const control = new element('div').id('control').parent(rootElement);
		this.elementControl = new element('div').class('wrapper').parent(control);
		this.overlay = new element('ul').class('overlay').parent(control);
		this.overflowWarning = new element('li').text('Text is too long in at least one line !').on('click', _ => {
			const overflow = this.elementControl.querySelector('.overflow');
			if(overflow) {
				overflow.scrollIntoView();
			}
		});

		this.elementSongs = new element('ul').parent(new element('div').id('songs').parent(rootElement));
		this.elementPreview = new element('div').id('preview').parent(rootElement)
			.listener('contextmenu', e => e.preventDefault());

		this.expand = new element('div').id('expand').parent(document.body);

		new element('li').class('sidebar').parent(this.elementNav).on('click', _ => {
			let shrunk = !Config.get('SHRINK_SIDEBAR');

			console.log(shrunk, Config.get('SHRINK_SIDEBAR'), Config.data);

			Config.set('SHRINK_SIDEBAR', shrunk);

			if(shrunk) {
				document.body.classList.add('shrunk');
			}
			else {
				document.body.classList.remove('shrunk');
			}
		}).tooltip('Sidebar');
		new element('li').class('search').parent(this.elementNav).on('click', _ => {
			if(this.elementNav.classList.toggle('search')) {
				this.search.focus().select();
			}
		}).tooltip('Toggle search');
		new element('li').class('add').parent(this.elementNav).on('click', _ => {
			let name = Config.get('DEFAULT_VERSE_NAME');
			let blocks = {};
			blocks[name] = '';

			this.editSong(new CCLISong({
				title: '',
				blocks: blocks,
				initialOrder: [name],
				order: [name]
			}));
		}).tooltip('Create new song');

		new element('li').class('fill').parent(this.elementNav);
		let search = new element('div').id('search').parent(this.elementNav);

		this.save = new element('li').class('shows').on('click', _ => {
			let copy = new element('textarea').class('hidden');
			let wrapper = new element('ul').class('shows');

			let newShow = new element('button').class('upload').text('New show').on('click', _ => {
				let d = new Date();
				let format = Config.get('SHOW_SAVE_FORMAT');

				const z = n => {
					return (n < 10) ? `0${n}` : `${n}`;
				}

				let title = format
					.replace(/\{yyyy}/g, d.getFullYear())
					.replace(/\{MM}/g, z(d.getMonth() + 1))
					.replace(/\{dd}/g, z(d.getDate()))
					.replace(/\{HH}/g, z(d.getHours()))
					.replace(/\{mm}/g, z(d.getMinutes()))
					.replace(/\{ss}/g, z(d.getSeconds()));

				title = prompt('Name of the show', title);

				if(!title) {
					return;
				}

				this.notifySubscriber('uploadShow', {title});
				setTimeout(loadShows, 500);
			});

			let CCLIList = new element('button').text('Copy CCLI list').on('click', _ => {
				copy.copy();
				Notification.success('Copied CCLI list to clipboard');
			}).child(copy);

			const loadShows = _ => {
				let offset = 0;

				const loadMore = new element('li').text('Show more').on('click', _ => {
					AJAX.get(`rest/Shows/${Config.get('SHOW_LIMIT')}/${++offset}`).then(createShows).catch(e => {
						Notification.error(e);
						offset--;
					});
				});

				const createShows = ({limit, shows}) => {
					loadMore.remove();

					shows.forEach(show => {
						let li = new element('li').text(show.title).parent(wrapper).on('dblclick', _ => {
							this.notifySubscriber('downloadShow', show);
							Modal.close();
						});

						new element('button').type('button').class('upload').tooltip('upload current songs to server').parent(li).on('click', _ => {
							if(!Config.get('CONFIRM_SHOW_OVERWRITE') || confirm('Overwrite show?')) {
								this.notifySubscriber('uploadShow', show);
								loadShows();
							}
						});

						const ccliNumbers = [];
						show.order.forEach(songNumber => {
							if(songNumber > SONG_CUSTOM_NUMBER_LIMIT) {
								ccliNumbers.push(songNumber);
							}
						});

						if(ccliNumbers.length > 0) {
							new element('button').type('button').class('setList').tooltip('CCLI reporting').parent(li).on('click', _ => {
								window.open(`https://reporting.ccli.com/search?s=${ccliNumbers.join('%7C')}`, '_blank');
							});
						}

						new element('button').type('button').text('×').tooltip('delete').parent(li).on('click', _ => {
							if(!Config.get('CONFIRM_SHOW_DELETION') || confirm('Delete show?')) {
								this.notifySubscriber('deleteShow', show);
								li.remove();
							}
						});
					});

					if(shows.length >= limit) {
						loadMore.parent(wrapper);
					}
				};

				AJAX.get(`rest/Shows/${Config.get('SHOW_LIMIT')}`).then(({limit, shows}) => {
					wrapper.clear();
					createShows(({limit, shows}));
				}).catch(e => {
					Notification.error(e);
					this.save.remove();
				});
			}

			loadShows();
			Modal.show('Shows', wrapper).width('375px').resizable('235px').foot(newShow, CCLIList);
		}).tooltip('Shows');

		this.account = new element('li').class('account').parent(this.elementNav).on('click', _ => {
			Account.login();
		}).tooltip('Account');

		const getPreviewLines = block => {
			const preview = [];
			if(Config.get('SHOW_NEXT_LINE_PREVIEW') && block.nextElementSibling && !block.nextElementSibling.classList.contains('copyright')) {
				let line = block.nextElementSibling.querySelector('p');
				if(line) {
					preview.push(line.cloneNode(true));

					if(Config.get('SHOW_NEXT_LINE_PREVIEW_TRANSLATION')) {
						while(line.nextElementSibling && line.nextElementSibling.classList.contains('translation')) {
							line = line.nextElementSibling;
							preview.push(line.cloneNode(true));
						}
					}
				}
			}

			return preview;
		}

		let popupWindow = new element('li').class('popup').parent(this.elementNav).on('click', _ => {
			if(PopUp.inactive) {
				PopUp.show();
			}
			else {
				PopUp.send('toggleVisibility', 'text');
			}
		}).on('contextmenu', _ => {
			PopUp.send('toggleVisibility', 'background');
		}).on('dblclick', _ => {
			PopUp.focus();
		}).tooltip('Block screen popup');

		PopUp.onLoad(send => {
			PopUp.send('margin', Config.get('POPUP_MARGIN'));
			PopUp.send('padding', Config.get('POPUP_PADDING'));

			PopUp.send('visibility', 'mouse', Config.get('HIDE_MOUSE'));
			PopUp.send('visibility', 'text', this.elementPreview.classList.contains('hide-text'));

			PopUp.send('translations', Config.get('SHOWN_TRANSLATIONS'));

			const song = this.elementPreview.getAttribute('song');
			if(song) {
				PopUp.send('song', song);
			}

			const active = this.lines.getActiveControl();
			if(active && active.parentElement) {
				PopUp.send('active', active.parentElement, getPreviewLines(active.parentElement));
			}

		}).onChange((message, ... params) => {
			switch(message) {
				case 'toggleVisibility':
					const type = params[0];

					if(params[1]) {
						popupWindow.classList.add(`hide-${type}`);
					}
					else {
						popupWindow.classList.remove(`hide-${type}`);
					}
					break;
			}
		});

		this.config = new element('li').class('config').parent(this.elementNav).on('click', _ => {
			this.showConfig();
		}).tooltip('Configuration');

		Account.addSubscriber(loggedIn => {
			if(loggedIn) {
				this.save.before(this.account);
			}
			else {
				this.save.remove();
			}
		});

		const isLoggedIn = () => {
			if(!Account.isLoggedIn) {
				Notification.error('Please log in');
				Account.login();
			}

			return Account.isLoggedIn;
		}

		this.search = new element('input').parent(search);
		let searchResults = new element('ul').parent(search);
		let searchRequest = mode => {
			if(!isLoggedIn()) {
				searchResults.clear();
				return;
			}

			let subject = this.search.value().trim();

			if(!subject) {
				searchResults.clear();
			}
			else {
				if(mode === 'title' && /^\d+$/.test(subject)) {
					mode = 'number';
				}

				AJAX.get(`rest/SongsSearch/${mode}?q=${subject}`).then(songs => {
					searchResults.clear();

					songs.forEach(song => {
						new element('li').text(`(${song.songNumber}) ${song.title}`).parent(searchResults).on('mousedown', _ => {
							CCLISong.download(song.songNumber).then(r => {
								this.notifySubscriber('downloadSong', r);
							}).catch(e => Notification.error(e));
						});
					});
				}).catch(e => {
					searchResults.clear();
					Notification.error(e);
				});
			}
		};
		new element('button').type('button').class('all').parent(search).on('click', _ => {
			if(!isLoggedIn()) return;

			AJAX.get(`rest/SongsAll/${Config.get('SONG_OVERVIEW_ORDER')}`).then(songs => {
				let wrapper = new element('ul').class('songs');

				songs.forEach(song => {
					let li = new element('li').parent(wrapper);
					new element('span').text(`(${song.songNumber}) ${song.title}`).parent(li).on('dblclick', _ => {
						CCLISong.download(song.songNumber).then(r => {
							this.notifySubscriber('downloadSong', r);
							Notification.success(`Successfully added "${song.title}"`);
						}).catch(e => Notification.error(e));
					});

					if(Config.get('SHOW_REMOVE_SONG_FROM_DATABASE')) {
						new element('button').class('close').parent(li).on('click', _ => {
							if(confirm(`Do you really want to remove the song "${song.title}" from the database?`)) {
								AJAX.delete('rest/Song', {songNumber: song.songNumber}).then(e => {
									li.remove();
									Notification.success(e);
								}).catch(e => Notification.error(e));
							}
						})
					}
				});

				Modal.show('All songs', wrapper).width('800px').resizable('310px');
			}).catch(e => Notification.error(e));
		});

		this.search.on('drop', e => {
			let text = e.dataTransfer.getData('text/plain');

			if(text) {
				this.search.value(text);
			}
		}).on('input', _ => {
			searchRequest('title');
		}).on('keypress', e => {
			switch(e.key) {
				case 'Enter':
					searchRequest('text');
					break;
			}
		});

		this.elementSongs.on('dragover', e => {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
		});

		this.songToMove = null;

		document.onkeydown = (e) => {
			if(Modal.isActive) {
				return;
			}

			switch(e.code) {
				case 'Home':
					this.lines.home();
					break;
				case 'ArrowUp':
					if(Config.get('USE_ARROWS_FOR_MOVING_BETWEEN_LINES')) {
						this.lines.prev();
					}
					break;
				case 'ArrowDown':
					if(Config.get('USE_ARROWS_FOR_MOVING_BETWEEN_LINES')) {
						this.lines.next();
					}
					break;
				case 'ArrowLeft':
				case 'ArrowRight':
					if(!Config.get('USE_ARROWS_FOR_MOVING_BETWEEN_BLOCKS')) {
						return;
					}

					const active = this.elementControl.querySelector('span.active');
					if(active) {
						const element = e.code === 'ArrowLeft' ? active.previousElementSibling : active.nextElementSibling;

						if(element) {
							const p = element.querySelector('p');

							if(p) {
								this.lines.to(p, !Config.get('HEADLINE_SMOOTH_SCROLL_BEHAVIOUR'));
							}
						}
					}
					break;
				case 'KeyB':
					if(!e.ctrlKey) {
						return;
					}

					PopUp.send('visibility', 'text', this.elementPreview.classList.toggle('hide-text'));
					break;
				case 'KeyF':
					if(!e.ctrlKey) {
						return;
					}
					break;
				case 'Escape':
				case 'F10':
					this.showConfig();
					break;
				case 'F11':
					break;
				case 'F12':
					break;
				default:
					//console.log(e.code);
					return;
			}

			e.preventDefault();
			e.stopPropagation();
		};

		this.addOnLoadListener(_ => {
			if(Config.get('SHRINK_SIDEBAR')) {
				document.body.classList.add('shrunk');
			}

			if(Config.get('SHOW_HIDE_MOUSE')) {
				new element('li').class('mouse').before(this.config).on('click', _ => {
					const hideMouse = document.body.classList.toggle('hide-mouse');

					Config.set('HIDE_MOUSE', hideMouse);
					PopUp.send('visibility', 'mouse', hideMouse);
				}).tooltip('Hide Mouse');
			}

			const notMaximizedWarning = new element('li').text('Browser window is not maximized !').on('click', _ => {
				window.moveTo(0, 0);
				window.resizeTo(screen.availWidth, screen.availHeight);
			});
			const checkMaximized = _ => {
				if(!Config.get('SHOW_PREVIEW') || screen.availWidth - window.innerWidth === 0) {
					notMaximizedWarning.remove();
				}
				else {
					if(!notMaximizedWarning.parentElement) {
						notMaximizedWarning.parent(this.overlay);
					}
				}
			}

			checkMaximized();
			document.body.onresize = checkMaximized;

			rootElement.attribute('theme', Config.get('THEME'));
		});

		this.lines = new class {
			constructor(gui) {
				this.gui = gui;
				this.lines = [];

				this.blockScrollDelay = window['chrome'] ? 200 : 0;
			}

			clear() {
				this.lines = [];
			}

			get(lineNumber) {
				return this.lines[lineNumber];
			}

			getActiveControl() {
				return this.gui.elementControl.querySelector('p.active');
			}

			add(control, preview) {
				const lineId = this.lines.length;

				control.on(Config.get('VERSE_CLICK_BEHAVIOUR'), e => {
					e.preventDefault();
					e.stopPropagation();

					this.to(control, true);
				});

				this.lines.push({
					control: control.attribute('line', lineId),
					preview: preview.attribute('line', lineId)
				});

				return this;
			}

			home(preventSmoothScroll) {
				this.to(0, preventSmoothScroll);

				return this;
			}

			next(preventSmoothScroll) {
				const active = this.getActiveControl();
				if(active) {
					let lineId = parseInt(active.getAttribute('line'));
					if(++lineId < this.lines.length) {
						this.to(lineId, preventSmoothScroll);
					}
				}
				else {
					this.to(0, true);
				}

				return this;
			}

			prev(preventSmoothScroll) {
				const active = this.getActiveControl();
				if(active) {
					let lineId = parseInt(active.getAttribute('line'));
					if(--lineId >= 0) {
						this.to(lineId, preventSmoothScroll);
					}
				}
				else {
					this.to(0, true);
				}

				return this;
			}

			to(lineNumberOrControlElement, preventSmoothScroll) {
				let lineId, controlElement;

				if(this.lines.length < 1) {
					return this;
				}

				if(typeof lineNumberOrControlElement === 'number') {
					lineId = lineNumberOrControlElement;

					if(lineId < 0) {
						lineId = 0;
					}
					else if(lineId >= this.lines.length) {
						lineId = this.lines.length - 1;
					}

					controlElement = this.lines[lineId].control;
				}
				else {
					controlElement = lineNumberOrControlElement;
					lineId = parseInt(controlElement.getAttribute('line'));
				}

				const offset = this.lines.length - lineId === 2 ? 1 : 0
				let previewId = lineId - offset;
				if(previewId < 0) {
					previewId = 0;
				}
				let previewElement = this.lines[previewId].preview;

				const block = controlElement.parentElement;

				if(preventSmoothScroll) {
					this.gui.elementPreview.style('scroll-behavior', 'auto');
					setTimeout(_ => {
						this.gui.elementPreview.style('scroll-behavior', '');
					}, 100);
				}
				previewElement.scrollIntoView();

				if(!block.classList.contains('active')) {
					Array.from(this.gui.elementControl.querySelectorAll('span.active')).forEach(active => active.classList.remove('active'));

					block.classList.add('active');
					setTimeout(_ => {
						block.scrollIntoView();
					}, this.blockScrollDelay);

					if(!PopUp.inactive) {
						PopUp.send('active', block, getPreviewLines(block));
					}
				}

				Array.from(this.gui.elementControl.querySelectorAll('p.active')).forEach(active => active.classList.remove('active'));
				controlElement.classList.add('active');

				return this;
			}
		}(this);
	}

	addSubscriber(fn) {
		if(fn) {
			this.subscribers.push(fn);
		}

		return this;
	}

	notifySubscriber() {
		this.subscribers.forEach(fn => fn(... arguments));
	}

	get changeHandler() {
		return (type, ... params) => {
			switch(type) {
				case 'addSong':
					this.addSong(... params);
					break;
				case 'clearSongs':
					this.elementSongs.clear();
					break;
			}
		};
	}

	addSong(song) {
		let li = new element('li')
			.on('dragstart', e => {
				this.songToMove = li;
				this.songToMove.class('dragged');
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', song.title);
			})
			.on('dragover', e => {
				if(!this.songToMove) {
					return;
				}

				e.preventDefault();
				e.dataTransfer.dropEffect = 'move';

				let target = e.target;
				while(target.tagName.toUpperCase() !== 'LI' && target.parentElement) {
					target = target.parentElement;
				}

				if(target.tagName.toUpperCase() === 'LI') {
					if(this.songToMove.isBefore(target)) {
						this.songToMove.before(target);
					}
					else {
						this.songToMove.after(target);
					}
				}
			})
			.on('dragend', _ => {
				this.songToMove.classList.remove('dragged');
				this.songToMove = null;

				let order = [];

				Array.from(this.elementSongs.children).forEach(child => {
					order.push(child.getAttribute('data-number'));
				});

				this.notifySubscriber('songOrder', order);
			})
			.on('mouseenter', _ => {
				this.expand.text(song.title);
				this.expand.style('top', `${li.rect.top}px`);
				this.expand.className('visible');

				if(li.classList.contains('active')) {
					this.expand.classList.add('active');
				}

			})
			.on('mouseleave', _ => {
				this.expand.classList.remove('visible');
			})
			.attribute('draggable', 'true')
			.attribute('data-number', song.id)
			.parent(this.elementSongs);

		let span = new element('span')
			.text(song.title)
			.on(Config.get('SONG_CLICK_BEHAVIOUR'), e => {
				e.stopPropagation();
				e.preventDefault();

				this.expand.classList.add('active');
				this.showSong(song, li);
			})
			.on('contextmenu', e => {
				e.preventDefault();
				this.editSong(song, li);
			})
			.on('touchstart', _ => {
				window.touchStartTimer = Date.now();
			})
			.on('touchend', e => {
				e.preventDefault();

				if(Date.now() - window.touchStartTimer > parseInt(Config.get('TOUCH_DURATION'))) {
					this.editSong(song, li);
				}
				else {
					this.showSong(song, li);
				}
			})
			.parent(li);

		new element('button').class('close').tooltip('remove').parent(li)
			.on('click', e => {
				e.preventDefault();
				e.stopPropagation();

				if(Config.get('CONFIRM_SONG_DELETE') && !confirm('Do you really want to remove the song?')) {
					return;
				}

				this.notifySubscriber('removeSong', li.index, song);

				li.remove();
			})
			.ignore('contextmenu');

		this.notifySubscriber('addSong', song);

		song.addSubscriber((type, data) => {
			switch(type) {
				case 'songTitle':
					span.text(data.title);
					break;
			}
		});

		return song;
	}

	addLine(block, line, translations) {
		if(!line) {
			line = '<br />';
		}

		let controlLine = new element('p').parent(block).html(line);
		let previewLine = new element('p').html(line);
		this.elementPreview.appendChild(previewLine);

		if(translations && translations.length > 0) {
			translations.forEach(({language, text}) => {
				new element('p')
					.parent(block)
					.html(text)
					.class('translation', 'language', `language_${language}`)
					.attribute('language', language);
			});
		}

		this.lines.add(controlLine, previewLine);

		return previewLine;
	}

	showSong(song, li) {
		this.lines.clear();
		this.overflowWarning.remove();
		this.elementControl.clear();
		this.elementPreview.clear();

		this.elementPreview.attribute('song', song.id);
		PopUp.send('song', song.id);

		this.switchActive(this.elementSongs, li);

		if(Config.get('RESET_BLACK_ON_SONG_SWITCH')) {
			this.elementPreview.classList.remove('hide-text');
		}

		let block = null;
		song.order.forEach(order => {
			let createBlock = _ => {
				let block = new element('span').parent(this.elementControl).on('contextmenu', _ => {
					/*
					if(block.classList.contains('hidden')) {
						block.classList.remove('hidden');
						// TODO show live elements
					}
					else {
						block.classList.add('hidden');
						// TODO hide live elements (maybe a listener from line to block???)
						// ?? change tagName ??
					}
					 */
				});

				let header = new element('h1').text(order).parent(block).listener('click', _ => {
					if(header.nextElementSibling) {
						this.lines.to(header.nextElementSibling, !Config.get('HEADLINE_SMOOTH_SCROLL_BEHAVIOUR'));
					}
				});
				block.data('nav', header);

				return block;
			}

			const lines = [... song.blocks[order]];
			let line = lines.shift();
			block = createBlock();

			while(line !== undefined) {
				if(line === SONG_SEPARATOR) {
					block = createBlock();
					line = lines.shift();
				}
				else {
					const content = line;
					const translations = [];

					line = lines.shift();
					let translation;

					while(line && (translation = line.match(SONG_TRANSLATION_LINE_REGEX)) !== null) {
						if(translation.length === 3) {
							translations.push({
								language: translation[1],
								text: translation[2]
							});
						}

						line = lines.shift();
					}

					this.addLine(block, content, translations);
				}
			}
		});

		block = new element('span').class('copyright').parent(this.elementControl);
		let header = new element('h1').html('©<em>Copyright</em>').parent(block);
		this.addLine(block, song.info.join('<br />')).class('copyright');

		if(!Config.get('SHOW_PREVIEW')) {
			header.listener('click', _ => {
				if(header.nextElementSibling) {
					this.lines.to(header.nextElementSibling, !Config.get('HEADLINE_SMOOTH_SCROLL_BEHAVIOUR'));
				}
			});
		}

		this.lines.home(true);

		setTimeout(_ => {
			Array.from(this.elementPreview.getElementsByTagName('p')).forEach(line => {
				if(line.scrollWidth > this.elementPreview.offsetWidth) {
					this.lines.get(line.getAttribute('line')).control.class('overflow');
					this.overflowWarning.parent(this.overlay);
				}
			});
		}, 1500);
	}

	editSong(song, li) {
		const wrapper = new element('div').class('song');
		const blocks = {};
		let currentBlock = null;
		const title = new element('input');
		const authors = new element('input');
		const copyright = new element('input');
		const editBlock = new element('textarea');
		const editOrder = new element('ul');
		const options = new element('li');

		const editBlockHandler = _ => {
			blocks[currentBlock] = editBlock.value();
		}

		const createBlock = (type, block, active) => {
			if(block) {
				if(Array.isArray(block)) {
					block = block.join('\n');
				}
			}
			else {
				block = '';
			}

			blocks[type] = block;

			let li = new element('li').before(options).on('click', _ => {
				currentBlock = type;
				editBlock.value(blocks[type]);

				this.switchActive(ul, li);
			});
			new element('span').text(type).parent(li);

			new element('button').type('button').class('close').parent(li).on('click', _ => {
				if(ul.children.length < 3) {
					Notification.error('You can\'t remove all blocks');
					return;
				}

				let active = li.previousElementSibling;
				this.switchActive(ul, active);

				li.remove();

				Array.from(editOrder.children).forEach(e => {
					if(e.textContent === type) {
						editOrder.removeChild(e.nextElementSibling);
						editOrder.removeChild(e);
					}
				});

				delete blocks[type];
			});

			if(active) {
				currentBlock = type;
				editBlock.value(blocks[type]);

				this.switchActive(ul, li);
			}
		}

		let ul = new element('ul').class('options').parent(wrapper);
		options.parent(ul);
		new element('button').type('button').class('add').parent(options).on('click', _ => {
			let name = prompt('Name', Config.get('DEFAULT_NEW_VERSE_NAME'));

			if(!name) {
				return;
			}

			if(Object.keys(blocks).includes(name)) {
				Notification.error(`Block "${name}" does already exist`);
				return;
			}

			createBlock(name, [], true);
		});
		new element('button').type('button').class('delete').parent(options).on('click', _ => {
			wrapper.classList.toggle('remove');
		});

		const info = new element('div').class('info', 'title').parent(wrapper);

		title.type('text').class('title').value(song.title).placeholder('Title').parent(info);
		authors.type('text').class('authors').value(song.authors).placeholder('Authors').parent(info);
		copyright.type('text').class('copyright').value(song.copyright).placeholder('Copyright').parent(info);

		new element('button').type('text').class('title').text('Title').parent(info).on('click', _ => {
			info.classList.remove('authors', 'copyright');
			info.class('title');
		});
		new element('button').type('text').class('authors').text('Authors').parent(info).on('click', _ => {
			info.classList.remove('title', 'copyright');
			info.class('authors');
		}).on('contextmenu', _ => {
			authors.value(SONG_UNKNOWN_AUTHOR);
		});
		new element('button').type('text').class('copyright').text('©').parent(info).on('click', _ => {
			info.classList.remove('title', 'authors');
			info.class('copyright');
		}).on('dblclick', _ => {
			copyright.value(`© ${copyright.value()}`);
		}).on('contextmenu', _ => {
			copyright.value(SONG_UNKNOWN_COPYRIGHT);
			copyright.focus();
		});

		editBlock.parent(wrapper).on('blur', editBlockHandler);
		editOrder.class('order');

		const add = index => {
			let li = new element('li').on('click', _ => {
				add(li.index);
				order(currentBlock, li.index);
			});
			new element('span').class('add').parent(li);

			editOrder.appendChild(li, index);
		}

		const order = (text, index) => {
			let li = new element('li');
			new element('span').text(text).parent(li);
			new element('button').class('close').parent(li).on('click', _ => {
				li.parentElement.removeChild(li.previousElementSibling);
				li.remove();
			});

			editOrder.appendChild(li, index)
		}

		add();

		song.order.forEach(e => {
			order(e);
			add();
		});

		song.initialOrder.forEach((order, i) => {
			createBlock(order, song.blocks[order], i < 1);
		});

		editOrder.parent(wrapper);

		Modal.show('Song editor', wrapper).width('1200px').onApply(_ => {
			if(!title.value()) {
				Notification.error('Title is missing');
				return false;
			}

			song.setTitle(title.value());
			song.setAuthors(authors.value());
			song.setCopyright(copyright.value());

			let newOrder = [];

			let value = [];
			let types = Object.keys(blocks);

			Array.from(editOrder.children).forEach(e => {
				if(e.textContent) {
					value.push(e.textContent);
				}
			});

			for(let i in blocks) {
				song.setBlock(i, blocks[i].replace(/(\n\s*)|(\s*\n)|(\n\s*\n)/g, '\n').split('\n'));
			}

			value.forEach(v => {
				v = v.trim();

				if(types.includes(v)) {
					newOrder.push(v);
				}
			});

			Object.keys(song.blocks).forEach(type => {
				if(!types.includes(type)) {
					song.removeBlock(type);
				}
			});

			if(newOrder.length < 1) {
				newOrder = song.initialOrder;
			}

			song.saveOrder(newOrder);

			if(li) {
				if(Config.get('RELOAD_SONG_AFTER_EDIT')) {
					this.showSong(song, li);
				}
			}
			else {
				this.notifySubscriber('newSong', song);
			}

			if(Account.isLoggedIn) {
				if(song.id < 0) {
					void song.upload();
				}
				else {
					AJAX.get(`rest/SongExists/${song.id}`).then(({exists}) => {
						void song.upload(exists);
					});
				}
			}
		});
	}

	showConfig() {
		let table = new element('table').class('config');

		Config.forEach((v, k, _, d) => {
			const description = new element('th').text(k);
			const value = new element('td').attribute('key', k)

			if(Array.isArray(d)) {
				const select = new element('select').parent(value);

				d.forEach(option => {
					new element('option').text(option).value(option).selected(option === v).parent(select);
				});
			}
			else {
				value.attribute('contenteditable', 'true').text(v);
			}

			new element('tr').parent(table).on('contextmenu', _ => {
				if(Array.isArray(d)) {
					value.querySelector('option').selected = true;
				}
				else {
					value.text(d);
				}
			}).child(description, value);
		});

		Modal.show('Configuration', table).width('650px').resizable('360px').onApply(_ => {
			Array.from(table.getElementsByTagName('td')).forEach(td => {
				const key = td.getAttribute('key');
				const select = td.querySelector('select');
				let value;

				if(select) {
					value = select.value.trim();
				}
				else {
					value = td.textContent.trim();
				}

				Config.set(key, value);
			})
		});
	}

	switchActive(e, ... actives) {
		Array.from(e.getElementsByClassName('active')).forEach(active => {
			active.classList.remove('active');
		});

		actives.forEach(active => {
			active.classList.add('active');
		});
	}
}

window.onerror = function(message, source, lineno, colno) {
	AJAX.post('rest/Log', {
		message: `${source}[${lineno}:${colno}] - ${message}`
	}).catch(e => console.error(e));
}

window.onbeforeunload = e => {
	if(Config.get('CONFIRM_PAGE_LEAVE')) {
		e.preventDefault();
		e.returnValue = '';

		PopUp.send('closing', document.body.getAttribute('data-loaded'));
	}
	else {
		delete e['returnValue'];
		PopUp.close();
	}

	Storable.instances.forEach(i => i.save());
}