# wsdlrdr
a simple wsdl parser, with promises

##### Support

[Buy me a Coffee](https://www.patreon.com/moszeed)


### how to get
install from npm

    npm i wsdlrdr

## available methods
#### *getNamespaces*
returns a collection with all available namespaces

|action|description|type|
|--------|--------|-------|
|**response**|all available namespaces|array|



#### *getMethodParamsByName*

returns all response/request parameter for a given function name

|action|description|type|
|--------|--------|-------|
|**params**|methodName|string|
|**response**|methodParams|object|



#### *getAllFunctions*

get all in wsdl available functions as a array

|action|description|type|
|--------|--------|-------|
|**response**|all available function names|array|



#### *getXmlDataAsJson*

returns data from the given XML as JSON

|action|description|type|
|--------|--------|-------|
|**params**|xml|string|
|**response**|converted xml|json|



## how to use

	const Wsdlrdr = require('wsdlrdr');
	const params  = { 
		host: 'hostname.com', 
		wsdl: '/path/to/wsdl' 
	};
	
	const options = { 
		secure: true // https on
		failOnWrongContentType: true // if no xml/wsdl
	}; 
	
	// get all functions listet in wsdl
	Wsdlrdr.getAllFunctions(params, options)
	.then((funcArray) => { console.log(funcArray); })
	.catch((err) => { throw new Error(err) });
