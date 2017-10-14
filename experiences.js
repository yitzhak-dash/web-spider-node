const request = require('request');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const getUrls = require('get-urls');
//
const iterateSeries = require('./lib').iterateSeries;
const limitParallel = require('./lib').limitParallel;
const TaskQueue = require('./taskQueue');

const queue = new TaskQueue(5);

function spider(url, nesting, callback) {
    const filename = urlToFilename(url);
    fs.readFile(filename, 'utf8', (err, body) => {
        if (err) {
            if (err.code !== 'ENOENT') {
                return callback(err);
            }
            // file not found, so download body to file
            return download(url, filename, (err, body) => {
                if (err) {
                    return callback(err);
                }
                spiderLinks(body, nesting, callback);
            });
        }
        // file found
        spiderLinks(body, nesting, callback);
    });
}

function spiderLinks(body, nesting, callback) {
    if (nesting === 0) {
        return process.nextTick(callback);
    }
    const tasks = Array.from(getUrls(body))
        .map(link => (done) => spider(link, nesting - 1, done));

    queue.onComplete(callback)
        .onError(err => callback(err));
    tasks.forEach(task => queue.push(task));

    // limitParallel(5, tasks, (i) => console.log('iterated: ' + i), callback);
}

function download(url, filename, callback) {

    console.log(`Downloading ${url}`);
    request(url, (err, response, body) => {
        if (err) {
            return callback(err);
        }
        saveFile(filename, body, err => {
            if (err) {
                return callback(err);
            }
            console.log(`Downloaded and saved: ${url}`);
            callback(null, body);
        });
    });
}

function saveFile(filename, content, callback) {
    console.log(`saving file ${filename} ...`);
    mkdirp(path.dirname(filename), err => {
        if (err) {
            return callback(err);
        }
        fs.writeFile(filename, content, callback);
    });
}

function urlToFilename(url) {

    return url + '.txt';
}

spider(process.argv[2], process.argv[3], (err, filename, downloaded) => {
    if (err) {
        return console.log(err);
    }
    if (downloaded) {
        console.log(`Completed the download of "${filename}"`);
        return;
    }
    console.log(`"${filename}" was already downloaded`);
});
