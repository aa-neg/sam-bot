process.env.TZ = 'Australia/Sydney';
const functionName = "slack-bot-handle-response";
const randomQuestion_functionName = 'slack-bot-handle-random-question';

const questions = {
    projectFeeling: {
        text: "How do you feel about your current project?"
        // callbackKey: 'teamFeeling' 
    },
    teamFeeling: {
        text: "How would you rate your current team?"
        // callbackKey: 'hypothesisSentiment' 
    },
    hypothesisSentiment: {
        text: "What is your sentiment on hypothesis?"
        // callbackKey: 'done'
    }
}

const questionPool_1 = {
    flyOrMind: {
        "question":"Would you rather have the ability to fly or the ability to read people's mind?",
        options: ['fly', "read people's minds"]
    },
    dealyedOrLost: { question: "Would you rather have your flight delayed by 8 hours or lose your luggage?",
        options: ['flight delayed', 'lose luggage']
    },
    worstOrBest: {question: "Would you rather be the worst player on the best team or the best player on a great team?",
        options: ['worst player on best team', 'best player on great team']
    },
    foodOrShower: {question: "Would you rather never be able to eat hot food again or never take a hot shower again?",
        options: ['never eat hot food', 'never take a hot shower']
    },
    ignorantOrKnowledgable: {question: "Would you rather be ignorant and happy or be knowledgeable and never fully content?",
        options: ['ignorant and happy', 'knowledgeable and never fully content']
    },
    playOrLose: {question: "Would you rather never play or play but always lose?",
        options: ['never play', 'play but always lose']
    }
}

const responses = [
    'Wait you what? ...',
    'Awesome thanks for your response!',
    'Yeah me too!',
    'If you say so ...',
    'Uhh sure :)'
]

const questionPool_2 = {
    partyBigOrSmall :{
        question:"Would you rather hang with a few friends or go to big party?",
        options: ['few friends', 'big party']
    },
    lateOrEarly: {
        question: "Would you rather be 10 minutes late or be 20 minutes early for everything?",
        options: ['10 min late', '20 min early']
    },
    giveOutOrRecieve: {
        question: "Would you rather give out bad advice or receive bad advice?",
        options: ['give', 'recieve']
    },
    musicOrLanguage: {
        question: "Would you rather be a master of every musical instrument or be fluent in every language?",
        options: ['language', 'instruments']
    },
    brightOrDark: {
        question: "Would you rather be stuck in a home that is constantly dark or a house that is constantly bright?",
        options: ['always dark', 'constantly bright']
    },
    vegeOrMeat: {
        question: "Would you rather be a vegetarian or only be able to eat meat?",
        options: ['vegetarian', 'only meat']
    },
    suitOrPjs: {
        question: "Would you rather be in your pajamas all day or in a suit all day?",
        options: ['pajamas', 'suit']
    },
    forwardOrBackward: {
        question: "Would you rather go forward or back in time?",
        options: ['forward', 'backward']
    }
    // {"Would you rather go without the internet or a car for a month?"},
    // {"Would you rather have to sit all day or stand all day?"},
    // {"Would you rather go to jail for a year or live in your car for a year?"},
    // {"Would you rather not be able to use your hands or not be able to walk?"}
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function generateActions(questionOptions, questionName) {
    return questionOptions.map((option)=> {
        return {
            name: questionName,
            text: option,
            type: 'button',
            value: option
        }
    })
}

function randomQuestionTemplate(questionPool) {
    let currentDate = new Date();
     const dateKey = paddDate(currentDate.getDate().toString()) + paddDate((currentDate.getMonth() + 1).toString()) + currentDate.getFullYear().toString();

     const randomQuestion = Object.keys(questionPool)[getRandomInt(0, Object.keys(questionPool).length)];

     let baseTemplate = {
        text: questionPool[randomQuestion].question,
        fallback: "You don't know how you feel?",
        callback_id: functionName + ":" + dateKey + ":" + randomQuestion,
        color: "#FFFF00",
        attachment_type: "default",
        actions: generateActions(questionPool[randomQuestion].options, randomQuestion) 
    }

    return [baseTemplate]
}

const reportQuestionsFormatted = [
    {
        name: "Project Sentiment",
        value: "projectFeeling"
    },
     {
        name: "Team Sentiment",
        value: "teamFeeling"
    },
     {
        name: "Hypothesis Sentiment",
        value: "hypothesisSentiment"
    }
]

function paddDate(date) {
    if (date.length < 2) {
        return '0' + date;
    }
    return date;
}

const sentimentValueMappings = {
    1: "terrible :poop:",
    2: "not great :white_frowning_face:",
    3: "so-so :neutral_face:",
    4: "good :slightly_smiling_face:",
    5: "excellent :smiley:"
}

const sentimentValueBarMappings = ["terrible", "not great", "so-so", "good", "excellent"]


function formattDate(date) {
    return paddDate(date.getDate().toString()) + paddDate((date.getMonth() + 1).toString()) + date.getFullYear().toString();
}

function createTemplate(question,setActions,showText) {

    let currentDate = new Date();
    // const nextQuestion = questions[currentQuestion].callbackKey

    const dateKey = paddDate(currentDate.getDate().toString()) + paddDate((currentDate.getMonth() + 1).toString()) + currentDate.getFullYear().toString();

    let baseTemplate = {
        fallback: "You don't know how you feel?",
        callback_id: functionName + ":" + dateKey + ":" + question,
        color: "#3AA3E3",
        attachment_type: "default",
    }

    if (showText) {
        baseTemplate.text = questions[question].text;
    }

    if (setActions) {
        baseTemplate.actions = [
                        {
                            name: question,
                            text: sentimentValueMappings[1],
                            type: "button",
                            value: 1 
                        },
                        {
                            name: question,
                            text: sentimentValueMappings[2],
                            type: "button",
                            value: 2 
                        },
                        {
                            name: question,
                            text: sentimentValueMappings[3],
                            type: "button",
                            value: 3 
                        },
                        {
                            name: question,
                            text: sentimentValueMappings[4],
                            type: "button",
                            value: 4 
                        },
                        {
                            name: question,
                            text: sentimentValueMappings[5],
                            type: "button",
                            value: 5 
                        }
                    ]
    }

    let sentimentTemplate = [baseTemplate]

    return sentimentTemplate;
}


module.exports = {
    questions: questions,
    createTemplate: createTemplate,
    paddDate: paddDate,
    sentimentValueMappings: sentimentValueMappings,
    formattDate: formattDate,
    sentimentValueBarMappings: sentimentValueBarMappings,
    reportQuestionsFormatted: reportQuestionsFormatted,
    randomQuestionTemplate: randomQuestionTemplate,
    getRandomInt: getRandomInt,
    questionPool_2: questionPool_2,
    questionPool_1: questionPool_1
}

