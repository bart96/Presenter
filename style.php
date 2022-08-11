<?php

	$file = 'css/background.css';

	if(isset($_POST['text'])) {
		file_put_contents($file, $_POST['text']);
		header('Location: style.php');
		die;
	}

?><!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Style editor</title>

	<style>
		* {
			margin: 0;
			padding: 0;
			border: 0;

			box-sizing: border-box;
		}

		form {
			position: fixed;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			display: flex;
			flex-direction: column;
		}

		textarea {
			flex-grow: 1;
			padding: 15px 25px;
			resize: none;
		}

		button {
			padding: 10px;
			cursor: pointer;
			font-weight: bold;
		}

		button:hover,
		button:focus {
			color: #FFF;
			background: #4ECDC4;
		}
	</style>
</head>

<body>
	<form action="" method="post">
		<textarea name="text"><?php echo htmlspecialchars(file_get_contents($file)) ?></textarea>

		<button type="submit">Update</button>
	</form>

	<script type="text/javascript">
		document.querySelector('textarea').addEventListener('keydown', function(e) {
			switch(e.key) {
				case 'Tab':
					e.preventDefault();

					let start = this.selectionStart;
					let end = this.selectionEnd;

					this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);
					this.selectionStart = this.selectionEnd = start + 1;
					break;
			}
		});
	</script>
</body>
</html>
