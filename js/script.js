
const SONG_UNKNOWN = 'UNKNOWN';
const CUSTOM_NUMBER_LIMIT = 10000;
const SONG_SEPARATOR = '---';

class element {
	/**
	 * HTMLElement
	 */
	element;

	constructor(type) {
		if(!type) {
			throw Error('Type is not defined');
		}

		if(typeof type === 'string') {
			this.element = document.createElement(type);
		}
		else if(type instanceof element) {
			this.element = type.element;
		}
		else {
			if(typeof HTMLElement === "object" && !(type instanceof HTMLElement)) {
				throw Error('Type needs to be either a tag name (string), another instance of element or a HTMLElement');
			}
			else if(typeof type !== "object" || type.nodeType !== 1 || typeof type.nodeName !== "string") {
				throw Error('Type needs to be either a tag name (string), another instance of element or a HTMLElement');
			}

			this.element = type;
		}
	}

	static from(identifier) {
		let e = document.querySelector(identifier);
		return e ? new element(e) : e;
	}

	get classList() {
		return this.element.classList;
	}

	get children() {
		return this.element.children;
	}

	get index() {
		if(!this.element.parentElement) {
			return -1;
		}

		return Array.from(this.element.parentElement.children).indexOf(this.element);
	}

	get parentElement() {
		return this.element.parentElement;
	}

	get firstElementChild() {
		return this.element.firstElementChild;
	}

	get lastElementChild() {
		return this.element.lastElementChild;
	}

	get previousElementSibling() {
		return this.element.previousElementSibling;
	}

	get nextElementSibling() {
		return this.element.nextElementSibling;
	}

	get rect() {
		return this.element.getBoundingClientRect();
	}

	get offsetHeight() {
		return this.element.offsetHeight;
	}

	get offsetWidth() {
		return this.element.offsetWidth;
	}

	get scrollHeight() {
		return this.element.scrollHeight;
	}

	get scrollWidth() {
		return this.element.scrollWidth;
	}

	is(obj) {
		if(obj instanceof element) {
			return obj === this;
		}

		return obj === this.element;
	}

	add(parameter, object) {
		this[parameter] = object;
		return this;
	}

	parent(parent) {
		if(parent && parent.appendChild) {
			parent.appendChild(this.element);
		}

		return this;
	}

	child(... child) {
		child.forEach(child => {
			if(child instanceof element) {
				this.element.appendChild(child.element);
			}
			else {
				this.element.appendChild(child);
			}
		});

		return this;
	}

	hierarchy(tagName) {
		tagName = tagName.toUpperCase();
		let e = this.element;

		while(e && e.parentElement && e.tagName.toUpperCase() !== tagName) {
			e = e.parentElement;
		}

		if(e && e.tagName.toUpperCase() === tagName) {
			return e;
		}

		return this.element;
	}

	shiftChild() {
		if(this.element.firstElementChild) {
			this.element.removeChild(this.element.firstElementChild);
		}

		return this;
	}

	removeChild(child) {
		this.element.removeChild(child);

		return this;
	}

	popChild() {
		if(this.element.lastElementChild) {
			this.element.removeChild(this.element.lastElementChild);
		}

		return this;
	}

	id(id) {
		this.element.id = id;
		return this;
	}

	removeClass(... classes) {
		this.element.classList.remove(... classes);
		return this;
	}

	className(className) {
		this.element.className = className;
		return this;
	}

	class(... classes) {
		this.element.classList.add(... classes);
		return this;
	}

	name(name) {
		this.element.name = name;
		return this;
	}

	type(type) {
		this.element.type = type;
		return this;
	}

	attribute(attribute, value) {
		this.element.setAttribute(attribute, value);
		return this;
	}

	text(text) {
		if(text === undefined) {
			return this.element.textContent;
		}

		this.element.textContent = text;
		return this;
	}

	html(html) {
		if(html) {
			this.element.innerHTML = html;
			return this;
		}

		return this.element.innerHTML;
	}

	value(value) {
		if(value === undefined) {
			return this.element.value;
		}

		this.element.value = value;
		return this;
	}

	placeholder(placeholder) {
		this.element.placeholder = placeholder;
		return this;
	}

	style(parameter, value) {
		this.element.style[parameter] = value;
		return this;
	}

	selected(selected) {
		this.element.selected = selected;
		return this;
	}

	readonly(readonly) {
		if(readonly) {
			this.element.setAttribute('readonly', 'readonly');
		}
		else {
			this.element.removeAttribute('readonly');
		}

		return this;
	}

