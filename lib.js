function iterator(i, tasks, finish) {
    if (i === tasks.length) {
        return process.nextTick(() => finish, null);
    }
    const task = tasks[i];
    task((err) => {
        if (err) {
            return finish(err);
        }
        iterator(i + 1, tasks, finish);
    })
}

// usage:
// iterator(0, [(callback) => {
//     // do something ....
//     callback(null);
// }, ...], (err) => {
//     if (err) {
//         console.log('finished with error: ' + err);
//     }
//     console.log('finished successfully');
// });


function iterateSeries(tasks, iteratorCallback, finalCallback) {
    function iterator(i) {
        if (i === tasks.length) {
            return process.nextTick(() => finalCallback, null);
        }
        const task = tasks[i];
        task((err) => {
            if (err) {
                return finish(err);
            }
            iteratorCallback(i);
            iterator(i + 1);
        })
    }

    // start
    iterator(0);
}

function parallel(tasks, finish) {
    let completed = 0;
    tasks.forEach(task => {
        task(err => {
            if (err) {
                // may be we want stop all tasks and exit ???
                return finish(err);
            }
            if (++completed === tasks.length) {
                return finish(null);
            }
        })
    });
}

function limitParallel(concurrency = 2, tasks, iteratorCallback, finalCallback) {
    let running = 0,
        completed = 0,
        index = 0;

    function next() {
        while (running < concurrency && index < tasks.length) {
            const task = tasks[index++];
            task((err) => {
                iteratorCallback(index);
                if (err) {
                    return finalCallback(err);
                }
                if (completed === tasks.length) {
                    return finalCallback(null);
                }
                completed++;
                running--;
                next();
            });
            running++;
        }
    }

    next();
}

module.exports = {
    iterator,
    parallel,
    limitParallel,
    iterateSeries
};