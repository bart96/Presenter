<?php

	require_once(__DIR__ . '/RestController.php');

	class Log extends RestController {
		private static string $filename = __DIR__ . '/../error.log';

		public static function write($message) : bool {
			return file_put_contents(self::$filename, date('Y.m.d H:i:s - ') . $message . "\n", FILE_APPEND) !== false;
		}

		public static function read() : string {
			return file_get_contents(self::$filename);
		}

		protected function get(Request &$req, Response &$res) : never {
			$res->type('text/plain')->end(self::read());
		}

		protected function post(Request &$req, Response &$res) : never {
			$req->params->check('message');

			$message = $req->params->get('message');
			self::write($message);

			$res->success();
		}
	}