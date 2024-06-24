import * as restify from "restify";
import {
	CloudAdapter,
	ConfigurationServiceClientCredentialFactory,
	ConfigurationBotFrameworkAuthentication,
	TurnContext,
	ActivityTypes,
} from "botbuilder";

import { INodeSocket } from "botframework-streaming";
import { io, Socket } from "socket.io-client";

import { TeamsBot } from "./teamsBot";
import config from "./config";

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
	console.log(`\nBot Started, ${server.name} listening to ${server.url}`);
});
server.use(
	restify.plugins.bodyParser({
		mapParams: true,
	})
);
server.use(restify.plugins.queryParser());

const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
	MicrosoftAppId: config.botId,
	MicrosoftAppPassword: config.botPassword,
	MicrosoftAppType: "MultiTenant",
});

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(
	{},
	credentialsFactory
);

const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
const onTurnErrorHandler = async (context: TurnContext, error: Error) => {
	// This check writes out errors to console log .vs. app insights.
	// NOTE: In production environment, you should consider logging this to Azure
	//       application insights.
	console.error(`\n [onTurnError] unhandled error: ${error}`);

	// Only send error message for user messages, not for other message types so the bot doesn't spam a channel or chat.
	// if (context.activity.type === "message") {
	if (context.activity.type === ActivityTypes.Message) {
		// Send a trace activity, which will be displayed in Bot Framework Emulator
		await context.sendTraceActivity(
			"OnTurnError Trace",
			`${error}`,
			"https://www.botframework.com/schemas/error",
			"TurnError"
		);

		// Send a message to the user
		await context.sendActivity(
			`The bot encountered unhandled error:\n ${error.message}`
		);
		await context.sendActivity(
			"To continue to run this bot, please fix the bot source code."
		);
	}
};

adapter.onTurnError = onTurnErrorHandler;

// Create the bot that will handle incoming messages.
const conversationReferences = {};
const bot = new TeamsBot(conversationReferences);

server.post("/api/messages", async (req, res) => {
	// console.log("get /api/messages==> ", conversationReferences);
	console.log("post /api/messages=> ", req.body);

	await adapter.process(req, res, async (context) => {
		await bot.run(context);
	});
});

server.on("upgrade", async (req, socket, head) => {
	// Create an adapter scoped to this WebSocket connection to allow storing session data.
	console.log("upgrade");

	const streamingAdapter = new CloudAdapter(botFrameworkAuthentication);

	streamingAdapter.onTurnError = onTurnErrorHandler;

	await streamingAdapter.process(
		req,
		socket as unknown as INodeSocket,
		head,
		(context) => bot.run(context)
	);
});

server.get("/api/notify", async (req, res) => {
	console.log("get /api/notify");

	for (const conversationReference of Object.values(conversationReferences)) {
		await adapter.continueConversationAsync(
			config.botId,
			conversationReference,
			async (turnContext) => {
				await turnContext.sendActivity("proactive hello");
			}
		);
	}

	console.log("get /api/notify==> ", conversationReferences);
	res.setHeader("Content-Type", "text/html");
	res.writeHead(200);
	res.write(
		`<html><body><h1>Proactive messages have been sent.</h1><div>
    ${conversationReferences}
    </div></body></html>`
	);
	res.end();
});

server.post("/api/notify", async (req, res) => {
	console.log("post /api/notify");

	for (const msg of req.body) {
		for (const conversationReference of Object.values(
			conversationReferences
		)) {
			await adapter.continueConversationAsync(
				config.botId,
				conversationReference,
				async (turnContext) => {
					await turnContext.sendActivity(msg);
				}
			);
		}
	}
	res.setHeader("Context-Type", "text/html");
	res.writeHead(200);
	res.write("Proactive messages have been sent.");
	res.end();
});

server.get("/api/users", async (req, res) => {
	let users = `<li><pre>${JSON.stringify(
		conversationReferences,
		undefined,
		4
	)}</pre></li>`;

	res.setHeader("Content-Type", "text/html");
	res.writeHead(200);
	res.write(
		`<html><body><h2>Proactive messages have been sent.</h2>
    ${users}
    </body></html>`
	);
	res.end();
});

server.get("/api/user/:conversationId", async (req, res) => {
	// Access path parameters from req.params
	const conversationId = req.params.conversationId;
	// Access query parameters from req.query
	const queryParams = req.query;

	let isValid = false;

	if (conversationReferences[conversationId]) {
		console.log(`${conversationId} exists.`);
		isValid = true;
		await adapter.continueConversationAsync(
			config.botId,
			conversationReferences[conversationId],
			async (turnContext) => {
				await turnContext.sendActivity(queryParams?.msg);
			}
		);
	} else {
		isValid = false;
		console.log(`${conversationId} does not exist.`);
	}

	// for (const conversationReference of Object.values(conversationReferences)) {
	// 	await adapter.continueConversationAsync(
	// 		config.botId,
	// 		conversationReference,
	// 		async (turnContext) => {
	// 			await turnContext.sendActivity("proactive hello");
	// 		}
	// 	);
	// 	console.log("conversationReference=> ", conversationReferences);
	// }

	let users = `<li><pre>${JSON.stringify(
		conversationReferences,
		undefined,
		4
	)}</pre></li>`;

	res.setHeader("Content-Type", "text/html");
	res.writeHead(200);
	res.write(
		`<html><body><h2>Proactive messages have been sent.</h2>
		${conversationId}
		isValid: ${isValid}
		${JSON.stringify(queryParams, null, 4)}
	${users}
	</body></html>`
	);
	res.end();
});

server.post("/api/msgwebhook", async (req, res) => {
	let isValid = false;

	const reqBody = req.body;
	console.log("reqBody=> ", reqBody);
	const conversationId = reqBody.conversationId;
	const message = reqBody.message;

	if (conversationReferences[conversationId]) {
		console.log(`${conversationId} exists.`);
		isValid = true;
		await adapter.continueConversationAsync(
			config.botId,
			conversationReferences[conversationId],
			async (turnContext) => {
				await turnContext.sendActivity(message?.text);
			}
		);
	} else {
		isValid = false;
		console.log(`${conversationId} does not exist.`);
	}

	let users = `<li><pre>${JSON.stringify(
		conversationReferences,
		undefined,
		4
	)}</pre></li>`;

	res.setHeader("Content-Type", "text/html");
	res.writeHead(200);
	res.write(
		`<html><body><h2>Proactive messages have been sent.</h2>
		${users}
		</body></html>`
		// ${conversationId}
		// isValid: ${isValid}
		// ${JSON.stringify(queryParams, null, 4)}
	);
	res.end();
});
