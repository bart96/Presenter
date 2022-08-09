<?php

	class Values {
		private string $type;
		public array $values;

		public function __construct(string $type, array $values = []) {
			$this->type = $type . ' -> ';
			$this->values = $values;
		}

		public function has($attribute) : bool {
			return isset($this->values[$attribute]);
		}

		public function hasPath(string $name) : bool {
			foreach($this->values as $key => $value) {
				if($value === $name) {
					return isset($this->values[$key + 1]);
				}
			}

			return false;
		}

		public function isNumeric(... $attributes) : bool {
			foreach($attributes as $attribute) {
				if(!isset($this->values[$attribute])) {
					return false;
				}

				if($this->values[$attribute] === '' || intval($this->values[$attribute]) < 0) {
					return false;
				}
			}

			return true;
		}

		public function check(... $attributes) : Values {
			foreach($attributes as $attribute) {
				if(!isset($this->values[$attribute])) {
					throw new Error($this->type . '[' . $attribute . '] is missing');
				}
			}

			return $this;
		}

		public function checkNumeric(... $attributes) : Values {
			foreach($attributes as $attribute) {
				if(!isset($this->values[$attribute])) {
					throw new Error($this->type . '[' . $attribute . '] is missing');
				}

				if($this->values[$attribute] === '' || intval($this->values[$attribute]) < 0) {
					throw new Error($this->type . '[' . $attribute . '] is not a valid number');
				}
			}

			return $this;
		}

		public function checkObject(... $attributes) : Values {
			foreach($attributes as $attribute) {
				if(!isset($this->values[$attribute])) {
					throw new Error($this->type . '[' . $attribute . '] is missing');
				}

				if(!is_object($this->values[$attribute])) {
					throw new Error($this->type . '[' . $attribute . '] is not an array');
				}
			}

			return $this;
		}

		public function checkArray(... $attributes) : Values {
			foreach($attributes as $attribute) {
				if(!isset($this->values[$attribute])) {
					throw new Error($this->type . '[' . $attribute . '] is missing');
				}

				if(!is_Array($this->values[$attribute])) {
					throw new Error($this->type . '[' . $attribute . '] is not an array');
				}
			}

			return $this;
		}

		public function add(string $key, $value) : Values {
			$this->values[$key] = $value;

			return $this;
		}

		public function get(string $attribute, $default = NULL) : mixed {
			if(!isset($this->values[$attribute])) {
				if($default === NULL) {
					throw new Error($this->type . '[' . $attribute . '] is missing');
				}

				return $default;
			}

			return $this->values[$attribute];
		}

		public function getPath(string $name, $default = NULL) : mixed {
			foreach($this->values as $key => $value) {
				if($value === $name) {
					if(!isset($this->values[$key + 1])) {
						throw new Error($this->type . 'value for [' . $name . '] is missing');
					}

					return $this->values[$key + 1];
				}
			}

			if($default === NULL) {
				throw new Error($this->type . '[' . $name . '] is missing');
			}

			return $default;
		}

		public function getAsInt(string $attribute, int $default = NULL) : int {
			return intval($this->get($attribute, $default));
		}

		public function getAsBool(string $attribute, bool $default = NULL) : bool {
			return boolval($this->get($attribute, $default));
		}

		public function getAsObject(string $attribute, array | object $default = NULL) : array {
			$value = $this->get($attribute, $default);

			if(!is_object($value)) {
				return $default;
			}

			return $value;
		}

		public function getAsArray(string $attribute, array $default = NULL) : array {
			$value = $this->get($attribute, $default);

			if(!is_array($value)) {
				return $default;
			}

			return $value;
		}
	}