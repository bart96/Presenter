<?php

    function file_prevent_caching($path) {
        echo $path . '?' . base_convert(filemtime($path), 10, 35);
    }

?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Presenter</title>

    <script type="text/javascript" src="<?php file_prevent_caching('script.js'); ?>"></script>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?php file_prevent_caching('style.css'); ?>" media="all">
    <link rel="shortcut icon" type="image/svg+xml" href="favicon.svg">
    <link rel="alternate icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
<main></main>

<script>
    (function(e) {
		let storage = new Storage();
		let gui = new GUI(e);

		storage.addSubscriber(gui.changeHandler);
		gui.addSubscriber(storage.changeHandler);

		/*
		storage.addSubscriber(() => gui.changeHandler(... arguments));
		gui.addSubscriber(() => storage.changeHandler(... arguments));
        */

		new DragNDrop(e, ['text/plain'], 'over', element.from('#songs')).onFileLoaded(text => {
			CCLISong.parse(text).exists(s => {
				let message = 'The song "' + s.title + '" with number "' + s.songNumber
					+ '" already exists.\nDo you want to override it?';

				if(Config.get('overrideSongByImport', false) || confirm(message)) {
					storage.addSong(s).upload();
				}
            }, s => {
				storage.addSong(s).upload();
            });
		}).onError(console.log);
	})(element.from('main'));
</script>
</body>
</html>