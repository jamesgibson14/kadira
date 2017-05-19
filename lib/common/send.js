Kadira.send = function (payload, callback) {


  var retryCount = 0;
  var retry = new Retry({
    minCount: 1,
    minTimeout: 0,
    baseTimeout: 1000*5,
    maxTimeout: 1000*60,
  });

  var sendFunction = function sendFunction(payload, callback) {
    callback = callback || function() {};
    var Fiber = Npm.require('fibers');
    new Fiber(function() {
      APM.insert(payload, function(e,r){
        e ? callback(e) : callback(null, payload, 200);
      })
    }).run();
  }

  send();
  var sendFunction = function sendFunction(payload, callback) {
    callback = callback || function() {};
    var Fiber = Npm.require('fibers');
    new Fiber(function() {
      APM.insert(payload, function(e,r){
        if(e){
          console.trace('KadirError',JSON.stringify(e), JSON.stringify(payload));
          callback(e)
        }
        else {
          callback(null, payload, 200);
        }
      })
    }).run();
  }

  function tryToSend(err) {
    if(retryCount < 5) {
      retry.retryLater(retryCount++, send);
    } else {
      console.warn('Error sending error traces to kadira server');
      if(callback) callback(err);
    }
  }

  function send() {
    //console.trace('KadiraPayload', payload)
    sendFunction(payload, function(err, content, statusCode) {
      //console.log('KadirError',err, content, statusCode)
      if(err) {
        tryToSend(err);
      } else if(statusCode == 200){
        if(callback) callback(null, content);
      } else {
        if(callback) callback(new Meteor.Error(statusCode, content));
      }
    });
  }
};
