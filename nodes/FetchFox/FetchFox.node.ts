import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
	IDataObject,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IRequestOptions,
} from 'n8n-workflow';

const host = 'https://staging.fetchfox.ai';

export class FetchFox implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FetchFox 3',
		name: 'FetchFox 3',
		icon: 'file:fox.svg',
		group: ['transform'],
		version: 1,
		description: 'Scrape data with FetchFox 3',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		defaults: {
			name: 'FetchFox 3',
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
				displayName: 'Resource',
				name: 'resource',
				// type: 'options',
				type: 'hidden',
				noDataExpression: true,
				options: [
					{
						name: 'Crawler',
						value: 'crawler',
					},
					{
						name: 'Extract',
						value: 'extract',
					},
					{
						name: 'Scraper',
						value: 'scraper',
					},
				],
				default: 'crawler',
			},

			// Crawler operations
			{
				displayName: 'Operation',
				name: 'operation',
				// type: 'options',
				type: 'hidden',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['crawler'],
					},
				},
				options: [
					{
						name: 'Find URLs using AI prompt',
						value: 'prompt',
						action: 'Find URLs using AI prompt',
					},
					{
						name: 'Find URLs matching a URL pattern',
						value: 'pattern',
						action: 'Find URLs matching a URL pattern',
					},
				],
				default: 'prompt',
			},

			// Crawler options
			{
				displayName: 'Starting URL for crawl',
				description: 'FetchFox will start here and look for links',
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'https://www.example.com/directory/page-1',
				required: true,
				displayOptions: {
					show: {
						resource: ['crawler'],
						operation: ['prompt'],
					},
				},
			},
			{
				displayName: 'Crawl prompt for AI',
				description: 'FetchFox will find URLs based on this prompt 33',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'Example: "Look for links to profile pages"',
				required: true,
				displayOptions: {
					show: {
						resource: ['crawler'],
						operation: ['prompt'],
					},
				},
			},

			{
				displayName: 'URL pattern to find. Required: least one * wildcard',
				description: 'FetchFox find URLs matching this pattern. For example, https://www.example.com/directory/*. Pattern must have at least on * in it',
				name: 'url',
				type: 'string',
				default: 'https://pokemondb.net/pokedex/*',
				placeholder: 'https://www.example.com/directory/*',
				required: true,
				displayOptions: {
					show: {
						resource: ['crawler'],
						operation: ['pattern'],
					},
				},
			},

			// Extract operations
			{
				displayName: 'Operation',
				name: 'operation',
				// type: 'options',
				type: 'hidden',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['extract'],
					},
				},
				options: [
					{
						name: 'Extract a single item per URL',
						value: 'single',
						action: 'Extract a single item per URL',
					},
					{
						name: 'Extract multiple items per URL',
						value: 'multiple',
						action: 'Extract multiple items per URL',
					},
				],
				default: 'single',
			},

			// Extract options
			{
				displayName: 'Target URL for extraction',
				description: `Enter the URL from which you'd like to scrape data`,
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'https://www.example.com/directory/page-1',
				required: true,
				displayOptions: {
					show: {
						resource: ['extract'],
					},
				},
			},
			{
				displayName: 'Extraction field #1 (required)',
				description: 'Describe the first data you would like FetchFox to extract',
				name: 'field1',
				type: 'string',
				default: '',
				placeholder: 'Example: "Title of the book"',
				required: true,
				displayOptions: {
					show: {
						resource: ['extract'],
					},
				},
			},
			{
				displayName: 'Extraction field #2 (optional)',
				description: 'Describe the first data you would like FetchFox to extract',
				name: 'field2',
				type: 'string',
				default: '',
				placeholder: 'Example: "Name of the author"',
				required: false,
				displayOptions: {
					show: {
						resource: ['extract'],
					},
				},
			},
			{
				displayName: 'Extraction field #3 (optional)',
				description: 'Describe the first data you would like FetchFox to extract',
				name: 'field3',
				type: 'string',
				default: '',
				placeholder: 'Example: "Price of the book in USD"',
				required: false,
				displayOptions: {
					show: {
						resource: ['extract'],
					},
				},
			},
			{
				displayName: 'Extraction field #4 (optional)',
				description: 'Describe the first data you would like FetchFox to extract',
				name: 'field4',
				type: 'string',
				default: '',
				placeholder: 'Example: "Publication date"',
				required: false,
				displayOptions: {
					show: {
						resource: ['extract'],
					},
				},
			},
			{
				displayName: 'Extraction field #5 (optional)',
				description: 'Describe the first data you would like FetchFox to extract',
				name: 'field5',
				type: 'string',
				default: '',
				placeholder: 'Example: "Number of stars out of 5.0"',
				required: false,
				displayOptions: {
					show: {
						resource: ['extract'],
					},
				},
			},

			// Scraper operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['scraper'],
					},
				},
				options: [
					{
						name: 'Run one of your saved scrapers',
						value: 'saved',
						action: 'Run one of your saved scrapers',
					},
				],
				default: 'saved',
			},

			// Scraper options
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

				displayOptions: {
					show: {
						resource: ['scraper'],
					},
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

				displayOptions: {
					show: {
						resource: ['scraper'],
					},
				},
			},

			// Globally available
			{
				displayName: 'Max number of results',
				description: 'What is the most results the scraper should find',
				name: 'limit',
				default: 10,
				required: true,
				type: 'number',

				displayOptions: {
					show: {
						resource: ['scraper', 'crawler', 'extract'],
					},
				},
			},

			// {
			// 	displayName: 'Operation',
			// 	name: 'operation',
			// 	type: 'options',
			// 	noDataExpression: true,
			// 	displayOptions: {
			// 		show: {
			// 			resource: ['scrape'],
			// 		},
			// 	},
			// 	options: [
			// 	],
			// 	default: 'crawl',
			// },


			// {
			// 	displayName: 'Starting URL',
			// 	description: 'What is the starting URL for the crawl?',
			// 	name: 'url',
			// 	default: '',
			// 	required: true,
			// 	type: 'string',
			// },

			// todo: query

			// {
			// 	displayName: 'Max number of results',
			// 	description: 'What is the most results the scraper should find',
			// 	name: 'limit',
			// 	default: 100,
			// 	required: true,
			// 	type: 'number',
			// },
		],
	};

	methods = {
		loadOptions: {
			getScrapes,
			getModes,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const data = this.getExecuteData();
		console.log('exec data f', data);
		console.log('exec data d', JSON.stringify(data.data));

		const { resource, operation } = data.node.parameters;

		switch (`${resource}:${operation}`) {
			case 'crawler:pattern': return executeCrawlerPattern(this);
			case 'crawler:prompt': return executeCrawlerPrompt(this);
			case 'extract:single': return executeExtractSingle(this);
			case 'extract:multiple': return executeExtractMultiple(this);

			default:
				throw new Error('unhandled');
		}

		return [];
	}
}

