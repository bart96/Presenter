<?php

	require_once(__DIR__ . '/utils.php');
	require_once(__DIR__ . '/../classes/DB.php');

	abstract class RestController extends DB {
		protected function get(Request &$req, Response &$res) : never {
			$res->error(500, 'method "get" not implemented');
		}

		protected function post(Request &$req, Response &$res) : never {
			$res->error(500, 'method "post" not implemented');
		}

		protected function put(Request &$req, Response &$res) : never {
			$res->error(500, 'method "put" not implemented');
		}

		protected function delete(Request &$req, Response &$res) : never {
			$res->error(500, 'method "delete" not implemented');
		}

		public function handle(Request $req) : never {
			$res = new Response();

			try {
				switch($req->method) {
					case 'POST':
						$this->post($req, $res);
					case 'PUT':
						$this->put($req, $res);
					case 'DELETE':
						$this->delete($req, $res);
					default:
						$this->get($req, $res);
				}
			}
			catch(Error $e) {
				$res->error(400, $e->getMessage());
			}
		}
	}