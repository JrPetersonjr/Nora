# Plagiarism Corpus

Place reference `.txt` files in this folder for the advanced local checker.

Examples:
- Past assignments exported as plain text.
- Course materials you want to compare against.
- Web/source text dumps converted to plain text.

The local API bridge (`quxatplagicheck_api.py`) will automatically load all
`*.txt` files from this folder when `references` are not provided in the request.
