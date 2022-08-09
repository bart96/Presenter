<?php

	require_once(__DIR__ . '/RestController.php');

	class SongsAll extends RestController {
		protected function get(Request &$req, Response &$res) : never {
			$account = $req->account;
			$order = $req->path->get(0, 'lexicographic');

			$stmt = match ($order) {
				'numeric' => self::prepare('
						SELECT `songNumber`, `title`
						FROM `songs`
						WHERE `account` = ?
						ORDER BY `songNumber`
					'),
				default => self::prepare('
						SELECT `songNumber`, `title`
						FROM `songs`
						WHERE `account` = ?
						ORDER BY `title`
					')
			};

			$stmt->bind_param('i', $account)->execute()->fetchAll($result)->close();

			$res->success($result);
		}
	}