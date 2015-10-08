(function() {

    "use strict";

    var Wsdlrdr = require('../src/index.js');

    var wsdlUrls = [
        [{ host: 'www.predic8.com:8080', wsdl: '/base/IDService?wsdl' }],
        [{ host: 'www.webservicex.net', wsdl: '/globalweather.asmx?WSDL' }],
        [{ host: 'soaptest.parasoft.com', wsdl: '/calculator.wsdl' }],
        [{ host: 'webservices.oorsprong.org', wsdl: '/websamples.countryinfo/CountryInfoService.wso?WSDL'}],
        [{ host: 'webservices.daehosting.com', wsdl: '/services/isbnservice.wso?WSDL'}],
        [{ host: 'www.dataaccess.com', wsdl: '/webservicesserver/numberconversion.wso?WSDL'}]
    ];

    function executeSequentially(promiseFactories) {

        var result = Promise.resolve();
        promiseFactories.forEach((promiseFactory) => {
            result = result.then(promiseFactory);
        });
        return result;
    }


    var test = require('tape');

        test('notExistsingWsdlUrl',
            (t) => {
                Wsdlrdr.getAllFunctions({ host: 'www.notexist.com', wsdl: '/wsdl'})
                    .then((data) => { t.end('has response') })
                    .catch((err) => {
                        t.ok(err, 'wsdl not exists');
                        t.end();
                    });
            }
        );

        test('getNamespaces', function(t) {

            var promiseFactory = [];

            // build promiseFactory
            wsdlUrls.forEach((wsdlParams) => {

                promiseFactory.push(() => {
                    return Wsdlrdr.getNamespaces(wsdlParams[0], wsdlParams[1])
                        .then((data) => {
                            t.ok(data.length !== 0, wsdlParams[0].host + ' has ' + data.length + ' namespaces');
                        });
                });
            });

            executeSequentially(promiseFactory)
                .then(() => { t.end(); })
                .catch((err) => { console.log(err); })
        });

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
                .then(() => { t.end(); })
                .catch((err) => { console.log(err); })
        });

        test('getMethodParamsByName', function(t) {

            var promiseFactory = [];

            // build promiseFactory
            wsdlUrls.forEach((wsdlParams) => {

                var methodNames = wsdlParams[2] || wsdlParams[1];
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

        test('getMethodParamsByName.givenMethodNotExists', function(t) {

            var wsdlParams = wsdlUrls[0];
            if (!wsdlParams) {
                t.end('no wsdlParams');
            }

            Wsdlrdr.getMethodParamsByName('notAvailableMethodName', wsdlParams[0], wsdlParams[1])
                .then((data) => { t.end('has found method'); })
                .catch((err) => {
                    t.ok(err, 'not found method');
                    t.end();
                });
        });


        test('getXmlDataAsJson', function(t) {

            t.plan(2);

            var responseXml = '<?xml version="1.0" encoding="UTF-8"?>' +
                                '<SOAP-ENV:Envelope ' +
                                    'xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/" ' +
                                    'xmlns:wsdl="http://schemas.xmlsoap.org/" ' +
                                    'xmlns:xsd="http://www.w3.org/2001/" ' +
                                    'xmlns:tns="http://predic8.com/wsdl/" ' +
                                    'xmlns:soap="http://schemas.xmlsoap.org/wsdl/" ' +
                                '>' +
                                '<SOAP-ENV:Body>' +
                                    '<tns:testResponseItem1>123</tns:testResponseItem1>' +
                                    '<tns:testResponseItem2>123</tns:testResponseItem2>' +
                                '</SOAP-ENV:Body>' +
                            '</SOAP-ENV:Envelope>';

            var dataAsJson = Wsdlrdr.getXmlDataAsJson(responseXml);
                dataAsJson.forEach((dataItem) => {
                    if (dataItem.testResponseItem1) t.pass('testResponseItem1 is available');
                    if (dataItem.testResponseItem2) t.pass('testResponseItem2 is available');
                });
        });

        test('getXmlDataAsJson.noBody', function(t) {

            var xml = '<?xml version="1.0" encoding="utf-16"?>' +
                        '<CurrentWeather>' +
                            '<Location>Leipzig-Schkeuditz, Germany (EDDP) 51-25N 012-14E 149M</Location>' +
                            '<Time>Oct 07, 2015 - 06:50 AM EDT / 2015.10.07 1050 UTC</Time>' +
                            '<Wind> from the SE (140 degrees) at 6 MPH (5 KT):0</Wind>' +
                            '<Visibility> greater than 7 mile(s):0</Visibility>' +
                            '<SkyConditions> mostly cloudy</SkyConditions>' +
                            '<Temperature> 62 F (17 C)</Temperature>' +
                            '<DewPoint> 62 F (17 C)</DewPoint>' +
                            '<RelativeHumidity> 100%</RelativeHumidity>' +
                            '<Pressure> 29.85 in. Hg (1011 hPa)</Pressure>' +
                            '<Status>Success</Status>' +
                        '</CurrentWeather>';

            var dataAsJson = Wsdlrdr.getXmlDataAsJson(xml);

            t.ok(dataAsJson.CurrentWeather.length !== 0, 'data available');
            t.end();
        });

})();
