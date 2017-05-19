Kadira.send = function (payload, callback) {
  var retryCount = 0;
  var retry = new Retry({
    minCount: 1,
    minTimeout: 0,
    baseTimeout: 1000*5,
    maxTimeout: 1000*60,
  });

  send();

  function sendFunction(payload, callback) {
    if(Argus.hooks['kadira.error.before'])
      Argus.hooks['kadira.error.before'](payload);
    Argus.insert({col:'apm',doc:payload}, function(e,r){
      e ? callback(e) : callback(null, payload, 200);
    });
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
    console.trace('KadiraPayload', payload)
    sendFunction(payload, function(err, content, statusCode) {
      console.log('KadirError',err, content, statusCode)
      if(err) {
        tryToSend(err);
      } else if(statusCode == 200){
        if(callback) callback(null, content);
      } else {
        if(callback) callback(new Meteor.Error(statusCode, content));
      }
    });
  }
}
