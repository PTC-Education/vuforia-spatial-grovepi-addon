/**
 * Created by Carsten on 12/06/15.
 * Modified by Peter Som de Cerff (PCS) on 12/21/15
 *
 * Copyright (c) 2015 Carsten Strunk
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 *  PHILIPS HUE CONNECTOR
 *
 * This hardware interface can communicate with philips Hue lights. The config.json file specifies the connection information
 * for the lamps in your setup. A light in this config file has the following attributes:
 * {
 * "host":"localhost",                  // ip or hostname of the philips Hue bridge
 * "url":"/api/newdeveloper/lights/1",  // base path of the light on the bridge, replace newdeveloper with a valid username (see http://www.developers.meethue.com/documentation/getting-started)
 * "id":"Light1",                       // the name of the RealityInterface
 * "port":"80"                          // port the hue bridge is listening on (80 on all bridges by default)
 *
 * }
 *
 * Some helpful resources on the Philips Hue API:
 * http://www.developers.meethue.com/documentation/getting-started
 * http://www.developers.meethue.com/documentation/lights-api
 *
 * TODO: Add some more functionality, i.e. change color or whatever the philips Hue API offers
 */
//Enable this hardware interface
var server = require('@libraries/hardwareInterfaces');

var settings = server.loadHardwareInterface(__dirname);

exports.enabled = false;
exports.configurable = true; // can be turned on/off/adjusted from the web frontend

if (exports.enabled) {


    var fs = require('fs');
    var http = require('http');
    var _ = require('lodash');
    server.enableDeveloperUI(true);



    var lights = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8"));

    //function Light() {
    //    this.id;
    //    this.host;
    //    this.url;
    //    this.port;
    //}

    /**
     * @desc setup() runs once, adds and clears the IO points
     **/
    function setup() {
        //load the config file
        //lights = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8"));

        console.log("setup philipsHue");
        for (var key in lights) {
            lights[key].switch = undefined;
            lights[key].bri = undefined;
            if (lights[key].colorful) {
                lights[key].hue = undefined;
                lights[key].sat = undefined;
            }
        }
    }


    /**
         * @desc getLightState() communicates with the philipsHue bridge and checks the state of the light
     * @param {Object} light the light to check
     * @param {function} callback function to run when the response has arrived
     **/
    function getLightState(light, callback) {
        var state;

        var options = {
            host: light.host,
            path: light.url,
            port: light.port,
            method: 'GET',
        };

        var callbackHttp = function (response) {
            var str = '';

            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                //TODO add some error handling
                state = JSON.parse(str).state;
                if (!state) {
                    console.error('Philips Hue Error', str);
                    return;
                }
                if (state.on != light.switch) {
                    light.switch = state.on;
                    if (state.on) {
                        callback(light.id, "switch", 1, "d");
                    } else {
                        callback(light.id, "switch", 0, "d");
                    }

                }

                if (state.bri != light.bri) {
                    light.bri = state.bri; // brightness is a value between 1 and 254
                    callback(light.id, "brightness", (state.bri - 1) / 253, "f");
                }

                if (light.colorful) {
                    if (state.hue != light.hue) {
                        light.hue = state.hue; // hue is a value between 0 and 65535
                        callback(light.id, "hue", state.hue / 65535, "f"); // map hue to [0,1]
                    }

                    if (state.sat != light.sat) {
                        light.sat = state.sat;
                        callback(light.id, "saturation", state.sat / 254, "f");
                    }
                }

            });
        }



        var req = http.request(options, callbackHttp);
        req.on('error', function (e) {
            console.log('GetLightState HTTP error', e.message);
        });
        req.end();

    }


    /**
     * @desc writeSwitchState() turns the specified light on or off
         * @param {float} state turns the light on if > 0.5, turns it off otherwise
     **/
    function writeSwitchState(light, state) {
        var options = {
            host: light.host,
            path: light.url + "/state",
            port: light.port,
            method: 'PUT',
        };


        var req = http.request(options, function () { });
        req.on('error', function (e) {
            console.log('writeSwitchState HTTP error', e.message);
        });

        if (state < 0.5) {
            req.write('{"on":false}');
        } else {
            req.write('{"on":true}');
        }



        req.end();

        //TODO check for success message from the bridge
    }


    /**
         * @desc writeBrightness() Sets the brightness of the specified light
         * @param {float} bri is the brightness in the range [0,1]
     **/

    function writeBrightness(light, bri) {
        if (writeBrightness.requestInFlight) {
            return;
        }

        var options = {
            hostname: light.host,
            path: light.url + "/state",
            port: light.port,
            method: 'PUT',
        };

        writeBrightness.requestInFlight = true;
        var req = http.request(options, function() {
            setTimeout(function() {
                writeBrightness.requestInFlight = false;
            }, 100);
        });
        req.on('error', function (e) {
            console.log('writeBrightness HTTP error', e.message);
            setTimeout(function() {
                writeBrightness.requestInFlight = false;
            }, 100);
        });

        req.write('{"bri":' + _.floor(bri * 253 + 1) + '}');

        req.end();
    }


    /**
     * @desc writeSaturation() sets the saturation for the specified light
     * @param {float} sat is the saturatin in the range [0,1]
     **/
    function writeSaturation(light, sat) {
        var options = {
            hostname: light.host,
            path: light.url + "/state",
            port: light.port,
            method: 'PUT',
        };

        var req = http.request(options, function () { });
        req.on('error', function (e) {
            console.log('writeSaturation HTTP error', e.message);
        });
        req.write('{"sat":' + _.floor(sat * 254) + '}');
        req.end();
    }


    /**
     * @desc writeHue() sets the hue for the specified light
     * @param {integer} hue is the hue in the range [0,1]
     **/
    function writeHue(light, hue) {
        var options = {
            hostname: light.host,
            path: light.url + "/state",
            port: light.port,
            method: 'PUT',
        };

        var req = http.request(options, function () { });
        req.on('error', function (e) {
            console.log('writeHue HTTP error', e.message);
        });
        req.write('{"hue":' + _.floor(hue * 65535) + '}');
        req.end();
    }

    /**
     * @desc philipsHueServer() The main function, runs the setup and then periodically checks whether the lights are on.
     **/
    function philipsHueServer() {
        console.log("philipsHue starting philipsHue");
        setup();


        //TODO poll more often in productive environment
        for (var key in lights) {
            setInterval(function (light) {
                getLightState(light, server.write);
            }, 700 + _.random(-100, 100), lights[key]);
        }

    }

    function onRead(lightId, writeFn) {
        return function(data) {
            writeFn(lights[lightId], data.value);
        };
    }

    for (var lightId in lights) {
        server.addNode(lightId, "switch", "node");
        server.addNode(lightId, "brightness", "node");
        if (lights[lightId].colorful) {
            server.addNode(lightId, "hue", "node");
            server.addNode(lightId, "saturation", "node");
        }
        server.activate(lightId);

        server.addReadListener(lightId, 'switch', onRead(lightId, writeSwitchState));
        server.addReadListener(lightId, 'brightness', onRead(lightId, writeBrightness));

        if (lights[lightId].colorful) {
            server.addReadListener(lightId, 'hue', onRead(lightId, writeHue));
            server.addReadListener(lightId, 'saturation', onRead(lightId, writeSaturation));
        }
    }

    philipsHueServer();
}



