<?php

	require_once(__DIR__ . '/RestController.php');

	class Shows extends RestController {
		const SEPARATOR_ORDER = ',';

		protected function get(Request &$req, Response &$res) : never {
			$account = $req->account;
			$limit = $req->path->getAsInt(0, 10);
			$offset = $req->path->getAsInt(1, 0) * $limit;

			$result = [
				"limit" => $limit,
				"offset" => $offset,
				"shows" => []
			];

			$stmt = self::prepare('
				SELECT `title`, `order`
				FROM `shows`
				WHERE `account` = ?
				ORDER BY `date` DESC
				LIMIT ?
				OFFSET ?
			');

			$stmt->bind_param('iii', $account, $limit, $offset)->execute()->bind_result($title, $order);

			while($stmt->fetch()) {
				$result["shows"][] = [
					'title' => $title,
					'order' => explode(',', $order)
				];
			}

			$stmt->close();

			$res->success($result);
		}

		protected function post(Request &$req, Response &$res) : never {
			$req->params->check('title')->checkArray('order');

			$account = $req->account;
			$title = $req->params->get('title');
			$order = $req->params->getAsArray('order');

			if(in_array('-1', $order)) {
				$res->error(400, 'order contains invalid song number');
			}

			$stmt = self::prepare('
				REPLACE INTO `shows` (
					`account`, `title`, `order`
				) VALUES (
					?, ?, ?
				)
			');

			$stmt->bind_param('iss', $account, $title, join(self::SEPARATOR_ORDER, $order))->execute()->close();

			$res->success([
				'message' => 'show "' . $title . '" successfully uploaded'
			]);
		}

		protected function delete(Request &$req, Response &$res) : never {
			$req->params->check('title');

			$account = $req->account;
			$title = $req->params->get('title');

			$stmt = self::prepare('
				DELETE FROM `shows`
				WHERE `account` = ?
				AND `title` = ?
			');

			$stmt->bind_param('is', $account, $title)->execute()->close();

			$res->success([
				'message' => 'show "' . $title . '" successfully deleted'
			]);
		}
	}