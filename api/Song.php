<?php

	require_once(__DIR__ . '/RestController.php');

	class Song extends RestController {
		const SEPARATOR_ORDER = ',';
		const SEPARATOR_BLOCK = ' # ';
		const SEPARATOR_BLOCK_ESCAPE = '{#}';

		const UNKNOWN_AUTHOR = 'UNKNOWN'; /* update UNKNOWN_AUTHOR in js/song.js as well */
		const UNKNOWN_COPYRIGHT = ''; /* update UNKNOWN_COPYRIGHT in js/song.js as well */

		protected function get(Request &$req, Response &$res) : never {
			$req->path->checkNumeric(0);

			$account = $req->account;
			$songNumber = $req->path->getAsInt(0);

			$result = [
				'account' => $account,
				'songNumber' => $songNumber
			];

			$stmt = self::prepare('
				SELECT `title`, `initialOrder`, `order`, `authors`, `copyright`
				FROM `songs`
				WHERE `songnumber` = ?
				AND `account` = ?
			');

			$stmt->bind_param('ii', $songNumber, $account)->execute();
			$stmt->bind_result($title, $initialOrder, $order, $authors, $copyright);

			if($stmt->fetch()) {
				$result['title'] = $title;
				$result['initialOrder'] = explode(self::SEPARATOR_ORDER, $initialOrder);
				$result['order'] = explode(self::SEPARATOR_ORDER, $order);
				$result['blocks'] = [];
				$result['authors'] = $authors;
				$result['copyright'] = $copyright;

				$stmt->close();

				$stmt = self::prepare('
					SELECT `type`, `text`
					FROM `blocks`
					WHERE `songnumber` = ?
					AND `account` = ?
				');

				$stmt->bind_param('ii', $songNumber, $account)->execute()->bind_result($type, $text);
				while($stmt->fetch()) {
					$blocksText = [];

					foreach(explode(self::SEPARATOR_BLOCK, $text) as $t) {
						$blocksText[] = str_replace(self::SEPARATOR_BLOCK_ESCAPE, self::SEPARATOR_BLOCK, $t);
					}

					$result['blocks'][$type] = $blocksText;
				}
			}
			else {
				$stmt->close();

				$res->error(400, 'Could not find Song #' . $songNumber);
			}

			$stmt->close();

			$res->success($result);
		}

		protected function post(Request &$req, Response &$res) : never {
			$req->params->check('title')->checkArray('initialOrder')->checkObject('blocks');

			$account = $req->account;
			$songNumber = $req->params->getAsInt('songNumber');
			$title = $req->params->get('title');
			$initialOrder = $req->params->getAsArray('initialOrder');
			$order = $req->params->getAsArray('order', $initialOrder);
			$blocks = $req->params->getAsObject('blocks');
			$authors = $req->params->get('authors', self::UNKNOWN_AUTHOR);
			$copyright = $req->params->get('copyright', self::UNKNOWN_COPYRIGHT);

			if($songNumber === NULL || $songNumber < 0) {
				$songNumber = $this->generateSongNumber($account);
			}

			$stmt = self::prepare('
				INSERT INTO `songs` (
					`account`, `songnumber`, `title`, `initialOrder`, `order`, `authors`, `copyright`
				) VALUES (
					?, ?, ?, ?, ?, ?, ?
				)
			');

			$stmt->bind_param(
				'iisssss',
				$account,
				$songNumber,
				$title,
				join(self::SEPARATOR_ORDER, $initialOrder),
				join(self::SEPARATOR_ORDER, $order),
				$authors,
				$copyright
			)->execute()->close();

			$this->insertBlocks($account, $songNumber, $blocks);

			$res->success([
				'account' => $account,
				'songNumber' => $songNumber,
				'title' => $title,
				'initialOrder' => $initialOrder,
				'order' => $order,
				'blocks' => $blocks,
				'authors' => $authors,
				'copyright' => $copyright
			]);
		}

		protected function put(Request &$req, Response &$res) : never {
			$req->params->checkNumeric('songNumber')->check('title')->checkArray('initialOrder', 'order')->checkObject('blocks');

			$account = $req->account;
			$songNumber = $req->params->getAsInt('songNumber');
			$title = $req->params->get('title');
			$initialOrder = $req->params->getAsArray('initialOrder');
			$order = $req->params->getAsArray('order');
			$blocks = $req->params->getAsObject('blocks');
			$authors = $req->params->get('authors', self::UNKNOWN_AUTHOR);
			$copyright = $req->params->get('copyright', self::UNKNOWN_COPYRIGHT);

			$stmt = self::prepare('
				UPDATE `songs`
				SET `authors` = ?,
				    `copyright` = ?
				WHERE `songnumber` = ?
				AND `account` = ?
			');

			$stmt->bind_param(
				'ssii',
				$authors,
				$copyright,
				$songNumber,
				$account
			)->execute()->close();

			$stmt = self::prepare('
				UPDATE `songs`
				SET `title` = ?,
				    `initialOrder` = ?,
				    `order` = ?,
				    `authors` = ?,
				    `copyright` = ?
				WHERE `songnumber` = ?
				AND `account` = ?
			');

			$stmt->bind_param(
				'sssssii',
				$title,
				join(self::SEPARATOR_ORDER, $initialOrder),
				join(self::SEPARATOR_ORDER, $order),
				$authors,
				$copyright,
				$songNumber,
				$account
			)->execute()->close();

			$this->insertBlocks($account, $songNumber, $blocks);

			$res->success([
				'account' => $account,
				'songNumber' => $songNumber,
				'title' => $title,
				'initialOrder' => $initialOrder,
				'order' => $order,
				'blocks' => $blocks,
				'authors' => $authors,
				'copyright' => $copyright
			]);
		}

		protected function delete(Request &$req, Response &$res) : never {
			$req->params->checkNumeric('songNumber');

			$account = $req->account;
			$songNumber = $req->params->getAsInt('songNumber');

			$stmt = self::prepare('
				DELETE FROM `songs`
				WHERE `songnumber` = ?
				AND `account` = ?
			');

			$stmt->bind_param('ii', $songNumber, $account)->execute()->close();

			$stmt = self::prepare('
				DELETE FROM `blocks`
				WHERE `songnumber` = ?
				AND `account` = ?
			');

			$stmt->bind_param('ii', $songNumber, $account)->execute()->close();

			$res->success([
				'message' => 'song with number "' . $songNumber . '" successfully deleted'
			]);
		}

		private function insertBlocks(int $account, int $songNumber, object $blocks) : void {
			$stmt = self::prepare('
				DELETE FROM `blocks`
				WHERE `songnumber` = ?
				AND `account` = ?
			');

			$stmt->bind_param('ii', $songNumber, $account)->execute()->close();

			$stmt = self::prepare('
				INSERT INTO `blocks` (
					`account`, `songnumber`, `type`, `text`
				) VALUES (
					?, ?, ?, ?
				)
			');

			foreach($blocks as $type => $text) {
				$stmt->bind_param(
					'iiss',
					$account,
					$songNumber,
					$type,
					join(self::SEPARATOR_BLOCK, str_replace(self::SEPARATOR_BLOCK, self::SEPARATOR_BLOCK_ESCAPE, $text))
				)->execute();
			}

			$stmt->close();
		}

		private function generateSongNumber(int $account) : int {
			$stmt = self::prepare('
				SELECT MAX(`songnumber`) + 1
				FROM `songs`
				WHERE `songnumber` < ?
				AND `account` = ?
			');

			$stmt->bind_param('ii', CUSTOM_NUMBER_LIMIT, $account)->execute();
			$stmt->bind_result($songNumber);

			if(!$stmt->fetch()) {
				$stmt->close();

				throw new Error('Could not generate songNumber for account ' . $account);
			}

			$stmt->close();

			return max($songNumber, 1);
		}
	}