<?php

	function file_prevent_caching($path) : void {
		echo $path . '?v=' . base_convert(filemtime($path), 10, 35);
	}

?><!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Presenter</title>

	<script type="text/javascript" src="<?php file_prevent_caching('js/song.js'); ?>"></script>
	<script type="text/javascript" src="<?php file_prevent_caching('js/utils.js'); ?>"></script>
	<script type="text/javascript" src="<?php file_prevent_caching('js/script.js'); ?>"></script>
	<link rel="stylesheet" href="<?php file_prevent_caching('css/style.css'); ?>" media="all">
	<link rel="shortcut icon" type="image/svg+xml" href="favicon.svg">
	<link rel="alternate icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
<main></main>

<script>
	(e => {
		let storage = new Storage();
		let gui = new GUI(e);

		storage.addSubscriber(gui.changeHandler);
		gui.addSubscriber(storage.changeHandler);

		new DragNDrop(e, ['text/plain'], 'over', element.from('#songs')).onFileLoaded((text, filename) => {
			CCLISong.parse(text, filename).exists().then(({exists, song}) => {
				if(exists) {
					let message = `The song "${song.title}" with number "${song.songNumber}" already exists\n`
						+ 'Do you want to override it?';

					if(Config.get('OVERRIDE_SONG_BY_IMPORT') || confirm(message)) {
						storage.addSong(song).upload(true);
					}
				}
				else {
					storage.addSong(song).upload();
				}

			});
		}).onError(console.log);
	})(element.from('main'));
</script>
</body>
</html>