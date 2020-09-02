<?php

	require_once('config.php');

	class DB {
		private static mysqli $db;

		public static function initParams() : void {
			self::$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE);
			self::$db->set_charset("utf8");
		}

		/**
		 * Prepare an SQL statement for execution
		 * @link https://php.net/manual/en/mysqli.prepare.php
		 * @param string $query <p>
		 * The query, as a string.
		 * </p>
		 * <p>
		 * You should not add a terminating semicolon or \g
		 * to the statement.
		 * </p>
		 * <p>
		 * This parameter can include one or more parameter markers in the SQL
		 * statement by embedding question mark (?) characters
		 * at the appropriate positions.
		 * </p>
		 * <p>
		 * The markers are legal only in certain places in SQL statements.
		 * For example, they are allowed in the VALUES()
		 * list of an INSERT statement (to specify column
		 * values for a row), or in a comparison with a column in a
		 * WHERE clause to specify a comparison value.
		 * </p>
		 * <p>
		 * However, they are not allowed for identifiers (such as table or
		 * column names), in the select list that names the columns to be
		 * returned by a SELECT statement, or to specify both
		 * operands of a binary operator such as the = equal
		 * sign. The latter restriction is necessary because it would be
		 * impossible to determine the parameter type. It's not allowed to
		 * compare marker with NULL by
		 * ? IS NULL too. In general, parameters are legal
		 * only in Data Manipulation Language (DML) statements, and not in Data
		 * Definition Language (DDL) statements.
		 * </p>
		 * @return mysqli_stmt|false <b>mysqli_prepare</b> returns a statement object or false if an error occurred.
		 */
		public static function prepare(string $query) {
			return self::$db->prepare($query);
		}

		// TODO remove
		public static function error() {
			return self::$db->error;
		}
	}

	DB::initParams();