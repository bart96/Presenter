<?php

	require_once(__DIR__ . '/RestController.php');

	class Styles extends RestController {
		protected function get(Request &$req, Response &$res) : never {
			$req->path->checkNumeric(0);

			$account = $req->account;
			$songNumber = $req->path->getAsInt(0);

			$result = [
				'account' => $account,
				'songNumber' => $songNumber
			];

			$stmt = self::prepare('
				SELECT `background`, `css`
				FROM `songs`
				WHERE `songnumber` = ?
				AND `account` = ?
			');

			$stmt->bind_param('ii', $songNumber, $account)->execute();
			$stmt->bind_result($background, $css);

			if($stmt->fetch()) {
				$result[] = [
					'background' => $background,
					'css' => $css
				];

				$stmt->close();
			}
			else {
				$stmt->close();

				$res->error(400, 'Could not find Song #' . $songNumber);
			}

			$stmt->close();

			$res->success($result);
		}

		protected function put(Request &$req, Response &$res) : never {
			$req->params->checkNumeric('songNumber')->check('background', 'css');

			$account = $req->account;
			$songNumber = $req->params->getAsInt('songNumber');
			$background = $req->params->get('background');
			$css = $req->params->get('css');

			$stmt = self::prepare('
				UPDATE `songs`
				SET `background` = ?,
				    `css` = ?
				WHERE `songnumber` = ?
				AND `account` = ?
			');

			$stmt->bind_param(
				'ssii',
				$background,
				$css,
				$songNumber,
				$account
			)->execute()->close();

			$res->success([
				'account' => $account,
				'songNumber' => $songNumber,
				'background' => $background,
				'css' => $css,
			]);
		}
	}