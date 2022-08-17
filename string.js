// for (let c in 'abcdrefg') {
//     console.log(c)
// }

// return start;

function match() {
    let status = start;
    for (const c of 'acbcdrefg') {
        status = status(c)
    }
    return status === end 
}


function start(c) {
    if (c == 'a') {
        return foundA
    } else {
        return start;
    }
}

function foundA(c) {
    if (c == 'b') {
        return end
    } else {
        return start
    }
}

function end(c) {
    return end;
}

console.log(match()); 