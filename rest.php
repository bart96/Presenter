<?php

	require_once('RestResult.php');

	try {
		if(isset($_GET['search'])) {
			if(!isset($_POST['subject'])) {
				RestResult::s500('"subject" is missing');
			}

			require_once('Account.php');

			$searchResult = [];
			$subject = $_POST['subject'];
			if(ctype_digit($subject)) {
				$searchResult = Account::searchSongNumber(intval($subject));
			} else {
				if(isset($_GET['text'])) {
					$searchResult = Account::searchText($subject);
				} else {
					$searchResult = Account::searchTitle($subject);
				}
			}

			echo json_encode(Account::getSongs($searchResult));
			die;
		}

		if(isset($_GET['song'])) {
			if(isset($_POST['song'])) {
				require_once('Account.php');
				Account::checkLogin();

				require_once('Song.php');
				$song = Song::createFromJSON($_POST['song']);

				if(Account::getAccount() !== $song->getAccount()) {
					RestResult::s403('The given license of the song doesn\'t match to your account');
				}

				if($song->update()) {
					RestResult::s200('Song successfully uploaded');
				}

				RestResult::s500('Couldn\'t upload song');
			}

			if(!ctype_digit($_GET['song'])) {
				RestResult::s500('"song" is not a number');
			}

			require_once('Account.php');
			require_once('Song.php');

			echo json_encode(Song::get(Account::getAccount(), intval($_GET['song'])));
			die;
		}

		if(isset($_GET['login'])) {
			if(!isset($_POST['mail']) || strlen($_POST['mail']) < 4) {
				RestResult::s500('"mail" is missing');
			}

			if(!isset($_POST['license']) || strlen($_POST['license']) < 4) {
				RestResult::s500('"license" is missing');
			}

			if(!ctype_digit($_POST['license'])) {
				RestResult::s500('"license" is not a number');
			}

			require_once('Account.php');

			if(Account::login($_POST['mail'], $_POST['license'])) {
				RestResult::s200('Login was successful');
			}

			Account::logout();
			RestResult::s403('Login failed');
		}
	}
	catch(LoginException $e) {
		RestResult::s403($e->getMessage());
	}
	catch(InvalidArgumentException $e) {
		RestResult::s500($e->getMessage());
	}

