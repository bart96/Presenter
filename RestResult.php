<?php

	class RestResult implements JsonSerializable {
		private array $success;
		private array $warnings;
		private array $errors;
		private $data;

		public static function s500(string ... $messages) {
			(new RestResult())->addErrors(... $messages)->send(500);
		}

		public static function s403(string ... $messages) {
			(new RestResult())->addErrors(... $messages)->send(403);
		}

		public static function s200(string ... $messages) {
			(new RestResult())->addSuccess(... $messages)->send(200);
		}

		public function __construct() {
			$this->success = [];
			$this->warnings = [];
			$this->errors = [];
			$this->data = null;
		}

		public function addSuccess(string ... $messages) : RestResult {
			$this->success = array_merge($this->success, $messages);
			return $this;
		}

		public function addWarnings(string ... $messages) : RestResult {
			$this->warnings = array_merge($this->warnings, $messages);
			return $this;
		}

		public function addErrors(string ... $messages) : RestResult {
			$this->errors = array_merge($this->errors, $messages);
			return $this;
		}

		public function setData($data) : RestResult {
			$this->data = $data;
			return $this;
		}

		public function send($code = 500) {
			http_response_code($code);
			die(json_encode($this));
		}

		public function jsonSerialize() {
			$result = [];

			if(count($this->success) > 0) {
				$result['success'] = $this->success;
			}

			if(count($this->warnings) > 0) {
				$result['warnings'] = $this->warnings;
			}

			if(count($this->errors) > 0) {
				$result['errors'] = $this->errors;
			}

			if($this->data != null) {
				$result['data'] = $this->data;
			}

			return $result;
		}
	}