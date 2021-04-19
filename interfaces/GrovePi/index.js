var server = require('@libraries/hardwareInterfaces');
var settings = server.loadHardwareInterface(__dirname);

exports.enabled = settings('enabled');
exports.configurable = true;

var GrovePi = require('grovepi').GrovePi
var i2c = require('i2c-bus');
var sleep = require('sleep');

var Commands = GrovePi.commands
var Board = GrovePi.board
var RotaryAngleAnalogSensor = GrovePi.sensors.RotaryAnalog

var objectName = "GrovePi";
var TOOL_NAME = "GrovePi1";

var board = new Board({
    debug: true,
    onError: function(err) {
      console.log('Error initializing GrovePi: ')
      console.log(err)
    },
    onInit: function(res) {
      if (res) {
        console.log('GrovePi Version :: ' + board.version())
      }
    }
})

if (exports.enabled) {

}

function startHardwareInterface() {
    console.log('GrovePi: Starting up')
    
    board.init();
    var AngleSensor = new RotaryAngleAnalogSensor(0)
    AngleSensor.on('change', function(res) {
          server.write(objectName, TOOL_NAME, "RotarySensor", res, "f")
    })
    AngleSensor.watch()

    server.enableDeveloperUI(true)

    server.addNode(objectName, TOOL_NAME, "lcdScreen", "node");
    server.addNode(objectName, TOOL_NAME, "RotarySensor", "node");
    server.addNode(objectName, TOOL_NAME, "led", "node");
    
    server.addReadListener(objectName, TOOL_NAME, "lcdScreen", function(data){
        console.log("in read listener");
        var i2c1 = i2c.openSync(1);
        setText(i2c1, data);
        setRGB(i2c1, 255, 255, 255);
        i2c1.closeSync();
    });
    
    server.addReadListener(objectName, TOOL_NAME, "led", function(data){
        console.log("in read listener");
        if (data.value == 1) {
            // console.log("data is 1");
            setTimeout(() => { body = { '13': 1}; } , 0);
        }
        else if (data.value == 0) {
            // console.log("data is 0");
            setTimeout(() => { body = { '13': 0}; } , 0);
            // console.log("wrote to port");
        }
    });

}

// LCD Screen Functions Below

var DISPLAY_RGB_ADDR = 0x62;
var DISPLAY_TEXT_ADDR = 0x3e;

function setRGB(i2c1, r, g, b) {
  i2c1.writeByteSync(DISPLAY_RGB_ADDR,0,0)
  i2c1.writeByteSync(DISPLAY_RGB_ADDR,1,0)
  i2c1.writeByteSync(DISPLAY_RGB_ADDR,0x08,0xaa)
  i2c1.writeByteSync(DISPLAY_RGB_ADDR,4,r)
  i2c1.writeByteSync(DISPLAY_RGB_ADDR,3,g)
  i2c1.writeByteSync(DISPLAY_RGB_ADDR,2,b)
}

function textCommand(i2c1, cmd) {
  i2c1.writeByteSync(DISPLAY_TEXT_ADDR, 0x80, cmd);
}

function setText(i2c1, text) {
  textCommand(i2c1, 0x01) // clear display
  sleep.usleep(50000);
  textCommand(i2c1, 0x08 | 0x04) // display on, no cursor
  textCommand(i2c1, 0x28) // 2 lines
  sleep.usleep(50000);
  var count = 0;
  var row = 0;
  for(var i = 0, len = text.length; i<len; i++) {
    if(text[i] === '\n&' || count === 16) {
      count = 0;
      row ++;
        if(row === 2)
          break;
      textCommand(i2c1, 0xc0)
      if(text[i] === '\n')
        continue;
    }
    count++;
    i2c1.writeByteSync(DISPLAY_TEXT_ADDR, 0x40, text[i].charCodeAt(0));
  }
}


server.addEventListener("initialize", function () {
    if (exports.enabled) setTimeout(() => { 
        body = { '13': 0};
        startHardwareInterface();
    }, 1000)
});
