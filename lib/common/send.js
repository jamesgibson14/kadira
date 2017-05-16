Kadira.send = function (payload, path, callback) {
  if(!Kadira.connected)  {
    throw new Error("You need to connect with Kadira first, before sending messages!");
  }

  path = (path.substr(0, 1) != '/')? "/" + path : path;
  var endpoint = Kadira.options.endpoint + path;
  var retryCount = 0;
  var retry = new Retry({
    minCount: 1,
    minTimeout: 0,
    baseTimeout: 1000*5,
    maxTimeout: 1000*60,
  });

  var sendFunction = Kadira._getSendFunction();
  tryToSend();

  function tryToSend(err) {
    if(retryCount < 5) {
      retry.retryLater(retryCount++, send);
    } else {
      console.warn('Error sending error traces to kadira server');
      if(callback) callback(err);
    }
  }

  function send() {
    sendFunction(endpoint, payload, function(err, content, statusCode) {
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

Kadira._getSendFunction = function() {
  return (Meteor.isServer)? Kadira._serverSend : Kadira._clientSend;
};

Kadira._clientSend = function (endpoint, payload, callback) {
  APM.insert(payload, function(e,r){
    e ? callback(e) : callback(null, payload, 200);
  }) 
}

Kadira._serverSend = function (endpoint, payload, callback) {
  callback = callback || function() {};
  var Fiber = Npm.require('fibers');
  new Fiber(function() {
    APM.insert(payload, function(e,r){
      e ? callback(e) : callback(null, r, 200);
    }) ;
    try{
      APM.insert(payload);
      callback();
    }
    catch(e){
      console.log('Kadira Error:', err.message);
      callback();
    }
  }).run();
}
