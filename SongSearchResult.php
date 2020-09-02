<?php

	class SongSearchResult implements JsonSerializable {
		private int $songNumber;
		private string $title;

		public function __construct(int $songNumber, string $title) {
			$this->songNumber = $songNumber;
			$this->title = $title;
		}

		public function jsonSerialize() {
			return [
				'songNumber' => $this->songNumber,
				'title' => $this->title
			];
		}
	}