<?php

function file_prevent_caching($path) : void {
	echo $path . '?v=' . base_convert(filemtime($path), 10, 35);
}

?><!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Presenter</title>

	<link rel="stylesheet" href="<?php file_prevent_caching('css/style.css'); ?>" media="all">
	<link rel="stylesheet" href="<?php file_prevent_caching('css/background.css'); ?>" media="all">
	<style>
		body:fullscreen.hide-mouse {
			cursor: none;
		}

		body.hide-background #background {
			opacity: 0;
		}

		body.hide-preview #content p.preview {
			display: none;
		}

		#content button {
			margin-top: 30vh;
			padding: 10px 15px;
			font-size: 4vw;
			border-radius: 15px;
			color: var(--bright);
			background: var(--primary);
			vertical-align: middle;
			cursor: pointer;
		}

		#content button:hover {
			background: var(--highlight);
		}
	</style>
</head>
<body>
	<div id="background"></div>
	<div id="content">
		<button type="button">Activate Fullscreen</button>
	</div>

	<script>
		const content = document.querySelector('#content');
		const button = content.querySelector('button');
		button.onclick = _ => {
			document.body.requestFullscreen();
			button.parentElement.removeChild(button);
		}

		document.body.ondblclick = _ => {
			if(window.fullScreen) {
				document.exitFullscreen();
			}
			else {
				document.body.requestFullscreen();
				if(button.parentElement) {
					button.parentElement.removeChild(button);
				}
			}
		};

		document.body.oncontextmenu = e => {
			if(window.fullScreen && document.body.classList.contains('hide-mouse')) {
				e.preventDefault();
				e.stopPropagation();
			}
		}

		let resizeHandlerTimeout = false;
		window.resizeHandler = null;
		document.body.onresize = _ => {
			if(window.resizeHandler) {
				if(resizeHandlerTimeout !== false) {
					clearTimeout(resizeHandlerTimeout);
				}

				resizeHandlerTimeout = setTimeout(_ => {
					window.resizeHandler({
						popupTop: window.screenY,
						popupLeft: window.screenX,
						popupWidth: window.innerWidth,
						popupHeight: window.innerHeight
					});

					resizeHandlerTimeout = false;
				}, 900);
			}
		}

		let currentActive = null;
		window.handler = (type, callback, ... params) => {
			switch(type) {
				case 'active':
					if(currentActive !== params[0]) {
						currentActive = params[0];
						const preview = params[1];

						while(content.firstElementChild) {
							content.removeChild(content.firstElementChild);
						}

						content.style.opacity = currentActive.classList.contains('copyright') ? '0' : '';
						content.className = currentActive.className;

						Array.from(currentActive.getElementsByTagName('p')).forEach(child => {
							content.append(child.cloneNode(true));
						});

						if(preview) {
							preview.forEach(line => {
								line.classList.add('preview');
								content.append(line);
							});
						}

						const isBlack = content.classList.contains('hide-text');
						if(isBlack) {
							content.classList.add('hide-text');
						}
					}
					break;
				case 'song':
					document.body.id = `song_${params[0]}`;
					break;
				case 'toggleVisibility':
					callback(params[0], document.body.classList.toggle(`hide-${params[0]}`));
					break;
				case 'visibility':
					if(params[1]) {
						document.body.classList.add(`hide-${params[0]}`);
					}
					else {
						document.body.classList.remove(`hide-${params[0]}`);
					}
					break;
				case 'margin':
					content.style.margin = params[0];
					break;
				case 'padding':
					content.style.padding = params[0];
					break;
				case 'translation':
					const showTranslation = params[0];

					if(showTranslation !== 'true') {
						document.body.classList.add('hideTranslation');

						if(showTranslation !== 'false') {
							const style = document.createElement('style');
							document.head.append(style);

							const visibleLanguages = showTranslation.split(',');
							visibleLanguages.forEach(language => {
								style.sheet.insertRule(
									`body.hideTranslation p.translation.language_${language} {display: block}`,
									style.sheet.cssRules.length
								);
							});
						}
					}
					break;
				case 'closing':
					let counter = 40;
					const parentLoaded = params[0];
					const job = setInterval(_ => {
						try {
							const loaded = self.opener.document.body.getAttribute('data-loaded');

							if(parentLoaded !== loaded) {
								window.close();
							}

							if(counter-- < 0) {
								clearInterval(job);
							}
						} catch(e) {
							window.close();
						}
					}, 500);
					break;
				default:
					console.log(type, ... params);
			}
		}

		window.onerror = function(message, source, lineno, colno) {
			AJAX.post('rest/Log', {
				message: `${source}[${lineno}:${colno}] - ${message}`
			}).catch(e => console.error(e));
		}
	</script>
</body>
</html>