var jsdom = require('jsdom');
const { JSDOM } = jsdom;
//require('babel-polyfill');
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({adapter:new Adapter() });

const dom = new JSDOM('<body><div id="content"></div></body>');

global.document = dom.window.document;
global.window = dom.window;
global.XMLHttpRequest = dom.window.XMLHttpRequest;
//const root = require('rxjs/util/root');
window.Object = global.Object
window.Math = global.Math
//console.log(`************* global ${global.Object} *************`)
//console.log(`************** window ${window.Object} *************`);
//global.window.location.href = "http://localhost:8080"
// this tells the DOM ( if it needs to know ) that it is in test mode
global.__testing__ = true;

// this is a dummy handler standin for mdl component handler
global.componentHandler = {
    upgradeDom() {
    }
}

global.navigator = {
    userAgent: 'node.js'
};


function copyProps(src, target) {
    const props = Object.getOwnPropertyNames(src)
          .filter(prop => typeof target[prop] === 'undefined')
          .map(prop => Object.getOwnPropertyDescriptor(src, prop));
    Object.defineProperties(target, props);
}


copyProps(window, global);
