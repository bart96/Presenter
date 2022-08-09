<?php

	require_once(__DIR__ . '/RestController.php');

	class SongsSearch extends RestController {
		protected function get(Request &$req, Response &$res) : never {
			$req->query->check('q');
			$query = $req->query->get('q');

			$account = $req->account;
			$result = [];

			$mode = strtolower($req->path->get(0, 'title'));

			switch($mode) {
				case 'text':
					$search = self::prepareSearchParameter($query);

					$stmt = self::prepare('
						SELECT `songNumber`, `title`
						FROM (
							SELECT `songNumber`, `title`, AVG(`score`) as `score` 
							FROM (
								SELECT `songs`.`songNumber`, `songs`.`title`, MATCH(`blocks`.`text`) AGAINST (? IN BOOLEAN MODE) AS score
								FROM `songs`
								INNER JOIN `blocks` ON `songs`.`songNumber` = `blocks`.`songNumber` AND `blocks`.`account` = ?
								/*WHERE `songs`.`account` = ?*/
							) t
							WHERE `score` > 0
							GROUP BY `songNumber`, `title`
							ORDER BY `score` DESC, `title`
							LIMIT ?
						) t
					');

					//$stmt->bind_param('siii', $search, $account, $account, SEARCH_RESULT_LIMIT);
					$stmt->bind_param('sii', $search, $account, SEARCH_RESULT_LIMIT)->execute()->fetchAll($result)->close();
					break;
				case 'number':
					$req->query->checkNumeric('q');

					$stmt = self::prepare('
						SELECT `songNumber`, `title`
						FROM `songs`
						WHERE CAST(`songNumber` AS CHAR) LIKE(?)
						AND `account` = ?
						ORDER BY `songnumber`
						LIMIT ?
					');

					$stmt->bind_param('sii', $query . '%', $account, SEARCH_RESULT_LIMIT)->execute()->fetchAll($result)->close();
					break;
				default: // title
					$search = self::prepareSearchParameter($query);

					$stmt = self::prepare('
						SELECT `songNumber`, `title`
						FROM (
							SELECT `songNumber`, `title`, MATCH(`title`) AGAINST (? IN BOOLEAN MODE) AS score
							FROM `songs`
							WHERE `account` = ?
							ORDER BY `score` DESC, `title`
						) t
						WHERE t.score > 0
						LIMIT ?
					');

					$stmt->bind_param('sii', $search, $account, SEARCH_RESULT_LIMIT)->execute()->fetchAll($result)->close();
			}

			$res->success($result);
		}

		private function prepareSearchParameter(string $search) : string {
			$result = [];

			foreach(explode(' ', $search) as $word) {
				$result[] = '("' . $word . '" ' . $word . '*)';
			}

			return join(' ', $result);
		}
	}