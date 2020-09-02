
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

let Modal = new class {
	constructor() {
		this.modal = new element('div').class('modal');
		this.callback = null;

		let container = new element('div').class('container').parent(this.modal);
		let header = new element('header').parent(container);
		this.content = new element('div').class('content').parent(container);
		let footer = new element('footer').parent(container);

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

	show(title, element, callback) {
		this.modal.class('show');
		this.title.text(title);
		this.callback = callback;
		this.content.clear();
		this.content.appendChild(element);
	}
}

let Config = new class {
	constructor() {
		this.config = {};
		this.showCopyrightInControl = false;
		this.reloadSongOnOrderChange = false;
		this.confirmDelition = false;
		this.confirmPageLeave = true;
		this.scrollAnimation = true;
	}

	get(item, defaultValue) {
		if(this.config[item] === undefined) {
			if(defaultValue === undefined) {
				defaultValue = false;
			}

			this.config[item] = defaultValue;
		}

		return this.config[item];
	}

	set(item, value) {
		this.config[item] = value;
	}
}

class GUI {
	constructor(rootElement) {
		if(!rootElement) {
			throw new Error('missing "rootElement"');
		}

		this.search = new element('input').id('search').parent(rootElement);
		this.elementNav = new element('ul').id('nav').parent(rootElement);
		this.elementSongs = new element('ul').id('songs').parent(rootElement);
		this.elementControl = new element('div').id('control').parent(rootElement);
		this.elementPreview = new element('div').id('preview').parent(rootElement)
			.listener('contextmenu', e => e.preventDefault());

		this.songToMove = null;
		this.current = {
			index: 1,
			text: []
		};

		rootElement.on('contextmenu', e => e.preventDefault());

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
				case 'KeyF':
					if(!e.ctrlKey) {
						return;
					}
				case 'F12':
					break;
				default:
					return;
			}

			e.preventDefault();
			e.stopPropagation();
		}
	}

	addCCLISong(song) {
		let li = new element('li')
			.text(song.title)
			.on('dblclick', () => this.showSong(song, li))
			.on('contextmenu', e => {
				this.editOrder(song, li);
			})
			.on('dragover', e => {
				if(this.songToMove.isBefore(e.target)) {
					this.songToMove.before(e.target);
				}
				else {
					this.songToMove.after(e.target);
				}
			})
			.on('dragstart', e => {
				this.songToMove = li;
				this.songToMove.class('dragged');
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', null);
			})
			.on('dragend', () => {
				this.songToMove.classList.remove('dragged');
				this.songToMove = null;
			})
			.attribute('draggable', 'true')
			.parent(this.elementSongs);

		new element('button').class('close').tooltip('remove').parent(li).listener('click', e => {
			if(Config.get('confirmDelete', true) && !confirm('Do you really want to remove the song?')) {
				return;
			}

			li.remove();
		});
	}

	addLine(block, line) {
		let controlLine = new element('p').parent(block).html(line).listener('dblclick', e => {
			let lines = Array.from(this.elementControl.getElementsByTagName('p'));
			this.current.index = lines.indexOf(controlLine.element);

			this.scrollTo(this.current.index, true);
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
		this.current.index = 1;
		this.current.text = [];

		this.elementNav.clear();
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
				this.scrollTo(index);
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
		this.addLine(block, song.CCLISongNumber + '<br />' + song.CCLILicense).class('copyright');

		this.elementControl.firstElementChild.scrollIntoView();
	}

	editOrder(song, li) {
		let wrapper = new element('div');
		let cursorPosition = 0;

		let edit = new element('input').class('edit').value(song.order.join(' | '));

		function inputHandler() {
			let length = edit.value().length;
			cursorPosition = edit.element.selectionStart;
			edit.value(edit.value().replace(/ *\| */g, ' | ').trim());

			cursorPosition += edit.value().length - length;
			if(edit.element.selectionStart === edit.element.selectionEnd) {
				if(edit.element.selectionStart !== cursorPosition) {
					edit.element.selectionEnd = edit.element.selectionStart = cursorPosition;
				}
			}
			else {
				cursorPosition = edit.element.selectionStart;
			}
		}

		edit.on('click', inputHandler).on('blur', inputHandler).on('keyup', inputHandler);

		let ul = new element('ul').class('options').parent(wrapper);
		song.initalOrder.forEach(order => {
			let li = new element('li').text(order).parent(ul).on('click', e => {
				let currentText = edit.value();
				let insertText = li.element.textContent;
				let nextPart = currentText.indexOf(' | ', cursorPosition);

				if(nextPart < 0) {
					if(currentText.length > 0) {
						insertText = ' | ' + insertText;
					}

					edit.value(currentText + insertText);
				}
				else {
					insertText = ' | ' + insertText;

					edit.value(currentText.substr(0, nextPart) + insertText + currentText.substr(nextPart));
				}

				cursorPosition += insertText.length;
			});
		});

		edit.parent(wrapper);
		cursorPosition = edit.value().length;

		Modal.show('Order', wrapper, r => {
			let newOrder = [];

			let value = edit.value().split('|');
			value.forEach(v => {
				v = v.trim();

				if(song.initalOrder.includes(v)) {
					newOrder.push(v);
				}
			});

			if(newOrder.length < 1) {
				newOrder = song.initalOrder;
			}

			song.saveOrder(newOrder);
			if(Config.get('reloadSongOnOrderChange', false)) {
				this.showSong(song, li);
			}
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

	scrollTo(lineNumber, scrollNotToBlock) {
		let offset = 1;
		let scrollOptions = {
			behavior: 'smooth',
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
		if(!scrollNotToBlock && p.parentElement.nextElementSibling) {
			p.parentElement.nextElementSibling.scrollIntoView(scrollOptions);
		}

		this.switchActive(this.elementControl, p.parentElement, p);
		if(p.parentElement['nav']) {
			this.switchActive(this.elementNav, p.parentElement['nav']);
		}
	}
}

class CCLISong {
	constructor(content) {
		let rows = content.trim().split('\r\n');
		let duplicates = 0;

		this.title = rows.splice(0, 3).shift();
		this.blocks = {};
		this.initalOrder = [];
		this.order = [];
		this.CCLILicense = rows.pop();
		do {
			this.CCLISongNumber = rows.pop();
		} while (!this.CCLISongNumber.startsWith('CCLI-'));

		this.songNumber = this.CCLISongNumber.replace(/[^0-9]/g, '');

		rows.join('\n').split('\n\n\n').forEach(block => {
			let row = block.split('\n').filter(e => { return e !== ''; });
			let type = row.shift();

			if(this.initalOrder.includes(type)) {
				type += ' [' + (++duplicates) + ']';
			}

			this.initalOrder.push(type);
			this.blocks[type] = row;
		});

		this.loadOrder();
	}

	loadOrder() {
		let storage = JSON.parse(localStorage.getItem('CCLISongOrder') || '{}');

		if(storage[this.songNumber]) {
			this.order = storage[this.songNumber];
		}
		else {
			this.saveOrder(this.initalOrder);
		}
	}

	saveOrder(order) {
		let storage = JSON.parse(localStorage.getItem('CCLISongOrder') || '{}');

		this.order = order;
		storage[this.songNumber] = order;

		localStorage.setItem('CCLISongOrder', JSON.stringify(storage));
	}

	get text() {
		let text = [];

		this.order.forEach(order => {
			text = text.concat(this.blocks[order]);
		});

		return text;
	}
}

window.onbeforeunload = e => {
	if(Config.get('confirmPageLeave', true)) {
		e.preventDefault();
		e.returnValue = '';
	}

	delete e['returnValue'];
}