async function executeCrawlerPattern(ex: IExecuteFunctions): Promise <INodeExecutionData[][]> {
	const d = ex.getExecuteData();
	const { limit, url } = d.node.parameters;
	const workflow = {
		options: { limit },
		steps: [
			{
				name: 'const',
				args: {
					items: [{ url }],
				},
			},
			{
				name: 'crawl',
				args: {},
			},
		],
	};

	return runWorkflow(ex, workflow);
}

async function executeCrawlerPrompt(ex: IExecuteFunctions): Promise <INodeExecutionData[][]> {
	const d = ex.getExecuteData();
	const { limit, prompt, url } = d.node.parameters;
	const workflow = {
		options: { limit },
		steps: [
			{
				name: 'const',
				args: {
					items: [{ url }],
				},
			},
			{
				name: 'crawl',
				args: {
					query: prompt,
				},
			},
		],
	};

	return runWorkflow(ex, workflow);
}

async function executeExtractSingle(ex: IExecuteFunctions): Promise <INodeExecutionData[][]> {
	const d = ex.getExecuteData();
	const {
		limit,
		url,
		field1,
		field2,
		field3,
		field4,
		field5,
	} = d.node.parameters;

	const fields = [
		field1,
		field2,
		field3,
		field4,
		field5,
	];
	const questions: { [key: string]: string } = {};
	console.log('fields', fields);
	for (const field of fields) {
		if (typeof field === 'string' && field !== '') {
			questions[field] = field;
		}
	}

	const workflow = {
		options: { limit },
		steps: [
			{
				name: 'const',
				args: {
					items: [{ url }],
				},
			},
			{
				name: 'extract',
				args: {
					questions,
					mode: 'single',
				},
			},
		],
	};

	return runWorkflow(ex, workflow);
}

async function executeExtractMultiple(ex: IExecuteFunctions): Promise <INodeExecutionData[][]> {
	const d = ex.getExecuteData();
	const {
		limit,
		url,
		field1,
		field2,
		field3,
		field4,
		field5,
	} = d.node.parameters;

	const fields = [
		field1,
		field2,
		field3,
		field4,
		field5,
	];
	const questions: { [key: string]: string } = {};
	console.log('fields', fields);
	for (const field of fields) {
		if (typeof field === 'string' && field !== '') {
			questions[field] = field;
		}
	}

	const workflow = {
		options: { limit },
		steps: [
			{
				name: 'const',
				args: {
					items: [{ url }],
				},
			},
			{
				name: 'extract',
				args: {
					questions,
					mode: 'multiple',
				},
			},
		],
	};

	return runWorkflow(ex, workflow);
}

async function runWorkflow(ex: IExecuteFunctions, workflow: any): Promise <INodeExecutionData[][]> {
	console.log('workflow', JSON.stringify(workflow, null, 2));
	const workflowResp = await ex.helpers.requestWithAuthentication.call(
		ex,
		'fetchFoxApi',
		{
			method: 'POST',
			uri: `${host}/api/v2/workflows`,
			json: true,
			body: workflow,
		});
	console.log('resp', workflowResp);
	const workflowId = workflowResp.id;

	const runResp = await ex.helpers.requestWithAuthentication.call(
		ex,
		'fetchFoxApi',
		{
			method: 'POST',
			uri: `${host}/api/v2/workflows/${workflowId}/run`,
			json: true,
		});
	console.log('run resp', runResp);
	const jobId = runResp.jobId;

	const items: IDataObject[] = await new Promise<IDataObject[]>(async (ok) => {
		let count = 0;
		const poll = async () => {
			console.log('poll', count++, jobId);
			let resp;
			try {
				resp = await ex.helpers.requestWithAuthentication.call(
					ex,
					'fetchFoxApi',
					{
						method: 'GET',
						uri: `https://fetchfox.ai/api/v2/jobs/${jobId}`,
						json: true,
					});
			} catch (e) {
				console.log('fetch error:', e);
			}

			const items = resp.results?.items || [];
			console.log('poll got:', items.length);
			if (resp?.done) {
				ok(cleanItems(items));
			} else {
				setTimeout(poll, 1000);
			}
		}
		await poll();
	});
	console.log('results', items);

	return [ex.helpers.returnJsonArray(items)];
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

type Item = { [key: string]: any };
function cleanItems(items: Item[]): Item[] {
  return items.map(item => {
    const clean: Item = {};
    for (const key in item) {
      if (!key.startsWith('_')) {
        clean[key] = item[key];
      }
			if (key == '_url') {
				clean.url = item._url;
			}
    }
    return clean;
  });
}
