<?php

	const API = __DIR__ . '/api/';

	require_once(__DIR__ . '/api/utils.php');

	session_start();

	$path = trim(strtok($_SERVER['REQUEST_URI'], '?'));
	$paths = explode('/', $path);
	$index = array_search('rest', $paths);

	if($index === false) {
		(new Response())->error(500, 'could not find "rest" in path');
	}
	else {
		++$index;

		if(str_ends_with($path, '/')) {
			array_pop($paths);
		}
	}

	$restControllerClass = ucfirst($paths[$index]);
	$restControllerFile = API . $restControllerClass . '.php';

	if(!isset($_SESSION['account']) && $restControllerClass !== 'Session') {
		(new Response())->error(401);
	}

	if(!file_exists($restControllerFile)) {
		(new Response())->error(404, $restControllerClass . '.php does not exist');
	}
	else {
		require_once($restControllerFile);

		if($restControllerClass == 'RestController') {
			(new Response())->error(404, 'cannot call abstract RestController class');
		}
		else if(!class_exists($restControllerClass)) {
			(new Response())->error(404, 'class ' . $restControllerClass . ' does not exist');
		}
		else {
			$controller = new $restControllerClass();

			if($controller instanceof RestController) {
				$controller->handle(new Request(array_slice($paths, $index + 1)));
			}
			else {
				(new Response())->error(500, 'class ' . $restControllerClass . ' does not inherit from RestController');
			}
		}
	}

