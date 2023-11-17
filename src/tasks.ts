import {HumanMessage, SystemMessage} from "langchain/schema";
import {ChatOpenAI} from "langchain/chat_models/openai";
import {currentDateTime} from "./helpers.ts";

const getTasksSchema = {
    name: 'getTasks',
    description: `Fetch user tasks based on a current date and time. By default it will fetch tasks for today 00:00 - 23:59.
    Dates "from" and "to" should be in the future unless user explicitly requests otherwise. "all" is required.`,
    parameters: {
        type: 'object',
        properties: {
            from: {
                type: 'string',
                description: 'Datetime from which tasks should be fetched. Format: YYYY-MM-DD HH:mm:ss'
            },
            to: {
                type: 'string',
                description: 'Datetime tasks should be fetched to. Format: YYYY-MM-DD HH:mm:ss'
            },
            all: {
                type: 'boolean',
                description: 'If true, fetch all tasks, not only unfinished ones. Always defaults to "false"'
            }
        },
        required: ["from", "to", "all"]
    }
}

const addTasks = {
    name: 'addTasks',
    description: `Add list of users tasks that include concise name, project, and datetime`,
    parameters: {
        type: 'object',
        properties: {
            tasks: {
                type: 'array',
                description: 'A complete list of tasks extracted from the user message',
                items: {
                    type: 'object',
                    properties: {
                        content: {
                            type: 'string',
                            description: 'Meaningful, yet ultra concise task name, created based on the user message'
                        },
                        due: {
                            type: 'string',
                            description: 'Carefully extracted due datetime for this exact task. Always format exactly as YYYY-MM-DD HH:mm:ss'
                        },
                        project: {
                            type: 'string',
                            description: `
                                Automatically detected project name for this task. Should be either:
                                - "inbox" (default)
                                - "overment" for tasks related to the YouTube channel, second brain, and all activities related to the private life
                                - "eduweb" for tasks related to the education, online courses, design & tech, AI, community, writing newsletters and blog posts
                                - "easy_" for tasks related to the digital products, sales, online business, and marketing
                                
                                Caution: Similar tasks may occur for different project. Consider their context and use your best judgement. For example "Write a newsletter about Subscriptions" is a task for "easy_", not "eduweb" project. 
                            `
                        },
                    },
                    required: ["content", "due", "project"]
                }
            }
        },
        required: ["tasks"]
    }
}

const updateTasks = {
    name: 'updateTasks',
    description: `Update specific tasks from the todo-list mentioned by the user. It may be used to update task name, project, status, or due datetime`,
    parameters: {
        type: 'object',
        properties: {
            tasks: {
                type: 'array',
                description: 'A complete list of tasks that needs to be updated, extracted from the user message',
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Unique task id extracted from the system message by comparing the task mentioned in the user message with the list of task fetched from the todo-list.'
                        },
                        content: {
                            type: 'string',
                            description: 'Meaningful, yet ultra concise, updated task name which content is updated/merged based on both the user message and the current todo-list'
                        },
                        due: {
                            type: 'string',
                            description: 'Carefully extracted due datetime for this exact task. Always format exactly as YYYY-MM-DD HH:mm:ss'
                        },
                        status: {
                            type: 'boolean',
                            description: 'If true, task should be marked as completed. If false, task should be marked as uncompleted. If not present, task status should not be changed.'
                        },
                        project: {
                            type: 'string',
                            description: `
                                Automatically detected project name for this task. Should be either:
                                - "inbox" (default)
                                - "overment" for tasks related to the YouTube channel, second brain, and all activities related to the private life
                                - "eduweb" for tasks related to the education, online courses, design & tech, AI, community, writing newsletters and blog posts
                                - "easy_" for tasks related to the digital products, sales, online business, and marketing
                                
                                Caution: Similar tasks may occur for different project. Consider their context and use your best judgement. For example "Write a newsletter about Subscriptions" is a task for "easy_", not "eduweb" project. 
                            `
                        },
                    },

                    required: ["content", "due", "project"]
                }
            }
        },
        required: ["tasks"]
    }
}


const chat = new ChatOpenAI({
    modelName: 'gpt-4-1106-preview'
}).bind({functions: [getTasksSchema, addTasks, updateTasks]});

const fetchTasks = await chat.invoke([
    new SystemMessage(`Current datetime: ${currentDateTime()}`),
    new HumanMessage(
        "Could you get my tasks for Monday?"
    ),
]);

console.log(fetchTasks?.additional_kwargs?.function_call?.arguments);
// Umożliwia pobranie listy zadań na podstawie daty i godziny. Domyślnie pobiera zadania na dzień dzisiejszy 00:00 - 23:59.
// Prawdopodobnie format YYYY-MM-DD HH:mm:ss jest najbardziej bezpieczny i uniwersalny.
// {"from":"2023-11-13 00:00:00","to":"2023-11-13 23:59:59","all":false}

const addedTasks = await chat.invoke([
    new SystemMessage(`Current datetime: ${currentDateTime()}`),
    new HumanMessage(
        "Umm I need to write a newsletter about gpt-4 on Monday. Also there is a need to write a post for AI_Devs course today at 8pm. Can you add it to my list?"
    ),
]);

console.log(addedTasks?.additional_kwargs?.function_call?.name);
console.log(addedTasks?.additional_kwargs?.function_call?.arguments);

/*
Zwracana lista zadań, która może być natychmiast dodana do aplikacji.
Kluczowe są krótkie, ale nawiązujące do treści zadania nazwy, dokładne daty, oraz nazwy projektów.
{
  "tasks": [
    {
      "content": "Write newsletter about GPT-4",
      "due": "2023-11-13 00:00:00",
      "project": "easy_"
    },
    {
      "content": "Write post for AI_Devs course",
      "due": "2023-11-11 20:00:00",
      "project": "eduweb"
    }
  ]
}
*/

const updatedTasks = await chat.invoke([
    new SystemMessage(`Current datetime: ${currentDateTime()}
    
    todo-list""" 
    - Write newsletter about GPT-4 (ID: 123)
    - Write post for AI_Devs course (ID: 456)
    - Buy milk (ID: 789)
    """
    `),
    new HumanMessage(
        "Ouh I forgot! Beside milk I need to buy sugar. Update my tasks please."
    ),
]);

console.log(updatedTasks?.additional_kwargs?.function_call?.arguments);

/*
Zwraca listę zadań, które mają zostać zaktualizowane. Kluczowe jest tutaj posługiwanie się identyfikatorami istniejących zadań, które powinny być wczytane dynamicznie do System Message.
Moim zdaniem to wydajne rozwiązanie, ponieważ pozwala na przesłanie treści bezpośrednio do API aplikacji do zadań.

Oczywiście, aby możliwe było wcześniejsze pobranie zadań, raczej mówimy o wykrywaniu intencji użytkownika, i zareagowaniu na nią wcześniej, przed wywołaniem tego zapytania.
{
  "tasks": [
    {
      "id": "789",
      "content": "Buy milk and sugar",
      "due": "2023-11-11 23:59:59",
      "project": "overment"
    }
  ]
}
 */







