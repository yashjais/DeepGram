const wss = require('ws');
const url = require('url');

const { createClient, LiveTranscriptionEvents } = require('@deepgram/sdk');

const DEEPGRAM_API_KEY = '';

const setupWebSocketConnection = ({
  ws,
  deepgramClient,
  model,
  interimResults,
  replaceTerms = [],
  keywordTerms = [],
}) => {
  try {
    const connection = deepgramClient.listen.live({
      punctuate: false,
      language: 'en-US',
      filler_words: true,
      model,
      interim_results: interimResults,
      replace: replaceTerms,
      keywords: keywordTerms,
		});

    connection.on(LiveTranscriptionEvents.Error, async (error) => {
      const errorMessage = {
        type: 'error',
        message: error.message || 'Something went wrong. Please contact Admin',
			};

      if (ws.readyState === wss.OPEN) {
        ws.send(JSON.stringify(errorMessage));
			}

      ws.close();
		});

    connection.on(LiveTranscriptionEvents.Open, () => {
      try {
        connection.on(LiveTranscriptionEvents.Close, () => {
          ws.close();
				});

        connection.on(LiveTranscriptionEvents.Metadata, (data) => {});

        connection.on(LiveTranscriptionEvents.Transcript, (data) => {
          ws.send(JSON.stringify(data));
				});

        connection.on(LiveTranscriptionEvents.Error, async (error) => {
          const errorMessage = {
            type: 'error',
            message: error.message || 'Something went wrong. Please contact Admin',
					};

          if (ws.readyState === wss.OPEN) {
            ws.send(JSON.stringify(errorMessage));
					}

          ws.close();
				});

        connection.on(LiveTranscriptionEvents.Warning, async (warning) => {
          console.log('deepgram: Warning', warning);
				});

        // eslint-disable-next-line no-param-reassign
        ws.onmessage = (event) => {
          connection.send(event.data);
				};
			} catch (err) {
        console.log('err', err);
			}
		});
	} catch (err) {
    console.error('Error during DeepGram setup:', err);
	}
};

const handleDeepGramWebSocketConnection = (ws, req) => {
  try {
    const queryParams = url.parse(req.url, true).query;

    const {
      interimResults: interimResultsQueryParam = 'false',
      model = 'nova',
      keywords = '',
      replace = '',
		} = queryParams;

    const interimResults = interimResultsQueryParam === 'true';
    const replaceTerms = replace ? replace.split(',').map((term) => decodeURIComponent(term)) : [];
    const keywordTerms = keywords ? keywords.split(',').map((term) => decodeURIComponent(term)) : [];

    if (!DEEPGRAM_API_KEY) {
      // logger.info('Error: DEEPGRAM_API_KEY is missing in the environment variables.');

      const errorMessage = {
        type: 'error',
        message: 'DEEPGRAM_API_KEY is missing in the environment variables.',
			};

      if (ws.readyState === wss.OPEN) {
        ws.send(JSON.stringify(errorMessage));
			}

      ws.close();

      return;
		}

    const deepgramClient = createClient(DEEPGRAM_API_KEY,
		{
      global: {
        // url: '' // load balancer url
        url: 'api.deepgram.com',
			},
      fetch: {
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Info': '@deepgram/sdk; server; v3.0.1',
          'User-Agent': '@deepgram/sdk/3.0.1',
				},
			},
		});

    // Setup WebSocket connection
    setupWebSocketConnection({
      ws,
      deepgramClient,
      model,
      interimResults,
      replaceTerms,
      keywordTerms,
		});
	} catch (err) {
    console.error('Error during WebSocket setup:', err);
	}
};

module.exports = handleDeepGramWebSocketConnection;

