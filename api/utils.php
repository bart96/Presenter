<?php

	if(!defined('API')) die(':/');

	require_once(__DIR__ . '/../classes/Request.php');
	require_once(__DIR__ . '/../classes/Response.php');

	function getCurrentDate() : string { return date('Y-m-d'); }
