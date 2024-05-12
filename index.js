/**
 * @format
 */
import './shim.js';
global.Blob = global.originalBlob ? global.originalBlob : global.Blob;
global.FileReader = global.originalFileReader ? global.originalFileReader : global.FileReader;
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
