<?php

	require_once(__DIR__ . '/RestController.php');

	class Session extends RestController {
		protected function get(Request &$req, Response &$res) : never {
			$res->success([
				'account' => $_SESSION['account'] ?? 0,
				'mail' => $_SESSION['mail'] ?? ''
			]);
		}

		protected function post(Request &$req, Response &$res) : never {
			$req->params->check('mail')->checkNumeric('license');

			$license = $req->params->getAsInt('license');
			$mail = $req->params->get('mail');

			$stmt = self::prepare('
				SELECT 1
				FROM `account`
				WHERE `license` = ?
				AND `mail` = ?
			');

			$stmt->bind_param('is', $license, $mail)->execute();

			if(!$stmt->fetch()) {
				$res->error(401, 'credentials are invalid');
			}

			$_SESSION['account'] = $license;
			$_SESSION['mail'] = $mail;

			$stmt->close();

			$res->success([
				'message' => 'successfully logged in'
			]);
		}

		protected function delete(Request &$req, Response &$res) : never {
			session_unset();
			session_destroy();

			$res->success([
				'message' => 'successfully logged out'
			]);
		}
	};