	listener(event, listener) {
		this.element.addEventListener(event, listener);
		return this;
	}

	on(event, listener) {
		this.element[`on${event}`] = listener;
		return this;
	}

	ignore(event) {
		this.element[`on${event}`] = e => {
			e.preventDefault();
			e.stopPropagation();
		}
		return this;
	}

	scrollTo() {
		this.element.scrollIntoView({
			behavior: 'smooth',
			block: 'end'
		});
		return this;
	}

	querySelector(selector) {
		return this.element.querySelector(selector);
	}

	before(el) {
		if(el instanceof element) {
			el = el.element;
		}

		el.parentElement.insertBefore(this.element, el);
		return this;
	}

	after(el) {
		if(el instanceof element) {
			el = el.element;
		}

		if(el.nextElementSibling === null) {
			el.parentElement.appendChild(this.element);
		}
		else {
			el.parentElement.insertBefore(this.element, el.nextElementSibling);
		}

		return this;
	}

	appendChild(child, index) {
		if(child.element) {
			if(index !== undefined) {
				return this.element.insertBefore(child.element, this.element.children[index]);
			}

			return this.element.appendChild(child.element);
		}

		if(index !== undefined) {
			return this.element.insertBefore(child, this.element.children[index]);
		}
		return this.element.appendChild(child);
	}

	getElementsByTagName(tagName) {
		return this.element.getElementsByTagName(tagName);
	}

	getElementsByClassName(className) {
		return this.element.getElementsByClassName(className);
	}

	replaceWith(node) {
		if(node.element) {
			this.element.replaceWith(node.element);
		}
		else {
			this.element.replaceWith(node);
		}

		return this;
	}

	focus() {
		this.element.focus();
		return this;
	}

	select() {
		this.element.select();
		return this;
	}

	copy() {
		switch(this.element.tagName.toUpperCase()) {
			case 'TEXTAREA':
			case 'INPUT':
				this.element.select();
				this.element.setSelectionRange(0, 99999);

				document.execCommand('copy');
				break;
			default:
				console.warn('element type needs to be "textarea" or "input"');
		}

		return this;
	}

	height(height) {
		this.element.style.height = height;
		return this;
	}

	width(width) {
		this.element.style.width = width;
		return this;
	}

	tooltip(text) {
		this.element.title = text;
		return this;
	}

	remove() {
		if(this.element.parentElement) {
			this.element.parentElement.removeChild(this.element);
		}

		return this;
	}

	removeChildren(tag) {
		tag = tag.toUpperCase();

		Array.from(this.element.children).forEach(child => {
			if(child.tagName.toUpperCase() === tag) {
				this.element.removeChild(child);
			}
		});

		return this
	}

	clear() {
		while(this.element.children.length) {
			this.element.removeChild(this.element.firstChild);
		}

		return this
	}

	clone() {
		return new element(this.element.cloneNode(true));
	}

	data(attribute, data) {
		this.element[attribute] = data;
		return this;
	}

	isBefore(element) {
		if(this.parentElement === element.parentElement) {
			let prev = this.element.previousElementSibling;

			while(prev != null) {
				if(prev === element) {
					return true;
				}

				prev = prev.previousElementSibling;
			}
		}

		return false;
	}
}

class DragNDrop {
	constructor(target, filetypes, dragClass, zone) {
		let $ = this;
		this.element = target;
		this.loaded = [];
		this.errors = [];

		let containsFiles = e => {
			if(e && e.dataTransfer && e.dataTransfer.items) {
				let items = e.dataTransfer.items;

				for(let i = 0; i < items.length; i++) {
					if(items[i].kind === 'file') {
						return true;
					}
				}
			}

			return false;
		}

		let fileHandler = files => {
			Array.from(files).forEach(file => {
				if (filetypes.includes(file.type)) {
					$.loaded.forEach(fn => {
						let reader = new FileReader();
						reader.addEventListener('load', e => {
							fn(e.target.result);
						});
						reader.readAsText(file);
					});
				} else {
					$.errors.forEach(fn => {
						fn(`Filetype "${file.type}" for file "${file.name}" not supported`);
					});
				}
			});
		}

		if(zone) {
			new element('input').type('file').id('file').parent(zone).listener('change', e => {
				fileHandler(e.target.files);
			});
			new element('label').attribute('for', 'file').parent(zone);
		}

		target.listener('drop', e => {
			e.stopPropagation();
			e.preventDefault();

			if(e.dataTransfer.files) {
				fileHandler(e.dataTransfer.files);
			}
			else {
				$.errors.forEach(fn => {
					fn('Couldn\'t find any elementSongs');
				});
			}

			if(dragClass) {
				$.element.classList.remove(dragClass);
			}
		});

		target.listener('dragover', e => {
			if(!containsFiles(e)) {
				return;
			}

			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';

			if(dragClass) {
				$.element.classList.add(dragClass);
			}
		});

		if(dragClass) {
			target.listener('dragleave', _ => {
				$.element.classList.remove(dragClass);
			});
		}
	}

