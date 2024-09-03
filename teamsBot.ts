import {
	ActionTypes,
	ActivityHandler,
	ActivityTypes,
	CardFactory,
	MessageFactory,
	TeamsActivityHandler,
	TurnContext,
} from "botbuilder";

import axios from "axios";
export class TeamsBot extends TeamsActivityHandler {
	public conversationReferences: any;
	public createMessage: Function;

	// public connectorUrl = "http://localhost:3000/teams-copilot-callback";
	public connectorUrl =
		"https://connector.lab.bravishma.com/teams-copilot-callback";

	// public connectorInitUrl =
	// 	"http://localhost:3000/teams-copilot-init-callback";
	public connectorInitUrl =
		"https://connector.lab.bravishma.com/teams-copilot-init-callback";
	constructor(conversationReferences) {
		console.log("teamsBot constructor");

		super();
		this.conversationReferences = conversationReferences;
		this.createMessage = createMessage;

		this.onConversationUpdate(async (context, next) => {
			console.log("teamsBot onConversationUpdate");

			addConversationReference(context.activity);
			await next();
		});

		this.onMessage(async (context, next) => {
			console.log("teamsBot onMessage");
			addConversationReference(context.activity);

			try {
				let connectorResponse = await axios.post(
					this.connectorUrl,
					context.activity
				);
				// console.log("connectorResponse==> ", connectorResponse);
			} catch (error) {
				console.log("connector error--> ", error);
			}

			await next();
		});

		// this.onMessage(async (context, next) => {
		// 	console.log("Running with Message Activity.");

		// 	// Remove bot mention text from the message
		// 	const removedMentionText = TurnContext.removeRecipientMention(
		// 		context.activity
		// 	);
		// 	const currentUser = context.activity.from.id;
		// 	conversationReferences[currentUser] =
		// 		TurnContext.getConversationReference(context.activity);

		// 	const userMessage = removedMentionText
		// 		.toLowerCase()
		// 		.replace(/\n|\r/g, "")
		// 		.trim();

		// 	// Store the context using conversation ID as the key
		// 	const conversationId = context.activity.conversation.id;
		// 	this.activeContexts.set(conversationId, context);

		// 	// Establish Socket.IO connection if not already connected
		// 	if (!this.socket || !this.socket.connected) {
		// 		this.connectToBackend();
		// 	}

		// 	// this.activeContexts.forEach((value, key) =>
		// 	// 	console.log(
		// 	// 		"onMessage - connectedSocketsMap==> ",
		// 	// 		key,
		// 	// 		" = ",
		// 	// 		value
		// 	// 	)
		// 	// );

		// 	// Send user message to backend via Socket.IO
		// 	this.socket.emit("copilotTeamsUserMessage", {
		// 		conversationId,
		// 		message: userMessage,
		// 	});

		// 	await context.sendActivity(`Echo: ${userMessage}`);

		// 	console.log("b4 next");
		// 	await next();
		// 	console.log("fter next");

		// 	this.socket.on("copilotTeamsAgentResponse", async (data) => {
		// 		console.log("data==> ", data);
		// 		const { conversationId, message } = data;

		// 		// Retrieve the stored context
		// 		// const context = this.activeContexts.get(conversationId);
		// 		if (context) {
		// 			// console.log("ctonX=> ", context);
		// 			// let adapter = context.adapter;
		// 			await context.sendActivity(message).catch((error) => {
		// 				console.error("Error sending activity:", error);
		// 			});
		// 			// await adapter.continueConversation(
		// 			//   conversationReferences[conversationId],
		// 			//   async (turnContext) => {
		// 			//     await turnContext.sendActivity(message);
		// 			//   }
		// 			// );
		// 		} else {
		// 			console.error(
		// 				"Context not found for conversationId:",
		// 				conversationId
		// 			);
		// 		}
		// 	});

		// 	await this.wait(30000);
		// 	console.log("fter wait");

		// 	await context.sendActivity(`Echo2: ${userMessage}`);
		// 	console.log("fter 2nd send");
		// });

		this.onMembersAdded(async (context, next) => {
			try {
				const copilotbotName = "IT_SUPPORT";
				let connectorResponse = await axios.post(
					this.connectorInitUrl,
					{ contextActivity: context.activity, copilotbotName }
				);
				console.log("connectorResponse==> ", connectorResponse);
			} catch (error) {
				console.log("connector error--> ", error);
			}
		});

		this.onMembersRemoved(async (context, next) => {
			console.log(
				"TeamsBot onMembersRemoved",
				context.activity.membersRemoved
			);
			const membersRemoved = context.activity.membersRemoved;
			for (const member of membersRemoved) {
				if (member.id !== context.activity.recipient.id) {
					removeConversationReference(context.activity);
				}
			}
			await next();
		});

		function addConversationReference(activity): void {
			console.log("teamsBot funk addConversationReference");

			const conversationReference =
				TurnContext.getConversationReference(activity);
			conversationReferences[conversationReference.conversation.id] =
				conversationReference;
		}

		function removeConversationReference(activity): void {
			console.log("TeamsBot removeConversationReference");
			const conversationReference =
				TurnContext.getConversationReference(activity);
			delete this.conversationReferences[
				conversationReference.conversation.id
			];
		}

		function createMessage(messageData): MessageFactory {
			let reply = MessageFactory.text(messageData.text);
			reply.attachmentLayout = messageData.attachmentLayout;
			reply.attachments = messageData.attachments;
			reply.suggestedActions = messageData.suggestedActions;
			reply.speak = messageData.speak;
			reply.inputHint = messageData.inputHint;
			reply.from = messageData.from;
			reply.action = messageData.action;
			reply.label = messageData.label;
			reply.semanticAction = messageData.semanticAction;
			reply.textFormat = messageData.textFormat;
			reply.summary = messageData.summary;
			reply.textHighlights = messageData.textHighlights;
			reply.type = messageData.type;
			reply.value = messageData.value;
			reply.valueType = messageData.valueType;

			return reply;
		}
	}
}

