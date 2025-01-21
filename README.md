# Bouffon Chat Backend
The motivation behind this learning project is two-fold. The first reason is to learn the fundamentals of JavaScript, as I find that other technologies, such as PowerApps, utilize it to extend functionality. The second reason is to provide a web-based API to be used in the rewrite of the MyChat desktop application as a web application. The status of this project is that I have completed what I have determined to be the core functionality described below.

## Core functionality
The first step is to replicate the core features of the MyChat project, which include the following:

* Basic chat functionality using OpenAI's chat completion API.
* Support for GPT-4o and GPT-4o Mini models.
* Enable customization of conversations by model, tone (such as professional, casual, technical, etc.), instructions, and notes.
* Provide the option to create conversations using templates, which are predefined combinations of model, tone, instructions, and notes.

## Technologies
In the implementation of this backend, I utilized the following technologies:

* Google serves as the authentication host, which is handled by the google-auth-library module.
* The server is built on the Node.js ecosystem, utilizing the Express module for handling endpoint routing.
* MongoDB, through the Mongoose module, provides data persistence. The choice of a NoSQL database over a relational one allows me to leverage knowledge from the MyChat application.
* The OpenAI module enables connectivity with the GPT API.

## Future Plans
I am considering the following enhancements for the future of this backend:

* Add support for GPT o1 models and the upcoming GPT o3 models.
* Add support for models from additional AI agents.
* Incorporate support for image analysis using the vision capabilities of chat completions.
* Integrate support for image generation using DALL-E 3.
* Explore the possibility of incorporating speech capabilities using audio functionalities or the real-time API.

See also...
* [Original MyChat project](https://github.com/Dauvis/MyChat)
* [Sister frontend project](https://github.com/Dauvis/BouffonChatFrontend)
