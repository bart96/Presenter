
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

	get parentElement() {
		return this.element.parentElement;
	}

	get firstElementChild() {
		return this.element.firstElementChild;
	}

	get lastElementChild() {
		return this.element.lastElementChild;
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

	id(id) {
		this.element.id = id;
		return this;
	}

	removeClass(... classees) {
		this.element.classList.remove(... classees);
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

	before(element) {
		element.parentElement.insertBefore(this.element, element);
		return this;
	}

	after(element) {
		if(element.nextElementSibling === null) {
			element.parentElement.appendChild(this.element);
		}
		else {
			element.parentElement.insertBefore(this.element, element.nextElementSibling);
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
		this.element.style = height;
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

	load() {
		try {
			let data = JSON.parse(localStorage.getItem(this.itemName));

			if(!data) {
				return;
			}

			this.convert(data);
		}
		catch(e) {
			console.log('Couldn\'t load data "' + this.itemName + '" from localStorage: ' + e.message);
		}
	}

	save() {
		if(this.data) {
			localStorage.setItem(this.itemName, JSON.stringify(this.data));
		}
	}
}

class Storage extends Storable {
	constructor() {
		super('data', {
			version: '1.0',
			songs: {}
		});
	}

	convert(data) {
		switch(data.version) {
			case '1.0':
				this.data.version = data.version;

				for(let i in data.songs) {
					this.addSong(new CCLISong(data.songs[i]));
				}
				break;
			default:
				throw new Error('Version is invalid');
		}
	}

	get songs() {
		return Object.values(this.data.songs).sort((a, b) => {
			return a.title - b.title;
		});
	}

	addSong(song) {
		this.data.songs[song.id] = song;
		song.addChangeListenerId(fn => this.updateSongId(fn));

		return this;
	}

	changeSong(type, song) {
		console.log(type, song);
		return this;
	}

	removeSong(song) {
		delete this.data.songs[song.id];
		return this;
	}

	updateSongId(song, old) {
		delete this.data.songs[old];
		this.addSong(song);
	}
}

let Modal = new class {
	constructor() {
		this.modal = new element('div').class('modal');
		this.callback = null;

		this.container = new element('div').class('container').parent(this.modal).on('contextmenu', e => {
			e.stopPropagation();
			e.preventDefault();
		});
		let header = new element('header').parent(this.container);
		this.content = new element('div').class('content').parent(this.container);
		let footer = new element('footer').parent(this.container);

		this.title = new element('h2').parent(header);
		new element('button').html('&times;').parent(header).on('click', e => {
			this.modal.classList.remove('show');
		});

		new element('button').text('OK').parent(footer).on('click', e => {
			this.modal.classList.remove('show');
			if(this.callback) {
				this.callback();
			}
		})

		document.addEventListener("DOMContentLoaded", () => {
			document.body.insertBefore(this.modal.element, document.body.firstChild);
		});
	}

	show(title, element) {
		this.modal.class('show');
		this.title.text(title);
		this.callback = null;
		this.content.clear();
		this.content.appendChild(element);

		return this;
	}

	onApply(fn) {
		this.callback = fn;
		return this;
	}

	width(width) {
		this.container.width(width);
		return this;
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

		this.songAddListener = [];
		this.songChangeListener = [];
		this.songRemoveListener = [];

		rootElement.on('contextmenu', e => e.preventDefault());

		this.search = new element('input').id('search').parent(rootElement);
		this.elementNav = new element('ul').id('nav').parent(rootElement);
		this.elementSongs = new element('ul').id('songs').parent(rootElement);
		this.elementControl = new element('div').id('control').parent(rootElement);
		this.elementPreview = new element('div').id('preview').parent(rootElement)
			.listener('contextmenu', e => e.preventDefault());

		this.config = new element('li').class('config').parent(this.elementNav).on('click', e => {
			this.showConfig();
		});

		this.search.on('drop', e => {
			let text = e.dataTransfer.getData('text/plain');

			if(text) {
				this.search.value(text);
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
		}
	}

	addSongAddListener(fn) {
		this.songAddListener.push(fn);
		return this;
	}

	addSongChangeListener(fn) {
		this.songChangeListener.push(fn);
		return this;
	}

	addSongRemoveListener(fn) {
		this.songRemoveListener.push(fn);
		return this;
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
			})
			.attribute('draggable', 'true')
			.parent(this.elementSongs);

		new element('button').class('close').tooltip('remove').parent(li).listener('click', e => {
			e.stopPropagation();

			if(Config.get('confirmDelete', true) && !confirm('Do you really want to remove the song?')) {
				return;
			}

			li.remove();
			this.songRemoveListener.forEach(fn => {
				fn(song);
			});
		});

		this.songAddListener.forEach(fn => {
			fn(song);
		});
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
		let wrapper = new element('div');
		let blocks = {};
		let currentBlock = null;
		let orderCursorPosition = 0;

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

		let editBlock = new element('textarea').parent(wrapper);
		let editOrder = new element('input').class('edit').value(song.order.join(' | '));

		editBlock.on('blur', editBlockHandler);
		editOrder.on('click', editOrderHandler).on('blur', editOrderHandler).on('keyup', editOrderHandler);

		let ul = new element('ul').class('options').parent(wrapper);
		song.initialOrder.forEach((order, i) => {
			blocks[order] = song.blocks[order].join('\n');

			let li = new element('li').text(order).parent(ul).on('click', e => {
				currentBlock = order;
				editBlock.value(blocks[order]);

				this.switchActive(ul, li);
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

				orderCursorPosition += insertText.length;
			});

			if(i < 1) {
				currentBlock = order;
				editBlock.value(blocks[order]);

				li.classList.add('active');
			}
		});

		editOrder.parent(wrapper);
		orderCursorPosition = editOrder.value().length;

		Modal.show('Order', wrapper).width('1200px').onApply(r => {
			let newOrder = [];

			let value = editOrder.value().split('|');
			value.forEach(v => {
				v = v.trim();

				if(song.initialOrder.includes(v)) {
					newOrder.push(v);
				}
			});

			if(newOrder.length < 1) {
				newOrder = song.initialOrder;
			}

			this.songChangeListener.forEach(fn => {
				fn('order', song, newOrder);
			})

			song.saveOrder(newOrder);
			for(let i in blocks) {
				song.saveBlock(i, blocks[i].replace(/(\n\s*)|(\s*\n)|(\n\s*\n)/g, '\n').split('\n'));
			}

			if(Config.get('reloadSongAfterEdit', false)) {
				this.showSong(song, li);
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

		Modal.show('Configuration', table).width('400px').onApply(r => {
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

		this.changeListenerId = [];

		this.title = obj.title;
		this.id = obj.songNumber;
		this.blocks = obj.blocks;
		this.initialOrder = obj.initialOrder;
		this.order = obj.order;
	}

	toJSON() {
		let obj = { ...this };
		delete obj.changeListenerId;
		return obj;
	}

	set id(id) {
		let old = this.songNumber;
		this.songNumber = id;

		this.changeListenerId.forEach(fn => {
			fn(this, old);
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

	addChangeListenerId(fn) {
		this.changeListenerId.push(fn);
		return this;
	}

	saveBlock(type, block) {
		if(this.blocks[type]) {
			this.blocks[type] = block;
		}
	}

	saveOrder(order) {
		this.order = order;
	}
}

class CCLISong extends Song {
	static parse(content) {
		let song = new CCLISong();
		let rows = content.trim().split('\r\n');
		let duplicates = 0;

		song.title = rows.splice(0, 3).shift();
		song.CCLILicense = rows.pop();
		do {
			song.CCLISongNumber = rows.pop();
		} while (!song.CCLISongNumber.startsWith('CCLI-'));

		song.songNumber = song.CCLISongNumber.replace(/[^0-9]/g, '');

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

	constructor(obj) {
		obj = Object.assign({
			CCLILicense: 'None',
			CCLISongNumber: -1
		}, obj);

		super(obj);

		this.CCLILicense = obj.CCLILicense;
		this.CCLISongNumber = obj.CCLISongNumber;
	}

	get license() {
		return this.CCLISongNumber + '<br />' + this.CCLILicense;
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