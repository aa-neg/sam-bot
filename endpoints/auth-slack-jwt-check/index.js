// Required environment variables

/*
JWT_SECRET
*/

const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const kms = new AWS.KMS();

function parseSecret(secret) {
    return new Promise(function (resolve, reject) {
        var blob = new Buffer(process.env[secret], 'base64');
        let token = '';

        kms.decrypt({
            CiphertextBlob: blob
        }, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data.Plaintext.toString('ascii'));
            }
        })
    })
}

exports.handler = (event, context, callback) => {

    let body = JSON.parse(event.body);

    const jwtChallenge = body.jwt;

    parseSecret('JWT_SECRET').then(function (jwtSecret) {
        try {
            let decoded = jwt.verify(jwtChallenge, jwtSecret);
            console.log('it has been decoded fine!', decoded);

            callback(null, {
                statusCode: '200',
                headers: {
                    'Access-Control-Allow-Origin': '*'

                }
            });
        } catch (err) {
            console.log('failed to decode secret')
            callback(null, {
                statusCode: '400',
                headers: {
                    'Access-Control-Allow-Origin': '*'

                }
            });
        }
    })

};