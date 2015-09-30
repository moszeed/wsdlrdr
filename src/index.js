(function() {

    "use strict";

    var xmldoc  = require('xmldoc');
    var _       = require('underscore');
    var request = require('request');

    var fs      = require("fs");
    var path    = require('path');

    var cachePath = __dirname + path.sep + '..' + path.sep + 'cache';


    function getProtocol(opts) {

        opts = opts || {};
        return (opts.secure === void 0 ||
                opts.secure === true) ? 'https://' : 'http://';
    }

    function doGetRequest(params, opts) {

        params  = params || {};
        opts    = opts || {};

        if (params.host === void 0 ||
            params.path === void 0) {
            throw new Error('insufficient arguments for get');
        }

        if (params.rejectUnauthorized === void 0) {
            params.rejectUnauthorized = true;
        }

        return new Promise(
            (resolve, reject) => {

                var requestParams = {
                    url               : getProtocol(opts) + params.host + params.path,
                    headers           : params.headers || {},
                    rejectUnauthorized: params.rejectUnauthorized
                };

                request(requestParams,
                    (error, response, body) => {
                        if (error) reject(error);
                        else {
                            resolve({
                                'body'    : body,
                                'response': response,
                                'header'  : response.headers
                            });
                        }
                    }
                );
            }
        );
    }


    function ensureExists(path, mask) {

        mask = mask || '0777';

        return new Promise((resolve, reject) => {
            fs.mkdir(path, mask, function(err) {
                if (err) {
                    if (err.code == 'EEXIST') resolve();
                    else reject(err);
                } else resolve();
            });
        });
    }

    function getCacheFileName(params) {

        // generate cache name
        var cacheFileName = params.host + params.wsdl;
            cacheFileName = cacheFileName.replace(/[^a-zA-Z 0-9]+/g, "");
            cacheFileName = encodeURIComponent(cacheFileName);

        return cacheFileName;
    }


    function getNameWithoutNamespace(name) {

        var attr = name.split(':');
        if (attr.length > 1) {
            return attr[1];
        }

        return name;
    }

    function getNamespace(name, suffix) {

        var attr = name.split(':');
        if (attr.length > 1) {

            if (suffix) {
                return attr[0] + ':';
            }

            return attr[0];
        }

        return '';
    }


    function getComplexTypeAttrs($complexType) {

        var schemaStruct = getNamespace($complexType.children[0].name, true);

        var $sequence = $complexType.childNamed(schemaStruct + 'sequence');
        if ($sequence) {
            return _.map($sequence.children, ($seqChild) => {

                if ($seqChild.attr.type) {
                    $seqChild.attr.type = getNameWithoutNamespace($seqChild.attr.type);
                }

                return $seqChild.attr;
            });
        }

        if ($complexType.attr.type) {
            $complexType.attr.type = getNameWithoutNamespace($complexType.attr.type);
        }

        return $complexType.attr;
    }

    function getMessageAttrs($message, $wsdl) {

        var wsdlStruct      = getNamespace($wsdl.name, true);

        var $types          = $wsdl.childNamed(wsdlStruct + 'types');
        var typesStruct     = getNamespace($types.children[0].name, true);

        var $schema         = $types.childNamed(typesStruct + 'schema');
        var $complexTypes   = $schema.childrenNamed(typesStruct + 'complexType');

        return _.flatten(_.map($message.children,
            ($messageChild) => {

                var messageAttr   = $messageChild.attr;
                var typeName      = getNameWithoutNamespace(messageAttr.type || messageAttr.element);

                //
                // first look if schema exists
                //

                // is simple type
                var $methodSchema = $schema.childWithAttribute('name', typeName);
                if ($methodSchema) {

                    if ($methodSchema.children.length === 0) {
                        return $methodSchema.attr;
                    }

                    // is complex type
                    var $methodComplexType = $methodSchema.childNamed(typesStruct + 'complexType');
                    if ($methodComplexType) {
                        return getComplexTypeAttrs($methodComplexType);
                    }
                }

                //
                // search in complex types if exists
                //

                var $complexType = _.find($complexTypes,
                    ($complexType) => {
                        return $complexType.attr.name === typeName;
                    }
                );

                if ($complexType) {
                    return getComplexTypeAttrs($complexType);
                }

                //
                // still no results
                // format message attribute and return this
                //

                if ($messageChild.attr.type) {
                    $messageChild.attr.type = getNameWithoutNamespace(
                        $messageChild.attr.type
                    );
                }

                if ($messageChild.attr.element) {
                    $messageChild.attr.element = getNameWithoutNamespace(
                        $messageChild.attr.element
                    );
                }

                return $messageChild.attr;
            }
        ));
    }


    function checkCachedFile(fullPath) {

        return new Promise((resolve, reject) => {
            fs.stat(fullPath, (err, fileStats) => {
                if (err) {

                    // no file
                    if (err.code === 'ENOENT') {
                        resolve(true);
                    } else {
                        throw new Error(err);
                    }
                }
                else {

                    var fileTime = new Date(fileStats.mtime).getTime();
                    if (Date.now() - fileTime >= 84000000) {
                        return resolve(true);
                    }

                    resolve();
                }
            });
        });
    }

    function getCachedWsdl(params, opts) {

        // generate cache name
        var cacheFileName = params.host + params.wsdl;
            cacheFileName = cacheFileName.replace(/[^a-zA-Z 0-9]+/g, "");
            cacheFileName = encodeURIComponent(cacheFileName);

        var fullPath = __dirname + path.sep + '..' +
                                   path.sep + 'cache' +
                                   path.sep + cacheFileName;

        return checkCachedFile(fullPath)
            .then((renew) => {

                if (renew) {
                    return null;
                }

                return new Promise((resolve, reject) => {

                    fs.readFile(fullPath, 'UTF-8',
                        (err, fileData) => {
                            if (err) reject(err);
                            else resolve(fileData);
                        }
                    );
                });
            })
            .catch((err) => { throw new Error(err); })
    }

    function saveWsdlToCache(params, wsdlContent) {

        // generate cache name
        var cacheFileName = getCacheFileName(params);
        var fullPath = cachePath + path.sep + cacheFileName;

        // write to cache
        return ensureExists(cachePath)
            .then(() => {

                return new Promise((resolve, reject) => {
                    fs.writeFile(fullPath, wsdlContent, (err) => {
                            if (err) reject(err);
                            resolve();
                        }
                    );
                })
            })
            .catch((err) => {
                throw new Error(err);
            });
    }


    function getWsdl(params, opts) {

        opts   = opts || {};
        params = params || {};

        return getCachedWsdl(params, opts)
            .then((wsdl) => {

                // return cached wsdl if available
                if (wsdl !== null) {
                    return wsdl;
                }

                // set wsdl as path
                params.path = params.wsdl;

                // refresh wsdl, save to cache
                return doGetRequest(params, opts)
                    .then((res) => {
                        saveWsdlToCache(params, res.body);
                        return res.body;
                    });
            })
            .catch((err) => { throw new Error(err); });
    }


    var Wsdlrdr = module.exports;


        Wsdlrdr.getMethodParamsByName = function(methodName, params, opts) {

            var getMessageNode = ($messages, nodeName) => _.find($messages, ($message) =>
                $message.attr.name === getNameWithoutNamespace(nodeName)
            );

            return getWsdl(params, opts)
                .then(function(wsdl) {

                    var $wsdlObj        = new xmldoc.XmlDocument(wsdl);
                    var wsdlStruct      = getNamespace($wsdlObj.name, true);

                    var $binding        = $wsdlObj.childNamed(wsdlStruct + 'binding');
                    var $portType       = $wsdlObj.childNamed(wsdlStruct + 'portType');
                    var $messages       = $wsdlObj.childrenNamed(wsdlStruct + 'message');
                    var $types          = $wsdlObj.childNamed(wsdlStruct + 'types');
                    var typesStruct     = getNamespace($types.children[0].name, true);

                    var $schema         = $types.childNamed(typesStruct + 'schema');
                    var $complexTypes   = $schema.childrenNamed(typesStruct + 'complexType');

                    var $methodPortType = $portType.childWithAttribute('name', methodName);

                    var $input          = $methodPortType.childNamed(wsdlStruct + 'input');
                    var $output         = $methodPortType.childNamed(wsdlStruct + 'output');

                    var $inputMessage   = getMessageNode($messages, getNameWithoutNamespace($input.attr.message));
                    var $outputMessage  = getMessageNode($messages, getNameWithoutNamespace($output.attr.message));

                    return {
                        requestParams : getMessageAttrs($inputMessage, $wsdlObj),
                        responseParams: getMessageAttrs($outputMessage, $wsdlObj)
                    };
                });
        }

        Wsdlrdr.getAllFunctions = function(params, opts) {

            return getWsdl(params, opts)
                .then(function(wsdl) {

                    var $wsdlObj   = new xmldoc.XmlDocument(wsdl);
                    var wsdlStruct = getNamespace($wsdlObj.name, true);

                    var $binding    = $wsdlObj.childNamed(wsdlStruct + 'binding');
                    var $operations = $binding.childrenNamed(wsdlStruct + 'operation')

                    return _.map($operations, (operationItem) => operationItem.attr.name);
                });
        }

})();
