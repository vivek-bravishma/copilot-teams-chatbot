import { TeamsActivityHandler, TurnContext } from "botbuilder";
import axios from "axios";
export class TeamsBot extends TeamsActivityHandler {
	public conversationReferences: any;

	constructor(conversationReferences) {
		console.log("teamsBot constructor");

		super();
		this.conversationReferences = conversationReferences;

		this.onConversationUpdate(async (context, next) => {
			console.log("teamsBot onConversationUpdate");

			addConversationReference(context.activity);
			await next();
		});

		this.onMessage(async (context, next) => {
			console.log("teamsBot onMessage");

			addConversationReference(context.activity);
			// await context.sendActivity(`You sent '${context.activity.text}'`);

			const payload = {
				// from: context.activity.conversation.id,
				// text: context.activity.text,
				// to: recipiant,
				// api_key: vonageApiKey,
				// api_secret: vonageApiSecret,
				user: {
					conversationId: context.activity.conversation.id,
					username: context.activity.from.name,
				},
				text: context.activity.text,
				message_type: "text",
				// image,
				// audio,
				// video,
				// file,
				// location,
				// mobileNumber,
			};
			console.log("sms_payload= ", payload);
			// let connectorUrl = "http://localhost:3000/teams-copilot-callback";
			let connectorUrl =
				"https://connector.lab.bravishma.com/teams-copilot-callback";

			try {
				let connectorResponse = await axios.post(connectorUrl, payload);
				console.log("connectorResponse==> ", connectorResponse);
				await context.sendActivity(
					`You sent '${context.activity.text}'`
				);
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
			console.log(
				"teamsBot onMembersAdded",
				context.activity.membersAdded
			);

			const membersAdded = context.activity.membersAdded;
			for (const member of membersAdded) {
				if (member.id !== context.activity.recipient.id) {
					const welcomeMessage =
						"Welcome to the Proactive Bot sample.  Navigate to http://localhost:3978/api/notify to proactively message everyone who has previously messaged this bot.";
					await context.sendActivity(welcomeMessage);
				}
			}
			await next();
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
	}

	// private wait(ms: number) {
	// 	return new Promise((resolve) => setTimeout(resolve, ms));
	// }

	// private connectToBackend() {
	// 	this.socket = io("http://localhost:3000");

	// 	this.socket.on("connect", () => {
	// 		console.log("Socket.IO connection established with backend.");
	// 	});

	// 	this.socket.on("disconnect", () => {
	// 		console.log("Socket.IO connection disconnected.");
	// 	});

	// 	this.socket.on("connect_error", (error) => {
	// 		console.error("Socket.IO connection error:", error);
	// 	});

	// 	// Listen for responses from backend and forward them to the user
	// 	// this.socket.on("copilotTeamsAgentResponse", async (data) => {
	// 	// 	console.log("data==> ", data);
	// 	// 	this.activeContexts.forEach((value, key) =>
	// 	// 		console.log(
	// 	// 			"copilotTeamsAgentResponse - connectedSocketsMap==> ",
	// 	// 			key,
	// 	// 			" = ",
	// 	// 			value
	// 	// 		)
	// 	// 	);
	// 	// 	const { conversationId, message } = data;

	// 	// 	// Retrieve the stored context
	// 	// 	const context = this.activeContexts.get(conversationId);
	// 	// 	if (context) {
	// 	// 		console.log("ctonX=> ", context);
	// 	// 		let adapter = context.adapter;
	// 	// 		// context.sendActivity(message).catch((error) => {
	// 	// 		// 	console.error("Error sending activity:", error);
	// 	// 		// });
	// 	// 		await adapter.continueConversation(
	// 	// 			conversationReferences[conversationId],
	// 	// 			async (turnContext) => {
	// 	// 				await turnContext.sendActivity(message);
	// 	// 			}
	// 	// 		);
	// 	// 	} else {
	// 	// 		console.error(
	// 	// 			"Context not found for conversationId:",
	// 	// 			conversationId
	// 	// 		);
	// 	// 	}
	// 	// });
	// }
}
/*
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
*/
