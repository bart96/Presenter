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
						SELECT 
							`songNumber`, 
							`title`, 
							AVG(`score`) as `avg_score` 
						FROM (
							SELECT 
								`songs`.`songNumber`, 
								`songs`.`title`, 
								MATCH(`blocks`.`text`) AGAINST (? IN BOOLEAN MODE) AS `score`
							FROM `songs`
							INNER JOIN `blocks` 
								ON `songs`.`songNumber` = `blocks`.`songNumber` 
							WHERE `blocks`.`account` = ?
						) t
						WHERE `score` > 0
						GROUP BY `songNumber`, `title`
						ORDER BY `avg_score` DESC, `title`
						LIMIT ?
					');

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
						SELECT 
							`songNumber`, 
							`title`,
							MATCH(`title`) AGAINST (? IN BOOLEAN MODE) AS relevance
						FROM `songs`
						WHERE 
							`account` = ?
							AND (
								`title` LIKE ?
								OR MATCH(`title`) AGAINST (? IN BOOLEAN MODE)
							)
						ORDER BY 
							relevance DESC, 
							`title`
						LIMIT ?
					');

					$stmt->bind_param('sissi', $search, $account, "%${query}%", $search, SEARCH_RESULT_LIMIT)->execute()->fetchAll($result)->close();
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