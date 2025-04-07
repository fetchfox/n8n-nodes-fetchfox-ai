import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FetchFoxApi implements ICredentialType {
	name = 'fetchFoxApi';
	displayName = 'FetchFox API';
	documentationUrl = 'https://docs.fetchfox.ai';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://fetchfox.ai/api/v2',
			url: '/user/me',
		},
	};

	// authenticate = {
	// 	type: 'generic',
	// 	properties: {
	// 		headers: {
	// 			'Authorization': '=Bearer {{$credentials.apiKey}}'
	// 		}
	// 	}
	// } as IAuthenticateGeneric;
}
