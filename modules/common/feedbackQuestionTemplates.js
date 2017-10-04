process.env.TZ = 'Australia/Sydney';
const functionName = "slack-bot-handle-response";
const randomQuestion_functionName = 'slack-bot-handle-random-question';

const baseQuestionLink =  "http://sentimental.sam.s3-website-ap-southeast-2.amazonaws.com/generate-questions/index.html";

function paddDate(date) {
    if (date.length < 2) {
        return '0' + date;
    }
    return date;
}

function formattDate(date) {
    return paddDate(date.getDate().toString()) + paddDate((date.getMonth() + 1).toString()) + date.getFullYear().toString();
}

function generateSecurityHash() {
    return new Promise(function(resolve ,reject) {
        require('crypto').randomBytes(48, function(err, buffer) {
          resolve(buffer.toString('hex'));
        });
    })
}

function constructAddQuestionLink(feedbackHash) {
    return baseQuestionLink + '?token=' + feedbackHash;
}


function initialFeedbackQuestionTemplate(feedbackHash) {

    let feedbackSiteLink = {
        "fallback": "Oops seems like some of my stuff is broken!.",
        "color": "#36a64f",
        "title": "Create questions",
        "title_link": constructAddQuestionLink(feedbackHash)
    }

    return [feedbackSiteLink]
}

module.exports = {
    initialFeedbackQuestionTemplate: initialFeedbackQuestionTemplate,
    paddDate: paddDate,
    formattDate: formattDate,
    generateSecurityHash: generateSecurityHash
}


