<?php

	class RestError {
		private array $messages;

		public static function exit(string $message, $code = 500) {
			http_response_code($code);

			die(json_encode([
				'errors' => [$message]
			]));
		}

		public function __construct(string ... $message) {
			$this->messages = $message;
		}

		public function addMessage(string ... $messages) : RestError {
			$this->messages = array_merge($this->messages, $messages);
			return $this;
		}

		public function send($code = 500) {
			http_response_code($code);

			die(json_encode([
				'errors' => $this->messages
			]));
		}
	}