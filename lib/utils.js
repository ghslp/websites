'use strict';

const config = require('./config').config;
const fs = require('fs');

function getAppVersion() {
    return new Promise(function (resolve, reject) {
        fs.readFile('./package.json', 'utf8', function (err, data) {
            if (err) {
                console.error('Couldn’t read package.json!');
                reject(err);
            } else {
                let packageJson = JSON.parse(data);
                resolve(packageJson.version);
            }
        });
    });
}

function getRevManifest() {
    return new Promise(function (resolve) {
        fs.readFile('./rev-manifest.json', 'utf8', function (err, data) {
            if (config.env === 'development') {
                resolve({});
            } else if (err) {
                console.error('Couldn’t read rev-manifest.json!');
                resolve({});
            } else {
                let manifestJson = JSON.parse(data);
                resolve(manifestJson);
            }
        });
    });
}

exports.utils = {
    getAppVersion,
    getRevManifest,
};