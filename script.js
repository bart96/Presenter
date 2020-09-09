
class element {
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
		parent.appendChild(this.element);
		return this;
	}

	shiftChild() {
		if(this.element.firstElementChild) {
			this.element.removeChild(this.element.firstElementChild);
		}

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
		this.element.textContent = text;
		return this;
	}

	html(html) {
		this.element.innerHTML = html;
		return this;
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
		this.element['on' + event] = listener;
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

	appendChild(child) {
		if(child.element) {
			return this.element.appendChild(child.element);
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
	constructor(element, filetypes, dragClass) {
		let $ = this;
		this.element = element;
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

		element.listener('drop', e => {
			e.stopPropagation();
			e.preventDefault();

			if(e.dataTransfer.files) {
				Array.from(e.dataTransfer.files).forEach(file => {
					if(filetypes.includes(file.type)) {
						$.loaded.forEach(fn => {
							let reader = new FileReader();
							reader.addEventListener('load', e => {
								fn(e.target.result);
							});
							reader.readAsText(file);
						});
					}
					else {
						$.errors.forEach(fn => {
							fn('Filetype "' + file.type + '" for file "' + file.name + '" not supported');
						});
					}
				});
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

		element.listener('dragover', e => {
			if(!containsFiles(e)) {
				return;
			}

			//e.stopPropagation();
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';

			if(dragClass) {
				$.element.classList.add(dragClass);
			}
		});

		if(dragClass) {
			element.listener('dragleave', e => {
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

		document.addEventListener("DOMContentLoaded", () => {
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

let AJAX = new (function() {
	let init = (method, url, callback) => {
		let xhttp;

		if (window.XMLHttpRequest) {
			xhttp = new XMLHttpRequest();
		} else {
			xhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}

		xhttp.open(method, url, true);
		xhttp.onreadystatechange = function () {
			if (this.readyState === 4) {
				if(this.status === 200) {
					callback.success(this.responseText);
				}
				else {
					callback.error(this.responseText);
				}
			}
		};

		return xhttp;
	};

	let convert = (params) => {
		if(params && typeof params === "object") {
			let p = [];
			Object.entries(params).forEach(e => {
				p.push(e[0] + '=' + e[1]);
			});

			return p.join('&');
		}

		return params;
	};

	this.get = (url) => {
		let success, error;
		let xhttp = init('GET', url, {
			success: (r) => {
				if(success) {
					success(r);
				}
			},
			error: (r) => {
				if(error) {
					error(r);
				}
			}
		});
		xhttp.send();

		let $ = {
			success: fn => {
				success = fn;
				return $;
			},
			error: fn => {
				error = fn;
				return $;
			}
		}

		return $;
	};

	this.post = (url, params) => {
		let success, error;
		let xhttp = init('POST', url, {
			success: (r) => {
				if(success) {
					success(r);
				}
			},
			error: (r) => {
				if(error) {
					error(r);
				}
			}
		});
		xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhttp.send(convert(params));

		let $ = {
			success: fn => {
				success = fn;
				return $;
			},
			error: fn => {
				error = fn;
				return $;
			}
		}

		return $;
	}
})();

class Storable extends Loadable {
	static instances = [];

	constructor(itemName, data) {
		super();

		if(this.constructor === Storable) {
			throw new TypeError('Abstract class "Storable" cannot be instantiated directly.');
		}

		Storable.instances.push(this);
		this.loaded = false;
		this.itemName = itemName;
		this.data = data;

		this.addOnLoadListener(() => {
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
			Notification.warning('Couldn\'t load data "' + this.itemName + '" from localStorage: ' + e.message);
		}
	}

	save() {
		if(this.validData()) {
			localStorage.setItem(this.itemName, JSON.stringify(this.data));
		}
	}
}

class Storage extends Storable {
	constructor() {
		super('data', {
			version: '1.0',
			songs: {},
			order: []
		});

		this.addSongListener = [];
		this.changeSongListener = [];
		this.removeSongListener = [];
	}

	convert(data) {
		switch(data.version) {
			case '1.0':
				this.data.version = data.version;

				for(let i in data.songs) {
					let song = new CCLISong(data.songs[i]);
					song.addSubscriber((type, song) => this.changeSong(type, song));
					this.data.songs[i] = song;
				}

				for(let i in data.order) {
					this.data.order.push(data.order[i]);
					this.addSongListener.forEach(fn => {
						fn(this.data.songs[data.order[i]]);
					});
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

	has(song) {
		if(song && song.id) {
			return this.data.songs[song.id];
		}

		if(Number.isInteger(song)) {
			return this.data.songs[song];
		}

		return false;
	}

	addSubscriber(fn) {
		if(fn) {
			fn({
				addSong: fn => {
					this.addSongListener.push(fn);
				},
				changeSong: fn => {
					this.changeSongListener.push(fn);
				},
				removeSong: fn => {
					this.removeSongListener.push(fn);
				}
			});
		}

		return this;
	}

	changeHandler(fn) {
		fn.downloadSong(song => this.addSong(song));
		fn.removeSong((index, song) => this.removeSong(index, song));
		fn.songOrder(order => this.songOrder(order));
	}

	addSong(song) {
		this.data.order.push(song.id);

		if(this.has(song)) {
			song = this.data.songs[song.id];
		}
		else {
			this.data.songs[song.id] = song;
			song.addSubscriber((type, song) => this.changeSong(type, song));
		}

		this.addSongListener.forEach(fn => {
			fn(song);
		});

		return song;
	}

	changeSong(type, song, value) {
		switch(type) {
			case 'songId':
				this.data.order.map(o => o === value ? song.id : o);

				delete this.data.songs[value];
				this.data.songs[song.id] = song;
				break;
			default:
				console.log(type, song, value);
		}

		this.changeSongListener.forEach(fn => {
			fn(type, song, value);
		});

		return song;
	}

	removeSong(index, song) {
		if(index < 0 || index >= this.data.order.length) {
			return song;
		}

		song = this.data.songs[song.id];

		let number = this.data.order.splice(index, 1).pop();
		if(!this.data.order.includes(number)) {
			this.removeSongListener.forEach(fn => {
				fn(song);
			});

			delete this.data.songs[song.id];
		}

		return song;
	}

	songOrder(order) {
		this.data.order = order;
	}
}

let Modal = new class {
	constructor() {
		this.isActive = false;
		this.modal = new element('div').class('modal');
		this.callback = null;

		this.container = new element('div').class('container').parent(this.modal).on('contextmenu', e => {
			e.stopPropagation();
			e.preventDefault();
		});
		let header = new element('header').parent(this.container);
		this.content = new element('div').class('content').parent(this.container);
		this.footer = new element('footer').parent(this.container);

		this.title = new element('h2').parent(header);
		new element('button').html('&times;').parent(header).on('click', e => {
			this.close();
		});

		new element('button').type('submit').text('OK').parent(this.footer).on('click', e => {
			this.close();

			if(this.callback) {
				this.callback();
			}
		})

		document.addEventListener("DOMContentLoaded", () => {
			document.body.insertBefore(this.modal.element, document.body.firstChild);
		});
	}

	show(title, element, hideFooter) {
		this.isActive = true;
		this.title.text(title);
		this.callback = null;
		this.content.removeClass('resizable').height('auto').clear();
		this.footer.style('display', hideFooter ? 'none' : 'block');

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
		this.container.width(width);
		return this;
	}

	height(height) {
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
}

let Account = new class {
	constructor() {
		this.isLoggedIn = false;
		this.data = Object.assign({
			mail: '',
			license: 0
		}, JSON.parse(localStorage.getItem('account') || '{}'));

		if(!isNaN(parseInt(this.data.license))) {
			this.request();
		}
	}

	get license() {
		return this.data.license;
	}

	request(success) {
		AJAX.post('rest.php?login', this.data).success(r => {
			this.isLoggedIn = true;
			localStorage.setItem('account', JSON.stringify(this.data));

			if(success) {
				success(r);
			}
		}).error(r => {
			this.isLoggedIn = false;
			Notification.rest(r)
		});
	}

	login() {
		let wrapper = new element('form').class('login');
		let mail = new element('input').type('mail').name('mail').placeholder('Mail ...').value(this.data.mail).parent(wrapper);
		let license = new element('input').type('text').name('license').placeholder('CCLI License ...').value(this.data.license).parent(wrapper);

		Modal.show('Login', wrapper).width('400px').onApply(r => {
			this.data = {
				mail: mail.value().trim(),
				license: parseInt(license.value().trim()) || 0
			};

			this.request(r => {
				Notification.rest(r);
				Modal.close();
			});
		});
	}
}

let Notification = new class extends Loadable {
	constructor() {
		super();
		this.container = new element('ul').id('alerts');

		this.addOnLoadListener(() => {
			this.container.parent(document.body);
		});
	}

	message(message, type) {
		while(this.container.children.length > 2) {
			this.container.popChild();
		}

		let alert = new element('div').class('alert', type).text(message).parent(this.container).attribute('data-created', Date.now());
		new element('button').type('button').text('×').tooltip('close').parent(alert).on('click', r => {
			alert.remove();
		});

		setTimeout(() => {
			alert.remove();
		}, Config.get('notificationDisappearTime', '3000'));
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

	rest(json) {
		try {
			let data = JSON.parse(json);

			if(data.success) {
				data.success.forEach(message => {
					this.success(message);
				});
			}
			if(data.warnings) {
				data.warnings.forEach(message => {
					this.warning(message);
				});
			}
			if(data.errors) {
				data.errors.forEach(message => {
					this.error(message);
				})
			}
		}
		catch(e) {
			Notification.error(json);
			this.error(json);
		}
	}
}

let Config = new class extends Storable {
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
		if(value === '') {
			value = undefined;
		}

		this.data[item] = value;
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
}

class GUI {
	constructor(rootElement) {
		if(!rootElement) {
			throw new Error('missing "rootElement"');
		}

		this.addSongListener = [];
		this.downloadSongListener = [];
		this.removeSongListener = [];
		this.songOrderListener = [];

		rootElement.on('contextmenu', e => e.preventDefault());

		let search = new element('div').id('search').parent(rootElement);
		this.elementNav = new element('ul').id('nav').parent(rootElement);
		this.elementSongs = new element('ul').id('songs').parent(rootElement);
		this.elementControl = new element('div').id('control').parent(rootElement);
		this.elementPreview = new element('div').id('preview').parent(rootElement)
			.listener('contextmenu', e => e.preventDefault());

		this.config = new element('li').class('config').parent(this.elementNav).on('click', e => {
			this.showConfig();
		});
		this.account = new element('li').class('account').parent(this.elementNav).on('click', e => {
			Account.login();
		});

		this.search = new element('input').parent(search);
		let searchResults = new element('ul').parent(search);
		let searchRequest = fulltext => {
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
				AJAX.post('rest.php?search' + (fulltext ? '&text' : ''), {
					subject: subject
				}).success(r => {
					searchResults.clear();

					JSON.parse(r).forEach(song => {
						new element('li').text('(' + song.songNumber + ') ' + song.title).parent(searchResults).on('mousedown', e => {
							CCLISong.download(song.songNumber).success(r => {
								this.downloadSongListener.forEach(fn => {
									fn(r);
								})
							});
						});
					});
				}).error(r => {
					searchResults.clear();
					Notification.rest(r);
				});
			}
		};

		this.search.on('drop', e => {
			let text = e.dataTransfer.getData('text/plain');

			if(text) {
				this.search.value(text);
			}
		}).on('input', e => {
			searchRequest();
		}).on('keypress', e => {
			switch(e.key) {
				case 'Enter':
					searchRequest(true);
					break;
			}
		});

		this.elementSongs.on('dragover', e => {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
		});

		this.songToMove = null;
		this.current = {
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
					break;
				case 'ArrowUp':
					if(this.current.index > 0) {
						this.scrollTo(--this.current.index);
					}
					break;
				case 'ArrowDown':
					if(this.current.index < this.elementPreview.children.length - 1) {
						this.scrollTo(++this.current.index);
					}
					break;
				case 'KeyB':
					if(!e.ctrlKey) {
						return;
					}

					this.elementPreview.classList.toggle('black');
					break;
				case 'Escape':
				case 'F10':
					this.showConfig();
					break;
				case 'KeyF':
					if(!e.ctrlKey) {
						return;
					}
				case 'F12':
					break;
				default:
					//console.log(e.code)
					return;
			}

			e.preventDefault();
			e.stopPropagation();
		};
	}

	addSubscriber(fn) {
		if(fn) {
			fn({
				addSong: fn => {
					this.addSongListener.push(fn);
				},
				downloadSong: fn => {
					this.downloadSongListener.push(fn);
				},
				removeSong: fn => {
					this.removeSongListener.push(fn);
				},
				songOrder: fn => {
					this.songOrderListener.push(fn);
				}
			});
		}

		return this;
	}

	changeHandler(fn) {
		fn.addSong(fn => this.addSong(fn));
	}

	addSong(song) {
		let li = new element('li')
			.text(song.title)
			.on(Config.get('songClickBehaviour', 'dblclick'), () => this.showSong(song, li))
			.on('contextmenu', e => {
				this.editSong(song, li);
			})
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

				if(this.songToMove.isBefore(e.target)) {
					this.songToMove.before(e.target);
				}
				else {
					this.songToMove.after(e.target);
				}
			})
			.on('dragend', () => {
				this.songToMove.classList.remove('dragged');
				this.songToMove = null;

				let order = [];

				Array.from(this.elementSongs.children).forEach(child => {
					order.push(child.getAttribute('data-number'));
				});

				this.songOrderListener.forEach(fn => {
					fn(order);
				});
			})
			.attribute('draggable', 'true')
			.attribute('data-number', song.id)
			.parent(this.elementSongs);

		new element('button').class('close').tooltip('remove').parent(li).listener('click', e => {
			e.stopPropagation();

			if(Config.get('confirmDelete', false) && !confirm('Do you really want to remove the song?')) {
				return;
			}

			this.removeSongListener.forEach(fn => {
				fn(li.index, song);
			});

			li.remove();
		});

		this.addSongListener.forEach(fn => {
			fn(song);
		});

		return song;
	}

	addLine(block, line) {
		let controlLine = new element('p').parent(block).html(line).listener(Config.get('verseClickBehaviour', 'dblclick'), e => {
			let lines = Array.from(this.elementControl.getElementsByTagName('p'));
			this.current.index = lines.indexOf(controlLine.element);

			this.scrollTo(this.current.index, {
				scrollToBlock: false,
				scrollBehavior: Config.get('verseScrollBehaviour', 'auto')
			});
		});

		if(this.current.text.length < 1) {
			controlLine.class('active');
		}

		let previewLine = new element('p').html(line);
		this.elementPreview.appendChild(previewLine);
		this.current.text.push(previewLine);

		if(previewLine.scrollWidth > this.elementPreview.offsetWidth) {
			controlLine.class('overflow');
		}

		return previewLine;
	}

	showSong(song, li) {
		this.current.index = 0;
		this.current.text = [];

		this.elementNav.clear();
		this.config.parent(this.elementNav);
		this.account.parent(this.elementNav);
		this.elementControl.clear();
		this.elementPreview.clear();
		this.switchActive(this.elementSongs, li);
		this.elementPreview.classList.remove('black');

		song.order.forEach(order => {
			let block = new element('span').parent(this.elementControl).on('contextmenu', e => {
				if(block.classList.contains('hidden')) {
					block.classList.remove('hidden');
					// TODO show live elements
				}
				else {
					block.classList.add('hidden');
					// TODO hide live elements (maybe a listener from line to block???)
				}
			});
			let li = new element('li').text(order).parent(this.elementNav).listener('click', e => {
				let index = Array.from(this.elementControl.getElementsByTagName('p')).indexOf(block.firstElementChild);
				this.current.index = index;
				this.scrollTo(index, {
					scrollBehavior: Config.get('navScrollBehaviour', 'auto')
				});
			});
			block.data('nav', li);

			if(this.current.text.length < 1) {
				block.class('active');
				li.class('active');
			}

			song.blocks[order].forEach(line => this.addLine(block, line));
		});

		let block = new element('span').parent(this.elementControl);
		if(Config.get('showCopyrightInControl', false)) {
			let nav = new element('li').text('© Copyright').parent(this.elementNav);
			block.data('nav', nav);
		}
		this.addLine(block, song.license).class('copyright');

		this.elementControl.firstElementChild.scrollIntoView();
	}

	editSong(song, li) {
		let $ = this;
		let wrapper = new element('div');
		let blocks = {};
		let currentBlock = null;
		let orderCursorPosition = 0;
		let editBlock = new element('textarea');
		let editOrder = new element('input');
		let toggleDelete = new element('li');
		let createNew = new element('li');

		function editBlockHandler() {
			blocks[currentBlock] = editBlock.value();
		}

		function editOrderHandler() {
			let length = editOrder.value().length;
			orderCursorPosition = editOrder.element.selectionStart;
			editOrder.value(editOrder.value().replace(/ *\| */g, ' | ').trim());

			orderCursorPosition += editOrder.value().length - length;
			if(editOrder.element.selectionStart === editOrder.element.selectionEnd) {
				if(editOrder.element.selectionStart !== orderCursorPosition) {
					editOrder.element.selectionEnd = editOrder.element.selectionStart = orderCursorPosition;
				}
			}
			else {
				orderCursorPosition = editOrder.element.selectionStart;
			}
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

			let li = new element('li').text(type).before(createNew).on('click', e => {
				currentBlock = type;
				editBlock.value(blocks[type]);

				$.switchActive(ul, li);
			}).on('dblclick', e => {
				let currentText = editOrder.value();
				let insertText = li.element.textContent;
				let nextPart = currentText.indexOf(' | ', orderCursorPosition);

				if(nextPart < 0) {
					if(currentText.length > 0) {
						insertText = ' | ' + insertText;
					}

					editOrder.value(currentText + insertText);
				}
				else {
					insertText = ' | ' + insertText;

					editOrder.value(currentText.substr(0, nextPart) + insertText + currentText.substr(nextPart));
				}

				// ToDo: remove unnecessary double blocks

				orderCursorPosition += insertText.length;
			});

			new element('button').type('button').parent(li).on('click', e => {
				if(ul.children.length < 4) {
					Notification.error('You can\'t remove all blocks');
					return;
				}

				let active = li.previousElementSibling;
				$.switchActive(ul, toggleDelete.is(active) ? active.nextElementSibling : active);

				li.remove();

				editOrder.value(editOrder.value().split('|').filter(e => {
					return e.trim() !== type
				}).join('|'));

				delete blocks[type];
			});

			if(active) {
				currentBlock = type;
				editBlock.value(blocks[type]);

				$.switchActive(ul, li);
			}
		}

		editBlock.parent(wrapper).on('blur', editBlockHandler);
		editOrder.class('edit').value(song.order.join(' | '))
			.on('click', editOrderHandler).on('blur', editOrderHandler)
			.on('keyup', editOrderHandler);

		let ul = new element('ul').class('options').parent(wrapper);
		toggleDelete.text('-').parent(ul).on('click', e => {
			ul.classList.toggle('remove');
		});
		createNew.text('+').parent(ul).on('click', e => {
			let name = prompt('Name', Config.get('newVerseValue', 'Outro'));

			if(!name) {
				return;
			}

			if(Object.keys(blocks).includes(name)) {
				Notification.error('Block "' + name + '" does already exist');
				return ;
			}

			createBlock(name, [], true);
		});


		song.initialOrder.forEach((order, i) => {
			createBlock(order, song.blocks[order], i < 1);
		});

		editOrder.parent(wrapper);
		orderCursorPosition = editOrder.value().length;

		Modal.show('Order', wrapper).width('1200px').onApply(r => {
			let newOrder = [];

			let value = editOrder.value().split('|');
			let types = Object.keys(blocks);

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

			if(Config.get('reloadSongAfterEdit', false)) {
				this.showSong(song, li);
			}

			if(Account.isLoggedIn) {
				song.upload();
			}
		});
	}

	showConfig() {
		let table = new element('table').class('config');

		Config.forEach((v, k) => {
			let tr = new element('tr').parent(table).on('contextmenu', e => {
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

		Modal.show('Configuration', table).width('520px').resizable('173px').onApply(r => {
			Array.from(table.getElementsByTagName('td')).forEach(td => {
				let key = td.getAttribute('key');

				if(td.getAttribute('reset') === 'true') {
					Config.set(key, undefined);
				}
				else {
					let value = td.textContent.trim();

					switch(td.getAttribute('type')) {
						case 'number':
							value = Number.bind(null, value);
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

		this.switchActive(this.elementControl, p.parentElement, p);
		if(p.parentElement['nav']) {
			this.switchActive(this.elementNav, p.parentElement['nav']);
		}
	}
}

class Song {
	constructor(obj) {
		obj = Object.assign({
			title: 'UNKNOWN',
			songNumber: -1,
			blocks: {},
			initialOrder: [],
			order: []
		}, obj);

		this.changeListener = [];

		this.title = obj.title;
		this.id = obj.songNumber;
		this.blocks = obj.blocks;
		this.initialOrder = obj.initialOrder;
		this.order = obj.order;
	}

	toJSON() {
		let obj = { ...this };
		delete obj.changeListener;
		return obj;
	}

	set id(id) {
		let old = this.songNumber;
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

	setBlock(type, block) {
		if(!Array.isArray(block)) {
			throw new Error('"block" needs to be an array');
		}

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
		throw new Error('Child class needs to implement the method "exists"');
	}

	upload() {
		throw new Error('Child class needs to implement the method "upload"');
	}
}

class CCLISong extends Song {
	static parse(content) {
		let song = new CCLISong();
		let rows = content.trim().split('\r\n');
		let duplicates = 0;

		song.title = rows.splice(0, 3).shift();
		song.account = parseInt(rows.pop().replace(/[^0-9]/g, ''));
		do {
			song.songNumber = rows.pop();
		} while (!song.songNumber.startsWith('CCLI-'));

		song.songNumber = parseInt(song.songNumber.replace(/[^0-9]/g, ''));

		rows.join('\n').split('\n\n\n').forEach(block => {
			let row = block.split('\n').filter(e => { return e !== ''; });
			let type = row.shift();

			if(song.initialOrder.includes(type)) {
				type += ' [' + (++duplicates) + ']';
			}

			song.order.push(type);
			song.initialOrder.push(type);
			song.blocks[type] = row;
		});

		return song;
	}

	static download(songNumber) {
		let success = e => {
			console.log(e);
		}
		let error = e => {
			Notification.rest(e);
		}

		AJAX.get('rest.php?song=' + songNumber).success(r => {
			let obj = JSON.parse(r);

			obj.order = obj.order.split(',');
			obj.initialOrder = obj.initialOrder.split(',');

			for(let i in obj.blocks) {
				let block = [];

				obj.blocks[i].split(' # ').forEach(line => {
					block.push(line.replace(/\{#}/g, '#'));
				});

				obj.blocks[i] = block;
			}

			success(new CCLISong(obj));
		}).error(error);

		return {
			success: fn => {
				if(fn) {
					success = fn;
				}
			},
			error: fn => {
				if(fn) {
					error = fn;
				}
			}
		}
	}

	constructor(obj) {
		obj = Object.assign({
			account: Account.license,
		}, obj);

		super(obj);

		this.account = parseInt(obj.account);
	}

	get license() {
		return 'CCLI-Liednummer ' + this.songNumber + '<br />CCLI-Lizenznummer ' +  this.account;
	}

	exists(existent, nonexistent) {
		AJAX.get('rest.php?exists=' + this.songNumber).success(r => {
			switch(r) {
				case 'EXISTING':
					existent(this);
					break;
				case 'MISSING':
					nonexistent(this);
					break;
				default:
					Notification.rest(r);
			}
		}).error(r => {
			Notification.rest(r);
		});

		return this;
	}

	upload() {
		let success = e => {
			if(Config.get('showSongUploadNotifications', true)) {
				Notification.rest(e);
			}
		};
		let error = e => {
			Notification.rest(e);
		};

		let song = {
			account: this.account,
			songNumber: this.songNumber,
			title: this.title,
			order: this.order.join(','),
			initialOrder: this.initialOrder.join(','),
			blocks: {}
		}

		for(let i in this.blocks) {
			let block = [];
			this.blocks[i].forEach(b => {
				block.push(b.replace(/#/g, '{#}'));
			});

			song.blocks[i] = block.join(' # ');
		}

		AJAX.post('rest.php?song', {song: JSON.stringify(song)}).success(success).error(error);

		return {
			success: fn => {
				if(fn) {
					success = fn;
				}
			},
			error: fn => {
				if(fn) {
					error = fn;
				}
			}
		}
	}
}

window.onbeforeunload = e => {
	if(Config.get('confirmPageLeave', true)) {
		e.preventDefault();
		e.returnValue = '';
	}

	delete e['returnValue'];

	Storable.instances.forEach(i => i.save());
}