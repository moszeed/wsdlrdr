# wsdlrdr
a simple wsdl parser, with promises

[![Join the chat at https://gitter.im/moszeed/wsdlrdr](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/moszeed/wsdlrdr?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


## how to get
install from npm

    npm i wsdlrdr

## available methods
### *getNamespaces*
returns a collection with all available namespaces

|action|description|type|
|--------|--------|-------|
|**response**|all available namespaces|array|

### *getMethodParamsByName*
returns all response/request parameter for a given function name

|action|description|type|
|--------|--------|-------|
|**params**|methodName|string|
|**response**|methodParams|object|

### *getAllFunctions*
get all in wsdl available functions as a array

|action|description|type|
|--------|--------|-------|
|**response**|all available function names|array|

### *getXmlDataAsJson*
returns data from the given XML as JSON

|action|description|type|
|--------|--------|-------|
|**params**|xml|string|
|**response**|converted xml|json|

## how to use

	var Wsdlrdr = require('wsdlrdr');

    var params  = { host: 'hostname.com', wsdl: '/path/to/wsdl' };
    var options = { secure: true }; // https on
		
        //get all functions listet in wsdl
		Wsdlrdr.getAllFunction(params, options)
           .then((funcArray) => { console.log(funcArray); })
           .catch((err) => { throw new Error(err) });
