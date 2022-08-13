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

		textarea {
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 100%;
			padding: 15px 25px;
			resize: none;
		}

		button {
			position: absolute;
			top: 0;
			right: 30px;
			padding: 10px 25px;
			cursor: pointer;
			font-weight: bold;
			font-size: 1.2em;
			color: #FFF;
			background: #C7F464;
		}

		button:hover,
		button:focus {
			background: #4ECDC4;
		}
	</style>
</head>

<body>
	<form action="" method="post">
		<textarea name="text"><?php echo htmlspecialchars(file_get_contents($file)) ?></textarea>

		<button type="submit">💾 Save</button>
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

		window.onerror = function(message, source, lineno, colno) {
			AJAX.post('rest/Log', {
				message: `${source}[${lineno}:${colno}] - ${message}`
			}).catch(e => console.error(e));
		}
	</script>
</body>
</html>
