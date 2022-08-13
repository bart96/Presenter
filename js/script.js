
const SONG_UNKNOWN = 'UNKNOWN';
const CUSTOM_NUMBER_LIMIT = 10000;
const SONG_SEPARATOR = '---';

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
			PopUp.send('visibility', 'mouse', Config.get('hideMouse', true));
			PopUp.send('visibility', 'text', this.elementPreview.classList.contains('hide-text'));

			const song = this.elementPreview.getAttribute('song');
			if(song) {
				PopUp.send('song', song);
			}

			const active = this.lines.getActiveControl();
			if(active && active.parentElement) {
				PopUp.send('active', active.parentElement);
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

		document.onkeydown = (e) => {
			if(Modal.isActive) {
				return;
			}

			switch(e.code) {
				case 'Home':
					this.lines.home();
					break;
				case 'ArrowUp':
					this.lines.prev();
					break;
				case 'ArrowDown':
					this.lines.next();
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

				control.on(Config.get('verseClickBehaviour', 'dblclick'), e => {
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
					this.to(0, !Config.get('doubleClickSmoothScrollBehaviour', false));
				}

				return this;
			}

			to(lineNumberOrControlElement, preventSmoothScroll) {
				let lineId, controlElement;

				if(typeof lineNumberOrControlElement === 'number') {
					lineId = lineNumberOrControlElement;
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
						PopUp.send('active', block);
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

	addLine(block, line, className) {
		if(!line) {
			line = '<br />';
		}

		let controlLine = new element('p').parent(block).html(line);
		let previewLine = new element('p').html(line);
		this.elementPreview.appendChild(previewLine);

		if(className) {
			controlLine.class(className);
			previewLine.class(className);
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
					if(header.nextElementSibling) {
						this.lines.to(header.nextElementSibling, !Config.get('headlineSmoothScrollBehaviour', false));
					}
				});
				block.data('nav', header);

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

		block = new element('span').class('copyright').parent(this.elementControl);
		new element('h1').html('©<em>Copyright</em>').parent(block);
		this.addLine(block, song.info.join('<br />')).class('copyright');

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
		const $ = this;
		const wrapper = new element('div').class('song');
		const blocks = {};
		let currentBlock = null;
		const title = new element('input');
		const authors = new element('input');
		const copyright = new element('input');
		const editBlock = new element('textarea');
		const editOrder = new element('ul');
		const options = new element('li');

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

		function add(index) {
			let li = new element('li').on('click', _ => {
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