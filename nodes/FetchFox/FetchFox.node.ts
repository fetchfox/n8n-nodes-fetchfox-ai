import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IRequestOptions,
} from 'n8n-workflow';

export class FetchFox implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FetchFox',
		name: 'FetchFox',
		icon: 'file:fox.svg',
		group: ['transform'],
		version: 1,
		description: 'Scrape data with FetchFox',
		defaults: {
			name: 'FetchFox',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'fetchFoxApi',
				required: true,
			},
		],

		// Basic node details will go here

		properties: [
			{
				displayName: 'Select scraper',
				description: 'Which scraper would you like data from?',
				name: 'scrapeId',
				default: '',
				required: true,

				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getScrapes',
				},
			},

			{
				displayName: 'New run, or just get latest results?',
				description: 'Do you want to do new run of this scraper, or simply pull the results from the most recent run?',
				name: 'mode',
				default: 'latest',
				required: true,

				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getModes',
					loadOptionsDependsOn: ['scrapeId'],
				},
			},

			{
				displayName: 'Max number of results',
				description: 'What is the most results the scraper should find',
				name: 'limit',
				default: 100,
				required: true,
				type: 'number',
			},
		],
	};

	methods = {
		loadOptions: {
			getScrapes,
			getModes,
		},
	};

	// The execute method will go here
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		console.log('EXECUTE HERE');
		const data = this.getExecuteData();
		console.log('exec data f', data);
		console.log('exec data d', JSON.stringify(data.data));
		console.log('exec data s', data.source);

		const scrapeId = data.node.parameters.scrapeId;
		const mode = data.node.parameters.mode;
		const limit = data.node.parameters.mode;
		let jobId: any;

		if (mode == 'run') {
			const resp = await this.helpers.requestWithAuthentication.call(
				this,
				'fetchFoxApi',
				{
					method: 'POST',
					body: { limit },
					uri: `https://fetchfox.ai/api/v2/scrapes/${scrapeId}/run`,
					json: true,
				});
			console.log('run resp', resp);
			jobId = resp.jobId;

			const promise = new Promise(async (ok) => {
				let count = 0;
				const poll = async () => {
					this.sendMessageToUI('poll: ' + count++);
					console.log('poll', jobId);
					const resp = await this.helpers.requestWithAuthentication.call(
						this,
						'fetchFoxApi',
						{
							method: 'GET',
							uri: `https://fetchfox.ai/api/v2/jobs/${jobId}`,
							json: true,
						});

					console.log('poll got:', resp);
					const done = (
						resp.done ||
						(limit && (resp.results?.items || []).length >= limit)
					);

					if (done) {
						ok(null);
					} else {
						setTimeout(poll, 1000);
					}
				}
				await poll();
			});

			await promise;

		} else {
			jobId = 'latest';
		}

		console.log(jobId);
		const resp = await this.helpers.requestWithAuthentication.call(
			this,
			'fetchFoxApi',
			{
				method: 'GET',
				uri: `https://fetchfox.ai/api/v2/results/${scrapeId}/${jobId}`,
				json: true,
			});

		const clean = [];
		for (const item of resp.results) {
			const copy: any = {};
			for (const [k, v] of Object.entries(item)) {
				if (k.startsWith('_')) continue;
				copy[k] = v;
			}

			// for (const k of ['_url', '_htmlUrl', '_sourceUrl']) {
			// 	if (item[k]) {
			// 		copy[k] = item[k];
			// 	}
			// }

			clean.push(copy);
		}

		const out = [this.helpers.returnJsonArray(clean)];
		// console.log(out);
		return out;
	}
}


async function getModes(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {

	const params = this.getCurrentNodeParameters();
	const options = [{
		name: 'Run scraper',
		description: 'May take a few minutes or more',
		value: 'run',
	}];

	if (params?.scrapeId) {
		const scrapeId = params.scrapeId;

		const resp = await this.helpers.requestWithAuthentication.call(
			this,
			'fetchFoxApi',
			{
				method: 'GET',
				uri: `https://fetchfox.ai/api/v2/results/${scrapeId}/latest`,
				json: true,
			});

		const len = (resp?.results || []).length;
		console.log('latest len', len);
		if (len) {
			options.push({
				name: 'Use latest results',
				description: 'Fast, useful for testing. Results will not change unless you re-run the scraper from FetchFox',
				value: 'latest',
			});
		}
	}

	return options;
}

async function getScrapes(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {

	const options: IRequestOptions = {
		headers: {
			'Accept': 'application/json',
		},
		method: 'GET',
		uri: `https://fetchfox.ai/api/v2/scrapes`,
		json: true,
	};

	const resp = await this.helpers.requestWithAuthentication.call(
		this, 'fetchFoxApi', options);

	const results = [];
	for (const item of resp.results) {
		results.push({
			name: item.name,
			value: item.id,
			description: item.description,
		})
	}

	return results;
}
