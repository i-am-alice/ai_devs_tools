import {HumanMessage, SystemMessage} from "langchain/schema";
import {ChatOpenAI} from "langchain/chat_models/openai";
import {currentDateTime} from "./helpers.ts";

const getEvents = {
    name: 'getEvents',
    description: `Fetch user calendar events based on a current date and time. By default it will fetch events for today 00:00 - 23:59.
    Dates "from" and "to" should be in the future unless user explicitly requests otherwise. "all" is required.`,
    parameters: {
        type: 'object',
        properties: {
            from: {
                type: 'string',
                description: 'Datetime from which events should be fetched. Format: YYYY-MM-DD HH:mm:ss. Defaults to the current datetime, so it will fetch events from now on.'
            },
            to: {
                type: 'string',
                description: 'Datetime events should be fetched to. Format: YYYY-MM-DD HH:mm:ss'
            },
            all: {
                type: 'boolean',
                description: 'If true, fetch all events, not only upcoming ones. Always defaults to "false"'
            }
        },
        required: ["from", "to", "all"]
    }
}

const addEvents = {
    name: 'addEvents',
    description: `Add list of users events that include concise name, from, to, location and attendees.`,
    parameters: {
        type: 'object',
        required: ["events"],
        properties: {
            events: {
                type: 'array',
                description: 'A complete list of events extracted from the user message',
                items: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Meaningful, yet ultra concise event name, created based on the user message'
                        },
                        from: {
                            type: 'string',
                            description: 'Carefully extracted start datetime for this exact event. Always format exactly as YYYY-MM-DD HH:mm:ss'
                        },
                        to: {
                            type: 'string',
                            description: 'Carefully extracted end datetime for this exact event. Always format exactly as YYYY-MM-DD HH:mm:ss. Defaults to "from" +30m datetime.'
                        },
                        location: {
                            type: 'string',
                            description: 'Location for this exact event. May be empty.'
                        },
                    }
                },
                required: ["name", "from", "to", "location"]
            }
        }
    }
}

const updateEvents = {
    name: 'updateEvents',
    description: `Update list of users events that include concise name, from, to, location and attendees. Leave empty if no changes are required.`,
    parameters: {
        type: 'object',
        required: ["events"],
        properties: {
            events: {
                type: 'array',
                description: 'A complete list of events extracted from the user message',
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Unique event id extracted from the system message by comparing the event mentioned in the user message with the list of events fetched from the calendar.'
                        },
                        name: {
                            type: 'string',
                            description: 'Meaningful, yet ultra concise event name, created based on the user message'
                        },
                        from: {
                            type: 'string',
                            description: 'Carefully extracted start datetime for this exact event. Always format exactly as YYYY-MM-DD HH:mm:ss'
                        },
                        to: {
                            type: 'string',
                            description: 'Carefully extracted end datetime for this exact event. Always format exactly as YYYY-MM-DD HH:mm:ss. Defaults to "from" +30m datetime.'
                        },
                        location: {
                            type: 'string',
                            description: 'Location for this exact event. May be empty.'
                        },
                    }
                },
                required: ["name"]
            }
        }
    }
}


const chat = new ChatOpenAI({
    modelName: 'gpt-4-1106-preview'
}).bind({functions: [getEvents, addEvents, updateEvents]});

const list = await chat.invoke([
    new SystemMessage(`Current datetime you may use is: ${currentDateTime()}`),
    new HumanMessage(
        "What events do I have today?"
    ),
]);

// Pobiera listę zadań, domyślnie od bieżącego momentu
console.log(list?.additional_kwargs?.function_call?.name);
console.log(list?.additional_kwargs?.function_call?.arguments);

const add = await chat.invoke([
    new SystemMessage(`Current datetime: ${currentDateTime()}`),
    new HumanMessage(
        "I have a meeting with Bartek today at 7pm and I'm going to see with Marta this Monday at 8pm and it will take me like 5 hours. Can you add these events?"
    ),
]);

// Dodaje listę zdarzeń wymienionych w wiadomości
console.log(add?.additional_kwargs?.function_call?.name);
console.log(add?.additional_kwargs?.function_call?.arguments);

const update = await chat.invoke([
    new SystemMessage(`Current datetime: ${currentDateTime()}`),
    new HumanMessage(
        "Meeting with Bartek is canceled. I'm going to see with Marta this Monday at 8pm and it will take me like 5 hours. Can you update these events?"
    ),
]);

// Aktualizuje listę zdarzeń wymienionych w wiadomości
console.log(update?.additional_kwargs?.function_call?.name);
console.log(update?.additional_kwargs?.function_call?.arguments);