/**
let Text_TeamMsg = {
	channelId: "emulator",
	from: {
		id: "16d5f97b-e08e-4a4e-9b10-62da84d9464e",
		name: "User",
		role: "user",
	},
	locale: "en-US",
	localTimestamp: "2024-06-24T12:49:06+05:30",
	localTimezone: "Asia/Calcutta",
	timestamp: "2024-06-24T07:19:06.187Z",
	conversation: { id: "b307f120-31f7-11ef-80bd-351867889c85|livechat" },
	id: "0aa3d9b0-31fa-11ef-9e2e-59df0510fd8c",
	recipient: {
		id: "439fdf60-2ef9-11ef-80bd-351867889c85",
		name: "Bot",
		role: "bot",
	},
	serviceUrl: "http://localhost:51421",

	channelData: {
		clientActivityID: "1719213546104x77mbq02nhh",
		clientTimestamp: "2024-06-24T07:19:06.104Z",
	},

	type: "message",

	text: "sup bot",
	textFormat: "plain",
};

let PDF_TeamMsg = {
	channelId: "emulator",
	from: {
		id: "16d5f97b-e08e-4a4e-9b10-62da84d9464e",
		name: "User",
		role: "user",
	},
	locale: "en-US",
	localTimestamp: "2024-06-24T12:32:46+05:30",
	localTimezone: "Asia/Calcutta",
	timestamp: "2024-06-24T07:02:46.178Z",
	conversation: { id: "b307f120-31f7-11ef-80bd-351867889c85|livechat" },
	id: "c2825821-31f7-11ef-9e2e-59df0510fd8c",
	recipient: {
		id: "439fdf60-2ef9-11ef-80bd-351867889c85",
		name: "Bot",
		role: "bot",
	},
	serviceUrl: "http://localhost:51421",

	type: "message",

	channelData: {
		attachmentSizes: [431085],
		clientActivityID: "1719212566001ce2vm8h9l0l",
		clientTimestamp: "2024-06-24T07:02:46.001Z",
	},
	attachments: [
		{
			name: "Baggage allowanc First-class-1.pdf",
			contentType: "application/pdf",
			contentUrl:
				"http://localhost:51421/v3/attachments/c2825820-31f7-11ef-9e2e-59df0510fd8c/views/original",
		},
	],
};

let Img_TeamMsg = {
	channelId: "emulator",
	from: {
		id: "16d5f97b-e08e-4a4e-9b10-62da84d9464e",
		name: "User",
		role: "user",
	},
	locale: "en-US",
	localTimestamp: "2024-06-24T12:54:18+05:30",
	localTimezone: "Asia/Calcutta",
	timestamp: "2024-06-24T07:24:18.609Z",
	conversation: { id: "b307f120-31f7-11ef-80bd-351867889c85|livechat" },
	id: "c4dbaa11-31fa-11ef-9e2e-59df0510fd8c",
	recipient: {
		id: "439fdf60-2ef9-11ef-80bd-351867889c85",
		name: "Bot",
		role: "bot",
	},
	serviceUrl: "http://localhost:51421",

	type: "message",

	channelData: {
		attachmentSizes: [14015],
		clientActivityID: "1719213858441zjhstro5sim",
		clientTimestamp: "2024-06-24T07:24:18.441Z",
	},
	attachments: [
		{
			name: "user.png",
			contentType: "image/png",
			contentUrl:
				"http://localhost:51421/v3/attachments/c4dbaa10-31fa-11ef-9e2e-59df0510fd8c/views/original",
		},
	],
};

let Audio_TeamMsg = {
	channelId: "emulator",
	from: {
		id: "16d5f97b-e08e-4a4e-9b10-62da84d9464e",
		name: "User",
		role: "user",
	},
	locale: "en-US",
	localTimestamp: "2024-06-24T12:55:52+05:30",
	localTimezone: "Asia/Calcutta",
	timestamp: "2024-06-24T07:25:52.824Z",
	conversation: { id: "b307f120-31f7-11ef-80bd-351867889c85|livechat" },
	id: "fd03bb81-31fa-11ef-9e2e-59df0510fd8c",
	recipient: {
		id: "439fdf60-2ef9-11ef-80bd-351867889c85",
		name: "Bot",
		role: "bot",
	},
	serviceUrl: "http://localhost:51421",

	type: "message",

	channelData: {
		attachmentSizes: [2678001],
		clientActivityID: "1719213952655unkyr29m43j",
		clientTimestamp: "2024-06-24T07:25:52.655Z",
	},
	attachments: [
		{
			name: "y2mate.com - fools cant help falling in love ft Sody Sarcastic Sounds Lyric Video.mp3",
			contentType: "audio/mpeg",
			contentUrl:
				"http://localhost:51421/v3/attachments/fd03bb80-31fa-11ef-9e2e-59df0510fd8c/views/original",
		},
	],
};

let Video_TeamMsg = {
	channelId: "emulator",
	from: {
		id: "16d5f97b-e08e-4a4e-9b10-62da84d9464e",
		name: "User",
		role: "user",
	},
	locale: "en-US",
	localTimestamp: "2024-06-24T12:57:09+05:30",
	localTimezone: "Asia/Calcutta",
	timestamp: "2024-06-24T07:27:09.452Z",
	conversation: { id: "b307f120-31f7-11ef-80bd-351867889c85|livechat" },
	id: "2ab03cc0-31fb-11ef-9e2e-59df0510fd8c",
	recipient: {
		id: "439fdf60-2ef9-11ef-80bd-351867889c85",
		name: "Bot",
		role: "bot",
	},
	serviceUrl: "http://localhost:51421",

	type: "message",

	channelData: {
		attachmentSizes: [2488377],
		clientActivityID: "171921402906560h0xcv31ax",
		clientTimestamp: "2024-06-24T07:27:09.065Z",
	},
	attachments: [
		{
			name: "WIN_20240508_11_20_09_Pro.mp4",
			contentType: "video/mp4",
			contentUrl:
				"http://localhost:51421/v3/attachments/2ab015b0-31fb-11ef-9e2e-59df0510fd8c/views/original",
		},
	],
};

let multipleAttachments_TeamsMsg = {
	channelId: "emulator",
	from: {
		id: "a62ed22a-12d2-40ad-966d-d43a11eca6c8",
		name: "User",
		role: "user",
	},
	locale: "en-US",
	localTimestamp: " 2024-06-24T07:59:20.000Z",
	localTimezone: "Asia/Calcutta",
	timestamp: "2024-06-24T07:59:20.747Z",
	conversation: { id: "f38a51b0-31fd-11ef-80bd-351867889c85|livechat" },
	id: "a9d477b0-31ff-11ef-9e2e-59df0510fd8c",
	recipient: {
		id: "8e832ef0-2ecd-11ef-80bd-351867889c85",
		name: "Bot",
		role: "bot",
	},
	serviceUrl: "http://localhost:51421",

	type: "message",

	channelData: {
		attachmentSizes: [431085, 14015, 2678001, 2488377],
		clientActivityID: "1719215960194y2mxgmqda8e",
		clientTimestamp: "2024-06-24T07:59:20.194Z",
	},
	attachments: [
		{
			name: "user.png",
			contentType: "image/png",
			contentUrl:
				"http://localhost:51421/v3/attachments/a9c7a670-31ff-11ef-9e2e-59df0510fd8c/views/original",
		},
		{
			name: "Baggage allowanc First-class.pdf",
			contentType: "application/pdf",
			contentUrl:
				"http://localhost:51421/v3/attachments/a9c92d10-31ff-11ef-9e2e-59df0510fd8c/views/original",
		},
		{
			name: "y2mate.com - fools cant help falling in love ft Sody Sarcastic Sounds Lyric Video.mp3",
			contentType: "audio/mpeg",
			contentUrl:
				"http://localhost:51421/v3/attachments/a9ced260-31ff-11ef-9e2e-59df0510fd8c/views/original",
		},
		{
			name: "WIN_20240508_11_20_09_Pro.mp4",
			contentType: "video/mp4",
			contentUrl:
				"http://localhost:51421/v3/attachments/a9d450a0-31ff-11ef-9e2e-59df0510fd8c/views/original",
		},
	],

	// context props
	rawTimestamp: "2024-06-24T07:59:20.747Z",
	rawLocalTimestamp: "2024-06-24T13:29:20+05:30",
	callerId: null,
	// context props
};
 */

// this.onMembersAdded(async (context, next) => {
// 	let fu = {
// 		type: "message",
// 		speak: '<audio src="https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg" />',

// 		attachments: [],
// 	};

// 	let message = createMessage(fu);

// 	await context.sendActivity(message);
// });
