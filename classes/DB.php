<?php

	require_once(__DIR__ . '/Statement.php');

	class DB {
		private static ?mysqli $db = NULL;

		private static function initMysqli() : void {
			if(!self::$db) {
				require_once(__DIR__ . '/../config.php');

				self::$db = @new mysqli(
					DB_HOST,
					DB_USER,
					DB_PASSWORD,
					DB_DATABASE
				);

				if(self::$db->connect_errno) {
					throw new Error('could not establish connection to database "' . DB_HOST . '" (' . self::$db->connect_errno . ')');
				}

				if(!self::$db->set_charset("utf8")) {
					throw new Error('could not set charset');
				}
			}
		}

		public static function prepare(string $query) : Statement {
			self::initMysqli();

			$stmt = self::$db->prepare($query);
			if($stmt === false) {
				throw new Error('could not prepare mysql statement (' . $query . ')');
			}

			return new Statement($stmt);
		}

		public static function query(string $query) : mysqli_result {
			self::initMysqli();

			$stmt = self::$db->query($query);

			if($stmt === false) {
				throw new Error('could not query mysql statement (' . $query . ')');
			}

			return new $stmt;
		}

		// TODO remove
		public static function error() : void {
			if(self::$db) {
				print_r(self::$db->error);
			}
		}
	}