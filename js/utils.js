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

	/**
	 * @returns DOMTokenList
	 */
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

	getAttribute(attribute) {
		return this.element.getAttribute(attribute);
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

	appendCSSRule(rule) {
		this.element.sheet.insertRule(rule, this.element.sheet.cssRules.length);
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

	scrollIntoView(options) {
		this.element.scrollIntoView(options);
		return this;
	}

	querySelector(selector) {
		return this.element.querySelector(selector);
	}

	querySelectorAll(selector) {
		return this.element.querySelectorAll(selector);
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
				if(filetypes.includes(file.type)) {
					let reader = new FileReader();
					reader.addEventListener('load', e => {
						$.loaded.forEach(fn => {
							fn(e.target.result, file.name);
						});
					});
					reader.readAsText(file);
				}
				else {
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