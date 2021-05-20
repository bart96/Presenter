<?php

function file_prevent_caching($path) {
	echo $path . '?v=' . base_convert(filemtime($path), 10, 35);
}

?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Presenter</title>

    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?php file_prevent_caching('style.css'); ?>" media="all">
    <link rel="stylesheet" href="<?php file_prevent_caching('background.css'); ?>" media="all">
    <style>
        html {
			cursor: none;
        }
    </style>
</head>
<body>

    <div id="background"></div>
    <div id="content"></div>

<script>
    document.body.ondblclick = e => {
    	if(window.fullScreen) {
			document.exitFullscreen();
		}
    	else {
			document.body.requestFullscreen();
        }
    };
</script>
</body>
</html>