(function() {

    "use strict";

    var Wsdlrdr = require('../src/index.js');

    var wsdlUrls = [
        [{ host: 'www.predic8.com:8080', wsdl: '/base/IDService?wsdl' }, { secure: false }],
        [{ host: 'www.webservicex.net', wsdl: '/globalweather.asmx?WSDL' }, { secure: false }],
        [{ host: 'soaptest.parasoft.com', wsdl: '/calculator.wsdl' }, { secure: false }],
        [{ host: 'webservices.oorsprong.org', wsdl: '/websamples.countryinfo/CountryInfoService.wso?WSDL'},
         {secure: false}],
        [{ host: 'www.dat.de:80', wsdl: '/VehicleRepairOnline/services/VehicleIdentificationService?wsdl' },
         { secure: false }],
        [{ host: 'www.car-copy.com', wsdl: '/ws/caratlas/ca_v2_soap.php?class=CAWS_CA&wsdl' }, {}],
        [{ host: 'webservices.daehosting.com', wsdl: '/services/isbnservice.wso?WSDL'}, { secure: false }],
        [{ host: 'www.dataaccess.com', wsdl: '/webservicesserver/numberconversion.wso?WSDL'}, { secure: false}]
    ];

    function executeSequentially(promiseFactories) {

        var result = Promise.resolve();
        promiseFactories.forEach((promiseFactory) => {
            result = result.then(promiseFactory);
        });
        return result;
    }


    var test = require('tape');

        test('getAllFunctions', function(t) {

            var promiseFactory = [];

            // build promiseFactory
            wsdlUrls.forEach((wsdlParams) => {

                promiseFactory.push(() => {
                    return Wsdlrdr.getAllFunctions(wsdlParams[0], wsdlParams[1])
                        .then((data) => {
                            t.ok(data.length !== 0, wsdlParams[0].host + ' has ' + data.length + ' functions')
                            wsdlParams.push(data);
                        });
                });
            });

            executeSequentially(promiseFactory)
                .then(() => { t.end() })
                .catch((err) => { console.log(err); })
        });

        test('getMethodParamsByName', function(t) {

            var promiseFactory = [];

            // build promiseFactory
            wsdlUrls.forEach((wsdlParams) => {

                var methodNames = wsdlParams[2];
                if (!methodNames) {
                    t.end('no method Names');
                }

                methodNames.forEach(
                    (methodName) => {
                        promiseFactory.push(() => {
                            return Wsdlrdr.getMethodParamsByName(methodName, wsdlParams[0], wsdlParams[1])
                                .then((data) => {
                                    t.ok(data, 'could get params from method "' + methodName + '"');
                                })
                                .catch((err) => {
                                    t.fail(err);
                                })
                        });
                    }
                );



            });

            executeSequentially(promiseFactory)
                .then(() => { t.end() })
                .catch((err) => { console.log(err); })
        });



})();
