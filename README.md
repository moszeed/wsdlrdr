wsdlrdr
===================
a simple wsdl parser, with promises

## how to get
install from npm

    npm i wsdlrdr

## available methods
### *getNamespaces*
returns a collection with all available namespaces
### *getMethodParamsByName*
returns all response/request parameter for a given function name
### *getAllFunctions*
get all in wsdl available functions as a array
### *getXmlDataAsJson*
returns data from the given XML as JSON

## how to use

	var Wsdlrdr = require('wsdlrdr');

    var params  = { host: 'hostname.com', wsdl: '/path/to/wsdl' };
    var options = { secure: true }; // https on

		Wsdlrdr.getAllFunction(params, options)
           .then((funcArray) => { console.log(funcArray); })
           .catch((err) => { throw new Error(err) });
