/*
 * Copyright 2019 Ewald van Gemert <vangee@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const tempValue = require('rpi-temperature')

module.exports = function (app) {
  let device = {};
  let _timer = null;
  let plugin = {}

  plugin.id = 'signalk-ds18b20'
  plugin.name = 'Signal K DS18B20 temperature sensors'
  plugin.description = 'DS18B20 1-Wire temperature sensors'

  plugin.schema = {
    type: 'object',
    properties: {
      rate: {
        title: "Sample Rate (in seconds)",
        type: 'number',
        default: 60
      },
      locationName: {
        type: 'string',
        title: 'Location name',
        default: 'Engine room'
      },
      key: {
        type: 'string',
        title: 'Signal K Key',
        description: 'This is used to build the path in Signal K. It will be appended to \'environment\'',
        default: 'inside.engineroom.temperature'
      }
    }
  }

  plugin.start = function (options) {
    device.locationName = options.locationName;
    device.key = options.key;
    measureTemperatures()
    _timer = setInterval(measureTemperatures, options.rate * 1000)
  }

  plugin.stop = function () {
    _deviceList = []
    if (_timer) {
      clearInterval(_timer)
      _timer = null
    }
  }

  function measureTemperatures() {
    var temperature = tempValue.getTemperature() + 273.15
    // create message
    var delta = createDeltaMessage(device, temperature)
    // send temperature
    app.debug(delta);
    app.handleMessage(plugin.id, delta)
  }

  function createDeltaMessage (device, temperature) {
    let dt = new Date();
    let utc = dt.getTime() - (dt.getTimezoneOffset() * 60000);
    let nd = new Date(utc);

    return {
      'context': 'vessels.' + app.selfId,
      'updates': [
        {
          'source': {
            'label': plugin.id
          },
          'timestamp': nd.toISOString(),
          'values': [
            {
              'path': 'environment.' + device.key,
              'value': temperature
            }
          ]
        }
      ]
    }
  }

  return plugin
}
