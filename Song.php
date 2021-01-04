<?php

	require_once('DB.php');

	class Song extends DB implements JsonSerializable {
		public static function has(int $account, int $songNumber) : bool {
			$stmt = self::prepare('
				SELECT COUNT(*)
				FROM `songs`
				where `account` = ? AND `songnumber` = ?
			');

			$stmt->bind_param('ii', $account, $songNumber);
			$stmt->execute();
			$stmt->bind_result($count);
			$stmt->fetch();
			$stmt->close();

			return $count > 0;
		}

		public static function get(int $account, int $songNumber) : Song {
			$stmt = self::prepare('
				SELECT `account`, `songnumber`, `title`, `initialOrder`, `order`
				FROM `songs`
				where `account` = ? AND `songnumber` = ?
			');

			$song = null;

			$stmt->bind_param('ii', $account, $songNumber);
			$stmt->execute();
			$stmt->bind_result($account, $songNumber, $title, $initialOrder, $order);
			if($stmt->fetch()) {
				$song = new Song(
					$account,
					$songNumber,
					$title,
					$initialOrder,
					$order
				);

				$stmt->close();
				$stmt = self::prepare('
					SELECT `type`, `text`
					FROM `blocks`
					WHERE `account` = ? AND `songnumber` = ?
				');

				$stmt->bind_param('ii', $account, $songNumber);
				$stmt->execute();
				$stmt->bind_result($type, $text);

				while($stmt->fetch()) {
					$song->addBlock($type, $text);
				}
			}

			$stmt->close();

			return $song;
		}

		public static function delete(int $account, int $songNumber) : bool {
			try {
				$stmt = self::prepare('
					DELETE FROM `blocks`
					WHERE `account` = ?
					AND `songnumber` = ?
				');

				$stmt->bind_param('ii', $account, $songNumber);
				$stmt->execute();
				$stmt->close();

				$stmt = self::prepare('
					DELETE FROM `songs`
					WHERE `account` = ?
					AND `songnumber` = ?
				');

				$stmt->bind_param('ii', $account, $songNumber);
				$stmt->execute();
				$stmt->close();
			}
			catch(mysqli_sql_exception $e) {
				return false;
			}

			return true;
		}

		/**
		 * @param string $json
		 * @return Song
		 * @throws InvalidArgumentException
		 * @throws LoginException
		 */
		public static function createFromJSON(string $json) : Song {
			$obj = json_decode($json, true);

			$requiredAttributes = [
				'account', 'title', 'initialOrder', 'order', 'blocks'
			];

			foreach($requiredAttributes as $attribute) {
				if(!isset($obj[$attribute])) {
					throw new InvalidArgumentException('Missing parameter "' . $attribute . '"');
				}
			}

			if(!isset($obj['songNumber']) || $obj['songNumber'] < 1) {
				$obj['songNumber'] = Account::getNextSongIndex();
			}

			return new Song(
				$obj['account'],
				$obj['songNumber'],
				$obj['title'],
				$obj['initialOrder'],
				$obj['order'],
				$obj['blocks']
			);
		}

		/**
		 * @param int $account
		 * @param string $title
		 * @param string $initialOrder
		 * @param string $order
		 * @param array $blocks
		 * @return Song
		 * @throws LoginException
		 */
		public static function createWithoutSongNumber(int $account, string $title, string $initialOrder, string $order, array $blocks) : Song {
			return self::create($account, Account::getNextSongIndex(), $title, $initialOrder, $order, $blocks);
		}

		public static function create(int $account, int $songNumber, string $title, string $initialOrder, string $order, array $blocks) : Song {
			$stmt = self::prepare('
				INSERT INTO `songs` (
					`account`, `songnumber`, `title`, `initialOrder`, `order`
				) VALUES (
					?, ?, ?, ?, ?
				)
			');

			$stmt->bind_param('iisss', $account, $songNumber, $title, $initialOrder, $order);
			$stmt->execute();
			$stmt->close();

			$stmt = self::prepare('
				INSERT INTO `blocks` (
					`account`, `songnumber`, `type`, `text`
				) VALUES (
					?, ?, ?, ?
				)
			');

			$stmt->bind_param('iiss', $account, $songNumber, $type, $text);

			foreach($blocks as $block) {
				$type = $block['type'];
				$text = $blocks['text'];

				$stmt->execute();
			}

			$stmt->close();

			return new Song(
				$account,
				$songNumber,
				$title,
				$initialOrder,
				$order,
				$blocks
			);
		}

		private int $account;
		private int $songNumber;
		private string $title;
		private string $initialOrder;
		private string $order;
		/**
		 * @var string[]
		 */
		private array $blocks;

		/**
		 * Song constructor.
		 * @param int $account
		 * @param int $songNumber
		 * @param string $title
		 * @param string $initialOrder
		 * @param string $order
		 * @param string[] $blocks
		 */
		public function __construct(int $account, int $songNumber, string $title, string $initialOrder, string $order, array $blocks = []) {
			$this->account = $account;
			$this->songNumber = $songNumber;
			$this->title = $title;
			$this->initialOrder = $initialOrder;
			$this->order = $order;
			$this->blocks = $blocks;
		}

		private function addBlock(string $type, string $text) {
			$this->blocks[$type] = $text;
		}

		public function getAccount() {
			return $this->account;
		}

		public function update() {
			$stmt = self::prepare('
				REPLACE INTO `songs` (
					`account`, `songnumber`, `title`, `initialOrder`, `order`
				) VALUES (
					?, ?, ?, ?, ?
				);
			');

			$stmt->bind_param('iisss', $this->account, $this->songNumber, $this->title, $this->initialOrder, $this->order);
			$stmt->execute();
			$stmt->close();

			$stmt = self::prepare('
				DELETE FROM `blocks`
				WHERE `account` = ? and `songnumber` = ?
			');

			$stmt->bind_param('ii', $this->account, $this->songNumber);
			$stmt->execute();
			$stmt->close();

			$stmt = self::prepare('
				INSERT INTO `blocks` (
					`account`, `songnumber`, `type`, `text`
				) VALUES (
					?, ?, ?, ?
				)
			');

			$stmt->bind_param('iiss', $this->account, $this->songNumber, $type, $block);

			foreach($this->blocks as $type => $block) {
				$stmt->execute();
			}

			$stmt->close();

			return true;
		}

		public function jsonSerialize() {
			return [
				'account' => $this->account,
				'songNumber' => $this->songNumber,
				'title' => $this->title,
				'initialOrder' => $this->initialOrder,
				'order' => $this->order,
				'blocks' => $this->blocks
			];
		}
	}