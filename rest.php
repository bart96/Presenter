<?php

	require_once('RestResult.php');

	try {
		if(isset($_GET['search'])) {
			if(!(isset($_POST['subject']) || isset($_GET['all']))) {
				RestResult::s500('"subject" is missing');
			}

			require_once('Account.php');

			$searchResult = [];

			if(isset($_GET['all'])) {
				$order = null;

				if(isset($_GET['order'])) {
					$order = $_GET['order'];
				}

				$searchResult = Account::searchAll($order);
			}
			else {
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
			}

			echo json_encode($searchResult);
			die;
		}

		if(isset($_GET['song'])) {
			require_once('Account.php');
			require_once('Song.php');

			Account::checkLogin();

			if(isset($_POST['song'])) {
				$song = Song::createFromJSON($_POST['song']);

				if(Account::getAccount() !== $song->getAccount()) {
					RestResult::s403('The given license of the song doesn\'t match to your account');
				}

				if($song->update()) {
					(new RestResult())
						->addSuccess('Song successfully uploaded')
						->setData(['songNumber' => $song->getSongNumber()])
						->send(200);
				}

				RestResult::s500('Couldn\'t upload song');
			}

			if(!ctype_digit($_GET['song'])) {
				RestResult::s500('"song" is not a number');
			}

			if(isset($_GET['delete'])) {
				if(Song::delete(Account::getAccount(), intval($_GET['song']))) {
					RestResult::s200('Song successfully deleted');
				}
				else {
					RestResult::s500('Unable to delete song');
				}
			}
			else {
				echo json_encode(Song::get(Account::getAccount(), intval($_GET['song'])));
			}

			die;
		}

		if(isset($_GET['shows'])) {
			require_once('Account.php');
			Account::checkLogin();

			switch($_GET['shows']) {
				case 'upload':
					if(!isset($_POST['data'])) {
						RestResult::s500('"data" is missing');
					}

					$data = json_decode($_POST['data'], true);

					if(!isset($data['show'])) {
						RestResult::s500('Couldn\'t find "show" in "data"');
					}

					if(!isset($data['order'])) {
						RestResult::s500('Couldn\'t find "order" in "data"');
					}

					Account::saveShow($data['show'], join(',', $data['order']));
					RestResult::s200('Show successfully uploaded');
					break;
				case 'download':
					if(!isset($_GET['title'])) {
						RestResult::s500('"title" is missing');
					}

					echo json_encode(Account::getShow($_GET['title']));
					break;
				case 'delete':
					if(!isset($_GET['title'])) {
						RestResult::s500('"title" is missing');
					}

					Account::deleteShow($_GET['title']);
					RestResult::s200('"' . $_GET['title'] . '" successfully deleted');
					break;
				case 'CCLI':
					$limit = 30;
					if(isset($_GET['limit'])) {
						if(!ctype_digit($_GET['limit'])) {
							RestResult::s500('"limit" is not a number');
						}

						$limit = intval($_GET['limit']);
					}

					echo json_encode(ACCOUNT::getCCLINumbers($limit));
					break;
				default:
					$limit = 30;
					if(isset($_GET['limit'])) {
						if(!ctype_digit($_GET['limit'])) {
							RestResult::s500('"limit" is not a number');
						}

						$limit = intval($_GET['limit']);
					}

					echo json_encode(Account::getShows($limit));
			}

			die;
		}

		if(isset($_GET['exists'])) {
			if(!ctype_digit($_GET['exists'])) {
				RestResult::s500('"exists" is not a number');
			}

			require_once('Account.php');
			Account::checkLogin();

			require_once('Song.php');
			echo Song::has(Account::getAccount(), intval($_GET['exists'])) ? 'EXISTING' : 'MISSING';
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
	catch(Exception $e) {
		RestResult::s500($e->getMessage());
	}

