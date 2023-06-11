const MAX_RESULTS_PER_PAGE = 20;

window.onload = async () => {
	const index = await fetch("index.json").then(q => q.json());
	const query = document.getElementById("query");
	const resultsDiv = document.getElementById("results");

	if(index) {
		console.log("Successfully fetched index.json");
	}

	function tokenize(query) {
		const tokens = [];
		let currentToken = '';

		for (let i = 0; i < query.length; i++) {
			const char = query[i];
			if (char.match(/[a-zA-Z]\w*/)) {
				currentToken += char;
			} else if (char.match(/\d+/)) {
				if (currentToken) {
					tokens.push(currentToken);
					currentToken = '';
				}
				tokens.push(char);
			} else {
				if (currentToken) {
					tokens.push(currentToken);
					currentToken = '';
				}
				continue;
			}
		}
		if (currentToken) {
			tokens.push(currentToken);
		}

		return tokens.map(token => token.toLowerCase());
	}

	function updateResultsDiv(results) {
		resultsDiv.innerHTML = "";
		for(let href in results) {
			const score = results[href];
			const link = document.createElement("a");
			link.href = href;
			link.textContent = href;

			resultsDiv.appendChild(link);
			resultsDiv.appendChild(document.createElement("br"));
		}
	}

	function search(q) {
		const tokens = tokenize(q);

		console.log(`query "${q}" or `, tokens, "started");

		let results = {};

		function appendResult(href, score) {
			results[href] = score;

			const arr = Object.entries(results);
			arr.sort((a, b) => b[1] - a[1]);
			arr.splice(MAX_RESULTS_PER_PAGE);

			results = Object.fromEntries(arr);
		}

		const filesLength = Object.keys(index.files).length;

		for(let href in index.files) {
			const words = index.files[href].words;
			const total = index.files[href].total;
			let score = 0;

			for(let token of tokens) {
				if(!words[token]) continue;

				let c = 0; for(let file in index.files) if(index.files[file].words[token]) c++;

				const tf = words[token] / total;
				const idf = Math.log10(filesLength / c);

				score += tf * idf;
			}

			if(score) appendResult(href, score);
		}

		updateResultsDiv(results);
		console.log(`query ${q} finished`);
	}

	query.addEventListener("keypress", (e) => {
		if (e.key == "Enter") {
			search(query.value);
		}
	})
};