	onFileLoaded(fn) {
		this.loaded.push(fn);
		return this;
	}

	onError(fn) {
		this.errors.push(fn);
		return this;
	}
}

class Loadable {
	constructor() {
		this.loaded = false;
		this.listener = [];

		document.addEventListener('DOMContentLoaded', _ => {
			while(this.listener.length) {
				this.listener.shift()(this);
			}

			this.loaded = true;
		});
	}

	addOnLoadListener(fn) {
		if(this.loaded) {
			fn(this);
		}
		else {
			this.listener.push(fn);
		}

		return this;
	}
}

class AJAX {
	static statusHandler(response) {
		if(response.ok) {
			return response.json();
		}

		return response.json().then(json => {
			if(json.hasOwnProperty('message')) {
				throw new Error(`${response.status} ${json.message}`);
			}

			throw new Error(`${response.status} ${response.statusText}`)
		});
	}

	static get(url) {
		return fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		}).then(this.statusHandler);
	}

	static post(url, data) {
		return fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data)
		}).then(this.statusHandler);
	}

	static put(url, data) {
		return fetch(url, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then(this.statusHandler);
	}

	static delete(url, data) {
		return fetch(url, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then(this.statusHandler);
	}

	static form(url, data) {
		const formData = new FormData();

		if(data) {
			if(typeof data === "object") {
				for(const [key, value] of Object.entries(data)) {
					if(typeof value === 'string' || value instanceof String) {
						formData.append(key, value);
					}
					else {
						formData.append(key, JSON.stringify(value));
					}
				}
			}
			else {
				if(typeof data === 'string' || data instanceof String || typeof data === 'number') {
					formData.append('data', data);
				}
				else {
					formData.append('data', JSON.stringify(data));
				}
			}
		}

		return fetch(url, {
			method: 'POST',
			body: formData
		}).then(this.statusHandler);
	}
}

class Storable extends Loadable {
	data;

	constructor(itemName, data) {
		super();

		if(this.constructor === Storable) {
			throw new TypeError('Abstract class "Storable" cannot be instantiated directly.');
		}

		Storable.instances.push(this);
		this.loaded = false;
		this.itemName = itemName;
		this.data = data;

		this.addOnLoadListener(_ => {
			this.load();
		});
	}

	convert(data) {
		this.data = data;
	}

	validData() {
		return this.data;
	}

	load() {
		try {
			let data = JSON.parse(localStorage.getItem(this.itemName));

			if(!data) {
				return;
			}

			this.convert(data);
		}
		catch(e) {
			Notification.warning(`Couldn't load data "${this.itemName}" from localStorage: ${e.message}`);
		}
	}

	save() {
		if(this.validData()) {
			localStorage.setItem(this.itemName, JSON.stringify(this.data));
		}
	}
}

Storable.instances = [];

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

		if(this.has(song)) {
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
			width = window.innerWidth + 'px';
		}

		this.container.width(width);
		return this;
	}

	height(height) {
		if(height.endsWith('px') && parseInt(height.slice(0, -2)) > window.innerHeight) {
			height = window.innerHeight + 'px';
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
		while(this.container.children.length > Config.get('notificationCount', 4)) {
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
		}, Config.get('notificationDisappearTime', 3500));
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

const Config = new class extends Storable {
	constructor() {
		super('config', {});
	}

	get(item, defaultValue) {
		if(this.data[item] === undefined) {
			if(defaultValue === undefined) {
				defaultValue = false;
			}

			this.data[item] = defaultValue;
		}

		return this.data[item];
	}

	set(item, value) {
		if(value === '' || value === undefined) {
			delete this.data[item];
		}
		else {
			this.data[item] = value;
		}

		return this;
	}

	remove(item) {
		delete this.data[item];
		return this;
	}

	forEach(fn) {
		for(let i in this.data) {
			if(this.data.hasOwnProperty(i)) {
				fn(this.data[i], i, this.data);
			}
		}
	}

	load() {
		super.load();

		if(Config.get('hideMouse', true)) {
			document.body.classList.add('hide-mouse');
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
				top: Config.get('popupTop', 0),
				left: Config.get('popupLeft', 0),
				width: Config.get('popupWidth', '450'),
				height: Config.get('popupHeight', '350')
			}).map(x => x.join('=')).join(',');

			this.popup = window.open('view.php', '_blank', params);

			if(this.popup) {
				this.popup.onload = _ => {
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
			if(Config.get('hideMouse', true)) {
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
			let shrunk = !Config.get('shrinkSidebar', false);

			Config.set('shrinkSidebar', shrunk);

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
			let name = Config.get('defaultVerseName', 'Vers 1');
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
				let format = Config.get('ShowSaveFormat', 'Show {dd}.{MM}.{yyyy}');

				function z(n) {
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
				loadShows(this);
			});

			let CCLIList = new element('button').text('Copy CCLI list').on('click', _ => {
				copy.copy();
				Notification.success('Copied CCLI list to clipboard');
			}).child(copy);

			function loadShows($) {
				AJAX.get(`rest/Shows/${Config.get('showLimit', 30)}`).then(shows => {
					wrapper.clear();

					shows.forEach(show => {
						let li = new element('li').text(show.title).parent(wrapper).on('dblclick', _ => {
							$.notifySubscriber('downloadShow', show);
							Modal.close();
						});

						new element('button').type('button').class('upload').tooltip('upload').parent(li).on('click', _ => {
							if(!Config.get('confirmShowOverwrite', true) || confirm('Overwrite show?')) {
								$.notifySubscriber('uploadShow', show);
								loadShows($);
							}
						});

						new element('button').type('button').text('×').tooltip('delete').parent(li).on('click', _ => {
							if(!Config.get('confirmShowDeletion', true) || confirm('Delete show?')) {
								$.notifySubscriber('deleteShow', show);
								li.remove();
							}
						});
					});
				}).catch(e => {
					Notification.error(e);
					this.save.remove();
				});
			}

			loadShows(this);
			Modal.show('Shows', wrapper).width('375px').resizable('235px').foot(newShow, CCLIList);

			AJAX.get(`rest/ShowsNumbers/${Config.get('showLimit', 30)}`).then(shows => {
				let result = [];

				shows.forEach(({title, songNumbers}) => {
					result.push([title, ... songNumbers].join('\n'));
				});

				copy.value(result.join('\n\n'));
			}).catch(e => Notification.error(e));
		}).tooltip('Shows');

		this.account = new element('li').class('account').parent(this.elementNav).on('click', _ => {
			Account.login();
		}).tooltip('Account');

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
			PopUp.send('song', this.current.id);
			PopUp.send('visibility', 'mouse', Config.get('hideMouse', true));

			this.updateActiveBlock(); // ToDo get current active block
			// ToDo check if text is blacked?

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

		this.search = new element('input').parent(search);
		let searchResults = new element('ul').parent(search);
		let searchRequest = mode => {
			if(!Account.isLoggedIn) {
				searchResults.clear();
				Notification.error('Please log in');
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
			AJAX.get(`rest/SongsAll/${Config.get('songOverviewOrder', 'lexicographic|numeric')}`).then(songs => {
				let wrapper = new element('ul').class('songs');

				songs.forEach(song => {
					let li = new element('li').parent(wrapper);
					new element('span').text(`(${song.songNumber}) ${song.title}`).parent(li).on('dblclick', _ => {
						CCLISong.download(song.songNumber).then(r => {
							this.notifySubscriber('downloadSong', r);
							Notification.success(`Successfully added "${song.title}"`);
						}).catch(e => Notification.error(e));
					});

					if(Config.get('showRemoveSongFromDatabase', false)) {
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
		this.current = {
			id: -1,
			index: 1,
			text: []
		};

		document.onkeydown = (e) => {
			if(Modal.isActive) {
				return;
			}

			switch(e.code) {
				case 'Home':
					this.current.index = 0;
					this.scrollTo(0);
					this.updateActiveBlock();
					break;
				case 'ArrowUp':
					if(this.current.index > 0) {
						this.scrollTo(--this.current.index);
						this.updateActiveBlock();
					}
					break;
				case 'ArrowDown':
					if(this.current.index < this.elementPreview.children.length - 1) {
						this.scrollTo(++this.current.index);
						this.updateActiveBlock();
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
			if(Config.get('shrinkSidebar', false)) {
				document.body.classList.add('shrunk');
			}

			if(Config.get('showHideMouse', false)) {
				new element('li').class('mouse').before(this.config).on('click', _ => {
					const hideMouse = document.body.classList.toggle('hide-mouse');

					Config.set('hideMouse', hideMouse);
					PopUp.send('visibility', 'mouse', hideMouse);
				}).tooltip('Hide Mouse');
			}

			const notMaximizedWarning = new element('li').text('Browser window is not maximized !').on('click', _ => {
				window.moveTo(0, 0);
				window.resizeTo(screen.availWidth, screen.availHeight);
			});
			const checkMaximized = _ => {
				if(screen.availWidth - window.innerWidth === 0) {
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

			rootElement.attribute('theme', Config.get('theme', 'default|calibration|expert'));
		});
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
				this.expand.style('top', li.rect.top + 'px');
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
			.on(Config.get('songClickBehaviour', 'dblclick'), e => {
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

				if(Date.now() - window.touchStartTimer > parseInt(Config.get('TouchDuration', 300))) {
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

				if(Config.get('confirmSongDelete', true) && !confirm('Do you really want to remove the song?')) {
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

	updateActiveBlock() {
		if(!PopUp.inactive) {
			const active = this.elementControl.querySelector('span.active');

			if(active) {
				PopUp.send('active', active);
			}
		}

		return this;
	}

	addLine(block, line, className) {
		if(!line) {
			line = '<br />';
		}

		let controlLine = new element('p').parent(block).html(line).listener(Config.get('verseClickBehaviour', 'dblclick'), e => {
			e.preventDefault();
			e.stopPropagation();

			let lines = Array.from(this.elementControl.getElementsByTagName('p'));
			this.current.index = lines.indexOf(controlLine.element);

			this.scrollTo(this.current.index, {
				scrollToBlock: false,
				scrollBehavior: Config.get('verseScrollBehaviour', 'auto')
			});

			this.updateActiveBlock();
		});

		if(this.current.text.length < 1) {
			controlLine.class('active');
		}

		let previewLine = new element('p').html(line);
		this.elementPreview.appendChild(previewLine);
		this.current.text.push(previewLine);

		if(previewLine.scrollWidth > this.elementPreview.offsetWidth) {
			controlLine.class('overflow');
			this.overflowWarning.parent(this.overlay);
		}

		if(className) {
			controlLine.class(className);
			previewLine.class(className);
		}

		return previewLine;
	}

	showSong(song, li) {
		this.current.id = song.id;
		this.current.index = 0;
		this.current.text = [];

		this.overflowWarning.remove();
		this.elementControl.clear();
		this.elementPreview.clear();
		this.switchActive(this.elementSongs, li);

		if(Config.get('resetBlackOnSongSwitch', false)) {
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
					let index = Array.from(this.elementControl.getElementsByTagName('p')).indexOf(block.querySelector('p'));
					this.current.index = index;
					this.scrollTo(index, {
						scrollBehavior: Config.get('navScrollBehaviour', 'auto')
					});

					this.updateActiveBlock();
				});
				block.data('nav', header);

				if(this.current.text.length < 1) {
					block.class('active');
				}

				return block;
			}

			block = createBlock();

			song.blocks[order].forEach(line => {
				if(line === SONG_SEPARATOR) {
					block = createBlock();
				}
				else {
					this.addLine(block, line);
				}
			});
		});

		if(song.hasLicense) {
			block = new element('span').class('copyright').parent(this.elementControl);
			new element('h1').html('©<em>Copyright</em>').parent(block);
			this.addLine(block, song.license).class('copyright');
		}
		else {
			this.addLine(block, '', 'fill');
		}

		this.elementControl.firstElementChild.scrollIntoView();

		PopUp.send('song', song.id);
		this.updateActiveBlock();
	}

	editSong(song, li) {
		let $ = this;
		let wrapper = new element('div').class('song');
		let blocks = {};
		let currentBlock = null;
		let title = new element('input');
		let editBlock = new element('textarea');
		let editOrder = new element('ul');
		let options = new element('li');

		function editBlockHandler() {
			blocks[currentBlock] = editBlock.value();
		}

		function createBlock(type, block, active) {
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

				$.switchActive(ul, li);
			});
			new element('span').text(type).parent(li);

			new element('button').type('button').class('close').parent(li).on('click', _ => {
				if(ul.children.length < 3) {
					Notification.error('You can\'t remove all blocks');
					return;
				}

				let active = li.previousElementSibling;
				$.switchActive(ul, active);

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

				$.switchActive(ul, li);
			}
		}

		let ul = new element('ul').class('options').parent(wrapper);
		options.parent(ul);
		new element('button').type('button').class('add').parent(options).on('click', _ => {
			let name = prompt('Name', Config.get('newVerseValue', 'Outro'));

			if(!name) {
				return;
			}

			if(Object.keys(blocks).includes(name)) {
				Notification.error(`Block "${name}" does already exist`);
				return ;
			}

			createBlock(name, [], true);
		});
		new element('button').type('button').class('delete').parent(options).on('click', _ => {
			wrapper.classList.toggle('remove');
		})

		title.type('text').class('title').value(song.title).placeholder('Title').parent(wrapper);

		editBlock.parent(wrapper).on('blur', editBlockHandler);
		editOrder.class('order');

		function add(index) {
			let li = new element('li').on('click', _ => {
				console.log(currentBlock);
				add(li.index);
				order(currentBlock, li.index);
			});
			new element('span').class('add').parent(li);

			editOrder.appendChild(li, index);
		}

		function order(text, index) {
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
				if(Config.get('reloadSongAfterEdit', false)) {
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

		// ToDo there is a bug in here	script.js:1799:30	Uncaught TypeError: (new element(...)).text(...).parent is not a function
		Config.forEach((v, k) => {
			let tr = new element('tr').parent(table).on('contextmenu', _ => {
				let td = tr.querySelector('td');

				if(td) {
					td.setAttribute('reset', td.getAttribute('reset') === 'true' ? 'false' : 'true');
				}
			});
			new element('th').text(k).parent(tr);
			new element('td').text(v).parent(tr)
				.attribute('contenteditable', 'true')
				.attribute('reset', 'false')
				.attribute('type', typeof v)
				.attribute('key', k)
		});

		Modal.show('Configuration', table).width('520px').resizable('173px').onApply(_ => {
			Array.from(table.getElementsByTagName('td')).forEach(td => {
				let key = td.getAttribute('key');

				if(td.getAttribute('reset') === 'true') {
					Config.set(key, undefined);
				}
				else {
					let value = td.textContent.trim();

					switch(td.getAttribute('type')) {
						case 'number':
							// ToDo fix this, value will be a Number() and not expected in the config data
							// value = Number.bind(null, value);
							value = parseFloat(value);
							break;
						case 'boolean':
							value = value === 'true';
					}

					Config.set(key, value);
				}
			})
		});
	}

	switchActive(e, ... actives) {
		let collection = e.getElementsByClassName('active');

		while (collection.length > 0) {
			collection[0].classList.remove('active');
		}

		actives.forEach(active => {
			active.classList.add('active');
		});
	}

	scrollTo(lineNumber, options) {
		options = Object.assign({
			scrollToBlock: true,
			scrollBehavior: 'smooth'
		}, options || {});

		let offset = 1;
		let scrollOptions = {
			behavior: options.scrollBehavior,
			block: 'end'
		}

		if(lineNumber > this.elementPreview.children.length - 3) {
			offset = 0;
		}
		if(!Config.get('scrollAnimation', true) || window['chrome']) {
			scrollOptions.behavior = 'auto';
		}

		this.elementPreview.children[lineNumber + offset].scrollIntoView(scrollOptions);

		let p = this.elementControl.getElementsByTagName('p')[lineNumber];
		if(options.scrollToBlock && p.parentElement.nextElementSibling) {
			p.parentElement.nextElementSibling.scrollIntoView(scrollOptions);
		}

		if(!p.classList.contains('fill')) {
			this.switchActive(this.elementControl, p.parentElement, p);
		}
	}
}

class Song {
	constructor(obj) {
		obj = Object.assign({
			title: SONG_UNKNOWN,
			songNumber: - Date.now(),
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
		const obj = { ...this };
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
			let filter = e => {
				return  e !== type;
			}

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
		} while (!song.songNumber.startsWith('CCLI-'));

		song.id = parseInt(song.songNumber.replace(/\D/g, ''));

		rows.join('\n').split('\n\n\n').forEach(block => {
			let row = block.split('\n').filter(e => { return e !== ''; });
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

window.onbeforeunload = e => {
	if(Config.get('confirmPageLeave', true)) {
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