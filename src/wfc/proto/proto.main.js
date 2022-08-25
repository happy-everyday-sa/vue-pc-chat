import {
    ipcMain,
} from 'electron';

let proto;
const ASYNC_CALLBACK = 'async-callback';

const asyncProtoMethods = {
    getUploadMediaUrl: (event, args) => {
        proto.getUploadMediaUrl(...args.methodArgs, (...cbArgs) => {
            // send back to renderer window
            _asyncCallback(event, args.reqId, 0, true, ...cbArgs);
            console.log('getUploadMediaUrl main async, sb', ...cbArgs);
        }, (err) => {
            _asyncCallback(event, args.reqId, 1, true, err);
        });
    },
    sendSavedMessage: (event, args) => {
        proto.sendSavedMessage(...args.methodArgs, (...cbArgs) => {
            // send back to renderer window
            _asyncCallback(event, args.reqId, 0, true, ...cbArgs);
            console.log('sendSavedMessage main, sb', ...cbArgs);
        }, (...err) => {
            console.log('sendSavedMessage main, eb', ...err)
            _asyncCallback(event, args.reqId, 1, true, ...err);
        });
    }
}

export function init() {
    proto = global.sharedObj.proto;
    ipcMain.handle('getUserInfo', (event, userId, refresh = false, groupId = '') => {
        return proto.getUserInfo(userId, refresh, groupId);
    })

    ipcMain.handle('updateMessage', (event, args) => {
        console.log('updateMessage main', args);
        return proto.updateMessage(...args);
    })

    // ipcMain.handle('invokeProto', (event, args) => {
    //     console.log('invokeProto main', args);
    //     return proto[args.methodName](...args.args);
    // })

    ipcMain.on('invokeProto', (event, args) => {
        console.log('invokeProto main', args);
        event.returnValue = proto[args.methodName](...args.methodArgs);
    })

    ipcMain.on('invokeProtoAsync', (event, args) => {
        console.log('invokeProtoAsync main', args);
        let func = asyncProtoMethods[args.methodName];
        if (func) {
            func(event, args);
        } else {
            console.error('invokeProtoAsync cannot found method', args.methodName);
        }
    })

    // ipcMain.on('sendSavedMessage', (event, args) => {
    //     const {reqId, messageId, expireDuration} = args;
    //     proto.sendSavedMessage(messageId, expireDuration, (messageUid, timestamp) => {
    //         // send back to renderer window
    //         _asyncCallback(event, reqId, 0, true, messageUid, timestamp);
    //         console.log('sendSavedMessage main, sb', messageUid, timestamp);
    //     }, (...err) => {
    //         console.log('sendSavedMessage main, eb', ...err)
    //         _asyncCallback(event, reqId, 1, true, ...err);
    //     });
    // })

    // ipcMain.on('getUploadMediaUrl', (event, args) => {
    //     const {reqId, fileName, mediaType, contentType} = args;
    //     proto.getUploadMediaUrl(fileName, mediaType, contentType, (...args) => {
    //         // send back to renderer window
    //         _asyncCallback(event, reqId, 0, true, ...args);
    //         console.log('getUploadMediaUrl main, sb', ...args);
    //     }, (err) => {
    //         _asyncCallback(event, reqId, 1, true, err);
    //     });
    // })
}

function _asyncCallback(event, reqId, cbIndex, done, ...args) {
    let obj = {
        reqId,
        cbIndex,
        done,
        cbArgs: [...args]
    }
    event.sender.send(ASYNC_CALLBACK, obj);
}


