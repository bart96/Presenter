<?php

	require_once(__DIR__ . '/Values.php');

	class Response {
		private string $contentType;
		private string $charSet;
		private int $statusCode;

		private array $header;
		private array $body;

		public function __construct() {
			$this->contentType = 'application/json';
			$this->charSet = 'UTF-8';
			$this->statusCode = 200;

			$this->header = [];
			$this->body = [];
		}

		public function header(string $key, string $value) : Response {
			$this->header[$key] = $value;

			return $this;
		}

		public function end(mixed $content = NULL) : never {
			$this->header('Content-Type', $this->contentType . '; charset=' . $this->charSet);

			foreach($this->header as $key => $value) {
				header($key . ': ' . $value);
			}

			http_response_code($this->statusCode);

			if($content !== NULL) {
				$this->send($content);
			}

			die(join("\n", $this->body));
		}

		public function send(mixed $content) : Response {
			if(is_array($content)) {
				$json = json_encode($content);

				if($json === false) {
					$this->error(500, 'could not encode json: "' . json_last_error_msg() . '"');
				}

				$this->body[] = $json;
			}
			elseif(is_string($content) || is_numeric($content) || is_bool($content)) {
				$this->body[] = $content;
			}

			return $this;
		}

		public function status(int $statusCode) : Response {
			$this->statusCode = $statusCode;

			return $this;
		}

		public function type(string $contentType) : Response {
			$this->contentType = $contentType;

			return $this;
		}

		public function error(int $code = 500, string $message = '') : never {
			if(!$message) {
				$message = match ($code) {
					400 => 'Bad Request',
					401 => 'Unauthorized',
					403 => 'Forbidden',
					404 => 'Not Found',
					500 => 'Internal Server Error',
					501 => 'Not Implemented',
					default => 'unknown',
				};
			}

			require_once(__DIR__ . '/../api/Log.php');
			Log::write('(E' . $code . ') ' . $message);

			$this->status($code)->end(['message' => $message]);
		}

		public function success(array $json = ['message' => 'OK']) : never {
			$this->end($json);
		}
	}