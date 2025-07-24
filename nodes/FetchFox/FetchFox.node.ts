import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
	// IDataObject,
	// ILoadOptionsFunctions,
	// INodePropertyOptions,
	// IRequestOptions,
} from 'n8n-workflow';

const host = 'https://dev.api.fetchfox.ai';

export class FetchFox implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FetchFox',
		name: 'fetchFox',
		icon: 'file:fox.svg',
		group: ['transform'],
		version: 1,
		description: 'Scrape data with FetchFox',
		subtitle: '={{$parameter["resource"]}}',
		defaults: {
			name: 'FetchFox'
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
						name: 'Crawl',
						value: 'crawl',
					},
					{
						name: 'Extract',
						value: 'extract',
					},
					{
						name: 'Scrape',
						value: 'scrape',
					},
				],
				default: 'crawl',
			},

			// Crawl operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['crawl'],
					},
				},
				options: [
					{
						name: 'Find URLs Matching a URL Pattern',
						value: 'pattern',
						action: 'Find urls matching a pattern',
					},
				],
				default: 'pattern',
			},

			// Crawl options
			{
				displayName: 'URL Pattern to Find. Include at Least One * Wildcard',
				description: 'FetchFox find URLs matching this pattern. For example, https://www.example.com/directory/*. Pattern must have at least on * in it',
				name: 'pattern',
				type: 'string',
				default: '',
				placeholder: 'https://www.example.com/directory/*',
				required: true,
				displayOptions: {
					show: {
						resource: ['crawl'],
						operation: ['pattern'],
					},
				},
			},

			// Extract operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				// type: 'hidden',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['extract'],
					},
				},
				options: [
					{
						name: 'Extract a Single Item per URL',
						value: 'single',
						action: 'Extract a single item per URL',
					},
					{
						name: 'Extract Multiple Items per URL',
						value: 'multiple',
						action: 'Extract multiple items per URL',
					},
				],
				default: 'single',
			},

			// Extract options
			{
				displayName: 'Target URL for Extraction',
				description: 'Enter the URL from which you\'d like to scrape data',
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
				displayName: 'Proxy',
				description: 'Which proxy should be used to load pages?',
				name: 'proxy',
				type: 'options',
				options: [
					{
						name: 'None ($0.01 per GB)',
						value: 'none',
					},
					{
						name: 'Datacenter ($0.01 per GB)',
						value: 'datacenter',
					},
					{
						name: 'Residential ($8.00 per GB)',
						value: 'residential_cdp',
					},
					{
						name: 'Residential, Load Images, Fonts, Etc ($8.50 per GB)',
						value: 'residential_cdp_assets',
					},
				],
				default: 'none',
				displayOptions: {
					show: {
						resource: ['crawl', 'extract'],
					},
				},
			},
			{
				displayName: 'Content Transformation',
				description: 'How should the page content be transformed? Less data lowers AI costs',
				name: 'contentTransform',
				type: 'options',
				options: [
					{
						name: 'Text Only',
						value: 'text_only',
					},
					{
						name: 'Text and Basic HTML (Keep Links and Image URLs Only)',
						value: 'slim_html',
					},
					{
						name: 'Full HTML',
						value: 'full_html',
					},
					{
						name: 'AI Automatically Selects',
						value: 'reduce',
					},
				],
				default: 'slim_html',
				displayOptions: {
					show: {
						resource: ['extract'],
					},
				},
			},

			{
				displayName: 'Data to Extract',
				name: 'fields',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add data field to extract',
				default: {},
				description: 'These fields will be extracted from the target pages',
				displayOptions: {
					show: {
						resource: ['extract'],
					},
				},

				options: [
					{
						displayName: '',
						name: 'extractField',
						values: [
							{
								displayName: 'Field Name',
								name: 'name',
								type: 'string',
								required: true,
								default: '',
								description: 'Name the field',
								placeholder: 'eg. "title"',
								hint: 'Enter the name of the field you want to extract',
							},
							{
								displayName: 'Field Description',
								name: 'description',
								type: 'string',
								required: true,
								default: '',
								description: 'Describe the data you are extracting',
								placeholder: 'eg. "Title of the post"',
								hint: 'Tell the AI what data it should extract',
							},
						],
					},
				],
			},
		],
	};

	methods = {};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const data = this.getExecuteData();

		const { resource, operation } = data.node.parameters;

		switch (`${resource}:${operation}`) {
			case 'crawl:pattern': return executeCrawlPattern(this);
			case 'extract:single': return executeExtract(this);
			case 'extract:multiple': return executeExtract(this);
		}

		return [];
	}
}

async function executeCrawlPattern(ex: IExecuteFunctions): Promise <INodeExecutionData[][]> {
	const d = ex.getExecuteData();
	console.log('crawl params', d.node.parameters);

	// TODO: support start urls, max depth, etc.
	const body = {
		pattern: d.node.parameters.pattern,
		proxy: d.node.parameters.proxy,
	};

	console.log('Send body:', body);

	const resp = await ex.helpers.requestWithAuthentication.call(
		ex,
		'fetchFoxApi',
		{
			method: 'POST',
			uri: `${host}/api/crawl`,
			json: true,
			body,
		});

	const urls = resp.results.hits.map((it: any) => ({ url: it }));
	const metrics = resp.metrics;

	if (urls[0]) {
		urls[0]._metrics = metrics;
	}

	console.log('urls', urls);

	return [ex.helpers.returnJsonArray(urls)];
}

async function executeExtract(ex: IExecuteFunctions): Promise <INodeExecutionData[][]> {
	const d = ex.getExecuteData();

	const url = d.node.parameters.url;
	const template: { [key: string]: string } = {};
	const { fields } = ex.getExecuteData().node.parameters;
	if (fields) {
		const f = (fields as { extractField: any }).extractField;
		for (const field of f) {
			template[field.name] = field.description;
		}
	}

	const body = {
		urls: [url],
		template,
		perPage: d.node.parameters.operation == 'multiple' ? 'many' : 'one',
		proxy: d.node.parameters.proxy,
		contentTransform: d.node.parameters.contentTransform,
	};

	console.log('Send body:', body);
	const resp = await ex.helpers.requestWithAuthentication.call(
		ex,
		'fetchFoxApi',
		{
			method: 'POST',
			uri: `${host}/api/extract`,
			json: true,
			body,
		});


	const items = resp.results.items;
	const metrics = resp.metrics;

	if (items[0]) {
		items[0]._metrics = metrics;
	}

	return [ex.helpers.returnJsonArray(items)];
}
