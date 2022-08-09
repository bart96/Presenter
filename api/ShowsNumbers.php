<?php

	require_once(__DIR__ . '/RestController.php');

	class ShowsNumbers extends RestController {
		protected function get(Request &$req, Response &$res) : never {
			$account = $req->account;
			$limit = $req->path->getAsInt(0, 30);

			$stmt = self::prepare('
				SELECT `title`, `order`
				FROM `shows`
				WHERE `account` = ?
				ORDER BY `date` DESC
				LIMIT ?
			');

			$stmt->bind_param('ii', $account, $limit)->execute()->bind_result($title, $order);

			$result = [];

			while($stmt->fetch()) {
				$songNumbers = [];

				foreach(explode(',', $order) as $songNumber) {
					if(self::filterCustomSongNumber($songNumber)) {
						$songNumbers[] = $songNumber;
					}
				}

				$result[] = [
					'title' => $title,
					'songNumbers' => $songNumbers
				];
			}

			$stmt->close();

			$res->success($result);
		}

		private function filterCustomSongNumber($songNumber) : bool {
			return $songNumber >= CUSTOM_NUMBER_LIMIT;
		}
	}